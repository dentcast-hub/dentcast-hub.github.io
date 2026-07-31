import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { config } from '../config.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import { nextCaseStep } from '../services/case-assistant.js';
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
    return reply.send(step);
  });
}
