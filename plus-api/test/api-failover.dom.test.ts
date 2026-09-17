// @vitest-environment jsdom
// Drives the REAL shipped client (/plus/js/api.js) through the failover rules
// that decide where the session cookie can live.
//
// THE BUG (2026-09-17 audit): the health probe raced both mirrors with a short
// deadline and REMEMBERED whichever won for the whole tab. One slow answer
// from the same-site host on the first page of a visit pinned the tab to the
// other mirror, where the session cookie does not exist (it is host-only on
// the primary) and where a fresh login sets a cookie that is cross-site for
// this page — dropped by Safari and by every «block third-party cookies»
// setting. «Signed in on one tab, a guest on the next.»
import { describe, it, expect, beforeEach, vi } from 'vitest';

const A = 'https://a.test';
const B = 'https://b.test';

type Route = (url: string, init: RequestInit) => Promise<Response> | Response;
let routes: Route;
const calls: string[] = [];

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

globalThis.fetch = vi.fn((url: string, init: RequestInit) => {
  calls.push(`${init?.method || 'GET'} ${url}`);
  // A real fetch REJECTS on a network failure; the route table throws to say
  // so, and the throw is turned into that rejection here.
  try { return Promise.resolve(routes(url, init)); } catch (e) { return Promise.reject(e); }
}) as any;

beforeEach(() => {
  calls.length = 0;
  sessionStorage.clear();
  localStorage.clear();
  (window as any).DENTCAST_PLUS = { apiBases: [A, B] };
  vi.resetModules();
});

async function load() {
  return import('/plus/js/api.js');
}

describe('where the session lives', () => {
  it('re-asks the primary on a 401 from the fallback, and moves back to it', async () => {
    routes = (url) => {
      if (url === `${A}/health`) throw new TypeError('timeout');
      if (url === `${B}/health`) return json(200, { ok: true });
      if (url === `${B}/me`) return json(401, { error: 'unauthorized' });
      if (url === `${A}/me`) return json(200, { id: 'u1', display_name: 'x', tier: 'free' });
      return json(404, {});
    };
    const { api, currentUser, meStatus } = await load();
    const me = await currentUser();
    expect(me && me.id).toBe('u1');
    expect(meStatus()).toBe('user');
    expect(calls).toContain(`GET ${B}/me`);
    expect(calls).toContain(`GET ${A}/me`);
    // The tab now belongs to the primary: remembered, and used directly.
    expect(sessionStorage.getItem('dcp:api-base')).toBe(A);
    calls.length = 0;
    await api.votes('x/y').catch(() => {});
    expect(calls[0]).toBe(`GET ${A}/votes?id=x%2Fy`);
  });

  it('never remembers the fallback across pages', async () => {
    routes = (url) => {
      if (url === `${A}/health`) throw new TypeError('timeout');
      if (url === `${B}/health`) return json(200, { ok: true });
      return json(200, {});
    };
    const { api } = await load();
    await api.voteCounts();
    expect(calls.some((c) => c.startsWith(`GET ${B}/votes/counts`))).toBe(true);
    expect(sessionStorage.getItem('dcp:api-base')).toBeNull();
  });

  it('remembers the primary when it answers', async () => {
    routes = (url) => json(200, { ok: true });
    const { api } = await load();
    await api.voteCounts();
    expect(sessionStorage.getItem('dcp:api-base')).toBe(A);
  });

  it('sends every login call to the primary even while the page is on the fallback', async () => {
    routes = (url) => {
      if (url === `${A}/health`) throw new TypeError('timeout');
      if (url === `${B}/health`) return json(200, { ok: true });
      return json(200, { ok: true, user: {}, return_to: '/plus/' });
    };
    const { api } = await load();
    await api.voteCounts(); // resolves the page to B
    calls.length = 0;
    await api.requestOtp('09120000000');
    await api.verifyOtp('09120000000', '12345', '/plus/');
    await api.logout();
    expect(calls).toEqual([
      `POST ${A}/auth/otp/request`,
      `POST ${A}/auth/otp/verify`,
      `POST ${A}/auth/logout`,
    ]);
  });

  it('reports «could not ask» when the primary is unreachable for the re-ask', async () => {
    routes = (url) => {
      if (url === `${A}/health`) throw new TypeError('timeout');
      if (url === `${B}/health`) return json(200, { ok: true });
      if (url === `${B}/me`) return json(401, { error: 'unauthorized' });
      if (url === `${A}/me`) throw new TypeError('Failed to fetch');
      return json(404, {});
    };
    const { currentUser, meStatus } = await load();
    expect(await currentUser()).toBeNull();
    // Not 'anon': the host that holds the session was never reached, and a
    // signed-in device must not be flipped to guest on a network failure.
    expect(meStatus()).toBe('error');
  });
});
