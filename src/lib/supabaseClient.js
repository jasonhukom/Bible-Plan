// ============================================================================
// supabaseClient.js
// ----------------------------------------------------------------------------
// The single Supabase browser client the whole app shares. Config comes from
// build-time Vite env vars (see .env.example) -- the standard, idiomatic way
// to do this in a Vite app, replacing the old runtime /api/config fetch.
//
// Only the project URL and anon (publishable) key ever reach the browser.
// Both are safe to expose: the anon key carries no privileges of its own,
// and every table is behind Row Level Security (see supabase/schema.sql).
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.trim() && supabaseAnonKey.trim()
);

if (!isSupabaseConfigured) {
  // Don't throw -- let the app render a clear "not configured" state instead
  // of a blank white screen, especially useful the first time someone clones
  // the repo and hasn't set up .env.local yet.
  console.warn(
    "[supabaseClient] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. " +
      "Copy .env.example to .env.local and fill them in."
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
