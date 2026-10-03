// @vitest-environment jsdom
// A dead API must cost a reader ONE wait per tab, not one per page — and the
// founder's static switch must cost none at all. The «could not ask» state
// every surface already draws (meStatus 'error') is reached either way; what
// these cases pin is how long it takes and how many requests it spends.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const cfg = { static: false };
vi.mock('/plus/js/config.js', () => ({
  API_BASES: ['https://api.one.test', 'https://api.two.test'],
  OVERRIDE: {},
  staticMode: () => cfg.static,
}));

const ok = (body: unknown = { ok: true }) => ({ ok: true, status: 200, json: async () => body } as any);
const status = (n: number) => ({ ok: false, status: n, json: async () => ({ error: 'x' }) } as any);

beforeEach(() => { sessionStorage.clear(); vi.resetModules(); cfg.static = false; });

describe('the API seen down is remembered for the tab', () => {
  it('both mirrors silent: the probe is paid once, then requests answer at once without the network', async () => {
    globalThis.fetch = vi.fn(async () => { throw new TypeError('network'); }) as any;
    const { api, currentUser, meStatus } = await import('/plus/js/api.js');
    await expect(api.me()).rejects.toBeTruthy();
    expect(sessionStorage.getItem('dcp:api-down')).toBeTruthy();

    // «the next page»: a fresh module, the same tab
    vi.resetModules();
    const calls = (globalThis.fetch as any).mock.calls.length;
    const next = await import('/plus/js/api.js');
    const t0 = Date.now();
    expect(await next.currentUser()).toBeNull();
    expect(next.meStatus()).toBe('error');
    expect(Date.now() - t0).toBeLessThan(200);
    expect((globalThis.fetch as any).mock.calls.length, 'no request may go out').toBe(calls);
    void currentUser; void meStatus;
  });

  it('the first page pays only the probe: /me is not then sent to a silent mirror', async () => {
    globalThis.fetch = vi.fn((url: any, init: any = {}) => new Promise((_r, reject) => {
      init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    })) as any;
    const { currentUser, meStatus } = await import('/plus/js/api.js');
    const t0 = Date.now();
    expect(await currentUser()).toBeNull();
    const ms = Date.now() - t0;
    expect(meStatus()).toBe('error');
    expect(ms, `took ${ms}ms — the probe deadline is 1500ms`).toBeLessThan(2500);
    const paths = (globalThis.fetch as any).mock.calls.map((c: any[]) => String(c[0]));
    expect(paths.every((u: string) => u.endsWith('/health'))).toBe(true);
  }, 10000);

  it('a Cloudflare origin-down answer (522) is remembered too', async () => {
    globalThis.fetch = vi.fn(async (url: any) => (String(url).endsWith('/health') ? ok() : status(522))) as any;
    const { api } = await import('/plus/js/api.js');
    await expect(api.profileStats()).rejects.toMatchObject({ status: 522 });
    expect(sessionStorage.getItem('dcp:api-down')).toBeTruthy();
  });

  it('an ordinary error from our own API is an answer, not an outage', async () => {
    globalThis.fetch = vi.fn(async (url: any) => (String(url).endsWith('/health') ? ok() : status(503))) as any;
    const { api } = await import('/plus/js/api.js');
    await expect(api.profileStats()).rejects.toMatchObject({ status: 503 });
    expect(sessionStorage.getItem('dcp:api-down')).toBeNull();
  });

  it('the memory is short: once it is old the next page asks again', async () => {
    sessionStorage.setItem('dcp:api-down', String(Date.now() - 10 * 60 * 1000));
    globalThis.fetch = vi.fn(async () => ok({ id: 'u1', tier: 'free' })) as any;
    const { currentUser, meStatus } = await import('/plus/js/api.js');
    expect(await currentUser()).toMatchObject({ id: 'u1' });
    expect(meStatus()).toBe('user');
    expect(sessionStorage.getItem('dcp:api-down'), 'a success clears it').toBeNull();
  });

  it('a request the reader started by hand still goes out', async () => {
    sessionStorage.setItem('dcp:api-down', String(Date.now()));
    globalThis.fetch = vi.fn(async () => ok({ ok: true, ttl_seconds: 300 })) as any;
    const { api } = await import('/plus/js/api.js');
    await api.requestOtp('09120000001');
    expect((globalThis.fetch as any).mock.calls.some((c: any[]) => String(c[0]).includes('/auth/otp/request'))).toBe(true);
  });
});

describe('the static switch', () => {
  it('sends nothing at all and lands on «could not ask» at once', async () => {
    cfg.static = true;
    globalThis.fetch = vi.fn(async () => ok()) as any;
    const { api, currentUser, meStatus, apiDown } = await import('/plus/js/api.js');
    expect(apiDown()).toBe(true);
    expect(await currentUser()).toBeNull();
    expect(meStatus()).toBe('error');
    await expect(api.requestOtp('09120000001')).rejects.toMatchObject({ status: 0 });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('off (the default) changes nothing on a healthy API', async () => {
    globalThis.fetch = vi.fn(async () => ok({ id: 'u1', tier: 'premium' })) as any;
    const { currentUser, meStatus, apiDown } = await import('/plus/js/api.js');
    expect(apiDown()).toBe(false);
    expect(await currentUser()).toMatchObject({ tier: 'premium' });
    expect(meStatus()).toBe('user');
    expect(sessionStorage.getItem('dcp:api-down')).toBeNull();
  });
});
