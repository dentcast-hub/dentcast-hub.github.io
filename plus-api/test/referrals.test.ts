// کد معرف (services/referrals.ts). Design ledger: .dentcast/referral-handoff.md.
// These tests pin the decisions the handoff locks: the code format, the
// first-purchase-only claim window, the referrer's credit existing ONLY once
// the referred account has actually paid, the flat ٪۱۰/٪۵ split, and that the
// per-purchase cap (CREDIT_CAP_PERCENT) still governs referral credits the
// same as every other source.
import crypto from 'node:crypto';
import { describe, it, expect, beforeEach, afterAll, vi, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs, sessionCookieFrom } from './helpers.js';
import { pool, withTransaction } from '../src/db.js';
import { startPayment, settlePayment } from '../src/services/payment.js';
import { availableCredits, creditPercent, discountedRial } from '../src/services/discount-credits.js';
import { normalizeCode, claimReferral, checkClaim } from '../src/services/referrals.js';
import { activateMonths } from '../src/services/subscription.js';
import { mergeProfiles } from '../src/services/merge-profiles.js';
import { config } from '../src/config.js';

let app: FastifyInstance;
let fetchMock: ReturnType<typeof vi.fn>;

const SIX_MONTH_RIAL = 60_000_000;

const REFERRER_PHONE = '09121780001';
const REFERRER2_PHONE = '09121780002';
const REFERRED_PHONE = '09121780003';
const REFERRED2_PHONE = '09121780004';
const REFERRED3_PHONE = '09121780005';
const BUYER_PHONE = '09121780006';
const DUPCODE_A_PHONE = '09121780061'; // ends 61, on purpose — see 'refuses a taken code'
const DUPCODE_B_PHONE = '09121790061'; // ditto
const MERGE_CODES_X_PHONE = '09121780007';
const MERGE_CODES_Y_PHONE = '09121780008';
const MERGE_REFD_X_PHONE = '09121780009';
const MERGE_REFD_Y_PHONE = '09121780010';
const MERGE_SELF_A_PHONE = '09121780011';
const MERGE_SELF_B_PHONE = '09121780012';

function gatewayReplies(...bodies: unknown[]): void {
  for (const body of bodies) {
    fetchMock.mockResolvedValueOnce({ status: 200, json: async () => body } as unknown as Response);
  }
}
let trk = 0;
const nextRequestOk = () => { trk += 1; return { result: 100, trackId: `TRK-REF-${trk}` }; };
// `amount` must echo what this specific payment was actually charged — a
// discounted purchase quoting the full list price here trips settlePayment's
// own amount-mismatch guard (payment.ts's rule 2: "a subscription bought at
// the wrong price").
const verifyOk = (refId: string, amountRial: number) =>
  ({ result: 100, status: 1, amount: amountRial, refNumber: refId });

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  config.payments.enabled = true;
  trk = 0;
});
afterEach(() => vi.unstubAllGlobals());
afterAll(async () => { await app?.close(); await pool.end(); });

async function userId(cookie: string): Promise<string> {
  const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
  return me.json().id;
}

// Log in via Telegram (creates a PHONE-LESS account) — same helper shape as
// phone-link.test.ts's own telegramLogin, needed here for decision 2.8's own
// test: a Telegram-first account still mints a code, with random digits.
const BOT_TOKEN = '123456:TEST-telegram-bot-token';
function sign(fields: Record<string, string>): string {
  const dcs = Object.keys(fields)
    .filter((k) => k !== 'hash').sort().map((k) => `${k}=${fields[k]}`).join('\n');
  const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  return crypto.createHmac('sha256', secret).update(dcs).digest('hex');
}
async function telegramLogin(id: string): Promise<string> {
  const base = { id, first_name: 'Tg', username: 'tg_' + id, auth_date: String(Math.floor(Date.now() / 1000)) };
  const qs = new URLSearchParams({ origin: 'http://localhost:5500', ...base, hash: sign(base) });
  const res = await app.inject({ method: 'GET', url: `/auth/telegram/callback?${qs.toString()}` });
  const cookie = sessionCookieFrom(res);
  if (!cookie) throw new Error('telegram login set no cookie');
  return cookie;
}

