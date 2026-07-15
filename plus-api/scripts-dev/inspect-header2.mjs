// Dev-only: verify header flame (no number) + 3-item person menu + logout.
import { chromium } from 'playwright';
const SITE = 'http://localhost:5500', API = 'http://localhost:8787', ARTICLE = '/chairside/chairside-25.html';

const rq = await fetch(`${API}/auth/otp/request`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: '09120000001' }) });
const { dev_code } = await rq.json();
const vf = await fetch(`${API}/auth/otp/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: '09120000001', code: dev_code }) });
const cookieVal = vf.headers.get('set-cookie').split(';')[0].split('=').slice(1).join('=');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addCookies([{ name: 'dcp_session', value: cookieVal, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
const p = await ctx.newPage();
await p.goto(SITE + ARTICLE, { waitUntil: 'networkidle' });
await p.waitForTimeout(600);

const flame = await p.evaluate(() => {
  const f = document.querySelector('.dcp-flame-btn');
  return { present: !!f, text: (f?.textContent || '').trim(), hasNumberSpan: !!f?.querySelector('.dcp-flame-n'), lit: f?.classList.contains('is-active') };
});
console.log('FLAME:', flame); // text should be just the emoji, no digits

await p.click('.dcp-person-btn.is-user'); await p.waitForTimeout(250);
const menu = await p.evaluate(() => [...document.querySelectorAll('.dcp-person-menu .dcp-person-item')].map((b) => b.textContent));
console.log('MENU items:', menu); // پیشخوان / پروفایل / خروج

// logout via menu -> should log out; reload shows guest person
await p.click('.dcp-person-menu .dcp-person-item:last-child'); // خروج
await p.waitForTimeout(700);
const afterLogout = await p.evaluate(() => ({ guest: !!document.querySelector('.dcp-person-btn.is-guest'), flame: !!document.querySelector('.dcp-flame-btn') }));
console.log('AFTER LOGOUT:', afterLogout); // guest true, flame false

await browser.close();
