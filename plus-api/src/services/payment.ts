import { config } from '../config.js';
import { one, query, withTransaction, type Queryable } from '../db.js';
import { pool } from '../db.js';
import { activateMonths, type Subscription } from './subscription.js';
import { canSellPlan, planAmountRial, periodStamps, capacityMessage } from './payment-capacity.js';
import { zibalRequest, zibalVerify, isSandbox } from './zibal.js';
import { checkCapacityAlert } from './payment-cap-alert.js';

/**
 * Buying a subscription, end to end. Two entry points — start a payment, settle
 * a payment — and every rule that protects the money lives here rather than in
 * the route handlers, so the HTTP layer stays a thin translation of it.
 *
 * THE FOUR THINGS THAT MUST NOT GO WRONG, and where each is handled:
 *
 *  1. A subscription granted for money that never arrived.
 *     Only a server-to-server verify returning result 100 (or 201 against our
 *     own pending row) reaches activateMonths(). The customer's return from the
 *     gateway is a URL in their own browser and is treated as a hint, never as
 *     evidence — see services/zibal.ts.
 *
 *  2. A subscription bought for the wrong price.
 *     The amount is decided HERE, from the plan, and written to the row before
 *     the customer leaves. On the way back, what Zibal says was actually paid is
 *     compared against that stored figure and a mismatch settles nothing. The
 *     customer spends the middle of this journey somewhere we do not control;
 *     this comparison is the only thing that makes that survivable.
 *
 *  3. One payment buying two subscriptions.
 *     `payments.status` is moved to 'paid' in the same transaction that extends
 *     the subscription, and a row already 'paid' short-circuits before any
 *     activation. A refreshed callback, a double-submitted form and a retried
 *     webhook all land on that check. The unique index on (gateway, ref_id)
 *     backs it at the database level.
 *
 *  4. Selling past the monthly ceiling.
 *     Capacity is re-checked at the instant of purchase, not when the pricing
 *     page rendered. The page may have been open for an hour and the last seat
 *     can only be sold once.
 */

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'canceled';

export interface Payment {
  id: string;
  user_id: string;
  amount_rial: number;
  months: number | null;
  gateway: string | null;
  ref_id: string | null;
  order_id: string | null;
  status: PaymentStatus;
  verified_at: Date | null;
  created_at: Date;
}

const PAYMENT_COLUMNS =
  'id, user_id, amount_rial, months, gateway, ref_id, order_id, status, verified_at, created_at';

/**
 * Our own reference for an attempt, and the only handle we have when
 * reconciling against Zibal's panel months later. Deliberately readable:
 * the plan, a slice of the account, and when it was opened.
 */
function mintOrderId(userId: string, months: number, now: Date): string {
  return `sub${months}_${userId.slice(0, 8)}_${now.getTime().toString(36)}`;
}

export interface StartResult {
  ok: boolean;
  /** Where to send the customer's browser. Present only when ok. */
  redirectUrl: string | null;
  payment: Payment | null;
  error: 'capacity' | 'gateway' | 'unknown_plan' | null;
  message: string;
}

/**
 * Open a payment for `months` of premium and return where to send the customer.
 *
 * The `payments` row is written BEFORE the gateway is called, and that ordering
 * is deliberate: it means an attempt exists in our ledger even if the gateway
 * call then times out, so a customer who was charged by a request we never saw
 * the answer to is still findable. The cost is a pending row that consumes
 * capacity, which is why a failed request marks it 'failed' immediately rather
 * than leaving it to age.
 */
