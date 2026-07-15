// Dev-only: verify the dashboard tree mirrors the real site taxonomy, and that a
// pillar landing page gets a correctly-scoped archive entry point.
import { chromium } from 'playwright';

const SITE = 'http://localhost:5500';
const API = 'http://localhost:8787';
const PHONE = '09120000001';

const r = await fetch(`${API}/auth/otp/request`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: PHONE }) });
const { dev_code } = await r.json();
const v = await fetch(`${API}/auth/otp/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: PHONE, code: dev_code }) });
const cookieVal = v.headers.get('set-cookie').split(';')[0].split('=').slice(1).join('=');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
await ctx.addCookies([{ name: 'dcp_session', value: cookieVal, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
const page = await ctx.newPage();

// 1) Dashboard tree
await page.goto(`${SITE}/plus/cards.html`, { waitUntil: 'networkidle' });
await page.waitForSelector('.dcp-tree-cluster, .dcp-gate', { timeout: 5000 }).catch(() => {});
const tree = await page.evaluate(() =>
  [...document.querySelectorAll('.dcp-tree-cluster')].map((c) => ({
    cat: c.querySelector('.dcp-tree-link')?.textContent,
    count: c.querySelector('.dcp-tree-count')?.textContent || '0',
    subs: [...c.querySelectorAll('.dcp-tree-sub .dcp-tree-link')].map((s) => s.textContent).slice(0, 3),
  })));
console.log('=== dashboard tree (real site categories) ===');
tree.forEach((t) => console.log(`  ${t.cat} [${t.count}] — ${t.subs.join('، ')}`));

// 2) Pillar landing entry point
await page.goto(`${SITE}/pillar/ceramics/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const entry = await page.evaluate(() => {
  const a = document.querySelector('.dcp-cards-entry-btn');
  return a ? { text: a.textContent, href: a.getAttribute('href') } : null;
});
console.log('=== pillar/ceramics entry point ===');
console.log(' ', entry);

// 3) Non-topic content-type index should NOT get an entry point
await page.goto(`${SITE}/insight/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const insightEntry = await page.evaluate(() => !!document.querySelector('.dcp-cards-entry-btn'));
console.log('=== /insight/ (content-type index) has entry point? (should be false) ===');
console.log(' ', insightEntry);

await browser.close();
