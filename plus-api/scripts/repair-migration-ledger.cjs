/**
 * Ledger repair, run once per boot before `node-pg-migrate up`.
 *
 * node-pg-migrate identifies an applied migration by its FILENAME. So renaming a
 * migration file that has already run somewhere turns that environment's ledger
 * into a reference to a file the repo no longer contains — and the next boot
 * either tries to apply the renamed file a second time (create table … already
 * exists) or refuses to start over the ordering check. Neither is recoverable
 * from inside the container, which is where this API applies its migrations, and
 * both present as "the API will not come up".
 *
 * That is not hypothetical: it happened on 2026-08-11. Two branches minted
 * `0037` at the same time (`0037_badge_grants` on main, `0037_pillar_grants` on
 * a branch); the branch image was deployed first, so production ran and recorded
 * `0037_pillar_grants`; the file was then renumbered to `0038` to settle the
 * collision, and the next deploy crash-looped on
 *
 *     Not run migration 0037_badge_grants is preceding already run migration
 *     0037_pillar_grants
 *
 * This table is the one-line correction: an applied migration keeps its
 * identity when its file is renumbered, so the ledger goes on describing what
 * the database actually contains. Adding a row here is for a RENUMBERED file
 * only — never for one whose SQL changed, which needs its own migration.
 *
 * Idempotent by construction: the update matches nothing once it has run, and
 * nothing at all on a database that never saw the old name (a fresh deploy, a
 * test database, a developer's laptop). A missing `pgmigrations` table means a
 * brand-new database and is not an error.
 */

const pg = require('pg');

const RENAMES = [
  { from: '0037_pillar_grants', to: '0038_pillar_grants' },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('[ledger-repair] no DATABASE_URL; skipping');
    return;
  }
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const exists = await client.query(
      "select to_regclass('public.pgmigrations') is not null as ok",
    );
    if (!exists.rows[0]?.ok) {
      console.log('[ledger-repair] no pgmigrations table yet — new database, nothing to repair');
      return;
    }
    for (const { from, to } of RENAMES) {
      // The NOT EXISTS guard keeps this a no-op if both names are somehow
      // present, rather than collapsing two ledger rows into one.
      const res = await client.query(
        `update pgmigrations set name = $2
          where name = $1
            and not exists (select 1 from pgmigrations where name = $2)`,
        [from, to],
      );
      if (res.rowCount > 0) console.log(`[ledger-repair] ${from} -> ${to}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  // Never block the boot on the repair itself: if it cannot run, the migration
  // step that follows is still the authority on whether the schema is usable,
  // and it will fail loudly on its own if this mattered.
  console.error('[ledger-repair] skipped:', err.message);
});
