import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { withTransaction } from '../db.js';
import { recordActivity } from '../services/activity.js';
import { resolvePaper, libraryCount } from '../library.js';
import {
  quotaState, consumeQuota, isPremiumRequest, quotaExhaustedBody, type QuotaState,
} from '../services/quota.js';

/**
 * «کتابخانهٔ دنت‌کست» — the paper cabinet's one server-side door.
 *
 * The cabinet page is static and its index is public, so SEARCH, filtering and
 * sorting all happen in the browser and cost nothing: a reader can look through
 * all 2200 papers, read every title and every tag, and narrow the list however
 * they like, signed in or not. What premium buys is the PAPER — and this route
 * is the only place a Drive URL is ever produced.
 *
 * That inversion is the whole point of this file. Metering search was the wrong
 * boundary twice over: it was unenforceable (a localStorage counter on a static
 * page) and it sold the wrong thing (the ability to look, rather than the thing
 * being looked for). Now the limit is on the resource, and it is enforced where
 * the resource is produced.
 *
 * A paper is charged ONCE, ever, per reader per period: `usedFor` counts
 * distinct `content_id`, so re-opening one you have already spent an allowance
 * on is free. That also makes the two buttons — «View» and «Download» — one
 * decision rather than two, which is what a reader would expect from a single
 * paper anyway.
 */

/** The `content_id` shape a paper is logged under. Prefixed so nothing in the
 *  content taxonomy can ever collide with a cabinet id. */
export const paperContentId = (id: string): string => `library:${id}`;

export async function libraryRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  /**
   * GET /library/paper/:id -> { view, download, quota }
   *
   * Auth is required even for a premium reader: an unauthenticated caller has
   * no allowance to check and no activity to log, so there is no version of
   * this route that can answer anonymously without simply being the public JSON
   * again. A guest gets 401 and the page offers sign-in.
   */
  app.get('/library/paper/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    // Ids are `P` + digits in the catalogue; anything else is not worth a
    // lookup and must not reach the map as a key.
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(id)) {
      return reply.code(404).send({ error: 'unknown_paper' });
    }

    const links = resolvePaper(id);
    // Unknown id and "known but has no file" are the same answer on purpose:
    // probing this route must not become a way to enumerate the catalogue.
    if (!links || (!links.view && !links.download)) {
      return reply.code(404).send({ error: 'unknown_paper' });
    }

    const userId = request.user!.id;
    const isPremium = isPremiumRequest(request);
    const contentId = paperContentId(id);

    type Outcome =
      | { kind: 'ok'; quota: QuotaState }
      | { kind: 'exhausted'; quota: QuotaState };

    const outcome = await withTransaction<Outcome>(async (client) => {
      const quota = await consumeQuota(client, userId, 'library_papers', isPremium);

      // Already opened this one inside the period? Then it is not a new paper
      // and the allowance is not touched, even when it reads as spent. This is
      // checked AFTER the lock so it cannot race with a first open.
      const seen = await client.query<{ n: number }>(
        `select count(*)::int as n from user_activity
          where user_id = $1 and action = 'library_paper_opened' and content_id = $2`,
        [userId, contentId],
      );
      const repeat = (seen.rows[0]?.n ?? 0) > 0;

      if (!repeat && !quota.allowed) return { kind: 'exhausted', quota };

      // Logged for every plan, premium included: this is the only record of
      // what the cabinet is actually used for, and «کدام مقاله‌ها خوانده
      // می‌شوند» is the question the whole catalogue exists to serve. The
      // action name sits outside every scoring allowlist, so it pays no XP.
      await recordActivity(userId, 'library_paper_opened', contentId, { paper_id: id }, client);
      const spent = await quotaState(userId, 'library_papers', isPremium, new Date(), client);
      return { kind: 'ok', quota: spent };
    });

    if (outcome.kind === 'exhausted') {
      return reply.code(402).send(quotaExhaustedBody(outcome.quota));
    }
    return reply.send({ id, view: links.view, download: links.download, quota: outcome.quota });
  });

  /** How many papers are resolvable — a cheap liveness signal for the page. */
  app.get('/library/status', async (_request, reply) => reply.send({ papers: libraryCount() }));
}
