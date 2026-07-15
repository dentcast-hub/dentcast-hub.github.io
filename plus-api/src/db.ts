import pg from 'pg';
import { config } from './config.js';

// Keep bigint (int8) as a JS number where safe. Our bigserial ids (activity,
// anon_events) will not exceed Number.MAX_SAFE_INTEGER for the lifetime of this
// project, and returning strings would leak into every caller.
pg.types.setTypeParser(20, (v) => (v === null ? null : Number(v)));

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
 */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  await pool.end();
}
