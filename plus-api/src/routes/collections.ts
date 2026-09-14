import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { pool, withTransaction } from '../db.js';
import { recordActivity } from '../services/activity.js';
import { scheduleAchievementSync } from '../services/achievement-sync.js';
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

export interface ItemRow {
  id: string;
  highlight_id: string | null;
  content_id: string | null;
  created_at: string;
  position: number | null;
  exact: string | null;
  prefix: string | null;
  suffix: string | null;
  color: string | null;
  underline: boolean | null;
  note: string | null;
  label: string | null;
  // snippet_id null => a highlight or page pin; set => the pin's shape and
  // fields come from the joined `snippets` row instead of `highlights`.
  snippet_id: string | null;
  snippet_kind: 'text' | 'reference' | null;
  snippet_title: string | null;
  snippet_body: string | null;
  authors: string | null;
  venue: string | null;
  year: number | null;
  doi: string | null;
  snippet_url: string | null;
  // clip_id set => a قطعه‌ی صوتی pin (migration 0065); its fields come from
  // the joined `audio_clips` row, and its page from the clip's own content_id.
  clip_id: string | null;
  clip_content_id: string | null;
  start_s: number | null;
  end_s: number | null;
  clip_note: string | null;
  clip_label: string | null;
}

// Shared by every read path (GET /collections/:id, the order PUT, POST
// /collections/:id/items, and snippets.ts's POST /collections/:id/snippets)
// so a pin's resolved shape can never drift between where it was created and
// where it is read back. Callers append their own `where`/`order by`.
export const ITEM_SELECT = `
  select ci.id, ci.highlight_id, ci.content_id, ci.created_at, ci.position,
         h.exact, h.prefix, h.suffix, h.color, h.underline, h.note, h.label,
         ci.snippet_id, s.kind as snippet_kind, s.title as snippet_title, s.body as snippet_body,
         s.authors, s.venue, s.year, s.doi, s.url as snippet_url,
         ci.clip_id, ac.content_id as clip_content_id, ac.start_s, ac.end_s,
         ac.note as clip_note, ac.label as clip_label
    from collection_items ci
    left join highlights h on h.id = ci.highlight_id
    left join snippets s on s.id = ci.snippet_id
    left join audio_clips ac on ac.id = ci.clip_id
`;

// A pin whose highlight is SOFT-DELETED (migration 0066) is hidden with it,
// not orphaned and not shown as an empty card: `highlights` is a view over
// live rows, so `h` is null for exactly those pins, and this predicate is
// what every board read appends. The pin row itself is untouched — restoring
// the highlight brings the pin back with it, which is the whole point of
// deleting softly. Every caller of ITEM_SELECT carries it; the aggregate in
// GET /collections carries the same predicate on its own aliases.
export const PIN_VISIBLE = `(ci.highlight_id is null or h.id is not null)`;

// A board's own colour, chosen by its owner. A closed set, because these are
// rendered as real surfaces on the client and a free-text colour would let a
// board make its own title unreadable.
const BOARD_COLORS = new Set(['blue', 'green', 'amber', 'pink', 'purple', 'slate']);

// One or two emoji, no more: it is a badge on a board cover, not a title. The
// grapheme count (not .length) is what matters — a single emoji can be many
// UTF-16 code units, and a flag or a family is one glyph made of several.
function emojiOk(value: string): boolean {
  if (/\p{Letter}|\p{Number}|[<>&]/u.test(value)) return false;
  const graphemes = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value)];
  return graphemes.length >= 1 && graphemes.length <= 2;
}

const COLLECTION_COLS = 'id, title, description, emoji, color, created_at';

