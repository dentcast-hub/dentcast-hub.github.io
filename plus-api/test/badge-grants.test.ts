// The granted-badge class («همراه»). Four properties carry the design:
//
//   1. What is written is the founder's DECISION, never the badge — the wall
//      still derives, so a grant row lights the badge and deleting it darkens
//      it, with no second source of truth to drift.
//   2. Granting is once per (user, badge): a repeat press changes nothing and,
//      critically, mints no second discount.
//   3. Only the catalog's granted class is grantable — «شعله» by typo must be
//      refused, not silently inserted.
//   4. The celebration comes free from the sync machinery, because the badge
//      is just another derived badge.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { grantableBadges } from '../src/badges.js';
import { drainAchievementSyncs } from '../src/services/achievement-sync.js';

let app: FastifyInstance;
let cookie: string;
const phone = '09121200088';

const basic = 'Basic '
  + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function grant(payload: Record<string, unknown>) {
  return app.inject({
    method: 'POST', url: '/admin/badges/grant',
    headers: { authorization: basic }, payload: { user: phone, badge: 'companion', ...payload },
  });
}

async function wall() {
  const res = await app.inject({ method: 'GET', url: '/achievements', headers: { cookie } });
  expect(res.statusCode).toBe(200);
  return res.json();
}

describe('the catalog registers the granted class', () => {
  it('contains «همراه» and nothing accidental', () => {
    const keys = grantableBadges().map((b) => b.key);
    expect(keys).toContain('companion');
    // Every member opted in by the convention (metric === grant:<own key>);
    // a computed-metric badge can never appear here.
    for (const b of grantableBadges()) expect(b.metric).toBe(`grant:${b.key}`);
  });
});

describe('POST /admin/badges/grant', () => {
  it('requires admin auth', async () => {
    const res = await app.inject({
      method: 'POST', url: '/admin/badges/grant', payload: { user: phone, badge: 'companion' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('lights the badge on the wall, derived from the grant row', async () => {
    // earned_only + unearned: the wall must not even list it beforehand.
    const before = await wall();
    expect(before.badges.find((b: { key: string }) => b.key === 'companion')).toBeUndefined();

    const res = await grant({ note: 'باگ درگاه را گزارش کرد' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.already).toBe(false);
    expect(body.discount_grant_id).toBeNull(); // no percent asked for -> no money

    const after = await wall();
    const b = after.badges.find((x: { key: string }) => x.key === 'companion');
    expect(b).toBeDefined();
    expect(b.earned).toBe(true);
    expect(b.metal).toBe('plain');
  });

  it('mints the optional discount as an ordinary grant credit, once', async () => {
    const res = await grant({ discount_percent: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.json().discount_grant_id).toBeTruthy();

    const credits = await pool.query(
      "select percent, kind, label_fa from discount_grants where kind = 'badge:companion'",
    );
    expect(credits.rowCount).toBe(1);
    expect(credits.rows[0].percent).toBe(5);
    expect(credits.rows[0].label_fa).toBe('همراه'); // the reader's surfaces name the badge

    // The repeat press: no new badge, and — the part that is money — no new credit.
    const again = await grant({ discount_percent: 5 });
    expect(again.statusCode).toBe(200);
    expect(again.json().already).toBe(true);
    expect(again.json().discount_grant_id).toBeNull();
    const grants = await pool.query('select count(*)::int as n from discount_grants');
    expect(grants.rows[0].n).toBe(1);
    const rows = await pool.query('select count(*)::int as n from badge_grants');
    expect(rows.rows[0].n).toBe(1);
  });

  it('refuses a badge outside the granted class, naming the legal keys', async () => {
    const res = await grant({ badge: 'flame' });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('not_grantable');
    expect(body.grantable).toContain('companion');
    const rows = await pool.query('select count(*)::int as n from badge_grants');
    expect(rows.rows[0].n).toBe(0);
  });

  it('celebrates through the same machinery as every derived badge', async () => {
    await grant({});
    await drainAchievementSyncs(); // the grant pokes a fire-and-forget sync
    const res = await app.inject({
      method: 'GET', url: '/achievements/pending', headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const items = res.json().items as { key: string; title_fa: string }[];
    expect(items.map((i) => i.key)).toContain('companion');
  });
});

describe('POST /admin/badges/revoke', () => {
  it('darkens the badge by deleting the decision, and says so honestly', async () => {
    await grant({});
    const res = await app.inject({
      method: 'POST', url: '/admin/badges/revoke',
      headers: { authorization: basic }, payload: { user: phone, badge: 'companion' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().removed).toBe(true);

    // earned_only + no longer earned -> gone from the wall entirely.
    const after = await wall();
    expect(after.badges.find((b: { key: string }) => b.key === 'companion')).toBeUndefined();

    // Revoking what was never granted is a no-op that says so.
    const again = await app.inject({
      method: 'POST', url: '/admin/badges/revoke',
      headers: { authorization: basic }, payload: { user: phone, badge: 'companion' },
    });
    expect(again.json().removed).toBe(false);
  });
});

describe('GET /admin/badges/grants', () => {
  it('lists one account\'s grants and the grantable keys', async () => {
    await grant({ note: 'ممنون' });
    const res = await app.inject({
      method: 'GET', url: `/admin/badges/grants?user=${phone}`,
      headers: { authorization: basic },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.grants.map((g: { badge_key: string }) => g.badge_key)).toEqual(['companion']);
    expect(body.grants[0].note).toBe('ممنون');
    expect(body.grantable.map((g: { key: string }) => g.key)).toContain('companion');
  });
});
