import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { pool } from '../db.js';
import { buildFolderTree, getFolders, folderOf } from '../content-index.js';
import { config } from '../config.js';
import { QUALIFYING_ACTIONS, streakIsAlive, displayStreak } from '../services/streak.js';
import {
  computeScore, freezesUsedCount, freezesAvailable, pointsToNextFreeze,
  SHIELD_CAP, SHIELD_POINTS,
} from '../services/score.js';
import { dayInTz, previousDay, nextDay, weekStartSaturday } from '../services/time.js';

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

    // The current week, starting Saturday (Iranian week). Marks which days had a
    // qualifying action. Looks back far enough to cover the whole week.
    const active = await pool.query<{ d: string }>(
      `select distinct (created_at at time zone $2)::date as d
         from user_activity
        where user_id = $1 and action = any($3) and created_at >= now() - interval '9 days'`,
      [userId, tz, actions],
    );
    const activeSet = new Set(active.rows.map((r) => r.d));
    const today = dayInTz(new Date(), tz);
    const week: Array<{ day: string; active: boolean }> = [];
    let cursor = weekStartSaturday(today); // Saturday
    for (let i = 0; i < 7; i += 1) { week.push({ day: cursor, active: activeSet.has(cursor) }); cursor = nextDay(cursor); }

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
        // 0 once the run can no longer be saved (the cache resets lazily).
        current_streak: await displayStreak(pool, userId, request.user!, today),
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

  // GET /tree - the real site folders, each with the user's highlight count and
  // its landing-page link. Navigation only; no bodies, no cross-article aggregation.
  app.get('/tree', async (request, reply) => {
    const rows = await pool.query<{ content_id: string; n: number }>(
      `select content_id, count(*)::int as n
         from highlights where user_id = $1
        group by content_id`,
      [request.user!.id],
    );
    const counts = new Map(rows.rows.map((r) => [r.content_id, r.n]));
    const folders = buildFolderTree(counts);
    const total = rows.rows.reduce((a, r) => a + r.n, 0);
    return reply.send({ total_highlights: total, folders });
  });

  // GET /progress - per-folder progress + personal stats + score.
  app.get('/progress', async (request, reply) => {
    const userId = request.user!.id;
    const stats = await pool.query<{ total_highlights: number; articles_with_highlights: number }>(
      `select count(*)::int as total_highlights,
              count(distinct content_id)::int as articles_with_highlights
         from highlights where user_id = $1`,
      [userId],
    );
    const lastArticle = await pool.query<{ content_id: string }>(
      `select content_id from user_activity
        where user_id = $1 and content_id is not null
          and action in ('highlight_created','article_completed','episode_listened','card_reviewed_manual')
        order by created_at desc limit 1`,
      [userId],
    );
    // Consumption progress per folder: distinct pages the user has ENGAGED with -
    // finished reading (`article_completed`), listened through (`episode_listened`),
    // OR highlighted inside (a highlight is direct evidence of reading). Reading and
    // listening are both emitted by the client now (reading.js / listening.js), so a
    // podcast episode heard through counts here exactly like an article read.
    // Progress bar = consumed / folder total, both sides deriving from the same
    // content index the dashboard tree uses; totals reflect currently published
    // content, so new items lower a folder's percent until consumed.
    const readRows = await pool.query<{ content_id: string }>(
      `select distinct content_id from (
         select content_id from highlights where user_id = $1
         union
         select content_id from user_activity
          where user_id = $1 and action in ('article_completed','episode_listened')
            and content_id is not null
       ) t`,
      [userId],
    );
    const readByFolder = new Map<string, number>();
    for (const r of readRows.rows) {
      const f = folderOf(r.content_id);
      readByFolder.set(f, (readByFolder.get(f) || 0) + 1);
    }
    const folder_progress = getFolders().map((f) => ({
      key: f.key, fa: f.fa, url: f.url, total: f.total,
      read: Math.min(readByFolder.get(f.key) || 0, f.total),
    }));

    // Score: a concrete, activity-log-derived metric, ready for a future
    // leaderboard. Base = qualifying active days (monotonic) plus a small
    // per-highlight bonus. Streak is the headline; this is the comparable total.
    const { score, active_days: activeDays } = await computeScore(pool, userId);
    const totalHl = stats.rows[0]?.total_highlights ?? 0;

    // Streak shields (سپر استریک): one per SHIELD_POINTS of score, capped, spent
    // automatically to save the streak on a missed day (see the streak engine).
    const freezesUsed = await freezesUsedCount(pool, userId);
    const freezesAvail = freezesAvailable(score, freezesUsed);

    // Streak shown as 0 once the run can no longer be saved (cache is lazy);
    // reuses the shields already computed above instead of re-querying.
    const today = dayInTz(new Date(), config.streakTimezone);
    const shownStreak = streakIsAlive(request.user!.last_active_day, today, freezesAvail)
      ? request.user!.current_streak : 0;

    return reply.send({
      current_streak: shownStreak,
      longest_streak: request.user!.longest_streak,
      total_highlights: totalHl,
      articles_with_highlights: stats.rows[0]?.articles_with_highlights ?? 0,
      last_content_id: lastArticle.rows[0]?.content_id ?? null,
      folder_progress,
      score,
      score_active_days: activeDays,
      freezes: {
        available: freezesAvail,
        cap: SHIELD_CAP,
        points: SHIELD_POINTS,
        next_in: pointsToNextFreeze(score, freezesAvail),
      },
    });
  });

  // GET /seen - content_ids the user has seen, for the landing-page "seen" ticks
  // (a Plus benefit; cross-device because it's account-scoped). "Seen" = ANY
  // engagement with a page: opening it (article_viewed), reading it through
  // (article_completed), listening (episode_listened), or highlighting.
  app.get('/seen', async (request, reply) => {
    const res = await pool.query<{ content_id: string }>(
      `select distinct content_id from user_activity
        where user_id = $1 and content_id is not null
          and action in ('article_viewed','article_completed','episode_listened',
                          'highlight_created','card_reviewed_manual','review_finished')`,
      [request.user!.id],
    );
    return reply.send({ seen: res.rows.map((r) => r.content_id) });
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
