// ============================================================================
// csvLoader.js
// ----------------------------------------------------------------------------
// Loads raw CSV plan text from the bundled Bible-CSV submodule in browser/Vite
// builds, or directly from disk when running Node.js unit tests.
// ============================================================================

const memCache = new Map();

export async function loadCsvPlanText(filename) {
  if (memCache.has(filename)) return memCache.get(filename);

  const isNode =
    typeof process !== "undefined" &&
    Boolean(process.versions?.node) &&
    typeof window === "undefined";

  let text = "";
  if (isNode) {
    const fsModuleName = "node:fs/promises";
    const pathModuleName = "node:path";
    const urlModuleName = "node:url";
    const { readFile } = await import(/* @vite-ignore */ fsModuleName);
    const { dirname, resolve } = await import(/* @vite-ignore */ pathModuleName);
    const { fileURLToPath } = await import(/* @vite-ignore */ urlModuleName);
    const currentDir = dirname(fileURLToPath(import.meta.url));
    text = await readFile(resolve(currentDir, "..", "..", "Bible-CSV", filename), "utf8");
  } else {
    const { CSV_PLANS_BY_FILENAME } = await import("./bibleCsvBundle.js");
    text = CSV_PLANS_BY_FILENAME[filename];
    if (!text) {
      throw new Error(`Missing bundled Bible-CSV plan: ${filename}`);
    }
  }

  memCache.set(filename, text);
  return text;
}
