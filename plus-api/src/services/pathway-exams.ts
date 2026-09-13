import { config } from '../config.js';
import { pool, one, query, withTransaction, type Queryable } from '../db.js';
import { getPathwayById, computeProgress } from '../pathways.js';
import { getConsumedContentIds } from './consumption.js';
import { mintReference } from './reference.js';
import { issueCertificate, type Certificate } from './certificates.js';
import { sendCapped } from './notify-policy.js';
import { runPathwayAlerts, type CertificateIntent } from './pathway-standings.js';
import { ai } from '../providers/registry.js';
import type { KeyPoint, PointState } from '../providers/ai/types.js';
import { parseQuestionText, looksLikeJson } from './exam-text.js';

/**
 * آزمونِ مسیر — the exam in front of the pathway certificate, end to end.
 *
 * The decisions (founder, 2026-09-12): the founder takes a pathway's reading
 * list to NotebookLM, keeps whatever questions came back that he liked, in
 * whatever count and whatever mix of multiple-choice and free text; a reader
 * who finished the pathway (or was let in early) answers them; every free
 * answer is graded per key point by the same model the چالش uses; every
 * threshold is 70%; two attempts, a week apart; and the founder's own rulings
 * are kept so the grader gets better on the same questions over time.
 *
 * Four rules the code depends on.
 *
 * **The FORM belongs to the pathway, the ATTEMPT belongs to the reader.** One
 * `pathway_exam_forms` row per pathway holds the pool; an attempt copies the
 * questions it drew — answers and key points included — into its own row at
 * start, so a founder editing the pool mid-attempt cannot change what a
 * reader is being graded against, and a reload tomorrow shows the SAME
 * questions. `pathway_exams` (migration 0059) is now only the assignment:
 * who was let in before finishing.
 *
 * **Eligibility is derived, and comes two ways.** A reader may sit the exam
 * when a form exists AND (they were assigned OR `computeProgress` says the
 * pathway is complete). Progress goes backwards whenever publish step 5.6
 * files new content into a pathway — which is exactly why the assignment
 * exists, and why an attempt already OPEN is never re-checked against it.
 *
 * **The model never has the last word until it has earned it.** "Auto-pass
 * only at 100% confidence" has no number behind it (the provider is never
 * asked for one — handoff RULE 4), so confidence is built two ways: every
 * free answer is graded TWICE and the two verdicts must agree exactly, and
 * even then a form settles on its own only after `supervised_until` founder
 * rulings exist for it. Before that, every attempt with a free question is
 * queued with the model's verdict PRE-FILLED for the founder — one tap to
 * accept, and the ruling becomes a worked example (`pathway_exam_examples`,
 * keyed by question id) the next grading of that question is shown.
 * Multiple-choice is arithmetic and settles immediately; a mixed attempt
 * waits for its free half.
 *
 * **Passing and the certificate are one act.** An attempt is marked `passed`
 * and `issueCertificate` runs in the same transaction, so there is no state
 * in which a reader passed and holds no certificate, or the reverse.
 */

/* ------------------------------------------------------------ questions -- */

export interface McqQuestion {
  id: string;
  kind: 'mcq';
  prompt_fa: string;
  options: string[];
  /** Index into `options`. Never sent to the reader. */
  correct: number;
}

export interface FreeQuestion {
  id: string;
  kind: 'free';
  prompt_fa: string;
  /** The rubric. Never sent to the reader. */
  key_points: KeyPoint[];
}

export type ExamQuestion = McqQuestion | FreeQuestion;

/** What the reader sees: the question, never the key. */
export type PublicQuestion =
  | { id: string; kind: 'mcq'; prompt_fa: string; options: string[] }
  | { id: string; kind: 'free'; prompt_fa: string; point_count: number };

export function publicQuestion(q: ExamQuestion): PublicQuestion {
  if (q.kind === 'mcq') return { id: q.id, kind: 'mcq', prompt_fa: q.prompt_fa, options: q.options };
  return { id: q.id, kind: 'free', prompt_fa: q.prompt_fa, point_count: q.key_points.length };
}

const MAX_OPTIONS = 6;
const MAX_KEY_POINTS = 6;
const MCQ_KINDS = new Set(['mcq', 'multiple_choice', 'multiple-choice', 'choice', 'test', 'تستی', 'چندگزینه‌ای', 'چند گزینه‌ای']);
const FREE_KINDS = new Set(['free', 'open', 'essay', 'text', 'short_answer', 'تشریحی', 'باز']);
const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];
const FA_LETTERS = ['الف', 'ب', 'ج', 'د', 'ه', 'و'];

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');
const firstStr = (o: Record<string, unknown>, keys: string[]): string => {
  for (const k of keys) { const s = str(o[k]); if (s) return s; }
  return '';
};

export type NormalizeResult = { ok: true; questions: ExamQuestion[] } | { ok: false; error: string };

/**
 * Turn the founder's paste into the stored shape — LENIENTLY, because the
 * paste is whatever NotebookLM produced and the founder must not have to
 * hand-edit forty questions into our exact keys. Accepts a bare array or
 * `{questions: [...]}`; `prompt_fa|prompt|question|q|text` for the prompt;
 * `kind|type` or an inference from the fields present; `options|choices`
 * (strings, or `{text|label}` objects); `correct|answer|correct_index` as a
 * 0-based index, a letter (`b`, `ب`), or the option's own text; and
 * `key_points|points|rubric` as strings or `{id,text}` objects. Ids are
 * minted (`q3`, `q3-k2`) when absent. Every failure names the question.
 */
