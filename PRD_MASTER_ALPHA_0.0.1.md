# Bible-Plan — Master Product Requirements Document (Version Alpha0.0.1)

## 1. Executive Overview
Bible-Plan (Alpha0.0.1) is a cross-platform Bible reading, chronological connection mapping, and schedule planner across **Web (PC & Mobile)**, **Native Android (.apk)**, and **Frameless Desktop (.exe & Linux)**, backed by a self-hosted **PostgreSQL (RLS) + Fastify + Better Auth** architecture and integrated with **Luminess-Assist** via an extension handshake.

## 2. Core Architecture & Infrastructure
- **Frontend**: React + Vite (Web & Frameless Desktop Shell)
- **Native Android**: Kotlin + Jetpack Compose in `/android-native` (No HTML/WebView wrappers)
- **Backend**: Node.js + Fastify (`/server`)
- **Authentication**: Better Auth (`advanced.database.generateId: "uuid"`) with Google OAuth and Anonymous-to-Permanent account linking callback (migrating reading plans, schedules, settings, and saved verses before guest deletion).
- **Database**: Self-hosted PostgreSQL with forced Row-Level Security (`ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`).
  - Backend validates Better Auth session, starts a DB transaction, runs `SELECT set_config('app.user_id', $1, true);` (transaction-local), and queries via a non-owner role without `BYPASSRLS`.
- **Docker & Network**:
  - Public entry: `bible-plan.jasonhukom.my.id` via Cloudflare Tunnel -> Reverse Proxy -> Frontend & Fastify API.
  - Private Docker network: PostgreSQL is never exposed to the public internet.
  - **Strict Container Naming**: App container MUST be named `bible-plan`; Database container and persistent volume MUST be named `bible-data` (never generic names like `plan`).
- **Vercel & Version Sync**:
  - Backend exposes `/api/version` returning `Alpha0.0.1` and build hash; Frontend middleware checks `X-App-Version: Alpha0.0.1` to prevent Frontend-Backend mismatches across concurrent builds.

## 3. UI/UX & Feature Specifications
### 3.1 Branding, Images & Bottom-Left Auth Card
- **Top-Left Brand Graphic**: Replace plain text "Bible Plan" with a dedicated rendered brand wordmark + logo image (`/public/assets/brand/bible-plan-title.png` & `.svg`).
- **Favicon**: Use the new custom brand logo as `/public/favicon.ico` and `/public/favicon.png` (remove the cross favicon).
- **Image Icons Only**: Every UI icon must be an actual image file (`.png`/`.svg` under `/public/assets/icons/`) loaded via `<img>`—no inline HTML/CSS shapes.
- **Bottom-Left User Profile Bar**:
  - Logged out: Displays default profileless avatar image + `Sign-in` button.
  - Logged in: Displays user's profile image + display name or email.
  - If an app update is available online, an update indicator appears on the account card (clicking it triggers/shows the 1-click updater).

### 3.2 AI Search (`GEMINI_KEY`)
- Top navigation includes a Gemini AI Search button and modal powered by `process.env.GEMINI_KEY` (configured in Vercel and `.env.example`).

### 3.3 Bible Page (PC vs. Mobile)
- **PC Layout**: Desktop-first multi-column layout inspired by **bible.com** (centered reading pane, side chapter/version controls, clean desktop typography—never a stretched mobile screen).
- **Mobile Theme Fix**: Strictly enforce dark mode variables on mobile screens; eliminate all light backgrounds on mobile.
- **Book Selector**: Remove the `A-Z` sort toggle completely. Hide/remove books that are not yet available in the main selector and relocate them to `Settings -> Secret & Excluded Books`.

