/**
 * ترمیم استریک شکسته — give a reader back the run the break took from them.
 *
 * Founder decision, 2026-09-30: a reader whose long run broke and who has since
 * built a new one gets the two ADDED — «رقم فعلی با چیزی که قبلِ شکست بود جمع
 * شود» — so the break costs them nothing and they carry on from the total.
 *
 * THE PREVIOUS RUN IS NOT `longest_streak`, and that distinction is the whole
 * reason this service exists rather than a one-line update. `longest_streak` is
 * the best run of all time and `current_streak` is the run ending at the last
 * active day; the run that just BROKE is a third question neither column can
 * answer. A reader whose 30-day run broke, who once held 45, and who has since
 * built 9, has the 30 written down nowhere. So it is derived — `dayRuns()` over
 * the reader's own qualifying days and shield bridges, the same log and the same
 * rules `rebuild-streaks` reconstructs everything else from.
 *
 * Which also makes a repeated repair harmless: the proposal is computed from the
 * LOG, which a repair never touches, so pressing the button twice computes the
 * same total and writes the same value. There is no counter here to run away.
 *
 * `longest_streak` becomes `max(longest, total)`, never the total itself: a
 * reader who once held 45, broke a 12 and has 9 would otherwise have their
 * record LOWERED to 21 by an act meant to help them.
 *
 * What is NOT written: any `streak_kept` row. The durable alternative would be
 * inserting days the reader never read, and the monthly report's calendar,
 * consumption and the achievement facts all read that log — so the reader would
 * be shown a calendar of days they never had. These two columns are a cache the
 * founder is choosing to set; the log stays the reader's own. The price, stated
 * on the panel: `npm run rebuild-streaks` recomputes the caches from the log and
 * would undo this.
 */

import type pg from 'pg';
import { pool, query, one, withTransaction } from '../db.js';
import { config } from '../config.js';
import { QUALIFYING_ACTIONS, dayRuns, streakIsAlive, type DayRun } from './streak.js';
import { dayInTz } from './time.js';
import { computeScore, freezesUsedCount, freezesAvailable } from './score.js';

export interface StreakDiagnosis {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  /** What the profile row says right now. */
  cached: { current_streak: number; longest_streak: number; last_active_day: string | null };
  /** Is that run still savable today (shields included)? */
  alive: boolean;
  /** Every run in the log, newest first, capped for display. */
  runs: DayRun[];
  /** How many runs the log holds in total, so a capped list says so. */
  run_count: number;
  /** The run ending at the last active day — what «رقم فعلی» means. */
  current_run: DayRun | null;
  /** The run before it — what «قبلِ شکست» means. */
  previous_run: DayRun | null;
  /** current_run + previous_run, or null when there is nothing to add. */
  proposed_total: number | null;
  /** What the repair would write. */
  would_write: { current_streak: number; longest_streak: number } | null;
  /** Why no repair is possible, when that is the case. */
  blocked: 'no_activity' | 'no_previous_run' | null;
}

/**
 * Enough runs for the founder to FIND the break they mean, not just to glance at
 * the last one. 8 was a display cap and it hid the very run this feature exists
 * for: ôMǐÐ ĶĦåN's 35-day run (2026-08-01 → 09-09) sat fourth in the list while
 * his all-time 42 sat outside it entirely, so the panel could not show the two
 * runs anybody would have wanted to add.
 */
const MAX_RUNS_SHOWN = 24;

async function loadDays(userId: string, db: pg.Pool | pg.PoolClient = pool): Promise<{ days: string[]; frozen: string[] }> {
  const actions = Array.from(QUALIFYING_ACTIONS);
  const days = await query<{ d: string }>(
    `select distinct (created_at at time zone $2)::date::text as d
       from user_activity
      where user_id = $1 and action = any($3)
      order by 1`,
    [userId, config.streakTimezone, actions], db,
  );
  const frozen = await query<{ d: string }>(
    `select (meta->>'frozen_day') as d from user_activity
      where user_id = $1 and action = 'streak_freeze_used' and meta ? 'frozen_day'`,
    [userId], db,
  );
  return {
    days: days.rows.map((r) => r.d),
    frozen: frozen.rows.map((r) => r.d).filter(Boolean),
  };
}

/** Read-only. Everything the panel shows, and everything the repair decides by. */
export async function diagnoseStreak(
  userId: string, now: Date = new Date(), db: pg.Pool | pg.PoolClient = pool,
): Promise<StreakDiagnosis | null> {
  const p = await one<{
    id: string; display_name: string | null; phone: string | null;
    current_streak: number; longest_streak: number; last_active_day: string | null;
  }>(
    `select id, display_name, nullif(phone, '') as phone, current_streak, longest_streak,
            to_char(last_active_day, 'YYYY-MM-DD') as last_active_day
       from profiles where id = $1`,
    [userId], db,
  );
  if (!p) return null;

  const { days, frozen } = await loadDays(userId, db);
  const runs = dayRuns(days, frozen);
  const current = runs.length ? runs[runs.length - 1] : null;
  const previous = runs.length > 1 ? runs[runs.length - 2] : null;

  // The same aliveness test the dashboard and the reminder use, so the panel
  // cannot call a run dead that the engine would still extend.
  let alive = false;
  if (p.last_active_day) {
    const { score } = await computeScore(db, userId);
    const shields = freezesAvailable(score, await freezesUsedCount(db, userId));
    alive = streakIsAlive(p.last_active_day, dayInTz(now, config.streakTimezone), shields);
  }

  const blocked = runs.length === 0 ? 'no_activity' as const
    : !previous ? 'no_previous_run' as const
      : null;
  const total = blocked ? null : current!.length + previous!.length;

  return {
    user_id: p.id,
    display_name: p.display_name,
    phone: p.phone,
    cached: {
      current_streak: p.current_streak,
      longest_streak: p.longest_streak,
      last_active_day: p.last_active_day,
    },
    alive,
    runs: runs.slice(-MAX_RUNS_SHOWN).reverse(),
    run_count: runs.length,
    current_run: current,
    previous_run: previous,
    proposed_total: total,
    would_write: total == null ? null : {
      current_streak: total,
      longest_streak: Math.max(p.longest_streak, total),
    },
    blocked,
  };
}

