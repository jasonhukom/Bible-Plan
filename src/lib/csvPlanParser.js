// ============================================================================
// csvPlanParser.js
// ----------------------------------------------------------------------------
// Pure parser and mapper for the Bible-CSV reading plan submodule files.
// Zero browser/Vite/Node-specific imports so it runs identically in both Vite
// builds and Node unit tests.
// ============================================================================

import { BOOK_NAMES, classifyBook } from "./bibleBooks.js";

/** Maps short book labels used in Bible-CSV to standard USFM book IDs. */
export const CSV_BOOK_TOKEN_TO_ID = {
  // Old Testament
  "Gen": "GEN",
  "Ex": "EXO",
  "Lev": "LEV",
  "Num": "NUM",
  "Deut": "DEU",
  "Josh": "JOS",
  "Jdg": "JDG",
  "Rut": "RUT",
  "1 Sa": "1SA",
  "2 Sa": "2SA",
  "1 Kgs": "1KI",
  "2 Kgs": "2KI",
  "1 Chr": "1CH",
  "2 Chr": "2CH",
  "Ezr": "EZR",
  "Neh": "NEH",
  "Est": "EST",
  "Job": "JOB",
  "Ps": "PSA",
  "Pro": "PRO",
  "Ecc": "ECC",
  "Sos": "SNG",
  "Isa": "ISA",
  "Jer": "JER",
  "Lam": "LAM",
  "Eze": "EZK",
  "Dan": "DAN",
  "Hos": "HOS",
  "Joe": "JOL",
  "Amo": "AMO",
  "Oba": "OBA",
  "Jon": "JON",
  "Mic": "MIC",
  "Nah": "NAM",
  "Hab": "HAB",
  "Zep": "ZEP",
  "Hag": "HAG",
  "Zec": "ZEC",
  "Mal": "MAL",

  // New Testament
  "Mat": "MAT",
  "Mk": "MRK",
  "Luk": "LUK",
  "John": "JHN",
  "Acts": "ACT",
  "Rom": "ROM",
  "1 Co": "1CO",
  "2 Co": "2CO",
  "Gal": "GAL",
  "Eph": "EPH",
  "Phil": "PHP",
  "Col": "COL",
  "1 Th": "1TH",
  "2 Th": "2TH",
  "1 Ti": "1TI",
  "2 Ti": "2TI",
  "Tit": "TIT",
  "Phm": "PHM",
  "Phlm": "PHM",
  "Heb": "HEB",
  "Jam": "JAS",
  "1 Pe": "1PE",
  "2 Pe": "2PE",
  "1 Jn": "1JN",
  "2 Jn": "2JN",
  "3 Jn": "3JN",
  "Jude": "JUD",
  "Rev": "REV",

  // Deuterocanonical / Orthodox (present in *-deuterocanonical.csv)
  "Tob": "TOB",
  "Jud": "JDT",
  "AddEst": "ESG",
  "1 Mac": "1MA",
  "2 Mac": "2MA",
  "Wis": "WIS",
  "Sir": "SIR",
  "Bar": "BAR",
  "LetJer": "LJE",
  "S3y": "S3Y",
  "Sus": "SUS",
  "Bel": "BEL",
  "1 Es": "1ES",
  "Man": "MAN",
  "3 Mac": "3MA",
  "4 Mac": "4MA",
  "2 Esd": "2ES"
};

const EXTRA_BOOK_NAMES = {
  TOB: "Tobit",
  JDT: "Judith",
  ESG: "Additions to Esther",
  "1MA": "1 Maccabees",
  "2MA": "2 Maccabees",
  WIS: "Wisdom of Solomon",
  SIR: "Sirach",
  BAR: "Baruch",
  LJE: "Letter of Jeremiah",
  S3Y: "Prayer of Azariah",
  SUS: "Susanna",
  BEL: "Bel and the Dragon",
  "1ES": "1 Esdras",
  MAN: "Prayer of Manasseh",
  PS2: "Psalm 151",
  "3MA": "3 Maccabees",
  "4MA": "4 Maccabees",
  "2ES": "2 Esdras"
};

export function resolveBookDisplayName(bookId) {
  return BOOK_NAMES[bookId] || EXTRA_BOOK_NAMES[bookId] || bookId;
}