async function mintCodeVia(cookie: string, alias: string): Promise<string> {
  const res = await app.inject({
    method: 'POST', url: '/referral', headers: { cookie }, payload: { alias },
  });
  expect(res.statusCode).toBe(200);
  return res.json().code as string;
}

async function seedPaid(uid: string, orderId: string): Promise<void> {
  await pool.query(
    `insert into payments (user_id, amount_rial, months, gateway, ref_id, order_id, status,
                           verified_at, period_jalali, period_gregorian)
     values ($1, $2, 6, 'zibal', $3, $3, 'paid', now(), to_char(now(),'YYYY-MM'), to_char(now(),'YYYY-MM'))`,
    [uid, SIX_MONTH_RIAL, orderId],
  );
}

/* -------------------------------------------------------------- normalizeCode */

describe('normalizeCode', () => {
  it('folds Persian digits, strips whitespace/ZWNJ, lowercases', () => {
    expect(normalizeCode(' DENS۶۱ ')).toBe('dens61');
    expect(normalizeCode('den‌s61')).toBe('dens61');
  });
});

/* ------------------------------------------------------------------ mintCode */

describe('POST /referral — mintCode', () => {
  it('appends the last two digits of the phone; a phone-less account still gets a code', async () => {
    const cookie = await loginAs(app, REFERRER_PHONE);
    const code = await mintCodeVia(cookie, 'dentmaster');
    expect(code).toBe('dentmaster' + REFERRER_PHONE.slice(-2));

    const tgCookie = await telegramLogin('55501');
    const tgCode = await mintCodeVia(tgCookie, 'noph');
    expect(tgCode).toMatch(/^noph\d{2}$/);
  });

  it('refuses a bad alias (short, digits, Persian) and a code already taken', async () => {
    const cookie = await loginAs(app, REFERRER_PHONE);
    for (const alias of ['abc', 'abcd1', 'یسیسی', 'a'.repeat(17)]) {
      const res = await app.inject({
        method: 'POST', url: '/referral', headers: { cookie }, payload: { alias },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('bad_alias');
    }

    // Same alias + same trailing two digits (both phones end in 61) collide
    // on the whole CODE, exactly as decision 2.9 requires.
    const cookieA = await loginAs(app, DUPCODE_A_PHONE);
    await mintCodeVia(cookieA, 'sharedname');
    const cookieB = await loginAs(app, DUPCODE_B_PHONE);
    const dup = await app.inject({
      method: 'POST', url: '/referral', headers: { cookie: cookieB }, payload: { alias: 'sharedname' },
    });
    expect(dup.statusCode).toBe(400);
    expect(dup.json().error).toBe('code_taken');
  });

  it('refuses a second code for the same account (decision 2.7 — permanent)', async () => {
    const cookie = await loginAs(app, REFERRER_PHONE);
    await mintCodeVia(cookie, 'firstone');
    const res = await app.inject({
      method: 'POST', url: '/referral', headers: { cookie }, payload: { alias: 'secondone' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('already_has_code');
  });
});

/* -------------------------------------------------------------- checkClaim */

describe('GET /referral/check — checkClaim', () => {
  it('refuses own code, an already-purchased account, and a second code for an already-referred account', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');

    const ownCheck = await app.inject({
      method: 'GET', url: `/referral/check?code=${code}`, headers: { cookie: referrerCookie },
    });
    expect(ownCheck.json()).toMatchObject({ ok: false, reason: 'own_code' });

    const buyerCookie = await loginAs(app, BUYER_PHONE);
    const buyerId = await userId(buyerCookie);
    await seedPaid(buyerId, 'sub6_buyer');
    const purchasedCheck = await app.inject({
      method: 'GET', url: `/referral/check?code=${code}`, headers: { cookie: buyerCookie },
    });
    expect(purchasedCheck.json()).toMatchObject({ ok: false, reason: 'already_purchased' });

    const referredCookie = await loginAs(app, REFERRED_PHONE);
    const referredId = await userId(referredCookie);
    expect((await claimReferral(referredId, code)).ok).toBe(true);

    const referrer2Cookie = await loginAs(app, REFERRER2_PHONE);
    const code2 = await mintCodeVia(referrer2Cookie, 'otherone');
    const secondClaim = await app.inject({
      method: 'GET', url: `/referral/check?code=${code2}`, headers: { cookie: referredCookie },
    });
    expect(secondClaim.json()).toMatchObject({ ok: false, reason: 'already_referred' });
  });

  // The two rules the founder asked to see proved end-to-end (2026-08-13),
  // rather than at the checkClaim level alone: a code is ONE-TIME for whoever
  // spends it, and it is for a FIRST subscription only.
  it('a code is spent once and for all: after the referred purchase settles, no code works again', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');

    const buyerCookie = await loginAs(app, REFERRED_PHONE);
    const buyerId = await userId(buyerCookie);

    // Month one: the code works and takes ٪۱۰ off.
    const track = nextRequestOk();
    gatewayReplies(track);
    const first = await startPayment({ userId: buyerId, months: 6, referralCode: code });
    expect(first.payment!.amount_rial).toBe(discountedRial(SIX_MONTH_RIAL, 10));
    gatewayReplies(verifyOk(track.trackId, first.payment!.amount_rial));
    expect((await settlePayment(first.payment!.ref_id!)).outcome).toBe('activated');

    // Month two: neither a DIFFERENT code nor the SAME one is accepted...
    const other = await mintCodeVia(await loginAs(app, REFERRER2_PHONE), 'otherone');
    for (const c of [other, code]) {
      const res = await app.inject({
        method: 'GET', url: `/referral/check?code=${c}`, headers: { cookie: buyerCookie },
      });
      expect(res.json()).toMatchObject({ ok: false, reason: 'already_referred' });
    }
    // ...and POST /pay/start refuses it outright rather than quietly selling at
    // list price, so the buyer is told instead of wondering.
    const retry = await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie: buyerCookie },
      payload: { months: 6, referral_code: other },
    });
    expect(retry.statusCode).toBe(400);

    // And the credit itself is gone: the renewal carries no referral money.
    // (It is ٪۲۰ below list because this first-ever payer took a «ستون» seat —
    // that discount is permanent and has nothing to do with the referral.)
    const track2 = nextRequestOk();
    gatewayReplies(track2);
    const second = await startPayment({ userId: buyerId, months: 6 });
    expect(second.payment!.amount_rial).toBe(discountedRial(SIX_MONTH_RIAL, 20));
  });

  // The hole this test was written for: `payments` is the one table a MANUAL
  // sale never writes, so an account that had already bought six months by
  // واریز به شبا or gift card read as brand new and got the newcomer's ٪۱۰ on
  // its second subscription.
  it.each([
    ['bank_transfer', 'DC-AAA-BBB'],
    ['apple_us', 'DC-CCC-DDD'],
  ])('refuses an account that already subscribed by %s', async (kind, reference) => {
    const code = await mintCodeVia(await loginAs(app, REFERRER_PHONE), 'dentmaster');
    const buyerId = await userId(await loginAs(app, REFERRED2_PHONE));
    await pool.query(
      `insert into gift_redemptions (user_id, reference, kind, months, status, reviewed_at)
       values ($1, $2, $3, 6, 'approved', now())`,
      [buyerId, reference, kind],
    );
    expect(await checkClaim(buyerId, code)).toMatchObject({ reason: 'already_purchased' });
  });

  it('still welcomes an account whose premium was FREE — a league prize or an admin gift', async () => {
    const code = await mintCodeVia(await loginAs(app, REFERRER_PHONE), 'dentmaster');
    const buyerId = await userId(await loginAs(app, REFERRED3_PHONE));
    // What activateMonths(source:'admin'|'prize') leaves behind, and nothing
    // else: no money anywhere. Blocking these would spend the referral
    // eligibility of exactly the reader this program exists to convert.
    await activateMonths(buyerId, 6, { source: 'admin' });
    expect(await checkClaim(buyerId, code)).toMatchObject({ ok: true });
  });

  it('a pending or rejected manual claim is not a purchase', async () => {
    const code = await mintCodeVia(await loginAs(app, REFERRER_PHONE), 'dentmaster');
    const buyerId = await userId(await loginAs(app, REFERRED_PHONE));
    await pool.query(
      `insert into gift_redemptions (user_id, reference, kind, months, status)
       values ($1, 'DC-EEE-FFF', 'bank_transfer', 6, 'pending')`,
      [buyerId],
    );
    expect(await checkClaim(buyerId, code)).toMatchObject({ ok: true });

    await pool.query("update gift_redemptions set status = 'rejected' where user_id = $1", [buyerId]);
    expect(await checkClaim(buyerId, code)).toMatchObject({ ok: true });
  });
});

