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
