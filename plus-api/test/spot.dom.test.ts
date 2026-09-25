// @vitest-environment jsdom
//
// Two rules of the ad system, driving the REAL shipped module (/spot/spot.js)
// in a DOM:
//
//   1. Visitor class decides whether an ad may exist AT ALL. premium: never —
//      not even for the moment a slow /me takes to answer. anon and plus: yes,
//      each with their own targeting.
//   2. An impression means SEEN, not rendered: `seen.ratio` of the card on screen
//      for `seen.ms` continuously, in a foreground tab — `seen.large_ratio` once
//      the card's own box passes `seen.large_px`. CONFIG below pins its own
//      thresholds so these tests keep asserting the MECHANISM rather than this
//      week's numbers.
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
// jsdom lays nothing out, so the card's box — which is what decides whether the
// large-ad threshold applies — is supplied by the test. SMALL is the ordinary
// 560px-capped card (~162k px²); LARGE is the dashboard/profile banner (~293k),
// the only shape on this site that crosses the IAB large-ad line.
const SMALL = { width: 560, height: 290 };
const LARGE = { width: 760, height: 385 };
const enterView = (ratio = 1, box = SMALL) => live().forEach((o) => o.cb([
  { isIntersecting: ratio > 0, intersectionRatio: ratio, boundingClientRect: box },
]));
const leaveView = () => live().forEach((o) => o.cb([
  { isIntersecting: false, intersectionRatio: 0, boundingClientRect: SMALL },
]));
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
  seen: { ratio: 0.5, ms: 1000, large_ratio: 0.3, large_px: 242500 },
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

  // The IAB's own large-ad allowance, and the reason it exists: an observer can
  // never report a ratio above viewport-area ÷ element-area, so past a certain
  // size a 50% rule measures the visitor's monitor rather than their attention.
  // On this site the dashboard/profile banner (~760×385) is the only card that
  // crosses the line — it is the one shape exempt from the 560px cap.
  it('holds an ordinary card to 50%', async () => {
    await boot();
    enterView(0.35, SMALL);
    await tick(5000);
    expect(posts, '35% of a normal card is not a viewable impression').toHaveLength(0);
    enterView(0.5, SMALL);
    await tick(1000);
    expect(posts).toHaveLength(1);
  });

  it('holds a large card to 30% — measured from its own box, not its slot', async () => {
    await boot();
    enterView(0.35, LARGE);
    await tick(1000);
    expect(posts, 'past the large-ad size, 35% IS the standard').toHaveLength(1);
  });

  it('still refuses a large card below 30%', async () => {
    await boot();
    enterView(0.25, LARGE);
    await tick(5000);
    expect(posts).toHaveLength(0);
  });
});

// A campaign can be pure artwork with nowhere to go: the offer, the brand and
// the date all live inside the image, and the advertiser asked for no action at
// all. Two things must then hold — the card is not a link (so it cannot promise
// a click it will not honour, and cannot report one), and the artwork is shown
// at full width instead of being cropped into the 44px headline thumb.
describe('an image-only campaign renders as artwork, not as a link', () => {
  const creatives = JSON.parse(JSON.stringify(CONFIG.creatives));
  const sequence = [...CONFIG.rotation.sequence];
  afterEach(() => {
    (CONFIG as any).creatives = JSON.parse(JSON.stringify(creatives));
    CONFIG.rotation.sequence = [...sequence];
  });

  const artOnly = {
    enabled: true, id: 'art-only', badge: 'حامی دنت‌کست', title: '', text: '', cta: '',
    url: '', image: '/spot/img/idc-welcome.webp', weight: 1,
  };

  it('renders the artwork with no anchor, no CTA, and reports no click', async () => {
    (CONFIG.creatives as any).sponsors = [artOnly];
    CONFIG.rotation.sequence = ['art-only'];
    await boot();

    const card = document.querySelector('.dc-spot')!;
    expect(card.classList.contains('dc-spot--art')).toBe(true);
    expect(card.querySelector('a'), 'no url means no link — not even an empty one').toBeNull();
    expect(card.querySelector('.dc-spot-cta')).toBeNull();
    expect(card.querySelector('.dc-spot-title')).toBeNull();
    expect(card.querySelector('.dc-spot-img'), 'the 44px thumb would crop the copy').toBeNull();
    expect(card.querySelector('.dc-spot-art-img')?.getAttribute('src')).toBe('/spot/img/idc-welcome.webp');
    // Disclosure survives the stripped-down layout: an unlabelled ad is the one
    // thing this card may not become.
    expect(card.querySelector('.dc-spot-badge')?.textContent).toBe('حامی دنت‌کست');

    await seen();
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toEqual({ event: 'spot_impression', content_id: 'home:art-only' });

    (card.firstElementChild as HTMLElement).click();
    await tick(100);
    expect(posts, 'there is nothing to click, so there is nothing to count').toHaveLength(1);
  });

  // The `premium` beat means "this session belongs to the house". The house card
  // is audience-split, so for a signed-in visitor the anon-targeted premium
  // creative does not apply — and the beat must then find the OTHER house card,
  // never hand the session to a paid campaign that was given its own beats.
  it('keeps the premium beat on the house card for a signed-in visitor', async () => {
    (CONFIG.creatives as any).sponsors = [
      {
        enabled: true, id: 'league-prize', badge: 'b', title: 'league', text: '', cta: 'c',
        url: '/plus/', image: null, weight: 1, audience: ['plus'],
      },
      artOnly,
    ];
    CONFIG.rotation.sequence = ['premium'];
    // A cursor position where the weighted sponsor pool would land on the paid
    // campaign — which is exactly what used to happen.
    localStorage.setItem('dcAds.rr', '1');
    me.user = { tier: 'free' }; me.status = 'user';
    await boot();
    expect(creativeShown()).toBe('league-prize');
  });

  it('still serves the anon house card on that same beat', async () => {
    (CONFIG.creatives as any).sponsors = [artOnly];
    CONFIG.rotation.sequence = ['premium'];
    await boot();
    expect(creativeShown()).toBe('premium');
  });
});

