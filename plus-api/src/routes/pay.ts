import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { startPayment, settlePayment, getPaymentByTrackId, resultUrl } from '../services/payment.js';
import { getCapacity } from '../services/payment-capacity.js';
import { readCallback } from '../services/zibal.js';
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
  app.get('/pay/plans', async (_request, reply) => {
    const capacity = await getCapacity();
    return reply.send({
      monthly_rial: config.payments.monthlyRial,
      plans: capacity.plans,
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
