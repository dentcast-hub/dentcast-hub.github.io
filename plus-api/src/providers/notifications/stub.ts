import type { NotificationSender, NotificationKind } from './types.js';

/**
 * Dev notification sender: logs instead of delivering. `NOTIFY_PROVIDER=stub`.
 */
export class StubNotificationSender implements NotificationSender {
  readonly name = 'stub';

  async send(userId: string, message: string, kind: NotificationKind): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[notify:${kind}] user=${userId} :: ${message}`);
  }
}