// The desktop sidebar (col-A of index.html's shell). It is the one slot that
// belongs to no page type: its host is a permanent, empty #dcdSpotSidebar rather
// than an anchor found from pageType(), and its card is PINNED to sequence[0]
// because it sits on screen for the whole visit instead of once per page view.
//
// Both properties are what these tests hold. The second `it` is the regression
// net for a slot switched ON in the config being silenced by an unrelated slot
// being switched OFF: setupSidebarSlot() sat after an early return that listed
// every slot but this one, so `home: false` took the permanent card down with it.
describe('the desktop sidebar', () => {
  const slots = JSON.parse(JSON.stringify(CONFIG.slots));
  const sequence = [...CONFIG.rotation.sequence];
  afterEach(() => {
    (CONFIG as any).slots = JSON.parse(JSON.stringify(slots));
    CONFIG.rotation.sequence = [...sequence];
  });

  /** index.html's desktop shell: the empty col-A host and nothing else. */
  async function bootDesk(ms = 10_000): Promise<void> {
    document.body.innerHTML = '<div id="mobile-body"><div id="dcPulseCard">pulse</div></div>'
      + '<section id="dc-desktop-root"><div class="dcd-a-spot" id="dcdSpotSidebar"></div></section>';
    vi.resetModules();
    await import('/spot/spot.js');
    await vi.advanceTimersByTimeAsync(ms);
  }
  const sidebarCard = () => document.querySelector('#dcdSpotSidebar .dc-spot--sidebar');

  it('seats a card in col-A and counts it under its own slot name', async () => {
    (CONFIG as any).slots = { home: { enabled: true }, sidebar: { enabled: true } };
    await bootDesk();
    expect(sidebarCard()).not.toBeNull();
    await seen();
    expect(posts.map((p) => p.body.content_id)).toContain('sidebar:premium');
  });

  it('renders even when the page own slot is off', async () => {
    (CONFIG as any).slots = { home: { enabled: false }, sidebar: { enabled: true } };
    await bootDesk();
    expect(document.querySelector('#mobile-body .dc-spot'), 'home is off').toBeNull();
    expect(sidebarCard(), 'sidebar is on, and nothing else decides that').not.toBeNull();
    await seen();
    expect(posts.map((p) => p.body.content_id)).toEqual(['sidebar:premium']);
  });

  it('spends no rotation beat — it is on screen for the whole visit', async () => {
    (CONFIG as any).slots = { home: { enabled: false }, sidebar: { enabled: true } };
    await bootDesk();
    await seen();
    expect(localStorage.getItem('dcAds.tick'), 'a permanent card must not burn a beat').toBeNull();
  });

  it('stays off when the config switches the slot off', async () => {
    (CONFIG as any).slots = { home: { enabled: true }, sidebar: { enabled: false } };
    await bootDesk();
    expect(sidebarCard()).toBeNull();
  });
});

