/**
 * Two numbers the pyramid needed and did not have.
 *
 * `min_group_capacity` — the floor under a group's capacity, now that capacity is
 * computed per TIER instead of read from the single global `group_size_current`.
 *
 * The old arrangement had one number for every tier, and that number is tuned by
 * the smoothed count of ALL weekly-active users (SIZE_STEPS in
 * league-finalize.ts). On 2026-08-09 that meant 15, derived from ~122 actives of
 * whom 258 profiles sat in acrylic and exactly 5 in composite — so composite's
 * only group had capacity 15 and a population of 5, and `filled` (the condition
 * finalizeWeek requires before it will demote anyone) could never become true.
 * The top tier was a one-way ratchet: you climbed in and stayed forever, because
 * the pressure that is supposed to push the bottom of a group back down was
 * gated on a fullness that the thinnest tier cannot reach by construction.
 *
 * A floor is needed because the same formula, unguarded, breaks at the other
 * end: a tier holding one person would get capacity 1, be instantly "full", and
 * demote its sole member (ceil(1 × demotion_pct/100) = 1) every single week.
 * Three is the same floor prize_min_group_size uses, and for the same reason —
 * below it, a rank is not a result.
 *
 * `top_tier_prize_days` — how long the premium prize lasts in the HIGHEST ACTIVE
 * tier, where there is no promotion to win.
 *
 * Finishing first in composite paid exactly what finishing first in acrylic
 * paid, while being strictly harder and leading nowhere: `isTop` blocks
 * promotion by definition, so the top tier's whole outcome is the prize. Three
 * days rather than two, and deliberately LONGER rather than WIDER — raising
 * prize_winners_per_group there would have crowned 3 of 5 people and made "first
 * in your group" mean less at the top than at the bottom, which is the exact
 * inversion premium-prize.ts's winnersTarget scaling exists to prevent.
 *
 * THREE, not seven, and the difference is the whole point of the number. The top
 * tier is thin and its champion tends to repeat, and prize_cooldown_weeks is
 * currently 0 — so a week-long prize, won weekly, is simply premium, free and
 * forever, for the handful of readers most likely to have bought it. The prize
 * has to stay a prize: three days leaves four without, every week — the majority
 * of the week spent wanting the thing, which is what keeps a subscription worth
 * buying to the very person the prize reaches most often. Longer than everyone
 * else's, and deliberately short of half a week.
 *
 * 0 falls back to prize_days, like every other ceiling in league_config.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_config (key, value) values
  ('min_group_capacity', '3'),
  ('top_tier_prize_days', '3')
on conflict (key) do nothing;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
delete from league_config where key in ('min_group_capacity', 'top_tier_prize_days');
`);
};
