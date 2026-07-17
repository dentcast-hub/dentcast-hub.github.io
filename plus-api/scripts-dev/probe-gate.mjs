// Verify Plus is gated OFF on desktop and ON on mobile, on the REAL served page.
import { chromium } from 'playwright';
const URL = 'http://localhost:5500/notecast/episode-2.html';

for (const vp of [
  { w: 1280, h: 800, name: 'desktop-1280', isMobile: false, expectPlus: false },
  { w: 390, h: 780, name: 'phone-390', isMobile: true, expectPlus: true },
  { w: 1099, h: 800, name: 'edge-1099', isMobile: false, expectPlus: true },   // last mobile width
  { w: 1100, h: 800, name: 'edge-1100', isMobile: false, expectPlus: false },  // first desktop width
]) {
  const browser = await chromium.launch({ channel: 'msedge' });
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.isMobile, hasTouch: vp.isMobile });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700); // let dc-nav inject plus.js and plus.js boot
  const r = await page.evaluate(() => ({
    wbButton: !!document.querySelector('.dcp-wb-button'),
    wbBar: !!document.querySelector('.dcp-wb-bar'),
    homeCard: !!document.querySelector('.dcp-home-card'),
    anyDcp: document.querySelectorAll('[class^="dcp-"],[class*=" dcp-"]').length,
  }));
  const plusPresent = r.wbButton || r.wbBar || r.homeCard;
  const ok = plusPresent === vp.expectPlus;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${vp.name} expectPlus=${vp.expectPlus} ->`, JSON.stringify(r));
  await browser.close();
}
