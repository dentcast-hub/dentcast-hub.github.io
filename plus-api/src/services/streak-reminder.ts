import { config } from '../config.js';
import { one, pool, query } from '../db.js';
import { dayInTz } from './time.js';
import { dayToJalali, jalaliToDay } from './jalali.js';
import { displayStreak } from './streak.js';
import { sendCapped } from './notify-policy.js';
import { SMS_STREAK_WANTED_SQL } from './notify-channels.js';
import { sms } from '../providers/registry.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * Daily streak reminder (settings.reminders.streak). Nudges users who:
 *   (a) opted into the reminder,
 *   (b) have a streak that is STILL SAVABLE — last active yesterday, or the gap
 *       is bridgeable by their held shields (the cache resets lazily, so
 *       current_streak >= 1 alone would nag users whose run is already dead),
 *   (c) have NOT logged a qualifying action today (last_active_day != today, Tehran), and
 *   (d) have SOME delivery channel — a live push subscription, a linked Telegram
 *       / Bale (chat_id), or the premium SMS lane below. Without this pre-filter
 *       we'd nudge users we can't reach; the sender (Layer 2) still skips any
 *       channel a user lacks.
 * It runs in the evening so there is still time to act before the Tehran-midnight
 * day boundary flips the streak.
 *
 * Deduped per Tehran day via an appended `streak_reminder_sent` marker — a
 * NON-qualifying, NON-scoring action, so it never touches streak or score. The
 * marker is claimed BEFORE delivery so an overlapping run can't double-send.
 *
 * THE SMS LANE (founder decision, 2026-09-16). A PREMIUM reader who turned
 * «پیامک» on in the profile's «از کجا برسد» matrix gets this same reminder as a
 * text message, through the registered SMS.ir template in
 * config.streakReminder. Three things about it are decided, not incidental:
 *
 *   - It is the ONLY notification kind that goes by SMS. The new-article notice
 *     was considered and refused: its value is the Pulse sentence, which no
 *     registered template can carry, and its cost scales with how often the
 *     site publishes — three articles a day is three texts a day per reader.
 *     The streak reminder scales with INACTIVITY instead: one a day at most,
 *     and a reader who kept their streak gets none. It is the one channel that
 *     switches itself off when it works.
 *
 *   - It goes OUTSIDE the daily cap and regardless of the other channels
 *     (founder: «حتی اگر بقیه اطلاع‌رسانی‌ها رفتن»). sendCapped may have
 *     swallowed the push because a busy day already spent the reader's budget;
 *     the text still goes. Same reasoning and same shape as the renewal SMS in
 *     subscription-reminder.ts: the reader asked for this by name, on a paid
 *     plan, and the cap exists to stop us pestering people who did not.
 *
 *   - It is still once per Tehran day, because it only ever follows a claimed
 *     `streak_reminder_sent` marker; its own `streak_sms_sent` marker is what
 *     the monthly ceiling and the admin panel count.
 */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number): string => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

const SMS_MARKER = 'streak_sms_sent';

interface EligibleRow {
  id: string;
  current_streak: number;
  last_active_day: string | null;
  tier: string;
  phone: string | null;
  display_name: string;
  sms_wanted: boolean;
}

/** First Tehran day of the Jalali month `day` falls in — the SMS ceiling's window. */
function jalaliMonthStart(day: string): string {
  const { jy, jm } = dayToJalali(day);
  return jalaliToDay(jy, jm, 1) ?? day;
}

/** Streak texts sent so far in the Jalali month containing `day`, all readers. */
export async function smsSentInMonth(day: string): Promise<number> {
  const row = await one<{ n: number }>(
    `select count(*)::int as n from user_activity
      where action = $1 and (created_at at time zone $2)::date >= $3::date`,
    [SMS_MARKER, config.streakTimezone, jalaliMonthStart(day)],
  );
  return row?.n ?? 0;
}

