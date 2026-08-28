import type { FastifyInstance } from 'fastify';
import { loadUser, requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { config } from '../config.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import {
  getChallenge, attemptOf, submitAnswer, reduceVerdict, type ChallengeAttempt,
} from '../services/challenge.js';

/**
 * چالش — the reader's side. `GET` is the one route in this file without
 * `requirePremium` (RULE 6/RULE 11): the block must render — question, image,
 * lock line — for a signed-out or free reader too. `POST` stays
 * `requirePremium` regardless of what the client shows, because a hidden box
 * is presentation, not an authorization check.
 */

function attemptPayload(attempt: ChallengeAttempt, answerFa: string) {
  const base: Record<string, unknown> = {
    status: attempt.status,
    reference: attempt.reference,
    answer_text: attempt.answer_text,
    // RULE 6: released by ONE fact — this reader has an attempt row for this
    // content_id. Never gated on tier, never on being signed in twice over.
    answer_fa: answerFa,
  };
  if (attempt.status === 'settled') Object.assign(base, reduceVerdict(attempt.verdict));
  return base;
}

export async function challengeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/challenge/:contentId', async (request, reply) => {
    const { contentId } = request.params as { contentId: string };
    const challenge = await getChallenge(contentId);
    if (!challenge) return reply.send({ exists: false });

    // Optional auth: a signed-out or free reader still gets `exists: true`,
    // just no attempt to attach — never `select *`, never spread the row.
    const user = await loadUser(request);
    if (!user) return reply.send({ exists: true });

    const attempt = await attemptOf(user.id, contentId);
    if (!attempt) return reply.send({ exists: true });

    return reply.send({ exists: true, ...attemptPayload(attempt, challenge.answer_fa) });
  });

  app.post('/challenge/:contentId/answer', {
    preHandler: [requireAuth, requirePremium],
  }, async (request, reply) => {
    const { contentId } = request.params as { contentId: string };
    const userId = request.user!.id;

    // This is the second route on the site (after case-assistant.ts) that
    // spends real model money per call.
    const rl = consume(`challenge:${userId}`, config.challenge.maxPerUserPerHour, HOUR_MS);
    if (!rl.allowed) {
      return reply.code(429).send({ error: 'rate_limited', retry_after_ms: rl.retryAfterMs });
    }

    const challenge = await getChallenge(contentId);
    if (!challenge) return reply.code(404).send({ error: 'not_found' });

    const body = request.body as { answer?: unknown };
    const answer = typeof body.answer === 'string'
      ? body.answer.trim().slice(0, config.challenge.maxAnswerChars)
      : '';
    if (answer.length < config.challenge.minAnswerChars) {
      return reply.code(400).send({ error: 'answer_too_short' });
    }

    const { status, attempt } = await submitAnswer(userId, contentId, answer);
    if (status === 'already_answered') {
      return reply.code(409).send({ error: 'already_answered', ...attemptPayload(attempt, challenge.answer_fa) });
    }
    return reply.send(attemptPayload(attempt, challenge.answer_fa));
  });
}
