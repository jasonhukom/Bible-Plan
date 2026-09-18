# Self-hosting (optional, future)

Nothing here is required, and nothing in the current codebase depends on it.
This records how the app *could* move to a home server later, so the decision
stays open.

## Today

```
GitHub ──▶ Vercel ──▶ Supabase Cloud
                      Postgres + GoTrue (auth) + PostgREST
```

## Possible later

```
GitHub ──▶ Home server (Docker) ──▶ self-hosted Postgres + auth + API
```

## Why the move would be straightforward

The app talks to exactly two things, and both are replaceable:

1. **`GET /api/config`** returns a project URL and an anon key. Point it
   somewhere else and the client follows. That is the only place the backend's
   address is decided.
2. **The Supabase JS client**, used only through `auth.js` and `data.js`.
   Everything else in the app goes through those two files.

Nothing imports a Supabase URL directly, and no table name appears outside
`data.js`. The schema is plain PostgreSQL with `auth.users` as the only
Supabase-specific reference.

## Option A — self-hosted Supabase (least work)

Supabase publishes a Docker Compose stack (Postgres, GoTrue, PostgREST,
Kong, Studio). Running it on the home server means:

- `supabase/schema.sql` applies unchanged — including RLS policies, which are
  Postgres features, not Supabase ones.
- `auth.js` and `data.js` need no changes at all.
- Only the two environment variables change: `SUPABASE_URL` points at your
  server (e.g. `https://bible.your-domain.tld`), and `SUPABASE_ANON_KEY`
  becomes the anon key that stack generates.

Practical requirements: a domain or dynamic DNS entry, TLS (Caddy or Traefik
in front of Kong), a reverse proxy, and automated `pg_dump` backups. Auth
emails — confirmation and password reset — need an SMTP provider configured in
GoTrue, since Supabase Cloud's built-in email sender is not part of the
self-hosted stack.

## Option B — plain Postgres + your own API

If you would rather not run the whole Supabase stack:

- Keep `supabase/schema.sql` for the tables. The RLS policies rely on
  `auth.uid()`, which GoTrue provides; with a custom API you would either
  reimplement it (a `current_setting('request.jwt.claims')` helper) or enforce
  ownership in the API layer instead.
- Rewrite `data.js` against your own endpoints. Its method signatures are the
  contract the rest of the app uses, so keeping them identical means nothing
  else changes.
- Rewrite `auth.js` against your own session endpoints, keeping
  `getUser()` / `getUserId()` / `getSession()` / `onChange()` intact.

This is more work and takes on the parts that are easy to get wrong —
password hashing, token refresh, email delivery, and the security review that
RLS currently gives for free.

## Hosting the front end at home

The front end is static files plus one function. On a home server that becomes
a container serving the directory (nginx or Caddy) and a small Node process
for `/api/config` — or just a `window.BIBLE_PLAN_PUBLIC_CONFIG` script tag
written at container start, which removes the need for the function entirely.

## Recommendation

Stay on Vercel + Supabase Cloud for now. The free tier covers this app, TLS
and email are handled, and the code is deliberately arranged so that moving
later is a configuration change rather than a rewrite. Revisit if cost,
data residency, or wanting everything under one roof becomes the deciding
factor — and if you do, Option A first.
