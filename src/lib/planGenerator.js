// ============================================================================
// planGenerator.js
// ----------------------------------------------------------------------------
// Generates a day-by-day list of chapter references from plan options:
//   - orderMode: "overlap" (OT & NT progress together) | "inorder" (sequential)
//   - chronological: follow historical chronological order from Bible-CSV
//   - dailyPsalms: append a daily Psalm (cycling 1-150) each day
//   - dailyProverbs: append a daily Proverb (cycling 1-31) each day
//
// When days === 365, both OT and NT are selected, and no books are excluded,
// schedules are loaded directly from the verse-balanced Bible-CSV submodule.
// Custom day counts, single-testament plans, and excluded books reuse the
// Bible-CSV chronological order (or live translation chapter counts) and chunk
// chapters evenly across the requested days.
// ============================================================================

import { listBooks } from "./bible.js";
import { classifyBook, BOOK_NAMES } from "./bibleBooks.js";
import {
  addDaysToDateString,
  extractChronologicalStreams,
  getCsvPlanFilename,
  parseCsvPlanText
} from "./csvPlanParser.js";
import { loadCsvPlanText } from "./csvLoader.js";

const GROUP_ORDER = ["ot", "nt"];

function todayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * @param {string} translationId
 * @param {string[]} groups e.g. ["ot", "nt"]
 * @param {string[]} excludeBooks e.g. ["GEN", "EXO"]
 * @returns {Promise<Record<string, Array<{bookId: string, bookName: string, chapter: number, category: string}>>>}
 */
async function buildGroupPools(translationId, groups, excludeBooks = []) {
  const books = await listBooks(translationId);
  const sorted = [...books].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const pools = {};
  for (const group of groups) pools[group] = [];
  for (const book of sorted) {
    if (excludeBooks.includes(book.id)) continue;
    const group = classifyBook(book.id);
    if (!groups.includes(group)) continue;
    const name = book.commonName || book.name || BOOK_NAMES[book.id] || book.id;
    for (let ch = 1; ch <= book.numberOfChapters; ch++) {
      pools[group].push({ bookId: book.id, bookName: name, chapter: ch, category: group });
    }
  }
  return pools;
}

/** Splits `list` into `days` chunks, spreading any remainder across the
 * earliest days rather than dumping it all on the last one. */
function chunkEvenly(list, days) {
  const chunks = [];
  const total = list.length;
  for (let i = 0; i < days; i++) {
    const start = Math.round((i * total) / days);
    const end = Math.round(((i + 1) * total) / days);
    chunks.push(list.slice(start, end));
  }
  return chunks;
}

/** Collapses a run of {bookId, chapter} entries into displayable refs,
 * merging consecutive chapters of the same book into one "start-end" ref
 * and starting a new ref wherever the book changes or a chapter is skipped
 * (so a day that's had chapters moved around by drag-and-drop still renders
 * as e.g. "Exodus 9" + "Exodus 20-21" instead of a false "9-21" range). */
export function groupIntoRefs(entries) {
  const refs = [];
  for (const entry of entries) {
    const last = refs[refs.length - 1];
    if (last && last.bookId === entry.bookId && entry.chapter === last.endChapter + 1) {
      last.endChapter = entry.chapter;
    } else {
      refs.push({
        bookId: entry.bookId,
        bookName: entry.bookName,
        category: entry.category,
        startChapter: entry.chapter,
        endChapter: entry.chapter
      });
    }
  }
  return refs;
}

function appendDailyWisdom(dayEntries, { dailyPsalms, dailyProverbs }) {
  if (!dailyPsalms && !dailyProverbs) return dayEntries;
  let psCounter = 0;
  let proCounter = 0;

  return dayEntries.map((entries) => {
    const next = [...entries];
    if (dailyPsalms) {
      const ch = (psCounter % 150) + 1;
      psCounter++;
      if (!next.some((e) => e.bookId === "PSA" && e.chapter === ch)) {
        next.push({
          bookId: "PSA",
          bookName: BOOK_NAMES.PSA,
          chapter: ch,
          category: "ot"
        });
      }
    }
    if (dailyProverbs) {
      const ch = (proCounter % 31) + 1;
      proCounter++;
      if (!next.some((e) => e.bookId === "PRO" && e.chapter === ch)) {
        next.push({
          bookId: "PRO",
          bookName: BOOK_NAMES.PRO,
          chapter: ch,
          category: "ot"
        });
      }
    }
    return next;
  });
}

