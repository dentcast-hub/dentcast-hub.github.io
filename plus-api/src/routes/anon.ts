import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { query } from '../db.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';

/**
 * Whitelisted anonymous events. Section 2.3 fixes exactly one anonymous
 * invitation signal for Phase 1: the workbench button click by a guest.
 */
const ALLOWED_EVENTS = new Set(['workbench_button_anon_click']);

export async function anonRoutes(app: FastifyInstance): Promise<void> {
  // Unauthenticated + heavily rate-limited per IP. Identity-free demand signal.
  app.post('/anon/event', {
    schema: {
      body: {
        type: 'object',
        required: ['event'],
        properties: {
          event: { type: 'string' },
          content_id: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { event, content_id } = request.body as { event: string; content_id?: string };

    if (!ALLOWED_EVENTS.has(event)) {
      return reply.code(400).send({ error: 'event_not_allowed' });
    }

    const limit = consume(
      `anon:ip:${request.ip || 'unknown'}`,
      config.anon.maxPerIpPerHour,
      HOUR_MS,
    );
    if (!limit.allowed) {
      reply.header('retry-after', Math.ceil(limit.retryAfterMs / 1000));
      return reply.code(429).send({ error: 'rate_limited' });
    }

    await query(
      `insert into anon_events (event, content_id) values ($1, $2)`,
      [event, content_id ?? null],
    );
    return reply.code(204).send();
  });
}
