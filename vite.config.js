import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Serves the compiled desktop/Android installers from /builds/* on the deployed
// site. The OS download button links to these files, and without this copy the
// SPA rewrite on Vercel would answer those URLs with index.html instead.
function copyBuildsPlugin() {
  return {
    name: "copy-builds-folder",
    apply: "build",
    closeBundle() {
      const from = resolve(__dirname, "builds");
      const to = resolve(__dirname, "dist", "builds");
      if (existsSync(from)) cpSync(from, to, { recursive: true });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyBuildsPlugin()],
  server: {
    port: 5173
  },
  build: {
    outDir: "dist",
    sourcemap: true
  }
});
