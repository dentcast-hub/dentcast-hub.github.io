import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { query, withTransaction } from '../db.js';
import { loadUser } from '../middleware/auth.js';
import { issueBaleLinkToken, BALE_LINK_TTL_SECONDS } from '../services/bale-link.js';
import { processBaleUpdate, type BaleUpdate } from '../services/bale-updates.js';

/**
 * Bale (بله) connection — notification channel only (no login widget, no
 * "Login with Bale"). The flow, deliberately mirroring how Telegram's chat_id is
 * captured but WITHOUT a login widget:
 *
 *   1. POST /auth/bale/connect  (logged-in) mints a single-use token; the client
 *      opens the deep link `ble.ir/<bot>?start=<token>`.
 *   2. The user presses Start in Bale; Bale delivers `/start <token>` to
 *      POST /webhooks/bale/:secret. We resolve the token -> account and store the
 *      chat_id in `profiles.bale_id`, then reply "connected!" in Bale.
 *   3. The profile page polls /me until `bale_linked` flips true.
 *
 * The webhook secret lives in the URL PATH (registered once with Bale's
 * setWebhook), so verification does not rely on Bale mirroring Telegram's
 * secret_token header.
 */
export async function baleRoutes(app: FastifyInstance): Promise<void> {
  // --- POST /auth/bale/connect ----------------------------------------------
  // Mint a connect token for the current account. The client builds the deep
  // link from its own (public) bot username and starts polling /me.
  app.post('/auth/bale/connect', async (request, reply) => {
    const user = await loadUser(request);
    if (!user) return reply.code(401).send({ error: 'unauthorized', message: 'ورود لازم است.' });
    const token = issueBaleLinkToken(user.id);
    return reply.send({ token, ttl_seconds: BALE_LINK_TTL_SECONDS });
  });

  // --- POST /auth/bale/unlink -----------------------------------------------
  // Disconnect Bale. Unlike Telegram, Bale is NOT a way to sign in, so removing
  // it can never lock anyone out — no phone-fallback guard needed.
  app.post('/auth/bale/unlink', async (request, reply) => {
    const user = await loadUser(request);
    if (!user) return reply.code(401).send({ error: 'unauthorized', message: 'ورود لازم است.' });
    await withTransaction(async (client) => {
      await query("delete from auth_identities where user_id = $1 and provider = 'bale'", [user.id], client);
      await query('update profiles set bale_id = null where id = $1', [user.id], client);
    });
    return reply.send({ ok: true });
  });

  // --- POST /webhooks/bale/:secret ------------------------------------------
  // Bale posts bot updates here (server-to-server; no browser, no session). The
  // secret in the path guards it. We always reply 200 so Bale does not retry a
  // message we've already handled or intentionally ignored. In production the
  // getUpdates polling worker is the primary path (Bale's webhook delivery is
  // unreliable); this route stays as a harmless fallback and shares the exact
  // same handler.
  app.post<{ Params: { secret: string } }>('/webhooks/bale/:secret', async (request, reply) => {
    const { secret } = request.params;
    if (!config.notify.baleWebhookSecret || secret !== config.notify.baleWebhookSecret) {
      return reply.code(403).send({ error: 'forbidden' });
    }
    await processBaleUpdate((request.body ?? {}) as BaleUpdate);
    return reply.send({ ok: true });
  });
}
