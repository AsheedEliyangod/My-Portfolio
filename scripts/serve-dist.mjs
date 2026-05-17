import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = new URL("../dist/", import.meta.url);
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg"
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
    const clean = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(root.pathname, clean === "/" ? "index.html" : clean);
    const data = await readFile(filePath);
    response.writeHead(200, { "Content-Type": mime[extname(filePath)] || "application/octet-stream" });
    response.end(data);
  } catch {
    const fallback = await readFile(join(root.pathname, "index.html"));
    response.writeHead(200, { "Content-Type": mime[".html"] });
    response.end(fallback);
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Portfolio preview running at http://127.0.0.1:${port}`);
});
