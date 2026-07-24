import { config } from '../config.js';

/**
 * Low-level Bale Bot API caller. Bale's Bot API mirrors Telegram's shape
 * (`/bot<token>/<method>` with a JSON body) but is hosted on `baleApiBase`
 * (https://tapi.bale.ai), so we keep it separate from the Telegram sender.
 *
 * Shared by BaleNotificationSender (streak / new-article pushes) and the Bale
 * webhook (the "connected!" confirmation reply). Best-effort: with no bot token
 * (dev) it logs and no-ops; a 4xx/5xx or network error is logged, never thrown —
 * a single failed send must not break a notification batch or a webhook reply.
 */
export async function baleSendMessage(chatId: number, text: string): Promise<void> {
  if (!config.notify.baleBotToken) {
    // eslint-disable-next-line no-console
    console.log(`[bale:stub] chat=${chatId} :: ${text}`);
    return;
  }
  const url = `${config.notify.baleApiBase}/bot${config.notify.baleBotToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    if (!res.ok) {
      // fetch does NOT reject on 4xx/5xx; without this a failed send (bot blocked,
      // chat not found, bad token) would vanish silently. Log, never throw.
      const detail = await res.text().catch(() => '');
      // eslint-disable-next-line no-console
      console.warn(`[bale] sendMessage ${res.status} chat=${chatId} :: ${detail.slice(0, 300)}`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[bale] network error chat=${chatId}: ${(err as Error).message}`);
  }
}
