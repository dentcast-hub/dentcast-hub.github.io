// @vitest-environment jsdom
// Drives the REAL shipped late-start (/plus/js/late-reading.js) that plus.js's
// setupWorkbench arms when /me did not confirm a reader at page load.
//
// The bug this pins (user report: two articles read in the afternoon, the 20:00
// streak reminder still said no activity): the reading tracker was started from
// ONE /me answer at load. «Could not ask» (slow mobile network, mirror failover,
// the API-down memory) left the page looking signed in while the read was never
// counted. Pinned: a page that could not ask keeps asking and starts the tracker
// once a profile arrives; a later `dcp:me` starts it too; a definite 401 is not
// polled; a column the desktop shell replaced never starts.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

let status: 'user' | 'anon' | 'error' | 'unknown' = 'error';
let next: object | null = null;
let asked = 0;

vi.mock('/plus/js/api.js', () => ({
  meStatus: () => status,
  currentUser: () => {
    asked += 1;
    const u = next;
    if (u) status = 'user';
    try { document.dispatchEvent(new CustomEvent('dcp:me', { detail: u })); } catch (_) { /* */ }
    return Promise.resolve(u);
  },
}));

const flush = () => Promise.resolve().then(() => Promise.resolve());

describe('late start of the reading tracker', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    status = 'error';
    next = null;
    asked = 0;
  });
  afterEach(() => { vi.useRealTimers(); });

  it('«could not ask» at load: keeps asking, and starts the tracker once — when a profile arrives', async () => {
    const { armLateReading } = await import('/plus/js/late-reading.js');
    const start = vi.fn();
    armLateReading(start);
    await vi.advanceTimersByTimeAsync(5000);
    expect(asked).toBe(1);
    expect(start).not.toHaveBeenCalled();
    next = { id: 'u1' };
    await vi.advanceTimersByTimeAsync(15000);
    await flush();
    expect(start).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(300000);
    expect(start).toHaveBeenCalledTimes(1);
    expect(asked).toBe(2); // stopped asking once it had its answer
  });

  it('coming back to the tab asks at once', async () => {
    const { armLateReading } = await import('/plus/js/late-reading.js');
    const start = vi.fn();
    armLateReading(start);
    next = { id: 'u1' };
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await flush();
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('a definite 401 is not polled, but a sign-in on the page (dcp:me) starts it', async () => {
    status = 'anon';
    const { armLateReading } = await import('/plus/js/late-reading.js');
    const start = vi.fn();
    armLateReading(start);
    await vi.advanceTimersByTimeAsync(300000);
    expect(asked).toBe(0);
    document.dispatchEvent(new CustomEvent('dcp:me', { detail: { id: 'u1' } }));
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('a column the desktop shell replaced never starts', async () => {
    const { armLateReading } = await import('/plus/js/late-reading.js');
    const start = vi.fn();
    armLateReading(start, () => false);
    next = { id: 'u1' };
    await vi.advanceTimersByTimeAsync(300000);
    document.dispatchEvent(new CustomEvent('dcp:me', { detail: { id: 'u1' } }));
    expect(start).not.toHaveBeenCalled();
  });
});
