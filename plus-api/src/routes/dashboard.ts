import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { pool } from '../db.js';
import { buildTree } from '../content-index.js';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // GET /tree - the user's highlight counts per taxonomy branch, links only.
  // No highlight bodies, no cross-article aggregation (that is premium).
  app.get('/tree', async (request, reply) => {
    const rows = await pool.query<{ content_id: string; n: number }>(
      `select content_id, count(*)::int as n
         from highlights where user_id = $1
        group by content_id`,
      [request.user!.id],
    );
    const counts = new Map(rows.rows.map((r) => [r.content_id, r.n]));
    const tree = buildTree(counts);
    const total = rows.rows.reduce((a, r) => a + r.n, 0);
    return reply.send({ total_highlights: total, ...tree });
  });

  // GET /progress - per-content completion states + personal stats.
  app.get('/progress', async (request, reply) => {
    const userId = request.user!.id;
    const completed = await pool.query<{ content_id: string; last: string }>(
      `select content_id, max(created_at) as last
         from user_activity
        where user_id = $1 and action = 'article_completed' and content_id is not null
        group by content_id`,
      [userId],
    );
    const stats = await pool.query<{ total_highlights: number; articles_with_highlights: number }>(
      `select count(*)::int as total_highlights,
              count(distinct content_id)::int as articles_with_highlights
         from highlights where user_id = $1`,
      [userId],
    );
    const lastArticle = await pool.query<{ content_id: string }>(
      `select content_id from user_activity
        where user_id = $1 and content_id is not null
          and action in ('highlight_created','article_completed','card_reviewed_manual')
        order by created_at desc limit 1`,
      [userId],
    );
    return reply.send({
      current_streak: request.user!.current_streak,
      longest_streak: request.user!.longest_streak,
      total_highlights: stats.rows[0]?.total_highlights ?? 0,
      articles_with_highlights: stats.rows[0]?.articles_with_highlights ?? 0,
      completed: completed.rows.map((r) => ({ content_id: r.content_id, at: r.last })),
      last_content_id: lastArticle.rows[0]?.content_id ?? null,
    });
  });

  // GET /export/highlights - full dump of the user's own data. Any plan, any
  // time. The concrete embodiment of principle 2 (ownership is the user's).
  app.get('/export/highlights', async (request, reply) => {
    const rows = await pool.query(
      `select content_id, exact, prefix, suffix, color, underline, cloze_markers,
              note, label, content_hash, created_at, updated_at
         from highlights where user_id = $1
        order by content_id asc, created_at asc`,
      [request.user!.id],
    );
    reply.header('content-disposition', 'attachment; filename="dentcast-highlights.json"');
    return reply.send({
      exported_at: new Date().toISOString(),
      display_name: request.user!.display_name,
      count: rows.rowCount,
      highlights: rows.rows,
    });
  });
}
