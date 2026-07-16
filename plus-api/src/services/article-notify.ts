import { config } from '../config.js';
import { one, query, withTransaction, type Queryable, pool } from '../db.js';
import { getIndex } from '../content-index.js';
import { notifications } from '../providers/registry.js';
import type { NotificationKind, NotificationMessage } from '../providers/notifications/types.js';

/**
 * New-article notifications, Layer 1: scheduling & selection. Decides WHAT
 * message, for WHOM, WHEN. It is channel-agnostic: it only calls the
 * provider-agnostic notifications.send(); which channel actually delivers (web
 * push now, messengers later) is Layer 2's concern.
 *
 * The article is public and indexed at publish time; the 24h delay below is only
 * on the ACTIVE PUSH to free users, never on access (principle 1).
 */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
function toFa(n: number): string {
  return String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export interface PublishInput {
  contentId: string;
  title: string;
  url: string;
  /** Defaults to now(); injectable so tests can place a publish relative to 21:00. */
  publishedAt?: Date;
}

interface ArticleRow {
  content_id: string;
  title: string;
  url: string;
  published_at: string;
  notify_free_after: string;
  premium_notified_at: string | null;
  free_notified_at: string | null;
}

/**
 * Who WANTS a new-article push at this tier: users who opted into the
 * "نوتیف مطلب جدید" toggle (settings.reminders.new_content). This is the
 * free/premium split by TIER; the on/off is the user's own preference. Whether
 * they CAN receive it (a live push subscription) is decided in Layer 2, which
 * silently skips anyone without one.
 */
async function audience(tier: 'free' | 'premium', client: Queryable = pool): Promise<string[]> {
  const res = await query<{ id: string }>(
    `select id from profiles
      where tier = $1
        and coalesce((settings->'reminders'->>'new_content')::boolean, false) = true`,
    [tier],
    client,
  );
  return res.rows.map((r) => r.id);
}

/** Best-effort fan-out. A failing channel/device never fails selection: Layer 1's
 *  bookkeeping (premium_notified_at / free_notified_at) must not depend on delivery. */
async function deliver(userIds: string[], message: NotificationMessage, kind: NotificationKind): Promise<void> {
  for (const id of userIds) {
    try {
      await notifications.send(id, message, kind);
    } catch {
      /* delivery is best-effort; providers already skip missing destinations quietly */
    }
  }
}

/**
 * PREMIUM path: fire immediately on `article_published`. No schedule, no queue.
 * Recording the article is idempotent on content_id, so a re-published or
 * duplicate event is a no-op and premium users are never double-notified.
 */
export async function onArticlePublished(input: PublishInput): Promise<{
  recorded: boolean;
  premiumRecipients: number;
}> {
  const publishedAt = input.publishedAt ?? new Date();
  const notifyFreeAfter = new Date(
    publishedAt.getTime() + config.articleNotify.freeDelayHours * 3_600_000,
  );

  const inserted = await one<ArticleRow>(
    `insert into articles (content_id, title, url, published_at, notify_free_after)
     values ($1, $2, $3, $4, $5)
     on conflict (content_id) do nothing
     returning *`,
    [input.contentId, input.title, input.url, publishedAt.toISOString(), notifyFreeAfter.toISOString()],
  );
  if (!inserted) return { recorded: false, premiumRecipients: 0 };

  const recipients = await audience('premium');
  const message: NotificationMessage = {
    title: 'مطلب جدید در دنت‌کست',
    body: input.title,
    url: input.url,
    tag: 'article:' + input.contentId,
  };
  await deliver(recipients, message, 'article_premium');
  await query('update articles set premium_notified_at = now() where content_id = $1', [input.contentId]);

  return { recorded: true, premiumRecipients: recipients.length };
}

/**
 * FREE path: the digest run (cron at 21:00 Asia/Tehran). Selects every article
 * whose notify_free_after has passed and has not been sent to free users, batches
 * them into ONE digest, sends it once, and marks them sent so they are never
 * re-sent. `now` is injectable for deterministic tests.
 *
 * The due batch is CLAIMED atomically (marked sent inside a locked transaction)
 * before delivery, so two overlapping runs cannot both send it and a delivery
 * failure never un-marks a claim. Delivery happens after the claim commits, so a
 * large fan-out never holds a DB lock.
 */
export async function runFreeDigest(now: Date = new Date()): Promise<{
  articles: number;
  recipients: number;
  sent: boolean;
}> {
  const claimed = await withTransaction(async (client) => {
    const due = await query<ArticleRow>(
      `select * from articles
        where free_notified_at is null and notify_free_after <= $1
        order by published_at asc
        for update skip locked`,
      [now.toISOString()],
      client,
    );
    if (due.rowCount === 0) return [] as ArticleRow[];
    const ids = due.rows.map((r) => r.content_id);
    await query(
      'update articles set free_notified_at = $1 where content_id = any($2)',
      [now.toISOString(), ids],
      client,
    );
    return due.rows;
  });

  if (claimed.length === 0) return { articles: 0, recipients: 0, sent: false };

  const count = claimed.length;
  const only = count === 1 ? claimed[0] : null;
  const message: NotificationMessage = {
    title: 'دنت‌کست پلاس',
    body: count === 1 ? 'یک مطلب جدید' : `${toFa(count)} مطلب جدید`,
    url: only ? only.url : '/plus/', // one article deep-links to it; many -> recent list
    tag: 'article_free_digest',
  };
  const recipients = await audience('free');
  await deliver(recipients, message, 'article_free_digest');

  return { articles: count, recipients: recipients.length, sent: recipients.length > 0 };
}

/**
 * One-time go-live safety: record every ALREADY-PUBLISHED page (from the content
 * index) as already-notified, so editing an old article later never looks like a
 * fresh publish and pings premium. Idempotent (existing rows are left untouched);
 * safe to re-run. Must be run once before the auto-publish Action is enabled.
 */
export async function backfillExistingContent(now: Date = new Date()): Promise<{
  inserted: number;
  total: number;
}> {
  const byContent = getIndex().byContent || {};
  const ids = Object.keys(byContent);
  const nowIso = now.toISOString();
  let inserted = 0;
  for (const cid of ids) {
    const info = byContent[cid];
    // All timestamps = now: premium_notified_at + free_notified_at set means this
    // content is done and can never be selected as new or due.
    const res = await query(
      `insert into articles
         (content_id, title, url, published_at, notify_free_after, premium_notified_at, free_notified_at)
       values ($1, $2, $3, $4, $4, $4, $4)
       on conflict (content_id) do nothing`,
      [cid, info.title || cid, info.url || `/${cid}.html`, nowIso],
    );
    inserted += res.rowCount ?? 0;
  }
  return { inserted, total: ids.length };
}
