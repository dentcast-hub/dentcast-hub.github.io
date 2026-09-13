// @vitest-environment jsdom
// Drives the REAL shipped clip control (/plus/js/clips.js) under a player.
//
// The decisions pinned here (founder, 2026-09-13; mockup
// .dentcast/audio-clips-mockup.html):
//   · the button is drawn for EVERYBODY and the gate is on the tap — anonymous
//     is sent to login, free gets the premium card, premium starts recording;
//   · «پایان» is refused until the clip can carry a sentence (1s);
//   · the sheet after «پایان» carries the three ways to say where a clip ends
//     (handles/nudges, length chips, the recorded stop) and saves exactly what
//     it shows;
//   · the reader's clips are drawn on the transport's own bar, and the shared
//     player re-targets the one control on an episode switch;
//   · ?dcclip= parks the player on the clip and never autoplays.
import { describe, it, expect, beforeEach, vi } from 'vitest';

globalThis.fetch = vi.fn(() => Promise.reject(new Error('no network'))) as any;

let user: any = null;
let clipsByContent: Record<string, any[]> = {};
const created: any[] = [];
const listCalls: string[] = [];
let getClipResponse: any = null;
let loginOpened = 0;
let loginResult: any = null;
const ctaCalls: string[] = [];

vi.mock('/plus/js/api.js', () => ({
  api: {
    listClips: (contentId: string) => { listCalls.push(contentId); return Promise.resolve({ clips: clipsByContent[contentId] || [] }); },
    createClip: (c: any) => { created.push(c); return Promise.resolve({ clip: { id: 'clip-new', created_at: '2026-09-13T10:00:00Z', ...c } }); },
    updateClip: (id: string, patch: any) => Promise.resolve({ clip: { id, ...patch } }),
    getClip: (id: string) => (getClipResponse ? Promise.resolve({ clip: getClipResponse }) : Promise.reject(new Error('404'))),
  },
  currentUser: () => Promise.resolve(user),
}));
vi.mock('/plus/js/login-modal.js', () => ({
  openLoginModal: () => { loginOpened += 1; if (loginResult && loginResult.user) user = loginResult.user; return Promise.resolve(loginResult); },
}));
vi.mock('/plus/js/premium-cta.js', () => ({
  premiumCta: (from: string) => { ctaCalls.push(from); const a = document.createElement('a'); a.className = 'dcp-cta'; a.textContent = 'خرید اشتراک پریمیوم'; return a; },
}));

const { mountClipControl, landOnClip } = await import('../../plus/js/clips.js');
const { episodeNumber, fmtClock, fmtLength, parseClock } = await import('../../plus/js/clip-audio.js');

const EP = 'episodes/episode-101';
const settle = () => new Promise((r) => setTimeout(r, 0));

/** A player card the way the episode page draws it, with a controllable <audio>. */
function player() {
  document.body.innerHTML = `
    <div class="ep-box"><span class="ep-badge">اپیزود ۱۰۱</span>
      <div class="ep-player-wrap">
        <audio id="ep-audio" preload="none"></audio>
        <input id="ep-seek" type="range" min="0" max="100" value="0">
        <div class="ep-time-row"><span>00:00</span><span>21:46</span></div>
      </div>
    </div>`;
  const audio = document.getElementById('ep-audio') as HTMLAudioElement;
  const props = { currentTime: 0, duration: 1306, readyState: 4, paused: true, muted: false, preload: 'none', networkState: 1 };
  for (const [k, v] of Object.entries(props)) Object.defineProperty(audio, k, { value: v, writable: true, configurable: true });
  audio.play = () => { (audio as any).paused = false; return Promise.resolve(); };
  audio.pause = () => { (audio as any).paused = true; audio.dispatchEvent(new Event('pause')); };
  audio.load = () => {};
  return { audio, host: document.querySelector('.ep-player-wrap') as HTMLElement, seek: document.getElementById('ep-seek') as HTMLElement };
}

const btn = () => document.querySelector('.dcp-clip-btn') as HTMLButtonElement;
const sheet = () => document.querySelector('.dcp-sheet-card') as HTMLElement;