### 3.4 Sidebar & Chronological Connections Page (`biblicalconnections.org`)
- **Overlay Scrollbar**: Sidebar scrollbar overlays content without pushing or shifting sidebar items horizontally.
- **Reading Plans Always Open**: The Reading Plans section in the sidebar is expanded by default.
- **Dedicated Planning Page (`/planning`)**:
  - Clicking the Reading Plans action opens the full Planning Page.
  - When open, the sidebar reading plan collapses and docks to the **right side of the screen**.
  - **Center Canvas**: Displays the Bible timeline/structure with a toggle between **Vertical** and **Horizontal** orientation.
  - **Order Dynamic Switch**: Switches automatically per plan between **Chronological Order (when events happened)**, **Composition Order (when written)**, and **Biblical Canon Order**.
  - **Connection Arcs**: Draws SVG/Canvas connecting lines between cross-referenced passages inspired by `https://biblicalconnections.org/`.

### 3.5 Settings Overhaul (Desktop-Scaled & Ordered by Priority)
Settings layout uses wide desktop padding/grid on PC. Categories are ordered strictly from **Most Important to Least Important**:
1. **Account & Updates**: Profile info, Google OAuth link, **1-Click Online Update** button (checks latest build when online and updates in one click; also surfaced on Account click), and **Logout** button.
2. **Reading Plan & Calendar Data**:
   - **3-Day Calendar Preview**: Shows 3 days (`Yesterday | Today | Tomorrow`) with **Today in the middle**, populated with **randomized chapters** that re-randomize for every user and every time any setting changes.
   - **Export CSV** & **Import CSV** buttons for reading plans.
3. **Web Language (85+ Languages)**:
   - Over 85 web UI languages, verified with an automated test script.
   - Changing language also fetches the corresponding Bible translation data in the background, while keeping the Bible translation dropdown out of Settings.
4. **Extensions (`Luminess Assist`)**:
   - Opens the Extensions Page to install/toggle the Luminess Assist companion.
5. **Secret & Excluded Books**:
   - Opens a dedicated page showing unavailable books, deuterocanonical/apocryphal books, and historically excluded books, with clear explanations of why each is not included in the standard canon.

### 3.6 Desktop (`.exe` & Linux), Native Android (`.apk`) & Startup Plan Picker
- **Frameless Desktop App**: No default OS titlebar; custom `-` (minimize), `□` (maximize), and `×` (close) image buttons pinned to the top-right corner. Builds for Windows (`.exe`) and Linux.
- **Startup Plan Selector**: Optional "Run on Startup & Select Plan" screen modeled after Google Chrome / Brave profile picker—lets users pick their Account / Reading Plan profile on launch.
- **Smart Web Download Button**: Detects browser OS and displays `Download .APK` on Android, `Download .EXE` on Windows, or `Download for Linux` on Linux.
- **In-Repo Build Artifacts**: Store the single compiled `.apk`, Windows `.exe`, and Linux binary directly inside `/builds/` in the repository (not in GitHub Releases).

### 3.7 Luminess Assist Extension Integration
- Replicates the native **Rust Tauri application UI** from `Luminess-Assist/src-tauri` (not the web/README landing page).
- **Web (PC only)**: Renders a bottom-right floating Luminess bot widget that reads the user's active Bible Plan and reminds them of today's reading.
- **Desktop**: Installs/links the native Luminess Assist app with Bible Plan reminders.
- **Lifecycle Lock**: Luminess Assist only operates if installed from Bible-Plan or while the Bible-Plan Extension toggle is ON; if disabled or out of date, Luminess pauses and prompts for an update via Bible-Plan.
- **Stability Fix**: Fixes Tauri Rust thread panics, IPC deadlocks, and OpenCode lag spikes in `Luminess-Assist`.

## 4. Temporary Credentials Policy (24-Hour Expiry)
All temporary tokens (`GitHub PAT`, `Vercel Token`, `GOOGLE_OAUTH_KEY`) provided during the Alpha0.0.1 build sprint expire in **24 hours**. After 24 hours, MCP/CLI token bindings will automatically stop authenticating, and the app must read exclusively from runtime environment variables (`.env`).