// @vitest-environment jsdom
/**
 * The price list, as a customer actually reads it.
 *
 * Every other test in this repo checks what we CHARGE (payment-capacity, pay).
 * This one checks what we SAY, which since 2026-08-07 is a different question:
 * the ladder is non-linear — 1,200,000 toman a month, 1,100,000 a month over
 * three, 1,000,000 a month over six — so the page has to do arithmetic of its
 * own (per-month rate, percent saved) that no server response contains. A wrong
 * discount chip on a paid product is not a rendering bug, it is a false price.
 *
 * Rendered in jsdom against the REAL module rather than asserted on a formula,
 * because the number the customer is misled by is the one in the DOM.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const payPlans = vi.fn();
// Who the page thinks is looking. Signed out by default — most of the ladder
// tests are about the public price — and set per-render where it matters,
// because "the server personalised these prices" and "nobody is signed in" are
// not a state that can occur together outside a mock.
let viewer: unknown = null;

// `bankTransferStatus` is deliberately ABSENT from this mock — see the
// "a client older than the page" case at the foot of this file. Adding it here
// would quietly delete that test's whole point.
vi.mock('../../plus/js/api.js', () => ({
  api: {
    payPlans: (...a: unknown[]) => payPlans(...a),
    payStart: vi.fn(),
    giftStatus: vi.fn().mockRejectedValue(new Error('no')),
  },
  currentUser: () => Promise.resolve(viewer),
}));
vi.mock('../../plus/js/login-modal.js', () => ({ openLoginModal: vi.fn() }));
vi.mock('../../plus/js/pwa.js', () => ({ registerSW: vi.fn() }));

/** Load the page against a given /pay/plans answer and hand back its DOM. */
async function renderPricing(plansAnswer: unknown, user: unknown = null): Promise<HTMLElement> {
  vi.resetModules();
  document.body.innerHTML = '<div id="dcp-root"></div>';
  viewer = user;
  payPlans.mockReset();
  if (plansAnswer === null) payPlans.mockRejectedValue(new Error('offline'));
  else payPlans.mockResolvedValue(plansAnswer);

  await import('../../plus/js/pricing-page.js');
  // main() is async and fires on import; let its two awaited calls settle.
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
  return document.getElementById('dcp-root') as HTMLElement;
}

const LIVE = {
  enabled: true,
  from_monthly_rial: 10_000_000,
  any_plan_available: true,
  gift_card: null,
  plans: [
    { months: 1, amount_rial: 12_000_000, available: true, blocked_by: null },
    { months: 3, amount_rial: 33_000_000, available: true, blocked_by: null },
    { months: 6, amount_rial: 60_000_000, available: true, blocked_by: null },
  ],
};

const cards = (root: HTMLElement) => Array.from(root.querySelectorAll('.dcp-plan'));

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: new URL('https://dentcast.ir/plus/pricing.html') as unknown as Location,
    writable: true,
    configurable: true,
  });
});

describe('the published ladder', () => {
  it('quotes each term at its own price, in toman', async () => {
    const root = await renderPricing(LIVE);
    const prices = cards(root).map((c) => c.querySelector('.dcp-plan-price')!.textContent);

    // Rial in, toman out — the one conversion in the whole system, and the one
    // place an extra zero would be charged for.
    expect(prices[0]).toContain('۱٬۲۰۰٬۰۰۰');
    expect(prices[1]).toContain('۳٬۳۰۰٬۰۰۰');
    expect(prices[2]).toContain('۶٬۰۰۰٬۰۰۰');
  });

  it('shows what a month costs inside each longer term', async () => {
    const root = await renderPricing(LIVE);
    const rate = (i: number) => cards(root)[i].querySelector('.dcp-plan-rate')?.textContent ?? '';

    // Absent on the one-month card: «۱٬۲۰۰٬۰۰۰ / ماهی ۱٬۲۰۰٬۰۰۰» is noise.
    expect(rate(0)).toBe('');
    expect(rate(1)).toBe('ماهی ۱٬۱۰۰٬۰۰۰ تومان');
    expect(rate(2)).toBe('ماهی ۱٬۰۰۰٬۰۰۰ تومان');
  });

  it('states the saving against the shortest term, rounded to a whole percent', async () => {
    const root = await renderPricing(LIVE);
    const save = (i: number) => cards(root)[i].querySelector('.dcp-plan-save')?.textContent ?? '';

    // Nothing to claim on the term the others are measured against.
    expect(save(0)).toBe('');
    // 1,100,000 against 1,200,000 = 8.33%, and 1,000,000 against 1,200,000 =
    // 16.67%. Rounded, never floored: the claim is ours to make and it should
    // be the true one, not the flattering one.
    expect(save(1)).toBe('٪۸ ارزان‌تر');
    expect(save(2)).toBe('٪۱۷ ارزان‌تر');
  });

  it('quotes the headline as a floor, not as what every month costs', async () => {
    const root = await renderPricing(LIVE);
    const sub = root.querySelector('.dcp-price-sub')!.textContent!;

    // «هر ماه ۱٬۰۰۰٬۰۰۰» was true when the ladder was flat and is now a lie on
    // two of the three cards.
    expect(sub).toContain('از ماهی ۱٬۰۰۰٬۰۰۰ تومان');
    expect(sub).not.toContain('هر ماه');
  });

  it('claims no discount when a flat price list comes back', async () => {
    // The chips are derived from the answer, not from the copy. If the ladder is
    // ever flattened again, the page must stop advertising a saving by itself.
    const root = await renderPricing({
      ...LIVE,
      plans: [
        { months: 1, amount_rial: 10_000_000, available: true, blocked_by: null },
        { months: 6, amount_rial: 60_000_000, available: true, blocked_by: null },
      ],
    });
    expect(root.querySelectorAll('.dcp-plan-save')).toHaveLength(0);
  });
});

