/**
 * The weekly premium prize moves from "top 2 of the highest tier" to "the top
 * of every valid group", and gains a cooldown.
 *
 * WHY: the old rule stopped at the first tier that had a finalized group, so
 * the week ANY user reached amalgam, every remaining acrylic player — the large
 * majority — became permanently ineligible. The reward was structurally
 * unreachable from where most users actually stand, and unreachable precisely
 * for the cohort that churns (d7 retention was 8.5% when this was decided).
 *
 * Group-level is also where the competition really happens: the UI shows a user
 * their own group of 8, never their whole tier, so "first in your group" is a
 * target they can see.
 *
 * The three numbers live here rather than in code, per spec 11 (no behavioural
 * number hardcoded) and so they can be retuned via POST /admin/league/config
 * without a deploy:
 *
 *   prize_days             3  - a taste of premium, not a substitute for
 *                               subscribing. With the cooldown below, a
 *                               consistently strong user holds premium roughly
 *                               3 days in every 21 (~14% of the time).
 *   prize_cooldown_weeks   2  - a winner sits out the next two weeks. Chosen
 *                               over a lifetime cap ("you may win twice, ever")
 *                               because a cap punishes success: the most
 *                               engaged users are exactly the ones it would
 *                               permanently strip the reward from. A cooldown
 *                               never says "never again" — and it rotates the
 *                               prize through ~3 different people per group,
 *                               so three times as many users get to experience
 *                               winning at the same cost.
 *   prize_winners_per_group 1
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_config (key, value) values
  ('prize_days', '3'),
  ('prize_cooldown_weeks', '2'),
  ('prize_winners_per_group', '1')
on conflict (key) do nothing;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
delete from league_config
 where key in ('prize_days', 'prize_cooldown_weeks', 'prize_winners_per_group');
`);
};
