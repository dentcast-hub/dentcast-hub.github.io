/**
 * Per-action league XP weights (low-risk model: league weekly_xp only — the
 * all-time score / shields / global rank in score.ts stay UNCHANGED).
 *
 * weekly_xp is now earned per action (rewards depth, resists highlight-farming),
 * all values in league_config so they stay tunable with no deploy:
 *   xp_active_bonus  = 5   -- first scoring action of the day
 *   xp_read          = 5   -- an article read to completion (once per article/week)
 *   xp_listen        = 5   -- a podcast heard past the threshold (once per episode/week)
 *   xp_highlight     = 1   -- per highlight...
 *   xp_highlight_cap = 3   -- ...capped this many per article/week (anti-farm)
 *   xp_review        = 2   -- a manual card review
 *
 * The old 0006 keys xp_per_active_day / xp_per_highlight are left in place but no
 * longer read by awardLeagueXp.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_config (key, value) values
  ('xp_active_bonus',  '5'),
  ('xp_read',          '5'),
  ('xp_listen',        '5'),
  ('xp_highlight',     '1'),
  ('xp_highlight_cap', '3'),
  ('xp_review',        '2')
on conflict (key) do nothing;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
delete from league_config where key in
  ('xp_active_bonus','xp_read','xp_listen','xp_highlight','xp_highlight_cap','xp_review');
  `);
};
