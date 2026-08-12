import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { requireAuth, loadUser } from '../middleware/auth.js';
import { startPayment, settlePayment, getPaymentByTrackId, resultUrl } from '../services/payment.js';
import { getCapacity, planAmountRial } from '../services/payment-capacity.js';
import {
  pillarSeat, isPillarSeat, PILLAR_DISCOUNT_PERCENT,
} from '../services/pillar.js';
import {
  availableCredits, pickCredits, creditPercent, discountedRial, CREDIT_CAP_PERCENT,
} from '../services/discount-credits.js';
import { readCallback } from '../services/zibal.js';
import {
  startRedemption, latestRedemption, giftInstructions, bankTransferInstructions,
} from '../services/gift-redemption.js';
import { query } from '../db.js';

/**
 * The payment surface. Three routes, and the split between them is the point:
 *
 *   GET  /pay/plans     public   — what may be bought right now, and for how much
 *   POST /pay/start     session  — open a payment, get somewhere to send the browser
 *   GET  /pay/callback  PUBLIC   — where Zibal returns the customer
 *
 * /pay/callback carries no session and must not need one. The customer comes
 * back through a bank's redirect chain, and on a phone that can easily mean a
 * different browser context than the one they left from; refusing to settle a
 * real payment because a cookie went missing would be the worst possible reason
 * to fail. It is safe to leave open because it grants nothing on its own —
 * every claim in its query string is discarded and the answer is fetched from
 * the gateway over our own connection (services/payment.ts).
 */
