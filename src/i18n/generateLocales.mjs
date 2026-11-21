#!/usr/bin/env node
/**
 * Lightweight, dependency-free generator for the Bible Plan i18n bundles.
 *
 * This is the single source of truth for:
 *   - locale JSON bundles  -> ./locales/<code>.json
 *   - language metadata    -> ./languages.json
 *   - Bible translation catalog -> ./bibleTranslations.json
 *
 * It is intentionally synchronous, uses only Node built-ins and writes small
 * files one at a time so it stays headless / low-CPU / low-RAM.
 *
 * Usage:  node src/i18n/generateLocales.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = join(HERE, "locales");

/** Canonical key order. The English bundle defines the reference key set. */
export const KEY_ORDER = [
  "appName",
  "nav.home",
  "nav.plans",
  "nav.profile",
  "nav.settings",
  "action.start",
  "action.continue",
  "action.complete",
  "action.next",
  "action.back",
  "action.save",
  "action.cancel",
  "common.search",
  "common.loading",
  "common.error",
  "home.welcome",
  "home.todayReading",
  "plans.title",
  "reader.chapter",
  "reader.verse",
  "settings.language",
  "settings.theme",
  "settings.notifications",
  "profile.streak",
];

/**
 * Language metadata: code, English name, native name, text direction,
 * Bible translation id and human-readable Bible translation name.
 */
