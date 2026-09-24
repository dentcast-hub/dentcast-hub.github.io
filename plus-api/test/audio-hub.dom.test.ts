// @vitest-environment jsdom
// Drives the REAL shipped audio hub (/plus/js/audio-hub.js).
//
// Stage 1 of «the podcast must not stop» (founder, 1405/07/01). What is pinned:
//   · every episode player writes player.html's OWN resume record
//     («dc-resume-state», same shape), so each player resumes every other —
//     and a page player at 1× never overwrites the speed player.html stored;
//   · the episode page's player restores that second on its first press, but
//     never over a clip (playSegment) and never a finished episode;
//   · the lock screen is told what is playing, and its ±15 act on it;
//   · one player starting pauses the others and tells dc-nav's music to yield;
//   · on any other page the «ادامه‌ی شنیدن» bar offers the saved second —
//     not when dismissed, stale, too early, finished, or on that episode's page;
//     it never starts sound for a listener who had paused, and it tries to
//     carry on by itself only when THIS tab left a page mid-play;
//   · the homepage hero's detached Audio is handed over through dcAudioPending.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// apiBase() is ASYNC in the real module (it probes the mirrors). The mock
// used to answer with a plain string, which is exactly how the sync writer
// shipped building «[object Promise]/player/state» with every test green.
vi.mock('/plus/js/api.js', () => ({ apiBase: () => Promise.resolve('https://api.test') }));

const fetchMock = vi.fn((..._args: any[]): Promise<any> => Promise.reject(new Error('no network')));
globalThis.fetch = fetchMock as any;

// ── a controllable media element (jsdom implements none of playback) ────────
const P = HTMLMediaElement.prototype as any;
const played: HTMLMediaElement[] = [];
let refusePlay = false;
Object.defineProperty(P, 'paused', { configurable: true, get() { return this._paused ?? true; } });
Object.defineProperty(P, 'currentTime', {
  configurable: true,
  get() { return this._t ?? 0; },
  set(v) { this._t = Number(v); this.dispatchEvent(new Event('seeking')); this.dispatchEvent(new Event('seeked')); },
});
Object.defineProperty(P, 'readyState', { configurable: true, get() { return this._rs ?? 0; } });
Object.defineProperty(P, 'networkState', { configurable: true, get() { return 1; } });
Object.defineProperty(P, 'duration', { configurable: true, get() { return this._d ?? NaN; } });
P.load = function () {};
P.play = function () {
  if (refusePlay) return Promise.reject(Object.assign(new Error('NotAllowedError'), { name: 'NotAllowedError' }));
  played.push(this);
  this._paused = false;
  this.dispatchEvent(new Event('play'));
  return Promise.resolve();
};
P.pause = function () {
  if (this._paused === false) { this._paused = true; this.dispatchEvent(new Event('pause')); }
};

// ── lock screen stub ────────────────────────────────────────────────────────
const handlers: Record<string, Function> = {};
const ms: any = { metadata: null, playbackState: 'none', setActionHandler: (a: string, fn: Function) => { handlers[a] = fn; } };
Object.defineProperty(navigator, 'mediaSession', { configurable: true, value: ms });
(window as any).MediaMetadata = class { constructor(init: any) { Object.assign(this, init); } };

const hub = await import('../../plus/js/audio-hub.js');
const { playSegment } = await import('../../plus/js/clip-audio.js');
const { RESUME_KEY, META_KEY, DISMISS_KEY, HANDOFF_KEY, initAudioHub, offerResume, _resetAudioHubForTests } = hub;

const settle = () => new Promise((r) => setTimeout(r, 0));
const SRC = 'https://episodes.example/dentcast162%20.mp3?versionId=';
const TITLE = 'Cantilever in Implant Dentistry :part2';
const now = () => Date.now();
const rec = () => JSON.parse(localStorage.getItem(RESUME_KEY) || 'null');
const bar = () => document.querySelector('.dcp-abar') as HTMLElement | null;

