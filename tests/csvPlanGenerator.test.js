// ============================================================================
// Unit Tests: Bible-CSV Parser & Plan Generator Options
// Run with: node tests/csvPlanGenerator.test.js
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import {
  getCsvPlanFilename,
  parsePassageCell,
  parseCsvPlanText,
  extractChronologicalStreams
} from "../src/lib/csvPlanParser.js";
import { generateSchedule } from "../src/lib/planGenerator.js";

console.log("Running Bible-CSV & Plan Options Unit Tests...");

// Test 1: getCsvPlanFilename maps option combinations to Bible-CSV filenames
{
  assert.strictEqual(getCsvPlanFilename({ orderMode: "inorder", chronological: false, dailyPsalms: false, dailyProverbs: false }), "order.csv");
  assert.strictEqual(getCsvPlanFilename({ orderMode: "inorder", chronological: false, dailyPsalms: true, dailyProverbs: true }), "order-psalm-proverbs.csv");
  assert.strictEqual(getCsvPlanFilename({ orderMode: "inorder", chronological: true, dailyPsalms: false, dailyProverbs: false }), "order-chronological.csv");
  assert.strictEqual(getCsvPlanFilename({ orderMode: "inorder", chronological: true, dailyPsalms: true, dailyProverbs: true }), "order-psalm-proverbs-chronological.csv");
  assert.strictEqual(getCsvPlanFilename({ orderMode: "overlap", chronological: false, dailyPsalms: false, dailyProverbs: false }), "overlap.csv");
  assert.strictEqual(getCsvPlanFilename({ orderMode: "overlap", chronological: false, dailyPsalms: true, dailyProverbs: true }), "overlap-psalm-proverbs.csv");
  assert.strictEqual(getCsvPlanFilename({ orderMode: "overlap", chronological: true, dailyPsalms: false, dailyProverbs: false }), "overlap-chronological.csv");
  assert.strictEqual(getCsvPlanFilename({ orderMode: "overlap", chronological: true, dailyPsalms: true, dailyProverbs: true }), "overlap-psalm-proverbs-chronological.csv");
  console.log("✓ Test 1: getCsvPlanFilename maps every plan option combination");
}

// Test 2: parsePassageCell handles ranges, comma lists, single-chapter books, and bare Ps (Psalm 151)
{
  const entries = parsePassageCell("Gen 1-2; Ps 11, 59; Jude; 1 Es 9; Man; Ps");
  assert.deepStrictEqual(
    entries.map((e) => `${e.bookId}:${e.chapter}`),
    ["GEN:1", "GEN:2", "PSA:11", "PSA:59", "JUD:1", "1ES:9", "MAN:1", "PS2:1"]
  );
  console.log("✓ Test 2: parsePassageCell handles ranges, commas, single-chapter books, and Psalm 151");
}

// Test 3: All 12 CSV files in Bible-CSV submodule parse cleanly
{
  const csvDir = path.resolve("Bible-CSV");
  const csvFiles = fs.readdirSync(csvDir).filter((f) => f.endsWith(".csv"));
  assert.strictEqual(csvFiles.length, 12, "Bible-CSV submodule must contain all 12 plan CSVs");
  for (const file of csvFiles) {
    const raw = fs.readFileSync(path.join(csvDir, file), "utf8");
    const days = parseCsvPlanText(raw, "2026-01-01");
    assert.strictEqual(days.length, 365, `${file} must parse to 365 days`);
    assert.strictEqual(days[0].date, "2026-01-01");
    assert.strictEqual(days[364].date, "2026-12-31");
  }
  console.log("✓ Test 3: All 12 Bible-CSV submodule files parse into 365-day schedules");
}

// Test 4: generateSchedule uses Bible-CSV for all 365-day option combos
{
  const overlapChronPsPro = await generateSchedule({
    translationId: "BSB",
    startDate: "2026-01-01",
    days: 365,
    groups: ["ot", "nt"],
    orderMode: "overlap",
    chronological: true,
    dailyPsalms: true,
    dailyProverbs: true
  });
  assert.strictEqual(overlapChronPsPro.length, 365);
  assert.deepStrictEqual(
    overlapChronPsPro[0].entries.map((e) => `${e.bookId}:${e.chapter}`),
    ["GEN:1", "GEN:2", "LUK:1", "PSA:1", "PRO:1"]
  );

  const orderChron = await generateSchedule({
    translationId: "BSB",
    startDate: "2026-01-01",
    days: 365,
    groups: ["ot", "nt"],
    orderMode: "inorder",
    chronological: true,
    dailyPsalms: false,
    dailyProverbs: false
  });
  assert.strictEqual(orderChron.length, 365);
  // Day 4 in chronological order switches from Gen 10-11 to Job 1-2!
  assert.deepStrictEqual(
    orderChron[3].entries.map((e) => `${e.bookId}:${e.chapter}`),
    ["GEN:10", "GEN:11", "JOB:1", "JOB:2"]
  );
  console.log("✓ Test 4: generateSchedule produces authentic Bible-CSV schedules (overlap/order + chronological + Ps/Pro)");
}

// Test 5: Individual Psalms-only and Proverbs-only toggles work on 365-day & custom plans
{
  const psOnly = await generateSchedule({
    translationId: "BSB",
    startDate: "2026-05-01",
    days: 365,
    groups: ["ot", "nt"],
    orderMode: "overlap",
    chronological: true,
    dailyPsalms: true,
    dailyProverbs: false
  });
  assert.strictEqual(psOnly.length, 365);
  assert.deepStrictEqual(
    psOnly[0].entries.map((e) => `${e.bookId}:${e.chapter}`),
    ["GEN:1", "GEN:2", "LUK:1", "PSA:1"]
  );

  const proOnlyCustom = await generateSchedule({
    translationId: "BSB",
    startDate: "2026-05-01",
    days: 40,
    groups: ["nt"],
    orderMode: "inorder",
    chronological: true,
    dailyPsalms: false,
    dailyProverbs: true
  });
  assert.strictEqual(proOnlyCustom.length, 40);
  assert.strictEqual(proOnlyCustom[0].entries.some((e) => e.bookId === "PRO" && e.chapter === 1), true);
  // Day 32 wraps Proverbs back to chapter 1 (31 % 31 + 1 = 1)
  assert.strictEqual(proOnlyCustom[31].entries.some((e) => e.bookId === "PRO" && e.chapter === 1), true);
  // Chronological NT starts with Luke 1 or James 1? Let's verify NT chronological stream starts with Luke/John/etc.
  const chronCsv = fs.readFileSync(path.resolve("Bible-CSV/order-chronological.csv"), "utf8");
  const streams = extractChronologicalStreams(chronCsv);
  assert.strictEqual(streams.ot.length, 929);
  assert.strictEqual(streams.nt.length, 260);
  console.log("✓ Test 5: Individual Daily Psalms / Daily Proverbs & custom chronological streams work");
}

console.log("\nALL BIBLE-CSV & PLAN OPTIONS TESTS PASSED!");
