import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { pool, withTransaction } from '../db.js';
import { recordActivity } from '../services/activity.js';
import { resolveTopic } from '../content-index.js';

const LABELS = new Set(['important', 'unclear', 'clinical_pearl']);

interface HighlightRow {
  id: string;
  content_id: string;
  exact: string;
  prefix: string | null;
  suffix: string | null;
  color: string | null;
  underline: boolean;
  cloze_markers: Array<[number, number]>;
  note: string | null;
  label: string | null;
  content_hash: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_COLS = `id, content_id, exact, prefix, suffix, color, underline,
  cloze_markers, note, label, content_hash, created_at, updated_at`;

export async function highlightRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /highlights?content_id=SLUG  -> one article's highlights (for re-anchoring)
  // GET /highlights?topic=KEY        -> topic archive (added in the archive milestone)
  app.get('/highlights', async (request, reply) => {
    const { content_id, topic } = request.query as { content_id?: string; topic?: string };

    // Topic archive (spec 2.8): the user's highlights across the content within
    // ONE taxonomy branch. Not cross-topic aggregation (that is premium).
    if (topic && !content_id) {
      const resolved = resolveTopic(topic);
      if (!resolved) return reply.code(404).send({ error: 'unknown_topic' });
      const res = await pool.query<HighlightRow>(
        `select ${SELECT_COLS}
           from highlights
          where user_id = $1 and content_id = any($2)
          order by content_id asc, created_at asc`,
        [request.user!.id, resolved.contentIds],
      );
      return reply.send({ topic, topic_fa: resolved.fa, highlights: res.rows });
    }

    if (!content_id) {
      return reply.code(400).send({ error: 'content_id_required' });
    }

    const res = await pool.query<HighlightRow>(
      `select ${SELECT_COLS}
         from highlights
        where user_id = $1 and content_id = $2
        order by created_at asc`,
      [request.user!.id, content_id],
    );
    return reply.send({ highlights: res.rows });
  });

  // GET /highlights/recent?limit= -> the user's latest highlights (own dashboard;
  // bodies allowed here). Registered before :id routes; distinct method anyway.
  app.get('/highlights/recent', async (request, reply) => {
    const q = request.query as { limit?: string };
    const limit = Math.min(Math.max(parseInt(q.limit || '8', 10) || 8, 1), 50);
    const res = await pool.query<HighlightRow>(
      `select ${SELECT_COLS} from highlights
        where user_id = $1 order by created_at desc limit $2`,
      [request.user!.id, limit],
    );
    return reply.send({ highlights: res.rows });
  });

  // POST /highlights  -> create highlight + its card_state row + log the event
  app.post('/highlights', {
    schema: {
      body: {
        type: 'object',
        required: ['content_id', 'exact'],
        properties: {
          content_id: { type: 'string' },
          exact: { type: 'string', minLength: 1 },
          prefix: { type: 'string' },
          suffix: { type: 'string' },
          color: { type: 'string' },
          underline: { type: 'boolean' },
          cloze_markers: { type: 'array' },
          note: { type: 'string' },
          label: { type: 'string' },
          content_hash: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as Record<string, unknown>;
    if (b.label != null && !LABELS.has(String(b.label))) {
      return reply.code(400).send({ error: 'invalid_label' });
    }

    const userId = request.user!.id;
    const created = await withTransaction(async (client) => {
      const hl = await client.query<HighlightRow>(
        `insert into highlights
           (user_id, content_id, exact, prefix, suffix, color, underline, cloze_markers, note, label, content_hash)
         values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11)
         returning ${SELECT_COLS}`,
        [
          userId,
          b.content_id,
          b.exact,
          b.prefix ?? null,
          b.suffix ?? null,
          b.color ?? null,
          b.underline ?? false,
          JSON.stringify(b.cloze_markers ?? []),
          b.note ?? null,
          b.label ?? null,
          b.content_hash ?? null,
        ],
      );
      const highlight = hl.rows[0];
      // Every highlight gets its card_state row on every plan (box 1, next null).
      // Only the premium engine ever writes box/next_review_at.
      await client.query(
        `insert into card_state (user_id, highlight_id, box, next_review_at)
         values ($1, $2, 1, null)`,
        [userId, highlight.id],
      );
      await recordActivity(userId, 'highlight_created', highlight.content_id, { highlight_id: highlight.id }, client);
      return highlight;
    });

    return reply.code(201).send({ highlight: created });
  });

  // PATCH /highlights/:id -> edit note / label / styling / cloze (owner only)
  app.patch('/highlights/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const b = request.body as Record<string, unknown>;
    if (b.label != null && !LABELS.has(String(b.label))) {
      return reply.code(400).send({ error: 'invalid_label' });
    }

    // Build a dynamic update over the editable fields only.
    const sets: string[] = [];
    const vals: unknown[] = [];
    let i = 1;
    const editable: Record<string, unknown> = {
      note: b.note,
      label: b.label,
      color: b.color,
      underline: b.underline,
      cloze_markers: b.cloze_markers,
    };
    for (const [key, value] of Object.entries(editable)) {
      if (value === undefined) continue;
      if (key === 'cloze_markers') {
        sets.push(`cloze_markers = $${i}::jsonb`);
        vals.push(JSON.stringify(value ?? []));
      } else {
        sets.push(`${key} = $${i}`);
        vals.push(value);
      }
      i += 1;
    }
    if (sets.length === 0) {
      return reply.code(400).send({ error: 'nothing_to_update' });
    }
    sets.push(`updated_at = now()`);
    vals.push(id, request.user!.id);

    const res = await pool.query<HighlightRow>(
      `update highlights set ${sets.join(', ')}
        where id = $${i} and user_id = $${i + 1}
        returning ${SELECT_COLS}`,
      vals,
    );
    if (res.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ highlight: res.rows[0] });
  });

  // DELETE /highlights/:id -> delete (card_state cascades) + log (owner only)
  app.delete('/highlights/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user!.id;

    const deleted = await withTransaction(async (client) => {
      const res = await client.query<{ content_id: string }>(
        `delete from highlights where id = $1 and user_id = $2 returning content_id`,
        [id, userId],
      );
      if (res.rowCount === 0) return null;
      await recordActivity(userId, 'highlight_deleted', res.rows[0].content_id, { highlight_id: id }, client);
      return res.rows[0];
    });

    if (!deleted) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true });
  });
}