function at(path: string) { history.replaceState(null, '', path); }
function record(r: any) { localStorage.setItem(RESUME_KEY, JSON.stringify({ anchor: r.episode, speed: 1, t: now(), ...r })); }
function metaCache(m: any) { localStorage.setItem(META_KEY, JSON.stringify({ episode: 162, title: TITLE, page: '/episodes/episode-162.html', src: SRC, d: 1328, ...m })); }

/** The episode page the way tools/ builds it: title + <audio id="ep-audio" preload="none">. */
function episodePage(n = 162) {
  at(`/episodes/episode-${n}.html`);
  document.body.innerHTML = `<h1 class="ep-title">${TITLE}</h1><audio id="ep-audio" src="${SRC}" preload="none"></audio>`;
  return document.getElementById('ep-audio') as HTMLAudioElement & Record<string, any>;
}

beforeEach(() => {
  _resetAudioHubForTests();
  localStorage.clear();
  sessionStorage.clear();
  document.body.innerHTML = '';
  document.body.className = '';
  played.length = 0;
  refusePlay = false;
  fetchMock.mockReset();
  fetchMock.mockImplementation(() => Promise.reject(new Error('no network')));
  ms.metadata = null;
  for (const k of Object.keys(handlers)) delete handlers[k];
  delete (window as any).dcAudioPending;
});

describe('one record for every player', () => {
  it('the episode page writes player.html\'s own record, keeps its anchor, and never downgrades its speed', async () => {
    const a = episodePage();
    record({ episode: 162, position: 5, anchor: 161, speed: 1.5 });
    initAudioHub();
    a._rs = 4; a._d = 1328;
    a.play();
    await settle();
    a._t = 400;
    a.pause();
    const r = rec();
    expect(r.episode).toBe(162);
    expect(r.position).toBe(400);
    expect(r.anchor).toBe(161);   // the auto-advance chain player.html was on
    expect(r.speed).toBe(1.5);    // a page player at 1× says nothing about the chosen speed
    expect(typeof r.t).toBe('number');
    const m = JSON.parse(localStorage.getItem(META_KEY)!);
    expect(m).toMatchObject({ episode: 162, title: TITLE, page: '/episodes/episode-162.html', d: 1328 });
  });

  it('a signed-in listener\'s pause also reaches the account (PUT /player/state)', async () => {
    localStorage.setItem('dcp:signed-in', '1');
    fetchMock.mockImplementation(() => Promise.resolve({ ok: true, json: () => ({}) }));
    const a = episodePage();
    initAudioHub();
    a._rs = 4;
    a.play();
    await settle();
    a._t = 90;
    a.pause();
    await settle();
    const call = fetchMock.mock.calls.find((c) => String(c[0]).endsWith('/player/state'));
    expect(call).toBeTruthy();
    expect(call![0]).toBe('https://api.test/player/state');
    expect(call![1]).toMatchObject({ method: 'PUT', credentials: 'include' });
    expect(JSON.parse(call![1].body)).toMatchObject({ episode: 162, position: 90 });
  });

  it('an element that never played writes nothing', () => {
    const a = episodePage();
    record({ episode: 150, position: 700 });
    initAudioHub();
    a.dispatchEvent(new Event('timeupdate'));
    a.dispatchEvent(new Event('pause'));
    expect(rec().episode).toBe(150);
  });
});

