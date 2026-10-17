// ============================================================================
// Unit Tests: Canonical Placement Engine for Additional Books
// Run with: node tests/extraBooksPlacement.test.js
// ============================================================================

import assert from "node:assert";
import {
  mergeBooksWithExtras,
  getEnabledExtraBooks,
  getWhereTheyGoPreview,
  matchesBookSearch
} from "../src/lib/extraBooksRegistry.js";

// Mock Protestant 66-book canon (ordered)
const CANONICAL_66 = [
  { id: "GEN", name: "Genesis" },
  { id: "EXO", name: "Exodus" },
  { id: "LEV", name: "Leviticus" },
  { id: "NUM", name: "Numbers" },
  { id: "DEU", name: "Deuteronomy" },
  { id: "JOS", name: "Joshua" },
  { id: "JDG", name: "Judges" },
  { id: "RUT", name: "Ruth" },
  { id: "1SA", name: "1 Samuel" },
  { id: "2SA", name: "2 Samuel" },
  { id: "1KI", name: "1 Kings" },
  { id: "2KI", name: "2 Kings" },
  { id: "1CH", name: "1 Chronicles" },
  { id: "2CH", name: "2 Chronicles" },
  { id: "EZR", name: "Ezra" },
  { id: "NEH", name: "Nehemiah" },
  { id: "EST", name: "Esther" },
  { id: "JOB", name: "Job" },
  { id: "PSA", name: "Psalms" },
  { id: "PRO", name: "Proverbs" },
  { id: "ECC", name: "Ecclesiastes" },
  { id: "SNG", name: "Song of Solomon" },
  { id: "ISA", name: "Isaiah" },
  { id: "JER", name: "Jeremiah" },
  { id: "LAM", name: "Lamentations" },
  { id: "EZK", name: "Ezekiel" },
  { id: "DAN", name: "Daniel" },
  { id: "HOS", name: "Hosea" },
  { id: "JOL", name: "Joel" },
  { id: "AMO", name: "Amos" },
  { id: "OBA", name: "Obadiah" },
  { id: "JON", name: "Jonah" },
  { id: "MIC", name: "Micah" },
  { id: "NAM", name: "Nahum" },
  { id: "HAB", name: "Habakkuk" },
  { id: "ZEP", name: "Zephaniah" },
  { id: "HAG", name: "Haggai" },
  { id: "ZEC", name: "Zechariah" },
  { id: "MAL", name: "Malachi" },
  { id: "MAT", name: "Matthew" },
  { id: "MRK", name: "Mark" },
  { id: "LUK", name: "Luke" },
  { id: "JHN", name: "John" },
  { id: "ACT", name: "Acts" },
  { id: "ROM", name: "Romans" },
  { id: "1CO", name: "1 Corinthians" },
  { id: "2CO", name: "2 Corinthians" },
  { id: "GAL", name: "Galatians" },
  { id: "EPH", name: "Ephesians" },
  { id: "PHP", name: "Philippians" },
  { id: "COL", name: "Colossians" },
  { id: "1TH", name: "1 Thessalonians" },
  { id: "2TH", name: "2 Thessalonians" },
  { id: "1TI", name: "1 Timothy" },
  { id: "2TI", name: "2 Timothy" },
  { id: "TIT", name: "Titus" },
  { id: "PHM", name: "Philemon" },
  { id: "HEB", name: "Hebrews" },
  { id: "JAS", name: "James" },
  { id: "1PE", name: "1 Peter" },
  { id: "2PE", name: "2 Peter" },
  { id: "1JN", name: "1 John" },
  { id: "2JN", name: "2 John" },
  { id: "3JN", name: "3 John" },
  { id: "JUD", name: "Jude" },
  { id: "REV", name: "Revelation" }
];

console.log("Running Canonical Placement Unit Tests...");

// Test 1: All toggles OFF
{
  const result = mergeBooksWithExtras(CANONICAL_66, {
    DC: false,
    ORT: false,
    ETH: false,
    PSE: false,
    NTA: false
  });
  assert.strictEqual(result.length, 66, "All toggles OFF should result in exactly 66 books");
  assert.deepStrictEqual(result.map((b) => b.id), CANONICAL_66.map((b) => b.id));
  console.log("✓ Test 1: All toggles OFF returns original 66 books unchanged");
}

// Helper to get book order indices
function getIndex(list, id) {
  return list.findIndex((b) => b.id === id);
}

