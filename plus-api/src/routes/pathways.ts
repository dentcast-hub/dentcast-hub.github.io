import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { pool, withTransaction } from '../db.js';
import { recordActivity } from '../services/activity.js';
import { getConsumedContentIds } from '../services/consumption.js';
import {
  getPathways, getPathwayById, resolveSteps, computeProgress, isCertifiable, type PathwayProgress,
} from '../pathways.js';

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

export async function pathwayRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  // GET /pathways - every pathway with the caller's own progress overlaid,
  // enrolled or not: browsing gives credit for content already consumed before
  // enrolling, since the same item can sit in many pathways at once.
  app.get('/pathways', async (request, reply) => {
    const userId = request.user!.id;
    const consumed = await getConsumedContentIds(userId);
    // `certificate_intent` rides along on the enrollment row the catalog
    // already reads, and the held certificates are one more small query — so
    // the catalog can say, per pathway, that it HAS a certificate, that this
    // reader asked for it, or that they hold it. Before this the word
    // «گواهی» appeared nowhere on the page, and the whole feature was
    // invisible to anyone who never opened a pathway.
    //
    // Deliberately NOT examStates(): the chip has four states and none of
    // them is the exam's, and that helper resolves every step of every
    // pathway — too much work for a card foot.
    const enrolled = await pool.query<{ pathway_id: string; started_at: string; certificate_intent: string | null }>(
      `select pathway_id, started_at, certificate_intent from user_pathways where user_id = $1`,
      [userId],
    );
    const held = await pool.query<{ pathway_id: string }>(
      `select pathway_id from certificates where user_id = $1 and revoked_at is null`,
      [userId],
    );
    const startedAt = new Map(enrolled.rows.map((r) => [r.pathway_id, r.started_at]));
    const intentBy = new Map(enrolled.rows.map((r) => [r.pathway_id, r.certificate_intent]));
    const heldSet = new Set(held.rows.map((r) => r.pathway_id));

    const pathways = getPathways().map((p) => {
      const progress = computeProgress(p, consumed);
      return {
        id: p.id,
        kind: p.kind ?? null,
        glyph: p.glyph ?? null,
        title_fa: p.title_fa,
        description_fa: p.description_fa,
        milestone_count: p.steps.filter((s) => s.milestone).length,
        enrolled: startedAt.has(p.id),
        started_at: startedAt.get(p.id) ?? null,
        // A bundle is never certifiable (5–8 steps is not certificate-sized),
        // and the client draws no chip for one either way.
        certifiable: p.kind === 'bundle' ? false : isCertifiable(p),
        certificate_intent: intentBy.get(p.id) ?? null,
        certificate_held: heldSet.has(p.id),
        ...progress,
      };
    });
    return reply.send({ pathways });
  });

  // GET /pathways/:id - full step list resolved to title/url/type + per-step
  // completion, for the pathway detail page.
  app.get('/pathways/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const pathway = getPathwayById(id);
    if (!pathway) return reply.code(404).send({ error: 'unknown_pathway' });

    const userId = request.user!.id;
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

    // Bundle-only referral links, resolved to a title + icon so the card
    // needs no second lookup. Dangling ids (a referenced bundle/pathway later
    // removed) resolve to null rather than a broken link.
    const prereq = pathway.prereq_bundle ? getPathwayById(pathway.prereq_bundle) : null;
    const continuesInto = pathway.continues_pathway ? getPathwayById(pathway.continues_pathway) : null;

    return reply.send({
      id: pathway.id,
      kind: pathway.kind ?? null,
      glyph: pathway.glyph ?? null,
      title_fa: pathway.title_fa,
      description_fa: pathway.description_fa,
      prereq_bundle: prereq ? { id: prereq.id, title_fa: prereq.title_fa, glyph: prereq.glyph ?? null } : null,
      continues_pathway: continuesInto ? { id: continuesInto.id, title_fa: continuesInto.title_fa } : null,
      enrolled,
      started_at: e.rows[0]?.started_at ?? null,
      steps,
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
