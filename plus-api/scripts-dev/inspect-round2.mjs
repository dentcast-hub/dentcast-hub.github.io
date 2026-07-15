// Dev-only: verify flashcards on a folder landing, onboarding on first login,
// and the workbench note field.
import { chromium } from 'playwright';
const SITE = 'http://localhost:5500', API = 'http://localhost:8787';

async function login(phone) {
  const r = await fetch(`${API}/auth/otp/request`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone }) });
  const { dev_code } = await r.json();
  const v = await fetch(`${API}/auth/otp/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ phone, code: dev_code }) });
  return { cookie: v.headers.get('set-cookie').split(';')[0].split('=').slice(1).join('='), is_new: (await v.json()).is_new };
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });

// The seed user has highlights in the episodes folder -> flashcards on /episodes/
const { cookie } = await login('09120000001');
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
await ctx.addCookies([{ name: 'dcp_session', value: cookie, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' }]);
const page = await ctx.newPage();

await page.goto(SITE + '/episodes.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const flash = await page.evaluate(() => {
  const sec = document.querySelector('.dcp-flash-section');
  const cards = document.querySelectorAll('.dcp-flash-section .dcp-card');
  const blank = document.querySelector('.dcp-flash-section .dcp-blank');
  const title = document.querySelector('.dcp-flash-section .dcp-archive-title')?.textContent;
  return { present: !!sec, title, cards: cards.length, hasBlank: !!blank,
    cardText: document.querySelector('.dcp-flash-section .dcp-card-text')?.textContent?.slice(0, 60) };
});
console.log('FLASHCARDS on /episodes/:', flash);
await page.screenshot({ path: 'scripts-dev/flashcards.png' });
await ctx.close();

// Onboarding on first login: fresh phone -> is_new true; modal shows nickname step.
const fresh = '0912' + '7' + String(Date.now()).slice(-6);
const g = await browser.newContext({ viewport: { width: 500, height: 800 } });
const gp = await g.newPage();
await gp.goto(SITE + '/chairside/chairside-25.html', { waitUntil: 'networkidle' });
await gp.waitForTimeout(500);
// open login modal via the guest person icon
await gp.click('.dcp-person-btn.is-guest');
await gp.waitForTimeout(300);
await gp.fill('.dcp-modal-card input[type="tel"]', fresh);
await gp.click('.dcp-modal-card .dcp-btn-primary');
await gp.waitForTimeout(400);
const devCode = await gp.evaluate(() => document.querySelector('.dcp-modal-devhint')?.textContent || '');
// dev hint shows Persian digits; convert back to Latin for the input.
const code = devCode.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/\D/g, '');
await gp.fill('.dcp-input-code', code);
await gp.click('.dcp-modal-card .dcp-btn-primary');
await gp.waitForTimeout(600);
const onboarding = await gp.evaluate(() => {
  const label = [...document.querySelectorAll('.dcp-modal-card .dcp-label')].map((l) => l.textContent).join(' | ');
  const hasSkip = [...document.querySelectorAll('.dcp-modal-card button')].some((b) => b.textContent.includes('رد کردن'));
  return { label, hasSkip };
});
console.log('ONBOARDING step:', onboarding);
await g.close();

await browser.close();
