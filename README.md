<div align="center">

# 📖 Bible Plan

**A modern, distraction-free Bible reading tracker, interactive calendar, and scripture reader.**

*Customizable reading plans, drag-and-drop calendar rescheduling, and live multi-provider Bible integrations.*

<br />

<p>
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-navigation--routes">Navigation</a> •
  <a href="#-license">License</a>
</p>

<p>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="React 18" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 5" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://scripture.api.bible/"><img src="https://img.shields.io/badge/API.Bible-REST%20API-7B61FF?style=for-the-badge" alt="API.Bible" /></a>
  <a href="https://bible.helloao.org/"><img src="https://img.shields.io/badge/HelloAO-Bible%20API-00B2FF?style=for-the-badge" alt="HelloAO API" /></a>
  <a href="#-license"><img src="https://img.shields.io/badge/License-MIT-F5A623?style=for-the-badge" alt="License: MIT" /></a>
</p>

</div>

---

## ✨ Features

### 🗓️ Interactive Calendar View
- **Google Calendar-Style Grid**: Month view featuring color-coded event pills by testament:
  - 🟨 **Old Testament** (Golden Yellow)
  - 🟦 **New Testament** (Blue)
- **Drag-and-Drop Rescheduling**: Drag an entire book pill to another date, or click a pill to drag individual chapters between days.
- **Progress Tracking**: Check off chapters as you read; progress is synced and saved instantly.

### 📅 Dynamic Reading Plan Generator
- **Flexible Length & Start Date**: Generate schedules from 1 to 730 days starting on any specified date.
- **Customizable Book Selection**: Select Old Testament and New Testament books.
- **Onboarding Filter**: Mark books you have already read to immediately exclude them from your schedule.
- **Pacing Modes**:
  - **Overlap Mode**: Balanced daily reading across selected testaments.
  - **In-Order Mode**: Sequential, book-by-book reading.

### 📖 Integrated Multi-API Bible Reader
- **Dual API Scripture Providers**:
  - **API.Bible REST API**: Access copyrighted & modern translations including **NLT** (New Living Translation), **NLT-UK**, **NIV** (New International Version 2011), and **CSB** (Christian Standard Bible).
  - **HelloAO Bible API**: Instant access to 1000+ open and public-domain translations like **BSB** (Berean Standard Bible), **WEB**, **KJV**, and **ASV**.
- **Interactive Version Picker**: Switch versions dynamically from the Bible header or subtitle. Preferences sync automatically with your account settings.
- **Distraction-Free Reading Mode**: The sidebar automatically collapses when a chapter opens to keep your focus on Scripture.
- **Tap-to-Save Verses**: Click any verse while reading to save it to your personal collection on `/saves`.

### 🔐 Seamless Authentication & Responsive Design
- **Frictionless Anonymous Onboarding**: Jump straight in without sign-up barriers; upgrade to a permanent email/password account at any time without losing reading history.
- **Mobile-First Layout**: Elegant desktop layout that automatically transforms into a native bottom navigation bar on mobile screens.
- **Adaptive Appearance**: Curated Dark, Light, and System Device themes with customizable date number positions.

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) | Fast, component-driven client architecture |
| **Routing** | [React Router 6](https://reactrouter.com/) | Declarative client-side routing |
| **Database & Auth** | [Supabase](https://supabase.com/) | PostgreSQL database, Row-Level Security (RLS), Anonymous & Email Auth |
| **Bible APIs** | [API.Bible](https://scripture.api.bible/) & [HelloAO](https://bible.helloao.org/) | Live Scripture text retrieval & metadata |
| **Styling** | Vanilla CSS Tokens | Zero runtime CSS dependencies, CSS custom properties, and smooth animations |
| **Hosting** | [Vercel](https://vercel.com/) | Serverless edge hosting and continuous deployment |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- `npm` or `pnpm`

### 1. Clone the Repository
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

Fill in your configuration:
```env
# Supabase credentials (Dashboard -> Project Settings -> API)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API.Bible Key (Optional, for NLT, NIV, CSB translations: https://scripture.api.bible/)
VITE_API_BIBLE_KEY=your-api-bible-key-here
```

### 3. Run Database Migrations
In your Supabase Dashboard → **SQL Editor** → **New query**, execute the SQL migrations in order:
1. `supabase/schema.sql` — Base tables (`reading_plans`, `reading_schedule`, etc.).
2. `supabase/migration_profile_fields.sql` — Adds profile metadata & avatars storage bucket.
3. `supabase/migration_saved_verses_text.sql` — Adds cached verse text to `saved_verses`.

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗺️ Navigation & Routes

| Route | View | Description |
| :--- | :--- | :--- |
| `/plan` | **Calendar View** | Interactive reading plan calendar with drag-and-drop pills and completion toggles |
| `/bible` | **Bible Reader** | Distraction-free Scripture reading with clickable version switching |
| `/saves` | **Saved Verses** | Chronological record of your favorite saved passages with quick reader links |
| `/profile` | **User Profile** | Manage account details, avatars, and linked identity |
| `/settings` | **Settings** | Customize default translation, appearance (dark/light), and cell date alignment |
| `/licenses` | **Licenses** | Translation attributions, copyright notices, and publisher licenses |

---

<div align="center">

<br />

<p>Crafted with care by <a href="https://github.com/jasonhukom"><strong>Jason Hukom</strong></a></p>

<p>
  <a href="https://github.com/jasonhukom/Bible-Plan/stargazers">⭐️ Star this project on GitHub</a>
</p>

<p>
  <a href="#-bible-plan">Back to Top ↑</a>
</p>

<br />

<sub>Released under the <a href="https://opensource.org/licenses/MIT">MIT License</a>. Scripture texts are copyrighted by their respective publishers.</sub>

</div>