/* -------------------------------------------------------- the till (payment) */

describe('startPayment with a referral code', () => {
  it('discounts the referred account’s first purchase by ٪۱۰, and stamps the row', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');
    const referredCookie = await loginAs(app, REFERRED_PHONE);
    const referredId = await userId(referredCookie);

    gatewayReplies(nextRequestOk());
    const r = await startPayment({ userId: referredId, months: 6, referralCode: code });
    expect(r.ok).toBe(true);
    expect(r.payment!.amount_rial).toBe(discountedRial(SIX_MONTH_RIAL, 10));

    const row = (await pool.query(
      'select referred_percent, referrer_percent from referrals where referred_user_id = $1', [referredId],
    )).rows[0];
    expect(row).toEqual({ referred_percent: 10, referrer_percent: 5 });
  });

  it('rejects an invalid referral code as a 400, before touching the gateway', async () => {
    const referredCookie = await loginAs(app, REFERRED_PHONE);
    const res = await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie: referredCookie },
      payload: { months: 6, referral_code: 'nosuchcode99' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('referral');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('gives the referrer nothing until the referred account actually pays, then ٪۵', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const referrerId = await userId(referrerCookie);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');
    const referredCookie = await loginAs(app, REFERRED_PHONE);
    const referredId = await userId(referredCookie);

    const track = nextRequestOk();
    gatewayReplies(track);
    const start = await startPayment({ userId: referredId, months: 6, referralCode: code });
    expect(start.ok).toBe(true);

    // Claimed, but not yet paid: the referrer's ٪۵ does not exist yet
    // (decision 2.4 — the sole anti-farming rule).
    expect(await availableCredits(referrerId)).toHaveLength(0);

    gatewayReplies(verifyOk(track.trackId, start.payment!.amount_rial));
    const settled = await settlePayment(start.payment!.ref_id!);
    expect(settled.outcome).toBe('activated');

    const referrerCredits = await availableCredits(referrerId);
    expect(referrerCredits).toHaveLength(1);
    expect(referrerCredits[0]).toMatchObject({ percent: 5, kind: 'referral' });
  });

  it('banks ٪۱۵ across three settled referrals, but one purchase only spends the ٪۱۰ cap', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const referrerId = await userId(referrerCookie);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');

    for (const phone of [REFERRED_PHONE, REFERRED2_PHONE, REFERRED3_PHONE]) {
      const cookie = await loginAs(app, phone);
      const uid = await userId(cookie);
      const track = nextRequestOk();
      gatewayReplies(track);
      const start = await startPayment({ userId: uid, months: 6, referralCode: code });
      expect(start.ok).toBe(true);
      gatewayReplies(verifyOk(track.trackId, start.payment!.amount_rial));
      expect((await settlePayment(start.payment!.ref_id!)).outcome).toBe('activated');
    }

    // All three banked: ٪۱۵ ready.
    expect(creditPercent(await availableCredits(referrerId))).toBe(15);

    // The referrer buys for themself: only ٪۱۰ of it (two of the three ٪۵
    // credits) prices this purchase — atomic, never sliced.
    const track = nextRequestOk();
    gatewayReplies(track);
    const own = await startPayment({ userId: referrerId, months: 6 });
    expect(own.payment!.amount_rial).toBe(discountedRial(SIX_MONTH_RIAL, 10));

    // The third ٪۵ survives, untouched, for next time.
    expect(creditPercent(await availableCredits(referrerId))).toBe(5);
  });

  it('stacks a «ستون» seat’s ٪۲۰ ON TOP of the referral credit cap: ٪۳۰', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const referrerId = await userId(referrerCookie);
    // A prior paid gateway row is the seat — derived, never written.
    await seedPaid(referrerId, 'sub6_seat');
    const code = await mintCodeVia(referrerCookie, 'dentmaster');

    for (const phone of [REFERRED_PHONE, REFERRED2_PHONE]) {
      const cookie = await loginAs(app, phone);
      const uid = await userId(cookie);
      const track = nextRequestOk();
      gatewayReplies(track);
      const start = await startPayment({ userId: uid, months: 6, referralCode: code });
      gatewayReplies(verifyOk(track.trackId, start.payment!.amount_rial));
      expect((await settlePayment(start.payment!.ref_id!)).outcome).toBe('activated');
    }
    expect(creditPercent(await availableCredits(referrerId))).toBe(10); // exactly the cap

    const track = nextRequestOk();
    gatewayReplies(track);
    const r = await startPayment({ userId: referrerId, months: 6 });
    expect(r.payment!.amount_rial).toBe(discountedRial(SIX_MONTH_RIAL, 30));
  });

  it('an abandoned payment releases the claimed discount for the next attempt', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');
    const referredCookie = await loginAs(app, REFERRED_PHONE);
    const referredId = await userId(referredCookie);

    gatewayReplies({ result: 102, message: 'nope' }); // the gateway request itself fails
    const r1 = await startPayment({ userId: referredId, months: 6, referralCode: code });
    expect(r1.ok).toBe(false);

    // The claim itself is NOT rolled back — it lives outside the payment
    // transaction (decision 2.2/section 7): the account is still referred.
    const referredRow = await pool.query(
      'select 1 as x from referrals where referred_user_id = $1', [referredId],
    );
    expect(referredRow.rows).toHaveLength(1);

    // No code needed this time — the row already exists, and the credit
    // engine's usual release-on-failure rule (discount-redemptions joined to
    // a 'failed' payment) applies to it exactly like any other credit.
    gatewayReplies(nextRequestOk());
    const r2 = await startPayment({ userId: referredId, months: 6 });
    expect(r2.ok).toBe(true);
    expect(r2.payment!.amount_rial).toBe(discountedRial(SIX_MONTH_RIAL, 10));
  });
});

