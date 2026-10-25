import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { frontierResponse } from "./frontier-proxy.mjs";
import { assertSupportedNode } from "./node-runtime.mjs";

assertSupportedNode();
const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), "public"));
const port = Number(process.env.PORT || 8768);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid preview port");
const mime = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".avif": "image/avif",
  ".ico": "image/x-icon", ".mp4": "video/mp4", ".webm": "video/webm",
  ".woff": "font/woff", ".woff2": "font/woff2", ".pdf": "application/pdf",
};
const insideRoot = path => path === root || path.startsWith(root + sep);

function plain(res, status, message, method, headers = {}) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(method === "HEAD" ? undefined : message);
}

async function staticFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes("\0") || decoded.includes("\\")) return null;
  const candidate = resolve(root, "." + decoded);
  if (!insideRoot(candidate)) return null;
  const choices = [candidate];
  if (!extname(candidate)) choices.push(candidate + ".html");
  choices.push(resolve(candidate, "index.html"));
  for (const choice of choices) {
    try {
      const path = await realpath(choice);
      if (!insideRoot(path)) continue;
      const info = await stat(path);
      if (info.isFile()) return { path, size: info.size };
    } catch (error) {
      if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error;
    }
  }
  return null;
}

function byteRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if ((first !== null && !Number.isSafeInteger(first)) || (last !== null && !Number.isSafeInteger(last))) return null;
  const start = first === null ? Math.max(0, size - last) : first;
  const end = first === null || last === null ? size - 1 : Math.min(last, size - 1);
  return start >= size || start > end ? null : { start, end };
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname === "/api/frontier") {
      const response = await frontierResponse(new Request(url, { method: req.method }));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(req.method === "HEAD" ? undefined : Buffer.from(await response.arrayBuffer()));
      return;
    }
    if (url.pathname === "/api/subscribe") {
      plain(res, 503, "Newsletter signup is unavailable in local preview.", req.method);
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      plain(res, 405, "Method not allowed.", req.method, { Allow: "GET, HEAD" });
      return;
    }
    const file = await staticFile(url.pathname);
    if (!file) { plain(res, 404, "Not found.", req.method); return; }
    const range = req.headers.range ? byteRange(req.headers.range, file.size) : undefined;
    if (range === null) {
      plain(res, 416, "Range not satisfiable.", req.method, { "Content-Range": `bytes */${file.size}` });
      return;
    }
    res.writeHead(range ? 206 : 200, {
      "Content-Type": mime[extname(file.path).toLowerCase()] || "application/octet-stream",
      "Content-Length": range ? range.end - range.start + 1 : file.size,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...(range ? { "Content-Range": `bytes ${range.start}-${range.end}/${file.size}` } : {}),
    });
    if (req.method === "HEAD" || file.size === 0) { res.end(); return; }
    await pipeline(createReadStream(file.path, range), res);
  } catch {
    if (!res.headersSent) plain(res, 500, "Preview request failed.", req.method);
    else res.destroy();
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Qaieo preview: http://127.0.0.1:${port}/index.html`);
});
