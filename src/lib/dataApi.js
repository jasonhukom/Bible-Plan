// ============================================================================
// dataApi.js
// ----------------------------------------------------------------------------
// The database layer for user-owned data, ported from the previous app's
// data.js. Every function here:
//   - refuses to run when nobody is signed in,
//   - stamps user_id from the current session (never from caller input),
//   - returns { data, error } instead of throwing.
//
// Row Level Security is the real boundary (see supabase/schema.sql); the
// user_id filters below are a second pair of hands, not the lock itself.
// ============================================================================

import { supabase, isSupabaseConfigured } from "./supabaseClient";

const SAVED_VERSE_COLUMNS =
  "id, user_id, translation, book, book_name, chapter, verse, verse_text, note, created_at";
const PROFILE_COLUMNS =
  "id, display_name, avatar_url, bio, church_name, created_at, updated_at";
const SETTINGS_COLUMNS =
  "user_id, theme, translation, canon, preferences, created_at, updated_at";
const PLAN_COLUMNS =
  "id, user_id, name, start_date, days, weekdays, book_groups, order_mode, wise_words, is_active, created_at, updated_at";
const SCHEDULE_COLUMNS =
  "id, user_id, plan_id, day_index, date, book, book_name, chapter, category, position, completed, completed_at";

function fail(message) {
  return { data: null, error: { message } };
}

async function withUser(work) {
  if (!isSupabaseConfigured) {
    return fail("Supabase is not configured for this deployment.");
  }
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return fail("Not signed in.");
  try {
    return await work(supabase, userId);
  } catch (error) {
    return fail(error?.message || String(error));
  }
}

