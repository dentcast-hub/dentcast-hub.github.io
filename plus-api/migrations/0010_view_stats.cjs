/**
 * Page-view denominator — AGGREGATE ONLY.
 *
 * Why this table exists: `spot_stats` counts ad impressions, but an impression
 * count alone cannot be judged. "21 guest impressions" is either healthy or a
 * bug depending entirely on how many guest page views produced them, and that
 * denominator was the one number the site never recorded. `user_activity` covers
 * only signed-in users (a guest writes nothing), and GA is structurally
 * undercounted by adblockers — so neither can answer it.
 *
 * The signal already exists and was being discarded: EVERY page view, guest or
 * signed-in, calls `GET /me` exactly once (plus/js/api.js memoizes the promise
 * per page load, and spot.js needs the answer to decide whether the visitor is
 * premium). Counting that call is therefore a page-view counter that costs no
 * extra request, needs no client change, and — unlike GA — cannot be blocked by
 * a filter list, since it rides the same first-party subdomain the API already
 * uses. Crawlers run no JavaScript, so they never call /me and never inflate it.
 *
 * Shape mirrors `spot_stats` (migration 0009) on purpose: one counter per
 * (day, viewer), never a row per view — 3 rows a day, forever. `viewer` keeps
 * `premium` separate from `plus` because premium page views must be EXCLUDED
 * from the ad denominator (those visitors are shown no ad by design, so counting
 * their views would understate delivery on the inventory that actually exists).
 *
 * `day` is the Asia/Tehran calendar day, the same boundary as the streak engine
 * and `spot_stats`, so the two tables divide cleanly.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table view_stats (
  day        date   not null,
  viewer     text   not null check (viewer in ('anon', 'plus', 'premium')),
  count      bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day, viewer)
);

-- The admin report reads a date range; the primary key already leads with day,
-- this index serves the ordered readout (same pattern as spot_stats_day_idx).
create index view_stats_day_idx on view_stats (day);
  `);
};

exports.down = (pgm) => {
  pgm.sql('drop table if exists view_stats;');
};
