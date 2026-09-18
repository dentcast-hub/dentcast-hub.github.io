import type pg from 'pg';
import { pool, withTransaction } from '../db.js';
import { QUALIFYING_ACTIONS, applyStreak } from './streak.js';
import { awardLeagueXp } from './league.js';
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
async function insertAndScore(
  client: pg.PoolClient,
  userId: string,
  action: string,
  contentId: string | null,
  meta: Record<string, unknown>,
): Promise<{ id: number }> {
  // The tier is stamped ON THE ROW, now, and never revisited. `subscriptions`
  // keeps one row per user and no history (migration 0018), so this insert is
  // the only moment at which "was this earned on a paid plan" is still knowable.
  // Reading it later — when the score is computed — could only ever answer "is
  // the account premium today", which would quietly restate every point a
  // lapsed subscriber ever earned. See migration 0023.
  const premium = isPremiumNow(await getSubscription(userId, client));
  const res = await client.query<{ id: number; created_at: Date }>(
    `insert into user_activity (user_id, action, content_id, meta, premium)
     values ($1, $2, $3, $4::jsonb, $5)
     returning id, created_at`,
    [userId, action, contentId, JSON.stringify(meta ?? {}), premium],
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
  'assistant_step',
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
  'streak_freeze_used',
  'streak_kept',
  'streak_reminder_sent',
  'streak_sms_sent',
  'subscription_activated',
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
): Promise<{ id: number }> {
  if (client) return insertAndScore(client, userId, action, contentId, meta);
  return withTransaction((c) => insertAndScore(c, userId, action, contentId, meta));
}
