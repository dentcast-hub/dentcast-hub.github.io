// One-time discount credits — «ارزش مادی نشان‌ها» and the generic engine
// behind it (services/discount-credits.ts). The properties pinned here are the
// ones that guard the money:
//
//   the cap is a hard ceiling and a credit is atomic (skipped, never sliced),
//   a credit consumed by a pending/paid payment cannot price a second purchase,
//   a failed payment releases its credits with no cleanup path,
//   badge credits are DERIVED (silver/gold only — a bronze mints nothing),
//   and the «ستون» percent stacks on top of the cap instead of eating it.
import { describe, it, expect, beforeEach, afterAll, vi, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { startPayment, settlePayment } from '../src/services/payment.js';
import {
  availableCredits, pickCredits, creditPercent, discountedRial, CREDIT_CAP_PERCENT,
  type DiscountCredit,
} from '../src/services/discount-credits.js';
import { config } from '../src/config.js';

let app: FastifyInstance;
let fetchMock: ReturnType<typeof vi.fn>;

const PHONE = '09121710001';
const SIX_MONTH_RIAL = 60_000_000;

function gatewayReplies(...bodies: unknown[]): void {
  for (const body of bodies) {
    fetchMock.mockResolvedValueOnce({ status: 200, json: async () => body } as unknown as Response);
  }
}
const REQUEST_OK = { result: 100, trackId: 'TRK-D1' };

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  config.payments.enabled = true;
});
afterEach(() => vi.unstubAllGlobals());
afterAll(async () => { await app?.close(); await pool.end(); });

async function userId(cookie: string): Promise<string> {
  const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
  return me.json().id;
}

async function grant(uid: string, percent: number, label = 'هدیه', expiresAt?: string): Promise<void> {
  await pool.query(
    'insert into discount_grants (user_id, percent, label_fa, expires_at) values ($1, $2, $3, $4)',
    [uid, percent, label, expiresAt ?? null],
  );
}

/* ------------------------------------------------------- pure invariants -- */

describe('pickCredits — the cap', () => {
  const c = (source: string, percent: number): DiscountCredit =>
    ({ source, percent, label_fa: source, kind: 'grant' });

  it('fills up to the cap and never past it', () => {
    const picked = pickCredits([c('a', 3), c('b', 3), c('c', 3), c('d', 3)]);
    expect(creditPercent(picked)).toBe(9); // a fourth 3 would cross 10
    expect(picked).toHaveLength(3);
  });

  it('skips a credit that does not fit but keeps taking smaller ones — atomic, never sliced', () => {
    const picked = pickCredits([c('a', 8), c('b', 4), c('c', 2)]);
    expect(picked.map((x) => x.source)).toEqual(['a', 'c']); // 8 + 2 = 10; the 4 waits
    expect(creditPercent(picked)).toBe(10);
  });

  it('is deterministic for equal percents (source tie-break upstream)', () => {
    const picked = pickCredits([c('b', 5), c('a', 5), c('c', 5)]);
    expect(creditPercent(picked)).toBe(10);
  });
});

describe('discountedRial — rounding only ever favours the customer', () => {
  it('floors to a whole 10,000 rial', () => {
    // 60M at 9% off = 54.6M — already whole; at 7% = 55.8M — whole; at 1% on a
    // ragged base: 12,345,678 * .99 = 12,222,221.22 -> 12,220,000.
    expect(discountedRial(60_000_000, 9)).toBe(54_600_000);
    expect(discountedRial(12_345_678, 1)).toBe(12_220_000);
  });
  it('is the identity at zero percent and never returns less than 10,000', () => {
    expect(discountedRial(60_000_000, 0)).toBe(60_000_000);
    expect(discountedRial(20_000, 99)).toBe(10_000);
  });
});

/* ---------------------------------------------------- derivation & spend -- */

