// ============================================================================
// Vercel serverless function: POST /api/search-gemini
// ----------------------------------------------------------------------------
// Keeps the Gemini API key on the server. Set GEMINI_KEY in the Vercel project
// settings (Settings -> Environment Variables). The browser never sees it.
//
// Request : { "prompt": string, "language"?: string }   (prompt <= 1000 chars)
// Response: { "text": string }  or  { "error": string } with a 4xx/5xx status
// ============================================================================

const MODEL = "gemini-2.5-flash";
const MAX_PROMPT_LENGTH = 1000;
const UPSTREAM_TIMEOUT_MS = 25000;

const SYSTEM_INSTRUCTION =
  "You are a careful Bible study assistant inside a Bible reading app. " +
  "Answer concisely and plainly. Cite book, chapter and verse for claims about Scripture. " +
  "When Christians or scholars disagree, say so fairly instead of picking a side. " +
  "If a question is unrelated to the Bible, faith or Bible reading, politely steer back to those topics. " +
  "Do not invent verses; if you are unsure, say you are unsure.";

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.GEMINI_KEY;
  if (!key) return res.status(503).json({ error: "Gemini search is not configured" });

  const body = readBody(req);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return res.status(400).json({ error: "prompt must be a non-empty string" });
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({ error: `prompt must be at most ${MAX_PROMPT_LENGTH} characters` });
  }

  const language = typeof body?.language === "string" ? body.language.slice(0, 40).replace(/[^\p{L}\p{N} -]/gu, "") : "";
  const instruction = language
    ? `${SYSTEM_INSTRUCTION} Reply in ${language}.`
    : SYSTEM_INSTRUCTION;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instruction }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.4 }
        }),
        signal: controller.signal
      }
    );

    const payload = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      console.warn("Gemini request failed with status", upstream.status);
      return res.status(502).json({ error: "Gemini search request failed" });
    }

    const text = (payload?.candidates?.[0]?.content?.parts || [])
      .map((part) => part?.text || "")
      .join("")
      .trim();
    if (!text) return res.status(502).json({ error: "Gemini returned no answer" });
    return res.status(200).json({ text });
  } catch (error) {
    console.warn("Gemini request error:", error?.name || "unknown");
    return res.status(502).json({ error: "Gemini search request failed" });
  } finally {
    clearTimeout(timer);
  }
}
