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
    expect(document.querySelector('.dcp-toc-panel'), 'TOC panel').not.toBeNull();
    expect(document.querySelector('.dcp-notes-panel'), 'notes panel').not.toBeNull();
  });
});
