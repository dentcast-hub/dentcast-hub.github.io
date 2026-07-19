import { config } from '../../config.js';
import { one } from '../../db.js';
import { callTelegramApi } from '../telegram-api.js';
import { type NotificationSender, type NotificationKind, type NotificationMessage, messageText } from './types.js';

/**
 * Telegram notification sender. The user links telegram_id via the bot webhook
 * (routes/telegram.ts, /start -> contact share). If no bot token is set (dev),
 * it logs and no-ops. The channel lives behind the NotificationSender interface
 * so it can be swapped or, later, fanned out alongside web push.
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

    await callTelegramApi('sendMessage', { chat_id: telegramId, text });
  }
}
