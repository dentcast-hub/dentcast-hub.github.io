// @vitest-environment jsdom
//
// میز کار — the history stack (undo/redo) and the delete door, against the
// REAL shipped module (../../plus/js/workbench.js) with the API mocked.
//
// What is pinned here is the contract the mockup was approved on
// (.dentcast/highlight-undo-redo-mockup.html, 2026-09-14):
//   - «حذف» exists in the toolbar, acts on the selected highlight, and needs
//     no confirm — the undo IS the confirmation;
//   - undo of a delete calls RESTORE (the same id comes back), never a
//     second create;
//   - a refused server call leaves the stack pointer where it was;
//   - a new act empties the redo list (history does not branch);
//   - Ctrl+Z / Ctrl+Shift+Z work, and are left to the browser inside a field;
//   - the selected mark wears a ring, and clicking plain prose clears it.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

type Row = Record<string, any>;
let rows: Row[] = [];
let deleted: string[] = [];
let restored: string[] = [];
let created: Row[] = [];
let patched: Array<{ id: string; patch: Row }> = [];
let failNext: string | null = null; // name of the api call that should reject once
let seq = 0;

function shouldFail(name: string): boolean {
  if (failNext === name) { failNext = null; return true; }
  return false;
}

vi.mock('/plus/js/api.js', () => ({
  api: {
    listHighlights: () => Promise.resolve({ highlights: rows.filter((r) => !r.deleted) }),
    getArticleNote: () => Promise.resolve({ note: null }),
    saveArticleNote: (_cid: string, note: string | null) => Promise.resolve({ note }),
    createHighlight: (h: Row) => {
      if (shouldFail('create')) return Promise.reject(new Error('500'));
      const row = { id: 'h' + (++seq), created_at: '2026-09-14T10:00:00Z', ...h };
      rows.push(row); created.push(row);
      return Promise.resolve({ highlight: row });
    },
    updateHighlight: (id: string, patch: Row) => {
      if (shouldFail('update')) return Promise.reject(new Error('500'));
      const row = rows.find((r) => r.id === id && !r.deleted);
      if (!row) return Promise.reject(new Error('404'));
      Object.assign(row, patch); patched.push({ id, patch });
      return Promise.resolve({ highlight: { ...row } });
    },
    deleteHighlight: (id: string) => {
      if (shouldFail('delete')) return Promise.reject(new Error('500'));
      const row = rows.find((r) => r.id === id && !r.deleted);
      if (!row) return Promise.reject(new Error('404'));
      row.deleted = true; deleted.push(id);
      return Promise.resolve({ ok: true });
    },
    restoreHighlight: (id: string) => {
      if (shouldFail('restore')) return Promise.reject(new Error('500'));
      const row = rows.find((r) => r.id === id && r.deleted);
      if (!row) return Promise.reject(new Error('404'));
      row.deleted = false; restored.push(id);
      const { deleted: _d, ...clean } = row;
      return Promise.resolve({ highlight: clean });
    },
  },
}));
vi.mock('/plus/js/collections.js', () => ({ openCollectionPicker: () => {} }));

const { Workbench, History } = await import('../../plus/js/workbench.js');

const PROSE = 'پیوند به عاج همیشه ضعیف‌تر از پیوند به مینا است. شمارش دیواره یک نماینده است، نه خودِ متغیر. ضخامت باقی‌مانده تصمیم را عوض می‌کند.';

function setProse(): HTMLElement {
  document.body.innerHTML = `<main class="article-content-wrap"><div class="text-box"><p>${PROSE}</p></div></main>`;
  return document.querySelector('.text-box') as HTMLElement;
}
const tick = () => new Promise((r) => setTimeout(r, 0));
const marks = () => Array.from(document.querySelectorAll('mark.dcp-hl')) as HTMLElement[];
const tool = (text: string) => Array.from(document.querySelectorAll('.dcp-toolbar .dcp-tool')).find((b) => b.textContent!.includes(text)) as HTMLButtonElement;
const undoBtn = () => document.querySelector('.dcp-ubtn-undo') as HTMLButtonElement;
const redoBtn = () => document.querySelector('.dcp-ubtn-redo') as HTMLButtonElement;
const hint = () => document.querySelector('.dcp-wb-hint')!.textContent;
const quote = (exact: string) => {
  const i = PROSE.indexOf(exact);
  return { exact, prefix: PROSE.slice(Math.max(0, i - 8), i), suffix: PROSE.slice(i + exact.length, i + exact.length + 8) };
};

