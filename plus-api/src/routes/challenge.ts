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
 *
 * `content_id` travels in the query/body, never in the path — same shape
 * `/votes` and `/activity` already use. An id here is the page's own PATH
 * (`insight/insight-68`), so `/challenge/:contentId` silently matches only
 * ids with no slash (or depends on the reverse proxy leaving `%2F` alone).
 * votes.ts learned this the hard way; do not put the slash back in the path.
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

function readContentId(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim() : '';
}

export async function challengeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/challenge', async (request, reply) => {
    const contentId = readContentId((request.query as { content_id?: unknown }).content_id);
    if (!contentId) return reply.code(400).send({ error: 'missing_content_id' });

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

  app.post('/challenge/answer', {
    preHandler: [requireAuth, requirePremium],
  }, async (request, reply) => {
    const body = request.body as { content_id?: unknown; answer?: unknown };
    const contentId = readContentId(body.content_id);
    if (!contentId) return reply.code(400).send({ error: 'missing_content_id' });

    const userId = request.user!.id;

    // This is the second route on the site (after case-assistant.ts) that
    // spends real model money per call.
    const rl = consume(`challenge:${userId}`, config.challenge.maxPerUserPerHour, HOUR_MS);
    if (!rl.allowed) {
      return reply.code(429).send({ error: 'rate_limited', retry_after_ms: rl.retryAfterMs });
    }

    const challenge = await getChallenge(contentId);
    if (!challenge) return reply.code(404).send({ error: 'not_found' });

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
