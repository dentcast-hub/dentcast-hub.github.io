import webpush from 'web-push';
import { config } from '../../config.js';
import { query } from '../../db.js';
import { type NotificationSender, type NotificationKind, type NotificationMessage, messageText } from './types.js';

/**
 * Web Push delivery. The live channel for the public release: browser / installed
 * PWA notifications, shown by the /plus service worker.
 *
 * Silently skips users with no subscription. Web push cannot be granted before
 * auth and, on iOS, only works once the PWA is installed to the home screen, so
 * "no subscription" is an EXPECTED state for many users, not a failure. We do not
 * throw and do not log it as an error. (This is exactly why the messenger
 * channels exist as complements.)
 */
let vapidConfigured = false;
function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  if (!config.push.vapidPublicKey || !config.push.vapidPrivateKey) return false;
  webpush.setVapidDetails(config.push.vapidSubject, config.push.vapidPublicKey, config.push.vapidPrivateKey);
  vapidConfigured = true;
  return true;
}

function payloadFor(message: string | NotificationMessage): string {
  if (typeof message === 'string') {
    return JSON.stringify({ title: 'دنت‌کست پلاس', body: message, url: '/plus/' });
  }
  return JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url || '/plus/',
    tag: message.tag,
  });
}

interface SubRow { id: string; endpoint: string; p256dh: string; auth: string; }

export class WebPushNotificationSender implements NotificationSender {
  readonly name = 'webpush';

  async send(userId: string, message: string | NotificationMessage, kind: NotificationKind): Promise<void> {
    const subs = await query<SubRow>(
      'select id, endpoint, p256dh, auth from push_subscriptions where user_id = $1',
      [userId],
    );
    if (subs.rowCount === 0) return; // expected: user has no push destination -> skip quietly

    if (!ensureVapid()) {
      // Dev without VAPID keys: log instead of sending, so the pipeline still runs.
      // eslint-disable-next-line no-console
      console.log(`[notify:webpush:stub:${kind}] user=${userId} subs=${subs.rowCount} :: ${messageText(message)}`);
      return;
    }

    const payload = payloadFor(message);
    for (const s of subs.rows) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
      } catch (err) {
        // 404/410 => the subscription is gone (unsubscribed / expired): prune it.
        // Anything else is a transient delivery hiccup for THIS endpoint, not a
        // bug in the caller; swallow it so one dead device never fails the batch.
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await query('delete from push_subscriptions where id = $1', [s.id]);
        }
      }
    }
  }
}
