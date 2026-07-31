import { createSmsSender } from './sms/index.js';
import { createNotificationSender } from './notifications/index.js';
import { createAiProvider } from './ai/index.js';

/**
 * Single instances of the swappable providers, selected by env at startup.
 * Business logic imports these, never a concrete provider class.
 */
export const sms = createSmsSender();
export const notifications = createNotificationSender();
export const ai = createAiProvider();