export function normalizeQuestions(raw: unknown): NormalizeResult {
  const list = Array.isArray(raw)
    ? raw
    : (raw && typeof raw === 'object' && Array.isArray((raw as { questions?: unknown }).questions))
      ? (raw as { questions: unknown[] }).questions
      : null;
  if (!list) return { ok: false, error: 'سؤال‌ها باید یک آرایهٔ JSON باشند (یا {"questions": [...]}).' };
  if (!list.length) return { ok: false, error: 'دست‌کم یک سؤال لازم است.' };

  const out: ExamQuestion[] = [];
  const ids = new Set<string>();
  for (let i = 0; i < list.length; i += 1) {
    const n = i + 1;
    const o = list[i];
    if (!o || typeof o !== 'object' || Array.isArray(o)) return { ok: false, error: `سؤال ${n}: یک شیء نیست.` };
    const r = o as Record<string, unknown>;
    const prompt = firstStr(r, ['prompt_fa', 'prompt', 'question', 'q', 'text', 'stem']);
    if (!prompt) return { ok: false, error: `سؤال ${n}: متن سؤال (prompt/question) ندارد.` };

    let id = firstStr(r, ['id']) || `q${n}`;
    if (ids.has(id)) id = `${id}-${n}`;
    if (ids.has(id)) return { ok: false, error: `سؤال ${n}: شناسهٔ تکراری «${id}».` };
    ids.add(id);

    const rawOptions = (r.options ?? r.choices) as unknown;
    const rawPoints = (r.key_points ?? r.points ?? r.rubric) as unknown;
    const kindWord = firstStr(r, ['kind', 'type']).toLowerCase();
    let kind: 'mcq' | 'free' | null = MCQ_KINDS.has(kindWord) ? 'mcq' : FREE_KINDS.has(kindWord) ? 'free' : null;
    if (!kind) kind = Array.isArray(rawOptions) && rawOptions.length ? 'mcq' : Array.isArray(rawPoints) ? 'free' : null;
    if (!kind) return { ok: false, error: `سؤال ${n}: نه گزینه دارد (تستی) نه نکتهٔ کلیدی (تشریحی).` };

    if (kind === 'mcq') {
      if (!Array.isArray(rawOptions)) return { ok: false, error: `سؤال ${n}: تستی است اما options ندارد.` };
      const options = rawOptions.map((v) => (v && typeof v === 'object'
        ? firstStr(v as Record<string, unknown>, ['text', 'label', 'option'])
        : str(v)));
      if (options.length < 2 || options.length > MAX_OPTIONS || options.some((s) => !s)) {
        return { ok: false, error: `سؤال ${n}: بین ۲ تا ${MAX_OPTIONS} گزینهٔ غیرخالی لازم است.` };
      }
      const correct = resolveCorrect(r.correct ?? r.answer ?? r.correct_index ?? r.correct_option ?? r.key, options);
      if (correct === null) return { ok: false, error: `سؤال ${n}: گزینهٔ درست (correct) مشخص نیست — اندیس صفرمبنا، حرف (b/ب) یا متن خودِ گزینه.` };
      out.push({ id, kind: 'mcq', prompt_fa: prompt, options, correct });
      continue;
    }

    if (!Array.isArray(rawPoints)) return { ok: false, error: `سؤال ${n}: تشریحی است اما key_points ندارد.` };
    const points: KeyPoint[] = [];
    const pids = new Set<string>();
    for (let k = 0; k < rawPoints.length; k += 1) {
      const p = rawPoints[k];
      const text = p && typeof p === 'object' ? firstStr(p as Record<string, unknown>, ['text', 'point', 'label']) : str(p);
      if (!text) return { ok: false, error: `سؤال ${n}: نکتهٔ کلیدی ${k + 1} خالی است.` };
      let pid = (p && typeof p === 'object' ? firstStr(p as Record<string, unknown>, ['id']) : '') || `${id}-k${k + 1}`;
      if (pids.has(pid)) pid = `${pid}-${k + 1}`;
      pids.add(pid);
      points.push({ id: pid, text });
    }
    if (!points.length || points.length > MAX_KEY_POINTS) {
      return { ok: false, error: `سؤال ${n}: بین ۱ تا ${MAX_KEY_POINTS} نکتهٔ کلیدی لازم است.` };
    }
    out.push({ id, kind: 'free', prompt_fa: prompt, key_points: points });
  }
  return { ok: true, questions: out };
}

/**
 * The ONE door every paste goes through, prose or JSON.
 *
 * NotebookLM answers in prose, so the founder's paste is usually text (see
 * services/exam-text.ts); a JSON array still works, because an earlier form
 * may be re-pasted and because another agent may produce one. Both end in
 * `normalizeQuestions`, so there is exactly one validator and one set of
 * error messages.
 */
export function parseQuestions(input: unknown): NormalizeResult {
  if (typeof input === 'string') {
    const raw = input.trim();
    if (!raw) return { ok: false, error: 'دست‌کم یک سؤال لازم است.' };
    if (looksLikeJson(raw)) {
      try { return normalizeQuestions(JSON.parse(raw)); } catch (err) {
        return { ok: false, error: `JSON معتبر نیست: ${(err as Error).message}` };
      }
    }
    const text = parseQuestionText(raw);
    // Straight into the same validator every paste goes through, so the
    // option/key-point limits and the id rules are stated exactly once.
    return text.ok ? normalizeQuestions(text.questions) : text;
  }
  return normalizeQuestions(input);
}

function resolveCorrect(v: unknown, options: string[]): number | null {
  if (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < options.length) return v;
  const s = str(v);
  if (!s) return null;
  if (/^\d+$/.test(s)) { const n = Number(s); return n >= 0 && n < options.length ? n : null; }
  const low = s.toLowerCase().replace(/[.)\s]+$/g, '');
  const li = LETTERS.indexOf(low);
  if (li >= 0 && li < options.length) return li;
  const fi = FA_LETTERS.indexOf(low);
  if (fi >= 0 && fi < options.length) return fi;
  const ti = options.findIndex((o) => o === s);
  return ti >= 0 ? ti : null;
}

/* ----------------------------------------------------------------- form -- */

export interface ExamForm {
  id: string;
  pathway_id: string;
  questions: ExamQuestion[];
  mcq_draw: number;
  free_draw: number;
  pass_percent: number;
  max_attempts: number;
  retry_days: number;
  supervised_until: number;
  note: string | null;
  created_at: Date;
  updated_at: Date;
}

const FORM_SELECT = `select id, pathway_id, questions, mcq_draw, free_draw, pass_percent, max_attempts,
                            retry_days, supervised_until, note, created_at, updated_at
                       from pathway_exam_forms`;

export interface FormInput {
  /** The founder's paste: plain text (the usual case) or a JSON array. */
  questions: unknown;
  /** 0 = every question in the pool, every time. */
  mcqDraw?: number;
  freeDraw?: number;
  passPercent?: number;
  maxAttempts?: number;
  retryDays?: number;
  supervisedUntil?: number;
  note?: string | null;
}

const intIn = (v: unknown, lo: number, hi: number, dflt: number): number =>
  (typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : dflt);

/** Create or replace the pathway's form. Errors are Persian, meant for the panel. */
export async function upsertForm(pathwayId: string, input: FormInput, client: Queryable = pool): Promise<{ form: ExamForm; created: boolean }> {
  const pathway = getPathwayById(pathwayId);
  if (!pathway || pathway.kind === 'bundle') throw new Error('unknown_pathway');
  const norm = parseQuestions(input.questions);
  if (!norm.ok) throw new Error(`invalid_questions:${norm.error}`);
  const d = config.exam;
  const row = await one<ExamForm & { created: boolean }>(
    `insert into pathway_exam_forms
       (pathway_id, questions, mcq_draw, free_draw, pass_percent, max_attempts, retry_days, supervised_until, note)
     values ($1, $2::jsonb, $3, $4, $5, $6, $7, $8, $9)
     on conflict (pathway_id) do update
       set questions = excluded.questions, mcq_draw = excluded.mcq_draw, free_draw = excluded.free_draw,
           pass_percent = excluded.pass_percent, max_attempts = excluded.max_attempts,
           retry_days = excluded.retry_days, supervised_until = excluded.supervised_until,
           note = excluded.note, updated_at = now()
     returning id, pathway_id, questions, mcq_draw, free_draw, pass_percent, max_attempts,
               retry_days, supervised_until, note, created_at, updated_at, (xmax = 0) as created`,
    [
      pathwayId, JSON.stringify(norm.questions),
      intIn(input.mcqDraw, 0, 200, 0), intIn(input.freeDraw, 0, 200, 0),
      intIn(input.passPercent, 1, 100, d.passPercent), intIn(input.maxAttempts, 1, 10, d.maxAttempts),
      intIn(input.retryDays, 0, 365, d.retryDays), intIn(input.supervisedUntil, 0, 1000, d.supervisedUntil),
      input.note?.trim() || null,
    ],
    client,
  );
  const { created, ...form } = row!;
  return { form, created };
}

export async function getForm(pathwayId: string, client: Queryable = pool): Promise<ExamForm | null> {
  return one<ExamForm>(`${FORM_SELECT} where pathway_id = $1`, [pathwayId], client);
}

export async function deleteForm(pathwayId: string, client: Queryable = pool): Promise<boolean> {
  const r = await query('delete from pathway_exam_forms where pathway_id = $1', [pathwayId], client);
  return (r.rowCount ?? 0) > 0;
}

