import type pg from 'pg';
import { config } from '../config.js';

/**
 * Score + streak-shield ("سپر استریک") math, shared by GET /progress (display)
 * and the streak engine (auto-consume on a missed day). Kept in one place so the
 * number the user sees and the number the engine spends never drift apart.
 *
 * Score = active_days * 10 + total_highlights (activity-log derived, monotonic).
 * A shield is earned for every SHIELD_POINTS of score, capped at SHIELD_CAP held
 * at once. Because score only grows, spent shields refill as new thresholds are
 * crossed (up to the cap).
 */

export const SHIELD_POINTS = 150;
export const SHIELD_CAP = 2;

// Actions that count toward an "active day" for the score. Kept local (not the
// streak module's QUALIFYING_ACTIONS) to avoid a circular import; the two sets
// are intentionally the same today.
const SCORING_ACTIONS = ['article_completed', 'highlight_created', 'card_reviewed_manual', 'review_finished'];

type Db = pg.Pool | pg.PoolClient;

export interface ScoreBreakdown { score: number; active_days: number; total_highlights: number; }

/** Compute a user's score and its parts from the activity log + highlights. */
export async function computeScore(db: Db, userId: string): Promise<ScoreBreakdown> {
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
  return { score: active_days * 10 + total_highlights, active_days, total_highlights };
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

/** Shields currently available to hold/spend: earned minus spent, capped. */
export function freezesAvailable(score: number, used: number): number {
  const earned = Math.floor(score / SHIELD_POINTS);
  return Math.max(0, Math.min(SHIELD_CAP, earned - used));
}

/** Points still needed to reach the next shield threshold (null once at the cap). */
export function pointsToNextFreeze(score: number, available: number): number | null {
  if (available >= SHIELD_CAP) return null;
  const rem = score % SHIELD_POINTS;
  return rem === 0 ? SHIELD_POINTS : SHIELD_POINTS - rem;
}
