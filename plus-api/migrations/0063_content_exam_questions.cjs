/**
 * Questions written for ONE ARTICLE, drawn by EVERY pathway that carries it.
 *
 * The founder writes exam questions two ways (2026-09-13): for a whole
 * pathway, to get its exam going (`pathway_exam_forms.questions`), and —
 * later, whenever a single article deserves its own — for that article. The
 * second kind is keyed by `content_id`, never copied into pathways: an
 * article sits in several pathways (149 steps are shared between two or
 * more), and a pathway that adopts the article next month must draw the
 * question too. So the pathway's pool is DERIVED at draw time — its own
 * form questions plus the questions of every content_id among its steps —
 * and this table stores nothing a pathway could disagree with.
 *
 * The question object carries an id of its own (`c-xxxxxxxx`, from this
 * row's uuid) so it can never collide with a form's `qN` ids inside one
 * attempt's snapshot or the examples keyed by question id.
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
create table content_exam_questions (
  id          uuid primary key default gen_random_uuid(),
  content_id  text not null,
  question    jsonb not null,
  created_at  timestamptz not null default now()
);
create index content_exam_questions_content on content_exam_questions (content_id, created_at);
`);
};

exports.down = (pgm) => {
  pgm.sql('drop table content_exam_questions;');
};