describe('availableCredits', () => {
  it('derives a badge credit from silver on, and never from bronze', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);

    // One highlight = «قلم» bronze. Bronze mints nothing.
    await pool.query(
      "insert into highlights (user_id, content_id, exact) values ($1, 'c/x0', 'h')", [uid],
    );
    expect((await availableCredits(uid)).some((c) => c.source.startsWith('badge:quill'))).toBe(false);

    // Fifty = «قلم» silver -> one 1% credit, named by the badge.
    for (let i = 1; i < 50; i += 1) {
      await pool.query(
        `insert into highlights (user_id, content_id, exact) values ($1, 'c/x${i}', 'h')`, [uid],
      );
    }
    const credits = await availableCredits(uid);
    const quill = credits.find((c) => c.source === 'badge:quill:silver');
    expect(quill).toMatchObject({ percent: 1, kind: 'badge', label_fa: 'قلم' });
  });

  it('includes unexpired grants and excludes expired ones', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await grant(uid, 5, 'تولد');
    await grant(uid, 7, 'قدیمی', new Date(Date.now() - 1000).toISOString());
    const credits = await availableCredits(uid);
    expect(credits.map((c) => c.percent)).toEqual([5]);
  });
});

/* ------------------------------------------------------------ the till ---- */

describe('startPayment with credits', () => {
  it('prices the purchase down, records the redemption, and marks the credit spent', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await grant(uid, 5, 'تولد');
    gatewayReplies(REQUEST_OK);

    const r = await startPayment({ userId: uid, months: 6 });
    expect(r.ok).toBe(true);
    expect(r.payment!.amount_rial).toBe(57_000_000); // 60M − 5%

    const red = await pool.query(
      'select source, percent from discount_redemptions where user_id = $1', [uid],
    );
    expect(red.rows).toHaveLength(1);
    expect(red.rows[0].percent).toBe(5);

    // Held by the pending payment: a second purchase opened now sees nothing.
    expect(await availableCredits(uid)).toHaveLength(0);
  });

  it('caps the applied credits at ten percent of one purchase', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    for (const p of [3, 3, 3, 3]) await grant(uid, p, 'عیدی');
    gatewayReplies(REQUEST_OK);

    const r = await startPayment({ userId: uid, months: 6 });
    expect(r.payment!.amount_rial).toBe(54_600_000); // 60M − 9% (3+3+3; the fourth waits)

    const left = await availableCredits(uid);
    expect(creditPercent(left)).toBe(3); // the unfitting credit was NOT consumed
  });

  it('releases the credits of a payment the gateway refused', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await grant(uid, 5, 'تولد');
    gatewayReplies({ result: 102, message: 'nope' }); // request fails -> row marked failed

    const r = await startPayment({ userId: uid, months: 6 });
    expect(r.ok).toBe(false);

    // The redemption row still exists, but its payment is 'failed' — the join
    // alone releases the credit, with no cleanup path to forget.
    expect(creditPercent(await availableCredits(uid))).toBe(5);
  });

  it('keeps a credit spent forever once its payment settles', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await grant(uid, 5, 'تولد');
    gatewayReplies(REQUEST_OK);
    const start = await startPayment({ userId: uid, months: 6 });

    gatewayReplies({ result: 100, status: 1, amount: 57_000_000, refNumber: 'REF-D' });
    const settled = await settlePayment(start.payment!.ref_id!);
    expect(settled.outcome).toBe('activated');
    expect(settled.subscription).not.toBeNull();

    expect(await availableCredits(uid)).toHaveLength(0);

    // The audit trail explains the below-list amount without re-deriving it.
    const audit = await pool.query(
      `select meta from user_activity
        where user_id = $1 and action = 'subscription_activated'`, [uid],
    );
    expect(audit.rows[0].meta.discount_credit_percent).toBe(5);
    expect(audit.rows[0].meta.discount_credit_sources).toHaveLength(1);
  });

  it('stacks the «ستون» percent ON TOP of the credit cap', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    // A prior paid gateway row is the seat — derived, never written.
    await pool.query(
      `insert into payments (user_id, amount_rial, months, gateway, ref_id, order_id, status, verified_at)
       values ($1, 10000000, 1, 'zibal', 'TRK-OLD', 'sub1_old', 'paid', now())`,
      [uid],
    );
    for (const p of [3, 3, 3, 3]) await grant(uid, p, 'عیدی');
    gatewayReplies(REQUEST_OK);

    const r = await startPayment({ userId: uid, months: 6 });
    // 20 (pillar, uncapped, never consumed) + 9 (credits under the cap) = 29.
    expect(r.payment!.amount_rial).toBe(42_600_000);
  });
});