/* --------------------------------------------------------------- surfaces */

describe('GET /pay/plans?ref=', () => {
  it('previews the referred price without writing a referrals row', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');
    const referredCookie = await loginAs(app, REFERRED_PHONE);

    const res = await app.inject({
      method: 'GET', url: `/pay/plans?ref=${code}`, headers: { cookie: referredCookie },
    });
    const body = res.json();
    expect(body.referral).toEqual({ code, percent: 10 });
    const six = body.plans.find((p: { months: number }) => p.months === 6);
    expect(six.amount_rial).toBe(discountedRial(SIX_MONTH_RIAL, 10));

    const count = await pool.query('select count(*)::int as n from referrals');
    expect(count.rows[0].n).toBe(0);
  });

  it('ignores ?ref= for a signed-out visitor (decision 2.15 — no code enumeration)', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');
    const res = await app.inject({ method: 'GET', url: `/pay/plans?ref=${code}` });
    expect(res.json().referral).toBeNull();
  });
});

describe('next_purchase_percent parity', () => {
  it('agrees between GET /achievements and GET /pay/plans', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const referrerId = await userId(referrerCookie);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');

    for (const phone of [REFERRED_PHONE, REFERRED2_PHONE]) {
      const cookie = await loginAs(app, phone);
      const uid = await userId(cookie);
      const track = nextRequestOk();
      gatewayReplies(track);
      const start = await startPayment({ userId: uid, months: 6, referralCode: code });
      gatewayReplies(verifyOk(track.trackId, start.payment!.amount_rial));
      expect((await settlePayment(start.payment!.ref_id!)).outcome).toBe('activated');
    }

    const ach = await app.inject({ method: 'GET', url: '/achievements', headers: { cookie: referrerCookie } });
    const plans = await app.inject({ method: 'GET', url: '/pay/plans', headers: { cookie: referrerCookie } });
    expect(ach.json().discount.next_purchase_percent).toBe(plans.json().onetime_discount.percent);
  });
});

