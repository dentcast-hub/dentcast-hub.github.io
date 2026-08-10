import type pg from 'pg';
import { config } from '../config.js';

/**
 * Score + streak-shield ("سپر استریک") math, shared by GET /progress (display)
 * and the streak engine (auto-consume on a missed day). Kept in one place so the
 * number the user sees and the number the engine spends never drift apart.
 *
 * Score = active_days * 10 + content_completed * 5 + total_highlights
 * (activity-log derived, monotonic), except that a day earned while the account
 * was premium pays PREMIUM_POINTS_PER_ACTIVE_DAY (12) instead of 10.
 *
 * `content_completed` counts each (action, content) pair ONCE FOR ALL TIME —
 * except listening, which pays again ONCE PER LEAGUE WEEK (2026-08-10). Reading
 * and listening are counted separately for the same page (a NoteCast that is
 * both read and heard pays twice), which is exactly how the league already
 * treats xp_read vs xp_listen.
 *
 * Why listening repeats and reading does not: an episode is re-listened to on
 * purpose — in the car, on the second pass, while the hands are busy — and
 * being told "you already heard this one" is being told the second hour did not
 * count. Re-READING a page is mostly a revisit, which the workbench and the
 * review queue already pay for. The weekly window is what keeps that from
 * becoming a farm: it is the SAME window the league prices xp_listen in
 * (league.ts, once per (content, week)), so there is one rule to explain rather
 * than two, and one episode left on loop is worth 5 points a week, not 5 points
 * a play. The bucket is the Iranian week (Saturday, Tehran) for the same
 * reason — a second definition of "week" here would drift from the league's.
 *
 * Before this component existed, consumption only ever bought the day's first
 * +10: a second podcast on the same day moved the number by nothing, and since
 * podcast pages are excluded from the workbench they could not earn highlight
 * points either. Listeners were told «با خواندن، گوش‌دادن، هایلایت و مرور
 * امتیاز می‌گیری» and then watched the score sit still.
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
 */

export const SHIELD_BASE = 200; // score needed for the first shield
export const SHIELD_STEP = 50;  // each further shield costs this much more

// Actions that count toward an "active day" for the score. Kept local (not the
// streak module's QUALIFYING_ACTIONS) to avoid a circular import; the two sets
// are intentionally the same today.
export const SCORING_ACTIONS = ['article_completed', 'episode_listened', 'highlight_created', 'card_reviewed_manual', 'review_finished'];

/**
 * The consumption actions that additionally pay PER PIECE OF CONTENT. A strict
 * subset of SCORING_ACTIONS: a highlight already pays per highlight, and a card
 * review is not a piece of content.
 */
export const CONSUMPTION_ACTIONS = ['article_completed', 'episode_listened'];

/**
 * Passing a page on to somebody else (the article header's «اشتراک‌گذاری»).
 *
 * Deliberately NOT in SCORING_ACTIONS, and deliberately not in the streak's
 * QUALIFYING_ACTIONS either. Everything in those two sets is an act of STUDY,
 * and the whole meaning of this number rests on that: the all-time score buys
 * streak shields, and a shield is a claim about having shown up to read. A tap
 * that recommends an article to a friend is a good thing to do and a bad thing
 * to pay a shield for — it costs one second, and score is never deducted, so a
 * mistake here would be permanent for every account at once.
 *
 * So sharing earns in exactly two places, both of which reset or saturate on
 * their own: weekly league XP (league.ts — gated on having finished the article,
 * once per page per week, and cappable though currently uncapped), and the derived
 * «چراغ‌دار» badge (achievements.ts). It never touches this file's arithmetic.
 * The constant lives here anyway — beside the two sets it is excluded from — so
 * that the exclusion is visible at the one place someone would think to undo it.
 */
export const SHARE_ACTION = 'content_shared';

export const POINTS_PER_ACTIVE_DAY = 10;
export const POINTS_PER_CONTENT = 5; // half a day: visible, but the daily habit still leads

