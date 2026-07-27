import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { query } from '../db.js';
import { consume, HOUR_MS } from '../services/rate-limit.js';
import { readSession } from '../services/session.js';
import {
  SPOT_EVENTS, parseSpotContentId, recordSpotEvent, hostFromHeaders,
} from '../services/spot-stats.js';

/**
 * Whitelisted anonymous events. Section 2.3 fixes exactly one anonymous
 * invitation signal for Phase 1: the workbench button click by a guest.
 *
 * The Spot events (`spot_impression` / `spot_click`) also arrive here, but they
 * are handled BEFORE this whitelist: they are counted, never logged (see
 * services/spot-stats.ts).
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

    // ── Spot telemetry: aggregate counter, no row ──────────────────────────
    const spotKind = SPOT_EVENTS[event];
    if (spotKind) {
      const target = parseSpotContentId(content_id);
      if (!target) return reply.code(400).send({ error: 'invalid_content_id' });

      // Its own, much higher budget: impressions fire once per page view PER
      // enabled slot, so the 60/h anonymous-event cap would throttle a normal
      // reading session (and a shared/NAT IP long before that).
      const spotLimit = consume(
        `spot:ip:${request.ip || 'unknown'}`,
        config.spot.maxPerIpPerHour,
        HOUR_MS,
      );
      if (!spotLimit.allowed) {
        reply.header('retry-after', Math.ceil(spotLimit.retryAfterMs / 1000));
        return reply.code(429).send({ error: 'rate_limited' });
      }

      // The client never labels its own audience. A signed-in visitor who posts
      // here (the site picks the endpoint by login state, but a stale page can
      // get it wrong) is still counted as `plus`.
      // Same rule for the mirror it came from: read off the request headers, so
      // ".ir vs .org" is a measurement rather than something the client asserts.
      const viewer = readSession(request) ? 'plus' : 'anon';
      await recordSpotEvent(target, viewer, spotKind, hostFromHeaders(request.headers));
      return reply.code(204).send();
    }

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
