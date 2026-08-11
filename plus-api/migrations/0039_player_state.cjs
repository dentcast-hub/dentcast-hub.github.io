/**
 * Account-level player resume state — «از همان‌جا ادامه بده، روی هر دستگاه».
 *
 * The player has always resumed from localStorage (dc-resume-state): fine for
 * an anonymous listener, but a signed-in reader who leaves the clinic desktop
 * mid-episode and opens the phone player started over. This table is that same
 * one-record state, keyed to the ACCOUNT instead of the device.
 *
 * Deliberately one row per user (user_id is the primary key), not a history:
 * the player's contract is "what was I last listening to and where", nothing
 * more. Listening history/scoring already lives in the activity log and the
 * listening service — this table must never grow a second meaning.
 *
 * The client keeps writing localStorage in parallel (offline resilience, and
 * the anonymous path unchanged); on mount it compares the two records'
 * timestamps and the newer one wins, so a device that played offline is not
 * clobbered by a stale server row.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table player_state (
  user_id    uuid primary key references profiles(id) on delete cascade,
  episode    integer not null,
  position   real not null default 0,
  anchor     integer,
  speed      real,
  updated_at timestamptz not null default now()
);
`);
};

exports.down = (pgm) => {
  pgm.sql(`
drop table if exists player_state;
`);
};
