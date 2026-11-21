/**
 * Automatic Bible translation pairing.
 *
 * Every web UI language is paired with a public-domain/open Bible translation.
 * Selecting a UI language therefore switches the Bible translation in the
 * background; there is deliberately no separate Bible-language setting.
 */

import { LANGUAGES } from "./generatedLanguages";
import { BIBLE_TRANSLATIONS, type BibleTranslationMeta } from "./generatedBibleTranslations";
import { DEFAULT_LANGUAGE, isSupportedLanguage } from "./index";

export type { BibleTranslationMeta };
export { BIBLE_TRANSLATIONS };

const TRANSLATION_BY_ID = new Map<string, BibleTranslationMeta>(
  BIBLE_TRANSLATIONS.map((translation) => [translation.id, translation])
);

/** web UI language code -> Bible translation metadata. */
export const BIBLE_TRANSLATION_BY_LANGUAGE: ReadonlyMap<string, BibleTranslationMeta> = new Map(
  LANGUAGES.map((language) => {
    const translation = TRANSLATION_BY_ID.get(language.bibleTranslationId);
    if (!translation) {
      throw new Error(
        `No Bible translation '${language.bibleTranslationId}' for UI language '${language.code}'`
      );
    }
    return [language.code, translation] as const;
  })
);

/** Returns the Bible translation ID paired with a UI language. */
export function getBibleTranslationId(webLanguageCode: string): string {
  const translation = BIBLE_TRANSLATION_BY_LANGUAGE.get(webLanguageCode);
  if (translation) return translation.id;
  return BIBLE_TRANSLATION_BY_LANGUAGE.get(DEFAULT_LANGUAGE)!.id;
}

/** Returns full metadata for the Bible translation paired with a UI language. */
export function resolveBibleTranslation(webLanguageCode: string): BibleTranslationMeta {
  return BIBLE_TRANSLATION_BY_LANGUAGE.get(webLanguageCode) ?? BIBLE_TRANSLATION_BY_LANGUAGE.get(DEFAULT_LANGUAGE)!;
}

export interface ResolvedBibleTranslation {
  webLanguageCode: string;
  bibleTranslationId: string;
  name: string;
  dir: "ltr" | "rtl";
}

/** Compact result used by the background resolver. */
export function resolveBibleTranslationPair(webLanguageCode: string): ResolvedBibleTranslation {
  const language = LANGUAGES.find((item) => item.code === webLanguageCode) ?? LANGUAGES[0];
  const translation = resolveBibleTranslation(webLanguageCode);
  return {
    webLanguageCode: language.code,
    bibleTranslationId: translation.id,
    name: translation.name,
    dir: language.dir,
  };
}

export type BibleTranslationListener = (result: ResolvedBibleTranslation) => void;

/**
 * Creates a background resolver that keeps the active Bible translation in
 * sync with the selected UI language. `load` is an optional adapter supplied
 * by the app's Bible service; resolution/caching happens synchronously and the
 * adapter is invoked without blocking the UI.
 */
export function createBibleTranslationResolver(load?: (id: string) => void | Promise<void>) {
  const listeners = new Set<BibleTranslationListener>();
  const cache = new Map<string, ResolvedBibleTranslation>();
  let activeWebLanguage = DEFAULT_LANGUAGE;

  function resolve(webLanguageCode: string): ResolvedBibleTranslation {
    const code = isSupportedLanguage(webLanguageCode) ? webLanguageCode : DEFAULT_LANGUAGE;
    const cached = cache.get(code);
    if (cached) return cached;
    const result = resolveBibleTranslationPair(code);
    cache.set(code, result);
    return result;
  }

  function select(webLanguageCode: string): ResolvedBibleTranslation {
    activeWebLanguage = isSupportedLanguage(webLanguageCode) ? webLanguageCode : DEFAULT_LANGUAGE;
    const result = resolve(activeWebLanguage);

    // Fire-and-forget background fetch of the corresponding translation.
    if (load) {
      void Promise.resolve(load(result.bibleTranslationId)).catch(() => {
        // The UI language switch must never fail because of a Bible fetch.
      });
    }

    listeners.forEach((listener) => listener(result));
    return result;
  }

  function subscribe(listener: BibleTranslationListener): () => void {
    listeners.add(listener);
    listener(resolve(activeWebLanguage));
    return () => listeners.delete(listener);
  }

  return {
    select,
    resolve,
    subscribe,
    getActive: () => resolve(activeWebLanguage),
  };
}
