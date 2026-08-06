// @vitest-environment jsdom
// Regression test for the login failures reported 2026-08-06 ("some people
// today cannot get in"). The session cookie is host-only, so the two API
// mirrors are NOT interchangeable once someone is logged in: moving the browser
// to the other one is a silent logout. Since 54180cf a 1.5s slow /health — one
// container restart — was enough to do exactly that, and re-logging in then
// wrote the cookie to whichever host answered that time, so the next page
// bounced straight back out.
//
// Each `resetModules()` + re-import below stands for a NEW PAGE LOAD on this
// static multi-page site: module scope (resolvedBase, pinBypass) starts over,
// while sessionStorage and localStorage carry across exactly as they do in a
// real browser.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('/plus/js/config.js', () => ({
  API_BASES: ['https://api.home.test', 'https://api.other.test'],
  OVERRIDE: {},
}));

const HOME = 'https://api.home.test';
const OTHER = 'https://api.other.test';
const LS_HOME = 'dcp:api-home';
const SS_BASE = 'dcp:api-base';

/** A profile only comes back from HOME — OTHER has no cookie for this browser. */
function fetchWhereOnlyHomeHasTheSession({ homeHealth = 'ok' } = {}) {
  return vi.fn((url: any, init: any = {}) => {
    const u = String(url);
    if (u.endsWith('/health')) {
      if (u.startsWith(HOME) && homeHealth === 'hang') {
        // Accepts the connection, then says nothing — a restarting container.
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
      }
      if (u.startsWith(HOME) && homeHealth === 'dead') {
        return Promise.reject(new TypeError('Failed to fetch'));
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) } as any);
    }
    if (u.startsWith(HOME)) {
      return Promise.resolve({
        ok: true, status: 200, json: async () => ({ id: 'u1', display_name: 'x' }),
      } as any);
    }
    // The mirror answers, and answers "who are you?" — the cookie is not there.
    return Promise.resolve({
      ok: false, status: 401, json: async () => ({ error: 'unauthorized' }),
    } as any);
  }) as any;
}

/** Every /me on every host says signed-out. */
function fetchGuest() {
  return vi.fn((url: any) => {
    if (String(url).endsWith('/health')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ ok: true }) } as any);
    }
    return Promise.resolve({
      ok: false, status: 401, json: async () => ({ error: 'unauthorized' }),
    } as any);
  }) as any;
}

const urlsOf = (f: any) => f.mock.calls.map((c: any[]) => String(c[0]));

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.resetModules();
});

describe('the API base that holds the session is pinned, not re-decided', () => {
  it('records the host a real /me came back from', async () => {
    globalThis.fetch = fetchWhereOnlyHomeHasTheSession();
    const { api } = await import('/plus/js/api.js');
    await api.me();
    expect(localStorage.getItem(LS_HOME)).toBe(HOME);
  });

  it('does NOT record a host that answered 401 — a guest keeps probing', async () => {
    globalThis.fetch = fetchGuest();
    const { api } = await import('/plus/js/api.js');
    await expect(api.me()).rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem(LS_HOME)).toBeNull();
  });

  it('keeps a logged-in browser on its own host when /health hangs (the bug)', async () => {
    globalThis.fetch = fetchWhereOnlyHomeHasTheSession();
    const first = await import('/plus/js/api.js');
    await first.api.me();

    // Next page load. The container is restarting, so HOME's /health hangs past
    // the 1500ms deadline and OTHER answers instantly. Before the pin, that was
    // enough to hand this browser to OTHER and log it out.
    vi.resetModules();
    const probe = fetchWhereOnlyHomeHasTheSession({ homeHealth: 'hang' });
    globalThis.fetch = probe;
    const second = await import('/plus/js/api.js');
    const me = await second.api.me();

    expect(me, 'the session must survive a slow home host').toMatchObject({ id: 'u1' });
    expect(await second.apiBase()).toBe(HOME);
  });

  it('skips the /health probe entirely once pinned', async () => {
    globalThis.fetch = fetchWhereOnlyHomeHasTheSession();
    const first = await import('/plus/js/api.js');
    await first.api.me();

    vi.resetModules();
    const f = fetchWhereOnlyHomeHasTheSession();
    globalThis.fetch = f;
    const second = await import('/plus/js/api.js');
    await second.api.me();

    expect(urlsOf(f).filter((u: string) => u.endsWith('/health')),
      'a pinned base needs no probe — that round trip sat in front of /me').toEqual([]);
  });

  it('beats a stale per-tab cache pointing at the other mirror', async () => {
    globalThis.fetch = fetchWhereOnlyHomeHasTheSession();
    const first = await import('/plus/js/api.js');
    await first.api.me();
    // A tab that failed over earlier left the mirror in sessionStorage.
    sessionStorage.setItem(SS_BASE, OTHER);

    vi.resetModules();
    globalThis.fetch = fetchWhereOnlyHomeHasTheSession();
    const second = await import('/plus/js/api.js');
    expect(await second.apiBase()).toBe(HOME);
  });
});

describe('the pin survives what it must, and is cleared by what should clear it', () => {
  it('allows a fallback when the home host is genuinely dead, without rewriting the pin', async () => {
    globalThis.fetch = fetchWhereOnlyHomeHasTheSession();
    const first = await import('/plus/js/api.js');
    await first.api.me();

    vi.resetModules();
    globalThis.fetch = fetchWhereOnlyHomeHasTheSession({ homeHealth: 'dead' });
    const second = await import('/plus/js/api.js');
    // A network-level failure on the pinned host opens the bypass for this load,
    // so the public pages still reach an API...
    second.forgetBase();
    expect(await second.apiBase()).toBe(OTHER);
    // ...but where the session lives is not up for revision.
    expect(localStorage.getItem(LS_HOME)).toBe(HOME);

    // Next page load, home is back: so is the session, with no re-login.
    vi.resetModules();
    globalThis.fetch = fetchWhereOnlyHomeHasTheSession();
    const third = await import('/plus/js/api.js');
    expect(await third.apiBase()).toBe(HOME);
  });

  it('forgets the home base on logout, and only on logout', async () => {
    globalThis.fetch = fetchWhereOnlyHomeHasTheSession();
    const { api } = await import('/plus/js/api.js');
    await api.me();
    expect(localStorage.getItem(LS_HOME)).toBe(HOME);
    await api.logout();
    expect(localStorage.getItem(LS_HOME)).toBeNull();
  });
});
