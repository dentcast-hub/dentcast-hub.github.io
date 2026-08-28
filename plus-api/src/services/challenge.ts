import { one, query, withTransaction, type Queryable } from '../db.js';
import { config } from '../config.js';
import { mintReference } from './reference.js';
import { recordActivity } from './activity.js';
import { ai } from '../providers/registry.js';
import type { KeyPoint, PointState } from '../providers/ai/types.js';

/**
 * چالش — a founder-authored question, model-assisted grading against key
 * points the founder wrote at publish time. Design ledger:
 * .dentcast/challenge-handoff.md.
 *
 * The founder's half (`challenges`) never leaves the database (RULE 2): the
 * key points are the grading rubric and a committed sidecar would be
 * readable at a URL in one devtools tab, defeating the premium gate and the
 * feature at once. The public half (question + image) lives in the
 * generated `plus/challenges.json` instead — see tools/build_challenge_index.mjs.
 */

export interface Challenge {
  content_id: string;
  answer_fa: string;
  key_points: KeyPoint[];
  created_at: string;
  updated_at: string;
}

export type VerdictBy = 'ai' | 'founder';
export interface VerdictEntry { id: string; state: 'covered' | 'missing'; by: VerdictBy; }

export interface ChallengeAttempt {
  id: string;
  user_id: string;
  content_id: string;
  answer_text: string;
  reference: string;
  status: 'queued' | 'settled';
  verdict: VerdictEntry[] | null;
  created_at: string;
  settled_at: string | null;
}

const CHALLENGE_COLUMNS = 'content_id, answer_fa, key_points, created_at, updated_at';
const ATTEMPT_COLUMNS = 'id, user_id, content_id, answer_text, reference, status, verdict, created_at, settled_at';

export async function getChallenge(contentId: string, client?: Queryable): Promise<Challenge | null> {
  return one<Challenge>(
    `select ${CHALLENGE_COLUMNS} from challenges where content_id = $1`,
    [contentId],
    client,
  );
}

/**
 * 3–5 key points, each a non-empty {id, text}, ids unique. Returns null on any
 * violation — the caller (routes/admin.ts) turns that into a 400, never a
 * partial write.
 */
export function validateKeyPoints(input: unknown): KeyPoint[] | null {
  if (!Array.isArray(input) || input.length < 3 || input.length > 5) return null;
  const ids = new Set<string>();
  const out: KeyPoint[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return null;
    const id = (raw as { id?: unknown }).id;
    const text = (raw as { text?: unknown }).text;
    if (typeof id !== 'string' || !id.trim() || typeof text !== 'string' || !text.trim()) return null;
    if (ids.has(id)) return null;
    ids.add(id);
    out.push({ id, text: text.trim() });
  }
  return out;
}

export interface UpsertInput { contentId: string; answerFa: string; keyPoints: KeyPoint[]; }

/** Where a چالش is created and edited — `on conflict … do update`, step 7.3. */
export async function upsertChallenge(input: UpsertInput): Promise<Challenge> {
  return (await one<Challenge>(
    `insert into challenges (content_id, answer_fa, key_points)
       values ($1, $2, $3)
     on conflict (content_id) do update
       set answer_fa = excluded.answer_fa, key_points = excluded.key_points, updated_at = now()
     returning ${CHALLENGE_COLUMNS}`,
    [input.contentId, input.answerFa, JSON.stringify(input.keyPoints)],
  ))!;
}

export async function attemptOf(userId: string, contentId: string): Promise<ChallengeAttempt | null> {
  return one<ChallengeAttempt>(
    `select ${ATTEMPT_COLUMNS} from challenge_attempts where user_id = $1 and content_id = $2`,
    [userId, contentId],
  );
}

/**
 * Insert the reader's one-and-only attempt (RULE 3: enforced by the unique
 * index, never by a count). `inserted: false` means a row already existed —
 * the route answers 409 with it rather than an error, since a reader who
 * already answered has already earned the founder's answer.
 */
