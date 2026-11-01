/**
 * A minimum-XP floor for winning the weekly premium prize.
 *
 *   prize_min_weekly_xp = 30   -- same bar as promotion_min_weekly_xp (~3 active days)
 *
 * The prize picked the top of every valid group by rank alone, with no floor on
 * how much that top member had actually earned. Promotion needs 30 XP; the prize
 * needed nothing, so in a quiet group the "winner" could be granted premium for
 * a handful of points (measured: winners at 9 and 11 XP). A near-idle group
 * should mint no premium at all. Seeded at the promotion bar; it is its own knob
 * so the two can be tuned apart. 0 means no floor (the pre-fix behaviour), kept
 * as an explicit opt-out rather than an accident of a missing row.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_config (key, value) values
  ('prize_min_weekly_xp', '30')
on conflict (key) do nothing;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
delete from league_config where key = 'prize_min_weekly_xp';
`);
};