export async function startPayment(params: {
  userId: string;
  months: number;
  mobile?: string;
  now?: Date;
}): Promise<StartResult> {
  const now = params.now ?? new Date();

  // Re-checked here, at the moment of purchase — not when the page rendered.
  const fit = await canSellPlan(params.months, now);
  if (!fit.ok) {
    return {
      ok: false,
      redirectUrl: null,
      payment: null,
      error: fit.blocked_by === 'unknown_plan' ? 'unknown_plan' : 'capacity',
      message: fit.blocked_by === 'unknown_plan'
        ? 'این طرح موجود نیست.'
        : capacityMessage(fit.capacity),
    };
  }

  const amountRial = planAmountRial(params.months);
  const orderId = mintOrderId(params.userId, params.months, now);
  const stamps = periodStamps(now);

  const payment = (await one<Payment>(
    `insert into payments
       (user_id, amount_rial, months, gateway, order_id, status, period_jalali, period_gregorian)
     values ($1, $2, $3, 'zibal', $4, 'pending', $5, $6)
     returning ${PAYMENT_COLUMNS}`,
    [params.userId, amountRial, params.months, orderId, stamps.period_jalali, stamps.period_gregorian],
  ))!;

  const req = await zibalRequest({
    amountRial,
    orderId,
    description: `اشتراک ${params.months} ماهه دنت‌کست پلاس`,
    mobile: params.mobile,
  });

  if (!req.ok || !req.trackId || !req.redirectUrl) {
    // Close the attempt now. A pending row that never reached the gateway still
    // counts against the monthly ceiling, and leaving it would slowly sell our
    // own capacity to nobody.
    await query(
      "update payments set status = 'failed', updated_at = now() where id = $1",
      [payment.id],
    );
    return {
      ok: false, redirectUrl: null, payment: null, error: 'gateway',
      message: req.message || 'ارتباط با درگاه پرداخت برقرار نشد.',
    };
  }

  const withTrack = (await one<Payment>(
    `update payments set ref_id = $2, updated_at = now() where id = $1 returning ${PAYMENT_COLUMNS}`,
    [payment.id, req.trackId],
  ))!;

  return { ok: true, redirectUrl: req.redirectUrl, payment: withTrack, error: null, message: '' };
}

export type SettleOutcome =
  | 'activated'        // verified, priced correctly, subscription extended
  | 'already_settled'  // this payment had already been activated; nothing to do
  | 'unpaid'           // the gateway says no money moved
  | 'amount_mismatch'  // paid, but not what we asked for — settles nothing
  | 'unknown_payment'  // no row of ours matches this trackId
  | 'gateway_error';   // we could not get an answer at all

export interface SettleResult {
  outcome: SettleOutcome;
  payment: Payment | null;
  subscription: Subscription | null;
  message: string;
  /** Set when a human needs to look at this one. */
  needsReview: boolean;
}

export async function getPaymentByTrackId(
  trackId: string,
  client: Queryable = pool,
): Promise<Payment | null> {
  return one<Payment>(
    `select ${PAYMENT_COLUMNS} from payments where gateway = 'zibal' and ref_id = $1`,
    [trackId],
    client,
  );
}

/**
 * Settle a payment: ask the gateway what really happened and, if it is real and
 * correctly priced, extend the subscription.
 *
 * Safe to call more than once with the same trackId — which it will be, because
 * the customer can refresh the page they land on.
 */
