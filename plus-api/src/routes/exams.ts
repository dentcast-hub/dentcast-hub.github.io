import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { config } from '../config.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import { examState, startAttempt, submitAttempt, setCertificateIntent } from '../services/pathway-exams.js';
import { holderNameFrom, holderNameMessageFa } from '../services/holder-name.js';

/**
 * آزمون مسیر — the reader's side. Three routes, all premium: earning a
 * certificate is what a subscription buys (the pathway pages themselves are
 * `requirePremium`, and an exam on a pathway you cannot open is nothing).
 *
 *   GET  /exams/:pathwayId          where I stand (services/pathway-exams.ts examState)
 *   POST /exams/:pathwayId/start    {holder_first_name, holder_last_name} → draw and open an attempt
 *   POST /exams/:pathwayId/submit   {answers: {qid: …}} → grade
 *   POST /exams/:pathwayId/intent   {intent: wanted|declined} → «گواهی می‌خواهی؟»
 *
 * `pathwayId` is safe in the path — pathway ids are slugs with no slash
 * (`digital`, `post-and-core`), unlike content ids.
 */
export async function examRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  const unknown = (reply: import('fastify').FastifyReply) =>
    reply.code(404).send({ error: 'unknown_pathway', message: 'این مسیر آزمون ندارد.' });
  // `certificate: 'pending'` in pathways.json: the series is unfinished, so
  // nothing may be started, assigned or wished for until its last part lands.
  const pending = (reply: import('fastify').FastifyReply) =>
    reply.code(409).send({ ok: false, error: 'pathway_pending', state: 'pending', message: 'این مسیر هنوز کامل نشده؛ آزمون و گواهی‌نامه با آمدنِ آخرین قسمت باز می‌شود.' });

  app.get('/exams/:pathwayId', async (request, reply) => {
    const { pathwayId } = request.params as { pathwayId: string };
    try {
      return reply.send({ ok: true, ...(await examState(request.user!.id, pathwayId)) });
    } catch (err) {
      if ((err as Error).message === 'unknown_pathway') return unknown(reply);
      if ((err as Error).message === 'pathway_pending') return pending(reply);
      throw err;
    }
  });

  // The name is asked in TWO boxes — first name and family name — because a
  // certificate is never issued to a pseudonym (services/holder-name.ts), and
  // an empty family-name box cannot be talked past the way one free-text line
  // could. `holder_name` is still read as one string for anything that sends
  // it that way; both roads end at the same judge.
  app.post('/exams/:pathwayId/start', {
    schema: {
      body: {
        type: 'object',
        properties: {
          holder_first_name: { type: 'string', maxLength: 120 },
          holder_last_name: { type: 'string', maxLength: 120 },
          holder_name: { type: 'string', maxLength: 120 },
        },
      },
    },
  }, async (request, reply) => {
    const { pathwayId } = request.params as { pathwayId: string };
    let holderName: string;
    try {
      holderName = holderNameFrom(request.body as Record<string, unknown>);
    } catch (err) {
      const code = (err as Error).message;
      const message = holderNameMessageFa(code);
      if (message) return reply.code(400).send({ error: code, message });
      throw err;
    }
    try {
      const r = await startAttempt(request.user!.id, pathwayId, holderName);
      if (!r.ok) return reply.code(409).send({ ok: false, error: r.error, ...r.state });
      return reply.send({ ok: true, ...r.state });
    } catch (err) {
      if ((err as Error).message === 'unknown_pathway') return unknown(reply);
      if ((err as Error).message === 'pathway_pending') return pending(reply);
      throw err;
    }
  });

  app.post('/exams/:pathwayId/intent', {
    schema: {
      body: {
        type: 'object', required: ['intent'],
        properties: { intent: { type: 'string', enum: ['wanted', 'declined'] } },
      },
    },
  }, async (request, reply) => {
    const { pathwayId } = request.params as { pathwayId: string };
    const { intent } = request.body as { intent: 'wanted' | 'declined' };
    try {
      return reply.send({ ok: true, ...(await setCertificateIntent(request.user!.id, pathwayId, intent)) });
    } catch (err) {
      if ((err as Error).message === 'unknown_pathway') return unknown(reply);
      if ((err as Error).message === 'pathway_pending') return pending(reply);
      throw err;
    }
  });

  app.post('/exams/:pathwayId/submit', {
    schema: {
      body: {
        type: 'object', required: ['answers'],
        properties: { answers: { type: 'object' } },
      },
    },
  }, async (request, reply) => {
    const { pathwayId } = request.params as { pathwayId: string };
    const { answers } = request.body as { answers: Record<string, unknown> };
    const userId = request.user!.id;

    // Two model calls per free question — real money per press.
    const rl = consume(`exam:${userId}`, config.exam.maxSubmitsPerHour, HOUR_MS);
    if (!rl.allowed) return reply.code(429).send({ error: 'rate_limited', retry_after_ms: rl.retryAfterMs });

    try {
      const r = await submitAttempt(userId, pathwayId, answers);
      if (!r.ok) {
        if (r.error === 'incomplete') {
          return reply.code(400).send({
            ok: false, error: 'incomplete', missing: r.missing,
            message: 'همهٔ سؤال‌ها باید پاسخ داشته باشند؛ پاسخ تشریحی دست‌کم '
              + `${config.exam.minAnswerChars} نویسه.`,
          });
        }
        return reply.code(409).send({ ok: false, error: r.error, ...(r.state ?? {}) });
      }
      return reply.send({ ok: true, ...r.state });
    } catch (err) {
      if ((err as Error).message === 'unknown_pathway') return unknown(reply);
      if ((err as Error).message === 'pathway_pending') return pending(reply);
      throw err;
    }
  });
}
