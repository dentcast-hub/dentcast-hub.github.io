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
});
