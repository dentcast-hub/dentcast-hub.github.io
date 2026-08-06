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
  await awardLeagueXp(client, userId, action, contentId, row.created_at);
  return { id: row.id };
}

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
