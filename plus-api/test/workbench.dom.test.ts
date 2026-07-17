// @vitest-environment jsdom
// Diagnostic: does Workbench.enter() actually build the toolbar + notes + TOC?
import { describe, it, expect, beforeEach, vi } from 'vitest';

// No network in the harness: make every fetch reject fast so _loadAndRender's
// catch path runs and the UI still builds.
globalThis.fetch = vi.fn(() => Promise.reject(new Error('no network'))) as any;

const { Workbench } = await import('../../plus/js/workbench.js');

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
    expect(swatches.length, 'color swatches').toBe(4);
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