/* ------------------------------------------ کد معرف on the bank-transfer rail */

// Founder's call, 2026-08-13: there is no gateway on this rail to apply a
// percentage later, so the figure the buyer is told to transfer has to BE the
// discounted one — a buyer who sends the list price has simply overpaid, and
// getting it back is a conversation. The referrer collects their ٪۵ on
// approval, same as the gateway.
describe('POST /pay/bank-transfer with a referral code', () => {
  const claimBank = (cookie: string, body: Record<string, unknown>) => app.inject({
    method: 'POST', url: '/pay/bank-transfer', headers: { cookie }, payload: { months: 6, ...body },
  });
  const approve = (reference: string) =>
    pool.query(
      "update gift_redemptions set status = 'approved', reviewed_at = now() where reference = $1",
      [reference],
    );

  it('quotes the DISCOUNTED amount, and hands back the list price beside it', async () => {
    const code = await mintCodeVia(await loginAs(app, REFERRER_PHONE), 'dentmaster');
    const buyerCookie = await loginAs(app, REFERRED_PHONE);

    const res = await claimBank(buyerCookie, { referral_code: code });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      amount_rial: discountedRial(SIX_MONTH_RIAL, 10),
      list_amount_rial: SIX_MONTH_RIAL,
      referral_applied: true,
    });

    // ...and the returning buyer sees the same figure, not the list one.
    const back = await app.inject({
      method: 'GET', url: '/pay/bank-transfer', headers: { cookie: buyerCookie },
    });
    expect(back.json().redemption).toMatchObject({
      amount_rial: discountedRial(SIX_MONTH_RIAL, 10), referral_applied: true,
    });
  });

  it('without a code, nothing changes', async () => {
    const res = await claimBank(await loginAs(app, REFERRED_PHONE), {});
    expect(res.json()).toMatchObject({ amount_rial: SIX_MONTH_RIAL, referral_applied: false });
  });

  it('refuses an invalid code as a 400 instead of opening a full-price claim', async () => {
    const buyerCookie = await loginAs(app, REFERRED_PHONE);
    const res = await claimBank(buyerCookie, { referral_code: 'nosuchcode99' });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: 'referral', reason: 'unknown_code' });
    const rows = await pool.query('select count(*)::int as n from gift_redemptions');
    expect(rows.rows[0].n).toBe(0);
  });

  it('pays the referrer their ٪۵ once the transfer is APPROVED, and not before', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const referrerId = await userId(referrerCookie);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');

    const res = await claimBank(await loginAs(app, REFERRED_PHONE), { referral_code: code });
    // A claim in the queue is not money yet.
    expect(creditPercent(await availableCredits(referrerId))).toBe(0);

    await approve(res.json().reference);
    expect(creditPercent(await availableCredits(referrerId))).toBe(5);
  });

  // The double-dip this rail could not otherwise close: discount_redemptions
  // needs a payments row, and a bank transfer never writes one, so without
  // gift_redemptions.referral_id the ٪۱۰ would come off the transfer AND still
  // be sitting unspent for the buyer's next gateway purchase.
  it('holds the ٪۱۰ while the claim lives, and releases it if the claim is rejected', async () => {
    const code = await mintCodeVia(await loginAs(app, REFERRER_PHONE), 'dentmaster');
    const buyerCookie = await loginAs(app, REFERRED_PHONE);
    const buyerId = await userId(buyerCookie);

    const res = await claimBank(buyerCookie, { referral_code: code });
    expect(creditPercent(await availableCredits(buyerId))).toBe(0); // held by the pending claim

    await approve(res.json().reference);
    expect(creditPercent(await availableCredits(buyerId))).toBe(0); // spent for good

    await pool.query(
      "update gift_redemptions set status = 'rejected' where reference = $1",
      [res.json().reference],
    );
    // A sale that never happened must not cost the buyer their one-time ٪۱۰.
    expect(creditPercent(await availableCredits(buyerId))).toBe(10);
  });
});

