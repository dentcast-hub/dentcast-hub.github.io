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

/**
 * The same opt-in population, split by WHY each reader will or will not be
 * texted tonight. `smsOptedInCount()` above answers «how many ticked the box»,
 * which is the question the panel used to ask — and it cannot see the one
 * failure that looks identical from the profile: a tick saved beside a master
 * switch that is off.
 *
 * `settings.reminders.streak` and `settings.notify_channels.sms.streak` are two
 * different keys, and the matrix writes only the second. The «استریک» column is
 * a per-channel preference; whether the streak reminder happens AT ALL is the
 * master above it — so `{reminders:{new_content:true}, notify_channels:{sms:
 * {streak:true}}}` renders as a live matrix with an amber tick in it and is
 * excluded by the run's very first condition. Nothing anywhere said so, which
 * is what this breakdown is for.
 *
 * Note the asymmetry it also exposes: of the five services reading
 * `reminders.streak`, this is the only one whose coalesce default is FALSE
 * (review-notify, league-notify, reactivation and premium-prize-notify all
 * treat an absent key as ON). An account that never touched the switch is
 * therefore opted OUT of this one alone.
 */
export interface SmsOptIn {
  /** Ticked, premium, has a phone, master streak switch on — will be texted. */
  ready: number;
  /** Ticked, premium, has a phone — but `reminders.streak` is not true. Silent. */
  blocked_by_master: number;
  /** Ticked and premium, but no phone on the account (a Telegram-first login). */
  no_phone: number;
  /** Ticked at some point, not premium today (a lapsed subscriber keeps the tick). */
  not_premium: number;
}

export async function smsOptInBreakdown(): Promise<SmsOptIn> {
  const row = await one<SmsOptIn>(
    `select
       count(*) filter (where premium and has_phone and master)::int      as ready,
       count(*) filter (where premium and has_phone and not master)::int  as blocked_by_master,
       count(*) filter (where premium and not has_phone)::int             as no_phone,
       count(*) filter (where not premium)::int                           as not_premium
     from (
       select p.tier = 'premium' as premium,
              nullif(p.phone, '') is not null as has_phone,
              coalesce((p.settings->'reminders'->>'streak')::boolean, false) as master
         from profiles p
        where ${SMS_STREAK_WANTED_SQL}
     ) t`,
    [],
  );
  return row ?? { ready: 0, blocked_by_master: 0, no_phone: 0, not_premium: 0 };
}

export interface StreakCheck { ok: boolean; note: string }

export interface StreakSmsDiagnosis {
  user_id: string;
  day: string;
  /** Whether tonight's run would pick this reader up at all. */
  reminder: Record<string, StreakCheck>;
  /** And then whether the SMS lane would carry it. */
  sms: Record<string, StreakCheck>;
  /** The first failing check, in the order the run applies them. */
  verdict: string;
}

/**
 * «چرا برای این خواننده پیامک نرفت؟» — walked one condition at a time, in the
 * order runStreakReminders() applies them, for ONE reader.
 *
 * It lives here rather than in routes/admin.ts on purpose: this service owns
 * the eligibility rules, and a copy of them in the panel would be a second
 * source of truth that drifts the first time one of them changes. Read-only —
 * it sends nothing and writes nothing, so it is safe to run at any hour.
 */