export const LANGUAGES = [
  ["en", "English", "English", "ltr", "KJV", "King James Version"],
  ["id", "Indonesian", "Bahasa Indonesia", "ltr", "TB", "Terjemahan Baru"],
  ["es", "Spanish", "Español", "ltr", "RVA", "Reina-Valera Antigua"],
  ["zh", "Mandarin Chinese", "中文", "ltr", "CUV", "Chinese Union Version"],
  ["hi", "Hindi", "हिन्दी", "ltr", "HINDI", "Hindi Bible"],
  ["ar", "Arabic", "العربية", "rtl", "SVD", "Smith Van Dyke Arabic Bible"],
  ["pt", "Portuguese", "Português", "ltr", "ACF", "Almeida Revista e Atualizada"],
  ["bn", "Bengali", "বাংলা", "ltr", "BEN", "Bengali Bible"],
  ["ru", "Russian", "Русский", "ltr", "RSB", "Russian Synodal Bible"],
  ["ja", "Japanese", "日本語", "ltr", "JPN", "Japanese Denmo Bible"],
  ["de", "German", "Deutsch", "ltr", "LUT", "Luther Bible 1912"],
  ["jv", "Javanese", "Jawa", "ltr", "JAV", "Javanese Bible"],
  ["ko", "Korean", "한국어", "ltr", "KRV", "Korean Revised Version"],
  ["fr", "French", "Français", "ltr", "LSG", "Louis Segond Bible"],
  ["tr", "Turkish", "Türkçe", "ltr", "TUR", "Turkish Bible"],
  ["vi", "Vietnamese", "Tiếng Việt", "ltr", "VI", "Vietnamese Bible"],
  ["te", "Telugu", "తెలుగు", "ltr", "TEL", "Telugu Bible"],
  ["mr", "Marathi", "मराठी", "ltr", "MAR", "Marathi Bible"],
  ["ta", "Tamil", "தமிழ்", "ltr", "TAM", "Tamil Bible"],
  ["ur", "Urdu", "اردو", "rtl", "URD", "Urdu Bible"],
  ["it", "Italian", "Italiano", "ltr", "DIO", "Italian Diodati Bible"],
  ["th", "Thai", "ไทย", "ltr", "THA", "Thai Bible"],
  ["gu", "Gujarati", "ગુજરાતી", "ltr", "GUJ", "Gujarati Bible"],
  ["fa", "Persian", "فارسی", "rtl", "FAR", "Persian Bible"],
  ["pl", "Polish", "Polski", "ltr", "BGP", "Polish Bible of Gdańsk"],
  ["ps", "Pashto", "پښتو", "rtl", "PAS", "Pashto Bible"],
  ["kn", "Kannada", "ಕನ್ನಡ", "ltr", "KAN", "Kannada Bible"],
  ["ml", "Malayalam", "മലയാളം", "ltr", "MAL", "Malayalam Bible"],
  ["su", "Sundanese", "Sunda", "ltr", "SUN", "Sundanese Bible"],
  ["ha", "Hausa", "Hausa", "ltr", "HAU", "Hausa Bible"],
  ["or", "Odia", "ଓଡ଼ିଆ", "ltr", "ORI", "Odia Bible"],
  ["my", "Burmese", "မြန်မာ", "ltr", "BUR", "Burmese Bible"],
  ["hak", "Hakka", "客家話", "ltr", "HAK", "Hakka Bible"],
  ["uk", "Ukrainian", "Українська", "ltr", "UKR", "Ukrainian Bible"],
  ["bho", "Bhojpuri", "भोजपुरी", "ltr", "BHO", "Bhojpuri Bible"],
  ["tl", "Tagalog", "Tagalog", "ltr", "ADB", "Ang Dating Biblia"],
  ["yo", "Yoruba", "Yorùbá", "ltr", "YOR", "Yoruba Bible"],
  ["mai", "Maithili", "मैथिली", "ltr", "MAI", "Maithili Bible"],
  ["uz", "Uzbek", "Oʻzbekcha", "ltr", "UZB", "Uzbek Bible"],
  ["sd", "Sindhi", "سنڌي", "rtl", "SND", "Sindhi Bible"],
  ["am", "Amharic", "አማርኛ", "ltr", "AMH", "Amharic Bible"],
  ["ff", "Fula", "Fulfulde", "ltr", "FUL", "Fula Bible"],
  ["ro", "Romanian", "Română", "ltr", "COR", "Cornilescu Bible"],
  ["om", "Oromo", "Afaan Oromoo", "ltr", "ORO", "Oromo Bible"],
  ["ig", "Igbo", "Igbo", "ltr", "IGB", "Igbo Bible"],
  ["az", "Azerbaijani", "Azərbaycanca", "ltr", "AZE", "Azerbaijani Bible"],
  ["awa", "Awadhi", "अवधी", "ltr", "AWA", "Awadhi Bible"],
  ["nl", "Dutch", "Nederlands", "ltr", "SV", "Statenvertaling"],
  ["ku", "Kurdish", "کوردی", "rtl", "KUR", "Kurdish Bible"],
  ["sh", "Serbo-Croatian", "Srpskohrvatski", "ltr", "SHB", "Serbo-Croatian Bible"],
  ["mg", "Malagasy", "Malagasy", "ltr", "MLG", "Malagasy Bible"],
  ["skr", "Saraiki", "سرائیکی", "rtl", "SKR", "Saraiki Bible"],
  ["ne", "Nepali", "नेपाली", "ltr", "NEP", "Nepali Bible"],
  ["si", "Sinhala", "සිංහල", "ltr", "SLK", "Sinhala Bible"],
  ["ctg", "Chittagonian", "চিটাগাঁইয়া", "ltr", "CTG", "Chittagonian Bible"],
  ["za", "Zhuang", "Vahcuengh", "ltr", "ZHA", "Zhuang Bible"],
  ["km", "Khmer", "ខ្មែរ", "ltr", "KHM", "Khmer Bible"],
  ["tk", "Turkmen", "Türkmençe", "ltr", "TKM", "Turkmen Bible"],
  ["as", "Assamese", "অসমীয়া", "ltr", "ASS", "Assamese Bible"],
  ["mad", "Madurese", "Madhurâ", "ltr", "MAD", "Madurese Bible"],
  ["so", "Somali", "Soomaali", "ltr", "SOM", "Somali Bible"],
  ["mwr", "Marwari", "मारवाड़ी", "ltr", "MWR", "Marwari Bible"],
  ["mag", "Magahi", "मगही", "ltr", "MGH", "Magahi Bible"],
  ["bgc", "Haryanvi", "हरियाणवी", "ltr", "HARY", "Haryanvi Bible"],
  ["hu", "Hungarian", "Magyar", "ltr", "KAR", "Károli Bible"],
  ["hne", "Chhattisgarhi", "छत्तीसगढ़ी", "ltr", "HNE", "Chhattisgarhi Bible"],
  ["el", "Greek", "Ελληνικά", "ltr", "GRK", "Greek Bible"],
  ["ny", "Chewa", "Chichewa", "ltr", "CHE", "Chichewa Bible"],
  ["dcc", "Deccani Urdu", "دکنی", "rtl", "DCC", "Deccani Bible"],
  ["ak", "Akan", "Akan", "ltr", "AKN", "Akan Bible"],
  ["kk", "Kazakh", "Қазақша", "ltr", "KAZ", "Kazakh Bible"],
  ["mnp", "Min Bei", "闽北语", "ltr", "MNP", "Min Bei Bible"],
  ["syl", "Sylheti", "ꠍꠤꠟꠐꠤ", "ltr", "SYL", "Sylheti Bible"],
  ["zu", "Zulu", "isiZulu", "ltr", "ZUL", "Zulu Bible"],
  ["cs", "Czech", "Čeština", "ltr", "KRAL", "Czech Kralická Bible"],
  ["rw", "Kinyarwanda", "Ikinyarwanda", "ltr", "RWA", "Kinyarwanda Bible"],
  ["dhv", "Dhundhari", "ढूंढ़ाड़ी", "ltr", "DHV", "Dhundhari Bible"],
  ["ht", "Haitian Creole", "Kreyòl Ayisyen", "ltr", "HAI", "Haitian Creole Bible"],
  ["mdz", "Min Dong", "闽东语", "ltr", "MDZ", "Min Dong Bible"],
  ["ilo", "Ilokano", "Ilokano", "ltr", "ILO", "Ilokano Bible"],
  ["qu", "Quechua", "Runasimi", "ltr", "QUE", "Quechua Bible"],
  ["rn", "Kirundi", "Ikirundi", "ltr", "RND", "Kirundi Bible"],
  ["sv", "Swedish", "Svenska", "ltr", "SV1917", "Swedish Bible 1917"],
  ["hmn", "Hmong", "Hmoob", "ltr", "HMN", "Hmong Bible"],
  ["sn", "Shona", "chiShona", "ltr", "SHO", "Shona Bible"],
  ["ug", "Uyghur", "ئۇيغۇرچە", "rtl", "UYG", "Uyghur Bible"],
  ["hil", "Hiligaynon", "Hiligaynon", "ltr", "HIL", "Hiligaynon Bible"],
  ["he", "Hebrew", "עברית", "rtl", "HEB", "Hebrew Bible"],
];

