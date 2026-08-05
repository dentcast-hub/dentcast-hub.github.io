import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { pool } from '../db.js';
import { recordActivity } from '../services/activity.js';
import { getContentInfo } from '../content-index.js';

// Premium: user-made freeform folders (spec §4's `collections`/
// `collection_items`, provisioned since migration 0001, unused until now).
// Unlike a pathway (founder-curated, prescriptive) or a topic archive
// (auto-grouped by the site's own taxonomy), a collection is entirely the
// user's own: any mix of their own highlights AND whole pages (an item with
// no highlight_id — "save this whole episode for later"), regardless of
// pillar/pathway/topic. Adding is idempotent at the DB level (see migration
// 0012's partial unique indexes) so the "افزودن به کالکشن" button is always
// safe to click again.

interface ItemRow {
  id: string;
  highlight_id: string | null;
  content_id: string;
  created_at: string;
  exact: string | null;
  prefix: string | null;
  suffix: string | null;
  color: string | null;
  underline: boolean | null;
  note: string | null;
  label: string | null;
}

function resolveItem(row: ItemRow) {
  const info = getContentInfo(row.content_id);
  return {
    id: row.id,
    kind: row.highlight_id ? 'highlight' : 'page',
    // Carried to the client so a highlight-pin can link with ?dcphl=<id> —
    // landing ON the highlight with the workbench open instead of at the top of
    // an article that shows none of the reader's marks yet.
    highlight_id: row.highlight_id,
    content_id: row.content_id,
    title: info?.title ?? row.content_id,
    url: info?.url ?? `/${row.content_id}.html`,
    type: info?.type ?? row.content_id.split('/')[0],
    exact: row.exact,
    prefix: row.prefix,
    suffix: row.suffix,
    color: row.color,
    underline: !!row.underline,
    note: row.note,
    label: row.label,
    created_at: row.created_at,
  };
}

