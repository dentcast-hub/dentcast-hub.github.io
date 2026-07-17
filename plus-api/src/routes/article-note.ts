import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { pool } from '../db.js';

// A single note per article (per user), independent of highlights. Opened from the
// workbench یادداشت button. Empty/whitespace note clears the row's content.
export async function articleNoteRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /article-note?content_id=SLUG -> { note: string | null }
  app.get('/article-note', async (request, reply) => {
    const { content_id } = request.query as { content_id?: string };
    if (!content_id) return reply.code(400).send({ error: 'content_id_required' });
    const res = await pool.query<{ note: string | null }>(
      `select note from article_notes where user_id = $1 and content_id = $2`,
      [request.user!.id, content_id],
    );
    return reply.send({ note: res.rows[0]?.note ?? null });
  });

  // PUT /article-note { content_id, note } -> upsert; returns the stored note
  app.put('/article-note', {
    schema: {
      body: {
        type: 'object',
        required: ['content_id'],
        properties: {
          content_id: { type: 'string' },
          note: { type: ['string', 'null'] },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as { content_id: string; note?: string | null };
    const note = b.note && b.note.trim() ? b.note : null;
    await pool.query(
      `insert into article_notes (user_id, content_id, note, updated_at)
       values ($1, $2, $3, now())
       on conflict (user_id, content_id)
       do update set note = excluded.note, updated_at = now()`,
      [request.user!.id, b.content_id, note],
    );
    return reply.send({ note });
  });
}
