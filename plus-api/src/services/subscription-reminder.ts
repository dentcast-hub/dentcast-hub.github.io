import { config } from '../config.js';
import { query, one } from '../db.js';
import { sendCapped } from './notify-policy.js';
import { dayInTz, dayDiff } from './time.js';
import { sms } from '../providers/registry.js';

/**
 * "Your subscription is ending" — the two messages the whole payment system
 * exists to make unnecessary to chase.
 *
 * TWO, AND ONLY TWO. One three days out, while there is still time to act
 * without any interruption to their reading, and one on the last day itself. A
 * third ("it has now ended") is deliberately NOT pushed: by then the news is
 * something they will see the moment they open the site, and the in-site banner
 * says it — with the part that actually matters, that none of their highlights
 * or notes have gone anywhere. Sending a push about a thing the user can no
 * longer prevent is how a reminder becomes nagging.
 *
 * WHAT "THE LAST DAY" MEANS. Premium is settled at the Tehran day boundary by
 * the nightly sweep, so a subscription whose timestamp falls at 14:00 still
 * buys the whole of that day. The day-of message therefore says «امروز آخرین
 * روز», which is both true and still actionable — not «تمام شد», which would be
 * a lie told several hours early.
 *
 * "IF THEY HAVEN'T RENEWED" NEEDS NO CHECK. Each run re-reads `expires_at`, so
 * a renewal moves the subscription out of the day-of cohort before the second
 * message is ever considered. There is nothing to cancel and no state to keep in
 * step — the second warning is skipped by the same query that found the first.
 *
 * IDEMPOTENCY IS KEYED ON THE EXPIRY DATE, not on a flag. A claim is
 * (user, kind, expires_on) in `user_activity`, which gives the re-arm for free:
 * the moment someone renews, `expires_on` moves to a date nothing has been said
 * about, so next cycle's warnings fire without a single reset. A flag column
 * would have to be cleared by the renewal path, and the day it was forgotten
 * would be the day nobody was ever warned again.
 */

const ACTION = 'subscription_reminder_sent';

export type ReminderKind = 'expiry_soon' | 'expiry_today';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number | string): string => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

const JALALI = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  timeZone: config.streakTimezone, year: 'numeric', month: 'long', day: 'numeric',
});

interface DueRow {
  user_id: string;
  phone: string | null;
  display_name: string;
  expires_at: Date;
  telegram_id: number | null;
  bale_id: number | null;
  has_push: boolean;
}

function message(kind: ReminderKind, row: DueRow, daysBefore: number) {
  const day = JALALI.format(row.expires_at);
  if (kind === 'expiry_today') {
    return {
      title: 'امروز آخرین روز اشتراک شماست',
      body: `اشتراک پریمیوم شما تا پایان امروز (${day}) فعال است. برای ادامه، از همین‌جا تمدید کنید.`,
      url: '/plus/pricing.html?from=reminder-today',
      tag: 'subscription_expiry',
    };
  }
  return {
    title: `${toFa(daysBefore)} روز تا پایان اشتراک`,
    body: `اشتراک پریمیوم شما تا پایان روز ${day} فعال است. تمدیدِ زودهنگام روزهای باقی‌مانده را نمی‌سوزاند — به انتهای همین اشتراک اضافه می‌شود.`,
    url: '/plus/pricing.html?from=reminder-soon',
    tag: 'subscription_expiry',
  };
}

/**
 * Subscriptions whose LAST DAY is exactly `offset` days from today, in Tehran
 * calendar days rather than elapsed hours — the same unit the sweep and
 * `days_left` use, so all three agree about which day a subscription ends on.
 *
 * Founders are excluded by the date test itself (their expires_at is NULL), not
 * by a special case.
 */
async function due(offset: number, today: string): Promise<DueRow[]> {
  const res = await query<DueRow>(
    `select s.user_id, nullif(p.phone, '') as phone, p.display_name, s.expires_at,
            p.telegram_id, p.bale_id,
            exists (select 1 from push_subscriptions ps where ps.user_id = s.user_id) as has_push
       from subscriptions s
       join profiles p on p.id = s.user_id
      where s.expires_at is not null
        and ((s.expires_at at time zone $1)::date - $2::date) = $3`,
    [config.streakTimezone, today, offset],
  );
  return res.rows;
}

