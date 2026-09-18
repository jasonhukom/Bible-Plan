/**
 * Signed-in smoke test.
 *
 * There is no Supabase project to point at from here, so this stands a fake
 * SDK in front of the app — same `createClient` surface, an in-memory table
 * store — and drives the real UI against it. That exercises the paths the
 * unconfigured test cannot reach:
 *
 *   - sign in through the dialog, and the UI switching to the signed-in menu
 *   - the sidebar button picking up the display name
 *   - first sign-in pushing this browser's plan up (seeding an empty account)
 *   - ticking a chapter pushing a completion diff, not a full rewrite
 *   - signing in on a "second device" adopting the account's plan
 *   - sign out returning the UI to its signed-out state
 *
 * The fake is not a Supabase substitute and proves nothing about RLS — that
 * is enforced in Postgres and has to be checked against a real project (see
 * docs/DATABASE.md). What it proves is that this app's own wiring is right.
 *
 *   node scripts/smoke-test-signed-in.mjs
 */

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "playwright";

const PORT = 4198;
const BASE = `http://localhost:${PORT}`;
const USER_ID = "11111111-2222-3333-4444-555555555555";

const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  env: { ...process.env, PORT: String(PORT), SUPABASE_URL: "", SUPABASE_ANON_KEY: "" },
  stdio: "ignore"
});
await sleep(700);

/** @type {string[]} */
const failures = [];

/**
 * @param {string} label
 * @param {boolean} condition
 * @param {string} [detail]
 */
function check(label, condition, detail) {
  if (condition) console.log(`  ok   ${label}`);
  else {
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failures.push(label);
  }
}

/**
 * Installed before any app script runs. Provides window.supabase and the
 * public config, so supabase-client.js builds a "real" client from it.
 */
function installFake(options) {
  const store = options.seed || {
    profiles: [],
    user_settings: [],
    reading_plans: [],
    reading_schedule: [],
    verse_collections: [],
    saved_verses: []
  };

  window.__fakeDb = store;
  window.__fakeCalls = [];

  let session = options.session || null;
  let onChange = null;
  let idCounter = 1;
  const uuid = () => `id-${idCounter++}`;

  const matches = (row, filters, negFilters) =>
    filters.every(([column, value]) => row[column] === value) &&
    negFilters.every(([column, value]) => row[column] !== value);

  function run(query) {
    window.__fakeCalls.push({ table: query.table, op: query.op });
    const table = store[query.table] || (store[query.table] = []);

    if (query.op === "insert" || query.op === "upsert") {
      const rows = Array.isArray(query.payload) ? query.payload : [query.payload];
      const written = rows.map((input) => {
        const key = query.table === "profiles" ? "id" : "user_id";
        if (query.op === "upsert") {
          const existing = table.find((row) => row[key] === input[key]);
          if (existing) {
            Object.assign(existing, input);
            return existing;
          }
        }
        const row = Object.assign({ id: uuid() }, input);
        table.push(row);
        return row;
      });
      const data = query.single ? written[0] || null : written;
      return { data, error: null };
    }

    if (query.op === "update") {
      const hit = table.filter((row) => matches(row, query.filters, query.negFilters));
      hit.forEach((row) => Object.assign(row, query.payload));
      return { data: query.single ? hit[0] || null : hit, error: null };
    }

    if (query.op === "delete") {
      const keep = table.filter((row) => !matches(row, query.filters, query.negFilters));
      const removed = table.length - keep.length;
      store[query.table] = keep;
      return { data: removed, error: null };
    }

    let rows = table.filter((row) => matches(row, query.filters, query.negFilters));
    query.orders.forEach(({ column }) => {
      rows = rows.slice().sort((a, b) => (a[column] > b[column] ? 1 : a[column] < b[column] ? -1 : 0));
    });
    if (query.range) rows = rows.slice(query.range[0], query.range[1] + 1);
    if (query.limitValue) rows = rows.slice(0, query.limitValue);
    return { data: query.single ? rows[0] || null : rows, error: null };
  }

  function from(table) {
    const query = {
      table,
      op: null,
      payload: null,
      filters: [],
      negFilters: [],
      orders: [],
      range: null,
      limitValue: null,
      single: false
    };
    const builder = {
      select() {
        if (!query.op) query.op = "select";
        return builder;
      },
      insert(payload) {
        query.op = "insert";
        query.payload = payload;
        return builder;
      },
      upsert(payload) {
        query.op = "upsert";
        query.payload = payload;
        return builder;
      },
      update(payload) {
        query.op = "update";
        query.payload = payload;
        return builder;
      },
      delete() {
        query.op = "delete";
        return builder;
      },
      eq(column, value) {
        query.filters.push([column, value]);
        return builder;
      },
      neq(column, value) {
        query.negFilters.push([column, value]);
        return builder;
      },
      order(column) {
        query.orders.push({ column });
        return builder;
      },
      range(start, end) {
        query.range = [start, end];
        return builder;
      },
      limit(value) {
        query.limitValue = value;
        return builder;
      },
      maybeSingle() {
        query.single = true;
        return builder;
      },
      then(resolve, reject) {
        return Promise.resolve()
          .then(() => run(query))
          .then(resolve, reject);
      }
    };
    return builder;
  }

  function makeSession(email) {
    return {
      access_token: "fake-token",
      user: {
        id: options.userId,
        email,
        user_metadata: { display_name: options.displayName || email.split("@")[0] }
      }
    };
  }

  window.BIBLE_PLAN_PUBLIC_CONFIG = {
    supabaseUrl: "https://fake.supabase.co",
    supabaseAnonKey: "fake-anon-key"
  };

  window.supabase = {
    createClient() {
      return {
        from,
        auth: {
          getSession: () => Promise.resolve({ data: { session }, error: null }),
          onAuthStateChange(handler) {
            onChange = handler;
            return { data: { subscription: { unsubscribe() {} } } };
          },
          signInWithPassword({ email }) {
            session = makeSession(email);
            if (onChange) onChange("SIGNED_IN", session);
            return Promise.resolve({ data: { session, user: session.user }, error: null });
          },
          signUp({ email }) {
            session = makeSession(email);
            if (onChange) onChange("SIGNED_IN", session);
            return Promise.resolve({ data: { session, user: session.user }, error: null });
          },
          signInWithOAuth: () => Promise.resolve({ data: {}, error: null }),
          signOut() {
            session = null;
            if (onChange) onChange("SIGNED_OUT", null);
            return Promise.resolve({ error: null });
          },
          resetPasswordForEmail: () => Promise.resolve({ data: {}, error: null }),
          updateUser: () => Promise.resolve({ data: { user: session && session.user }, error: null })
        }
      };
    }
  };
}

