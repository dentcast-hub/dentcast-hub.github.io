// @vitest-environment jsdom
// Drives the REAL shipped gate (/plus/js/highlights-page.js).
//
// THE BUG (reported by a subscriber, 2026-08-07): premium «نمی‌شه» — and a few
// minutes later it worked, with nothing changed but the API coming back after a
// redeploy. currentUser() returns null on ANY failure, a 401 and an unreachable
// API alike, so for as long as the API was down every premium page told its
// PAYING readers to go and buy a subscription.
//
// The distinction already existed: meStatus() was written for the ad system,
// whose own comment says a premium visitor must not get an ad they paid never to
// see. The gates for the features people actually pay for were the ones still
// getting it wrong.
import { describe, it, expect, beforeEach, vi } from 'vitest';

let meResult: { ok: boolean; status: number; body: any } | 'network-error' = 'network-error';

globalThis.fetch = vi.fn((url: string) => {
  if (meResult === 'network-error') return Promise.reject(new TypeError('Failed to fetch'));
  const r = meResult;
  return Promise.resolve({
    ok: r.ok,
    status: r.status,
    json: async () => r.body,
    text: async () => JSON.stringify(r.body),
  });
}) as any;

vi.mock('/plus/js/pwa.js', () => ({ registerSW: () => {} }));
vi.mock('/plus/js/login-modal.js', () => ({ openLoginModal: () => Promise.resolve(null) }));
vi.mock('/plus/js/highlights.js', () => ({
  renderHighlightLibrary: (root: HTMLElement) => { root.textContent = 'LIBRARY'; },
}));

beforeEach(() => {
  document.body.innerHTML = '<div id="dcp-root"></div>';
  vi.resetModules();
});

/** Load the page module fresh and let its DOMContentLoaded path run. */
async function runGate(): Promise<string> {
  await import('/plus/js/highlights-page.js');
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
  return document.getElementById('dcp-root')!.textContent || '';
}

describe('a premium gate when the API cannot be reached', () => {
  it('says the server is unreachable — never "buy a subscription"', async () => {
    meResult = 'network-error';

    const text = await runGate();

    expect(text).toContain('ارتباط با سرور برقرار نشد');
    // The exact harm being fixed: a paying subscriber must not be shown an
    // upsell because we could not ask who they are.
    expect(text).not.toContain('پریمیوم است');
    expect(text).toContain('نه این‌که اشتراک نداری');
  });

  it('still shows the login gate to a genuinely anonymous visitor (401)', async () => {
    meResult = { ok: false, status: 401, body: { error: 'unauthorized' } };

    const text = await runGate();

    expect(text).toContain('وارد شوید');
    expect(text).not.toContain('ارتباط با سرور برقرار نشد');
  });

  // A free account now reaches the SAME renderer a subscriber does — the
  // allowance is applied inside it, by the API, not by a gate on the door. This
  // used to assert a wall; asserting the absence of one is the point now, and
  // the "unreachable" cases above are what this file is really guarding.
  it('lets a real free account through to the feature itself', async () => {
    meResult = { ok: true, status: 200, body: { id: 'u1', tier: 'free', settings: {} } };

    const text = await runGate();

    expect(text).toBe('LIBRARY');
    expect(text).not.toContain('ارتباط با سرور برقرار نشد');
  });

  it('still lets a premium account straight through', async () => {
    meResult = { ok: true, status: 200, body: { id: 'u1', tier: 'premium', settings: {} } };

    const text = await runGate();

    expect(text).toBe('LIBRARY');
  });

  // The unreachable case must stay distinguishable from BOTH of the above, and
  // that is the one thing tier no longer separates: free and premium now look
  // identical here, so "did we manage to ask at all" is the only distinction
  // this page still draws.
  it('tells the two apart even though free and premium now render the same', async () => {
    meResult = 'network-error';
    const offline = await runGate();

    document.body.innerHTML = '<div id="dcp-root"></div>';
    vi.resetModules();
    meResult = { ok: true, status: 200, body: { id: 'u1', tier: 'free', settings: {} } };
    const free = await runGate();

    expect(offline).not.toBe(free);
    expect(free).toBe('LIBRARY');
  });
});