export async function createAttempt(
  userId: string,
  contentId: string,
  answerText: string,
): Promise<{ inserted: boolean; attempt: ChallengeAttempt }> {
  for (let i = 0; i < 5; i += 1) {
    try {
      const row = await one<ChallengeAttempt>(
        `insert into challenge_attempts (user_id, content_id, answer_text, reference)
           values ($1, $2, $3, $4)
         on conflict (user_id, content_id) do nothing
         returning ${ATTEMPT_COLUMNS}`,
        [userId, contentId, answerText, mintReference('C')],
      );
      if (row) return { inserted: true, attempt: row };
      const existing = (await attemptOf(userId, contentId))!;
      return { inserted: false, attempt: existing };
    } catch (err) {
      if ((err as { code?: string }).code !== '23505') throw err;
      // reference collision (astronomically unlikely) — mint a fresh one and retry
    }
  }
  throw new Error('could not mint a unique challenge reference after 5 attempts');
}

/** Newest `limit` founder rulings for this چالش, for the model call (§6.3). */
async function recentExamples(
  contentId: string,
  limit: number,
): Promise<{ answer: string; verdict: { id: string; state: 'covered' | 'missing' }[] }[]> {
  const r = await query<{ answer_text: string; verdict: { id: string; state: 'covered' | 'missing' }[] }>(
    `select answer_text, verdict from challenge_examples
      where content_id = $1 order by created_at desc limit $2`,
    [contentId, limit],
  );
  return r.rows.map((row) => ({ answer: row.answer_text, verdict: row.verdict }));
}

/**
 * Validate the model's raw output before anything is stored or shown (§6.6):
 * one entry per key point, every id in the key-point set, no extras, no
 * duplicates, every state one of the three. Any violation, OR any `unsure` on
 * any point, returns null — the caller treats that exactly like a thrown
 * error and leaves the attempt queued (RULE 4/RULE 6.2). A model failure must
 * never be rendered as "missing".
 */
function validateModelVerdict(
  raw: { id: string; state: PointState }[],
  keyPoints: KeyPoint[],
): { id: string; state: 'covered' | 'missing' }[] | null {
  if (!Array.isArray(raw) || raw.length !== keyPoints.length) return null;
  const byId = new Map(raw.map((r) => [r.id, r.state]));
  if (byId.size !== raw.length) return null; // duplicate ids
  const out: { id: string; state: 'covered' | 'missing' }[] = [];
  for (const kp of keyPoints) {
    const state = byId.get(kp.id);
    if (state !== 'covered' && state !== 'missing') return null; // missing id, extra id, or 'unsure'
    out.push({ id: kp.id, state });
  }
  return out;
}

/**
 * Call the model and settle the attempt, or leave it queued. Never throws —
 * a provider failure (after its own retries) is caught here and treated
 * exactly like an all-`unsure` answer (RULE 4/6.2): the attempt stays queued,
 * never rendered as a wrong answer.
 */
export async function gradeAttempt(challenge: Challenge, attempt: ChallengeAttempt): Promise<ChallengeAttempt> {
  const examples = await recentExamples(challenge.content_id, config.challenge.maxExamples);

  let raw: { id: string; state: PointState }[];
  try {
    raw = await ai.matchKeyPoints({
      keyPoints: challenge.key_points,
      answer: attempt.answer_text,
      examples,
    });
  } catch {
    raw = [];
  }

  const validated = validateModelVerdict(raw, challenge.key_points);
  if (!validated) return attempt; // stays queued

  const verdict: VerdictEntry[] = validated.map((v) => ({ ...v, by: 'ai' }));
  const settled = await one<ChallengeAttempt>(
    `update challenge_attempts set status = 'settled', verdict = $2, settled_at = now()
      where id = $1 returning ${ATTEMPT_COLUMNS}`,
    [attempt.id, JSON.stringify(verdict)],
  );
  return settled!;
}

/**
 * Score is recorded before the model runs and never depends on the verdict
 * (RULE 7) — what the reader earned is the writing, already done and stored.
 * Returns 'already_answered' when a prior attempt exists; the caller answers
 * 409 with it rather than an error.
 */
export async function submitAnswer(
  userId: string,
  contentId: string,
  answerText: string,
): Promise<{ status: 'already_answered' | 'settled' | 'queued'; attempt: ChallengeAttempt }> {
  const { inserted, attempt } = await createAttempt(userId, contentId, answerText);
  if (!inserted) return { status: 'already_answered', attempt };

  await recordActivity(userId, 'challenge_answered', contentId, {});

  const challenge = await getChallenge(contentId);
  if (!challenge) return { status: 'queued', attempt }; // defensive: route already checked existence

  const graded = await gradeAttempt(challenge, attempt);
  return { status: graded.status === 'settled' ? 'settled' : 'queued', attempt: graded };
}

