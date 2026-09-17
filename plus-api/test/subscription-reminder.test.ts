import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { resetDb } from './helpers.js';
import { pool, closePool } from '../src/db.js';
import { config } from '../src/config.js';
import { runSubscriptionReminders, runWinbackReminders } from '../src/services/subscription-reminder.js';
import { activateMonths, grantLifetime } from '../src/services/subscription.js';
import { notifications, sms } from '../src/providers/registry.js';
import { msUntilNextRun } from '../src/scheduler.js';
import type { NotificationMessage } from '../src/providers/notifications/types.js';
import type { TemplateParam } from '../src/providers/sms/types.js';

/**
 * The renewal reminders (level 3.2): one three days out, one on the last day.
 *
 * The behaviour worth protecting is not that a message goes out — it is that it
 * goes out ONCE per expiry date, re-arms by itself when somebody renews, and is
 * never dropped by the daily notification cap.
 */

let seq = 0;
let sent: Array<{ userId: string; kind: string; msg: NotificationMessage }> = [];
let texted: Array<{ phone: string; templateId: number; params: TemplateParam[] }> = [];

/**
 * The SHIPPED template ids, captured at import — beforeEach below replaces both
 * with throwaways so the sends can be asserted without depending on the real
 * numbers, and by then these are gone.
 */
const SHIPPED = {
  reminder: config.subscriptionReminder.smsTemplateId,
  winback: config.subscriptionReminder.winbackSmsTemplateId,
};

/** 10:00 Tehran on the day the reminder job runs. */
const RUN = (day: string) => new Date(`${day}T10:00:00+03:30`);

async function subscriber(
  opts: { expiresOn: string; messenger?: boolean; saved?: number; claimPending?: boolean },
): Promise<string> {
  seq += 1;
  const phone = `0912440${String(seq).padStart(4, '0')}`;
  const r = await pool.query<{ id: string }>(
    'insert into profiles (phone, display_name) values ($1, $2) returning id',
    [phone, `کاربر ${seq}`],
  );
  const id = r.rows[0].id;
  await activateMonths(id, 1, { source: 'payment' });
  // Place the expiry on an exact Tehran day, mid-afternoon — the awkward case:
  // it runs out at 14:00 but the whole day is still theirs.
  await pool.query('update subscriptions set expires_at = $2 where user_id = $1',
    [id, `${opts.expiresOn}T14:00:00+03:30`]);
  if (opts.messenger) {
    await pool.query('update profiles set telegram_id = $2 where id = $1', [id, 900000 + seq]);
  }
  for (let i = 0; i < (opts.saved ?? 0); i += 1) {
    await pool.query(
      `insert into highlights_all (user_id, content_id, exact, color)
       values ($1, $2, $3, 'yellow')`,
      [id, `insight/insight-${i + 1}`, `متنِ هایلایت ${i + 1}`],
    );
  }
  if (opts.claimPending) {
    await pool.query(
      `insert into gift_redemptions (user_id, code, reference, kind, months, status)
       values ($1, $2, $3, 'bank_transfer', 6, 'pending')`,
      [id, `CODE-${seq}`, `G-TST-${String(seq).padStart(3, '0')}`],
    );
  }
  return id;
}

const titles = () => sent.map((s) => s.msg.title);

beforeEach(async () => {
  await resetDb();
  seq = 0;
  sent = [];
  texted = [];
  config.subscriptionReminder.smsTemplateId = 77;
  config.subscriptionReminder.daysBefore = 3;
  config.subscriptionReminder.daysAfter = 3;
  config.subscriptionReminder.winbackHour = 21;
  config.subscriptionReminder.winbackMinute = 30;
  config.subscriptionReminder.winbackSmsTemplateId = 88;
  vi.spyOn(notifications, 'send').mockImplementation(async (userId, msg, kind) => {
    sent.push({ userId, kind, msg: msg as NotificationMessage });
  });
  vi.spyOn(sms, 'sendTemplate').mockImplementation(async (phone, templateId, params) => {
    texted.push({ phone, templateId, params });
  });
});
afterAll(closePool);

