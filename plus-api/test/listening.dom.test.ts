// @vitest-environment jsdom
// The listening tracker's two rules, pinned against the real shipped module:
// how much of an episode must be HEARD (a fifth, of real forward playback), and
// how soon the same episode may be reported again (a re-listen pays, but the
// client must not post the same one twice in a day).
//
// Both are numbers a future edit could move without anything failing: the
// threshold lives in config.js as a bare constant, and the repeat gate is a
// storage key whose semantics changed from "once per session" to "once per
// 20h" when re-listening started to earn (2026-08-10). Nothing on the server
// can catch either — it is handed a finished event and believes it.
import {
  describe, it, expect, beforeEach, afterEach, vi,
} from 'vitest';

const posted: Array<Record<string, unknown>> = [];
let nowMs = 0;

beforeEach(() => {
  posted.length = 0;
  nowMs = Date.UTC(2026, 7, 10, 9, 0, 0); // a fixed instant; the clock is ours to move
  vi.spyOn(Date, 'now').mockImplementation(() => nowMs);
  localStorage.clear();
  globalThis.fetch = vi.fn((url: string, init?: { body?: string }) => {
    if (String(url).endsWith('/health')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    }
    if (String(url).includes('/activity')) posted.push(JSON.parse(init?.body ?? '{}'));
    return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) });
  }) as unknown as typeof fetch;
});

afterEach(() => { vi.restoreAllMocks(); });

const { initListeningTracker } = await import('../../plus/js/listening.js');
const { LISTEN_FRACTION } = await import('../../plus/js/config.js');

/** The bits of HTMLAudioElement the tracker actually reads. */
class FakeAudio extends EventTarget {
  currentTime = 0;
  duration = 1200; // a 20-minute episode, close to the real median (21 min)
  playbackRate = 1;
}

/**
 * Play `seconds` of media, advancing the wall clock in step. One tick per
 * second is far coarser than a browser's ~4/s, which is the point: the
 * per-tick ceiling must pass on a slow tick as well as a fast one.
 */
function play(audio: FakeAudio, seconds: number): void {
  for (let i = 0; i < seconds; i += 1) {
    nowMs += 1000 * (1 / audio.playbackRate);
    audio.currentTime += 1;
    audio.dispatchEvent(new Event('timeupdate'));
  }
}

/** Drop the needle somewhere else — what the ±15s buttons and the scrubber do. */
function seekTo(audio: FakeAudio, t: number): void {
  audio.currentTime = t;
  audio.dispatchEvent(new Event('seeking'));
}

const flush = () => new Promise((r) => { setTimeout(r, 0); });

describe('listening tracker', () => {
  it('reports the listen after a FIFTH of the episode, not half', async () => {
    expect(LISTEN_FRACTION).toBe(0.2);
    const audio = new FakeAudio();
    initListeningTracker({ contentId: 'episodes/episode-160', audioEl: audio });

    play(audio, 239); // one second short of 20% of 1200s
    await flush();
    expect(posted).toHaveLength(0);

    play(audio, 2);
    await flush();
    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({
      action: 'episode_listened', content_id: 'episodes/episode-160',
    });
  });

  it('skipped span never counts, so scrubbing to the end reports nothing', async () => {
    const audio = new FakeAudio();
    initListeningTracker({ contentId: 'episodes/episode-160', audioEl: audio });

    play(audio, 30);
    seekTo(audio, 1199); // the whole episode "played" in one jump
    play(audio, 1);
    await flush();

    expect(posted).toHaveLength(0);
  });

  it('a faster playback rate reaches the same threshold in less wall time', async () => {
    const audio = new FakeAudio();
    audio.playbackRate = 2;
    initListeningTracker({ contentId: 'episodes/episode-160', audioEl: audio });

    const startedAt = nowMs;
    play(audio, 241);
    await flush();

    expect(posted).toHaveLength(1);
    // 241 media-seconds heard, but only ~120 seconds of the listener's day.
    expect(nowMs - startedAt).toBeLessThan(241 * 1000);
  });

  it('will not report the same episode twice in a day, and will the next day', async () => {
    const first = new FakeAudio();
    initListeningTracker({ contentId: 'episodes/episode-160', audioEl: first });
    play(first, 241);
    await flush();
    expect(posted).toHaveLength(1);

    // Same episode, a few hours later: a re-listen is worth something, but the
    // server prices it per week — posting it again the same day would only add
    // a row nobody is paid for.
    nowMs += 6 * 3600 * 1000;
    const again = new FakeAudio();
    expect(initListeningTracker({ contentId: 'episodes/episode-160', audioEl: again })).toBeNull();
    play(again, 400);
    await flush();
    expect(posted).toHaveLength(1);

    // Tomorrow it attaches again — this is the case a session-scoped flag got
    // wrong on a phone whose tab is never closed.
    nowMs += 20 * 3600 * 1000;
    const tomorrow = new FakeAudio();
    expect(initListeningTracker({ contentId: 'episodes/episode-160', audioEl: tomorrow })).not.toBeNull();
    play(tomorrow, 241);
    await flush();
    expect(posted).toHaveLength(2);
  });

  it('a different episode is never blocked by the last one', async () => {
    const a = new FakeAudio();
    initListeningTracker({ contentId: 'episodes/episode-160', audioEl: a });
    play(a, 241);
    await flush();

    const b = new FakeAudio();
    initListeningTracker({ contentId: 'episodes/episode-161', audioEl: b });
    play(b, 241);
    await flush();

    expect(posted.map((p) => p.content_id)).toEqual([
      'episodes/episode-160', 'episodes/episode-161',
    ]);
  });
});
