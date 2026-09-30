import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { dayRuns } from '../src/services/streak.js';
import { diagnoseStreak, repairStreak } from '../src/services/streak-repair.js';

/**
 * ترمیم استریک شکسته (founder, 2026-09-30).
 *
 * The subject of nearly every case here is the one distinction the feature
 * rests on: «the run that broke» is neither `longest_streak` nor
 * `current_streak`, so it has to come out of the activity log.
 */

const auth = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

let app: FastifyInstance;
beforeEach(async () => { await resetDb(); app = await makeApp(); });
afterAll(async () => { await pool.end(); });

/** A reader whose qualifying activity fell on exactly these Tehran days. */
async function reader(
  days: string[],
  cached: { current: number; longest: number },
  phone = '09153201805',
): Promise<string> {
  const p = await pool.query<{ id: string }>(
    `insert into profiles (display_name, phone, current_streak, longest_streak, last_active_day)
     values ('reader', $1, $2, $3, $4) returning id`,
    [phone, cached.current, cached.longest, days.length ? days[days.length - 1] : null],
  );
  const id = p.rows[0].id;
  for (const d of days) {
    // Noon Tehran, so the day is unambiguous whichever way the zone converts.
    await pool.query(
      `insert into user_activity (user_id, action, created_at)
       values ($1, 'article_completed', (($2::date)::text || ' 09:00:00')::timestamp at time zone $3)`,
      [id, d, config.streakTimezone],
    );
  }
  return id;
}

/** Consecutive days, count long, ending the day before `gapBefore`. */
function runBack(endDay: string, count: number): string[] {
  const out: string[] = [];
  const d = new Date(endDay + 'T00:00:00Z');
  for (let i = 0; i < count; i += 1) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out.reverse();
}

describe('dayRuns — the runs the two cached numbers reduce away', () => {
  it('splits on a gap and keeps each run whole', () => {
    expect(dayRuns(['2026-09-01', '2026-09-02', '2026-09-05', '2026-09-06', '2026-09-07']))
      .toEqual([
        { start: '2026-09-01', end: '2026-09-02', length: 2 },
        { start: '2026-09-05', end: '2026-09-07', length: 3 },
      ]);
  });

  it('bridges a day a shield froze, exactly as the live engine would', () => {
    expect(dayRuns(['2026-09-01', '2026-09-03'], ['2026-09-02']))
      .toEqual([{ start: '2026-09-01', end: '2026-09-03', length: 2 }]);
  });

  it('is empty for a reader who never qualified', () => {
    expect(dayRuns([])).toEqual([]);
  });
});

describe('diagnoseStreak', () => {
  it('names the run that broke, which is neither cached number', async () => {
    // A 30-day run, a gap, then 9 days — and an all-time record of 45 from
    // longer ago. No column holds the 30.
    const days = [...runBack('2026-08-20', 30), ...runBack('2026-09-30', 9)];
    const id = await reader(days, { current: 9, longest: 45 });

    const d = (await diagnoseStreak(id, new Date('2026-09-30T12:00:00Z')))!;
    expect(d.current_run!.length).toBe(9);
    expect(d.previous_run!.length, 'the run the break took').toBe(30);
    expect(d.cached).toMatchObject({ current_streak: 9, longest_streak: 45 });
    expect(d.proposed_total).toBe(39);
  });

  it('never lowers the record: longest stays the max of the two', async () => {
    const days = [...runBack('2026-08-20', 12), ...runBack('2026-09-30', 9)];
    const id = await reader(days, { current: 9, longest: 45 });

    const d = (await diagnoseStreak(id, new Date('2026-09-30T12:00:00Z')))!;
    expect(d.proposed_total).toBe(21);
    expect(d.would_write).toEqual({ current_streak: 21, longest_streak: 45 });
  });

  it('raises the record when the total beats it', async () => {
    const days = [...runBack('2026-08-20', 30), ...runBack('2026-09-30', 9)];
    const id = await reader(days, { current: 9, longest: 30 });

    const d = (await diagnoseStreak(id, new Date('2026-09-30T12:00:00Z')))!;
    expect(d.would_write).toEqual({ current_streak: 39, longest_streak: 39 });
  });

  it('blocks a reader with a single run — there is no previous one to add', async () => {
    const id = await reader(runBack('2026-09-30', 9), { current: 9, longest: 9 });
    const d = (await diagnoseStreak(id, new Date('2026-09-30T12:00:00Z')))!;
    expect(d.blocked).toBe('no_previous_run');
    expect(d.proposed_total).toBe(null);
  });

  it('blocks a reader with no qualifying activity at all', async () => {
    const id = await reader([], { current: 0, longest: 0 });
    const d = (await diagnoseStreak(id))!;
    expect(d.blocked).toBe('no_activity');
    expect(d.runs).toEqual([]);
  });

  it('reports whether the live run is still savable', async () => {
    const fresh = await reader(runBack('2026-09-30', 3), { current: 3, longest: 3 }, '09150000001');
    const stale = await reader(runBack('2026-08-01', 3), { current: 3, longest: 3 }, '09150000002');
    const now = new Date('2026-09-30T12:00:00Z');
    expect((await diagnoseStreak(fresh, now))!.alive).toBe(true);
    expect((await diagnoseStreak(stale, now))!.alive).toBe(false);
  });
});

