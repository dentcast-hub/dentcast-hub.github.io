import { type NotificationSender, type NotificationKind, type NotificationMessage, messageText } from './types.js';

/**
 * Dev notification sender: logs instead of delivering. `NOTIFY_PROVIDER=stub`.
 */
export class StubNotificationSender implements NotificationSender {
  readonly name = 'stub';

  async send(userId: string, message: string | NotificationMessage, kind: NotificationKind): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[notify:${kind}] user=${userId} :: ${messageText(message)}`);
  }
}
