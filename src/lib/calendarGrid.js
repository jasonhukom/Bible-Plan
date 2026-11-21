// ============================================================================
// calendarGrid.js
// ----------------------------------------------------------------------------
// Pure date math for a Sunday-start, six-week month grid -- shared by the
// sidebar's mini-calendar and the Plan page's main Google-Calendar-style
// month view, so the two can never disagree about what a "month grid" is.
// ============================================================================

export const WEEKDAY_SHORT_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_FULL_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
];
export const WEEKDAY_LABELS = WEEKDAY_SHORT_LABELS;

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

export function monthLabel(year, month, short = false) {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: short ? "short" : "long",
    year: "numeric"
  });
}

/**
 * Stateful wheel-event debouncer/accumulator for desktop month navigation.
 * Scroll up (negative deltaY) advances to the next month; scroll down
 * (positive deltaY) returns to the previous month. Cooldown prevents
 * trackpad inertia bursts from skipping multiple months at once.
 */
export function createWheelMonthNavigator({
  threshold = 35,
  cooldownMs = 260,
  idleResetMs = 180
} = {}) {
  let accum = 0;
  let lastEventAt = 0;
  let lastNavAt = -Infinity;

  return function handleWheelDelta({ deltaY, deltaMode = 0, now = Date.now() }) {
    const normalizedY = deltaMode === 1 ? deltaY * 40 : deltaMode === 2 ? deltaY * 100 : deltaY;
    if (!normalizedY) return null;

    if (now - lastNavAt < cooldownMs) {
      lastEventAt = now;
      return null;
    }

    if (now - lastEventAt > idleResetMs) {
      accum = 0;
    }

    lastEventAt = now;
    accum += normalizedY;

    if (Math.abs(accum) >= threshold) {
      const direction = accum < 0 ? "next" : "prev";
      accum = 0;
      lastNavAt = now;
      return direction;
    }

    return null;
  };
}
