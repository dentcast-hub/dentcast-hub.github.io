/**
 * Separate the prize floor from the promotion floor.
 *
 * Both used to key off min_valid_group_size (6), which conflated two different
 * questions:
 *
 *   "is this a fair race for PROMOTION?"  — 6 is right. A four-person contest
 *                                            should not decide who moves tier.
 *   "who gets the weekly PRIZE?"          — the top of the group, even a small
 *                                            one. Being first among four is
 *                                            still a real result.
 *
 * Tying the prize to the promotion floor created a dead end: finalizeWeek gives
 * an undersized group no promotions, and the prize gave it no winner either. So
 * once the upper tiers thin out — which is exactly what happens as more tiers
 * activate over a fixed population — a user who climbs lands in a thin group
 * where they can neither win nor advance, while the people they left behind in
 * acrylic keep winning every week. Climbing made you worse off.
 *
 * prize_min_group_size is deliberately 3 and not 0: a group of one would
 * auto-win every week for doing nothing, which is not a result either.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_config (key, value) values ('prize_min_group_size', '3')
on conflict (key) do nothing;
`);
};

exports.down = (pgm) => {
  pgm.sql("delete from league_config where key = 'prize_min_group_size';");
};