describe('the episode page restores on its first press', () => {
  it('lands on the saved second', async () => {
    const a = episodePage();
    record({ episode: 162, position: 504 });
    initAudioHub();
    a._rs = 4; a._d = 1328;
    a.play();
    await settle();
    expect(a.currentTime).toBe(504);
  });

  it('waits for data before seeking (the CDN wedge), and does not save the 0 it starts from', async () => {
    const a = episodePage();
    record({ episode: 162, position: 504 });
    initAudioHub();
    a.play();
    await settle();
    a._t = 0.3;
    a.dispatchEvent(new Event('timeupdate'));
    expect(rec().position).toBe(504);
    expect(a.currentTime).toBe(0.3);
    a._rs = 4; a._d = 1328;
    a.dispatchEvent(new Event('canplay'));
    expect(a.currentTime).toBe(504);
  });

  it('never over a clip, never a different episode, never a finished one', async () => {
    let a = episodePage();
    record({ episode: 162, position: 504 });
    initAudioHub();
    a._rs = 4; a._d = 1328;
    await playSegment(a, { start: 50, end: 80 });
    await settle();
    expect(a.currentTime).toBe(50);

    _resetAudioHubForTests();
    a = episodePage();
    record({ episode: 161, position: 504 });
    initAudioHub();
    a._rs = 4; a._d = 1328;
    a.play();
    await settle();
    expect(a.currentTime).toBe(0);

    _resetAudioHubForTests();
    a = episodePage();
    record({ episode: 162, position: 1320 });
    initAudioHub();
    a._rs = 4; a._d = 1328;
    a.play();
    await settle();
    expect(a.currentTime).toBe(0);
  });

  it('a scrub before the first press wins', async () => {
    const a = episodePage();
    record({ episode: 162, position: 504 });
    initAudioHub();
    a._rs = 4; a._d = 1328;
    a.currentTime = 1; // the reader drags the bar to the start on purpose
    a.play();
    await settle();
    expect(a.currentTime).toBe(1);
  });
});

describe('lock screen and exclusivity', () => {
  it('tells the lock screen what is playing and wires ±15 to it', async () => {
    const a = episodePage();
    initAudioHub();
    a._rs = 4; a._d = 1328;
    a.play();
    await settle();
    await settle();
    expect(ms.metadata).toMatchObject({ title: TITLE, artist: 'دکتر فواد شهابیان', album: 'دنت‌کست' });
    a._t = 100;
    handlers.seekforward({});
    expect(a.currentTime).toBe(115);
    handlers.seekbackward({ seekOffset: 30 });
    expect(a.currentTime).toBe(85);
    handlers.pause();
    expect(a.paused).toBe(true);
  });

  it('starting one player pauses the other and asks dc-nav\'s music to yield', async () => {
    at('/');
    document.body.innerHTML = `<audio id="x1" src="${SRC}"></audio><audio id="x2" src="${SRC}"></audio>`;
    const [x1, x2] = ['x1', 'x2'].map((id) => document.getElementById(id) as any);
    let yielded = 0;
    document.addEventListener('dc:audio-exclusive', () => { yielded += 1; });
    initAudioHub();
    x1.play();
    x2.play();
    expect(x1.paused).toBe(true);
    expect(x2.paused).toBe(false);
    expect(yielded).toBe(2);
  });

  it('pauseOwn (the music or the header drawer started) silences every episode player', () => {
    const a = episodePage();
    initAudioHub();
    a.play();
    (window as any).dcAudioHub.pauseOwn();
    expect(a.paused).toBe(true);
  });
});

