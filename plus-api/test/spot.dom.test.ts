// @vitest-environment jsdom
//
// Two rules of the ad system, driving the REAL shipped module (/spot/spot.js)
// in a DOM:
//
//   1. Visitor class decides whether an ad may exist AT ALL. premium: never —
//      not even for the moment a slow /me takes to answer. anon and plus: yes,
//      each with their own targeting.
//   2. An impression means SEEN, not rendered: 50% of the card on screen for one
//      continuous second, in a foreground tab.
//
// Rule 1 is the regression net for the production row
// `article / premium-creative / plus-viewer`: /me answered late, the client had
// already guessed "anon", and the server labelled the impression from the
// session cookie.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── the mocked /me ───────────────────────────────────────────────────────────
const me: { user: any; status: string; delayMs: number } = { user: null, status: 'anon', delayMs: 0 };

vi.mock('/plus/js/api.js', () => ({
  currentUser: () => new Promise((resolve) => setTimeout(() => resolve(me.user), me.delayMs)),
  meStatus: () => me.status,
  apiBase: () => Promise.resolve('https://api.test'),
}));

// ── a controllable IntersectionObserver (jsdom has none) ─────────────────────
type Obs = { cb: (entries: any[]) => void; disconnected: boolean };
let observers: Obs[] = [];

class FakeIO {
  cb: (entries: any[]) => void;
  constructor(cb: (entries: any[]) => void) { this.cb = cb; }
  observe() { observers.push({ cb: this.cb, disconnected: false }); }
  disconnect() { observers.forEach((o) => { if (o.cb === this.cb) o.disconnected = true; }); }
  unobserve() { /* not used */ }
}

const live = () => observers.filter((o) => !o.disconnected);
const enterView = (ratio = 1) => live().forEach((o) => o.cb([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]));
const leaveView = () => live().forEach((o) => o.cb([{ isIntersecting: false, intersectionRatio: 0 }]));
/** Scroll the card into view and hold it there long enough to count. */
async function seen(dwellMs = 1000) { enterView(); await vi.advanceTimersByTimeAsync(dwellMs); }

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

// ── config under test ────────────────────────────────────────────────────────
const CONFIG = {
  enabled: true,
  premium_hides_ads: true,
  seen: { ratio: 0.5, ms: 1000 },
  slots: { home: { enabled: true } },
  rotation: { advance: 'view', sequence: ['premium'] },
  creatives: {
    // The house "join Plus" card is for signed-OUT visitors only...
    premium: {
      enabled: true, id: 'premium', badge: 'b', title: 'join plus', text: '', cta: 'c',
      url: '/plus/', image: null, audience: ['anon'],
    },
    // ...and this one is what a signed-in free user must get instead.
    sponsors: [{
      enabled: true, id: 'brand-invite', badge: 'b', title: 'brand', text: '', cta: 'c',
      url: 'https://brand.test/', image: null, weight: 1, audience: ['plus'],
    }],
  },
};

let posts: Array<{ url: string; body: any }> = [];

function stubFetch(activityStatus = 204) {
  globalThis.fetch = vi.fn(async (input: any, init: any) => {
    const url = String(input);
    if (url.includes('spot-config.json')) return { ok: true, json: async () => CONFIG } as any;
    posts.push({ url, body: JSON.parse(init.body) });
    if (url.includes('/activity') && activityStatus !== 204) return { ok: false, status: activityStatus } as any;
    return { ok: true, status: 204 } as any;
  }) as any;
}

/**
 * Boot spot.js on a homepage DOM and advance virtual time by `ms`. Tests that
 * care about the FLASH (did a card exist between the timeout and the real
 * answer?) boot with a short advance, assert, then `tick()` the rest — settling
 * everything at once would hide a card that was rendered and later removed.
 */
async function boot(ms = 10_000): Promise<void> {
  document.body.innerHTML = '<div id="mobile-body"><div id="dcPulseCard">pulse</div></div>';
  vi.resetModules();
  await import('/spot/spot.js');
  await vi.advanceTimersByTimeAsync(ms);
}
const tick = (ms: number) => vi.advanceTimersByTimeAsync(ms);

const cards = () => document.querySelectorAll('.dc-spot').length;
const creativeShown = () => document.querySelector('.dc-spot')?.getAttribute('data-dc-spot') ?? null;

beforeEach(() => {
  vi.useFakeTimers();
  posts = [];
  observers = [];
  localStorage.clear();
  me.user = null; me.status = 'anon'; me.delayMs = 0;
  (globalThis as any).IntersectionObserver = FakeIO;
  setVisibility('visible');
  stubFetch();
});

