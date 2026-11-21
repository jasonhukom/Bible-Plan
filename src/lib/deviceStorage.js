// ============================================================================
// deviceStorage.js
// ----------------------------------------------------------------------------
// On-device persistence backed by browser localStorage.
// Stores the active reading plan, reading schedule & completion progress,
// saved verses, local profile (name & avatar), and UI preferences with no
// remote database or account required.
// ============================================================================

export const STORAGE_KEYS = {
  PLAN: "bible-plan-local-active-plan",
  SCHEDULE: "bible-plan-local-schedule-rows",
  PROFILE: "bible-plan-local-profile",
  SETTINGS: "bible-plan-local-settings",
  SAVED_VERSES: "bible-plan-local-saved-verses"
};

const EXTRA_CHAPTER_CACHE_PREFIX = "bible-extra-chapter-v1-";
const MAX_AVATAR_DIMENSION = 256;

function resolveStorage(customStorage) {
  if (customStorage) return customStorage;
  try {
    return typeof globalThis !== "undefined" && globalThis.localStorage
      ? globalThis.localStorage
      : null;
  } catch {
    return null;
  }
}

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function emitEvent(name, detail) {
  if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

function evictExtraChapterCache(storage) {
  if (!storage || typeof storage.length !== "number" || typeof storage.key !== "function") return;
  const keysToRemove = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (k && k.startsWith(EXTRA_CHAPTER_CACHE_PREFIX)) {
      keysToRemove.push(k);
    }
  }
  for (const k of keysToRemove) {
    storage.removeItem(k);
  }
}

function readJson(key, fallback, customStorage) {
  const storage = resolveStorage(customStorage);
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value, customStorage) {
  const storage = resolveStorage(customStorage);
  if (!storage) return false;
  if (value === null || value === undefined) {
    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
  const serialized = JSON.stringify(value);
  try {
    storage.setItem(key, serialized);
    return true;
  } catch {
    // Reclaim space from cached extra chapters so user data (plan, saves) still fits.
    try {
      evictExtraChapterCache(storage);
      storage.setItem(key, serialized);
      return true;
    } catch {
      return false;
    }
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}

export const deviceStorage = {
  /* ========================================================================
     Reading Plan & Schedule
     ======================================================================== */

  getActivePlan(customStorage) {
    return readJson(STORAGE_KEYS.PLAN, null, customStorage);
  },

  saveActivePlan(plan, customStorage) {
    writeJson(STORAGE_KEYS.PLAN, plan, customStorage);
    return plan;
  },

  listSchedule(customStorage) {
    const rows = readJson(STORAGE_KEYS.SCHEDULE, [], customStorage);
    return Array.isArray(rows) ? rows : [];
  },

  replaceSchedule(rows, customStorage) {
    const safeRows = Array.isArray(rows) ? rows : [];
    writeJson(STORAGE_KEYS.SCHEDULE, safeRows.length > 0 ? safeRows : null, customStorage);
    return safeRows;
  },

  setChapterCompleted(rowId, completed, customStorage) {
    const rows = this.listSchedule(customStorage);
    const updated = rows.map((r) =>
      r.id === rowId
        ? { ...r, completed: Boolean(completed), completed_at: completed ? new Date().toISOString() : null }
        : r
    );
    this.replaceSchedule(updated, customStorage);
    return updated;
  },

  moveScheduleEntries(moves, customStorage) {
    const moveById = new Map((moves || []).map((m) => [m.id, m]));
    const rows = this.listSchedule(customStorage);
    const updated = rows.map((r) => {
      const m = moveById.get(r.id);
      return m ? { ...r, date: m.date, day_index: m.day_index, position: m.position } : r;
    });
    this.replaceSchedule(updated, customStorage);
    return updated;
  },

  /* ========================================================================
     Local Profile
     ======================================================================== */

  getProfile(customStorage) {
    return readJson(STORAGE_KEYS.PROFILE, null, customStorage);
  },

  updateProfile(patch, customStorage) {
    const current = this.getProfile(customStorage) || { display_name: "", avatar_url: null };
    const next = {
      ...current,
      ...patch,
      updated_at: new Date().toISOString()
    };
    if (!writeJson(STORAGE_KEYS.PROFILE, next, customStorage)) {
      throw new Error("Could not save profile to device storage.");
    }
    emitEvent("bible-profile-changed", next);
    return next;
  },

  /**
   * Scales an image Blob/File down to a lightweight JPEG data URL suitable for
   * on-device localStorage persistence.
   * @param {Blob} blob
   * @returns {Promise<string>}
   */
  async saveAvatarBlob(blob) {
    if (!blob) throw new Error("No image provided.");
    if (typeof document === "undefined" || typeof Image === "undefined") {
      return blobToDataUrl(blob);
    }
    const rawUrl = await blobToDataUrl(blob);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const longest = Math.max(img.width, img.height) || MAX_AVATAR_DIMENSION;
          const scale = Math.min(1, MAX_AVATAR_DIMENSION / longest);
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(rawUrl);
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch {
          resolve(rawUrl);
        }
      };
      img.onerror = () => resolve(rawUrl);
      img.src = rawUrl;
    });
  },

  /* ========================================================================
     Settings & Preferences
     ======================================================================== */

  getSettings(customStorage) {
    const stored = readJson(STORAGE_KEYS.SETTINGS, null, customStorage);
    return {
      preferences: { dateNumberPosition: "right" },
      ...(stored || {}),
      preferences: {
        dateNumberPosition: "right",
        ...(stored?.preferences || {})
      }
    };
  },

  saveSettings(patch, customStorage) {
    const current = this.getSettings(customStorage);
    const next = {
      ...current,
      ...patch,
      preferences: {
        ...current.preferences,
        ...(patch?.preferences || {})
      },
      updated_at: new Date().toISOString()
    };
    writeJson(STORAGE_KEYS.SETTINGS, next, customStorage);
    emitEvent("bible-settings-changed", next);
    return next;
  },

  /* ========================================================================
     Saved Verses (chronological, oldest first)
     ======================================================================== */

  listSavedVerses(customStorage) {
    const verses = readJson(STORAGE_KEYS.SAVED_VERSES, [], customStorage);
    return Array.isArray(verses) ? verses : [];
  },

  saveVerse(verse, customStorage) {
    const verses = this.listSavedVerses(customStorage);
    const existing = verses.find(
      (v) =>
        v.translation === verse.translation &&
        v.book === verse.book &&
        v.chapter === verse.chapter &&
        v.verse === verse.verse
    );
    if (existing) return existing;

    const entry = {
      id: newId(),
      translation: verse.translation,
      book: verse.book,
      book_name: verse.book_name,
      chapter: verse.chapter,
      verse: verse.verse,
      verse_text: verse.verse_text,
      created_at: new Date().toISOString()
    };
    const next = [...verses, entry];
    writeJson(STORAGE_KEYS.SAVED_VERSES, next, customStorage);
    emitEvent("bible-saved-verses-changed", next);
    return entry;
  },

  unsaveVerse(id, customStorage) {
    const verses = this.listSavedVerses(customStorage);
    const next = verses.filter((v) => v.id !== id);
    writeJson(STORAGE_KEYS.SAVED_VERSES, next, customStorage);
    emitEvent("bible-saved-verses-changed", next);
    return next;
  }
};
