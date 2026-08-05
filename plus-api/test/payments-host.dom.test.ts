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
  it('stays on whichever host the visitor is already on', async () => {
    expect((await on('dentcast.ir')).pricingHref('gate-cards'))
      .toBe('/plus/pricing.html?from=gate-cards');
    // It used to cross straight to .ir, back when the rial gateway was the only
    // way to pay and a .org visitor could do nothing on this page. The gift-card
    // route has no Iranian-gateway constraint at all, and .org is precisely
    // where the people it is for actually are — sending them to .ir would have
    // handed them the one page they cannot use.
    expect((await on('dentcast.org')).pricingHref('gate-cards'))
      .toBe('/plus/pricing.html?from=gate-cards');
  });

  it('keeps the source tag, so we learn which lock actually sells', async () => {
    expect((await on('dentcast.org')).pricingHref('header-menu')).toContain('from=header-menu');
    expect((await on('dentcast.ir')).pricingHref()).toBe('/plus/pricing.html');
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