/**
 * @param {{
 *   translationId: string,
 *   startDate: string,
 *   days: number,
 *   groups: string[],
 *   orderMode: "overlap"|"inorder",
 *   chronological?: boolean,
 *   dailyPsalms?: boolean,
 *   dailyProverbs?: boolean,
 *   excludeBooks?: string[]
 * }} config
 * @returns {Promise<Array<{dayIndex: number, date: string, entries: Array<{bookId,bookName,chapter,category}>}>>}
 */
export async function generateSchedule({
  translationId,
  startDate,
  days,
  groups,
  orderMode,
  chronological = false,
  dailyPsalms = false,
  dailyProverbs = false,
  excludeBooks = []
}) {
  const safeStartDate = startDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : todayDateString();
  const numDays = Math.max(1, Math.min(1000, parseInt(days, 10) || 365));
  const filteredGroups = (groups || []).filter((g) => g !== "dc");
  const orderedGroups = GROUP_ORDER.filter((g) => filteredGroups.includes(g));
  const isFullBible =
    orderedGroups.includes("ot") && orderedGroups.includes("nt") && (!excludeBooks || excludeBooks.length === 0);

  // Direct match with pre-balanced 365-day Bible-CSV plans
  if (numDays === 365 && isFullBible) {
    if (dailyPsalms === dailyProverbs) {
      const filename = getCsvPlanFilename({ orderMode, chronological, dailyPsalms, dailyProverbs });
      const csvText = await loadCsvPlanText(filename);
      return parseCsvPlanText(csvText, safeStartDate);
    }

    // Only one of Daily Psalms / Daily Proverbs selected on a 365-day full-Bible plan:
    // use the matching base CSV and append the requested daily wisdom chapter.
    const baseFilename = getCsvPlanFilename({
      orderMode,
      chronological,
      dailyPsalms: false,
      dailyProverbs: false
    });
    const csvText = await loadCsvPlanText(baseFilename);
    const baseDays = parseCsvPlanText(csvText, safeStartDate);
    const enriched = appendDailyWisdom(
      baseDays.map((d) => d.entries),
      { dailyPsalms, dailyProverbs }
    );
    return baseDays.map((d, i) => ({ ...d, entries: enriched[i] }));
  }

  let dayEntries = Array.from({ length: numDays }, () => []);

  if (orderedGroups.length > 0) {
    if (chronological) {
      const chronCsv = await loadCsvPlanText("order-chronological.csv");
      const streams = extractChronologicalStreams(chronCsv);
      const excludeSet = new Set(excludeBooks || []);
      const groupSet = new Set(orderedGroups);

      if (orderMode === "inorder") {
        const filtered = streams.combined.filter(
          (e) => groupSet.has(e.category) && !excludeSet.has(e.bookId)
        );
        const chunks = chunkEvenly(filtered, numDays);
        chunks.forEach((chunk, i) => dayEntries[i].push(...chunk));
      } else {
        for (const group of orderedGroups) {
          const pool = (group === "ot" ? streams.ot : streams.nt).filter(
            (e) => !excludeSet.has(e.bookId)
          );
          const chunks = chunkEvenly(pool, numDays);
          chunks.forEach((chunk, i) => dayEntries[i].push(...chunk));
        }
      }
    } else {
      const pools = await buildGroupPools(translationId, orderedGroups, excludeBooks);

      if (orderMode === "inorder") {
        const combined = orderedGroups.flatMap((g) => pools[g]);
        const chunks = chunkEvenly(combined, numDays);
        chunks.forEach((chunk, i) => dayEntries[i].push(...chunk));
      } else {
        for (const group of orderedGroups) {
          const chunks = chunkEvenly(pools[group], numDays);
          chunks.forEach((chunk, i) => dayEntries[i].push(...chunk));
        }
      }
    }
  }

  dayEntries = appendDailyWisdom(dayEntries, { dailyPsalms, dailyProverbs });

  return dayEntries.map((entries, i) => ({
    dayIndex: i,
    date: addDaysToDateString(safeStartDate, i),
    entries
  }));
}