export interface FormSummary {
  id: string;
  pathway_id: string;
  title_fa: string;
  mcq_count: number;
  free_count: number;
  mcq_draw: number;
  free_draw: number;
  pass_percent: number;
  max_attempts: number;
  retry_days: number;
  supervised_until: number;
  /** Founder rulings so far — the count the supervised gate compares against. */
  rulings: number;
  /** Attempts by status, for the panel's one-line health read. */
  attempts: { open: number; queued: number; passed: number; failed: number };
  note: string | null;
  updated_at: Date;
}

/** Every form with its counts — the panel's list. */
export async function formRoster(client: Queryable = pool): Promise<FormSummary[]> {
  const r = await query<Omit<FormSummary, 'title_fa' | 'attempts'> & {
    n_open: number; n_queued: number; n_passed: number; n_failed: number;
  }>(
    `select f.id, f.pathway_id, f.mcq_draw, f.free_draw, f.pass_percent, f.max_attempts, f.retry_days,
            f.supervised_until, f.note, f.updated_at,
            (select count(*)::int from jsonb_array_elements(f.questions) q where q->>'kind' = 'mcq') as mcq_count,
            (select count(*)::int from jsonb_array_elements(f.questions) q where q->>'kind' = 'free') as free_count,
            (select count(*)::int from pathway_exam_attempts a where a.form_id = f.id and a.settled_by = 'founder') as rulings,
            (select count(*)::int from pathway_exam_attempts a where a.form_id = f.id and a.status = 'open') as n_open,
            (select count(*)::int from pathway_exam_attempts a where a.form_id = f.id and a.status = 'queued') as n_queued,
            (select count(*)::int from pathway_exam_attempts a where a.form_id = f.id and a.status = 'passed') as n_passed,
            (select count(*)::int from pathway_exam_attempts a where a.form_id = f.id and a.status = 'failed') as n_failed
       from pathway_exam_forms f
      order by f.updated_at desc`,
    [], client,
  );
  return r.rows.map(({ n_open, n_queued, n_passed, n_failed, ...row }) => ({
    ...row,
    title_fa: getPathwayById(row.pathway_id)?.title_fa ?? row.pathway_id,
    attempts: { open: n_open, queued: n_queued, passed: n_passed, failed: n_failed },
  }));
}

/* ----------------------------------------------------------- assignment -- */

export interface ExamAssignment {
  id: string;
  user_id: string;
  pathway_id: string;
  note: string | null;
  created_at: Date;
}

const ASSIGN_SELECT = 'select id, user_id, pathway_id, note, created_at from pathway_exams';

/**
 * Let one reader in before the pathway is complete — the founder's call,
 * usually after the standings sweep said they are a few steps from the end.
 * Upsert on (reader, pathway); the id is stable.
 */
export async function assignExam(
  userId: string, pathwayId: string, input: { note?: string | null } = {}, client: Queryable = pool,
): Promise<{ assignment: ExamAssignment; created: boolean }> {
  const pathway = getPathwayById(pathwayId);
  if (!pathway || pathway.kind === 'bundle') throw new Error('unknown_pathway');
  // Letting somebody in IS putting them on the pathway: enrol them too, so
  // the assignment is never refused by the enrolment rule it was meant to
  // open. Idempotent; an existing enrolment is untouched.
  await query(
    `insert into user_pathways (user_id, pathway_id, current_step) values ($1, $2, 0)
     on conflict (user_id, pathway_id) do nothing`,
    [userId, pathwayId], client,
  );
  const row = await one<ExamAssignment & { created: boolean }>(
    `insert into pathway_exams (user_id, pathway_id, note) values ($1, $2, $3)
     on conflict (user_id, pathway_id) do update set note = excluded.note
     returning id, user_id, pathway_id, note, created_at, (xmax = 0) as created`,
    [userId, pathwayId, input.note?.trim() || null], client,
  );
  const { created, ...assignment } = row!;
  return { assignment, created };
}

export async function getAssignment(id: string, client: Queryable = pool): Promise<ExamAssignment | null> {
  return one<ExamAssignment>(`${ASSIGN_SELECT} where id = $1`, [id], client);
}

export async function listAssignments(userId: string, client: Queryable = pool): Promise<ExamAssignment[]> {
  return (await query<ExamAssignment>(`${ASSIGN_SELECT} where user_id = $1 order by created_at desc`, [userId], client)).rows;
}

export async function deleteAssignment(id: string, client: Queryable = pool): Promise<boolean> {
  const r = await query('delete from pathway_exams where id = $1', [id], client);
  return (r.rowCount ?? 0) > 0;
}

export async function assignmentRoster(limit = 100): Promise<Array<ExamAssignment & { display_name: string; has_form: boolean }>> {
  const r = await query<ExamAssignment & { display_name: string; has_form: boolean }>(
    `select e.id, e.user_id, e.pathway_id, e.note, e.created_at, p.display_name,
            exists (select 1 from pathway_exam_forms f where f.pathway_id = e.pathway_id) as has_form
       from pathway_exams e join profiles p on p.id = e.user_id
      order by e.created_at desc limit $1`,
    [limit],
  );
  return r.rows;
}

/* -------------------------------------------------------------- attempts -- */

export type AttemptStatus = 'open' | 'queued' | 'passed' | 'failed' | 'void';

export type McqVerdict = { id: string; kind: 'mcq'; correct: boolean };
export type FreeVerdict = {
  id: string; kind: 'free';
  /** Per key point; absent while the grader could not decide. */
  points: { id: string; state: 'covered' | 'missing' }[] | null;
  unsure: boolean;
  by: 'ai' | 'founder' | null;
};
export type VerdictEntry = McqVerdict | FreeVerdict;

export interface ExamAttempt {
  id: string;
  form_id: string;
  user_id: string;
  pathway_id: string;
  attempt_no: number;
  holder_name: string | null;
  questions: ExamQuestion[];
  answers: Record<string, unknown> | null;
  verdict: VerdictEntry[] | null;
  status: AttemptStatus;
  settled_by: 'ai' | 'founder' | null;
  mcq_correct: number | null;
  mcq_total: number | null;
  free_covered: number | null;
  free_total: number | null;
  reference: string;
  created_at: Date;
  submitted_at: Date | null;
  settled_at: Date | null;
}

const ATTEMPT_COLS = `id, form_id, user_id, pathway_id, attempt_no, holder_name, questions, answers, verdict,
                      status, settled_by, mcq_correct, mcq_total, free_covered, free_total, reference,
                      created_at, submitted_at, settled_at`;
const ATTEMPT_SELECT = `select ${ATTEMPT_COLS} from pathway_exam_attempts`;

/** Statuses that spend one of the reader's attempts. */
const COUNTED: readonly AttemptStatus[] = ['queued', 'passed', 'failed'];

export async function getAttempt(id: string, client: Queryable = pool): Promise<ExamAttempt | null> {
  return one<ExamAttempt>(`${ATTEMPT_SELECT} where id = $1`, [id], client);
}

export async function listAttempts(userId: string, pathwayId: string, client: Queryable = pool): Promise<ExamAttempt[]> {
  return (await query<ExamAttempt>(
    `${ATTEMPT_SELECT} where user_id = $1 and pathway_id = $2 order by attempt_no`, [userId, pathwayId], client,
  )).rows;
}

