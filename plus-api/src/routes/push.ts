import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config.js';
import { query } from '../db.js';

/**
 * Web Push subscription management. The client subscribes in the browser and
 * posts the PushSubscription here; delivery reads these rows. The VAPID public
 * key is public, so its endpoint needs no auth.
 */
export async function pushRoutes(app: FastifyInstance): Promise<void> {
  // GET /push/public-key - the VAPID application-server key (public, no auth).
  app.get('/push/public-key', async (_request, reply) => reply.send({ key: config.push.vapidPublicKey }));

  // POST /push/subscribe - store (or refresh) the caller's push subscription.
  app.post('/push/subscribe', {
    preHandler: requireAuth,
    schema: {
      body: {
        type: 'object',
        required: ['subscription'],
        properties: {
          subscription: {
            type: 'object',
            required: ['endpoint', 'keys'],
            properties: {
              endpoint: { type: 'string' },
              keys: {
                type: 'object',
                required: ['p256dh', 'auth'],
                properties: { p256dh: { type: 'string' }, auth: { type: 'string' } },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { subscription } = request.body as {
      subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
    };
    // An endpoint is globally unique; if it reappears (e.g. the user logs in on a
    // device already subscribed under another account) it moves to this user.
    await query(
      `insert into push_subscriptions (user_id, endpoint, p256dh, auth)
       values ($1, $2, $3, $4)
       on conflict (endpoint) do update
         set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
      [request.user!.id, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth],
    );
    return reply.send({ ok: true });
  });

  // POST /push/unsubscribe - forget one of the caller's subscriptions.
  app.post('/push/unsubscribe', {
    preHandler: requireAuth,
    schema: {
      body: {
        type: 'object',
        required: ['endpoint'],
        properties: { endpoint: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { endpoint } = request.body as { endpoint: string };
    await query('delete from push_subscriptions where user_id = $1 and endpoint = $2', [
      request.user!.id,
      endpoint,
    ]);
    return reply.send({ ok: true });
  });
}
