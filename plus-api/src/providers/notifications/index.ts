import { config } from '../../config.js';
import type { NotificationSender } from './types.js';
import { StubNotificationSender } from './stub.js';
import { TelegramNotificationSender } from './telegram.js';
import { BaleNotificationSender } from './bale.js';
import { WebPushNotificationSender } from './webpush.js';
import { MultiNotificationSender } from './multi.js';

function oneSender(name: string): NotificationSender {
  switch (name) {
    case 'stub':
      return new StubNotificationSender();
    case 'telegram':
      return new TelegramNotificationSender();
    case 'bale':
      return new BaleNotificationSender();
    case 'webpush':
      return new WebPushNotificationSender();
    default:
      throw new Error(`Unknown NOTIFY_PROVIDER: ${name}`);
  }
}

/**
 * NOTIFY_PROVIDER is a comma-separated list of channels. A single value
 * (`webpush`) selects that one sender; several (`webpush,telegram,bale`) fan out
 * to all of them via MultiNotificationSender, so a message reaches every channel
 * the user has connected. Order is irrelevant (each channel skips missing users).
 */
export function createNotificationSender(): NotificationSender {
  const names = config.notify.provider.split(',').map((s) => s.trim()).filter(Boolean);
  if (names.length === 0) throw new Error('NOTIFY_PROVIDER is empty');
  const senders = names.map(oneSender);
  return senders.length === 1 ? senders[0] : new MultiNotificationSender(senders);
}

export type { NotificationSender, NotificationKind, NotificationMessage } from './types.js';
