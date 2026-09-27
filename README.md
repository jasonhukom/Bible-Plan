# Bible Plan (React rewrite)

A calendar-based Bible reading tracker, a Bible reader, and saved verses —
rebuilt on React + Vite, still using your existing Supabase project for
accounts and data.

## What changed from the old vanilla-JS app

- **Framework**: vanilla JS/HTML → **React + Vite**, with real routing
  (React Router) instead of one `index.html` swapping `data-page` sections.
- **Pages**: Plan, Bible, and Saves are now their own routes/pages
  (`/plan`, `/bible`, `/saves`). Settings (`/settings`) and Login
  (`/login`) stay as their own lighter pages rather than living in the
  main nav rail alongside the others.
- **New Profile page** (`/profile`, only reachable once signed in): avatar
  upload, name, description, church (plain text field), and a saved-verses
  summary linking to Saves.
- **New Bible reader** (`/bible`): pulls text live from the
  [HelloAO Bible API](https://bible.helloao.org) — free, no API key,
  no rate limits. Styled after Bible.com/YouVersion: a book sidebar on the
  left, the reading pane on the right. **Opening a chapter automatically
  collapses the sidebar** so the reading pane has your full attention; a
  "Books" button brings it back.
- **Tap-to-save verses**: tap any verse in the reader to save it. It shows
  up on the Saves page **in the order you saved it** (oldest save first).
  Tap a saved verse's reference to jump straight back to it in the reader.
- **Books are grouped into three lists**: Old Testament, Deuterocanonical,
  and New Testament, instead of one long list. Whether the middle group has
  anything in it depends on the translation — most Protestant translations
  (BSB, WEB, KJV, ASV) don't include those books at all.
- **The reading plan itself is unchanged** — same 121 days, same dates,
  same passages, ported byte-for-byte from `readings-data.js`. Each day's
  passage now links straight into the Bible reader.

## Why the default translation is BSB, not NIV

NIV is a commercially licensed translation (Biblica/Zondervan) with tight
distribution restrictions, so it isn't available through HelloAO's API —
that API only carries translations with no copyright restrictions. **BSB
(Berean Standard Bible)** is the closest widely-used free alternative
(modern, readable, leans word-for-word), so it's the app's default. WEB,
KJV, and ASV are also available from the translation picker. Any of the
1000+ translations HelloAO hosts will work if you type its id in — the
picker just shows a friendly shortlist.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase**

   Copy `.env.example` to `.env.local` and fill in your project's URL and
   anon key (Supabase Dashboard → Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

   These are build-time, `VITE_`-prefixed variables (the standard Vite way
   of exposing config to client code) — different from the old app's
   runtime `/api/config` endpoint, but the anon key is just as safe to
   expose since every table sits behind Row Level Security.

3. **Run the database migrations**

   If this is a fresh Supabase project, run `supabase/schema.sql` first.
   Either way, run these three in order (Supabase Dashboard → SQL Editor):

   - `supabase/migration_profile_fields.sql` — adds `bio` and
     `church_name` to `profiles`, plus a public `avatars` storage bucket.
   - `supabase/migration_saved_verses_text.sql` — adds `book_name` and
     `verse_text` to `saved_verses`, so a saved verse renders without an
     extra API call and keeps reading the same even if you later switch
     translations.
   - `supabase/migration_plan_progress.sql` — adds a small `plan_progress`
     table for the Plan page's read/unread checkmarks. (The original
     `reading_plans` / `reading_schedule` tables are still there,
     untouched, for a future multi-plan feature — this rewrite ships with
     just the one fixed 121-day plan, so it uses a simpler table instead.)

4. **Run it locally**

   ```bash
   npm run dev
   ```

5. **Deploy** — same as before: push to GitHub, import into Vercel,
   add the two `VITE_` env vars in the Vercel project settings.
   `vercel.json` is already set up for SPA routing.

## What's intentionally simplified in this rewrite

- **Plan customization** (choosing chronological order, overlap mode,
  which book groups to include) isn't carried over yet — the app ships
  with the one 121-day plan you already had running. The dataset CSVs
  for those variants are still in your original repo if you want that
  brought back in a follow-up.
- **Church field** is plain text, not a Google Places lookup, per your
  call — no Google Maps API key needed.

## Project layout

```
src/
  main.jsx              entry point
  App.jsx                routes
  context/
    AuthContext.jsx       Supabase session
    ThemeContext.jsx       dark/light/device theme
  lib/
    supabaseClient.js       Supabase client (env-configured)
    dataApi.js               all reads/writes to your data
    helloao.js                HelloAO Bible API client
    bibleBooks.js              OT/Deuterocanonical/NT classification
    readingPlanData.js          the 121-day plan (ported as-is)
  components/
    Layout.jsx, ProtectedRoute.jsx
  pages/
    LoginPage, PlanPage, BiblePage, SavesPage, ProfilePage, SettingsPage
supabase/
  schema.sql                  original schema (unchanged)
  migration_*.sql             the three new migrations above
```
