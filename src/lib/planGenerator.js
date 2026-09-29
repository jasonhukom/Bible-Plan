// ============================================================================
// planGenerator.js
// ----------------------------------------------------------------------------
// Turns a plan config (start date, length, which book groups) into a
// day-by-day list of chapter references, using live chapter counts from the
// HelloAO API rather than a hardcoded table -- so it's accurate for whatever
// translation is set as default, deuterocanonical included if present.
//
// Two order modes, matching the original app's plan panel:
//   "overlap"  -- every selected group progresses in parallel (a bit of OT
//                 *and* a bit of NT each day) -- this is the default, and
//                 how the original 121-day plan read.
//   "inorder"  -- finish one group before starting the next.
// ============================================================================

import { listBooks } from "./helloao";
import { classifyBook, BOOK_NAMES } from "./bibleBooks";

const GROUP_ORDER = ["ot", "dc", "nt"];

/**
 * @param {string} translationId
 * @param {string[]} groups e.g. ["ot", "nt"]
 * @returns {Promise<Record<string, Array<{bookId: string, bookName: string, chapter: number}>>>}
 *   one flat chapter list per requested group, in canonical order
 */
async function buildGroupPools(translationId, groups) {
  const books = await listBooks(translationId);
  const sorted = [...books].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const pools = {};
  for (const group of groups) pools[group] = [];
  for (const book of sorted) {
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

function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/**
 * @param {{translationId: string, startDate: string, days: number, groups: string[], orderMode: "overlap"|"inorder"}} config
 * @returns {Promise<Array<{dayIndex: number, date: string, entries: Array<{bookId,bookName,chapter,category}>}>>}
 *   flat per-chapter entries per day, ready to insert into reading_schedule
 *   (one row per entry) -- NOT yet grouped into display refs.
 */
export async function generateSchedule({ translationId, startDate, days, groups, orderMode }) {
  const orderedGroups = GROUP_ORDER.filter((g) => groups.includes(g));
  const pools = await buildGroupPools(translationId, orderedGroups);

  const dayEntries = Array.from({ length: days }, () => []);

  if (orderMode === "inorder") {
    const combined = orderedGroups.flatMap((g) => pools[g]);
    const chunks = chunkEvenly(combined, days);
    chunks.forEach((chunk, i) => dayEntries[i].push(...chunk));
  } else {
    // overlap: each group contributes its own chunk to every day.
    for (const group of orderedGroups) {
      const chunks = chunkEvenly(pools[group], days);
      chunks.forEach((chunk, i) => dayEntries[i].push(...chunk));
    }
  }

  return dayEntries.map((entries, i) => ({
    dayIndex: i,
    date: addDays(startDate, i),
    entries
  }));
}