beforeEach(() => {
  user = null;
  clipsByContent = {};
  created.length = 0;
  listCalls.length = 0;
  getClipResponse = null;
  loginOpened = 0;
  loginResult = null;
  ctaCalls.length = 0;
  history.replaceState(null, '', '/episodes/episode-101.html');
  document.querySelectorAll('.dcp-sheet-overlay, .dcp-cl-toast').forEach((n) => n.remove());
});

describe('the button and its gate', () => {
  it('is drawn for an anonymous listener, and the tap opens login rather than recording', async () => {
    const { audio, host, seek } = player();
    mountClipControl({ audioEl: audio, contentId: EP, host, seekEl: seek });
    await settle();
    expect(btn().textContent).toContain('شروع قطعه');
    expect(document.querySelector('.dcp-clip-hint')!.textContent).toBe('هر جای پخش که رسیدی بزن');
    expect(listCalls, 'no clips are asked for without an account').toEqual([]);
    btn().click();
    await settle();
    expect(loginOpened).toBe(1);
    expect(btn().classList.contains('is-rec')).toBe(false);
  });

  it('a free reader gets the premium card on the tap — no recording, the CTA tagged gate-clip', async () => {
    user = { id: 'u1', tier: 'free' };
    const { audio, host, seek } = player();
    mountClipControl({ audioEl: audio, contentId: EP, host, seekEl: seek });
    await settle();
    btn().click();
    await settle();
    expect(sheet()).not.toBeNull();
    expect(sheet().textContent).toContain('قطعه‌ی صوتی ویژه‌ی پریمیوم است');
    expect(ctaCalls).toEqual(['gate-clip']);
    expect(btn().classList.contains('is-rec')).toBe(false);
  });

  it('after logging in from the tap, a premium reader goes straight into recording', async () => {
    const { audio, host, seek } = player();
    mountClipControl({ audioEl: audio, contentId: EP, host, seekEl: seek });
    await settle();
    loginResult = { user: { id: 'u1', tier: 'premium' } }; // the mock hands this to currentUser() once login resolves
    btn().click();
    await settle(); await settle();
    expect(loginOpened).toBe(1);
    expect(btn().classList.contains('is-rec')).toBe(true);
  });
});

