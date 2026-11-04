/**
 * رتبه‌بندی استریک‌ها — who holds the longest LIVE streak right now, and since
 * which day. Read-only; it writes nothing and keeps no state of its own.
 *
 * Two deliberate choices:
 *
 *  · «Live» here is `last_active_day` = today or yesterday (Tehran). The profile
 *    cache is rewritten lazily, so a reader who vanished weeks ago still carries
 *    their old `current_streak` until their next action; ranking by the raw
 *    column would crown people whose run is already dead. A reader kept alive
 *    only by shields across a longer gap is left out — the same simplification
 *    the KPI counter makes, and the cost is a missing row, never a wrong one.
 *
 *  · The start day is NOT read from the cache (there is no such column) and NOT
 *    from `streak_kept` rows, which a founder repair does not touch. It is the
 *    start of the current run in the reader's own activity log — the same
 *    derivation the repair panel shows (`diagnoseStreak`). Computed only for the
 *    rows on the page, so a thousand readers cost ten lookups.
 *
 * The list is capped (`BOARD_CAP`): nobody needs rank 700, and a prize is decided
 * at the top. Equal streaks share a rank (`rank()`), they are not silently split.
 */

import { query, one } from '../db.js';
import { config } from '../config.js';
import { dayInTz, previousDay } from './time.js';
import { diagnoseStreak } from './streak-repair.js';

export const BOARD_PAGE_SIZE = 10;
export const BOARD_CAP = 100;

export interface BoardRow {
  rank: number;
  user_id: string;
  display_name: string | null;
  phone: string | null;
  current_streak: number;
  longest_streak: number;
  last_active_day: string | null;
  /** First day of the current run in the reader's log, or null if the log has none. */
  run_start: string | null;
  /** Length of that run in the log; differs from `current_streak` after a repair. */
  run_days: number | null;
}

export interface BoardPage {
  page: number;
  pages: number;
  page_size: number;
  cap: number;
  /** All live streaks, whether or not they fit under the cap. */
  total_alive: number;
  /** How many of them the board can show (min of total_alive and cap). */
  shown_total: number;
  as_of_day: string;
  rows: BoardRow[];
}

export async function streakBoard(pageRaw: number, now: Date = new Date()): Promise<BoardPage> {
  const today = dayInTz(now, config.streakTimezone);
  const since = previousDay(today);

  const c = await one<{ n: number }>(
    `select count(*)::int as n from profiles
      where current_streak >= 1 and last_active_day >= $1::date`,
    [since],
  );
  const totalAlive = c?.n ?? 0;
  const shownTotal = Math.min(totalAlive, BOARD_CAP);
  const pages = Math.max(1, Math.ceil(shownTotal / BOARD_PAGE_SIZE));
  const page = Math.min(Math.max(Math.floor(pageRaw) || 1, 1), pages);
  const offset = (page - 1) * BOARD_PAGE_SIZE;
  const limit = Math.max(0, Math.min(BOARD_PAGE_SIZE, BOARD_CAP - offset));

  const list = await query<{
    id: string; display_name: string | null; phone: string | null;
    current_streak: number; longest_streak: number; last_active_day: string | null; rnk: number;
  }>(
    `select id, display_name, nullif(phone, '') as phone, current_streak, longest_streak,
            to_char(last_active_day, 'YYYY-MM-DD') as last_active_day, rnk::int as rnk
       from (
         select p.*, rank() over (order by current_streak desc) as rnk
           from profiles p
          where p.current_streak >= 1 and p.last_active_day >= $1::date
       ) t
      order by rnk, id
      limit $2 offset $3`,
    [since, limit, offset],
  );

  const rows: BoardRow[] = await Promise.all(list.rows.map(async (r) => {
    const d = await diagnoseStreak(r.id, now);
    return {
      rank: r.rnk,
      user_id: r.id,
      display_name: r.display_name,
      phone: r.phone,
      current_streak: r.current_streak,
      longest_streak: r.longest_streak,
      last_active_day: r.last_active_day,
      run_start: d?.current_run?.start ?? null,
      run_days: d?.current_run?.length ?? null,
    };
  }));

  return {
    page, pages, page_size: BOARD_PAGE_SIZE, cap: BOARD_CAP,
    total_alive: totalAlive, shown_total: shownTotal, as_of_day: today, rows,
  };
}
