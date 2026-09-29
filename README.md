# Bible Plan (React rewrite)

A calendar-based Bible reading tracker, a Bible reader, and saved verses —
rebuilt on React + Vite, still using your existing Supabase project for
accounts and data.

## What's in this version

- **Framework**: vanilla JS/HTML → **React + Vite**, with real routing
  (React Router) instead of one `index.html` swapping `data-page` sections.
- **Pages**: Plan (`/plan`), Bible (`/bible`), and Saves (`/saves`) are
  their own routes. Settings and Login stay lighter/separate.
- **Profile page** (`/profile`, signed-in only): avatar upload, name,
  description, church (plain text), and a saved-verses summary.
- **Bible reader** (`/bible`): live text from the
  [HelloAO Bible API](https://bible.helloao.org) — free, no key, no rate
  limit. Books split into Old Testament / Deuterocanonical / New Testament.
  Opening a chapter collapses the sidebar; tap a verse to save it (Saves
  page lists them in the order you saved them).
- **Plan page** (`/plan`): a Google Calendar-style month view — event pills
  per book, color-coded (gold = OT, blue = NT, green = Deuterocanonical),
  drag a pill to reschedule a whole book's reading to another day, click a
  pill to open a day's chapter checklist (expand a book, check off
  individual chapters, or drag a single chapter row to a different day).
  Mini-calendar + plan editor live in the sidebar; dark/light toggle and a
  clock sit in the calendar's bottom bar.

## The reading plan is fully dynamic now

Earlier drafts of this rewrite shipped one fixed 121-day plan. That's gone.
**The plan is generated on the fly** from whatever you set in the sidebar's
"Reading Plans" panel:

- **Start date** — any date.
- **Length** — any number of days (1–730).
- **Books** — Old Testament, New Testament, Deuterocanonical, any
  combination.
- **Order** — "Overlap" (a bit of every selected group each day — this is
  the default) or "In order" (finish one group before starting the next).

The default for a new account is **360 days, Old + New Testament,
overlap mode**, starting the day you sign up. Chapter counts come live from
the HelloAO API for whichever translation is set as default, so this is
accurate for real book lengths rather than a hardcoded table — and it
means Deuterocanonical only produces readings if your default translation
actually includes those books.

Changing the plan in the sidebar **regenerates the whole schedule** —
every chapter gets a fresh row in `reading_schedule`, so make sure that's
what you want before hitting "Apply plan"; it replaces what's there,
including any read checkmarks and any chapters you'd manually dragged to a
different day.

## Why the default translation is BSB, not NIV

NIV is a commercially licensed translation (Biblica/Zondervan), so it
isn't available through HelloAO's API — that API only carries translations
with no copyright restrictions. **BSB (Berean Standard Bible)** is the
closest widely-used free alternative, so it's the app's default. WEB, KJV,
and ASV are also in the picker.

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

3. **Run the database migrations** (Supabase Dashboard → SQL Editor → New
   query → paste → Run). If this is a fresh project, run `schema.sql`
   first — it already contains `reading_plans` and `reading_schedule`,
   which is what the plan generator reads and writes. Then run, in order:

   - `migration_profile_fields.sql` — adds `bio` and `church_name` to
     `profiles`, plus a public `avatars` storage bucket.
   - `migration_saved_verses_text.sql` — adds `book_name` and `verse_text`
     to `saved_verses`.

   (An earlier draft added a `migration_plan_progress.sql` file for a
   fixed-plan design — that's gone now that the plan is fully dynamic. If
   you already ran it, the table it created is just unused; safe to leave
   or drop.)

4. **Run it locally**

   ```bash
   npm run dev
   ```

5. **Deploy** — push to GitHub, import into Vercel, add the two `VITE_`
   env vars in the Vercel project settings. `vercel.json` is already set
   up for SPA routing.

## Known trade-offs in this pass

- **Drag-and-drop persists immediately** — there's no undo yet. Dropping a
  book or chapter onto another day writes to the database right away.
- **The "Days of the week" and "Daily wise words" (Psalms/Proverbs insert)
  options** from the original plan panel aren't in the generator yet —
  `reading_plans` has columns for both (`weekdays`, `wise_words`) so this
  is a reasonable follow-up, they're just not wired into the generator or
  the sidebar form yet.
- **Church field** is plain text, not a Google Places lookup, per your
  call — no Google Maps API key needed.

## Project layout

```
src/
  main.jsx                entry point
  App.jsx                  routes
  context/
    AuthContext.jsx          Supabase session
    ThemeContext.jsx          dark/light/device theme
    CalendarViewContext.jsx    shared mini-cal <-> main-cal month/date state
    PlanContext.jsx             plan config + full per-chapter schedule
  lib/
    supabaseClient.js       Supabase client (env-configured)
    dataApi.js               all reads/writes to your data
    helloao.js                HelloAO Bible API client
    bibleBooks.js              OT/Deuterocanonical/NT classification + colors
    planGenerator.js            turns plan config into a day-by-day schedule
    calendarGrid.js              month-grid date math
  components/
    Layout.jsx, Sidebar.jsx, MiniCalendar.jsx, ProtectedRoute.jsx
  pages/
    LoginPage, PlanPage, BiblePage, SavesPage, ProfilePage, SettingsPage
supabase/
  schema.sql                  original schema (unchanged) -- reading_plans
                               and reading_schedule are what the plan
                               generator uses
  migration_profile_fields.sql
  migration_saved_verses_text.sql
```
