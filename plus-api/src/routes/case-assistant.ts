import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { config } from '../config.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import { nextCaseStep } from '../services/case-assistant.js';
import { recordFeedback } from '../services/assistant-learning.js';
import { recordActivity } from '../services/activity.js';
import type { NarrowHistoryEntry } from '../providers/ai/types.js';

// «دستیار هوشمند» (premium): stateless narrowing wizard, not a chat — the client
// resends the whole history every call, nothing is stored server-side. See
// services/case-assistant.ts for the actual narrowing/resolution logic.
export async function caseAssistantRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  app.post('/assistant/next', async (request, reply) => {
    const userId = request.user!.id;

    // Bounds real spend from a runaway/abusive client independent of maxRounds
    // (maxRounds caps ONE description's cost; this caps how many descriptions a
    // user can start per hour).
    const rl = consume(`assistant:${userId}`, config.assistant.maxPerUserPerHour, HOUR_MS);
    if (!rl.allowed) {
      return reply.code(429).send({ error: 'rate_limited', retry_after_ms: rl.retryAfterMs });
    }

    const body = request.body as { description?: unknown; history?: unknown };
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '';
    if (!description) return reply.code(400).send({ error: 'description_required' });

    const history = Array.isArray(body.history) ? (body.history as NarrowHistoryEntry[]) : [];
    const step = await nextCaseStep(userId, description, history);

    // The assistant is the only premium feature with a per-use cost, and it was
    // the only one leaving no trace in user_activity — so a three-day prize
    // winner could lean on it hard or never open it, and both looked identical.
    // One row per round is the right unit: a call here is at most one model
    // call (maxRounds bounds a single case, the limiter above bounds the hour).
    //
    // Recorded AFTER the step resolves, so a failed generation is not counted as
    // a use. content_id stays null: this is a feature-usage row, and anything
    // that derives progress from user_activity keys off content.
    await recordActivity(userId, 'assistant_step', null, { round: history.length + 1 });
    return reply.send(step);
  });

  // POST /assistant/feedback { round_id, kind: 'up'|'down'|'click', option_key? }
  // The signals the server cannot observe on its own. `up`/`down` is the
  // explicit two-button verdict on a result; `click` says which option was
  // opened, and is weighted DOWN by its position (services/assistant-learning.ts)
  // so it cannot simply confirm whatever we already ranked first.
  //
  // Deliberately forgiving: an unknown round id answers 200 with recorded:false
  // rather than an error. This is telemetry attached to a UI button — a stale
  // tab must never show a user an error for a thing that does not affect them.
  app.post('/assistant/feedback', async (request, reply) => {
    const b = request.body as { round_id?: unknown; kind?: unknown; option_key?: unknown };
    const roundId = typeof b.round_id === 'string' ? b.round_id : '';
    const kind = b.kind === 'up' || b.kind === 'down' || b.kind === 'click' ? b.kind : null;
    if (!roundId || !kind) return reply.code(400).send({ error: 'round_id_and_kind_required' });
    if (!/^[0-9a-f-]{36}$/i.test(roundId)) return reply.send({ ok: true, recorded: false });

    const recorded = await recordFeedback({
      userId: request.user!.id,
      roundId,
      kind,
      optionKey: typeof b.option_key === 'string' ? b.option_key : undefined,
    });
    return reply.send({ ok: true, recorded });
  });
}
