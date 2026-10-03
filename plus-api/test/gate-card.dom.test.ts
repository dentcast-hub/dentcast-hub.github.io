// @vitest-environment jsdom
// Drives the REAL shared gate card (/plus/js/sheet.js gateCard).
//
// Three premium gates — the cabinet card (library-gate.js), the starter bundles
// (home-bundles.js) and «کدام‌ها را خوانده‌ای» (plus.js / premium-panel.js) —
// each shipped a SIGNED-OUT visitor only «خرید اشتراک», while the up-board
// gate led with «ورود»: a guest may be a subscriber logged out on this device,
// and selling them a subscription is worse than saying nothing. The split now
// lives in the card itself, decided from what /me last answered, so no call
// site has to remember it.
import { describe, it, expect, beforeEach, vi } from 'vitest';

let meStatusImpl: () => string = () => 'unknown';
vi.mock('/plus/js/api.js', () => ({ meStatus: () => meStatusImpl() }));

let loginOpened: any[] = [];
vi.mock('/plus/js/login-modal.js', () => ({
  openLoginModal: (o: unknown) => { loginOpened.push(o); return Promise.resolve(null); },
}));

const { gateCard, openSheet } = await import('/plus/js/sheet.js');
const { premiumCta } = await import('/plus/js/premium-cta.js');

const settle = () => new Promise((r) => setTimeout(r, 0));
const card = () => gateCard({ title: 'کتابخانهٔ دنت‌کست ویژه‌ی پریمیوم است', sub: 'توضیح', cta: premiumCta('gate-library-archive') });

beforeEach(() => {
  document.body.innerHTML = '';
  loginOpened = [];
  meStatusImpl = () => 'unknown';
});

describe('gateCard — the signed-out split', () => {
  it('a free reader (402) gets the premium CTA, exactly as before', () => {
    meStatusImpl = () => 'user';
    const c = card();
    const btns = c.querySelectorAll('.dcp-btn');
    expect(btns).toHaveLength(1);
    expect(btns[0].tagName).toBe('A');
    expect(btns[0].getAttribute('href')).toBe('/plus/pricing.html?from=gate-library-archive');
  });

  it('a signed-out visitor (401) gets «ورود» first and the purchase link after, quieter, with the same ?from=', async () => {
    meStatusImpl = () => 'anon';
    const c = card();
    expect(c.querySelector('.dcp-sheet-title')!.textContent).toBe('کتابخانهٔ دنت‌کست ویژه‌ی پریمیوم است');
    const btns = Array.from(c.querySelectorAll('.dcp-btn'));
    expect(btns.map((b) => b.textContent)).toEqual(['ورود', 'خرید اشتراک پریمیوم']);
    expect(btns[0].classList.contains('dcp-btn-primary')).toBe(true);
    expect(btns[1].classList.contains('dcp-btn-ghost')).toBe(true);
    expect(btns[1].getAttribute('href')).toBe('/plus/pricing.html?from=gate-library-archive');
    expect(c.textContent).toContain('اگر اشتراک دارید وارد شوید');

    openSheet(c);
    (btns[0] as HTMLElement).click();
    await settle();
    expect(loginOpened).toHaveLength(1);
    expect(document.querySelector('.dcp-sheet-overlay.is-open')).toBeNull(); // the sheet closed for the modal
  });

  it('«we could not ask» is not «signed out»: the card stays the premium one', () => {
    meStatusImpl = () => 'error';
    expect(Array.from(card().querySelectorAll('.dcp-btn')).map((b) => b.textContent)).toEqual(['خرید اشتراک پریمیوم']);
  });

  it('a caller that drew its own guest button is left exactly as it was', () => {
    meStatusImpl = () => 'anon';
    const own = document.createElement('button');
    own.className = 'dcp-btn dcp-btn-primary';
    own.textContent = 'ورود';
    const c = gateCard({ title: 'بالاترین', sub: 'x', cta: own });
    const btns = c.querySelectorAll('.dcp-btn');
    expect(btns).toHaveLength(1);
    expect(btns[0]).toBe(own);
  });

  it('an explicit `guest` wins over the cached answer', () => {
    meStatusImpl = () => 'user';
    const c = gateCard({ title: 't', sub: 's', cta: premiumCta('gate-seen'), guest: true });
    expect(Array.from(c.querySelectorAll('.dcp-btn')).map((b) => b.textContent)).toEqual(['ورود', 'خرید اشتراک پریمیوم']);
  });
});
