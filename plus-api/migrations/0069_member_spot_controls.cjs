/* Additive: no existing campaign, subscription, or profile is rewritten. */
exports.shorthands = undefined;
exports.up = (pgm) => {
  pgm.sql(`
    create index if not exists profiles_joined_id_idx on profiles (created_at, id);
    create table if not exists spot_controls (
      slot text primary key,
      enabled boolean not null,
      use_default boolean not null default false,
      creative jsonb not null check (jsonb_typeof(creative) = 'object'),
      updated_at timestamptz not null default now()
    );
  `);
};
// Retain saved campaigns even on rollback. The older app simply ignores them.
exports.down = () => {};
