/**
 * The weekly cap on share XP goes away: `xp_share_weekly_cap` 5 -> 0.
 *
 * Founder decision, 1405/05/16. Sharing is the one action here that brings
 * someone NEW to the site, and 0027 shipped it capped at five articles a week —
 * which at xp_share = 1 against xp_share = 5 meant a whole week of passing
 * articles on was worth exactly one article read. That is not an incentive, it
 * is a rounding error with a rule attached. We want this behaviour encouraged,
 * so the ceiling comes off.
 *
 * ZERO MEANS NO CAP, and the code already reads it that way — league.ts's
 * shareXp guards with `cfg.xp_share_weekly_cap > 0 && ...`, so this is a value
 * change and not a behaviour change. The knob itself stays: it is still the
 * lever to reach for if sharing ever needs reining in, and league.test.ts still
 * exercises it by setting its own value.
 *
 * What still bounds this, and why removing the cap is not a farming lane:
 *   · the READ GATE — a share only pays after you finished that article, so the
 *     ceiling is "articles you have actually read", not "taps".
 *   · ONCE per (content, week) — re-sending the same page pays once.
 * A reader with fifty finished articles could therefore reach fifty XP in a week
 * by passing all fifty on. That is a real number and it is the point: fifty
 * articles read is the work, and recommending all of them is worth about ten
 * more reads. If that ever distorts a league, this row is one admin call away
 * from a ceiling again (POST /admin/league/config).
 *
 * Why an UPDATE and not an edit to 0027: that migration has already run and its
 * insert is `on conflict do nothing`, so its seed is frozen history. The retune
 * lands in league_audit_log beside the self-tuning writes, so the admin config
 * view can explain the jump instead of showing a number that changed by itself.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_audit_log (changed_key, old_value, new_value, trigger_metric)
select 'xp_share_weekly_cap', value, '0', 'founder_retune_0028'
  from league_config where key = 'xp_share_weekly_cap' and value <> '0';

update league_config set value = '0', updated_at = now()
 where key = 'xp_share_weekly_cap' and value <> '0';
`);
};

exports.down = (pgm) => {
  pgm.sql(`
insert into league_audit_log (changed_key, old_value, new_value, trigger_metric)
select 'xp_share_weekly_cap', value, '5', 'founder_retune_0028_down'
  from league_config where key = 'xp_share_weekly_cap' and value <> '5';

update league_config set value = '5', updated_at = now()
 where key = 'xp_share_weekly_cap' and value <> '5';
`);
};
