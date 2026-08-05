// @vitest-environment jsdom
/**
 * Payments are dentcast.ir-only, and the code has to know that on its own.
 *
 * This is not the site-wide .org gate (isOrgHost, currently off) — it is a fact
 * about the merchant registration: Zibal's account, its e-namad and the callback
 * URL it will accept all belong to dentcast.ir. A purchase begun anywhere else
 * cannot complete, so every link into the flow has to cross hosts BEFORE the
 * customer does any work.
 *
 * Tested here rather than in a browser because a real page cannot have its
 * `location.hostname` replaced — jsdom is the only place the question "what does
 * this do on .org" can actually be asked.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

/** Reload the modules against a given hostname. */
async function on(hostname: string) {
  vi.resetModules();
  // jsdom lets the whole URL be reset, which takes hostname with it.
  const url = `https://${hostname}/plus/cards.html?x=1`;
  Object.defineProperty(window, 'location', {
    value: new URL(url) as unknown as Location,
    writable: true,
    configurable: true,
  });
  const config = await import('../../plus/js/config.js');
  const cta = await import('../../plus/js/premium-cta.js');
  return { ...config, ...cta };
}

describe('paymentsNeedIrHost', () => {
  it('is false on the .ir site, where the gateway actually lives', async () => {
    const m = await on('dentcast.ir');
    expect(m.paymentsNeedIrHost()).toBe(false);
  });

  it('is true on the .org mirror', async () => {
    const m = await on('dentcast.org');
    expect(m.paymentsNeedIrHost()).toBe(true);
  });

  it('is true on www and any other host we might be served from', async () => {
    expect((await on('www.dentcast.org')).paymentsNeedIrHost()).toBe(true);
    expect((await on('dentcast-hub.github.io')).paymentsNeedIrHost()).toBe(true);
  });

  it('is false on localhost — a dev build has no gateway to bounce anyone to', async () => {
    expect((await on('localhost')).paymentsNeedIrHost()).toBe(false);
    expect((await on('127.0.0.1')).paymentsNeedIrHost()).toBe(false);
  });
});

describe('pricingHref', () => {
  it('stays a plain path on .ir', async () => {
    const m = await on('dentcast.ir');
    expect(m.pricingHref('gate-cards')).toBe('/plus/pricing.html?from=gate-cards');
  });

  it('crosses to .ir from anywhere else, in ONE navigation', async () => {
    const m = await on('dentcast.org');
    // Not a link to the local pricing page that then bounces: the href itself
    // tells the truth about where it goes, so it survives "open in new tab" and
    // a middle-click, and the customer never sees two page loads.
    expect(m.pricingHref('gate-cards'))
      .toBe('https://dentcast.ir/plus/pricing.html?from=gate-cards');
  });

  it('keeps the source tag across the hop, so attribution is not lost at the border', async () => {
    const m = await on('dentcast.org');
    expect(m.pricingHref('header-menu')).toContain('from=header-menu');
  });

  it('has no source tag to add when none was given', async () => {
    expect((await on('dentcast.org')).pricingHref())
      .toBe('https://dentcast.ir/plus/pricing.html');
  });
});

describe('subscriptionMenuLabel', () => {
  it('offers a founder nothing', async () => {
    const m = await on('dentcast.ir');
    expect(m.subscriptionMenuLabel({ tier: 'premium', subscription: { is_founder: true } })).toBeNull();
  });

  it('offers a subscriber a renewal, and everyone else a purchase', async () => {
    const m = await on('dentcast.ir');
    expect(m.subscriptionMenuLabel({ tier: 'premium', subscription: { is_founder: false } }))
      .toBe('تمدید اشتراک');
    expect(m.subscriptionMenuLabel({ tier: 'free', subscription: null }))
      .toBe('خرید اشتراک پریمیوم');
    // League-prize premium has no subscription behind it; buying is how it
    // continues, so it gets the purchase wording rather than "renew".
    expect(m.subscriptionMenuLabel({ tier: 'premium', subscription: null }))
      .toBe('خرید اشتراک پریمیوم');
  });
});

describe('lapsedNote', () => {
  it('speaks only to somebody who used to be a subscriber', async () => {
    const m = await on('dentcast.ir');
    expect(m.lapsedNote({ tier: 'free', subscription: null })).toBeNull();
    expect(m.lapsedNote({ tier: 'premium', subscription: { is_founder: true } })).toBeNull();
    expect(m.lapsedNote({ tier: 'premium', subscription: { is_premium: true } })).toBeNull();

    const note = m.lapsedNote({ tier: 'free', subscription: { is_premium: false } });
    // The one thing a lapsed reader is actually afraid of.
    expect(note).toContain('محفوظ');
  });
});
