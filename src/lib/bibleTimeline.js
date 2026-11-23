// ============================================================================
// bibleTimeline.js
// ----------------------------------------------------------------------------
// Data and helpers behind the Bible Connections page (/planning): three ways
// to order the 66 books, a curated set of cross-references between books, and
// the geometry helpers that turn those into arcs.
//
// Pure module (no React, no Vite-only imports) so it can be unit-tested.
// ============================================================================

import { BOOK_NAMES } from "./bibleBooks.js";
import { parseCsvPlanText } from "./csvPlanParser.js";

export const ORDER_MODES = ["chronological", "composition", "canon"];

/** The 66 books in the order they appear in the Protestant Bible. */
export const CANON_ORDER = Object.keys(BOOK_NAMES);

/**
 * Approximate order in which the books were written. Dating is genuinely
 * debated (Job, Joel, the Psalms and several others especially), so this is a
 * common mainstream ordering, not a settled fact. The UI says so.
 */
export const COMPOSITION_ORDER = [
  "GEN", "EXO", "LEV", "NUM", "DEU", "JOB", "JOS", "JDG", "RUT", "1SA", "2SA",
  "PSA", "SNG", "PRO", "ECC", "1KI", "2KI", "JOL", "JON", "AMO", "HOS", "ISA",
  "MIC", "NAM", "ZEP", "HAB", "JER", "LAM", "OBA", "EZK", "DAN", "HAG", "ZEC",
  "EST", "EZR", "NEH", "MAL", "1CH", "2CH",
  "JAS", "GAL", "1TH", "2TH", "1CO", "2CO", "ROM", "MRK", "COL", "PHM", "EPH",
  "PHP", "MAT", "LUK", "ACT", "1TI", "TIT", "1PE", "2TI", "HEB", "2PE", "JUD",
  "JHN", "1JN", "2JN", "3JN", "REV"
];

/**
 * Chronological book order: the order in which each book first appears in the
 * app's own chronological reading plan (Bible-CSV order-chronological.csv), so
 * this page agrees with the plan the reader is actually following.
 *
 * @param {string} csvText raw contents of order-chronological.csv
 * @returns {string[]} USFM book ids, first appearance order
 */
export function chronologicalOrderFromCsv(csvText) {
  const seen = new Set();
  const order = [];
  for (const day of parseCsvPlanText(csvText, "2026-01-01")) {
    for (const entry of day.entries) {
      if (!seen.has(entry.bookId)) {
        seen.add(entry.bookId);
        order.push(entry.bookId);
      }
    }
  }
  return order;
}

/** Chronological plans follow the chronological order; everything else follows the canon. */
export function defaultOrderForPlan(plan) {
  return plan && plan.chronological ? "chronological" : "canon";
}

/**
 * Curated cross-references: Old Testament passages that the New Testament
 * quotes, echoes or sees fulfilled, plus a few within-testament links. This is
 * a hand-picked set of well-known connections, not an exhaustive index.
 *
 * `ref` is "chapter" or "chapter:verse(-verse)". Chapter is what the "Read"
 * buttons link to.
 */
