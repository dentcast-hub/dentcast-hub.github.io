import { config } from '../../config.js';
import type { NotificationSender } from './types.js';
import { StubNotificationSender } from './stub.js';
import { TelegramNotificationSender } from './telegram.js';

export function createNotificationSender(): NotificationSender {
  switch (config.notify.provider) {
    case 'stub':
      return new StubNotificationSender();
    case 'telegram':
      return new TelegramNotificationSender();
    default:
      throw new Error(`Unknown NOTIFY_PROVIDER: ${config.notify.provider}`);
  }
}

export type { NotificationSender, NotificationKind } from './types.js';
