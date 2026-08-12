import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { readSession } from '../services/session.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import {
  addVote, removeVote, getVoteState, getBoard, isValidContentId,
} from '../services/votes.js';

/**
 * up-board — reading the board, and casting/withdrawing one heart.
 *
 * Reading is public on every route here, and that is a decision rather than an
 * oversight. The count is printed on the article page for anybody who opens it,
 * so gating the endpoint that produces it would only mean a signed-out reader
 * sees an empty chip where everyone else sees a number. Pressing is what needs
 * an account, because "one person, one vote" is a claim about people and the
 * only thing on this site that knows about people is the session.
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
   * The whole ranked board. Ids and numbers only — the titles, types and URLs
   * live in the site's own content index, which the client already has. Keeping
   * the catalog out of this response is what lets a publish change a title
   * without an API deploy.
   */
  app.get('/votes/board', async (_request, reply) => {
    const board = await getBoard();
    // Same short window the server caches it for. The board is an accumulation,
    // not news; a minute-old order is indistinguishable from a fresh one.
    reply.header('cache-control', 'public, max-age=60');
    return reply.send(board);
  });

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