/**
 * The draw. `n = 0` means the whole pool. A second attempt prefers questions
 * the reader has NOT seen: the unseen ones are shuffled first, and only once
 * they run out does the draw reach into the seen ones — so a pool of 20 with
 * a draw of 8 shows two disjoint sets, and a pool of 8 shows the same 8 in a
 * different order. Not seeded: the draw is stored on the attempt, so there is
 * nothing to reproduce.
 */
export function drawQuestions(pool_: ExamQuestion[], n: number, seen: Set<string>): ExamQuestion[] {
  const unseen = shuffle(pool_.filter((q) => !seen.has(q.id)));
  const rest = shuffle(pool_.filter((q) => seen.has(q.id)));
  const take = n > 0 ? Math.min(n, pool_.length) : pool_.length;
  return [...unseen, ...rest].slice(0, take);
}

function shuffle<T>(a: T[]): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ---------------------------------------------------------------- state -- */

export type ExamStateKind =
  | 'no_form'    // nothing to sit yet
  | 'locked'     // form exists, reader neither finished nor assigned
  | 'ready'      // may start an attempt now
  | 'open'       // an attempt is drawn and unsubmitted
  | 'queued'     // submitted, waiting on the founder
  | 'wait'       // failed, retry allowed after `retry_at`
  | 'exhausted'  // failed, no attempts left
  | 'passed';

export interface ExamState {
  state: ExamStateKind;
  pathway_id: string;
  pathway_title_fa: string;
  /** Present whenever a form exists. */
  rules: {
    question_count: number; mcq_count: number; free_count: number;
    pass_percent: number; max_attempts: number; retry_days: number;
    min_answer_chars: number;
  } | null;
  attempts_used: number;
  is_complete: boolean;
  assigned: boolean;
  /** A `user_pathways` row — the reader pressed «شروع این مسیر». Required to sit. */
  enrolled: boolean;
  /** «گواهی‌نامه می‌خواهی؟» — null until asked and answered. */
  certificate_intent: CertificateIntent | null;
  retry_at: Date | null;
  /** The open attempt's questions, stripped. */
  open: { id: string; reference: string; holder_name: string | null; questions: PublicQuestion[]; started_at: Date } | null;
  /** Every settled or queued attempt, shaped for the reader. */
  history: AttemptResult[];
  certificate: { verify_code: string; verify_url: string } | null;
}

export interface AttemptResult {
  id: string;
  attempt_no: number;
  reference: string;
  status: AttemptStatus;
  submitted_at: Date | null;
  settled_at: Date | null;
  mcq_correct: number | null;
  mcq_total: number | null;
  free_covered: number | null;
  free_total: number | null;
  mcq_percent: number | null;
  free_percent: number | null;
  passed: boolean | null;
  /** Per question, once settled: which MCQs were right, how many points each free answer covered. */
  per_question: Array<{ id: string; kind: 'mcq' | 'free'; correct?: boolean; covered?: number; total?: number }> | null;
}

const pct = (n: number | null, d: number | null): number | null =>
  (n === null || d === null || d === 0 ? null : Math.round((n / d) * 100));

export function attemptResult(a: ExamAttempt): AttemptResult {
  const settled = a.status === 'passed' || a.status === 'failed';
  return {
    id: a.id,
    attempt_no: a.attempt_no,
    reference: a.reference,
    status: a.status,
    submitted_at: a.submitted_at,
    settled_at: a.settled_at,
    mcq_correct: settled ? a.mcq_correct : null,
    mcq_total: settled ? a.mcq_total : null,
    free_covered: settled ? a.free_covered : null,
    free_total: settled ? a.free_total : null,
    mcq_percent: settled ? pct(a.mcq_correct, a.mcq_total) : null,
    free_percent: settled ? pct(a.free_covered, a.free_total) : null,
    passed: settled ? a.status === 'passed' : null,
    per_question: settled && a.verdict ? a.verdict.map((v) => (v.kind === 'mcq'
      ? { id: v.id, kind: 'mcq' as const, correct: v.correct }
      : {
        id: v.id, kind: 'free' as const,
        covered: v.points ? v.points.filter((p) => p.state === 'covered').length : 0,
        total: v.points ? v.points.length : 0,
      })) : null,
  };
}

function formRules(form: ExamForm): ExamState['rules'] {
  const mcq = form.questions.filter((q) => q.kind === 'mcq').length;
  const free = form.questions.filter((q) => q.kind === 'free').length;
  const mcqN = form.mcq_draw > 0 ? Math.min(form.mcq_draw, mcq) : mcq;
  const freeN = form.free_draw > 0 ? Math.min(form.free_draw, free) : free;
  return {
    question_count: mcqN + freeN, mcq_count: mcqN, free_count: freeN,
    pass_percent: form.pass_percent, max_attempts: form.max_attempts, retry_days: form.retry_days,
    min_answer_chars: config.exam.minAnswerChars,
  };
}

/** Where this reader stands with this pathway's exam. The one read the page needs. */
export async function examState(userId: string, pathwayId: string, now = new Date()): Promise<ExamState> {
  const pathway = getPathwayById(pathwayId);
  if (!pathway || pathway.kind === 'bundle') throw new Error('unknown_pathway');
  const base: ExamState = {
    state: 'no_form', pathway_id: pathwayId, pathway_title_fa: pathway.title_fa, rules: null,
    attempts_used: 0, is_complete: false, assigned: false, enrolled: false, certificate_intent: null,
    retry_at: null, open: null, history: [], certificate: null,
  };

  const [form, consumed, assigned, enrolled, cert] = await Promise.all([
    getForm(pathwayId),
    getConsumedContentIds(userId),
    one<{ id: string }>('select id from pathway_exams where user_id = $1 and pathway_id = $2', [userId, pathwayId]),
    one<{ pathway_id: string; certificate_intent: CertificateIntent | null }>(
      'select pathway_id, certificate_intent from user_pathways where user_id = $1 and pathway_id = $2', [userId, pathwayId],
    ),
    one<Certificate>(
      'select id, verify_code from certificates where user_id = $1 and pathway_id = $2 and revoked_at is null',
      [userId, pathwayId],
    ),
  ]);
  base.is_complete = computeProgress(pathway, consumed).is_complete;
  base.assigned = Boolean(assigned);
  base.enrolled = Boolean(enrolled);
  base.certificate_intent = enrolled?.certificate_intent ?? null;
  if (cert) base.certificate = { verify_code: cert.verify_code, verify_url: `/plus/certificate.html?c=${cert.verify_code}` };
  // A certificate already held is the end of the story whatever the form
  // says — including a form deleted after the pass, or one never written
  // because the founder issued by hand.
  if (!form) { if (cert) base.state = 'passed'; return base; }

  base.rules = formRules(form);
  const attempts = await listAttempts(userId, pathwayId);
  const counted = attempts.filter((a) => COUNTED.includes(a.status));
  base.attempts_used = counted.length;
  // The ordinal the reader sees counts only attempts that COUNT: a voided
  // one leaves no gap in «تلاش ۱، تلاش ۲».
  base.history = counted.map((a, i) => ({ ...attemptResult(a), attempt_no: i + 1 }));

  if (attempts.some((a) => a.status === 'passed') || cert) { base.state = 'passed'; return base; }
  const open = attempts.find((a) => a.status === 'open');
  if (open) {
    base.state = 'open';
    base.open = {
      id: open.id, reference: open.reference, holder_name: open.holder_name,
      questions: open.questions.map(publicQuestion), started_at: open.created_at,
    };
    return base;
  }
  if (attempts.some((a) => a.status === 'queued')) { base.state = 'queued'; return base; }
  // Enrolment is the deliberate act (founder, 2026-09-12): the exam is for
  // somebody who is ON the pathway, not somebody whose reading happens to
  // cover it. It costs one tap on the pathway page and progress is derived,
  // so nobody who finished loses anything by pressing it late.
  if (!base.enrolled || (!base.is_complete && !base.assigned)) { base.state = 'locked'; return base; }
  if (counted.length >= form.max_attempts) { base.state = 'exhausted'; return base; }
  const last = counted.reduce<Date | null>((m, a) => (a.submitted_at && (!m || a.submitted_at > m) ? a.submitted_at : m), null);
  if (last && form.retry_days > 0) {
    const retryAt = new Date(last.getTime() + form.retry_days * 86_400_000);
    if (retryAt > now) { base.state = 'wait'; base.retry_at = retryAt; return base; }
  }
  base.state = 'ready';
  return base;
}

