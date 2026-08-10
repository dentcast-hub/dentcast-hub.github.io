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

async function createSnippet(
  collectionId: string,
  payload: Record<string, unknown>,
  useCookie = cookie,
): Promise<{ statusCode: number; json: () => any }> {
  return app.inject({
    method: 'POST', url: `/collections/${collectionId}/snippets`, headers: { cookie: useCookie }, payload,
  });
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
  // A board's own identity: emoji + colour + description, all optional, all
  // independently clearable. Before this every shelf looked identical and only
  // its name could ever change.
  it('sets and clears emoji, colour and description', async () => {
    await makePremium();
    const id = await createCollection('امتحان بورد');

    const set = await app.inject({
      method: 'PATCH', url: `/collections/${id}`, headers: { cookie },
      payload: { emoji: '🦷', color: 'amber', description: '  هرچه برای بورد لازم است  ' },
    });
    expect(set.statusCode).toBe(200);
    expect(set.json().collection).toMatchObject({
      emoji: '🦷', color: 'amber', description: 'هرچه برای بورد لازم است', title: 'امتحان بورد',
    });

    // Cleared one field at a time, with the others left alone.
    const clear = await app.inject({
      method: 'PATCH', url: `/collections/${id}`, headers: { cookie }, payload: { emoji: null },
    });
    expect(clear.json().collection.emoji).toBeNull();
    expect(clear.json().collection.color).toBe('amber');

    // An empty string is a UI's way of saying "cleared" — stored as NULL so
    // every reader tests one thing.
    const blank = await app.inject({
      method: 'PATCH', url: `/collections/${id}`, headers: { cookie }, payload: { description: '   ' },
    });
    expect(blank.json().collection.description).toBeNull();
  });

  it('refuses a colour outside the set and anything that is not an emoji', async () => {
    await makePremium();
    const id = await createCollection();
    const badColor = await app.inject({
      method: 'PATCH', url: `/collections/${id}`, headers: { cookie }, payload: { color: 'chartreuse' },
    });
    expect(badColor.statusCode).toBe(400);
    expect(badColor.json().error).toBe('invalid_color');

    for (const emoji of ['بورد', 'abc', '<b>', '🦷🦷🦷']) {
      const res = await app.inject({
        method: 'PATCH', url: `/collections/${id}`, headers: { cookie }, payload: { emoji },
      });
      expect(res.statusCode, `«${emoji}» is not a badge`).toBe(400);
      expect(res.json().error).toBe('invalid_emoji');
    }
    // One grapheme built from several code points is still one emoji.
    const family = await app.inject({
      method: 'PATCH', url: `/collections/${id}`, headers: { cookie }, payload: { emoji: '👨‍👩‍👧' },
    });
    expect(family.statusCode).toBe(200);
  });

  it('400s a PATCH that changes nothing', async () => {
    await makePremium();
    const id = await createCollection();
    const res = await app.inject({ method: 'PATCH', url: `/collections/${id}`, headers: { cookie }, payload: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('nothing_to_update');
  });

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

// The board's own arrangement. The client sends the WHOLE order every time, so
// positions are only ever fully written or fully cleared — there is no
// half-ordered board to reason about, and a retry is a no-op.
describe('PUT /collections/:id/items/order', () => {
  async function boardWithThree(): Promise<{ id: string; itemIds: string[] }> {
    await makePremium();
    const id = await createCollection('چیدمان');
    const itemIds: string[] = [];
    for (const cid of ['insight/insight-1', 'notecast/notecast-1', 'episodes/episode-2']) {
      const res = await app.inject({
        method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { content_id: cid },
      });
      itemIds.push(res.json().item.id);
    }
    return { id, itemIds };
  }

  it('opens a board newest-first until its owner arranges it', async () => {
    const { id, itemIds } = await boardWithThree();
    const before = await app.inject({ method: 'GET', url: `/collections/${id}`, headers: { cookie } });
    expect(before.json().items.map((i: { id: string }) => i.id)).toEqual([...itemIds].reverse());
    expect(before.json().items.every((i: { position: number | null }) => i.position === null)).toBe(true);
  });

  it('stores the order it is given, and GET returns the board that way', async () => {
    const { id, itemIds } = await boardWithThree();
    const wanted = [itemIds[1], itemIds[2], itemIds[0]];

    const put = await app.inject({
      method: 'PUT', url: `/collections/${id}/items/order`, headers: { cookie }, payload: { item_ids: wanted },
    });
    expect(put.statusCode).toBe(200);
    expect(put.json().items.map((i: { id: string }) => i.id)).toEqual(wanted);
    expect(put.json().items.map((i: { position: number }) => i.position)).toEqual([0, 1, 2]);

    const get = await app.inject({ method: 'GET', url: `/collections/${id}`, headers: { cookie } });
    expect(get.json().items.map((i: { id: string }) => i.id)).toEqual(wanted);
  });

  it('an empty list clears the arrangement and the board falls back to newest-first', async () => {
    const { id, itemIds } = await boardWithThree();
    await app.inject({
      method: 'PUT', url: `/collections/${id}/items/order`, headers: { cookie },
      payload: { item_ids: [itemIds[0], itemIds[1], itemIds[2]] },
    });
    const cleared = await app.inject({
      method: 'PUT', url: `/collections/${id}/items/order`, headers: { cookie }, payload: { item_ids: [] },
    });
    expect(cleared.json().items.every((i: { position: number | null }) => i.position === null)).toBe(true);
    expect(cleared.json().items.map((i: { id: string }) => i.id)).toEqual([...itemIds].reverse());
  });

  it('an id from another board moves nothing, and the valid ids still apply', async () => {
    const { id, itemIds } = await boardWithThree();
    const other = await createCollection('کالکشنِ دیگر');
    const stray = await app.inject({
      method: 'POST', url: `/collections/${other}/items`, headers: { cookie }, payload: { content_id: 'insight/insight-2' },
    });
    const strayId = stray.json().item.id;

    const put = await app.inject({
      method: 'PUT', url: `/collections/${id}/items/order`, headers: { cookie },
      payload: { item_ids: [strayId, itemIds[2], itemIds[0], itemIds[1]] },
    });
    expect(put.statusCode).toBe(200);
    // The stray is not in this board, so it is simply absent; the rest keep the
    // order they were given.
    expect(put.json().items.map((i: { id: string }) => i.id)).toEqual([itemIds[2], itemIds[0], itemIds[1]]);

    const otherBoard = await app.inject({ method: 'GET', url: `/collections/${other}`, headers: { cookie } });
    expect(otherBoard.json().items[0].position, 'the other board was not touched').toBeNull();
  });

  it('404s on a collection that is not yours', async () => {
    const { itemIds } = await boardWithThree();
    const otherCookie = await loginAs(app, '09121200009');
    await pool.query(`update profiles set tier = 'premium' where phone = '09121200009'`);
    const mine = await app.inject({ method: 'GET', url: '/collections', headers: { cookie } });
    const id = mine.json().collections[0].id;

    const res = await app.inject({
      method: 'PUT', url: `/collections/${id}/items/order`, headers: { cookie: otherCookie },
      payload: { item_ids: itemIds },
    });
    expect(res.statusCode).toBe(404);
  });
});

// «متن خودم» and «رفرنس» pins: a snippet is created AND pinned to the board in
// one call, atomically. See .dentcast/collections-pins-export-handoff.md.
describe('POST /collections/:id/snippets', () => {
  it('creates a text snippet, pinned to the board', async () => {
    await makePremium();
    const id = await createCollection();
    const res = await createSnippet(id, { kind: 'text', title: 'یادداشت من', body: 'متنی که خودم نوشتم' });
    expect(res.statusCode).toBe(201);
    const { item } = res.json();
    expect(item.kind).toBe('text');
    expect(item.title).toBe('یادداشت من');
    expect(item.body).toBe('متنی که خودم نوشتم');
    expect(item.snippet_id).toBeTruthy();
    expect(item.content_id).toBeNull();

    const detail = await app.inject({ method: 'GET', url: `/collections/${id}`, headers: { cookie } });
    expect(detail.json().items).toHaveLength(1);
    expect(detail.json().items[0].kind).toBe('text');
  });

  it('creates a reference snippet, normalizing a doi.org URL to a bare DOI', async () => {
    await makePremium();
    const id = await createCollection();
    const res = await createSnippet(id, {
      kind: 'reference', title: 'یک مقاله معتبر', doi: 'https://doi.org/10.1016/j.dental.2017.11.005',
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().item.doi).toBe('10.1016/j.dental.2017.11.005');
  });

  it('400s a reference with no title', async () => {
    await makePremium();
    const id = await createCollection();
    const res = await createSnippet(id, { kind: 'reference' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('title_required');
  });

  it('400s a text snippet with no body', async () => {
    await makePremium();
    const id = await createCollection();
    const res = await createSnippet(id, { kind: 'text', title: 'فقط عنوان' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('body_required');
  });

  it('400s a bad year, a malformed doi, and a non-http url', async () => {
    await makePremium();
    const id = await createCollection();
    const badYear = await createSnippet(id, { kind: 'reference', title: 'ت', year: 42 });
    expect(badYear.statusCode).toBe(400);
    const badDoi = await createSnippet(id, { kind: 'reference', title: 'ت', doi: 'not-a-doi' });
    expect(badDoi.statusCode).toBe(400);
    expect(badDoi.json().error).toBe('invalid_doi');
    const badUrl = await createSnippet(id, { kind: 'reference', title: 'ت', url: 'ftp://example.com' });
    expect(badUrl.statusCode).toBe(400);
    expect(badUrl.json().error).toBe('invalid_url');
  });

  it('404s on a board that is not yours', async () => {
    await makePremium();
    const id = await createCollection();
    const otherCookie = await loginAs(app, '09121200011');
    await pool.query(`update profiles set tier = 'premium' where phone = '09121200011'`);
    const res = await createSnippet(id, { kind: 'text', body: 'x' }, otherCookie);
    expect(res.statusCode).toBe(404);
  });

  it('402s a free user before the board is even looked up', async () => {
    const res = await createSnippet('00000000-0000-0000-0000-000000000000', { kind: 'text', body: 'x' });
    expect(res.statusCode).toBe(402);
  });
});

// A snippet can be pinned to several boards, same as a highlight. This is what
// «انتقال» (move) and the pin picker use to re-pin an existing snippet.
describe('re-pinning a snippet via POST /collections/:id/items', () => {
  it('is idempotent: pinning the same snippet to the same board twice yields one pin', async () => {
    await makePremium();
    const id = await createCollection();
    const created = await createSnippet(id, { kind: 'text', body: 'متن' });
    const snippetId = created.json().item.snippet_id;

    await app.inject({
      method: 'POST', url: `/collections/${id}/items`, headers: { cookie }, payload: { snippet_id: snippetId },
    });
    const detail = await app.inject({ method: 'GET', url: `/collections/${id}`, headers: { cookie } });
    expect(detail.json().items).toHaveLength(1);
  });

  it('pins the same snippet to a second board: two pins, one snippet row', async () => {
    await makePremium();
    const id1 = await createCollection('برد یک');
    const id2 = await createCollection('برد دو');
    const created = await createSnippet(id1, { kind: 'text', body: 'متن' });
    const snippetId = created.json().item.snippet_id;

    const add2 = await app.inject({
      method: 'POST', url: `/collections/${id2}/items`, headers: { cookie }, payload: { snippet_id: snippetId },
    });
    expect(add2.statusCode).toBe(201);

    const snippetRows = await pool.query('select count(*)::int as n from snippets where id = $1', [snippetId]);
    expect(snippetRows.rows[0].n).toBe(1);
    const pinRows = await pool.query('select count(*)::int as n from collection_items where snippet_id = $1', [snippetId]);
    expect(pinRows.rows[0].n).toBe(2);
  });

  it('404s re-pinning a snippet that belongs to someone else', async () => {
    await makePremium();
    const id = await createCollection();
    const otherCookie = await loginAs(app, '09121200012');
    await pool.query(`update profiles set tier = 'premium' where phone = '09121200012'`);
    const otherBoard = await app.inject({
      method: 'POST', url: '/collections', headers: { cookie: otherCookie }, payload: { title: 'برد دیگری' },
    });
    const otherSnippet = await createSnippet(otherBoard.json().collection.id, { kind: 'text', body: 'x' }, otherCookie);

    const res = await app.inject({
      method: 'POST', url: `/collections/${id}/items`, headers: { cookie },
      payload: { snippet_id: otherSnippet.json().item.snippet_id },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('snippet_not_found');
  });
});

// There is no snippets library page, so a snippet with no pins anywhere would
// be invisible-but-alive forever — the API deletes it instead.
describe('orphan rule on DELETE /collections/:id/items/:itemId', () => {
  it('deletes the snippet row when its only pin is removed', async () => {
    await makePremium();
    const id = await createCollection();
    const created = await createSnippet(id, { kind: 'text', body: 'متن' });
    const { snippet_id: snippetId, id: itemId } = created.json().item;

    const del = await app.inject({ method: 'DELETE', url: `/collections/${id}/items/${itemId}`, headers: { cookie } });
    expect(del.statusCode).toBe(200);

    const row = await pool.query('select 1 from snippets where id = $1', [snippetId]);
    expect(row.rowCount).toBe(0);
  });

  it('keeps the snippet alive when it still has a pin on another board', async () => {
    await makePremium();
    const id1 = await createCollection('برد یک');
    const id2 = await createCollection('برد دو');
    const created = await createSnippet(id1, { kind: 'text', body: 'متن' });
    const { snippet_id: snippetId, id: itemId1 } = created.json().item;
    await app.inject({
      method: 'POST', url: `/collections/${id2}/items`, headers: { cookie }, payload: { snippet_id: snippetId },
    });

    await app.inject({ method: 'DELETE', url: `/collections/${id1}/items/${itemId1}`, headers: { cookie } });

    const row = await pool.query('select 1 from snippets where id = $1', [snippetId]);
    expect(row.rowCount).toBe(1);
  });
});

describe('DELETE /snippets/:id', () => {
  it('deletes the snippet and cascades its pins off every board', async () => {
    await makePremium();
    const id1 = await createCollection('برد یک');
    const id2 = await createCollection('برد دو');
    const created = await createSnippet(id1, { kind: 'text', body: 'متن' });
    const snippetId = created.json().item.snippet_id;
    await app.inject({
      method: 'POST', url: `/collections/${id2}/items`, headers: { cookie }, payload: { snippet_id: snippetId },
    });

    const del = await app.inject({ method: 'DELETE', url: `/snippets/${snippetId}`, headers: { cookie } });
    expect(del.statusCode).toBe(200);

    const detail1 = await app.inject({ method: 'GET', url: `/collections/${id1}`, headers: { cookie } });
    const detail2 = await app.inject({ method: 'GET', url: `/collections/${id2}`, headers: { cookie } });
    expect(detail1.json().items).toHaveLength(0);
    expect(detail2.json().items).toHaveLength(0);
  });

  it('404s deleting someone else\'s snippet', async () => {
    await makePremium();
    const id = await createCollection();
    const created = await createSnippet(id, { kind: 'text', body: 'متن' });
    const snippetId = created.json().item.snippet_id;
    const otherCookie = await loginAs(app, '09121200013');
    await pool.query(`update profiles set tier = 'premium' where phone = '09121200013'`);

    const res = await app.inject({ method: 'DELETE', url: `/snippets/${snippetId}`, headers: { cookie: otherCookie } });
    expect(res.statusCode).toBe(404);
  });

  it('402s a free user', async () => {
    const res = await app.inject({
      method: 'DELETE', url: '/snippets/00000000-0000-0000-0000-000000000000', headers: { cookie },
    });
    expect(res.statusCode).toBe(402);
  });
});

describe('PATCH /snippets/:id', () => {
  it('edits body and title of a text snippet', async () => {
    await makePremium();
    const id = await createCollection();
    const created = await createSnippet(id, { kind: 'text', body: 'نسخه اول' });
    const snippetId = created.json().item.snippet_id;

    const res = await app.inject({
      method: 'PATCH', url: `/snippets/${snippetId}`, headers: { cookie },
      payload: { title: 'عنوان جدید', body: 'نسخه دوم' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().snippet.title).toBe('عنوان جدید');
    expect(res.json().snippet.body).toBe('نسخه دوم');
  });

  it('400s an attempt to change kind', async () => {
    await makePremium();
    const id = await createCollection();
    const created = await createSnippet(id, { kind: 'text', body: 'x' });
    const snippetId = created.json().item.snippet_id;

    const res = await app.inject({
      method: 'PATCH', url: `/snippets/${snippetId}`, headers: { cookie }, payload: { kind: 'reference' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('kind_immutable');
  });

  it('400s clearing the body of a text snippet to empty', async () => {
    await makePremium();
    const id = await createCollection();
    const created = await createSnippet(id, { kind: 'text', body: 'x' });
    const snippetId = created.json().item.snippet_id;

    const res = await app.inject({
      method: 'PATCH', url: `/snippets/${snippetId}`, headers: { cookie }, payload: { body: '   ' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('body_required');
  });

  it('404s patching someone else\'s snippet', async () => {
    await makePremium();
    const id = await createCollection();
    const created = await createSnippet(id, { kind: 'text', body: 'x' });
    const snippetId = created.json().item.snippet_id;
    const otherCookie = await loginAs(app, '09121200014');
    await pool.query(`update profiles set tier = 'premium' where phone = '09121200014'`);

    const res = await app.inject({
      method: 'PATCH', url: `/snippets/${snippetId}`, headers: { cookie: otherCookie }, payload: { body: 'دستکاری' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('402s a free user', async () => {
    const res = await app.inject({
      method: 'PATCH', url: '/snippets/00000000-0000-0000-0000-000000000000', headers: { cookie }, payload: { body: 'x' },
    });
    expect(res.statusCode).toBe(402);
  });
});

describe('GET /collections preview includes snippet pins', () => {
  it('carries the snippet kind (text/reference), no bodies', async () => {
    await makePremium();
    const id = await createCollection();
    await createSnippet(id, { kind: 'text', body: 'متن برای پیش‌نمایش' });
    await createSnippet(id, { kind: 'reference', title: 'مقاله‌ی مرجع' });

    const res = await app.inject({ method: 'GET', url: '/collections', headers: { cookie } });
    const preview = res.json().collections[0].preview;
    const kinds = preview.map((p: { kind: string }) => p.kind).sort();
    expect(kinds).toEqual(['reference', 'text']);
    expect(preview.every((p: Record<string, unknown>) => !('body' in p))).toBe(true);
  });
});
