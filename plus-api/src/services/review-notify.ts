import { config } from '../config.js';
import { query } from '../db.js';
import { dayInTz } from './time.js';
import { sendCapped } from './notify-policy.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * "Your review cards are due" — PREMIUM only, and it stays that way even though
 * the review engine itself no longer is.
 *
 * A free reader now gets the first few due cards every day (plus/quota.json), so
 * they DO have a queue — but a notification is a claim on someone's attention
 * that we make on our own initiative, and «۳ کارت آماده است» is a poor thing to
 * put on a lock screen when the answer to using them up is a purchase. The
 * daily allowance is discovered by opening the app; the reminder is for people
 * whose whole queue is actually waiting for them. The `tier = 'premium'` filter
 * in the query below is the enforcement, not this comment.
 *
 * Unlike the league outcome this has no instantaneous event: a card becomes due
 * by the clock passing next_review_at, which for a box-5 card is 03:00 on some
 * Tuesday. So it runs once a day at reviewReminder.hour (09:00 Tehran default) —
 * the same treatment the streak reminder and the reactivation nudge get, and
 * deliberately not their 20:00 slot, which is already crowded.
 *
 * Dedup is per Tehran day through notification_log (kind='review'), which is the
 * same row the daily cap counts — one write, both guarantees. That also means a
 * user who has already hit the cap simply does not get it; there is no queue.
 */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number): string => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

export async function runReviewReminders(now: Date = new Date()): Promise<{ reminded: number }> {
  const today = dayInTz(now, config.streakTimezone);

  const eligible = await query<{ id: string; due: number }>(
    `select p.id, count(*)::int as due
       from profiles p
       join card_state cs on cs.user_id = p.id
        and (cs.next_review_at is null or cs.next_review_at <= $1)
      where p.tier = 'premium'
        -- Opt-OUT, reusing the switch the profile page already writes.
        and coalesce((p.settings->'reminders'->>'streak')::boolean, true) = true
        and (
          exists (select 1 from push_subscriptions s where s.user_id = p.id)
          or p.telegram_id is not null
          or p.bale_id is not null
        )
        and not exists (
          select 1 from notification_log l
           where l.user_id = p.id and l.kind = 'review' and l.day = $2::date
        )
      group by p.id`,
    [now.toISOString(), today],
  );

  let reminded = 0;
  for (const u of eligible.rows) {
    const message: NotificationMessage = {
      title: 'کارت‌های مرورت آماده‌اند',
      body: u.due === 1
        ? 'یک کارت به فاصله‌ی درستش رسیده — چند ثانیه وقت می‌برد.'
        : `${toFa(u.due)} کارت به فاصله‌ی درستشان رسیده‌اند — چند دقیقه مرور، و در حافظه می‌مانند.`,
      url: '/plus/cards.html',
      tag: 'review_due',
    };
    if (await sendCapped(u.id, message, 'review', now)) reminded += 1;
  }

  return { reminded };
}
