import { defineConfig } from "tsup";

const shared = {
  entry: { index: "src/index.ts" },
  platform: "browser",
  target: "es2019",
  treeshake: true,
} as const;

export default defineConfig([
  {
    ...shared,
    // Ships readable: nicer stack traces, and npm users never ask for a CDN file.
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
  },
  {
    ...shared,
    // The CDN build is minified, because over the wire that's what counts.
    format: ["iife"],
    globalName: "DotWave",
    minify: true,
    sourcemap: true,
  },
]);
