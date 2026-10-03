/**
 * Three tiers above titanium (founder, 1405/07/11).
 *
 * The ladder shipped with seven tiers and the note «never rename or reorder
 * after launch» (0006). Adding ABOVE the top is neither: every existing row
 * keeps its slug, its name and its order, and the week already decided under
 * «titanium has nothing above it» keeps its outcome — the finalize only ever
 * reads the tier above at decision time, so a 'stayed' from a past week is a
 * record, not a rule that re-runs.
 *
 * Titanium filled in the week of 1405/07/10, which is the first time the
 * ceiling was a place somebody could be rather than a number. The materials
 * continue the ladder's own logic — restorative materials from the imitation
 * towards the original — and END on the original: platinum (the foil the
 * porcelain jacket crown was baked on), cast gold (the inlay that is still the
 * standard every other restoration is measured against), and enamel, which is
 * what every tier below it has been imitating. The names are the founder's.
 *
 * All three start inactive, as tiers 4–7 did: a tier opens the moment a
 * promotion needs it (league-finalize.ts's `up`), never by hand.
 *
 * Nothing in the code counts to seven. Promotion, the «no tier above» test for
 * the champion's prize, `promotion_zone: 0` on the top group — all read
 * `byOrder.get(tier_order + 1)`, so the ceiling moves by itself. The
 * tier-specific pieces outside this table (the shield gradients `.dcp-tier-t8`
 * to `-t10`, «سلطان»'s threshold, «جلودار»'s copy) change in the same commit.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_tiers (slug, name_fa, tier_order, is_active, activated_at) values
  ('platinum',  'پلاتین',        8,  false, null),
  ('cast-gold', 'طلای ریختگی',   9,  false, null),
  ('enamel',    'مینا',          10, false, null)
on conflict (slug) do nothing;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
update profiles set current_tier_id = (select id from league_tiers where slug = 'titanium')
 where current_tier_id in (select id from league_tiers where slug in ('platinum', 'cast-gold', 'enamel'));
delete from league_tiers where slug in ('platinum', 'cast-gold', 'enamel');
`);
};
