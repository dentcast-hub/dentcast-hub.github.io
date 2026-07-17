import { chromium } from 'playwright';
const URL = 'http://localhost:5500/notecast/episode-2.html';
const OUT = 'E:/DentCast_GitBackup/dentcast-hub.github.io/plus-api/scripts-dev/note-shot.png';

const browser = await chromium.launch({ channel: 'msedge' });
const ctx = await browser.newContext({ viewport: { width: 380, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.dcp-wb-button', { timeout: 8000 }).catch(() => {});
const geo = await page.evaluate(async () => {
  const link = [...document.querySelectorAll('link[href*="/plus/plus.css"]')][0];
  const v = link ? new URL(link.href).search : '';
  const cfg = await import('/plus/js/config.js' + v);
  const apiMod = await import('/plus/js/api.js' + v);
  const wbMod = await import('/plus/js/workbench.js' + v);
  apiMod.api.listHighlights = async () => ({ highlights: [] });
  apiMod.api.getArticleNote = async () => ({ note: 'یک یادداشت نمونه' });
  const wb = new wbMod.Workbench({ contentId: 'notecast/episode-2', proseRoot: cfg.findProseRoot() });
  await wb.enter();
  wb._openArticleNote();
  const pop = document.querySelector('.dcp-editor');
  const r = pop.getBoundingClientRect();
  const cs = getComputedStyle(pop);
  return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), vw: innerWidth, cssLeft: cs.left, cssRight: cs.right, cssMargin: cs.marginLeft + ' / ' + cs.marginRight, cssMaxW: cs.maxWidth, cssTransform: cs.transform };
});
console.log(JSON.stringify(geo, null, 2));
await page.screenshot({ path: OUT });
console.log('saved', OUT);
await browser.close();
