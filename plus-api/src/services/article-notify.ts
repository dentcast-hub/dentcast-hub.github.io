import { config } from '../config.js';
import { one, query, withTransaction, type Queryable, pool } from '../db.js';
import { getIndex, getFolders, folderOf } from '../content-index.js';
import { sendCapped, inAwakeWindow } from './notify-policy.js';
import { recordBroadcast } from './notices.js';
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
  /** The article's Pulse sentence (brain `caption`); the message body. Optional. */
  pulse?: string;
  /** Defaults to now(); injectable so tests can place a publish relative to 21:00. */
  publishedAt?: Date;
}

interface ArticleRow {
  content_id: string;
  title: string;
  url: string;
  pulse: string | null;
  published_at: string;
  notify_free_after: string;
  premium_notified_at: string | null;
  free_notified_at: string | null;
}

const SECTION_FALLBACK = 'دنت‌کست';

/** Persian section (folder) name for the fallback line, from the content index. */
function sectionFa(contentId: string): string {
  try {
    const key = folderOf(contentId);
    return getFolders().find((f) => f.key === key)?.fa || SECTION_FALLBACK;
  } catch {
    return SECTION_FALLBACK;
  }
}

/** The user-visible line for one article: its Pulse, else "a new article in {section}". */
function articleLine(a: { pulse?: string | null; content_id: string }): string {
  const p = (a.pulse || '').trim();
  return p || `مطلب جدیدی در ${sectionFa(a.content_id)} منتشر شد`;
}

/**
 * The اطلاعیه version of a publish — short, and deliberately NOT the Pulse.
 *
 * The push says as much as it can, because it gets one shot at a lock screen.
 * The inbox is a list the reader scans, and a paragraph about the article's
 * argument is the wrong thing to put in a row: what they need is that something
 * new exists, where it is, and what it is called. The article itself is one tap
 * away and says the rest better than any summary of it.
 *
 * ── Why this carries an audience ─────────────────────────────────────────────
 *
 * The 24-hour head start is what premium buys in this lane, and it has to mean
 * the same thing on every surface or it means nothing: announcing a publish to
 * everybody in اطلاعیه the moment it happens would have handed a free reader the
 * premium timing through a different door, complete with a red dot pulling them
 * to it. So the row follows exactly the schedule the push already follows —
 * `premium` at publish, `free` when the digest claims the article a day later.
 *
 * What it deliberately does NOT inherit is the awake window. That exists so a
 * phone does not buzz at 02:00, and a row buzzes nothing; holding it would delay
 * news for a premium reader who is awake and looking, to protect them from an
 * interruption that cannot happen. Access was never gated either way — the
 * article is public, indexed and on the homepage widget from the moment it is
 * published (principle 1); what premium buys is being TOLD first.
 */
async function announceInApp(
  a: { content_id: string; title: string; url: string },
  audience: 'premium' | 'free',
): Promise<void> {
  await recordBroadcast({
    kind: 'article',
    title: `مطلب جدید در ${sectionFa(a.content_id)}`,
    body: a.title,
    url: a.url,
    audience,
  });
}

/** Absolute URL for the (prepared) premium link. */
function absUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return config.articleNotify.siteBaseUrl.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
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
 *  bookkeeping (premium_notified_at / free_notified_at) must not depend on delivery.
 *  Goes through sendCapped so a day with several publishes cannot become a push
 *  storm for one user; a capped recipient is silently skipped, same as one with
 *  no destination.
 *
 *  `inbox: false` throughout this lane: the reader was already told, in one
 *  short line, by the broadcast written at publish time. These pushes are the
 *  same news in a longer wording and on a schedule, and writing them to اطلاعیه
 *  too would show one publish twice. They still write their counter row, which
 *  is what the daily cap is counting. */
async function deliver(userIds: string[], message: NotificationMessage, kind: NotificationKind): Promise<void> {
  for (const id of userIds) {
    try {
      await sendCapped(id, message, kind, new Date(), { inbox: false });
    } catch {
      /* delivery is best-effort; providers already skip missing destinations quietly */
    }
  }
}

/** The premium new-article message for one article. */
function premiumMessage(a: { content_id: string; url: string; pulse?: string | null }): NotificationMessage {
  // Text-only: the Pulse sentence (or the section fallback). Link plumbing is
  // prepared but off (config.articleNotify.linkInText) — a later premium feature.
  let body = articleLine(a);
  if (config.articleNotify.linkInText) body += '\n' + absUrl(a.url);
  return {
    title: 'مطلب جدید در دنت‌کست',
    body,
    url: a.url,
    tag: 'article:' + a.content_id,
  };
}

/**
 * PREMIUM path: fire immediately on `article_published`. No schedule, no queue.
 * Recording the article is idempotent on content_id, so a re-published or
 * duplicate event is a no-op and premium users are never double-notified.
 *
 * "Immediately" is bounded by the AWAKE WINDOW (09:00-22:00 Tehran): a publish at
 * 02:00 must not push at 02:00. Outside the window the article is still RECORDED
 * (and stays public and indexed — the delay is only ever on the active push, per
 * principle 1), premium_notified_at is left null, and runPremiumBacklog() below
 * sends it at 09:00. `deferred` says which of the two happened.
 */
