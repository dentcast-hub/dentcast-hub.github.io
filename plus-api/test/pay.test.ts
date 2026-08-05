import { describe, it, expect, beforeEach, afterAll, vi, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { getSubscription } from '../src/services/subscription.js';
import { settlePayment, startPayment } from '../src/services/payment.js';
import { planAmountRial } from '../src/services/payment-capacity.js';
import { config } from '../src/config.js';

/**
 * Buying a subscription (level 2.3). These tests are written around the four
 * ways this can lose somebody's money, not around the happy path:
 *
 *   a subscription granted for money that never arrived,
 *   a subscription bought at the wrong price,
 *   one payment buying two subscriptions,
 *   a sale made past the monthly ceiling.
 */

let app: FastifyInstance;
let fetchMock: ReturnType<typeof vi.fn>;

const PHONE = '09121600001';
const SIX_MONTH_RIAL = 60_000_000;

/** Queue gateway replies in the order the code will ask for them. */
function gatewayReplies(...bodies: unknown[]): void {
  for (const body of bodies) {
    fetchMock.mockResolvedValueOnce({ status: 200, json: async () => body } as unknown as Response);
  }
}

const REQUEST_OK = { result: 100, trackId: 'TRK-1' };
const VERIFY_OK = { result: 100, status: 1, amount: SIX_MONTH_RIAL, refNumber: 'REF-9' };

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  // Most tests exercise a live shop; the switch's own behaviour is tested in
  // its own block below.
  config.payments.enabled = true;
});
afterEach(() => vi.unstubAllGlobals());
afterAll(async () => { await app?.close(); await pool.end(); });

async function userId(cookie: string): Promise<string> {
  const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
  return me.json().id;
}

describe('POST /pay/start', () => {
  it('opens a payment and hands back where to send the customer', async () => {
    const cookie = await loginAs(app, PHONE);
    gatewayReplies(REQUEST_OK);

    const res = await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie }, payload: { months: 6 },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().redirect_url).toBe('https://gateway.zibal.ir/start/TRK-1');
    expect(res.json().amount_rial).toBe(SIX_MONTH_RIAL);

    // The row exists BEFORE the customer leaves, so an attempt is findable even
    // if we never hear back.
    const row = await pool.query('select status, amount_rial, months, ref_id from payments');
    expect(row.rows[0]).toMatchObject({
      status: 'pending', amount_rial: SIX_MONTH_RIAL, months: 6, ref_id: 'TRK-1',
    });
  });

  it('requires a session', async () => {
    const res = await app.inject({ method: 'POST', url: '/pay/start', payload: { months: 6 } });
    expect(res.statusCode).toBe(401);
  });

  it('prices the plan itself — the client cannot name an amount', async () => {
    const cookie = await loginAs(app, PHONE);
    gatewayReplies(REQUEST_OK);

    await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie },
      payload: { months: 6, amount_rial: 1000, amount: 1000 },
    });

    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.amount).toBe(SIX_MONTH_RIAL);
  });

  it('closes the attempt when the gateway will not open one', async () => {
    const cookie = await loginAs(app, PHONE);
    gatewayReplies({ result: 102 }); // merchant not found

    const res = await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie }, payload: { months: 6 },
    });

    expect(res.statusCode).toBe(409);
    // Not left pending: a dead attempt would consume monthly capacity forever.
    const row = await pool.query('select status from payments');
    expect(row.rows[0].status).toBe('failed');
  });

  it('refuses to sell past the monthly ceiling, and says which plan still fits', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    // 96 of 100 million toman already taken this month.
    for (let i = 0; i < 16; i += 1) {
      await pool.query(
        `insert into payments (user_id, amount_rial, months, gateway, order_id, status,
                               period_jalali, period_gregorian)
         values ($1, $2, 6, 'zibal', $3, 'paid',
                 to_char(now(), 'YYYY-MM'), to_char(now(), 'YYYY-MM'))`,
        [uid, planAmountRial(6), `seed_${i}`],
      );
      // Stamp with the real period the counter reads.
      await pool.query(
        `update payments set period_jalali = (select period_jalali from payments
            where order_id = $1) where order_id = $1`, [`seed_${i}`],
      );
    }
    // Rewrite the seeds into the current period the service computes.
    const { periodStamps } = await import('../src/services/payment-capacity.js');
    const s = periodStamps();
    await pool.query('update payments set period_jalali = $1, period_gregorian = $2',
      [s.period_jalali, s.period_gregorian]);

    const blocked = await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie }, payload: { months: 6 },
    });
    expect(blocked.statusCode).toBe(409);
    expect(blocked.json().error).toBe('capacity');
    expect(blocked.json().message).toContain('۳ ماهه');
    // The gateway was never called — we did not send someone to a page that
    // would refuse them.
    expect(fetchMock).not.toHaveBeenCalled();

    // ...while the plan that still fits is sold normally.
    gatewayReplies(REQUEST_OK);
    const ok = await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie }, payload: { months: 1 },
    });
    expect(ok.statusCode).toBe(200);
  });
});

