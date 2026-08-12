/**
 * قلبِ مقاله — the reader's vote, and the only new thing up-board writes down.
 *
 * Everything else the board needs is DERIVED (see services/votes.ts): the seed
 * that keeps a fresh board from opening empty is computed from `user_activity`,
 * which has carried `content_id` since 0001 and already knows who finished what,
 * who highlighted it and who passed it on. Nothing about that is stored here,
 * for the same reason the badge wall stores no badges — a written-down copy of a
 * derived number is a second source of truth that can disagree with the log it
 * came from.
 *
 * What CANNOT be derived is the vote itself, and the reason is one word:
 * retractable. `user_activity` is append-only and deliberately so — a row there
 * is a fact about a moment, and un-hearting an article does not un-happen the
 * moment you hearted it. A vote is a piece of CURRENT state ("does this reader,
 * right now, endorse this page"), and current state belongs in a table that can
 * lose a row. So a heart is one row here, and the second press deletes it.
 *
 * Three properties come straight out of the primary key, without any code:
 *
 *   · One person, one vote. `primary key (user_id, content_id)` is the whole
 *     enforcement — a double-tap, a double-submit and two tabs racing each other
 *     all collapse into the same row. There is no counter to increment and
 *     therefore no lost update to reason about.
 *   · The reader's own votes are a prefix scan of that key, which is what the
 *     article page asks for on load ("have I hearted this one").
 *   · Deleting an account takes its votes with it (`on delete cascade`), so the
 *     board can never rank on the endorsement of somebody who is gone.
 *
 * The index on `content_id` is the other direction — the board's count query —
 * and it is a plain index rather than a stored tally on purpose. A denormalised
 * `hearts` column would have to be kept true by every insert AND every delete
 * AND a cascade nobody triggers by hand, and the first time it drifted, the
 * public number would be wrong with no way to notice. `count(*)` over an
 * indexed column is cheap at this size and is right by construction.
 *
 * Note there is deliberately NO down-vote column, and no `value`/`direction`
 * field left "for later". A down-vote is a moderation tool for a site that
 * publishes other people's submissions; here every page passed the founder's own
 * filter before it existed, so the arrow would have nothing to moderate and
 * would only mark his own clinical cases as bad in public. Adding one later is a
 * migration; shipping a half-used column now is a promise the design does not
 * intend to keep.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table content_votes (
  user_id    uuid not null references profiles(id) on delete cascade,
  content_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);
create index on content_votes (content_id);
`);
};

exports.down = (pgm) => {
  pgm.sql(`drop table if exists content_votes cascade;`);
};
