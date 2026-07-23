import { type NotificationSender, type NotificationKind, type NotificationMessage } from './types.js';

/**
 * Fan-out sender: delivers through EVERY configured channel. Each child sender
 * already no-ops quietly for a user who lacks that channel (no telegram_id / no
 * push subscription), so a user simply receives the message on whatever channels
 * they have connected — Telegram, web push, or both.
 *
 * Selected by a comma-separated NOTIFY_PROVIDER, e.g. `webpush,telegram`. Delivery
 * is best-effort per channel (Promise.allSettled): one channel failing never
 * blocks the others.
 */
export class MultiNotificationSender implements NotificationSender {
  readonly name: string;

  constructor(private readonly senders: NotificationSender[]) {
    this.name = `multi(${senders.map((s) => s.name).join('+')})`;
  }

  async send(userId: string, message: string | NotificationMessage, kind: NotificationKind): Promise<void> {
    await Promise.allSettled(this.senders.map((s) => s.send(userId, message, kind)));
  }
}
