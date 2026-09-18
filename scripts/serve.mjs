#!/usr/bin/env node
/**
 * Minimal local server: serves the static files and answers /api/config from
 * the environment, so the app behaves the same locally as on Vercel without
 * needing the Vercel CLI.
 *
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... npm run serve
 *
 * `vercel dev` is still the closest match to production; this is the
 * no-install fallback.
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = Number(process.env.PORT) || 4173;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".csv": "text/csv; charset=utf-8"
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://localhost:${PORT}`);

  if (url.pathname === "/api/config") {
    const body = JSON.stringify({
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
      configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    });
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    response.end(body);
    return;
  }

  const relative = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const target = join(ROOT, relative === "/" ? "index.html" : relative);

  try {
    const info = await stat(target);
    const file = info.isDirectory() ? join(target, "index.html") : target;
    const body = await readFile(file);
    response.writeHead(200, {
      "Content-Type": TYPES[extname(file)] || "application/octet-stream"
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Bible Plan running at http://localhost:${PORT}`);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log(
      "SUPABASE_URL / SUPABASE_ANON_KEY are not set — accounts will be off and the plan stays in localStorage."
    );
  }
});