const browser = await chromium.launch();

try {
  /* ==================================================================
     Device one: empty account, plan already in this browser
     ================================================================== */
  console.log("\ndevice one — signing in seeds the account from this browser");

  const first = await browser.newContext();
  const page = await first.newPage();
  /** @type {string[]} */
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(installFake, { userId: USER_ID, displayName: "Ada" });
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);

  check("supabase reports configured", await page.evaluate(() => window.BiblePlanSupabase.isConfigured()));

  const localDays = await page.evaluate(() => window.BiblePlanApp.getState().calendarDays.length);
  check("a local plan exists before signing in", localDays > 0, String(localDays));

  await page.click("#accountBtn");
  await page.fill('#accountForm input[name="email"]', "ada@example.com");
  await page.fill('#accountForm input[name="password"]', "hunter2hunter2");
  await page.click("#accountSubmitBtn");
  await page.waitForTimeout(900);

  check("dialog closed after sign in", !(await page.locator("#accountPopover").isVisible()));
  check(
    "sidebar shows the display name",
    (await page.locator("#accountLabel").textContent())?.trim() === "Ada",
    await page.locator("#accountLabel").textContent()
  );

  const seeded = await page.evaluate(() => ({
    plans: window.__fakeDb.reading_plans.length,
    rows: window.__fakeDb.reading_schedule.length,
    profiles: window.__fakeDb.profiles.length,
    planId: window.BiblePlanSync.getActivePlanId(),
    status: window.BiblePlanSync.getStatus().state
  }));
  check("a reading_plans row was created", seeded.plans === 1, String(seeded.plans));
  check("schedule rows were pushed", seeded.rows > 100, String(seeded.rows));
  check("a profile row exists", seeded.profiles === 1, String(seeded.profiles));
  check("sync knows its plan id", !!seeded.planId);
  check("sync status is synced", seeded.status === "synced", seeded.status);

  const stamped = await page.evaluate(() => {
    const row = window.__fakeDb.reading_schedule[0];
    return {
      userId: row.user_id,
      hasPlan: !!row.plan_id,
      book: row.book,
      category: row.category,
      position: row.position
    };
  });
  check("rows carry user_id", stamped.userId === USER_ID, stamped.userId);
  check("rows carry plan_id", stamped.hasPlan);
  check("rows carry a category", ["ot", "nt", "dc"].includes(stamped.category), stamped.category);

  console.log("\ndevice one — ticking a chapter syncs as a diff");
  // Deletes so far belong to the initial seed (replaceSchedule clears before
  // inserting). Only deletes *after* this point would mean a single tick had
  // triggered a full rewrite.
  const deletesBeforeTick = await page.evaluate(
    () => window.__fakeCalls.filter((call) => call.op === "delete").length
  );
  const ticked = await page.evaluate(async () => {
    const state = window.BiblePlanApp.getState();
    const day = state.calendarDays[0];
    day.books[0].chapters[0].completed = true;
    window.BiblePlanApp.replaceState(state);
    await new Promise((resolve) => setTimeout(resolve, 2200));
    const row = window.__fakeDb.reading_schedule.find(
      (entry) => entry.day_index === day.dayIndex && entry.position === 0
    );
    return { completed: !!(row && row.completed), completedAt: !!(row && row.completed_at) };
  });
  check("completion reached the database", ticked.completed);
  check("completed_at was stamped", ticked.completedAt);

  const deletesAfterTick = await page.evaluate(() =>
    window.__fakeCalls.filter((call) => call.op === "delete").length
  );
  check(
    "no full schedule rewrite for a single tick",
    deletesAfterTick === deletesBeforeTick,
    `${deletesBeforeTick} -> ${deletesAfterTick}`
  );

  const updateCalls = await page.evaluate(() =>
    window.__fakeCalls.filter(
      (call) => call.table === "reading_schedule" && call.op === "update"
    ).length
  );
  check("the tick went out as an update", updateCalls === 1, String(updateCalls));

  console.log("\ndevice one — signing out");
  await page.click("#accountBtn");
  check("signed-in menu is shown", await page.locator("#accountViewMenu").isVisible());
  check(
    "menu shows the account name",
    (await page.locator("#accountMenuName").textContent())?.trim() === "Ada"
  );
  await page.click("#menuSignOutBtn");
  await page.waitForTimeout(400);
  check("sidebar label resets", (await page.locator("#accountLabel").textContent())?.trim() === "Account");
  const afterSignOut = await page.evaluate(() => ({
    planId: window.BiblePlanSync.getActivePlanId(),
    localPlan: window.BiblePlanApp.getState().calendarDays.length
  }));
  check("sync stopped", afterSignOut.planId === null);
  check("local plan untouched by sign out", afterSignOut.localPlan > 0);

  const accountDb = await page.evaluate(() => JSON.stringify(window.__fakeDb));

  /* ==================================================================
     Device two: same account, different browser
     ================================================================== */
  console.log("\ndevice two — same account, a different browser");

  const second = await browser.newContext();
  const page2 = await second.newPage();
  page2.on("pageerror", (error) => pageErrors.push(error.message));

  await page2.addInitScript(installFake, {
    userId: USER_ID,
    displayName: "Ada",
    seed: JSON.parse(accountDb)
  });
  await page2.goto(BASE, { waitUntil: "domcontentloaded" });
  await page2.waitForTimeout(500);

  // Give this browser a deliberately different local plan, so adopting the
  // account's plan is visible rather than coincidental.
  await page2.evaluate(async () => {
    const state = window.BiblePlanApp.getState();
    state.calendarDays = state.calendarDays.slice(0, 5);
    state.settings.days = 5;
    window.BiblePlanApp.replaceState(state);
    await new Promise((resolve) => setTimeout(resolve, 100));
  });
  const beforeAdopt = await page2.evaluate(() => window.BiblePlanApp.getState().calendarDays.length);
  check("device two starts with its own 5-day plan", beforeAdopt === 5, String(beforeAdopt));

  await page2.click("#accountBtn");
  await page2.fill('#accountForm input[name="email"]', "ada@example.com");
  await page2.fill('#accountForm input[name="password"]', "hunter2hunter2");
  await page2.click("#accountSubmitBtn");
  await page2.waitForTimeout(1200);

  const adopted = await page2.evaluate(() => {
    const state = window.BiblePlanApp.getState();
    const firstDay = state.calendarDays[0];
    return {
      days: state.calendarDays.length,
      settingsDays: state.settings.days,
      firstBook: firstDay && firstDay.books[0] && firstDay.books[0].fullName,
      firstChapterDone: !!(firstDay && firstDay.books[0] && firstDay.books[0].chapters[0].completed),
      status: window.BiblePlanSync.getStatus().state
    };
  });
  check("the account's plan replaced the local one", adopted.days > 5, String(adopted.days));
  check("settings came down with it", adopted.settingsDays > 5, String(adopted.settingsDays));
  check("readings rebuilt with book names", typeof adopted.firstBook === "string" && adopted.firstBook.length > 0, String(adopted.firstBook));
  check("progress from device one carried over", adopted.firstChapterDone);
  check("sync status is synced", adopted.status === "synced", adopted.status);

  const renderedDays = await page2.locator(".calendar-grid .day-cell").count();
  check("calendar re-rendered after adopting", renderedDays > 0, String(renderedDays));

  check("no uncaught JavaScript errors", pageErrors.length === 0, pageErrors.join(" | "));
} finally {
  await browser.close();
  server.kill();
}

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nsigned-in smoke test passed");
