/**
 * One draw over the whole pool, not one per kind.
 *
 * The form shipped with `mcq_draw` / `free_draw` — a count per question
 * kind — which quietly contradicted the founder's own rule that nothing in
 * this system depends on the mix: two knobs that name the mix ARE a
 * dependence on it. The founder's picture is simpler (2026-09-13): keep
 * adding questions to a pathway's pool whenever, and every attempt draws
 * FIFTEEN of them at random, whatever they are. So one column, `draw`
 * (default 15, 0 = the whole pool), and the draw runs over the pool as one
 * list — unseen questions first, as before.
 *
 * Existing rows keep whatever they asked for: a per-kind pair that summed
 * to something becomes that sum; a pair of zeros («everything») becomes
 * the new default, because «everything» was only ever the placeholder for
 * a number nobody had chosen yet.
 */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
alter table pathway_exam_forms
  add column draw int not null default 15,
  add constraint pathway_exam_forms_draw_check check (draw between 0 and 200);
update pathway_exam_forms
   set draw = case when mcq_draw + free_draw > 0 then least(mcq_draw + free_draw, 200) else 15 end;
alter table pathway_exam_forms drop column mcq_draw, drop column free_draw;
`);
};

exports.down = (pgm) => {
  pgm.sql(`
alter table pathway_exam_forms
  add column mcq_draw int not null default 0,
  add column free_draw int not null default 0;
alter table pathway_exam_forms drop column draw;
`);
};
