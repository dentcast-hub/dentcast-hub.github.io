// @vitest-environment jsdom
// Drives the REAL shipped page module (/plus/js/upboard-page.js).
//
// The invariants worth pinning here are the ones that make /up-board/ one page
// instead of two, and the ones that keep it useful when half its data is
// missing:
//
//   · «تازه‌ترین» renders from the catalog ALONE, so a dead API costs the reader
//     the ranked tab and never the list;
//   · «بالاترین» never drops the items the board has not heard of — a board that
//     silently hid four hundred pages would be a worse catalog than the one it
//     replaced;
//   · zero is not printed, here for four hundred rows at once;
//   · the arrangement and the filter live in the URL.
import { describe, it, expect, beforeEach, vi } from 'vitest';

let boardImpl: () => Promise<unknown>;
let indexImpl: () => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

vi.mock('/plus/js/api.js', () => ({
  api: { voteBoard: () => boardImpl() },
}));

const CATALOG = {
  version: 1,
  count: 5,
  types: [
    { key: 'chairside', fa: 'چیرساید' },
    { key: 'notecast', fa: 'NoteCast' },
  ],
  items: [
    { id: 'chairside/c-5', u: '/chairside/c-5.html', t: 'chairside', tf: 'چیرساید', ti: 'پنجم', d: '۲۰ مرداد ۱۴۰۵' },
    { id: 'notecast/n-4', u: '/notecast/n-4.html', t: 'notecast', tf: 'NoteCast', ti: 'چهارم', d: '۱۹ مرداد ۱۴۰۵' },
    { id: 'chairside/c-3', u: '/chairside/c-3.html', t: 'chairside', tf: 'چیرساید', ti: 'سوم', d: '' },
    { id: 'notecast/n-2', u: '/notecast/n-2.html', t: 'notecast', tf: 'NoteCast', ti: 'دوم', d: '۱۷ مرداد ۱۴۰۵' },
    { id: 'chairside/c-1', u: '/chairside/c-1.html', t: 'chairside', tf: 'چیرساید', ti: 'اول', d: '۱۶ مرداد ۱۴۰۵' },
  ],
};

const BOARD = {
  // Deliberately only three of the five: the other two have neither hearts nor
  // any engagement behind them, which is the normal state of most of the site.
  // 'chairside/c-1' carries hearts but NO engagement key — the server omits it
  // rather than sending 0, and the row must omit the chip rather than print one.
  items: [
    { content_id: 'notecast/n-2', hearts: 9, score: 11.5, engagement: 100 },
    { content_id: 'chairside/c-1', hearts: 4, score: 4 },
    { content_id: 'chairside/c-5', hearts: 0, score: 1.5, engagement: 50 },
  ],
  total_hearts: 13,
  engagement_cap: 2.5,
  generated_at: '2026-08-12T00:00:00.000Z',
};

const SKELETON = `
  <main id="ubRoot">
    <p id="ubLead"></p>
    <div><button type="button" data-sort="new" aria-selected="true">تازه‌ترین</button>
         <button type="button" data-sort="top" aria-selected="false">بالاترین</button></div>
    <div id="ubFilters"></div>
    <p id="ubCount"></p>
    <ol id="ubList"></ol>
    <p id="ubSentinel"></p>
  </main>`;

const settle = () => new Promise((r) => setTimeout(r, 0));

async function mount(search = '') {
  history.replaceState(null, '', '/up-board/' + search);
  document.body.innerHTML = SKELETON;
  const { initUpBoard } = await import('/plus/js/upboard-page.js');
  initUpBoard(document.getElementById('ubRoot'));
  await settle();
  await settle();
  return document.getElementById('ubRoot')!;
}

const titles = () => Array.from(document.querySelectorAll('.ub-row-title')).map((a) => a.textContent);
const click = (sel: string) => (document.querySelector(sel) as HTMLElement).click();

beforeEach(() => {
  vi.resetModules();
  boardImpl = () => Promise.resolve(BOARD);
  indexImpl = () => Promise.resolve({ ok: true, json: async () => CATALOG });
  globalThis.fetch = vi.fn(() => indexImpl()) as any;
  // jsdom has no IntersectionObserver; the module guards for it, but the whole
  // list must be drawable in a test, so give it one that draws everything.
  (globalThis as any).IntersectionObserver = class {
    cb: (e: unknown[]) => void;
    constructor(cb: (e: unknown[]) => void) { this.cb = cb; }
    observe() { this.cb([{ isIntersecting: true }]); }
    disconnect() {}
  };
});

