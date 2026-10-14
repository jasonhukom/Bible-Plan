import * as helloao from './helloao';
import * as youversion from './youversion';
import * as apibible from './apibible';

export const DEFAULT_TRANSLATION_ID = "BSB";

export function getPreferredTranslation() {
  return localStorage.getItem("bible-translation") || DEFAULT_TRANSLATION_ID;
}

export function setPreferredTranslation(translationId) {
  if (translationId) {
    localStorage.setItem("bible-translation", translationId);
    window.dispatchEvent(new CustomEvent("bible-translation-changed", { detail: translationId }));
  }
}

export function getTranslationShortName(translationObj, fallbackId = "") {
  if (translationObj?.shortName) {
    return translationObj.shortName;
  }
  const id = String(translationObj?.id || fallbackId || "");
  const label = translationObj?.label || "";

  // Common YouVersion IDs
  if (id === "yv-1" || id === "1") return "KJV";
  if (id === "yv-12" || id === "12") return "ASV";
  if (id === "yv-206" || id === "206") return "WEB";
  if (id === "yv-3034" || id === "3034") return "BSB";

  // Check for acronym in parentheses: "New International Version (NIV)" -> "NIV"
  // Exclude "(YouVersion)"
  const parenMatch = label.match(/\((?!YouVersion)([A-Za-z0-9\-]+)\)/i);
  if (parenMatch && parenMatch[1]) {
    return parenMatch[1].toUpperCase();
  }

  // Common names
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("berean standard")) return "BSB";
  if (lowerLabel.includes("king james")) return "KJV";
  if (lowerLabel.includes("world english")) return "WEB";
  if (lowerLabel.includes("american standard")) return "ASV";
  if (lowerLabel.includes("new international")) return "NIV";
  if (lowerLabel.includes("new living")) return "NLT";
  if (lowerLabel.includes("christian standard")) return "CSB";
  if (lowerLabel.includes("english standard")) return "ESV";

  // If ID is short alphanumeric (e.g. "BSB", "KJV", "CPDV")
  if (id.length <= 6 && !id.includes("-")) {
    return id.toUpperCase();
  }

  return id.length <= 8 ? id.toUpperCase() : "BIBLE";
}

export async function listTranslations() {
  // 1. API.Bible translations (NLT, NIV, CSB, etc.)
  const apiBibleList = apibible.listTranslations();

  // 2. Fetch HelloAO translations (open & free)
  let haoMapped = [];
  try {
    const haoAll = await helloao.listTranslations();
    const haoEng = haoAll.filter(t => t.language === 'eng' || t.englishName?.includes('English'));
    haoMapped = haoEng.map(t => ({
      id: t.id,
      label: t.englishName,
      provider: 'helloao'
    }));
  } catch (err) {
    console.error("Failed to load HelloAO translations:", err);
  }

  // 3. YouVersion translations
  const yvMapped = [
    { id: 'yv-1', label: 'King James Version (YouVersion)', provider: 'youversion' },
    { id: 'yv-12', label: 'American Standard Version (YouVersion)', provider: 'youversion' },
    { id: 'yv-206', label: 'World English Bible (YouVersion)', provider: 'youversion' },
    { id: 'yv-3034', label: 'Berean Standard Bible (YouVersion)', provider: 'youversion' },
  ];

  return [...apiBibleList, ...haoMapped, ...yvMapped];
}

export async function listBooks(translationId) {
  const tid = translationId || DEFAULT_TRANSLATION_ID;
  try {
    if (apibible.isApiBible(tid)) {
      return await apibible.listBooks(tid);
    } else if (tid.startsWith('yv-') || ['3034', '1', '12', '206', '111'].includes(String(tid))) {
      const cleanYv = String(tid).replace('yv-', '');
      return await youversion.listBooks(cleanYv);
    } else {
      return await helloao.listBooks(tid);
    }
  } catch (err) {
    console.warn(`listBooks failed for ${tid}, falling back to BSB`, err);
    try {
      return await helloao.listBooks("BSB");
    } catch {
      return await apibible.listBooks("fallback");
    }
  }
}

export async function getChapter(translationId, bookId, chapterNumber) {
  const tid = translationId || DEFAULT_TRANSLATION_ID;
  if (apibible.isApiBible(tid)) {
    return apibible.getChapter(tid, bookId, chapterNumber);
  } else if (tid.startsWith('yv-') || ['3034', '1', '12', '206', '111'].includes(String(tid))) {
    const cleanYv = String(tid).replace('yv-', '');
    return youversion.getChapter(cleanYv, bookId, chapterNumber);
  } else {
    return helloao.getChapter(tid, bookId, chapterNumber);
  }
}