describe('repairStreak', () => {
  const now = new Date('2026-09-30T12:00:00Z');

  it('writes the sum onto both columns', async () => {
    const days = [...runBack('2026-08-20', 30), ...runBack('2026-09-30', 9)];
    const id = await reader(days, { current: 9, longest: 30 });

    const res = await repairStreak(id, { expectTotal: 39 }, now);
    expect(res).toMatchObject({
      ok: true, current_run: 9, previous_run: 30, unchanged: false,
      before: { current_streak: 9, longest_streak: 30 },
      after: { current_streak: 39, longest_streak: 39 },
    });
    const row = await pool.query('select current_streak, longest_streak from profiles where id = $1', [id]);
    expect(row.rows[0]).toMatchObject({ current_streak: 39, longest_streak: 39 });
  });

  it('is harmless twice, because the proposal comes from the log and not the cache', async () => {
    const days = [...runBack('2026-08-20', 30), ...runBack('2026-09-30', 9)];
    const id = await reader(days, { current: 9, longest: 30 });

    await repairStreak(id, { expectTotal: 39 }, now);
    const second = await repairStreak(id, { expectTotal: 39 }, now);
    expect(second).toMatchObject({ ok: true, unchanged: true });
    const row = await pool.query('select current_streak, longest_streak from profiles where id = $1', [id]);
    expect(row.rows[0], 'not 39 + 9 again').toMatchObject({ current_streak: 39, longest_streak: 39 });
  });

  it('writes no activity row — the reader\'s log is never fabricated', async () => {
    const days = [...runBack('2026-08-20', 30), ...runBack('2026-09-30', 9)];
    const id = await reader(days, { current: 9, longest: 30 });
    const before = await pool.query<{ n: number }>(
      'select count(*)::int as n from user_activity where user_id = $1', [id],
    );

    await repairStreak(id, { expectTotal: 39 }, now);
    const after = await pool.query<{ n: number }>(
      'select count(*)::int as n from user_activity where user_id = $1', [id],
    );
    expect(after.rows[0].n).toBe(before.rows[0].n);
    const kept = await pool.query<{ n: number }>(
      "select count(*)::int as n from user_activity where user_id = $1 and action = 'streak_kept'", [id],
    );
    expect(kept.rows[0].n).toBe(0);
  });

  it('refuses a total that is not the one the caller was shown', async () => {
    const days = [...runBack('2026-08-20', 30), ...runBack('2026-09-30', 9)];
    const id = await reader(days, { current: 9, longest: 30 });

    const res = await repairStreak(id, { expectTotal: 100 }, now);
    expect(res).toMatchObject({ ok: false, error: 'total_moved', expected: 100, actual: 39 });
    const row = await pool.query('select current_streak from profiles where id = $1', [id]);
    expect(row.rows[0].current_streak, 'and wrote nothing').toBe(9);
  });

  it('refuses a reader with only one run', async () => {
    const id = await reader(runBack('2026-09-30', 9), { current: 9, longest: 9 });
    expect(await repairStreak(id, {}, now)).toMatchObject({ ok: false, error: 'no_previous_run' });
  });
});

describe('choosing WHICH run to add', () => {
  const now = new Date('2026-09-30T12:00:00Z');

  /**
   * ôMǐÐ ĶĦåN's real shape (production, 2026-09-30): he broke three times, so
   * «the run that broke» has no single answer. The immediately-previous run is
   * 5 days and the one the founder meant is the 35-day run that ended 09-09.
   */
  const threeBreaks = () => [
    ...runBack('2026-09-09', 35),
    ...runBack('2026-09-13', 2),
    ...runBack('2026-09-19', 5),
    ...runBack('2026-09-30', 9),
  ];

  it('defaults to the run immediately before, as before', async () => {
    const id = await reader(threeBreaks(), { current: 9, longest: 42 });
    const res = await repairStreak(id, {}, now);
    expect(res).toMatchObject({ ok: true, current_run: 9, previous_run: 5 });
    expect((res as { after: { current_streak: number } }).after.current_streak).toBe(14);
  });

  it('adds the run the founder picked instead', async () => {
    const id = await reader(threeBreaks(), { current: 9, longest: 42 });
    const d = (await diagnoseStreak(id, now))!;
    const long = d.runs.find((r) => r.length === 35)!;

    const res = await repairStreak(id, { addRunStart: long.start, expectTotal: 44 }, now);
    expect(res).toMatchObject({
      ok: true, current_run: 9, previous_run: 35,
      after: { current_streak: 44, longest_streak: 44 },
      added_run: { length: 35 },
    });
  });

  it('refuses a start day that is not the start of any run', async () => {
    const id = await reader(threeBreaks(), { current: 9, longest: 42 });
    const res = await repairStreak(id, { addRunStart: '2026-01-01' }, now);
    expect(res).toMatchObject({ ok: false, error: 'no_such_run' });
  });

  it('refuses adding the live run to itself', async () => {
    const id = await reader(threeBreaks(), { current: 9, longest: 42 });
    const d = (await diagnoseStreak(id, now))!;
    const res = await repairStreak(id, { addRunStart: d.current_run!.start }, now);
    expect(res).toMatchObject({ ok: false, error: 'run_is_current' });
  });

  it('still refuses a total the caller was not shown', async () => {
    const id = await reader(threeBreaks(), { current: 9, longest: 42 });
    const d = (await diagnoseStreak(id, now))!;
    const long = d.runs.find((r) => r.length === 35)!;
    const res = await repairStreak(id, { addRunStart: long.start, expectTotal: 14 }, now);
    expect(res).toMatchObject({ ok: false, error: 'total_moved', expected: 14, actual: 44 });
  });

  it('lists enough runs for the founder to find the one they mean', async () => {
    // The 35-day run sat fourth; an 8-run cap was hiding exactly this.
    const id = await reader(threeBreaks(), { current: 9, longest: 42 });
    const d = (await diagnoseStreak(id, now))!;
    expect(d.runs.map((r) => r.length)).toEqual([9, 5, 2, 35]);
    expect(d.run_count).toBe(4);
  });
});

