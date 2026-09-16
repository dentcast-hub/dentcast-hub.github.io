import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { dayInTz, previousDay } from '../src/services/time.js';
import { runStreakReminders, smsSentInMonth, smsOptedInCount } from '../src/services/streak-reminder.js';
import { activateMonths } from '../src/services/subscription.js';
import { notifications, sms } from '../src/providers/registry.js';
import type { TemplateParam } from '../src/providers/sms/types.js';

/**
 * The streak reminder's SMS lane (founder decision, 2026-09-16).
 *
 * What is worth protecting: the text goes to a PREMIUM reader who turned it on
 * and has a phone — and to nobody else; it goes even when the daily cap has
 * already swallowed the push («حتی اگر بقیه اطلاع‌رسانی‌ها رفتن»); it carries the
 * reader's name and the streak length in the registered template's parameters;
 * it is once a day; it stays home when no template is configured or the monthly
 * ceiling is reached; and a reader with the SMS as their ONLY channel is still
 * found by the eligibility query.
 */

let app: FastifyInstance;
let texted: Array<{ phone: string; templateId: number; params: TemplateParam[] }> = [];
let pushed: string[] = [];

const SMS_ON = '{"reminders":{"streak":true},"notify_channels":{"sms":{"streak":true}}}';
const SMS_OFF = '{"reminders":{"streak":true}}';

/** A reader with a savable streak (active yesterday), opted into the reminder. */
async function reader(phone: string, opts: { premium?: boolean; settings?: string; push?: boolean } = {}) {
  const cookie = await loginAs(app, phone);
  const me = await (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
  const yesterday = previousDay(dayInTz(new Date()));
  await pool.query(
    `update profiles set settings = settings || $2::jsonb, display_name = $3,
            current_streak = 23, longest_streak = 23, last_active_day = $4 where id = $1`,
    [me.id, opts.settings ?? SMS_ON, 'فؤاد', yesterday],
  );
  if (opts.premium !== false) await activateMonths(me.id, 1, { source: 'payment' });
  if (opts.push) {
    await pool.query(
      `insert into push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, $2, 'k', 's')`,
      [me.id, `https://example.com/${phone}`],
    );
  }
  return me.id as string;
}

const markers = async (action: string) =>
  (await pool.query<{ user_id: string }>('select user_id from user_activity where action = $1', [action]))
    .rows.map((r) => r.user_id);

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  texted = [];
  pushed = [];
  config.streakReminder.smsTemplateId = 91;
  config.streakReminder.smsMonthlyCap = 0;
  config.notify.maxPerDay = 5;
  vi.spyOn(sms, 'sendTemplate').mockImplementation(async (phone, templateId, params) => {
    texted.push({ phone, templateId, params });
  });
  vi.spyOn(notifications, 'send').mockImplementation(async (userId) => { pushed.push(userId); });
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('streak reminder — the SMS lane', () => {
  it('texts a premium reader who turned it on, with name and streak length as the template parameters', async () => {
    const id = await reader('09121600001', { push: true });
    const r = await runStreakReminders(new Date());

    expect(r).toEqual({ reminded: 1, sms: 1 });
    expect(texted).toHaveLength(1);
    expect(texted[0].phone).toBe('09121600001');
    expect(texted[0].templateId).toBe(91);
    expect(texted[0].params).toEqual([
      { name: 'name', value: 'فؤاد' },
      { name: 'days', value: '۲۳' },
    ]);
    // The push went too — the text is on top of the other channels, never instead.
    expect(pushed).toContain(id);
    expect(await markers('streak_sms_sent')).toEqual([id]);
  });

  it('is the ONLY channel a premium reader needs: no push, no messenger, still found and texted', async () => {
    const id = await reader('09121600002', { push: false });
    const r = await runStreakReminders(new Date());
    expect(r.sms).toBe(1);
    expect(texted[0].phone).toBe('09121600002');
    expect(await markers('streak_reminder_sent')).toEqual([id]);
  });

  it('goes even when the daily cap already swallowed the push', async () => {
    await reader('09121600003', { push: true });
    config.notify.maxPerDay = 0; // every capped kind is dropped today
    const r = await runStreakReminders(new Date());
    expect(pushed).toHaveLength(0); // sendCapped kept the push home
    expect(r.sms).toBe(1);
    expect(texted).toHaveLength(1);
  });

  it('never texts a free reader, however the switch is set', async () => {
    await reader('09121600004', { premium: false, push: true });
    const r = await runStreakReminders(new Date());
    expect(r.reminded).toBe(1); // the push lane is unchanged
    expect(r.sms).toBe(0);
    expect(texted).toHaveLength(0);
  });

  it('never texts a premium reader who did not turn it on — the default is OFF', async () => {
    await reader('09121600005', { settings: SMS_OFF, push: true });
    const r = await runStreakReminders(new Date());
    expect(r.reminded).toBe(1);
    expect(r.sms).toBe(0);
  });

  it('skips a phone-less account (a Telegram-first profile) rather than handing the provider a blank', async () => {
    const id = await reader('09121600006', { push: true });
    await pool.query(`update profiles set phone = null where id = $1`, [id]);
    const r = await runStreakReminders(new Date());
    expect(r.sms).toBe(0);
    expect(texted).toHaveLength(0);
  });

  it('stays home while no template is configured, and the run still reminds by push', async () => {
    await reader('09121600007', { push: true });
    config.streakReminder.smsTemplateId = 0;
    const r = await runStreakReminders(new Date());
    expect(r).toEqual({ reminded: 1, sms: 0 });
    expect(await markers('streak_sms_sent')).toEqual([]);
  });

  it('is once per Tehran day: a second run texts nobody again', async () => {
    await reader('09121600008', { push: true });
    await runStreakReminders(new Date());
    await runStreakReminders(new Date());
    expect(texted).toHaveLength(1);
  });

  it('respects the monthly ceiling and keeps the push lane going', async () => {
    await reader('09121600009', { push: true });
    await reader('09121600010', { push: true });
    config.streakReminder.smsMonthlyCap = 1;
    const r = await runStreakReminders(new Date());
    expect(r.reminded).toBe(2);
    expect(r.sms).toBe(1);
    expect(texted).toHaveLength(1);
    expect(await smsSentInMonth(dayInTz(new Date()))).toBe(1);
  });

  it('a failing provider is logged, never fails the batch, and spends the marker', async () => {
    await reader('09121600011', { push: true });
    await reader('09121600012', { push: true });
    vi.spyOn(sms, 'sendTemplate').mockRejectedValue(new Error('provider down'));
    const r = await runStreakReminders(new Date());
    expect(r.reminded).toBe(2);
    expect(r.sms).toBe(0);
    expect(await markers('streak_sms_sent')).toHaveLength(2);
  });

  it('smsOptedInCount counts premium + phone + switch on, and nothing else', async () => {
    await reader('09121600013');                          // premium, on
    await reader('09121600014', { premium: false });      // free, on
    await reader('09121600015', { settings: SMS_OFF });   // premium, off
    expect(await smsOptedInCount()).toBe(1);
  });
});
