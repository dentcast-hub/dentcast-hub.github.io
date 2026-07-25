import type pg from 'pg';
import { config } from '../config.js';

/**
 * Score + streak-shield ("سپر استریک") math, shared by GET /progress (display)
 * and the streak engine (auto-consume on a missed day). Kept in one place so the
 * number the user sees and the number the engine spends never drift apart.
 *
 * Score = active_days * 10 + total_highlights (activity-log derived).
 *
 * A shield is granted every time the score crosses a SHIELD_POINTS threshold,
 * and at most SHIELD_CAP are held. The cap is a HARD one: a grant that lands
 * while both slots are full is burned, not banked. That is the whole reason the
 * shield count is replayed from the log instead of computed as
 * `min(cap, earned - used)` — that closed form silently stockpiles every unused
 * threshold, so a high-score user could absorb far more than SHIELD_CAP missed
 * days in a row and the cap would be a display artifact rather than a rule.
 *
 * Replay is over the SPEND events only (a handful per user, not per activity):
 * each spend knows the score at its instant, so the fold below re-derives the
 * balance exactly, stays O(number of missed days), and needs no stored balance
 * column — the append-only log remains the single source of truth.
 */

export const SHIELD_POINTS = 150;
export const SHIELD_CAP = 2;

// Actions that count toward an "active day" for the score. Kept local (not the
// streak module's QUALIFYING_ACTIONS) to avoid a circular import; the two sets
// are intentionally the same today.
export const SCORING_ACTIONS = ['article_completed', 'episode_listened', 'highlight_created', 'card_reviewed_manual', 'review_finished'];

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

/** How many thresholds a score has crossed (= shields granted over all time). */
export function thresholdsCrossed(score: number): number {
  return Math.floor(Math.max(0, score) / SHIELD_POINTS);
}

/**
 * The shield balance, folded over the spend history. `grantsAtSpends[i]` is how
 * many thresholds the score had crossed at the moment of the i-th spend (in
 * chronological order); `grantsNow` is the same count for the current score.
 *
 * Every grant between two spends adds one, clamped at the cap (the overflow is
 * BURNED — this is what makes SHIELD_CAP a real ceiling), and each spend takes
 * one. Pure, so the ceiling is unit-testable without a database.
 */
export function foldShieldBalance(
  grantsNow: number, grantsAtSpends: number[], cap: number = SHIELD_CAP,
): number {
  let balance = 0;
  let seen = 0;
  for (const grants of grantsAtSpends) {
    balance = Math.min(cap, balance + Math.max(0, grants - seen));
    balance = Math.max(0, balance - 1); // a legacy spend below zero just clamps
    seen = grants;
  }
  return Math.min(cap, balance + Math.max(0, grantsNow - seen));
}

/**
 * Shields currently available to hold/spend. Reads each spend's instant and the
 * score the user had reached by then, then folds (see foldShieldBalance).
 * `score` is the caller's already-computed current score, so this costs one
 * extra query — and one row per missed day, not per activity.
 */
export async function freezesAvailable(db: Db, userId: string, score: number): Promise<number> {
  const r = await db.query<{ score_then: number }>(
    `select (
         ( select count(distinct (a.created_at at time zone $2)::date)
             from user_activity a
            where a.user_id = $1 and a.action = any($3) and a.created_at <= f.created_at ) * 10
       + ( select count(*) from highlights h
            where h.user_id = $1 and h.created_at <= f.created_at )
       )::int as score_then
       from user_activity f
      where f.user_id = $1 and f.action = 'streak_freeze_used'
      order by f.created_at, f.id`,
    [userId, config.streakTimezone, SCORING_ACTIONS],
  );
  return foldShieldBalance(
    thresholdsCrossed(score),
    r.rows.map((row) => thresholdsCrossed(row.score_then)),
  );
}

/** Points still needed to reach the next shield threshold (null once at the cap). */
export function pointsToNextFreeze(score: number, available: number): number | null {
  if (available >= SHIELD_CAP) return null;
  const rem = score % SHIELD_POINTS;
  return rem === 0 ? SHIELD_POINTS : SHIELD_POINTS - rem;
}
