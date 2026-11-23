// ============================================================================
// translator.js
// ----------------------------------------------------------------------------
// Pure translation lookup, kept free of React and of the generated TypeScript
// bundles so it can be unit-tested with plain Node.
//
// Lookup order for `translate(lang, key)`:
//   1. the language's base locale bundle (the 24 parity-checked keys)
//   2. the language's extra UI strings (src/i18n/uiStrings.js)
//   3. English base bundle, then English UI strings
//   4. the key itself, so a label can never render empty
// ============================================================================

/** Replaces `{name}` placeholders. Unknown placeholders are left as written. */
export function interpolate(text, params) {
  if (!params) return text;
  return String(text).replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  );
}

/**
 * @param {{ locales: Record<string, Record<string, string>>, ui: Record<string, Record<string, string>>, fallback?: string }} sources
 */
export function createTranslate({ locales, ui, fallback = "en" }) {
  function pick(lang, key) {
    return locales?.[lang]?.[key] || ui?.[lang]?.[key] || "";
  }

  return function translate(lang, key, params) {
    const text = pick(lang, key) || pick(fallback, key) || key;
    return interpolate(text, params);
  };
}