/**
 * Translation rows. One line per language, fields pipe-delimited in the
 * exact KEY_ORDER above. Filled by the translation authoring step.
 */
export const RAW_ROWS = `
en|Bible Plan|Home|Plans|Profile|Settings|Start|Continue|Complete|Next|Back|Save|Cancel|Search|Loading…|Something went wrong|Welcome|Today's Reading|Reading Plans|Chapter|Verse|Language|Theme|Notifications|Streak
`.trim();

function parseRows(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const fields = line.split("|");
      if (fields.length !== KEY_ORDER.length + 1) {
        throw new Error(
          `Row ${index + 1} has ${fields.length} fields; expected ${KEY_ORDER.length + 1}: ${line.slice(0, 80)}`
        );
      }
      const [code, ...values] = fields;
      const dictionary = {};
      KEY_ORDER.forEach((key, i) => {
        const value = values[i].trim();
        if (!value) throw new Error(`Empty value for ${code}.${key}`);
        if (value.includes("|")) throw new Error(`Pipe in value for ${code}.${key}`);
        dictionary[key] = value;
      });
      return [code, dictionary];
    });
}

function buildLanguageMetadata() {
  return LANGUAGES.map(([code, englishName, nativeName, dir, bibleTranslationId, bibleName]) => ({
    code,
    englishName,
    nativeName,
    dir,
    bibleTranslationId,
    bibleName,
  }));
}

