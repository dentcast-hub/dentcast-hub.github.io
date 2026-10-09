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
const REAL = ALL['sharehub/share-23'];
// A fixture with two flagged sentences, built from the real record so the shape
// stays the stored one: share-23 itself was fixed to «کاملاً مطابق» (step 4.13
// Part 3b, 1405/07/17), and the differing-sentence display still needs a case.
const SHARE23 = (() => {
  const r = JSON.parse(JSON.stringify(REAL));
  const f = r.fidelity;
  for (const id of ['u46', 'u48']) {
    const c = f.claims.find((x: { id: string }) => x.id === id);
    c.verdict = 'ALTERED';
    c.change_kind = id === 'u46' ? 'POPULATION_OR_CONDITION_CHANGED' : 'HEDGE_REMOVED';
    c.source_quote = c.source_quote || 'Residual blood components may remain even after water rinsing.';
    c.source_ref = c.source_ref || 'S1';
  }
  f.counts.matches -= 2; f.counts.altered += 2;
  f.fidelity_score = 98; f.level = 'HIGH';
  return r;
})();

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

  it('the stored share-23 record, after its fixes, reads «کاملاً مطابق» with nothing flagged', async () => {
    const { row, card } = await mount(REAL);
    expect(text(row.querySelector('.dc-act-fid'))).toContain('کاملاً مطابق');
    expect(text(card!.querySelector('.dc-fid-word'))).toBe('کاملاً مطابق');
    expect(card!.querySelectorAll('.dc-fid-diff')).toHaveLength(0);
    expect(card!.querySelector('.dc-fid-diff-h')).toBeNull();
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

  it('share-18: a source with too few claims never speaks for the page', async () => {
    // four sources at «کاملاً مطابق», Einhorn at INSUFFICIENT_CLAIMS (one claim)
    const { row } = await mount(ALL['sharehub/share-18'], 'sharehub/share-18');
    const chip = text(row.querySelector('.dc-act-fid'));
    expect(chip).toContain('کاملاً مطابق');
    expect(chip).not.toContain('ادعای کافی');
  });

  it('several sources are shown as ONE fidelity box, totals over every claim', async () => {
    const { card } = await mount(ALL['sharehub/share-18'], 'sharehub/share-18');
    const pane = card!.querySelector('.dc-des-pane[data-pane="fid"]')!;
    expect(pane.querySelectorAll('.dc-fid')).toHaveLength(1);
    expect(pane.querySelectorAll('.dc-des-srctitle')).toHaveLength(0);
    expect(text(pane)).toContain('کاملاً مطابق');
    expect(text(pane)).not.toContain('ادعای کافی');
    expect(text(pane)).toContain('به تفکیک منبع');
  });

  it('a differing sentence in the combined box names its own paper', async () => {
    const rec = JSON.parse(JSON.stringify(ALL['sharehub/share-18']));
    const f = rec.fidelity[1]; // Stoilov
    const c = f.claims.find((x: { verdict: string }) => x.verdict === 'MATCHES');
    c.verdict = 'ALTERED'; c.change_kind = 'HEDGE_REMOVED';
    f.counts.matches -= 1; f.counts.altered += 1;
    const { row, card } = await mount(rec);
    const diff = card!.querySelectorAll('.dc-fid-diff');
    expect(diff).toHaveLength(1);
    expect(text(diff[0])).toContain('Stoilov');
    expect(text(row.querySelector('.dc-act-fid'))).not.toContain('کاملاً');
  });

  it('a sentence judged under two sources counts once, and a difference in either half flags it', async () => {
    const rec = JSON.parse(JSON.stringify(ALL['sharehub/share-18']));
    const a = rec.fidelity[0].claims.find((x: { verdict: string }) => x.verdict === 'MATCHES');
    const twin = { ...a, verdict: 'ALTERED', change_kind: 'POPULATION_OR_CONDITION_CHANGED' };
    rec.fidelity[2].claims.push(twin);
    rec.fidelity[2].counts.altered += 1;
    const { card } = await mount(rec);
    const pane = card!.querySelector('.dc-des-pane[data-pane="fid"]')!;
    expect(pane.querySelectorAll('.dc-fid-diff')).toHaveLength(1);
    expect(text(pane.querySelector('.dc-fid-diff'))).toContain(a.claim_quote);
  });

  it('fewer than three claims across every source: the chip says so', async () => {
    const rec = JSON.parse(JSON.stringify(ALL['sharehub/share-18']));
    let kept = 0;
    rec.fidelity.forEach((f: { claims: { verdict: string }[] }) => f.claims.forEach((c) => {
      if (c.verdict === 'MATCHES' && kept < 2) { kept += 1; return; }
      if (['MATCHES', 'ALTERED', 'REVERSED'].includes(c.verdict)) c.verdict = 'NOT_A_CLAIM';
    }));
    const { row } = await mount(rec);
    expect(text(row.querySelector('.dc-act-fid'))).toContain('ادعای کافی برای سنجش ندارد');
  });

  it('a chip brings the card\'s TOP into view, never its middle', async () => {
    const calls: unknown[] = [];
    const prev = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (o?: unknown) { calls.push(o); };
    try {
      const { row } = await mount(SHARE23);
      (row.querySelector('.dc-act-fid') as HTMLElement).click();
      expect(calls[0]).toMatchObject({ block: 'start' });
    } finally { Element.prototype.scrollIntoView = prev; }
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
