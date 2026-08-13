import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import {
  ALIAS_RE, mintCode, checkClaim, claimRefusalMessage, referralStats,
  REFERRED_DISCOUNT_PERCENT,
} from '../services/referrals.js';

/**
 * کد معرف — the reader's own referral surface. Design ledger:
 * .dentcast/referral-handoff.md.
 *
 * `requirePremium` is used NOWHERE here (decision 2.10's own reasoning): a
 * free reader can both mint a code and refer others, and its ٪۵ sits waiting
 * for the day they buy themselves — the same posture POST /pay/gift takes.
 */
export async function referralRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /referral — my code (if any) + stats. Counts only, never names
  // (decision 2.13): "چند نفر با کدت مشترک شدند" is the whole answer.
  app.get('/referral', async (request, reply) => {
    const stats = await referralStats(request.user!.id);
    return reply.send({ ok: true, ...stats });
  });

  // POST /referral { alias } — mint the account's one-and-only code
  // (decision 2.7: no rename, no re-mint; the UI must show the final code
  // and get explicit confirmation BEFORE calling this).
  app.post('/referral', {
    schema: {
      body: {
        type: 'object',
        required: ['alias'],
        properties: { alias: { type: 'string', minLength: 1, maxLength: 32 } },
      },
    },
  }, async (request, reply) => {
    const { alias } = request.body as { alias: string };
    const normalized = alias.trim().toLowerCase();
    if (!ALIAS_RE.test(normalized)) {
      return reply.code(400).send({
        error: 'bad_alias',
        message: 'نام باید فقط شامل حروف انگلیسیِ کوچک باشد، بین ۴ تا ۱۶ حرف.',
      });
    }
    const result = await mintCode(request.user!.id, normalized);
    if (!result.ok) {
      const message = result.reason === 'already_has_code'
        ? 'شما قبلاً یک کد معرف ساخته‌اید و قابل تغییر نیست.'
        : result.reason === 'code_taken'
          ? 'این نام قبلاً گرفته شده؛ نام دیگری امتحان کنید.'
          : 'نام باید فقط شامل حروف انگلیسیِ کوچک باشد، بین ۴ تا ۱۶ حرف.';
      return reply.code(400).send({ error: result.reason, message });
    }
    return reply.send({ ok: true, code: result.code });
  });

  // GET /referral/check?code= — preview only, writes nothing. Rate-limited
  // per account: without it, a script could enumerate the whole code space
  // through this one endpoint.
  app.get('/referral/check', {
    schema: {
      querystring: {
        type: 'object',
        required: ['code'],
        properties: { code: { type: 'string', minLength: 1, maxLength: 24 } },
      },
    },
  }, async (request, reply) => {
    const { code } = request.query as { code: string };
    const limit = consume(`referral_check:${request.user!.id}`, 20, HOUR_MS);
    if (!limit.allowed) {
      reply.header('retry-after', Math.ceil(limit.retryAfterMs / 1000));
      return reply.code(429).send({
        error: 'rate_limited',
        message: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.',
      });
    }
    const result = await checkClaim(request.user!.id, code);
    if (!result.ok) {
      return reply.send({ ok: false, reason: result.reason, message: claimRefusalMessage(result.reason) });
    }
    return reply.send({ ok: true, code: result.code, percent: REFERRED_DISCOUNT_PERCENT });
  });
}
