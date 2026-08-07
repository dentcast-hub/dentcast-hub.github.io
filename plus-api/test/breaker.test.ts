import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCircuitBreaker } from '../src/providers/outbound.js';

/**
 * THE INCIDENT (2026-08-07). The founder broadcast a two-line announcement to
 * every reader. The send timeout is per USER, and api.telegram.org has been
 * unreachable from this pod since 2026-07-27 — so the fan-out spent a full
 * timeout per reader on a route that was not coming back. It ran past the
 * gateway timeout (the founder got a 504 that said nothing about whether the
 * announcement had gone out) and left the whole API degraded for minutes:
 * /health went from 1.5ms to 2-6s while it ground through.
 *
 * A dead channel has to fail FAST. But it must also come back on its own, since
 * nobody is watching for the route to return.
 */
describe('circuit breaker', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.spyOn(console, 'warn').mockImplementation(() => {}); vi.spyOn(console, 'log').mockImplementation(() => {}); });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  const make = () => createCircuitBreaker('test', { threshold: 3, cooldownMs: 60_000 });

  it('lets everything through until the failures pile up', () => {
    const b = make();
    expect(b.allow()).toBe(true);
    b.failed('timeout');
    expect(b.allow()).toBe(true);
    b.failed('timeout');
    expect(b.allow()).toBe(true); // 2 < threshold
    expect(b.status().open).toBe(false);
  });

  it('opens on the threshold and then costs nothing per user', () => {
    const b = make();
    b.failed('timeout'); b.failed('timeout'); b.failed('timeout');

    expect(b.status().open).toBe(true);
    expect(b.status().consecutive_failures).toBe(3);
    // The point of the whole thing: a fan-out over many readers asks and is
    // refused instantly, instead of paying the timeout each time.
    for (let i = 0; i < 500; i++) expect(b.allow()).toBe(false);
  });

  it('says so out loud exactly once when it opens', () => {
    const warn = vi.mocked(console.warn);
    const b = make();
    b.failed('timeout after 10000ms');
    b.failed('timeout after 10000ms');
    b.failed('timeout after 10000ms');
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0][0])).toContain('[breaker:test] OPEN');
    // Further failures while open must not re-shout — that is the log spam the
    // per-user warnings were already causing.
    b.failed('timeout after 10000ms');
    expect(warn).toHaveBeenCalledOnce();
  });

  it('tries ONE request after the cooldown, not a flood', () => {
    const b = make();
    b.failed('x'); b.failed('x'); b.failed('x');
    expect(b.allow()).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(b.allow()).toBe(true);   // the trial
    expect(b.allow()).toBe(false);  // everything behind it waits another cooldown
    expect(b.allow()).toBe(false);
  });

  it('closes and resumes when the route answers again — no deploy needed', () => {
    const b = make();
    b.failed('x'); b.failed('x'); b.failed('x');
    vi.advanceTimersByTime(60_001);
    expect(b.allow()).toBe(true);

    b.succeeded();

    expect(b.status().open).toBe(false);
    expect(b.status().consecutive_failures).toBe(0);
    expect(b.allow()).toBe(true);
    expect(b.allow()).toBe(true);
  });

  it('a success resets the streak, so scattered failures never open it', () => {
    const b = make();
    b.failed('x'); b.failed('x');
    b.succeeded();
    b.failed('x'); b.failed('x');
    expect(b.status().open).toBe(false); // 2 in a row, not 4 in total
  });

  it('reports how long it will stay open', () => {
    const b = make();
    b.failed('x'); b.failed('x'); b.failed('x');
    const s = b.status();
    expect(s.reopen_in_ms).toBeGreaterThan(0);
    expect(s.reopen_in_ms).toBeLessThanOrEqual(60_000);
    vi.advanceTimersByTime(60_001);
    expect(b.status().reopen_in_ms).toBeNull();
  });
});
