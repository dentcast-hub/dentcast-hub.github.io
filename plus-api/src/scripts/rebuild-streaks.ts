/**
 * Rebuild every profile's streak state from its qualifying activity alone. The
 * log is the source of truth; this proves the derived state is reconstructable
 * (spec section 4). Safe to run any time and idempotent.
 *
 *   npm run rebuild-streaks
 *
 * TWO things are derived from that activity, not one, and this used to restore
 * only the first:
 *
 *   · the caches on `profiles` (current/longest streak, last active day);
 *   · the `streak_kept` rows the live engine appends as it goes — one per
 *     counted Tehran day, carrying that day and the streak as it stood.
 *
 * Nothing but گزارش ماهانه reads the second kind, which is why the gap was
 * quiet: after a rebuild the dashboard would say «۱ روز پیاپی» while the month
 * report said «۰ روز فعال», from the same account on the same day. The seeded
 * dev database shows it outright, because seed.ts inserts activity directly and
 * then calls this — profiles came out right and not one `streak_kept` row
 * existed.
 *
 * Restoring them means writing into the append-only log, and that is only
 * legitimate because of what these rows are: not something a reader did, but
 * the engine's own note about a day, derived entirely from the reader's real
 * activity. A row is added only for a counted day that has none, and removed
 * only when its day is no longer counted at all. A row that is still right is
 * never touched, so nothing is ever rewritten and a second run is a no-op.
 */
import { pool, withTransaction } from '../db.js';
import { config } from '../config.js';
import { QUALIFYING_ACTIONS, streakFromDays, countedDayRuns } from '../services/streak.js';

export async function rebuildAllStreaks(): Promise<number> {
  const actions = Array.from(QUALIFYING_ACTIONS);
  const profiles = await pool.query<{ id: string }>('select id from profiles');
  let updated = 0;
  let restored = 0;

  for (const { id } of profiles.rows) {
    // Distinct Tehran calendar days on which this user did a qualifying action,
    // each with the earliest instant of that day's activity — which is when the
    // live engine would have appended the `streak_kept` row.
    const days = await pool.query<{ d: string; at: Date }>(
      `select (created_at at time zone $2)::date as d, min(created_at) as at
         from user_activity
        where user_id = $1 and action = any($3)
        group by 1
        order by 1`,
      [id, config.streakTimezone, actions],
    );
    // Days that carry a run across a gap. Two kinds, kept apart in the log and
    // merged only here:
    //
    //   · `streak_freeze_used` (meta.frozen_day) — a shield the reader had
    //     earned and spent, replaying the live engine's own decision;
    //   · `streak_day_forgiven` (meta.forgiven_day) — a day the founder forgave.
    //
    // The second is deliberately NOT written as the first. A shield is an
    // earned, spendable resource: score.ts counts `streak_freeze_used` to work
    // out how many remain, achievements.ts counts it for the shield badge, and
    // گزارش ماهانه reports the shields spent inside the month. Forging one to
    // bridge a forgiven gap would bill the reader for a gift — their next
    // earned shield would arrive already spent — so forgiveness is its own
    // token beside the shield ledger, the same move a granted «ستون» seat makes
    // by being a row beside the payments ledger rather than a forged payment.
    //
    // This is also what makes a correction survive a rebuild. Before it, the
    // only way to hand a reader back a broken streak was to overwrite the cache
    // on `profiles`, which is precisely the state this script exists to discard.
    const bridged = await pool.query<{ d: string }>(
      `select coalesce(meta->>'frozen_day', meta->>'forgiven_day') as d
         from user_activity
        where user_id = $1
          and ((action = 'streak_freeze_used' and meta ? 'frozen_day')
            or (action = 'streak_day_forgiven' and meta ? 'forgiven_day'))`,
      [id],
    );
    const dayList = days.rows.map((r) => r.d);
    const bridgedDays = bridged.rows.map((r) => r.d).filter(Boolean);
    const state = streakFromDays(dayList, bridgedDays);
    const runs = countedDayRuns(dayList, bridgedDays);
    const firstSeen = new Map(days.rows.map((r) => [r.d, r.at]));

    await withTransaction(async (client) => {
      await client.query(
        `update profiles
            set current_streak = $2, longest_streak = $3, last_active_day = $4
          where id = $1`,
        [id, state.current_streak, state.longest_streak, state.last_active_day],
      );

      // A `streak_kept` row whose day is not a counted day any more (activity
      // removed since it was written) no longer describes anything.
      await client.query(
        `delete from user_activity
          where user_id = $1 and action = 'streak_kept'
            and coalesce(meta->>'day', '') <> all($2::text[])`,
        [id, dayList],
      );

      // ... and one is appended for every counted day that has none. Both
      // halves are keyed on meta.day, so running this twice changes nothing.
      const have = await client.query<{ day: string }>(
        `select meta->>'day' as day from user_activity
          where user_id = $1 and action = 'streak_kept'`,
        [id],
      );
      const known = new Set(have.rows.map((r) => r.day));
      for (const { day, streak } of runs) {
        if (known.has(day)) continue;
        await client.query(
          `insert into user_activity (user_id, action, meta, created_at)
           values ($1, 'streak_kept', $2::jsonb, $3)`,
          [id, JSON.stringify({ day, streak }), firstSeen.get(day) ?? null],
        );
        restored += 1;
      }
    });
    updated += 1;
  }
  if (restored) console.log(`Restored ${restored} missing streak_kept row(s).`);
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
