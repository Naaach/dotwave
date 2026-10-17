import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

/**
 * Dependency-free static server for the examples, so `pnpm demo` works right
 * after `pnpm build` with nothing else installed.
 */

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const PORT = Number(process.env.PORT ?? 5173);
const ENTRY = process.env.ENTRY ?? "/examples/index.html";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/") pathname = ENTRY;

  // Keep requests inside the project folder.
  const target = join(ROOT, normalize(pathname).replace(/^(\.\.[/\\])+/, ""));

  if (!existsSync(target) || !statSync(target).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end(`404 ${pathname}`);
    return;
  }

  response.writeHead(200, {
    "content-type": TYPES[extname(target)] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(target).pipe(response);
});

server.listen(PORT, () => {
  console.log(`dotwave demo  ->  http://localhost:${PORT}${ENTRY}`);
  console.log("Ctrl+C to stop.");
});
