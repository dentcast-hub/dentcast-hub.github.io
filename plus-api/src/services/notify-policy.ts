import { config } from '../config.js';
import { query, one, type Queryable, pool } from '../db.js';
import { dayInTz } from './time.js';
import { notifications } from '../providers/registry.js';
import type { NotificationKind, NotificationMessage } from '../providers/notifications/types.js';

/**
 * Notification POLICY — the one door every outgoing notification goes through.
 *
 * Layer 1 (article-notify, streak-reminder, reactivation, league-notify,
 * review-notify) decides WHAT and for WHOM. Layer 2 (providers/*) decides HOW it
 * travels. This sits between them and decides WHETHER it may go at all, which is
 * a policy question neither layer should own:
 *
 *   - a per-user DAILY CAP (Tehran day). Instant delivery means a user's day is
 *     no longer capped by "one cron run, one message" — several publishes, a
 *     league outcome and due cards can all land on the same day. Over-notifying
 *     is how a messenger bot gets blocked and push permission revoked, and those
 *     do not come back. Excess is DROPPED rather than queued: a nudge delivered
 *     a day late is worse than none.
 *   - `system` (the founder broadcast) is exempt and always lands. It is logged
 *     but never counted, so a broadcast can never eat a user's whole budget.
 *
 * The counter lives in the DB (notification_log), not in the in-process limiter
 * of rate-limit.ts, because a container restart must not reset a user's budget.
 */

/** Kinds that ignore the daily cap entirely. */
const UNCAPPED: ReadonlySet<NotificationKind> = new Set<NotificationKind>([
  'system',
  // The renewal warning. Everything else the cap governs is a nudge we would
  // rather drop than double up on; this one has a subscription on the other
  // side of it, and a user who misses it because a streak reminder arrived
  // first simply lapses.
  'subscription_expiry',
]);

/** How many capped notifications this user has already been sent on `day`. */
export async function sentCountOn(
  userId: string,
  day: string,
  client: Queryable = pool,
): Promise<number> {
  const row = await one<{ n: number }>(
    `select count(*)::int as n from notification_log
      where user_id = $1 and day = $2::date and kind <> 'system'`,
    [userId, day],
    client,
  );
  return row?.n ?? 0;
}

/** Whether this user already got a notification of `kind` on `day` (per-kind dedup). */
export async function alreadySentKindOn(
  userId: string,
  kind: NotificationKind,
  day: string,
  client: Queryable = pool,
): Promise<boolean> {
  const row = await one<{ n: number }>(
    `select count(*)::int as n from notification_log
      where user_id = $1 and kind = $2 and day = $3::date`,
    [userId, kind, day],
    client,
  );
  return (row?.n ?? 0) > 0;
}

/**
 * Is `now` inside the AWAKE WINDOW (09:00-22:00 Tehran by default)?
 *
 * This is what "instant" actually means for the event-driven kinds. Their events
 * do not respect office hours — a league week finalizes at 00:00, an article can
 * be published at 02:00 — and a push at that hour is not a feature. So inside the
 * window they fire the moment the event happens; outside it their caller HOLDS
 * them (leaves the claim unset) and the morning release sweep sends them at
 * awakeStartHour. Held, never dropped: the news still arrives, just at a humane
 * hour.
 *
 * Half-open [start, end): 22:00 sharp already waits. A window whose start is
 * after its end (e.g. 22 -> 9) is read as wrapping past midnight, and an empty
 * window (start === end) means "always awake".
 */
export function inAwakeWindow(now: Date = new Date()): boolean {
  const { awakeStartHour: start, awakeEndHour: end } = config.notify;
  if (start === end) return true;
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: config.streakTimezone,
      hour12: false,
      hour: '2-digit',
    }).format(now),
  );
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

/**
 * Deliver one notification subject to policy. Returns true when it was handed to
 * the senders, false when the cap swallowed it.
 *
 * The log row is written BEFORE delivery (claim-then-send, the same order the
 * streak/reactivation dedup markers use) so two overlapping sweeps cannot both
 * spend the same slot. Delivery itself stays best-effort: the providers already
 * no-op quietly for a user with no destination, and a dead device must not make
 * this throw into a caller's batch loop.
 */
export async function sendCapped(
  userId: string,
  message: NotificationMessage | string,
  kind: NotificationKind,
  now: Date = new Date(),
): Promise<boolean> {
  const day = dayInTz(now, config.streakTimezone);

  if (!UNCAPPED.has(kind)) {
    const already = await sentCountOn(userId, day);
    if (already >= config.notify.maxPerDay) return false;
  }

  await query(
    'insert into notification_log (user_id, kind, day) values ($1, $2, $3::date)',
    [userId, kind, day],
  );
  try {
    await notifications.send(userId, message, kind);
  } catch {
    /* best-effort: a missing destination / dead device never fails the batch */
  }
  return true;
}
