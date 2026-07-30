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

const { api } = await import('../../plus/js/api.js');

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