describe('runSubscriptionReminders', () => {
  it('warns three days before the last day', async () => {
    await subscriber({ expiresOn: '2026-09-10', messenger: true });

    const r = await runSubscriptionReminders(RUN('2026-09-07'));

    expect(r).toEqual({ soon: 1, today: 0 });
    expect(titles()[0]).toContain('۳ روز');
    // It sends people somewhere they can act, not to a dead end.
    expect(sent[0].msg.url).toContain('/plus/pricing.html');
    expect(sent[0].kind).toBe('subscription_expiry');
  });

  it('says "today is the last day" on the day itself, not "it has ended"', async () => {
    await subscriber({ expiresOn: '2026-09-10', messenger: true });

    const r = await runSubscriptionReminders(RUN('2026-09-10'));

    expect(r).toEqual({ soon: 0, today: 1 });
    // The sweep settles premium at midnight, so at 10:00 on the last day the
    // subscription is very much alive — saying otherwise would be a lie told
    // fourteen hours early.
    expect(titles()[0]).toContain('آخرین روز');
    expect(titles()[0]).not.toContain('تمام شد');
  });

  it('stays quiet on every other day', async () => {
    await subscriber({ expiresOn: '2026-09-10', messenger: true });

    for (const day of ['2026-09-05', '2026-09-06', '2026-09-08', '2026-09-09']) {
      expect(await runSubscriptionReminders(RUN(day))).toEqual({ soon: 0, today: 0 });
    }
    expect(sent).toHaveLength(0);
  });

  it('says each thing once, however many times the job runs', async () => {
    await subscriber({ expiresOn: '2026-09-10', messenger: true });

    await runSubscriptionReminders(RUN('2026-09-07'));
    await runSubscriptionReminders(RUN('2026-09-07'));
    await runSubscriptionReminders(RUN('2026-09-07'));

    expect(sent).toHaveLength(1);
  });

  it('re-arms by itself when somebody renews — no flag to reset', async () => {
    const id = await subscriber({ expiresOn: '2026-09-10', messenger: true });
    await runSubscriptionReminders(RUN('2026-09-07'));
    expect(sent).toHaveLength(1);

    // They renew. The claim is keyed on the expiry DATE, so the new one has
    // never been warned about and the next cycle fires with nothing reset.
    await pool.query(
      "update subscriptions set expires_at = '2026-12-10T14:00:00+03:30' where user_id = $1", [id]);

    await runSubscriptionReminders(RUN('2026-12-07'));
    expect(sent).toHaveLength(2);
  });

  it('never warns a founder — there is no date to run out', async () => {
    const r = await pool.query<{ id: string }>(
      'insert into profiles (phone, display_name) values ($1, $2) returning id',
      ['09124409999', 'بنیان‌گذار'],
    );
    await grantLifetime(r.rows[0].id, { source: 'admin' });

    for (const day of ['2026-09-07', '2026-09-10', '2027-01-01']) {
      expect(await runSubscriptionReminders(RUN(day))).toEqual({ soon: 0, today: 0 });
    }
  });

  it('is exempt from the daily notification cap', async () => {
    const id = await subscriber({ expiresOn: '2026-09-10', messenger: true });
    // Fill the user's whole day budget with other notifications first.
    for (let i = 0; i < config.notify.maxPerDay + 2; i += 1) {
      await pool.query(
        "insert into notification_log (user_id, kind, day) values ($1, 'streak', $2::date)",
        [id, '2026-09-07'],
      );
    }

    await runSubscriptionReminders(RUN('2026-09-07'));

    // The one message with a subscription on the other side of it must not be
    // the one that gets dropped.
    expect(sent).toHaveLength(1);
  });

  it('texts everyone with a phone, whether or not they have another channel', async () => {
    // Founder decision (2026-09-06): a push or Telegram message is silent
    // proof of nothing, so SMS is no longer gated on already having one — it
    // goes out to anyone with a phone number.
    await subscriber({ expiresOn: '2026-09-10', messenger: true }); // has Telegram too
    await subscriber({ expiresOn: '2026-09-10' });                  // has nothing else

    await runSubscriptionReminders(RUN('2026-09-07'));

    const phones = (await pool.query<{ phone: string }>(
      'select phone from profiles order by created_at')).rows.map((r) => r.phone);
    expect(sent).toHaveLength(2);
    expect(texted.map((t) => t.phone).sort()).toEqual(phones.sort());
    expect(texted[0].templateId).toBe(77);
  });

  /**
   * SMS.ir refuses to register a template with no variable in it, and refuses to
   * SEND one whose parameters don't match the registered names. Both halves of
   * that contract are invisible from inside the service, so they are pinned here:
   * the shape below is template 530460 and nothing else.
   */
  it('fills the registered template by name — «#name#» and «#days#»', async () => {
    await subscriber({ expiresOn: '2026-09-10' });

    await runSubscriptionReminders(RUN('2026-09-07'));

    expect(texted[0].params).toEqual([
      { name: 'name', value: 'کاربر 1' },
      { name: 'days', value: '۳' },
    ]);
  });

  it('says ONE day left on the last day, never zero', async () => {
    await subscriber({ expiresOn: '2026-09-10' });

    await runSubscriptionReminders(RUN('2026-09-10'));

    // The sweep settles premium at midnight, so the whole of the last day is
    // still theirs — and «۰ روز» would be describing something already lost.
    expect(texted[0].params[1]).toEqual({ name: 'days', value: '۱' });
  });

  it('never texts a phone-less account', async () => {
    // `profiles.phone` is nullable since migration 0004 (Telegram-first signup).
    // Deliberately given NO messenger either, so the phone guard is the only
    // thing that can stop this — handing the provider a null number is a 400
    // from SMS.ir, not a quietly skipped message.
    const r = await pool.query<{ id: string }>(
      "insert into profiles (phone, display_name) values (null, 'ناشناس') returning id",
    );
    await activateMonths(r.rows[0].id, 1, { source: 'payment' });
    await pool.query("update subscriptions set expires_at = '2026-09-10T14:00:00+03:30' where user_id = $1",
      [r.rows[0].id]);

    await runSubscriptionReminders(RUN('2026-09-07'));

    expect(sent).toHaveLength(1);
    expect(texted).toHaveLength(0);
  });

  it('skips SMS entirely until a template is registered', async () => {
    config.subscriptionReminder.smsTemplateId = 0;
    await subscriber({ expiresOn: '2026-09-10' });

    await runSubscriptionReminders(RUN('2026-09-07'));

    // The in-app and messenger paths still work; only the paid channel waits.
    expect(sent).toHaveLength(1);
    expect(texted).toHaveLength(0);
  });

  it('does not let one failed SMS stop the batch', async () => {
    vi.spyOn(sms, 'sendTemplate').mockRejectedValue(new Error('provider down'));
    await subscriber({ expiresOn: '2026-09-10' });
    await subscriber({ expiresOn: '2026-09-10' });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    const r = await runSubscriptionReminders(RUN('2026-09-07'));

    expect(r.soon).toBe(2);
    expect(sent).toHaveLength(2);
    err.mockRestore();
  });

  it('warns both cohorts in one run', async () => {
    await subscriber({ expiresOn: '2026-09-10', messenger: true }); // three days out
    await subscriber({ expiresOn: '2026-09-07', messenger: true }); // today

    const r = await runSubscriptionReminders(RUN('2026-09-07'));

    expect(r).toEqual({ soon: 1, today: 1 });
  });

  it('follows a retuned warning distance', async () => {
    config.subscriptionReminder.daysBefore = 7;
    await subscriber({ expiresOn: '2026-09-10', messenger: true });

    expect(await runSubscriptionReminders(RUN('2026-09-07'))).toEqual({ soon: 0, today: 0 });
    const r = await runSubscriptionReminders(RUN('2026-09-03'));
    expect(r.soon).toBe(1);
    expect(titles()[0]).toContain('۷ روز');
  });
});