/**
 * What a premium subscriber's DAILY point is worth — the subscription perk.
 *
 * The multiplier sits on the active-day component alone, and that is a design
 * choice, not a shortcut. Applied to the whole score it would have to multiply
 * the per-highlight part too, where 1 × 1.2 = 1.2 — a fraction inside a number
 * that is compared against integer shield thresholds and against other users'
 * scores. Rounding it away would quietly eat points a user had earned (7
 * highlights would pay 8, not 8.4), which is a rule nobody could be told with a
 * straight face. On the daily point the arithmetic is exact: 10 becomes 12, and
 * no score is ever fractional, so there is no rounding step to explain.
 *
 * It also aims the perk at the thing it pays for. Score's only use is streak
 * shields, and the streak is a measure of showing up daily — so the reward for
 * subscribing lands on the daily habit, not on how much was read in one sitting.
 *
 * Applied PER DAY EARNED, not to the total: `user_activity.premium` records the
 * tier at the moment each event happened (migration 0023) and is never re-read
 * afterwards. That is what keeps the "score is never deducted" rule true across
 * an expiry — see the migration for why multiplying the live total instead would
 * take points back from anyone whose subscription ran out.
 *
 * It is deliberately NOT a league advantage — league ranking reads `weekly_xp`
 * on the membership row and never touches this number (league.ts).
 */
export const PREMIUM_SCORE_MULTIPLIER = 1.2;

/**
 * 12. Derived rather than written down so the two constants can never disagree,
 * and asserted to be a whole number because the entire argument above rests on
 * it: if POINTS_PER_ACTIVE_DAY is ever retuned to a value that makes this
 * fractional, the score stops being an integer and the failure is silent.
 */
export const PREMIUM_POINTS_PER_ACTIVE_DAY = POINTS_PER_ACTIVE_DAY * PREMIUM_SCORE_MULTIPLIER;
if (!Number.isInteger(PREMIUM_POINTS_PER_ACTIVE_DAY)) {
  throw new Error(
    `score: POINTS_PER_ACTIVE_DAY (${POINTS_PER_ACTIVE_DAY}) × PREMIUM_SCORE_MULTIPLIER `
    + `(${PREMIUM_SCORE_MULTIPLIER}) must be a whole number of points, got `
    + `${PREMIUM_POINTS_PER_ACTIVE_DAY}`,
  );
}

type Db = pg.Pool | pg.PoolClient;

export interface ScoreBreakdown {
  score: number;
  active_days: number; content_completed: number; total_highlights: number;
  /** Of `active_days`, how many were earned while premium (a subset, not an extra). */
  premium_days: number;
  /** Points this account owes purely to the multiplier. Zero on a free plan. */
  premium_bonus: number;
}

/** The three raw counts, plus how many of the active days were premium. */
export interface ScoreParts {
  active_days: number; content_completed: number; total_highlights: number;
  premium_days: number;
}

/**
 * The arithmetic, in ONE place, for the TS path and (mirrored) the SQL one.
 *
 * `premium_days` is a SUBSET of `active_days`, never an addition to it: a day on
 * which a subscriber read something appears in both and is paid once, at the
 * premium rate. So the free portion is always `active_days - premium_days`,
 * which cannot go negative and needs no clamp.
 *
 * Every term is an integer, so the result is too — no floor, no round, nothing
 * to explain to somebody comparing their number with a friend's.
 */
export function combineScore(p: ScoreParts): { score: number; premium_bonus: number } {
  const freeDays = p.active_days - p.premium_days;
  const premium_bonus = p.premium_days * (PREMIUM_POINTS_PER_ACTIVE_DAY - POINTS_PER_ACTIVE_DAY);
  const score = freeDays * POINTS_PER_ACTIVE_DAY
    + p.premium_days * PREMIUM_POINTS_PER_ACTIVE_DAY
    + p.content_completed * POINTS_PER_CONTENT
    + p.total_highlights;
  return { score, premium_bonus };
}

/**
 * The whole formula as one SQL select over `profiles p`, producing (id, score).
 * The per-user number (computeScore), the rank query in /progress and the KPI
 * count all read from this, because they used to be three hand-copied copies of
 * the arithmetic — and a formula change had to find all three or the score a
 * user saw would silently disagree with the rank they were given for it.
 * Callers pass their own placeholder numbers since each query binds differently.
 */
