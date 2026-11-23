// ============================================================================
// Unit Tests: i18n translator, language->Bible pairing, AI search client,
// Bible Connections data.
// Run with: node tests/webFeatures.test.js
// ============================================================================

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { createTranslate, interpolate } from "../src/i18n/translator.js";
import { UI_STRINGS } from "../src/i18n/uiStrings.js";
import { pickTranslationForLanguage } from "../src/lib/languageBible.js";
import { AiSearchError, askGemini, extractAnswer } from "../src/lib/aiSearch.js";
import {
  CANON_ORDER,
  COMPOSITION_ORDER,
  CONNECTIONS,
  buildArcs,
  chronologicalOrderFromCsv,
  connectionsForBook,
  defaultOrderForPlan,
  otherEnd
} from "../src/lib/bibleTimeline.js";

console.log("Running web feature unit tests...");

// ---- translator ------------------------------------------------------------
{
  assert.strictEqual(interpolate("{n} languages", { n: 88 }), "88 languages");
  assert.strictEqual(interpolate("Hi {who}", {}), "Hi {who}");

  const tr = createTranslate({
    locales: { en: { "a": "A-en" }, id: { "a": "A-id" } },
    ui: { en: { "b": "B-en {x}" }, id: {} },
    fallback: "en"
  });
  assert.strictEqual(tr("id", "a"), "A-id");
  assert.strictEqual(tr("id", "b", { x: 1 }), "B-en 1", "falls back to English UI strings");
  assert.strictEqual(tr("zz", "a"), "A-en", "unknown language falls back");
  assert.strictEqual(tr("id", "missing.key"), "missing.key", "never renders empty");

  // Every translated UI string must exist in English and keep its placeholders.
  const en = UI_STRINGS.en;
  for (const [code, dict] of Object.entries(UI_STRINGS)) {
    for (const [key, value] of Object.entries(dict)) {
      assert.ok(key in en, `${code}.${key} has no English source`);
      assert.deepStrictEqual(
        (value.match(/\{\w+\}/g) || []).sort(),
        (en[key].match(/\{\w+\}/g) || []).sort(),
        `${code}.${key} placeholders differ from English`
      );
    }
  }
}

// ---- language -> Bible translation ----------------------------------------
{
  const list = [
    { id: "BSB", englishName: "Berean Standard Bible", language: "eng", numberOfBooks: 66 },
    { id: "ind_tb", englishName: "Terjemahan Baru", language: "ind", languageEnglishName: "Indonesian", numberOfBooks: 66 },
    { id: "ind_small", englishName: "Indonesian Portions", language: "ind", numberOfBooks: 5 },
    { id: "spa_rvr", englishName: "Reina Valera", language: "spa", numberOfBooks: 66 }
  ];
  const base = { translations: list, defaultId: "BSB" };

  const toId = pickTranslationForLanguage({ ...base, code: "id", englishName: "Indonesian", currentId: "BSB" });
  assert.deepStrictEqual([toId.action, toId.id], ["switch", "ind_tb"], "prefers the most complete translation");

  const paired = pickTranslationForLanguage({ ...base, code: "id", englishName: "Indonesian", pairedName: "Indonesian Portions", currentId: "BSB" });
  assert.strictEqual(paired.id, "ind_small", "an exact catalog-name match wins");

  assert.strictEqual(pickTranslationForLanguage({ ...base, code: "id", englishName: "Indonesian", currentId: "ind_tb" }).action, "keep");
  assert.strictEqual(pickTranslationForLanguage({ ...base, code: "ja", englishName: "Japanese", currentId: "BSB" }).action, "none");

  const back = pickTranslationForLanguage({ ...base, code: "en", englishName: "English", currentId: "ind_tb" });
  assert.deepStrictEqual([back.action, back.id], ["switch", "BSB"]);

  // A non-HelloAO English translation (e.g. NIV) is left alone when choosing English.
  assert.strictEqual(pickTranslationForLanguage({ ...base, code: "en", englishName: "English", currentId: "NIV-from-api-bible" }).action, "keep");
  assert.strictEqual(pickTranslationForLanguage({ translations: [], code: "id", currentId: "BSB", defaultId: "BSB" }).action, "none");
}

// ---- AI search client ------------------------------------------------------
{
  assert.strictEqual(extractAnswer({ text: " hi " }), "hi");
  assert.strictEqual(extractAnswer({ candidates: [{ content: { parts: [{ text: "a" }, { text: "b" }] } }] }), "ab");
  assert.strictEqual(extractAnswer({}), "");

  const ok = (body, status = 200) => async () => ({ ok: status < 400, status, json: async () => body });
  assert.strictEqual(await askGemini({ question: "  Who is Ruth? ", fetchImpl: ok({ text: "A Moabite." }) }), "A Moabite.");

  const code = async (args) => {
    try {
      await askGemini(args);
    } catch (error) {
      assert.ok(error instanceof AiSearchError);
      return error.code;
    }
    return "no-error";
  };
  assert.strictEqual(await code({ question: "   " }), "empty");
  assert.strictEqual(await code({ question: "x".repeat(1001) }), "too-long");
  assert.strictEqual(await code({ question: "hi", fetchImpl: ok({}, 503) }), "not-configured");
  assert.strictEqual(await code({ question: "hi", fetchImpl: ok({}, 502) }), "failed");
  assert.strictEqual(await code({ question: "hi", fetchImpl: ok({ nope: 1 }) }), "failed");
  assert.strictEqual(await code({ question: "hi", fetchImpl: async () => { throw new Error("offline"); } }), "failed");
}

