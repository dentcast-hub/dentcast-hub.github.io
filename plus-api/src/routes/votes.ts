import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { readSession } from '../services/session.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import {
  addVote, removeVote, getVoteState, getBoard, getHeartCounts, isValidContentId,
} from '../services/votes.js';

/**
 * up-board — reading the board, and casting/withdrawing one heart.
 *
 * Three access levels, and the line between them is deliberate:
 *
 *   · PUBLIC — a page's heart count (`GET /votes`). It is printed on the article
 *     for anybody who opens it, so gating the endpoint that produces it would
 *     only mean a signed-out reader sees an empty chip where everyone else sees
 *     a number.
 *   · SIGNED IN — casting a heart (`POST /votes`). "One person, one vote" is a
 *     claim about people, and the only thing on this site that knows about
 *     people is the session. Free Plus is enough on purpose: charging for the
 *     act would starve the board of the signal it ranks by.
 *   · PREMIUM — the ranked board (`GET /votes/board`). The ARRANGEMENT, never
 *     the content; see that route's own note.
 *
 * The content id travels in the body/query rather than the path — the same shape
 * `/activity` and `/anon/event` already use, and for a reason that is easy to
 * get wrong: an id here is the page's own PATH (`chairside/chairside-30`,
 * `dentai/promptologist/prompt4-2`), so `/votes/:contentId` silently matches only
 * the ids that happen to have no slash in them. Every real article would 404.
 *
 * Note what is NOT here: no XP, no streak, no activity row. A heart takes one
 * second, and every scoring path in the product is an act of study (see the
 * SHARE_ACTION note in services/score.ts, which makes the same argument for a
 * cheaper act than this one). Score is never deducted, so paying for a press
 * would be a permanent mistake for every account at once.
 */
export async function voteRoutes(app: FastifyInstance): Promise<void> {
  /**
   * The whole ranked board — PREMIUM. Ids and numbers only; the titles, types
   * and URLs live in the site's own content index, which the client already
   * has, so a publish can change a title without an API deploy.
   *
   * The gate is on the ARRANGEMENT, never on the content, and that distinction
   * is the whole reason it is defensible: /up-board/ serves every one of the 444
   * links to everybody, newest first, and what a subscription buys is the second
   * ordering of the same list. It is the identical split `pillar` already makes
   * — flat date list for all, the foldered arrangement layered on for premium —
   * so this is one rule applied twice rather than a new one.
   *
   * Note what stays OPEN, deliberately: `GET /votes` (a page's heart count) and
   * `POST /votes` (casting one). The count is printed on every article for every
   * reader, and voting is free for anyone signed in — gating either would mean
   * charging people to produce the very signal this endpoint ranks by, and would
   * starve the board of the votes that make it worth anything.
   */
  app.get('/votes/board', { preHandler: [requireAuth, requirePremium] }, async (_request, reply) => {
    // No cache-control set here on purpose. server.ts stamps `no-store` on every
    // API response as a whole-API invariant — a CDN in front of this does not
    // key on the session cookie, so ANY cacheable response can be replayed to a
    // different reader (it leaked a phone number in production once). This route
    // wants that invariant more than most now that its answer depends on tier.
    // The 60s staleness the board is allowed lives in the server-side cache in
    // services/votes.ts instead, where it costs nothing and leaks nothing.
    return reply.send(await getBoard());
  });

  /**
   * Every page's heart count in one map — PUBLIC, like the single-page count.
   *
   * /up-board/ needs this for its FREE list: the count belongs to the article,
   * not to the arrangement, so «تازه‌ترین» prints it exactly as the article page
   * does. Gating it along with the board (which is what shipped first) left the
   * free list with no signal beside any row.
   */
  app.get('/votes/counts', async (_request, reply) => reply.send({ hearts: await getHeartCounts() }));

  /** One page's count, plus whether the caller is one of the hearts. */
  app.get('/votes', async (request, reply) => {
    const { id } = request.query as { id?: string };
    if (!isValidContentId(id)) return reply.code(400).send({ error: 'invalid_content_id' });
    return reply.send(await getVoteState(id, readSession(request)));
  });

  /**
   * Cast a heart, and take it back — `vote: false` withdraws.
   *
   * One endpoint carrying the INTENT rather than a toggle, because a toggle
   * turns a flaky connection into a bug: a request that times out may well have
   * succeeded, and the retry would silently undo the press instead of repeating
   * it. Both directions are idempotent at the database level (the primary key
   * absorbs a repeat insert; a delete of nothing is a no-op), so any number of
   * retries lands on the state the reader asked for.
   */
  app.post('/votes', {
    preHandler: requireAuth,
    schema: {
      body: {
        type: 'object',
        required: ['content_id'],
        properties: {
          content_id: { type: 'string' },
          vote: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    const { content_id: contentId, vote = true } = request.body as {
      content_id: string; vote?: boolean;
    };
    if (!isValidContentId(contentId)) return reply.code(400).send({ error: 'invalid_content_id' });

    const userId = request.user!.id;
    const limit = consume(`votes:user:${userId}`, config.votes.maxPerUserPerHour, HOUR_MS);
    if (!limit.allowed) {
      reply.header('retry-after', Math.ceil(limit.retryAfterMs / 1000));
      return reply.code(429).send({ error: 'rate_limited' });
    }

    if (vote) await addVote(userId, contentId);
    else await removeVote(userId, contentId);

    // The fresh count comes back with the answer so the chip never has to guess
    // it locally: two readers on the same page a second apart both end up
    // showing the same number, which is the one promise the printed count makes.
    return reply.send(await getVoteState(contentId, userId));
  });
}
