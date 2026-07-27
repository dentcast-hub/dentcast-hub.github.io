/**
 * Spot telemetry — add the HOST dimension.
 *
 * Why: on 2026-07-27 a report showed 447 impressions against an audience that
 * looked four times larger, and the first question — "how much of this came from
 * dentcast.ir versus dentcast.org?" — could not be answered at all. The counters
 * had no host column, so a whole day went into ruling out CDN staleness, CORS and
 * rate limits by hand. The site ships from two mirrors; a report that cannot
 * separate them cannot be checked against either domain's own audience numbers.
 *
 * The value is derived SERVER-side from the Origin (falling back to Referer)
 * header, never from the request body — same rule as `viewer`. A client must not
 * be able to label its own traffic, or the split becomes a suggestion.
 *
 * Existing rows predate the dimension and are stamped 'unknown' rather than
 * guessed: they are real deliveries whose origin we genuinely do not know, and
 * inventing a host for them would corrupt the exact comparison this column
 * exists to make. `unknown` therefore also means "before 2026-07-27".
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
-- 1. Add the column with the honest default for the rows already here.
alter table spot_stats add column host text not null default 'unknown';

-- 2. Widen the primary key. The old key would collapse .ir and .org into one
--    counter, which is precisely the blindness being removed.
alter table spot_stats drop constraint spot_stats_pkey;
alter table spot_stats add primary key (day, slot, creative, viewer, kind, host);

-- 3. Drop the default: from here on every write states its host explicitly, so a
--    missing value is a bug that shows up as a write error, not as a silent
--    'unknown' row that quietly rebuilds the blind spot.
alter table spot_stats alter column host drop default;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table spot_stats drop constraint spot_stats_pkey;
-- Collapsing the host back into one key can create duplicates, so fold them
-- before restoring the narrower primary key.
create temp table spot_stats_folded as
  select day, slot, creative, viewer, kind, sum(count)::bigint as count, max(updated_at) as updated_at
    from spot_stats group by 1, 2, 3, 4, 5;
delete from spot_stats;
alter table spot_stats drop column host;
insert into spot_stats (day, slot, creative, viewer, kind, count, updated_at)
  select day, slot, creative, viewer, kind, count, updated_at from spot_stats_folded;
alter table spot_stats add primary key (day, slot, creative, viewer, kind);
  `);
};
