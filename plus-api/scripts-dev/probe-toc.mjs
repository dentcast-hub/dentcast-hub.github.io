// Verify سرفصل (TOC) is gone from the workbench: no toolbar button, no TOC panel.
import { chromium } from 'playwright';
const URL = 'http://localhost:5500/notecast/episode-2.html';

const browser = await chromium.launch({ channel: 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.dcp-wb-button', { timeout: 8000 }).catch(() => {});

const r = await page.evaluate(async () => {
  const link = [...document.querySelectorAll('link[href*="/plus/plus.css"]')][0];
  const v = link ? new URL(link.href).search : '';
  const cfg = await import('/plus/js/config.js' + v);
  const apiMod = await import('/plus/js/api.js' + v);
  const wbMod = await import('/plus/js/workbench.js' + v);
  apiMod.api.listHighlights = async () => ({ highlights: [] });
  const wb = new wbMod.Workbench({ contentId: 'notecast/episode-2', proseRoot: cfg.findProseRoot() });
  await wb.enter();
  const btns = [...document.querySelectorAll('.dcp-toolbar .dcp-tool, .dcp-toolbar .dcp-chip')].map((b) => b.textContent.trim());
  return {
    tocPanel: !!document.querySelector('.dcp-toc-panel'),
    tocButtonPresent: btns.some((t) => t.includes('سرفصل')),
    toolbarButtons: btns,
  };
});
const ok = !r.tocPanel && !r.tocButtonPresent;
console.log(`${ok ? 'PASS' : 'FAIL'} ->`, JSON.stringify(r, null, 2));
await browser.close();
