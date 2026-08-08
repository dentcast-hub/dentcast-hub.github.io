import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { pool, withTransaction } from '../db.js';
import { recordActivity } from '../services/activity.js';
import { getConsumedContentIds } from '../services/consumption.js';
import {
  getPathways, getPathwayById, resolveSteps, computeProgress, type PathwayProgress,
} from '../pathways.js';
import {
  pathwayIsFree, isPremiumRequest, previewLockedBody, getQuotaCopy,
} from '../services/quota.js';

// Phase 3: curated learning pathways (spec sections 5 + 8). Definitions live in
// plus/pathways.json (versioned, no DB, never mutated by this route); only
// enrollment + a progress cache live in `user_pathways`. Progress itself is
// DERIVED from highlights/user_activity (the source of truth) on every read —
// there is no "mark step complete" endpoint — so it self-heals exactly like
// the streak caches do. Entirely premium (spec 6: "thematic views and
// pathways: premium").

async function syncEnrollmentCache(userId: string, pathwayId: string, progress: PathwayProgress): Promise<void> {
  await pool.query(
    `update user_pathways
        set current_step = $3,
            completed_at = case when $4 then coalesce(completed_at, now()) else null end
      where user_id = $1 and pathway_id = $2`,
    [userId, pathwayId, progress.current_step, progress.is_complete],
  );
}

/**
 * Which pathway a free reader may open, by POSITION in catalog order — the same
 * one for everybody, always the first.
 *
 * Not "any one you pick": a per-user choice needs a counter to spend, an
 * enrollment to spend it on, and an answer to "can I change my mind", none of
 * which buys anything. A fixed first pathway is instead the product's own
 * introduction — the thing two readers can discuss because they both did it.
 */
function freePathwayIds(isPremium: boolean): Set<string> {
  const ids = new Set<string>();
  getPathways().forEach((p, i) => { if (pathwayIsFree(i, isPremium)) ids.add(p.id); });
  return ids;
}

export async function pathwayRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /pathways - every pathway with the caller's own progress overlaid,
  // enrolled or not: browsing gives credit for content already consumed before
  // enrolling, since the same item can sit in many pathways at once.
  app.get('/pathways', async (request, reply) => {
    const userId = request.user!.id;
    const consumed = await getConsumedContentIds(userId);
    const enrolled = await pool.query<{ pathway_id: string; started_at: string }>(
      `select pathway_id, started_at from user_pathways where user_id = $1`,
      [userId],
    );
    const startedAt = new Map(enrolled.rows.map((r) => [r.pathway_id, r.started_at]));
    const free = freePathwayIds(isPremiumRequest(request));

    // The whole catalog is listed to everybody, locked ones included. This is
    // the menu, not the meal: a reader who cannot see what they are missing has
    // no reason to want it, and the titles are already public on the site.
    const pathways = getPathways().map((p) => {
      const progress = computeProgress(p, consumed);
      return {
        id: p.id,
        title_fa: p.title_fa,
        description_fa: p.description_fa,
        milestone_count: p.steps.filter((s) => s.milestone).length,
        enrolled: startedAt.has(p.id),
        started_at: startedAt.get(p.id) ?? null,
        locked: !free.has(p.id),
        ...progress,
      };
    });
    return reply.send({ pathways, locked_message: getQuotaCopy().pathways_fa });
  });

  // GET /pathways/:id - full step list resolved to title/url/type + per-step
  // completion, for the pathway detail page.
  app.get('/pathways/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const pathway = getPathwayById(id);
    if (!pathway) return reply.code(404).send({ error: 'unknown_pathway' });

    const userId = request.user!.id;
    const locked = !freePathwayIds(isPremiumRequest(request)).has(pathway.id);

    // A locked pathway answers 200 with its cover and NO step list. The
    // ORDERED LIST IS THE PRODUCT — "these six things, in this order" is the
    // entire curation someone is paying for — so it is withheld here, in the
    // process, rather than sent and hidden by the page. It is also why this is
    // not a 404: the reader is meant to see that the pathway exists, how long
    // it is, and what it is for.
    if (locked) {
      return reply.send({
        id: pathway.id,
        title_fa: pathway.title_fa,
        description_fa: pathway.description_fa,
        total_steps: pathway.steps.length,
        milestone_count: pathway.steps.filter((s) => s.milestone).length,
        enrolled: false,
        started_at: null,
        steps: [],
        locked: true,
        locked_message: getQuotaCopy().pathways_fa,
      });
    }

    const consumed = await getConsumedContentIds(userId);
    const progress = computeProgress(pathway, consumed);
    const steps = resolveSteps(pathway, consumed);

    const e = await pool.query<{ started_at: string }>(
      `select started_at from user_pathways where user_id = $1 and pathway_id = $2`,
      [userId, id],
    );
    const enrolled = e.rowCount! > 0;
    // Lazy write-back, same pattern as the streak cache: keep current_step /
    // completed_at current for enrolled users without a separate "advance" call.
    if (enrolled) await syncEnrollmentCache(userId, id, progress);

    return reply.send({
      id: pathway.id,
      title_fa: pathway.title_fa,
      description_fa: pathway.description_fa,
      enrolled,
      started_at: e.rows[0]?.started_at ?? null,
      steps,
      locked: false,
      ...progress,
    });
  });

  // POST /pathways/:id/enroll - idempotent; seeds progress immediately so a
  // user who already consumed some of its steps sees credit right away.
  app.post('/pathways/:id/enroll', async (request, reply) => {
    const { id } = request.params as { id: string };
    const pathway = getPathwayById(id);
    if (!pathway) return reply.code(404).send({ error: 'unknown_pathway' });

    const userId = request.user!.id;
    if (!freePathwayIds(isPremiumRequest(request)).has(pathway.id)) {
      return reply.code(402).send(previewLockedBody(getQuotaCopy().pathways_fa));
    }

    const consumed = await getConsumedContentIds(userId);
    const progress = computeProgress(pathway, consumed);

    const startedAt = await withTransaction(async (client) => {
      const ins = await client.query<{ started_at: string }>(
        `insert into user_pathways (user_id, pathway_id, current_step, completed_at)
         values ($1, $2, $3, $4)
         on conflict (user_id, pathway_id) do nothing
         returning started_at`,
        [userId, id, progress.current_step, progress.is_complete ? new Date().toISOString() : null],
      );
      if (ins.rowCount) {
        await recordActivity(userId, 'pathway_enrolled', null, { pathway_id: id }, client);
        return ins.rows[0].started_at;
      }
      const existing = await client.query<{ started_at: string }>(
        `select started_at from user_pathways where user_id = $1 and pathway_id = $2`,
        [userId, id],
      );
      return existing.rows[0].started_at;
    });

    return reply.send({ id: pathway.id, enrolled: true, started_at: startedAt, ...progress });
  });
}
