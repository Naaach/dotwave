import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

/** Absolute path inside the repository, from a `node:url` relative path. */
const repo = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // The site lives in site/ and always runs against the library source, so
  // `pnpm demo` works without a previous `pnpm build`.
  root: repo("./site/"),

  // The whole site is one document: site/src/main.ts routes between views, so any
  // deep link (/docs/, /esm/, a typo) has to fall back to index.html.
  appType: "spa",

  resolve: {
    alias: { dotwave: repo("./src/index.ts") },
  },

  build: {
    // site/dist — ignored by the root `dist` gitignore rule.
    outDir: "dist",
    emptyOutDir: true,
  },

  server: { port: 5173 },
  preview: { port: 4173 },
});
