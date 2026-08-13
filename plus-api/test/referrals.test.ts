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
import { normalizeCode, claimReferral } from '../src/services/referrals.js';
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
