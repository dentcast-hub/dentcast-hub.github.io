// @vitest-environment jsdom
// Drives the REAL shipped reading tracker (/plus/js/reading.js).
//
// The bug this pins (user report, 1405/07/02 — «۲۰ از ۲۲» on پرامپتولوژیست
// after reading all 22 twice): the session flag was set BEFORE the request, and
// the request was fire-and-forget, so a completion that never landed was lost
// for good and the same tab never tried again. The commonest way not to land:
// reaching the end and tapping «قسمت بعدی» before the one-second tick, or while
// the request was in flight.
//
// Pinned: a failed send stays queued and is re-sent by the next page's flush;
// the session flag is set only on success; leaving the page at the end sends
// the completion (keepalive) instead of dropping it; and a detached root (the
// desktop shell swapped the column) is never "at its end".
import { describe, it, expect, beforeEach, vi } from 'vitest';

const calls: Array<{ action: string; id: string; keepalive: boolean }> = [];
const earned: Array<number | undefined> = []; // earned_at per call, same order as `calls`
let flames = 0;
let fail: false | number | true = false; // a number fails with that HTTP status

vi.mock('/plus/js/api.js', () => ({
  api: {
    activity: (action: string, id: string, _meta: unknown, opts: { keepalive?: boolean; earned_at?: number } = {}) => {
      calls.push({ action, id, keepalive: !!opts.keepalive });
      earned.push(opts.earned_at);
      if (fail === false) return Promise.resolve({ ok: true });
      const err = new Error('network') as Error & { status?: number };
      if (typeof fail === 'number') err.status = fail;
      return Promise.reject(err);
    },
  },
}));
vi.mock('/plus/js/util.js', () => ({
  signalStreakActivity: () => { flames += 1; },
  tehranDay: (d: Date = new Date()) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d),
}));
const tehranToday = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

let perfNow = 0;