function buildBibleTranslations() {
  return LANGUAGES.map(([code, , , , id, name]) => ({
    id,
    name,
    language: code,
    license: "public-domain-or-open",
  }));
}

async function writeJson(file, value) {
  const path = join(HERE, file);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  console.log(`wrote ${file}`);
}

const GENERATED_BANNER = "// AUTO-GENERATED by generateLocales.mjs. Do not edit by hand.\n\n";

function generateLocalesModule(rows) {
  const keys = JSON.stringify(KEY_ORDER, null, 2);
  const bundles = rows
    .map(([code, dict]) => `  ${JSON.stringify(code)}: ${JSON.stringify(dict, null, 2)},`)
    .join("\n");
  return `${GENERATED_BANNER}export const LOCALE_KEYS = ${keys} as const;

export type LocaleKey = (typeof LOCALE_KEYS)[number];

export const LOCALES: Record<string, Record<LocaleKey, string>> = {
${bundles}
};
`;
}

function generateLanguagesModule(languages) {
  return `${GENERATED_BANNER}export interface LanguageMeta {
  code: string;
  englishName: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  bibleTranslationId: string;
  bibleName: string;
}

export const LANGUAGES: LanguageMeta[] = ${JSON.stringify(languages, null, 2)} as LanguageMeta[];

export const LANGUAGE_CODES: string[] = LANGUAGES.map((language) => language.code);
`;
}

function generateBibleTranslationsModule(translations) {
  return `${GENERATED_BANNER}export interface BibleTranslationMeta {
  id: string;
  name: string;
  language: string;
  license: "public-domain-or-open";
}

export const BIBLE_TRANSLATIONS: BibleTranslationMeta[] = ${JSON.stringify(
    translations,
    null,
    2
  )} as BibleTranslationMeta[];

export const BIBLE_TRANSLATION_IDS: string[] = BIBLE_TRANSLATIONS.map((translation) => translation.id);
`;
}

async function main() {
  const rows = parseRows(RAW_ROWS);
  const rowMap = new Map(rows);
  const expectedCodes = LANGUAGES.map(([code]) => code);

  if (rows.length !== expectedCodes.length) {
    throw new Error(`Expected ${expectedCodes.length} translation rows, got ${rows.length}`);
  }
  if (rowMap.size !== rows.length) {
    throw new Error("Duplicate language codes in translation rows");
  }
  for (const code of expectedCodes) {
    if (!rowMap.has(code)) throw new Error(`Missing translation row for ${code}`);
  }

  const translationIds = LANGUAGES.map(([, , , , id]) => id);
  if (new Set(translationIds).size !== translationIds.length) {
    throw new Error("Duplicate Bible translation ids in language metadata");
  }

  const languageMetadata = buildLanguageMetadata();
  const bibleTranslations = buildBibleTranslations();

  await mkdir(LOCALES_DIR, { recursive: true });
  await writeJson("languages.json", languageMetadata);
  await writeJson("bibleTranslations.json", bibleTranslations);
  await writeFile(join(HERE, "generatedLanguages.ts"), generateLanguagesModule(languageMetadata), "utf8");
  await writeFile(
    join(HERE, "generatedBibleTranslations.ts"),
    generateBibleTranslationsModule(bibleTranslations),
    "utf8"
  );

  for (const code of expectedCodes) {
    await writeJson(join("locales", `${code}.json`), rowMap.get(code));
  }
  await writeFile(join(HERE, "generatedLocales.ts"), generateLocalesModule(rows), "utf8");

  console.log(`generated ${expectedCodes.length} locale bundles with ${KEY_ORDER.length} keys each`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
