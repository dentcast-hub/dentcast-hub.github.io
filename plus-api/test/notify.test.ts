import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { MultiNotificationSender } from '../src/providers/notifications/multi.js';
import type { NotificationSender } from '../src/providers/notifications/types.js';
import { runStreakReminders } from '../src/services/streak-reminder.js';
import { dayInTz, previousDay } from '../src/services/time.js';

// --- fan-out sender ---------------------------------------------------------

describe('MultiNotificationSender', () => {
  it('delivers through every channel', async () => {
    const a = { name: 'a', send: vi.fn(async () => {}) } satisfies NotificationSender;
    const b = { name: 'b', send: vi.fn(async () => {}) } satisfies NotificationSender;
    const multi = new MultiNotificationSender([a, b]);

    await multi.send('user-1', 'hi', 'streak');

    expect(a.send).toHaveBeenCalledWith('user-1', 'hi', 'streak');
    expect(b.send).toHaveBeenCalledWith('user-1', 'hi', 'streak');
    expect(multi.name).toBe('multi(a+b)');
  });

  it('one failing channel does not block the others', async () => {
    const boom = { name: 'boom', send: vi.fn(async () => { throw new Error('down'); }) } satisfies NotificationSender;
    const ok = { name: 'ok', send: vi.fn(async () => {}) } satisfies NotificationSender;
    const multi = new MultiNotificationSender([boom, ok]);

    await expect(multi.send('u', 'm', 'system')).resolves.toBeUndefined();
    expect(ok.send).toHaveBeenCalledOnce();
  });
});

// --- streak reminder now reaches Telegram-only users ------------------------

describe('runStreakReminders channel eligibility', () => {
  beforeEach(async () => {
    await resetDb();
  });
  afterAll(async () => {
    await pool.end();
  });

  it('reminds a Telegram-linked user with a savable streak (no web push needed)', async () => {
    const now = new Date();
    const today = dayInTz(now, config.streakTimezone);
    const yesterday = previousDay(today);
    await pool.query(
      `insert into profiles
         (phone, telegram_id, display_name, current_streak, longest_streak, last_active_day, settings)
       values (null, 12321, 'tg', 3, 3, $1::date, '{"reminders":{"streak":true}}'::jsonb)`,
      [yesterday],
    );

    const res = await runStreakReminders(now);
    expect(res.reminded).toBe(1);

    // the per-day dedup marker was appended
    const marker = await pool.query(
      "select count(*)::int n from user_activity where action = 'streak_reminder_sent'",
    );
    expect(marker.rows[0].n).toBe(1);
  });

  it('does NOT remind a user with no delivery channel (no push, no Telegram)', async () => {
    const now = new Date();
    const today = dayInTz(now, config.streakTimezone);
    const yesterday = previousDay(today);
    await pool.query(
      `insert into profiles
         (phone, display_name, current_streak, longest_streak, last_active_day, settings)
       values ('09120000001', 'no-channel', 3, 3, $1::date, '{"reminders":{"streak":true}}'::jsonb)`,
      [yesterday],
    );

    const res = await runStreakReminders(now);
    expect(res.reminded).toBe(0);
  });
});
