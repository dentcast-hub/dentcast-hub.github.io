// No-cache static server for local Plus testing. Serves the repo root with
// Cache-Control: no-store so the browser NEVER serves stale JS/CSS - use this
// instead of `python -m http.server` to stop fighting cached assets.
//
//   node plus-api/scripts-dev/serve.mjs        (defaults to port 5500)
//   PORT=8080 node plus-api/scripts-dev/serve.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..', '..'); // repo root
const PORT = Number(process.env.PORT) || 5500;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let fp = join(ROOT, path);
    if (!fp.startsWith(ROOT + sep) && fp !== ROOT) { res.writeHead(403); return res.end('forbidden'); }
    const s = await stat(fp).catch(() => null);
    if (!s || s.isDirectory()) fp = join(fp, 'index.html');
    const data = await readFile(fp);
    res.writeHead(200, { 'content-type': MIME[extname(fp).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch (_) { res.writeHead(404); res.end('not found'); }
}).listen(PORT, () => console.log(`no-cache dev server: http://localhost:${PORT}  (root: ${ROOT})`));
