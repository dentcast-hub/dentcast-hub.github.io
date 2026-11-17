/**
 * حضور در بازهٔ اخیر — who was active on at least N of the last D days.
 * Read-only; it writes nothing and keeps no state of its own.
 *
 * This is the question the streak board cannot answer. The board ranks the
 * longest LIVE run, which is cumulative: the same two or three readers hold the
 * top for months, and a reader who missed one day is gone from it entirely. A
 * ratio («active days ÷ days since joining») fails the other way, because one
 * day out of one is 100%. A fixed window with a floor has neither problem: the
 * denominator is the same for everybody, history before the window buys
 * nothing, and a single missed day costs one day, not the whole run.
 *
 * Three deliberate choices:
 *
 *  · An «active day» is a Tehran day with at least one QUALIFYING action in the
 *    reader's own log — the derivation `streak-repair.ts` and the board's start
 *    day use. NOT `streak_kept` rows (a founder repair writes none) and NOT a
 *    shield-bridged day: a bridged gap is a day the reader did nothing, and this
 *    list says who showed up, not what the streak engine forgave.
 *
 *  · The window ENDS TODAY and includes it. «۳۰ روز اخیر» read on any day means
 *    the thirty days up to and including that day; a window ending yesterday
 *    would drop the activity the founder is looking at right now.
 *
 *  · The floor defaults to two thirds of the window, rounded UP (20 of 30, 34 of
 *    50), and can be overridden per call. It is a parameter, not a constant,
 *    because what it decides — who is eligible for a prize — is the founder's
 *    call each time.
 *
 * The list is capped (`PRESENCE_ROW_CAP`); `qualified_total` is the uncapped
 * count, so a truncated list still says how many there were.
 */

import { query } from '../db.js';
import { config } from '../config.js';
import { QUALIFYING_ACTIONS } from './streak.js';
import { addDays, dayDiff, dayInTz, startOfDayInstant } from './time.js';

export const PRESENCE_DEFAULT_DAYS = 30;
export const PRESENCE_MAX_DAYS = 366;
export const PRESENCE_ROW_CAP = 200;

/** Two thirds of the window, rounded up: 20 of 30, 34 of 50, 1 of 1. */
export function defaultMinDays(days: number): number {
  return Math.ceil((days * 2) / 3);
}

export interface PresenceRow {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  /** Distinct active Tehran days inside the window. */
  active_days: number;
  /** Longest run of consecutive active days inside the window. */
  longest_run: number;
  /** The cached live streak, for context beside the window count. */
  current_streak: number;
  first_day: string;
  last_day: string;
}

export interface PresenceBoard {
  days: number;
  min_days: number;
  from_day: string;
  to_day: string;
  /** Readers with at least one active day in the window. */
  active_total: number;
  /** Readers at or above the floor, whether or not they fit under the cap. */
  qualified_total: number;
  cap: number;
  rows: PresenceRow[];
}

function longestRunOf(sortedDays: string[]): number {
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sortedDays) {
    run = prev && dayDiff(d, prev) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

/**
 * `days` and `minDays` must already be validated by the caller (integers,
 * 1 ≤ minDays ≤ days ≤ PRESENCE_MAX_DAYS); the route owns the 400s.
 */
export async function streakPresence(
  days: number, minDays: number, now: Date = new Date(),
): Promise<PresenceBoard> {
  const tz = config.streakTimezone;
  const toDay = dayInTz(now, tz);
  const fromDay = addDays(toDay, -(days - 1));
  // Half-open on instants, so the window is exact Tehran days at both ends.
  const start = startOfDayInstant(fromDay, tz);
  const end = startOfDayInstant(addDays(toDay, 1), tz);

  const res = await query<{
    id: string; display_name: string | null; phone: string | null;
    current_streak: number; days: string[];
  }>(
    `select p.id, p.display_name, nullif(p.phone, '') as phone, p.current_streak,
            array_agg(a.d order by a.d) as days
       from (
         select distinct user_id, (created_at at time zone $1)::date::text as d
           from user_activity
          where action = any($2) and created_at >= $3 and created_at < $4
       ) a
       join profiles p on p.id = a.user_id
      group by p.id
      order by count(*) desc, p.id`,
    [tz, Array.from(QUALIFYING_ACTIONS), start, end],
  );

  const qualified = res.rows.filter((r) => r.days.length >= minDays);
  const rows: PresenceRow[] = qualified.slice(0, PRESENCE_ROW_CAP).map((r) => ({
    user_id: r.id,
    display_name: r.display_name,
    phone: r.phone,
    active_days: r.days.length,
    longest_run: longestRunOf(r.days),
    current_streak: r.current_streak,
    first_day: r.days[0],
    last_day: r.days[r.days.length - 1],
  }));

  return {
    days, min_days: minDays, from_day: fromDay, to_day: toDay,
    active_total: res.rows.length, qualified_total: qualified.length,
    cap: PRESENCE_ROW_CAP, rows,
  };
}
