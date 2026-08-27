// @vitest-environment jsdom
/**
 * The buyer's own view of a واریز به شبا claim, in the two states that decide
 * whether they transfer money or sit still.
 *
 * ONE claim in three states, and which one it gets is `student_request`
 * (migration 0051) — never the plan and never the amount. An ordinary transfer
 * is the list price, computed server-side, the same figure the gateway
 * charges: nothing to agree, so it is ready the moment it exists. A student's
 * ٪۱۵ genuinely is not known until a card has been seen, so that claim holds
 * until `amount_confirmed_at` (migration 0050) releases it.
 *
 * Both halves of that were wrong at once on 1405/06/05: the page told EVERY
 * buyer to go and agree an amount, and had no way to ever stop saying it —
 * its fine print was keyed on nothing, so it stood there after the founder had
 * settled the figure exactly as it did before. Two claims sat in the queue
 * with each side waiting for the other, and a one-month buyer was being asked
 * to open Telegram before paying for a fixed-price subscription.
 *
 * Rendered against the REAL module, because the sentence a buyer obeys is the
 * one in the DOM.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const payPlans = vi.fn();
const bankTransferStatus = vi.fn();
const bankTransferCancel = vi.fn();
let viewer: unknown = null;

vi.mock('../../plus/js/api.js', () => ({
  api: {
    payPlans: (...a: unknown[]) => payPlans(...a),
    payStart: vi.fn(),
    bankTransferStart: vi.fn(),
    bankTransferStatus: () => bankTransferStatus(),
    bankTransferCancel: (...a: unknown[]) => bankTransferCancel(...a),
    giftStatus: vi.fn().mockRejectedValue(new Error('no')),
  },
  currentUser: () => Promise.resolve(viewer),
}));
vi.mock('../../plus/js/login-modal.js', () => ({ openLoginModal: vi.fn() }));
vi.mock('../../plus/js/pwa.js', () => ({ registerSW: vi.fn() }));

const PLANS = {
  enabled: true,
  from_monthly_rial: 10_000_000,
  any_plan_available: true,
  gift_card: null,
  bank_transfer: {
    enabled: true, iban: 'IR110560930380000825945001', holder: 'ف', bank_name: 'س',
    student_discount_percent: 15, student_months: 6,
  },
  plans: [
    { months: 1, amount_rial: 12_000_000, available: true, blocked_by: null },
    { months: 3, amount_rial: 33_000_000, available: true, blocked_by: null },
    { months: 6, amount_rial: 60_000_000, available: true, blocked_by: null },
  ],
};

/** Render the page for a signed-in buyer whose open claim looks like `claim`. */
async function renderClaim(claim: Record<string, unknown>): Promise<HTMLElement> {
  vi.resetModules();
  document.body.innerHTML = '<div id="dcp-root"></div>';
  viewer = { id: 'u2' };
  payPlans.mockReset().mockResolvedValue(PLANS);
  bankTransferCancel.mockReset().mockResolvedValue({ ok: true });
  bankTransferStatus.mockReset().mockResolvedValue({ redemption: claim });

  await import('../../plus/js/pricing-page.js');
  // main() awaits two calls before painting, then refreshes the rail after it.
  for (let i = 0; i < 4; i += 1) await new Promise((r) => setTimeout(r, 0));
  return document.getElementById('dcp-root') as HTMLElement;
}

const PENDING = {
  status: 'pending', reference: 'DC-KTP-RWQ', months: 3, amount_rial: 33_000_000,
  referral_applied: false,
};

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: new URL('https://dentcast.ir/plus/pricing.html') as unknown as Location,
    writable: true,
    configurable: true,
  });
});

describe('an ordinary claim', () => {
  /**
   * The correction of 1405/06/05. Every claim used to open in a «go and agree
   * the amount first» state, and the founder's own reading killed it: an
   * ordinary subscription has nothing to negotiate — its price is the list
   * price, computed server-side, exactly what the gateway charges. The wait
   * belonged to the student rate alone, and imposing it on a one-month buyer
   * was a step invented for nobody that loses the sale outright.
   */
  it('is ready to transfer the moment it exists', async () => {
    const root = await renderClaim({
      ...PENDING, amount_confirmed_at: null, student_request: false,
    });

    const card = root.querySelector('.dcp-bank')!.textContent!;
    expect(card).not.toContain('هنوز واریز نکنید');

    const steps = root.querySelector('.dcp-gift-steps')!.textContent!;
    expect(steps).toContain('به شبای بالا بفرستید');
    // The reference still has to reach the transfer's «بابت» field, or the
    // deposit arrives with nothing tying it to this claim.
    expect(steps).toContain('DC-KTP-RWQ');
  });

  it('is told nothing about a state it was never in', async () => {
    // On the term they have selected — a claim for a DIFFERENT term has its own
    // notice, which is the case below this one.
    const root = await renderClaim({
      ...PENDING, months: 6, amount_rial: 60_000_000,
      amount_confirmed_at: null, student_request: false,
    });
    // No «wait» banner, and no «your amount was approved» either: an ordinary
    // claim has never been waiting, so both are answers to a question it never
    // asked.
    expect(root.querySelector('.dcp-bank .dcp-price-notice')).toBeNull();
  });
});

