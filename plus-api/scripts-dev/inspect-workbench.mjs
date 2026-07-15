// Dev-only: drive a real Chrome to inspect the workbench rendering.
// Usage: node scripts-dev/inspect-workbench.mjs  (site must be on :5500)
import { chromium } from 'playwright';

const URL = process.env.URL || 'http://localhost:5500/chairside/chairside-25.html';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const cssLoaded = [];
page.on('response', (r) => {
  const u = r.url();
  if (u.includes('/plus/plus.css') || u.includes('/plus/plus.js') || u.includes('/dc-nav.js')) {
    cssLoaded.push(`${r.status()} ${u}`);
  }
});
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(URL, { waitUntil: 'networkidle' });

// Force study mode without auth: instantiate the Workbench directly.
const result = await page.evaluate(async () => {
  const cfg = await import('/plus/js/config.js');
  const { Workbench } = await import('/plus/js/workbench.js');
  const root = cfg.findProseRoot();
  if (!root) return { error: 'no prose root' };
  const wb = new Workbench({ contentId: 'test/page', proseRoot: root });
  await wb.enter();
  const tb = document.querySelector('.dcp-toolbar');
  const notes = document.querySelector('.dcp-notes-panel');
  const cs = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { display: s.display, visibility: s.visibility, position: s.position,
      bg: s.backgroundColor, color: s.color, fontFamily: s.fontFamily.slice(0, 40),
      zIndex: s.zIndex, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
  };
  const swatch = document.querySelector('.dcp-swatch');
  return {
    hasToolbar: !!tb, hasNotes: !!notes,
    toolbar: cs(tb), notes: cs(notes), swatch: cs(swatch),
    // is the accent var resolving?
    accentVar: getComputedStyle(document.documentElement).getPropertyValue('--ac').trim(),
    dcpAccent: tb ? getComputedStyle(tb).getPropertyValue('--dcp-accent').trim() : null,
    bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 50),
  };
});

console.log('=== network (plus assets) ===');
console.log(cssLoaded.join('\n') || '(none captured)');
console.log('=== page errors ===');
console.log(errors.join('\n') || '(none)');
console.log('=== render result ===');
console.log(JSON.stringify(result, null, 2));

await page.screenshot({ path: 'scripts-dev/workbench.png', fullPage: false });
console.log('screenshot -> scripts-dev/workbench.png');
await browser.close();