// Test 2: DC ON (Deuterocanonical)
{
  const result = mergeBooksWithExtras(CANONICAL_66, { DC: true });
  const ids = result.map((b) => b.id);

  // Tobit & Judith between Nehemiah and Esther
  const nehIdx = ids.indexOf("NEH");
  const tobIdx = ids.indexOf("TOB");
  const jdtIdx = ids.indexOf("JDT");
  const estIdx = ids.indexOf("EST");

  assert(nehIdx < tobIdx, "Tobit must sit after Nehemiah");
  assert(tobIdx < jdtIdx, "Judith must sit after Tobit");
  assert(jdtIdx < estIdx, "Judith must sit before Esther");

  // 1-2 Maccabees right after Esther
  const esgIdx = ids.indexOf("ESG");
  const ma1Idx = ids.indexOf("1MA");
  const ma2Idx = ids.indexOf("2MA");
  const jobIdx = ids.indexOf("JOB");

  assert(estIdx < esgIdx, "Additions to Esther after Esther");
  assert(esgIdx < ma1Idx, "1 Maccabees after Additions to Esther");
  assert(ma1Idx < ma2Idx, "2 Maccabees after 1 Maccabees");
  assert(ma2Idx < jobIdx, "2 Maccabees before Job");

  // Wisdom and Sirach after Song of Solomon
  const sngIdx = ids.indexOf("SNG");
  const wisIdx = ids.indexOf("WIS");
  const sirIdx = ids.indexOf("SIR");
  const isaIdx = ids.indexOf("ISA");

  assert(sngIdx < wisIdx, "Wisdom after Song of Solomon");
  assert(wisIdx < sirIdx, "Sirach after Wisdom");
  assert(sirIdx < isaIdx, "Sirach before Isaiah");

  // Baruch & Letter of Jeremiah after Lamentations
  const lamIdx = ids.indexOf("LAM");
  const barIdx = ids.indexOf("BAR");
  const ljeIdx = ids.indexOf("LJE");
  const ezkIdx = ids.indexOf("EZK");

  assert(lamIdx < barIdx, "Baruch after Lamentations");
  assert(barIdx < ljeIdx, "Letter of Jeremiah after Baruch");
  assert(ljeIdx < ezkIdx, "Letter of Jeremiah before Ezekiel");

  // Daniel additions after Daniel
  const danIdx = ids.indexOf("DAN");
  const s3yIdx = ids.indexOf("S3Y");
  const susIdx = ids.indexOf("SUS");
  const belIdx = ids.indexOf("BEL");
  const hosIdx = ids.indexOf("HOS");

  assert(danIdx < s3yIdx, "Prayer of Azariah after Daniel");
  assert(s3yIdx < susIdx, "Susanna after Prayer of Azariah");
  assert(susIdx < belIdx, "Bel and the Dragon after Susanna");
  assert(belIdx < hosIdx, "Bel and the Dragon before Hosea");

  console.log("✓ Test 2: DC placement (Tobit/Judith before Esther, Maccabees after, Wisdom/Sirach, Baruch, Daniel additions)");
}

// Test 3: ETH ON without DC (Ethiopian canon overrides)
{
  const result = mergeBooksWithExtras(CANONICAL_66, { ETH: true, DC: false });
  const ids = result.map((b) => b.id);

  // No 1-2 Maccabees
  assert.strictEqual(ids.includes("1MA"), false, "1 Maccabees must NOT be included in ETH without DC/ORT");
  assert.strictEqual(ids.includes("2MA"), false, "2 Maccabees must NOT be included in ETH without DC/ORT");

  // Meqabyan after Esther
  const estIdx = ids.indexOf("EST");
  const mq1Idx = ids.indexOf("1MQ");
  const mq2Idx = ids.indexOf("2MQ");
  const mq3Idx = ids.indexOf("3MQ");
  assert(estIdx < mq1Idx && mq1Idx < mq2Idx && mq2Idx < mq3Idx, "Meqabyan 1-3 sit after Esther in ETH");

  // Jubilees and 1 Enoch after 2 Chronicles (anchor override!)
  const ch2Idx = ids.indexOf("2CH");
  const jubIdx = ids.indexOf("JUB");
  const enoIdx = ids.indexOf("ENO");
  const ezrIdx = ids.indexOf("EZR");

  assert(ch2Idx < jubIdx, "Jubilees sits after 2 Chronicles in ETH");
  assert(jubIdx < enoIdx, "1 Enoch sits after Jubilees in ETH");
  assert(enoIdx < ezrIdx, "1 Enoch sits before Ezra in ETH");

  console.log("✓ Test 3: ETH on without DC (Meqabyan after Esther, Jubilees & Enoch after 2 Chronicles)");
}