/* ------------------------------------------------------- GET /referral stats */

// Founder report, 2026-08-13: the profile kept promising the full ٪۱۰ after it
// had already been spent. referralStats() summed every qualified
// `referrer_percent` and reported `min(that, cap)` — the total ever EARNED —
// while /pay/plans read through availableCredits()' `spentSources` filter and
// quoted the truth. Two screens, two numbers, one account.
describe('GET /referral — earned vs spent vs available', () => {
  /** Give `code`'s owner one settled ٪۵ by having `phone` buy with it. */
  async function referAndBuy(phone: string, code: string): Promise<void> {
    const cookie = await loginAs(app, phone);
    const uid = await userId(cookie);
    const track = nextRequestOk();
    gatewayReplies(track);
    const start = await startPayment({ userId: uid, months: 6, referralCode: code });
    gatewayReplies(verifyOk(track.trackId, start.payment!.amount_rial));
    expect((await settlePayment(start.payment!.ref_id!)).outcome).toBe('activated');
  }
  const stats = async (cookie: string) =>
    (await app.inject({ method: 'GET', url: '/referral', headers: { cookie } })).json();

  it('closes the books: earned = spent + available, and the next purchase reads the remainder', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const referrerId = await userId(referrerCookie);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');

    await referAndBuy(REFERRED_PHONE, code);
    await referAndBuy(REFERRED2_PHONE, code);

    const before = await stats(referrerCookie);
    expect(before).toMatchObject({
      used_count: 2, purchased_count: 2,
      earned_percent: 10, spent_percent: 0, available_percent: 10, next_purchase_percent: 10,
    });

    // The referrer now buys, consuming both ٪۵ credits.
    const track = nextRequestOk();
    gatewayReplies(track);
    const own = await startPayment({ userId: referrerId, months: 6 });
    expect(own.payment!.amount_rial).toBe(discountedRial(SIX_MONTH_RIAL, 10));
    gatewayReplies(verifyOk(track.trackId, own.payment!.amount_rial));
    expect((await settlePayment(own.payment!.ref_id!)).outcome).toBe('activated');

    const after = await stats(referrerCookie);
    expect(after).toMatchObject({
      earned_percent: 10,        // what the code has ever been worth — never walks back
      spent_percent: 10,         // ...and all of it is now gone
      available_percent: 0,
      next_purchase_percent: 0,  // the bug: this used to still say ٪۱۰
    });
    // And it agrees with the till, which is the whole point.
    const plans = await app.inject({ method: 'GET', url: '/pay/plans', headers: { cookie: referrerCookie } });
    expect(plans.json().onetime_discount).toBeNull();
  });

  it('a referral that never paid earns nothing (decision 2.4)', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');
    const referredCookie = await loginAs(app, REFERRED_PHONE);
    await claimReferral(await userId(referredCookie), code);

    expect(await stats(referrerCookie)).toMatchObject({
      used_count: 1, purchased_count: 0,
      earned_percent: 0, spent_percent: 0, available_percent: 0, next_purchase_percent: 0,
    });
  });

  it('a pending purchase HOLDS the credit, and a failed one releases it', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const referrerId = await userId(referrerCookie);
    const code = await mintCodeVia(referrerCookie, 'dentmaster');
    await referAndBuy(REFERRED_PHONE, code);
    expect((await stats(referrerCookie)).available_percent).toBe(5);

    // Open a payment of their own: the ٪۵ is now held by a pending row, so it
    // must read as spent — the same definition availableCredits() uses, which
    // is what keeps this page and the pricing page from disagreeing.
    const track = nextRequestOk();
    gatewayReplies(track);
    const own = await startPayment({ userId: referrerId, months: 6 });
    expect((await stats(referrerCookie)).available_percent).toBe(0);

    // Abandon it. Spent-ness is a join on payment status, so the credit comes
    // back with no cleanup path to forget.
    await pool.query("update payments set status = 'failed' where id = $1", [own.payment!.id]);
    expect(await stats(referrerCookie)).toMatchObject({
      spent_percent: 0, available_percent: 5, next_purchase_percent: 5,
    });
  });
});

