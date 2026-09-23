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

let countsImpl: () => Promise<unknown>;
// GET /seen — the reader's own خوانده‌شده ticks. Absent by default, so every
// case above the seen-ticks block runs with rows that carry no tick at all.
let seenImpl: (() => Promise<unknown>) | null;
// The reader's tier, as /me answers it. The page reads this — not the board —
// to decide the lock, so it is what most of the gate cases below drive.
let meImpl: () => Promise<{ tier: string } | null>;
let meStatusImpl: () => string;
vi.mock('/plus/js/api.js', () => ({
  api: {
    voteBoard: () => boardImpl(),
    voteCounts: () => countsImpl(),
    seen: () => (seenImpl ? seenImpl() : Promise.reject(new Error('no /seen in this case'))),
  },
  currentUser: () => meImpl(),
  meStatus: () => meStatusImpl(),
}));

let ctaFrom: string | null = null;
vi.mock('/plus/js/premium-cta.js', () => ({
  premiumCta: (from: string) => { ctaFrom = from; return document.createElement('a'); },
  guestPremiumExtras: (from: string) => {
    guestExtrasFrom = from;
    const p = document.createElement('p');
    p.textContent = 'اگر اشتراک دارید وارد شوید.';
    return [p];
  },
}));

let guestExtrasFrom: string | null = null;
let loginOpened = 0;
vi.mock('/plus/js/login-modal.js', () => ({
  openLoginModal: () => { loginOpened += 1; return Promise.resolve(null); },
}));

/** The shapes api.js's ApiError takes for the two definite refusals. */
const premiumRequired = () => Object.assign(new Error('premium_required'), { status: 402 });
const signedOut = () => Object.assign(new Error('unauthorized'), { status: 401 });

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

