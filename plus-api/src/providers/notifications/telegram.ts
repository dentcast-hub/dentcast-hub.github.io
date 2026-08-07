import { config } from '../../config.js';
import { one } from '../../db.js';
import { outboundFetch, describeError, createCircuitBreaker, type BreakerStatus } from '../outbound.js';
import { type NotificationSender, type NotificationKind, type NotificationMessage, messageText } from './types.js';

// One breaker for the whole channel (the host is shared by every user). See
// createCircuitBreaker for why a dead channel must fail fast rather than slowly.
const breaker = createCircuitBreaker('telegram');

/** For GET /admin/notify/health — "is this channel currently being skipped?". */
export function telegramBreakerStatus(): BreakerStatus {
  return breaker.status();
}

/**
 * Telegram notification sender. Stubbed for Phase 1: if no bot token is set (dev),
 * it logs and no-ops. With a token it looks up the user's linked telegram_id and
 * calls the Bot API. The reminder scheduling that drives this is Phase 2; the
 * channel lives behind the NotificationSender interface so it can be swapped.
 */
export class TelegramNotificationSender implements NotificationSender {
  readonly name = 'telegram';

  async send(userId: string, message: string | NotificationMessage, kind: NotificationKind): Promise<void> {
    const row = await one<{ telegram_id: number | null }>(
      'select telegram_id from profiles where id = $1',
      [userId],
    );
    const telegramId = row?.telegram_id ?? null;
    if (!telegramId) return; // user has not linked Telegram; in-site indicator still shows

    const text = messageText(message);
    if (!config.notify.telegramBotToken) {
      // eslint-disable-next-line no-console
      console.log(`[notify:telegram:stub:${kind}] chat=${telegramId} :: ${text}`);
      return;
    }

    // The channel is currently known-dead: skip without paying the timeout. No
    // log line per user on purpose — the breaker already said it once, loudly,
    // and a broadcast would otherwise write one line per reader.
    if (!breaker.allow()) return;

    // api.telegram.org is INTERNATIONAL: from an Iranian pod it may be reachable
    // only through OUTBOUND_PROXY_URL, or not at all. outboundFetch adds that
    // proxy (when set) and a hard timeout, so an unreachable host fails in
    // seconds instead of hanging the rest of the batch behind it.
    const url = `https://api.telegram.org/bot${config.notify.telegramBotToken}/sendMessage`;
    try {
      const res = await outboundFetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramId, text }),
      });
      // ANY answer means the route is alive. A 403 "bot was blocked by the user"
      // is a fact about that reader, not about the channel, and must not count
      // toward opening the breaker.
      breaker.succeeded();
      if (!res.ok) {
        // fetch does NOT reject on a 4xx/5xx, so without this a failed send (e.g.
        // 403 "bot was blocked by the user", 400 "chat not found", bad token)
        // would vanish silently. Log it — best-effort, never throw the batch.
        const detail = await res.text().catch(() => '');
        // eslint-disable-next-line no-console
        console.warn(`[notify:telegram:${kind}] sendMessage ${res.status} chat=${telegramId} :: ${detail.slice(0, 300)}`);
      }
    } catch (err) {
      // Network/DNS failure or timeout reaching api.telegram.org. A `fetch failed`
      // here with Bale still delivering means the pod lost international egress:
      // check GET /admin/notify/health, then set OUTBOUND_PROXY_URL.
      const detail = describeError(err);
      breaker.failed(detail);
      // eslint-disable-next-line no-console
      console.warn(`[notify:telegram:${kind}] network error chat=${telegramId}: ${detail}`);
    }
  }
}