export const CONNECTIONS = [
  { a: ["GEN", "1:1-3"], b: ["JHN", "1:1-3"], theme: "In the beginning: creation and the Word" },
  { a: ["GEN", "2:9"], b: ["REV", "22:2"], theme: "The tree of life" },
  { a: ["GEN", "2:24"], b: ["EPH", "5:31"], theme: "The two become one flesh" },
  { a: ["GEN", "3:15"], b: ["ROM", "16:20"], theme: "The serpent crushed" },
  { a: ["GEN", "12:1-3"], b: ["GAL", "3:8"], theme: "Blessing for all nations through Abraham" },
  { a: ["GEN", "14:18-20"], b: ["HEB", "7:1-3"], theme: "Melchizedek, priest of God Most High" },
  { a: ["GEN", "15:6"], b: ["ROM", "4:3"], theme: "Abraham's faith counted as righteousness" },
  { a: ["EXO", "3:14"], b: ["JHN", "8:58"], theme: "\"I AM\"" },
  { a: ["EXO", "12:1-13"], b: ["1CO", "5:7"], theme: "The Passover lamb" },
  { a: ["EXO", "20:13-17"], b: ["ROM", "13:9"], theme: "The commandments summed up in love" },
  { a: ["EXO", "25:8-9"], b: ["HEB", "8:1-5"], theme: "The tabernacle as a pattern of heavenly things" },
  { a: ["LEV", "16:1-34"], b: ["HEB", "9:7-12"], theme: "The Day of Atonement" },
  { a: ["LEV", "19:18"], b: ["MAT", "22:39"], theme: "Love your neighbor as yourself" },
  { a: ["NUM", "21:8-9"], b: ["JHN", "3:14-15"], theme: "The bronze serpent lifted up" },
  { a: ["DEU", "6:4-5"], b: ["MRK", "12:29-30"], theme: "The greatest commandment" },
  { a: ["DEU", "18:15"], b: ["ACT", "3:22"], theme: "A prophet like Moses" },
  { a: ["JOS", "2:1-21"], b: ["HEB", "11:31"], theme: "The faith of Rahab" },
  { a: ["RUT", "4:13-22"], b: ["MAT", "1:5"], theme: "Ruth in the family line of David and Jesus" },
  { a: ["2SA", "7:12-16"], b: ["LUK", "1:32-33"], theme: "David's throne established forever" },
  { a: ["JOB", "42:10-12"], b: ["JAS", "5:11"], theme: "The perseverance of Job" },
  { a: ["PSA", "2:7"], b: ["ACT", "13:33"], theme: "\"You are my Son\"" },
  { a: ["PSA", "16:10"], b: ["ACT", "2:27"], theme: "Not abandoned to the grave" },
  { a: ["PSA", "22:1"], b: ["MAT", "27:46"], theme: "The cry from the cross" },
  { a: ["PSA", "110:1"], b: ["HEB", "1:13"], theme: "Seated at God's right hand" },
  { a: ["PSA", "118:22"], b: ["ACT", "4:11"], theme: "The rejected stone becomes the cornerstone" },
  { a: ["PRO", "3:11-12"], b: ["HEB", "12:5-6"], theme: "The Lord disciplines those he loves" },
  { a: ["ISA", "6:9-10"], b: ["MAT", "13:14-15"], theme: "Hearing but not understanding" },
  { a: ["ISA", "7:14"], b: ["MAT", "1:22-23"], theme: "Immanuel, God with us" },
  { a: ["ISA", "40:3"], b: ["MRK", "1:2-3"], theme: "A voice in the wilderness" },
  { a: ["ISA", "53:4-12"], b: ["1PE", "2:24-25"], theme: "The suffering servant" },
  { a: ["ISA", "61:1-2"], b: ["LUK", "4:16-21"], theme: "Good news to the poor" },
  { a: ["ISA", "65:17"], b: ["REV", "21:1"], theme: "A new heaven and a new earth" },
  { a: ["JER", "31:31-34"], b: ["HEB", "8:8-12"], theme: "The new covenant" },
  { a: ["EZK", "47:1-12"], b: ["REV", "22:1-2"], theme: "The river of life" },
  { a: ["DAN", "7:13-14"], b: ["MRK", "14:62"], theme: "The Son of Man coming with the clouds" },
  { a: ["HOS", "11:1"], b: ["MAT", "2:15"], theme: "Out of Egypt I called my son" },
  { a: ["JOL", "2:28-32"], b: ["ACT", "2:16-21"], theme: "The Spirit poured out" },
  { a: ["AMO", "9:11-12"], b: ["ACT", "15:15-17"], theme: "David's fallen tent restored" },
  { a: ["JON", "1:17"], b: ["MAT", "12:39-40"], theme: "The sign of Jonah" },
  { a: ["MIC", "5:2"], b: ["MAT", "2:5-6"], theme: "Born in Bethlehem" },
  { a: ["HAB", "2:4"], b: ["ROM", "1:17"], theme: "The righteous live by faith" },
  { a: ["ZEC", "9:9"], b: ["MAT", "21:4-5"], theme: "The king comes on a donkey" },
  { a: ["ZEC", "12:10"], b: ["JHN", "19:34-37"], theme: "They will look on the one they pierced" },
  { a: ["MAL", "3:1"], b: ["MAT", "11:10"], theme: "A messenger prepares the way" }
].map(({ a, b, theme }, index) => ({
  id: `c${index + 1}`,
  from: { book: a[0], ref: a[1], chapter: chapterOf(a[1]) },
  to: { book: b[0], ref: b[1], chapter: chapterOf(b[1]) },
  theme
}));

function chapterOf(ref) {
  return parseInt(String(ref), 10);
}

/** "Isa 53:4-12" style label for one side of a connection. */
export function formatRef(end, names = BOOK_NAMES) {
  return `${names[end.book] || end.book} ${end.ref}`;
}

/** Every connection that touches a book, newest-listed first as written. */
export function connectionsForBook(bookId, connections = CONNECTIONS) {
  return connections.filter((c) => c.from.book === bookId || c.to.book === bookId);
}

/** The other end of a connection, seen from `bookId`. */
export function otherEnd(connection, bookId) {
  return connection.from.book === bookId ? connection.to : connection.from;
}

/** Same-book end of a connection, seen from `bookId`. */
export function thisEnd(connection, bookId) {
  return connection.from.book === bookId ? connection.from : connection.to;
}

/**
 * Resolves each connection to positions in a given book order so it can be
 * drawn. Connections whose books aren't in the order are dropped.
 *
 * @returns {Array<{ id: string, connection: object, i: number, j: number, span: number }>}
 */
export function buildArcs(order, connections = CONNECTIONS) {
  const index = new Map(order.map((id, position) => [id, position]));
  const arcs = [];
  for (const connection of connections) {
    const x = index.get(connection.from.book);
    const y = index.get(connection.to.book);
    if (x === undefined || y === undefined || x === y) continue;
    const i = Math.min(x, y);
    const j = Math.max(x, y);
    arcs.push({ id: connection.id, connection, i, j, span: j - i });
  }
  // Long arcs first so short ones are drawn on top and stay clickable.
  return arcs.sort((p, q) => q.span - p.span);
}

/**
 * Vertical layout: books down the left, arcs bulging to the right.
 * Returns an SVG path and the geometry the page needs.
 */
export function verticalArcPath(arc, { axisX, top, row, maxBulge }) {
  const y1 = top + arc.i * row;
  const y2 = top + arc.j * row;
  const bulge = Math.min(maxBulge, 22 + arc.span * row * 0.2);
  return `M ${axisX} ${y1} C ${axisX + bulge} ${y1}, ${axisX + bulge} ${y2}, ${axisX} ${y2}`;
}

/** Horizontal layout: books along the bottom, arcs rising above. */
export function horizontalArcPath(arc, { left, col, axisY, maxBulge }) {
  const x1 = left + arc.i * col;
  const x2 = left + arc.j * col;
  const bulge = Math.min(maxBulge, 22 + arc.span * col * 0.3);
  return `M ${x1} ${axisY} C ${x1} ${axisY - bulge}, ${x2} ${axisY - bulge}, ${x2} ${axisY}`;
}