/** Premium readers with a phone who turned the streak SMS on — the panel's «waiting» count. */
export async function smsOptedInCount(): Promise<number> {
  const row = await one<{ n: number }>(
    `select count(*)::int as n from profiles p
      where p.tier = 'premium' and nullif(p.phone, '') is not null and ${SMS_STREAK_WANTED_SQL}`,
    [],
  );
  return row?.n ?? 0;
}

function smsEligible(u: EligibleRow): boolean {
  return u.tier === 'premium' && u.phone !== null && u.sms_wanted;
}

/**
 * The text itself. Returns true when it was handed to the provider. Never
 * throws: a text that does not go out is bad, a reminder batch that stops
 * halfway because of it is worse (the renewal SMS makes the same call).
 */
async function sendStreakSms(u: EligibleRow, today: string): Promise<boolean> {
  const { smsTemplateId, smsMonthlyCap, smsNameParam, smsDaysParam } = config.streakReminder;
  if (smsTemplateId <= 0) return false;
  if (smsMonthlyCap > 0 && (await smsSentInMonth(today)) >= smsMonthlyCap) {
    // eslint-disable-next-line no-console
    console.warn(`[streak-reminder] sms ceiling reached (${smsMonthlyCap}/month) — text to ${u.id} skipped`);
    return false;
  }
  // Claim first, then deliver: the marker is the ceiling's counter and the
  // panel's report, and an overlapping run must not be able to text twice.
  await query(
    `insert into user_activity (user_id, action, meta) values ($1, $2, $3::jsonb)`,
    [u.id, SMS_MARKER, JSON.stringify({ day: today })],
  );
  try {
    await sms.sendTemplate(u.phone as string, smsTemplateId, [
      { name: smsNameParam, value: u.display_name },
      { name: smsDaysParam, value: toFa(u.current_streak) },
    ]);
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[streak-reminder] sms to ${u.phone} failed: ${(err as Error).message}`);
    return false;
  }
}

export async function runStreakReminders(now: Date = new Date()): Promise<{ reminded: number; sms: number }> {
  const today = dayInTz(now, config.streakTimezone);
  const eligible = await query<EligibleRow>(
    `select p.id, p.current_streak, p.last_active_day, p.tier,
            nullif(p.phone, '') as phone, p.display_name,
            ${SMS_STREAK_WANTED_SQL} as sms_wanted
       from profiles p
      where coalesce((p.settings->'reminders'->>'streak')::boolean, false) = true
        and p.current_streak >= 1
        and (p.last_active_day is null or p.last_active_day <> $1::date)
        and (
          exists (select 1 from push_subscriptions s where s.user_id = p.id)
          or p.telegram_id is not null
          or p.bale_id is not null
          or (p.tier = 'premium' and nullif(p.phone, '') is not null and ${SMS_STREAK_WANTED_SQL})
        )
        and not exists (
          select 1 from user_activity a
           where a.user_id = p.id and a.action = 'streak_reminder_sent'
             and (a.created_at at time zone $2)::date = $1::date
        )`,
    [today, config.streakTimezone],
  );

  let reminded = 0;
  let texted = 0;
  for (const u of eligible.rows) {
    // Skip runs that are already dead: nothing left to protect, and the cached
    // number would make the nudge a lie ("don't lose your 10-day streak").
    const alive = await displayStreak(pool, u.id, u, today);
    if (alive < 1) continue;
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
      await sendCapped(u.id, message, 'streak', now);
      reminded += 1;
    } catch {
      /* best-effort: a missing destination / dead device never fails the batch */
    }
    // Whatever sendCapped decided — sent, or swallowed by the day's budget —
    // the text goes to a premium reader who asked for it. Outside the try
    // above on purpose: it has its own never-throw contract.
    if (smsEligible(u) && (await sendStreakSms(u, today))) texted += 1;
  }
  return { reminded, sms: texted };
}
