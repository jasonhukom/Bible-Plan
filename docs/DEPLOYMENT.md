# Deployment

```
GitHub ──▶ Vercel (static site + /api) ──▶ Supabase (Postgres + Auth)
```

## Environment variables

Names only; real values go in the Vercel dashboard, never in the repository.
`.env.example` carries the same list.

| Variable | Where it is read | Required | Notes |
| --- | --- | --- | --- |
| `SUPABASE_URL` | `api/config.js` (server) | yes | `https://<project-ref>.supabase.co`. Dashboard → Project Settings → Data API |
| `SUPABASE_ANON_KEY` | `api/config.js` (server) | yes | anon / publishable key. Safe in the browser: no privileges of its own, RLS decides everything. Dashboard → Project Settings → API Keys |
| `SUPABASE_SERVICE_ROLE_KEY` | nothing, today | no | bypasses RLS. Server-only if ever used. Never add it to `api/config.js` |

Both required variables should be set for Production, Preview and Development
in Vercel. Preview deployments can point at the same project or at a separate
staging project — nothing in the code assumes either.

### How the browser gets them

The front end is static, so there is no build step injecting values into the
bundle. Instead `api/config.js` — a Vercel serverless function — reads the two
public variables at request time and returns them as JSON.
`supabase-client.js` fetches `/api/config` on load and creates the client.

Resolution order, first hit wins:

1. `window.BIBLE_PLAN_PUBLIC_CONFIG` — set it yourself if you have another mechanism
2. `GET /api/config` — production
3. `supabase.config.json` — a git-ignored local file for plain static servers

If none resolve, the app says so in the account dialog and carries on with
`localStorage` only. It does not break.

## First-time setup

1. **Create the Supabase project** (supabase.com → New project).
2. **Apply the schema**: SQL Editor → paste `supabase/schema.sql` → Run.
3. **Set the URLs**: Authentication → URL Configuration. Site URL is your
   production URL; add `https://*.vercel.app` (or your specific preview URLs)
   and `http://localhost:4173` to Redirect URLs. Sign-in, OAuth and
   password-reset links all return to these.
4. **Email/password** is on by default. Authentication → Providers →
   Email controls whether a confirmation email is required; the UI already
   handles both ("check your email" vs. signed straight in).
5. **Google (optional)**: Authentication → Providers → Google, paste the
   client ID/secret from Google Cloud Console, and add the callback Supabase
   shows you to the Google OAuth client. Apple and GitHub work the same way.
   Any provider you do not enable shows a clear message instead of failing
   silently, so you can ship with email/password alone.
6. **Import to Vercel**: New Project → pick the repo → add the two environment
   variables → deploy. `vercel.json` sets the build command (`npm run build`,
   which lints and type-checks) and serves the repository root; `api/config.js`
   is picked up automatically as a function.

## Local development

```bash
npm install                       # only needs to fetch typescript
SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run serve   # http://localhost:4173
```

`npm run serve` is a tiny static server with the same `/api/config` response.
`npm run dev` runs `vercel dev` instead, which is closer to production if you
have the Vercel CLI and have linked the project.

Without the Vercel CLI and without env vars, copy
`supabase.config.example.json` to `supabase.config.json` (git-ignored) and
put your URL and anon key there.

## Checks

```bash
npm run lint       # syntax, committed-secret scan, script-tag and markup checks
npm run typecheck  # tsc --noEmit
npm run build      # both of the above, plus deployable-file verification
```

## Keeping secrets out

- `.gitignore` covers `.env`, `.env.*` (except `.env.example`) and
  `supabase.config.json`.
- `npm run lint` fails the build if a JWT-shaped string, a Supabase secret
  key, or a `service_role` mention appears in anything the browser downloads.