describe('/up-board/', () => {
  it('opens in date order, newest first', async () => {
    await mount();
    expect(titles()).toEqual(['پنجم', 'چهارم', 'سوم', 'دوم', 'اول']);
    expect(document.getElementById('ubCount')!.textContent).toBe('۵ مطلب');
  });

  it('numbers nothing in date order', async () => {
    await mount();
    expect(document.querySelectorAll('.ub-rank').length).toBe(0);
  });

  it('reorders on «بالاترین» and numbers the rows', async () => {
    await mount();
    click('[data-sort="top"]');
    await settle();
    // Ranked first, in board order; then everything the board never heard of,
    // still in its own recency order.
    expect(titles()).toEqual(['دوم', 'اول', 'پنجم', 'چهارم', 'سوم']);
    const ranks = Array.from(document.querySelectorAll('.ub-rank')).map((s) => s.textContent);
    expect(ranks).toEqual(['۱', '۲', '۳', '۴', '۵']);
    expect(document.querySelector('.ub-rank')!.classList.contains('is-top')).toBe(true);
  });

  it('drops nothing when it ranks', async () => {
    await mount();
    const before = titles().length;
    click('[data-sort="top"]');
    await settle();
    expect(titles().length).toBe(before);
  });

  it('prints a heart count only where there is one', async () => {
    await mount();
    click('[data-sort="top"]');
    await settle();
    const rows = Array.from(document.querySelectorAll('.ub-row'));
    // «دوم» has 9, «اول» has 4; «پنجم» is on the board with 0 hearts (seed only)
    // and must print no number at all.
    expect(rows[0].querySelector('.ub-hearts')!.textContent).toContain('۹');
    expect(rows[1].querySelector('.ub-hearts')!.textContent).toContain('۴');
    expect(rows[2].querySelector('.ub-hearts')).toBeNull();
    expect(document.querySelectorAll('.ub-hearts').length).toBe(2);
  });

  it('filters by type and keeps the arrangement', async () => {
    await mount();
    click('[data-sort="top"]');
    await settle();
    click('[data-type="chairside"]');
    await settle();
    expect(titles()).toEqual(['اول', 'پنجم', 'سوم']);
    expect(document.getElementById('ubCount')!.textContent).toBe('۳ مطلب در این دسته');
  });

  it('builds its filter chips from the catalog', async () => {
    await mount();
    const chips = Array.from(document.querySelectorAll('.ub-filter')).map((b) => b.textContent);
    expect(chips).toEqual(['همه', 'چیرساید', 'NoteCast']);
  });

  it('writes the arrangement and the filter into the URL', async () => {
    await mount();
    click('[data-sort="top"]');
    await settle();
    click('[data-type="notecast"]');
    await settle();
    expect(location.search).toBe('?sort=top&type=notecast');

    click('[data-sort="new"]');
    await settle();
    click('[data-type="all"]');
    await settle();
    expect(location.search).toBe('');
  });

  it('restores an arrangement and filter from the URL', async () => {
    await mount('?sort=top&type=notecast');
    expect(titles()).toEqual(['دوم', 'چهارم']);
    expect(document.querySelector('[data-sort="top"]')!.getAttribute('aria-selected')).toBe('true');
  });

  // Rule 1: never blank the page waiting for the API.
  it('still lists everything in date order when the board is unreachable', async () => {
    boardImpl = () => Promise.reject(new Error('offline'));
    await mount();
    expect(titles()).toEqual(['پنجم', 'چهارم', 'سوم', 'دوم', 'اول']);
    expect((document.querySelector('[data-sort="top"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('falls back to date order if the board dies while «بالاترین» is showing', async () => {
    boardImpl = () => Promise.reject(new Error('offline'));
    await mount('?sort=top');
    expect(document.querySelector('[data-sort="new"]')!.getAttribute('aria-selected')).toBe('true');
    expect(titles()).toEqual(['پنجم', 'چهارم', 'سوم', 'دوم', 'اول']);
  });

  it('says so when the catalog itself fails', async () => {
    indexImpl = () => Promise.resolve({ ok: false, json: async () => ({}) });
    await mount();
    expect(document.getElementById('ubCount')!.textContent).toContain('بارگذاری نشد');
  });

  // The sentence over the list names BOTH signals and their pecking order, so a
  // reader deciding whether to trust the order is not left to guess it.
  it('states what the ranking is made of', async () => {
    await mount('?sort=top');
    const lead = document.getElementById('ubLead')!.textContent!;
    expect(lead).toContain('قلبِ خواننده‌ها');
    expect(lead).toContain('تعامل');
  });

  it('shows the engagement index only where the server sent one', async () => {
    await mount('?sort=top');
    const rows = Array.from(document.querySelectorAll('.ub-row'));
    // دوم (100) and پنجم (50) have an index; اول has hearts but no engagement.
    expect(rows[0].querySelector('.ub-engagement')!.textContent).toBe('۱۰۰');
    expect(rows[1].querySelector('.ub-engagement')).toBeNull();
    expect(rows[2].querySelector('.ub-engagement')!.textContent).toBe('۵۰');
    expect(document.querySelectorAll('.ub-engagement').length).toBe(2);
  });

  // In date order the index would be decoration: nothing on that page is ranked,
  // so a number that only explains a ranking has nothing to explain.
  it('hides the index in date order', async () => {
    await mount();
    expect(document.querySelectorAll('.ub-engagement').length).toBe(0);
  });

  // «۶۲» beside a heart invites exactly one wrong reading — a percentage of the
  // people who opened the page. The tap is what rules that out.
  it('explains the index on tap, quoting the live cap', async () => {
    await mount('?sort=top');
    (document.querySelector('.ub-engagement') as HTMLElement).click();
    await settle();
    const sheet = document.querySelector('.dcp-sheet')!;
    expect(sheet).toBeTruthy();
    const text = sheet.textContent!;
    expect(text).toContain('شاخصِ تعامل');
    expect(text).toContain('۱۰۰٪ مطالبِ دنت‌کست');
    expect(text).toContain('درصدِ خواننده‌ها');   // says what it is NOT
    expect(text).toContain('۲٫۵ قلب');            // the live cap, not a constant
  });
});
