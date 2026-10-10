# Bible Plan

> **A beautifully crafted, distraction-free environment to track your daily reading, engage with Scripture, and document your spiritual journey. Designed to remove the friction between intention and action, Bible Plan provides a seamless, dynamic reading schedule that adapts to your pace.**
>
> *A low-friction, highly customizable Bible reading tracker built with seamless anonymous onboarding and live API integrations.*

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react)](#)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)](#)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![YouVersion API](https://img.shields.io/badge/YouVersion-Bible%20API-orange?style=flat)](https://developers.youversion.com/api/bibles)

---

## 🌟 The Philosophy

Bible Plan is built upon the gentle principle that engaging with Scripture should feel like a breathing space rather than a chore. 

- **Frictionless Entry**: The moment you open the app, you are greeted with your daily reading plan. No initial sign-up walls. An anonymous session is generated immediately so you can start right away.
- **Your Pace, Your Plan**: Reading plans shouldn't feel like a rigid contract. Easily exclude books you've already read, adjust the length, or drag-and-drop chapters to a different day when life gets busy.
- **Deep Immersion**: The reading interface collapses distractions, bringing the text front and center, with a seamless dark/light mode transition to suit your environment.

---

## 🚀 Key Features

### 1. Fully Dynamic Reading Plan Generator
- **Customizable Length & Start**: Choose any number of days (1–730) for your plan. The schedule defaults to starting today, but you can define a custom start date.
- **Book Selection**: Filter by Old Testament, New Testament, or Deuterocanonical books.
- **Frictionless Onboarding Modal**: On your very first visit, select books you have already read to instantly exclude them from your generated schedule.
- **Pacing Modes**: Select "Overlap" (a bit of every selected group each day) or "In order" (finish one group before starting the next).

### 2. Interactive Google Calendar-Style View
- **Month Grid & Event Pills**: View your reading assignments visually. Pills are color-coded by testament (gold = OT, blue = NT, green = Deuterocanonical).
- **Drag-and-Drop Rescheduling**: Drag an entire book's pill to move it to another day, or click a pill to open a checklist and drag individual chapters.
- **Progress Tracking**: Simply check off chapters as you read them; progress is saved automatically.

### 3. Integrated Bible Reader & Saved Verses
- **Live Text from YouVersion API**: Fetches real-time, accurate chapter texts. Uses the BSB (Berean Standard Bible) by default (Biblica Bible License: https://docs.google.com/document/d/1JagIromoy-ZJDiPspaocxan5QrObctqb/edit), with WEB, KJV, and ASV also available.
- **Distraction-Free Mode**: Opening a chapter automatically collapses the sidebar.
- **Interactive Verses**: Tap any verse while reading to save it to your personal collection. Your `/saves` page keeps a chronological record of your favorite passages.

### 4. Seamless Account Upgrades & Mobile First
- **Anonymous to Permanent**: Start tracking anonymously. When you're ready, click the Profile button to securely sign in or link an identifier (username or email) to permanently save your progress.
- **Responsive Mobile Layout**: On smaller screens, the desktop sidebar elegantly transforms into a sleek, bottom navigation bar, ensuring a native app-like experience.

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/), [Vite](https://vitejs.dev/), [React Router](https://reactrouter.com/)
- **Styling**: Vanilla CSS tokens & responsive media queries with a curated dark/light color palette
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Anonymous & Email Auth)
- **External APIs**: [YouVersion Platform API](https://developers.youversion.com/api/bibles) for real-time Bible text and metadata. (See [Biblica Bible License](https://docs.google.com/document/d/1JagIromoy-ZJDiPspaocxan5QrObctqb/edit))

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### 1. Clone & Install
```bash
git clone https://github.com/jasonhukom/Bible-Plan.git
cd Bible-Plan
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials (found in Supabase Dashboard → Project Settings → API):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Run Database Migrations
In your Supabase Dashboard → SQL Editor → New query, run the following files in order:
1. `supabase/schema.sql` — Sets up `reading_plans` and `reading_schedule`.
2. `supabase/migration_profile_fields.sql` — Adds `bio`, `church_name`, and the `avatars` storage bucket.
3. `supabase/migration_saved_verses_text.sql` — Enhances `saved_verses` with `book_name` and `verse_text`.

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🎮 Navigation & Usage

| Interface Element | Function |
|---|---|
| **Calendar View** | Click days to view assigned chapters. Drag pills to reschedule. |
| **Checklist** | Click checkboxes to mark chapters as read. |
| **Verse Text** | Click any individual verse while reading to save it. |
| **Profile Button** | Upgrade your anonymous session to a permanent account. |
| **Sidebar / Bottom Nav** | Seamlessly switch between Plan, Bible, Saves, and Settings. |

---

## 📄 License

MIT © [jasonhukom](https://github.com/jasonhukom)
