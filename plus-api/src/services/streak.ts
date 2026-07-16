import type pg from 'pg';
import { previousDay, dayDiff } from './time.js';
import { computeScore, freezesUsedCount, freezesAvailable } from './score.js';

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
 * action, return the next state, whether a new day was counted, and how many
 * streak shields were spent to bridge a gap.
 *
 * `shieldsAvailable` (سپر استریک) lets the run survive missed days: a gap of N
 * days that would otherwise reset the streak is bridged when the user holds at
 * least (N - 1) shields (one per missed day). Bridged days do not add to the
 * count; the streak just continues (+1 for today). With no shields the behavior
 * is exactly the old reset-on-gap rule, so `shieldsAvailable` defaults to 0.
 */
export function computeStreakUpdate(
  prev: StreakState,
  day: string,
  shieldsAvailable = 0,
): { next: StreakState; counted: boolean; shieldsUsed: number } {
  const last = prev.last_active_day;
  if (last === day) {
    return { next: prev, counted: false, shieldsUsed: 0 }; // already counted today
  }
  let current: number;
  let shieldsUsed = 0;
  const gap = last ? dayDiff(day, last) : Infinity;
  if (gap === 1) {
    current = prev.current_streak + 1; // consecutive day
  } else if (gap >= 2 && gap - 1 <= shieldsAvailable) {
    current = prev.current_streak + 1; // shields bridge the missed day(s)
    shieldsUsed = gap - 1;
  } else {
    current = 1; // first ever, or an unbridgeable gap resets the run
  }
  const longest = Math.max(prev.longest_streak, current);
  return {
    next: { current_streak: current, longest_streak: longest, last_active_day: day },
    counted: true,
    shieldsUsed,
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

  // Shields available right now (to bridge a missed-day gap). Same math the
  // dashboard shows, so display and engine never disagree.
  const { score } = await computeScore(client, userId);
  const used = await freezesUsedCount(client, userId);
  const shields = freezesAvailable(score, used);

  const { next, counted, shieldsUsed } = computeStreakUpdate(prev, day, shields);
  if (!counted) return;

  // Record each bridged (missed) day so a rebuild replays the same decision.
  let missed = previousDay(day);
  for (let i = 0; i < shieldsUsed; i += 1) {
    await client.query(
      `insert into user_activity (user_id, action, meta)
       values ($1, 'streak_freeze_used', $2::jsonb)`,
      [userId, JSON.stringify({ frozen_day: missed, day })],
    );
    missed = previousDay(missed);
  }

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
export function streakFromDays(days: string[], frozenDays: string[] = []): StreakState {
  if (!days.length) return { current_streak: 0, longest_streak: 0, last_active_day: null };
  const sorted = Array.from(new Set(days)).sort(); // 'YYYY-MM-DD' sorts chronologically
  const frozen = new Set(frozenDays);
  // Two active days stay in one run when they are consecutive OR every day in
  // the gap between them was frozen by a shield (replaying the live decision).
  const connected = (laterDay: string, earlierDay: string): boolean => {
    const diff = dayDiff(laterDay, earlierDay);
    if (diff === 1) return true;
    if (diff < 1) return false;
    for (let d = previousDay(laterDay); d !== earlierDay; d = previousDay(d)) {
      if (!frozen.has(d)) return false;
    }
    return true;
  };
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    run = connected(sorted[i], sorted[i - 1]) ? run + 1 : 1;
    if (run > longest) longest = run;
  }
  // current run = run length ending at the last day
  let current = 1;
  for (let i = sorted.length - 1; i > 0; i -= 1) {
    if (connected(sorted[i], sorted[i - 1])) current += 1;
    else break;
  }
  return { current_streak: current, longest_streak: longest, last_active_day: sorted[sorted.length - 1] };
}