export async function collectionRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  // GET /collections - the user's own collections, newest first. Besides the
  // count, each carries a small `preview` (its 3 most recent items' color/type
  // only, no bodies) so the catalog can draw a Pinterest-style board cover
  // without an extra round trip per collection.
  app.get('/collections', async (request, reply) => {
    const res = await pool.query<{
      id: string; title: string; created_at: string;
      items: Array<{ highlight_id: string | null; content_id: string; color: string | null }>;
    }>(
      `select c.id, c.title, c.created_at,
              coalesce(
                json_agg(
                  json_build_object('highlight_id', ci.highlight_id, 'content_id', ci.content_id, 'color', h.color)
                  order by ci.created_at desc
                ) filter (where ci.id is not null),
                '[]'
              ) as items
         from collections c
         left join collection_items ci on ci.collection_id = c.id
         left join highlights h on h.id = ci.highlight_id
        where c.user_id = $1
        group by c.id
        order by c.created_at desc`,
      [request.user!.id],
    );
    const collections = res.rows.map((r) => ({
      id: r.id,
      title: r.title,
      created_at: r.created_at,
      item_count: r.items.length,
      preview: r.items.slice(0, 3).map((it) => ({
        kind: it.highlight_id ? 'highlight' : 'page',
        color: it.color,
        type: getContentInfo(it.content_id)?.type ?? it.content_id.split('/')[0],
      })),
    }));
    return reply.send({ collections });
  });

  // POST /collections { title } - create an (initially empty) collection.
  app.post('/collections', {
    schema: {
      body: {
        type: 'object',
        required: ['title'],
        properties: { title: { type: 'string', minLength: 1, maxLength: 80 } },
      },
    },
  }, async (request, reply) => {
    const { title } = request.body as { title: string };
    const res = await pool.query<{ id: string; title: string; created_at: string }>(
      `insert into collections (user_id, title) values ($1, $2)
       returning id, title, created_at`,
      [request.user!.id, title.trim()],
    );
    const collection = res.rows[0];
    await recordActivity(request.user!.id, 'collection_created', null, { collection_id: collection.id });
    return reply.code(201).send({ collection: { ...collection, item_count: 0 } });
  });

  // GET /collections/:id - one collection's items, resolved to title/url/type
  // (and, for highlight items, the highlight body itself).
  app.get('/collections/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const col = await pool.query<{ id: string; title: string; created_at: string }>(
      `select id, title, created_at from collections where id = $1 and user_id = $2`,
      [id, userId],
    );
    if (col.rowCount === 0) return reply.code(404).send({ error: 'not_found' });

    const items = await pool.query<ItemRow>(
      `select ci.id, ci.highlight_id, ci.content_id, ci.created_at,
              h.exact, h.prefix, h.suffix, h.color, h.underline, h.note, h.label
         from collection_items ci
         left join highlights h on h.id = ci.highlight_id
        where ci.collection_id = $1
        order by ci.created_at desc`,
      [id],
    );

    return reply.send({ ...col.rows[0], items: items.rows.map(resolveItem) });
  });

  // PATCH /collections/:id { title } - rename.
  app.patch('/collections/:id', {
    schema: {
      body: {
        type: 'object',
        required: ['title'],
        properties: { title: { type: 'string', minLength: 1, maxLength: 80 } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { title } = request.body as { title: string };
    const res = await pool.query<{ id: string; title: string; created_at: string }>(
      `update collections set title = $1 where id = $2 and user_id = $3
       returning id, title, created_at`,
      [title.trim(), id, request.user!.id],
    );
    if (res.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ collection: res.rows[0] });
  });

  // DELETE /collections/:id - the whole collection (items cascade).
  app.delete('/collections/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const res = await pool.query(
      `delete from collections where id = $1 and user_id = $2`,
      [id, request.user!.id],
    );
    if (res.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true });
  });

  // POST /collections/:id/items { highlight_id } | { content_id } - add either
  // one of the user's own highlights, or a whole page (no highlight_id), to
  // the collection. Idempotent: adding the same thing twice just returns the
  // existing row (the partial unique indexes from migration 0012 back this).
  app.post('/collections/:id/items', {
    schema: {
      body: {
        type: 'object',
        properties: {
          highlight_id: { type: 'string' },
          content_id: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const b = request.body as { highlight_id?: string; content_id?: string };
    const userId = request.user!.id;

    const col = await pool.query(`select 1 from collections where id = $1 and user_id = $2`, [id, userId]);
    if (col.rowCount === 0) return reply.code(404).send({ error: 'not_found' });

    let highlightId: string | null = null;
    let contentId: string;
    if (b.highlight_id) {
      const hl = await pool.query<{ content_id: string }>(
        `select content_id from highlights where id = $1 and user_id = $2`,
        [b.highlight_id, userId],
      );
      if (hl.rowCount === 0) return reply.code(404).send({ error: 'highlight_not_found' });
      highlightId = b.highlight_id;
      contentId = hl.rows[0].content_id;
    } else if (b.content_id) {
      contentId = b.content_id;
    } else {
      return reply.code(400).send({ error: 'highlight_id_or_content_id_required' });
    }

    // ON CONFLICT DO UPDATE (a no-op SET) rather than DO NOTHING purely so
    // RETURNING still yields a row on the idempotent-replay path; the actual
    // item body (highlight fields) is re-selected below with the join.
    const res = await pool.query<{ id: string }>(
      `insert into collection_items (collection_id, highlight_id, content_id)
       values ($1, $2, $3)
       on conflict (collection_id, ${highlightId ? 'highlight_id' : 'content_id'})
         where highlight_id is ${highlightId ? 'not null' : 'null'}
       do update set collection_id = excluded.collection_id
       returning id`,
      [id, highlightId, contentId],
    );
    const full = await pool.query<ItemRow>(
      `select ci.id, ci.highlight_id, ci.content_id, ci.created_at,
              h.exact, h.prefix, h.suffix, h.color, h.underline, h.note, h.label
         from collection_items ci
         left join highlights h on h.id = ci.highlight_id
        where ci.id = $1`,
      [res.rows[0].id],
    );
    await recordActivity(userId, 'collection_item_added', contentId, { collection_id: id, highlight_id: highlightId });
    return reply.code(201).send({ item: resolveItem(full.rows[0]) });
  });

  // DELETE /collections/:id/items/:itemId - remove one item.
  app.delete('/collections/:id/items/:itemId', async (request, reply) => {
    const { id, itemId } = request.params as { id: string; itemId: string };
    const res = await pool.query(
      `delete from collection_items ci using collections c
        where ci.collection_id = c.id and c.user_id = $1 and c.id = $2 and ci.id = $3`,
      [request.user!.id, id, itemId],
    );
    if (res.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true });
  });
}
