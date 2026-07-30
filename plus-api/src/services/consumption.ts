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
