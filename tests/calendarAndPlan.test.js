// ============================================================================
// Unit Tests: Calendar Grid & Plan Generator
// Run with: node tests/calendarAndPlan.test.js
// ============================================================================

import assert from "node:assert";
import {
  buildMonthGrid,
  createWheelMonthNavigator,
  monthLabel,
  WEEKDAY_SHORT_LABELS,
  WEEKDAY_FULL_LABELS
} from "../src/lib/calendarGrid.js";
import { classifyBook, getLongBookName, getShortBookName, groupBooks, OT_IDS, NT_IDS } from "../src/lib/bibleBooks.js";
import { groupIntoRefs } from "../src/lib/planGenerator.js";

console.log("Running Calendar & Plan Unit Tests...");

// Test 1: Calendar Grid size and properties
{
  const cells = buildMonthGrid(2026, 9); // October 2026 (0-indexed month: 9 = October)
  assert.strictEqual(cells.length, 42, "Grid must always have exactly 42 cells (6 rows x 7 days)");
  
  // Verify date format YYYY-MM-DD
  for (const cell of cells) {
    assert(/^\d{4}-\d{2}-\d{2}$/.test(cell.date), `Invalid date format: ${cell.date}`);
    assert(typeof cell.day === "number", "Day must be a number");
    assert(typeof cell.isCurrentMonth === "boolean", "isCurrentMonth must be a boolean");
  }
  
  // Oct 1, 2026 is a Thursday (getDay() === 4). Sunday start offset means first 4 days are from Sept.
  const currentMonthCells = cells.filter(c => c.isCurrentMonth);
  assert.strictEqual(currentMonthCells.length, 31, "October has 31 days");
  assert.strictEqual(currentMonthCells[0].day, 1);
  assert.strictEqual(currentMonthCells[30].day, 31);
  console.log("✓ Test 1: buildMonthGrid produces valid 42-cell calendar grid");
}

// Test 2: Month label formatting
{
  const labelLong = monthLabel(2026, 9, false);
  assert(labelLong.includes("October") && labelLong.includes("2026"), `Expected October 2026, got: ${labelLong}`);
  const labelShort = monthLabel(2026, 9, true);
  assert(labelShort.includes("Oct") && labelShort.includes("2026"), `Expected Oct 2026, got: ${labelShort}`);
  console.log("✓ Test 2: monthLabel formats months correctly");
}

// Test 3: Bible book classification
{
  assert.strictEqual(classifyBook("GEN"), "ot");
  assert.strictEqual(classifyBook("MAL"), "ot");
  assert.strictEqual(classifyBook("MAT"), "nt");
  assert.strictEqual(classifyBook("REV"), "nt");
  assert.strictEqual(classifyBook("TOB"), "dc");
  assert.strictEqual(classifyBook("1MA"), "dc");
  assert.strictEqual(classifyBook("ENO"), "dc");
  console.log("✓ Test 3: classifyBook correctly identifies OT, NT, and Deuterocanonical/extra books");
}

// Test 4: Book name resolution
{
  assert.strictEqual(getLongBookName("GEN"), "Genesis");
  assert.strictEqual(getLongBookName("REV"), "Revelation");
  assert.strictEqual(getLongBookName("UNKNOWN", "Custom"), "Custom");

  assert.strictEqual(getShortBookName("GEN"), "Gen");
  assert.strictEqual(getShortBookName("1SA"), "1Sam");
  assert.strictEqual(getShortBookName("REV"), "Rev");
  console.log("✓ Test 4: getLongBookName and getShortBookName return expected abbreviations and names");
}

// Test 5: groupBooks utility
{
  const sampleBooks = [
    { id: "GEN", name: "Genesis" },
    { id: "TOB", name: "Tobit" },
    { id: "MAT", name: "Matthew" },
    { id: "REV", name: "Revelation" }
  ];
  const grouped = groupBooks(sampleBooks);
  assert.strictEqual(grouped.ot.length, 1);
  assert.strictEqual(grouped.ot[0].id, "GEN");
  assert.strictEqual(grouped.dc.length, 1);
  assert.strictEqual(grouped.dc[0].id, "TOB");
  assert.strictEqual(grouped.nt.length, 2);
  assert.strictEqual(grouped.nt[0].id, "MAT");
  assert.strictEqual(grouped.nt[1].id, "REV");
  console.log("✓ Test 5: groupBooks partitions books cleanly into ot, dc, and nt");
}

// Test 6: groupIntoRefs in planGenerator
{
  const entries = [
    { bookId: "GEN", bookName: "Genesis", chapter: 1, category: "ot" },
    { bookId: "GEN", bookName: "Genesis", chapter: 2, category: "ot" },
    { bookId: "GEN", bookName: "Genesis", chapter: 3, category: "ot" },
    { bookId: "MAT", bookName: "Matthew", chapter: 1, category: "nt" },
    { bookId: "GEN", bookName: "Genesis", chapter: 5, category: "ot" } // Non-contiguous
  ];
  const refs = groupIntoRefs(entries);
  assert.strictEqual(refs.length, 3);
  assert.deepStrictEqual(refs[0], {
    bookId: "GEN",
    bookName: "Genesis",
    category: "ot",
    startChapter: 1,
    endChapter: 3
  });
  assert.deepStrictEqual(refs[1], {
    bookId: "MAT",
    bookName: "Matthew",
    category: "nt",
    startChapter: 1,
    endChapter: 1
  });
  assert.deepStrictEqual(refs[2], {
    bookId: "GEN",
    bookName: "Genesis",
    category: "ot",
    startChapter: 5,
    endChapter: 5
  });
  console.log("✓ Test 6: groupIntoRefs merges contiguous chapters and splits non-contiguous runs");
}

// Test 7: Desktop mouse wheel month navigation
{
  const step = createWheelMonthNavigator({ threshold: 35, cooldownMs: 260, idleResetMs: 180 });
  // Scroll up (negative deltaY) -> previous month (left); inertia events within cooldown are ignored
  assert.strictEqual(step({ deltaY: -100, now: 1000 }), "prev");
  assert.strictEqual(step({ deltaY: -100, now: 1100 }), null);
  // After cooldown, scroll down (positive deltaY) -> next month (right)
  assert.strictEqual(step({ deltaY: 120, now: 1400 }), "next");
  // Firefox line-mode scroll (deltaMode === 1, deltaY = -3 -> -120)
  assert.strictEqual(step({ deltaY: -3, deltaMode: 1, now: 1800 }), "prev");
  // Small trackpad increments accumulate to threshold
  assert.strictEqual(step({ deltaY: 15, now: 2200 }), null);
  assert.strictEqual(step({ deltaY: 25, now: 2250 }), "next");
  console.log("✓ Test 7: createWheelMonthNavigator maps scroll up -> prev month, down -> next month with cooldown");
}

console.log("\nALL CALENDAR & PLAN TESTS PASSED!");
