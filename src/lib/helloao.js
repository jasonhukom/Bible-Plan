// ============================================================================
// helloao.js
// ----------------------------------------------------------------------------
// Thin client for the Free Use Bible API (https://bible.helloao.org).
// No API key, no usage limits -- it's a set of static, CDN-hosted JSON files.
//
// We use the "simplified" chapter format: each verse is a single string
// (instead of a list of formatted content pieces), which is exactly what a
// tap-to-save verse UI needs. See:
// https://bible.helloao.org/docs/reference/translations/simplified.html
// ============================================================================

const BASE_URL = "https://bible.helloao.org/api";

/** In-memory cache -- translations/books/chapters don't change at runtime. */
const cache = new Map();

async function getJson(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Bible API request failed (${res.status}): ${url}`);
  }
  const data = await res.json();
  cache.set(url, data);
  return data;
}

/**
 * NIV isn't distributed by this API -- it's a commercially-licensed
 * translation (Biblica/Zondervan), and this API only carries translations
 * with no copyright restrictions. BSB (Berean Standard Bible) is the
 * closest widely-used free/open equivalent: a modern, readable,
 * word-for-word-leaning translation, which is why it's the app default.
 */
export const DEFAULT_TRANSLATION_ID = "BSB";

/** English names we'd like to feature in the translation picker, in
 * priority order. Matched against listTranslations() at runtime rather
 * than hardcoding ids, since a translation's id isn't always predictable
 * from its name (only BSB's id is confirmed stable: "BSB"). */
const FEATURED_ENGLISH_NAMES = [
  "Berean Standard Bible",
  "World English Bible",
  "King James Version",
  "American Standard Version",
  "New Heart English Bible",
  "Free Bible Version"
];

export function listTranslations() {
  return getJson(`${BASE_URL}/available_translations.json`).then(
    (data) => data.translations
  );
}

/**
 * Picks a friendly subset of English translations for the picker dropdown,
 * instead of showing all 1000+ translations in every language.
 * @returns {Promise<Array<{id: string, label: string}>>}
 */
export async function listFeaturedTranslations() {
  const all = await listTranslations();
  const byName = new Map(all.map((t) => [t.englishName, t]));
  const featured = FEATURED_ENGLISH_NAMES.map((name) => byName.get(name)).filter(
    Boolean
  );
  // Always make sure the default is present even if the name match above
  // ever fails for some reason (e.g. HelloAO renames it).
  if (!featured.some((t) => t.id === DEFAULT_TRANSLATION_ID)) {
    const bsb = all.find((t) => t.id === DEFAULT_TRANSLATION_ID);
    if (bsb) featured.unshift(bsb);
  }
  return featured.map((t) => ({
    id: t.id,
    label: t.shortName ? `${t.englishName} (${t.shortName})` : t.englishName
  }));
}

/**
 * @param {string} translationId
 * @returns {Promise<Array<{id: string, name: string, commonName: string, order: number, numberOfChapters: number}>>}
 */
export function listBooks(translationId) {
  return getJson(`${BASE_URL}/${translationId}/books.json`).then(
    (data) => data.books
  );
}

/**
 * Fetches one chapter in the simplified format.
 * @param {string} translationId
 * @param {string} bookId
 * @param {number} chapterNumber
 */
export function getChapter(translationId, bookId, chapterNumber) {
  return getJson(
    `${BASE_URL}/${translationId}/${bookId}/${chapterNumber}.simple.json`
  );
}
