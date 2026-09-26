import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resetDb } from './helpers.js';
import { pool } from '../src/db.js';

/**
 * The one-off that pays a week the old rule left unpaid (0068).
 *
 * Reconstructed as the production row actually was: zirconia, week 2026-09-19,
 * two members on 226 and 112 weekly XP, capacity floored to 3, population null,
 * both outcomes 'stayed', titanium switched off. The script is run as a real
 * process — it is a hand tool the founder types once, and a test that imported a
 * function out of it would not be testing the thing that gets typed.
 */

const WEEK = '2026-09-19';

async function tierId(slug: string): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from league_tiers where slug = $1', [slug]);
  return r.rows[0].id;
}

/** The stranded group, exactly as finalizeWeek left it under the old rule. */
async function seedStrandedZirconia(
  members: Array<{ xp: number; rank: number }> = [{ xp: 226, rank: 1 }, { xp: 112, rank: 2 }],
): Promise<string[]> {
  const tid = await tierId('zirconia');
  const lg = await pool.query<{ id: string }>(
    `insert into leagues (tier_id, week_start, week_end, status, capacity_at_creation)
     values ($1, $2, ($2::date + 6), 'finalized', 3) returning id`,
    [tid, WEEK],
  );
  const ids: string[] = [];
  for (const m of members) {
    const u = await pool.query<{ id: string }>(
      'insert into profiles (display_name, current_tier_id) values ($1, $2) returning id',
      [`z${m.rank}`, tid],
    );
    ids.push(u.rows[0].id);
    await pool.query(
      `insert into league_members (league_id, user_id, week_start, weekly_xp,
                                   first_reached_current_xp_at, final_rank, outcome)
       values ($1, $2, $3, $4, $5, $6, 'stayed')`,
      [lg.rows[0].id, u.rows[0].id, WEEK, m.xp, `${WEEK}T0${m.rank}:00:00Z`, m.rank],
    );
  }
  await pool.query(
    `insert into league_weekly_stats (week_start, active_users, groups_count, avg_fill_pct, promotions, demotions)
     values ($1, 121, 12, 81.7, 39, 6) on conflict (week_start) do nothing`,
    [WEEK],
  );
  return ids;
}

// node + tsx's own entry, never `npx`: spawning a .cmd shim without a shell is
// EINVAL on Windows since Node 20, and going through a shell to work around that
// would put quoting between the test and the arguments it means to pass.
const TSX = createRequire(import.meta.url).resolve('tsx/cli');

function run(args: string[]): string {
  return execFileSync(
    process.execPath,
    [TSX, 'src/scripts/redecide-stranded-week.ts', ...args],
    { encoding: 'utf8', env: process.env, stdio: ['ignore', 'pipe', 'pipe'] },
  );
}
function runExpectingFailure(args: string[]): string {
  try {
    run(args);
    throw new Error('expected the script to exit non-zero');
  } catch (e) {
    const err = e as { status?: number; stderr?: string; message: string };
    if (err.status == null) throw e;
    return err.stderr ?? '';
  }
}

async function tierOf(userId: string): Promise<string> {
  const r = await pool.query<{ slug: string }>(
    'select t.slug from profiles p join league_tiers t on t.id = p.current_tier_id where p.id = $1',
    [userId],
  );
  return r.rows[0]?.slug;
}
async function titaniumActive(): Promise<boolean> {
  return (await pool.query("select is_active from league_tiers where slug = 'titanium'")).rows[0].is_active;
}

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await pool.end(); });

describe('redecide-stranded-week', () => {
  it('a dry run writes nothing at all', async () => {
    const [top, second] = await seedStrandedZirconia();
    const out = run(['--week', WEEK, '--tier', 'zirconia', '--population', '2']);

    expect(out).toContain('dry run');
    expect(out).toMatch(/promote 1/);
    expect(await tierOf(top), 'nobody moved').toBe('zirconia');
    expect(await tierOf(second)).toBe('zirconia');
    expect(await titaniumActive()).toBe(false);
    const row = await pool.query<{ population_at_creation: number | null }>(
      'select population_at_creation from leagues where week_start = $1', [WEEK],
    );
    expect(row.rows[0].population_at_creation, 'not even the population').toBe(null);
  });

  it('--apply promotes the leader, opens titanium, and leaves the runner-up where they are', async () => {
    const [top, second] = await seedStrandedZirconia();
    const out = run(['--week', WEEK, '--tier', 'zirconia', '--population', '2', '--apply']);

    expect(out).toContain('APPLIED');
    expect(await tierOf(top)).toBe('titanium');
    expect(await tierOf(second), 'demotion still wants the floored capacity').toBe('zirconia');
    expect(await titaniumActive()).toBe(true);
    expect(
      (await pool.query("select value from league_config where key = 'max_active_tier_order'")).rows[0].value,
    ).toBe('7');

    const outcomes = await pool.query<{ outcome: string; final_rank: number }>(
      'select outcome, final_rank from league_members order by final_rank',
    );
    expect(outcomes.rows.map((r) => r.outcome)).toEqual(['promoted', 'stayed']);

    // The audit row is what makes a hand-run correction as traceable as the
    // weekly one — its trigger says which week and which script.
    const audit = await pool.query<{ new_value: string; trigger_metric: string }>(
      "select new_value, trigger_metric from league_audit_log where changed_key = 'max_active_tier_order'",
    );
    expect(audit.rows[0].new_value).toBe('7');
    expect(audit.rows[0].trigger_metric).toContain(WEEK);

    // And the report agrees with the rows it reports on.
    const stats = await pool.query<{ promotions: number }>(
      'select promotions from league_weekly_stats where week_start = $1', [WEEK],
    );
    expect(stats.rows[0].promotions, '39 + 1').toBe(40);

    // Nothing was announced from here: the promotion notice is the sweep's job,
    // and it finds this row precisely because outcome_notified_at is still null.
    const notified = await pool.query<{ n: number }>(
      'select count(*)::int as n from league_members where outcome_notified_at is not null',
    );
    expect(notified.rows[0].n).toBe(0);
  });

  it('refuses a group whose members already moved', async () => {
    await seedStrandedZirconia();
    await pool.query("update league_members set outcome = 'promoted' where final_rank = 1");

    const err = runExpectingFailure(['--week', WEEK, '--tier', 'zirconia', '--population', '2', '--apply']);
    expect(err).toContain('already moved');
    expect(await titaniumActive(), 'and wrote nothing') .toBe(false);
  });

  it('does nothing when the population it is given leaves the group thin', async () => {
    const [top] = await seedStrandedZirconia();
    const out = run(['--week', WEEK, '--tier', 'zirconia', '--population', '3', '--apply']);

    expect(out).toContain('still not a valid group');
    expect(await tierOf(top)).toBe('zirconia');
    expect(await titaniumActive()).toBe(false);
  });

  it('does nothing for a whole tier of one — a rank of one is not a result', async () => {
    const [only] = await seedStrandedZirconia([{ xp: 500, rank: 1 }]);
    const out = run(['--week', WEEK, '--tier', 'zirconia', '--population', '1', '--apply']);

    expect(out).toContain('still not a valid group');
    expect(await tierOf(only)).toBe('zirconia');
    expect(await titaniumActive()).toBe(false);
  });
});
