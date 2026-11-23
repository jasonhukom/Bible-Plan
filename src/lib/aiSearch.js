// ============================================================================
// aiSearch.js
// ----------------------------------------------------------------------------
// Client for the server-side Gemini endpoint (POST /api/search-gemini). The
// API key lives on the server (GEMINI_KEY); the browser only sends the question.
// ============================================================================

export const MAX_QUESTION_LENGTH = 1000;
export const AI_ENDPOINT = "/api/search-gemini";

/** Error with a machine-readable `code`: "empty" | "too-long" | "not-configured" | "failed". */
export class AiSearchError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = "AiSearchError";
    this.code = code;
  }
}

/** Reads the answer from either { text } or a raw Gemini { candidates } payload. */
export function extractAnswer(data) {
  if (typeof data?.text === "string" && data.text.trim()) return data.text.trim();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const joined = parts.map((part) => part?.text || "").join("").trim();
    if (joined) return joined;
  }
  return "";
}

/**
 * @param {{ question: string, language?: string, signal?: AbortSignal, fetchImpl?: typeof fetch }} args
 * @returns {Promise<string>} the answer text
 */
export async function askGemini({ question, language, signal, fetchImpl }) {
  const prompt = String(question || "").trim();
  if (!prompt) throw new AiSearchError("empty");
  if (prompt.length > MAX_QUESTION_LENGTH) throw new AiSearchError("too-long");

  const doFetch = fetchImpl || (typeof fetch === "function" ? fetch.bind(globalThis) : null);
  if (!doFetch) throw new AiSearchError("failed");

  let response;
  try {
    response = await doFetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, language }),
      signal
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new AiSearchError("failed");
  }

  if (response.status === 503) throw new AiSearchError("not-configured");
  if (!response.ok) throw new AiSearchError("failed");

  const data = await response.json().catch(() => null);
  const answer = extractAnswer(data);
  if (!answer) throw new AiSearchError("failed");
  return answer;
}
