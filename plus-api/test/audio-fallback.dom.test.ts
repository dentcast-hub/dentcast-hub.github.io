// @vitest-environment jsdom
// Drives the REAL shipped module (/plus/js/audio-fallback.js).
//
// An episode page plays its file from Arvan; during a cut a reader abroad
// pressed play and the player sat on 00:00 with nothing said, the Acast
// player living on /episodes.html alone. What is pinned: the «پخش شروع نشد؟»
// door appears only after a FAILURE (an error, or nothing started within
// PATIENCE_MS), never on a file that plays, never for the one episode served
// from Acast itself, and it leaves as soon as playback starts.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ARVAN = 'https://episodes.s3.ir-thr-at1.arvanstorage.ir/dentcast162%20.mp3';

function page(src = ARVAN) {
  document.body.innerHTML = `
    <div class="ep-section">
      <div class="ep-player-wrap"><audio id="ep-audio" src="${src}" preload="none"></audio></div>
    </div>`;
  return document.getElementById('ep-audio') as HTMLAudioElement;
}
// jsdom implements none of playback: drive the state the module reads.
function setState(a: HTMLAudioElement, { paused, readyState, error }: { paused?: boolean; readyState?: number; error?: any }) {
  if (paused !== undefined) Object.defineProperty(a, 'paused', { configurable: true, get: () => paused });
  if (readyState !== undefined) Object.defineProperty(a, 'readyState', { configurable: true, get: () => readyState });
  if (error !== undefined) Object.defineProperty(a, 'error', { configurable: true, get: () => error });
}
const note = () => document.querySelector('.dc-audio-alt') as HTMLElement | null;
const visible = () => !!note() && !note()!.hidden;

let mod: typeof import('/plus/js/audio-fallback.js');
beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  mod = await import('/plus/js/audio-fallback.js');
});
afterEach(() => { vi.useRealTimers(); });

describe('the Acast door under an episode player', () => {
  it('a file that plays: nothing is ever drawn', () => {
    const a = page(); mod.initAudioFallback();
    setState(a, { paused: false, readyState: 0 });
    a.dispatchEvent(new Event('play'));
    setState(a, { readyState: 4 });
    a.dispatchEvent(new Event('playing'));
    vi.advanceTimersByTime(mod.PATIENCE_MS + 1000);
    expect(visible()).toBe(false);
  });

  it('nothing started within the patience: the door appears, linking to the show on Acast', () => {
    const a = page(); mod.initAudioFallback();
    setState(a, { paused: false, readyState: 0 });
    a.dispatchEvent(new Event('play'));
    vi.advanceTimersByTime(mod.PATIENCE_MS - 100);
    expect(visible(), 'not before the patience runs out').toBe(false);
    vi.advanceTimersByTime(200);
    expect(visible()).toBe(true);
    const link = note()!.querySelector('a')!;
    expect(link.getAttribute('href')).toBe(mod.ACAST_SHOW_URL);
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(note()!.previousElementSibling!.classList.contains('ep-player-wrap'), 'right under the player').toBe(true);
  });

  it('an error from the element: at once, and it leaves when playback starts', () => {
    const a = page(); mod.initAudioFallback();
    setState(a, { paused: false, readyState: 0 });
    a.dispatchEvent(new Event('play'));
    a.dispatchEvent(new Event('error'));
    expect(visible()).toBe(true);
    a.dispatchEvent(new Event('playing'));
    expect(visible()).toBe(false);
  });

  it('a reader who paused before the patience ran out is told nothing', () => {
    const a = page(); mod.initAudioFallback();
    setState(a, { paused: false, readyState: 0 });
    a.dispatchEvent(new Event('play'));
    setState(a, { paused: true });
    a.dispatchEvent(new Event('pause'));
    vi.advanceTimersByTime(mod.PATIENCE_MS + 1000);
    expect(visible()).toBe(false);
  });

  it('the episode already served from Acast gets no door', () => {
    const a = page('https://sphinx.acast.com/p/open/s/624b5545ecc0e600134ea0df/e/x/media.mp3');
    mod.initAudioFallback();
    setState(a, { paused: false, readyState: 0 });
    a.dispatchEvent(new Event('play'));
    a.dispatchEvent(new Event('error'));
    vi.advanceTimersByTime(mod.PATIENCE_MS + 1000);
    expect(note()).toBeNull();
  });

  it('one door per player, however often it fails', () => {
    const a = page(); mod.initAudioFallback();
    setState(a, { paused: false, readyState: 0 });
    for (let i = 0; i < 3; i++) { a.dispatchEvent(new Event('play')); a.dispatchEvent(new Event('error')); }
    expect(document.querySelectorAll('.dc-audio-alt').length).toBe(1);
  });

  it('an episode injected after boot (desktop shell) is caught on its first press', () => {
    document.body.innerHTML = '';
    mod.initAudioFallback();
    const a = page();
    setState(a, { paused: false, readyState: 0 });
    a.dispatchEvent(new Event('play'));
    vi.advanceTimersByTime(mod.PATIENCE_MS + 100);
    expect(visible()).toBe(true);
  });
});
