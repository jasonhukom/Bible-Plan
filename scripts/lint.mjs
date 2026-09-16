#!/usr/bin/env node
/**
 * Repository lint.
 *
 * The project has no bundler and no framework, so rather than pull in a
 * toolchain it does not otherwise need, this checks the things that can
 * actually break this repository:
 *
 *   1. every JavaScript file parses (`node --check`),
 *   2. no secret is committed or hard-coded,
 *   3. the service-role key never appears in anything the browser loads,
 *   4. every <script src> in index.html points at a file that exists,
 *   5. .env files are ignored by git.
 *
 * Exits non-zero on any error. Run with `npm run lint`.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SKIP_DIRS = new Set(["node_modules", ".git", "dataset", ".vercel", "dist"]);

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const warnings = [];

/**
 * @param {string} dir
 * @param {(path: string) => boolean} accept
 * @returns {string[]}
 */
function walk(dir, accept) {
  /** @type {string[]} */
  const found = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      found.push(...walk(full, accept));
    } else if (accept(full)) {
      found.push(full);
    }
  }
  return found;
}

/* ------------------------------------------------------------------ */
/* 1. Syntax                                                           */
/* ------------------------------------------------------------------ */

const jsFiles = walk(ROOT, (path) => [".js", ".mjs"].includes(extname(path)));

for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    const detail = error.stderr ? String(error.stderr).trim() : String(error);
    errors.push(`syntax: ${relative(ROOT, file)}\n${detail}`);
  }
}

/* ------------------------------------------------------------------ */
/* 2 & 3. Secrets                                                      */
/* ------------------------------------------------------------------ */

const SECRET_PATTERNS = [
  {
    // A JWT, which is the shape of both the anon and the service-role key.
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./,
    message: "looks like a hard-coded JWT / API key"
  },
  {
    pattern: /\bsb_secret_[A-Za-z0-9_-]{10,}/,
    message: "looks like a Supabase secret key"
  },
  {
    pattern: /service_role/i,
    message: "mentions the service-role key, which must never reach the browser"
  }
];

// Files the browser downloads. The service-role rule is absolute here.
const CLIENT_FILES = jsFiles.filter((file) => {
  const rel = relative(ROOT, file);
  return !rel.startsWith("scripts") && !rel.startsWith("api") && !rel.includes("node_modules");
});

const scannable = [
  ...jsFiles,
  ...walk(ROOT, (path) => [".html", ".json"].includes(extname(path)))
].filter((file) => !relative(ROOT, file).startsWith("node_modules"));

for (const file of scannable) {
  const rel = relative(ROOT, file);
  // This lint file names the patterns it looks for; scanning itself would
  // always trip.
  if (rel === join("scripts", "lint.mjs")) continue;

  const source = readFileSync(file, "utf8");
  for (const { pattern, message } of SECRET_PATTERNS) {
    if (!pattern.test(source)) continue;

    const isClient = CLIENT_FILES.includes(file) || extname(file) === ".html";
    const mentionsOnlyInComment = /service_role/i.test(source) && !isClient;

    if (mentionsOnlyInComment && message.includes("service-role")) {
      continue; // server-side files and docs may name the variable
    }
    errors.push(`secret: ${rel} ${message}`);
  }
}

if (existsSync(join(ROOT, ".env"))) {
  errors.push("secret: a .env file exists in the repository root — it must never be committed");
}

const gitignore = existsSync(join(ROOT, ".gitignore"))
  ? readFileSync(join(ROOT, ".gitignore"), "utf8")
  : "";
for (const required of [".env", "supabase.config.json"]) {
  if (!gitignore.split(/\r?\n/).some((line) => line.trim() === required || line.trim() === `${required}*`)) {
    errors.push(`gitignore: "${required}" is not ignored`);
  }
}

/* ------------------------------------------------------------------ */
/* 4. Script tags resolve                                              */
/* ------------------------------------------------------------------ */

const indexPath = join(ROOT, "index.html");
if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, "utf8");
  const sources = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  for (const src of sources) {
    if (/^https?:\/\//.test(src)) continue;
    if (!existsSync(join(ROOT, src))) {
      errors.push(`html: index.html loads "${src}", which does not exist`);
    }
  }

  for (const id of ["accountPopover", "accountForm", "accountBtn", "accountPage"]) {
    if (!html.includes(`id="${id}"`)) {
      errors.push(`html: index.html is missing the #${id} element the account UI needs`);
    }
  }
}

/* ------------------------------------------------------------------ */

for (const warning of warnings) console.warn(`warning: ${warning}`);

if (errors.length) {
  console.error(`\nlint failed with ${errors.length} problem(s):\n`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`lint passed (${jsFiles.length} js files, ${scannable.length} files scanned for secrets)`);
