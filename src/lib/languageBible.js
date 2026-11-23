// ============================================================================
// languageBible.js
// ----------------------------------------------------------------------------
// Picks the Bible translation that goes with a web UI language, so changing
// the app language also switches the Bible text in the background (there is
// deliberately no separate "Bible language" setting).
//
// The decision itself is a pure function over the HelloAO translation list so
// it can be unit-tested; `resolveBibleForLanguage` is the thin async wrapper
// that fetches the list.
// ============================================================================

/** ISO 639-1 UI language code -> the ISO 639-3 codes HelloAO may use. */
const ISO3 = {
  en: ["eng"], id: ["ind"], es: ["spa"], zh: ["zho", "cmn", "chi"], hi: ["hin"],
  ar: ["ara", "arb"], pt: ["por"], bn: ["ben"], ru: ["rus"], ja: ["jpn"],
  de: ["deu", "ger"], jv: ["jav"], ko: ["kor"], fr: ["fra", "fre"], tr: ["tur"],
  vi: ["vie"], te: ["tel"], mr: ["mar"], ta: ["tam"], ur: ["urd"], it: ["ita"],
  th: ["tha"], gu: ["guj"], fa: ["fas", "pes", "per"], pl: ["pol"], ps: ["pus", "pbt"],
  kn: ["kan"], ml: ["mal"], su: ["sun"], ha: ["hau"], or: ["ori", "ory"],
  my: ["mya", "bur"], uk: ["ukr"], tl: ["tgl", "fil"], yo: ["yor"], uz: ["uzb", "uzn"],
  sd: ["snd"], am: ["amh"], ro: ["ron", "rum"], om: ["orm"], ig: ["ibo"],
  az: ["aze", "azj"], nl: ["nld", "dut"], mg: ["mlg"], ne: ["nep"], si: ["sin"],
  km: ["khm"], tk: ["tuk"], as: ["asm"], so: ["som"], hu: ["hun"], el: ["ell", "gre"],
  ny: ["nya"], kk: ["kaz"], zu: ["zul"], cs: ["ces", "cze"], rw: ["kin"], ht: ["hat"],
  qu: ["que"], rn: ["run"], sv: ["swe"], sn: ["sna"], ug: ["uig"], he: ["heb"]
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function translationNames(t) {
  return [t.name, t.englishName, t.shortName].map(normalize).filter(Boolean);
}

function matchesLanguage(t, code, englishName) {
  const lang = normalize(t.language).replace(/ /g, "");
  if (lang && (lang === code || (ISO3[code] || []).includes(lang))) return true;
  const langName = normalize(t.languageEnglishName || t.languageName);
  return Boolean(langName && englishName && langName === normalize(englishName));
}

function rank(a, b, pairedName) {
  const aExact = translationNames(a).includes(pairedName) ? 1 : 0;
  const bExact = translationNames(b).includes(pairedName) ? 1 : 0;
  if (aExact !== bExact) return bExact - aExact;
  const aBooks = Number(a.numberOfBooks) || 0;
  const bBooks = Number(b.numberOfBooks) || 0;
  if (aBooks !== bBooks) return bBooks - aBooks;
  return String(a.englishName || a.name || a.id).localeCompare(String(b.englishName || b.name || b.id));
}

/**
 * Decides what to do with the Bible translation when the UI language changes.
 *
 * @param {object} args
 * @param {Array<object>} args.translations  HelloAO available_translations list
 * @param {string} args.code                 target UI language code (e.g. "id")
 * @param {string} [args.englishName]        English language name (e.g. "Indonesian")
 * @param {string} [args.pairedName]         catalog Bible name for the language (e.g. "Terjemahan Baru")
 * @param {string} args.currentId            currently preferred translation id
 * @param {string} args.defaultId            app default translation id (BSB)
 * @returns {{ action: "keep" | "switch" | "none", id?: string, name?: string }}
 */
export function pickTranslationForLanguage({
  translations,
  code,
  englishName,
  pairedName,
  currentId,
  defaultId
}) {
  const list = Array.isArray(translations) ? translations : [];
  const paired = normalize(pairedName);
  const current = list.find((t) => t.id === currentId);

  // Already reading in this language: nothing to change.
  if (current && matchesLanguage(current, code, englishName)) return { action: "keep" };

  if (code === "en") {
    // A translation from another provider (API.Bible, YouVersion) isn't in the
    // HelloAO list; it is English, so leave it alone.
    if (!current) return { action: "keep" };
    const fallback = list.find((t) => t.id === defaultId) || list.find((t) => matchesLanguage(t, "en", "English"));
    return fallback
      ? { action: "switch", id: fallback.id, name: fallback.englishName || fallback.name || fallback.id }
      : { action: "none" };
  }

  let candidates = list.filter((t) => matchesLanguage(t, code, englishName));
  if (candidates.length === 0 && paired) {
    candidates = list.filter((t) => translationNames(t).some((n) => n === paired || n.includes(paired)));
  }
  if (candidates.length === 0) return { action: "none" };

  const best = [...candidates].sort((a, b) => rank(a, b, paired))[0];
  return { action: "switch", id: best.id, name: best.englishName || best.name || best.id };
}
