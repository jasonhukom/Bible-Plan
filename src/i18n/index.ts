/**
 * Bible Plan internationalization entry point.
 *
 * 88 web UI languages are generated into ./generatedLocales.ts by
 * ./generateLocales.mjs. This module exposes a small, framework-agnostic API
 * that the app can use for translations and text direction.
 */

import { LANGUAGES, LANGUAGE_CODES, type LanguageMeta } from "./generatedLanguages";
import { LOCALES, LOCALE_KEYS, type LocaleKey } from "./generatedLocales";

export type { LanguageMeta, LocaleKey };
export { LANGUAGES, LANGUAGE_CODES, LOCALES, LOCALE_KEYS };

export const DEFAULT_LANGUAGE = "en";
export const TOTAL_LANGUAGES = LANGUAGES.length;

const LANGUAGE_META = new Map<string, LanguageMeta>(LANGUAGES.map((language) => [language.code, language]));

/** Returns true when the code is one of the 88 supported UI languages. */
export function isSupportedLanguage(code: string): boolean {
  return LANGUAGE_META.has(code);
}

/** Returns metadata for a language code, falling back to English. */
export function getLanguageMeta(code: string): LanguageMeta {
  return LANGUAGE_META.get(code) ?? LANGUAGE_META.get(DEFAULT_LANGUAGE)!;
}

/** Returns "ltr" or "rtl" for the given language code. */
export function getDirection(code: string): "ltr" | "rtl" {
  return getLanguageMeta(code).dir;
}

/** Returns the native display name for a language code. */
export function getNativeName(code: string): string {
  return getLanguageMeta(code).nativeName;
}

/**
 * Translates a key for the given language. Missing keys fall back to English,
 * then to the key itself, so the UI can never render an empty label.
 */
export function translate(code: string, key: LocaleKey): string {
  const dictionary = LOCALES[code] ?? LOCALES[DEFAULT_LANGUAGE];
  return dictionary?.[key] || LOCALES[DEFAULT_LANGUAGE]?.[key] || key;
}

/** Alias for `translate`, useful in components that prefer `t`. */
export const t = translate;

/** Creates a bound translator for a language code. */
export function createTranslator(code: string): (key: LocaleKey) => string {
  return (key: LocaleKey) => translate(code, key);
}

/** Returns the full dictionary for a language, merged over English. */
export function getDictionary(code: string): Record<LocaleKey, string> {
  return { ...LOCALES[DEFAULT_LANGUAGE], ...(LOCALES[code] ?? {}) };
}
