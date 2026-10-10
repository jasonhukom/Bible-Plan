# Bible Plan

A calendar-based Bible reading tracker, a Bible reader, and saved verses — rebuilt on React + Vite, using your existing Supabase project for accounts and data.

## What's in this version

- **Framework**: React + Vite, with real routing (React Router).
- **Frictionless Onboarding**: Users are greeted immediately with the Calendar (Plan) page upon opening the app. No initial sign-up wall. An anonymous session is generated automatically. 
- **First-Time Setup Modal**: On first load, users are asked which books they have already read, allowing them to instantly mark books as completed and exclude them from their new reading schedule.
- **Pages**: Plan (`/plan`), Bible (`/bible`), and Saves (`/saves`) are their own routes. 
- **Authentication**: Clicking the Profile button prompts the user to securely sign in (using an identifier like email or username). 
- **Profile page** (`/profile`, signed-in only): Avatar upload, display name, and a saved-verses summary. (The description and church fields were removed per design revisions).
- **Bible reader** (`/bible`): Live text from the [HelloAO Bible API](https://bible.helloao.org). Opening a chapter collapses the sidebar; tap a verse to save it. 
- **Plan page** (`/plan`): A Google Calendar-style month view. Event pills per book, color-coded. Drag a pill to reschedule a whole book's reading to another day, click a pill to open a day's chapter checklist.
- **Mobile First Navigation**: A fully responsive mobile layout that transitions the desktop sidebar into a sleek bottom navigation bar on smaller screens. 

## The reading plan is fully dynamic now

The plan is generated on the fly from whatever you set in the sidebar's "Reading Plans" panel (or the initial onboarding flow):

- **Start date** — defaults to today, but can be set to any date.
- **Length** — any number of days (1–730).
- **Books** — Old Testament, New Testament, Deuterocanonical, any combination.
- **Exclude Books** — You can select books you have already read to completely omit them from the generated schedule.
- **Order** — "Overlap" (a bit of every selected group each day) or "In order" (finish one group before starting the next).

The default for a new user is **360 days, Old + New Testament, overlap mode**, starting the day you open the app. Chapter counts come live from the HelloAO API for whichever translation is set as default.

Changing the plan in the sidebar **regenerates the whole schedule** — every chapter gets a fresh row in `reading_schedule`.

## Why the default translation is BSB, not NIV

NIV is a commercially licensed translation, so it isn't available through HelloAO's API. **BSB (Berean Standard Bible)** is the closest widely-used free alternative, so it's the app's default. WEB, KJV, and ASV are also in the picker.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase**

   Copy `.env.example` to `.env.local` and fill in your project's URL and anon key (Supabase Dashboard → Project Settings → API):

   ```bash
   cp .env.example .env.local
   ```

3. **Run the database migrations** (Supabase Dashboard → SQL Editor → New query → paste → Run). 
   - `schema.sql` — contains `reading_plans` and `reading_schedule`.
   - `migration_profile_fields.sql` — adds `bio` and `church_name` to `profiles` (though no longer used by the UI), plus a public `avatars` storage bucket.
   - `migration_saved_verses_text.sql` — adds `book_name` and `verse_text` to `saved_verses`.

4. **Run it locally**

   ```bash
   npm run dev
   ```

5. **Deploy** — push to GitHub, import into Vercel, add the two `VITE_` env vars in the Vercel project settings.

## Project layout

```
src/
  main.jsx                entry point
  App.jsx                  routes
  context/
    AuthContext.jsx          Supabase session & anonymous login
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
    Layout.jsx, Sidebar.jsx, OnboardingModal.jsx, MiniCalendar.jsx, ProtectedRoute.jsx
  pages/
    LoginPage, PlanPage, BiblePage, SavesPage, ProfilePage, SettingsPage
```