export async function settlePayment(trackId: string, now: Date = new Date()): Promise<SettleResult> {
  const existing = await getPaymentByTrackId(trackId);

  // A trackId with no row of ours is either a typo or someone probing the
  // endpoint. Either way there is nothing here to settle, and no amount of
  // gateway conversation would change that — so we do not even ask.
  if (!existing) {
    return {
      outcome: 'unknown_payment', payment: null, subscription: null, needsReview: false,
      message: 'این پرداخت در سوابق ما نیست.',
    };
  }

  // Already done. Return the same answer as the first time, without a second
  // activation and without another call to the gateway.
  if (existing.status === 'paid') {
    return {
      outcome: 'already_settled', payment: existing, subscription: null, needsReview: false,
      message: 'این پرداخت قبلاً تأیید شده و اشتراک شما فعال است.',
    };
  }

  const v = await zibalVerify(trackId);

  // Neither a confirmed payment nor a confirmed non-payment: we simply could not
  // reach the gateway. Leave the row pending — marking it failed would tell a
  // customer who did pay that they did not.
  if (!v.ok && !v.alreadyVerified && v.result === null) {
    return {
      outcome: 'gateway_error', payment: existing, subscription: null, needsReview: true,
      message: 'پاسخ درگاه دریافت نشد. اگر مبلغ از حساب شما کسر شده، تا دقایقی دیگر بررسی می‌شود.',
    };
  }

  if (!v.ok && !v.alreadyVerified) {
    await query(
      "update payments set status = 'failed', updated_at = now() where id = $1",
      [existing.id],
    );
    return {
      outcome: 'unpaid', payment: existing, subscription: null, needsReview: false,
      message: v.statusText ?? v.message,
    };
  }

  // Zibal says this was verified before, while our row still says pending. The
  // money is real: the trackId is one WE minted, it is bound to this row by a
  // unique index, and the amount was fixed before the customer ever left. The
  // realistic cause is that we verified successfully and then failed to record
  // it. Refusing here would leave a paying customer with nothing, so we settle
  // it — and flag it, because the alternative explanation deserves human eyes.
  const reconciled = v.alreadyVerified && !v.ok;

  // What was actually paid, against what we asked for. When the gateway does not
  // repeat the amount (as on a 201), our own recorded figure stands — it is the
  // number the gateway itself charged against this trackId.
  if (v.amountRial !== null && v.amountRial !== existing.amount_rial) {
    await query(
      "update payments set status = 'failed', updated_at = now() where id = $1",
      [existing.id],
    );
    return {
      outcome: 'amount_mismatch', payment: existing, subscription: null, needsReview: true,
      message: 'مبلغ پرداخت‌شده با مبلغ سفارش هم‌خوانی ندارد. پیگیری می‌شود.',
    };
  }

  const months = existing.months ?? 0;
  if (months < 1) {
    return {
      outcome: 'amount_mismatch', payment: existing, subscription: null, needsReview: true,
      message: 'مدت اشتراک این سفارش ثبت نشده است. پیگیری می‌شود.',
    };
  }

  // The activation and the ledger move together or not at all: a subscription
  // extended against a row still reading 'pending' would be extended again by
  // the next refresh.
  const subscription = await withTransaction(async (client) => {
    const claimed = await one<{ id: string }>(
      `update payments
          set status = 'paid', verified_at = $2, updated_at = now()
        where id = $1 and status <> 'paid'
        returning id`,
      [existing.id, now.toISOString()],
      client,
    );
    // Lost the race to a concurrent callback; that one is doing the activation.
    if (!claimed) return null;
    return activateMonths(existing.user_id, months, {
      source: 'payment',
      now,
      meta: {
        payment_id: existing.id,
        order_id: existing.order_id,
        track_id: trackId,
        ref_number: v.refNumber,
        amount_rial: existing.amount_rial,
        sandbox: isSandbox(),
        ...(reconciled ? { reconciled_from_already_verified: true } : {}),
      },
    });
  });

  if (!subscription) {
    return {
      outcome: 'already_settled', payment: existing, subscription: null, needsReview: false,
      message: 'این پرداخت قبلاً تأیید شده و اشتراک شما فعال است.',
    };
  }

  // Capacity only ever moves on a completed sale, so this is the moment the
  // ceiling can be crossed. Fire-and-forget on purpose: the money is already
  // taken and the subscription already granted — a notification that fails must
  // not turn a successful purchase into an error.
  void checkCapacityAlert(now).catch(() => { /* alerting never breaks a sale */ });

  return {
    outcome: 'activated',
    payment: { ...existing, status: 'paid' },
    subscription,
    needsReview: reconciled,
    message: 'پرداخت با موفقیت انجام شد و اشتراک شما فعال است.',
  };
}

/** Where the customer's browser is sent once we know the answer. */
export function resultUrl(params: {
  outcome: SettleOutcome | 'canceled';
  months?: number | null;
  orderId?: string | null;
}): string {
  const u = new URL(config.payments.resultUrl);
  u.searchParams.set('status', params.outcome);
  if (params.months) u.searchParams.set('months', String(params.months));
  if (params.orderId) u.searchParams.set('order', params.orderId);
  return u.toString();
}
