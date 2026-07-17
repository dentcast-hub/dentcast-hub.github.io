// Drive the REAL served article page (localhost:5500) with the REAL plus.css +
// workbench.js, open the note editor, and report its actual computed position.
// Run: node scripts-dev/probe-real.mjs
import { chromium } from 'playwright';

const URL = 'http://localhost:5500/notecast/episode-2.html';

for (const vp of [{ w: 390, h: 560, name: 'phone-short-560', isMobile: true }, { w: 390, h: 780, name: 'phone-390', isMobile: true }]) {
  const browser = await chromium.launch({ channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: vp.isMobile, hasTouch: vp.isMobile, deviceScaleFactor: vp.isMobile ? 3 : 1 });
  const page = await context.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  // wait for plus.js to inject the workbench button (proves the module graph loaded)
  await page.waitForSelector('.dcp-wb-button', { timeout: 8000 }).catch(() => {});

  const info = await page.evaluate(async () => {
    // find the version query dc-nav used, mirror it for the dynamic imports
    const link = [...document.querySelectorAll('link[href*="/plus/plus.css"]')][0];
    const v = link ? new URL(link.href).search : '';
    const cfg = await import('/plus/js/config.js' + v);
    const apiMod = await import('/plus/js/api.js' + v);
    const wbMod = await import('/plus/js/workbench.js' + v);
    const prose = cfg.findProseRoot();
    if (!prose) return { error: 'no prose root', v };
    // stub network so enter() renders UI without a backend
    apiMod.api.listHighlights = async () => ({ highlights: [] });
    apiMod.api.createHighlight = async (h) => ({ highlight: { id: 'h1', ...h, note: null } });
    apiMod.api.getArticleNote = async () => ({ note: 'یک '.repeat(400) });
    const wb = new wbMod.Workbench({ contentId: 'notecast/episode-2', proseRoot: prose });
    await wb.enter();
    // open the ARTICLE note editor (long text, to stress overflow)
    wb._openArticleNote();
    const pop = document.querySelector('.dcp-editor');
    const tb = document.querySelector('.dcp-toolbar');
    if (!pop) return { error: 'no editor', v };
    const cs = getComputedStyle(pop);
    const pr = pop.getBoundingClientRect();
    const tr = tb ? tb.getBoundingClientRect() : { top: innerHeight };
    const ta = pop.querySelector('.dcp-note-input');
    const noteEmpty = ta ? ta.value === '' : null;
    const gapAboveToolbar = Math.round(tr.top - pr.bottom); // >=0 means docked ABOVE the toolbar
    const hasHighlightTextInEditor = /هایلایت/.test(pop.textContent || '');
    // which stylesheet actually set position? report matched rules count
    let cssEditorRules = 0;
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const r of rules) if (r.selectorText && /\.dcp-editor(\s|$|,|:)/.test(r.selectorText)) cssEditorRules++;
    }
    return {
      v, cssEditorRules,
      cssPosition: cs.position, cssBottom: cs.bottom,
      rectBottom: Math.round(pr.bottom), toolbarTop: Math.round(tr.top),
      rectTop: Math.round(pr.top), rectLeft: Math.round(pr.left), innerHeight,
      gapAboveToolbar, dockedAboveToolbar: gapAboveToolbar >= 0,
      noteEmpty, hasHighlightTextInEditor,
      fullyVisible: pr.top >= 0 && pr.bottom <= innerHeight && pr.left >= 0,
    };
  });
  console.log(vp.name, JSON.stringify(info, null, 2));
  if (errs.length) console.log(vp.name, 'PAGE ERRORS:', errs.slice(0, 5));
  await browser.close();
}
