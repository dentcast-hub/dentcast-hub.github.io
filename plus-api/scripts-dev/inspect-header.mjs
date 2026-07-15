// Dev-only: verify header person toggle + dashboard overlay + folder tree.
import { chromium } from 'playwright';
const SITE = 'http://localhost:5500', API = 'http://localhost:8787';
const ARTICLE = '/chairside/chairside-25.html', PHONE = '09120000001';

const rq = await fetch(`${API}/auth/otp/request`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: PHONE }) });
const { dev_code } = await rq.json();
const vf = await fetch(`${API}/auth/otp/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: PHONE, code: dev_code }) });
const cookieVal = vf.headers.get('set-cookie').split(';')[0].split('=').slice(1).join('=');

const browser = await chromium.launch({ channel: 'chrome', headless: true });

// --- guest ---
const g = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const gp = await g.newPage();
await gp.goto(SITE + ARTICLE, { waitUntil: 'networkidle' });
await gp.waitForTimeout(500);
const guest = await gp.evaluate(() => ({
  personGuest: !!document.querySelector('.dcp-person-btn.is-guest'),
  flame: !!document.querySelector('.dcp-flame-btn'),
}));
if (guest.personGuest) { await gp.click('.dcp-person-btn.is-guest'); await gp.waitForTimeout(400); }
guest.loginModal = await gp.evaluate(() => !!document.querySelector('.dcp-modal-overlay'));
console.log('GUEST:', guest);
await g.close();

// --- logged in ---
const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await c.addCookies([{ name: 'dcp_session', value: cookieVal, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
const p = await c.newPage();
await p.goto(SITE + ARTICLE, { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
const step = {};
step.flameActive = await p.evaluate(() => document.querySelector('.dcp-flame-btn')?.classList.contains('is-active'));
step.personUser = await p.evaluate(() => !!document.querySelector('.dcp-person-btn.is-user'));
await p.click('.dcp-person-btn.is-user'); await p.waitForTimeout(300);
step.menuOpen = await p.evaluate(() => !!document.querySelector('.dcp-person-menu'));
await p.click('.dcp-person-menu .dcp-person-item'); await p.waitForTimeout(700); // پیشخوان
step.overlayOpen = await p.evaluate(() => !!document.querySelector('.dcp-overlay'));
step.overlayTitle = await p.evaluate(() => document.querySelector('.dcp-overlay-title')?.textContent);
step.folders = await p.evaluate(() => [...document.querySelectorAll('.dcp-overlay .dcp-folder .dcp-folder-name')].map((e) => e.textContent).slice(0, 4));
step.folderCounts = await p.evaluate(() => [...document.querySelectorAll('.dcp-overlay .dcp-folder-count')].map((e) => e.textContent).filter((t) => !t.includes('بدون')).slice(0, 3));
await p.click('.dcp-person-btn.is-user'); await p.waitForTimeout(300); // toggle-close
step.overlayClosedByPerson = await p.evaluate(() => !document.querySelector('.dcp-overlay'));
console.log('USER:', step);
await p.screenshot({ path: 'scripts-dev/dashboard.png' });
await c.close();
await browser.close();
