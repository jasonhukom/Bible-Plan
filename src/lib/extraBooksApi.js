// ============================================================================
// extraBooksApi.js
// ----------------------------------------------------------------------------
// Manages toggle states, caching, and source resolution for extra biblical books:
// 1. Checks selected translation
// 2. Checks self-hosted static JSON (/extra-books/{book}/{chapter}.json)
// 3. Fallback with graceful "coming soon" support for unpopulated books
// ============================================================================

import { EXTRA_BOOKS, EXTRA_COLLECTIONS } from "./extraBooksRegistry";

const TOGGLES_STORAGE_KEY = "bible-additional-books-toggles";
const CACHE_PREFIX = "bible-extra-chapter-v1-";

// Default state: all five toggles OFF
export const DEFAULT_EXTRA_TOGGLES = {
  DC: false,
  ORT: false,
  ETH: false,
  PSE: false,
  NTA: false
};

/**
 * Retrieves persisted collection toggle states.
 * Defaults all 5 to false.
 */
export function getExtraBooksToggles() {
  try {
    const raw = localStorage.getItem(TOGGLES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_EXTRA_TOGGLES };
    const parsed = JSON.parse(raw);
    return {
      DC: Boolean(parsed.DC),
      ORT: Boolean(parsed.ORT),
      ETH: Boolean(parsed.ETH),
      PSE: Boolean(parsed.PSE),
      NTA: Boolean(parsed.NTA)
    };
  } catch {
    return { ...DEFAULT_EXTRA_TOGGLES };
  }
}

/**
 * Persists collection toggle states and dispatches a change event.
 */
export function setExtraBooksToggles(toggles) {
  const safeToggles = {
    DC: Boolean(toggles?.DC),
    ORT: Boolean(toggles?.ORT),
    ETH: Boolean(toggles?.ETH),
    PSE: Boolean(toggles?.PSE),
    NTA: Boolean(toggles?.NTA)
  };
  try {
    localStorage.setItem(TOGGLES_STORAGE_KEY, JSON.stringify(safeToggles));
  } catch {}
  window.dispatchEvent(
    new CustomEvent("bible-extra-books-changed", { detail: safeToggles })
  );
  return safeToggles;
}

/**
 * Checks if a bookId is registered in the extra books registry.
 */
export function isExtraBook(bookId) {
  if (!bookId) return false;
  const upper = String(bookId).toUpperCase();
  return EXTRA_BOOKS.some((b) => b.id === upper);
}

/**
 * Gets metadata for an extra book.
 */
export function getExtraBookMeta(bookId) {
  if (!bookId) return null;
  const upper = String(bookId).toUpperCase();
  return EXTRA_BOOKS.find((b) => b.id === upper) || null;
}

/**
 * In-memory runtime cache for resolved chapters
 */
const chapterMemoryCache = new Map();

/**
 * Resolves chapter content for an extra book with stale-while-revalidate & cache.
 */
export async function getExtraChapter(translationId, bookId, chapterNumber) {
  const bookMeta = getExtraBookMeta(bookId);
  if (!bookMeta) {
    throw new Error(`Book ${bookId} is not in the extra books registry.`);
  }

  const cacheKey = `${CACHE_PREFIX}${bookId}-${chapterNumber}`;

  // 1. Check memory cache
  if (chapterMemoryCache.has(cacheKey)) {
    return chapterMemoryCache.get(cacheKey);
  }

  // 2. Check localStorage cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      chapterMemoryCache.set(cacheKey, parsed);
      return parsed;
    }
  } catch {}

  // 3. Attempt to fetch static JSON from /extra-books/{bookId}/{chapterNumber}.json
  try {
    const res = await fetch(`/extra-books/${bookId}/${chapterNumber}.json`);
    if (res.ok) {
      const data = await res.json();
      chapterMemoryCache.set(cacheKey, data);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (err) {
    console.warn(`Local static fetch failed for ${bookId} ch ${chapterNumber}:`, err);
  }

  // 4. If text is not available yet, return graceful "Coming soon" state (never break reader)
  const comingSoonChapter = {
    translation: {
      id: "EXTRA",
      name: bookMeta.sourceName || "Public Domain Translation",
      shortName: "EXTRA",
      englishName: bookMeta.sourceName || "Public Domain Translation"
    },
    book: {
      id: bookMeta.id,
      translationId: "EXTRA",
      name: bookMeta.name,
      commonName: bookMeta.commonName,
      numberOfChapters: bookMeta.numberOfChapters || 1
    },
    chapter: {
      number: Number(chapterNumber),
      content: [
        {
          type: "heading",
          text: `${bookMeta.name} — Chapter ${chapterNumber}`
        },
        {
          type: "verse",
          number: 1,
          text: `This chapter is in the public domain pipeline and will be available soon. Source translation: ${bookMeta.sourceName}.`
        }
      ]
    },
    isComingSoon: true,
    sourceName: bookMeta.sourceName || "Public Domain Archive",
    attribution: `Source: ${bookMeta.sourceName}. We are actively cataloging public-domain translations for this collection.`
  };

  chapterMemoryCache.set(cacheKey, comingSoonChapter);
  return comingSoonChapter;
}