let wb: any;
// exit() after every test: a workbench binds document-level listeners
// (mouseup, keydown), and an instance left alive from an earlier test would
// answer the next test's Ctrl+Z with ITS history.
afterEach(() => { try { wb && wb.exit(); } catch (_) { /* already gone */ } });
beforeEach(async () => {
  rows = []; deleted = []; restored = []; created = []; patched = []; failNext = null; seq = 0;
  // scrollIntoView is not in jsdom
  (Element.prototype as any).scrollIntoView = () => {};
  const root = setProse();
  wb = new Workbench({ contentId: 'insight/insight-64', proseRoot: root });
  await wb.enter();
  await tick();
});

describe('History (the stack itself)', () => {
  it('moves an entry only after its call resolves, and a refusal keeps the pointer', async () => {
    const h = new History();
    let undone = 0;
    h.push({ label: 'a', undo: async () => { undone += 1; }, redo: async () => {} });
    h.push({ label: 'b', undo: async () => { throw new Error('refused'); }, redo: async () => {} });
    expect(h.canUndo()).toBe(true);
    await expect(h.undo()).rejects.toThrow('refused');
    expect(h.done.map((e) => e.label)).toEqual(['a', 'b']); // b still on top
    expect(h.undone).toHaveLength(0);
    // the top entry is still 'b'; a second try that succeeds would move it — swap in a working undo to show the pointer never skipped 'a'
    h.done[1].undo = async () => {};
    await h.undo();
    await h.undo();
    expect(undone).toBe(1);
    expect(h.undone.map((e) => e.label)).toEqual(['b', 'a']);
  });

  it('a new act empties the redo list — history does not branch', async () => {
    const h = new History();
    const noop = { undo: async () => {}, redo: async () => {} };
    h.push({ label: '1', ...noop }); h.push({ label: '2', ...noop }); h.push({ label: '3', ...noop });
    await h.undo(); await h.undo();
    expect(h.undone).toHaveLength(2);
    h.push({ label: '4', ...noop });
    expect(h.undone).toHaveLength(0);
    expect(h.done.map((e) => e.label)).toEqual(['1', '4']);
  });
});

describe('the toolbar', () => {
  it('carries ↶ ↷ on the top row, a «حذف» button, and «کالکشن» short', () => {
    const hist = document.querySelector('.dcp-toolbar .dcp-wb-top .dcp-hist') as HTMLElement;
    expect(hist).toBeTruthy();
    // undo FIRST in DOM order and the pair laid out ltr, so undo sits on the
    // LEFT in the RTL toolbar — the pair is never mirrored (founder, 2026-09-15).
    expect(hist.children[0]).toBe(undoBtn());
    expect(hist.children[1]).toBe(redoBtn());
    // two distinct glyphs, neither a CSS mirror of the other
    expect(undoBtn().querySelector('path')!.getAttribute('d')).not.toBe(redoBtn().querySelector('path')!.getAttribute('d'));
    expect(undoBtn().disabled).toBe(true);
    expect(redoBtn().disabled).toBe(true);
    expect(tool('حذف')).toBeTruthy();
    expect(tool('کالکشن')).toBeTruthy();
    expect(tool('افزودنِ هایلایت به کالکشن')).toBeUndefined();
    // nothing selected → the three selected-highlight buttons are off
    expect(tool('حذف').disabled).toBe(true);
    expect(tool('یادداشت').disabled).toBe(true);
  });
});

describe('create → undo → redo', () => {
  it('a created highlight is selected, undo deletes it, redo RESTORES the same id', async () => {
    await wb._createHighlight(quote('پیوند به مینا'), 'highlight');
    expect(marks()).toHaveLength(1);
    expect(marks()[0].classList.contains('is-current')).toBe(true);
    expect(hint()).toContain('هایلایت ثبت شد');
    expect(undoBtn().disabled).toBe(false);
    expect(undoBtn().querySelector('.dcp-ubtn-count')!.textContent).toBe('۱');

    await wb.undo();
    expect(marks()).toHaveLength(0);
    expect(deleted).toEqual(['h1']);
    expect(redoBtn().disabled).toBe(false);
    expect(undoBtn().disabled).toBe(true);

    await wb.redo();
    expect(marks()).toHaveLength(1);
    expect(marks()[0].dataset.hlId).toBe('h1');
    expect(restored).toEqual(['h1']);
    expect(created).toHaveLength(1); // never a second create
  });

  it('a refused undo keeps the stack where it was and says so', async () => {
    await wb._createHighlight(quote('پیوند به مینا'), 'highlight');
    failNext = 'delete';
    const ok = await wb.undo();
    expect(ok).toBe(false);
    expect(marks()).toHaveLength(1);
    expect(undoBtn().disabled).toBe(false);
    expect(redoBtn().disabled).toBe(true);
    expect(document.querySelector('.dcp-toast')!.textContent).toContain('انجام نشد');
    // and the next press works
    expect(await wb.undo()).toBe(true);
    expect(marks()).toHaveLength(0);
  });
});

