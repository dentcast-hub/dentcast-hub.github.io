import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  phone = '09121200001';
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function makePremium(): Promise<void> {
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
}

async function createHighlight(overrides: Record<string, unknown> = {}): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/highlights',
    headers: { cookie },
    payload: {
      content_id: 'resin-cements-overview',
      exact: 'پیوند به عاج همیشه ضعیف‌تر از پیوند به مینا است',
      ...overrides,
    },
  });
  return res.json().highlight.id as string;
}

describe('requirePremium gate', () => {
  it('blocks a free user with 402', async () => {
    await createHighlight();
    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    expect(res.statusCode).toBe(402);
  });

  it('blocks an unauthenticated request with 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/review/due' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /review/due', () => {
  it('lists a freshly-created highlight as due (never reviewed, next_review_at null)', async () => {
    await makePremium();
    const id = await createHighlight();

    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const due = res.json().due;
    expect(due).toHaveLength(1);
    expect(due[0].highlight_id).toBe(id);
    expect(due[0].box).toBe(1);
  });

  it('excludes a card scheduled in the future', async () => {
    await makePremium();
    const id = await createHighlight();
    await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'remembered' },
    });

    const res = await app.inject({ method: 'GET', url: '/review/due', headers: { cookie } });
    expect(res.json().due).toHaveLength(0);
  });

  it('scopes to a folder topic', async () => {
    await makePremium();
    const inFolder = await createHighlight({ content_id: 'chairside/chairside-1' });
    await createHighlight({ content_id: 'insight/insight-1' });

    const res = await app.inject({
      method: 'GET', url: '/review/due?topic=folder:chairside', headers: { cookie },
    });
    const due = res.json().due;
    expect(due).toHaveLength(1);
    expect(due[0].highlight_id).toBe(inFolder);
  });
});

describe('POST /review/answer', () => {
  it('advances the box and schedules next_review_at on "remembered"', async () => {
    await makePremium();
    const id = await createHighlight();

    const res = await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'remembered' },
    });
    expect(res.statusCode).toBe(200);
    const cs = res.json().card_state;
    expect(cs.box).toBe(2);
    expect(cs.reviewed_count).toBe(1);
    expect(new Date(cs.next_review_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('resets to box 1 on "forgot", even from a higher box', async () => {
    await makePremium();
    const id = await createHighlight();
    await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'remembered' },
    });
    await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'remembered' },
    });
    const res = await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'forgot' },
    });
    expect(res.json().card_state.box).toBe(1);
  });

  it('never advances box past 5', async () => {
    await makePremium();
    const id = await createHighlight();
    let box = 1;
    for (let i = 0; i < 8; i += 1) {
      const res = await app.inject({
        method: 'POST', url: '/review/answer', headers: { cookie },
        payload: { highlight_id: id, result: 'remembered' },
      });
      box = res.json().card_state.box;
    }
    expect(box).toBe(5);
  });

  it('logs review_finished (counts for streak/score/league)', async () => {
    await makePremium();
    const id = await createHighlight();
    await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie },
      payload: { highlight_id: id, result: 'remembered' },
    });
    const act = await pool.query(
      `select count(*)::int as n from user_activity where action = 'review_finished'`,
    );
    expect(act.rows[0].n).toBe(1);
  });

  it('404s on a highlight that does not belong to the caller', async () => {
    await makePremium();
    const id = await createHighlight();
    const other = await loginAs(app, '09121200002');
    await pool.query(`update profiles set tier = 'premium' where phone = '09121200002'`);

    const res = await app.inject({
      method: 'POST', url: '/review/answer', headers: { cookie: other },
      payload: { highlight_id: id, result: 'remembered' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('does NOT touch card_state on the free manual-review path (card_reviewed_manual)', async () => {
    await makePremium();
    const id = await createHighlight();
    await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'card_reviewed_manual', content_id: 'resin-cements-overview', meta: { highlight_id: id } },
    });
    const cs = await pool.query('select box, next_review_at from card_state where highlight_id = $1', [id]);
    expect(cs.rows[0].box).toBe(1);
    expect(cs.rows[0].next_review_at).toBeNull();
  });
});

describe('GET /me due_card_count', () => {
  it('is absent for a free user', async () => {
    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect('due_card_count' in res.json()).toBe(false);
  });

  it('reflects the real due count for a premium user', async () => {
    await makePremium();
    await createHighlight();
    await createHighlight({ exact: 'یک هایلایت دوم', content_id: 'resin-cements-overview' });

    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(res.json().due_card_count).toBe(2);
  });
});