/**
 * The win-back: one message `daysAfter` days after the subscription ended.
 *
 * What is worth protecting is that it reaches somebody the site had stopped
 * talking to, exactly once, and that it does NOT reach the two people it would
 * be an insult to — the reader who already came back, and the reader whose
 * money is sitting in the founder's approval queue.
 */
describe('runSubscriptionReminders — the win-back', () => {
  it('writes three days after the last day, to somebody who did not renew', async () => {
    await subscriber({ expiresOn: '2026-09-10', messenger: true, saved: 4 });

    const r = await runWinbackReminders(RUN('2026-09-13'));

    expect(r).toEqual({ lapsed: 1 });
    expect(sent[0].kind).toBe('subscription_lapsed');
    expect(sent[0].msg.url).toContain('from=winback');
  });

  it('leads with what they still have, not with what ended', async () => {
    await subscriber({ expiresOn: '2026-09-10', messenger: true, saved: 132 });

    await runWinbackReminders(RUN('2026-09-13'));

    // «تمام شد» as a headline is an obituary for the thing we are asking them
    // to buy again. The title is the part that survives a lock screen.
    expect(titles()[0]).toContain('هایلایت');
    expect(titles()[0]).not.toContain('تمام شد');
    expect(sent[0].msg.body).toContain('۱۳۲');
  });

  it('says nothing on the last day itself, or the day after', async () => {
    await subscriber({ expiresOn: '2026-09-10', messenger: true, saved: 2 });

    for (const day of ['2026-09-11', '2026-09-12', '2026-09-14']) {
      expect((await runWinbackReminders(RUN(day))).lapsed).toBe(0);
    }
    // 09-10 is the day-of warning, which is a different message entirely.
    expect((await runWinbackReminders(RUN('2026-09-10'))).lapsed).toBe(0);
  });

  it('says it once, however many times the job runs', async () => {
    await subscriber({ expiresOn: '2026-09-10', messenger: true, saved: 2 });

    await runWinbackReminders(RUN('2026-09-13'));
    await runWinbackReminders(RUN('2026-09-13'));
    await runWinbackReminders(RUN('2026-09-13'));

    expect(sent).toHaveLength(1);
  });

  it('never reaches somebody who already came back', async () => {
    const id = await subscriber({ expiresOn: '2026-09-10', messenger: true, saved: 2 });

    // They renewed on the 12th. activateMonths restarts a lapsed subscription
    // from today, so the expiry is a month away and the cohort query — which
    // asks for an expiry exactly three days old — cannot find them. Nothing is
    // cancelled and no flag is cleared; the date test does all of it.
    await activateMonths(id, 1, { source: 'payment', now: new Date('2026-09-12T09:00:00+03:30') });

    expect((await runWinbackReminders(RUN('2026-09-13'))).lapsed).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it('never reaches somebody whose transfer is sitting in the queue', async () => {
    // They have paid. The founder has not got to the row yet. «اشتراکت تمام
    // شد، دوباره بخر» is the worst message the site could send them.
    await subscriber({ expiresOn: '2026-09-10', messenger: true, saved: 5, claimPending: true });

    expect((await runWinbackReminders(RUN('2026-09-13'))).lapsed).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it('never reaches a founder — there is no date to run out', async () => {
    const r = await pool.query<{ id: string }>(
      'insert into profiles (phone, display_name) values ($1, $2) returning id',
      ['09124408888', 'بنیان‌گذار'],
    );
    await grantLifetime(r.rows[0].id, { source: 'admin' });

    for (const day of ['2026-09-13', '2026-10-13', '2027-01-01']) {
      expect((await runWinbackReminders(RUN(day))).lapsed).toBe(0);
    }
  });

  it('is exempt from the daily notification cap', async () => {
    const id = await subscriber({ expiresOn: '2026-09-10', messenger: true, saved: 2 });
    for (let i = 0; i < config.notify.maxPerDay + 2; i += 1) {
      await pool.query(
        "insert into notification_log (user_id, kind, day) values ($1, 'streak', $2::date)",
        [id, '2026-09-13'],
      );
    }

    await runWinbackReminders(RUN('2026-09-13'));

    expect(sent).toHaveLength(1);
  });

  it('texts its OWN registered template, never the renewal one', async () => {
    // 530460 says «N روز تا پایان اشتراک» — the wrong tense for a subscription
    // that has already ended, and an Iranian service line sends the registered
    // text, not ours. Two templates or none.
    await subscriber({ expiresOn: '2026-09-10', saved: 9 });

    await runWinbackReminders(RUN('2026-09-13'));

    expect(texted).toHaveLength(1);
    expect(texted[0].templateId).toBe(88);
    expect(texted[0].params).toEqual([
      { name: 'name', value: 'کاربر 1' },
      { name: 'saved', value: '۹ هایلایت و یادداشتِ شما' },
    ]);
  });

  it('still lands in the inbox before any template is registered', async () => {
    config.subscriptionReminder.winbackSmsTemplateId = 0;
    await subscriber({ expiresOn: '2026-09-10', saved: 9 });

    await runWinbackReminders(RUN('2026-09-13'));

    // The free channels do not wait on SMS.ir's approval queue.
    expect(sent).toHaveLength(1);
    expect(texted).toHaveLength(0);
  });

  /**
   * `#saved#` carries a PHRASE, which is what lets one registered template
   * serve every reader — and is why the text is no longer withheld from an
   * account with nothing saved. Three branches, and the middle one is the point
   * of the whole design: a reader with three highlights is told their work is
   * safe without being told how little of it there is.
   */
  it('says the count only when it is worth saying', async () => {
    await subscriber({ expiresOn: '2026-09-10', saved: 12 });

    await runWinbackReminders(RUN('2026-09-13'));

    expect(texted[0].params[1].value).toBe('۱۲ هایلایت و یادداشتِ شما');
    expect(sent[0].msg.body).toContain('۱۲ هایلایت');
  });

  it('goes plural and countless below the threshold, never «۳ هایلایت»', async () => {
    await subscriber({ expiresOn: '2026-09-10', saved: 3 });

    await runWinbackReminders(RUN('2026-09-13'));

    expect(texted[0].params[1].value).toBe('هایلایت‌ها و یادداشت‌های شما');
    expect(sent[0].msg.body).not.toContain('۳ هایلایت');
    expect(sent[0].msg.body).toContain('هایلایت‌ها و یادداشت‌های شما');
  });

  it('still texts an account that saved nothing, and promises nothing false', async () => {
    // The old rule sent no text at all here, which was a parameter with nothing
    // to say deciding who got a message. «هایلایت‌های شما محفوظ است» would be
    // vacuous to somebody with none, so the zero case gets its own phrase — and
    // its own title, since the default one is addressed to a different person.
    await subscriber({ expiresOn: '2026-09-10', saved: 0 });

    await runWinbackReminders(RUN('2026-09-13'));

    expect(texted).toHaveLength(1);
    expect(texted[0].params[1].value).toBe('هر چه ذخیره کرده‌اید');
    expect(sent[0].msg.body).not.toContain('هایلایت');
    expect(titles()[0]).not.toContain('هایلایت');
  });

  it('counts a deleted highlight as gone', async () => {
    // `highlights` is a VIEW over the live rows (migration 0066). Promising
    // «۹ هایلایتت سرِ جایش است» about something the reader deleted themselves
    // is the one way this message could be a lie.
    const id = await subscriber({ expiresOn: '2026-09-10', saved: 9 });
    await pool.query(
      "update highlights_all set deleted_at = now() where user_id = $1 and content_id = 'insight/insight-1'",
      [id],
    );

    await runWinbackReminders(RUN('2026-09-13'));

    expect(texted[0].params[1]).toEqual({ name: 'saved', value: '۸ هایلایت و یادداشتِ شما' });
  });

  it('is not sent by the morning job — the two jobs are separate', async () => {
    // The hour is the difference between the two messages, so the win-back has
    // its own timer. If it ever rode along on the 10:00 run again, this fails.
    await subscriber({ expiresOn: '2026-09-10', messenger: true, saved: 6 });

    const morning = await runSubscriptionReminders(RUN('2026-09-13'));

    expect(morning).toEqual({ soon: 0, today: 0 });
    expect(sent).toHaveLength(0);
    expect((await runWinbackReminders(RUN('2026-09-13'))).lapsed).toBe(1);
  });

  it('is a WEEK out on the shipped default', async () => {
    config.subscriptionReminder.daysAfter = 7;
    await subscriber({ expiresOn: '2026-09-10', messenger: true, saved: 6 });

    expect((await runWinbackReminders(RUN('2026-09-13'))).lapsed).toBe(0);
    expect((await runWinbackReminders(RUN('2026-09-17'))).lapsed).toBe(1);
  });

  it('follows a retuned distance, and 0 switches it off entirely', async () => {
    config.subscriptionReminder.daysAfter = 7;
    await subscriber({ expiresOn: '2026-09-10', messenger: true, saved: 2 });

    expect((await runWinbackReminders(RUN('2026-09-13'))).lapsed).toBe(0);
    expect((await runWinbackReminders(RUN('2026-09-17'))).lapsed).toBe(1);

    config.subscriptionReminder.daysAfter = 0;
    await subscriber({ expiresOn: '2026-09-20', messenger: true, saved: 2 });
    expect((await runWinbackReminders(RUN('2026-09-23'))).lapsed).toBe(0);
  });
});

/**
 * The half hour is not cosmetic: `articleNotify.freeDigestHour` is 21:00 and a
 * lapsed reader is a FREE reader, so a win-back on the hour would land in the
 * same minute as «۳ مطلب تازه» on exactly the evening it goes out.
 */
describe('the win-back runs at 21:30 Tehran, not on the hour', () => {
  it('computes ms until the next 21:30, minute included', () => {
    // 21:00 Tehran (17:30Z) — the free digest's own minute — is 30 min early.
    const half = msUntilNextRun(new Date('2026-03-10T17:30:00.000Z'), 21, 'Asia/Tehran', 30);
    expect(Math.round(half / 60000)).toBe(30);
    // 21:31 Tehran: today's slot is gone, so it waits out the day.
    const tomorrow = msUntilNextRun(new Date('2026-03-10T18:01:00.000Z'), 21, 'Asia/Tehran', 30);
    expect(Math.round(tomorrow / 60000)).toBe(24 * 60 - 1);
  });

  it('is unchanged for every caller that passes no minute', () => {
    const onTheHour = msUntilNextRun(new Date('2026-03-10T16:30:00.000Z'), 21, 'Asia/Tehran');
    expect(Math.round(onTheHour / 60000)).toBe(60);
  });

  it('lands inside the site\'s own awake window', () => {
    // notify.awakeEndHour is 22 and half-open, so 22:00 is the first minute the
    // site itself calls too late to knock. 21:30 is deliberately before it.
    const { winbackHour, winbackMinute } = config.subscriptionReminder;
    expect(winbackHour * 60 + winbackMinute).toBeLessThan(config.notify.awakeEndHour * 60);
    expect(winbackHour).toBeGreaterThanOrEqual(config.notify.awakeStartHour);
    // And not in the digest's minute.
    expect(winbackHour * 60 + winbackMinute)
      .not.toBe(config.articleNotify.freeDigestHour * 60);
  });
});

/**
 * The two registered templates, as shipped. Nothing here exercises SMS.ir; what
 * it protects is that the win-back HAS a paid channel and that it is not the
 * renewal one — both of which are silent when wrong.
 */
describe('the shipped SMS templates', () => {
  it('gives the win-back a live template of its own', () => {
    // 0 is the «not registered yet» state this feature shipped in, and it is
    // indistinguishable at runtime from a working deployment: the اطلاعیه row
    // and the pushes still land, so nobody notices the texts stopped.
    expect(SHIPPED.winback).toBeGreaterThan(0);
    expect(SHIPPED.winback).toBe(882525);
  });

  it('never reuses the renewal template', () => {
    // 530460 reads «N روز تا پایان اشتراک». Sent to somebody whose subscription
    // ended a week ago it is not merely odd, it is the opposite of true — and
    // SMS.ir delivers the registered text, so the mistake would be invisible
    // from inside this codebase.
    expect(SHIPPED.winback).not.toBe(SHIPPED.reminder);
  });
});