export async function payRoutes(app: FastifyInstance): Promise<void> {
  // --- GET /pay/plans --------------------------------------------------------
  // Public: the pricing page is readable without an account, because asking
  // someone to sign up before they can see the price is how you lose them.
  // Reports availability per plan, so the page can grey out what no longer fits
  // under this month's ceiling instead of failing at the last step.
  app.get('/pay/plans', async (request, reply) => {
    const capacity = await getCapacity();

    // Personalisation, not gating: the page stays public and the list is the
    // same for everyone — but the browser sends its session cookie anyway
    // (api.js always does), so when a «ستون» seat-holder is looking, quote the
    // price they will actually be charged rather than a figure /pay/start
    // would then undercut. Failure here falls back to the public answer: the
    // one thing this must never do is take the price list down.
    const user = await loadUser(request).catch(() => null);
    const seat = user ? await pillarSeat(user.id).catch(() => null) : null;
    const pillar = isPillarSeat(seat);
    // The one-time credits this person could spend on a purchase opened right
    // now — the same pick /pay/start will make, so the page never quotes a
    // figure the till would then change. Guarded like the seat lookup: the one
    // thing this route must never do is take the price list down.
    const credits = user
      ? await availableCredits(user.id).then(pickCredits).catch(() => [])
      : [];
    const creditPct = creditPercent(credits);
    const totalPct = (pillar ? PILLAR_DISCOUNT_PERCENT : 0) + creditPct;
    const plans = totalPct > 0
      ? capacity.plans.map((p) => ({
        ...p,
        // `amount_rial` stays "what this person pays" under its old name, so a
        // browser holding a cached pricing-page.js still shows the right total;
        // the list figure rides beside it for the strikethrough.
        amount_rial: discountedRial(p.amount_rial, totalPct),
        list_amount_rial: p.amount_rial,
      }))
      : capacity.plans;
    const fromMonthly = totalPct > 0 && plans.length
      ? Math.min(...plans.map((p) => p.amount_rial / p.months))
      : config.payments.fromMonthlyRial;

    return reply.send({
      // Whether a purchase can actually be completed today. The prices below are
      // real and worth showing either way — someone deciding whether DentCast is
      // worth paying for is served by the number even on a day we cannot take it.
      enabled: config.payments.enabled,
      // The out-of-country route. Advertised separately from `enabled` because
      // the two are independent rails: the Iranian gateway being dark says
      // nothing about whether somebody abroad can send a gift card, and this one
      // has no .ir constraint at all — it works on the .org mirror, where most
      // of the people it is for actually are.
      gift_card: config.giftCard.enabled ? giftInstructions() : null,
      // The SHABA-transfer route — a second manual rail, independent of the
      // gateway and the monthly ceiling for the same reason the gift-card rail
      // is (see services/gift-redemption.ts). `null` when switched off, same
      // convention as `gift_card`.
      bank_transfer: config.bankTransfer.enabled ? bankTransferInstructions() : null,
      // The cheapest per-month rate on the list, for the «از ماهی …» line. The
      // ladder bends (a longer term is cheaper per month), so this is a FLOOR,
      // not a rate anything is priced from — every real price is in `plans`.
      from_monthly_rial: fromMonthly,
      // Same number under its old name, for a browser still holding the copy of
      // pricing-page.js that reads `monthly_rial`. Removable once that cache is
      // certainly gone.
      monthly_rial: fromMonthly,
      plans,
      // Present only for a seat-holder, so the page can say WHY its prices
      // differ from the ones a colleague's screen shows.
      pillar_discount: pillar ? { percent: PILLAR_DISCOUNT_PERCENT } : null,
      // Same job for the one-time credits: how much of the personalised price
      // is credits this purchase will CONSUME, so the page can say so before
      // the pay button rather than after. Null when there is nothing to spend.
      onetime_discount: creditPct > 0
        ? { percent: creditPct, cap_percent: CREDIT_CAP_PERCENT }
        : null,
      any_plan_available: capacity.any_plan_available,
      // Deliberately NOT the remaining rial figure: how close we are to a
      // regulatory ceiling is our business, and "3 seats left" is a pressure
      // tactic rather than information.
      sold_out: !capacity.any_plan_available,
    });
  });

  // --- POST /pay/start -------------------------------------------------------
  app.post('/pay/start', {
    preHandler: requireAuth,
    schema: {
      body: {
        type: 'object',
        required: ['months'],
        properties: { months: { type: 'integer', minimum: 1, maximum: 60 } },
      },
    },
  }, async (request, reply) => {
    const { months } = request.body as { months: number };
    const user = request.user!;

    // Checked here as well as on the pricing page: the page is static and
    // cacheable, so a browser holding yesterday's copy would otherwise post
    // straight past a switch that is off.
    if (!config.payments.enabled) {
      return reply.code(503).send({
        error: 'payments_disabled',
        message: 'درگاه پرداخت هنوز فعال نیست.',
      });
    }

    const result = await startPayment({
      userId: user.id,
      months,
      // Zibal shows the customer's own number on the payment page and can bind
      // the card check to it. Ours is verified at signup, so it costs nothing.
      mobile: user.phone,
    });

    if (!result.ok) {
      // 409, not 400: nothing is wrong with the request — it is the shop that
      // cannot serve it at this moment, and the client should say so rather
      // than ask the customer to correct something.
      const status = result.error === 'unknown_plan' ? 400 : 409;
      return reply.code(status).send({
        error: result.error, message: result.message,
      });
    }

    return reply.send({
      ok: true,
      redirect_url: result.redirectUrl,
      order_id: result.payment!.order_id,
      amount_rial: result.payment!.amount_rial,
      months,
    });
  });

  // --- GET /pay/callback -----------------------------------------------------
  // Zibal sends the customer back here. Every parameter below is untrusted:
  // `success=1` is a thing anyone can type into a URL bar. The only one used for
  // anything is trackId, and only to look up a payment WE created — the verdict
  // itself comes from settlePayment()'s server-to-server verify.
  app.get('/pay/callback', async (request, reply) => {
    const cb = readCallback(request.query as Record<string, unknown>);

    if (!cb.trackId) {
      return reply.redirect(resultUrl({ outcome: 'unknown_payment' }), 302);
    }

    // The customer pressed cancel at the bank. Still verified rather than taken
    // at its word — a cancelled-looking callback on a payment that actually
    // went through would otherwise strand the money.
    const result = await settlePayment(cb.trackId);

    if (result.needsReview) {
      // eslint-disable-next-line no-console
      console.error(
        `[pay] NEEDS REVIEW trackId=${cb.trackId} outcome=${result.outcome} `
        + `order=${result.payment?.order_id ?? '-'} user=${result.payment?.user_id ?? '-'}`,
      );
    }

    return reply.redirect(resultUrl({
      outcome: result.outcome,
      months: result.payment?.months,
      orderId: result.payment?.order_id,
    }), 302);
  });

  // --- GET /pay/status -------------------------------------------------------
  // What the result page asks once it loads, so the page itself never has to
  // trust its own query string either. Session-scoped: a payment is only ever
  // described to the account that made it.
  app.get('/pay/status', {
    preHandler: requireAuth,
    schema: {
      querystring: { type: 'object', properties: { order: { type: 'string' } } },
    },
  }, async (request, reply) => {
    const { order } = request.query as { order?: string };
    const user = request.user!;

    const row = order
      ? (await query<{
        order_id: string; status: string; months: number | null;
        amount_rial: number; created_at: Date;
      }>(
        `select order_id, status, months, amount_rial, created_at
           from payments where order_id = $1 and user_id = $2`,
        [order, user.id],
      )).rows[0]
      : (await query<{
        order_id: string; status: string; months: number | null;
        amount_rial: number; created_at: Date;
      }>(
        `select order_id, status, months, amount_rial, created_at
           from payments where user_id = $1 order by created_at desc limit 1`,
        [user.id],
      )).rows[0];

    if (!row) return reply.code(404).send({ error: 'no_payment' });
    return reply.send({ ok: true, payment: row });
  });

  // --- gift cards ------------------------------------------------------------
  // For anyone outside Iran, where no gateway on either side can reach the
  // other. Submitting puts a code in a queue a human answers; nothing is
  // granted until they do.
  // POST /pay/gift — open a claim and hand back the reference tag.
  //
  // Takes no code, on purpose. A gift-card code is a bearer instrument, so the
  // flow is arranged so it goes from the shop to the founder's inbox without
  // ever passing through this API. What comes back is the tag the buyer writes
  // into the gift message, which is what matches the arriving card to them.
  app.post('/pay/gift', { preHandler: requireAuth }, async (request, reply) => {
    const r = await startRedemption(request.user!.id);

    if (r.outcome === 'disabled') {
      return reply.code(503).send({ error: r.outcome, message: r.message });
    }
    // 'already_pending' is not an error to show as one: they have a reference,
    // and the useful thing is to hand them the same one again rather than tell
    // them off for coming back.
    return reply.send({
      ...giftInstructions(),
      ok: true,
      reference: r.redemption!.reference,
      months: r.redemption!.months,
      reused: r.outcome === 'already_pending',
    });
  });

  // Where the submitter checks back. Their own only.
  app.get('/pay/gift', { preHandler: requireAuth }, async (request, reply) => {
    const row = await latestRedemption(request.user!.id);
    return reply.send({
      ...giftInstructions(),
      ok: true,
      redemption: row && {
        reference: row.reference,
        status: row.status, months: row.months, kind: row.kind,
        // The reason for a rejection travels back to the buyer; an internal
        // approval note does not.
        note: row.status === 'rejected' ? row.note : null,
        created_at: row.created_at, reviewed_at: row.reviewed_at,
      },
    });
  });

  // --- bank transfer (واریز به شبا) -------------------------------------------
  // The second manual rail, same shape as the gift-card pair above. No gateway,
  // no monthly ceiling — a human matches the transfer's «بابت» code to this
  // claim and approves from /admin.
  //
  // POST /pay/bank-transfer { months } — open a claim, hand back the reference.
  // The AMOUNT is computed here, from PLAN_PRICES_RIAL, and never taken from
  // the client — a student's discounted price is written onto the row by the
  // founder afterwards (routes/admin.ts), never posted by the browser.
  app.post('/pay/bank-transfer', {
    preHandler: requireAuth,
    schema: {
      body: {
        type: 'object', required: ['months'],
        properties: { months: { type: 'integer', minimum: 1, maximum: 60 } },
      },
    },
  }, async (request, reply) => {
    const { months } = request.body as { months: number };
    const amountRial = planAmountRial(months);
    if (amountRial === null) {
      return reply.code(400).send({ error: 'unknown_plan', message: 'این مدت اشتراک تعریف نشده است.' });
    }

    const r = await startRedemption(request.user!.id, 'bank_transfer', { months, amountRial });

    if (r.outcome === 'disabled') {
      return reply.code(503).send({ error: r.outcome, message: r.message });
    }
    return reply.send({
      ...bankTransferInstructions(),
      ok: true,
      reference: r.redemption!.reference,
      months: r.redemption!.months,
      amount_rial: r.redemption!.amount_rial,
      reused: r.outcome === 'already_pending',
    });
  });

  // Where the submitter checks back. Their own only.
  app.get('/pay/bank-transfer', { preHandler: requireAuth }, async (request, reply) => {
    const row = await latestRedemption(request.user!.id, 'bank_transfer');
    return reply.send({
      ...bankTransferInstructions(),
      ok: true,
      redemption: row && {
        reference: row.reference,
        status: row.status, months: row.months, amount_rial: row.amount_rial,
        note: row.status === 'rejected' ? row.note : null,
        created_at: row.created_at, reviewed_at: row.reviewed_at,
      },
    });
  });

  // Retained for symmetry with the callback: a payment can be settled by asking
  // again, which is what a customer who closed the tab mid-redirect needs.
  app.post('/pay/settle', {
    preHandler: requireAuth,
    schema: {
      body: { type: 'object', required: ['order'], properties: { order: { type: 'string' } } },
    },
  }, async (request, reply) => {
    const { order } = request.body as { order: string };
    const user = request.user!;

    const row = (await query<{ ref_id: string | null }>(
      "select ref_id from payments where order_id = $1 and user_id = $2 and status = 'pending'",
      [order, user.id],
    )).rows[0];
    if (!row?.ref_id) return reply.code(404).send({ error: 'no_pending_payment' });

    const result = await settlePayment(row.ref_id);
    return reply.send({
      ok: result.outcome === 'activated' || result.outcome === 'already_settled',
      outcome: result.outcome,
      message: result.message,
    });
  });
}

export { getPaymentByTrackId };