async function alreadySent(userId: string, kind: ReminderKind, expiresOn: string): Promise<boolean> {
  const row = await one<{ id: number }>(
    `select id from user_activity
      where user_id = $1 and action = $2
        and meta->>'kind' = $3 and meta->>'expires_on' = $4
      limit 1`,
    [userId, ACTION, kind, expiresOn],
  );
  return row !== null;
}

/**
 * Anyone with no messenger and no browser push has no way of hearing this at
 * all — and this is the one message worth paying a few toman of SMS for. Every
 * other notification the site sends is a nudge; this one is the difference
 * between a renewal and a lapse.
 *
 * SMS is the EXTRA channel for the people it can reach, never the default one:
 * a reader with Telegram, Bale or browser push already heard it for free, and
 * texting them too would be paying to say the same thing twice. The phone test
 * is not redundant with the rest — a Telegram-first account has no phone at all
 * (migration 0004), and `nullif` above folds the empty string in with it, so the
 * provider is never handed a blank number to reject.
 */
function needsSms(row: DueRow): boolean {
  return row.phone !== null && row.telegram_id === null && row.bale_id === null && !row.has_push;
}

/**
 * How many days the SMS says are left — the ONE number in the registered
 * template, so it has to mean the same thing the message around it does.
 *
 * On the last day that number is 1, not 0. The subscription is settled at the
 * Tehran midnight boundary, so at 10:00 the whole day is still theirs and «فقط
 * ۱ روز باقی مونده» is both true and still actionable; «۰ روز» would describe
 * something already lost and turn the one message with a renewal on the other
 * side of it into an obituary.
 */
function daysLabel(kind: ReminderKind, daysBefore: number): string {
  return toFa(kind === 'expiry_today' ? 1 : daysBefore);
}

async function sendOne(
  row: DueRow, kind: ReminderKind, expiresOn: string, now: Date, daysBefore: number,
): Promise<boolean> {
  // Claim BEFORE delivering, exactly as the league and prize notifiers do: an
  // overlapping run must not be able to send the same warning twice, and a
  // failed delivery is not worth a retry that risks a double.
  await query(
    'insert into user_activity (user_id, action, meta) values ($1, $2, $3)',
    [row.user_id, ACTION, JSON.stringify({ kind, expires_on: expiresOn })],
  );

  const msg = message(kind, row, daysBefore);
  await sendCapped(row.user_id, msg, 'subscription_expiry', now);

  if (needsSms(row) && config.subscriptionReminder.smsTemplateId > 0) {
    // Never fails the run: an SMS that does not go out is bad, a reminder batch
    // that stops halfway because of it is worse.
    await sms.sendTemplate(row.phone as string, config.subscriptionReminder.smsTemplateId, [
      { name: config.subscriptionReminder.smsNameParam, value: row.display_name },
      { name: config.subscriptionReminder.smsDaysParam, value: daysLabel(kind, daysBefore) },
    ]).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error(`[subscription-reminder] sms to ${row.phone} failed: ${(err as Error).message}`);
    });
  }
  return true;
}

export async function runSubscriptionReminders(now: Date = new Date()): Promise<{
  soon: number; today: number;
}> {
  const daysBefore = config.subscriptionReminder.daysBefore;
  const todayStr = dayInTz(now, config.streakTimezone);
  let soon = 0;
  let today = 0;

  for (const [offset, kind] of [[daysBefore, 'expiry_soon'], [0, 'expiry_today']] as const) {
    for (const row of await due(offset, todayStr)) {
      const expiresOn = dayInTz(row.expires_at, config.streakTimezone);
      if (await alreadySent(row.user_id, kind, expiresOn)) continue;
      await sendOne(row, kind, expiresOn, now, daysBefore);
      if (kind === 'expiry_soon') soon += 1; else today += 1;
    }
  }

  return { soon, today };
}

/** Exported for the banner test's sake: how many whole Tehran days are left. */
export function daysLeftFrom(expiresAt: Date, now: Date = new Date()): number {
  return dayDiff(
    dayInTz(expiresAt, config.streakTimezone),
    dayInTz(now, config.streakTimezone),
  );
}
