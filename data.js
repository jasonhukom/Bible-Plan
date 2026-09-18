// @ts-check
/* ==========================================================================
   data.js
   --------------------------------------------------------------------------
   The database layer for user-owned data. Other engineers should call this
   instead of hand-rolling `supabase.from(...)` queries, because every method
   here already:

     - waits for auth to be ready,
     - refuses to run when nobody is signed in,
     - stamps `user_id` from the session (never from caller input),
     - returns { data, error } instead of throwing.

   Row Level Security is the real boundary; the `user_id` filters below are a
   second pair of hands, not the lock itself.

   Exposes: window.BiblePlanData
   ========================================================================== */

(function () {
  "use strict";

  var SAVED_VERSE_COLUMNS =
    "id, user_id, translation, book, chapter, verse, note, collection_id, created_at, updated_at";
  var PLAN_COLUMNS =
    "id, user_id, name, start_date, days, weekdays, book_groups, order_mode, wise_words, is_active, created_at, updated_at";
  var SCHEDULE_COLUMNS =
    "id, user_id, plan_id, day_index, date, book, book_name, chapter, category, position, completed, completed_at";
  var SETTINGS_COLUMNS =
    "user_id, theme, translation, canon, preferences, created_at, updated_at";
  var COLLECTION_COLUMNS = "id, user_id, name, created_at, updated_at";

  /** Rows per upsert request when writing a whole schedule. */
  var CHUNK_SIZE = 400;

  /**
   * @param {string} message
   * @returns {{data: null, error: {message: string}}}
   */
  function fail(message) {
    return { data: null, error: { message: message } };
  }

  /** @returns {any} */
  function auth() {
    return /** @type {any} */ (window).BiblePlanAuth;
  }

  /**
   * Runs `work` with a guaranteed client + user id.
   * @param {(client: any, userId: string) => Promise<any>} work
   * @returns {Promise<any>}
   */
  function withUser(work) {
    var service = auth();
    if (!service) return Promise.resolve(fail("Auth service is not loaded."));

    return service.ready().then(function () {
      var client = service.getClient();
      if (!client) return fail("Supabase is not configured for this deployment.");
      var userId = service.getUserId();
      if (!userId) return fail("Not signed in.");
      // Supabase query builders are thenables, not Promises: they implement
      // .then() but not .catch(). Wrapping gives a real Promise to attach to.
      return Promise.resolve(work(client, userId)).catch(function (/** @type {any} */ error) {
        return fail(error && error.message ? error.message : String(error));
      });
    });
  }

  /**
   * @param {any[]} rows
   * @param {number} size
   * @returns {any[][]}
   */
  function chunk(rows, size) {
    var out = [];
    for (var i = 0; i < rows.length; i += size) {
      out.push(rows.slice(i, i + size));
    }
    return out;
  }

  /** @type {any} */
  var api = {
    /* ==================================================================
       Profile
       ================================================================== */

    getProfile: function () {
      return withUser(function (client, userId) {
        return client
          .from("profiles")
          .select("id, display_name, avatar_url, created_at, updated_at")
          .eq("id", userId)
          .maybeSingle();
      });
    },

    /**
     * @param {{display_name?: string, avatar_url?: string | null}} patch
     */
    updateProfile: function (patch) {
      return withUser(function (client, userId) {
        return client
          .from("profiles")
          .upsert(Object.assign({}, patch, { id: userId }), { onConflict: "id" })
          .select("id, display_name, avatar_url, created_at, updated_at")
          .maybeSingle();
      });
    },

    /* ==================================================================
       Settings
       ================================================================== */

    getSettings: function () {
      return withUser(function (client, userId) {
        return client
          .from("user_settings")
          .select(SETTINGS_COLUMNS)
          .eq("user_id", userId)
          .maybeSingle();
      });
    },

    /**
     * Partial update — only the keys you pass are touched.
     * @param {{theme?: string, translation?: string, canon?: string, preferences?: any}} patch
     */
    saveSettings: function (patch) {
      return withUser(function (client, userId) {
        return client
          .from("user_settings")
          .upsert(Object.assign({}, patch, { user_id: userId }), { onConflict: "user_id" })
          .select(SETTINGS_COLUMNS)
          .maybeSingle();
      });
    },

    /**
     * Merges a patch into user_settings.preferences without clobbering keys
     * another part of the app owns.
     * @param {Record<string, any>} patch
     */
    mergePreferences: function (patch) {
      return withUser(function (client, userId) {
        return client
          .from("user_settings")
          .select("preferences")
          .eq("user_id", userId)
          .maybeSingle()
          .then(function (/** @type {any} */ current) {
            if (current.error) return current;
            var merged = Object.assign({}, (current.data && current.data.preferences) || {}, patch);
            return client
              .from("user_settings")
              .upsert({ user_id: userId, preferences: merged }, { onConflict: "user_id" })
              .select(SETTINGS_COLUMNS)
              .maybeSingle();
          });
      });
    },

    /* ==================================================================
       Reading plans
       ================================================================== */

    listPlans: function () {
      return withUser(function (client, userId) {
        return client
          .from("reading_plans")
          .select(PLAN_COLUMNS)
          .eq("user_id", userId)
          .order("created_at", { ascending: true });
      });
    },

    getActivePlan: function () {
      return withUser(function (client, userId) {
        return client
          .from("reading_plans")
          .select(PLAN_COLUMNS)
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();
      });
    },

    /**
     * @param {any} plan columns of reading_plans, minus user_id
     */
    createPlan: function (plan) {
      return withUser(function (client, userId) {
        return client
          .from("reading_plans")
          .insert(Object.assign({}, plan, { user_id: userId }))
          .select(PLAN_COLUMNS)
          .maybeSingle();
      });
    },

    /**
     * @param {string} planId
     * @param {any} patch
     */
    updatePlan: function (planId, patch) {
      return withUser(function (client, userId) {
        return client
          .from("reading_plans")
          .update(patch)
          .eq("id", planId)
          .eq("user_id", userId)
          .select(PLAN_COLUMNS)
          .maybeSingle();
      });
    },

    /**
     * Makes one plan active and every other plan inactive. Done in that
     * order because of the one-active-plan-per-user unique index.
     * @param {string} planId
     */
    setActivePlan: function (planId) {
      return withUser(function (client, userId) {
        return client
          .from("reading_plans")
          .update({ is_active: false })
          .eq("user_id", userId)
          .neq("id", planId)
          .then(function () {
            return client
              .from("reading_plans")
              .update({ is_active: true })
              .eq("id", planId)
              .eq("user_id", userId)
              .select(PLAN_COLUMNS)
              .maybeSingle();
          });
      });
    },

    /**
     * @param {string} planId
     */
    deletePlan: function (planId) {
      return withUser(function (client, userId) {
        return client
          .from("reading_plans")
          .delete()
          .eq("id", planId)
          .eq("user_id", userId);
      });
    },

    /* ==================================================================
       Reading schedule
       ================================================================== */

    /**
     * @param {string} planId
     */
    getSchedule: function (planId) {
      return withUser(function (client, userId) {
        /**
         * Paged so a long plan is not silently cut off by PostgREST's
         * default row limit.
         * @param {number} from
         * @param {any[]} accumulated
         * @returns {Promise<any>}
         */
        function page(from, accumulated) {
          var pageSize = 1000;
          return client
            .from("reading_schedule")
            .select(SCHEDULE_COLUMNS)
            .eq("user_id", userId)
            .eq("plan_id", planId)
            .order("day_index", { ascending: true })
            .order("position", { ascending: true })
            .range(from, from + pageSize - 1)
            .then(function (/** @type {any} */ result) {
              if (result.error) return result;
              var rows = accumulated.concat(result.data || []);
              if ((result.data || []).length < pageSize) {
                return { data: rows, error: null };
              }
              return page(from + pageSize, rows);
            });
        }

        return page(0, []);
      });
    },

    /**
     * Replaces the whole schedule for a plan. Used when a plan is generated
     * or regenerated, where day-by-day patching would be more code and more
     * round trips than a clean rewrite.
     *
     * @param {string} planId
     * @param {any[]} rows schedule rows without user_id/plan_id
     */
    replaceSchedule: function (planId, rows) {
      return withUser(function (client, userId) {
        return client
          .from("reading_schedule")
          .delete()
          .eq("user_id", userId)
          .eq("plan_id", planId)
          .then(function (/** @type {any} */ deleted) {
            if (deleted.error) return deleted;
            if (!rows.length) return { data: [], error: null };

            var stamped = rows.map(function (row) {
              return Object.assign({}, row, { user_id: userId, plan_id: planId });
            });

            var batches = chunk(stamped, CHUNK_SIZE);
            /**
             * @param {number} index
             * @returns {Promise<any>}
             */
            function writeBatch(index) {
              if (index >= batches.length) return Promise.resolve({ data: stamped, error: null });
              return client
                .from("reading_schedule")
                .insert(batches[index])
                .then(function (/** @type {any} */ result) {
                  if (result.error) return result;
                  return writeBatch(index + 1);
                });
            }
            return writeBatch(0);
          });
      });
    },

    /**
     * Flips completion for a scheduled chapter.
     *
     * Pass `position` to address exactly one row (positions are unique within
     * a day). Without it, every row for that book+chapter on that day is
     * updated — which is what you want when a chapter is scheduled twice in
     * one day, e.g. as an Old Testament reading and as that day's Daily Psalm.
     *
     * @param {{planId: string, dayIndex: number, book: string, chapter: number, completed: boolean, position?: number}} entry
     */
    setEntryCompleted: function (entry) {
      return withUser(function (client, userId) {
        var query = client
          .from("reading_schedule")
          .update({
            completed: entry.completed,
            completed_at: entry.completed ? new Date().toISOString() : null
          })
          .eq("user_id", userId)
          .eq("plan_id", entry.planId)
          .eq("day_index", entry.dayIndex);

        if (typeof entry.position === "number") {
          query = query.eq("position", entry.position);
        } else {
          query = query.eq("book", entry.book).eq("chapter", entry.chapter);
        }

        return query.select(SCHEDULE_COLUMNS);
      });
    },

    /**
     * Bulk completion update, used by the sync layer after local edits.
     * @param {string} planId
     * @param {Array<{dayIndex: number, position: number, completed: boolean}>} entries
     */
    setEntriesCompleted: function (planId, entries) {
      return withUser(function (client, userId) {
        var now = new Date().toISOString();

        /**
         * @param {number} index
         * @returns {Promise<any>}
         */
        function step(index) {
          if (index >= entries.length) {
            return Promise.resolve({ data: entries.length, error: null });
          }
          var entry = entries[index];
          return client
            .from("reading_schedule")
            .update({
              completed: entry.completed,
              completed_at: entry.completed ? now : null
            })
            .eq("user_id", userId)
            .eq("plan_id", planId)
            .eq("day_index", entry.dayIndex)
            .eq("position", entry.position)
            .then(function (/** @type {any} */ result) {
              if (result.error) return result;
              return step(index + 1);
            });
        }
        return step(0);
      });
    },

    /* ==================================================================
       Verse collections
       ================================================================== */

    listCollections: function () {
      return withUser(function (client, userId) {
        return client
          .from("verse_collections")
          .select(COLLECTION_COLUMNS)
          .eq("user_id", userId)
          .order("name", { ascending: true });
      });
    },

    /**
     * @param {string} name
     */
    createCollection: function (name) {
      return withUser(function (client, userId) {
        return client
          .from("verse_collections")
          .insert({ user_id: userId, name: name })
          .select(COLLECTION_COLUMNS)
          .maybeSingle();
      });
    },

    /**
     * @param {string} collectionId
     * @param {string} name
     */
    renameCollection: function (collectionId, name) {
      return withUser(function (client, userId) {
        return client
          .from("verse_collections")
          .update({ name: name })
          .eq("id", collectionId)
          .eq("user_id", userId)
          .select(COLLECTION_COLUMNS)
          .maybeSingle();
      });
    },

    /**
     * @param {string} collectionId
     */
    deleteCollection: function (collectionId) {
      return withUser(function (client, userId) {
        return client
          .from("verse_collections")
          .delete()
          .eq("id", collectionId)
          .eq("user_id", userId);
      });
    },

    /* ==================================================================
       Saved verses
       ================================================================== */

    /**
     * @param {{collectionId?: string, book?: string, limit?: number}} [options]
     */
    listSavedVerses: function (options) {
      var opts = options || {};
      return withUser(function (client, userId) {
        var query = client
          .from("saved_verses")
          .select(SAVED_VERSE_COLUMNS)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (opts.collectionId) query = query.eq("collection_id", opts.collectionId);
        if (opts.book) query = query.eq("book", opts.book);
        if (opts.limit) query = query.limit(opts.limit);
        return query;
      });
    },

    /**
     * @param {{translation?: string, book: string, chapter: number, verse?: number | null, note?: string | null, collection_id?: string | null}} verse
     */
    saveVerse: function (verse) {
      return withUser(function (client, userId) {
        return client
          .from("saved_verses")
          .insert({
            user_id: userId,
            translation: verse.translation || "KJV",
            book: verse.book,
            chapter: verse.chapter,
            verse: verse.verse === undefined ? null : verse.verse,
            note: verse.note === undefined ? null : verse.note,
            collection_id: verse.collection_id === undefined ? null : verse.collection_id
          })
          .select(SAVED_VERSE_COLUMNS)
          .maybeSingle();
      });
    },

    /**
     * @param {string} verseId
     * @param {{translation?: string, note?: string | null, collection_id?: string | null}} patch
     */
    updateSavedVerse: function (verseId, patch) {
      return withUser(function (client, userId) {
        return client
          .from("saved_verses")
          .update(patch)
          .eq("id", verseId)
          .eq("user_id", userId)
          .select(SAVED_VERSE_COLUMNS)
          .maybeSingle();
      });
    },

    /**
     * @param {string} verseId
     */
    deleteSavedVerse: function (verseId) {
      return withUser(function (client, userId) {
        return client
          .from("saved_verses")
          .delete()
          .eq("id", verseId)
          .eq("user_id", userId);
      });
    }
  };

  /** @type {any} */ (window).BiblePlanData = api;
})();