export function addDaysToDateString(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/**
 * Selects the matching Bible-CSV filename for the given plan options.
 * @param {{ orderMode?: string, chronological?: boolean, dailyPsalms?: boolean, dailyProverbs?: boolean }} opts
 * @returns {string}
 */
export function getCsvPlanFilename({
  orderMode = "overlap",
  chronological = false,
  dailyPsalms = false,
  dailyProverbs = false
} = {}) {
  // Date-balanced and wisdom presets are intentionally not used.  Every plan
  // is spread from the single shortened chronological book chronology.
  return "order-chronological.csv";
}

/**
 * Parses one semicolon-separated passage segment (e.g. "Gen 1-2", "Ps 11, 59",
 * "Jude", or bare "Ps" representing Psalm 151 in Orthodox plans) into chapter entries.
 * @param {string} part
 * @returns {Array<{ bookId: string, bookName: string, chapter: number, category: "ot"|"dc"|"nt" }>}
 */
export function parsePassageSegment(part) {
  const trimmed = String(part || "").trim();
  if (!trimmed) return [];

  // In Orthodox/DC CSVs, bare "Ps" without a chapter number denotes Psalm 151.
  if (trimmed === "Ps") {
    return [{ bookId: "PS2", bookName: resolveBookDisplayName("PS2"), chapter: 1, category: "dc" }];
  }

  const match = trimmed.match(/^(.+?)\s+(\d+(?:-\d+)?(?:\s*,\s*\d+(?:-\d+)?)*)$/);
  if (!match) {
    const bookId = CSV_BOOK_TOKEN_TO_ID[trimmed];
    if (!bookId) throw new Error(`Unknown book token in CSV plan: "${trimmed}"`);
    return [
      {
        bookId,
        bookName: resolveBookDisplayName(bookId),
        chapter: 1,
        category: classifyBook(bookId)
      }
    ];
  }

  const token = match[1].trim();
  const bookId = CSV_BOOK_TOKEN_TO_ID[token];
  if (!bookId) throw new Error(`Unknown book token in CSV plan: "${token}"`);

  const bookName = resolveBookDisplayName(bookId);
  const category = classifyBook(bookId);
  const entries = [];

  for (const seg of match[2].split(",")) {
    const rangeStr = seg.trim();
    if (!rangeStr) continue;
    if (rangeStr.includes("-")) {
      const [startStr, endStr] = rangeStr.split("-");
      const start = Number(startStr);
      const end = Number(endStr);
      for (let ch = start; ch <= end; ch++) {
        entries.push({ bookId, bookName, chapter: ch, category });
      }
    } else {
      entries.push({ bookId, bookName, chapter: Number(rangeStr), category });
    }
  }

  return entries;
}

/**
 * Parses a full Bible-CSV "Passage" cell such as "Gen 1-2; Luk 1; Ps 1; Pro 1".
 * @param {string} passageStr
 */
export function parsePassageCell(passageStr) {
  const entries = [];
  for (const part of String(passageStr || "").split(";")) {
    entries.push(...parsePassageSegment(part));
  }
  return entries;
}

/**
 * Parses a raw Bible-CSV file into schedule day objects anchored at `startDate`.
 * @param {string} csvText
 * @param {string} startDate YYYY-MM-DD
 * @returns {Array<{ dayIndex: number, date: string, entries: Array<{ bookId: string, bookName: string, chapter: number, category: "ot"|"dc"|"nt" }> }>}
 */
export function parseCsvPlanText(csvText, startDate) {
  const lines = String(csvText || "")
    .trim()
    .split(/\r?\n/);
  const days = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const match = line.match(/^"([^"]*)","([^"]*)"/);
    if (!match) continue;
    const dayIndex = days.length;
    days.push({
      dayIndex,
      date: addDaysToDateString(startDate, dayIndex),
      entries: parsePassageCell(match[2])
    });
  }

  return days;
}

/**
 * Extracts the ordered chapter stream from a chronological CSV so custom day
 * lengths, single-testament plans, and excluded-book onboarding plans follow
 * the exact same chronological sequence.
 * @param {string} csvText
 */
export function extractChronologicalStreams(csvText) {
  const parsedDays = parseCsvPlanText(csvText, "2026-01-01");
  const combined = [];
  const ot = [];
  const nt = [];

  for (const day of parsedDays) {
    for (const entry of day.entries) {
      combined.push(entry);
      if (entry.category === "ot") ot.push(entry);
      else if (entry.category === "nt") nt.push(entry);
    }
  }

  return { combined, ot, nt };
}