describe('GET /admin/streak + POST /admin/streak/repair', () => {
  const now = '2026-09-30';

  it('both need admin credentials', async () => {
    expect((await app.inject({ method: 'GET', url: '/admin/streak?user=09153201805' })).statusCode).toBe(401);
    expect((await app.inject({
      method: 'POST', url: '/admin/streak/repair', payload: { user: '09153201805' },
    })).statusCode).toBe(401);
  });

  it('reads one reader by phone and reports the runs newest-first', async () => {
    const days = [...runBack('2026-08-20', 30), ...runBack(now, 9)];
    await reader(days, { current: 9, longest: 45 });

    const res = await app.inject({
      method: 'GET', url: '/admin/streak?user=09153201805', headers: { authorization: auth },
    });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.runs[0].length, 'newest first').toBe(9);
    expect(j.runs[1].length).toBe(30);
    expect(j.previous_run.length).toBe(30);
    expect(j.would_write).toEqual({ current_streak: 39, longest_streak: 45 });
  });

  it('404s an unknown reader', async () => {
    const res = await app.inject({
      method: 'GET', url: '/admin/streak?user=09999999999', headers: { authorization: auth },
    });
    expect(res.statusCode).toBe(404);
  });

  it('repairs, and says what it changed', async () => {
    const days = [...runBack('2026-08-20', 30), ...runBack(now, 9)];
    const id = await reader(days, { current: 9, longest: 30 });

    const res = await app.inject({
      method: 'POST', url: '/admin/streak/repair', headers: { authorization: auth },
      payload: { user: id, expect_total: 39 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      ok: true, before: { current_streak: 9 }, after: { current_streak: 39, longest_streak: 39 },
    });
  });

  it('accepts a real date in add_run_start, and adds THAT run', async () => {
    // v153 shipped with the schema pattern written as '^\d{4}-...' in the
    // source, which a TS string literal reads as '^d{4}-...' — so every real
    // date was a 400 and the only path the founder can use was unreachable.
    // Service-level tests could not see it; this one goes through the route.
    const days = [
      ...runBack('2026-09-09', 35),
      ...runBack('2026-09-19', 5),
      ...runBack(now, 9),
    ];
    const id = await reader(days, { current: 9, longest: 42 });

    const res = await app.inject({
      method: 'POST', url: '/admin/streak/repair', headers: { authorization: auth },
      payload: { user: id, add_run_start: '2026-08-06', expect_total: 44 },
    });
    expect(res.statusCode, res.body).toBe(200);
    expect(res.json()).toMatchObject({
      ok: true, current_run: 9, previous_run: 35,
      after: { current_streak: 44, longest_streak: 44 },
    });
  });

  it('400s a malformed date rather than treating it as no choice at all', async () => {
    const id = await reader(runBack(now, 3), { current: 3, longest: 3 });
    const res = await app.inject({
      method: 'POST', url: '/admin/streak/repair', headers: { authorization: auth },
      payload: { user: id, add_run_start: 'yesterday' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('409s with a Persian reason when there is no previous run', async () => {
    const id = await reader(runBack(now, 9), { current: 9, longest: 9 });
    const res = await app.inject({
      method: 'POST', url: '/admin/streak/repair', headers: { authorization: auth },
      payload: { user: id },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('no_previous_run');
    expect(res.json().message).toContain('دورهٔ قبلی');
  });

  it('the panel page carries the block', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin', headers: { authorization: auth } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('ترمیم استریک شکسته');
    expect(res.body).toContain("fetch('/admin/streak?user='");
  });
});
