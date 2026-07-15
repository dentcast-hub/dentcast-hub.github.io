import { config } from '../../config.js';
import { one } from '../../db.js';
import type { NotificationSender, NotificationKind } from './types.js';

/**
 * Telegram notification sender. Stubbed for Phase 1: if no bot token is set (dev),
 * it logs and no-ops. With a token it looks up the user's linked telegram_id and
 * calls the Bot API. The reminder scheduling that drives this is Phase 2; the
 * channel lives behind the NotificationSender interface so it can be swapped.
 */
export class TelegramNotificationSender implements NotificationSender {
  readonly name = 'telegram';

  async send(userId: string, message: string, kind: NotificationKind): Promise<void> {
    const row = await one<{ telegram_id: number | null }>(
      'select telegram_id from profiles where id = $1',
      [userId],
    );
    const telegramId = row?.telegram_id ?? null;
    if (!telegramId) return; // user has not linked Telegram; in-site indicator still shows

    if (!config.notify.telegramBotToken) {
      // eslint-disable-next-line no-console
      console.log(`[notify:telegram:stub:${kind}] chat=${telegramId} :: ${message}`);
      return;
    }

    const url = `https://api.telegram.org/bot${config.notify.telegramBotToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramId, text: message }),
    });
  }
}
