#!/usr/bin/env node
/**
 * Automated i18n verification suite.
 *
 * Checks, for all 88 languages:
 *   1. every locale bundle exists and is valid JSON
 *   2. 100% key parity with the English reference bundle (no missing/extra keys)
 *   3. zero empty / whitespace-only string values
 *   4. valid LTR/RTL direction metadata
 *   5. a valid, unique Bible translation id for every language
 *
 * Exits 0 only when every check passes.
 */

import { readFile, readdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const I18N_DIR = join(ROOT, "src", "i18n");
const LOCALES_DIR = join(I18N_DIR, "locales");

const EXPECTED_LANGUAGE_COUNT = 88;
const MIN_KEY_COUNT = 20;
const ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{1,15}$/;

/** Sanity check: scripts in these languages must be declared RTL. */
const EXPECTED_RTL = new Set([
  "ar", "ur", "fa", "ps", "sd", "ku", "skr", "dcc", "ug", "he",
]);

const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

async function readJson(path) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

async function main() {
  console.log("Bible Plan i18n verification");
  console.log("============================");

  const languages = await readJson(join(I18N_DIR, "languages.json"));
  const translations = await readJson(join(I18N_DIR, "bibleTranslations.json"));
  const localeFiles = (await readdir(LOCALES_DIR)).filter((file) => file.endsWith(".json")).sort();

  if (!Array.isArray(languages)) fail("languages.json is not an array");
  if (!Array.isArray(translations)) fail("bibleTranslations.json is not an array");
  if (languages.length !== EXPECTED_LANGUAGE_COUNT) {
    fail(`Expected ${EXPECTED_LANGUAGE_COUNT} languages, found ${languages.length}`);
  }
  if (localeFiles.length !== EXPECTED_LANGUAGE_COUNT) {
    fail(`Expected ${EXPECTED_LANGUAGE_COUNT} locale files, found ${localeFiles.length}`);
  }

  const languageCodes = languages.map((language) => language?.code);
  const duplicateCodes = languageCodes.filter((code, index) => languageCodes.indexOf(code) !== index);
  if (duplicateCodes.length) fail(`Duplicate language codes: ${[...new Set(duplicateCodes)].join(", ")}`);

  const translationIds = translations.map((translation) => translation?.id);
  const duplicateIds = translationIds.filter((id, index) => translationIds.indexOf(id) !== index);
  if (duplicateIds.length) fail(`Duplicate Bible translation ids: ${[...new Set(duplicateIds)].join(", ")}`);

  const translationById = new Map(translations.map((translation) => [translation?.id, translation]));

  let ltrCount = 0;
  let rtlCount = 0;

  for (const language of languages) {
    const code = language?.code ?? "<unknown>";
    if (!isNonEmptyString(language?.englishName)) fail(`${code}: missing englishName`);
    if (!isNonEmptyString(language?.nativeName)) fail(`${code}: missing nativeName`);
    if (language?.dir === "ltr") ltrCount += 1;
    else if (language?.dir === "rtl") rtlCount += 1;
    else fail(`${code}: invalid dir '${language?.dir}' (expected ltr or rtl)`);

    if (EXPECTED_RTL.has(code) && language?.dir !== "rtl") {
      fail(`${code}: expected rtl direction, got '${language?.dir}'`);
    }

    const bibleId = language?.bibleTranslationId;
    if (!isNonEmptyString(bibleId) || !ID_PATTERN.test(bibleId)) {
      fail(`${code}: invalid Bible translation id '${bibleId}'`);
    } else {
      const translation = translationById.get(bibleId);
      if (!translation) fail(`${code}: Bible translation '${bibleId}' is not in the catalog`);
      else {
        if (!isNonEmptyString(translation.name)) fail(`${code}: Bible translation '${bibleId}' has no name`);
        if (translation.language !== code) {
          fail(`${code}: Bible translation '${bibleId}' is tagged '${translation.language}'`);
        }
      }
    }
  }

  const referencePath = join(LOCALES_DIR, "en.json");
  let referenceKeys = [];
  try {
    const reference = await readJson(referencePath);
    if (!isPlainObject(reference)) fail("en.json is not a dictionary");
    else {
      referenceKeys = Object.keys(reference);
      if (referenceKeys.length < MIN_KEY_COUNT) {
        fail(`English reference has only ${referenceKeys.length} keys (expected >= ${MIN_KEY_COUNT})`);
      }
    }
  } catch (error) {
    fail(`Could not read en.json: ${error.message}`);
  }

  const referenceSet = new Set(referenceKeys);
  let keyChecks = 0;
  let valueChecks = 0;

  for (const file of localeFiles) {
    const code = file.replace(/\.json$/, "");
    let dictionary;
    try {
      dictionary = await readJson(join(LOCALES_DIR, file));
    } catch (error) {
      fail(`${code}: invalid JSON (${error.message})`);
      continue;
    }
    if (!isPlainObject(dictionary)) {
      fail(`${code}: bundle is not a dictionary`);
      continue;
    }

    const keys = Object.keys(dictionary);
    const missing = referenceKeys.filter((key) => !Object.prototype.hasOwnProperty.call(dictionary, key));
    const extra = keys.filter((key) => !referenceSet.has(key));
    if (missing.length) fail(`${code}: ${missing.length} missing key(s): ${missing.join(", ")}`);
    if (extra.length) fail(`${code}: ${extra.length} extra key(s): ${extra.join(", ")}`);
    keyChecks += 1;

    for (const key of referenceKeys) {
      if (!isNonEmptyString(dictionary[key])) {
        fail(`${code}.${key}: empty or non-string value`);
      } else {
        valueChecks += 1;
      }
    }
  }

  const localeCodes = localeFiles.map((file) => file.replace(/\.json$/, ""));
  const missingLocaleForLanguage = languageCodes.filter((code) => !localeCodes.includes(code));
  const languageForMissingLocale = localeCodes.filter((code) => !languageCodes.includes(code));
  if (missingLocaleForLanguage.length) {
    fail(`No locale file for: ${missingLocaleForLanguage.join(", ")}`);
  }
  if (languageForMissingLocale.length) {
    fail(`No language metadata for: ${languageForMissingLocale.join(", ")}`);
  }

  if (rtlCount === 0) fail("No RTL languages were detected");
  notes.push(`${ltrCount} LTR / ${rtlCount} RTL languages`);
  notes.push(`${referenceKeys.length} keys per bundle`);
  notes.push(`${keyChecks} bundles checked for key parity`);
  notes.push(`${valueChecks} non-empty values verified`);

  console.log("");
  for (const note of notes) console.log(`  - ${note}`);
  console.log("");

  if (failures.length) {
    console.error(`FAILED with ${failures.length} problem(s):`);
    for (const problem of failures.slice(0, 200)) console.error(`  x ${problem}`);
    if (failures.length > 200) console.error(`  ... and ${failures.length - 200} more`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `PASS - all ${EXPECTED_LANGUAGE_COUNT} languages at 100% key parity, non-empty values, valid direction and Bible pairing.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
