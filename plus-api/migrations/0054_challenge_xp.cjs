/**
 * League XP for a fully-correct چالش answer, and a cleanup of the v1 rule
 * that scored every attempt on submit regardless of the verdict.
 *
 *   xp_challenge            = 5   -- same weight as xp_read / xp_listen
 *   xp_challenge_weekly_cap = 0   -- no weekly ceiling: supply is founder-gated
 *                                    (one چالش per page, one attempt per reader)
 *
 * Founder decision, 1405/06/07: a wrong or partial answer earns nothing
 * (no shield score, no league XP, no badge credit). Only `result === 'full'`
 * writes `challenge_answered`. The cap knob is here so a later daily-challenge
 * cadence can bound a week without another code change; 0 means no cap,
 * matching xp_share after 0028.
 *
 * The DELETE drops activity rows that v1 recorded for queued / partial / none
 * attempts. League weekly_xp already granted this week is NOT unwound — the
 * ladder is a live competition and rewriting it from a log we are about to
 * shrink would move ranks under people. The all-time score is derived from
 * the log, so deleting the rows is enough for shields.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_config (key, value) values
  ('xp_challenge',            '5'),
  ('xp_challenge_weekly_cap', '0')
on conflict (key) do nothing;

delete from user_activity ua
 where ua.action = 'challenge_answered'
   and not exists (
     select 1 from challenge_attempts a
      where a.user_id = ua.user_id
        and a.content_id = ua.content_id
        and a.status = 'settled'
        and a.verdict is not null
        and jsonb_array_length(a.verdict) > 0
        and not exists (
          select 1 from jsonb_array_elements(a.verdict) e
           where e->>'state' is distinct from 'covered'
        )
   );
`);
};

exports.down = (pgm) => {
  pgm.sql(`
delete from league_config where key in ('xp_challenge', 'xp_challenge_weekly_cap');
`);
};