function prose(bottom: number): HTMLElement {
  const root = document.createElement('div');
  root.textContent = 'کلمه '.repeat(50); // short → the 30s floor applies
  root.getBoundingClientRect = () => ({ bottom } as DOMRect);
  document.body.appendChild(root);
  return root;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('reading tracker outbox', () => {
  beforeEach(() => {
    vi.resetModules();
    calls.length = 0;
    earned.length = 0;
    flames = 0;
    fail = false;
    localStorage.clear();
    sessionStorage.clear();
    document.body.innerHTML = '';
    perfNow = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => perfNow);
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  });

  it('a failed send stays queued, the session flag stays unset, and the next page re-sends it', async () => {
    fail = true;
    const { initReadingTracker } = await import('/plus/js/reading.js');
    initReadingTracker({ contentId: 'dentai/promptologist/prompt4-1', proseRoot: prose(500) });
    perfNow = 31000;
    window.dispatchEvent(new Event('pagehide'));
    await flush();
    expect(calls).toEqual([{ action: 'article_completed', id: 'dentai/promptologist/prompt4-1', keepalive: true }]);
    expect(localStorage.getItem('dcp:outbox:article_completed|dentai/promptologist/prompt4-1')).toBeTruthy();
    expect(sessionStorage.getItem('dcp:read:dentai/promptologist/prompt4-1')).toBeNull();

    // Next page: the network is back.
    fail = false;
    vi.resetModules();
    const { flushPendingReads } = await import('/plus/js/reading.js');
    await flushPendingReads();
    expect(calls.at(-1)).toEqual({ action: 'article_completed', id: 'dentai/promptologist/prompt4-1', keepalive: false });
    expect(localStorage.getItem('dcp:outbox:article_completed|dentai/promptologist/prompt4-1')).toBeNull();
  });

  it('re-reading in the same tab after a lost send tries again (the flag was never set)', async () => {
    fail = true;
    const { initReadingTracker } = await import('/plus/js/reading.js');
    initReadingTracker({ contentId: 'x/a', proseRoot: prose(500) });
    perfNow = 31000;
    window.dispatchEvent(new Event('pagehide'));
    await flush();
    fail = false;
    vi.resetModules();
    const again = await import('/plus/js/reading.js');
    perfNow = 100000;
    again.initReadingTracker({ contentId: 'x/a', proseRoot: prose(500) });
    perfNow = 131000;
    window.dispatchEvent(new Event('pagehide'));
    await flush();
    expect(calls.filter((c) => c.id === 'x/a').length).toBeGreaterThanOrEqual(2);
    expect(sessionStorage.getItem('dcp:read:x/a')).toBe(tehranToday());
  });

  it('leaving before the end, or before the dwell, sends nothing', async () => {
    const { initReadingTracker } = await import('/plus/js/reading.js');
    initReadingTracker({ contentId: 'x/far', proseRoot: prose(5000) }); // end not in view
    initReadingTracker({ contentId: 'x/quick', proseRoot: prose(500) });
    perfNow = 10000; // under the 30s floor
    window.dispatchEvent(new Event('pagehide'));
    await flush();
    expect(calls).toEqual([]);
    expect(localStorage.length).toBe(0);
  });

  it('a root taken out of the document is not "at its end"', async () => {
    const { initReadingTracker } = await import('/plus/js/reading.js');
    const root = prose(0);
    root.getBoundingClientRect = () => ({ bottom: 5000 } as DOMRect);
    initReadingTracker({ contentId: 'x/swapped', proseRoot: root });
    root.remove();
    root.getBoundingClientRect = () => ({ bottom: 0 } as DOMRect); // what a detached node reports
    perfNow = 60000;
    window.dispatchEvent(new Event('pagehide'));
    await flush();
    expect(calls).toEqual([]);
  });

  // Same-page re-send (user report: two afternoon reads, and the 20:00 streak
  // reminder still said nothing was recorded — the queued completions waited
  // for a next page boot that came only after the reminder brought her back).
  it('a refused completion is re-sent on the SAME page after a backoff, without a new page', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      fail = 409; // published after the API's last index refresh
      const { sendCompletion } = await import('/plus/js/outbox.js');
      expect(await sendCompletion('article_completed', 'insight/insight-200')).toBe(false);
      expect(localStorage.getItem('dcp:outbox:article_completed|insight/insight-200')).toBeTruthy();
      fail = false;
      await vi.advanceTimersByTimeAsync(20000);
      expect(calls.length).toBe(2);
      expect(localStorage.getItem('dcp:outbox:article_completed|insight/insight-200')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('coming back to the tab flushes a queued completion at once', async () => {
    fail = true;
    const { sendCompletion } = await import('/plus/js/outbox.js');
    await sendCompletion('article_completed', 'x/back');
    fail = false;
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    // ≥ 2, not 2: module instances from earlier cases (vi.resetModules) keep
    // their document listeners in this one jsdom; a real page has one instance.
    expect(calls.filter((c) => c.id === 'x/back').length).toBeGreaterThanOrEqual(2);
    expect(localStorage.getItem('dcp:outbox:article_completed|x/back')).toBeNull();
  });

  it('a 401 is not retried on the page (signed out: it waits for a sign-in)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      fail = 401;
      const { sendCompletion } = await import('/plus/js/outbox.js');
      await sendCompletion('article_completed', 'x/anon');
      await vi.advanceTimersByTimeAsync(700000);
      expect(calls.length).toBe(1);
      expect(localStorage.getItem('dcp:outbox:article_completed|x/anon')).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  // 1405/09 — «هر روز اومدم، سه روز سپر خورده». The rest of this block pins the
  // ways an active day went uncounted, or looked counted when it was not.

  it('a queued completion carries the time it was EARNED to every re-send', async () => {
    fail = true;
    const { sendCompletion } = await import('/plus/js/outbox.js');
    const before = Date.now();
    await sendCompletion('article_completed', 'x/late');
    const at = earned[0];
    expect(at).toBeGreaterThanOrEqual(before);
    fail = false;
    vi.resetModules();
    const { flushOutbox } = await import('/plus/js/outbox.js');
    await flushOutbox();
    expect(earned.at(-1)).toBe(at); // the re-send says when, not "now"
  });

  it('flushes oldest first, one at a time', async () => {
    localStorage.setItem('dcp:outbox:article_completed|x/newer', String(Date.now() - 1000));
    localStorage.setItem('dcp:outbox:article_completed|x/older', String(Date.now() - 50000));
    const { flushOutbox } = await import('/plus/js/outbox.js');
    await flushOutbox();
    expect(calls.map((c) => c.id)).toEqual(['x/older', 'x/newer']);
  });

  it('a 404 is final: dropped from the queue, never re-sent', async () => {
    fail = 404; // an English-only page with no Persian twin
    const { sendCompletion } = await import('/plus/js/outbox.js');
    expect(await sendCompletion('article_completed', 'x/en/orphan')).toBe(false);
    expect(localStorage.getItem('dcp:outbox:article_completed|x/en/orphan')).toBeNull();
  });

  it('lights the flame only once the server has the read', async () => {
    fail = true;
    const { initReadingTracker } = await import('/plus/js/reading.js');
    initReadingTracker({ contentId: 'x/flame', proseRoot: prose(500) });
    perfNow = 31000;
    window.dispatchEvent(new Event('pagehide'));
    await flush();
    expect(flames).toBe(0);
  });

  it('a read flagged on an earlier day is sent again today', async () => {
    sessionStorage.setItem('dcp:read:x/yesterday', '2000-01-01');
    sessionStorage.setItem('dcp:read:x/today', tehranToday());
    const { initReadingTracker } = await import('/plus/js/reading.js');
    initReadingTracker({ contentId: 'x/yesterday', proseRoot: prose(500) });
    initReadingTracker({ contentId: 'x/today', proseRoot: prose(500) });
    perfNow = 31000;
    window.dispatchEvent(new Event('pagehide'));
    await flush();
    expect(calls.map((c) => c.id)).toEqual(['x/yesterday']);
    expect(flames).toBe(1);
  });
});

