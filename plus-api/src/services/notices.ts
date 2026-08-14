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
  support_reply: 'پشتیبانی',
};

/** Who a broadcast is for, resolved against the reader's tier at READ time. */
export type NoticeAudience = 'all' | 'free' | 'premium';

export interface BroadcastInput {
  /** The inbox label/icon key. Free text, not a NotificationKind: a broadcast
   *  carries its own title and body, so nothing here is ever used to compose a
   *  message — only to draw the row. */
  kind: string;
  title: string;
  body?: string | null;
  url?: string | null;
  audience?: NoticeAudience;
}

/**
 * Announce something to everybody with ONE row.
 *
 * Deliberately not a fan-out. The read state comes from the same watermark the
 * personal rows use, so a broadcast needs no per-user record at all — which
 * means it cannot half-send, cannot be retried into duplicates, and does not
 * grow the table by the size of the audience every time an article is published.
 */
/** The two sites we serve. A link naming either one is a link to "us". */
const MIRROR_HOSTS = new Set([
  'dentcast.ir', 'www.dentcast.ir', 'dentcast.org', 'www.dentcast.org',
]);

/**
 * A link to one of our mirrors, stored as a bare PATH.
 *
 * A broadcast's url is used in two places that must both land on the reader's
 * OWN mirror: the اطلاعیه row, and the push — whose notificationclick resolves
 * a path against the origin that reader subscribed on. The mirrors keep
 * SEPARATE sessions (the API sets a host-only cookie and each site talks to its
 * own api host), so an absolute `https://dentcast.ir/...` in a broadcast signs
 * out every reader of the other site for the page it opens.
 *
 * That is not hypothetical: the 2026-08-10 collections announcement linked the
 * .ir pricing page, and readers on .org arrived anonymous at a price list whose
 * discounts are personal — quoted the public price as if it were their own.
 * Writing the path is what makes the link mean "this page, on your site".
 *
 * Only OUR hosts are rewritten. An external link (a DOI, a Drive folder) has no
 * mirror to stay on and is stored exactly as it was given.
 */
export function mirrorPath(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url, 'https://dentcast.ir');
    if (!MIRROR_HOSTS.has(u.hostname)) return url;
    return u.pathname + u.search + u.hash;
  } catch {
    return url; // not a URL we can parse: keep it rather than lose the link
  }
}

export async function recordBroadcast(
  input: BroadcastInput,
  opts: { pushRequested?: boolean; pushedAt?: Date | null } = {},
): Promise<string> {
  const row = await one<{ id: string }>(
    `insert into notice_broadcasts (kind, title, body, url, audience, push_requested, pushed_at)
     values ($1, $2, $3, $4, $5, $6, $7) returning id`,
    [input.kind, input.title, input.body ?? null, mirrorPath(input.url), input.audience ?? 'all',
      opts.pushRequested ?? false, opts.pushedAt ?? null],
  );
  return row!.id;
}

/** A broadcast whose push was asked for and has not gone out yet. */
export interface PendingBroadcastPush {
  id: string;
  title: string;
  body: string | null;
  url: string | null;
  audience: NoticeAudience;
  created_at: string;
}

/**
 * CLAIM one broadcast's pending push, atomically. Returns the row when this call
 * won the claim, null when there was nothing to send or somebody else took it.
 *
 * The claim IS the update: `pushed_at is null` in the WHERE and `pushed_at = now()`
 * in the SET means two overlapping releases — the morning sweep and a founder
 * pressing the button in the same minute — cannot both win, so an announcement
 * can never reach the same phone twice. Claim-then-send, the same order the free
 * digest and the premium backlog use, and for the same reason: a delivery that
 * fails afterwards loses one push, while sending before claiming would re-send
 * forever.
 */
export async function claimBroadcastPush(id: string): Promise<PendingBroadcastPush | null> {
  return one<PendingBroadcastPush>(
    `update notice_broadcasts
        set pushed_at = now()
      where id = $1 and push_requested and pushed_at is null
      returning id::text as id, title, body, url, audience, created_at`,
    [id],
  );
}

/**
 * Every broadcast still owing a push, oldest first.
 *
 * `maxAgeHours` bounds it for the same reason runPremiumBacklog has FRESH_DAYS:
 * after an outage, a burst of stale announcements is worse than silence. The
 * caller drops what is too old — and says so — rather than this hiding it.
 */