// Test 4: PSE ON without ETH (Thematic placement after Genesis)
{
  const result = mergeBooksWithExtras(CANONICAL_66, { PSE: true, ETH: false });
  const ids = result.map((b) => b.id);

  // In PSE without ETH, Enoch and Jubilees sit after Genesis!
  const genIdx = ids.indexOf("GEN");
  const enoIdx = ids.indexOf("ENO");
  const jubIdx = ids.indexOf("JUB");
  const exoIdx = ids.indexOf("EXO");

  assert(genIdx < enoIdx, "1 Enoch sits after Genesis in PSE");
  assert(enoIdx < jubIdx, "Jubilees sits after 1 Enoch in PSE");
  assert(jubIdx < exoIdx, "Jubilees sits before Exodus in PSE");

  console.log("✓ Test 4: PSE on without ETH (Enoch and Jubilees directly after Genesis)");
}

// Test 5: NTA ON (New Testament Apocrypha)
{
  const result = mergeBooksWithExtras(CANONICAL_66, { NTA: true });
  const ids = result.map((b) => b.id);

  // Gospels group after John
  const jhnIdx = ids.indexOf("JHN");
  const pjamIdx = ids.indexOf("PJAM");
  const gthoIdx = ids.indexOf("GTHO");
  const actIdx = ids.indexOf("ACT");

  assert(jhnIdx < pjamIdx, "Protevangelium of James after John");
  assert(pjamIdx < gthoIdx, "Gospel of Thomas after Protevangelium");
  assert(gthoIdx < actIdx, "Apocryphal Gospels sit before Acts");

  // Acts group after Acts
  const apauIdx = ids.indexOf("APAU");
  const romIdx = ids.indexOf("ROM");
  assert(actIdx < apauIdx, "Acts of Paul after Acts");
  assert(apauIdx < romIdx, "Acts of Paul before Romans");

  // 3 Corinthians after 2 Corinthians
  const co2Idx = ids.indexOf("2CO");
  const co3Idx = ids.indexOf("3CO");
  const galIdx = ids.indexOf("GAL");
  assert(co2Idx < co3Idx && co3Idx < galIdx, "3 Corinthians between 2CO and Galatians");

  // Laodiceans after Colossians
  const colIdx = ids.indexOf("COL");
  const laoIdx = ids.indexOf("LAO");
  const th1Idx = ids.indexOf("1TH");
  assert(colIdx < laoIdx && laoIdx < th1Idx, "Laodiceans between Colossians and 1 Thessalonians");

  // End of NT: Didache, Barnabas, Hermas, Clements after Revelation
  const revIdx = ids.indexOf("REV");
  const didIdx = ids.indexOf("DID");
  assert(revIdx < didIdx, "Didache sits after Revelation");

  console.log("✓ Test 5: NTA placements (Gospels after John, Acts after Acts, 3CO, Laodiceans, Apostolic Fathers after Revelation)");
}

// Test 6: Search with Aliases
{
  const sirach = {
    id: "SIR",
    name: "Sirach",
    commonName: "Sirach",
    aliases: ["Ecclesiasticus", "Ben Sira"]
  };
  assert.strictEqual(matchesBookSearch(sirach, "Ecclesiasticus"), true);
  assert.strictEqual(matchesBookSearch(sirach, "eccles"), true);
  assert.strictEqual(matchesBookSearch(sirach, "Ben Sira"), true);
  assert.strictEqual(matchesBookSearch(sirach, "Sirach"), true);
  assert.strictEqual(matchesBookSearch(sirach, "Matthew"), false);

  const enoch = {
    id: "ENO",
    name: "1 Enoch",
    aliases: ["Henoch", "Ethiopic Enoch"]
  };
  assert.strictEqual(matchesBookSearch(enoch, "Henoch"), true);
  assert.strictEqual(matchesBookSearch(enoch, "Enoch"), true);

  console.log("✓ Test 6: Search with aliases works (Ecclesiasticus -> Sirach, Henoch -> Enoch)");
}

// Test 7: "Where they go" preview generation
{
  const dcPreview = getWhereTheyGoPreview("DC");
  assert(dcPreview.includes("After Nehemiah: Tobit, Judith"));
  assert(dcPreview.includes("After Esther: Additions to Esther, 1 Maccabees, 2 Maccabees"));
  console.log("✓ Test 7: 'Where they go' preview generated dynamically:", dcPreview);
}

console.log("\nALL TESTS PASSED! Canonical placement engine is verified.");
