import type pg from 'pg';
import { config } from '../config.js';

/**
 * Score + streak-shield ("سپر استریک") math, shared by GET /progress (display)
 * and the streak engine (auto-consume on a missed day). Kept in one place so the
 * number the user sees and the number the engine spends never drift apart.
 *
 * Score = active_days * 10 + total_highlights (activity-log derived, monotonic).
 *
 * Shields get PROGRESSIVELY MORE EXPENSIVE: the first costs SHIELD_BASE, and
 * every next one costs SHIELD_STEP more than the one before (200, 250, 300 …).
 * There is deliberately no holding cap — the rising price is the limiter, and it
 * buys two properties a flat price + cap could not have at the same time:
 *
 *   1. Score never stops mattering. Under a flat price with a cap, every point
 *      earned while at the cap did nothing at all; here each point always moves
 *      the user toward the next (dearer) shield.
 *   2. Keeping a shield beats re-earning one. Spending drops the balance, and
 *      the replacement is the NEXT price up the ladder, never the one just paid.
 *
 * Score is never deducted — a threshold is a milestone, not a purchase — so the
 * balance stays a plain subtraction: granted so far minus spent so far.
 *
 * Premium earns the SAME score at a better rate (unlike a Duolingo-style streak
 * freeze, premium still has to earn its shields — it just gets there faster):
 * PREMIUM_SCORE_MULTIPLIER scales the final score, which in turn scales shield
 * progress too, since shields are earned off of score.
 */

export const SHIELD_BASE = 200; // score needed for the first shield
export const SHIELD_STEP = 50;  // each further shield costs this much more
export const PREMIUM_SCORE_MULTIPLIER = 1.2;

// Actions that count toward an "active day" for the score. Kept local (not the
// streak module's QUALIFYING_ACTIONS) to avoid a circular import; the two sets
// are intentionally the same today.
export const SCORING_ACTIONS = ['article_completed', 'episode_listened', 'highlight_created', 'card_reviewed_manual', 'review_finished'];

type Db = pg.Pool | pg.PoolClient;

export interface ScoreBreakdown { score: number; active_days: number; total_highlights: number; }

/** Compute a user's score and its parts from the activity log + highlights. */
export async function computeScore(db: Db, userId: string, tier?: string): Promise<ScoreBreakdown> {
  const ad = await db.query<{ n: number }>(
    `select count(distinct (created_at at time zone $2)::date)::int as n
       from user_activity where user_id = $1 and action = any($3)`,
    [userId, config.streakTimezone, SCORING_ACTIONS],
  );
  const hl = await db.query<{ n: number }>(
    `select count(*)::int as n from highlights where user_id = $1`,
    [userId],
  );
  const active_days = ad.rows[0]?.n ?? 0;
  const total_highlights = hl.rows[0]?.n ?? 0;
  const base = active_days * 10 + total_highlights;
  const score = tier === 'premium' ? Math.round(base * PREMIUM_SCORE_MULTIPLIER) : base;
  return { score, active_days, total_highlights };
}

/** How many shields the user has already spent (append-only log is the source). */
export async function freezesUsedCount(db: Db, userId: string): Promise<number> {
  const r = await db.query<{ n: number }>(
    `select count(*)::int as n from user_activity
       where user_id = $1 and action = 'streak_freeze_used'`,
    [userId],
  );
  return r.rows[0]?.n ?? 0;
}

/** What the n-th shield (1-based) costs on its own: 200, 250, 300 … */
export function shieldCost(n: number): number {
  return n < 1 ? 0 : SHIELD_BASE + SHIELD_STEP * (n - 1);
}

/** Total score needed to have been granted n shields (the sum of their costs). */
export function shieldThreshold(n: number): number {
  return n < 1 ? 0 : n * SHIELD_BASE + (SHIELD_STEP * n * (n - 1)) / 2;
}

/** How many shields a score has unlocked over all time. */
export function shieldsGranted(score: number): number {
  let n = 0;
  while (shieldThreshold(n + 1) <= score) n += 1; // ~sqrt(score) steps, tiny
  return n;
}

/** Shields currently available to hold/spend: granted minus spent. */
export function freezesAvailable(score: number, used: number): number {
  return Math.max(0, shieldsGranted(score) - used);
}

/** Points still needed to unlock the next shield (there is always a next one). */
export function pointsToNextFreeze(score: number): number {
  return shieldThreshold(shieldsGranted(score) + 1) - score;
}
