/**
 * League XP for the premium features — MORE WAYS TO EARN, never a multiplier.
 *
 *   xp_pathway_step               = 3   -- a consumed item that is a step of an
 *   xp_pathway_step_weekly_cap    = 5      enrolled pathway, on top of xp_read
 *   xp_pathway_enrolled           = 5   -- starting a pathway
 *   xp_pathway_enrolled_weekly_cap= 2
 *   xp_collection_created         = 3   -- opening a board
 *   xp_collection_created_weekly_cap = 1
 *   xp_collection_item            = 1   -- pinning to a board, once per (page, week)
 *   xp_collection_item_weekly_cap = 5
 *
 * THE SHAPE OF THIS, AND WHY IT IS NOT THE OTHER SHAPE.
 *
 * The obvious way to make a subscription worth something in the league is a
 * multiplier — "premium earns +1 on everything". score.ts:102 says in as many
 * words that the league is the one place that must never happen, and it is
 * right: the all-time score is a solo number (its only use is buying streak
 * shields, so it competes with nobody), while weekly_xp is ranked against seven
 * other people in one small group. A multiplier there means a free reader can
 * do MORE work and place LOWER — and, because premium is itself the weekly
 * prize (premium-prize.ts), it closes a loop: win -> premium -> earn faster ->
 * win again. Groups are formed by tier and arrival order, never by plan, so
 * that loop would land inside mixed groups and lock the free majority out of
 * the one reward the retention design leans on.
 *
 * So none of the eight numbers above touches an existing weight. Every one of
 * them pays for a DIFFERENT ACT that free readers do not perform: enrolling in
 * a curriculum and then working through it, and curating what you have read
 * into boards. The routes behind all three actions are `requirePremium`
 * already, so the gate is structural rather than a check somebody has to
 * remember to write.
 *
 * WHAT IS DELIBERATELY NOT HERE.
 *
 *   · `compass_viewed`. It is written on every GET /reading-compass, and the
 *     dashboard widget shares that endpoint with the full page — so it fires on
 *     a page LOAD. Paying XP for it would pay for refreshing, which is exactly
 *     the failure mode the share rule's read-gate exists to prevent.
 *   · `assistant_step`. It is a real act, but it is also the one premium
 *     feature with a per-use cost to us (a model call per round). Attaching XP
 *     to it would be paying readers to spend our AI budget, and a league that
 *     is won by burning inference is a bad league and a worse invoice.
 *
 * EVERY ONE OF THESE HAS A WEEKLY CEILING, and that is not caution, it is the
 * difference between an earning path and a farming lane. A board takes two
 * seconds to create and a pin one; without a ceiling, a premium reader who
 * opened forty boards on a Saturday morning would out-rank a free reader who
 * read eight articles. The caps hold the whole sustainable premium contribution
 * to about 23 XP a week — under promotion_min_weekly_xp (30), and worth roughly
 * four-and-a-half article reads. Visible, worth subscribing for, and unable to
 * decide a group on its own. The pathway half — the biggest share of it, 15 —
 * is the half you cannot get without actually reading the articles.
 *
 * ZERO MEANS OFF for a weight and NO CAP for a ceiling, matching xp_share /
 * xp_share_weekly_cap exactly (league.ts guards both the same way), so any of
 * these four paths can be switched off from POST /admin/league/config without a
 * deploy.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_config (key, value) values
  ('xp_pathway_step',                  '3'),
  ('xp_pathway_step_weekly_cap',       '5'),
  ('xp_pathway_enrolled',              '5'),
  ('xp_pathway_enrolled_weekly_cap',   '2'),
  ('xp_collection_created',            '3'),
  ('xp_collection_created_weekly_cap', '1'),
  ('xp_collection_item',               '1'),
  ('xp_collection_item_weekly_cap',    '5')
on conflict (key) do nothing;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
delete from league_config where key in (
  'xp_pathway_step', 'xp_pathway_step_weekly_cap',
  'xp_pathway_enrolled', 'xp_pathway_enrolled_weekly_cap',
  'xp_collection_created', 'xp_collection_created_weekly_cap',
  'xp_collection_item', 'xp_collection_item_weekly_cap'
);
  `);
};
