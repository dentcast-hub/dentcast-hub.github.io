import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { dayInTz } from '../src/services/time.js';

let app: FastifyInstance;

const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');
const today = () => dayInTz(new Date());

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function anonSpot(event: string, content_id?: string, cookie?: string) {
  return app.inject({
    method: 'POST',
    url: '/anon/event',
    payload: { event, content_id },
    ...(cookie ? { headers: { cookie } } : {}),
  });
}

describe('spot telemetry — guest path', () => {
  it('counts an impression instead of logging a row', async () => {
    for (let i = 0; i < 3; i += 1) expect((await anonSpot('spot_impression', 'home:sponsor-x')).statusCode).toBe(204);
    expect((await anonSpot('spot_click', 'home:sponsor-x')).statusCode).toBe(204);

    const rows = await pool.query('select * from spot_stats order by kind');
    expect(rows.rowCount).toBe(2);
    expect(rows.rows[0]).toMatchObject({
      day: today(), slot: 'home', creative: 'sponsor-x', viewer: 'anon', kind: 'click', count: 1,
    });
    expect(rows.rows[1]).toMatchObject({ kind: 'impression', count: 3 });

    // Never a raw event row: that is the whole point of the aggregate table.
    const anon = await pool.query('select count(*)::int as n from anon_events');
    expect(anon.rows[0].n).toBe(0);
  });

  it('keeps each (slot, creative, kind) on its own counter', async () => {
    await anonSpot('spot_impression', 'home:premium');
    await anonSpot('spot_impression', 'article:premium');
    await anonSpot('spot_impression', 'article:sponsor-x');
    const rows = await pool.query('select count(*)::int as n from spot_stats');
    expect(rows.rows[0].n).toBe(3);
  });

  it('rejects an unknown slot and a malformed content_id', async () => {
    for (const bad of [undefined, 'home', ':premium', 'sidebar:premium', 'home:', 'home:بد']) {
      const res = await anonSpot('spot_impression', bad);
      expect(res.statusCode, String(bad)).toBe(400);
      expect(res.json().error).toBe('invalid_content_id');
    }
    const rows = await pool.query('select count(*)::int as n from spot_stats');
    expect(rows.rows[0].n).toBe(0);
  });

  it('labels the viewer from the session cookie, not the endpoint', async () => {
    const cookie = await loginAs(app, '09121110001');
    await anonSpot('spot_impression', 'home:premium', cookie);
    await anonSpot('spot_impression', 'home:premium');
    const rows = await pool.query('select viewer, count from spot_stats order by viewer');
    expect(rows.rows.map((r) => r.viewer)).toEqual(['anon', 'plus']);
  });

  it('still rejects a non-whitelisted anonymous event', async () => {
    const res = await anonSpot('something_else');
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('event_not_allowed');
  });
});

