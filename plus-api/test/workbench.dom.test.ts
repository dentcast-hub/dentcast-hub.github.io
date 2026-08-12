// @vitest-environment jsdom
// Diagnostic: does Workbench.enter() actually build the toolbar + notes + TOC?
import { describe, it, expect, beforeEach, vi } from 'vitest';

// No network in the harness: make every fetch reject fast so _loadAndRender's
// catch path runs and the UI still builds.
globalThis.fetch = vi.fn(() => Promise.reject(new Error('no network'))) as any;

const { Workbench } = await import('../../plus/js/workbench.js');
// The toolbar renders one swatch per palette entry, so assert against the
// palette itself. A hardcoded count silently rots the day a colour is added —
// which is exactly what happened when `red` landed (6850acd8).
const { PALETTE, findProseRoot, findProseBox, findProseEnd } = await import('../../plus/js/config.js');

function setArticle() {
  document.body.innerHTML =
    '<main class="article-content-wrap">' +
    '<h1>t</h1>' +
    '<div class="text-box"><h2 id="a">بخش</h2><p>یک متن نمونه برای هایلایت کردن در میز کار.</p>' +
    '<h3>زیربخش</h3><p>پاراگراف دوم.</p></div></main>';
  return document.querySelector('.text-box') as HTMLElement;
}

describe('workbench builds its study-mode UI', () => {
  beforeEach(() => { document.body.className = ''; document.body.innerHTML = ''; });

  it('appends toolbar (with color swatches), TOC, and notes panel on enter()', async () => {
    const root = setArticle();
    const wb = new Workbench({ contentId: 'x/y', proseRoot: root });
    await wb.enter();

    expect(document.body.classList.contains('dcp-study')).toBe(true);
    const toolbar = document.querySelector('.dcp-toolbar');
    expect(toolbar, 'toolbar should exist').not.toBeNull();
    const swatches = document.querySelectorAll('.dcp-toolbar .dcp-swatch');
    expect(swatches.length, 'one color swatch per palette entry').toBe(PALETTE.length);
    expect(PALETTE.length, 'palette is not empty').toBeGreaterThan(0);
    // سرفصل (TOC) was removed from the workbench: no panel, no toolbar button.
    expect(document.querySelector('.dcp-toc-panel'), 'no TOC panel').toBeNull();
    const toolbarText = (document.querySelector('.dcp-toolbar') as HTMLElement).textContent || '';
    expect(toolbarText.includes('سرفصل'), 'no سرفصل button').toBe(false);
    expect(document.querySelector('.dcp-notes-panel'), 'notes panel').not.toBeNull();
  });

  it('the یادداشت button toggles a single ARTICLE note, independent of highlights', async () => {
    const root = setArticle();
    const wb: any = new Workbench({ contentId: 'x/y', proseRoot: root });
    await wb.enter();

    // nothing is open just from entering
    expect(document.querySelector('.dcp-editor'), 'no editor on enter').toBeNull();

    // the button opens the article note with NO highlight in focus (not tied to one)
    expect(wb._currentHl, 'no current highlight').toBeFalsy();
    wb._noteButton();
    const pop = document.querySelector('.dcp-editor') as HTMLElement;
    expect(pop, 'article note opened by the button').not.toBeNull();
    expect(pop.getAttribute('aria-label'), 'it is the article note').toBe('یادداشت مقاله');
    expect(document.body.style.getPropertyValue('--dcp-editor-dock'), 'docked via CSS var').not.toBe('');
    const ta = pop.querySelector('.dcp-note-input') as HTMLTextAreaElement;
    expect(ta.value, 'note opens empty').toBe('');

    // pressing the button again CLOSES it (toggle)
    wb._noteButton();
    expect(document.querySelector('.dcp-editor'), 'article note closed by the button').toBeNull();
  });
});

