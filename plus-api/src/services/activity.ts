import type pg from 'pg';
import { pool } from '../db.js';

/**
 * Append an event to the append-only `user_activity` log. This log is the single
 * source of truth; every streak cache is reconstructable from it.
 *
 * The streak engine (a later milestone) extends this function to also update the
 * profile caches transactionally and append a `streak_kept` event when a new day
 * is counted. For now it only appends, so no cache is ever wrong: rebuilding from
 * the log yields the same result.
 *
 * IMPORTANT: `card_reviewed_manual` flows through here and MUST NOT touch
 * `card_state`. This function never writes to `card_state`; keep it that way.
 */
export async function recordActivity(
  userId: string,
  action: string,
  contentId: string | null = null,
  meta: Record<string, unknown> = {},
  client: pg.Pool | pg.PoolClient = pool,
): Promise<{ id: number }> {
  const res = await client.query<{ id: number }>(
    `insert into user_activity (user_id, action, content_id, meta)
     values ($1, $2, $3, $4::jsonb)
     returning id`,
    [userId, action, contentId, JSON.stringify(meta ?? {})],
  );
  return res.rows[0];
}