/**
 * The per-point array reduced for the wire (§7.2) — one exported function,
 * called from both GET and POST, so there is only one place that can leak
 * the raw array or drift from the other.
 */
export function reduceVerdict(
  verdict: VerdictEntry[] | null,
): { result: 'full' | 'partial' | 'none'; covered_count: number; point_count: number } | null {
  if (!verdict || !verdict.length) return null;
  const point_count = verdict.length;
  const covered_count = verdict.filter((v) => v.state === 'covered').length;
  const result = covered_count === point_count ? 'full' : covered_count === 0 ? 'none' : 'partial';
  return { result, covered_count, point_count };
}

export interface QueueRow {
  id: string;
  content_id: string;
  reference: string;
  answer_text: string;
  created_at: string;
  display_name: string | null;
  phone: string | null;
  key_points: KeyPoint[];
}

/** The founder's queue: oldest first — whoever waited longest goes first. */
export async function queueRows(): Promise<QueueRow[]> {
  const r = await query<QueueRow>(
    `select a.id, a.content_id, a.reference, a.answer_text, a.created_at,
            p.display_name, p.phone, c.key_points
       from challenge_attempts a
       join profiles p on p.id = a.user_id
       join challenges c on c.content_id = a.content_id
      where a.status = 'queued'
      order by a.created_at`,
  );
  return r.rows;
}

export async function getAttempt(id: string): Promise<ChallengeAttempt | null> {
  return one<ChallengeAttempt>(`select ${ATTEMPT_COLUMNS} from challenge_attempts where id = $1`, [id]);
}

export type RuleResult =
  | { ok: true; attempt: ChallengeAttempt; userId: string }
  | { ok: false; error: 'not_found' | 'unsure_not_allowed' | 'key_points_mismatch' };

/**
 * The founder rules a queued attempt (step 7.3), in one transaction: reject
 * `unsure` (the queue is where ambiguity is resolved, not deferred again),
 * require exactly the challenge's key points, settle the attempt, and write
 * the ruling as a worked example for the SAME challenge (§6.3 — this is what
 * makes the queue shrink as a چالش ages).
 */
export async function settleByFounder(
  attemptId: string,
  verdictInput: { id: string; state: string }[],
): Promise<RuleResult> {
  return withTransaction(async (client) => {
    const attempt = await one<ChallengeAttempt>(
      `select ${ATTEMPT_COLUMNS} from challenge_attempts where id = $1 for update`,
      [attemptId],
      client,
    );
    if (!attempt) return { ok: false, error: 'not_found' };

    const challenge = await getChallenge(attempt.content_id, client);
    if (!challenge) return { ok: false, error: 'not_found' };

    if (verdictInput.some((v) => v.state === 'unsure')) return { ok: false, error: 'unsure_not_allowed' };

    const wantIds = challenge.key_points.map((k) => k.id);
    const gotIds = verdictInput.map((v) => v.id);
    const sameSet = wantIds.length === gotIds.length
      && new Set(gotIds).size === gotIds.length
      && wantIds.every((id) => gotIds.includes(id));
    if (!sameSet) return { ok: false, error: 'key_points_mismatch' };
    if (verdictInput.some((v) => v.state !== 'covered' && v.state !== 'missing')) {
      return { ok: false, error: 'key_points_mismatch' };
    }

    const verdict: VerdictEntry[] = challenge.key_points.map((kp) => ({
      id: kp.id,
      state: verdictInput.find((v) => v.id === kp.id)!.state as 'covered' | 'missing',
      by: 'founder',
    }));

    const settled = await one<ChallengeAttempt>(
      `update challenge_attempts set status = 'settled', verdict = $2, settled_at = now()
        where id = $1 returning ${ATTEMPT_COLUMNS}`,
      [attemptId, JSON.stringify(verdict)],
      client,
    );

    await query(
      `insert into challenge_examples (content_id, answer_text, verdict) values ($1, $2, $3)`,
      [attempt.content_id, attempt.answer_text, JSON.stringify(verdict.map(({ id, state }) => ({ id, state })))],
      client,
    );

    return { ok: true, attempt: settled!, userId: attempt.user_id };
  });
}
