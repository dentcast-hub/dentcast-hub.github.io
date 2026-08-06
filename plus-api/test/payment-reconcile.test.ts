import { describe, it, expect, beforeEach, afterAll, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool, query, one } from '../src/db.js';
import { reconcilePendingPayments } from '../src/services/payment-reconcile.js';
import { zibalInquiry } from '../src/services/zibal.js';
import { getSubscription } from '../src/services/subscription.js';
import { config } from '../src/config.js';

/**
 * Reconciling payments the customer never came back from.
 *
 * The failure this guards against was real: on 2026-08-06 two rows had sat
 * `pending` since morning because `settlePayment` only ever ran when a browser
 * returned. Both turned out to be abandoned checkouts, but nothing in the system
 * could have told us that — and the same silence would have hidden a customer
 * who paid and closed the tab.
 *
 * So these tests are written around the two ways the sweep can be wrong, not
 * around the happy path:
 *
 *   closing a row for money that WAS taken   (unrecoverable — nobody looks again)
 *   settling a row for money that was NOT    (a free subscription, and a lie)
 *
 * and around the rule that makes the first impossible: an inconclusive answer
 * leaves the row alone.
 */

let app: FastifyInstance;
let fetchMock: ReturnType<typeof vi.fn>;

const PHONE = '09121600077';
const ONE_MONTH_RIAL = 10_000_000;

function gatewayReplies(...bodies: unknown[]): void {
  for (const body of bodies) {
    fetchMock.mockResolvedValueOnce({ status: 200, json: async () => body } as unknown as Response);
  }
}

/** What Zibal's inquiry returns for a transaction nobody ever paid. */
const INQUIRY_UNPAID = {
  message: 'success', result: 100, status: -1,
  paidAt: null, refNumber: null, verifiedAt: null, amount: ONE_MONTH_RIAL,
};
/** ...and for one that was paid but never verified. */
const INQUIRY_PAID = {
  message: 'success', result: 100, status: 2,
  paidAt: '2026-08-06 12:30:00', refNumber: null, verifiedAt: null, amount: ONE_MONTH_RIAL,
};
const VERIFY_OK = { result: 100, status: 1, amount: ONE_MONTH_RIAL, refNumber: 'REF-77' };

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  config.payments.enabled = true;
});
afterEach(() => vi.unstubAllGlobals());
afterAll(async () => { await app?.close(); await pool.end(); });

/** A pending payment `ageMinutes` old, as if the customer walked away. */
async function seedPending(opts: {
  ageMinutes: number; refId: string | null; months?: number;
}): Promise<{ id: string; userId: string }> {
  const cookie = await loginAs(app, PHONE);
  const me = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
  const userId = me.json().id as string;
  const created = new Date(Date.now() - opts.ageMinutes * 60_000).toISOString();

  const row = (await one<{ id: string }>(
    `insert into payments
       (user_id, amount_rial, months, gateway, ref_id, order_id, status,
        period_jalali, period_gregorian, created_at)
     values ($1, $2, $3, 'zibal', $4, $5, 'pending', '1405-05', '2026-08', $6)
     returning id`,
    [userId, ONE_MONTH_RIAL, opts.months ?? 1, opts.refId, `ord_${opts.refId ?? 'none'}`, created],
  ))!;
  return { id: row.id, userId };
}

async function statusOf(id: string): Promise<string> {
  return (await one<{ status: string }>('select status from payments where id = $1', [id]))!.status;
}

