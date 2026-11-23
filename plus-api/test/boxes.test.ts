// کادرهای ذخیره‌شده — the saved-box routes (routes/boxes.ts, migration 0079).
//
// What must hold:
//   · saving a box is premium; reading one page's saved boxes, deleting and
//     exporting stay on any plan, so a lapsed subscriber keeps what they saved;
//   · one box is one row per reader: a second save of the same words (even
//     with different whitespace) returns the row it already has;
//   · the library groups by article, the دفترچه's shape;
//   · a profile merge keeps a box both accounts saved once.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { MAX_BOX_TEXT, foldBoxText } from '../src/routes/boxes.js';
import { mergeProfiles } from '../src/services/merge-profiles.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

const PAGE = 'sharehub/share-10';
const TIP = 'resistance form عمدتاً در مرحلهٔ تراش تعیین می‌شود، نه در لابراتوار.';

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  phone = '09121200208';
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function setTier(tier: 'free' | 'premium', p = phone): Promise<void> {
  await pool.query(`update profiles set tier = $2 where phone = $1`, [p, tier]);
}

function save(payload: Record<string, unknown>, c = cookie) {
  return app.inject({ method: 'POST', url: '/boxes', headers: { cookie: c }, payload });
}

describe('gates', () => {
  it('refuses an anonymous caller everywhere with 401', async () => {
    for (const [method, url] of [['GET', '/boxes?content_id=' + PAGE], ['GET', '/boxes/library'], ['POST', '/boxes'], ['DELETE', '/boxes/00000000-0000-0000-0000-000000000000']] as const) {
      const res = await app.inject({ method, url, payload: method === 'POST' ? { content_id: PAGE, text: TIP } : undefined });
      expect(res.statusCode, `${method} ${url}`).toBe(401);
    }
  });

  it('saving is premium: a free reader gets 402 and nothing is written', async () => {
    const res = await save({ content_id: PAGE, text: TIP, label: 'نکته‌ی بالینی' });
    expect(res.statusCode).toBe(402);
    expect(res.json().error).toBe('premium_required');
    const n = await pool.query('select count(*)::int as n from saved_boxes');
    expect(n.rows[0].n).toBe(0);
  });

  it('the library is premium; the per-page list is not', async () => {
    expect((await app.inject({ method: 'GET', url: '/boxes/library', headers: { cookie } })).statusCode).toBe(402);
    const list = await app.inject({ method: 'GET', url: '/boxes?content_id=' + PAGE, headers: { cookie } });
    expect(list.statusCode).toBe(200);
    expect(list.json().boxes).toEqual([]);
  });

  it('a lapsed subscriber still sees, deletes and exports a saved box', async () => {
    await setTier('premium');
    const box = (await save({ content_id: PAGE, text: TIP, label: 'نکته‌ی بالینی' })).json().box;
    await setTier('free');

    const list = await app.inject({ method: 'GET', url: '/boxes?content_id=' + PAGE, headers: { cookie } });
    expect(list.json().boxes.map((b: any) => b.id)).toEqual([box.id]);

    const exp = await app.inject({ method: 'GET', url: '/export/highlights', headers: { cookie } });
    expect(exp.statusCode).toBe(200);
    expect(exp.json().boxes).toEqual([expect.objectContaining({ content_id: PAGE, label: 'نکته‌ی بالینی', text: TIP })]);

    const del = await app.inject({ method: 'DELETE', url: '/boxes/' + box.id, headers: { cookie } });
    expect(del.statusCode).toBe(200);
    const again = await app.inject({ method: 'DELETE', url: '/boxes/' + box.id, headers: { cookie } });
    expect(again.statusCode).toBe(404);
  });
});

