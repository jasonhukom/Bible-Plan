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
  "id, user_id, name, start_date, days, is_active, created_at, updated_at";
const PROGRESS_COLUMNS = "user_id, day_index, date, passage, completed, completed_at";

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
     Reading plan progress
     ------------------------------------------------------------------------
     One row per plan day (keyed by the reading's stable idx from
     readingPlanData.js), toggled complete/incomplete. See
     supabase/migration_plan_progress.sql for the table this reads/writes.
     ======================================================================== */

  listCompletedDays() {
    return withUser((client, userId) =>
      client.from("plan_progress").select(PROGRESS_COLUMNS).eq("user_id", userId)
    );
  },

  /**
   * @param {number} dayIndex
   * @param {string} date
   * @param {string} passage
   * @param {boolean} completed
   */
  setDayCompleted(dayIndex, date, passage, completed) {
    return withUser((client, userId) =>
      client
        .from("plan_progress")
        .upsert(
          {
            user_id: userId,
            day_index: dayIndex,
            date,
            passage,
            completed,
            completed_at: completed ? new Date().toISOString() : null
          },
          { onConflict: "user_id,day_index" }
        )
        .select(PROGRESS_COLUMNS)
        .maybeSingle()
    );
  }
};
