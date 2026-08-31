// @vitest-environment jsdom
// Drives the REAL shipped contact card (/card/index.html), because the pill is
// the one thing on that page a visitor acts on — «باز است» is why somebody gets
// in a car.
//
// The rule under test is the one that makes the closure system safe to have at
// all: the API can only ADD a closure. No answer, a rejected fetch, a reply
// that says nothing is closed — every one of them has to leave the card saying
// exactly what it said before any of this existed.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CARD = readFileSync(path.join(repoRoot, 'card', 'index.html'), 'utf8');

/** The page's own script, run against the page's own markup. */
function runCard(): void {
  const body = CARD.match(/<body>([\s\S]*)<\/body>/)?.[1] ?? '';
  document.body.innerHTML = body; // innerHTML never executes scripts — we pick ours
  const blocks = Array.from(CARD.matchAll(/<script>([\s\S]*?)<\/script>/g)).map((m) => m[1]);
  const src = blocks.find((b) => b.includes('clinic-status-text'));
  if (!src) throw new Error('the open/closed pill script is gone from card/index.html');
  new Function(src)();
}

const pill = () => document.getElementById('clinic-status')!;
const text = () => document.getElementById('clinic-status-text')!.textContent;

/** A fetch that answers `body`, or hangs, or fails. */
function stubFetch(mode: 'closed' | 'open' | 'reject' | 'hang', body?: unknown) {
  globalThis.fetch = vi.fn(() => {
    if (mode === 'reject') return Promise.reject(new TypeError('Failed to fetch'));
    if (mode === 'hang') return new Promise(() => {});
    return Promise.resolve({ ok: true, json: async () => body });
  }) as any;
}

/** Let the fetch chain's microtasks land. */
const settle = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  // Tuesday 2026-09-01, 13:30 in Tehran: inside the ordinary working hours, so
  // the calculation and a closure disagree as loudly as they can.
  vi.setSystemTime(new Date('2026-09-01T10:00:00Z'));
});
afterEach(() => { vi.useRealTimers(); });

describe('the card pill', () => {
  it('prints the closure sentence the panel wrote, and nothing of its own', async () => {
    stubFetch('closed', { ok: true, closed: true, text: 'مطب تا ۱۴ شهریور تعطیل است' });
    runCard();
    await settle();
    expect(text()).toBe('مطب تا ۱۴ شهریور تعطیل است');
    expect(pill().classList.contains('is-open')).toBe(false); // never green while away
    expect(pill().hidden).toBe(false);
  });

  it('computes the ordinary week itself when nothing is closed', async () => {
    stubFetch('open', { ok: true, closed: false });
    runCard();
    await settle();
    expect(text()).toBe('مطب الان باز است · تا ساعت ۱۹:۰۰');
    expect(pill().classList.contains('is-open')).toBe(true);
  });

  it('falls back to that calculation when the API cannot be reached', async () => {
    stubFetch('reject');
    runCard();
    await settle();
    expect(text()).toBe('مطب الان باز است · تا ساعت ۱۹:۰۰');
    expect(pill().hidden).toBe(false);
  });

  it('does not wait on a hanging API for longer than the grace window', async () => {
    stubFetch('hang');
    runCard();
    await settle();
    expect(pill().hidden).toBe(true); // still holding, so a closed day never flashes «باز»
    vi.advanceTimersByTime(1000);
    expect(pill().hidden).toBe(false);
    expect(text()).toBe('مطب الان باز است · تا ساعت ۱۹:۰۰');
  });

  it('still corrects itself if the answer arrives after the grace window', async () => {
    let release: (v: unknown) => void = () => {};
    globalThis.fetch = vi.fn(() => new Promise((r) => {
      release = () => r({ ok: true, json: async () => ({ ok: true, closed: true, text: 'مطب تعطیل است' }) } as any);
    })) as any;
    runCard();
    vi.advanceTimersByTime(1000);
    expect(text()).toBe('مطب الان باز است · تا ساعت ۱۹:۰۰');
    release(null);
    await settle();
    expect(text()).toBe('مطب تعطیل است');
    expect(pill().classList.contains('is-open')).toBe(false);
  });

  it('asks each mirror its own API host', async () => {
    stubFetch('open', { ok: true, closed: false });
    runCard();
    await settle();
    // The page also warms the .vcf; the pill's own call is the one asserted.
    const urls = (globalThis.fetch as any).mock.calls.map((c: unknown[]) => String(c[0]));
    expect(urls).toContain('https://api.dentcast.ir/clinic/status');
  });
});
