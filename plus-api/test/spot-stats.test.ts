import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { readFile } from 'node:fs/promises';
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

  // The regression this guards is invisible from the outside: `pillar` and
  // `episode` were added to spot-config.json on 2026-07-28 but not to
  // SPOT_SLOTS, so both slots rendered, were seen, and had every event
  // rejected 400 — reported for two days as zero demand rather than as a
  // dropped pipeline. A closed vocabulary has to be widened on both sides.
  it('accepts every slot spot-config.json enables', async () => {
    const cfg = JSON.parse(
      await readFile(new URL('../../spot/spot-config.json', import.meta.url), 'utf8'),
    ) as { slots: Record<string, { enabled: boolean }> };
    const configured = Object.keys(cfg.slots);
    expect(configured.length).toBeGreaterThan(0);
    for (const slot of configured) {
      const res = await anonSpot('spot_impression', `${slot}:premium`);
      expect(res.statusCode, `slot "${slot}" is in spot-config.json but not in SPOT_SLOTS`).toBe(204);
    }
    const rows = await pool.query('select count(distinct slot)::int as n from spot_stats');
    expect(rows.rows[0].n).toBe(configured.length);
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

  // The ad report's own question: each rotation beat (a creative holding one of
  // the four steps) with WHERE its impressions landed. The two percentages have
  // different denominators on purpose — the creative's is the window's total,
  // the slot's is that creative's own — so a creative's slots always sum to 100.
  it('breaks each creative down by slot, with both percentages', async () => {
    await anonSpot('spot_impression', 'home:sponsor-x');
    await anonSpot('spot_impression', 'home:sponsor-x');
    await anonSpot('spot_impression', 'article:sponsor-x');
    await anonSpot('spot_click', 'home:sponsor-x');
    await anonSpot('spot_impression', 'home:premium');

    const res = await app.inject({
      method: 'GET', url: '/admin/spot/stats', headers: { authorization: basic },
    });
    const body = res.json();

    expect(body.by_creative_slot).toEqual([
      {
        creative: 'sponsor-x',
        impressions: 3,
        clicks: 1,
        ctr_pct: 33.3,
        share_pct: 75, // 3 of the window's 4 impressions
        slots: [
          { slot: 'home', impressions: 2, clicks: 1, ctr_pct: 50, share_pct: 66.7 },
          { slot: 'article', impressions: 1, clicks: 0, ctr_pct: 0, share_pct: 33.3 },
        ],
      },
      {
        creative: 'premium',
        impressions: 1,
        clicks: 0,
        ctr_pct: 0,
        share_pct: 25,
        slots: [{ slot: 'home', impressions: 1, clicks: 0, ctr_pct: 0, share_pct: 100 }],
      },
    ]);
    // The nested view must never disagree with the flat one it is derived from.
    const flat = body.by_creative.map((c: any) => [c.creative, c.impressions, c.clicks]);
    expect(body.by_creative_slot.map((c: any) => [c.creative, c.impressions, c.clicks])).toEqual(flat);
  });

  it('reports an empty window as no data, never as a zero share', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/admin/spot/stats?from=2020-01-01&to=2020-01-31',
      headers: { authorization: basic },
    });
    expect(res.json().by_creative_slot).toEqual([]);
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
      `insert into spot_stats (day, slot, creative, viewer, kind, host, count) values
         ('2026-07-18', 'home', 'premium', 'anon', 'impression', 'dentcast.ir', 5),
         ('2026-07-19', 'home', 'premium', 'anon', 'impression', 'dentcast.ir', 7),
         ('2026-06-30', 'home', 'premium', 'anon', 'impression', 'dentcast.org', 2)`,
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

// --- host dimension (D2) ----------------------------------------------------
// The blind spot this closes: on 2026-07-27 a report could not answer "how much
// of this came from .ir vs .org", and ruling out a broken mirror by hand cost a
// full investigation.

async function spotFrom(origin: string | undefined, content_id: string, referer?: string) {
  const headers: Record<string, string> = {};
  if (origin) headers.origin = origin;
  if (referer) headers.referer = referer;
  return app.inject({
    method: 'POST', url: '/anon/event', headers,
    payload: { event: 'spot_impression', content_id },
  });
}
async function statsWith(qs: string) {
  const res = await app.inject({
    method: 'GET', url: `/admin/spot/stats?from=${today()}&to=${today()}${qs}`,
    headers: { authorization: basic },
  });
  return res;
}

describe('spot telemetry — host dimension', () => {
  it('derives the mirror from Origin, and splits the report by it', async () => {
    await spotFrom('https://dentcast.ir', 'home:premium');
    await spotFrom('https://dentcast.ir', 'home:premium');
    await spotFrom('https://dentcast.org', 'home:premium');

    const body = (await statsWith('')).json();
    const hosts = Object.fromEntries(body.by_host.map((h: { host: string; impressions: number }) => [h.host, h.impressions]));
    expect(hosts['dentcast.ir']).toBe(2);
    expect(hosts['dentcast.org']).toBe(1);
    expect(body.totals.impressions).toBe(3);
  });

  it('folds www. into the bare domain — one site, one number', async () => {
    await spotFrom('https://www.dentcast.ir', 'home:premium');
    await spotFrom('https://dentcast.ir', 'home:premium');

    const body = (await statsWith('')).json();
    expect(body.by_host).toEqual([
      expect.objectContaining({ host: 'dentcast.ir', impressions: 2 }),
    ]);
  });

  it('falls back to Referer, and records anything else as unknown — never a guess', async () => {
    await spotFrom(undefined, 'home:premium', 'https://dentcast.org/episodes.html');
    await spotFrom('https://somewhere-else.example', 'home:premium');
    await spotFrom(undefined, 'home:premium');

    const body = (await statsWith('')).json();
    const hosts = Object.fromEntries(body.by_host.map((h: { host: string; impressions: number }) => [h.host, h.impressions]));
    expect(hosts['dentcast.org']).toBe(1);
    expect(hosts.unknown).toBe(2);
  });

  it('does NOT let the client label its own traffic', async () => {
    // A body claiming .org while the headers say .ir must be recorded as .ir.
    await app.inject({
      method: 'POST', url: '/anon/event', headers: { origin: 'https://dentcast.ir' },
      payload: { event: 'spot_impression', content_id: 'home:premium', host: 'dentcast.org' },
    });
    const body = (await statsWith('')).json();
    expect(body.by_host).toEqual([expect.objectContaining({ host: 'dentcast.ir', impressions: 1 })]);
  });

  it('filters to one mirror, and rejects an unknown filter instead of ignoring it', async () => {
    await spotFrom('https://dentcast.ir', 'home:premium');
    await spotFrom('https://dentcast.org', 'home:premium');

    const ir = (await statsWith('&host=dentcast.ir')).json();
    expect(ir.totals.impressions).toBe(1);
    expect(ir.by_host).toEqual([expect.objectContaining({ host: 'dentcast.ir' })]);

    const bad = await statsWith('&host=example.com');
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error).toBe('invalid_host');
  });

  it('keeps the signed-in path labelled too', async () => {
    const cookie = await loginAs(app, '09121110001');
    await app.inject({
      method: 'POST', url: '/activity', headers: { cookie, origin: 'https://dentcast.ir' },
      payload: { action: 'spot_impression', content_id: 'article:premium' },
    });
    const body = (await statsWith('')).json();
    expect(body.by_host).toEqual([expect.objectContaining({ host: 'dentcast.ir', impressions: 1 })]);
    expect(body.by_viewer).toEqual([expect.objectContaining({ viewer: 'plus' })]);
  });
});