/* ---------------------------------------------------------------- start -- */

export type StartResult =
  | { ok: true; attempt: ExamAttempt; state: ExamState }
  | { ok: false; error: 'not_ready'; state: ExamState };

/**
 * Open an attempt: draw, snapshot, mint a reference. Refused unless the
 * state is `ready` — the page never has to guess, and a double tap on
 * «شروع» finds the attempt already open and gets it back rather than a
 * second draw. `holderName` is what the certificate will print; asked here,
 * before the questions, because a reader who has just passed should not be
 * stopped by a form.
 */
export async function startAttempt(userId: string, pathwayId: string, holderName: string): Promise<StartResult> {
  const name = holderName.trim().slice(0, 120);
  if (!name) throw new Error('holder_name_required');
  const state = await examState(userId, pathwayId);
  if (state.state !== 'ready') return { ok: false, error: 'not_ready', state };
  const form = (await getForm(pathwayId))!;

  const prior = await listAttempts(userId, pathwayId);
  const seen = new Set<string>();
  for (const a of prior) for (const q of a.questions) seen.add(q.id);
  const drawn = [
    ...drawQuestions(form.questions.filter((q) => q.kind === 'mcq'), form.mcq_draw, seen),
    ...drawQuestions(form.questions.filter((q) => q.kind === 'free'), form.free_draw, seen),
  ];
  // Unique per (form, reader), NOT the reader-facing ordinal: a voided
  // attempt keeps its number so the unique index never collides, and
  // examState renumbers the counted ones for display.
  const attemptNo = prior.reduce((m, a) => Math.max(m, a.attempt_no), 0) + 1;

  // Sitting the exam is the strongest «بله» there is; a reader who never
  // answered the question is answered by this, and never asked again.
  await query(
    `update user_pathways set certificate_intent = 'wanted', certificate_intent_at = now()
      where user_id = $1 and pathway_id = $2 and certificate_intent is null`,
    [userId, pathwayId],
  );
  const attempt = await withTransaction(async (client) => {
    // The unique index on (form, user, attempt_no) is the lock: two starts
    // racing each other cannot both insert attempt N, and an 'open' row that
    // already exists is simply handed back.
    const existing = await one<ExamAttempt>(
      `${ATTEMPT_SELECT} where user_id = $1 and pathway_id = $2 and status = 'open'`, [userId, pathwayId], client,
    );
    if (existing) return existing;
    for (let i = 0; i < 6; i += 1) {
      await client.query('savepoint mint');
      try {
        const row = await one<ExamAttempt>(
          `insert into pathway_exam_attempts (form_id, user_id, pathway_id, attempt_no, holder_name, questions, reference)
           values ($1, $2, $3, $4, $5, $6::jsonb, $7)
           on conflict (form_id, user_id, attempt_no) do nothing
           returning ${ATTEMPT_COLS}`,
          [form.id, userId, pathwayId, attemptNo, name, JSON.stringify(drawn), mintReference('E')],
          client,
        );
        await client.query('release savepoint mint');
        if (row) return row;
        // attempt_no taken by a racing request — it is the open one; hand it back
        const raced = await one<ExamAttempt>(
          `${ATTEMPT_SELECT} where user_id = $1 and pathway_id = $2 and status = 'open'`, [userId, pathwayId], client,
        );
        if (raced) return raced;
        throw new Error('start_raced');
      } catch (err) {
        await client.query('rollback to savepoint mint');
        if ((err as { code?: string }).code !== '23505') throw err;
      }
    }
    throw new Error('could_not_mint_reference');
  });
  return { ok: true, attempt, state: await examState(userId, pathwayId) };
}

/* --------------------------------------------------------------- submit -- */

export type SubmitResult =
  | { ok: true; attempt: ExamAttempt; state: ExamState }
  | { ok: false; error: 'no_open_attempt' | 'incomplete'; missing?: string[]; state?: ExamState };

/**
 * Submit the open attempt's answers and grade it.
 *
 * Two phases on purpose. The first is a short transaction: lock the open
 * row, validate that EVERY question has a usable answer (an unanswered
 * question is refused, not scored zero — a reader who skipped one by
 * accident must not spend an attempt on it), store the answers, flip to
 * `queued`. The second is the grading, which calls the model and can take
 * seconds; it runs outside any lock and settles with a conditional update,
 * so a founder ruling that lands first simply wins.
 */
export async function submitAttempt(
  userId: string, pathwayId: string, answers: Record<string, unknown>,
): Promise<SubmitResult> {
  const stored = await withTransaction(async (client): Promise<ExamAttempt | { missing: string[] } | null> => {
    const open = await one<ExamAttempt>(
      `${ATTEMPT_SELECT} where user_id = $1 and pathway_id = $2 and status = 'open' for update`,
      [userId, pathwayId], client,
    );
    if (!open) return null;
    const clean: Record<string, unknown> = {};
    const missing: string[] = [];
    for (const q of open.questions) {
      const v = answers?.[q.id];
      if (q.kind === 'mcq') {
        const n = typeof v === 'number' ? v : typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : NaN;
        if (!Number.isInteger(n) || n < 0 || n >= q.options.length) { missing.push(q.id); continue; }
        clean[q.id] = n;
      } else {
        const s = typeof v === 'string' ? v.trim().slice(0, config.exam.maxAnswerChars) : '';
        if (s.length < config.exam.minAnswerChars) { missing.push(q.id); continue; }
        clean[q.id] = s;
      }
    }
    if (missing.length) return { missing };
    return (await one<ExamAttempt>(
      `update pathway_exam_attempts set answers = $2::jsonb, status = 'queued', submitted_at = now()
        where id = $1 returning ${ATTEMPT_COLS}`,
      [open.id, JSON.stringify(clean)], client,
    ))!;
  });
  if (!stored) return { ok: false, error: 'no_open_attempt', state: await examState(userId, pathwayId) };
  if ('missing' in stored) return { ok: false, error: 'incomplete', missing: stored.missing };

  const graded = await gradeAttempt(stored);
  return { ok: true, attempt: graded, state: await examState(userId, pathwayId) };
}

/* -------------------------------------------------------------- grading -- */

async function recentExamples(formId: string, questionId: string, limit: number) {
  const r = await query<{ answer_text: string; verdict: { id: string; state: 'covered' | 'missing' }[] }>(
    `select answer_text, verdict from pathway_exam_examples
      where form_id = $1 and question_id = $2 order by created_at desc limit $3`,
    [formId, questionId, limit],
  );
  return r.rows.map((row) => ({ answer: row.answer_text, verdict: row.verdict }));
}

