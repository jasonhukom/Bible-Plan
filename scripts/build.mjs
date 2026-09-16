#!/usr/bin/env node
/**
 * Build / verify.
 *
 * The app is static: there is nothing to bundle or transpile, so "build"
 * means "prove the thing about to be deployed is not broken". It runs the
 * lint and the type check, then confirms every file the deployment needs is
 * present. Vercel runs this as its build command.
 *
 * Exits non-zero if anything fails — nothing here is allowed to pass by
 * being skipped.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/**
 * @param {string} label
 * @param {string} command
 * @param {string[]} args
 */
function run(label, command, args) {
  process.stdout.write(`\n▸ ${label}\n`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) {
    console.error(`\n${label} failed.`);
    process.exit(result.status === null ? 1 : result.status);
  }
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

run("lint", process.execPath, [join(ROOT, "scripts", "lint.mjs")]);
// Via the npm script rather than a direct binary path, so tsc resolves the
// same way it does for `npm run typecheck` — from node_modules/.bin on a
// deployment, or from a global install on a developer's machine.
run("typecheck", npm, ["run", "--silent", "typecheck"]);

process.stdout.write("\n▸ verify deployable files\n");

const REQUIRED = [
  "index.html",
  "style.css",
  "script.js",
  "quotes-data.js",
  "supabase-client.js",
  "auth.js",
  "data.js",
  "cloud-sync.js",
  "account-ui.js",
  "api/config.js",
  "supabase/schema.sql",
  ".env.example"
];

const missing = REQUIRED.filter((file) => !existsSync(join(ROOT, file)));
if (missing.length) {
  console.error(`missing required file(s): ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`all ${REQUIRED.length} required files present`);
console.log("\nbuild ok");
