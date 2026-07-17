import { config } from '../../config.js';
import type { SmsSender } from './types.js';
import { ConsoleSmsSender } from './console.js';
import { SmsIrSender } from './smsir.js';

/**
 * Pick the SMS sender from config. Add a real Iranian provider here (a new class
 * implementing SmsSender) and select it by `SMS_PROVIDER`; nothing else changes.
 */
export function createSmsSender(): SmsSender {
  switch (config.otp.provider) {
    case 'console':
      return new ConsoleSmsSender();
    case 'smsir':
      return new SmsIrSender();
    // case 'kavenegar': return new KavenegarSender(...)
    default:
      throw new Error(`Unknown SMS_PROVIDER: ${config.otp.provider}`);
  }
}

export type { SmsSender } from './types.js';