afterEach(() => {
  // Drop anything a test left pending (a held impression waiting on /me, a dwell
  // timer). Without this, the previous module instance fires into the NEXT
  // test's `posts` array the moment that test advances the clock.
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('premium never sees an ad', () => {
  it('renders nothing when /me answers premium in time', async () => {
    me.user = { tier: 'premium' }; me.status = 'user';
    await boot();
    expect(cards()).toBe(0);
    await seen();
    expect(posts).toHaveLength(0);
  });

  it('waits for a SLOW answer on a device already known to be premium', async () => {
    localStorage.setItem('dcAds.vc', 'premium'); // confirmed on an earlier page view
    me.user = { tier: 'premium' }; me.status = 'user';
    me.delayMs = 6000; // far beyond TIER_TIMEOUT_MS — the old code rendered here
    await boot(4000); // past the timeout, before the answer: THE flash window
    expect(cards(), 'no ad may flash while the answer is pending').toBe(0);
    await tick(6000);
    expect(cards()).toBe(0);
    await seen();
    expect(posts).toHaveLength(0);
  });

  it('renders nothing for a known-premium device when the API is unreachable', async () => {
    localStorage.setItem('dcAds.vc', 'premium');
    me.user = null; me.status = 'error'; // "could not ask" must not read as "not premium"
    await boot();
    expect(cards()).toBe(0);
  });

  it('counts nothing when a first-time premium answer lands during the dwell', async () => {
    me.user = { tier: 'premium' }; me.status = 'user';
    me.delayMs = 6000; // no device memory yet, so it DOES render first...
    await boot(4000);
    expect(cards(), 'unavoidable on a first-ever visit with a slow API').toBe(1);
    enterView(); // the visitor is looking at it...
    await tick(6000); // ...and the premium answer lands mid-dwell
    expect(cards(), 'the late answer must clear it').toBe(0);
    expect(posts, 'and it must never reach the report').toHaveLength(0);
    // The next page view never repeats it, because the class is now known.
    expect(localStorage.getItem('dcAds.vc')).toBe('premium');
  });

  it('remembers the class for the next page view', async () => {
    me.user = { tier: 'premium' }; me.status = 'user';
    await boot();
    expect(localStorage.getItem('dcAds.vc')).toBe('premium');
  });
});

describe('anon and plus both see ads, targeted apart', () => {
  it('serves the join-Plus card to a signed-out visitor, via /anon/event', async () => {
    me.user = null; me.status = 'anon';
    await boot();
    expect(cards()).toBe(1);
    expect(creativeShown()).toBe('premium');
    await seen();
    expect(posts).toHaveLength(1);
    expect(posts[0].url).toContain('/anon/event');
    expect(posts[0].body).toEqual({ event: 'spot_impression', content_id: 'home:premium' });
  });

  it('serves the plus-targeted card to a signed-in free user, via /activity', async () => {
    me.user = { tier: 'free' }; me.status = 'user';
    await boot();
    expect(creativeShown()).toBe('brand-invite');
    await seen();
    expect(posts[0].url).toContain('/activity');
    expect(posts[0].body).toEqual({ action: 'spot_impression', content_id: 'home:brand-invite' });
  });

  it('keeps plus targeting from the device memory when /me is slow', async () => {
    localStorage.setItem('dcAds.vc', 'plus');
    me.user = { tier: 'free' }; me.status = 'user';
    me.delayMs = 6000; // the old code fell back to "anon" here and mis-targeted
    await boot();
    expect(creativeShown()).toBe('brand-invite');
  });

  it('still renders as anon on a device that has never signed in', async () => {
    me.user = null; me.status = 'error'; // API down, no memory → fail open
    await boot();
    expect(cards()).toBe(1);
    expect(creativeShown()).toBe('premium');
  });

  it('falls back to /anon/event when the session dies after /me answered (401)', async () => {
    me.user = { tier: 'free' }; me.status = 'user'; // signed in when the page loaded...
    stubFetch(401); // ...but the session is gone by the time the event is sent
    await boot();
    await seen();
    expect(posts.map((p) => p.url.replace('https://api.test', ''))).toEqual(['/activity', '/anon/event']);
    expect(posts[1].body).toEqual({ event: 'spot_impression', content_id: 'home:brand-invite' });
  });
});

describe('an impression means seen, not rendered', () => {
  it('counts nothing for a card that is never scrolled to', async () => {
    await boot();
    expect(cards(), 'the card is on the page...').toBe(1);
    await tick(60_000);
    expect(posts, '...but was never on screen, so it was never delivered').toHaveLength(0);
  });

  it('counts nothing when the card is barely peeking (below the ratio)', async () => {
    await boot();
    enterView(0.2);
    await tick(5000);
    expect(posts).toHaveLength(0);
  });

  it('counts nothing when the visitor scrolls past before the dwell completes', async () => {
    await boot();
    enterView();
    await tick(600); // less than seen.ms
    leaveView();
    await tick(60_000);
    expect(posts).toHaveLength(0);
  });

  it('counts once the card holds half on screen for a full second', async () => {
    await boot();
    enterView(0.5);
    await tick(999);
    expect(posts, 'not yet — the second is not up').toHaveLength(0);
    await tick(1);
    expect(posts).toHaveLength(1);
    expect(posts[0].body.event).toBe('spot_impression');
  });

  it('does not count a background tab, and counts when it is brought forward', async () => {
    await boot();
    setVisibility('hidden');
    enterView();
    await tick(5000);
    expect(posts, 'a prerendered/background tab saw nothing').toHaveLength(0);
    setVisibility('visible');
    await tick(1000);
    expect(posts).toHaveLength(1);
  });

  it('counts a placement only once per page view', async () => {
    await boot();
    await seen();
    await seen();
    enterView();
    await tick(5000);
    expect(posts).toHaveLength(1);
  });
});