describe('the «ستون» seat-holder view', () => {
  const PILLAR = {
    ...LIVE,
    from_monthly_rial: 8_000_000,
    pillar_discount: { percent: 20 },
    plans: [
      { months: 1, amount_rial: 9_600_000, list_amount_rial: 12_000_000, available: true, blocked_by: null },
      { months: 3, amount_rial: 26_400_000, list_amount_rial: 33_000_000, available: true, blocked_by: null },
      { months: 6, amount_rial: 48_000_000, list_amount_rial: 60_000_000, available: true, blocked_by: null },
    ],
  };

  // A seat is held by an ACCOUNT: the server can only have personalised these
  // prices for a request that carried a session, so the viewer is signed in.
  const SEAT_HOLDER = { id: 'u1', display_name: 'خریدارِ اول' };

  it('shows the discounted price as THE price, with the list struck through beside it', async () => {
    const root = await renderPricing(PILLAR, SEAT_HOLDER);
    const six = cards(root)[2].querySelector('.dcp-plan-price')!;

    // What will actually be charged is the number that reads as the price…
    expect(six.textContent).toContain('۴٬۸۰۰٬۰۰۰');
    // …and the list price is present, struck through, so the discount has a
    // visible size instead of looking like a pricing mistake.
    const struck = six.querySelector('.dcp-plan-list')!;
    expect(struck.textContent).toContain('۶٬۰۰۰٬۰۰۰');
  });

  it('says why the prices are down, once, above the ladder', async () => {
    const root = await renderPricing(PILLAR, SEAT_HOLDER);
    const noticeText = root.querySelector('.dcp-price-notice.is-ok')!.textContent!;
    expect(noticeText).toContain('ستون');
    expect(noticeText).toContain('٪۲۰');
  });

  it('adds no strikethrough for a signed-in reader without a seat', async () => {
    const root = await renderPricing(LIVE, { id: 'u2' });
    expect(root.querySelectorAll('.dcp-plan-list')).toHaveLength(0);
    expect(root.querySelector('.dcp-price-notice.is-ok')).toBeNull();
  });

  /**
   * The bank rail does NOT inherit the personalised price, and this is the one
   * assertion standing between a seat-holder and a wrong transfer.
   *
   * Its amount is set by the founder on the claim (decision 2.3 — the student's
   * ٪۱۵ is announced, never computed), so `POST /pay/bank-transfer` prices from
   * the list. A card quoting ۴٬۸۰۰٬۰۰۰ followed by steps saying ۶٬۰۰۰٬۰۰۰ is
   * what shipped on 2026-08-12: a 1,200,000-toman jump between two screens,
   * with nothing on either explaining it.
   */
  it('quotes the LIST price on the bank rail, never the seat-holder price', async () => {
    const root = await renderPricing(
      { ...PILLAR, bank_transfer: { enabled: true, iban: 'IR110560930380000825945001', holder: 'ف', bank_name: 'س' } },
      SEAT_HOLDER,
    );
    const bank = root.querySelector('.dcp-bank')!;
    const quoted = bank.querySelector('.dcp-bank-plan')!.textContent!;

    expect(quoted).toContain('۶٬۰۰۰٬۰۰۰');
    expect(quoted).not.toContain('۴٬۸۰۰٬۰۰۰');
    expect(quoted).toContain('قیمت لیست');
  });

  it('tells the buyer to agree the amount first, and what a student gets', async () => {
    const root = await renderPricing(
      {
        ...LIVE,
        bank_transfer: {
          enabled: true, iban: 'IR110560930380000825945001', holder: 'ف', bank_name: 'س',
          student_discount_percent: 15, student_months: 6,
        },
      },
      { id: 'u2' },
    );
    const warn = root.querySelector('.dcp-bank .dcp-gift-warn')!.textContent!;
    expect(warn).toContain('هماهنگ');
    expect(warn).toContain('٪۱۵');
    expect(warn).toContain('۶ ماهه');
  });
});

