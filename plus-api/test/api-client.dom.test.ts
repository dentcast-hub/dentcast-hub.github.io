// @vitest-environment jsdom
// Regression test for a real production bug (2026-07-30): `new
// URLSearchParams({topic: undefined})` stringifies to the literal text
// "topic=undefined", so an omitted optional query param (reviewDue's `topic`)
// was reaching the API as the STRING "undefined" instead of being absent —
// the server then 404'd trying to resolve a topic named "undefined", and the
// premium review page showed "مرور در دسترس نیست." for every visitor.
import { describe, it, expect, beforeEach, vi } from 'vitest';

const calls: string[] = [];

beforeEach(() => {
  calls.length = 0;
  try { sessionStorage.clear(); } catch (_) { /* noop */ }
  globalThis.fetch = vi.fn((url: string) => {
    calls.push(String(url));
    if (String(url).endsWith('/health')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    }
    return Promise.resolve({ ok: true, status: 200, json: async () => ({ due: [] }) });
  }) as any;
});

const { api, currentUser } = await import('../../plus/js/api.js');

describe('api.js query building', () => {
  it('omits an undefined optional query param instead of sending it as "undefined"', async () => {
    await api.reviewDue(undefined, undefined);
    const reviewCall = calls.find((u) => u.includes('/review/due'));
    expect(reviewCall).toBeTruthy();
    expect(reviewCall).not.toContain('undefined');
  });

  it('still sends a real query param when one is provided', async () => {
    await api.reviewDue('folder:chairside', 5);
    const reviewCall = calls.find((u) => u.includes('/review/due'));
    expect(reviewCall).toContain('topic=folder%3Achairside');
    expect(reviewCall).toContain('limit=5');
  });
});

/**
 * Every `api.X(...)` the site calls must exist on the real client.
 *
 * This is the guard the DES tool went without (2026-09-17): des-scorer.js called
 * `api.desSubmit()` and `api.desState()`, neither of which api.js ever defined,
 * so the drawer's quota line never loaded and «بفرست» answered «ارسال نشد» on
 * every press — live, from the day it shipped. Its own DOM suite could not see
 * it, and no other suite could either, for a structural reason that applies to
 * ALL of them: a browser-module test mocks `/plus/js/api.js` wholesale, so the
 * mock happily supplies whatever method the module under test asks for. The
 * mock is right to do that — the point of those suites is the module, not the
 * transport — which is exactly why the join between the two needs checking
 * once, here, against the real object.
 *
 * Deliberately a source scan rather than a type: these are plain browser
 * modules with no build step and no type checker between them and the CDN.
 */
describe('the client covers every method the site calls', () => {
  it('defines every api.* referenced by a module that imports it', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const jsDir = path.resolve(__dirname, '../../plus/js');
    const roots = [jsDir, path.resolve(__dirname, '../../plus')];

    const files: string[] = [];
    for (const dir of roots) {
      for (const name of fs.readdirSync(dir)) {
        if (!name.endsWith('.js') || name === 'api.js') continue;
        files.push(path.join(dir, name));
      }
    }
    files.push(path.resolve(__dirname, '../../spot/spot.js'));

    const missing: string[] = [];
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      // Only files that actually import the client: anything else calling a
      // local variable named `api` is somebody else's object, not this one.
      if (!/from\s+'[^']*\/?api\.js(\?[^']*)?'/.test(src)) continue;
      for (const m of src.matchAll(/\bapi\.([A-Za-z_]\w*)\s*\(/g)) {
        const name = m[1];
        if (typeof (api as Record<string, unknown>)[name] !== 'function') {
          missing.push(`${path.basename(file)} → api.${name}()`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});

describe('currentUser announces a REFRESHED /me', () => {
  it('dispatches dcp:me with the profile on refresh, and nothing on the first, un-refreshed load', async () => {
    const seen: unknown[] = [];
    document.addEventListener('dcp:me', (e) => { seen.push((e as CustomEvent).detail); });
    await currentUser();
    expect(seen).toHaveLength(0);
    await currentUser();                      // cached: still nothing
    expect(seen).toHaveLength(0);
    const u = await currentUser({ refresh: true });
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual(u);
  });
});