describe('a student claim, before the card has been seen', () => {
  it('holds: send the card, and do not transfer yet', async () => {
    const root = await renderClaim({
      ...PENDING, months: 6, amount_rial: 60_000_000,
      amount_confirmed_at: null, student_request: true,
    });

    const notice = root.querySelector('.dcp-bank .dcp-price-notice.is-warn')!;
    expect(notice.textContent).toContain('هنوز واریز نکنید');

    const steps = root.querySelector('.dcp-gift-steps')!.textContent!;
    expect(steps).toContain('کارت دانشجویی');
    // «do not transfer yet» is said ONCE, in the banner above — repeating it in
    // the steps was the same instruction printed twice.
    expect(notice.textContent).toContain('هنوز واریز نکنید');

    // The figure on screen is still the list price, and the banner says so once
    // — a student who transfers it has overpaid, which is the one mistake on
    // this rail that needs a refund to undo.
    expect(notice.textContent).toContain('قیمت لیست');
  });
});

describe('a student claim the founder has settled', () => {
  it('turns the page from «wait» to «transfer this»', async () => {
    const root = await renderClaim({
      ...PENDING, months: 6, amount_rial: 51_000_000,
      amount_confirmed_at: '2026-08-27T10:00:00.000Z', student_request: true,
    });

    expect(root.querySelector('.dcp-bank .dcp-price-notice.is-warn')).toBeNull();
    expect(root.querySelector('.dcp-bank .dcp-price-notice.is-ok')!.textContent)
      .toContain('مبلغ دانشجویی تأیید شد');

    const card = root.querySelector('.dcp-bank')!.textContent!;
    expect(card).not.toContain('قیمت لیست');
    expect(card).toContain('به شبای بالا بفرستید');
  });

  it('quotes the amount the claim carries, not the plan list price', async () => {
    const root = await renderClaim({
      ...PENDING, months: 6, amount_rial: 51_000_000,
      amount_confirmed_at: '2026-08-27T10:00:00.000Z', student_request: true,
    });
    // 6,000,000 toman less ٪۱۵, typed by the founder — and the page must never
    // quietly re-quote the list figure over it.
    expect(root.querySelector('.dcp-bank-plan')!.textContent).toContain('۵٬۱۰۰٬۰۰۰');
  });
});

/**
 * One pending claim per rail is the rule that stops a queue filling with
 * duplicates of the same person — and without a way out it was a trap. Press
 * «دریافت کد پیگیری» on a one-month plan to see what it does, and every later
 * attempt hands that claim back, at that price, until the founder rejects it
 * by hand.
 */
describe('a claim for a term the buyer is no longer looking at', () => {
  // The featured (and so selected) plan is the six-month one.
  const ONE_MONTH_CLAIM = {
    status: 'pending', reference: 'DC-KTP-RWQ', months: 1, amount_rial: 12_000_000,
    amount_confirmed_at: null, student_request: false,
  };

  it('says so, instead of looking like a button that does nothing', async () => {
    const root = await renderClaim(ONE_MONTH_CLAIM);
    const warn = root.querySelector('.dcp-bank .dcp-price-notice.is-warn')!;
    expect(warn.textContent).toContain('یک ماهه');
    expect(warn.textContent).toContain('شش ماهه');
  });

  it('offers the way out, and reopens the rail once it is taken', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const root = await renderClaim(ONE_MONTH_CLAIM);

    const cancel = root.querySelector('.dcp-bank-cancel') as HTMLButtonElement;
    expect(cancel).toBeTruthy();
    cancel.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(bankTransferCancel).toHaveBeenCalledWith('DC-KTP-RWQ');
    // Back to the card that opens a claim, for whatever they now want to buy.
    expect(root.querySelector('.dcp-bank-iban')).toBeTruthy();
    expect(root.querySelector('.dcp-gift-steps')).toBeNull();
    confirmSpy.mockRestore();
  });

  it('cancels nothing when the confirm is declined', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const root = await renderClaim(ONE_MONTH_CLAIM);
    (root.querySelector('.dcp-bank-cancel') as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 0));
    expect(bankTransferCancel).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('warns harder when a figure has already been announced', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const root = await renderClaim({
      ...PENDING, months: 6, amount_rial: 51_000_000,
      amount_confirmed_at: '2026-08-27T10:00:00.000Z', student_request: true,
    });
    (root.querySelector('.dcp-bank-cancel') as HTMLButtonElement).click();
    // Somebody may already have transferred against that figure.
    expect(confirmSpy.mock.calls[0][0]).toContain('اگر واریز کرده‌اید لغو نکنید');
    confirmSpy.mockRestore();
  });
});
