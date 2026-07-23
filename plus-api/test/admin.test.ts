import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';

let app: FastifyInstance;

const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

describe('admin auth', () => {
  it('challenges without credentials', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/kpis' });
    expect(res.statusCode).toBe(401);
    expect(res.headers['www-authenticate']).toContain('Basic');
  });

  it('rejects wrong credentials', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/kpis',
      headers: { authorization: 'Basic ' + Buffer.from('founder:wrong').toString('base64') } });
    expect(res.statusCode).toBe(401);
  });

  it('serves the HTML page with valid credentials', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin', headers: { authorization: basic } });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('پیشخوان بنیان‌گذار');
  });
});

describe('POST /admin/notify/test', () => {
  it('requires admin auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/notify/test', payload: { telegram_id: 1 } });
    expect(res.statusCode).toBe(401);
  });

  it('sends a test notification to a Telegram-linked user located by telegram_id', async () => {
    await pool.query(
      "insert into profiles (phone, telegram_id, display_name) values (null, 424242, 'tg')",
    );
    const res = await app.inject({
      method: 'POST', url: '/admin/notify/test',
      headers: { authorization: basic }, payload: { telegram_id: 424242 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.telegram_linked).toBe(true);
    expect(typeof body.channel).toBe('string'); // active sender name (stub in tests)
  });

  it('404s an unknown target and 400s a missing target', async () => {
    const notFound = await app.inject({
      method: 'POST', url: '/admin/notify/test',
      headers: { authorization: basic }, payload: { phone: '09129999999' },
    });
    expect(notFound.statusCode).toBe(404);

    const noTarget = await app.inject({
      method: 'POST', url: '/admin/notify/test',
      headers: { authorization: basic }, payload: {},
    });
    expect(noTarget.statusCode).toBe(400);
  });
});

describe('admin KPIs', () => {
  it('computes the six KPIs from activity + anon events', async () => {
    // an anonymous demand signal
    await app.inject({ method: 'POST', url: '/anon/event', payload: { event: 'workbench_button_anon_click', content_id: 'x' } });
    // a signup that activates (creates a highlight) and thus is active today
    const cookie = await loginAs(app, '09121800001');
    await app.inject({ method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: 'a/b', exact: 'متن', color: 'yellow' } });

    const res = await app.inject({ method: 'GET', url: '/admin/kpis', headers: { authorization: basic } });
    expect(res.statusCode).toBe(200);
    const k = res.json();

    expect(k.anonymous_demand.workbench_clicks).toBe(1);
    expect(k.anonymous_demand.total_signups).toBe(1);
    // one signup activated within 48h -> 100%
    expect(k.activation_48h_pct.cohort).toBe(1);
    expect(k.activation_48h_pct.pct).toBe(100);
    // depth: one user with one highlight this week -> median 1
    expect(k.depth_median_highlights_per_user_week).toBe(1);
    // shape checks
    expect(Array.isArray(k.d7_survival_by_tier)).toBe(true);
    expect(k.archive_usage).toHaveProperty('sessions_last_7d');
  });
});