describe('the «ادامه‌ی شنیدن» bar', () => {
  it('offers the saved second on another page, from the cached meta, without the catalog', async () => {
    at('/insight/insight-79.html');
    record({ episode: 162, position: 504 });
    metaCache({});
    initAudioHub();
    await settle();
    const b = bar()!;
    expect(b).toBeTruthy();
    expect(b.textContent).toContain('قسمت ۱۶۲');
    expect(b.textContent).toContain(TITLE);
    expect(b.querySelector('.dcp-abar-time')!.textContent).toBe('08:24');
    expect((b.querySelector('.dcp-abar-info') as HTMLAnchorElement).getAttribute('href')).toBe('/episodes/episode-162.html');
    expect(document.body.classList.contains('dcp-has-abar')).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(played.length).toBe(0); // a listener who had paused is never started
  });

  it('one tap plays from the saved second, muted until the head lands', async () => {
    at('/notecast/');
    record({ episode: 162, position: 504, speed: 1.25 });
    metaCache({});
    initAudioHub();
    await settle();
    const P0 = HTMLMediaElement.prototype as any;
    const origPlay = P0.play;
    let mutedAtPlay: boolean | null = null;
    P0.play = function () { mutedAtPlay = this.muted; this._rs = 4; return origPlay.call(this); };
    (bar()!.querySelector('.dcp-abar-play') as HTMLButtonElement).click();
    await settle();
    P0.play = origPlay;
    const audio = played[played.length - 1] as any;
    expect(mutedAtPlay).toBe(true);
    expect(audio.currentTime).toBe(504);
    expect(audio.muted).toBe(false);
    expect(audio.playbackRate).toBe(1.25);
    expect(bar()!.classList.contains('is-playing')).toBe(true);
  });

  it('builds itself from the catalog when the record came from player.html', async () => {
    at('/');
    record({ episode: 162, position: 504 });
    fetchMock.mockImplementation((u: any) => (String(u) === '/dentcast.json?v=3'
      ? Promise.resolve({ ok: true, json: () => Promise.resolve([{ episode: '162', title: '162- ' + TITLE, duration: '22:08', audio_url: SRC, page_url: '/episodes/episode-162.html' }]) })
      : Promise.reject(new Error('no'))));
    initAudioHub();
    await settle(); await settle(); await settle();
    expect(bar()!.querySelector('.dcp-abar-ttl')!.textContent).toBe(TITLE);
    expect(JSON.parse(localStorage.getItem(META_KEY)!).d).toBe(1328);
  });

  it('stays away when dismissed, stale, too early, finished, or on that episode\'s own page', async () => {
    const cases: Array<[string, () => void]> = [
      ['dismissed', () => { const t = now(); record({ episode: 162, position: 504, t }); localStorage.setItem(DISMISS_KEY, JSON.stringify(t)); }],
      ['stale', () => record({ episode: 162, position: 504, t: now() - 8 * 24 * 3600 * 1000 })],
      ['too early', () => record({ episode: 162, position: 12 })],
      ['finished', () => record({ episode: 162, position: 1310 })],
    ];
    for (const [, setup] of cases) {
      _resetAudioHubForTests(); localStorage.clear();
      at('/insight/insight-79.html');
      setup(); metaCache({});
      initAudioHub();
      await settle();
      expect(bar()).toBeNull();
    }
    _resetAudioHubForTests(); localStorage.clear();
    episodePage();
    record({ episode: 162, position: 504 }); metaCache({});
    initAudioHub();
    await settle();
    expect(bar()).toBeNull();
  });

  it('× pauses, hides, and holds until there is new listening', async () => {
    at('/');
    record({ episode: 162, position: 504 });
    metaCache({});
    initAudioHub();
    await settle();
    (bar()!.querySelector('.dcp-abar-x') as HTMLButtonElement).click();
    expect(bar()).toBeNull();
    expect(document.body.classList.contains('dcp-has-abar')).toBe(false);
    expect(JSON.parse(localStorage.getItem(DISMISS_KEY)!)).toBe(rec().t);
    await offerResume();
    expect(bar()).toBeNull();
  });

  it('another player starting takes the bar away', async () => {
    at('/');
    record({ episode: 162, position: 504 });
    metaCache({});
    document.body.innerHTML = `<audio id="other" src="${SRC}"></audio>`;
    initAudioHub();
    await settle();
    expect(bar()).toBeTruthy();
    (document.getElementById('other') as any).play();
    expect(bar()).toBeNull();
  });
});

describe('leaving a page mid-play', () => {
  it('pagehide while playing notes it for THIS tab; the next page carries on by itself', async () => {
    const a = episodePage();
    initAudioHub();
    a._rs = 4; a._d = 1328;
    a.play();
    await settle();
    a._t = 612;
    window.dispatchEvent(new Event('pagehide'));
    const h = JSON.parse(sessionStorage.getItem(HANDOFF_KEY)!);
    expect(h).toMatchObject({ episode: 162, position: 612 });

    // the next page
    _resetAudioHubForTests();
    at('/notecast/episode-42.html');
    document.body.innerHTML = '';
    played.length = 0;
    initAudioHub();
    await settle();
    expect(sessionStorage.getItem(HANDOFF_KEY)).toBeNull(); // consumed
    expect(bar()).toBeTruthy();
    expect(played.length).toBe(1); // started without a tap
  });

  it('a browser that refuses sound without a tap gets the same bar, paused', async () => {
    at('/notecast/episode-42.html');
    record({ episode: 162, position: 612 });
    metaCache({});
    sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ episode: 162, position: 612, t: now() }));
    refusePlay = true;
    initAudioHub();
    await settle(); await settle();
    expect(bar()).toBeTruthy();
    expect(bar()!.classList.contains('is-playing')).toBe(false);
  });

  it('pagehide while PAUSED leaves no handoff — nothing is ever started for a listener who stopped', async () => {
    const a = episodePage();
    initAudioHub();
    a.play();
    await settle();
    a._t = 300;
    a.pause();
    window.dispatchEvent(new Event('pagehide'));
    expect(sessionStorage.getItem(HANDOFF_KEY)).toBeNull();
  });
});