/** Same contract as challenge.ts's: one entry per point, no extras, no `unsure`. */
function validateVerdict(
  raw: { id: string; state: PointState }[], keyPoints: KeyPoint[],
): { id: string; state: 'covered' | 'missing' }[] | null {
  if (!Array.isArray(raw) || raw.length !== keyPoints.length) return null;
  const byId = new Map(raw.map((r) => [r.id, r.state]));
  if (byId.size !== raw.length) return null;
  const out: { id: string; state: 'covered' | 'missing' }[] = [];
  for (const kp of keyPoints) {
    const s = byId.get(kp.id);
    if (s !== 'covered' && s !== 'missing') return null;
    out.push({ id: kp.id, state: s });
  }
  return out;
}

/**
 * Grade one free answer with the model, TWICE, and keep the verdict only
 * when both runs agree exactly. A model that says covered/missing on one run
 * and the reverse on the next has not decided, whatever either run claims —
 * so disagreement is `unsure`, the same first-class answer the prompt already
 * invites, and it queues the attempt for the founder.
 */
async function gradeFree(formId: string, q: FreeQuestion, answer: string): Promise<FreeVerdict> {
  const examples = await recentExamples(formId, q.id, config.challenge.maxExamples);
  const call = async () => {
    try { return await ai.matchKeyPoints({ keyPoints: q.key_points, answer, examples }); } catch { return []; }
  };
  const [a, b] = await Promise.all([call(), call()]);
  const va = validateVerdict(a, q.key_points);
  const vb = validateVerdict(b, q.key_points);
  const agree = va && vb && va.every((p, i) => p.state === vb[i].state);
  if (!agree) return { id: q.id, kind: 'free', points: null, unsure: true, by: null };
  return { id: q.id, kind: 'free', points: va, unsure: false, by: 'ai' };
}

export interface Tally { mcq_correct: number; mcq_total: number; free_covered: number; free_total: number; passed: boolean; }

/** Arithmetic over a complete verdict. A part with zero questions is not a part. */
export function tally(verdict: VerdictEntry[], passPercent: number): Tally {
  let mcqC = 0, mcqT = 0, freeC = 0, freeT = 0;
  for (const v of verdict) {
    if (v.kind === 'mcq') { mcqT += 1; if (v.correct) mcqC += 1; }
    else if (v.points) { freeT += v.points.length; freeC += v.points.filter((p) => p.state === 'covered').length; }
  }
  const ok = (c: number, t: number) => t === 0 || (c / t) * 100 >= passPercent;
  return { mcq_correct: mcqC, mcq_total: mcqT, free_covered: freeC, free_total: freeT, passed: ok(mcqC, mcqT) && ok(freeC, freeT) };
}

async function founderRulings(formId: string, client: Queryable = pool): Promise<number> {
  const r = await one<{ n: number }>(
    `select count(*)::int as n from pathway_exam_attempts where form_id = $1 and settled_by = 'founder'`, [formId], client,
  );
  return r?.n ?? 0;
}

/**
 * Grade a queued attempt. MCQs are checked in code; free answers go to the
 * model. The verdict is always STORED, even when the attempt stays queued —
 * that is what the founder's queue pre-fills from. It settles on its own
 * only when nothing is unsure AND (there is no free question, or the form
 * has left its supervised period). Never throws.
 */
export async function gradeAttempt(attempt: ExamAttempt): Promise<ExamAttempt> {
  const answers = attempt.answers ?? {};
  const verdict: VerdictEntry[] = [];
  for (const q of attempt.questions) {
    if (q.kind === 'mcq') verdict.push({ id: q.id, kind: 'mcq', correct: answers[q.id] === q.correct });
    else verdict.push(await gradeFree(attempt.form_id, q, String(answers[q.id] ?? '')));
  }
  const form = await one<ExamForm>(`${FORM_SELECT} where id = $1`, [attempt.form_id]);
  const passPercent = form?.pass_percent ?? config.exam.passPercent;
  const hasFree = attempt.questions.some((q) => q.kind === 'free');
  const unsure = verdict.some((v) => v.kind === 'free' && v.unsure);
  const supervised = hasFree && (form ? (await founderRulings(form.id)) < form.supervised_until : true);

  if (unsure || supervised) {
    const kept = await one<ExamAttempt>(
      `update pathway_exam_attempts set verdict = $2::jsonb where id = $1 and status = 'queued' returning ${ATTEMPT_COLS}`,
      [attempt.id, JSON.stringify(verdict)],
    );
    if (kept) await notifyFounderQueued(kept, unsure ? 'unsure' : 'supervised');
    // `kept` is null when the founder settled it first, or the form (and the
    // attempt with it) was deleted mid-grade; hand back whatever stands.
    return kept ?? (await getAttempt(attempt.id)) ?? attempt;
  }
  return settle(attempt.id, verdict, 'ai', passPercent, null);
}

/**
 * The one writer of a settled state — for the model and the founder alike.
 * Conditional on `status = 'queued'` so the two can never both settle the
 * same attempt: whoever is second finds no row and returns what stands.
 * Passing issues the certificate in the same transaction.
 */
async function settle(
  attemptId: string, verdict: VerdictEntry[], by: 'ai' | 'founder', passPercent: number,
  holderName: string | null,
): Promise<ExamAttempt> {
  const t = tally(verdict, passPercent);
  const result = await withTransaction(async (client) => {
    const row = await one<ExamAttempt>(
      `update pathway_exam_attempts
          set status = $2, verdict = $3::jsonb, settled_by = $4, settled_at = now(),
              mcq_correct = $5, mcq_total = $6, free_covered = $7, free_total = $8,
              holder_name = coalesce($9, holder_name)
        where id = $1 and status = 'queued'
        returning ${ATTEMPT_COLS}`,
      [attemptId, t.passed ? 'passed' : 'failed', JSON.stringify(verdict), by,
        t.mcq_correct, t.mcq_total, t.free_covered, t.free_total, holderName],
      client,
    );
    if (!row) return null;
    let cert: Certificate | null = null;
    if (t.passed) {
      const issued = await issueCertificate(row.user_id, row.pathway_id, {
        holderName: row.holder_name || 'بدون نام', attemptId: row.id, client, notify: false,
      });
      cert = issued.certificate;
    }
    return { row, cert };
  });
  if (!result) return (await getAttempt(attemptId))!;
  await notifyReaderSettled(result.row, result.cert);
  return result.row;
}

/* --------------------------------------------------------------- founder -- */

export type RuleInput = {
  decision: 'pass' | 'fail' | 'void';
  /** Per free question: the founder's per-point ruling. Optional for pass/fail. */
  free?: { id: string; points: { id: string; state: 'covered' | 'missing' }[] }[];
  holder_name?: string | null;
};

export type RuleResult =
  | { ok: true; attempt: ExamAttempt }
  | { ok: false; error: 'not_found' | 'not_queued' | 'bad_verdict' };

/**
 * The founder rules on a queued attempt.
 *
 * `pass`/`fail` is the decision; the per-point `free` rulings are OPTIONAL
 * and, when given, are (a) stored as the attempt's verdict in place of the
 * model's and (b) written as worked examples for each question. Without
 * them the model's verdict stands as the record (or a null one if it never
 * decided) and the decision is taken as read — the counts follow the
 * decision, never the reverse: a founder who says «قبول» over a 60% verdict
 * has decided the rubric was too hard, and the row says passed.
 *
 * `void` strikes the attempt: it spends no attempt and starts no retry
 * clock — the founder's tool for a paste that was wrong, or a reader who
 * had a real problem mid-exam.
 */
