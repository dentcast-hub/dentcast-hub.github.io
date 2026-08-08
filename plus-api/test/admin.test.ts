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

describe('POST /admin/users/set-tier (retired)', () => {
  it('still requires admin auth — a retired route is not an open one', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/users/set-tier',
      payload: { phone: '09121800001', tier: 'premium' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('answers 410 and names where the capability went', async () => {
    await loginAs(app, '09121800001');

    const res = await app.inject({
      method: 'POST', url: '/admin/users/set-tier',
      headers: { authorization: basic }, payload: { phone: '09121800001', tier: 'premium' },
    });
    expect(res.statusCode).toBe(410);
    expect(res.json().replaced_by).toContain('POST /admin/subscriptions/grant-lifetime');
  });

  it('no longer manufactures a premium account with nothing behind it', async () => {
    await loginAs(app, '09121800001');
    await app.inject({
      method: 'POST', url: '/admin/users/set-tier',
      headers: { authorization: basic }, payload: { phone: '09121800001', tier: 'premium' },
    });

    // The exact shape migration 0019 had to clean up: premium, no subscription.
    const row = await pool.query('select tier from profiles where phone = $1', ['09121800001']);
    expect(row.rows[0].tier).toBe('free');
  });
});

describe('admin subscriptions', () => {
  const PHONE = '09121800002';
  const grant = (payload: Record<string, unknown>, url = '/admin/subscriptions/grant') =>
    app.inject({ method: 'POST', url, headers: { authorization: basic }, payload });

  it('requires admin auth on every subscription endpoint', async () => {
    for (const url of [
      '/admin/subscriptions/grant',
      '/admin/subscriptions/grant-lifetime',
      '/admin/subscriptions/revoke',
    ]) {
      const res = await app.inject({ method: 'POST', url, payload: { phone: PHONE, months: 6 } });
      expect(res.statusCode).toBe(401);
    }
    const read = await app.inject({ method: 'GET', url: `/admin/subscriptions?phone=${PHONE}` });
    expect(read.statusCode).toBe(401);
  });

  it('gifts N months and reports the resulting expiry', async () => {
    await loginAs(app, PHONE);

    const res = await grant({ phone: PHONE, months: 6 });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.is_premium).toBe(true);
    expect(body.subscription.is_founder).toBe(false);
    expect(body.subscription.expires_at).toBeTruthy();
    expect(body.days_left).toBeGreaterThan(175);

    const row = await pool.query('select tier from profiles where phone = $1', [PHONE]);
    expect(row.rows[0].tier).toBe('premium');
  });

  it('extends rather than replaces, so gifting never costs paid days', async () => {
    await loginAs(app, PHONE);
    const first = (await grant({ phone: PHONE, months: 6 })).json();
    const second = (await grant({ phone: PHONE, months: 1 })).json();

    expect(new Date(second.subscription.expires_at).getTime())
      .toBeGreaterThan(new Date(first.subscription.expires_at).getTime());
  });

  it('gifts a lifetime account with no end date', async () => {
    await loginAs(app, PHONE);

    const res = await grant({ phone: PHONE }, '/admin/subscriptions/grant-lifetime');
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.subscription.is_founder).toBe(true);
    expect(body.subscription.expires_at).toBeNull();
    expect(body.days_left).toBeNull();
    expect(body.is_premium).toBe(true);
  });

  it('will not let a months typo hand out a permanent account', async () => {
    await loginAs(app, PHONE);
    // 'lifetime' is not a month count — it is a different endpoint entirely.
    expect((await grant({ phone: PHONE, months: 'lifetime' })).statusCode).toBe(400);
    expect((await grant({ phone: PHONE, months: 0 })).statusCode).toBe(400);
    expect((await grant({ phone: PHONE, months: 61 })).statusCode).toBe(400);
    expect((await grant({ phone: PHONE, months: 1.5 })).statusCode).toBe(400);

    const read = await app.inject({
      method: 'GET', url: `/admin/subscriptions?phone=${PHONE}`, headers: { authorization: basic },
    });
    expect(read.json().subscription).toBeNull();
  });

  it('reads back the current state without changing it', async () => {
    await loginAs(app, PHONE);
    await grant({ phone: PHONE, months: 2 });

    const res = await app.inject({
      method: 'GET', url: `/admin/subscriptions?phone=${PHONE}`, headers: { authorization: basic },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().is_premium).toBe(true);
    expect(res.json().subscription.plan).toBe('paid');
  });

  it('reports no subscription for someone who has none', async () => {
    await loginAs(app, PHONE);
    const res = await app.inject({
      method: 'GET', url: `/admin/subscriptions?phone=${PHONE}`, headers: { authorization: basic },
    });
    expect(res.json().subscription).toBeNull();
    expect(res.json().is_premium).toBe(false);
    expect(res.json().days_left).toBeNull();
  });

  it('revokes a mistaken gift', async () => {
    await loginAs(app, PHONE);
    await grant({ phone: PHONE }, '/admin/subscriptions/grant-lifetime');

    const res = await grant({ phone: PHONE }, '/admin/subscriptions/revoke');
    expect(res.statusCode).toBe(200);
    expect(res.json().removed).toBe(true);
    expect(res.json().subscription).toBeNull();

    const again = await grant({ phone: PHONE }, '/admin/subscriptions/revoke');
    expect(again.json().removed).toBe(false);
  });

  it('404s anything that matches nobody, on every endpoint', async () => {
    expect((await grant({ phone: '09129999999', months: 6 })).statusCode).toBe(404);
    expect((await grant({ phone: '09129999999' }, '/admin/subscriptions/grant-lifetime')).statusCode).toBe(404);
    expect((await grant({ phone: '09129999999' }, '/admin/subscriptions/revoke')).statusCode).toBe(404);

    // 'not-a-phone' used to be 400 invalid_phone. Since these endpoints started
    // accepting a Telegram username as well, a non-numeric string is a perfectly
    // plausible handle — so the honest answer is "no such user", not "that is a
    // malformed phone number". 400 is now reserved for sending no identifier at
    // all. See test/admin-resolve-user.test.ts.
    expect((await grant({ phone: 'not-a-phone', months: 6 })).statusCode).toBe(404);
  });

  it('runs the sweep on demand, so a revoke can take effect without waiting for midnight', async () => {
    await loginAs(app, PHONE);
    await grant({ phone: PHONE }, '/admin/subscriptions/grant-lifetime');
    await grant({ phone: PHONE }, '/admin/subscriptions/revoke');

    const res = await app.inject({
      method: 'POST', url: '/admin/subscriptions/run-sweep', headers: { authorization: basic },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().demoted).toBe(1);

    const row = await pool.query('select tier from profiles where phone = $1', [PHONE]);
    expect(row.rows[0].tier).toBe('free');
  });

  it('repairs a tier that has fallen out of step with a valid subscription', async () => {
    await loginAs(app, PHONE);
    await grant({ phone: PHONE, months: 6 });
    await pool.query("update profiles set tier = 'free' where phone = $1", [PHONE]);

    const res = await app.inject({
      method: 'POST', url: '/admin/subscriptions/run-sweep', headers: { authorization: basic },
    });
    expect(res.json().promoted).toBe(1);
    const row = await pool.query('select tier from profiles where phone = $1', [PHONE]);
    expect(row.rows[0].tier).toBe('premium');
  });

  it('reports this month\'s gateway capacity, both counts side by side', async () => {
    const res = await app.inject({
      method: 'GET', url: '/admin/payments/capacity', headers: { authorization: basic },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.calendar).toBe('jalali');
    expect(body.cap_count).toBe(100);
    expect(body.any_plan_available).toBe(true);
    expect(body.plans.map((p: { months: number }) => p.months)).toEqual([1, 3, 6]);
    // The conservative figure that gates sales, and the verified one that says
    // what it actually cost — both, so the setting can be decided on evidence.
    expect(body).toHaveProperty('used_count');
    expect(body).toHaveProperty('used_count_verified');
  });

  it('guards the capacity readout behind admin auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/payments/capacity' });
    expect(res.statusCode).toBe(401);
  });

  it('guards the sweep behind admin auth like every other run endpoint', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/subscriptions/run-sweep' });
    expect(res.statusCode).toBe(401);
  });

  it('accepts the phone in any of the forms a human types it', async () => {
    await loginAs(app, PHONE); // stored normalized
    const res = await grant({ phone: '+98' + PHONE.slice(1), months: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.json().phone).toBe(PHONE);
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

describe('GET /admin/pillar — the «ستون» roster', () => {
  it('requires admin auth — the fill state is the founder\'s alone', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/pillar' });
    expect(res.statusCode).toBe(401);
  });

  it('reports seats in settle order, and stays open below fifty', async () => {
    // Two real accounts; the seat order must come from the ledger, not from
    // who signed up first.
    await loginAs(app, '09121710001');
    await loginAs(app, '09121710002');
    const uid = async (phone: string) => (await pool.query(
      'select id from profiles where phone = $1', [phone],
    )).rows[0].id;
    const seed = (userId: string, order: string, at: string) => pool.query(
      `insert into payments (user_id, amount_rial, months, gateway, order_id, status,
                             verified_at, period_jalali, period_gregorian)
       values ($1, 60000000, 6, 'zibal', $2, 'paid', $3,
               to_char(now(), 'YYYY-MM'), to_char(now(), 'YYYY-MM'))`,
      [userId, order, at],
    );
    await seed(await uid('09121710002'), 'second', '2026-08-02T09:00:00Z');
    await seed(await uid('09121710001'), 'first', '2026-08-01T09:00:00Z');

    const res = await app.inject({
      method: 'GET', url: '/admin/pillar', headers: { authorization: basic },
    });
    const body = res.json();
    expect(body.seats_total).toBe(51);
    expect(body.seats_taken).toBe(2);
    expect(body.open).toBe(true);
    // Seat order follows the money, not signup order and not insertion order.
    expect(body.holders.map((h: { seat: number; user_id: string }) => h.seat)).toEqual([1, 2]);
    expect(body.holders[0].user_id).toBe(await uid('09121710001'));

    // --- the retroactive welcome ------------------------------------------
    // First press thanks both never-thanked holders; the second press finds
    // the ledger already carries them and sends nothing.
    const first = await app.inject({
      method: 'POST', url: '/admin/pillar/welcome', headers: { authorization: basic },
    });
    expect(first.json()).toMatchObject({ ok: true, holders: 2, welcomed: 2, already: 0 });
    const logged = await pool.query(
      "select count(*)::int as n from notification_log where kind = 'pillar_seat' and delivered",
    );
    expect(logged.rows[0].n).toBe(2);

    const second = await app.inject({
      method: 'POST', url: '/admin/pillar/welcome', headers: { authorization: basic },
    });
    expect(second.json()).toMatchObject({ ok: true, holders: 2, welcomed: 0, already: 2 });
  });
});