describe('the desktop shell swaps column C', () => {
  it('an episode taken out of the page mid-play carries on in the hub\'s own player', async () => {
    at('/');
    document.body.innerHTML = `<div id="colc"><audio id="ep-audio" src="${SRC}"></audio></div>`;
    const a = document.getElementById('ep-audio') as any;
    metaCache({});
    initAudioHub();
    a._rs = 4; a._d = 1328;
    a.play();
    await settle();
    a._t = 333;
    a.dispatchEvent(new Event('timeupdate'));
    document.getElementById('colc')!.innerHTML = '';   // openContent() replaces the markup
    a.pause();                                         // …and the browser pauses the removed element
    await settle();
    expect(bar()).toBeTruthy();
    expect(bar()!.classList.contains('is-playing')).toBe(true);
    const carried = played[played.length - 1] as any;
    carried._rs = 4;
    carried.dispatchEvent(new Event('canplay'));      // data arrives → the head lands
    expect(carried.currentTime).toBe(333);
    expect(carried.muted).toBe(false);
  });

  it('a player the hub paused for another one is never mistaken for one taken off the page', async () => {
    at('/');
    // the homepage hero: an Audio that was never in the document
    const hero = new Audio(SRC) as any;
    (window as any).dcAudioPending = [[hero, { episode: 162, title: TITLE, page: '/episodes/episode-162.html', src: SRC }]];
    document.body.innerHTML = `<div id="colc"><audio id="ep-audio" src="${SRC}"></audio></div>`;
    const a = document.getElementById('ep-audio') as any;
    initAudioHub();
    hero.play();
    await settle();
    a.play();                      // the injected episode starts → the hero yields
    await settle();
    expect(hero.paused).toBe(true);
    expect(a.paused).toBe(false);
    expect(bar()).toBeNull();

    // and an in-page player paused by exclusivity, THEN removed, stays quiet too
    hero.play();                   // hero again → the episode yields
    document.getElementById('colc')!.innerHTML = '';
    await settle();
    expect(bar()).toBeNull();
    expect(hero.paused).toBe(false);
  });
});

describe('the homepage hero', () => {
  it('a hero Audio pressed before plus.js booted is drained from dcAudioPending', async () => {
    at('/');
    const hero = new Audio(SRC) as any;
    hero.play();
    (window as any).dcAudioPending = [[hero, { episode: 162, title: TITLE, page: '/episodes/episode-162.html', src: SRC }]];
    initAudioHub();
    await settle();
    hero._t = 77;
    hero.pause();
    expect(rec()).toMatchObject({ episode: 162, position: 77 });
    expect((window as any).dcAudioPending).toBeNull();
  });

  it('a hero listen is tracked toward «اپیزودها» once it plays, and a pause/resume does not restart it', async () => {
    at('/');
    const tracked: Array<[string, unknown]> = [];
    (window as any).dcpTrackListening = (id: string, el: unknown) => { tracked.push([id, el]); };
    initAudioHub();
    const hero = new Audio(SRC) as any;
    (window as any).dcAudioHub.adopt(hero, { episode: 162, title: TITLE, page: '/episodes/episode-162.html', src: SRC });
    expect(tracked).toHaveLength(0); // handed over, not yet played
    hero.play();
    await settle();
    hero.pause();
    hero.play();
    await settle();
    expect(tracked).toEqual([['episodes/episode-162', hero]]);
    delete (window as any).dcpTrackListening;
  });
});
