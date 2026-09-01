/* ==========================================================================
   Bible Plan — script.js
   ------------------------------------------------------------------------
   Everything the page does, in five parts:
     1. Date helpers
     2. State: load / save / shape
     3. Actions: toggle read, push forward, remove a rest day, reorder
     4. Rendering
     5. Wiring: clock, quote, drag-and-drop, event delegation
   ========================================================================== */

(function () {
  "use strict";

  var STORAGE_KEY = "biblePlan.v1";

  // Book Name Mapping
  const bookNames = {
            "Gen": "Genesis", "Ex": "Exodus", "Lev": "Leviticus", "Num": "Numbers", "Deut": "Deuteronomy",
            "Jos": "Joshua", "Judg": "Judges", "Ruth": "Ruth", "1 Sa": "1 Samuel", "2 Sa": "2 Samuel",
            "1 Ki": "1 Kings", "2 Ki": "2 Kings", "1 Ch": "1 Chronicles", "2 Ch": "2 Chronicles",
            "Ezr": "Ezra", "Neh": "Nehemiah", "Est": "Esther", "Job": "Job", "Ps": "Psalms", "Pro": "Proverbs",
            "Ecc": "Ecclesiastes", "Song": "Song of Solomon", "Isa": "Isaiah", "Jer": "Jeremiah", "Lam": "Lamentations",
            "Eze": "Ezekiel", "Dan": "Daniel", "Hos": "Hosea", "Joel": "Joel", "Am": "Amos", "Ob": "Obadiah",
            "Jon": "Jonah", "Mic": "Micah", "Nah": "Nahum", "Hab": "Habakkuk", "Zep": "Zephaniah",
            "Hag": "Haggai", "Zec": "Zechariah", "Mal": "Malachi", "Mat": "Matthew", "Mk": "Mark",
            "Lk": "Luke", "Jn": "John", "Act": "Acts", "Rom": "Romans", "1 Co": "1 Corinthians",
            "2 Co": "2 Corinthians", "Gal": "Galatians", "Eph": "Ephesians", "Php": "Philippians",
            "Col": "Colossians", "1 Th": "1 Thessalonians", "2 Th": "2 Thessalonians", "1 Ti": "1 Timothy",
            "2 Ti": "2 Timothy", "Tit": "Titus", "Phm": "Philemon", "Heb": "Hebrews", "Jam": "James",
            "1 Pe": "1 Peter", "2 Pe": "2 Peter", "1 Jn": "1 John", "2 Jn": "2 John", "3 Jn": "3 John",
            "Jude": "Jude", "Rev": "Revelation"
        };

  /* ------------------------------------------------------------------ */
  /* 1. Date helpers                                                     */
  /* ------------------------------------------------------------------ */

  function parseISODate(s) {
    var parts = s.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]); // local midnight
  }

  function addDays(date, n) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + n);
    return d;
  }

  function toISODate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }

  function startOfDay(date) {
    var d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function isSameDay(a, b) {
    return toISODate(a) === toISODate(b);
  }

  var PLAN_START = parseISODate(READINGS[0].date);

  /* ------------------------------------------------------------------ */
  /* 2. State                                                            */
  /* ------------------------------------------------------------------ */

  function defaultOrder() {
    return READINGS.map(function (r) {
      return "r-" + r.idx;
    });
  }

  function defaultState() {
    return {
      order: defaultOrder(),
      readStatus: {}, // idx (string) -> true
      quoteIndex: -1,
      restCounter: 0
    };
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.order)) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  /**
   * Reconciles a state's `order` against the current READINGS array, so the
   * plan stays correct if it's ever extended with more CSV rows after a
   * save: any reading present in READINGS but missing from the saved order
   * (a newly-added row) gets appended to the end, and any reading key that
   * no longer corresponds to a real row is dropped (rest days are always
   * kept either way). A no-op for a freshly-created default state.
   */

  function processCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    planData = [];
    
    for (let i = 1; i < lines.length; i++) {
        // Regex to handle CSV parsing with quotes
        const matches = lines[i].match(/(?:"([^"]*)")|([^,]+)/g);
        if (matches && matches.length >= 2) {
            const date = matches[0].replace(/"/g, '');
            const passageRaw = matches[1].replace(/"/g, '');
            
            if (date && passageRaw) {
                planData.push({
                    id: 'reading-' + i,
                    date: date,
                    passage: expandPassage(passageRaw),
                    status: 'pending' // 'pending', 'read', 'missed'
                });
            }
        }
    }
    saveState();
    renderCalendar();
  }
  function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  if (planData.length === 0) return;

  // Find first date to determine padding days
  const firstDateStr = planData[0].date;
  const firstDateObj = new Date(firstDateStr);
  const startDayOfWeek = firstDateObj.getUTCDay(); // 0 = Sunday

  // Fill empty cells before the first date
  for (let i = 0; i < startDayOfWeek; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'day-cell empty';
      grid.appendChild(emptyCell);
  }

  // Create cells for data
  planData.forEach((day, index) => {
      const cell = document.createElement('div');
      cell.className = `day-cell ${day.status}`;
      
      // Drop zone events
      cell.ondragover = dragOver;
      cell.ondrop = (e) => drop(e, index);

      // Date Number
      const dateNum = document.createElement('div');
      dateNum.className = 'date-number';
      dateNum.innerText = day.date; // E.g., "2026-09-01"
      cell.appendChild(dateNum);

      // Draggable Passage Block
      const passageBlock = document.createElement('div');
      passageBlock.className = 'passage';
      passageBlock.draggable = true;
      passageBlock.innerText = day.passage;
      passageBlock.ondragstart = (e) => dragStart(e, index);
      cell.appendChild(passageBlock);

      // Action Buttons
      const actions = document.createElement('div');
      actions.className = 'actions';
      
      const btnCheck = document.createElement('button');
      btnCheck.className = 'btn btn-check';
      btnCheck.innerHTML = '✔';
      btnCheck.title = "Mark Read";
      btnCheck.onclick = () => markRead(index);

      const btnX = document.createElement('button');
      btnX.className = 'btn btn-x';
      btnX.innerHTML = '✖';
      btnX.title = "Missed (Shift Forward)";
      btnX.onclick = () => markMissedAndShift(index);

      actions.appendChild(btnCheck);
      actions.appendChild(btnX);
      cell.appendChild(actions);

      grid.appendChild(cell);
    });
  }
  
  function reconcileOrder(s) {
    var validIdx = {};
    READINGS.forEach(function (r) {
      validIdx[r.idx] = true;
    });

    s.order = s.order.filter(function (k) {
      if (k.indexOf("rest-") === 0) return true;
      return validIdx[Number(k.slice(2))];
    });

    var present = {};
    s.order.forEach(function (k) {
      if (k.indexOf("r-") === 0) present[k.slice(2)] = true;
    });
    READINGS.forEach(function (r) {
      if (!present[String(r.idx)]) s.order.push("r-" + r.idx);
    });

    return s;
  }

  var state = reconcileOrder(loadState() || defaultState());
  var storageAvailable = true;

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      storageAvailable = false;
    }
  }

  /* ------------------------------------------------------------------ */
  /* 3. Actions                                                          */
  /* ------------------------------------------------------------------ */

  function toggleRead(idx) {
    var key = String(idx);
    state.readStatus[key] = !state.readStatus[key];
    saveState();
    render();
  }

  function pushForward(key, days) {
    var pos = state.order.indexOf(key);
    if (pos === -1) return;
    var newKeys = [];
    for (var i = 0; i < days; i++) {
      state.restCounter += 1;
      newKeys.push("rest-" + state.restCounter);
    }
    var args = [pos, 0].concat(newKeys);
    Array.prototype.splice.apply(state.order, args);
    saveState();
    render();
  }

  function removeRestDay(key) {
    var pos = state.order.indexOf(key);
    if (pos === -1) return;
    state.order.splice(pos, 1);
    saveState();
    render();
  }

  function reorder(oldIndex, newIndex) {
    if (oldIndex === newIndex) return;
    var moved = state.order.splice(oldIndex, 1)[0];
    state.order.splice(newIndex, 0, moved);
    saveState();
    render();
  }

  /* ------------------------------------------------------------------ */
  /* 4. Rendering                                                        */
  /* ------------------------------------------------------------------ */

  var planListEl = document.getElementById("planList");
  var progressCountEl = document.getElementById("progressCount");
  var progressVersesEl = document.getElementById("progressVerses");
  var progressFillEl = document.getElementById("progressFill");

  var ICON_GRIP =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/>' +
    '<circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/>' +
    '<circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';

  var ICON_CHECK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="4,13 9,18 20,6"/></svg>';

  var ICON_X =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
    'stroke-linecap="round" aria-hidden="true">' +
    '<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>';

  var ICON_TRASH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<line x1="5" y1="7" x2="19" y2="7"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>' +
    '<path d="M7 7l1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12"/></svg>';

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
      );
    });
  }

  var DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function readingCardHtml(key, idx, date, isToday, isMissed, isRead) {
    var reading = READINGS[idx];
    var classes = ["card"];
    if (isToday) classes.push("is-today");
    if (isMissed) classes.push("is-missed");
    if (isRead) classes.push("is-read");

    return (
      '<div class="' + classes.join(" ") + '" data-key="' + key + '">' +
        '<span class="drag-handle" aria-hidden="true">' + ICON_GRIP + "</span>" +
        '<div class="card-date">' +
          '<span class="date-dow">' + DOW[date.getDay()] + "</span>" +
          '<span class="date-day">' + date.getDate() + "</span>" +
          (isToday ? '<span class="today-label">Today</span>' : "") +
        "</div>" +
        '<div class="card-main">' +
          '<div class="card-body">' +
            '<p class="passage">' + escapeHtml(reading.passage) + "</p>" +
            (reading.verses
              ? '<span class="verses-badge">' + reading.verses + " verses</span>"
              : "") +
          "</div>" +
          '<div class="card-actions">' +
            '<button type="button" class="btn-read" aria-label="Mark as read" aria-pressed="' +
              (isRead ? "true" : "false") + '">' + ICON_CHECK + "</button>" +
            '<button type="button" class="btn-skip" aria-label="I didn\'t read this day" ' +
              'aria-expanded="false">' + ICON_X + "</button>" +
          "</div>" +
          '<div class="skip-panel" hidden>' +
            '<span>Push this reading, and everything after it, forward by</span>' +
            '<button type="button" data-days="1">1 day</button>' +
            '<button type="button" data-days="2">2 days</button>' +
            '<button type="button" data-days="4">4 days</button>' +
            '<button type="button" class="cancel">Cancel</button>' +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function restCardHtml(key, date, isToday) {
    var classes = ["card", "rest-card"];
    if (isToday) classes.push("is-today");
    return (
      '<div class="' + classes.join(" ") + '" data-key="' + key + '">' +
        '<span class="drag-handle" aria-hidden="true">' + ICON_GRIP + "</span>" +
        '<div class="card-date">' +
          '<span class="date-dow">' + DOW[date.getDay()] + "</span>" +
          '<span class="date-day">' + date.getDate() + "</span>" +
          (isToday ? '<span class="today-label">Today</span>' : "") +
        "</div>" +
        '<span class="rest-label">Rest day &mdash; nothing scheduled</span>' +
        '<button type="button" class="btn-remove-rest" aria-label="Remove this rest day">' +
          ICON_TRASH +
        "</button>" +
      "</div>"
    );
  }

  function render() {
    var today = startOfDay(new Date());
    var html = "";
    var lastMonthKey = null;
    var readCount = 0;
    var verseCount = 0;

    for (var i = 0; i < READINGS.length; i++) {
      if (state.readStatus[String(READINGS[i].idx)]) {
        readCount++;
        verseCount += READINGS[i].verses || 0;
      }
    }

    state.order.forEach(function (key, pos) {
      var date = addDays(PLAN_START, pos);
      var monthKey = date.getFullYear() + "-" + date.getMonth();
      if (monthKey !== lastMonthKey) {
        html +=
          '<div class="month-label">' +
          MONTHS[date.getMonth()] +
          " " +
          date.getFullYear() +
          "</div>";
        lastMonthKey = monthKey;
      }

      var isToday = isSameDay(date, today);

      if (key.indexOf("rest-") === 0) {
        html += restCardHtml(key, date, isToday);
      } else {
        var idx = key.slice(2);
        var isRead = !!state.readStatus[idx];
        var isMissed = !isToday && date < today && !isRead;
        html += readingCardHtml(key, idx, date, isToday, isMissed, isRead);
      }
    });

    planListEl.innerHTML = html;

    var total = READINGS.length;
    progressCountEl.textContent = readCount + " / " + total + " days read";
    progressVersesEl.textContent = verseCount.toLocaleString() + " verses read";
    progressFillEl.style.width = (total ? (readCount / total) * 100 : 0) + "%";
  }

  /* ------------------------------------------------------------------ */
  /* 5. Wiring                                                            */
  /* ------------------------------------------------------------------ */

  // -- Clock --------------------------------------------------------------
  var clockDateEl = document.getElementById("clockDate");
  var clockTimeEl = document.getElementById("clockTime");

  function tickClock() {
    var now = new Date();
    clockDateEl.textContent = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
    clockTimeEl.textContent = now.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  // -- Quote of the visit ---------------------------------------------------
  function showNextQuote() {
    state.quoteIndex = (state.quoteIndex + 1) % QUOTES.length;
    saveState();
    var q = QUOTES[state.quoteIndex];
    document.getElementById("quoteText").textContent = q.text;
    document.getElementById("quoteSource").textContent = q.source
      ? "\u2014 " + q.source
      : "";
  }

  // -- Jump to today --------------------------------------------------------
  document.getElementById("jumpToday").addEventListener("click", function () {
    var el = planListEl.querySelector(".card.is-today");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // -- Event delegation for card actions ------------------------------------
  planListEl.addEventListener("click", function (e) {
    var card = e.target.closest(".card");
    if (!card) return;
    var key = card.dataset.key;

    var readBtn = e.target.closest(".btn-read");
    if (readBtn) {
      toggleRead(key.slice(2));
      return;
    }

    var skipBtn = e.target.closest(".btn-skip");
    if (skipBtn) {
      var panel = card.querySelector(".skip-panel");
      var willOpen = panel.hasAttribute("hidden");
      // Close any other open panel first.
      planListEl.querySelectorAll(".skip-panel").forEach(function (p) {
        p.setAttribute("hidden", "");
      });
      planListEl.querySelectorAll(".btn-skip").forEach(function (b) {
        b.setAttribute("aria-expanded", "false");
      });
      if (willOpen) {
        panel.removeAttribute("hidden");
        skipBtn.setAttribute("aria-expanded", "true");
      }
      return;
    }

    var cancelBtn = e.target.closest(".skip-panel .cancel");
    if (cancelBtn) {
      card.querySelector(".skip-panel").setAttribute("hidden", "");
      card.querySelector(".btn-skip").setAttribute("aria-expanded", "false");
      return;
    }

    var daysBtn = e.target.closest(".skip-panel button[data-days]");
    if (daysBtn) {
      pushForward(key, Number(daysBtn.dataset.days));
      return;
    }

    var removeBtn = e.target.closest(".btn-remove-rest");
    if (removeBtn) {
      removeRestDay(key);
      return;
    }
  });

  // -- Drag and drop (SortableJS) --------------------------------------------
  function initSortable() {
    if (typeof Sortable === "undefined") return; // CDN unavailable; list still works, just not draggable
    Sortable.create(planListEl, {
      handle: ".drag-handle",
      animation: 150,
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      draggable: ".card",
      onEnd: function (evt) {
        if (evt.oldIndex === evt.newIndex) return;
        reorder(evt.oldIndex, evt.newIndex);
      }
    });
  }

  // -- Boot -------------------------------------------------------------------
  render();
  showNextQuote();
  tickClock();
  setInterval(tickClock, 1000);
  initSortable();

  // Land on today's entry on first paint.
  window.requestAnimationFrame(function () {
    var el = planListEl.querySelector(".card.is-today");
    if (el) el.scrollIntoView({ behavior: "auto", block: "center" });
  });

  if (!storageAvailable) {
    console.warn("Bible Plan: localStorage is unavailable, progress will not be saved.");
  }
})();
