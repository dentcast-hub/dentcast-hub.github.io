// /admin «انتشار حداقلی» on/off. Off unless the founder switches it on for a
// cut: in normal times every page goes through the full workflow. Separate
// from 0072 because 0072 was already pushed. Additive.
exports.shorthands = undefined;
exports.up = (pgm) => {
  pgm.sql(`
    create table if not exists quick_publish_settings (
      id boolean primary key default true check (id = true),
      enabled boolean not null default false,
      updated_at timestamptz not null default now()
    );
  `);
};
// Keep the switch on rollback; older API versions ignore it.
exports.down = () => {};