/* ------------------------------------------------------------- surfaces --- */

describe('GET /pay/plans', () => {
  it('quotes the personalised price and says which part is one-time', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await grant(uid, 5, 'تولد');

    const res = await app.inject({ method: 'GET', url: '/pay/plans', headers: { cookie } });
    const body = res.json();
    expect(body.onetime_discount).toEqual({ percent: 5, cap_percent: CREDIT_CAP_PERCENT });
    const six = body.plans.find((p: { months: number }) => p.months === 6);
    expect(six.amount_rial).toBe(57_000_000);
    expect(six.list_amount_rial).toBe(SIX_MONTH_RIAL);
  });

  it('stays impersonal for a visitor with no session', async () => {
    const res = await app.inject({ method: 'GET', url: '/pay/plans' });
    expect(res.json().onetime_discount).toBeNull();
  });
});

describe('GET /achievements — the money layer', () => {
  it('reports the strip figures and per-level states', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    for (let i = 0; i < 50; i += 1) {
      await pool.query(
        `insert into highlights (user_id, content_id, exact) values ($1, 'c/y${i}', 'h')`, [uid],
      );
    }

    const res = await app.inject({ method: 'GET', url: '/achievements', headers: { cookie } });
    const body = res.json();
    expect(body.discount).toMatchObject({
      ready_percent: 1, cap_percent: CREDIT_CAP_PERCENT,
      pillar_percent: 0, next_purchase_percent: 1,
    });

    const quill = body.badges.find((b: { key: string }) => b.key === 'quill');
    const [bronze, silver, gold] = quill.levels;
    expect(bronze.discount_percent).toBeNull();          // a bronze never carries money
    expect(silver).toMatchObject({ discount_percent: 1, discount_state: 'ready' });
    expect(gold).toMatchObject({ discount_percent: 2, discount_state: 'future' });
  });

  it('marks a consumed level as spent', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    for (let i = 0; i < 50; i += 1) {
      await pool.query(
        `insert into highlights (user_id, content_id, exact) values ($1, 'c/z${i}', 'h')`, [uid],
      );
    }
    gatewayReplies(REQUEST_OK);
    await startPayment({ userId: uid, months: 6 });

    const res = await app.inject({ method: 'GET', url: '/achievements', headers: { cookie } });
    const body = res.json();
    expect(body.discount.ready_percent).toBe(0);
    const quill = body.badges.find((b: { key: string }) => b.key === 'quill');
    expect(quill.levels[1].discount_state).toBe('spent');
  });
});

describe('admin', () => {
  const auth = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

  it('grants a credit and reads the account back', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);

    const g = await app.inject({
      method: 'POST', url: '/admin/discounts/grant',
      headers: { authorization: auth },
      payload: { user: PHONE, percent: 4, label: 'هدیه‌ی تولد', kind: 'birthday', days: 30 },
    });
    expect(g.statusCode).toBe(200);
    expect(g.json().grant).toMatchObject({ percent: 4, label_fa: 'هدیه‌ی تولد' });
    expect(g.json().grant.expires_at).not.toBeNull();

    const r = await app.inject({
      method: 'GET', url: `/admin/discounts?user=${PHONE}`, headers: { authorization: auth },
    });
    expect(r.json()).toMatchObject({ ready_percent: 4, next_purchase_percent: 4, user_id: uid });
  });
});
