// ============================================================================
// calendarGrid.js
// ----------------------------------------------------------------------------
// Pure date math for a Sunday-start, six-week month grid -- shared by the
// sidebar's mini-calendar and the Plan page's main Google-Calendar-style
// month view, so the two can never disagree about what a "month grid" is.
// ============================================================================

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Builds a 42-cell (6 week x 7 day) grid for the given month, Sunday-first,
 * including the trailing/leading days of the adjacent months.
 * @param {number} year
 * @param {number} month 0-11
 * @returns {Array<{ date: string, day: number, isCurrentMonth: boolean }>}
 */
export function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    cells.push({
      date: toDateString(d),
      day: d.getDate(),
      isCurrentMonth: d.getMonth() === month
    });
  }
  return cells;
}

export function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
