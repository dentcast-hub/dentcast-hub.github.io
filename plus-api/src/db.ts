import pg from 'pg';
import { config } from './config.js';

// Keep bigint (int8) as a JS number where safe. Our bigserial ids (activity,
// anon_events) will not exceed Number.MAX_SAFE_INTEGER for the lifetime of this
// project, and returning strings would leak into every caller.
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));

// Return `date` (OID 1082) as the raw 'YYYY-MM-DD' string, not a JS Date. The
// streak engine compares Asia/Tehran calendar days as strings; a Date object
// would drag UTC/local offsets into that comparison.
pg.types.setTypeParser(1082, (v) => v);

export const pool = new pg.Pool({ connectionString: config.databaseUrl });

export type Queryable = pg.Pool | pg.PoolClient;

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
  client: Queryable = pool,
): Promise<pg.QueryResult<T>> {
  return client.query<T>(text, params as any[]);
}

/** Return the first row or null. */
export async function one<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
  client: Queryable = pool,
): Promise<T | null> {
  const res = await query<T>(text, params, client);
  return res.rows[0] ?? null;
}

/**
 * Run `fn` inside a single transaction. The streak engine relies on this: cache
 * updates and the appended `streak_kept` event must commit atomically with the
 * qualifying activity row.
 *
 * Retries once on a transient serialization failure: Postgres 40P01 (deadlock)
 * and 40001 (serialization failure). lockProfileForWrite already orders the
 * same-user scoring path so it does not deadlock, but two DIFFERENT operations
 * touching overlapping rows (a finalize sweep meeting a live write, a detached
 * post-response job) can still lose a lock race. Both codes mean "nobody is at
 * fault, just try again": the losing transaction was fully rolled back, and
 * every `fn` here writes only through its transaction client, so re-running it
 * on a fresh connection is safe and side-effect-free. The retry is bounded so a
 * genuine, repeatable deadlock still surfaces instead of spinning.
 */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const RETRYABLE = new Set(['40P01', '40001']);
  const maxAttempts = 3;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const client = await pool.connect();
    try {
      await client.query('begin');
      const result = await fn(client);
      await client.query('commit');
      return result;
    } catch (err) {
      await client.query('rollback').catch(() => { /* connection may be aborted */ });
      const code = (err as { code?: string } | null)?.code;
      if (code && RETRYABLE.has(code) && attempt < maxAttempts) {
        lastErr = err;
        continue; // the whole fn re-runs on a fresh transaction
      }
      throw err;
    } finally {
      client.release();
    }
  }
  throw lastErr;
}

/**
 * Serialize same-user scoring writes by taking the profile row's lock FIRST.
 *
 * Every scoring transaction eventually upgrades the profile row to FOR UPDATE
 * (streak.applyStreak, league.effectiveTierId). But the domain insert that
 * opens the transaction — user_activity, highlights, card_state, collection,
 * user_pathways, a challenge attempt — carries an FK to profiles and so already
 * holds FOR KEY SHARE on that row. Two concurrent same-user transactions then
 * each hold KEY SHARE and both try to upgrade, which Postgres resolves as a
 * deadlock (40P01): the losing request got a 500 and its activity/XP was lost.
 *
 * Taking FOR UPDATE as the transaction's FIRST statement removes the upgrade:
 * the second transaction blocks here until the first commits, then proceeds and
 * sees its committed rows. That both ends the deadlock and serializes the
 * weekly-cap / share / collection counts that previously raced (each ran its
 * `select count(*)` before the other committed and so both paid). Call it at
 * the top of any transaction that will call recordActivity.
 */
export async function lockProfileForWrite(client: pg.PoolClient, userId: string): Promise<void> {
  await client.query('select 1 from profiles where id = $1 for update', [userId]);
}

export async function closePool(): Promise<void> {
  await pool.end();
}
