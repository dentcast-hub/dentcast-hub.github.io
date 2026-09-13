import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { config } from '../config.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import { examState, startAttempt, submitAttempt, setCertificateIntent } from '../services/pathway-exams.js';

/**
 * آزمون مسیر — the reader's side. Three routes, all premium: earning a
 * certificate is what a subscription buys (the pathway pages themselves are
 * `requirePremium`, and an exam on a pathway you cannot open is nothing).
 *
 *   GET  /exams/:pathwayId          where I stand (services/pathway-exams.ts examState)
 *   POST /exams/:pathwayId/start    {holder_name} → draw and open an attempt
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

  app.post('/exams/:pathwayId/start', {
    schema: {
      body: {
        type: 'object', required: ['holder_name'],
        properties: { holder_name: { type: 'string', minLength: 1, maxLength: 120 } },
      },
    },
  }, async (request, reply) => {
    const { pathwayId } = request.params as { pathwayId: string };
    const { holder_name } = request.body as { holder_name: string };
    if (!holder_name.trim()) {
      return reply.code(400).send({ error: 'holder_name_required', message: 'نامی که روی گواهی چاپ می‌شود را بنویس.' });
    }
    try {
      const r = await startAttempt(request.user!.id, pathwayId, holder_name);
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
