/* ==========================================================================
   GET /api/config
   --------------------------------------------------------------------------
   Hands the browser the *public* Supabase configuration, read from the
   deployment's environment variables. This is how a static front end gets
   configured without any credential living in the repository.

   What is returned is safe to expose:
     - the project URL, which is public by definition,
     - the anon / publishable key, which grants nothing on its own. Every
       table is behind Row Level Security, so this key can only ever read or
       write rows the signed-in user is allowed to touch.

   What must never be added here: SUPABASE_SERVICE_ROLE_KEY, or any other
   secret. The service-role key bypasses RLS entirely. It belongs in
   server-only code, never in a response the browser can read.
   ========================================================================== */

module.exports = function handler(request, response) {
  var url = process.env.SUPABASE_URL || "";
  var anonKey = process.env.SUPABASE_ANON_KEY || "";

  // Short cache: long enough to avoid a round trip on every navigation,
  // short enough that rotating the key takes effect quickly.
  response.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
  response.setHeader("Content-Type", "application/json; charset=utf-8");

  response.status(200).send(
    JSON.stringify({
      supabaseUrl: url,
      supabaseAnonKey: anonKey,
      configured: Boolean(url && anonKey)
    })
  );
};
