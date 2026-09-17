import { config } from '../config.js';
import { query, one } from '../db.js';
import { sendCapped } from './notify-policy.js';
import { dayInTz, dayDiff } from './time.js';
import { sms } from '../providers/registry.js';
import type { NotificationKind } from '../providers/notifications/types.js';
import type { TemplateParam } from '../providers/sms/types.js';

/**
 * "Your subscription is ending" — the messages the whole payment system exists
 * to make unnecessary to chase.
 *
 * TWO BEFORE, ONE AFTER. One three days out, while there is still time to act
 * without any interruption to their reading; one on the last day itself; and
 * one `daysAfter` days past it.
 *
 * THAT THIRD MESSAGE WAS MISSING UNTIL 2026-09-17, and this comment used to
 * argue against it: by then the news is something they will see the moment they
 * open the site, and sending a push about a thing the user can no longer
 * prevent is how a reminder becomes nagging. Both halves turned out to be
 * wrong, in the same place. «They will see it when they open the site» assumes
 * they open the site, and the reader this is for is precisely the one who
 * stopped — the in-site banner is a message delivered only to people who did
 * not need it. And «can no longer prevent» is true of the lapse and false of
 * the thing that matters: the subscription is a purchase, not an event, and it
 * is available again at any hour. Three days after the fact this is not a
 * reminder at all; it is the offer, made once more, to somebody who never
 * decided against it.
 *
 * 70 signups, 50 in month two (founder, 2026-09-17). Some of those twenty chose
 * to go and some of them forgot, and until this message existed the site
 * treated both the same way — by saying nothing.
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

export type ReminderKind = 'expiry_soon' | 'expiry_today' | 'lapsed';

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
  /**
   * Highlights + notes still sitting in the account. Only the lapsed message
   * reads it, and the reason it is in the message at all is that «your
   * subscription ended» is news about us and «your 132 highlights are still
   * there» is news about them — the second is the one with a reason to come
   * back inside it. It is also the honest thing to say: none of it was deleted.
   */
  saved: number;
  /**
   * They have an unreviewed واریز/کارت‌هدیه claim in the founder's queue —
   * they HAVE renewed and are waiting on a person. «اشتراکت تمام شد، دوباره
   * بخر» is the worst message the site could send them, so the lapsed pass
   * skips them entirely (they are not in the pre-expiry passes' way: those say
   * something still true while a claim is pending).
   */
  claim_pending: boolean;
}

