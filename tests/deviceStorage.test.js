// ============================================================================
// Unit Tests: On-Device Storage (Plan, Schedule, Saved Verses, Profile, Settings)
// Run with: node tests/deviceStorage.test.js
// ============================================================================

import assert from "node:assert";
import { deviceStorage, STORAGE_KEYS } from "../src/lib/deviceStorage.js";

function createMemoryStorage(initial = {}, quotaLimit = Infinity) {
  const store = new Map(Object.entries(initial));
  return {
    get length() {
      return store.size;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(k) {
      return store.has(k) ? store.get(k) : null;
    },
    setItem(k, v) {
      if (store.size >= quotaLimit && !store.has(k)) {
        const err = new Error("QuotaExceededError");
        err.name = "QuotaExceededError";
        throw err;
      }
      store.set(k, String(v));
    },
    removeItem(k) {
      store.delete(k);
    }
  };
}

console.log("Running Device Storage Unit Tests...");

// Test 1: Plan & Schedule persistence, completion toggle, and drag-and-drop move
{
  const storage = createMemoryStorage();
  const plan = {
    id: "plan-1",
    name: "My reading plan",
    start_date: "2026-11-21",
    days: 360,
    book_groups: ["ot", "nt"],
    order_mode: "overlap"
  };
  deviceStorage.saveActivePlan(plan, storage);
  assert.deepStrictEqual(deviceStorage.getActivePlan(storage), plan);

  const rows = [
    {
      id: "row-1",
      day_index: 0,
      date: "2026-11-21",
      book: "GEN",
      book_name: "Genesis",
      chapter: 1,
      category: "ot",
      position: 0,
      completed: false,
      completed_at: null
    },
    {
      id: "row-2",
      day_index: 0,
      date: "2026-11-21",
      book: "MAT",
      book_name: "Matthew",
      chapter: 1,
      category: "nt",
      position: 1,
      completed: false,
      completed_at: null
    }
  ];
  deviceStorage.replaceSchedule(rows, storage);
  assert.strictEqual(deviceStorage.listSchedule(storage).length, 2);

  deviceStorage.setChapterCompleted("row-1", true, storage);
  const afterComplete = deviceStorage.listSchedule(storage);
  assert.strictEqual(afterComplete[0].completed, true);
  assert.ok(afterComplete[0].completed_at);
  assert.strictEqual(afterComplete[1].completed, false);

  deviceStorage.moveScheduleEntries(
    [{ id: "row-2", date: "2026-11-22", day_index: 1, position: 0 }],
    storage
  );
  const afterMove = deviceStorage.listSchedule(storage);
  assert.strictEqual(afterMove[1].date, "2026-11-22");
  assert.strictEqual(afterMove[1].day_index, 1);
  assert.strictEqual(afterMove[1].position, 0);
  console.log("✓ Test 1: Reading plan & schedule persist, toggle completion, and reschedule");
}

// Test 2: Saved verses ordering, deduplication, and removal
{
  const storage = createMemoryStorage();
  const first = deviceStorage.saveVerse(
    {
      translation: "BSB",
      book: "JHN",
      book_name: "John",
      chapter: 3,
      verse: 16,
      verse_text: "For God so loved the world..."
    },
    storage
  );
  const dup = deviceStorage.saveVerse(
    {
      translation: "BSB",
      book: "JHN",
      book_name: "John",
      chapter: 3,
      verse: 16,
      verse_text: "For God so loved the world..."
    },
    storage
  );
  assert.strictEqual(dup.id, first.id);

  const second = deviceStorage.saveVerse(
    {
      translation: "BSB",
      book: "PSA",
      book_name: "Psalms",
      chapter: 23,
      verse: 1,
      verse_text: "The LORD is my shepherd..."
    },
    storage
  );

  const listed = deviceStorage.listSavedVerses(storage);
  assert.strictEqual(listed.length, 2);
  assert.strictEqual(listed[0].id, first.id);
  assert.strictEqual(listed[1].id, second.id);

  deviceStorage.unsaveVerse(first.id, storage);
  const remaining = deviceStorage.listSavedVerses(storage);
  assert.strictEqual(remaining.length, 1);
  assert.strictEqual(remaining[0].id, second.id);
  console.log("✓ Test 2: Saved verses deduplicate, preserve order, and unsave cleanly");
}

// Test 3: Local profile & settings merge and defaults
{
  const storage = createMemoryStorage();
  assert.strictEqual(deviceStorage.getProfile(storage), null);

  deviceStorage.updateProfile({ display_name: "Jason" }, storage);
  deviceStorage.updateProfile({ avatar_url: "data:image/jpeg;base64,abc" }, storage);
  const profile = deviceStorage.getProfile(storage);
  assert.strictEqual(profile.display_name, "Jason");
  assert.strictEqual(profile.avatar_url, "data:image/jpeg;base64,abc");

  const defaultSettings = deviceStorage.getSettings(storage);
  assert.strictEqual(defaultSettings.preferences.dateNumberPosition, "right");

  deviceStorage.saveSettings({ preferences: { dateNumberPosition: "left" } }, storage);
  deviceStorage.saveSettings({ translation: "NIV" }, storage);
  const settings = deviceStorage.getSettings(storage);
  assert.strictEqual(settings.preferences.dateNumberPosition, "left");
  assert.strictEqual(settings.translation, "NIV");
  console.log("✓ Test 3: Profile and settings merge cleanly on device");
}

// Test 4: Quota recovery evicts extra chapter cache before saving plan
{
  const storage = createMemoryStorage(
    {
      "bible-extra-chapter-v1-ENO-1": "{\"cached\":true}",
      "bible-extra-chapter-v1-TOB-1": "{\"cached\":true}"
    },
    2
  );
  deviceStorage.saveActivePlan({ id: "p2", name: "Recovered Plan" }, storage);
  assert.strictEqual(deviceStorage.getActivePlan(storage).name, "Recovered Plan");
  assert.strictEqual(storage.getItem("bible-extra-chapter-v1-ENO-1"), null);
  assert.ok(storage.getItem(STORAGE_KEYS.PLAN));
  console.log("✓ Test 4: Extra chapter cache eviction frees quota for plan data");
}

// Test 5: Corrupted localStorage values degrade safely without throwing
{
  const storage = createMemoryStorage({
    [STORAGE_KEYS.PLAN]: "{not valid json",
    [STORAGE_KEYS.SCHEDULE]: "{bad",
    [STORAGE_KEYS.SAVED_VERSES]: "nope",
    [STORAGE_KEYS.PROFILE]: "bad"
  });
  assert.strictEqual(deviceStorage.getActivePlan(storage), null);
  assert.deepStrictEqual(deviceStorage.listSchedule(storage), []);
  assert.deepStrictEqual(deviceStorage.listSavedVerses(storage), []);
  assert.strictEqual(deviceStorage.getProfile(storage), null);
  console.log("✓ Test 5: Corrupted storage entries degrade gracefully");
}

console.log("\nALL DEVICE STORAGE TESTS PASSED!");
