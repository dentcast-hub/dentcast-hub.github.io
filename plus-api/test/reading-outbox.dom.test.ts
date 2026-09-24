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
let fail = false;

vi.mock('/plus/js/api.js', () => ({
  api: {
    activity: (action: string, id: string, _meta: unknown, opts: { keepalive?: boolean } = {}) => {
      calls.push({ action, id, keepalive: !!opts.keepalive });
      return fail ? Promise.reject(new Error('network')) : Promise.resolve({ ok: true });
    },
  },
}));
vi.mock('/plus/js/util.js', () => ({ signalStreakActivity: () => {} }));

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
    expect(localStorage.getItem('dcp:read:pending:dentai/promptologist/prompt4-1')).toBeTruthy();
    expect(sessionStorage.getItem('dcp:read:dentai/promptologist/prompt4-1')).toBeNull();

    // Next page: the network is back.
    fail = false;
    vi.resetModules();
    const { flushPendingReads } = await import('/plus/js/reading.js');
    await flushPendingReads();
    expect(calls.at(-1)).toEqual({ action: 'article_completed', id: 'dentai/promptologist/prompt4-1', keepalive: false });
    expect(localStorage.getItem('dcp:read:pending:dentai/promptologist/prompt4-1')).toBeNull();
    expect(sessionStorage.getItem('dcp:read:dentai/promptologist/prompt4-1')).toBe('1');
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
    expect(sessionStorage.getItem('dcp:read:x/a')).toBe('1');
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
});
