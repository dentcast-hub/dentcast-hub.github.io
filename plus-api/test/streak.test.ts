import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { dayInTz, previousDay } from '../src/services/time.js';
import { computeStreakUpdate, streakFromDays } from '../src/services/streak.js';
import { rebuildAllStreaks } from '../src/scripts/rebuild-streaks.js';

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('Asia/Tehran day boundary', () => {
  it('rolls the day at Tehran midnight, not UTC (23:59 edge)', () => {
    // Tehran is UTC+3:30. 2026-03-20 20:29:00Z == 2026-03-20 23:59 Tehran.
    expect(dayInTz('2026-03-20T20:29:00Z')).toBe('2026-03-20');
    // 2026-03-20 20:31:00Z == 2026-03-21 00:01 Tehran -> next Tehran day.
    expect(dayInTz('2026-03-20T20:31:00Z')).toBe('2026-03-21');
    // same UTC calendar day, two different Tehran days
    expect(previousDay('2026-03-21')).toBe('2026-03-20');
  });
});

describe('computeStreakUpdate (pure)', () => {
  it('starts a streak at 1', () => {
    const { next, counted } = computeStreakUpdate(
      { current_streak: 0, longest_streak: 0, last_active_day: null }, '2026-03-20');
    expect(counted).toBe(true);
    expect(next).toEqual({ current_streak: 1, longest_streak: 1, last_active_day: '2026-03-20' });
  });
  it('increments on a consecutive day and tracks the longest', () => {
    const { next } = computeStreakUpdate(
      { current_streak: 3, longest_streak: 3, last_active_day: '2026-03-20' }, '2026-03-21');
    expect(next).toEqual({ current_streak: 4, longest_streak: 4, last_active_day: '2026-03-21' });
  });
  it('does not double-count the same day', () => {
    const { counted, next } = computeStreakUpdate(
      { current_streak: 4, longest_streak: 4, last_active_day: '2026-03-21' }, '2026-03-21');
    expect(counted).toBe(false);
    expect(next.current_streak).toBe(4);
  });
  it('resets to 1 after a gap but keeps the longest', () => {
    const { next } = computeStreakUpdate(
      { current_streak: 5, longest_streak: 5, last_active_day: '2026-03-20' }, '2026-03-25');
    expect(next).toEqual({ current_streak: 1, longest_streak: 5, last_active_day: '2026-03-25' });
  });
});

describe('computeStreakUpdate with streak shields', () => {
  const prev = { current_streak: 5, longest_streak: 5, last_active_day: '2026-03-20' };

  it('bridges a one-day gap with a shield instead of resetting', () => {
    // missed 2026-03-21, active again 2026-03-22 -> needs 1 shield
    const { next, shieldsUsed } = computeStreakUpdate(prev, '2026-03-22', 1);
    expect(shieldsUsed).toBe(1);
    expect(next).toEqual({ current_streak: 6, longest_streak: 6, last_active_day: '2026-03-22' });
  });

  it('bridges a two-day gap when two shields are available', () => {
    const { next, shieldsUsed } = computeStreakUpdate(prev, '2026-03-23', 2);
    expect(shieldsUsed).toBe(2);
    expect(next.current_streak).toBe(6);
  });

  it('resets when the gap needs more shields than are available', () => {
    const { next, shieldsUsed } = computeStreakUpdate(prev, '2026-03-23', 1); // needs 2, has 1
    expect(shieldsUsed).toBe(0);
    expect(next.current_streak).toBe(1);
  });

  it('does not spend a shield on a consecutive day', () => {
    const { next, shieldsUsed } = computeStreakUpdate(prev, '2026-03-21', 2);
    expect(shieldsUsed).toBe(0);
    expect(next.current_streak).toBe(6);
  });
});