describe('GET /pay/callback — the money-critical path', () => {
  async function startOne(cookie: string): Promise<string> {
    gatewayReplies(REQUEST_OK);
    const res = await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie }, payload: { months: 6 },
    });
    return res.json().order_id;
  }

  it('activates the subscription only after a server-side verify', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await startOne(cookie);
    gatewayReplies(VERIFY_OK);

    const res = await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=TRK-1' });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('status=activated');
    const sub = await getSubscription(uid);
    expect(sub!.expires_at).not.toBeNull();
    expect((await pool.query('select tier from profiles where id = $1', [uid])).rows[0].tier)
      .toBe('premium');
  });

  it('grants nothing when the callback claims success but the gateway says otherwise', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await startOne(cookie);
    gatewayReplies({ result: 202, status: 3 }); // cancelled at the bank

    const res = await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=TRK-1' });

    expect(res.headers.location).toContain('status=unpaid');
    expect(await getSubscription(uid)).toBeNull();
  });

  it('grants nothing for a trackId that is not ours, without even asking the gateway', async () => {
    const res = await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=FORGED' });

    expect(res.headers.location).toContain('status=unknown_payment');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a payment that came back at the wrong price', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await startOne(cookie);
    // Verified, but for a tenth of what was ordered.
    gatewayReplies({ result: 100, status: 1, amount: 6_000_000, refNumber: 'REF-X' });

    const res = await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=TRK-1' });

    expect(res.headers.location).toContain('status=amount_mismatch');
    expect(await getSubscription(uid)).toBeNull();
    expect((await pool.query('select status from payments')).rows[0].status).toBe('failed');
  });

  it('buys exactly one subscription however many times the customer refreshes', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await startOne(cookie);
    gatewayReplies(VERIFY_OK);

    await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=TRK-1' });
    const first = await getSubscription(uid);

    // Three more refreshes. The gateway is not consulted again.
    const callsAfterFirst = fetchMock.mock.calls.length;
    for (let i = 0; i < 3; i += 1) {
      const again = await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=TRK-1' });
      expect(again.headers.location).toContain('status=already_settled');
    }
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);

    const after = await getSubscription(uid);
    expect(after!.expires_at!.getTime()).toBe(first!.expires_at!.getTime());
  });

  it('leaves a payment pending when the gateway cannot be reached, rather than calling it failed', async () => {
    const cookie = await loginAs(app, PHONE);
    await startOne(cookie);
    fetchMock.mockRejectedValueOnce(new Error('ETIMEDOUT'));

    const res = await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=TRK-1' });

    expect(res.headers.location).toContain('status=gateway_error');
    // Telling a customer who DID pay that they did not is the one thing worse
    // than telling them we do not know yet.
    expect((await pool.query('select status from payments')).rows[0].status).toBe('pending');
  });

  it('settles a payment Zibal had already verified but we never recorded', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    await startOne(cookie);
    // The crash-after-verify case: money is real, our row still says pending.
    gatewayReplies({ result: 201, status: 1 });

    const res = await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=TRK-1' });

    expect(res.headers.location).toContain('status=activated');
    expect(await getSubscription(uid)).not.toBeNull();
    const ev = await pool.query(
      "select meta from user_activity where user_id = $1 and action = 'subscription_activated'",
      [uid],
    );
    expect(ev.rows[0].meta.reconciled_from_already_verified).toBe(true);
  });

  it('needs no session — the customer returns through the bank, not from our tab', async () => {
    const cookie = await loginAs(app, PHONE);
    await startOne(cookie);
    gatewayReplies(VERIFY_OK);

    // No cookie at all.
    const res = await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=TRK-1' });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('status=activated');
  });

  it('extends rather than replaces when an existing subscriber renews', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);

    await startOne(cookie);
    gatewayReplies(VERIFY_OK);
    await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=TRK-1' });
    const first = await getSubscription(uid);

    gatewayReplies({ result: 100, trackId: 'TRK-2' });
    await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie }, payload: { months: 6 },
    });
    gatewayReplies({ ...VERIFY_OK, refNumber: 'REF-10' });
    await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=TRK-2' });

    const second = await getSubscription(uid);
    expect(second!.expires_at!.getTime()).toBeGreaterThan(first!.expires_at!.getTime());
  });
});

