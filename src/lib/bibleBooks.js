// ============================================================================
// bibleBooks.js
// ----------------------------------------------------------------------------
// Classifies the books a HelloAO translation returns into three groups for
// the Bible page sidebar: Old Testament, Deuterocanonical, New Testament.
//
// The 66 protestant-canon ids below are the standard USFM book codes, which
// is what HelloAO uses (https://ubsicap.github.io/usfm/identification/books.html).
// Any book id a translation returns that ISN'T one of these 66 is treated as
// Deuterocanonical/Apocryphal -- this works across translations without
// having to hardcode every possible apocryphal book code (they vary a lot:
// TOB, JDT, WIS, SIR, BAR, 1MA, 2MA, 1ES, 2ES, MAN, PS2, SUS, BEL, ...).
// ============================================================================

export const OT_IDS = new Set([
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
  "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
  "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO",
  "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL"
]);

export const NT_IDS = new Set([
  "MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH",
  "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS",
  "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV"
]);

/**
 * @param {string} bookId
 * @returns {"ot" | "dc" | "nt"}
 */
export function classifyBook(bookId) {
  const id = (bookId || "").toUpperCase();
  if (OT_IDS.has(id)) return "ot";
  if (NT_IDS.has(id)) return "nt";
  return "dc";
}

export const GROUP_LABELS = {
  ot: "Old Testament",
  dc: "Deuterocanonical",
  nt: "New Testament"
};

/** Google-Calendar-style event colors per section, for the Plan page. */
export const GROUP_COLORS = {
  ot: { bg: "#5c2a22", text: "#f3c9bd" }, // red
  dc: { bg: "#26402a", text: "#bfe0c3" }, // green
  nt: { bg: "#1f3a5c", text: "#c3dcf5" } // blue
};

/** Display names for the 66 canonical books, keyed by USFM id -- used by
 * the Plan page's calendar cells, which only need a book's name (not its
 * full text), so this avoids a network fetch just to label a day. */
export const BOOK_NAMES = {
  GEN: "Genesis", EXO: "Exodus", LEV: "Leviticus", NUM: "Numbers",
  DEU: "Deuteronomy", JOS: "Joshua", JDG: "Judges", RUT: "Ruth",
  "1SA": "1 Samuel", "2SA": "2 Samuel", "1KI": "1 Kings", "2KI": "2 Kings",
  "1CH": "1 Chronicles", "2CH": "2 Chronicles", EZR: "Ezra", NEH: "Nehemiah",
  EST: "Esther", JOB: "Job", PSA: "Psalms", PRO: "Proverbs",
  ECC: "Ecclesiastes", SNG: "Song of Songs", ISA: "Isaiah", JER: "Jeremiah",
  LAM: "Lamentations", EZK: "Ezekiel", DAN: "Daniel", HOS: "Hosea",
  JOL: "Joel", AMO: "Amos", OBA: "Obadiah", JON: "Jonah", MIC: "Micah",
  NAM: "Nahum", HAB: "Habakkuk", ZEP: "Zephaniah", HAG: "Haggai",
  ZEC: "Zechariah", MAL: "Malachi",
  MAT: "Matthew", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts",
  ROM: "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians",
  GAL: "Galatians", EPH: "Ephesians", PHP: "Philippians", COL: "Colossians",
  "1TH": "1 Thessalonians", "2TH": "2 Thessalonians", "1TI": "1 Timothy",
  "2TI": "2 Timothy", TIT: "Titus", PHM: "Philemon", HEB: "Hebrews",
  JAS: "James", "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John",
  "2JN": "2 John", "3JN": "3 John", JUD: "Jude", REV: "Revelation"
};

/**
 * Splits a translation's book list (from /api/{translation}/books.json)
 * into the three groups, each kept in the order the API returned them.
 * @param {Array<{ id: string }>} books
 * @returns {{ ot: any[], dc: any[], nt: any[] }}
 */
export function groupBooks(books) {
  const groups = { ot: [], dc: [], nt: [] };
  for (const book of books || []) {
    groups[classifyBook(book.id)].push(book);
  }
  return groups;
}
