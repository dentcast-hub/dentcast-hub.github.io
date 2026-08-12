// @vitest-environment jsdom
// Drives the REAL shipped homepage doorway (/plus/js/home-upboard.js).
//
// The box is filled by index.html's own inline script, and this module borrows
// the same <ul>. That shared ownership is the risk worth pinning: «تازه‌ترین»
// must come back EXACTLY as the other renderer left it, and a failure to reach
// the API must never leave the homepage with an empty list.
import { describe, it, expect, beforeEach, vi } from 'vitest';

let boardImpl: () => Promise<unknown>;
let indexOk = true;

vi.mock('/plus/js/api.js', () => ({
  api: { voteBoard: () => boardImpl() },
}));

let ctaFrom: string | null = null;
vi.mock('/plus/js/premium-cta.js', () => ({
  premiumCta: (from: string) => { ctaFrom = from; return document.createElement('a'); },
}));

const premiumRequired = () => Object.assign(new Error('premium_required'), { status: 402 });

const CATALOG = {
  items: [
    { id: 'a/1', u: '/a/1.html', t: 'chairside', tf: 'چیرساید', ti: 'یک', d: '' },
    { id: 'a/2', u: '/a/2.html', t: 'chairside', tf: 'چیرساید', ti: 'دو', d: '' },
    { id: 'a/3', u: '/a/3.html', t: 'chairside', tf: 'چیرساید', ti: 'سه', d: '' },
  ],
};

const BOARD = {
  items: [
    { content_id: 'a/2', hearts: 11, score: 11 },
    { content_id: 'a/3', hearts: 0, score: 4 },   // ranked on seed alone
    { content_id: 'gone/9', hearts: 3, score: 3 }, // ranked id with no page
    { content_id: 'a/1', hearts: 1, score: 1 },
  ],
  total_hearts: 15,
  seed_weight: 0.5,
};

// What the inline script leaves behind — captured and restored verbatim.
const FRESH = '<li><a href="/x.html"><span class="dc-mlist-title">تازه</span></a></li>';

const SKELETON = `
  <article>
    <a class="dc-monitor-all" href="/up-board/">همه ›</a>
    <button type="button" data-monitor-sort="new" aria-selected="true">تازه‌ترین</button>
    <button type="button" data-monitor-sort="top" aria-selected="false">بالاترین</button>
    <ul id="dcLast3Updates">${FRESH}</ul>
  </article>`;

const settle = () => new Promise((r) => setTimeout(r, 0));
const list = () => document.getElementById('dcLast3Updates')!;
const tab = (m: string) => document.querySelector(`[data-monitor-sort="${m}"]`) as HTMLElement;

async function mount() {
  document.body.innerHTML = SKELETON;
  const { initHomeUpboard } = await import('/plus/js/home-upboard.js');
  initHomeUpboard();
}

beforeEach(() => {
  vi.resetModules();
  indexOk = true;
  boardImpl = () => Promise.resolve(BOARD);
  globalThis.fetch = vi.fn(() => Promise.resolve({
    ok: indexOk,
    status: indexOk ? 200 : 404,
    json: async () => CATALOG,
  })) as any;
});

describe('the homepage up-board doorway', () => {
  it('leaves the fresh list alone until asked', async () => {
    await mount();
    await settle();
    expect(list().innerHTML).toBe(FRESH);
  });

  it('ranks on «بالاترین», skipping an id with no page', async () => {
    await mount();
    tab('top').click();
    await settle();
    await settle();
    const rows = Array.from(list().querySelectorAll('.dc-mlist-title')).map((s) => s.textContent);
    expect(rows).toEqual(['دو', 'سه', 'یک']);
    expect(tab('top').getAttribute('aria-selected')).toBe('true');
  });

  it('numbers the ranked rows', async () => {
    await mount();
    tab('top').click();
    await settle();
    await settle();
    const ranks = Array.from(list().querySelectorAll('.dc-monitor-rank')).map((s) => s.textContent);
    expect(ranks).toEqual(['۱', '۲', '۳']);
  });

  it('prints a heart count only where there is one', async () => {
    await mount();
    tab('top').click();
    await settle();
    await settle();
    const items = Array.from(list().querySelectorAll('li'));
    expect(items[0].querySelector('.dc-monitor-hearts')!.textContent).toContain('۱۱');
    expect(items[1].querySelector('.dc-monitor-hearts')).toBeNull(); // seed only
    expect(items[2].querySelector('.dc-monitor-hearts')!.textContent).toContain('۱');
  });

  it('restores the other renderer\'s list verbatim', async () => {
    await mount();
    tab('top').click();
    await settle();
    await settle();
    expect(list().innerHTML).not.toBe(FRESH);

    tab('new').click();
    await settle();
    expect(list().innerHTML).toBe(FRESH);
    expect(tab('new').getAttribute('aria-selected')).toBe('true');
  });

  it('never leaves the homepage with an empty box when the API is down', async () => {
    boardImpl = () => Promise.reject(new Error('offline'));
    await mount();
    tab('top').click();
    await settle();
    await settle();
    expect(list().innerHTML).toBe(FRESH);
    expect(tab('new').getAttribute('aria-selected')).toBe('true');
  });

  it('gates a free reader, locks the tab and keeps the fresh list', async () => {
    ctaFrom = null;
    boardImpl = () => Promise.reject(premiumRequired());
    await mount();
    tab('top').click();
    await settle();
    await settle();

    expect(list().innerHTML).toBe(FRESH);
    expect(tab('new').getAttribute('aria-selected')).toBe('true');
    expect(tab('top').classList.contains('is-locked')).toBe(true);
    const text = document.querySelector('.dcp-sheet')!.textContent!;
    expect(text).toContain('ویژه‌ی پریمیوم');
    expect(text).toContain('بیشترین بازخورد');
    expect(text).toContain('تعاملِ همهٔ کاربرها');
    expect(text).not.toContain('دیده شدن');
    expect(ctaFrom).toBe('home-upboard');
  });

  it('never sells a subscription when it simply could not ask', async () => {
    ctaFrom = null;
    boardImpl = () => Promise.reject(new Error('offline'));
    await mount();
    tab('top').click();
    await settle();
    await settle();

    expect(tab('top').classList.contains('is-locked')).toBe(false);
    expect(document.querySelector('.dcp-sheet')!.textContent).toContain('ارتباط با سرور برقرار نشد');
    expect(ctaFrom).toBeNull();
  });

  it('survives the catalog being unreachable too', async () => {
    indexOk = false;
    await mount();
    tab('top').click();
    await settle();
    await settle();
    expect(list().innerHTML).toBe(FRESH);
  });
});
