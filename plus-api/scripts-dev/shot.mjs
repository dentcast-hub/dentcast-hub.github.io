// Screenshot the two note UIs on the REAL served page so we can see what's what.
import { chromium } from 'playwright';
const URL = 'http://localhost:5500/notecast/episode-2.html';
const OUT = 'C:/Users/foads/OneDrive/Pictures/Screenshots';

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 390, height: 780 } });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.dcp-wb-button', { timeout: 8000 }).catch(() => {});

await page.evaluate(async () => {
  const link = [...document.querySelectorAll('link[href*="/plus/plus.css"]')][0];
  const v = link ? new URL(link.href).search : '';
  const cfg = await import('/plus/js/config.js' + v);
  const apiMod = await import('/plus/js/api.js' + v);
  const wbMod = await import('/plus/js/workbench.js' + v);
  const prose = cfg.findProseRoot();
  apiMod.api.listHighlights = async () => ({ highlights: [
    { id: 'a', exact: 'یک جمله‌ی هایلایت‌شده برای نمونه', prefix: '', suffix: '', color: 'yellow', underline: false, cloze_markers: [], note: 'یادداشت شخصی من', label: 'important', content_hash: '' },
  ] });
  apiMod.api.createHighlight = async (h) => ({ highlight: { id: 'h1', ...h, note: null } });
  const wb = new wbMod.Workbench({ contentId: 'notecast/episode-2', proseRoot: prose });
  window.__wb = wb; await wb.enter();
});

// 1) the editor (writing box)
await page.evaluate(() => {
  const prose = document.querySelector('.dcp-notes-panel') && window.__wb;
  const p = document.querySelector('.text-box p, article p, main p');
  window.__wb._openEditor({ id: 'h1', exact: 'x', note: null, color: 'yellow', label: null }, p, {});
});
await page.screenshot({ path: OUT + '/note-EDITOR.png' });
await page.evaluate(() => window.__wb._closeEditor());

// 2) the notes list panel (the 📝 یادداشت‌ها button)
await page.evaluate(() => window.__wb._toggleNotes());
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + '/note-PANEL.png' });

await browser.close();
console.log('saved note-EDITOR.png and note-PANEL.png to', OUT);
