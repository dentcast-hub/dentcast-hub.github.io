import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { recordActivity, SERVER_MINTED_ACTIONS } from '../services/activity.js';
import { scheduleAchievementSync } from '../services/achievement-sync.js';
import { consume, refund, HOUR_MS } from '../services/rate-limit.js';
import { CONSUMPTION_ACTIONS } from '../services/score.js';
import { getContentInfo } from '../content-index.js';
import { refreshSoon } from '../content-refresh.js';
import {
  SPOT_EVENTS, parseSpotContentId, recordSpotEvent, hostFromHeaders,
} from '../services/spot-stats.js';

// Permissive: the action vocabulary is deliberately open (not an enum). We only
// guard length and character set so it stays a sane, indexable token.
const ACTION_RE = /^[a-z0-9_.:-]{1,64}$/;
const DAY_MS = 24 * HOUR_MS;

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
          event_id: { type: 'string', maxLength: 36 },
        },
      },
    },
  }, async (request, reply) => {
    const { action, content_id, meta, event_id } = request.body as {
      action: string;
      content_id?: string;
      meta?: Record<string, unknown>;
      event_id?: string;
    };
    if (!ACTION_RE.test(action)) {
      return reply.code(400).send({ error: 'invalid_action' });
    }

    // Server-minted. `challenge_answered` was the first one guarded here, with
    // the reasoning that an open vocabulary would otherwise let a client buy
    // shield score + league XP + the badge without answering anything — and
    // that sentence is just as true of `highlight_created` and
    // `review_finished` beside it in SCORING_ACTIONS, and of `streak_kept`,
    // which IS the streak. So the guard is the whole set (see
    // SERVER_MINTED_ACTIONS); the vocabulary stays open for everything else,
    // which is inert by construction.
    if (SERVER_MINTED_ACTIONS.has(action)) {
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
      if (event_id && !/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(event_id)) return reply.code(400).send({ error: 'invalid_event_id' });
      await recordSpotEvent(target, 'plus', spotKind, hostFromHeaders(request.headers), new Date(), event_id);
      return reply.send({ ok: true, counted: true });
    }

    // A CEILING ON THE LOG ITSELF. Everything downstream of this row — league
    // XP, the all-time score, the streak, the badge wall — trusts that a row
    // means a human did something. Nothing else enforces that: the action
    // vocabulary is open by design and `card_reviewed_manual` deliberately
    // touches no state, so before this the endpoint would accept a loop of
    // identical posts and pay for every one (2026-08-08: an account reached
    // four figures of league XP inside a day).
    //
    // Set well above real use — a heavy reading session is a few dozen rows an
    // hour, counting highlights — so this is never felt by a reader and only
    // ever bites a script. It is the blunt outer wall; the per-action ceilings
    // in league.ts are the shaped ones inside it.
    const limit = consume(`activity:user:${request.user!.id}`, config.activity.maxPerUserPerHour, HOUR_MS);
    if (!limit.allowed) {
      reply.header('retry-after', Math.ceil(limit.retryAfterMs / 1000));
      return reply.code(429).send({ error: 'rate_limited' });
    }

    // ── Paid completions: a real page, at a human pace ──────────────────────
    // article_completed / episode_listened pay +5 per DISTINCT content_id
    // (score.ts) and league XP per page per week, and the 30s dwell / 60s of
    // real play that earns them is measured in the browser only. Until
    // 2026-10-31 the id was not checked at all, so a script could post
    // `insight/x1`, `insight/x2` … and be paid for each — up to the 300/hour
    // wall above, ~1500 score an hour for pages that do not exist.
    //
    // Two checks close that. The id must be a page in the content index —
    // every page that runs the trackers is there (canonical → content_id). An
    // id the index does not know is a 409, not a 400: a page published since
    // the last refresh is the honest case, the client's outbox keeps the
    // completion and re-sends it, and refreshSoon() pulls the new index forward
    // so that retry lands. Then a pace ceiling, the server-side stand-in for
    // the dwell it cannot see; refused completions are likewise kept and
    // re-sent by the outbox, so a fast reader is paid later, not never.
    if ((CONSUMPTION_ACTIONS as readonly string[]).includes(action)) {
      if (!content_id) return reply.code(400).send({ error: 'invalid_content_id' });
      if (!getContentInfo(content_id)) {
        refreshSoon();
        return reply.code(409).send({ error: 'unknown_content' });
      }
      const uid = request.user!.id;
      const perHour = consume(`completion:hour:${uid}`, config.activity.maxCompletionsPerUserPerHour, HOUR_MS);
      const perDay = perHour.allowed
        ? consume(`completion:day:${uid}`, config.activity.maxCompletionsPerUserPerDay, DAY_MS)
        : perHour;
      if (!perDay.allowed) {
        if (perHour.allowed) refund(`completion:hour:${uid}`);
        reply.header('retry-after', Math.ceil(perDay.retryAfterMs / 1000));
        return reply.code(429).send({ error: 'rate_limited' });
      }
    }

    // `card_reviewed_manual` counts for the streak but MUST NOT touch card_state.
    // recordActivity only appends to the log, so that invariant holds here.
    const row = await recordActivity(request.user!.id, action, content_id ?? null, meta ?? {});
    // The badge wall stores nothing, so nothing else can notice that finishing
    // this article just lit «خواننده». Debounced and off the response (see
    // achievement-sync.ts): a reading session is twenty of these, and the reader
    // is waiting on the tick, not on twenty-one derived metrics.
    scheduleAchievementSync(request.user!.id);
    return reply.send({ ok: true, id: row.id });
  });
}
