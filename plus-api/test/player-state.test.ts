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

describe('account-level player resume state (migration 0039)', () => {
  it('requires auth — anonymous listeners stay on localStorage', async () => {
    let res = await app.inject({ method: 'GET', url: '/player/state' });
    expect(res.statusCode).toBe(401);
    res = await app.inject({ method: 'PUT', url: '/player/state', payload: { episode: 12 } });
    expect(res.statusCode).toBe(401);
  });

  it('starts null, upserts one row per user, and reads back what was saved', async () => {
    let res = await app.inject({ method: 'GET', url: '/player/state', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json().state).toBeNull();

    res = await app.inject({
      method: 'PUT', url: '/player/state', headers: { cookie },
      payload: { episode: 160, position: 731.5, anchor: 160, speed: 1.25 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().ok).toBe(true);

    res = await app.inject({ method: 'GET', url: '/player/state', headers: { cookie } });
    const s1 = res.json().state;
    expect(s1.episode).toBe(160);
    expect(s1.position).toBeCloseTo(731.5, 1);
    expect(s1.anchor).toBe(160);
    expect(s1.speed).toBeCloseTo(1.25, 2);
    expect(typeof s1.updated_at).toBe('string');

    // upsert replaces, never accumulates — the table is one record per user
    res = await app.inject({
      method: 'PUT', url: '/player/state', headers: { cookie },
      payload: { episode: 42, position: 10 },
    });
    expect(res.statusCode).toBe(200);
    const count = await pool.query('select count(*)::int as n from player_state');
    expect(count.rows[0].n).toBe(1);

    res = await app.inject({ method: 'GET', url: '/player/state', headers: { cookie } });
    const s2 = res.json().state;
    expect(s2.episode).toBe(42);
    // omitted optionals reset with the record (the row mirrors the client state)
    expect(s2.anchor).toBeNull();
    expect(s2.speed).toBeNull();
  });

  it('rejects a record with no episode', async () => {
    const res = await app.inject({
      method: 'PUT', url: '/player/state', headers: { cookie },
      payload: { position: 5 },
    });
    expect(res.statusCode).toBe(400);
  });

  it('keeps each account its own record', async () => {
    await app.inject({
      method: 'PUT', url: '/player/state', headers: { cookie },
      payload: { episode: 7, position: 100 },
    });
    const cookie2 = await loginAs(app, '09121200002');
    let res = await app.inject({ method: 'GET', url: '/player/state', headers: { cookie: cookie2 } });
    expect(res.json().state).toBeNull();
    await app.inject({
      method: 'PUT', url: '/player/state', headers: { cookie: cookie2 },
      payload: { episode: 9, position: 3 },
    });
    res = await app.inject({ method: 'GET', url: '/player/state', headers: { cookie } });
    expect(res.json().state.episode).toBe(7);
  });
});
