/**
 * xp_share goes from 1 to 5: `1 -> 5`.
 *
 * Founder decision, 1405/06/03. Sharing already earns no weekly cap (0028) and
 * pays only after the reader has `article_completed` that content — so the
 * two guards that make an uncapped share safe (READ GATE, once per
 * content/week) are untouched here; this migration changes only the per-share
 * VALUE, matching it to xp_read/xp_listen instead of sitting at a fifth of
 * them. A reader who shares every article they actually finish now earns as
 * much from recommending them as from reading them — which is the point:
 * passing an article on is worth as much to the founder as a reader having
 * read it.
 *
 * Why an UPDATE and not an edit to 0027: that migration has already run and
 * its insert is `on conflict do nothing`, so its seed is frozen history. The
 * retune lands in league_audit_log beside the self-tuning writes, same as
 * 0028, so the admin config view can explain the jump instead of showing a
 * number that changed by itself.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_audit_log (changed_key, old_value, new_value, trigger_metric)
select 'xp_share', value, '5', 'founder_retune_0049'
  from league_config where key = 'xp_share' and value <> '5';

update league_config set value = '5', updated_at = now()
 where key = 'xp_share' and value <> '5';
`);
};

exports.down = (pgm) => {
  pgm.sql(`
insert into league_audit_log (changed_key, old_value, new_value, trigger_metric)
select 'xp_share', value, '1', 'founder_retune_0049_down'
  from league_config where key = 'xp_share' and value <> '1';

update league_config set value = '1', updated_at = now()
 where key = 'xp_share' and value <> '1';
`);
};
