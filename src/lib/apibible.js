// ============================================================================
// apibible.js
// ----------------------------------------------------------------------------
// Client for the American Bible Society API.Bible REST service
// Endpoint: https://rest.api.bible (or https://api.scripture.api.bible)
// ============================================================================

import { BOOK_NAMES } from "./bibleBooks";

const BASE_URL = "https://rest.api.bible/v1";
const FALLBACK_URL = "https://api.scripture.api.bible/v1";

export const API_BIBLE_TRANSLATIONS = [
  {
    id: "78a9f6124f344018-01",
    label: "New International Version 2011 (NIV)",
    shortName: "NIV",
    provider: "apibible"
  },
  {
    id: "d6e14a625393b4da-01",
    label: "New Living Translation (NLT)",
    shortName: "NLT",
    provider: "apibible"
  },
  {
    id: "43e315b442a7c862-01",
    label: "New Living Translation, Anglicised (NLT-UK)",
    shortName: "NLT-UK",
    provider: "apibible"
  },
  {
    id: "b907c8622b59a1f7-01",
    label: "New Living Translation Catholic Edition (NLT-CE)",
    shortName: "NLT-CE",
    provider: "apibible"
  },
  {
    id: "a556c5305ee15c3f-01",
    label: "Christian Standard Bible (CSB)",
    shortName: "CSB",
    provider: "apibible"
  }
];

export const STANDARD_CHAPTER_COUNTS = {
  GEN: 50, EXO: 40, LEV: 27, NUM: 36, DEU: 34, JOS: 24, JDG: 21, RUT: 4,
  "1SA": 31, "2SA": 24, "1KI": 22, "2KI": 25, "1CH": 29, "2CH": 36, EZR: 10,
  NEH: 13, EST: 10, JOB: 42, PSA: 150, PRO: 31, ECC: 12, SNG: 8, ISA: 66,
  JER: 52, LAM: 5, EZK: 48, DAN: 12, HOS: 14, JOL: 3, AMO: 9, OBA: 1,
  JON: 4, MIC: 7, NAM: 3, HAB: 3, ZEP: 3, HAG: 2, ZEC: 14, MAL: 4,
  MAT: 28, MRK: 16, LUK: 24, JHN: 21, ACT: 28, ROM: 16, "1CO": 16, "2CO": 13,
  GAL: 6, EPH: 6, PHP: 4, COL: 4, "1TH": 5, "2TH": 3, "1TI": 6, "2TI": 4,
  TIT: 3, PHM: 1, HEB: 13, JAS: 5, "1PE": 5, "2PE": 3, "1JN": 5, "2JN": 1,
  "3JN": 1, JUD: 1, REV: 22
};

export function isApiBible(translationId) {
  if (!translationId) return false;
  const clean = String(translationId).replace(/^ab-/, "");
  return (
    API_BIBLE_TRANSLATIONS.some((t) => t.id === clean) ||
    /^[a-f0-9]{16}-\d{2}$/i.test(clean)
  );
}

function cleanBibleId(id) {
  return String(id).replace(/^ab-/, "");
}

async function fetchApiBible(endpoint) {
  const apiKey = import.meta.env.VITE_API_BIBLE_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing API.Bible key. Please set VITE_API_BIBLE_KEY in .env.local or Vercel Environment Variables."
    );
  }

  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    const res = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      headers: { "api-key": apiKey }
    });
    if (res.ok) return await res.json();
  } catch {
    // If rest.api.bible network error, try fallback url
  }

  const fallbackRes = await fetch(`${FALLBACK_URL}${cleanEndpoint}`, {
    headers: { "api-key": apiKey }
  });
  if (!fallbackRes.ok) {
    throw new Error(`API.Bible request failed (${fallbackRes.status}): ${cleanEndpoint}`);
  }
  return await fallbackRes.json();
}

export function listTranslations() {
  return API_BIBLE_TRANSLATIONS;
}

export async function listBooks(bibleId) {
  const id = cleanBibleId(bibleId);
  try {
    const data = await fetchApiBible(`/bibles/${id}/books?include-chapters=true`);
    const books = data.data || [];
    return books.map((b, index) => {
      let count = 0;
      if (Array.isArray(b.chapters)) {
        count = b.chapters.filter(
          (ch) => ch.number !== "intro" && !isNaN(Number(ch.number))
        ).length;
      }
      if (!count && STANDARD_CHAPTER_COUNTS[b.id]) {
        count = STANDARD_CHAPTER_COUNTS[b.id];
      }
      return {
        id: b.id,
        name: b.name || BOOK_NAMES[b.id] || b.id,
        commonName: b.name || BOOK_NAMES[b.id] || b.id,
        order: index + 1,
        numberOfChapters: count || 1
      };
    });
  } catch (err) {
    // Fallback if books endpoint fails or network error
    const keys = Object.keys(BOOK_NAMES);
    return keys.map((key, i) => ({
      id: key,
      name: BOOK_NAMES[key],
      commonName: BOOK_NAMES[key],
      order: i + 1,
      numberOfChapters: STANDARD_CHAPTER_COUNTS[key] || 1
    }));
  }
}

export async function getChapter(bibleId, bookId, chapterNumber) {
  const id = cleanBibleId(bibleId);
  const chapterId = `${bookId}.${chapterNumber}`;
  const data = await fetchApiBible(
    `/bibles/${id}/chapters/${chapterId}?content-type=html&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=true`
  );

  const rawHtml = data.data?.content || "";
  const copyright = data.data?.copyright || "Scripture provided via API.Bible";

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");

  const content = [];
  let currentVerse = null;
  let verseText = "";

  const pushVerse = () => {
    if (currentVerse !== null && verseText.trim().length > 0) {
      content.push({
        type: "verse",
        number: parseInt(currentVerse, 10),
        text: verseText.trim().replace(/\s+/g, " ")
      });
    }
    verseText = "";
  };

  function traverse(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (currentVerse !== null) {
        verseText += node.textContent;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      const className = node.className || "";

      // Skip footnotes and references
      if (
        className.includes("note") ||
        className.includes("footnote") ||
        className === "f" ||
        className === "x" ||
        (tagName === "sup" && className.includes("note"))
      ) {
        return;
      }

      // Check for verse marker
      const dataNumber = node.getAttribute("data-number");
      const isVerseMarker =
        className.includes("v") ||
        className.includes("verse-number") ||
        (dataNumber != null && /^\d+$/.test(node.textContent.trim()));

      if (isVerseMarker && (dataNumber || /^\d+$/.test(node.textContent.trim()))) {
        pushVerse();
        currentVerse = dataNumber || node.textContent.trim();
        return;
      }

      // Check for section headings
      if (
        tagName === "h1" ||
        tagName === "h2" ||
        tagName === "h3" ||
        className.includes("s1") ||
        className.includes("s2") ||
        className.includes("heading") ||
        className.includes("ms") ||
        className === "d" ||
        className === "s"
      ) {
        pushVerse();
        content.push({
          type: "heading",
          text: node.textContent.trim()
        });
        return;
      }

      if (tagName === "br" || className === "b") {
        if (verseText.length > 0) verseText += " ";
      }

      if (tagName === "p" || tagName === "div") {
        if (verseText.length > 0) verseText += " ";
      }

      node.childNodes.forEach(traverse);
    }
  }

  doc.body.childNodes.forEach(traverse);
  pushVerse();

  const bookName = BOOK_NAMES[bookId] || bookId;

  return {
    book: {
      name: bookName,
      commonName: bookName
    },
    chapter: {
      number: chapterNumber,
      content
    },
    attribution: copyright
  };
}
