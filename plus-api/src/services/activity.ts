import type pg from 'pg';
import { pool, withTransaction, lockProfileForWrite } from '../db.js';
import { QUALIFYING_ACTIONS, applyStreak } from './streak.js';
import { awardLeagueXp, leagueWeek } from './league.js';
import { getLeagueConfig } from './league-config.js';
import { dayInTz } from './time.js';
import { getSubscription, isPremiumNow } from './subscription.js';

/**
 * Append an event to the append-only `user_activity` log. This log is the single
 * source of truth; every streak cache is reconstructable from it.
 *
 * When the action is a qualifying one, the streak caches are advanced in the
 * SAME transaction and a `streak_kept` event is appended if a new Tehran day is
 * counted. The day is taken from the inserted row's own created_at so a rebuild
 * (which reads created_at) always agrees with the live path.
 *
 * IMPORTANT: `card_reviewed_manual` flows through here and counts for the streak,
 * but MUST NOT touch `card_state`. Nothing here writes to `card_state`; keep it
 * that way.
 */
/**
 * How late a completion may arrive and still be dated when it was EARNED.
 *
 * The browser's outbox (plus/js/outbox.js) keeps a completion it could not
 * deliver — network drop, a page closed mid-send, a 429 pace ceiling, a 409
 * for a page newer than the API's index, a lapsed session — and re-sends it
 * later, sometimes days later. Dated by arrival, that read landed on the wrong
 * Tehran day: the day it was earned stayed empty and a shield was spent on it
 * (user report 1405/09: «هر روز اومدم، سه روز سپر خورده»).
 *
 * The earned instant is honoured only when it cannot rewrite history:
 *   · it is in the past and at most EARNED_AT_MAX_AGE_MS old;
 *   · its Tehran day is not before the profile's last counted day — the
 *     streak engine is forward-only (computeStreakUpdate), and a day earlier
 *     than the last one would read as a reset, not a repair;
 *   · it falls in the CURRENT league week, so league XP is never written into
 *     a week that may already be finalized.
 * Anything else is dated on arrival, exactly as before. The row itself carries
 * the earned instant as its created_at, so every reader of the log — rebuild,
 * repair, presence board, monthly report, league counts — agrees with the live
 * decision without a second date column to keep in step.
 */
export const EARNED_AT_MAX_AGE_MS = 72 * 3600 * 1000;

async function honouredEarnedAt(
  client: pg.PoolClient,
  userId: string,
  earnedAt: Date | null | undefined,
  now: Date,
): Promise<Date | null> {
  if (!earnedAt || Number.isNaN(earnedAt.getTime())) return null;
  const age = now.getTime() - earnedAt.getTime();
  if (age <= 0 || age > EARNED_AT_MAX_AGE_MS) return null;
  const earnedDay = dayInTz(earnedAt);
  if (earnedDay === dayInTz(now)) return null; // same day: arrival time is already right
  const prof = await client.query<{ last_active_day: string | null }>(
    `select to_char(last_active_day, 'YYYY-MM-DD') as last_active_day from profiles where id = $1`,
    [userId],
  );
  const last = prof.rows[0]?.last_active_day ?? null;
  if (last && earnedDay < last) return null;
  const tz = (await getLeagueConfig(client)).timezone;
  if (leagueWeek(dayInTz(earnedAt, tz)).week_start !== leagueWeek(dayInTz(now, tz)).week_start) return null;
  return earnedAt;
}

async function insertAndScore(
  client: pg.PoolClient,
  userId: string,
  action: string,
  contentId: string | null,
  meta: Record<string, unknown>,
  earnedAt?: Date | null,
): Promise<{ id: number }> {
  // FIRST, before the user_activity insert takes FOR KEY SHARE on this profile
  // via its FK: take the full FOR UPDATE lock up front so same-user scoring
  // transactions serialize instead of deadlocking on the lock upgrade, and so
  // the weekly-cap / share / collection counts below cannot race. Callers that
  // open the transaction with their own profile-FK insert (highlights, review,
  // pathways, challenge, snippets) lock at the top of THEIR transaction; here it
  // covers every path that reaches scoring in a fresh transaction. A re-lock
  // inside the same transaction is a harmless no-op.
  await lockProfileForWrite(client, userId);
  // The tier is stamped ON THE ROW, now, and never revisited. `subscriptions`
  // keeps one row per user and no history (migration 0018), so this insert is
  // the only moment at which "was this earned on a paid plan" is still knowable.
  // Reading it later — when the score is computed — could only ever answer "is
  // the account premium today", which would quietly restate every point a
  // lapsed subscriber ever earned. See migration 0023.
  const premium = isPremiumNow(await getSubscription(userId, client));
  // After the lock: last_active_day cannot move under this decision.
  const now = new Date();
  const at = await honouredEarnedAt(client, userId, earnedAt, now);
  const rowMeta = at ? { ...(meta ?? {}), received_at: now.toISOString() } : (meta ?? {});
  const res = await client.query<{ id: number; created_at: Date }>(
    `insert into user_activity (user_id, action, content_id, meta, premium, created_at)
     values ($1, $2, $3, $4::jsonb, $5, coalesce($6::timestamptz, now()))
     returning id, created_at`,
    [userId, action, contentId, JSON.stringify(rowMeta), premium, at],
  );
  const row = res.rows[0];
  if (QUALIFYING_ACTIONS.has(action)) {
    await applyStreak(client, userId, dayInTz(row.created_at));
  }
  // League weekly_xp (per-action model). No-op for non-scoring actions. Same
  // transaction so weekly_xp and the activity row commit together.
  //
  // Note it is NOT passed `premium` — the row stamp above answers "was this
  // earned on a PAID plan", which is the right question for the all-time score
  // and the wrong one for the league. See awardLeagueXp for why the two differ.
  await awardLeagueXp(client, userId, action, contentId, row.created_at);
  return { id: row.id };
}

