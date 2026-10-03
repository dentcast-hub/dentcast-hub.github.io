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

  // The normal-mode guarantee. On a slow phone network a cold handshake can
  // outlast the 1.5s probe against an API that is alive; a silent probe alone
  // must change nothing about how the reader is recognised.
  it('a slow but living API: probes time out, /me still answers, nothing is remembered', async () => {
    globalThis.fetch = vi.fn((url: any, init: any = {}) => {
      if (String(url).endsWith('/health')) {
        return new Promise((_r, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
      }
      return Promise.resolve(ok({ id: 'u1', tier: 'premium' }));
    }) as any;
    const { currentUser, meStatus } = await import('/plus/js/api.js');
    expect(await currentUser()).toMatchObject({ tier: 'premium' });
    expect(meStatus()).toBe('user');
    expect(sessionStorage.getItem('dcp:api-down')).toBeNull();
  }, 10000);

  it('two strikes: a silent probe AND a /me that never answers write the memory', async () => {
    globalThis.fetch = vi.fn((url: any, init: any = {}) => new Promise((_r, reject) => {
      // what AbortSignal.timeout() raises when OUR deadline runs out
      init.signal?.addEventListener('abort', () => { const e = new Error('timed out'); (e as any).name = 'TimeoutError'; reject(e); });
    })) as any;
    const { currentUser, meStatus } = await import('/plus/js/api.js');
    expect(await currentUser()).toBeNull();
    expect(meStatus()).toBe('error');
    expect(sessionStorage.getItem('dcp:api-down')).toBeTruthy();
  }, 25000);

  // dentcast.org reaches the API across an international hop; a reader who
  // taps a link before a slow /me returns cancels it. That is not an outage.
  it('a request cancelled by the page (AbortError) is not a strike', async () => {
    globalThis.fetch = vi.fn((url: any, init: any = {}) => {
      if (String(url).endsWith('/health')) {
        return new Promise((_r, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted'))));
      }
      const err = new Error('The user aborted a request.'); (err as any).name = 'AbortError';
      return Promise.reject(err);
    }) as any;
    const { currentUser } = await import('/plus/js/api.js');
    await currentUser();
    expect(sessionStorage.getItem('dcp:api-down')).toBeNull();
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

  // The account icon re-asks /me before opening the login form; if the memory
  // answered that, the form would never open while the memory lasted.
  it('a /me the reader asked for by hand (refresh) is really asked', async () => {
    sessionStorage.setItem('dcp:api-down', String(Date.now()));
    globalThis.fetch = vi.fn(async () => ok({ id: 'u1', tier: 'free' })) as any;
    const { currentUser, meStatus } = await import('/plus/js/api.js');
    expect(await currentUser({ refresh: true })).toMatchObject({ id: 'u1' });
    expect(meStatus()).toBe('user');
    expect(sessionStorage.getItem('dcp:api-down'), 'the answer clears the memory').toBeNull();
  });

  it('a request the reader started by hand still goes out', async () => {
    sessionStorage.setItem('dcp:api-down', String(Date.now()));
    globalThis.fetch = vi.fn(async () => ok({ ok: true, ttl_seconds: 300 })) as any;
    const { api } = await import('/plus/js/api.js');
    await api.requestOtp('09120000001');
    expect((globalThis.fetch as any).mock.calls.some((c: any[]) => String(c[0]).includes('/auth/otp/request'))).toBe(true);
  });
});

// A host that answers after `ms`, unless the caller's own deadline comes first.
function slow(ms: number, answer: () => any) {
  return (_url: any, init: any = {}) => new Promise((resolve, reject) => {
    const t = setTimeout(() => resolve(answer()), ms);
    init.signal?.addEventListener('abort', () => {
      clearTimeout(t);
      const e = new Error('timed out'); (e as any).name = 'TimeoutError'; reject(e);
    });
  });
}
const healthCalls = () => (globalThis.fetch as any).mock.calls.filter((c: any[]) => String(c[0]).endsWith('/health'));

describe('strikes carry across pages (a reader who changes page quickly)', () => {
  // The .org reader whose round trip is longer than the probe: the first
  // answer proves the API is there, so the next page must not probe again.
  it('a slow /me that answers is remembered as the base: the next page sends no probe', async () => {
    globalThis.fetch = vi.fn((url: any, init: any) => (String(url).endsWith('/health')
      ? slow(3000, () => ok())(url, init)
      : Promise.resolve(ok({ id: 'u1', tier: 'free' })))) as any;
    const { currentUser } = await import('/plus/js/api.js');
    expect(await currentUser()).toMatchObject({ id: 'u1' });
    expect(sessionStorage.getItem('dcp:api-base')).toBe('https://api.one.test');
    expect(sessionStorage.getItem('dcp:api-strikes'), 'the answer clears the strike').toBeNull();

    vi.resetModules();
    const probes = healthCalls().length;
    const next = await import('/plus/js/api.js');
    const t0 = Date.now();
    expect(await next.currentUser()).toMatchObject({ id: 'u1' });
    expect(Date.now() - t0).toBeLessThan(500);
    expect(healthCalls().length, 'no second probe').toBe(probes);
  }, 10000);

  it('a cut: page 1 is left early, page 2 pays the short and the long knock once, page 3 sends nothing', async () => {
    const silent = (_u: any, init: any = {}) => new Promise((_r, reject) => {
      init.signal?.addEventListener('abort', () => { const e = new Error('t'); (e as any).name = 'TimeoutError'; reject(e); });
    });
    // page 1: the probe is silent, then the reader leaves before /me's deadline
    globalThis.fetch = vi.fn((url: any, init: any) => (String(url).endsWith('/health')
      ? silent(url, init)
      : Promise.reject(Object.assign(new Error('left'), { name: 'AbortError' })))) as any;
    let mod = await import('/plus/js/api.js');
    await mod.currentUser();
    expect(sessionStorage.getItem('dcp:api-down'), 'one strike is not an outage').toBeNull();
    expect(sessionStorage.getItem('dcp:api-strikes')).toMatch(/^1:/);

    // page 2: silent again, so the long knock; silent too, so it is down
    vi.resetModules();
    globalThis.fetch = vi.fn(silent) as any;
    mod = await import('/plus/js/api.js');
    const t0 = Date.now();
    expect(await mod.currentUser()).toBeNull();
    expect(mod.meStatus()).toBe('error');
    const took = Date.now() - t0;
    expect(took).toBeGreaterThan(7000);
    expect(took, 'never the 15s /me deadline on top').toBeLessThan(9500);
    expect(sessionStorage.getItem('dcp:api-down')).toBeTruthy();
    expect((globalThis.fetch as any).mock.calls.some((c: any[]) => String(c[0]).endsWith('/me')),
      'no /me sent into the silence the long knock just confirmed').toBe(false);

    // page 3: nothing at all
    vi.resetModules();
    globalThis.fetch = vi.fn(silent) as any;
    mod = await import('/plus/js/api.js');
    expect(await mod.currentUser()).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  }, 20000);

  it('a slow but living API on the second strike: the long knock is answered and nothing is remembered', async () => {
    sessionStorage.setItem('dcp:api-strikes', '1:' + Date.now());
    globalThis.fetch = vi.fn((url: any, init: any) => (String(url).endsWith('/health')
      ? slow(3000, () => ok())(url, init)
      : Promise.resolve(ok({ id: 'u1', tier: 'premium' })))) as any;
    const { currentUser, meStatus } = await import('/plus/js/api.js');
    expect(await currentUser()).toMatchObject({ tier: 'premium' });
    expect(meStatus()).toBe('user');
    expect(sessionStorage.getItem('dcp:api-down')).toBeNull();
    expect(sessionStorage.getItem('dcp:api-strikes')).toBeNull();
  }, 15000);

  it('once the two minutes are over, an armed tab goes straight to the long knock', async () => {
    sessionStorage.setItem('dcp:api-down', String(Date.now() - 121 * 1000));
    sessionStorage.setItem('dcp:api-strikes', '2:' + Date.now());
    globalThis.fetch = vi.fn((url: any, init: any) => (String(url).endsWith('/health')
      ? slow(2500, () => ok())(url, init)
      : Promise.resolve(ok({ id: 'u1', tier: 'free' })))) as any;
    const { currentUser } = await import('/plus/js/api.js');
    expect(await currentUser()).toMatchObject({ id: 'u1' });
    expect(healthCalls().length, 'one knock per mirror, not a short one first').toBe(2);
  }, 10000);

  it('the memory lasts two minutes', async () => {
    sessionStorage.setItem('dcp:api-down', String(Date.now() - 110 * 1000));
    globalThis.fetch = vi.fn(async () => ok({ id: 'u1', tier: 'free' })) as any;
    const { currentUser } = await import('/plus/js/api.js');
    expect(await currentUser()).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('a strike older than five minutes is forgotten', async () => {
    sessionStorage.setItem('dcp:api-strikes', '1:' + (Date.now() - 6 * 60 * 1000));
    globalThis.fetch = vi.fn((_u: any, init: any = {}) => new Promise((_r, reject) => {
      init.signal?.addEventListener('abort', () => { const e = new Error('t'); (e as any).name = 'TimeoutError'; reject(e); });
    })) as any;
    const { apiBase } = await import('/plus/js/api.js');
    const t0 = Date.now();
    await apiBase();
    expect(Date.now() - t0, 'the short knock only, no long one').toBeLessThan(3000);
    expect(sessionStorage.getItem('dcp:api-strikes')).toMatch(/^1:/);
  }, 10000);
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