/** A catalog of one podcast, for the two cases about audio's own scale. */
const EPISODE_CATALOG = {
  version: 1,
  count: 1,
  types: [{ key: 'dentcast', fa: 'اپیزود' }],
  items: [
    { id: 'episodes/episode-160', u: '/episodes/episode-160.html', t: 'dentcast', tf: 'اپیزود', ti: 'یک اپیزود', d: '۱۹ تیر ۱۴۰۵' },
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
  // Both classes had enough engaged pages to be ranked among themselves, so the
  // sheet may name the population. The fixture below flips this to test the
  // other regime.
  engagement_scope: ['audio', 'readable'],
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
  meImpl = () => Promise.resolve({ tier: 'premium' });
  meStatusImpl = () => 'user';
  // PUBLIC — every reader gets these, gate or no gate.
  countsImpl = () => Promise.resolve({ hearts: { 'notecast/n-2': 9, 'chairside/c-1': 4 } });
  seenImpl = null;
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
  });

  it('falls back to date order if the board dies while «بالاترین» is showing', async () => {
    boardImpl = () => Promise.reject(new Error('offline'));
    await mount('?sort=top');
    expect(document.querySelector('[data-sort="new"]')!.getAttribute('aria-selected')).toBe('true');
    expect(titles()).toEqual(['پنجم', 'چهارم', 'سوم', 'دوم', 'اول']);
  });

  // «بالاترین» is premium; «تازه‌ترین» is the list this page always was.
  describe('the premium gate', () => {
    beforeEach(() => { ctaFrom = null; guestExtrasFrom = null; loginOpened = 0; });

    // The regression this exists to prevent: gating the ARRANGEMENT once took
    // the heart counts off every row too, because they rode on the same
    // response. A count belongs to the article, not to the ordering.
    it('still shows heart counts to a reader it just gated', async () => {
      boardImpl = () => Promise.reject(premiumRequired());
      await mount();
      const rows = Array.from(document.querySelectorAll('.ub-row'));
      const withHearts = rows.filter((r) => r.querySelector('.ub-hearts'));
      expect(withHearts.length).toBe(2);
      expect(document.body.textContent).toContain('۹');
      expect(document.body.textContent).toContain('۴');
    });

    it('keeps the free list intact and locks only the ranked tab', async () => {
      boardImpl = () => Promise.reject(premiumRequired());
      await mount();
      expect(titles()).toEqual(['پنجم', 'چهارم', 'سوم', 'دوم', 'اول']);
      const top = document.querySelector('[data-sort="top"]')!;
      expect(top.classList.contains('is-locked')).toBe(true);
      // Not disabled and not removed: a reader who cannot open it should still
      // see that a second arrangement exists, or there is nothing to want.
      expect((top as HTMLButtonElement).disabled).toBe(false);
    });

    it('explains what the arrangement IS before what it costs', async () => {
      boardImpl = () => Promise.reject(premiumRequired());
      await mount();
      click('[data-sort="top"]');
      await settle();

      const sheet = document.querySelector('.dcp-sheet')!;
      const text = sheet.textContent!;
      expect(text).toContain('ویژه‌ی پریمیوم');
      expect(text).toContain('بیشترین بازخورد');                 // what it is
      expect(text).toContain('تعاملِ همهٔ کاربرها');              // how it is ordered
      // «دیده شدن» would promise a per-article view count that does not exist
      // anywhere on this site; what is counted is a page held to the end.
      expect(text).toContain('خوانده شدن');
      expect(text).not.toContain('دیده شدن');
      expect(ctaFrom).toBe('upboard');                          // ?from= tracking
    });

    it('does not switch the list when it gates', async () => {
      boardImpl = () => Promise.reject(premiumRequired());
      await mount();
      click('[data-sort="top"]');
      await settle();
      expect(document.querySelector('[data-sort="new"]')!.getAttribute('aria-selected')).toBe('true');
      expect(document.querySelectorAll('.ub-rank').length).toBe(0);
    });

    // A ?sort=top link shared by a subscriber lands a free reader here. The
    // locked tab is the invitation; a paywall that opens itself on arrival is
    // the thing everybody hates.
    it('does not pop the sheet unasked on a ?sort=top deep link', async () => {
      boardImpl = () => Promise.reject(premiumRequired());
      await mount('?sort=top');
      expect(document.querySelector('.dcp-sheet')).toBeNull();
      expect(titles()).toEqual(['پنجم', 'چهارم', 'سوم', 'دوم', 'اول']);
    });

    // A signed-out reader may ALREADY be a subscriber, just logged out on this
    // device. Selling them a subscription they own is worse than saying nothing,
    // so sign-in leads and the purchase link follows quieter.
    it('offers a signed-out reader sign-in first, not a purchase', async () => {
      boardImpl = () => Promise.reject(signedOut());
      await mount();
      expect(document.querySelector('[data-sort="top"]')!.classList.contains('is-locked')).toBe(true);

      click('[data-sort="top"]');
      await settle();
      const sheet = document.querySelector('.dcp-sheet')!;
      expect(sheet.textContent).toContain('بیشترین بازخورد');     // still explains what it is
      expect(sheet.querySelector('.dcp-btn-primary')!.textContent).toBe('ورود');
      expect(guestExtrasFrom).toBe('upboard');                     // the quieter CTA
      expect(ctaFrom).toBeNull();                                  // never the loud one

      (sheet.querySelector('.dcp-btn-primary') as HTMLElement).click();
      await settle();
      expect(loginOpened).toBe(1);
    });

    // ── THE WINDOW BEFORE THE BOARD ANSWERS ──
    //
    // The lock used to be set only in voteBoard()'s catch, so until that
    // request came back the tab was unlocked AND pressable — and pressing it
    // drew the date order a second time with rank numbers on it, because
    // `rank` was still empty. Not a race a fast connection wins: the request
    // sits behind a /health probe and a 30s deadline. The tier is what the
    // lock needs, and /me already carries it.
    const hangs = () => new Promise<never>(() => {});

    it('locks the ranked tab from /me, without waiting for the board', async () => {
      boardImpl = hangs;
      meImpl = () => Promise.resolve({ tier: 'free' });
      await mount();
      expect(document.querySelector('[data-sort="top"]')!.classList.contains('is-locked')).toBe(true);
    });

    it('never draws the date order as a ranking while the board is in flight', async () => {
      boardImpl = hangs;
      meImpl = () => Promise.resolve({ tier: 'free' });
      await mount();
      click('[data-sort="top"]');
      await settle();
      // The gate, not a second copy of «تازه‌ترین» wearing rank numbers.
      expect(document.querySelector('.dcp-sheet')).not.toBeNull();
      expect(document.querySelectorAll('.ub-rank').length).toBe(0);
      expect(document.querySelector('[data-sort="new"]')!.getAttribute('aria-selected')).toBe('true');
      expect(titles()).toEqual(['پنجم', 'چهارم', 'سوم', 'دوم', 'اول']);
    });

    // A press can land before /me has answered either. It must WAIT for the
    // answer rather than fall through into an arrangement that does not exist.
    it('waits for the tier when pressed before /me answers', async () => {
      boardImpl = hangs;
      let release: (v: { tier: string }) => void = () => {};
      const pending = new Promise<{ tier: string }>((r) => { release = r; });
      meImpl = () => pending;
      await mount();
      click('[data-sort="top"]');
      await settle();
      expect(document.querySelectorAll('.ub-rank').length).toBe(0);   // nothing yet
      release({ tier: 'free' });
      await settle();
      await settle();
      expect(document.querySelector('.dcp-sheet')).not.toBeNull();     // the gate
      expect(document.querySelectorAll('.ub-rank').length).toBe(0);
    });

    it('locks a signed-out reader from /me too', async () => {
      boardImpl = hangs;
      meImpl = () => Promise.resolve(null);
      meStatusImpl = () => 'anon';
      await mount();
      expect(document.querySelector('[data-sort="top"]')!.classList.contains('is-locked')).toBe(true);
      click('[data-sort="top"]');
      await settle();
      expect(document.querySelector('.dcp-sheet')!.querySelector('.dcp-btn-primary')!.textContent).toBe('ورود');
    });

    // «We could not ask» is not «you are not a subscriber», on this path either.
    it('leaves the tab alone when /me could not be reached', async () => {
      boardImpl = hangs;
      meImpl = () => Promise.resolve(null);
      meStatusImpl = () => 'error';
      await mount();
      expect(document.querySelector('[data-sort="top"]')!.classList.contains('is-locked')).toBe(false);
    });

    // A definite tier is never downgraded by a board request that died on the
    // network — that would unlock the tab for a reader we know is gated.
    it('keeps the lock when /me said free and the board request then failed', async () => {
      meImpl = () => Promise.resolve({ tier: 'free' });
      boardImpl = () => Promise.reject(new Error('offline'));
      await mount();
      expect(document.querySelector('[data-sort="top"]')!.classList.contains('is-locked')).toBe(true);
      click('[data-sort="top"]');
      await settle();
      expect(document.querySelector('.dcp-sheet')!.textContent).toContain('ویژه‌ی پریمیوم');
    });

    // A subscriber is never made to wait on /me: the board answers and the
    // ranking is drawn, lock or no lock.
    it('lets a subscriber straight into the ranking', async () => {
      await mount();
      click('[data-sort="top"]');
      await settle();
      expect(document.querySelector('.dcp-sheet')).toBeNull();
      expect(document.querySelectorAll('.ub-rank').length).toBeGreaterThan(0);
    });

    // The one failure this gate must not have: telling a paying reader to buy
    // what they own, because the API blinked.
    it('never sells a subscription when it simply could not ask', async () => {
      boardImpl = () => Promise.reject(new Error('offline'));
      await mount();
      expect(document.querySelector('[data-sort="top"]')!.classList.contains('is-locked')).toBe(false);

      click('[data-sort="top"]');
      await settle();
      const text = document.querySelector('.dcp-sheet')!.textContent!;
      expect(text).toContain('ارتباط با سرور برقرار نشد');
      expect(text).toContain('نه اینکه اشتراک نداری');
      expect(ctaFrom).toBeNull();
    });
  });

  // The ticks are drawn by the page's own row(), not by plus.js's boot-time
  // scan: these rows arrive after boot and every render() rebuilds them, which
  // is exactly why they never carried a tick before (1405/07/01).
  describe('the seen ticks', () => {
    const SEEN = { completed: ['notecast/n-4'], viewed: ['notecast/n-4', 'chairside/c-3'] };
    const tickOf = (title: string) => {
      const a = Array.from(document.querySelectorAll('.ub-row-title'))
        .find((x) => x.lastChild!.textContent === title)!;
      return a.querySelector('.dcp-seen-tick');
    };

    it('ticks every row in both arrangements, in the section lists\' three states', async () => {
      seenImpl = () => Promise.resolve(SEEN);
      await mount();
      expect(document.querySelectorAll('.ub-row-title .dcp-seen-tick').length).toBe(5);
      expect(tickOf('چهارم')!.className).toBe('dcp-seen-tick is-read');
      expect(tickOf('سوم')!.className).toBe('dcp-seen-tick is-seen');
      expect(tickOf('پنجم')!.className).toBe('dcp-seen-tick');

      // Every render() rebuilds the list; the ticks must come back with it.
      click('[data-sort="top"]');
      await settle();
      expect(document.querySelectorAll('.ub-rank').length).toBeGreaterThan(0);
      expect(document.querySelectorAll('.ub-row-title .dcp-seen-tick').length).toBe(5);
      expect(tickOf('چهارم')!.className).toBe('dcp-seen-tick is-read');
    });

    it('keeps them through a filter', async () => {
      seenImpl = () => Promise.resolve(SEEN);
      await mount();
      click('#ubFilters [data-type="notecast"]');
      await settle();
      expect(document.querySelectorAll('.ub-row-title .dcp-seen-tick').length).toBe(2);
    });

    it('draws nothing for a free reader, whose answer is the locked one', async () => {
      meImpl = () => Promise.resolve({ tier: 'free' });
      boardImpl = () => Promise.reject(premiumRequired());
      seenImpl = () => Promise.resolve({ locked: true, total: 5, completed_count: 1 });
      await mount();
      expect(document.querySelector('.dcp-seen-tick')).toBeNull();
    });

    it('never asks for a signed-out reader', async () => {
      meImpl = () => Promise.resolve(null);
      boardImpl = () => Promise.reject(signedOut());
      let asked = 0;
      seenImpl = () => { asked += 1; return Promise.resolve(SEEN); };
      await mount();
      expect(asked).toBe(0);
      expect(document.querySelector('.dcp-seen-tick')).toBeNull();
    });

    it('draws no grey column when /seen cannot answer', async () => {
      seenImpl = () => Promise.reject(new Error('offline'));
      await mount();
      expect(document.querySelector('.dcp-seen-tick')).toBeNull();
      expect(titles()).toEqual(['پنجم', 'چهارم', 'سوم', 'دوم', 'اول']);
    });
  });

  it('says so when the catalog itself fails', async () => {
    indexImpl = () => Promise.resolve({ ok: false, json: async () => ({}) });
    await mount();
    expect(document.getElementById('ubCount')!.textContent).toContain('بارگذاری نشد');
  });

  // One short line, and it changes with the arrangement — a reader who switches
  // tabs has to be told which of the two lists they are now looking at. The
  // ranking RULE is not here; the شاخص chip explains itself on tap.
  it('names the arrangement in one line, and swaps it with the tab', async () => {
    await mount();
    expect(document.getElementById('ubLead')!.textContent).toBe('از تازه‌ترین به قدیمی‌ترین.');

    click('[data-sort="top"]');
    await settle();
    expect(document.getElementById('ubLead')!.textContent).toBe('بر اساس تعاملِ همهٔ کاربرها.');
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
    // 100 is phrased as a superlative — «از ۱۰۰٪ … بیشتر» claims the page beat itself.
    expect(text).toContain('بیشترین تعامل را بین مطالبِ خواندنیِ دنت‌کست داشته');
    expect(text).toContain('درصدِ خواننده‌ها');   // says what it is NOT
    expect(text).toContain('۲٫۵ قلب');            // the live cap, not a constant
  });

  // A podcast is ranked among podcasts, so the sheet has to name THAT
  // population. On one shared scale its index measured how few doors an audio
  // page has rather than how much interest it drew, and a reader looking at
  // «۱۰۰» on an episode with no marks is owed the clause that explains it.
  it('names podcasts as the population when the row is a podcast', async () => {
    boardImpl = () => Promise.resolve({
      ...BOARD,
      items: [{ content_id: 'episodes/episode-160', hearts: 2, score: 4, engagement: 100 }],
    });
    indexImpl = () => Promise.resolve({ ok: true, json: async () => EPISODE_CATALOG });
    await mount('?sort=top');
    (document.querySelector('.ub-engagement') as HTMLElement).click();
    await settle();
    const text = document.querySelector('.dcp-sheet')!.textContent!;
    expect(text).toContain('بیشترین تعامل را بین پادکست‌های دنت‌کست داشته');
    expect(text).not.toContain('هایلایت، اشتراک‌گذاری و افزودن به کالکشن');
    expect(text).toContain('جدا از مطلبِ خواندنی مقایسه می‌شود');
  });

  // Until a class has twelve engaged pages the API ranks it against the whole
  // site — and says so in `engagement_scope`. The copy has to follow that, or it
  // states the wrong population for exactly as long as the fallback lasts.
  it('says «مطالبِ دنت‌کست» while the class is still ranked site-wide', async () => {
    boardImpl = () => Promise.resolve({
      ...BOARD,
      engagement_scope: ['readable'], // audio not yet populous enough
      items: [{ content_id: 'episodes/episode-160', hearts: 2, score: 4, engagement: 40 }],
    });
    indexImpl = () => Promise.resolve({ ok: true, json: async () => EPISODE_CATALOG });
    await mount('?sort=top');
    (document.querySelector('.ub-engagement') as HTMLElement).click();
    await settle();
    const text = document.querySelector('.dcp-sheet')!.textContent!;
    expect(text).toContain('۴۰٪ مطالبِ دنت‌کست');
    expect(text).not.toContain('پادکست‌های دنت‌کست');
    expect(text).not.toContain('جدا از مطلبِ خواندنی مقایسه می‌شود');
  });
});
