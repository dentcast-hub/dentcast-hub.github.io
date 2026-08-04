// @vitest-environment jsdom
// The base probe must fail over on a HANGING mirror, not just an unreachable
// one — that is the .org-from-Iran case that delayed the ad card.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('/plus/js/config.js', () => ({
  API_BASES: ['https://api.slow.test', 'https://api.fast.test'],
  OVERRIDE: {},
}));

beforeEach(() => { sessionStorage.clear(); vi.resetModules(); });

describe('failover deadline', () => {
  it('abandons a mirror that never answers and uses the next one', async () => {
    globalThis.fetch = vi.fn((url: any, init: any = {}) => {
      if (String(url).includes('slow')) {
        // A host that accepts the connection and then says nothing, ever.
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) } as any);
    }) as any;

    const { apiBase } = await import('/plus/js/api.js');
    const t0 = Date.now();
    const base = await apiBase();
    const ms = Date.now() - t0;

    expect(base, 'must fail over to the mirror that answers').toBe('https://api.fast.test');
    expect(ms, `failover took ${ms}ms — the deadline is 1500ms`).toBeLessThan(2500);
  }, 20000);

  it('still prefers the first mirror when it answers', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200 } as any)) as any;
    const { apiBase } = await import('/plus/js/api.js');
    expect(await apiBase()).toBe('https://api.slow.test');
  });

  // Order is a correctness rule, not a preference: each site must use its own
  // api host or the session cookie is cross-site and gets dropped. A plain race
  // would break that the moment the secondary merely answered first.
  it('keeps the first mirror even when the second answers sooner', async () => {
    globalThis.fetch = vi.fn((url: any) => new Promise((resolve) => {
      const slow = String(url).includes('slow');
      setTimeout(() => resolve({ ok: true, status: 200 } as any), slow ? 300 : 10);
    })) as any;
    const { apiBase } = await import('/plus/js/api.js');
    expect(await apiBase()).toBe('https://api.slow.test');
  });

  // ...and both are contacted at once, so failing over costs a deadline rather
  // than a second round trip.
  it('probes every mirror concurrently', async () => {
    const started: number[] = [];
    globalThis.fetch = vi.fn((url: any, init: any = {}) => {
      started.push(Date.now());
      if (String(url).includes('slow')) {
        return new Promise((_r, reject) => init.signal?.addEventListener('abort', () => reject(new Error('x'))));
      }
      return new Promise((resolve) => setTimeout(() => resolve({ ok: true, status: 200 } as any), 200));
    }) as any;
    const { apiBase } = await import('/plus/js/api.js');
    await apiBase();
    expect(started).toHaveLength(2);
    expect(started[1] - started[0], 'the second probe must not wait for the first').toBeLessThan(50);
  }, 20000);
});