export async function pendingBroadcastPushes(maxAgeHours: number): Promise<PendingBroadcastPush[]> {
  const res = await query<PendingBroadcastPush>(
    `select id::text as id, title, body, url, audience, created_at
       from notice_broadcasts
      where push_requested and pushed_at is null
        and created_at > now() - ($1 || ' hours')::interval
      order by created_at asc`,
    [String(maxAgeHours)],
  );
  return res.rows;
}

export interface NoticeRow {
  /** `log:<uuid>` or `bcast:<uuid>` — the notice_reads key, not a bare table id. */
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
  parts: { title: string | null; body: string | null; url: string | null },
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
 * Everything addressed to this reader, personal and broadcast, as one set.
 *
 * `title is not null` is the go-live guard on the personal side and it is
 * load-bearing: every row written before this feature shipped carries the kind
 * and the day but no message text. It is also what keeps a counter-only row out
 * of the inbox — a push that went out with its own longer wording writes one of
 * those on purpose (see sendCapped's `inbox: false`), because the daily cap
 * counts rows and still needs one.
 *
 * On the broadcast side the two filters are `audience` and, just as important,
 * `created_at > p.created_at`: a reader is never shown news from before they
 * existed, which is what stops a fresh signup opening the inbox onto sixty days
 * of publishes.
 *
 * `id` is prefixed by source (`log:`/`bcast:`) rather than the bare table id:
 * it doubles as the notice_reads key, and the two source tables' uuids are not
 * guaranteed distinct from each other.
 */
const VISIBLE_NOTICES = `
  select 'log:' || n.id::text as id, n.kind, n.title, n.body, n.url, n.created_at
    from notification_log n
   where n.user_id = p.id
     and n.title is not null
     and n.created_at > now() - ($2 || ' days')::interval
  union all
  select 'bcast:' || b.id::text as id, b.kind, b.title, b.body, b.url, b.created_at
    from notice_broadcasts b
   where b.created_at > p.created_at
     and b.created_at > now() - ($2 || ' days')::interval
     and (b.audience = 'all'
          or (b.audience = 'premium' and p.tier = 'premium')
          or (b.audience = 'free' and p.tier <> 'premium'))
`;

/**
 * A notice is unread only when it is BOTH newer than the watermark AND absent
 * from notice_reads — the watermark still covers everything that predates
 * per-notice tracking (no backfill needed), while a row past the watermark can
 * now be acknowledged individually instead of dragging every other unread row
 * down with it (see markNoticeSeen).
 */
const UNREAD_EXPR = `
  t.created_at > coalesce(p.notices_seen_at, to_timestamp(0))
  and not exists (
    select 1 from notice_reads r where r.user_id = p.id and r.notice_key = t.id
  )
`;

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
    `select t.id, t.kind, t.title, t.body, t.url, t.created_at,
            (${UNREAD_EXPR}) as unread
       from profiles p
       cross join lateral (${VISIBLE_NOTICES}) t
      where p.id = $1
      order by t.created_at desc
      limit $3`,
    [userId, String(WINDOW_DAYS), MAX_ROWS],
  );
  return res.rows;
}

/** How many notices this user has not looked at yet. Cheap enough for /me. */
export async function unreadNoticeCount(userId: string): Promise<number> {
  const row = await one<{ n: number }>(
    `select count(*)::int as n
       from profiles p
       cross join lateral (${VISIBLE_NOTICES}) t
      where p.id = $1
        and (${UNREAD_EXPR})`,
    [userId, String(WINDOW_DAYS)],
  );
  return row?.n ?? 0;
}

/**
 * Move the watermark to now. Idempotent by construction — there is no per-row
 * state to get half-written, so a retry, a double click and two open tabs all
 * end in the same place. Still available as an explicit "mark everything"
 * write; the panel itself no longer calls this on open (see markNoticeSeen).
 */
export async function markNoticesSeen(userId: string): Promise<void> {
  await query('update profiles set notices_seen_at = now() where id = $1', [userId]);
}

/**
 * Acknowledge exactly ONE notice — the fix for the watermark's blind spot: a
 * reader who opens one card must not have every other unread card go dark with
 * it. `on conflict do nothing` because a double click, two open tabs, or a
 * retried request all end up wanting the same single row to exist.
 */
export async function markNoticeSeen(userId: string, noticeKey: string): Promise<void> {
  await query(
    `insert into notice_reads (user_id, notice_key) values ($1, $2)
     on conflict (user_id, notice_key) do nothing`,
    [userId, noticeKey],
  );
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
       (select count(*)::int
          from (${VISIBLE_NOTICES}) t
         where ${UNREAD_EXPR}) as unread,
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
