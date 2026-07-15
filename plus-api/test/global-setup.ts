import pg from 'pg';
// node-pg-migrate exposes a named `runner` and no default export under ESM;
// importing a default gives undefined (and vitest then throws "not a function").
import { runner as migrate } from 'node-pg-migrate';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const TEST_DB_URL =
  process.env.DATABASE_URL ??
  'postgres://dentcast:dentcast@localhost:5432/dentcast_plus_test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '..', 'migrations');

function adminUrl(url: string): { admin: string; dbName: string } {
  const u = new URL(url);
  const dbName = u.pathname.replace(/^\//, '');
  u.pathname = '/postgres';
  return { admin: u.toString(), dbName };
}

export async function setup(): Promise<void> {
  const { admin, dbName } = adminUrl(TEST_DB_URL);

  // Create the test database if it does not exist.
  const client = new pg.Client({ connectionString: admin });
  await client.connect();
  if (!/^[a-z0-9_]+$/i.test(dbName)) throw new Error(`unsafe test db name: ${dbName}`);
  const exists = await client.query('select 1 from pg_database where datname = $1', [dbName]);
  if (exists.rowCount === 0) {
    await client.query(`create database "${dbName}"`);
  }
  await client.end();

  // Apply migrations to the fresh/existing test DB (idempotent).
  await migrate({
    databaseUrl: TEST_DB_URL,
    dir: migrationsDir,
    direction: 'up',
    migrationsTable: 'pgmigrations',
    count: Infinity,
    log: () => {},
  });
}
