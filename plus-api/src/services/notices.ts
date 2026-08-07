import { pool, query, one, type Queryable } from '../db.js';
import type { NotificationKind, NotificationMessage } from '../providers/notifications/types.js';

/**
 * اطلاعیه — the in-app inbox.
 *
 * Every notification the API produces already passes through exactly one
 * function (`sendCapped` in notify-policy.ts, "the one door every outgoing
 * notification goes through"). This module is what that door now writes to on
 * its way past, which is why seven notification kinds get an in-site home
 * without a single one of their services being touched.
 *
 * Two things it fixes that were not visible as bugs:
 *
 *   · A reader who granted no push permission and linked no messenger received
 *     NOTHING. The providers no-op quietly for a user with no destination, so
 *     the product had been sending into the void for that whole cohort.
 *   · The daily cap DROPS a message rather than queueing it. That is right for
 *     a channel whose quota does not come back (a blocked bot, a revoked push
 *     permission) and wrong for the news itself. Now the cap only decides
 *     whether the message TRAVELS; it always lands here.
 *
 * The row is the same row the cap already counted — notification_log — with the
 * message text alongside it. `delivered` keeps the two jobs apart: an in-app-only
 * row must never be counted against the outbound budget (see sentCountOn).
 */

/** How far back the panel reads. Older news is not news. */
const WINDOW_DAYS = 60;

/** Hard ceiling on one panel load, so a heavy account cannot build 900 nodes. */
const MAX_ROWS = 60;

/**
 * A fallback title per kind, for the callers that hand `sendCapped` a plain
 * string (the messenger channels flatten to text and never needed one). The
 * inbox is a list of rows and a row without a title is unreadable, so the kind
 * supplies the shortest honest heading rather than the body being cut in half.
 */
const KIND_TITLE_FA: Record<string, string> = {
  reminder: 'یادآوری',
  streak: 'استریک',
  system: 'دنت‌کست',
  article_premium: 'محتوای تازه',
  article_free_digest: 'محتوای تازه',
  league: 'لیگ',
  review: 'مرور',
  premium_prize: 'جایزه',
  subscription_expiry: 'اشتراک',
  achievement: 'نشانِ تازه',
};

export interface NoticeRow {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  url: string | null;
  created_at: string;
  unread: boolean;
}

/** Split a message into the three columns the inbox renders. */
export function noticeParts(
  message: string | NotificationMessage,
  kind: NotificationKind,
): { title: string; body: string | null; url: string | null } {
  if (typeof message === 'string') {
    return { title: KIND_TITLE_FA[kind] ?? 'دنت‌کست', body: message, url: null };
  }
  return { title: message.title, body: message.body || null, url: message.url ?? null };
}

/**
 * Write one row of notification_log — the cap counter AND the inbox entry.
 *
 * `delivered` is the caller's statement about the outbound channel only:
 * false means "this is in the inbox but was never handed to a sender", which is
 * both a capped message and an in-app-only kind. Nothing about it changes what
 * the reader sees here.
 */
export async function logNotice(
  userId: string,
  kind: NotificationKind,
  day: string,
  parts: { title: string; body: string | null; url: string | null },
  delivered: boolean,
  client: Queryable = pool,
): Promise<void> {
  await query(
    `insert into notification_log (user_id, kind, day, title, body, url, delivered)
     values ($1, $2, $3::date, $4, $5, $6, $7)`,
    [userId, kind, day, parts.title, parts.body, parts.url, delivered],
    client,
  );
}

/**
 * A notice that exists only inside the site — never pushed, never counted
 * against the daily cap.
 *
 * Used by the achievement announcer. A badge lights while the reader is almost
 * always already on the page, so a push would arrive at the one moment it is
 * pure noise, and it would spend a slot of a budget that protects a channel we
 * cannot get back once a user mutes it.
 */
export async function recordInAppNotice(
  userId: string,
  kind: NotificationKind,
  message: NotificationMessage,
  day: string,
  client: Queryable = pool,
): Promise<void> {
  await logNotice(userId, kind, day, noticeParts(message, kind), false, client);
}

/**
 * The panel's rows, newest first.
 *
 * `title is not null` is the go-live guard and it is load-bearing: every row
 * written before this feature shipped carries the kind and the day but no
 * message text. Showing them would mean inventing copy for a notification we
 * actually sent months ago, so they stay out — and, together with the migration
 * stamping notices_seen_at on every existing profile, that is what makes launch
 * day silent instead of a hundred-row backlog.
 */
export async function listNotices(userId: string): Promise<NoticeRow[]> {
  const res = await query<NoticeRow>(
    `select n.id, n.kind, n.title, n.body, n.url,
            n.created_at,
            (n.created_at > coalesce(p.notices_seen_at, to_timestamp(0))) as unread
       from notification_log n
       join profiles p on p.id = n.user_id
      where n.user_id = $1
        and n.title is not null
        and n.created_at > now() - ($2 || ' days')::interval
      order by n.created_at desc
      limit $3`,
    [userId, String(WINDOW_DAYS), MAX_ROWS],
  );
  return res.rows;
}

/** How many notices this user has not looked at yet. Cheap enough for /me. */
export async function unreadNoticeCount(userId: string): Promise<number> {
  const row = await one<{ n: number }>(
    `select count(*)::int as n
       from notification_log n
       join profiles p on p.id = n.user_id
      where n.user_id = $1
        and n.title is not null
        and n.created_at > coalesce(p.notices_seen_at, to_timestamp(0))
        and n.created_at > now() - ($2 || ' days')::interval`,
    [userId, String(WINDOW_DAYS)],
  );
  return row?.n ?? 0;
}

/**
 * Move the watermark to now. Idempotent by construction — there is no per-row
 * state to get half-written, so a retry, a double click and two open tabs all
 * end in the same place.
 */
export async function markNoticesSeen(userId: string): Promise<void> {
  await query('update profiles set notices_seen_at = now() where id = $1', [userId]);
}

/**
 * Both header counters in ONE round trip, for /me.
 *
 * /me is called once per page view by every visitor and is the call the Spot
 * card waits on before a sponsor's impression can render, so the budget here is
 * "one indexed query", not "one per feature". They are fetched together despite
 * belonging to two different features for exactly that reason — and both are
 * counts against a partial index, never a scan.
 */
export async function noticeCounters(
  userId: string,
): Promise<{ unread_notices: number; pending_achievements: number }> {
  const row = await one<{ unread: number; pending: number }>(
    `select
       (select count(*)::int from notification_log n
         where n.user_id = p.id
           and n.title is not null
           and n.created_at > coalesce(p.notices_seen_at, to_timestamp(0))
           and n.created_at > now() - ($2 || ' days')::interval) as unread,
       (select count(*)::int from achievement_announcements a
         where a.user_id = p.id and a.seen_at is null) as pending
     from profiles p where p.id = $1`,
    [userId, String(WINDOW_DAYS)],
  );
  return {
    unread_notices: row?.unread ?? 0,
    pending_achievements: row?.pending ?? 0,
  };
}
