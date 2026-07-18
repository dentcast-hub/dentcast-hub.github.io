import { config } from '../config.js';
import { query } from '../db.js';
import { dayInTz } from './time.js';
import { notifications } from '../providers/registry.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * Daily streak reminder (settings.reminders.streak). Nudges users who:
 *   (a) opted into the reminder,
 *   (b) have an active streak worth protecting (current_streak >= 1),
 *   (c) have NOT logged a qualifying action today (last_active_day != today, Tehran), and
 *   (d) have a live push subscription (Layer 2 skips anyone without one anyway).
 * It runs in the evening so there is still time to act before the Tehran-midnight
 * day boundary flips the streak.
 *
 * Deduped per Tehran day via an appended `streak_reminder_sent` marker — a
 * NON-qualifying, NON-scoring action, so it never touches streak or score. The
 * marker is claimed BEFORE delivery so an overlapping run can't double-send.
 */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number): string => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

export async function runStreakReminders(now: Date = new Date()): Promise<{ reminded: number }> {
  const today = dayInTz(now, config.streakTimezone);
  const eligible = await query<{ id: string; current_streak: number }>(
    `select p.id, p.current_streak
       from profiles p
      where coalesce((p.settings->'reminders'->>'streak')::boolean, false) = true
        and p.current_streak >= 1
        and (p.last_active_day is null or p.last_active_day <> $1::date)
        and exists (select 1 from push_subscriptions s where s.user_id = p.id)
        and not exists (
          select 1 from user_activity a
           where a.user_id = p.id and a.action = 'streak_reminder_sent'
             and (a.created_at at time zone $2)::date = $1::date
        )`,
    [today, config.streakTimezone],
  );

  let reminded = 0;
  for (const u of eligible.rows) {
    const message: NotificationMessage = {
      title: 'دنت‌کست پلاس',
      body: `استریک ${toFa(u.current_streak)} روزه‌ات را از دست نده — امروز هنوز فعالیتی ثبت نکرده‌ای.`,
      url: '/plus/',
      tag: 'streak_reminder',
    };
    try {
      // Claim first (append the dedup marker), then deliver best-effort.
      await query(
        `insert into user_activity (user_id, action, meta) values ($1, 'streak_reminder_sent', $2::jsonb)`,
        [u.id, JSON.stringify({ day: today })],
      );
      await notifications.send(u.id, message, 'streak');
      reminded += 1;
    } catch {
      /* best-effort: a missing destination / dead device never fails the batch */
    }
  }
  return { reminded };
}