describe('«حذف»', () => {
  it('deletes the selected highlight at once — no confirm — with an undo on the toast', async () => {
    rows.push({ id: 'h9', ...quote('شمارش دیواره'), color: 'blue', underline: false, cloze_markers: [], note: null, label: null });
    await wb._loadAndRender();
    expect(marks()).toHaveLength(1);
    expect(tool('حذف').disabled).toBe(true);

    marks()[0].click(); // tap selects
    expect(marks()[0].classList.contains('is-current')).toBe(true);
    expect(tool('حذف').disabled).toBe(false);
    expect(hint()).toContain('یک هایلایت انتخاب شده');

    tool('حذف').click();
    await tick(); await tick();
    expect(marks()).toHaveLength(0);
    expect(deleted).toEqual(['h9']);
    expect(document.querySelector('.dcp-recent-confirm')).toBeNull();
    const act = document.querySelector('.dcp-toast .dcp-toast-act') as HTMLButtonElement;
    expect(act.textContent).toBe('بازگردانی');

    act.click();
    await tick(); await tick();
    expect(marks()).toHaveLength(1);
    expect(marks()[0].dataset.hlId).toBe('h9');
    expect(restored).toEqual(['h9']);
    expect(marks()[0].classList.contains('is-current')).toBe(true);
  });
});

describe('colour and label edit the TAPPED highlight, and only the tapped one', () => {
  it('after a create, a swatch press sets the default and does not repaint the new mark', async () => {
    await wb._createHighlight(quote('پیوند به مینا'), 'highlight');
    wb._setColor('green');
    await tick();
    expect(patched).toHaveLength(0);
    expect(wb.color).toBe('green');
  });

  it('after a tap, a swatch press recolours it and the stack can undo it', async () => {
    rows.push({ id: 'h9', ...quote('شمارش دیواره'), color: 'blue', underline: false, cloze_markers: [], note: null, label: null });
    await wb._loadAndRender();
    marks()[0].click();
    expect(wb.color).toBe('blue'); // toolbar follows the tapped mark
    wb._setColor('pink');
    await tick(); await tick();
    expect(patched).toEqual([{ id: 'h9', patch: { color: 'pink' } }]);
    expect(marks()[0].dataset.color).toBe('pink');
    await wb.undo();
    expect(marks()[0].dataset.color).toBe('blue');
    await wb.redo();
    expect(marks()[0].dataset.color).toBe('pink');
  });

  it('clicking plain prose clears the selection', async () => {
    rows.push({ id: 'h9', ...quote('شمارش دیواره'), color: 'blue', underline: false, cloze_markers: [], note: null, label: null });
    await wb._loadAndRender();
    marks()[0].click();
    expect(tool('حذف').disabled).toBe(false);
    (document.querySelector('.text-box p') as HTMLElement).click();
    expect(marks()[0].classList.contains('is-current')).toBe(false);
    expect(tool('حذف').disabled).toBe(true);
  });
});

describe('keyboard', () => {
  it('Ctrl+Z undoes and Ctrl+Shift+Z redoes, but not while typing in a field', async () => {
    await wb._createHighlight(quote('پیوند به مینا'), 'highlight');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    await tick(); await tick();
    expect(marks()).toHaveLength(0);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true }));
    await tick(); await tick();
    expect(marks()).toHaveLength(1);

    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
    await tick(); await tick();
    expect(marks()).toHaveLength(1); // untouched: the field owns Ctrl+Z
  });
});

describe('exit', () => {
  it('clears the history — it is per article, per session', async () => {
    await wb._createHighlight(quote('پیوند به مینا'), 'highlight');
    expect(wb.history.done).toHaveLength(1);
    wb.exit();
    expect(wb.history.done).toHaveLength(0);
    expect(document.querySelector('.dcp-toolbar')).toBeNull();
  });
});