/**
 * The failure this covers has no error and no empty state: an anonymous
 * /pay/plans answers with both discount fields null, so the page shows the list
 * price and says nothing — which reads exactly like "you have no discount". A
 * reader holding a one-time credit is quoted the full price and never learns
 * otherwise, and the two mirrors keep separate sessions, so following a
 * dentcast.ir link while signed in on .org lands precisely here.
 */
describe('a visitor we could not identify', () => {
  it('says the prices are the public ones, and offers the way to fix that', async () => {
    const root = await renderPricing(LIVE);
    const notices = Array.from(root.querySelectorAll('.dcp-price-notice.is-ok'));
    const text = notices.map((n) => n.textContent).join(' ');

    expect(text).toContain('عمومی');
    expect(text).toContain('یک‌بارمصرف');
    expect(root.querySelector('.dcp-price-login')).toBeTruthy();
  });

  it('says nothing of the sort once someone is signed in', async () => {
    const root = await renderPricing(LIVE, { id: 'u2' });
    expect(root.querySelector('.dcp-price-login')).toBeNull();
  });

  // When the API could not be reached we did not fail to identify the reader,
  // we failed to ask at all — and the page already says so. A second notice
  // blaming their sign-in state would be a guess presented as a diagnosis.
  it('stays quiet when the API could not be reached at all', async () => {
    const root = await renderPricing(null);
    expect(root.querySelector('.dcp-price-login')).toBeNull();
  });
});

describe('when the API cannot be reached', () => {
  it('still prints the real ladder from the client mirror', async () => {
    // The whole point of the fallback: a visitor who came to learn the price
    // gets the price. It has to be the SAME price — a stale mirror here would
    // quote one number and charge another.
    const root = await renderPricing(null);
    const prices = cards(root).map((c) => c.querySelector('.dcp-plan-price')!.textContent);

    expect(prices[0]).toContain('۱٬۲۰۰٬۰۰۰');
    expect(prices[1]).toContain('۳٬۳۰۰٬۰۰۰');
    expect(prices[2]).toContain('۶٬۰۰۰٬۰۰۰');
    expect(root.querySelector('.dcp-price-sub')!.textContent)
      .toContain('از ماهی ۱٬۰۰۰٬۰۰۰ تومان');
    // Prices shown, purchase not attemptable — saying "buy" and then failing is
    // worse than saying we could not ask.
    expect(root.querySelector('.dcp-price-action')!.textContent).toContain('در دسترس نیست');
  });
});

/**
 * A browser holding an older /plus/js/api.js than the page that imports it.
 *
 * api.js is imported by a RELATIVE path and so carries no `?v=` of its own,
 * which makes "new pricing-page.js, cached api.js" a state that can really
 * occur. When it does, `api.bankTransferStatus` is undefined and calling it
 * throws SYNCHRONOUSLY — a `.catch()` on the call site never sees it.
 *
 * That used to happen BEFORE root.replaceChildren(), so the throw escaped
 * main() and the customer got an empty page where the price list should be:
 * every plan, both rails and the buy button gone, with no error on screen.
 * The claim lookups now run after the paint, inside a try — a rail that fails
 * to refresh is survivable; a blank price list is not.
 */
describe('a client older than the page', () => {
  it('still renders the whole price list when a claim lookup is missing', async () => {
    const root = await renderPricing(
      {
        ...LIVE,
        bank_transfer: { enabled: true, iban: 'IR110560930380000825945001', holder: 'ف', bank_name: 'س' },
      },
      { id: 'u2' },
    );

    expect(cards(root)).toHaveLength(3);
    expect(root.querySelector('.dcp-price-action')).not.toBeNull();
    expect(root.querySelector('.dcp-bank')).not.toBeNull();
  });
});