export function resolveItem(row: ItemRow) {
  // A snippet pin (text/reference) has no content page — its shape comes from
  // the joined `snippets` row, not `highlights`/`getContentInfo`. `url` here is
  // repurposed from "link to the DentCast page this pin is about" (which does
  // not exist for a snippet) to "the reference's own web link", null for a
  // text pin or a reference with none given.
  if (row.snippet_id) {
    return {
      id: row.id,
      kind: row.snippet_kind,
      highlight_id: null,
      content_id: null,
      snippet_id: row.snippet_id,
      position: row.position,
      title: row.snippet_title,
      url: row.snippet_url,
      type: null,
      exact: null,
      prefix: null,
      suffix: null,
      color: null,
      underline: false,
      note: null,
      label: null,
      body: row.snippet_body,
      authors: row.authors,
      venue: row.venue,
      year: row.year,
      doi: row.doi,
      created_at: row.created_at,
    };
  }

  // A clip pin: the episode resolves from the clip's own content_id (the pin
  // row keeps content_id NULL — see migration 0065), the span and the note
  // from audio_clips, and `clip_id` is what ?dcclip= and «انتقال» carry.
  if (row.clip_id) {
    const cinfo = getContentInfo(row.clip_content_id!);
    return {
      id: row.id,
      kind: 'clip',
      highlight_id: null,
      content_id: row.clip_content_id,
      snippet_id: null,
      clip_id: row.clip_id,
      position: row.position,
      title: cinfo?.title ?? row.clip_content_id,
      url: cinfo?.url ?? `/${row.clip_content_id}.html`,
      type: cinfo?.type ?? row.clip_content_id!.split('/')[0],
      exact: null,
      prefix: null,
      suffix: null,
      color: null,
      underline: false,
      note: row.clip_note,
      label: row.clip_label,
      start_s: row.start_s,
      end_s: row.end_s,
      created_at: row.created_at,
    };
  }

  const info = getContentInfo(row.content_id!);
  return {
    id: row.id,
    kind: row.highlight_id ? 'highlight' : 'page',
    // Carried to the client so a highlight-pin can link with ?dcphl=<id> —
    // landing ON the highlight with the workbench open instead of at the top of
    // an article that shows none of the reader's marks yet.
    highlight_id: row.highlight_id,
    content_id: row.content_id,
    snippet_id: null,
    position: row.position,
    title: info?.title ?? row.content_id,
    url: info?.url ?? `/${row.content_id}.html`,
    type: info?.type ?? row.content_id!.split('/')[0],
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
      id: string; title: string; description: string | null; emoji: string | null;
      color: string | null; created_at: string; last_item_at: string | null;
      items: Array<{
        highlight_id: string | null; content_id: string | null; color: string | null;
        snippet_id: string | null; snippet_kind: 'text' | 'reference' | null;
        clip_id: string | null; clip_content_id: string | null;
      }>;
    }>(
      // last_item_at is DERIVED (max of the items' created_at), never stored:
      // "which board did I last add to" is the question a shelf of boards has
      // to answer, and deriving it costs nothing over the join that is already
      // here — a column would cost a migration and a write path to keep true.
      `select c.id, c.title, c.description, c.emoji, c.color, c.created_at,
              max(ci.created_at) filter (where ${PIN_VISIBLE}) as last_item_at,
              coalesce(
                json_agg(
                  json_build_object(
                    'highlight_id', ci.highlight_id, 'content_id', ci.content_id, 'color', h.color,
                    'snippet_id', ci.snippet_id, 'snippet_kind', s.kind,
                    'clip_id', ci.clip_id, 'clip_content_id', ac.content_id
                  )
                  order by ci.created_at desc
                ) filter (where ci.id is not null and ${PIN_VISIBLE}),
                '[]'
              ) as items
         from collections c
         left join collection_items ci on ci.collection_id = c.id
         left join highlights h on h.id = ci.highlight_id
         left join snippets s on s.id = ci.snippet_id
         left join audio_clips ac on ac.id = ci.clip_id
        where c.user_id = $1
        group by c.id
        order by c.created_at desc`,
      [request.user!.id],
    );
    const collections = res.rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      emoji: r.emoji,
      color: r.color,
      created_at: r.created_at,
      last_item_at: r.last_item_at,
      item_count: r.items.length,
      preview: r.items.slice(0, 3).map((it) => {
        const pageId = it.clip_id ? it.clip_content_id : it.content_id;
        return {
          kind: it.clip_id ? 'clip' : it.snippet_id ? it.snippet_kind : (it.highlight_id ? 'highlight' : 'page'),
          color: it.color,
          type: it.snippet_id ? null : (getContentInfo(pageId!)?.type ?? pageId!.split('/')[0]),
        };
      }),
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
    const res = await pool.query(
      `insert into collections (user_id, title) values ($1, $2)
       returning ${COLLECTION_COLS}`,
      [request.user!.id, title.trim()],
    );
    const collection = res.rows[0];
    await recordActivity(request.user!.id, 'collection_created', null, { collection_id: collection.id });
    scheduleAchievementSync(request.user!.id); // «گنجینه» counts boards and pins
    return reply.code(201).send({ collection: { ...collection, item_count: 0 } });
  });

  // GET /collections/:id - one collection's items, resolved to title/url/type
  // (and, for highlight items, the highlight body itself).
  app.get('/collections/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const col = await pool.query(
      `select ${COLLECTION_COLS} from collections where id = $1 and user_id = $2`,
      [id, userId],
    );
    if (col.rowCount === 0) return reply.code(404).send({ error: 'not_found' });

    // Display order: whatever the owner arranged by hand first, then anything
    // never placed, newest-first (`nulls last` is what keeps an unarranged
    // board behaving exactly as it always did).
    const items = await pool.query<ItemRow>(
      `${ITEM_SELECT} where ci.collection_id = $1 and ${PIN_VISIBLE}
       order by ci.position asc nulls last, ci.created_at desc`,
      [id],
    );

    return reply.send({ ...col.rows[0], items: items.rows.map(resolveItem) });
  });

  // PATCH /collections/:id { title?, description?, emoji?, color? } - rename and
  // the board's own identity. Every field is optional and independently
  // clearable (send null), so the edit panel can save exactly what changed;
  // sending nothing at all is a 400 rather than a silent no-op.
  app.patch('/collections/:id', {
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 80 },
          description: { type: ['string', 'null'], maxLength: 400 },
          emoji: { type: ['string', 'null'], maxLength: 24 },
          color: { type: ['string', 'null'] },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const b = request.body as Record<string, unknown>;

    if (b.color != null && !BOARD_COLORS.has(String(b.color))) {
      return reply.code(400).send({ error: 'invalid_color' });
    }
    if (b.emoji != null && String(b.emoji).trim() && !emojiOk(String(b.emoji).trim())) {
      return reply.code(400).send({ error: 'invalid_emoji' });
    }

    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    if (b.title !== undefined) { sets.push(`title = $${i++}`); vals.push(String(b.title).trim()); }
    // An empty string is how a UI says "cleared"; store it as NULL so every
    // reader can test one thing.
    if (b.description !== undefined) {
      sets.push(`description = $${i++}`);
      vals.push(b.description == null ? null : String(b.description).trim() || null);
    }
    if (b.emoji !== undefined) {
      sets.push(`emoji = $${i++}`);
      vals.push(b.emoji == null ? null : String(b.emoji).trim() || null);
    }
    if (b.color !== undefined) { sets.push(`color = $${i++}`); vals.push(b.color ?? null); }
    if (!sets.length) return reply.code(400).send({ error: 'nothing_to_update' });

    vals.push(id, request.user!.id);
    const res = await pool.query(
      `update collections set ${sets.join(', ')} where id = $${i} and user_id = $${i + 1}
       returning ${COLLECTION_COLS}`,
      vals,
    );
    if (res.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ collection: res.rows[0] });
  });

  // PUT /collections/:id/items/order { item_ids } - the board's own arrangement.
  //
  // The client sends the WHOLE board in its intended order, not a "move item X
  // to index 3" delta: positions are then only ever fully written or fully
  // cleared, so there is no half-ordered state, no drift between two clients,
  // and a retry of the same request is a no-op. An empty array clears the
  // arrangement and the board falls back to newest-first.
  app.put('/collections/:id/items/order', {
    schema: {
      body: {
        type: 'object',
        required: ['item_ids'],
        properties: { item_ids: { type: 'array', maxItems: 2000, items: { type: 'string' } } },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { item_ids: itemIds } = request.body as { item_ids: string[] };
    const userId = request.user!.id;

    const owned = await pool.query(
      `select 1 from collections where id = $1 and user_id = $2`, [id, userId],
    );
    if (owned.rowCount === 0) return reply.code(404).send({ error: 'not_found' });

    const updated = await withTransaction(async (client) => {
      await client.query(`update collection_items set position = null where collection_id = $1`, [id]);
      if (itemIds.length) {
        // Position by index of the id in the array. An id that is not in this
        // collection simply matches nothing — a stale tab cannot move another
        // board's item, and the ids it did get right still apply.
        await client.query(
          `update collection_items ci
              set position = v.pos
             from (select unnest($2::uuid[]) as item_id, generate_subscripts($2::uuid[], 1) - 1 as pos) v
            where ci.id = v.item_id and ci.collection_id = $1`,
          [id, itemIds],
        );
      }
      const res = await client.query<ItemRow>(
        `${ITEM_SELECT} where ci.collection_id = $1 and ${PIN_VISIBLE}
         order by ci.position asc nulls last, ci.created_at desc`,
        [id],
      );
      return res.rows;
    });

    return reply.send({ items: updated.map(resolveItem) });
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

  // POST /collections/:id/items { highlight_id } | { content_id } | { snippet_id } | { clip_id }
  // - add one of the user's own highlights, a whole page (no highlight_id), or
  // one of the user's own snippets, to the collection. Idempotent: adding the
  // same thing twice just returns the existing row (the partial unique
  // indexes from migration 0012, plus the snippet one from 0036, back this).
  // This is also what «انتقال» (move) and the pin picker use for snippets.
  app.post('/collections/:id/items', {
    schema: {
      body: {
        type: 'object',
        properties: {
          highlight_id: { type: 'string' },
          content_id: { type: 'string' },
          snippet_id: { type: 'string' },
          clip_id: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const b = request.body as { highlight_id?: string; content_id?: string; snippet_id?: string; clip_id?: string };
    const userId = request.user!.id;

    const col = await pool.query(`select 1 from collections where id = $1 and user_id = $2`, [id, userId]);
    if (col.rowCount === 0) return reply.code(404).send({ error: 'not_found' });

    let highlightId: string | null = null;
    let snippetId: string | null = null;
    let clipId: string | null = null;
    let contentId: string | null = null;
    if (b.clip_id) {
      // The reader's own clip only; the activity row still names the episode,
      // while the pin row itself keeps content_id NULL (migration 0065).
      const cl = await pool.query<{ content_id: string }>(
        `select content_id from audio_clips where id = $1 and user_id = $2`,
        [b.clip_id, userId],
      );
      if (cl.rowCount === 0) return reply.code(404).send({ error: 'clip_not_found' });
      clipId = b.clip_id;
      contentId = cl.rows[0].content_id;
    } else if (b.highlight_id) {
      const hl = await pool.query<{ content_id: string }>(
        `select content_id from highlights where id = $1 and user_id = $2`,
        [b.highlight_id, userId],
      );
      if (hl.rowCount === 0) return reply.code(404).send({ error: 'highlight_not_found' });
      highlightId = b.highlight_id;
      contentId = hl.rows[0].content_id;
    } else if (b.snippet_id) {
      const sn = await pool.query(`select 1 from snippets where id = $1 and user_id = $2`, [b.snippet_id, userId]);
      if (sn.rowCount === 0) return reply.code(404).send({ error: 'snippet_not_found' });
      snippetId = b.snippet_id;
    } else if (b.content_id) {
      contentId = b.content_id;
    } else {
      return reply.code(400).send({ error: 'highlight_id_or_content_id_required' });
    }

    // ON CONFLICT DO UPDATE (a no-op SET) rather than DO NOTHING purely so
    // RETURNING still yields a row on the idempotent-replay path; the actual
    // item body is re-selected below with the join.
    const res = clipId
      ? await pool.query<{ id: string }>(
        `insert into collection_items (collection_id, clip_id)
         values ($1, $2)
         on conflict (collection_id, clip_id) where clip_id is not null
         do update set collection_id = excluded.collection_id
         returning id`,
        [id, clipId],
      )
      : snippetId
      ? await pool.query<{ id: string }>(
        `insert into collection_items (collection_id, snippet_id)
         values ($1, $2)
         on conflict (collection_id, snippet_id) where snippet_id is not null
         do update set collection_id = excluded.collection_id
         returning id`,
        [id, snippetId],
      )
      : await pool.query<{ id: string }>(
        `insert into collection_items (collection_id, highlight_id, content_id)
         values ($1, $2, $3)
         on conflict (collection_id, ${highlightId ? 'highlight_id' : 'content_id'})
           where highlight_id is ${highlightId ? 'not null' : 'null'}
         do update set collection_id = excluded.collection_id
         returning id`,
        [id, highlightId, contentId],
      );
    const full = await pool.query<ItemRow>(`${ITEM_SELECT} where ci.id = $1`, [res.rows[0].id]);
    await recordActivity(userId, 'collection_item_added', contentId, {
      collection_id: id, highlight_id: highlightId, snippet_id: snippetId, clip_id: clipId,
    });
    scheduleAchievementSync(userId);
    return reply.code(201).send({ item: resolveItem(full.rows[0]) });
  });

  // DELETE /collections/:id/items/:itemId - remove one pin. When the removed
  // pin was a snippet AND it was the snippet's last pin anywhere, the snippet
  // row itself is deleted in the same transaction — there is no snippets
  // library page, so an unpinned snippet would otherwise be invisible but
  // still alive forever. «انتقال» (move) never triggers this: it adds to the
  // target board BEFORE removing from the source, so the snippet always has
  // at least one pin at the moment this check runs.
  app.delete('/collections/:id/items/:itemId', async (request, reply) => {
    const { id, itemId } = request.params as { id: string; itemId: string };
    const userId = request.user!.id;

    const removed = await withTransaction(async (client) => {
      const del = await client.query<{ snippet_id: string | null }>(
        `delete from collection_items ci using collections c
          where ci.collection_id = c.id and c.user_id = $1 and c.id = $2 and ci.id = $3
          returning ci.snippet_id`,
        [userId, id, itemId],
      );
      if (del.rowCount === 0) return false;
      const snippetId = del.rows[0].snippet_id;
      if (snippetId) {
        const remaining = await client.query(`select 1 from collection_items where snippet_id = $1 limit 1`, [snippetId]);
        if (remaining.rowCount === 0) {
          await client.query(`delete from snippets where id = $1`, [snippetId]);
        }
      }
      return true;
    });

    if (!removed) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true });
  });
}