export const dataApi = {
  /* ========================================================================
     Profile
     ======================================================================== */

  getProfile() {
    return withUser((client, userId) =>
      client.from("profiles").select(PROFILE_COLUMNS).eq("id", userId).maybeSingle()
    );
  },

  /**
   * @param {{display_name?: string, avatar_url?: string|null, bio?: string, church_name?: string}} patch
   */
  updateProfile(patch) {
    return withUser((client, userId) =>
      client
        .from("profiles")
        .upsert({ ...patch, id: userId }, { onConflict: "id" })
        .select(PROFILE_COLUMNS)
        .maybeSingle()
    );
  },

  /**
   * Uploads a new avatar image to the `avatars` storage bucket and returns
   * its public URL. Old avatars aren't deleted automatically -- Supabase
   * Storage doesn't need it cleaned up for the app to work, and this keeps
   * the operation to a single request.
   * @param {File} file
   */
  async uploadAvatar(file) {
    if (!isSupabaseConfigured) return fail("Supabase is not configured for this deployment.");
    const {
      data: { session }
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return fail("Not signed in.");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (uploadError) return fail(uploadError.message);

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return { data: { publicUrl: data.publicUrl }, error: null };
  },

  /* ========================================================================
     Settings
     ======================================================================== */

  getSettings() {
    return withUser((client, userId) =>
      client.from("user_settings").select(SETTINGS_COLUMNS).eq("user_id", userId).maybeSingle()
    );
  },

  /**
   * @param {{theme?: string, translation?: string, canon?: string, preferences?: any}} patch
   */
  saveSettings(patch) {
    return withUser((client, userId) =>
      client
        .from("user_settings")
        .upsert({ ...patch, user_id: userId }, { onConflict: "user_id" })
        .select(SETTINGS_COLUMNS)
        .maybeSingle()
    );
  },

  /* ========================================================================
     Saved verses
     ------------------------------------------------------------------------
     Ordered by created_at ascending everywhere, i.e. the order they were
     saved in -- oldest save first, matching what was asked for.
     ======================================================================== */

  listSavedVerses() {
    return withUser((client, userId) =>
      client
        .from("saved_verses")
        .select(SAVED_VERSE_COLUMNS)
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
    );
  },

  /**
   * @param {{translation: string, book: string, book_name?: string, chapter: number, verse: number, verse_text: string}} verse
   */
  saveVerse(verse) {
    return withUser((client, userId) =>
      client
        .from("saved_verses")
        .insert({ ...verse, user_id: userId })
        .select(SAVED_VERSE_COLUMNS)
        .maybeSingle()
    );
  },

  /** @param {string} id */
  unsaveVerse(id) {
    return withUser((client, userId) =>
      client.from("saved_verses").delete().eq("id", id).eq("user_id", userId)
    );
  },

  /* ========================================================================
     Reading plan (configurable) + schedule
     ------------------------------------------------------------------------
     reading_plans holds the config (start date, length, book groups, order
     mode) -- exactly one row per user has is_active = true. reading_schedule
     holds one row per scheduled chapter, which is what makes per-chapter
     completion and drag-and-drop rescheduling simple: both are just updates
     to a single row.
     ======================================================================== */

  getActivePlan() {
    return withUser((client, userId) =>
      client
        .from("reading_plans")
        .select(PLAN_COLUMNS)
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle()
    );
  },

  /**
   * Creates the user's plan if they don't have one yet, otherwise updates
   * the existing active plan in place (there's only ever one active plan).
   * @param {{name?: string, start_date: string, days: number, book_groups: string[], order_mode: string}} config
   */
  saveActivePlan(config) {
    return withUser(async (client, userId) => {
      const { data: existing } = await client
        .from("reading_plans")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (existing) {
        return client
          .from("reading_plans")
          .update(config)
          .eq("id", existing.id)
          .select(PLAN_COLUMNS)
          .maybeSingle();
      }
      return client
        .from("reading_plans")
        .insert({ ...config, user_id: userId, is_active: true })
        .select(PLAN_COLUMNS)
        .maybeSingle();
    });
  },

  listSchedule(planId) {
    return withUser((client, userId) =>
      client
        .from("reading_schedule")
        .select(SCHEDULE_COLUMNS)
        .eq("user_id", userId)
        .eq("plan_id", planId)
        .order("day_index", { ascending: true })
        .order("position", { ascending: true })
    );
  },

  /**
   * Replaces the entire schedule for a plan -- used when the plan config
   * changes and the whole thing needs regenerating. Chunked into batches of
   * 500 rows since a full 360-day, two-testament plan can be 1000+ rows.
   * @param {string} planId
   * @param {Array<{day_index:number,date:string,book:string,book_name:string,chapter:number,category:string,position:number}>} rows
   */
  async replaceSchedule(planId, rows) {
    return withUser(async (client, userId) => {
      const del = await client.from("reading_schedule").delete().eq("plan_id", planId).eq("user_id", userId);
      if (del.error) return del;

      const withIds = rows.map((r) => ({ ...r, plan_id: planId, user_id: userId }));
      const batchSize = 500;
      for (let i = 0; i < withIds.length; i += batchSize) {
        const batch = withIds.slice(i, i + batchSize);
        const { error } = await client.from("reading_schedule").insert(batch);
        if (error) return { data: null, error };
      }
      return { data: { inserted: withIds.length }, error: null };
    });
  },

  /** @param {string} rowId @param {boolean} completed */
  setChapterCompleted(rowId, completed) {
    return withUser((client, userId) =>
      client
        .from("reading_schedule")
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", rowId)
        .eq("user_id", userId)
    );
  },

  /**
   * Moves one or more schedule rows to a new date (drag-and-drop). Each
   * move can carry its own day_index/position since rows dropped on the
   * same day need sequential positions.
   * @param {Array<{id: string, date: string, day_index: number, position: number}>} moves
   */
  moveScheduleEntries(moves) {
    return withUser(async (client, userId) => {
      const results = await Promise.all(
        moves.map((m) =>
          client
            .from("reading_schedule")
            .update({ date: m.date, day_index: m.day_index, position: m.position })
            .eq("id", m.id)
            .eq("user_id", userId)
        )
      );
      const failed = results.find((r) => r.error);
      if (failed) return { data: null, error: failed.error };
      return { data: { moved: moves.length }, error: null };
    });
  }
};
