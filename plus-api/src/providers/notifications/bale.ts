import { one } from '../../db.js';
import { baleSendMessage } from '../../services/bale-api.js';
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
 */
export class BaleNotificationSender implements NotificationSender {
  readonly name = 'bale';

  async send(userId: string, message: string | NotificationMessage, _kind: NotificationKind): Promise<void> {
    const row = await one<{ bale_id: number | null }>(
      'select bale_id from profiles where id = $1',
      [userId],
    );
    const baleId = row?.bale_id ?? null;
    if (!baleId) return; // user has not connected Bale; in-site indicator still shows

    await baleSendMessage(baleId, messageText(message));
  }
}
