import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';

let app: FastifyInstance;
let cookie: string;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, '09121200001');
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

const CID = 'notecast/episode-2';

describe('per-article note (independent of highlights)', () => {
  it('requires auth', async () => {
    const res = await app.inject({ method: 'GET', url: `/article-note?content_id=${CID}` });
    expect(res.statusCode).toBe(401);
  });

  it('starts null, saves, reloads, and clears — one row per (user, article)', async () => {
    // nothing saved yet
    let res = await app.inject({ method: 'GET', url: `/article-note?content_id=${CID}`, headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json().note).toBeNull();

    // save
    res = await app.inject({ method: 'PUT', url: '/article-note', headers: { cookie }, payload: { content_id: CID, note: 'خلاصه‌ی کل مقاله' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().note).toBe('خلاصه‌ی کل مقاله');

    // reloads
    res = await app.inject({ method: 'GET', url: `/article-note?content_id=${CID}`, headers: { cookie } });
    expect(res.json().note).toBe('خلاصه‌ی کل مقاله');

    // upsert (still one row), then clear with empty
    res = await app.inject({ method: 'PUT', url: '/article-note', headers: { cookie }, payload: { content_id: CID, note: 'ویرایش شد' } });
    expect(res.json().note).toBe('ویرایش شد');
    const count = await pool.query('select count(*)::int as n from article_notes');
    expect(count.rows[0].n).toBe(1);

    res = await app.inject({ method: 'PUT', url: '/article-note', headers: { cookie }, payload: { content_id: CID, note: '   ' } });
    expect(res.json().note).toBeNull();
    res = await app.inject({ method: 'GET', url: `/article-note?content_id=${CID}`, headers: { cookie } });
    expect(res.json().note).toBeNull();
  });
});