export async function diagnoseStreakSms(
  userId: string,
  now: Date = new Date(),
): Promise<StreakSmsDiagnosis | null> {
  const today = dayInTz(now, config.streakTimezone);
  const tz = config.streakTimezone;
  const p = await one<EligibleRow & { master: boolean; reminded_today: boolean; texted_today: boolean }>(
    `select p.id, p.current_streak, p.last_active_day, p.tier,
            nullif(p.phone, '') as phone, p.display_name,
            ${SMS_STREAK_WANTED_SQL} as sms_wanted,
            coalesce((p.settings->'reminders'->>'streak')::boolean, false) as master,
            exists (select 1 from user_activity a
                     where a.user_id = p.id and a.action = 'streak_reminder_sent'
                       and (a.created_at at time zone $2)::date = $3::date) as reminded_today,
            exists (select 1 from user_activity a
                     where a.user_id = p.id and a.action = 'streak_sms_sent'
                       and (a.created_at at time zone $2)::date = $3::date) as texted_today
       from profiles p where p.id = $1`,
    [userId, tz, today],
  );
  if (!p) return null;

  const channel = await one<{ n: number }>(
    `select (exists (select 1 from push_subscriptions s where s.user_id = p.id)
             or p.telegram_id is not null or p.bale_id is not null)::int as n
       from profiles p where p.id = $1`,
    [userId],
  );
  const alive = await displayStreak(pool, userId, p, today);
  const { smsTemplateId, smsMonthlyCap } = config.streakReminder;
  const sentThisMonth = await smsSentInMonth(today);

  const reminder: Record<string, StreakCheck> = {
    master_switch: {
      ok: p.master,
      note: p.master
        ? 'settings.reminders.streak روشن است.'
        : 'settings.reminders.streak روشن نیست — تیکِ «استریک» در ماتریس فقط کانال را انتخاب می‌کند،'
          + ' کلیدِ اصلیِ «نوتیف‌ها» است که تصمیم می‌گیرد اصلاً یادآوری بفرستیم یا نه.',
    },
    streak_cached: {
      ok: p.current_streak >= 1,
      note: `current_streak = ${p.current_streak}.`,
    },
    not_active_today: {
      ok: p.last_active_day === null || p.last_active_day !== today,
      note: `last_active_day = ${p.last_active_day ?? 'null'} (امروز ${today}).`
        + (p.last_active_day === today ? ' امروز فعالیت ثبت شده — یادآوری لازم نیست.' : ''),
    },
    has_channel: {
      ok: Boolean(channel?.n) || (p.tier === 'premium' && p.phone !== null && p.sms_wanted),
      note: 'مرورگر/تلگرام/بله یا همان لِنِ پیامک.',
    },
    not_reminded_yet: {
      ok: !p.reminded_today,
      note: p.reminded_today ? 'نشانِ streak_reminder_sent برای امروز از قبل هست.' : 'هنوز نشانی برای امروز نیست.',
    },
    streak_alive: {
      ok: alive >= 1,
      note: `displayStreak = ${alive}` + (alive < 1 ? ' — استریک دیگر قابل نجات نیست، پس یادآوری دروغ می‌شد.' : '.'),
    },
  };

  const smsChecks: Record<string, StreakCheck> = {
    premium: { ok: p.tier === 'premium', note: `tier = ${p.tier}.` },
    has_phone: { ok: p.phone !== null, note: p.phone ? 'شماره ثبت شده است.' : 'شماره‌ای روی حساب نیست.' },
    sms_tick: {
      ok: p.sms_wanted,
      note: p.sms_wanted ? 'notify_channels.sms.streak روشن است.' : 'تیکِ پیامک در پروفایل روشن نیست.',
    },
    template: {
      ok: smsTemplateId > 0,
      note: `STREAK_REMINDER_SMS_TEMPLATE_ID = ${smsTemplateId}.`,
    },
    monthly_cap: {
      ok: smsMonthlyCap <= 0 || sentThisMonth < smsMonthlyCap,
      note: smsMonthlyCap > 0 ? `${sentThisMonth} از ${smsMonthlyCap} در این ماهِ جلالی.` : 'بدون سقف ماهانه.',
    },
    not_texted_yet: {
      ok: !p.texted_today,
      note: p.texted_today ? 'نشانِ streak_sms_sent برای امروز از قبل هست.' : 'هنوز پیامکی برای امروز ثبت نشده.',
    },
  };

  const failed = [...Object.entries(reminder), ...Object.entries(smsChecks)].find(([, c]) => !c.ok);
  return {
    user_id: userId,
    day: today,
    reminder,
    sms: smsChecks,
    verdict: failed ? `${failed[0]}: ${failed[1].note}` : 'همه‌ی شرط‌ها برقرار است — اجرای امشب پیامک را می‌فرستد.',
  };
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
  //
  // The action is spelled as a LITERAL here, never bound as `$2`. An action
  // hidden behind a bind parameter is invisible to activity-vocabulary.test.ts's
  // source scan, and that is exactly how `streak_sms_sent` came to be postable
  // by any browser through POST /activity while the guard test stayed green.
  try {
    await query(
      `insert into user_activity (user_id, action, meta)
       values ($1, 'streak_sms_sent', $2::jsonb)`,
      [u.id, JSON.stringify({ day: today })],
    );
  } catch (err) {
    // The never-throw contract above is load-bearing, not politeness: this
    // function is called OUTSIDE the loop's own try, so an error escaping here
    // would abort the batch and silently strand every reader after this one.
    // eslint-disable-next-line no-console
    console.error(`[streak-reminder] sms marker for ${u.id} failed: ${(err as Error).message}`);
    return false;
  }
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
