// @vitest-environment jsdom
/**
 * The buyer's own view of a واریز به شبا claim, in the two states that decide
 * whether they transfer money or sit still.
 *
 * The page tells them to agree the amount with support before transferring —
 * which is right; the one mistake on this rail costs real money and needs a
 * refund to undo. But until migration 0050 the screen had no way to ever stop
 * saying wait: its fine print («تا وقتی پشتیبانی مبلغ را تأیید نکرده…») was
 * keyed on nothing, so it stood there after the founder had settled the figure
 * exactly as it did before. Both sides then waited for the other and the queue
 * filled with claims no deposit was ever coming for (production, 1405/06/05).
 *
 * Rendered against the REAL module, because the sentence a buyer obeys is the
 * one in the DOM.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const payPlans = vi.fn();
const bankTransferStatus = vi.fn();
let viewer: unknown = null;

vi.mock('../../plus/js/api.js', () => ({
  api: {
    payPlans: (...a: unknown[]) => payPlans(...a),
    payStart: vi.fn(),
    bankTransferStart: vi.fn(),
    bankTransferStatus: () => bankTransferStatus(),
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

describe('a claim whose amount nobody has settled yet', () => {
  it('says the figure is not final and tells them not to transfer', async () => {
    const root = await renderClaim({ ...PENDING, amount_confirmed_at: null });
    const fine = root.querySelector('.dcp-bank .dcp-price-fine')!.textContent!;

    expect(fine).toContain('هنوز واریز نکنید');
    expect(fine).toContain('قیمت لیست');
    // Coordination is step one, not a footnote.
    expect(root.querySelector('.dcp-gift-steps')!.textContent).toContain('هماهنگ');
    expect(root.querySelector('.dcp-bank .dcp-price-notice.is-ok')).toBeNull();
  });
});

describe('a claim the founder has settled', () => {
  it('turns the page from «wait» to «transfer this»', async () => {
    const root = await renderClaim({
      ...PENDING, amount_confirmed_at: '2026-08-27T10:00:00.000Z',
    });

    const notice = root.querySelector('.dcp-bank .dcp-price-notice.is-ok')!;
    expect(notice.textContent).toContain('مبلغ تأیید شد');

    const fine = root.querySelector('.dcp-bank .dcp-price-fine')!.textContent!;
    expect(fine).toContain('همین را واریز کنید');
    expect(fine).not.toContain('هنوز واریز نکنید');

    // Step one is no longer «go and ask» — it is «send exactly this».
    const steps = root.querySelector('.dcp-gift-steps')!.textContent!;
    expect(steps).toContain('مبلغ دیگری نفرستید');
    // …and the reference still has to reach the transfer's «بابت» field, or
    // the deposit arrives with nothing tying it to this claim.
    expect(steps).toContain('DC-KTP-RWQ');
  });

  it('still quotes the amount the claim carries, not the plan list price', async () => {
    const root = await renderClaim({
      ...PENDING, amount_rial: 28_050_000, amount_confirmed_at: '2026-08-27T10:00:00.000Z',
    });
    // The student price the founder typed — 33,000,000 × ٪85 — and the page
    // must never quietly re-quote the list figure over it.
    expect(root.querySelector('.dcp-bank-plan')!.textContent).toContain('۲٬۸۰۵٬۰۰۰');
  });
});
