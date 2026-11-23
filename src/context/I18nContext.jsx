import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LANGUAGE, LANGUAGES, LOCALES, getDirection, isSupportedLanguage } from "../i18n/index";
import { resolveBibleTranslation } from "../i18n/bibleTranslationMap";
import { UI_STRINGS } from "../i18n/uiStrings";
import { createTranslate } from "../i18n/translator";
import { pickTranslationForLanguage } from "../lib/languageBible";
import { listTranslations as listHelloAoTranslations, DEFAULT_TRANSLATION_ID } from "../lib/helloao";
import { getPreferredTranslation, setPreferredTranslation } from "../lib/bible";
import { deviceStorage } from "../lib/deviceStorage";

const STORAGE_KEY = "bible-plan-language";

const translate = createTranslate({ locales: LOCALES, ui: UI_STRINGS, fallback: DEFAULT_LANGUAGE });

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isSupportedLanguage(stored)) return stored;
  } catch {
    // Storage can be blocked (private mode); fall back to English.
  }
  return DEFAULT_LANGUAGE;
}

let translationListPromise = null;
function loadTranslationList() {
  if (!translationListPromise) {
    translationListPromise = listHelloAoTranslations().catch((error) => {
      translationListPromise = null;
      throw error;
    });
  }
  return translationListPromise;
}

/**
 * Switches the Bible translation to the one that goes with a UI language.
 * Resolves to { status: "switched" | "kept" | "none" | "error", name? } and
 * never throws, so a flaky network can't break changing the app language.
 */
async function syncBibleTranslation(code) {
  try {
    const meta = LANGUAGES.find((language) => language.code === code);
    const paired = resolveBibleTranslation(code);
    const translations = await loadTranslationList();
    const decision = pickTranslationForLanguage({
      translations,
      code,
      englishName: meta?.englishName,
      pairedName: paired?.name,
      currentId: getPreferredTranslation(),
      defaultId: DEFAULT_TRANSLATION_ID
    });

    if (decision.action === "switch") {
      setPreferredTranslation(decision.id);
      deviceStorage.saveSettings({ translation: decision.id });
      return { status: "switched", name: decision.name };
    }
    return { status: decision.action === "keep" ? "kept" : "none" };
  } catch (error) {
    console.error("Could not sync the Bible translation with the language:", error);
    return { status: "error" };
  }
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = getDirection(language);
  }, [language]);

  const setLanguage = useCallback(async (code) => {
    if (!isSupportedLanguage(code)) return { status: "none" };
    setLanguageState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Not persisted, but the choice still applies for this session.
    }
    window.dispatchEvent(new CustomEvent("bible-language-changed", { detail: code }));
    return syncBibleTranslation(code);
  }, []);

  const t = useCallback((key, params) => translate(language, key, params), [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES, dir: getDirection(language) }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within an I18nProvider");
  return ctx;
}
