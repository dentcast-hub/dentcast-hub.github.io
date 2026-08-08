/**
 * A weekly ceiling on review XP — the one earning path that had none.
 *
 * Every other path in league.ts is bounded: reading and listening pay once per
 * (content, week), highlights cap at xp_highlight_cap per article, pinning is
 * once per page AND capped weekly, sharing needs the article finished first.
 * Review alone was `xpDelta += cfg.xp_review` — no gate, no ceiling, repeatable
 * forever. At 2 XP a call, five hundred calls is a thousand points.
 *
 * That mattered because of what sits underneath it: `card_reviewed_manual` is
 * accepted by POST /activity, which only appends a log row (it must not touch
 * card_state, by design), so the action needs no card, no highlight and no
 * state of any kind. A signed-in caller could mint league XP — and all-time
 * score, which buys streak shields — in a loop. Reported 2026-08-08 after an
 * account reached four figures inside a day.
 *
 * 60 paying reviews a week, not a number pulled from nowhere: it is twice the
 * ~20-a-day the Leitner queue realistically surfaces at these library sizes, so
 * the heaviest genuine studier never feels it, while the ceiling it puts on the
 * lane (120 XP) lands beside reading two dozen articles rather than above
 * everything else combined. Zero means no cap, exactly like the other ceilings,
 * so this is one admin call away from being lifted if it ever bites.
 *
 * The cap is the blunt half. The sharp half is in the same commit and needs no
 * migration: POST /activity is rate limited per user, and review_finished only
 * pays for a card that was actually DUE.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
insert into league_config (key, value) values ('xp_review_weekly_cap', '60')
on conflict (key) do nothing;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
delete from league_config where key = 'xp_review_weekly_cap';
`);
};
