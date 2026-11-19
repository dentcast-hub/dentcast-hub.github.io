import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';

let app: FastifyInstance;
const basic = 'Basic ' + Buffer.from(
  `${config.admin.user}:${config.admin.password}`).toString('base64');

beforeAll(async () => { app = await makeApp(); });
beforeEach(async () => { await resetDb(); });
afterAll(async () => { await app?.close(); await pool.end(); });

const get = () => app.inject({ method: 'GET', url: '/admin/telegram-footer', headers: { authorization: basic } });
const post = (body: unknown) => app.inject({
  method: 'POST', url: '/admin/telegram-footer', headers: { authorization: basic }, payload: body as object,
});

describe('/admin/telegram-footer', () => {
  it('is off with nothing stored before the founder ever saves', async () => {
    const res = await get();
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true, enabled: false, text: '', url: '', label: '' });
  });

  it('needs the admin credentials — the runner reads it with Basic auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/telegram-footer' });
    expect(res.statusCode).toBe(401);
  });

  it('saves text and link and returns them on the next read', async () => {
    const res = await post({ enabled: true, text: '  دورهٔ تازه   ثبت‌نام می‌کند ', url: 'https://example.com/a?b=1' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ enabled: true, text: 'دورهٔ تازه ثبت‌نام می‌کند', url: 'https://example.com/a?b=1' });
    expect((await get()).json()).toMatchObject({ enabled: true, text: 'دورهٔ تازه ثبت‌نام می‌کند' });
  });

  it('refuses to switch on without both a sentence and a link', async () => {
    expect((await post({ enabled: true, text: '', url: 'https://example.com' })).json().error).toBe('text_required');
    expect((await post({ enabled: true, text: 'سلام', url: '' })).json().error).toBe('url_required');
    expect((await get()).json().enabled).toBe(false);
  });

  it('refuses a link that is not a full http(s) URL', async () => {
    for (const url of ['example.com', 'javascript:alert(1)', 'https://exa mple.com', 'tg://x']) {
      const res = await post({ enabled: true, text: 'سلام', url });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toBe('invalid_url');
    }
  });

  it('turning off keeps the last copy so turning it back on is one tap', async () => {
    await post({ enabled: true, text: 'سلام', url: 'https://example.com' });
    const off = await post({ enabled: false, text: 'سلام', url: 'https://example.com' });
    expect(off.json()).toMatchObject({ enabled: false, text: 'سلام', url: 'https://example.com' });
  });

  it('stores an optional display name for the link; empty means raw link', async () => {
    const withLabel = await post({ enabled: true, text: 'سلام', url: 'https://example.com', label: ' ثبت‌نام  دوره ' });
    expect(withLabel.json()).toMatchObject({ label: 'ثبت‌نام دوره' });
    const without = await post({ enabled: true, text: 'سلام', url: 'https://example.com' });
    expect(without.json()).toMatchObject({ label: '' });
    expect((await post({ enabled: true, text: 'سلام', url: 'https://example.com', label: 'ب'.repeat(61) })).json().error)
      .toBe('label_too_long');
  });

  it('caps the sentence length', async () => {
    const res = await post({ enabled: true, text: 'ا'.repeat(121), url: 'https://example.com' });
    expect(res.json().error).toBe('text_too_long');
  });

  it('the panel page carries the section', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin', headers: { authorization: basic } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('امضای پیام تلگرام');
    expect(res.body).toContain('id="tfSave"');
    expect(res.body).toContain('maxlength="120"');
    expect(res.body).toContain('id="tfLabel"');
  });
});
