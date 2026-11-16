import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist"),
  port = 4173;
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
};
http
  .createServer(async (req, res) => {
    try {
      const raw = decodeURIComponent(
          new URL(req.url, "http://localhost").pathname,
        ),
        name = raw.endsWith("/") ? raw + "index.html" : raw,
        file = path.resolve(root, "." + name);
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const bytes = await fs.readFile(file);
      res.writeHead(200, {
        "content-type": mime[path.extname(file)] || "application/octet-stream",
        "cache-control": "no-cache",
      });
      res.end(bytes);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Local: http://localhost:${port}/`),
  );
