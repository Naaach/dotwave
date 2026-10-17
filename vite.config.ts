import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

/** Absolute path inside the repository, from a `node:url` relative path. */
const repo = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // The site (playground + docs) lives in site/ and always runs against the
  // library source, so `pnpm demo` works without a previous `pnpm build`.
  root: repo("./site/"),

  resolve: {
    alias: { dotwave: repo("./src/index.ts") },
  },

  build: {
    // site/dist — ignored by the root `dist` gitignore rule.
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        playground: repo("./site/index.html"),
        docs: repo("./site/docs/index.html"),
        esm: repo("./site/esm/index.html"),
        minimal: repo("./site/minimal/index.html"),
      },
    },
  },

  server: { port: 5173 },
  preview: { port: 4173 },
});
