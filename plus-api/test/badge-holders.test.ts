import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getBadgeCatalog } from '../src/badges.js';

/**
 * نشان‌های کمیاب — the panel's «who reached this badge» view.
 *
 * It reads the announcement ledger, so the cases write ledger rows directly:
 * what is pinned is how those rows are COUNTED (a level includes the levels
 * above it), ORDERED (rarest held first, never-reached last) and DATED (a
 * silently seeded row carries no earning date).
 */

const auth = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

let app: FastifyInstance;
beforeEach(async () => { await resetDb(); app = await makeApp(); });
afterAll(async () => { await pool.end(); });

async function user(name: string, phone: string): Promise<string> {
  const p = await pool.query<{ id: string }>(
    'insert into profiles (display_name, phone) values ($1, $2) returning id', [name, phone]);
  return p.rows[0].id;
}

async function told(userId: string, key: string, level: number, seeded = false): Promise<void> {
  await pool.query(
    `insert into achievement_announcements (user_id, badge_key, level, announced_at, seen_at)
     values ($1, $2, $3, now(), case when $4 then now() else null end)`,
    [userId, key, level, seeded]);
}

const get = (url: string) => app.inject({ method: 'GET', url, headers: { authorization: auth } });
type Row = { key: string; level: number; holders: number; kind: string; level_fa: string; title_fa: string };

describe('GET /admin/badges/rarity', () => {
  it('counts a level with everything above it, and orders rarest-held first', async () => {
    const a = await user('الف', '09150000031');
    const b = await user('ب', '09150000032');
    const c = await user('پ', '09150000033');
    await told(a, 'flame', 2);
    await told(b, 'flame', 1);
    await told(c, 'flame', 0);
    await told(a, 'night_owl', 0);

    const res = await get('/admin/badges/rarity');
    expect(res.statusCode).toBe(200);
    const j = res.json() as { accounts: number; rows: Row[] };
    expect(j.accounts).toBe(3);
    const flame = (lv: number) => j.rows.find((r) => r.key === 'flame' && r.level === lv)!;
    expect([flame(0).holders, flame(1).holders, flame(2).holders]).toEqual([3, 2, 1]);
    expect(flame(2).level_fa).toBe('طلا');
    // Each row carries what the badge means, so the panel can explain it on a tap.
    expect(flame(2)).toMatchObject({ need_fa: '۱۰۰ روز' });
    expect((flame(2) as unknown as { unlock_fa: string; detail_fa: string }).unlock_fa.length).toBeGreaterThan(5);
    expect((flame(0) as unknown as { detail_fa: string }).detail_fa).toContain('استریک');
    const wayfarer = j.rows.find((r) => r.key === 'wayfarer' && r.level === 2) as unknown as { need_fa: string };
    expect(wayfarer.need_fa).toBe('همهٔ مسیرها');

    // Held ones first, ascending; nobody-yet ones after every held one.
    const held = j.rows.filter((r) => r.holders > 0).map((r) => r.holders);
    expect(held).toEqual([...held].sort((x, y) => x - y));
    const firstZero = j.rows.findIndex((r) => r.holders === 0);
    expect(firstZero).toBe(held.length);
    expect(j.rows[0].holders).toBe(1);
  });

  it('lists every catalog badge level, and a medal tier only once someone has it', async () => {
    const catalog = getBadgeCatalog();
    const expected = catalog.badges.reduce((n, b) => n + (b.leveled && b.levels?.length ? b.levels.length : 1), 0);
    const empty = (await get('/admin/badges/rarity')).json() as { rows: Row[] };
    expect(empty.rows.filter((r) => r.kind === 'badge')).toHaveLength(expected);
    expect(empty.rows.filter((r) => r.kind === 'medal')).toHaveLength(0);

    const a = await user('الف', '09150000034');
    await told(a, 'medal:medal_gold', 2);
    const j = (await get('/admin/badges/rarity')).json() as { rows: Row[] };
    const medals = j.rows.filter((r) => r.kind === 'medal');
    // Gold at tier 2 means gold at tier 1 was reached too.
    expect(medals.map((r) => r.level).sort()).toEqual([1, 2]);
    expect(medals.every((r) => r.holders === 1 && r.title_fa.startsWith('طلای'))).toBe(true);
  });
});

describe('GET /admin/badges/holders', () => {
  it('names who reached a level, highest first, and hides the date of a seeded row', async () => {
    const a = await user('الف', '09150000041');
    const b = await user('ب', '09150000042');
    const c = await user('پ', '09150000043');
    await told(a, 'flame', 2, true);
    await told(b, 'flame', 1);
    await told(c, 'flame', 0);

    const res = await get('/admin/badges/holders?badge=flame&level=1');
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.total).toBe(2);
    expect(j.level_fa).toBe('نقره');
    expect(j.rows.map((r: { user_id: string }) => r.user_id)).toEqual([a, b]);
    expect(j.rows[0]).toMatchObject({ display_name: 'الف', phone: '09150000041', level_fa: 'طلا', seeded: true });
    expect(j.rows[1]).toMatchObject({ level_fa: 'نقره', seeded: false });
  });

  it('404s a badge or level the catalog does not define', async () => {
    expect((await get('/admin/badges/holders?badge=nope&level=0')).statusCode).toBe(404);
    expect((await get('/admin/badges/holders?badge=flame&level=7')).statusCode).toBe(404);
    expect((await get('/admin/badges/holders?level=0')).statusCode).toBe(404);
    expect((await get('/admin/badges/holders?badge=flame&level=x')).statusCode).toBe(404);
  });
});

describe('the panel', () => {
  it('needs admin auth and carries the block', async () => {
    expect((await app.inject({ method: 'GET', url: '/admin/badges/rarity' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/admin/badges/holders?badge=flame' })).statusCode).toBe(401);
    const page = await get('/admin');
    expect(page.body).toContain('نشان‌های کمیاب');
    expect(page.body).toContain("get('/admin/badges/rarity'");
    expect(page.body).toContain('brNameBtn');
  });
});