function message(kind: ReminderKind, row: DueRow, daysBefore: number) {
  const day = JALALI.format(row.expires_at);
  if (kind === 'lapsed') {
    // What it does NOT say is the design. Not «تمام شد» as a headline — they
    // know, and an obituary for a thing they are being asked to buy again is a
    // strange way to ask. Not a discount either: this goes to everybody who
    // lapsed, including the ones who were three days late, and a standing ٪N
    // for being late teaches every subscriber to be late. The offer is exactly
    // the offer; what changes is that somebody said it out loud.
    return {
      title: 'هایلایت‌ها و یادداشت‌هایت همان‌جا هستند',
      body: row.saved > 0
        ? `${toFa(row.saved)} هایلایت و یادداشتِ شما دست‌نخورده باقی مانده — هیچ‌کدام پاک نمی‌شود. اشتراک پریمیوم از ${day} تمام شده؛ هر وقت خواستی از همان‌جا ادامه بده.`
        : `اشتراک پریمیوم شما از ${day} تمام شده. هر چه ذخیره کرده‌ای سرِ جایش است و هر وقت بخواهی از همان‌جا ادامه می‌دهی.`,
      url: '/plus/pricing.html?from=winback',
      tag: 'subscription_lapsed',
    };
  }
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
            (select count(*) from highlights h where h.user_id = s.user_id)
              + (select count(*) from article_notes n
                  where n.user_id = s.user_id and coalesce(n.note, '') <> '')
              as saved,
            exists (select 1 from gift_redemptions g
                     where g.user_id = s.user_id and g.status = 'pending')
              as claim_pending
       from subscriptions s
       join profiles p on p.id = s.user_id
      where s.expires_at is not null
        and ((s.expires_at at time zone $1)::date - $2::date) = $3`,
    [config.streakTimezone, today, offset],
  );
  // `count(*)` arrives as a bigint, i.e. a string on this driver.
  return res.rows.map((r) => ({ ...r, saved: Number(r.saved) }));
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
 * This is the one message worth paying a few toman of SMS for regardless of
 * what else was sent: every other notification the site sends is a nudge,
 * this one is the difference between a renewal and a lapse, and a push or
 * Telegram message is silent proof of nothing — it can be missed, muted, or
 * sitting unread in an app the reader hasn't opened. Founder decision
 * (2026-09-06): unlike every other channel-fallback in this codebase, SMS
 * here is NOT gated on already having Telegram/Bale/push — it goes out
 * whenever there is a phone number to send it to.
 *
 * The phone test still matters on its own: a Telegram-first account has no
 * phone at all (migration 0004), and `nullif` above folds the empty string in
 * with it, so the provider is never handed a blank number to reject.
 */
function needsSms(row: DueRow): boolean {
  return row.phone !== null;
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

/**
 * Which inbox/notification kind a reminder travels as. The two warnings are
 * `subscription_expiry`; the win-back is its own kind so the inbox can label it
 * separately and so a later decision about one cannot silently move the other.
 */
function noticeKind(kind: ReminderKind): NotificationKind {
  return kind === 'lapsed' ? 'subscription_lapsed' : 'subscription_expiry';
}

/**
 * The registered template and its parameters, or null when this message has no
 * paid channel today.
 *
 * TWO TEMPLATES, NOT ONE. An Iranian service line sends templates registered in
 * advance, so the tense is baked into the text at SMS.ir and 530460's «N روز تا
 * پایان اشتراک» cannot be reused for a subscription that has already ended.
 * Until the second one is approved its id is 0 and the win-back simply travels
 * by the free channels — the same shape the streak SMS uses, and the reason
 * this can ship before the registration comes back.
 *
 * THE WIN-BACK SMS IS NOT SENT TO AN EMPTY ACCOUNT, and that is not only about
 * the `saved` parameter having nothing honest to put in it. A reader who
 * subscribed and saved nothing at all is the one who decided against this, not
 * the one who forgot — the earlier passes already reached them twice, and a
 * paid message is the wrong thing to spend on the least likely renewal. They
 * still get the inbox row and the messenger push.
 */
function smsFor(
  row: DueRow, kind: ReminderKind, daysBefore: number,
): { templateId: number; params: TemplateParam[] } | null {
  const c = config.subscriptionReminder;
  if (kind === 'lapsed') {
    if (c.winbackSmsTemplateId <= 0 || row.saved <= 0) return null;
    return {
      templateId: c.winbackSmsTemplateId,
      params: [
        { name: c.smsNameParam, value: row.display_name },
        { name: c.winbackSmsSavedParam, value: toFa(row.saved) },
      ],
    };
  }
  if (c.smsTemplateId <= 0) return null;
  return {
    templateId: c.smsTemplateId,
    params: [
      { name: c.smsNameParam, value: row.display_name },
      { name: c.smsDaysParam, value: daysLabel(kind, daysBefore) },
    ],
  };
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
  await sendCapped(row.user_id, msg, noticeKind(kind), now);

  const text = smsFor(row, kind, daysBefore);
  if (needsSms(row) && text) {
    // Never fails the run: an SMS that does not go out is bad, a reminder batch
    // that stops halfway because of it is worse.
    await sms.sendTemplate(row.phone as string, text.templateId, text.params).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error(`[subscription-reminder] sms to ${row.phone} failed: ${(err as Error).message}`);
    });
  }
  return true;
}

export async function runSubscriptionReminders(now: Date = new Date()): Promise<{
  soon: number; today: number; lapsed: number;
}> {
  const { daysBefore, daysAfter } = config.subscriptionReminder;
  const todayStr = dayInTz(now, config.streakTimezone);
  const counts = { soon: 0, today: 0, lapsed: 0 };

  // A day OFFSET each, all three read by the same query: +daysBefore for the
  // early warning, 0 for the last day, and -daysAfter for the win-back, whose
  // expiry is that many days in the past. `daysAfter: 0` drops the third pass
  // rather than colliding with the second.
  const passes: Array<[number, ReminderKind]> = [
    [daysBefore, 'expiry_soon'],
    [0, 'expiry_today'],
  ];
  if (daysAfter > 0) passes.push([-daysAfter, 'lapsed']);

  for (const [offset, kind] of passes) {
    for (const row of await due(offset, todayStr)) {
      // Renewing needs no cancellation here either: activateMonths restarts a
      // lapsed subscription from today, so a reader who came back yesterday has
      // an expiry months away and never matches this pass at all.
      if (kind === 'lapsed' && row.claim_pending) continue;
      const expiresOn = dayInTz(row.expires_at, config.streakTimezone);
      if (await alreadySent(row.user_id, kind, expiresOn)) continue;
      await sendOne(row, kind, expiresOn, now, daysBefore);
      if (kind === 'expiry_soon') counts.soon += 1;
      else if (kind === 'expiry_today') counts.today += 1;
      else counts.lapsed += 1;
    }
  }

  return counts;
}

/** Exported for the banner test's sake: how many whole Tehran days are left. */
export function daysLeftFrom(expiresAt: Date, now: Date = new Date()): number {
  return dayDiff(
    dayInTz(expiresAt, config.streakTimezone),
    dayInTz(now, config.streakTimezone),
  );
}
