import { config } from '../config.js';
import { one, type Queryable, pool } from '../db.js';
import { dayInTz } from './time.js';
import { notifications } from '../providers/registry.js';
import { logNotice, noticeParts } from './notices.js';
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
 *     do not come back. Excess is not SENT rather than queued: a nudge delivered
 *     a day late is worse than none.
 *   - `system` (the founder broadcast) is exempt and always lands. It is logged
 *     but never counted, so a broadcast can never eat a user's whole budget.
 *
 * The counter lives in the DB (notification_log), not in the in-process limiter
 * of rate-limit.ts, because a container restart must not reset a user's budget.
 *
 * Since the in-app inbox shipped (services/notices.ts) this door has a second
 * job: every message passing through is also WRITTEN, with its text, to the same
 * table. That is what gives a reader with no push permission and no messenger
 * somewhere to see any of this, and what turns a capped message from lost into
 * in-app-only. The `delivered` column is the seam between the two jobs and every
 * query about "was this sent" carries it — see sentCountOn.
 */

/** Kinds that ignore the daily cap entirely. */
const UNCAPPED: ReadonlySet<NotificationKind> = new Set<NotificationKind>([
  'system',
  // The renewal warning. Everything else the cap governs is a nudge we would
  // rather drop than double up on; this one has a subscription on the other
  // side of it, and a user who misses it because a streak reminder arrived
  // first simply lapses.
  'subscription_expiry',
  // The «ستون» welcome. Once per lifetime by construction (see the kind's own
  // doc), so it cannot pester — and it is the founder's one thank-you to a
  // person who just paid, which must not be the message a streak nudge from
  // that morning silently costs them.
  'pillar_seat',
]);

/**
 * How many capped notifications this user has already been SENT on `day`.
 *
 * `delivered` is not optional here. Since the inbox (services/notices.ts) writes
 * to this same table — including for messages the cap itself swallowed and for
 * in-app-only kinds that never travel — counting every row would let the cap
 * feed itself: a user would stop receiving push after a handful of in-site
 * notices, with nothing anywhere saying why. The cap governs the outbound
 * channel, so it counts outbound rows and nothing else.
 */
export async function sentCountOn(
  userId: string,
  day: string,
  client: Queryable = pool,
): Promise<number> {
  const row = await one<{ n: number }>(
    `select count(*)::int as n from notification_log
      where user_id = $1 and day = $2::date and kind <> 'system' and delivered`,
    [userId, day],
    client,
  );
  return row?.n ?? 0;
}

/**
 * Whether this user already got a notification of `kind` on `day` (per-kind dedup).
 *
 * Same `delivered` filter, same reason: this answers "did we already send them
 * one today", and a message that only ever landed in the inbox was not sent. An
 * undelivered row suppressing today's real reminder would turn the inbox into a
 * way of losing notifications instead of a way of keeping them.
 */
export async function alreadySentKindOn(
  userId: string,
  kind: NotificationKind,
  day: string,
  client: Queryable = pool,
): Promise<boolean> {
  const row = await one<{ n: number }>(
    `select count(*)::int as n from notification_log
      where user_id = $1 and kind = $2 and day = $3::date and delivered`,
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
export interface SendOptions {
  /**
   * Whether this message should also appear in اطلاعیه. Default true.
   *
   * Pass `false` when the reader is ALREADY being told by a broadcast — the
   * new-article lane is the case that exists: everyone gets one broadcast row
   * the moment an article is published, and the premium push and the free
   * digest that follow are the same news in a longer wording, on a schedule.
   * Writing those to the inbox too would show the same publish twice, once
   * short and once long.
   *
   * The row is still written, because the row IS the daily-cap counter — with
   * no title, which is exactly the shape of every pre-inbox row and exactly
   * what the inbox query already filters out.
   */
  inbox?: boolean;
}

const COUNTER_ONLY = { title: null as string | null, body: null, url: null };

export async function sendCapped(
  userId: string,
  message: NotificationMessage | string,
  kind: NotificationKind,
  now: Date = new Date(),
  opts: SendOptions = {},
): Promise<boolean> {
  const day = dayInTz(now, config.streakTimezone);
  const inbox = opts.inbox !== false;
  const parts = inbox ? noticeParts(message, kind) : COUNTER_ONLY;

  if (!UNCAPPED.has(kind)) {
    const already = await sentCountOn(userId, day);
    if (already >= config.notify.maxPerDay) {
      // The cap has always DROPPED the overflow, on the reasoning that a nudge
      // delivered a day late is worse than none. That reasoning is about the
      // CHANNEL, not about the news: it is right that this does not wake a phone
      // tomorrow morning, and it was never right that the reader could not find
      // out at all. So the message still lands in اطلاعیه — it just does not
      // travel, and (delivered = false) keeps it out of the counter above.
      //
      // Nothing is written at all when the inbox is not this call's job: an
      // undelivered, titleless row would be a counter entry for something that
      // was never counted.
      if (inbox) await logNotice(userId, kind, day, parts, false);
      return false;
    }
  }

  await logNotice(userId, kind, day, parts, true);
  try {
    await notifications.send(userId, message, kind);
  } catch {
    /* best-effort: a missing destination / dead device never fails the batch */
  }
  return true;
}
