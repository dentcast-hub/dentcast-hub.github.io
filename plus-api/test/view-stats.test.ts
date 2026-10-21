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

const me = (cookie?: string) =>
  app.inject({ method: 'GET', url: '/me', ...(cookie ? { headers: { cookie } } : {}) });

const view = (cookie?: string) =>
  app.inject({ method: 'POST', url: '/pageview', ...(cookie ? { headers: { cookie } } : {}) });

const spot = (event: string, contentId: string, cookie?: string) =>
  app.inject({
    method: 'POST',
    url: cookie ? '/activity' : '/anon/event',
    payload: cookie ? { action: event, content_id: contentId } : { event, content_id: contentId },
    ...(cookie ? { headers: { cookie } } : {}),
  });

async function viewRows(): Promise<Array<{ viewer: string; count: number }>> {
  return (await pool.query('select viewer, count from view_stats order by viewer')).rows;
}

describe('page-view counter (the Spot denominator)', () => {
  it('counts a guest page view even though /me answers 401', async () => {
    for (let i = 0; i < 3; i += 1) expect((await me()).statusCode).toBe(401);
    expect(await viewRows()).toEqual([]); // repeated /me is NOT repeated traffic
    for (let i = 0; i < 3; i += 1) expect((await view()).statusCode).toBe(204);
    expect(await viewRows()).toEqual([{ viewer: 'anon', count: 3 }]);
  });

  it('labels a signed-in page view from the session, not the client', async () => {
    const cookie = await loginAs(app, '09120000001');
    expect((await me(cookie)).statusCode).toBe(200);
    await me(); // a guest in the same window
    await view(cookie);
    await view();

    expect(await viewRows()).toEqual([
      { viewer: 'anon', count: 1 },
      { viewer: 'plus', count: 1 },
    ]);
  });

  it('keeps premium page views out of the plus bucket', async () => {
    const cookie = await loginAs(app, '09120000002');
    await pool.query("update profiles set tier = 'premium'");
    await me(cookie);
    await view(cookie);
    expect(await viewRows()).toEqual([{ viewer: 'premium', count: 1 }]);
  });

  it('reports impressions per page view, per viewer class', async () => {
    const cookie = await loginAs(app, '09120000003');
    // 1 signed-in page view, 4 guest views. /me refreshes are ignored.
    await view(cookie);
    for (let i = 0; i < 4; i += 1) await view();
    await me(cookie);
    await me(cookie);
    // 1 impression each side.
    expect((await spot('spot_impression', 'home:premium')).statusCode).toBe(204);
    expect((await spot('spot_impression', 'home:brand-invite', cookie)).json()).toMatchObject({ counted: true });

    const res = await app.inject({
      method: 'GET',
      url: `/admin/spot/stats?from=${today()}&to=${today()}&group_by=day`,
      headers: { authorization: basic },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();

    expect(body.page_views.totals).toEqual({ anon: 4, plus: 1, premium: 0 });
    expect(body.page_views.since).toBe(today());
    expect(body.page_views.by_period).toEqual([{ period: today(), anon: 4, plus: 1, premium: 0 }]);
    // The number the report is about: one guest impression per four guest views.
    expect(body.impressions_per_view).toEqual({ anon: 0.25, plus: 1 });
  });

  it('reports a null ratio — never 0 — for a window with no page-view data', async () => {
    await spot('spot_impression', 'home:premium'); // an impression without a pageview

    const res = await app.inject({
      method: 'GET',
      url: `/admin/spot/stats?from=${today()}&to=${today()}&group_by=day`,
      headers: { authorization: basic },
    });
    const body = res.json();
    expect(body.totals.impressions).toBe(1);
    expect(body.page_views.totals).toEqual({ anon: 0, plus: 0, premium: 0 });
    expect(body.page_views.since).toBe(null);
    expect(body.impressions_per_view).toEqual({ anon: null, plus: null });
  });
});