/**
 * The bucket a consumption row is counted in, as SQL. NULL for everything that
 * pays once for all time, and the row's league week (Saturday start, in `tz`)
 * for `episode_listened`, which pays again every week — so
 * `count(distinct (action, content_id, bucket))` expresses both rules at once.
 *
 * `(dow + 1) % 7` is the number of days back to Saturday: Sat(6)→0, Sun(0)→1,
 * … Fri(5)→6. It matches weekStartSaturday() in services/time.ts, which is what
 * the league buckets XP by; the two must not drift, or a listen could pay in
 * the league's week and not in the score's.
 *
 * `tz` is the caller's own placeholder (`$2`, `$3`, …), not a value.
 */
export function consumptionBucketSql(tz: string): string {
  return `case when action = 'episode_listened'
               then (created_at at time zone ${tz})::date
                    - ((extract(dow from (created_at at time zone ${tz})::date)::int + 1) % 7)
          end`;
}

export function scoreSelectSql(p: { tz: string; scoring: string; consumption: string }): string {
  // `count(distinct …) filter (where premium)` is the SQL mirror of combineScore's
  // subset rule. A day touched even once while premium counts as a premium day in
  // full — a day is one indivisible unit, and the tie goes to the person who paid.
  // Nothing here rounds: every coefficient is a whole number of points.
  return `select p.id,
                 ( coalesce(ad.n, 0) - coalesce(ad.pr, 0) ) * ${POINTS_PER_ACTIVE_DAY}
               + coalesce(ad.pr, 0) * ${PREMIUM_POINTS_PER_ACTIVE_DAY}
               + coalesce(cc.n, 0) * ${POINTS_PER_CONTENT}
               + coalesce(hl.n, 0) as score
            from profiles p
            left join (
              select user_id,
                     count(distinct (created_at at time zone ${p.tz})::date) as n,
                     count(distinct (created_at at time zone ${p.tz})::date)
                       filter (where premium) as pr
                from user_activity where action = any(${p.scoring}) group by user_id
            ) ad on ad.user_id = p.id
            left join (
              select user_id,
                     count(distinct (action, content_id, ${consumptionBucketSql(p.tz)})) as n
                from user_activity
               where action = any(${p.consumption}) and content_id is not null
               group by user_id
            ) cc on cc.user_id = p.id
            left join (
              select user_id, count(*) as n from highlights group by user_id
            ) hl on hl.user_id = p.id`;
}

/** Compute a user's score and its parts from the activity log + highlights. */
export async function computeScore(db: Db, userId: string): Promise<ScoreBreakdown> {
  const ad = await db.query<{ n: number; pr: number }>(
    `select count(distinct (created_at at time zone $2)::date)::int as n,
            count(distinct (created_at at time zone $2)::date)
              filter (where premium)::int as pr
       from user_activity where user_id = $1 and action = any($3)`,
    [userId, config.streakTimezone, SCORING_ACTIONS],
  );
  // count(distinct (action, content_id, bucket)): the row constructor keeps
  // reading and listening to the SAME page as two engagements, collapses replays
  // of one, and — via the bucket — lets a re-listen pay once more each week.
  const cc = await db.query<{ n: number }>(
    `select count(distinct (action, content_id, ${consumptionBucketSql('$3')}))::int as n
       from user_activity
      where user_id = $1 and action = any($2) and content_id is not null`,
    [userId, CONSUMPTION_ACTIONS, config.streakTimezone],
  );
  const hl = await db.query<{ n: number }>(
    `select count(*)::int as n from highlights where user_id = $1`,
    [userId],
  );
  const parts: ScoreParts = {
    active_days: ad.rows[0]?.n ?? 0,
    content_completed: cc.rows[0]?.n ?? 0,
    total_highlights: hl.rows[0]?.n ?? 0,
    premium_days: ad.rows[0]?.pr ?? 0,
  };
  return { ...parts, ...combineScore(parts) };
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
