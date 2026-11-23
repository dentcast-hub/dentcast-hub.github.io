import { createHash } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { requirePremium } from '../middleware/require-premium.js';
import { pool } from '../db.js';
import { getContentInfo, folderLabel, folderOf } from '../content-index.js';
import { isPlausibleContentId } from './highlights.js';

/**
 * کادرهای ذخیره‌شده — saved callout boxes (migration 0079).
 *
 * A box is the author's own sentences framed on the page (module 03: a
 * «نکته‌ی بالینی», a «نتیجه», or a frame around the author's own label). The
 * «ذخیره در دفترچه» button on every box (plus/js/presentation.js, built at run
 * time — no page carries it) keeps the WHOLE box, with its label and the
 * article it came from, in the دفترچه as a third kind beside the highlights
 * and the audio clips.
 *
 * WHO MAY DO WHAT follows the audio clip (routes/clips.ts), by the founder's
 * approved mockup: saving is the premium act, and the button shows its lock
 * before the tap; what a reader saved stays theirs.
 *
 *   · POST              — requirePremium (the act); idempotent per box;
 *   · GET /boxes        — requireAuth: this reader's saved boxes on ONE page,
 *                         so the buttons there say «در دفترچه ذخیره شد»;
 *   · DELETE            — requireAuth: a lapsed subscriber can still remove;
 *   · GET /boxes/library — requirePremium: the aggregated view, the same
 *                         boundary the highlight and clip libraries draw;
 *   · GET /export/highlights carries them on any plan (dashboard.ts).
 *
 * The words are stored as saved (`text`, `label`), not re-read from the page:
 * the دفترچه shows a box without fetching the article, and an edit of the page
 * later does not empty a card the reader kept.
 *
 * No activity row and no XP: like a clip, saving is a bookmark (score.ts's
 * argument for `content_shared`).
 */

export const MAX_BOX_TEXT = 6000;
export const MAX_BOX_LABEL = 80;

interface BoxRow {
  id: string;
  content_id: string;
  label: string | null;
  text: string;
  created_at: string;
}

const SELECT_COLS = `id, content_id, label, text, created_at`;

/** The one fold both sides agree on: whitespace collapsed, trimmed. */
export function foldBoxText(s: unknown): string {
  return String(s ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
}

/** One box, one row per reader: the hash of the folded words. */
export function boxTextHash(text: string): string {
  return createHash('sha256').update(foldBoxText(text)).digest('hex');
}

export async function boxRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /boxes?content_id=sharehub/share-10 -> this reader's saved boxes on one page.
  app.get('/boxes', async (request, reply) => {
    const { content_id } = request.query as { content_id?: string };
    if (!content_id) return reply.code(400).send({ error: 'content_id_required' });
    const res = await pool.query<BoxRow>(
      `select ${SELECT_COLS} from saved_boxes
        where user_id = $1 and content_id = $2
        order by created_at asc`,
      [request.user!.id, content_id],
    );
    return reply.send({ boxes: res.rows });
  });

  // GET /boxes/library -> premium: every saved box, grouped by article (the
  // highlight library's shape, so the دفترچه can merge the three kinds).
  // Registered before /boxes/:id so «library» is never read as an id.
  app.get('/boxes/library', { preHandler: requirePremium }, async (request, reply) => {
    const res = await pool.query<BoxRow>(
      `select ${SELECT_COLS} from saved_boxes
        where user_id = $1 order by created_at asc`,
      [request.user!.id],
    );
    const groups = new Map<string, { latest: string; boxes: BoxRow[] }>();
    for (const b of res.rows) {
      let g = groups.get(b.content_id);
      if (!g) { g = { latest: b.created_at, boxes: [] }; groups.set(b.content_id, g); }
      g.boxes.push(b);
      if (b.created_at > g.latest) g.latest = b.created_at;
    }
    const articles = [...groups.entries()]
      .sort((a, b) => (a[1].latest < b[1].latest ? 1 : a[1].latest > b[1].latest ? -1 : 0))
      .map(([contentId, g]) => {
        const info = getContentInfo(contentId);
        const folder = folderOf(contentId);
        return {
          content_id: contentId,
          title: info?.title ?? contentId,
          url: info?.url ?? `/${contentId}.html`,
          type: info?.type ?? folder,
          folder,
          folder_fa: folderLabel(folder),
          last_box_at: g.latest,
          count: g.boxes.length,
          boxes: g.boxes,
        };
      });
    return reply.send({ total: res.rowCount ?? 0, article_count: articles.length, articles });
  });

  // POST /boxes -> premium: keep one box. A second save of the same box
  // returns the row it already has (200), never a duplicate.
  app.post('/boxes', {
    preHandler: requirePremium,
    schema: {
      body: {
        type: 'object',
        required: ['content_id', 'text'],
        properties: {
          content_id: { type: 'string', minLength: 1, maxLength: 200 },
          text: { type: 'string', minLength: 1, maxLength: MAX_BOX_TEXT * 2 },
          label: { type: ['string', 'null'], maxLength: MAX_BOX_LABEL * 2 },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as { content_id: string; text: string; label?: string | null };
    if (!/^[a-z0-9][a-z0-9_-]*\/[a-z0-9][a-z0-9_./-]*$/i.test(b.content_id) || !isPlausibleContentId(b.content_id)) {
      return reply.code(400).send({ error: 'invalid_content_id' });
    }
    const text = foldBoxText(b.text);
    if (!text) return reply.code(400).send({ error: 'empty_box' });
    if (text.length > MAX_BOX_TEXT) return reply.code(400).send({ error: 'box_too_long' });
    const label = foldBoxText(b.label) || null;
    if (label && label.length > MAX_BOX_LABEL) return reply.code(400).send({ error: 'invalid_label' });

    const res = await pool.query<BoxRow>(
      `insert into saved_boxes (user_id, content_id, label, text, text_hash)
       values ($1, $2, $3, $4, $5)
       on conflict (user_id, content_id, text_hash) do nothing
       returning ${SELECT_COLS}`,
      [request.user!.id, b.content_id, label, text, boxTextHash(text)],
    );
    if (res.rowCount) return reply.code(201).send({ box: res.rows[0] });
    const existing = await pool.query<BoxRow>(
      `select ${SELECT_COLS} from saved_boxes
        where user_id = $1 and content_id = $2 and text_hash = $3`,
      [request.user!.id, b.content_id, boxTextHash(text)],
    );
    return reply.send({ box: existing.rows[0] });
  });

  // DELETE /boxes/:id (owner only, any plan).
  app.delete('/boxes/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!/^[0-9a-f-]{36}$/i.test(id)) return reply.code(404).send({ error: 'not_found' });
    const res = await pool.query(
      `delete from saved_boxes where id = $1 and user_id = $2`,
      [id, request.user!.id],
    );
    if (res.rowCount === 0) return reply.code(404).send({ error: 'not_found' });
    return reply.send({ ok: true });
  });
}
