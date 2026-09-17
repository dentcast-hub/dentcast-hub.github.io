import { one } from '../../db.js';
import { baleSendMessage } from '../../services/bale-api.js';
import { channelWanted } from '../../services/notify-channels.js';
import { type NotificationSender, type NotificationKind, type NotificationMessage, messageText } from './types.js';

/**
 * Bale (بله) notification sender — the domestic twin of TelegramNotificationSender.
 * It looks up the user's linked `bale_id` (the chat_id captured when they connected
 * Bale from their profile) and messages them via the Bale Bot API. A user who has
 * not connected Bale has a NULL bale_id and is skipped QUIETLY — the same expected
 * state as an un-linked Telegram or no push subscription. The in-site indicators
 * are always present regardless.
 *
 * Selected by including `bale` in NOTIFY_PROVIDER (e.g. `webpush,telegram,bale`);
 * MultiNotificationSender then fans a message out to every channel a user has.
 *
 * Since 2026-09-16 the same row also answers «از کجا برسد»: the two matrix kinds
 * (new article, streak) are skipped when the reader switched Bale off for them
 * in the profile (services/notify-channels.ts). One query serves both questions.
 */
export class BaleNotificationSender implements NotificationSender {
  readonly name = 'bale';

  async send(userId: string, message: string | NotificationMessage, kind: NotificationKind): Promise<void> {
    const row = await one<{ bale_id: number | null; settings: unknown }>(
      'select bale_id, settings from profiles where id = $1',
      [userId],
    );
    const baleId = row?.bale_id ?? null;
    if (!baleId) return; // user has not connected Bale; in-site indicator still shows
    if (!channelWanted(row?.settings ?? {}, 'bale', kind)) return;

    await baleSendMessage(baleId, messageText(message));
  }
}
