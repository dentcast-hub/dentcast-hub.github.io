import type pg from 'pg';
import { previousDay, dayDiff } from './time.js';

/**
 * Streak engine (spec section 4). A day counts if the user performed at least
 * one qualifying action. On the first qualifying action of a new Tehran day we
 * advance the profile caches transactionally and append a `streak_kept` event.
 * The append-only log is the source of truth; every cache is reconstructable
 * from it by the rebuild script.
 */

export const QUALIFYING_ACTIONS = new Set([
  'article_completed',
  'highlight_created',
  'card_reviewed_manual', // free path
  'review_finished', // premium scheduled session (Phase 2)
]);

export interface StreakState {
  current_streak: number;
  longest_streak: number;
  last_active_day: string | null;
}

/**
 * Pure transition: given the prior cached state and the day of a new qualifying
 * action, return the next state and whether a new day was counted. Same-day
 * repeats do not count again.
 */
export function computeStreakUpdate(prev: StreakState, day: string): { next: StreakState; counted: boolean } {
  const last = prev.last_active_day;
  if (last === day) {
    return { next: prev, counted: false }; // already counted today
  }
  let current: number;
  if (last && previousDay(day) === last) {
    current = prev.current_streak + 1; // consecutive day
  } else {
    current = 1; // first ever, or a gap resets the run
  }
  const longest = Math.max(prev.longest_streak, current);
  return {
    next: { current_streak: current, longest_streak: longest, last_active_day: day },
    counted: true,
  };
}

/**
 * Apply a qualifying action's streak effect on the given client (must be inside
 * the same transaction as the activity insert). Appends a `streak_kept` event
 * when a new day is counted. Locks the profile row to serialize same-user writes.
 */
export async function applyStreak(client: pg.PoolClient, userId: string, day: string): Promise<void> {
  const res = await client.query<StreakState>(
    `select current_streak, longest_streak, last_active_day
       from profiles where id = $1 for update`,
    [userId],
  );
  if (res.rowCount === 0) return;
  const prev = res.rows[0];
  const { next, counted } = computeStreakUpdate(prev, day);
  if (!counted) return;

  await client.query(
    `update profiles
        set current_streak = $2, longest_streak = $3, last_active_day = $4
      where id = $1`,
    [userId, next.current_streak, next.longest_streak, next.last_active_day],
  );
  await client.query(
    `insert into user_activity (user_id, action, meta)
     values ($1, 'streak_kept', $2::jsonb)`,
    [userId, JSON.stringify({ day, streak: next.current_streak })],
  );
}

/**
 * Recompute caches from a full set of qualifying days (used by the rebuild
 * script). current_streak is the length of the consecutive run ending at the
 * most recent active day, matching the live engine.
 */
export function streakFromDays(days: string[]): StreakState {
  if (!days.length) return { current_streak: 0, longest_streak: 0, last_active_day: null };
  const sorted = Array.from(new Set(days)).sort(); // 'YYYY-MM-DD' sorts chronologically
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    run = dayDiff(sorted[i], sorted[i - 1]) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }
  // current run = run length ending at the last day
  let current = 1;
  for (let i = sorted.length - 1; i > 0; i -= 1) {
    if (dayDiff(sorted[i], sorted[i - 1]) === 1) current += 1;
    else break;
  }
  return { current_streak: current, longest_streak: longest, last_active_day: sorted[sorted.length - 1] };
}
