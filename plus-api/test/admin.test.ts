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

describe('POST /admin/users/set-tier', () => {
  it('requires admin auth', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/users/set-tier',
      payload: { phone: '09121800001', tier: 'premium' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('flips an existing profile to premium and back to free', async () => {
    await loginAs(app, '09121800001'); // creates the profile

    const up = await app.inject({
      method: 'POST', url: '/admin/users/set-tier',
      headers: { authorization: basic }, payload: { phone: '09121800001', tier: 'premium' },
    });
    expect(up.statusCode).toBe(200);
    expect(up.json()).toMatchObject({ ok: true, phone: '09121800001', tier: 'premium' });

    const row = await pool.query('select tier from profiles where phone = $1', ['09121800001']);
    expect(row.rows[0].tier).toBe('premium');

    const down = await app.inject({
      method: 'POST', url: '/admin/users/set-tier',
      headers: { authorization: basic }, payload: { phone: '09121800001', tier: 'free' },
    });
    expect(down.statusCode).toBe(200);
    expect(down.json().tier).toBe('free');
  });

  it('404s an unknown phone and 400s an invalid one', async () => {
    const notFound = await app.inject({
      method: 'POST', url: '/admin/users/set-tier',
      headers: { authorization: basic }, payload: { phone: '09129999999', tier: 'premium' },
    });
    expect(notFound.statusCode).toBe(404);

    const invalid = await app.inject({
      method: 'POST', url: '/admin/users/set-tier',
      headers: { authorization: basic }, payload: { phone: 'not-a-phone', tier: 'premium' },
    });
    expect(invalid.statusCode).toBe(400);
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

describe('GET /admin/ai/health', () => {
  it('requires admin credentials', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/ai/health' });
    expect(res.statusCode).toBe(401);
  });

  it('reports the stub provider as live:false and probes nothing (no spend, no network)', async () => {
    // The suite pins AI_PROVIDER=stub (vitest.config.ts), which is exactly the
    // state this endpoint exists to make visible: the assistant answers fine,
    // but from a stub — indistinguishable from the real model out in the UI.
    const res = await app.inject({
      method: 'GET', url: '/admin/ai/health', headers: { authorization: basic },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.live, 'stub is not a live model').toBe(false);
    expect(body.ok).toBe(true);
    expect(body.probe, 'stub makes no network call').toBeNull();
    expect(body.configured.provider).toBe('stub');
  });

  it('echoes the tuning knobs so a deploy can be read back', async () => {
    const res = await app.inject({
      method: 'GET', url: '/admin/ai/health', headers: { authorization: basic },
    });
    const { configured } = res.json();
    expect(configured.timeout_ms).toBe(config.ai.timeoutMs);
    expect(configured.max_attempts).toBe(config.ai.maxAttempts);
    expect(configured.json_mode_requested).toBe(config.ai.jsonMode);
  });
});

describe('GET /health', () => {
  it('is public and reports which build is serving', async () => {
    // The reason this endpoint carries a version at all: when a release changes
    // only internals — copy, a query, a default — a container running last
    // week's image answers every other check identically to a fresh one.
    const res = await app.inject({ method: 'GET', url: '/health' });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('commit');
    expect(body).toHaveProperty('built_at');
  });

  it('falls back to safe placeholders outside a stamped image', async () => {
    // npm run dev and a plain `docker build` pass no build args; the endpoint
    // must still answer rather than crash on a missing env var.
    const body = (await app.inject({ method: 'GET', url: '/health' })).json();
    expect(body.version).toBe('dev');
    expect(body.commit).toBe('unknown');
  });

  it('leaks nothing else — three known fields and the ok flag', async () => {
    const body = (await app.inject({ method: 'GET', url: '/health' })).json();
    expect(Object.keys(body).sort()).toEqual(['built_at', 'commit', 'ok', 'version']);
  });
});

describe('GET /admin/ai/health?deep=1', () => {
  it('omits the generation timing unless explicitly asked (it costs tokens)', async () => {
    const res = await app.inject({
      method: 'GET', url: '/admin/ai/health', headers: { authorization: basic },
    });
    expect(res.json().deep).toBeNull();
  });

  it('times one real round when asked', async () => {
    // The suite pins AI_PROVIDER=stub, so this exercises the plumbing offline:
    // the stub answers instantly and the shape is what matters.
    const res = await app.inject({
      method: 'GET', url: '/admin/ai/health?deep=1', headers: { authorization: basic },
    });

    const deep = res.json().deep;
    expect(deep).not.toBeNull();
    expect(deep.ok).toBe(true);
    expect(typeof deep.ms).toBe('number');
    // Says what it timed, so a 1ms stub result can never read as a fast model.
    expect(deep.provider).toBe('stub');
  });
});
