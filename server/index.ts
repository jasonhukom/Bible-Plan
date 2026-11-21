import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth.js";

const app = Fastify({ logger: true });
const allowedOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";
await app.register(cors, { origin: allowedOrigin, credentials: true, methods: ["GET", "POST", "OPTIONS"] });
await app.register(fastifyStatic, { root: path.join(process.cwd(), "public"), serve: false });

app.route({
  method: ["GET", "POST"],
  url: "/api/auth/*",
  async handler(request, reply) {
    try {
      const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
      const headers = fromNodeHeaders(request.headers);
      const webRequest = new Request(url, {
        method: request.method,
        headers,
        ...(request.body !== undefined && request.method !== "GET"
          ? { body: typeof request.body === "string" ? request.body : JSON.stringify(request.body) }
          : {}),
      });
      const response = await auth.handler(webRequest);
      reply.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "set-cookie") reply.header(key, value);
      });
      const cookies = response.headers.getSetCookie();
      if (cookies.length) reply.header("set-cookie", cookies);
      return reply.send(response.body ? await response.text() : null);
    } catch (error) {
      request.log.error(error, "Better Auth request failed");
      return reply.status(500).send({ error: "Authentication request failed" });
    }
  },
});

app.get("/api/version", async () => ({
  version: process.env.APP_VERSION ?? "Alpha0.0.1",
  buildHash: process.env.BUILD_HASH ?? "unknown",
}));

app.post<{ Body: { prompt?: unknown } }>("/api/search-gemini", async (request, reply) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
  if (!session) return reply.status(401).send({ error: "Authentication required" });
  const prompt = request.body?.prompt;
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 4000) {
    return reply.status(400).send({ error: "prompt must be a non-empty string of at most 4000 characters" });
  }
  const key = process.env.GEMINI_KEY;
  if (!key) return reply.status(503).send({ error: "Gemini search is not configured" });
  const upstream = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt.trim() }] }] }) },
  );
  const payload = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    request.log.warn({ status: upstream.status }, "Gemini API request failed");
    return reply.status(502).send({ error: "Gemini search request failed" });
  }
  return reply.send(payload);
});

app.get("/", async (_request, reply) => reply.sendFile("index.html"));
app.get("/*", async (request, reply) => {
  const pathname = new URL(request.url, "http://localhost").pathname.slice(1);
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return reply.sendFile(pathname);
  return reply.sendFile("index.html");
});

await app.listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 3000) });

