// ============================================================================
// bibleCsvBundle.js
// ----------------------------------------------------------------------------
// Bundles the CSV reading plans from the Bible-CSV git submodule via Vite's
// ?raw asset imports so production builds require zero runtime network fetches.
// ============================================================================

import orderCsv from "../../Bible-CSV/order.csv?raw";
import orderChronologicalCsv from "../../Bible-CSV/order-chronological.csv?raw";
import orderPsalmProverbsCsv from "../../Bible-CSV/order-psalm-proverbs.csv?raw";
import orderPsalmProverbsChronologicalCsv from "../../Bible-CSV/order-psalm-proverbs-chronological.csv?raw";
import overlapCsv from "../../Bible-CSV/overlap.csv?raw";
import overlapChronologicalCsv from "../../Bible-CSV/overlap-chronological.csv?raw";
import overlapPsalmProverbsCsv from "../../Bible-CSV/overlap-psalm-proverbs.csv?raw";
import overlapPsalmProverbsChronologicalCsv from "../../Bible-CSV/overlap-psalm-proverbs-chronological.csv?raw";

export const CSV_PLANS_BY_FILENAME = {
  "order.csv": orderCsv,
  "order-chronological.csv": orderChronologicalCsv,
  "order-psalm-proverbs.csv": orderPsalmProverbsCsv,
  "order-psalm-proverbs-chronological.csv": orderPsalmProverbsChronologicalCsv,
  "overlap.csv": overlapCsv,
  "overlap-chronological.csv": overlapChronologicalCsv,
  "overlap-psalm-proverbs.csv": overlapPsalmProverbsCsv,
  "overlap-psalm-proverbs-chronological.csv": overlapPsalmProverbsChronologicalCsv
};
