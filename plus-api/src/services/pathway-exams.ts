import { pool, one, query, type Queryable } from '../db.js';
import { getPathwayById } from '../pathways.js';

/**
 * THE FOUNDER ASSIGNING AN EXAM — the half of the certificate that exists
 * before the exam format does.
 *
 * The certificate plan is lazy by design: no exam is written until the
 * pathway standings sweep (services/pathway-standings.ts) says a real person
 * is close. When that happens the founder takes the pathway's reading list
 * to NotebookLM, gets questions back, and needs somewhere to PUT them for
 * that one reader. This is that place, and deliberately nothing more.
 *
 * `questions` is JSONB with no shape enforced here. What a question IS —
 * binary with an answer key, free text graded against key points the way a
 * چالش is, a mix — is the decision still open, and a typed column would make
 * it by accident. The founder pastes what NotebookLM produced; the reader
 * side that renders and grades it is built once the shape is chosen, and it
 * will read whatever was stored. Attempts are not modelled for the same
 * reason: `max_attempts` records the one decision already made (two), and a
 * table for attempts that nothing can write is a promise the code cannot
 * keep.
 *
 * One exam per (reader, pathway). Assigning again replaces the questions
 * rather than failing — the founder correcting a paste should not need a
 * delete first — but it never touches a certificate already issued against
 * the old one (`certificates.exam_id` survives; the exam id is stable).
 */

export interface PathwayExam {
  id: string;
  user_id: string;
  pathway_id: string;
  questions: unknown;
  max_attempts: number;
  note: string | null;
  created_at: Date;
}

const EXAM_SELECT = `select id, user_id, pathway_id, questions, max_attempts, note, created_at
                       from pathway_exams`;

export const DEFAULT_MAX_ATTEMPTS = 2;

export interface AssignInput {
  /** Anything JSON — the founder's paste, stored verbatim. */
  questions: unknown;
  maxAttempts?: number;
  note?: string | null;
}

/**
 * Assign (or re-assign) an exam. Upsert on (reader, pathway): a second call
 * overwrites the questions, attempts and note, keeps the id.
 */
export async function assignExam(
  userId: string,
  pathwayId: string,
  input: AssignInput,
  client: Queryable = pool,
): Promise<{ exam: PathwayExam; created: boolean }> {
  const pathway = getPathwayById(pathwayId);
  if (!pathway || pathway.kind === 'bundle') throw new Error('unknown_pathway');
  if (!Array.isArray(input.questions) || input.questions.length === 0) {
    throw new Error('questions_required');
  }
  const max = Number.isInteger(input.maxAttempts) && (input.maxAttempts as number) > 0
    ? (input.maxAttempts as number) : DEFAULT_MAX_ATTEMPTS;

  const row = await one<PathwayExam & { created: boolean }>(
    `insert into pathway_exams (user_id, pathway_id, questions, max_attempts, note)
     values ($1, $2, $3::jsonb, $4, $5)
     on conflict (user_id, pathway_id) do update
       set questions = excluded.questions,
           max_attempts = excluded.max_attempts,
           note = excluded.note
     returning id, user_id, pathway_id, questions, max_attempts, note, created_at,
               (xmax = 0) as created`,
    [userId, pathwayId, JSON.stringify(input.questions), max, input.note ?? null],
    client,
  );
  if (!row) throw new Error('assign_failed');
  const { created, ...exam } = row;
  return { exam, created };
}

export async function getExam(id: string, client: Queryable = pool): Promise<PathwayExam | null> {
  return one<PathwayExam>(`${EXAM_SELECT} where id = $1`, [id], client);
}

/** Every exam one reader has been assigned, newest first. */
export async function listExams(userId: string, client: Queryable = pool): Promise<PathwayExam[]> {
  const r = await query<PathwayExam>(
    `${EXAM_SELECT} where user_id = $1 order by created_at desc`, [userId], client,
  );
  return r.rows;
}

/**
 * Remove an assignment. A certificate that pointed at it keeps its row —
 * `exam_id` is `on delete set null`; the certificate is the decision.
 */
export async function deleteExam(id: string, client: Queryable = pool): Promise<boolean> {
  const r = await query('delete from pathway_exams where id = $1', [id], client);
  return (r.rowCount ?? 0) > 0;
}

/** The founder's read: every open assignment, newest first, with who. */
export async function examRoster(limit = 100): Promise<Array<PathwayExam & { display_name: string; question_count: number }>> {
  const r = await query<PathwayExam & { display_name: string; question_count: number }>(
    `select e.id, e.user_id, e.pathway_id, e.questions, e.max_attempts, e.note, e.created_at,
            p.display_name,
            case when jsonb_typeof(e.questions) = 'array' then jsonb_array_length(e.questions) else 0 end
              as question_count
       from pathway_exams e join profiles p on p.id = e.user_id
      order by e.created_at desc limit $1`,
    [limit],
  );
  return r.rows;
}
