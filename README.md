# Bible Plan

A beautifully crafted, distraction-free environment to track your daily reading, engage with Scripture, and document your spiritual journey. Built with seamless anonymous onboarding and live API integrations.

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react)](#)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat&logo=vite)](#)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![HelloAO API](https://img.shields.io/badge/HelloAO-Bible%20API-00B2FF?style=flat)](https://bible.helloao.org/)
[![YouVersion API](https://img.shields.io/badge/YouVersion-Bible%20API-orange?style=flat)](https://developers.youversion.com/api/bibles)

---

## ✨ Features

### 📅 Dynamic Reading Plan Generator
- **Customizable Length & Start**: Set a custom plan duration (1–730 days) and specify your exact start date.
- **Book Selection**: Filter reading plans by Old Testament, New Testament, or Deuterocanonical books.
- **Frictionless Onboarding**: Select books you have already read to instantly exclude them from your generated schedule upon first visit.
- **Pacing Modes**: Select "Overlap" (read from multiple groups daily) or "In order" (finish one group before starting the next).

### 🗓 Interactive Calendar View
- **Month Grid & Event Pills**: View assignments visually. Color-coded pills (gold = OT, blue = NT, green = Deuterocanonical) provide quick insights into your plan.
- **Drag-and-Drop Rescheduling**: Drag an entire book's pill to move it to another day, or click a pill to open a checklist and drag individual chapters.
- **Progress Tracking**: Check off chapters as you read them. Progress is saved automatically.

### 📖 Integrated Bible Reader
- **Multi-API Bible Integration**: Fetches real-time, accurate chapter texts via the **HelloAO Bible API** (for 1000+ free, open-license translations like BSB, WEB, KJV, ASV) and **YouVersion Platform API** for popular legacy choices.
- **Distraction-Free Mode**: The reading pane automatically takes focus and collapses the sidebar when a chapter is opened.
- **Interactive Verses**: Tap any verse to save it. View all favorites securely stored and chronologically organized on your `/saves` page.

### 🔐 Seamless Onboarding & Upgrade Paths
- **Anonymous to Permanent**: Start tracking anonymously. Upgrade anytime by linking your account (username/email) to permanently save your progress.
- **Mobile First Responsive Design**: Desktop sidebars gracefully transition into native-feeling bottom navigation bars on mobile devices.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Frontend** | [React 18](https://react.dev/), [Vite](https://vitejs.dev/), [React Router](https://reactrouter.com/) |
| **Styling** | Vanilla CSS tokens & responsive media queries (Dynamic Dark/Light mode) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, RLS, Anonymous & Email Auth) |
| **External APIs** | [HelloAO Bible API](https://bible.helloao.org/) (Free/Open) & [YouVersion API](https://developers.youversion.com/api/bibles) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js 18+](https://nodejs.org/)
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
In your Supabase Dashboard → SQL Editor → New query, execute the following files in order:
1. `supabase/schema.sql` — Sets up `reading_plans` and `reading_schedule`.
2. `supabase/migration_profile_fields.sql` — Adds profile metadata and avatars storage.
3. `supabase/migration_saved_verses_text.sql` — Enhances `saved_verses` with text cache.

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗺️ Navigation & Usage

| Route | Interface Element | Purpose |
|---|---|---|
| `/plan` | **Calendar View** | Drag and drop pills to reschedule, check off chapters, view overall schedule. |
| `/bible` | **Bible Reader** | Distraction-free scripture reading; tap verses to save them to favorites. |
| `/saves` | **Saves Page** | Review chronologically sorted saved verses. Tap to jump back to context. |
| `/profile` | **Profile Button** | Upgrade your anonymous session to a permanent account and edit profile details. |

---

## 📄 License

MIT © [jasonhukom](https://github.com/jasonhukom)
