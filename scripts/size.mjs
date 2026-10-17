import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

const DIST = new URL("../dist/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

const kb = (bytes) => `${(bytes / 1024).toFixed(2)} KB`;

function collect(directory) {
  return readdirSync(directory)
    .map((name) => join(directory, name))
    .filter((path) => statSync(path).isFile())
    .filter((path) => !path.endsWith(".map"))
    .sort();
}

const files = collect(DIST);

if (files.length === 0) {
  console.error("dist/ is empty. Run `pnpm build` first.");
  process.exit(1);
}

console.log("file".padEnd(24), "raw".padStart(10), "gzip".padStart(10), "brotli".padStart(10));
console.log("-".repeat(58));

let totalGzip = 0;

for (const file of files) {
  const source = readFileSync(file);
  const gzip = gzipSync(source, { level: 9 });
  const brotli = brotliCompressSync(source);
  totalGzip += gzip.length;

  console.log(
    basename(file).padEnd(24),
    kb(source.length).padStart(10),
    kb(gzip.length).padStart(10),
    kb(brotli.length).padStart(10),
  );
}

console.log("-".repeat(58));
console.log(`${"total gzip".padEnd(24)} ${"".padStart(10)} ${kb(totalGzip).padStart(10)}`);