describe('saving', () => {
  beforeEach(async () => { await setTier('premium'); });

  it('keeps the words, the label and the page', async () => {
    const res = await save({ content_id: PAGE, text: TIP, label: 'نکته‌ی بالینی' });
    expect(res.statusCode).toBe(201);
    expect(res.json().box).toMatchObject({ content_id: PAGE, label: 'نکته‌ی بالینی', text: TIP });
  });

  it('a frame-alone box has no label of ours, and that is fine', async () => {
    const res = await save({ content_id: PAGE, text: 'Clinical Tip: ' + TIP });
    expect(res.statusCode).toBe(201);
    expect(res.json().box.label).toBeNull();
  });

  it('the same box saved twice is one row — whitespace does not make a second', async () => {
    const a = await save({ content_id: PAGE, text: TIP });
    const b = await save({ content_id: PAGE, text: '  ' + TIP.replace(/ /g, '\n  ') + ' ' });
    expect(a.statusCode).toBe(201);
    expect(b.statusCode).toBe(200);
    expect(b.json().box.id).toBe(a.json().box.id);
    const n = await pool.query('select count(*)::int as n from saved_boxes');
    expect(n.rows[0].n).toBe(1);
  });

  it('the same words on another page are another box', async () => {
    await save({ content_id: PAGE, text: TIP });
    const other = await save({ content_id: 'insight/insight-51', text: TIP });
    expect(other.statusCode).toBe(201);
  });

  it('refuses what a page could not have produced', async () => {
    expect((await save({ content_id: 'not a path', text: TIP })).json().error).toBe('invalid_content_id');
    expect((await save({ content_id: PAGE, text: '   ' })).json().error).toBe('empty_box');
    expect((await save({ content_id: PAGE, text: 'x'.repeat(MAX_BOX_TEXT + 1) })).json().error).toBe('box_too_long');
    expect((await save({ content_id: PAGE, text: TIP, label: 'ب'.repeat(81) })).json().error).toBe('invalid_label');
  });

  it('a reader deletes only their own box', async () => {
    const box = (await save({ content_id: PAGE, text: TIP })).json().box;
    const other = await loginAs(app, '09121200209');
    const res = await app.inject({ method: 'DELETE', url: '/boxes/' + box.id, headers: { cookie: other } });
    expect(res.statusCode).toBe(404);
    const bad = await app.inject({ method: 'DELETE', url: '/boxes/nope', headers: { cookie } });
    expect(bad.statusCode).toBe(404);
  });
});

describe('the library', () => {
  it('groups by article, newest article first, boxes in saved order', async () => {
    await setTier('premium');
    await save({ content_id: PAGE, text: 'اول', label: 'نکته‌ی بالینی' });
    await save({ content_id: 'insight/insight-51', text: 'دوم' });
    await save({ content_id: PAGE, text: 'سوم', label: 'نتیجه' });
    const res = await app.inject({ method: 'GET', url: '/boxes/library', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(3);
    expect(body.article_count).toBe(2);
    expect(body.articles[0].content_id).toBe(PAGE);
    expect(body.articles[0].boxes.map((b: any) => b.text)).toEqual(['اول', 'سوم']);
    expect(body.articles[0]).toHaveProperty('last_box_at');
    expect(body.articles[1].count).toBe(1);
  });
});

describe('profile merge', () => {
  it('a box both accounts saved stays once; the rest moves', async () => {
    await setTier('premium');
    await save({ content_id: PAGE, text: TIP });
    await save({ content_id: PAGE, text: 'فقط در حساب اول' });
    const p2 = '09121200210';
    const c2 = await loginAs(app, p2);
    await setTier('premium', p2);
    await save({ content_id: PAGE, text: TIP }, c2);

    const ids = await pool.query<{ id: string; phone: string }>(`select id, phone from profiles where phone in ($1, $2)`, [phone, p2]);
    const from = ids.rows.find((r) => r.phone === phone)!.id;
    const to = ids.rows.find((r) => r.phone === p2)!.id;
    const client = await pool.connect();
    try {
      await client.query('begin');
      await mergeProfiles(client, from, to);
      await client.query('commit');
    } finally { client.release(); }

    const rows = await pool.query(`select text from saved_boxes where user_id = $1 order by text`, [to]);
    expect(rows.rows.map((r) => r.text).sort()).toEqual([TIP, 'فقط در حساب اول'].sort());
  });
});

describe('foldBoxText', () => {
  it('collapses whitespace and trims, nothing else', () => {
    expect(foldBoxText('  a\n\tb  ')).toBe('a b');
    expect(foldBoxText('نکته‌ی بالینی')).toBe('نکته‌ی بالینی'); // ZWNJ is not a space
  });
});