export async function ruleAttempt(attemptId: string, input: RuleInput): Promise<RuleResult> {
  const attempt = await getAttempt(attemptId);
  if (!attempt) return { ok: false, error: 'not_found' };

  if (input.decision === 'void') {
    if (attempt.status === 'void') return { ok: true, attempt };
    const row = await one<ExamAttempt>(
      `update pathway_exam_attempts set status = 'void', settled_by = 'founder', settled_at = now()
        where id = $1 and status <> 'passed' returning ${ATTEMPT_COLS}`, [attemptId],
    );
    return row ? { ok: true, attempt: row } : { ok: false, error: 'not_queued' };
  }

  if (attempt.status !== 'queued') return { ok: false, error: 'not_queued' };

  // Build the verdict the row will carry: the model's, overridden per free
  // question by whatever the founder ruled.
  const base: VerdictEntry[] = attempt.questions.map((q) => {
    const prior = attempt.verdict?.find((v) => v.id === q.id);
    if (q.kind === 'mcq') return { id: q.id, kind: 'mcq', correct: (attempt.answers ?? {})[q.id] === q.correct };
    return prior && prior.kind === 'free' ? prior : { id: q.id, kind: 'free', points: null, unsure: true, by: null };
  });
  const examples: { question_id: string; answer: string; verdict: { id: string; state: 'covered' | 'missing' }[] }[] = [];
  for (const f of input.free ?? []) {
    const q = attempt.questions.find((x) => x.id === f.id);
    if (!q || q.kind !== 'free') return { ok: false, error: 'bad_verdict' };
    const v = validateVerdict(f.points as { id: string; state: PointState }[], q.key_points);
    if (!v) return { ok: false, error: 'bad_verdict' };
    const i = base.findIndex((b) => b.id === q.id);
    base[i] = { id: q.id, kind: 'free', points: v, unsure: false, by: 'founder' };
    examples.push({ question_id: q.id, answer: String((attempt.answers ?? {})[q.id] ?? ''), verdict: v });
  }
  // Any free question still undecided after the founder's input is recorded
  // as such — the decision below is what counts, not the tally.
  const form = await one<ExamForm>(`${FORM_SELECT} where id = $1`, [attempt.form_id]);
  const passPercent = form?.pass_percent ?? config.exam.passPercent;

  const t = tally(base, passPercent);
  const passed = input.decision === 'pass';
  const holder = input.holder_name?.trim() || null;
  const result = await withTransaction(async (client) => {
    const row = await one<ExamAttempt>(
      `update pathway_exam_attempts
          set status = $2, verdict = $3::jsonb, settled_by = 'founder', settled_at = now(),
              mcq_correct = $4, mcq_total = $5, free_covered = $6, free_total = $7,
              holder_name = coalesce($8, holder_name)
        where id = $1 and status = 'queued'
        returning ${ATTEMPT_COLS}`,
      [attemptId, passed ? 'passed' : 'failed', JSON.stringify(base),
        t.mcq_correct, t.mcq_total, t.free_covered, t.free_total, holder],
      client,
    );
    if (!row) return null;
    for (const ex of examples) {
      await query(
        `insert into pathway_exam_examples (form_id, question_id, answer_text, verdict) values ($1, $2, $3, $4::jsonb)`,
        [attempt.form_id, ex.question_id, ex.answer, JSON.stringify(ex.verdict)], client,
      );
    }
    let cert: Certificate | null = null;
    if (passed) {
      const issued = await issueCertificate(row.user_id, row.pathway_id, {
        holderName: row.holder_name || 'بدون نام', attemptId: row.id, client, notify: false,
      });
      cert = issued.certificate;
    }
    return { row, cert };
  });
  if (!result) return { ok: false, error: 'not_queued' };
  await notifyReaderSettled(result.row, result.cert);
  return { ok: true, attempt: result.row };
}

/* -------------------------------------------------------------- intent -- */

/**
 * The reader answers «گواهی‌نامهٔ این مسیر را می‌خواهی؟». Enrols them if
 * they were not (a wish about a pathway is being on it), records the answer
 * on the enrolment row, and — on «بله» — runs the near-the-end sweep for
 * this one pair at once: a reader who is already three steps from the end
 * is exactly the news the alert exists for, and it must not wait for 22:00.
 */
export async function setCertificateIntent(
  userId: string, pathwayId: string, intent: CertificateIntent,
): Promise<ExamState> {
  const pathway = getPathwayById(pathwayId);
  if (!pathway || pathway.kind === 'bundle') throw new Error('unknown_pathway');
  await query(
    `insert into user_pathways (user_id, pathway_id, current_step, certificate_intent, certificate_intent_at)
     values ($1, $2, 0, $3, now())
     on conflict (user_id, pathway_id) do update
       set certificate_intent = excluded.certificate_intent, certificate_intent_at = now()`,
    [userId, pathwayId, intent],
  );
  if (intent === 'wanted') await runPathwayAlerts(new Date(), { userId, pathwayId });
  return examState(userId, pathwayId);
}

/* ------------------------------------------------------------- notices -- */

const FA = '۰۱۲۳۴۵۶۷۸۹';
const fa = (n: number | string) => String(n).replace(/\d/g, (d) => FA[Number(d)]);

export function examUrl(pathwayId: string): string {
  return `/plus/exam.html?id=${encodeURIComponent(pathwayId)}`;
}

async function notifyReaderSettled(a: ExamAttempt, cert: Certificate | null): Promise<void> {
  const title = getPathwayById(a.pathway_id)?.title_fa ?? a.pathway_id;
  if (a.status === 'passed' && cert) {
    await sendCapped(a.user_id, {
      title: 'در آزمون مسیر قبول شدی 🎓',
      body: `آزمون «${title}» را گذراندی و گواهی‌نامه‌ات به نام ${a.holder_name} صادر شد. کد: ${cert.verify_code}`
        + ` · ${fa(config.certificate.discountPercent)}٪ تخفیف برای خرید بعدی‌ات ثبت شد.`,
      url: `/plus/certificate.html?c=${cert.verify_code}`,
      tag: 'exam',
    }, 'exam_result');
    return;
  }
  const parts: string[] = [];
  if (a.mcq_total) parts.push(`تستی ${fa(a.mcq_correct ?? 0)} از ${fa(a.mcq_total)}`);
  if (a.free_total) parts.push(`تشریحی ${fa(a.free_covered ?? 0)} نکته از ${fa(a.free_total)}`);
  await sendCapped(a.user_id, {
    title: 'نتیجهٔ آزمون مسیر',
    body: `این بار آزمون «${title}» به حد نصاب نرسید${parts.length ? ` (${parts.join(' · ')})` : ''}. جزئیات و زمان تلاش بعدی در صفحهٔ آزمون.`,
    url: examUrl(a.pathway_id),
    tag: 'exam',
  }, 'exam_result');
}

/** Tell the reader an exam was opened for them early. */
export async function notifyAssigned(userId: string, pathwayId: string): Promise<void> {
  const title = getPathwayById(pathwayId)?.title_fa ?? pathwayId;
  await sendCapped(userId, {
    title: 'آزمون مسیر برایت باز شد',
    body: `آزمون پایانی مسیر «${title}» آماده است. هر وقت خواستی شروع کن — با قبولی، گواهی‌نامه به نام خودت صادر می‌شود.`,
    url: examUrl(pathwayId),
    tag: 'exam',
  }, 'exam_assigned');
}

