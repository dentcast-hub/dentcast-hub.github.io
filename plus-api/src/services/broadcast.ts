import { query } from '../db.js';
import { claimBroadcastPush, pendingBroadcastPushes, type NoticeAudience } from './notices.js';
import { sendCapped } from './notify-policy.js';
import { describeError } from '../providers/outbound.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * Delivering the founder's broadcast to phones — the half that travels.
 *
 * The اطلاعیه row is written by services/notices.ts and is what every reader
 * actually reads; one row serves everybody, so it cannot half-send. This file is
 * only the optional push on top, and it is fan-out: one send per reader, serial.
 *
 * It lives here rather than in routes/admin.ts because the scheduler needs it
 * too (the morning release), and a scheduler that imports a route module would
 * be reaching through the wrong layer to get at it.
 */

/**
 * How stale a held broadcast may be and still go out. Same reasoning as
 * runPremiumBacklog's FRESH_DAYS: after an outage, a burst of announcements
 * nobody is waiting for any more is worse than silence. A broadcast held
 * overnight is hours old, so this only ever drops the genuinely forgotten.
 */
const HELD_PUSH_MAX_AGE_HOURS = 36;

/**
 * Push one broadcast to everyone it is addressed to.
 *
 * Callers do NOT await this. The fan-out is serial and per-user, so its duration
 * is a function of the audience: on 2026-08-07 a broadcast to every reader ran
 * past the gateway timeout and the founder got a 504 that said nothing about
 * whether the announcement had gone out — and could not be retried, because
 * retrying writes a second اطلاعیه row.
 *
 * Detached means nothing may escape: an unhandled rejection would take the
 * process down, and a silent one would leave a broadcast that reported `queued`
 * and then vanished. So every send is caught per user, the whole run is caught
 * again, and it always ends with one summary line naming the broadcast id.
 */
export function deliverBroadcast(
  id: string,
  audience: NoticeAudience,
  message: NotificationMessage,
  now: Date,
): Promise<void> {
  const p = runDelivery(id, audience, message, now);
  inFlight.add(p);
  void p.finally(() => inFlight.delete(p));
  return p;
}

/**
 * In-flight fan-outs. A detached delivery outlives the request that started it
 * and keeps writing notification_log rows — so a caller that then truncates
 * (every test's resetDb) collides with the row locks it still holds and
 * Postgres kills one of them with `deadlock detected`. Exactly the shape, and
 * exactly the reason, behind drainAchievementSyncs and drainPillarWelcomes; the
 * fan-out grew the same need on 2026-08-08 when it stopped being awaited.
 */
const inFlight = new Set<Promise<unknown>>();

/** Wait for every in-flight fan-out. For tests and clean shutdown. */
export async function drainBroadcasts(): Promise<void> {
  while (inFlight.size) await Promise.all([...inFlight]);
}

async function runDelivery(
  id: string,
  audience: NoticeAudience,
  message: NotificationMessage,
  now: Date,
): Promise<void> {
  const started = Date.now();
  let pushed = 0;
  let failed = 0;
  try {
    const targets = await query<{ id: string }>(
      `select id from profiles
        where ($1 = 'all'
            or ($1 = 'premium' and tier = 'premium')
            or ($1 = 'free' and tier <> 'premium'))
          and (telegram_id is not null or bale_id is not null
               or exists (select 1 from push_subscriptions s where s.user_id = profiles.id))`,
      [audience],
    );
    // eslint-disable-next-line no-console
    console.log(`[broadcast:${id}] delivering to ${targets.rowCount} reader(s), audience=${audience}`);
    for (const t of targets.rows) {
      try {
        if (await sendCapped(t.id, message, 'system', now, { inbox: false })) pushed += 1;
      } catch {
        failed += 1; // one dead device never stops the broadcast
      }
    }
    // eslint-disable-next-line no-console
    console.log(
      `[broadcast:${id}] done pushed=${pushed} failed=${failed} in ${Date.now() - started}ms`,
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[broadcast:${id}] ABORTED after pushed=${pushed} failed=${failed}: ${describeError(err)}`
      + ' — the اطلاعیه row itself is unaffected and every reader still sees it.',
    );
  }
}

/** The push message for a broadcast row. One place, so the manual release and
 *  the morning sweep can never word or tag the same announcement differently. */
export function broadcastMessage(b: {
  id: string; title: string; body: string | null; url: string | null;
}): NotificationMessage {
  return {
    title: b.title,
    body: b.body || b.title,
    url: b.url || '/plus/',
    // Unique per broadcast. Web push REPLACES a notification whose tag is
    // already on screen, so a constant tag let a second announcement silently
    // delete the first from the reader's tray.
    tag: `broadcast:${b.id}`,
  };
}

/**
 * Release the pushes the awake window held overnight. Run by the morning sweep
 * at awakeStartHour, and by POST /admin/notices/release-held on demand.
 *
 * Each broadcast is CLAIMED before delivery, so this run, a second overlapping
 * run, and a founder pressing the manual button cannot all send the same
 * announcement. Whatever is too old is claimed too but NOT sent — and logged,
 * never silently skipped.
 */
export async function releaseHeldBroadcastPushes(
  now: Date = new Date(),
  opts: { awaitDelivery?: boolean } = {},
): Promise<{ released: number; stale: number }> {
  const fresh = await pendingBroadcastPushes(HELD_PUSH_MAX_AGE_HOURS);
  const all = await pendingBroadcastPushes(24 * 365);
  const freshIds = new Set(fresh.map((r) => r.id));

  let stale = 0;
  for (const s of all) {
    if (freshIds.has(s.id)) continue;
    // Claim it so it stops being found, and say what was dropped.
    if (await claimBroadcastPush(s.id)) {
      stale += 1;
      // eslint-disable-next-line no-console
      console.log(`[broadcast:${s.id}] dropped a held push older than ${HELD_PUSH_MAX_AGE_HOURS}h`);
    }
  }

  let released = 0;
  for (const b of fresh) {
    const claimed = await claimBroadcastPush(b.id);
    if (!claimed) continue; // somebody else got it
    const delivery = deliverBroadcast(claimed.id, claimed.audience, broadcastMessage(claimed), now);
    // The fan-out is serial and per-user, so its duration is a function of the
    // audience. An HTTP caller must NOT wait for it — that is the shape that
    // produced the 504 on the broadcast route, and it repeated here on
    // 2026-08-08: the release request timed out client-side while the server
    // carried on, so the operator could not tell whether anything had been sent.
    // The scheduler DOES wait (nobody is holding a connection open, and awaiting
    // keeps the four morning jobs in a predictable order).
    if (opts.awaitDelivery) await delivery; else void delivery;
    released += 1;
  }
  return { released, stale };
}