describe('streakFromDays (rebuild math)', () => {
  it('computes current run, longest run, and last day, ignoring order/dupes', () => {
    const s = streakFromDays(['2026-03-01', '2026-03-02', '2026-03-02', '2026-03-05', '2026-03-06', '2026-03-07']);
    expect(s.longest_streak).toBe(3); // 05,06,07
    expect(s.current_streak).toBe(3);
    expect(s.last_active_day).toBe('2026-03-07');
  });
  it('current run is shorter than longest when the tail is isolated', () => {
    const s = streakFromDays(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-10']);
    expect(s.longest_streak).toBe(3);
    expect(s.current_streak).toBe(1);
  });

  it('bridges a gap across a frozen day so the run survives', () => {
    // active 01,02,04 with 03 frozen -> one continuous run of 3 active days
    const s = streakFromDays(['2026-03-01', '2026-03-02', '2026-03-04'], ['2026-03-03']);
    expect(s.current_streak).toBe(3);
    expect(s.longest_streak).toBe(3);
    expect(s.last_active_day).toBe('2026-03-04');
  });

  it('still resets when the gap has an unfrozen day', () => {
    // gap 02->05 needs 03 and 04 frozen; only 03 is -> run breaks
    const s = streakFromDays(['2026-03-01', '2026-03-02', '2026-03-05'], ['2026-03-03']);
    expect(s.current_streak).toBe(1);
  });
});

describe('live streak via /activity', () => {
  it('card_reviewed_manual counts for the streak and is idempotent same-day', async () => {
    const cookie = await loginAs(app, '09121500001');
    // first manual review today -> streak 1, appends streak_kept
    await app.inject({ method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'card_reviewed_manual', content_id: 'x/y' } });
    let me = await (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    expect(me.current_streak).toBe(1);

    // second manual review same day -> still 1
    await app.inject({ method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'card_reviewed_manual', content_id: 'x/y' } });
    me = await (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    expect(me.current_streak).toBe(1);

    // exactly one streak_kept event for today
    const kept = await pool.query(`select count(*)::int as n from user_activity where action='streak_kept'`);
    expect(kept.rows[0].n).toBe(1);
  });
});

describe('streak shields save the streak live (spec: سپر استریک)', () => {
  it('spends a shield on a missed day instead of resetting, and reports it', async () => {
    const cookie = await loginAs(app, '09121500009');
    const me0 = await (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    const userId = me0.id;

    // Reach 150 score => 1 shield earned: 15 distinct active days (active_days*10).
    const rows: string[] = [];
    for (let i = 1; i <= 15; i += 1) {
      const day = '2025-01-' + String(i).padStart(2, '0');
      rows.push(`($1,'highlight_created','${day}T08:00:00Z')`);
    }
    await pool.query(`insert into user_activity (user_id, action, created_at) values ${rows.join(',')}`, [userId]);

    // A streak of 5 ending two days ago: today's action must bridge one missed day.
    const today = dayInTz(new Date());
    const twoAgo = previousDay(previousDay(today));
    await pool.query(
      `update profiles set current_streak=5, longest_streak=5, last_active_day=$2 where id=$1`,
      [userId, twoAgo],
    );

    await app.inject({ method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'card_reviewed_manual', content_id: 'x/y' } });

    const me = await (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    expect(me.current_streak).toBe(6); // preserved, not reset to 1

    const froze = await pool.query<{ n: number }>(
      `select count(*)::int as n from user_activity where user_id=$1 and action='streak_freeze_used'`, [userId]);
    expect(froze.rows[0].n).toBe(1); // exactly one shield spent

    const prog = await (await app.inject({ method: 'GET', url: '/progress', headers: { cookie } })).json();
    expect(prog.freezes.cap).toBe(2);
    expect(prog.freezes.available).toBe(0); // the one earned shield was just spent
  });
});

describe('rebuild script recomputes caches from the log alone', () => {
  it('reconstructs streak from activity created_at across a Tehran-midnight boundary', async () => {
    const cookie = await loginAs(app, '09121500002');
    const me = await (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    const userId = me.id;

    // Insert qualifying activity directly with explicit timestamps:
    //  - 2026-03-20 23:59 Tehran  (20:29Z)
    //  - 2026-03-21 00:01 Tehran  (20:31Z)  -> consecutive Tehran days
    await pool.query(
      `insert into user_activity (user_id, action, content_id, created_at) values
       ($1,'highlight_created','a', '2026-03-20T20:29:00Z'),
       ($1,'card_reviewed_manual','a', '2026-03-20T20:31:00Z')`,
      [userId],
    );
    // corrupt the caches on purpose
    await pool.query(`update profiles set current_streak=99, longest_streak=99, last_active_day='2000-01-01' where id=$1`, [userId]);

    await rebuildAllStreaks();

    const after = await pool.query(`select current_streak, longest_streak, last_active_day from profiles where id=$1`, [userId]);
    expect(after.rows[0].current_streak).toBe(2);
    expect(after.rows[0].longest_streak).toBe(2);
    expect(after.rows[0].last_active_day).toBe('2026-03-21');
  });
});
