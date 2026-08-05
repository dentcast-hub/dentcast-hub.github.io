import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { resetDb } from './helpers.js';
import { pool, closePool } from '../src/db.js';
import { config } from '../src/config.js';
import { runSubscriptionReminders } from '../src/services/subscription-reminder.js';
import { activateMonths, grantLifetime } from '../src/services/subscription.js';
import { notifications, sms } from '../src/providers/registry.js';
import type { NotificationMessage } from '../src/providers/notifications/types.js';

/**
 * The renewal reminders (level 3.2): one three days out, one on the last day.
 *
 * The behaviour worth protecting is not that a message goes out — it is that it
 * goes out ONCE per expiry date, re-arms by itself when somebody renews, and is
 * never dropped by the daily notification cap.
 */

let seq = 0;
let sent: Array<{ userId: string; kind: string; msg: NotificationMessage }> = [];
let texted: Array<{ phone: string; templateId: number }> = [];

/** 10:00 Tehran on the day the reminder job runs. */
const RUN = (day: string) => new Date(`${day}T10:00:00+03:30`);

async function subscriber(opts: { expiresOn: string; messenger?: boolean }): Promise<string> {
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
  vi.spyOn(notifications, 'send').mockImplementation(async (userId, msg, kind) => {
    sent.push({ userId, kind, msg: msg as NotificationMessage });
  });
  vi.spyOn(sms, 'sendTemplate').mockImplementation(async (phone, templateId) => {
    texted.push({ phone, templateId });
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

  it('texts only the people who have no other way of hearing it', async () => {
    await subscriber({ expiresOn: '2026-09-10', messenger: true });   // has Telegram
    const alone = await subscriber({ expiresOn: '2026-09-10' });      // has nothing

    await runSubscriptionReminders(RUN('2026-09-07'));

    expect(sent).toHaveLength(2);
    expect(texted).toHaveLength(1);
    const phone = (await pool.query<{ phone: string }>(
      'select phone from profiles where id = $1', [alone])).rows[0].phone;
    expect(texted[0]).toEqual({ phone, templateId: 77 });
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