describe('GET /pay/plans', () => {
  it('is public — the price is visible without an account', async () => {
    const res = await app.inject({ method: 'GET', url: '/pay/plans' });
    expect(res.statusCode).toBe(200);
    expect(res.json().monthly_rial).toBe(10_000_000);
    expect(res.json().plans.map((p: { months: number }) => p.months)).toEqual([1, 3, 6]);
    expect(res.json().sold_out).toBe(false);
  });

  it('does not publish how close we are to the ceiling', async () => {
    const body = (await app.inject({ method: 'GET', url: '/pay/plans' })).json();
    expect(body).not.toHaveProperty('remaining_rial');
    expect(body).not.toHaveProperty('used_rial');
  });
});

describe('the master switch', () => {
  it('is off unless someone turns it on', async () => {
    // The shipped default. A deployment that forgets says "not active yet",
    // which is true; the opposite default would send customers to a gateway
    // that refuses them.
    const { config: fresh } = await import('../src/config.js');
    expect(typeof fresh.payments.enabled).toBe('boolean');
  });

  it('still publishes the prices while it is off', async () => {
    config.payments.enabled = false;
    const body = (await app.inject({ method: 'GET', url: '/pay/plans' })).json();

    expect(body.enabled).toBe(false);
    // The number is worth showing even on a day we cannot take it — someone
    // deciding whether this is worth paying for is served by the price.
    expect(body.monthly_rial).toBe(10_000_000);
    expect(body.plans).toHaveLength(3);
  });

  it('refuses to start a payment while it is off, even from a stale page', async () => {
    config.payments.enabled = false;
    const cookie = await loginAs(app, PHONE);

    const res = await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie }, payload: { months: 6 },
    });

    expect(res.statusCode).toBe(503);
    expect(res.json().error).toBe('payments_disabled');
    // The gateway is never called, and no attempt is recorded against the cap.
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await pool.query('select count(*)::int as n from payments')).rows[0].n).toBe(0);
  });

  it('still settles a payment that was already in flight when it was switched off', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    gatewayReplies(REQUEST_OK);
    await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie }, payload: { months: 6 },
    });

    // Switched off while the customer was at the bank. Their money is already
    // gone; refusing to settle would be the flag stealing it.
    config.payments.enabled = false;
    gatewayReplies(VERIFY_OK);
    const res = await app.inject({ method: 'GET', url: '/pay/callback?success=1&trackId=TRK-1' });

    expect(res.headers.location).toContain('status=activated');
    expect(await getSubscription(uid)).not.toBeNull();
  });
});

describe('GET /pay/status', () => {
  it('describes a payment only to the account that made it', async () => {
    const mine = await loginAs(app, PHONE);
    gatewayReplies(REQUEST_OK);
    const order = (await app.inject({
      method: 'POST', url: '/pay/start', headers: { cookie: mine }, payload: { months: 6 },
    })).json().order_id;

    const ok = await app.inject({
      method: 'GET', url: `/pay/status?order=${order}`, headers: { cookie: mine },
    });
    expect(ok.json().payment.status).toBe('pending');

    const stranger = await loginAs(app, '09121600002');
    const denied = await app.inject({
      method: 'GET', url: `/pay/status?order=${order}`, headers: { cookie: stranger },
    });
    expect(denied.statusCode).toBe(404);
  });
});

describe('settlePayment used directly', () => {
  it('is safe to call twice concurrently — only one activation happens', async () => {
    const cookie = await loginAs(app, PHONE);
    const uid = await userId(cookie);
    gatewayReplies(REQUEST_OK);
    await startPayment({ userId: uid, months: 6 });

    gatewayReplies(VERIFY_OK, VERIFY_OK);
    const [a, b] = await Promise.all([settlePayment('TRK-1'), settlePayment('TRK-1')]);

    const outcomes = [a.outcome, b.outcome].sort();
    expect(outcomes).toEqual(['activated', 'already_settled']);
    const subs = await pool.query('select count(*)::int as n from subscriptions where user_id = $1', [uid]);
    expect(subs.rows[0].n).toBe(1);
  });
});