describe('spot telemetry — signed-in path', () => {
  it('counts as plus and never touches user_activity, streak or XP', async () => {
    const cookie = await loginAs(app, '09121110002');
    const res = await app.inject({
      method: 'POST',
      url: '/activity',
      headers: { cookie },
      payload: { action: 'spot_impression', content_id: 'dashboard:premium', meta: { x: 1 } },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, counted: true });

    const stats = await pool.query('select * from spot_stats');
    expect(stats.rows[0]).toMatchObject({ slot: 'dashboard', viewer: 'plus', kind: 'impression', count: 1 });

    const log = await pool.query("select count(*)::int as n from user_activity where action like 'spot%'");
    expect(log.rows[0].n).toBe(0);
    const profile = await pool.query('select current_streak from profiles');
    expect(profile.rows[0].current_streak).toBe(0);
  });

  it('rejects a malformed content_id', async () => {
    const cookie = await loginAs(app, '09121110003');
    const res = await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'spot_click', content_id: 'nope:premium' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_content_id');
  });

  it('requires a session', async () => {
    const res = await app.inject({
      method: 'POST', url: '/activity', payload: { action: 'spot_click', content_id: 'home:premium' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /admin/spot/stats', () => {
  it('is founder-only', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/spot/stats' });
    expect(res.statusCode).toBe(401);
  });

  it('returns totals and the slot/creative/viewer cross-cuts', async () => {
    const cookie = await loginAs(app, '09121110004');
    await anonSpot('spot_impression', 'home:sponsor-x');
    await anonSpot('spot_impression', 'home:sponsor-x');
    await anonSpot('spot_click', 'home:sponsor-x');
    await anonSpot('spot_impression', 'article:premium');
    await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'spot_impression', content_id: 'home:sponsor-x' },
    });

    const res = await app.inject({
      method: 'GET', url: '/admin/spot/stats', headers: { authorization: basic },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.totals).toEqual({ impressions: 4, clicks: 1, ctr_pct: 25 });
    expect(body.by_slot).toEqual([
      { slot: 'home', impressions: 3, clicks: 1, ctr_pct: 33.3 },
      { slot: 'article', impressions: 1, clicks: 0, ctr_pct: 0 },
    ]);
    expect(body.by_creative.find((c: any) => c.creative === 'sponsor-x'))
      .toMatchObject({ impressions: 3, clicks: 1 });
    expect(body.by_viewer).toEqual([
      { viewer: 'anon', impressions: 3, clicks: 1, ctr_pct: 33.3 },
      { viewer: 'plus', impressions: 1, clicks: 0, ctr_pct: 0 },
    ]);
    expect(body.by_period).toEqual([{ period: today(), impressions: 4, clicks: 1, ctr_pct: 25 }]);
    expect(body.rows.length).toBe(3); // home/sponsor-x/anon, home/sponsor-x/plus, article/premium/anon
  });

  it('honours the date window', async () => {
    await anonSpot('spot_impression', 'home:premium');
    const res = await app.inject({
      method: 'GET',
      url: '/admin/spot/stats?from=2020-01-01&to=2020-01-31',
      headers: { authorization: basic },
    });
    expect(res.json().totals).toEqual({ impressions: 0, clicks: 0, ctr_pct: null });
  });

  it('groups by week (Saturday start) and month', async () => {
    await pool.query(
      `insert into spot_stats (day, slot, creative, viewer, kind, count) values
         ('2026-07-18', 'home', 'premium', 'anon', 'impression', 5),
         ('2026-07-19', 'home', 'premium', 'anon', 'impression', 7),
         ('2026-06-30', 'home', 'premium', 'anon', 'impression', 2)`,
    );
    const url = (g: string) => `/admin/spot/stats?from=2026-06-01&to=2026-07-31&group_by=${g}`;

    const week = (await app.inject({ method: 'GET', url: url('week'), headers: { authorization: basic } })).json();
    // 2026-07-18 is a Saturday: it opens its own week; 07-19 (Sunday) joins it.
    expect(week.by_period).toEqual([
      { period: '2026-07-18', impressions: 12, clicks: 0, ctr_pct: 0 },
      { period: '2026-06-27', impressions: 2, clicks: 0, ctr_pct: 0 },
    ]);

    const month = (await app.inject({ method: 'GET', url: url('month'), headers: { authorization: basic } })).json();
    expect(month.by_period).toEqual([
      { period: '2026-07-01', impressions: 12, clicks: 0, ctr_pct: 0 },
      { period: '2026-06-01', impressions: 2, clicks: 0, ctr_pct: 0 },
    ]);
  });

  it('rejects bad params', async () => {
    const bad = ['?from=07-2026', '?to=2026-02-31', '?from=2026-07-10&to=2026-07-01', '?group_by=hour'];
    for (const q of bad) {
      const res = await app.inject({ method: 'GET', url: '/admin/spot/stats' + q, headers: { authorization: basic } });
      expect(res.statusCode, q).toBe(400);
    }
  });
});
