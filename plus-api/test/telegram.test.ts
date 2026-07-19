import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool, one } from '../src/db.js';

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

const SECRET = 'test-webhook-secret'; // matches vitest.config.ts TELEGRAM_WEBHOOK_SECRET

function post(body: unknown, headers: Record<string, string> = { 'x-telegram-bot-api-secret-token': SECRET }) {
  return app.inject({ method: 'POST', url: '/telegram/webhook', payload: body, headers });
}

async function telegramIdFor(phone: string): Promise<number | null> {
  const row = await one<{ telegram_id: number | null }>('select telegram_id from profiles where phone = $1', [phone]);
  return row?.telegram_id ?? null;
}

describe('Telegram webhook', () => {
  it('rejects a request without the correct secret header', async () => {
    const res = await post(
      { message: { chat: { id: 1 }, text: '/start' } },
      { 'x-telegram-bot-api-secret-token': 'wrong' },
    );
    expect(res.statusCode).toBe(403);
  });

  it('rejects a request with no secret header at all', async () => {
    const res = await post({ message: { chat: { id: 1 }, text: '/start' } }, {});
    expect(res.statusCode).toBe(403);
  });

  it('acknowledges /start without erroring', async () => {
    const res = await post({ message: { chat: { id: 1 }, from: { id: 1 }, text: '/start' } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true });
  });

  it('links telegram_id when the user shares their own contact for a phone that already has a profile', async () => {
    const phone = '09121110001';
    await loginAs(app, phone); // creates the profile

    const res = await post({
      message: {
        chat: { id: 555 },
        from: { id: 555 },
        contact: { phone_number: phone, user_id: 555 },
      },
    });
    expect(res.statusCode).toBe(200);
    expect(await telegramIdFor(phone)).toBe(555);
  });

  it('does not link a contact whose user_id does not match the sender (forwarded contact)', async () => {
    const phone = '09121110002';
    await loginAs(app, phone);

    const res = await post({
      message: {
        chat: { id: 777 },
        from: { id: 777 },
        contact: { phone_number: phone, user_id: 999 }, // someone else's card
      },
    });
    expect(res.statusCode).toBe(200);
    expect(await telegramIdFor(phone)).toBeNull();
  });

  it('acknowledges a contact share for a phone with no profile yet, without linking anything', async () => {
    const res = await post({
      message: {
        chat: { id: 888 },
        from: { id: 888 },
        contact: { phone_number: '09121110099', user_id: 888 },
      },
    });
    expect(res.statusCode).toBe(200);
    expect(await telegramIdFor('09121110099')).toBeNull();
  });

  it('does not steal a telegram_id already linked to a different profile', async () => {
    const phoneA = '09121110003';
    const phoneB = '09121110004';
    await loginAs(app, phoneA);
    await loginAs(app, phoneB);

    const first = await post({
      message: { chat: { id: 42 }, from: { id: 42 }, contact: { phone_number: phoneA, user_id: 42 } },
    });
    expect(first.statusCode).toBe(200);
    expect(await telegramIdFor(phoneA)).toBe(42);

    // Same telegram_id, different phone: must be rejected, not moved.
    const second = await post({
      message: { chat: { id: 42 }, from: { id: 42 }, contact: { phone_number: phoneB, user_id: 42 } },
    });
    expect(second.statusCode).toBe(200);
    expect(await telegramIdFor(phoneA)).toBe(42);
    expect(await telegramIdFor(phoneB)).toBeNull();
  });
});
