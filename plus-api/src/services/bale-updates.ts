import { config } from '../config.js';
import { query, one, withTransaction } from '../db.js';
import { consumeBaleLinkToken } from './bale-link.js';
import { baleSendMessage } from './bale-api.js';

/**
 * Shared Bale update handling, used by BOTH delivery paths:
 *   - the webhook route (POST /webhooks/bale/:secret), and
 *   - the getUpdates polling worker below.
 *
 * Bale's webhook delivery proved unreliable for our bot (updates were observed
 * sitting in the getUpdates queue instead of being POSTed to the webhook), so
 * POLLING is the primary, dependable path in production; the webhook stays wired
 * as a harmless fallback. Both funnel through processBaleUpdate so the linking
 * logic lives in exactly one place.
 */

export interface BaleUpdate {
  update_id?: number;
  message?: {
    chat?: { id?: number };
    from?: { id?: number; username?: string; first_name?: string; last_name?: string };
    text?: string;
  };
}

/**
 * Handle one Bale update. Only `/start <token>` (from the profile connect deep
 * link) does anything: it resolves the one-time token to an account and stores
 * the chat_id in profiles.bale_id. Idempotent-safe: a re-delivered/duplicate
 * `/start` for an already-linked chat replies with nothing scary.
 */
export async function processBaleUpdate(update: BaleUpdate): Promise<void> {
  const msg = update?.message;
  const chatId = msg?.chat?.id;
  const text = (msg?.text ?? '').trim();
  if (typeof chatId !== 'number' || !text) return;
  if (!text.startsWith('/start')) return;

  const token = text.slice('/start'.length).trim();
  if (!token) {
    await baleSendMessage(chatId, 'برای اتصال، از صفحه‌ی پروفایل دنت‌کست روی «اتصال به بله» بزنید تا لینک اختصاصی‌تان ساخته شود.');
    return;
  }

  const userId = consumeBaleLinkToken(token);
  if (!userId) {
    // Token unknown/expired/already-used. If this chat is ALREADY linked (a
    // duplicate delivery, or the user pressing Start twice), stay silent rather
    // than sending an alarming "invalid link" right after a success.
    const linked = await one<{ one: number }>('select 1 as one from profiles where bale_id = $1', [chatId]);
    if (!linked) {
      await baleSendMessage(chatId, 'این لینک اتصال معتبر نیست یا منقضی شده. لطفاً از پروفایل دنت‌کست دوباره «اتصال به بله» را بزنید.');
    }
    return;
  }

  const from = msg?.from ?? {};
  const username = from.username ?? null;
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || null;

  await withTransaction(async (client) => {
    // The partial unique index binds a Bale chat to at most one profile: free it
    // from any OTHER account before claiming it for this one.
    await query('update profiles set bale_id = null where bale_id = $1 and id <> $2', [chatId, userId], client);
    await query('update profiles set bale_id = $2 where id = $1', [userId, chatId], client);
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
}

const sleep = (ms: number): Promise<void> => new Promise((r) => { setTimeout(r, ms); });

/**
 * Long-poll getUpdates and process each update. Started at boot (index.ts) only
 * when a bot token is configured; a no-op in dev/test. Deletes any set webhook
 * first so the two paths never compete or double-deliver, then loops. Offset is
 * in-memory: after a restart Bale re-serves un-acked updates, and re-processing a
 * spent `/start` is harmless (token already consumed -> silent).
 */
export function startBalePolling(): () => void {
  if (!config.notify.baleBotToken) return () => {};
  let stopped = false;
  const base = `${config.notify.baleApiBase}/bot${config.notify.baleBotToken}`;

  (async () => {
    // Ensure polling isn't competing with a previously-set webhook.
    try { await fetch(`${base}/deleteWebhook`); } catch { /* best-effort */ }

    let offset = 0;
    while (!stopped) {
      try {
        const url = `${base}/getUpdates?timeout=25${offset ? `&offset=${offset}` : ''}`;
        const res = await fetch(url);
        if (!res.ok) { await sleep(3000); continue; }
        const body = await res.json().catch(() => null) as { result?: BaleUpdate[] } | null;
        const updates = body?.result ?? [];
        for (const u of updates) {
          try {
            await processBaleUpdate(u);
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn(`[bale:poll] process error: ${(err as Error).message}`);
          }
          if (typeof u.update_id === 'number') offset = Math.max(offset, u.update_id + 1);
        }
      } catch (err) {
        // Network/DNS hiccup reaching Bale: back off and retry.
        // eslint-disable-next-line no-console
        console.warn(`[bale:poll] getUpdates error: ${(err as Error).message}`);
        await sleep(3000);
      }
    }
  })();

  return () => { stopped = true; };
}
