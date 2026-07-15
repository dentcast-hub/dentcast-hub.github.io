// Dev-only: verify the person icon renders (real SVG, clickable size), no console
// errors, and the پیشخوان/پروفایل overlays open (visible) and close via the icon.
import { chromium } from 'playwright';
const SITE = 'http://localhost:5500', API = 'http://localhost:8787', ARTICLE = '/chairside/chairside-25.html';

async function cookieFor(phone) {
  const r = await fetch(`${API}/auth/otp/request`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone }) });
  const v = await fetch(`${API}/auth/otp/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, code: (await r.json()).dev_code }) });
  return v.headers.get('set-cookie').split(';')[0].split('=').slice(1).join('=');
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });

// ---- guest ----
const gctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const gerr = [];
const gp = await gctx.newPage();
gp.on('pageerror', (e) => gerr.push(String(e)));
gp.on('console', (m) => { if (m.type() === 'error') gerr.push('console: ' + m.text()); });
await gp.goto(SITE + ARTICLE, { waitUntil: 'networkidle' });
await gp.waitForTimeout(600);
const guest = await gp.evaluate(() => {
  const b = document.querySelector('.dcp-person-btn');
  const r = b?.getBoundingClientRect();
  return { isGuest: !!document.querySelector('.dcp-person-btn.is-guest'),
    hasSvgCircle: !!b?.querySelector('svg circle'), w: Math.round(r?.width || 0), h: Math.round(r?.height || 0) };
});
if (guest.isGuest) { await gp.click('.dcp-person-btn.is-guest'); await gp.waitForTimeout(300); }
guest.loginModal = await gp.evaluate(() => !!document.querySelector('.dcp-modal-overlay'));
console.log('GUEST:', guest, '| console errors:', gerr.length ? gerr : 'none');
await gctx.close();

// ---- logged in ----
const cookie = await cookieFor('09120000001');
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addCookies([{ name: 'dcp_session', value: cookie, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
const err = [];
const p = await ctx.newPage();
p.on('pageerror', (e) => err.push(String(e)));
p.on('console', (m) => { if (m.type() === 'error') err.push('console: ' + m.text()); });
await p.goto(SITE + ARTICLE, { waitUntil: 'networkidle' });
await p.waitForTimeout(700);

const icon = await p.evaluate(() => {
  const b = document.querySelector('.dcp-person-btn.is-user');
  const r = b?.getBoundingClientRect();
  const svg = b?.querySelector('svg');
  return { isUser: !!b, hasSvgCircle: !!b?.querySelector('svg circle'),
    w: Math.round(r?.width || 0), h: Math.round(r?.height || 0),
    svgW: Math.round(svg?.getBoundingClientRect().width || 0) };
});
console.log('ICON:', icon);

async function overlayVisible() {
  return p.evaluate(() => {
    const o = document.querySelector('.dcp-overlay');
    if (!o) return { present: false };
    const cs = getComputedStyle(o); const r = o.getBoundingClientRect();
    return { present: true, title: document.querySelector('.dcp-overlay-title')?.textContent,
      display: cs.display, visibility: cs.visibility, w: Math.round(r.width), h: Math.round(r.height) };
  });
}

// person -> menu -> پیشخوان -> overlay
await p.click('.dcp-person-btn.is-user'); await p.waitForTimeout(200);
const menu1 = await p.evaluate(() => [...document.querySelectorAll('.dcp-person-menu .dcp-person-item')].map((b) => b.textContent));
await p.click('.dcp-person-menu .dcp-person-item:nth-child(1)'); await p.waitForTimeout(700);
console.log('MENU:', menu1, '| DASHBOARD overlay:', await overlayVisible());
await p.click('.dcp-person-btn.is-user'); await p.waitForTimeout(300); // icon closes overlay
console.log('after icon click, overlay present:', (await overlayVisible()).present);

// person -> menu -> پروفایل -> overlay
await p.click('.dcp-person-btn.is-user'); await p.waitForTimeout(200);
await p.click('.dcp-person-menu .dcp-person-item:nth-child(2)'); await p.waitForTimeout(700);
console.log('PROFILE overlay:', await overlayVisible());
await p.click('.dcp-person-btn.is-user'); await p.waitForTimeout(300);
console.log('after icon click, overlay present:', (await overlayVisible()).present);

console.log('console errors:', err.length ? err : 'none');
await browser.close();
