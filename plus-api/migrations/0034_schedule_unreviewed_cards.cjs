/**
 * Apply the new card rule to the cards that already exist.
 *
 * From this migration's commit, `POST /highlights` schedules a card instead of
 * inserting it with `next_review_at = null` — and null is read as "due now" by
 * every due check there is (routes/review.ts's queue AND its `was_due` gate,
 * services/review-notify.ts, GET /me's due_card_count). Rows written before it
 * still carry that null, so without this the rule would only apply to cards made
 * from the deploy onwards while ~1,500 existing ones stayed permanently due —
 * including 616 belonging to the accounts the rule was written for.
 *
 * The fill is the RULE, not a punishment: a card matures one day (box 1's own
 * Leitner interval) after it was made. For a card made last week that instant is
 * already past, so it stays due and nobody's review queue is taken away; for one
 * made in the last hours it lands tomorrow, which is what would have happened
 * had the card been written today. Anything else — a flat `now() + 1 day` —
 * would have emptied «مرور امروز» for every honest reader on deploy day to
 * inconvenience a handful of accounts by one afternoon.
 *
 * `updated_at` is the creation instant for exactly these rows and nothing else
 * needs to be stored to know it: POST /review/answer is the ONLY writer of
 * card_state (it sets both columns together), so a row that still has a null
 * next_review_at has never been answered, and its updated_at is untouched from
 * the insert.
 */

/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
update card_state
   set next_review_at = updated_at + interval '1 day'
 where next_review_at is null;
`);
};

// Irreversible by design: the nulls it replaced carried no information beyond
// "unscheduled", and restoring them would put the farm's door back.
exports.down = () => {};
