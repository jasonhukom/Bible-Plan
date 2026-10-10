// ============================================================================
// youversion.js
// ----------------------------------------------------------------------------
// Client for the YouVersion Platform API (https://api.youversion.com/v1)
// ============================================================================

import { ApiClient } from "@youversion/platform-core";

const API_KEY = "S6kifuJ2rYUWbGGIGKwXOdTJVyK9aFnZFyAK73XrLmwyTGJd";
export const DEFAULT_TRANSLATION_ID = "3034"; 

export const TRANSLATION_NAMES = {
  "3034": "BSB",
  "1": "KJV",
  "12": "ASV",
  "206": "WEB"
};
const apiClient = new ApiClient({
  appKey: API_KEY,
});

async function fetchYv(endpoint) {
  const path = endpoint.startsWith('/') ? `/v1${endpoint}` : `/v1/${endpoint}`;
  return apiClient.get(path);
}

export async function listFeaturedTranslations() {
  const res = await fetchYv("/bibles?language_ranges=en");
  const bibles = res.data || [];
  
  // Feature common English translations by their YouVersion IDs
  // 3034 = BSB, 1 = KJV, 12 = ASV, 206 = WEB
  const FEATURED_IDS = [3034, 206, 1, 12]; 
  
  const featured = [];
  for (const id of FEATURED_IDS) {
    const b = bibles.find(t => t.id === id || String(t.id) === String(id));
    if (b) featured.push(b);
  }
  
  // Ensure default is always present
  if (!featured.some(t => String(t.id) === DEFAULT_TRANSLATION_ID)) {
    const bsb = bibles.find(t => String(t.id) === DEFAULT_TRANSLATION_ID);
    if (bsb) featured.unshift(bsb);
  }
  
  return featured.map(t => ({
    id: String(t.id),
    label: t.abbreviation || t.title
  }));
}

export async function listBooks(translationId) {
  const res = await fetchYv(`/bibles/${translationId}/books`);
  return (res.data || []).map(b => {
    // Some books have an Intro chapter or chapter 0. Count valid chapters.
    let count = b.chapters ? b.chapters.length : 0;
    if (b.chapters && b.chapters.length > 0 && (b.chapters[0].title === "Intro" || b.chapters[0].title === "0")) {
      count -= 1;
    }
    return {
      id: b.id,
      name: b.title,
      commonName: b.title,
      order: 0,
      numberOfChapters: count
    };
  });
}

export async function getChapter(translationId, bookId, chapterNumber) {
  const data = await fetchYv(`/bibles/${translationId}/passages/${bookId}.${chapterNumber}?format=html`);
  const html = data.content || "";
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  
  const content = [];
  let currentVerse = null;
  let verseText = "";
  
  const pushVerse = () => {
    if (currentVerse !== null && verseText.trim().length > 0) {
      content.push({
        type: "verse",
        number: parseInt(currentVerse, 10),
        text: verseText.trim().replace(/\s+/g, ' ')
      });
    }
    verseText = "";
  };
  
  function traverse(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      verseText += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      const className = node.className || "";
      
      if (className.includes("yv-v ") || className === "yv-v") {
        pushVerse();
        currentVerse = node.getAttribute("v");
      } else if (className.includes("yv-vlbl") || className === "yv-vlbl") {
        return; // skip the verse number label
      } else if (tagName === "br") {
        verseText += " ";
      } else if (tagName === "div" && className.includes("p")) {
        if (verseText.length > 0) verseText += " ";
        node.childNodes.forEach(traverse);
      } else if (tagName === "h1" || tagName === "h2" || tagName === "h3" || className.includes("heading")) {
        pushVerse();
        content.push({
          type: "heading",
          text: node.textContent.trim()
        });
      } else {
        node.childNodes.forEach(traverse);
      }
    }
  }
  
  doc.body.childNodes.forEach(traverse);
  pushVerse();
  
  const books = await listBooks(translationId);
  const book = books.find(b => String(b.id) === String(bookId)) || { name: bookId, commonName: bookId };
  
  // Fetch copyright attribution
  const versionData = await fetchYv(`/bibles/${translationId}`);
  const copyright = versionData.data?.copyright || "Public Domain";
  
  return {
    book: {
      name: book.name,
      commonName: book.commonName
    },
    chapter: {
      number: chapterNumber,
      content: content
    },
    attribution: copyright
  };
}
