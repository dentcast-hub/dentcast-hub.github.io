/**
 * The weekly league prize goes from three days of premium to TWO.
 *
 * Founder decision, 1405/05/16. Nothing in the code or the copy carries the
 * number — premium-prize.ts derives expires_at from `prize_days`, the winner
 * banner derives its length from the grant row itself, and both the push and
 * the league teaser read the config — so this row is the whole change on the
 * behavioural side. Two days in every 21 (with prize_cooldown_weeks = 2) is
 * ~10% of the time instead of ~14%: still a real taste of premium, still short
 * enough that it stays a taste and not a substitute for subscribing.
 *
 * Why an UPDATE and not an edit to 0016: that migration has already run
 * everywhere and its insert is `on conflict do nothing`, so the seed value is
 * frozen history. This row is the retune, and it lands in league_audit_log
 * beside the self-tuning writes so the admin config view can explain the jump
 * instead of showing a number that changed by itself.
 *
 * GRANTS ALREADY OUT ARE LEFT ALONE. A live grant carries its own expires_at,
 * and the winner has already been told — by banner and by push — how long they
 * have. Shortening those rows would take back a day we promised, which is the
 * exact failure the whole "never freeze the number into the copy" rule exists
 * to prevent. Outstanding three-day grants run out on their own; every grant
 * from the next sweep onwards is two days.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_audit_log (changed_key, old_value, new_value, trigger_metric)
select 'prize_days', value, '2', 'founder_retune_0024'
  from league_config where key = 'prize_days' and value <> '2';

update league_config set value = '2', updated_at = now()
 where key = 'prize_days' and value <> '2';
`);
};

exports.down = (pgm) => {
  pgm.sql(`
insert into league_audit_log (changed_key, old_value, new_value, trigger_metric)
select 'prize_days', value, '3', 'founder_retune_0024_down'
  from league_config where key = 'prize_days' and value <> '3';

update league_config set value = '3', updated_at = now()
 where key = 'prize_days' and value <> '3';
`);
};
