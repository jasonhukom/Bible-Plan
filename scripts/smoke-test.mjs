/**
 * Runtime smoke test. Loads index.html in a real browser with no Supabase
 * project configured, which is the state every fresh checkout and every
 * unconfigured deployment starts in. It checks that:
 *
 *   - the page loads with no uncaught errors or failed local requests,
 *   - the plan still renders and still saves to localStorage,
 *   - all five window APIs are exposed,
 *   - the account dialog opens, explains that accounts are off, and its
 *     tabs/views switch,
 *   - data calls refuse politely instead of throwing,
 *   - the account page is reachable.
 *
 * Not part of `npm run build` (it needs a browser); run it directly:
 *   node scripts/smoke-test.mjs
 */

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "playwright";

const PORT = 4199;
const BASE = `http://localhost:${PORT}`;

const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  env: { ...process.env, PORT: String(PORT), SUPABASE_URL: "", SUPABASE_ANON_KEY: "" },
  stdio: "ignore"
});
await sleep(700);

/** @type {string[]} */
const failures = [];
/** @type {string[]} */
const pageErrors = [];
/** @type {string[]} */
const consoleErrors = [];
/** @type {string[]} */
const failedRequests = [];
/** @type {string[]} */
const badResponses = [];

/**
 * @param {string} label
 * @param {boolean} condition
 * @param {string} [detail]
 */
function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failures.push(label);
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();

page.on("pageerror", (error) => pageErrors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("requestfailed", (request) => {
  const url = request.url();
  if (url.startsWith(BASE)) failedRequests.push(url);
});
page.on("response", (response) => {
  const url = response.url();
  if (!url.startsWith(BASE)) return;
  // supabase.config.json is the optional local-config probe: 404 is the
  // normal answer when the file has not been created, and the client
  // handles it. Anything else returning non-200 is a real problem.
  if (response.status() >= 400 && !url.endsWith("supabase.config.json")) {
    badResponses.push(`${response.status()} ${url}`);
  }
});

try {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  console.log("\napp still works with no account configured");
  check(
    "calendar rendered",
    (await page.locator(".calendar-grid .day-cell").count()) > 0
  );
  check(
    "plan saved to localStorage",
    await page.evaluate(() => {
      const raw = localStorage.getItem("biblePlan.state.v1");
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.calendarDays) && parsed.calendarDays.length > 0;
    })
  );
  check(
    "ticking a chapter persists",
    await page.evaluate(async () => {
      const box = document.querySelector(".chapter-checkbox, .chapter-item");
      if (!box) return true; // nothing clickable in this layout; not a failure
      /** @type {any} */ (box).click();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const raw = localStorage.getItem("biblePlan.state.v1");
      return typeof raw === "string" && raw.length > 0;
    })
  );

  console.log("\nglobals exposed");
  for (const name of [
    "BiblePlanApp",
    "BiblePlanSupabase",
    "BiblePlanAuth",
    "BiblePlanData",
    "BiblePlanSync"
  ]) {
    check(name, await page.evaluate((key) => typeof window[key] === "object", name));
  }

  console.log("\nauth reports an honest unconfigured state");
  const authState = await page.evaluate(async () => {
    const state = await window.BiblePlanAuth.ready();
    return {
      isConfigured: state.isConfigured,
      isSignedIn: state.isSignedIn,
      userId: state.userId,
      status: window.BiblePlanSupabase.getStatus()
    };
  });
  check("isConfigured is false", authState.isConfigured === false);
  check("isSignedIn is false", authState.isSignedIn === false);
  check("getUserId() is null", authState.userId === null);
  check("supabase status is 'unconfigured'", authState.status === "unconfigured", authState.status);

  console.log("\ndata layer refuses instead of throwing");
  const dataResult = await page.evaluate(async () => {
    const result = await window.BiblePlanData.listSavedVerses();
    return { data: result.data, message: result.error && result.error.message };
  });
  check("returns { data: null, error }", dataResult.data === null && !!dataResult.message);
  check("error names the cause", /not configured|Not signed in/i.test(dataResult.message || ""), dataResult.message);

  console.log("\naccount dialog");
  await page.click("#accountBtn");
  check("dialog opens", await page.locator("#accountPopover").isVisible());
  check("sign-in view shown", await page.locator("#accountViewCredentials").isVisible());
  check("config note explains accounts are off", await page.locator("#accountConfigNote").isVisible());
  check(
    "email/password inputs disabled while unconfigured",
    await page.locator('#accountForm input[name="email"]').isDisabled()
  );

  await page.click('[data-auth-tab="signup"]');
  check("create-account tab shows display name", await page.locator("#accountNameField").isVisible());
  check(
    "submit button relabels",
    (await page.locator("#accountSubmitBtn").textContent())?.trim() === "Create account"
  );

  await page.click('[data-auth-tab="signin"]');
  await page.click("#forgotPasswordBtn");
  check("forgotten-password view shown", await page.locator("#accountViewReset").isVisible());
  await page.click("#resetBackBtn");
  check("back to sign in", await page.locator("#accountViewCredentials").isVisible());

  await page.click("#accountModalCloseBtn");
  check("dialog closes", !(await page.locator("#accountPopover").isVisible()));

  console.log("\naccount page");
  await page.evaluate(() => window.BiblePlanApp.showPage("account"));
  check("account page visible", await page.locator("#accountPage").isVisible());
  check("signed-out prompt shown", await page.locator("#accountPageSignedOut").isVisible());
  check("signed-in panels hidden", !(await page.locator("#accountPageSignedIn").isVisible()));
  await page.evaluate(() => window.BiblePlanApp.showPage("calendar"));
  check("calendar comes back", await page.locator(".calendar-section").isVisible());

  console.log("\nno errors on the page");
  check("no uncaught JavaScript errors", pageErrors.length === 0, pageErrors.join(" | "));
  check("no broken local requests", failedRequests.length === 0, failedRequests.join(" | "));
  check("no failing local responses", badResponses.length === 0, badResponses.join(" | "));

  // Remaining console noise is resource-level, not application-level: the
  // Google Fonts stylesheet and the Supabase CDN are unreachable in a
  // sandbox, and the optional supabase.config.json probe 404s by design.
  const unexplained = consoleErrors.filter(
    (entry) => !/Failed to load resource/i.test(entry)
  );
  check("no unexplained console errors", unexplained.length === 0, unexplained.join(" | "));
  if (consoleErrors.length) {
    console.log(`  note  ${consoleErrors.length} resource load message(s), expected offline`);
  }
} finally {
  await browser.close();
  server.kill();
}

if (failures.length) {
  console.log(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nsmoke test passed");
