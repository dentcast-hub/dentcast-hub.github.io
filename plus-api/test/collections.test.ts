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
  phone = '09121200003';
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function makePremium(): Promise<void> {
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
}

async function createCollection(title = 'کیس‌های ایمپلنت پیچیده'): Promise<string> {
  const res = await app.inject({
    method: 'POST', url: '/collections', headers: { cookie }, payload: { title },
  });
  return res.json().collection.id as string;
}

async function createHighlight(contentId = 'insight/insight-1'): Promise<string> {
  const res = await app.inject({
    method: 'POST', url: '/highlights', headers: { cookie },
    payload: { content_id: contentId, exact: 'یک متن هایلایت‌شده برای تست' },
  });
  return res.json().highlight.id as string;
}

describe('requirePremium gate', () => {
  it('blocks a free user with 402 on every collections route', async () => {
    const list = await app.inject({ method: 'GET', url: '/collections', headers: { cookie } });
    expect(list.statusCode).toBe(402);
    const create = await app.inject({ method: 'POST', url: '/collections', headers: { cookie }, payload: { title: 'x' } });
    expect(create.statusCode).toBe(402);
  });

  it('blocks an unauthenticated request with 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/collections' });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /collections', () => {
  it('creates an empty collection', async () => {
    await makePremium();
    const res = await app.inject({
      method: 'POST', url: '/collections', headers: { cookie }, payload: { title: 'برای امتحان' },
    });
    expect(res.statusCode).toBe(201);
    const { collection } = res.json();
    expect(collection.title).toBe('برای امتحان');
    expect(collection.item_count).toBe(0);
  });

  it('rejects an empty title', async () => {
    await makePremium();
    const res = await app.inject({ method: 'POST', url: '/collections', headers: { cookie }, payload: { title: '' } });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /collections', () => {
  it('lists the user\'s own collections with item counts', async () => {
    await makePremium();
    const id = await createCollection('کیس‌ها');
    const hl = await createHighlight();
    await app.inject({ method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { highlight_id: hl } });

    const res = await app.inject({ method: 'GET', url: '/collections', headers: { cookie } });
    const list = res.json().collections;
    expect(list).toHaveLength(1);
    expect(list[0].item_count).toBe(1);
  });

  it('carries a preview (kind/color/type) of its most recent items, for the board cover', async () => {
    await makePremium();
    const id = await createCollection();
    await app.inject({
      method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { content_id: 'episodes/episode-2' },
    });
    const hl = await createHighlight('insight/insight-1');
    await pool.query(`update highlights set color = 'yellow' where id = $1`, [hl]);
    await app.inject({ method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { highlight_id: hl } });

    const res = await app.inject({ method: 'GET', url: '/collections', headers: { cookie } });
    const preview = res.json().collections[0].preview;
    expect(preview).toHaveLength(2);
    const highlightPreview = preview.find((p) => p.kind === 'highlight');
    const pagePreview = preview.find((p) => p.kind === 'page');
    expect(highlightPreview.color).toBe('yellow');
    expect(highlightPreview.type).toBe('insight');
    expect(pagePreview.color).toBeNull();
    expect(pagePreview.type).toBe('episodes');
  });

  // The catalog sorts by "last added to", so the list endpoint has to answer
  // that question. It is DERIVED from the items (max created_at), never stored,
  // so it can never drift from the board's real contents.
  it('reports when each board was last added to, and null while it is empty', async () => {
    await makePremium();
    const empty = await createCollection('خالی');
    const filled = await createCollection('پر');
    const hl = await createHighlight('insight/insight-1');
    await app.inject({ method: 'POST', url: `/collections/${filled}/items`, headers: { cookie }, payload: { highlight_id: hl } });

    const res = await app.inject({ method: 'GET', url: '/collections', headers: { cookie } });
    const byId = Object.fromEntries(res.json().collections.map((c) => [c.id, c]));
    expect(byId[empty].last_item_at).toBeNull();
    expect(byId[empty].item_count).toBe(0);
    expect(byId[filled].last_item_at).toBeTruthy();
    expect(new Date(byId[filled].last_item_at).getTime()).toBeGreaterThan(0);
  });

  it('never lists another user\'s collection', async () => {
    await makePremium();
    await createCollection();
    const otherCookie = await loginAs(app, '09121200004');
    await pool.query(`update profiles set tier = 'premium' where phone = '09121200004'`);
    const res = await app.inject({ method: 'GET', url: '/collections', headers: { cookie: otherCookie } });
    expect(res.json().collections).toHaveLength(0);
  });
});

describe('POST /collections/:id/items', () => {
  it('adds a highlight item, resolved with title/url/type', async () => {
    await makePremium();
    const id = await createCollection();
    const hl = await createHighlight('insight/insight-1');

    const res = await app.inject({
      method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { highlight_id: hl },
    });
    expect(res.statusCode).toBe(201);
    const { item } = res.json();
    expect(item.kind).toBe('highlight');
    expect(item.content_id).toBe('insight/insight-1');
    expect(item.exact).toBe('یک متن هایلایت‌شده برای تست');
    expect(typeof item.title).toBe('string');
    expect(typeof item.url).toBe('string');
  });

  it('adds a whole-page item with no highlight', async () => {
    await makePremium();
    const id = await createCollection();
    const res = await app.inject({
      method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { content_id: 'episodes/episode-2' },
    });
    expect(res.statusCode).toBe(201);
    const { item } = res.json();
    expect(item.kind).toBe('page');
    expect(item.exact).toBeNull();
  });

  it('is idempotent: adding the same highlight twice yields one item', async () => {
    await makePremium();
    const id = await createCollection();
    const hl = await createHighlight();
    await app.inject({ method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { highlight_id: hl } });
    await app.inject({ method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { highlight_id: hl } });

    const detail = await app.inject({ method: 'GET', url: `/collections/${id}`, headers: { cookie } });
    expect(detail.json().items).toHaveLength(1);
  });

  it('is idempotent for whole-page items too', async () => {
    await makePremium();
    const id = await createCollection();
    await app.inject({ method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { content_id: 'episodes/episode-2' } });
    await app.inject({ method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { content_id: 'episodes/episode-2' } });

    const detail = await app.inject({ method: 'GET', url: `/collections/${id}`, headers: { cookie } });
    expect(detail.json().items).toHaveLength(1);
  });

  it('404s adding a highlight_id that belongs to someone else, even into your own collection', async () => {
    await makePremium();
    const id = await createCollection(); // owned by `cookie`
    const otherCookie = await loginAs(app, '09121200005');
    await pool.query(`update profiles set tier = 'premium' where phone = '09121200005'`);
    const otherHlRes = await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie: otherCookie },
      payload: { content_id: 'insight/insight-1', exact: 'یک متن هایلایت‌شده برای تست' },
    });
    const otherHl = otherHlRes.json().highlight.id as string;

    const res = await app.inject({
      method: 'POST', url: `/collections/${id}/items`, headers: { cookie },
      payload: { highlight_id: otherHl },
    });
    expect(res.statusCode).toBe(404);
  });

  it('400s with neither highlight_id nor content_id', async () => {
    await makePremium();
    const id = await createCollection();
    const res = await app.inject({ method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: {} });
    expect(res.statusCode).toBe(400);
  });

  it('404s on an unknown collection', async () => {
    await makePremium();
    const res = await app.inject({
      method: 'POST', url: '/collections/00000000-0000-0000-0000-000000000000/items',
      headers: { cookie }, payload: { content_id: 'episodes/episode-2' },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /collections/:id/items/:itemId', () => {
  it('removes one item', async () => {
    await makePremium();
    const id = await createCollection();
    const hl = await createHighlight();
    const add = await app.inject({ method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { highlight_id: hl } });
    const itemId = add.json().item.id;

    const del = await app.inject({ method: 'DELETE', url: `/collections/${id}/items/${itemId}`, headers: { cookie } });
    expect(del.statusCode).toBe(200);

    const detail = await app.inject({ method: 'GET', url: `/collections/${id}`, headers: { cookie } });
    expect(detail.json().items).toHaveLength(0);
  });
});

describe('PATCH /collections/:id', () => {
  it('renames a collection', async () => {
    await makePremium();
    const id = await createCollection('نامِ اول');
    const res = await app.inject({ method: 'PATCH', url: `/collections/${id}`, headers: { cookie }, payload: { title: 'نامِ دوم' } });
    expect(res.statusCode).toBe(200);
    expect(res.json().collection.title).toBe('نامِ دوم');
  });
});

describe('DELETE /collections/:id', () => {
  it('deletes the collection and its items', async () => {
    await makePremium();
    const id = await createCollection();
    const hl = await createHighlight();
    await app.inject({ method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { highlight_id: hl } });

    const del = await app.inject({ method: 'DELETE', url: `/collections/${id}`, headers: { cookie } });
    expect(del.statusCode).toBe(200);

    const get = await app.inject({ method: 'GET', url: `/collections/${id}`, headers: { cookie } });
    expect(get.statusCode).toBe(404);

    const rows = await pool.query('select count(*)::int as n from collection_items');
    expect(rows.rows[0].n).toBe(0);
  });
});