// ---- Vercel API function ---------------------------------------------------
{
  const { default: handler } = await import("../api/search-gemini.js");
  const call = async (req, env = {}) => {
    const old = process.env.GEMINI_KEY;
    if ("GEMINI_KEY" in env) process.env.GEMINI_KEY = env.GEMINI_KEY; else delete process.env.GEMINI_KEY;
    const res = { code: 0, body: null, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { this.body = b; return this; } };
    try {
      await handler(req, res);
    } finally {
      if (old === undefined) delete process.env.GEMINI_KEY; else process.env.GEMINI_KEY = old;
    }
    return res;
  };

  assert.strictEqual((await call({ method: "GET" })).code, 405);
  assert.strictEqual((await call({ method: "POST", body: { prompt: "hi" } })).code, 503, "no key -> 503");
  assert.strictEqual((await call({ method: "POST", body: { prompt: "" } }, { GEMINI_KEY: "k" })).code, 400);
  assert.strictEqual((await call({ method: "POST", body: { prompt: "x".repeat(1001) } }, { GEMINI_KEY: "k" })).code, 400);
  assert.strictEqual((await call({ method: "POST", body: "{bad json" }, { GEMINI_KEY: "k" })).code, 400);

  // Success path with a stubbed upstream; the key must go in a header, never the URL.
  const realFetch = globalThis.fetch;
  let seen;
  globalThis.fetch = async (url, init) => {
    seen = { url, init };
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: "Answer" }] } }] }) };
  };
  try {
    const res = await call({ method: "POST", body: { prompt: "Who is Ruth?", language: "Indonesian" } }, { GEMINI_KEY: "secret" });
    assert.deepStrictEqual([res.code, res.body.text], [200, "Answer"]);
    assert.ok(!String(seen.url).includes("secret"), "key must not be in the URL");
    assert.strictEqual(seen.init.headers["x-goog-api-key"], "secret");

    globalThis.fetch = async () => ({ ok: false, status: 429, json: async () => ({ error: { message: "quota secret" } }) });
    const failed = await call({ method: "POST", body: { prompt: "hi" } }, { GEMINI_KEY: "secret" });
    assert.strictEqual(failed.code, 502);
    assert.ok(!JSON.stringify(failed.body).includes("quota"), "upstream detail is not leaked");
  } finally {
    globalThis.fetch = realFetch;
  }
}

// ---- Bible connections -----------------------------------------------------
{
  assert.strictEqual(CANON_ORDER.length, 66);
  assert.strictEqual(COMPOSITION_ORDER.length, 66);
  assert.strictEqual(new Set(COMPOSITION_ORDER).size, 66, "no duplicates in composition order");
  assert.deepStrictEqual([...COMPOSITION_ORDER].sort(), [...CANON_ORDER].sort(), "same 66 books");

  const csv = fs.readFileSync(path.join(process.cwd(), "Bible-CSV", "order-chronological.csv"), "utf8");
  const chrono = chronologicalOrderFromCsv(csv);
  assert.strictEqual(chrono.length, 66);
  assert.deepStrictEqual([...chrono].sort(), [...CANON_ORDER].sort());
  assert.strictEqual(chrono[0], "GEN");

  for (const c of CONNECTIONS) {
    assert.ok(CANON_ORDER.includes(c.from.book) && CANON_ORDER.includes(c.to.book), `${c.id}: unknown book`);
    assert.ok(c.from.chapter > 0 && c.to.chapter > 0, `${c.id}: bad chapter`);
  }
  assert.strictEqual(new Set(CONNECTIONS.map((c) => c.id)).size, CONNECTIONS.length);

  for (const order of [CANON_ORDER, COMPOSITION_ORDER, chrono]) {
    const arcs = buildArcs(order);
    assert.strictEqual(arcs.length, CONNECTIONS.length, "every connection is drawable in every order");
    for (let i = 1; i < arcs.length; i++) assert.ok(arcs[i - 1].span >= arcs[i].span, "long arcs first");
  }

  const isa = connectionsForBook("ISA");
  assert.ok(isa.length >= 4);
  assert.ok(isa.every((c) => otherEnd(c, "ISA").book !== "ISA"));
  assert.strictEqual(defaultOrderForPlan({ chronological: true }), "chronological");
  assert.strictEqual(defaultOrderForPlan({ chronological: false }), "canon");
  assert.strictEqual(defaultOrderForPlan(null), "canon");
}

console.log("All web feature tests passed.");
