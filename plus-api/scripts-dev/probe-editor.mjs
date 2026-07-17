// Repro harness: load the REAL workbench.js in a real browser, enter study mode,
// create a highlight, open the note editor, and report where it actually lands
// relative to the viewport + toolbar. Run: node scripts-dev/probe-editor.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..'); // repo root that holds /plus

const html = `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/plus/plus.css">
<style>body{font-family:sans-serif;margin:0}main{padding:16px}</style></head>
<body>
<!-- a transformed ancestor: this is what broke the old position:absolute editor -->
<div style="transform: translateZ(0)">
<main class="article-content-wrap"><h1>عنوان</h1>
<div class="text-box"><h2 id="a">بخش</h2>
<p id="target">این یک پاراگراف نمونه برای هایلایت کردن در میز کار است تا رفتار کادر یادداشت را بسنجیم.</p>
<h3>زیربخش</h3><p>پاراگراف دوم برای پر شدن صفحه.</p></div></main>
</div>
<script type="module">
  import { Workbench } from '/plus/js/workbench.js';
  // stub the API so no network is needed
  window.__hl = [];
  const mod = await import('/plus/js/api.js');
  mod.api.listHighlights = async () => ({ highlights: [] });
  mod.api.createHighlight = async (h) => ({ highlight: { id: 'h1', ...h, note: null } });
  mod.api.updateHighlight = async (id, p) => ({ highlight: { id, exact: 'x', note: p.note ?? null, color: 'yellow', label: null } });
  const root = document.querySelector('.text-box');
  const wb = new Workbench({ contentId: 'x/y', proseRoot: root });
  window.__wb = wb;
  await wb.enter();
  // programmatically open the editor on the target paragraph
  const p = document.getElementById('target');
  wb._openEditor({ id: 'h1', exact: 'یک متن', note: null, color: 'yellow', label: null }, p, {});
  window.__ready = true;
</script></body></html>`;

const results = [];
for (const vp of [{ w: 900, h: 780, name: 'narrow-900' }, { w: 1280, h: 700, name: 'desktop-1280' }, { w: 390, h: 780, name: 'phone-390' }]) {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  // serve /plus/* from disk
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.pathname === '/harness') return route.fulfill({ contentType: 'text/html; charset=utf-8', body: html });
    if (u.pathname.startsWith('/plus/')) {
      const file = path.join(repo, u.pathname);
      return route.fulfill({ path: file });
    }
    return route.fulfill({ status: 404, body: '' });
  });
  await page.goto('http://localhost/harness');
  await page.waitForFunction(() => window.__ready === true, { timeout: 5000 }).catch(() => {});
  const info = await page.evaluate(() => {
    const pop = document.querySelector('.dcp-editor');
    const tb = document.querySelector('.dcp-toolbar');
    if (!pop) return { error: 'no editor' };
    // simulate STALE cached JS trying to shove it to the bottom, under the toolbar:
    pop.style.position = 'absolute';
    pop.style.top = (window.scrollY + 99999) + 'px';
    pop.style.bottom = '';
    const pr = pop.getBoundingClientRect();
    const tr = tb.getBoundingClientRect();
    const cs = getComputedStyle(pop);
    return {
      vh: window.innerHeight,
      toolbarTop: Math.round(tr.top), toolbarH: Math.round(tr.height),
      editorTop: Math.round(pr.top), editorBottom: Math.round(pr.bottom), editorH: Math.round(pr.height),
      position: cs.position, inlineTop: pop.style.top, inlineBottom: pop.style.bottom,
      fullyVisible: pr.top >= 0 && pr.bottom <= window.innerHeight,
      overlapsToolbar: pr.bottom > tr.top,
    };
  });
  results.push({ viewport: vp.name, ...info });
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
