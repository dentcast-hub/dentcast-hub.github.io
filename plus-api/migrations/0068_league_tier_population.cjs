/**
 * The top of the ladder could not promote, because ONE number was answering
 * two different questions (founder, 2026-09-26).
 *
 * `capacity_at_creation` is the group's JOIN CEILING — how many members fit
 * before a second group opens — and since 0033 it is also the whole of the
 * «is this a real competition» test: `filled = size >= capacity_at_creation`,
 * which at the top of the pyramid is read as «the entire tier is in this
 * group, so this is a championship rather than a thin group».
 *
 * Those two readings disagree the moment 0033's floor applies. `tierCapacity`
 * is `max(min_group_capacity, min(group_size_current, population))`, and that
 * floor exists for a real reason the same migration states: a tier holding one
 * person would get capacity 1, be instantly full, and DEMOTE its sole member
 * every week. But the floor also makes the sentence «the entire tier is here»
 * unsayable for any tier thinner than three people — the group's capacity is
 * then a number its whole population cannot reach.
 *
 * zirconia is the measurement. It opened on 2026-09-18 with two members, both
 * of whom competed in week 2026-09-19 and finished with 226 and 112 weekly XP
 * — far above `promotion_min_weekly_xp` (15), both inside a 30% promotion zone
 * of a two-person group. Neither promoted, and titanium therefore never
 * opened, because `valid` was decided before rank was ever consulted:
 * `2 >= 6` is false and `filled` was `2 >= 3`, the floor, not the population.
 * The 39 promotions that same finalize prove the machinery ran; the top of the
 * ladder was simply the one place where the group could not be valid.
 *
 * And it gets HARDER with time, not easier: every promotion into the top tier
 * raises its population, so `filled` recedes while the six-member floor stays
 * out of reach for a tier that is thin by construction. The ladder's ceiling
 * was a one-way ratchet again — the same shape 0033 fixed for demotion, now
 * blocking promotion instead.
 *
 * So the two questions get two numbers. `population_at_creation` is the
 * tier's REAL population, unfloored, frozen on the row exactly as the capacity
 * is and for the same reason — «was that group valid» must have the same
 * answer a year later, whatever the tier's population has done since.
 * `capacity_at_creation` keeps its floor and keeps both of its own jobs: the
 * join ceiling, and the gate in front of DEMOTION, so 0033's lone member is
 * still not demoted for existing.
 *
 * NULL means «a group created before this migration». Every reader of the new
 * column coalesces to `capacity_at_creation`, so an already-finalized week is
 * judged by precisely the rule it was finalized under, and no historical
 * medal, rank or outcome changes meaning. There is deliberately no backfill:
 * the tier populations those rows were created against are gone, and inventing
 * them from today's populations would rewrite the past rather than record it.
 *
 * `min_rankable_group_size` is the guard that replaces the floor's other half.
 * «The whole tier is here» is not a competition when the whole tier is one
 * person — a rank of one is not a result (the same sentence 0033 and
 * `prize_min_group_size` both rest on). Two, because two is where a ranking
 * starts existing at all; a league_config key rather than a constant, because
 * spec 11 is that no behavioural number is hardcoded.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table leagues add column population_at_creation int;

insert into league_config (key, value) values
  ('min_rankable_group_size', '2')
on conflict (key) do nothing;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table leagues drop column population_at_creation;
delete from league_config where key = 'min_rankable_group_size';
`);
};
