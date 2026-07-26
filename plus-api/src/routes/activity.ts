import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { recordActivity } from '../services/activity.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import { SPOT_EVENTS, parseSpotContentId, recordSpotEvent } from '../services/spot-stats.js';

// Permissive: the action vocabulary is deliberately open (not an enum). We only
// guard length and character set so it stays a sane, indexable token.
const ACTION_RE = /^[a-z0-9_.:-]{1,64}$/;

export async function activityRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // POST /activity { action, content_id?, meta? }
  app.post('/activity', {
    schema: {
      body: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string' },
          content_id: { type: 'string' },
          meta: { type: 'object', additionalProperties: true },
        },
      },
    },
  }, async (request, reply) => {
    const { action, content_id, meta } = request.body as {
      action: string;
      content_id?: string;
      meta?: Record<string, unknown>;
    };
    if (!ACTION_RE.test(action)) {
      return reply.code(400).send({ error: 'invalid_action' });
    }

    // ── Spot telemetry: aggregate counter, NOT an activity row ──────────────
    // Deliberately short-circuits recordActivity: an ad impression is not user
    // activity, so it must never appear in the append-only log, never keep a
    // streak alive and never award league XP. It only bumps a (day, slot,
    // creative, viewer, kind) counter — see services/spot-stats.ts.
    const spotKind = SPOT_EVENTS[action];
    if (spotKind) {
      const target = parseSpotContentId(content_id);
      if (!target) return reply.code(400).send({ error: 'invalid_content_id' });
      const limit = consume(
        `spot:user:${request.user!.id}`,
        config.spot.maxPerIpPerHour,
        HOUR_MS,
      );
      if (!limit.allowed) {
        reply.header('retry-after', Math.ceil(limit.retryAfterMs / 1000));
        return reply.code(429).send({ error: 'rate_limited' });
      }
      // Reached through requireAuth, so the session cookie is valid by
      // construction: this traffic is `plus` (premium users see no ads at all).
      await recordSpotEvent(target, 'plus', spotKind);
      return reply.send({ ok: true, counted: true });
    }

    // `card_reviewed_manual` counts for the streak but MUST NOT touch card_state.
    // recordActivity only appends to the log, so that invariant holds here.
    const row = await recordActivity(request.user!.id, action, content_id ?? null, meta ?? {});
    return reply.send({ ok: true, id: row.id });
  });
}
