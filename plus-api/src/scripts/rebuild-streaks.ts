/**
 * Rebuild every profile's streak caches from `user_activity` alone. The log is
 * the source of truth; this proves the caches are reconstructable (spec section
 * 4). Safe to run any time; it is a pure recompute.
 *
 *   npm run rebuild-streaks
 */
import { pool, withTransaction } from '../db.js';
import { config } from '../config.js';
import { QUALIFYING_ACTIONS, streakFromDays } from '../services/streak.js';

export async function rebuildAllStreaks(): Promise<number> {
  const actions = Array.from(QUALIFYING_ACTIONS);
  const profiles = await pool.query<{ id: string }>('select id from profiles');
  let updated = 0;

  for (const { id } of profiles.rows) {
    // Distinct Tehran calendar days on which this user did a qualifying action.
    const days = await pool.query<{ d: string }>(
      `select distinct (created_at at time zone $2)::date as d
         from user_activity
        where user_id = $1 and action = any($3)
        order by d`,
      [id, config.streakTimezone, actions],
    );
    // Days a shield bridged, so a rebuilt streak survives the same gaps the live
    // engine protected (the log records each frozen day under meta.frozen_day).
    const frozen = await pool.query<{ d: string }>(
      `select (meta->>'frozen_day') as d from user_activity
        where user_id = $1 and action = 'streak_freeze_used' and meta ? 'frozen_day'`,
      [id],
    );
    const state = streakFromDays(days.rows.map((r) => r.d), frozen.rows.map((r) => r.d).filter(Boolean));
    await withTransaction((client) =>
      client.query(
        `update profiles
            set current_streak = $2, longest_streak = $3, last_active_day = $4
          where id = $1`,
        [id, state.current_streak, state.longest_streak, state.last_active_day],
      ),
    );
    updated += 1;
  }
  return updated;
}

// Run directly (not when imported by the seed).
const isDirect = process.argv[1] && process.argv[1].includes('rebuild-streaks');
if (isDirect) {
  rebuildAllStreaks()
    .then((n) => {
      console.log(`Rebuilt streak caches for ${n} profile(s).`);
      return pool.end();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
