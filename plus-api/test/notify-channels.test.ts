import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { channelWanted, channelWantedFor } from '../src/services/notify-channels.js';
import { BaleNotificationSender } from '../src/providers/notifications/bale.js';
import { WebPushNotificationSender } from '../src/providers/notifications/webpush.js';

/**
 * «از کجا برسد» — the per-channel preference (services/notify-channels.ts).
 *
 * Two rules the whole matrix rests on: an ABSENT flag is ON for web push and
 * Bale (the arrival of a preference switches nobody off) and OFF for SMS (it
 * costs money and is opt-in); and only the two matrix kinds are governed —
 * every other kind passes through whatever the reader set.
 */

const baleSent = vi.hoisted(() => [] as Array<{ chatId: number; text: string }>);
vi.mock('../src/services/bale-api.js', () => ({
  baleSendMessage: async (chatId: number, text: string) => { baleSent.push({ chatId, text }); },
}));

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  baleSent.length = 0;
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('channelWanted (pure)', () => {
  it('defaults: webpush and bale ON, sms OFF', () => {
    expect(channelWanted({}, 'webpush', 'streak')).toBe(true);
    expect(channelWanted({}, 'bale', 'article_premium')).toBe(true);
    expect(channelWanted({}, 'sms', 'streak')).toBe(false);
    expect(channelWanted(undefined, 'webpush', 'article_free_digest')).toBe(true);
  });

  it('honours an explicit flag per channel and per kind', () => {
    const s = { notify_channels: { webpush: { streak: false }, bale: { new_content: false }, sms: { streak: true } } };
    expect(channelWanted(s, 'webpush', 'streak')).toBe(false);
    expect(channelWanted(s, 'webpush', 'article_premium')).toBe(true);   // untouched sibling stays ON
    expect(channelWanted(s, 'bale', 'article_premium')).toBe(false);
    expect(channelWanted(s, 'bale', 'article_free_digest')).toBe(false); // both article kinds share one column
    expect(channelWanted(s, 'bale', 'streak')).toBe(true);
    expect(channelWanted(s, 'sms', 'streak')).toBe(true);
  });

  it('never governs a kind outside the matrix', () => {
    const s = { notify_channels: { webpush: { streak: false, new_content: false }, bale: { streak: false, new_content: false } } };
    for (const kind of ['system', 'league', 'review', 'support_reply', 'subscription_expiry',
      'subscription_lapsed', 'exam_result'] as const) {
      expect(channelWanted(s, 'webpush', kind)).toBe(true);
      expect(channelWanted(s, 'bale', kind)).toBe(true);
    }
  });

  it('ignores a malformed value rather than throwing', () => {
    expect(channelWanted({ notify_channels: 'nope' }, 'webpush', 'streak')).toBe(true);
    expect(channelWanted({ notify_channels: { webpush: { streak: 'yes' } } }, 'webpush', 'streak')).toBe(true);
  });
});

describe('the senders read the preference', () => {
  async function user(phone: string, settings: string, baleId: number | null): Promise<string> {
    const cookie = await loginAs(app, phone);
    const me = await (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json();
    await pool.query('update profiles set settings = settings || $2::jsonb, bale_id = $3 where id = $1',
      [me.id, settings, baleId]);
    return me.id as string;
  }

  it('Bale skips a matrix kind the reader switched off there, and keeps delivering the others', async () => {
    const id = await user('09121700001', '{"notify_channels":{"bale":{"streak":false}}}', 5001);
    const bale = new BaleNotificationSender();
    await bale.send(id, 'streak nudge', 'streak');
    expect(baleSent).toHaveLength(0);
    await bale.send(id, 'new article', 'article_premium');
    await bale.send(id, 'league result', 'league');
    expect(baleSent.map((b) => b.text)).toEqual(['new article', 'league result']);
  });

  it('channelWantedFor reads the row, and costs no query for an ungoverned kind', async () => {
    const id = await user('09121700002', '{"notify_channels":{"webpush":{"new_content":false}}}', null);
    expect(await channelWantedFor(id, 'webpush', 'article_premium')).toBe(false);
    expect(await channelWantedFor(id, 'webpush', 'streak')).toBe(true);
    expect(await channelWantedFor('00000000-0000-0000-0000-000000000000', 'webpush', 'system')).toBe(true);
  });

  it('web push honours the switch before touching a subscription', async () => {
    const id = await user('09121700003', '{"notify_channels":{"webpush":{"streak":false}}}', null);
    await pool.query(
      `insert into push_subscriptions (user_id, endpoint, p256dh, auth) values ($1, 'https://example.com/x', 'k', 's')`,
      [id],
    );
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const push = new WebPushNotificationSender();
    // No VAPID keys under test: a send that reaches the subscription stub-logs.
    await push.send(id, 'streak nudge', 'streak');
    expect(log).not.toHaveBeenCalled();
    await push.send(id, 'new article', 'article_premium');
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });
});