/**
 * Actions only the SERVER may write — POST /activity refuses every one of them.
 *
 * The action vocabulary stays deliberately open (routes/activity.ts): an
 * unknown token is an inert row nothing reads, and keeping it open is what lets
 * a new client-side signal ship without an API deploy. These are the tokens
 * that are NOT inert — each is minted by a service as the record of something
 * that actually happened, and several are read by score.ts, league.ts,
 * streak.ts and achievements.ts.
 *
 * `challenge_answered` was guarded alone, with the right reasoning ("an open
 * vocabulary here would let a client buy shield score + league XP + the badge
 * without answering anything") — but the same sentence is true of
 * `highlight_created` and `review_finished`, which are in SCORING_ACTIONS
 * beside it, and of `streak_kept`, which IS the streak. Measured 2026-09-17:
 * six posts of two forged actions, with no highlight and no review behind
 * them, moved weekly league XP from 23 to 32.
 *
 * The client's own vocabulary is the short list in CLIENT_ACTIONS below;
 * test/activity-vocabulary.test.ts reads this file's siblings and fails if a
 * service starts minting an action that appears in neither set.
 *
 * `streak_sms_sent` was missing here for exactly as long as it existed, because
 * streak-reminder.ts bound its action as `$2` instead of writing it into the
 * SQL, and a token behind a bind parameter is invisible to that scan. It is not
 * inert: smsSentInMonth() counts these rows as the streak SMS's monthly
 * ceiling, so a browser could post them and — with a ceiling configured — close
 * the lane for every reader on the site. The action is a literal in the SQL now,
 * and the test resolves a bound one against its own module const before asking
 * which side of the line it is on.
 */
export const SERVER_MINTED_ACTIONS: ReadonlySet<string> = new Set([
  // Historical: nothing mints it any more; kept so old rows stay server-owned.
  'assistant_step',
  'certificate_wish_alerted',
  'exam_open_told',
  // A reader without the plan was told they are near / at the end of a
  // pathway (pathway-exams.ts runReaderPathwayNotices) — a high-water mark.
  'pathway_reader_told',
  'challenge_answered',
  'collection_created',
  'collection_item_added',
  'compass_viewed',
  'highlight_created',
  'highlight_deleted',
  'highlight_restored',
  'pathway_enrolled',
  'pathway_milestone',
  'payment_cap_alert',
  'reactivation_sent',
  'report_viewed',
  'review_finished',
  // A premium card answered before it was due (routes/review.ts): keeps the
  // day, pays nothing.
  'review_early',
  'streak_freeze_used',
  'streak_kept',
  'streak_reminder_sent',
  'streak_sms_sent',
  'subscription_activated',
  // The founder shortened a subscription from the panel (subscription.ts
  // reduceSubscriptionDays) — an admin's record about the account, read by
  // nothing a browser should be able to forge.
  'subscription_adjusted',
  'subscription_reminder_sent',
]);

/**
 * What a browser legitimately posts to POST /activity — the five signals only
 * the page can know: that a reader reached the end of an article, listened to
 * an episode, opened a page, pressed «بلد بودم» on a card outside the premium
 * engine, or shared something.
 *
 * Not a whitelist the route enforces (the vocabulary stays open); it is the
 * other half of the classification the vocabulary test checks.
 */
export const CLIENT_ACTIONS: ReadonlySet<string> = new Set([
  'article_completed',
  'article_viewed',
  'card_reviewed_manual',
  'content_shared',
  'episode_listened',
]);

export async function recordActivity(
  userId: string,
  action: string,
  contentId: string | null = null,
  meta: Record<string, unknown> = {},
  client?: pg.PoolClient,
  opts: { earnedAt?: Date | null } = {},
): Promise<{ id: number }> {
  if (client) return insertAndScore(client, userId, action, contentId, meta, opts.earnedAt);
  return withTransaction((c) => insertAndScore(c, userId, action, contentId, meta, opts.earnedAt));
}
