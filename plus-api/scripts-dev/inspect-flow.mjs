// Dev-only end-to-end: real login cookie -> open article -> click میز کار ->
// enter study mode -> select text -> expect a highlight. API on :8787, site :5500.
import { chromium } from 'playwright';

const SITE = 'http://localhost:5500';
const API = 'http://localhost:8787';
const ARTICLE = '/chairside/chairside-25.html';
const PHONE = '09120000001';

// 1) Log in via the API to obtain the session cookie.
const reqRes = await fetch(`${API}/auth/otp/request`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone: PHONE }),
});
const { dev_code } = await reqRes.json();
const verifyRes = await fetch(`${API}/auth/otp/verify`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ phone: PHONE, code: dev_code }),
});
const setCookie = verifyRes.headers.get('set-cookie');
const cookieVal = setCookie.split(';')[0].split('=').slice(1).join('=');
console.log('logged in, cookie captured:', cookieVal.slice(0, 24) + '...');

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
// Cookies are per-host (not per-port), so a "localhost" cookie reaches :5500 and :8787.
await context.addCookies([{ name: 'dcp_session', value: cookieVal, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);

const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(SITE + ARTICLE, { waitUntil: 'networkidle' });

// Is /me seen as logged-in by the page?
const who = await page.evaluate(async () => {
  const { currentUser } = await import('/plus/js/api.js');
  const u = await currentUser({ refresh: true });
  return u ? { tier: u.tier, name: u.display_name } : null;
});
console.log('page currentUser():', who);

// Find and click the میز کار button.
const btn = await page.$('.dcp-wb-button');
console.log('workbench button present:', !!btn);
if (btn) {
  await btn.click();
  await page.waitForTimeout(600);
}

const afterClick = await page.evaluate(() => ({
  bodyStudy: document.body.classList.contains('dcp-study'),
  hasToolbar: !!document.querySelector('.dcp-toolbar'),
  hasInvite: !!document.querySelector('.dcp-invite'),
  btnLabel: (document.querySelector('.dcp-wb-button') || {}).textContent,
}));
console.log('after click:', afterClick);

// Pick a color, select a sentence in the prose, and fire mouseup -> a highlight
// should be created (mark.dcp-hl) and persisted.
const highlightResult = await page.evaluate(async () => {
  document.querySelector('.dcp-swatch[data-color="green"]').click();
  const p = document.querySelector('.text-box p') || document.querySelector('.text-box');
  const textNode = [...p.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim().length > 8);
  if (!textNode) return { error: 'no text node' };
  const range = document.createRange();
  range.setStart(textNode, 0);
  range.setEnd(textNode, Math.min(10, textNode.textContent.length));
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 700));
  return { marks: document.querySelectorAll('mark.dcp-hl').length };
});
console.log('after selecting + highlighting:', highlightResult);

console.log('=== page errors ===');
console.log(errors.join('\n') || '(none)');

await page.screenshot({ path: 'scripts-dev/flow.png' });
await browser.close();