export interface RepairResult {
  ok: true;
  user_id: string;
  /** The run that was added, so the answer names what it did. */
  added_run: DayRun;
  before: { current_streak: number; longest_streak: number };
  after: { current_streak: number; longest_streak: number };
  current_run: number;
  previous_run: number;
  /** True when the row already held exactly this, so nothing changed. */
  unchanged: boolean;
}

export type RepairFailure =
  | { ok: false; error: 'no_profile' }
  | { ok: false; error: 'no_activity' }
  | { ok: false; error: 'no_previous_run' }
  | { ok: false; error: 'no_such_run'; starts: string[] }
  | { ok: false; error: 'run_is_current' }
  | { ok: false; error: 'total_moved'; expected: number; actual: number };

/**
 * Apply the repair. `expectTotal` is the number the caller was SHOWN: the panel
 * reads the diagnosis, the founder presses the button, and this refuses if the
 * log has produced a different total since — the same optimistic check
 * redecide-stranded-week makes, so what is written is always what was approved.
 */
export interface RepairOptions {
  /**
   * Which run to add, named by its own start day (as the diagnosis lists it).
   * Omitted means the run immediately before the current one.
   *
   * It is a CHOICE and not a computation, because «the run that broke» is only
   * unambiguous for a reader who broke once. ôMǐÐ ĶĦåN broke three times: 35
   * days ended 2026-09-09, then a 2-day run, then a 5-day run, then the live 9.
   * The mechanical previous-run answer is 9 + 5 = 14 and the one the founder
   * meant is 9 + 35 = 44 — nothing in the data prefers either, so the panel asks.
   */
  addRunStart?: string;
  /** The total the caller was shown; a mismatch is refused. */
  expectTotal?: number;
}

export async function repairStreak(
  userId: string, opts: RepairOptions = {}, now: Date = new Date(),
): Promise<RepairResult | RepairFailure> {
  return withTransaction(async (client) => {
    // `for update` for applyStreak's own reason: a qualifying action arriving
    // mid-write would advance the row from the value this read, and one of the
    // two updates would be lost.
    const locked = await one<{ current_streak: number; longest_streak: number }>(
      'select current_streak, longest_streak from profiles where id = $1 for update',
      [userId], client,
    );
    if (!locked) return { ok: false, error: 'no_profile' } as RepairFailure;

    const d = await diagnoseStreak(userId, now, client);
    if (!d) return { ok: false, error: 'no_profile' } as RepairFailure;
    if (d.blocked === 'no_activity') return { ok: false, error: 'no_activity' } as RepairFailure;

    // The run to add: the founder's pick, or the one immediately before.
    const { days, frozen } = await loadDays(userId, client);
    const all = dayRuns(days, frozen);
    const current = all[all.length - 1];
    let chosen: DayRun | undefined;
    if (opts.addRunStart) {
      chosen = all.find((r) => r.start === opts.addRunStart);
      if (!chosen) {
        return { ok: false, error: 'no_such_run', starts: all.map((r) => r.start) } as RepairFailure;
      }
      // Adding the live run to itself would double it, which is never a repair.
      if (chosen.start === current.start) return { ok: false, error: 'run_is_current' } as RepairFailure;
    } else {
      if (all.length < 2) return { ok: false, error: 'no_previous_run' } as RepairFailure;
      chosen = all[all.length - 2];
    }

    const total = current.length + chosen.length;
    if (opts.expectTotal != null && opts.expectTotal !== total) {
      return {
        ok: false, error: 'total_moved', expected: opts.expectTotal, actual: total,
      } as RepairFailure;
    }
    const after = {
      current_streak: total,
      longest_streak: Math.max(locked.longest_streak, total),
    };
    const unchanged = locked.current_streak === after.current_streak
      && locked.longest_streak === after.longest_streak;
    if (!unchanged) {
      await client.query(
        'update profiles set current_streak = $2, longest_streak = $3 where id = $1',
        [userId, after.current_streak, after.longest_streak],
      );
    }
    return {
      ok: true,
      user_id: userId,
      added_run: chosen,
      before: { current_streak: locked.current_streak, longest_streak: locked.longest_streak },
      after,
      current_run: current.length,
      previous_run: chosen.length,
      unchanged,
    } as RepairResult;
  });
}