/* ---------------------------------------------------------------- mergeProfiles */

describe('mergeProfiles — the three referral cases (handoff section 10)', () => {
  const merge = (fromId: string, toId: string) =>
    withTransaction((client) => mergeProfiles(client, fromId, toId));

  it('resolves a referral_codes collision (both accounts minted one)', async () => {
    const c1 = await loginAs(app, MERGE_CODES_X_PHONE);
    const c2 = await loginAs(app, MERGE_CODES_Y_PHONE);
    const id1 = await userId(c1);
    const id2 = await userId(c2);
    await mintCodeVia(c1, 'firstacc');
    await mintCodeVia(c2, 'secondacc');

    await expect(merge(id1, id2)).resolves.not.toThrow();

    const remaining = await pool.query('select user_id from referral_codes');
    expect(remaining.rows).toEqual([{ user_id: id2 }]);
    const gone = await pool.query('select 1 as x from profiles where id = $1', [id1]);
    expect(gone.rows).toHaveLength(0);
  });

  it('resolves a referrals.referred_user_id collision (both accounts were referred)', async () => {
    const referrerCookie = await loginAs(app, REFERRER_PHONE);
    const referrerId = await userId(referrerCookie);
    const code = await mintCodeVia(referrerCookie, 'thirdparty');

    const c1 = await loginAs(app, MERGE_REFD_X_PHONE);
    const c2 = await loginAs(app, MERGE_REFD_Y_PHONE);
    const id1 = await userId(c1);
    const id2 = await userId(c2);
    expect((await claimReferral(id1, code)).ok).toBe(true);
    expect((await claimReferral(id2, code)).ok).toBe(true);

    await expect(merge(id1, id2)).resolves.not.toThrow();

    const rows = await pool.query('select referred_user_id, referrer_user_id from referrals');
    expect(rows.rows).toEqual([{ referred_user_id: id2, referrer_user_id: referrerId }]);
  });

  it('removes a would-be self-referral instead of violating the check constraint', async () => {
    const c1 = await loginAs(app, MERGE_SELF_A_PHONE);
    const id1 = await userId(c1);
    const code = await mintCodeVia(c1, 'selfmerge');

    const c2 = await loginAs(app, MERGE_SELF_B_PHONE);
    const id2 = await userId(c2);
    expect((await claimReferral(id2, code)).ok).toBe(true);

    // id1 (about to be merged AWAY) is id2's referrer — repointing either
    // column naively would make id2 refer itself.
    await expect(merge(id1, id2)).resolves.not.toThrow();

    const rows = await pool.query('select * from referrals');
    expect(rows.rows).toHaveLength(0);
    const remaining = await pool.query('select id from profiles');
    expect(remaining.rows.map((r) => r.id)).toEqual([id2]);
  });
});
