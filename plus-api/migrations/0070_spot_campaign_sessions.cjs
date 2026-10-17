// Optional three-visit campaign schedule managed from /admin.
exports.shorthands = undefined;
exports.up = (pgm) => {
  pgm.sql(`
    create table if not exists spot_campaign_controls (
      id boolean primary key default true check (id = true),
      sessions jsonb not null check (jsonb_typeof(sessions) = 'array' and jsonb_array_length(sessions) = 3),
      use_default boolean not null default false,
      updated_at timestamptz not null default now()
    );
  `);
};
// Keep the saved schedule on rollback; older API versions simply ignore it.
exports.down = () => {};
