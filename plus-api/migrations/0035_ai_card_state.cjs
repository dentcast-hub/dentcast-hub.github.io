/**
 * Scheduling state for AI-generated review cards ("نکته هوش مصنوعی").
 *
 * The card's text is never stored here — plus/flashcards-index.json (built by
 * tools/build_flashcards_index.mjs) is the source of truth for `front`/`back`;
 * this table only holds the Leitner box + next-due timestamp for each
 * (user, content, card) triple, exactly the way card_state holds it for
 * highlight cards, but as its own table because an AI card has no
 * highlight_id to hang off of.
 *
 * `next_review_at` is NOT NULL, unlike card_state's nullable column. Migration
 * 0034 is the lesson: "null means due now" was the open gate that let ~1,500
 * unreviewed cards stay permanently due. There is no equivalent backfill
 * needed here because a row is only ever created on a card's first answer
 * (POST /review/answer-ai) and is scheduled in that same insert — the null
 * state this column would otherwise need never exists.
 *
 * A card dropped from the index is left alone here, not deleted: the join
 * against getCardsFor()/getCard() in routes/review.ts simply stops surfacing
 * it (dead state doesn't come back due on its own), and if the card
 * reappears in a later index rebuild its prior box/schedule is still there.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table ai_card_state (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  content_id     text not null,
  card_id        text not null,
  box            int  not null default 1,
  next_review_at timestamptz not null,
  last_result    text,
  reviewed_count int  not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, content_id, card_id)
);
create index on ai_card_state (user_id, next_review_at);
`);
};

exports.down = (pgm) => {
  pgm.sql('drop table ai_card_state;');
};
