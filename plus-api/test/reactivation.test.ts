import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { runReactivationNudges } from '../src/services/reactivation.js';
import { dayInTz, previousDay } from '../src/services/time.js';

async function sentCount(): Promise<number> {
  const r = await pool.query("select count(*)::int n from user_activity where action = 'reactivation_sent'");
  return r.rows[0].n;
}

describe('runReactivationNudges', () => {
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await pool.end(); });

  it('nudges a no-streak user who has a channel and has not opted out', async () => {
    await pool.query(
      `insert into profiles (phone, telegram_id, display_name, current_streak, longest_streak, last_active_day, settings)
       values ('09120000001', 111, 'a', 0, 0, null, '{}'::jsonb)`,
    );
    const res = await runReactivationNudges(new Date());
    expect(res.nudged).toBe(1);
    expect(await sentCount()).toBe(1);
  });

  it('does NOT nudge a user with a live streak (that is the streak reminder\'s job)', async () => {
    const today = dayInTz(new Date(), config.streakTimezone);
    const yesterday = previousDay(today);
    await pool.query(
      `insert into profiles (phone, telegram_id, display_name, current_streak, longest_streak, last_active_day, settings)
       values ('09120000002', 222, 'b', 3, 3, $1::date, '{}'::jsonb)`,
      [yesterday],
    );
    const res = await runReactivationNudges(new Date());
    expect(res.nudged).toBe(0);
  });

  it('respects opt-out (streak reminders explicitly disabled)', async () => {
    await pool.query(
      `insert into profiles (phone, telegram_id, display_name, current_streak, settings)
       values ('09120000003', 333, 'c', 0, '{"reminders":{"streak":false}}'::jsonb)`,
    );
    const res = await runReactivationNudges(new Date());
    expect(res.nudged).toBe(0);
  });

  it('skips a user with no delivery channel (no push, no Telegram)', async () => {
    await pool.query(
      `insert into profiles (phone, display_name, current_streak, settings)
       values ('09120000004', 'd', 0, '{}'::jsonb)`,
    );
    const res = await runReactivationNudges(new Date());
    expect(res.nudged).toBe(0);
  });

  it('stops after the nudge cap so a dormant account is not harassed', async () => {
    const u = await pool.query(
      `insert into profiles (phone, telegram_id, display_name, current_streak, settings)
       values ('09120000005', 555, 'e', 0, '{}'::jsonb) returning id`,
    );
    const id = u.rows[0].id;
    // maxNudges prior nudges, all on earlier days (no engagement since -> they count).
    for (let i = 0; i < config.reactivation.maxNudges; i += 1) {
      await pool.query(
        `insert into user_activity (user_id, action, meta, created_at)
         values ($1, 'reactivation_sent', '{}'::jsonb, now() - (($2)::text || ' days')::interval)`,
        [id, i + 1],
      );
    }
    const res = await runReactivationNudges(new Date());
    expect(res.nudged).toBe(0);
  });

  it('does not double-send within the same day', async () => {
    await pool.query(
      `insert into profiles (phone, telegram_id, display_name, current_streak, settings)
       values ('09120000006', 666, 'f', 0, '{}'::jsonb)`,
    );
    expect((await runReactivationNudges(new Date())).nudged).toBe(1);
    expect((await runReactivationNudges(new Date())).nudged).toBe(0);
  });
});
