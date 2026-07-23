import { config } from '../../config.js';
import { one } from '../../db.js';
import { type NotificationSender, type NotificationKind, type NotificationMessage, messageText } from './types.js';

/**
 * Telegram notification sender. Stubbed for Phase 1: if no bot token is set (dev),
 * it logs and no-ops. With a token it looks up the user's linked telegram_id and
 * calls the Bot API. The reminder scheduling that drives this is Phase 2; the
 * channel lives behind the NotificationSender interface so it can be swapped.
 */
export class TelegramNotificationSender implements NotificationSender {
  readonly name = 'telegram';

  async send(userId: string, message: string | NotificationMessage, kind: NotificationKind): Promise<void> {
    const row = await one<{ telegram_id: number | null }>(
      'select telegram_id from profiles where id = $1',
      [userId],
    );
    const telegramId = row?.telegram_id ?? null;
    if (!telegramId) return; // user has not linked Telegram; in-site indicator still shows

    const text = messageText(message);
    if (!config.notify.telegramBotToken) {
      // eslint-disable-next-line no-console
      console.log(`[notify:telegram:stub:${kind}] chat=${telegramId} :: ${text}`);
      return;
    }

    const url = `https://api.telegram.org/bot${config.notify.telegramBotToken}/sendMessage`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramId, text }),
      });
      if (!res.ok) {
        // fetch does NOT reject on a 4xx/5xx, so without this a failed send (e.g.
        // 403 "bot was blocked by the user", 400 "chat not found", bad token)
        // would vanish silently. Log it — best-effort, never throw the batch.
        const detail = await res.text().catch(() => '');
        // eslint-disable-next-line no-console
        console.warn(`[notify:telegram:${kind}] sendMessage ${res.status} chat=${telegramId} :: ${detail.slice(0, 300)}`);
      }
    } catch (err) {
      // Network/DNS failure reaching api.telegram.org.
      // eslint-disable-next-line no-console
      console.warn(`[notify:telegram:${kind}] network error chat=${telegramId}: ${(err as Error).message}`);
    }
  }
}