/**
 * A form just appeared for a pathway some readers were already let into —
 * tell each of them (skipping anyone who already sat or holds it). Returns
 * how many were told.
 */
export async function notifyAssigneesOfNewForm(pathwayId: string): Promise<number> {
  const r = await query<{ user_id: string }>(
    `select e.user_id from pathway_exams e
      where e.pathway_id = $1
        and not exists (select 1 from pathway_exam_attempts a where a.user_id = e.user_id and a.pathway_id = e.pathway_id)
        and not exists (select 1 from certificates c where c.user_id = e.user_id and c.pathway_id = e.pathway_id and c.revoked_at is null)`,
    [pathwayId],
  );
  for (const row of r.rows) await notifyAssigned(row.user_id, pathwayId);
  return r.rows.length;
}

/** One line to the founder's own account when an attempt needs a human. */
async function notifyFounderQueued(a: ExamAttempt, why: 'unsure' | 'supervised'): Promise<void> {
  const phone = config.pathwayAlert.alertPhone || config.support.alertPhone;
  if (!phone) return;
  const target = await one<{ id: string }>('select id from profiles where phone = $1', [phone]);
  if (!target || target.id === a.user_id) return;
  const title = getPathwayById(a.pathway_id)?.title_fa ?? a.pathway_id;
  await sendCapped(target.id, {
    title: 'یک آزمون منتظر توست',
    body: `${a.reference} — «${title}»، تلاش ${fa(a.attempt_no)}. `
      + (why === 'unsure' ? 'مدل روی یک پاسخ تشریحی مطمئن نبود.' : 'فرم هنوز زیر نظر توست؛ حکم مدل آماده است.'),
    url: '/admin#exams',
    tag: 'exam-queue',
  }, 'system');
}

/* --------------------------------------------------------------- panel -- */

export interface QueueRow {
  id: string;
  reference: string;
  pathway_id: string;
  title_fa: string;
  attempt_no: number;
  holder_name: string | null;
  display_name: string | null;
  phone: string | null;
  submitted_at: Date | null;
  questions: ExamQuestion[];
  answers: Record<string, unknown> | null;
  verdict: VerdictEntry[] | null;
  /** What the model would have settled, so the founder sees pass/fail at a glance. */
  ai_tally: Tally | null;
  pass_percent: number;
  rulings: number;
  supervised_until: number;
}

/** The founder's queue: whoever waited longest first. Full detail — it is what the ruling is made from. */
export async function queueRows(): Promise<QueueRow[]> {
  const r = await query<Omit<QueueRow, 'title_fa' | 'ai_tally'>>(
    `select a.id, a.reference, a.pathway_id, a.attempt_no, a.holder_name, a.submitted_at,
            a.questions, a.answers, a.verdict, p.display_name, p.phone,
            f.pass_percent, f.supervised_until,
            (select count(*)::int from pathway_exam_attempts x where x.form_id = f.id and x.settled_by = 'founder') as rulings
       from pathway_exam_attempts a
       join profiles p on p.id = a.user_id
       join pathway_exam_forms f on f.id = a.form_id
      where a.status = 'queued'
      order by a.submitted_at nulls last, a.created_at`,
  );
  return r.rows.map((row) => ({
    ...row,
    title_fa: getPathwayById(row.pathway_id)?.title_fa ?? row.pathway_id,
    ai_tally: row.verdict && !row.verdict.some((v) => v.kind === 'free' && v.unsure)
      ? tally(row.verdict, row.pass_percent) : null,
  }));
}

export interface RosterRow {
  id: string;
  reference: string;
  pathway_id: string;
  title_fa: string;
  attempt_no: number;
  status: AttemptStatus;
  settled_by: 'ai' | 'founder' | null;
  holder_name: string | null;
  display_name: string | null;
  phone: string | null;
  mcq_correct: number | null;
  mcq_total: number | null;
  free_covered: number | null;
  free_total: number | null;
  created_at: Date;
  submitted_at: Date | null;
  settled_at: Date | null;
}

/** Every attempt, newest first — the record. */
export async function attemptRoster(limit = 200): Promise<RosterRow[]> {
  const r = await query<Omit<RosterRow, 'title_fa'>>(
    `select a.id, a.reference, a.pathway_id, a.attempt_no, a.status, a.settled_by, a.holder_name,
            p.display_name, p.phone, a.mcq_correct, a.mcq_total, a.free_covered, a.free_total,
            a.created_at, a.submitted_at, a.settled_at
       from pathway_exam_attempts a join profiles p on p.id = a.user_id
      order by a.created_at desc limit $1`,
    [limit],
  );
  return r.rows.map((row) => ({ ...row, title_fa: getPathwayById(row.pathway_id)?.title_fa ?? row.pathway_id }));
}

/** For `GET /certificates`: one word per pathway on where the reader's exam stands. */
export async function examStates(userId: string, pathwayIds: string[]): Promise<Map<string, ExamStateKind>> {
  const out = new Map<string, ExamStateKind>();
  if (!pathwayIds.length) return out;
  const [forms, consumed, assigned, enrolled, attempts] = await Promise.all([
    query<{ pathway_id: string; max_attempts: number; retry_days: number }>(
      'select pathway_id, max_attempts, retry_days from pathway_exam_forms where pathway_id = any($1)', [pathwayIds],
    ),
    getConsumedContentIds(userId),
    query<{ pathway_id: string }>('select pathway_id from pathway_exams where user_id = $1', [userId]),
    query<{ pathway_id: string }>('select pathway_id from user_pathways where user_id = $1', [userId]),
    query<{ pathway_id: string; status: AttemptStatus; submitted_at: Date | null }>(
      'select pathway_id, status, submitted_at from pathway_exam_attempts where user_id = $1', [userId],
    ),
  ]);
  const formBy = new Map(forms.rows.map((f) => [f.pathway_id, f]));
  const assignedSet = new Set(assigned.rows.map((a) => a.pathway_id));
  const enrolledSet = new Set(enrolled.rows.map((a) => a.pathway_id));
  const now = Date.now();
  for (const id of pathwayIds) {
    const form = formBy.get(id);
    if (!form) { out.set(id, 'no_form'); continue; }
    const mine = attempts.rows.filter((a) => a.pathway_id === id);
    if (mine.some((a) => a.status === 'passed')) { out.set(id, 'passed'); continue; }
    if (mine.some((a) => a.status === 'open')) { out.set(id, 'open'); continue; }
    if (mine.some((a) => a.status === 'queued')) { out.set(id, 'queued'); continue; }
    const pathway = getPathwayById(id);
    const complete = pathway ? computeProgress(pathway, consumed).is_complete : false;
    if (!enrolledSet.has(id) || (!complete && !assignedSet.has(id))) { out.set(id, 'locked'); continue; }
    const counted = mine.filter((a) => COUNTED.includes(a.status));
    if (counted.length >= form.max_attempts) { out.set(id, 'exhausted'); continue; }
    const last = counted.reduce<number>((m, a) => Math.max(m, a.submitted_at ? a.submitted_at.getTime() : 0), 0);
    if (last && form.retry_days > 0 && last + form.retry_days * 86_400_000 > now) { out.set(id, 'wait'); continue; }
    out.set(id, 'ready');
  }
  return out;
}

/* Kept for merge-profiles and older callers. */
export type PathwayExam = ExamAssignment;
export const listExams = listAssignments;
export const deleteExam = deleteAssignment;
export const getExam = getAssignment;
export const examRoster = assignmentRoster;
