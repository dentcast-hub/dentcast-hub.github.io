import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { pool, withTransaction } from '../db.js';
import { recordActivity } from '../services/activity.js';
import { scheduleAchievementSync } from '../services/achievement-sync.js';
import { ITEM_SELECT, resolveItem, type ItemRow } from './collections.js';

// Premium: the body behind a collection pin's «متن خودم» (text) and «رفرنس»
// (reference) kinds. Kept in its OWN table, not `article_notes` (which already
// owns "notes" for the workbench یادداشت feature) and not embedded on
// `collection_items`, because a snippet can be pinned to several boards — same
// philosophy as highlights: one item, many homes. See
// `.dentcast/collections-pins-export-handoff.md` for the full design.

const DOI_RE = /^10\.\S+$/;

function normalizeDoi(raw: string): string {
  return raw.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
}

interface SnippetInput {
  kind?: 'text' | 'reference';
  title?: string | null;
  body?: string | null;
  authors?: string | null;
  venue?: string | null;
  year?: number | null;
  doi?: string | null;
  url?: string | null;
}

interface PreparedFields {
  title: string | null;
  body: string | null;
  authors: string | null;
  venue: string | null;
  year: number | null;
  doi: string | null;
  url: string | null;
}

// Shared by create (kind is required and fixed) and PATCH (kind is whatever
// the row already has, since it is immutable). Returns the fields to write, or
// the error code to send.
function prepareFields(
  kind: 'text' | 'reference',
  b: SnippetInput,
  requireTitleAndBody: boolean,
): { error: string } | PreparedFields {
  let title: string | null | undefined = b.title === undefined ? undefined : (b.title?.trim() || null);
  let body: string | null | undefined = b.body === undefined ? undefined : (b.body?.trim() || null);
  if (requireTitleAndBody) {
    if (kind === 'reference' && !title) return { error: 'title_required' };
    if (kind === 'text' && !body) return { error: 'body_required' };
  } else {
    if (kind === 'reference' && b.title !== undefined && !title) return { error: 'title_required' };
    if (kind === 'text' && b.body !== undefined && !body) return { error: 'body_required' };
  }
  if (title === undefined) title = null;
  if (body === undefined) body = null;

  let doi: string | null = null;
  if (b.doi != null && b.doi.trim()) {
    doi = normalizeDoi(b.doi);
    if (!DOI_RE.test(doi)) return { error: 'invalid_doi' };
  }
  let url: string | null = null;
  if (b.url != null && b.url.trim()) {
    if (!/^https?:\/\//.test(b.url.trim())) return { error: 'invalid_url' };
    url = b.url.trim();
  }

  return {
    title,
    body,
    authors: b.authors === undefined ? null : (b.authors?.trim() || null),
    venue: b.venue === undefined ? null : (b.venue?.trim() || null),
    year: b.year === undefined ? null : (b.year ?? null),
    doi,
    url,
  };
}

const SNIPPET_INPUT_SCHEMA = {
  title: { type: 'string', maxLength: 200 },
  body: { type: 'string', maxLength: 10000 },
  authors: { type: 'string', maxLength: 300 },
  venue: { type: 'string', maxLength: 200 },
  year: { type: 'integer', minimum: 1000, maximum: 2200 },
  doi: { type: 'string', maxLength: 120 },
  url: { type: 'string', maxLength: 300 },
} as const;

export async function snippetRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);
  app.addHook('preHandler', requirePremium);

  // POST /collections/:id/snippets { kind, title?, body?, authors?, venue?,
  // year?, doi?, url? } - create a snippet AND pin it to the board, atomically.
  // Client-side, the reference sheet fetches DOI metadata from Crossref
  // directly in the browser (CORS-open, international host) and posts the
  // result here; the API only ever stores what it is given.
  app.post('/collections/:id/snippets', {
    schema: {
      body: {
        type: 'object',
        required: ['kind'],
        properties: {
          kind: { type: 'string', enum: ['text', 'reference'] },
          ...SNIPPET_INPUT_SCHEMA,
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const b = request.body as SnippetInput & { kind: 'text' | 'reference' };

    const prepared = prepareFields(b.kind, b, true);
    if ('error' in prepared) return reply.code(400).send({ error: prepared.error });

    const col = await pool.query(`select 1 from collections where id = $1 and user_id = $2`, [id, userId]);
    if (col.rowCount === 0) return reply.code(404).send({ error: 'not_found' });

    const itemRow = await withTransaction(async (client) => {
      const snippet = await client.query<{ id: string }>(
        `insert into snippets (user_id, kind, title, body, authors, venue, year, doi, url)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         returning id`,
        [userId, b.kind, prepared.title, prepared.body, prepared.authors, prepared.venue, prepared.year, prepared.doi, prepared.url],
      );
      const snippetId = snippet.rows[0].id;
      const pin = await client.query<{ id: string }>(
        `insert into collection_items (collection_id, snippet_id) values ($1, $2) returning id`,
        [id, snippetId],
      );
      await recordActivity(
        userId, 'collection_item_added', null,
        { collection_id: id, snippet_id: snippetId, kind: b.kind }, client,
      );
      const full = await client.query<ItemRow>(`${ITEM_SELECT} where ci.id = $1`, [pin.rows[0].id]);
      return full.rows[0];
    });

    scheduleAchievementSync(userId); // «گنجینه» counts boards and pins
    return reply.code(201).send({ item: resolveItem(itemRow) });
  });

  // PATCH /snippets/:id - edit any subset of the editable fields, independently
  // clearable, same pattern as PATCH /collections/:id. `kind` is immutable.
  app.patch('/snippets/:id', {
    schema: {
      body: {
        type: 'object',
        properties: {
          kind: {},
          title: { type: ['string', 'null'], maxLength: 200 },
          body: { type: ['string', 'null'], maxLength: 10000 },
          authors: { type: ['string', 'null'], maxLength: 300 },
          venue: { type: ['string', 'null'], maxLength: 200 },
          year: { type: ['integer', 'null'], minimum: 1000, maximum: 2200 },
          doi: { type: ['string', 'null'], maxLength: 120 },
          url: { type: ['string', 'null'], maxLength: 300 },
        },
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;
    const b = request.body as SnippetInput;

    if (b.kind !== undefined) return reply.code(400).send({ error: 'kind_immutable' });

    const current = await pool.query<{ kind: 'text' | 'reference' }>(
      `select kind from snippets where id = $1 and user_id = $2`, [id, userId],
    );
    if (current.rowCount === 0) return reply.code(404).send({ error: 'not_found' });

    const prepared = prepareFields(current.rows[0].kind, b, false);
    if ('error' in prepared) return reply.code(400).send({ error: prepared.error });

    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    const editableKeys = ['title', 'body', 'authors', 'venue', 'year', 'doi', 'url'] as const;
    for (const key of editableKeys) {
      if (b[key] === undefined) continue;
      sets.push(`${key} = $${i}`);
      vals.push(prepared[key]);
      i += 1;
    }
    if (!sets.length) return reply.code(400).send({ error: 'nothing_to_update' });
    sets.push(`updated_at = now()`);
    vals.push(id, userId);

    const res = await pool.query(
      `update snippets set ${sets.join(', ')} where id = $${i} and user_id = $${i + 1}
       returning id, kind, title, body, authors, venue, year, doi, url, created_at, updated_at`,
      vals,
    );
    if (res.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ snippet: res.rows[0] });
  });

  // DELETE /snippets/:id - delete the snippet itself; its pins cascade
  // (migration 0035's `on delete cascade` on collection_items.snippet_id).
  app.delete('/snippets/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const res = await pool.query(`delete from snippets where id = $1 and user_id = $2`, [id, request.user!.id]);
    if (res.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true });
  });
}
