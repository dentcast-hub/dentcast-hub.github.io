import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { pool } from '../db.js';
import { buildTree } from '../content-index.js';
import { config } from '../config.js';
import { QUALIFYING_ACTIONS } from '../services/streak.js';
import { dayInTz, previousDay } from '../services/time.js';

export async function dashboardRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  // PATCH /me - edit the pseudonym and/or merge settings (e.g. reminders).
  app.patch('/me', {
    schema: {
      body: {
        type: 'object',
        properties: {
          display_name: { type: 'string', minLength: 1, maxLength: 40 },
          settings: { type: 'object', additionalProperties: true },
        },
      },
    },
  }, async (request, reply) => {
    const b = request.body as { display_name?: string; settings?: Record<string, unknown> };
    const sets: string[] = [];
    const vals: unknown[] = [request.user!.id];
    if (b.display_name !== undefined) { sets.push(`display_name = $${vals.length + 1}`); vals.push(b.display_name.trim()); }
    if (b.settings !== undefined) { sets.push(`settings = settings || $${vals.length + 1}::jsonb`); vals.push(JSON.stringify(b.settings)); }
    if (!sets.length) return reply.code(400).send({ error: 'nothing_to_update' });
    const res = await pool.query(
      `update profiles set ${sets.join(', ')} where id = $1
        returning display_name, settings`,
      vals,
    );
    return reply.send(res.rows[0]);
  });

  // GET /profile/stats - week streak strip, month-vs-month, records (spec 2.7).
  app.get('/profile/stats', async (request, reply) => {
    const userId = request.user!.id;
    const tz = config.streakTimezone;
    const actions = Array.from(QUALIFYING_ACTIONS);

    // Active Tehran days in the last 8 days (for a 7-day strip).
    const active = await pool.query<{ d: string }>(
      `select distinct (created_at at time zone $2)::date as d
         from user_activity
        where user_id = $1 and action = any($3) and created_at >= now() - interval '8 days'`,
      [userId, tz, actions],
    );
    const activeSet = new Set(active.rows.map((r) => r.d));
    const today = dayInTz(new Date(), tz);
    const week: Array<{ day: string; active: boolean }> = [];
    let cursor = today;
    for (let i = 0; i < 7; i += 1) { week.unshift({ day: cursor, active: activeSet.has(cursor) }); cursor = previousDay(cursor); }

    // Highlights per Tehran month + active days per Tehran month.
    const hlByMonth = await pool.query<{ ym: string; n: number }>(
      `select to_char((created_at at time zone $2), 'YYYY-MM') as ym, count(*)::int as n
         from highlights where user_id = $1 group by ym`,
      [userId, tz],
    );
    const daysByMonth = await pool.query<{ ym: string; n: number }>(
      `select ym, count(*)::int as n from (
         select distinct to_char((created_at at time zone $2), 'YYYY-MM') as ym,
                (created_at at time zone $2)::date as d
           from user_activity where user_id = $1 and action = any($3)
       ) t group by ym`,
      [userId, tz, actions],
    );
    const thisMonth = today.slice(0, 7);
    const lastMonth = previousDay(today.slice(0, 7) + '-01').slice(0, 7);
    const pick = (rows: Array<{ ym: string; n: number }>, ym: string) => rows.find((r) => r.ym === ym)?.n ?? 0;

    return reply.send({
      records: {
        current_streak: request.user!.current_streak,
        longest_streak: request.user!.longest_streak,
      },
      week,
      month_vs_month: {
        this_month: thisMonth,
        last_month: lastMonth,
        highlights_this: pick(hlByMonth.rows, thisMonth),
        highlights_last: pick(hlByMonth.rows, lastMonth),
        active_days_this: pick(daysByMonth.rows, thisMonth),
        active_days_last: pick(daysByMonth.rows, lastMonth),
      },
    });
  });

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