describe('recording a span', () => {
  beforeEach(() => { user = { id: 'u1', tier: 'premium' }; });

  it('start → wait for a second → end: the sheet opens on exactly the recorded span and saves it', async () => {
    const { audio, host, seek } = player();
    (audio as any).currentTime = 447.2;
    mountClipControl({ audioEl: audio, contentId: EP, host, seekEl: seek });
    await settle();
    btn().click();
    await settle();
    expect(btn().classList.contains('is-rec')).toBe(true);
    expect(btn().textContent).toContain('پایان قطعه');
    expect(btn().disabled, 'the end press waits for a second of audio').toBe(true);
    expect(document.querySelector('.dcp-clip-live')!.textContent).toContain('07:27');
    expect(document.querySelector('.dcp-clip-strip .dcp-clip-zone.is-live'), 'the live zone is on the bar').not.toBeNull();

    (audio as any).currentTime = 483.4;
    await new Promise((r) => setTimeout(r, 300)); // one ticker beat
    expect(btn().disabled).toBe(false);
    btn().click();
    await settle();
    expect(btn().classList.contains('is-rec')).toBe(false);
    const card = sheet();
    expect(card).not.toBeNull();
    expect(card.querySelector('.dcp-clip-sub')!.textContent).toContain('اپیزود ۱۰۱');
    expect(card.querySelector('.dcp-clip-sub')!.textContent).toContain('07:27 تا 08:03');
    expect(card.querySelector('.dcp-clip-sub')!.textContent).toContain('۳۶ ثانیه');

    (card.querySelector('textarea') as HTMLTextAreaElement).value = ' ترتیب EDTA و سایلن ';
    ([...card.querySelectorAll('.dcp-hlib-chip')].find((b) => b.textContent === 'نکته بالینی') as HTMLElement).click();
    (card.querySelector('.dcp-btn-primary') as HTMLElement).click();
    await settle(); await settle();
    expect(created).toEqual([{ content_id: EP, start_s: 447, end_s: 483.5, note: 'ترتیب EDTA و سایلن', label: 'clinical_pearl' }]);
    expect(document.querySelector('.dcp-sheet-overlay.is-open')).toBeNull();
    expect(document.querySelector('.dcp-clip-hint')!.textContent).toBe('۱ قطعه روی این اپیزود داری');
    expect(document.querySelectorAll('.dcp-clip-strip .dcp-clip-zone')).toHaveLength(1);
  });

  it('«شروع −۱۵» moves the start back, never below zero', async () => {
    const { audio, host, seek } = player();
    (audio as any).currentTime = 10;
    mountClipControl({ audioEl: audio, contentId: EP, host, seekEl: seek });
    await settle();
    btn().click();
    await settle();
    (document.querySelector('.dcp-clip-row .dcp-clip-nudge') as HTMLElement).click();
    expect(document.querySelector('.dcp-clip-live')!.textContent).toContain('00:00');
  });

  it('the length chips and the nudges rewrite the end inside the sheet, and the chip lights on the exact length', async () => {
    const { audio, host, seek } = player();
    (audio as any).currentTime = 100;
    mountClipControl({ audioEl: audio, contentId: EP, host, seekEl: seek });
    await settle();
    btn().click(); await settle();
    (audio as any).currentTime = 140;
    await new Promise((r) => setTimeout(r, 300));
    btn().click(); await settle();
    const card = sheet();
    const times = () => [...card.querySelectorAll('.dcp-clip-t')].map((t) => t.textContent);
    expect(times()).toEqual(['01:40', '02:20']);

    (card.querySelector('.dcp-clip-chip[data-len="30"]') as HTMLElement).click();
    expect(times()).toEqual(['01:40', '02:10']);
    expect(card.querySelector('.dcp-clip-chip[data-len="30"]')!.classList.contains('is-on')).toBe(true);

    const nudge = (label: string) => ([...card.querySelectorAll('.dcp-clip-nudge')].find((b) => b.getAttribute('aria-label') === label) as HTMLElement).click();
    nudge('شروع +۱ ثانیه');
    nudge('پایان −۱ ثانیه');
    expect(times()).toEqual(['01:41', '02:09']);
    expect(card.querySelector('.dcp-clip-chip.is-on')).toBeNull();

    (card.querySelector('.dcp-btn-primary') as HTMLElement).click();
    await settle(); await settle();
    expect(created[0]).toMatchObject({ start_s: 101, end_s: 129 });
  });

  it('a seek back before the start cancels the recording with a word', async () => {
    const { audio, host, seek } = player();
    (audio as any).currentTime = 300;
    mountClipControl({ audioEl: audio, contentId: EP, host, seekEl: seek });
    await settle();
    btn().click(); await settle();
    (audio as any).currentTime = 200;
    audio.dispatchEvent(new Event('seeking'));
    expect(btn().classList.contains('is-rec')).toBe(false);
    expect(document.querySelector('.dcp-cl-toast')!.textContent).toContain('ضبط قطعه لغو شد');
  });
});