// A page whose body is split across SIBLING prose boxes — the legacy NoteCast
// template, 26 pages of it. findProseRoot() returned the first box, and
// _captureSelection drops any selection outside its root SILENTLY, so on
// notecast/episode-6 seven of the eight sections could not be highlighted at all
// and pressing «هایلایت» did nothing with no error to explain it (user report,
// 2026-08-11). These pin the resolution itself, not the symptom: a root that is
// "the first thing matching a class" is one legacy page away from being wrong
// again.
describe('a body split across sibling prose boxes is ONE article', () => {
  beforeEach(() => { document.body.className = ''; document.body.innerHTML = ''; });

  function setSplitArticle() {
    document.body.innerHTML =
      '<main class="article-content-wrap"><h1>t</h1>' +
      '<div class="glass-box"><h4>یک</h4><ul><li>بخش اول.</li></ul></div>' +
      '<div class="glass-box"><h4>دو</h4><ul><li>بخش دوم.</li></ul></div>' +
      '<div class="glass-box"><h4>سه</h4><ul><li>بخش سوم و آخر.</li></ul></div>' +
      '</main>';
    return Array.from(document.querySelectorAll('.glass-box')) as HTMLElement[];
  }

  // The selection is what the reader actually makes; assert on that, not on
  // which element the resolver happened to pick.
  function selectInside(el: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(el.querySelector('li') as HTMLElement);
    const sel = window.getSelection() as Selection;
    sel.removeAllRanges();
    sel.addRange(range);
  }

  it('captures a selection in EVERY box, not just the first', () => {
    const boxes = setSplitArticle();
    const wb: any = new Workbench({ contentId: 'notecast/episode-6', proseRoot: findProseRoot() });
    wb.active = true; // enter() is network-bound; only the capture path is under test

    for (const box of boxes) {
      selectInside(box);
      wb._pendingQuote = null;
      wb._captureSelection();
      expect(wb._pendingQuote, 'selection captured in ' + (box.querySelector('h4') as HTMLElement).textContent).not.toBeNull();
    }
    expect(wb._pendingQuote.exact).toContain('بخش سوم');
  });

  it('measures the WHOLE body, so the reading tracker is not sized off one section', () => {
    setSplitArticle();
    const root = findProseRoot() as HTMLElement;
    expect(root).toBe(document.querySelector('main.article-content-wrap'));
    expect(root.textContent).toContain('بخش سوم و آخر');
  });

  // The میز کار bar hangs off the opening box, which on this layout is NOT the
  // root. Anchoring it to the root would put it outside <main>, above the title.
  it('still anchors the workbench bar on the opening box, inside <main>', () => {
    const boxes = setSplitArticle();
    const anchor = findProseBox() as HTMLElement;
    expect(anchor).toBe(boxes[0]);
    expect((document.querySelector('main.article-content-wrap') as HTMLElement).contains(anchor)).toBe(true);
  });

  // The widening is confined to that one legacy shape: a page whose body is a
  // single box must resolve to exactly the element it always did.
  it('leaves a single-box page resolving exactly as before', () => {
    const box = setArticle();
    expect(findProseRoot()).toBe(box);
    expect(findProseBox()).toBe(box);
    expect(findProseEnd()).toBe(box);
  });

  // The third helper, and the reason there are three. گفت‌وگوی زیر مطلب shipped
  // anchored on findProseBox() — the FIRST box — so on these 26 pages the
  // conversation opened after section 1 of 8, with seven sections of the article
  // still below it (user report, 2026-08-12). Nobody talks about a piece halfway
  // through reading it.
  it('anchors what goes UNDER the article on the LAST box', () => {
    const boxes = setSplitArticle();
    const end = findProseEnd() as HTMLElement;
    expect(end).toBe(boxes[boxes.length - 1]);
    expect(end).not.toBe(findProseBox());
    expect((end.querySelector('h4') as HTMLElement).textContent).toBe('سه');
  });

  // findProseRoot() is not the fix, and this is why: on this layout it is
  // <main> itself, so inserting after it would put the block outside the
  // article shell entirely.
  it('stays inside <main>, which findProseRoot() on this layout is not', () => {
    setSplitArticle();
    const main = document.querySelector('main.article-content-wrap') as HTMLElement;
    expect(findProseRoot()).toBe(main);
    expect(main.contains(findProseEnd() as HTMLElement)).toBe(true);
    expect(findProseEnd()).not.toBe(main);
  });

  // A box nested inside a section belongs to that section; only the root's own
  // children are the article's parts.
  it('ignores a box nested inside another box', () => {
    const boxes = setSplitArticle();
    const inner = document.createElement('div');
    inner.className = 'glass-box';
    inner.innerHTML = '<h4>تودرتو</h4><p>داخل بخش اول.</p>';
    boxes[0].appendChild(inner);
    expect(findProseEnd()).toBe(boxes[boxes.length - 1]);
  });
});

// focusHighlight() is what makes a ?dcphl=<id> link land ON the highlight
// (plus.js calls it after entering study mode). Without it, following your own
// note from the library / dashboard / a collection dropped you at the top of an
// article that showed no marks at all (user report, 2026-08-05).
describe('focusHighlight (?dcphl= deep links)', () => {
  beforeEach(() => {
    document.body.className = '';
    document.body.innerHTML = '';
    // jsdom has no layout, so scrollIntoView is not implemented.
    (Element.prototype as any).scrollIntoView = vi.fn();
  });

  it('scrolls to the mark, flashes it, and makes it the selected highlight', async () => {
    const root = setArticle();
    const wb: any = new Workbench({ contentId: 'x/y', proseRoot: root });
    await wb.enter();
    wb._renderOne({
      id: 'hl-1', content_id: 'x/y', exact: 'یک متن نمونه',
      prefix: '', suffix: '', color: 'yellow', underline: false,
      cloze_markers: [], note: null, label: null,
    });

    expect(wb.focusHighlight('hl-1')).toBe(true);
    const mark = document.querySelector('mark.dcp-hl') as HTMLElement;
    expect(mark, 'the highlight is drawn').not.toBeNull();
    expect((mark.scrollIntoView as any).mock.calls.length, 'scrolled into view').toBeGreaterThan(0);
    expect(mark.classList.contains('dcp-hl-focus'), 'flashed').toBe(true);
    expect(wb._currentHl, 'selected, as if tapped').toBe('hl-1');
  });

  it('does nothing (and never throws) for an id that is not on this page', async () => {
    const root = setArticle();
    const wb: any = new Workbench({ contentId: 'x/y', proseRoot: root });
    await wb.enter();
    expect(wb.focusHighlight('not-here')).toBe(false);
  });
});
