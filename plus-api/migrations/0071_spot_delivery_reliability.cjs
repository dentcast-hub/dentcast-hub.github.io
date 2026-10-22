// Add a separate mounted-card counter without redefining an IAB-viewable impression.
// Receipts make client retries idempotent, while the public report remains aggregate-only.
exports.shorthands = undefined;
exports.up = (pgm) => {
  pgm.sql(`
    alter table spot_stats drop constraint if exists spot_stats_kind_check;
    alter table spot_stats add constraint spot_stats_kind_check
      check (kind in ('rendered', 'impression', 'click'));
    create table spot_delivery_receipts (
      id uuid primary key,
      created_at timestamptz not null default now()
    );
    create index spot_delivery_receipts_created_idx on spot_delivery_receipts (created_at);
  `);
};
exports.down = (pgm) => {
  pgm.sql(`
    drop table if exists spot_delivery_receipts;
    delete from spot_stats where kind = 'rendered';
    alter table spot_stats drop constraint if exists spot_stats_kind_check;
    alter table spot_stats add constraint spot_stats_kind_check
      check (kind in ('impression', 'click'));
  `);
};
