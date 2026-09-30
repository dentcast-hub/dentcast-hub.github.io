import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resetDb } from './helpers.js';
import { pool } from '../src/db.js';

/**
 * The hand tool that folds a live streak into the record (founder, 2026-09-30).
 *
 * Run as a real process, like redecide-stranded-week's suite: it is something
 * the founder types, and a test that imported a function out of it would not be
 * exercising the thing that gets typed.
 */

// node + tsx's own entry, never `npx`: spawning a .cmd shim without a shell is
// EINVAL on Windows since Node 20.
const TSX = createRequire(import.meta.url).resolve('tsx/cli');

function run(args: string[]): string {
  return execFileSync(
    process.execPath,
    [TSX, 'src/scripts/merge-streak-record.ts', ...args],
    { encoding: 'utf8', env: process.env, stdio: ['ignore', 'pipe', 'pipe'] },
  );
}
function runExpectingFailure(args: string[]): string {
  try {
    run(args);
    throw new Error('expected the script to exit non-zero');
  } catch (e) {
    const err = e as { status?: number; stderr?: string };
    if (err.status == null) throw e;
    return err.stderr ?? '';
  }
}

async function seedReader(
  opts: { phone?: string; name?: string; current: number; longest: number; lastActive?: string | null },
): Promise<string> {
  const r = await pool.query<{ id: string }>(
    `insert into profiles (display_name, phone, current_streak, longest_streak, last_active_day)
     values ($1, $2, $3, $4, $5) returning id`,
    [opts.name ?? 'reader', opts.phone ?? null, opts.current, opts.longest, opts.lastActive ?? null],
  );
  return r.rows[0].id;
}
async function streaks(id: string): Promise<{ current_streak: number; longest_streak: number; last_active_day: string | null }> {
  const r = await pool.query<{ current_streak: number; longest_streak: number; last_active_day: string | null }>(
    `select current_streak, longest_streak,
            to_char(last_active_day, 'YYYY-MM-DD') as last_active_day
       from profiles where id = $1`,
    [id],
  );
  return r.rows[0];
}

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await pool.end(); });

describe('merge-streak-record', () => {
  it('a dry run prints the sum and writes nothing', async () => {
    const id = await seedReader({ phone: '09153201805', current: 9, longest: 41, lastActive: '2026-09-30' });
    const out = run(['--user', '09153201805']);

    expect(out).toContain('41 + 9 = 50');
    expect(out).toContain('dry run');
    expect(await streaks(id)).toMatchObject({ current_streak: 9, longest_streak: 41 });
  });

  it('--apply sets BOTH columns to the sum and leaves last_active_day alone', async () => {
    const id = await seedReader({ phone: '09153201805', current: 9, longest: 41, lastActive: '2026-09-30' });
    const out = run(['--user', '09153201805', '--apply']);

    expect(out).toContain('APPLIED');
    expect(await streaks(id)).toEqual({
      current_streak: 50, longest_streak: 50, last_active_day: '2026-09-30',
    });
  });

  it('says out loud that a rebuild would undo it', async () => {
    // The one surprise that arrives weeks later, so it is not left to the file
    // header: the columns are a cache and rebuild-streaks recomputes them.
    await seedReader({ phone: '09153201805', current: 9, longest: 41 });
    const out = run(['--user', '09153201805', '--apply']);
    expect(out).toContain('rebuild-streaks');
  });

  it('writes no activity history — the log is never fabricated', async () => {
    // The durable alternative would be inserting streak_kept rows for days the
    // reader never had, which the monthly report's calendar would then show.
    const id = await seedReader({ phone: '09153201805', current: 9, longest: 41 });
    run(['--user', '09153201805', '--apply']);

    const rows = await pool.query<{ n: number }>(
      'select count(*)::int as n from user_activity where user_id = $1', [id],
    );
    expect(rows.rows[0].n).toBe(0);
  });

  it('refuses a reader with no live streak to fold in', async () => {
    const id = await seedReader({ phone: '09153201805', current: 0, longest: 41 });
    const out = run(['--user', '09153201805', '--apply']);

    expect(out).toContain('Refusing');
    expect(await streaks(id)).toMatchObject({ current_streak: 0, longest_streak: 41 });
  });

  it('resolves by user id and by display name, not only by phone', async () => {
    const id = await seedReader({ name: 'omid khani', current: 2, longest: 10 });
    expect(run(['--user', id])).toContain('10 + 2 = 12');
    expect(run(['--user', 'omid khani'])).toContain('10 + 2 = 12');
  });

  it('refuses an ambiguous name rather than picking one', async () => {
    await seedReader({ name: 'twin', current: 1, longest: 5 });
    await seedReader({ name: 'twin', current: 2, longest: 9 });

    const err = runExpectingFailure(['--user', 'twin', '--apply']);
    expect(err).toContain('matches 2 profiles');
  });

  it('404s an unknown identifier', async () => {
    const err = runExpectingFailure(['--user', '09999999999']);
    expect(err).toContain('no profile matches');
  });
});