describe('the homepage card and the pathways showcase (founder, 1405/07/03)', () => {
  // index.html's order: episode hero → [ad] → «مسیرهای یادگیری» host → مسیریاب.
  // The ad keeps its place right under the hero; the showcase and مسیریاب stay
  // adjacent instead of being split by it.
  async function bootHome(html: string): Promise<void> {
    document.body.innerHTML = html;
    vi.resetModules();
    await import('/spot/spot.js');
    await vi.advanceTimersByTimeAsync(10_000);
  }
  const PHONE = (host: boolean) => '<div id="mobile-body"><section id="panel-studio">'
    + '<div id="card-episodes">hero</div>'
    + (host ? '<div id="dcPathwayShowcase" hidden></div>' : '')
    + '<a id="dcWayfinderHome">wf</a><div class="dc-home-sec"></div><div class="dc-exa-cats"></div>'
    + '<div id="dcPulseCard">pulse</div></section></div>';

  it('anchors above the showcase host, so the host sits directly on مسیریاب', async () => {
    await bootHome(PHONE(true));
    const card = document.querySelector('#panel-studio .dc-spot')!;
    expect(card).not.toBeNull();
    expect(card.previousElementSibling!.id).toBe('card-episodes');
    expect(card.nextElementSibling!.id).toBe('dcPathwayShowcase');
    expect(document.getElementById('dcPathwayShowcase')!.nextElementSibling!.id).toBe('dcWayfinderHome');
  });

  it('falls back to مسیریاب when the host is not on the page', async () => {
    await bootHome(PHONE(false));
    const card = document.querySelector('#panel-studio .dc-spot')!;
    expect(card.nextElementSibling!.id).toBe('dcWayfinderHome');
  });

  it('does the same on the desktop welcome column', async () => {
    await bootHome('<div id="mobile-body"></div><section id="dc-desktop-root"><div id="dcd-welcome-feed">'
      + '<div id="dcd-card-episodes">hero</div><div id="dcdPathwayShowcase" hidden></div>'
      + '<a id="dcdWayfinderHome">wf</a></div></section>');
    const card = document.querySelector('#dcd-welcome-feed .dc-spot')!;
    expect(card).not.toBeNull();
    expect(card.previousElementSibling!.id).toBe('dcd-card-episodes');
    expect(card.nextElementSibling!.id).toBe('dcdPathwayShowcase');
  });
});

describe('the dashboard card and the streak bento', () => {
  // The Plus 2.0 dashboard draws «استریک» as one tile of a two-column grid.
  // Seating the card right after THAT section made it a third grid cell —
  // squeezed into the narrow column beside the streak, the record tile pushed
  // onto a row of its own (founder's screenshot, 1405/07/03). The card belongs
  // after the whole bento block, full width like every section around it.
  const slots = JSON.parse(JSON.stringify(CONFIG.slots));
  afterEach(() => { (CONFIG as any).slots = JSON.parse(JSON.stringify(slots)); });

  async function bootDash(html: string): Promise<void> {
    (CONFIG as any).slots = { dashboard: { enabled: true } };
    me.user = { tier: 'free' }; me.status = 'user';
    document.body.innerHTML = html;
    vi.resetModules();
    await import('/spot/spot.js');
    await vi.advanceTimersByTimeAsync(10_000);
  }

  it('seats the card after the bento block, never inside its grid', async () => {
    await bootDash('<main><div class="dcp-bento-wrap"><div class="dcp-bento">'
      + '<section class="dcp-dash-sec is-streak"><h2 class="dcp-dash-h2">استریک</h2></section>'
      + '<section class="dcp-dash-sec is-rec"></section></div>'
      + '<p class="dcp-bento-hint">hint</p></div><section id="next" class="dcp-dash-sec"></section></main>');
    const card = document.querySelector('.dc-spot--dashboard')!;
    expect(card).not.toBeNull();
    expect(card.closest('.dcp-bento'), 'never a grid cell').toBeNull();
    expect(card.previousElementSibling!.classList.contains('dcp-bento-wrap')).toBe(true);
    expect(card.nextElementSibling!.id).toBe('next');
  });

  it('still seats right after a plain «استریک» section (the overlay skin)', async () => {
    await bootDash('<main><section id="st" class="dcp-dash-sec"><h2 class="dcp-dash-h2">استریک</h2></section>'
      + '<section id="next" class="dcp-dash-sec"></section></main>');
    const card = document.querySelector('.dc-spot--dashboard')!;
    expect(card.previousElementSibling!.id).toBe('st');
  });
});
