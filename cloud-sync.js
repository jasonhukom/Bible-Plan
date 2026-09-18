// @ts-check
/* ==========================================================================
   cloud-sync.js
   --------------------------------------------------------------------------
   Makes a user's plan and progress follow them between devices.

   The app keeps working exactly as before when signed out: localStorage stays
   the source of truth. Signing in adds a mirror in Postgres.

     sign in  -> if the account already has a plan, pull it down and adopt it;
                 if it does not, push the plan sitting in this browser up.
     editing  -> completion ticks are pushed as a small diff; regenerating or
                 importing a plan rewrites the schedule wholesale.
     sign out -> pushing stops; local data is left untouched.

   Remote wins on sign-in. That is the rule that makes "same account, second
   device" behave the way people expect, and the local copy that gets replaced
   was never lost from the other device.

   Exposes: window.BiblePlanSync
   ========================================================================== */

(function () {
  "use strict";

  var PUSH_DEBOUNCE_MS = 1200;

  /** @type {any} */
  var app = null;
  /** @type {string | null} */
  var activePlanId = null;
  /** @type {string | null} */
  var syncingUserId = null;
  /** Signature of the plan structure last written remotely. */
  var lastStructureSignature = "";
  /** day_index:position -> completed, as last written remotely. */
  /** @type {Record<string, boolean>} */
  var lastCompletionMap = {};
  var applyingRemote = false;
  var pushTimer = 0;

  /** @type {{state: string, message: string, at: number}} */
  var status = { state: "idle", message: "", at: 0 };
  /** @type {Array<(status: any) => void>} */
  var statusListeners = [];

  /* ----------------------------------------------------------------------
     Status
     ---------------------------------------------------------------------- */

  /**
   * @param {string} state "idle" | "syncing" | "synced" | "offline" | "error"
   * @param {string} [message]
   */
  function setStatus(state, message) {
    status = { state: state, message: message || "", at: Date.now() };
    statusListeners.slice().forEach(function (listener) {
      try {
        listener(status);
      } catch (error) {
        console.error("cloud-sync: a status listener threw", error);
      }
    });
  }

  /* ----------------------------------------------------------------------
     Local state <-> rows
     ---------------------------------------------------------------------- */

  /**
   * @param {string} bookName
   * @returns {string | null}
   */
  function categoryFor(bookName) {
    if (!app || typeof app.getBookCategory !== "function") return null;
    return app.getBookCategory(bookName);
  }

  /**
   * Flattens the calendar into one row per scheduled chapter.
   * @param {any} state
   * @returns {any[]}
   */
  function stateToRows(state) {
    /** @type {any[]} */
    var rows = [];
    var days = (state && state.calendarDays) || [];

    days.forEach(function (/** @type {any} */ day, /** @type {number} */ index) {
      var dayIndex = typeof day.dayIndex === "number" ? day.dayIndex : index;
      var position = 0;
      (day.books || []).forEach(function (/** @type {any} */ book) {
        (book.chapters || []).forEach(function (/** @type {any} */ chapter) {
          rows.push({
            day_index: dayIndex,
            date: day.date || null,
            book: book.abbreviation || book.fullName || "",
            book_name: book.fullName || book.abbreviation || "",
            chapter: Number(chapter.number),
            category: categoryFor(book.fullName || book.abbreviation || ""),
            position: position,
            completed: !!chapter.completed,
            completed_at: chapter.completed ? new Date().toISOString() : null
          });
          position += 1;
        });
      });
    });

    return rows;
  }

  /**
   * Rebuilds the calendar the app renders from schedule rows. Consecutive
   * rows sharing a book are regrouped into one book entry, which is exactly
   * how the plan generator lays them out.
   * @param {any[]} rows
   * @returns {any[]}
   */
  function rowsToCalendarDays(rows) {
    /** @type {Record<number, any>} */
    var byDay = {};
    /** @type {number[]} */
    var dayOrder = [];

    rows.forEach(function (row) {
      var dayIndex = Number(row.day_index) || 0;
      if (!byDay[dayIndex]) {
        byDay[dayIndex] = { dayIndex: dayIndex, date: row.date || null, entries: [] };
        dayOrder.push(dayIndex);
      }
      if (!byDay[dayIndex].date && row.date) byDay[dayIndex].date = row.date;
      byDay[dayIndex].entries.push(row);
    });

    dayOrder.sort(function (a, b) {
      return a - b;
    });

    return dayOrder.map(function (dayIndex) {
      var day = byDay[dayIndex];
      day.entries.sort(function (/** @type {any} */ a, /** @type {any} */ b) {
        return (Number(a.position) || 0) - (Number(b.position) || 0);
      });

      /** @type {any[]} */
      var books = [];
      /** @type {any} */
      var currentBook = null;

      day.entries.forEach(function (/** @type {any} */ entry) {
        var abbreviation = entry.book || entry.book_name || "";
        var safeKey = String(abbreviation).replace(/\s+/g, "");
        if (!currentBook || currentBook.abbreviation !== abbreviation) {
          currentBook = {
            id: "book-" + dayIndex + "-" + safeKey + "-" + entry.position,
            abbreviation: abbreviation,
            fullName: entry.book_name || abbreviation,
            chapters: []
          };
          books.push(currentBook);
        }
        currentBook.chapters.push({
          id: "ch-" + dayIndex + "-" + safeKey + "-" + entry.chapter + "-" + entry.position,
          number: Number(entry.chapter),
          completed: !!entry.completed
        });
      });

      return {
        id: "day-" + dayIndex,
        date: day.date || null,
        dayIndex: dayIndex,
        metadata: "",
        books: books
      };
    });
  }

  /**
   * The shape of the plan, ignoring completion. Used to decide between a
   * cheap completion diff and a full schedule rewrite.
   * @param {any[]} rows
   * @param {any} settings
   * @returns {string}
   */
  function structureSignature(rows, settings) {
    var planPart = [
      settings.startDate,
      settings.days,
      (settings.weekdays || []).join("."),
      (settings.bookGroups || []).join("."),
      settings.order,
      (settings.wiseWords || []).join(".")
    ].join("|");

    var rowPart = rows
      .map(function (row) {
        return row.day_index + ":" + row.position + ":" + row.book + ":" + row.chapter + ":" + (row.date || "");
      })
      .join(",");

    return planPart + "||" + rowPart;
  }

  /**
   * @param {any[]} rows
   * @returns {Record<string, boolean>}
   */
  function completionMap(rows) {
    /** @type {Record<string, boolean>} */
    var map = {};
    rows.forEach(function (row) {
      map[row.day_index + ":" + row.position] = !!row.completed;
    });
    return map;
  }

  /**
   * @param {any} settings
   * @returns {any}
   */
  function settingsToPlan(settings) {
    return {
      name: "My reading plan",
      start_date: settings.startDate || null,
      days: Math.max(1, Math.min(730, Number(settings.days) || 121)),
      weekdays: settings.weekdays || [0, 1, 2, 3, 4, 5, 6],
      book_groups: settings.bookGroups || ["ot", "nt"],
      order_mode: settings.order === "overlap" ? "overlap" : "inorder",
      wise_words: settings.wiseWords || [],
      is_active: true
    };
  }

  /**
   * @param {any} plan
   * @param {any} localSettings
   * @returns {any}
   */
  function planToSettings(plan, localSettings) {
    return {
      quoteIndex: localSettings ? localSettings.quoteIndex : -1,
      startDate: plan.start_date || (localSettings && localSettings.startDate) || null,
      days: plan.days,
      weekdays: plan.weekdays || [0, 1, 2, 3, 4, 5, 6],
      bookGroups: plan.book_groups || ["ot", "nt"],
      order: plan.order_mode || "inorder",
      wiseWords: plan.wise_words || []
    };
  }

  /* ----------------------------------------------------------------------
     Pull / push
     ---------------------------------------------------------------------- */

  /** @returns {any} */
  function data() {
    return /** @type {any} */ (window).BiblePlanData;
  }

  /**
   * First sync after signing in.
   * @returns {Promise<void>}
   */
  function pullOrSeed() {
    var db = data();
    if (!db || !app) return Promise.resolve();

    setStatus("syncing", "Checking your account…");

    return db
      .getActivePlan()
      .then(function (/** @type {any} */ result) {
        if (result.error) throw new Error(result.error.message);

        if (result.data) {
          activePlanId = result.data.id;
          return db.getSchedule(activePlanId).then(function (/** @type {any} */ scheduleResult) {
            if (scheduleResult.error) throw new Error(scheduleResult.error.message);
            var rows = scheduleResult.data || [];

            if (!rows.length) {
              // A plan row with no schedule behind it: push what this
              // browser has rather than wiping the calendar.
              return pushEverything(result.data.id);
            }
            return adoptRemote(result.data, rows);
          });
        }

        // No plan on the account yet — this browser's plan becomes it.
        var localState = app.getState();
        return db
          .createPlan(settingsToPlan(localState.settings || {}))
          .then(function (/** @type {any} */ created) {
            if (created.error) throw new Error(created.error.message);
            var planId = String(created.data.id);
            activePlanId = planId;
            return pushEverything(planId);
          });
      })
      .then(function () {
        setStatus("synced", "Up to date");
      })
      .catch(function (/** @type {any} */ error) {
        console.error("cloud-sync: initial sync failed", error);
        setStatus("error", error && error.message ? error.message : "Sync failed");
      });
  }

  /**
   * @param {any} plan
   * @param {any[]} rows
   */
  function adoptRemote(plan, rows) {
    var localState = app.getState();
    var nextState = {
      calendarDays: rowsToCalendarDays(rows),
      settings: planToSettings(plan, localState.settings)
    };

    applyingRemote = true;
    try {
      app.replaceState(nextState);
    } finally {
      applyingRemote = false;
    }

    var appliedRows = stateToRows(app.getState());
    lastStructureSignature = structureSignature(appliedRows, app.getState().settings || {});
    lastCompletionMap = completionMap(appliedRows);
  }

  /**
   * Writes the plan row and the whole schedule.
   * @param {string} planId
   * @returns {Promise<any>}
   */
  function pushEverything(planId) {
    var db = data();
    var state = app.getState();
    var rows = stateToRows(state);

    setStatus("syncing", "Saving your plan…");

    return db
      .updatePlan(planId, settingsToPlan(state.settings || {}))
      .then(function (/** @type {any} */ updated) {
        if (updated.error) throw new Error(updated.error.message);
        return db.replaceSchedule(planId, rows);
      })
      .then(function (/** @type {any} */ written) {
        if (written.error) throw new Error(written.error.message);
        lastStructureSignature = structureSignature(rows, state.settings || {});
        lastCompletionMap = completionMap(rows);
        return written;
      });
  }

  /**
   * Called (debounced) after every local save while signed in.
   */
  function pushLocalChanges() {
    var db = data();
    if (!db || !app || !activePlanId || !syncingUserId) return;

    var state = app.getState();
    var rows = stateToRows(state);
    var signature = structureSignature(rows, state.settings || {});

    if (signature !== lastStructureSignature) {
      pushEverything(activePlanId)
        .then(function () {
          setStatus("synced", "Up to date");
        })
        .catch(function (/** @type {any} */ error) {
          console.error("cloud-sync: could not save the plan", error);
          setStatus("error", error && error.message ? error.message : "Sync failed");
        });
      return;
    }

    var nextMap = completionMap(rows);
    /** @type {Array<{dayIndex: number, position: number, completed: boolean}>} */
    var changed = [];
    Object.keys(nextMap).forEach(function (key) {
      if (lastCompletionMap[key] !== nextMap[key]) {
        var parts = key.split(":");
        changed.push({
          dayIndex: Number(parts[0]),
          position: Number(parts[1]),
          completed: nextMap[key]
        });
      }
    });

    if (!changed.length) return;

    setStatus("syncing", "Saving progress…");
    db.setEntriesCompleted(activePlanId, changed)
      .then(function (/** @type {any} */ result) {
        if (result.error) throw new Error(result.error.message);
        lastCompletionMap = nextMap;
        setStatus("synced", "Up to date");
      })
      .catch(function (/** @type {any} */ error) {
        console.error("cloud-sync: could not save progress", error);
        setStatus("error", error && error.message ? error.message : "Sync failed");
      });
  }

  function schedulePush() {
    if (applyingRemote || !syncingUserId || !activePlanId) return;
    window.clearTimeout(pushTimer);
    pushTimer = window.setTimeout(pushLocalChanges, PUSH_DEBOUNCE_MS);
  }

  /* ----------------------------------------------------------------------
     Wiring
     ---------------------------------------------------------------------- */

  function reset() {
    window.clearTimeout(pushTimer);
    activePlanId = null;
    syncingUserId = null;
    lastStructureSignature = "";
    lastCompletionMap = {};
    setStatus("idle", "");
  }

  function start() {
    app = /** @type {any} */ (window).BiblePlanApp;
    var auth = /** @type {any} */ (window).BiblePlanAuth;
    if (!app || !auth) return;

    app.onStateChange(schedulePush);

    auth.onChange(function (/** @type {any} */ state) {
      if (!state.isSignedIn) {
        if (syncingUserId) reset();
        return;
      }
      if (state.userId === syncingUserId) return;

      syncingUserId = state.userId;
      activePlanId = null;
      pullOrSeed();
    });
  }

  /** @type {any} */
  var api = {
    /** Latest sync status: { state, message, at }. */
    getStatus: function () {
      return status;
    },

    /**
     * @param {(status: any) => void} listener
     * @returns {() => void} unsubscribe
     */
    onStatus: function (listener) {
      if (typeof listener !== "function") return function () {};
      statusListeners.push(listener);
      listener(status);
      return function () {
        statusListeners = statusListeners.filter(function (entry) {
          return entry !== listener;
        });
      };
    },

    /** The id of the plan row this browser is syncing against, or null. */
    getActivePlanId: function () {
      return activePlanId;
    },

    /** Forces a full push of the local plan. */
    pushNow: function () {
      if (!activePlanId) return Promise.resolve(null);
      return pushEverything(activePlanId)
        .then(function (/** @type {any} */ result) {
          setStatus("synced", "Up to date");
          return result;
        })
        .catch(function (/** @type {any} */ error) {
          setStatus("error", error && error.message ? error.message : "Sync failed");
          return null;
        });
    },

    /** Re-reads the account's plan and adopts it locally. */
    pullNow: function () {
      if (!syncingUserId) return Promise.resolve(null);
      activePlanId = null;
      return pullOrSeed();
    }
  };

  /** @type {any} */ (window).BiblePlanSync = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
