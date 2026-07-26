import webpush from 'web-push';
import { config } from '../../config.js';
import { query } from '../../db.js';
import { webPushOptions, describeError } from '../outbound.js';
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

/** Log the push SERVICE (fcm.googleapis.com / web.push.apple.com), never the
 *  full endpoint — the endpoint path is a device secret. */
function endpointHost(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return 'unknown-host';
  }
}

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
    let sent = 0;
    let pruned = 0;
    const failures: string[] = [];

    for (const s of subs.rows) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          // Proxy + timeout: FCM and APNs are international, so from an Iranian
          // pod they are exactly as blockable as Telegram.
          webPushOptions(),
        );
        sent += 1;
      } catch (err) {
        // 404/410 => the subscription is gone (unsubscribed / expired): prune it.
        // That is bookkeeping, NOT a failure — it needs no alarm.
        const e = err as { statusCode?: number; body?: string; message?: string };
        if (e?.statusCode === 404 || e?.statusCode === 410) {
          await query('delete from push_subscriptions where id = $1', [s.id]);
          pruned += 1;
          continue;
        }
        // Everything else IS a failure and must be visible. This branch used to
        // swallow the error entirely, which is why a whole night of undelivered
        // web push left not one line in the logs (2026-07-26). One dead device
        // still never fails the batch — we count it and keep going.
        const detail = (e?.body || e?.message) ? `${e.statusCode ?? ''} ${(e.body || e.message || '').slice(0, 120)}`.trim() : describeError(err);
        failures.push(`${endpointHost(s.endpoint)}: ${detail}`);
      }
    }

    if (failures.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[notify:webpush:${kind}] user=${userId} sent=${sent} failed=${failures.length} pruned=${pruned}`
        + ` :: ${failures.join(' | ')}`,
      );
    } else if (pruned > 0) {
      // eslint-disable-next-line no-console
      console.log(`[notify:webpush:${kind}] user=${userId} sent=${sent} pruned=${pruned} (expired subscriptions)`);
    }
  }
}
