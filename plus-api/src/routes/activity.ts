import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { recordActivity } from '../services/activity.js';

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
    // `card_reviewed_manual` counts for the streak but MUST NOT touch card_state.
    // recordActivity only appends to the log, so that invariant holds here.
    const row = await recordActivity(request.user!.id, action, content_id ?? null, meta ?? {});
    return reply.send({ ok: true, id: row.id });
  });
}
