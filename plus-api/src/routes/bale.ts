import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { query, withTransaction } from '../db.js';
import { loadUser } from '../middleware/auth.js';
import { issueBaleLinkToken, consumeBaleLinkToken, BALE_LINK_TTL_SECONDS } from '../services/bale-link.js';
import { baleSendMessage } from '../services/bale-api.js';

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
  // message we've already handled or intentionally ignored.
  app.post<{ Params: { secret: string } }>('/webhooks/bale/:secret', async (request, reply) => {
    const { secret } = request.params;
    if (!config.notify.baleWebhookSecret || secret !== config.notify.baleWebhookSecret) {
      return reply.code(403).send({ error: 'forbidden' });
    }

    // Telegram-compatible update shape. Read defensively; ignore anything that
    // isn't a text message we understand.
    const update = request.body as {
      message?: { chat?: { id?: number }; from?: { id?: number; username?: string; first_name?: string; last_name?: string }; text?: string };
    } | null;
    const msg = update?.message;
    const chatId = msg?.chat?.id;
    const text = (msg?.text ?? '').trim();
    if (typeof chatId !== 'number' || !text) return reply.send({ ok: true });

    // Only /start carries a connect token. `/start <token>` (deep link) or bare
    // `/start` (no token -> guidance).
    if (!text.startsWith('/start')) return reply.send({ ok: true });
    const token = text.slice('/start'.length).trim();
    if (!token) {
      await baleSendMessage(chatId, 'برای اتصال، از صفحه‌ی پروفایل دنت‌کست روی «اتصال به بله» بزنید تا لینک اختصاصی‌تان ساخته شود.');
      return reply.send({ ok: true });
    }

    const userId = consumeBaleLinkToken(token);
    if (!userId) {
      await baleSendMessage(chatId, 'این لینک اتصال معتبر نیست یا منقضی شده. لطفاً از پروفایل دنت‌کست دوباره «اتصال به بله» را بزنید.');
      return reply.send({ ok: true });
    }

    const from = msg?.from ?? {};
    const username = from.username ?? null;
    const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || null;

    await withTransaction(async (client) => {
      // The partial unique index binds a Bale chat to at most one profile: free it
      // from any OTHER account before claiming it for this one (a user re-connecting
      // the same Bale to a different DentCast account).
      await query('update profiles set bale_id = null where bale_id = $1 and id <> $2', [chatId, userId], client);
      await query('update profiles set bale_id = $2 where id = $1', [userId, chatId], client);
      // Record the identity (provider-agnostic; future-proofs a later Bale login).
      await query(
        `insert into auth_identities (user_id, provider, provider_user_id, username, display_name)
         values ($1, 'bale', $2, $3, $4)
         on conflict (provider, provider_user_id)
           do update set user_id = excluded.user_id, username = excluded.username,
                         display_name = excluded.display_name, updated_at = now()`,
        [userId, String(chatId), username, name], client,
      );
    });

    await baleSendMessage(chatId, '✅ حساب بله‌ی شما به دنت‌کست وصل شد. از این پس یادآوری استریک و اطلاع مطلب جدید را اینجا دریافت می‌کنید.');
    return reply.send({ ok: true });
  });
}