describe('zibalInquiry', () => {
  it('does NOT read result:100 as a successful payment', async () => {
    // The whole reason this wrapper exists. Inquiry answers 100 for any
    // successful lookup, including a lookup of a transaction nobody paid — the
    // exact shape Zibal returned for the two stranded rows on 2026-08-06.
    gatewayReplies(INQUIRY_UNPAID);
    const q = await zibalInquiry('TRK-X');

    expect(q.ok).toBe(true);       // the lookup worked
    expect(q.paid).toBe(false);    // the payment did not
    expect(q.status).toBe(-1);
  });

  it('reads a stamped paidAt as real money', async () => {
    gatewayReplies(INQUIRY_PAID);
    const q = await zibalInquiry('TRK-X');
    expect(q.paid).toBe(true);
  });

  it('says "I do not know" rather than "no" when the gateway errors', async () => {
    fetchMock.mockRejectedValueOnce(new Error('boom'));
    expect((await zibalInquiry('TRK-X')).paid).toBeNull();

    // -2 is the gateway's own internal error: also not an answer about money.
    gatewayReplies({ message: 'success', result: 100, status: -2, paidAt: null });
    expect((await zibalInquiry('TRK-X')).paid).toBeNull();
  });
});

describe('reconcilePendingPayments', () => {
  it('closes a row the gateway confirms was never paid', async () => {
    const { id } = await seedPending({ ageMinutes: 60, refId: 'TRK-DEAD' });
    gatewayReplies(INQUIRY_UNPAID);

    const r = await reconcilePendingPayments(new Date());

    expect(r.checked).toBe(1);
    expect(r.closed).toBe(1);
    expect(r.settled).toBe(0);
    expect(await statusOf(id)).toBe('canceled');
  });

  it('settles a row the customer paid and walked away from', async () => {
    const { id, userId } = await seedPending({ ageMinutes: 60, refId: 'TRK-PAID' });
    // inquiry says money moved, then settlePayment's own verify confirms it.
    gatewayReplies(INQUIRY_PAID, VERIFY_OK);

    const r = await reconcilePendingPayments(new Date());

    expect(r.settled).toBe(1);
    expect(await statusOf(id)).toBe('paid');
    // The point of the whole job: they actually get what they paid for.
    expect(await getSubscription(userId)).not.toBeNull();
  });

  it('leaves the row alone when the gateway gives no usable answer', async () => {
    const { id } = await seedPending({ ageMinutes: 60, refId: 'TRK-SILENT' });
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const r = await reconcilePendingPayments(new Date());

    // Never close on silence — that is how a real payment would be lost.
    expect(r.left).toBe(1);
    expect(r.closed).toBe(0);
    expect(await statusOf(id)).toBe('pending');
  });

  it('will not touch a payment that is still in its grace window', async () => {
    // A `-1` here means the customer is still at the bank, not that they left.
    const { id } = await seedPending({ ageMinutes: 1, refId: 'TRK-LIVE' });

    const r = await reconcilePendingPayments(new Date());

    expect(r.checked).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await statusOf(id)).toBe('pending');
  });

  it('ignores a pending row that never reached the gateway', async () => {
    // No ref_id = startPayment's request failed; there is no transaction to ask
    // about, and asking with a null trackId would be a meaningless call.
    const { id } = await seedPending({ ageMinutes: 60, refId: null });

    const r = await reconcilePendingPayments(new Date());

    expect(r.checked).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await statusOf(id)).toBe('pending');
  });

  it('is safe to run twice — the second pass finds nothing to do', async () => {
    await seedPending({ ageMinutes: 60, refId: 'TRK-DEAD2' });
    gatewayReplies(INQUIRY_UNPAID);
    await reconcilePendingPayments(new Date());

    const second = await reconcilePendingPayments(new Date());
    expect(second.checked).toBe(0);
    expect(second.closed).toBe(0);
  });

  it('never re-settles a payment that is already paid', async () => {
    const { id } = await seedPending({ ageMinutes: 60, refId: 'TRK-DONE' });
    await query("update payments set status = 'paid' where id = $1", [id]);

    const r = await reconcilePendingPayments(new Date());
    expect(r.checked).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('the monthly ceiling counts real transactions', () => {
  it('does not let an abandoned checkout hold a slice of the cap', async () => {
    // The founder's rule (2026-08-06): the e-namad allowance is about money that
    // moved. Before this, two dead rows sat on 4,000,000 toman of the monthly
    // ceiling with nothing to release them.
    expect(config.payments.capCountsAttempts).toBe(false);
  });
});
