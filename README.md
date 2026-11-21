<div align="center">

# 📖 Bible Plan

**A modern, distraction-free Bible reading tracker, interactive calendar, and scripture reader.**

*Customizable reading plans, drag-and-drop calendar rescheduling, and live multi-provider Bible integrations — stored locally on your device.*

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
- **Progress Tracking**: Check off chapters as you read; progress is saved instantly on your device.

### 📅 Dynamic Reading Plan Generator
- **Flexible Length & Start Date**: Generate schedules from 1 to 730 days starting on any specified date.
- **Customizable Book Selection**: Select Old Testament and New Testament books.
- **Onboarding Filter**: Mark books you have already read to immediately exclude them from your schedule.
- **Pacing & Plan Modes**:
  - **Overlap Mode**: Balanced daily reading across Old and New Testaments.
  - **In-Order Mode**: Sequential, book-by-book reading.
  - **Chronological Order**: Follow historical chronological sequence backed by [Bible-CSV](https://github.com/jasonhukom/Bible-CSV).
  - **Daily Psalms & Daily Proverbs**: Optionally append a daily Psalm and/or Proverb to every day of your plan.
- **PC Mouse Wheel Calendar Navigation**: Scroll up on the calendar to advance to the next month, or scroll down to return to the previous month.

### 📖 Integrated Multi-API Bible Reader
- **Dual API Scripture Providers**:
  - **API.Bible REST API**: Access copyrighted & modern translations including **NLT** (New Living Translation), **NLT-UK**, **NIV** (New International Version 2011), and **CSB** (Christian Standard Bible).
  - **HelloAO Bible API**: Instant access to 1000+ open and public-domain translations like **BSB** (Berean Standard Bible), **WEB**, **KJV**, and **ASV**.
- **Interactive Version Picker**: Switch versions dynamically from the Bible header or subtitle. Preferences save automatically on your device.
- **Distraction-Free Reading Mode**: The sidebar automatically collapses when a chapter opens to keep your focus on Scripture.
- **Tap-to-Save Verses**: Click any verse while reading to save it to your personal collection on `/saves`.

### 💾 On-Device Storage & Responsive Design
- **No Accounts Required**: Your reading plan, schedule progress, saved verses, profile name/photo, and settings are persisted directly on your device with no database or sign-up needed.
- **Mobile-First Layout**: Elegant desktop layout that automatically transforms into a native bottom navigation bar on mobile screens.
- **Adaptive Appearance**: Curated Dark, Light, and System Device themes with customizable date number positions.

---

## 🛠️ Tech Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) | Fast, component-driven client architecture |
| **Routing** | [React Router 6](https://reactrouter.com/) | Declarative client-side routing |
| **Persistence** | Browser `localStorage` | On-device storage for reading plans, progress, saved verses, profile & settings |
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
git clone --recurse-submodules https://github.com/jasonhukom/Bible-Plan.git
cd Bible-Plan
npm install
```

> For a full walkthrough of every page, component, context, storage key, and module (especially helpful for AI agents and contributors), see [CODEBASE_GUIDE.md](CODEBASE_GUIDE.md).

### 2. Configure Environment Variables (Optional)
Copy `.env.example` to `.env.local` if you want to enable API.Bible translations (NLT, NIV, CSB):
```bash
cp .env.example .env.local
```

```env
# API.Bible Key (Optional, for NLT, NIV, CSB translations: https://scripture.api.bible/)
VITE_API_BIBLE_KEY=your-api-bible-key-here
```

### 3. Start Development Server
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
| `/profile` | **Profile** | Customize your local display name, avatar photo, and view saved verse count |
| `/settings` | **Settings** | Customize default translation, appearance themes, and cell date alignment |
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
