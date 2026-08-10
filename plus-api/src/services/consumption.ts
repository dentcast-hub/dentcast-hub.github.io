import type pg from 'pg';
import { pool } from '../db.js';

/**
 * content_ids the user has meaningfully consumed: highlighted, read through
 * (article_completed), or listened through (episode_listened). Shared by the
 * dashboard folder-progress bars (dashboard.ts GET /progress) and pathway step
 * completion (pathways.ts), so "done" means the same thing everywhere.
 */
export async function getConsumedContentIds(
  userId: string,
  runner: Pick<pg.Pool, 'query'> | pg.PoolClient = pool,
): Promise<Set<string>> {
  const res = await runner.query<{ content_id: string }>(
    `select distinct content_id from (
       select content_id from highlights where user_id = $1
       union
       select content_id from user_activity
        where user_id = $1 and action in ('article_completed','episode_listened')
          and content_id is not null
     ) t`,
    [userId],
  );
  return new Set(res.rows.map((r) => r.content_id));
}

/**
 * Same union as getConsumedContentIds, but keyed to the FIRST time each
 * content_id was consumed. AI review cards mature one day after that instant
 * (services/leitner.ts box 1's own interval) — see routes/review.ts — so the
 * "when" matters here in a way getConsumedContentIds never needed.
 */
export async function getConsumedContentTimes(
  userId: string,
  runner: Pick<pg.Pool, 'query'> | pg.PoolClient = pool,
): Promise<Map<string, Date>> {
  const res = await runner.query<{ content_id: string; first_at: Date }>(
    `select content_id, min(created_at) as first_at from (
       select content_id, created_at from highlights where user_id = $1
       union all
       select content_id, created_at from user_activity
        where user_id = $1 and action in ('article_completed','episode_listened')
          and content_id is not null
     ) t group by content_id`,
    [userId],
  );
  return new Map(res.rows.map((r) => [r.content_id, new Date(r.first_at)]));
}
