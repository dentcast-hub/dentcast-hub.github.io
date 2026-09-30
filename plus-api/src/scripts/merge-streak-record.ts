/**
 * Fold a reader's live streak INTO their record, by founder decision.
 *
 * `current_streak` and `longest_streak` both become `longest + current` — the
 * arithmetic the founder asked for on 2026-09-30 for one reader whose long run
 * had broken and who had since built a new one: the new days are added to the
 * record rather than being measured against it, and the reader carries on from
 * the total.
 *
 * A hand tool, not an endpoint, and deliberately so: this is a founder's
 * judgement about one account, the same shape `redecide-stranded-week` and
 * `anniversary-grant` have. Dry run unless --apply.
 *
 * TWO THINGS TO KNOW BEFORE USING IT, because both are the kind of surprise
 * that arrives weeks later.
 *
 * 1. THESE COLUMNS ARE A CACHE, NOT THE TRUTH. `services/streak.ts` advances
 *    them on every qualifying action, and `scripts/rebuild-streaks.ts` rebuilds
 *    them from scratch out of `user_activity` — the `streak_kept` days and the
 *    `streak_freeze_used` bridges. So a value written here survives ordinary use
 *    (the engine only ever extends what it finds) and is ERASED the next time
 *    anybody runs the rebuild. The script says so on every run.
 *
 * 2. IT WRITES NO HISTORY, ON PURPOSE. The durable alternative would be
 *    inserting `streak_kept` rows for days the reader did not read, and those
 *    rows are read by the monthly report's day calendar, by consumption and by
 *    the achievement facts — so the reader would be shown a calendar of days
 *    they never had, and every derived number built on that log would inherit
 *    the fiction. A cache the founder chose to set is a decision; a fabricated
 *    activity log is a lie to every other feature that reads it.
 *
 * What DOES follow the cache: `longest_streak` is what the badge wall reads
 * (`routes/achievements.ts` passes it straight to computeAchievementFacts), so
 * the streak badges re-evaluate against the new record on the next read, and
 * `achievement-sync` may announce a level the reader has now reached.
 *
 *   npx tsx src/scripts/merge-streak-record.ts --user 09153201805
 *   npx tsx src/scripts/merge-streak-record.ts --user 09153201805 --apply
 */

import { pool, query, one, withTransaction } from '../db.js';
import { normalizePhone } from '../services/phone.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Target {
  id: string;
  phone: string | null;
  username: string | null;
  display_name: string | null;
  current_streak: number;
  longest_streak: number;
  last_active_day: string | null;
}

const SELECT = `
  select p.id,
         nullif(p.phone, '') as phone,
         ai.username,
         p.display_name,
         p.current_streak,
         p.longest_streak,
         to_char(p.last_active_day, 'YYYY-MM-DD') as last_active_day
    from profiles p
    left join auth_identities ai on ai.user_id = p.id`;

/** Same resolution order the admin panel uses: id, then phone, then a handle. */
async function resolve(needle: string): Promise<Target> {
  let rows: Target[];
  if (UUID_RE.test(needle)) {
    rows = (await query<Target>(`${SELECT} where p.id = $1`, [needle])).rows;
  } else {
    const phone = normalizePhone(needle);
    if (phone) {
      rows = (await query<Target>(`${SELECT} where p.phone = $1`, [phone])).rows;
    } else {
      const handle = needle.replace(/^@/, '');
      rows = (await query<Target>(
        `${SELECT} where lower(ai.username) = lower($1) or lower(p.display_name) = lower($1)`,
        [handle],
      )).rows;
    }
  }
  // One profile can hold several auth identities, so collapse by profile id
  // before calling this ambiguous.
  const byId = new Map<string, Target>();
  for (const r of rows) {
    const seen = byId.get(r.id);
    if (!seen || (!seen.username && r.username)) byId.set(r.id, r);
  }
  const found = [...byId.values()];
  if (found.length === 0) throw new Error(`no profile matches '${needle}'`);
  if (found.length > 1) {
    throw new Error(
      `'${needle}' matches ${found.length} profiles — pass a user id instead:\n`
      + found.map((f) => `  ${f.id}  ${f.display_name ?? '-'}  ${f.phone ?? '-'}`).join('\n'),
    );
  }
  return found[0];
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--user');
  const needle = i >= 0 ? argv[i + 1] : undefined;
  const apply = argv.includes('--apply');
  if (!needle) throw new Error('usage: --user <phone|user_id|@handle> [--apply]');

  const t = await resolve(needle);
  const total = t.longest_streak + t.current_streak;

  console.log(`account      ${t.id}`);
  console.log(`             ${t.display_name ?? '-'}  ${t.phone ?? '-'}  ${t.username ? '@' + t.username : ''}`);
  console.log(`current      ${t.current_streak}`);
  console.log(`longest      ${t.longest_streak}`);
  console.log(`last active  ${t.last_active_day ?? 'never'}`);
  console.log(`=> both current_streak and longest_streak become ${t.longest_streak} + ${t.current_streak} = ${total}`);

  if (t.current_streak <= 0) {
    console.log('\nNothing to fold in: the live streak is 0. Refusing.');
    await pool.end();
    return;
  }
  if (!apply) {
    console.log('\n(dry run — pass --apply to write)');
    await pool.end();
    return;
  }

  // `for update` for the same reason applyStreak takes it: a qualifying action
  // arriving mid-write would otherwise advance the row from the value this
  // script read, and one of the two updates would be lost.
  const written = await withTransaction(async (client) => {
    const row = await one<{ current_streak: number; longest_streak: number }>(
      'select current_streak, longest_streak from profiles where id = $1 for update', [t.id], client,
    );
    if (!row) throw new Error('profile vanished mid-transaction');
    if (row.current_streak !== t.current_streak || row.longest_streak !== t.longest_streak) {
      throw new Error(
        `the streak moved while this ran (now ${row.current_streak}/${row.longest_streak}, `
        + `read ${t.current_streak}/${t.longest_streak}) — re-run so the sum is the one you saw`,
      );
    }
    const sum = row.longest_streak + row.current_streak;
    await client.query(
      'update profiles set current_streak = $2, longest_streak = $2 where id = $1', [t.id, sum],
    );
    return sum;
  });

  console.log(`\nAPPLIED. current_streak = longest_streak = ${written}`);
  console.log('Note: these are caches. `npm run rebuild-streaks` recomputes them from');
  console.log('user_activity and would undo this; ordinary use only ever extends it.');
  await pool.end();
}

main().catch(async (e) => {
  console.error(`\n✗ ${e instanceof Error ? e.message : String(e)}`);
  await pool.end().catch(() => {});
  process.exit(1);
});