export async function onArticlePublished(input: PublishInput): Promise<{
  recorded: boolean;
  premiumRecipients: number;
  deferred: boolean;
}> {
  const publishedAt = input.publishedAt ?? new Date();
  const notifyFreeAfter = new Date(
    publishedAt.getTime() + config.articleNotify.freeDelayHours * 3_600_000,
  );

  const inserted = await one<ArticleRow>(
    `insert into articles (content_id, title, url, pulse, published_at, notify_free_after)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (content_id) do nothing
     returning *`,
    [input.contentId, input.title, input.url, input.pulse ?? null,
      publishedAt.toISOString(), notifyFreeAfter.toISOString()],
  );
  if (!inserted) return { recorded: false, premiumRecipients: 0, deferred: false };

  // اطلاعیه first, at any hour — but for PREMIUM only, because this is the
  // moment premium's head start begins. The free half of the same announcement
  // is written by runFreeDigest a day later, from the same claim that releases
  // the free push, so one schedule governs both surfaces.
  //
  // The insert is guarded by the `on conflict do nothing` above, so a duplicate
  // publish event cannot announce the same article twice.
  await announceInApp(
    { content_id: input.contentId, title: input.title, url: input.url },
    'premium',
  );

  // Outside waking hours: recorded, not pushed. premium_notified_at stays null,
  // which is exactly what runPremiumBacklog() selects on in the morning.
  if (!inAwakeWindow(publishedAt)) return { recorded: true, premiumRecipients: 0, deferred: true };

  const recipients = await audience('premium');
  const message = premiumMessage({ content_id: input.contentId, url: input.url, pulse: input.pulse });
  await deliver(recipients, message, 'article_premium');
  await query('update articles set premium_notified_at = now() where content_id = $1', [input.contentId]);

  return { recorded: true, premiumRecipients: recipients.length, deferred: false };
}

/**
 * Release the premium pushes that were held overnight. Run by the morning sweep
 * at awakeStartHour; also the self-heal path when the container was down at
 * publish time.
 *
 * Each article is claimed (premium_notified_at) inside a locked transaction
 * BEFORE delivery, the same claim-then-send order the free digest uses, so two
 * overlapping sweeps cannot both send it. Articles older than FRESH_DAYS are
 * claimed too but NOT sent — after a multi-day outage the premium lane's value
 * (you hear about it first) is gone, and a burst of stale pushes is worse than
 * silence. Whatever gets dropped that way is logged, never silently skipped.
 */
const FRESH_DAYS = 2;

export async function runPremiumBacklog(now: Date = new Date()): Promise<{
  articles: number;
  recipients: number;
  stale: number;
}> {
  const claimed = await withTransaction(async (client) => {
    const held = await query<ArticleRow>(
      `select * from articles
        where premium_notified_at is null
        order by published_at asc
        for update skip locked`,
      [],
      client,
    );
    if (held.rowCount === 0) return [] as ArticleRow[];
    await query(
      'update articles set premium_notified_at = $1 where content_id = any($2)',
      [now.toISOString(), held.rows.map((r) => r.content_id)],
      client,
    );
    return held.rows;
  });

  if (claimed.length === 0) return { articles: 0, recipients: 0, stale: 0 };

  const cutoff = now.getTime() - FRESH_DAYS * 86_400_000;
  const fresh = claimed.filter((a) => new Date(a.published_at).getTime() >= cutoff);
  const stale = claimed.length - fresh.length;
  if (stale > 0) {
    // eslint-disable-next-line no-console
    console.log(`[article-premium] dropped ${stale} stale held article(s) (older than ${FRESH_DAYS}d)`);
  }
  if (fresh.length === 0) return { articles: 0, recipients: 0, stale };

  const recipients = await audience('premium');
  for (const a of fresh) {
    await deliver(recipients, premiumMessage(a), 'article_premium');
  }
  return { articles: fresh.length, recipients: recipients.length, stale };
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
 *
 * THIS PATH IS UNCHANGED by the premium instant lane: same 24h delay, same one
 * batched digest, same 21:00 hour. The awake window is the only thing added, and
 * at the default hour it is a no-op (21:00 is inside 09:00-22:00) — it exists so
 * that moving ARTICLE_FREE_DIGEST_HOUR to an antisocial hour, or triggering the
 * digest by hand at 03:00 via /admin/articles/run-free-digest, cannot wake every
 * free user up. Nothing is CLAIMED when it defers, so the batch simply waits for
 * the next run; the misconfiguration is logged rather than swallowed.
 */
export async function runFreeDigest(now: Date = new Date()): Promise<{
  articles: number;
  recipients: number;
  sent: boolean;
  deferred?: boolean;
}> {
  // Before the claim, so a deferred run leaves the batch untouched for next time.
  if (!inAwakeWindow(now)) {
    // eslint-disable-next-line no-console
    console.log('[article-digest] outside the awake window — deferred, nothing claimed');
    return { articles: 0, recipients: 0, sent: false, deferred: true };
  }

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
  // Text-only Pulse sentences. One article -> its Pulse; several -> a bulleted
  // list of Pulses, one per line. No links (per product decision).
  const lines = claimed.map((a) => articleLine(a));
  const body = count === 1 ? lines[0] : lines.map((l) => '• ' + l).join('\n');
  const message: NotificationMessage = {
    title: count === 1 ? 'مطلب جدید در دنت‌کست' : `${toFa(count)} مطلب جدید در دنت‌کست`,
    body,
    url: only ? only.url : '/plus/', // web-push tap target only; no link in the text
    tag: 'article_free_digest',
  };
  // The free half of the اطلاعیه announcement, released by the SAME claim that
  // releases the free push — so the row and the notification can never disagree
  // about when a free reader is told, which is the whole point of the 24-hour
  // rule. One row per article rather than one bundled row: the inbox is a list,
  // and each article deserves its own line and its own link, where the push has
  // to fit everything into one message.
  //
  // Written regardless of how many people the push reaches: the row is for every
  // free reader, not only the ones who opted into notifications — that toggle is
  // about being interrupted, and a row interrupts nobody.
  for (const a of claimed) {
    await announceInApp({ content_id: a.content_id, title: a.title, url: a.url }, 'free');
  }

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
