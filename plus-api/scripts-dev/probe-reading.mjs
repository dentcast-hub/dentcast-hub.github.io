// End-to-end test for the reading-completion tracker (plus/js/reading.js).
//
// Serves the REAL repo statically, loads a REAL article page with the REAL
// plus.js module graph, mocks only the API edges: /health (base pick), /me
// (a signed-in free user) and /activity (captured). It then proves the AND:
//   - dwell time alone, WITHOUT reaching the end, does NOT fire.
//   - once the end is scrolled into view (both conditions met) it fires exactly
//     one `article_completed` with the right content_id.
//   - a reload does NOT fire again (once-per-session guard).
//
// Run from plus-api/:  node scripts-dev/probe-reading.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const SITE_PORT = 8091;
const SITE_ORIGIN = `http://localhost:${SITE_PORT}`;
const ARTICLE = '/insight/insight-1.html'; // short prose -> 30s floor threshold
const CONTENT_ID = 'insight/insight-1';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml',
};

// --- tiny static file server for the repo root ------------------------------
const server = http.createServer((req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const abs = path.join(REPO_ROOT, p);
    if (!abs.startsWith(REPO_ROOT) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(abs)] || 'application/octet-stream' });
    fs.createReadStream(abs).pipe(res);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
await new Promise((r) => server.listen(SITE_PORT, r));

const CORS = {
  'access-control-allow-origin': SITE_ORIGIN,
  'access-control-allow-credentials': 'true',
  'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const activityPosts = [];
const pageErrors = [];

const browser = await chromium.launch({ channel: 'msedge' }).catch(() => chromium.launch());
const context = await browser.newContext({
  viewport: { width: 390, height: 480 }, // short + narrow: article overflows -> scroll required
  isMobile: true, hasTouch: true, deviceScaleFactor: 2,
});

// Mock the API surface the tracker + boot path touch (base localhost:8787).
await context.route('http://localhost:8787/**', async (route) => {
  const req = route.request();
  const url = new URL(req.url());
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS, body: '' });
  if (url.pathname === '/health') return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: '{"ok":true}' });
  if (url.pathname === '/me') {
    return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify({
      id: '00000000-0000-0000-0000-000000000001', display_name: 'Tester', tier: 'free',
      phone: '09120000000', telegram_linked: false, current_streak: 0, longest_streak: 0,
      last_active_day: null, active_pathway: null,
    }) });
  }
  if (url.pathname === '/activity') {
    let body = {};
    try { body = JSON.parse(req.postData() || '{}'); } catch (_) { /* ignore */ }
    activityPosts.push(body);
    return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: '{"ok":true,"id":1}' });
  }
  // anything else the boot path hits (highlights, tree, push, ...) -> empty-ish OK
  return route.fulfill({ status: 200, headers: CORS, contentType: 'application/json', body: '{}' });
});

const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error') pageErrors.push(m.text()); });
page.on('pageerror', (e) => pageErrors.push('pageerror: ' + e.message));

const results = [];
const check = (name, cond, extra = '') => { results.push({ name, pass: !!cond, extra }); };

await page.goto(SITE_ORIGIN + ARTICLE, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.dcp-wb-button', { timeout: 10000 }).catch(() => {});

// Preconditions: tracker's environment is right.
const pre = await page.evaluate(async () => {
  const link = [...document.querySelectorAll('link[href*="/plus/plus.css"]')][0];
  const v = link ? new URL(link.href).search : '';
  const cfg = await import('/plus/js/config.js' + v);
  const prose = cfg.findProseRoot();
  const words = prose ? (prose.textContent || '').trim().split(/\s+/).length : 0;
  const estFull = (words / cfg.READ_WPM) * 60000;
  const threshold = Math.min(cfg.READ_MAX_MS, Math.max(cfg.READ_MIN_MS, estFull * cfg.READ_FRACTION));
  return {
    hasButton: !!document.querySelector('.dcp-wb-button'),
    hasProse: !!prose,
    scrollable: document.body.scrollHeight > window.innerHeight,
    endInViewAtTop: prose ? prose.getBoundingClientRect().bottom <= window.innerHeight + 4 : null,
    words, thresholdMs: Math.round(threshold),
  };
});
check('workbench button injected (module graph loaded)', pre.hasButton);
check('prose root found', pre.hasProse);
check('page overflows viewport (scroll is required)', pre.scrollable, `scrollable=${pre.scrollable}`);
check('prose end NOT in view at the top (scroll genuinely required)', pre.endInViewAtTop === false, `endInViewAtTop=${pre.endInViewAtTop}`);
console.log(`article words=${pre.words}  computed threshold=${(pre.thresholdMs / 1000).toFixed(0)}s`);

// Phase 1: dwell PAST the threshold but DO NOT scroll -> must NOT fire (end not reached).
const dwellWait = pre.thresholdMs + 2500;
console.log(`waiting ${(dwellWait / 1000).toFixed(0)}s at the top (no scroll)...`);
await page.waitForTimeout(dwellWait);
check('no fire from dwell alone (end not reached)', activityPosts.length === 0, `posts=${activityPosts.length}`);

// Phase 2: now scroll the end into view -> both conditions met -> fires once.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2500);
check('fired after reaching the end', activityPosts.length === 1, `posts=${activityPosts.length}`);
check('action is article_completed', activityPosts[0] && activityPosts[0].action === 'article_completed', JSON.stringify(activityPosts[0] || null));
check('content_id is correct', activityPosts[0] && activityPosts[0].content_id === CONTENT_ID, activityPosts[0] && activityPosts[0].content_id);

// Phase 3: keep scrolling/waiting -> still exactly one (idempotent this session).
await page.evaluate(() => window.scrollTo(0, 0));
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2500);
check('does not double-fire', activityPosts.length === 1, `posts=${activityPosts.length}`);

// Phase 4: reload -> sessionStorage guard -> does not fire again.
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForSelector('.dcp-wb-button', { timeout: 10000 }).catch(() => {});
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(3000);
check('no re-fire after reload (once-per-session guard)', activityPosts.length === 1, `posts=${activityPosts.length}`);

console.log('\n--- results ---');
let allPass = true;
for (const r of results) {
  if (!r.pass) allPass = false;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.extra ? '  [' + r.extra + ']' : ''}`);
}
if (pageErrors.length) console.log('\nPAGE ERRORS:\n' + pageErrors.slice(0, 8).join('\n'));
console.log(`\n${allPass ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);

await browser.close();
server.close();
process.exit(allPass ? 0 : 1);
