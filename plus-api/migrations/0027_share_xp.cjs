/**
 * League XP for passing an article on («اشتراک‌گذاری» in the article header).
 *
 *   xp_share            = 1   -- once per (article, week), and only if READ first
 *   xp_share_weekly_cap = 5   -- at most this many articles paid in one week
 *
 * Both numbers are small on purpose, and the reason is worth writing down where
 * whoever retunes them will read it. A share cannot be verified by anybody:
 * navigator.share() resolves on some platforms when the sheet is merely
 * dismissed, and the clipboard fallback reports nothing at all. So what the
 * server is paid to observe is a BUTTON PRESS — one tap, no dwell, repeatable
 * forever. Against an article read (5 XP for 30s–4min of measured visible time)
 * anything larger than 1 would make the share button the cheapest XP on the
 * site, which is the mistake xp_review is still living with.
 *
 * Two guards do the actual work and neither is a number, so neither can be
 * tuned away here: the reader must already have `article_completed` for that
 * content (league.ts), which makes the cheap act inherit the expensive one's
 * cost, and the pair is counted once per week exactly like xp_read.
 *
 * The cap is per WEEK and counts distinct articles, so a full week of sharing
 * is worth about one article read. It is a garnish on the ladder, never a lane.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_config (key, value) values
  ('xp_share',            '1'),
  ('xp_share_weekly_cap', '5')
on conflict (key) do nothing;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
delete from league_config where key in ('xp_share', 'xp_share_weekly_cap');
  `);
};
