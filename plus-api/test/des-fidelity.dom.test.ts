// @vitest-environment jsdom
// Drives the REAL shipped module (/plus/js/des.js) against the stored record of
// sharehub/share-23 — the first page with a FIDELITY object (spec v2.8) — and
// checks the two promises the display makes: a page WITH a 2.8 fidelity record
// gets the second chip and the two-tab card, and every other page renders
// exactly what it did before (one chip, the untabbed card).
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ALL = JSON.parse(readFileSync(path.join(repo, 'plus/des-scores.json'), 'utf8'));
const SHARE23 = ALL['sharehub/share-23'];

let scores: Record<string, unknown> = {};
vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => scores })));
// jsdom has no layout; the chips scroll the card into view
Element.prototype.scrollIntoView = function () {};

async function mount(rec: unknown, id = 'test/page') {
  vi.resetModules();
  scores = { [id]: rec };
  const { mountDes } = await import('/plus/js/des.js');
  document.body.innerHTML = '<div id="row"></div><main><div id="end">متن</div></main>';
  const row = document.getElementById('row')!;
  const anchor = document.getElementById('end')!;
  const ok = await mountDes(row, anchor, id);
  return { ok, row, card: document.getElementById('dcDesCard') };
}

const text = (n: Element | null) => (n ? n.textContent || '' : '');

describe('DES fidelity display (spec v2.8)', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('share-23: two chips, the strength one named, the fidelity one a word', async () => {
    const { ok, row } = await mount(SHARE23);
    expect(ok).toBe(true);
    const des = row.querySelectorAll('.dc-act-des');
    const fid = row.querySelectorAll('.dc-act-fid');
    expect(des).toHaveLength(1);
    expect(fid).toHaveLength(1);
    expect(text(des[0])).toContain('سطح شواهد: C–D');
    expect(text(fid[0])).toContain('تطابق با منابع:');
    expect(text(fid[0])).toContain('خیلی بالا');
    expect(text(fid[0])).not.toMatch(/[٪%]|۹۸/); // a word, never a number
  });

  it('share-23: the card opens on fidelity, with the two differing sentences', async () => {
    const { card } = await mount(SHARE23);
    expect(card!.classList.contains('has-fid')).toBe(true);
    const tabs = card!.querySelectorAll('.dc-des-seg button');
    expect([...tabs].map(text)).toEqual(['تطابق با منابع', 'سطح شواهد']);
    const fidPane = card!.querySelector('.dc-des-pane[data-pane="fid"]') as HTMLElement;
    const srcPane = card!.querySelector('.dc-des-pane[data-pane="src"]') as HTMLElement;
    expect(fidPane.hidden).toBe(false);
    expect(srcPane.hidden).toBe(true);
    expect(text(card!.querySelector('.dc-fid-word'))).toBe('تطابق خیلی بالا');
    expect(card!.querySelectorAll('.dc-fid-diff')).toHaveLength(2);
    expect(text(card!.querySelector('.dc-fid-say'))).toContain('۵۰ جمله');
    // the four silent sentences are counted, never flagged
    const rows = [...card!.querySelectorAll('.dc-fid-row > summary')].map(text);
    expect(rows[0]).toContain('دانش یا استدلال نویسنده');
    expect(rows[0]).toContain('۴');
    // the strength pane holds the two source blocks, unchanged
    expect(srcPane.querySelectorAll('.dc-des-src')).toHaveLength(2);
  });

  it('each chip opens its own tab', async () => {
    const { row, card } = await mount(SHARE23);
    (row.querySelector('.dc-act-des') as HTMLElement).click();
    expect((card!.querySelector('.dc-des-pane[data-pane="src"]') as HTMLElement).hidden).toBe(false);
    (row.querySelector('.dc-act-fid') as HTMLElement).click();
    expect((card!.querySelector('.dc-des-pane[data-pane="fid"]') as HTMLElement).hidden).toBe(false);
    expect((card!.querySelector('.dc-des-pane[data-pane="src"]') as HTMLElement).hidden).toBe(true);
  });

  it('a page with no fidelity record renders exactly as before', async () => {
    const { fidelity: _drop, ...plain } = SHARE23;
    const { row, card } = await mount(plain);
    expect(row.querySelectorAll('.dc-act-fid')).toHaveLength(0);
    expect(text(row.querySelector('.dc-act-des'))).toContain('۲ منبع · C–D');
    expect(card!.classList.contains('has-fid')).toBe(false);
    expect(card!.querySelector('.dc-des-seg')).toBeNull();
  });

  it('a fidelity object stamped before 2.8 is not drawn (its level meant another rule)', async () => {
    const old = { ...SHARE23, fidelity: { ...SHARE23.fidelity, des_version: '2.7' } };
    const { row, card } = await mount(old);
    expect(row.querySelectorAll('.dc-act-fid')).toHaveLength(0);
    expect(card!.querySelector('.dc-des-seg')).toBeNull();
  });

  it('one source reads «منبع», never «منابع»', async () => {
    const one = { ...SHARE23, sources: [SHARE23.sources[0]],
      fidelity: { ...SHARE23.fidelity, scope: 'SOURCE' } };
    // a single-source record stores fidelity as an array parallel to sources
    one.fidelity = [one.fidelity];
    const { row, card } = await mount(one);
    expect(text(row.querySelector('.dc-act-fid'))).toContain('تطابق با منبع:');
    expect(text(card!.querySelector('.dc-des-seg button'))).toBe('تطابق با منبع');
    expect(text(card!.querySelector('.dc-fid-ask'))).toContain('منبع اصلی‌اش');
  });

  it('the word follows the stored level, refined by the score', async () => {
    const { fidelityWord } = await import('/plus/js/des.js');
    const w = (level: string, score: number | null, a = 0, r = 0) =>
      fidelityWord({ level, fidelity_score: score, counts: { altered: a, reversed: r } }).word;
    expect(w('HIGH', 100)).toBe('کاملاً مطابق');
    expect(w('HIGH', 98, 2)).toBe('تطابق خیلی بالا');
    expect(w('HIGH', 88, 1)).toBe('تطابق بالا');
    expect(w('HIGH', 83, 1)).toBe('تطابق بالا'); // one notch on a 3-claim page (v2.8 F4)
    expect(w('MEDIUM', 75, 0, 1)).toBe('تطابق متوسط');
    expect(w('LOW', 40, 3, 1)).toBe('تطابق پایین');
    expect(w('INSUFFICIENT_CLAIMS', null)).toBe('ادعای کافی برای سنجش ندارد');
  });
});