describe('the reader\'s clips on the bar', () => {
  it('draws every clip as a zone under the range, sized by the episode length', async () => {
    user = { id: 'u1', tier: 'premium' };
    clipsByContent[EP] = [
      { id: 'c1', content_id: EP, start_s: 653, end_s: 653 + 65.3, note: 'x', label: null },
      { id: 'c2', content_id: EP, start_s: 0, end_s: 13.06, note: null, label: null },
    ];
    const { audio, host, seek } = player();
    mountClipControl({ audioEl: audio, contentId: EP, host, seekEl: seek });
    await settle(); await settle();
    const zones = document.querySelectorAll('.dcp-clip-strip .dcp-clip-zone');
    expect(zones).toHaveLength(2);
    expect((zones[0] as HTMLElement).style.left).toBe('50%');
    expect((zones[0] as HTMLElement).style.width).toBe('5%');
    expect((zones[1] as HTMLElement).style.left).toBe('0%');
    expect(document.querySelector('.dcp-clip-strip')!.previousElementSibling!.id, 'the strip sits right under the range').toBe('ep-seek');
    expect(document.querySelector('.dcp-clip-hint')!.textContent).toBe('۲ قطعه روی این اپیزود داری');
  });

  it('the shared player re-targets the one control on an episode switch, cancelling a recording in flight', async () => {
    user = { id: 'u1', tier: 'premium' };
    const { audio, host, seek } = player();
    mountClipControl({ audioEl: audio, contentId: EP, host, seekEl: seek });
    await settle();
    btn().click(); await settle();
    expect(btn().classList.contains('is-rec')).toBe(true);
    mountClipControl({ audioEl: audio, contentId: 'episodes/episode-102', host, seekEl: seek });
    await settle();
    expect(document.querySelectorAll('.dcp-clip-row'), 'one control, not two').toHaveLength(1);
    expect(btn().classList.contains('is-rec')).toBe(false);
    expect(listCalls).toEqual([EP, 'episodes/episode-102']);
  });
});

describe('?dcclip= landing', () => {
  it('parks the player on the clip, draws the strip with a play button, and never autoplays', async () => {
    user = { id: 'u1', tier: 'free' }; // a lapsed subscriber still lands on their own clip
    getClipResponse = { id: 'clip-9', content_id: EP, start_s: 447, end_s: 483, note: 'یادداشتم' };
    const { audio, host } = player();
    let played = 0;
    audio.play = () => { played += 1; return Promise.resolve(); };
    const ok = await landOnClip({ audioEl: audio, contentId: EP, host, clipId: 'clip-9' });
    expect(ok).toBe(true);
    const land = document.querySelector('.dcp-clip-land') as HTMLElement;
    expect(land).not.toBeNull();
    expect(land.textContent).toContain('07:27 → 08:03');
    expect(land.textContent).toContain('یادداشتم');
    expect(host.previousElementSibling).toBe(land);
    expect((audio as any).currentTime).toBe(447);
    expect(played).toBe(0);
    (land.querySelector('.dcp-clip-land-go') as HTMLElement).click();
    expect(played).toBe(1);
  });

  it('ignores a clip that belongs to another episode, and a signed-out visitor', async () => {
    user = { id: 'u1', tier: 'premium' };
    getClipResponse = { id: 'clip-9', content_id: 'episodes/episode-7', start_s: 1, end_s: 5 };
    const { audio, host } = player();
    expect(await landOnClip({ audioEl: audio, contentId: EP, host, clipId: 'clip-9' })).toBe(false);
    expect(document.querySelector('.dcp-clip-land')).toBeNull();
    user = null;
    getClipResponse = { id: 'clip-9', content_id: EP, start_s: 1, end_s: 5 };
    expect(await landOnClip({ audioEl: audio, contentId: EP, host, clipId: 'clip-9' })).toBe(false);
  });
});

describe('clip-audio helpers', () => {
  it('reads an episode number from a content id, dashes included (player.html epSlug)', () => {
    expect(episodeNumber('episodes/episode-101')).toBe(101);
    expect(episodeNumber('episodes/episode-106-1')).toBe(106.1);
    expect(episodeNumber('insight/insight-1')).toBeNull();
    expect(episodeNumber('')).toBeNull();
  });
  it('formats clocks by the second a time is IN, and lengths in words', () => {
    expect(fmtClock(447.9)).toBe('07:27');
    expect(fmtClock(3725)).toBe('1:02:05');
    expect(fmtLength(36.9)).toBe('۳۶ ثانیه');
    expect(fmtLength(111)).toBe('۱ دقیقه و ۵۱ ثانیه');
    expect(fmtLength(120)).toBe('۲ دقیقه');
    expect(parseClock('21:46')).toBe(1306);
    expect(parseClock('1:02:03')).toBe(3723);
    expect(parseClock('nope')).toBeNull();
  });
});
