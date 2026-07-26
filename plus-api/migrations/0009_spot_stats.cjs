/**
 * Spot (ad system) telemetry — AGGREGATE ONLY.
 *
 * Volume rationale: a spot impression fires on every page view × every enabled
 * slot, which is an order of magnitude more traffic than `article_viewed`. A row
 * per impression would make `user_activity` / `anon_events` the biggest tables in
 * the database within weeks and turn every report into a full scan. So Spot never
 * writes a raw event row: it UPSERTs a counter keyed by
 * (day, slot, creative, viewer, kind), which keeps the table at
 * days × slots × creatives × 2 × 2 rows (a few hundred a month) and makes the
 * admin report a sum over a handful of rows.
 *
 * Consequences, on purpose:
 *   - no per-user attribution for ad views (we never wanted it — ads are not a
 *     personal-profile signal, and this keeps the log identity-free),
 *   - `viewer` is filled SERVER-side from the presence of a valid session cookie
 *     ('anon' | 'plus'), never trusted from the client body.
 *
 * `day` is the Asia/Tehran calendar day (same boundary as the streak engine), so
 * the report agrees with every other daily number on the site.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table spot_stats (
  day        date   not null,
  slot       text   not null,
  creative   text   not null,
  viewer     text   not null check (viewer in ('anon', 'plus')),
  kind       text   not null check (kind in ('impression', 'click')),
  count      bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day, slot, creative, viewer, kind)
);

-- Range scans by date are the only access pattern of the admin report; the
-- primary key already leads with day, this index serves the ordered readout.
create index spot_stats_day_idx on spot_stats (day);
  `);
};

exports.down = (pgm) => {
  pgm.sql('drop table if exists spot_stats;');
};
