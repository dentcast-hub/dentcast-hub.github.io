import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from './config.js';

/**
 * Server view of `plus/exam-questions.json` — article exam questions kept in
 * the REPO, the second source of «سؤالِ مقاله» beside the
 * `content_exam_questions` table (founder, 1405/08/03: «بانک سوال مسیر
 * دوگانه داشته باشه … یکی اینکه من تو API چی گذاشتم، یکی اینکه تو اینور چی
 * گذاشتی»). Publishing an article writes its questions into this file in the
 * same commit as the article, and every pathway that carries the article
 * draws them at attempt time — no panel, no deploy. The founder's own
 * questions keep going through the panel into the table; the two never need
 * to agree about anything because both are keyed by `content_id` and the
 * pool is derived from their union (services/pathway-exams.ts `poolFor`).
 *
 * Loaded and cached exactly the way badges.ts and pathways.ts are: reload on
 * file change, published copy wins (content-refresh.ts), last-good on a read
 * error. What this module decides on its own:
 *
 *   · **Only live rows are served.** A row with `status: "review"` is one the
 *     founder has not approved yet (the quiz-to-exam rewrite of 1405/08/03
 *     shipped 96 of those beside 228 live ones); `rejected` is kept for the
 *     record. Neither is ever drawn. A row with no `status` is live — that is
 *     what a publish writes after the question was approved in chat.
 *   · **Ids are the file's and must carry the `r-` class.** An attempt
 *     snapshots the questions it drew under their ids, and the «unseen first»
 *     draw keys on them, so a regenerated id would make a reader's second
 *     attempt repeat questions it thinks are new. `r-` keeps them apart from a
 *     form's `qN` and a table row's `c-xxxxxxxx` inside one snapshot. A row
 *     with a malformed id or shape is dropped with a warning, never guessed at.
 *   · **The key is in the file, and the file is public.** Founder decision,
 *     1405/08/03 («آزمونا آزمون ملی نیست»); `robots.txt` keeps it out of
 *     search results and nothing more. The challenge answers keep their
 *     stricter rule — this one is the founder's call for this exam.
 */

export interface RepoMcq {
  id: string;
  kind: 'mcq';
  prompt_fa: string;
  options: string[];
  correct: number;
}

export interface RepoFree {
  id: string;
  kind: 'free';
  prompt_fa: string;
  key_points: { id: string; text: string }[];
}

export type RepoExamQuestion = RepoMcq | RepoFree;

interface RepoFile {
  version: number;
  byContent: Record<string, { questions: unknown[] }>;
}

const ID_RE = /^r-[a-z0-9][a-z0-9-]{3,40}$/;
const MAX_OPTIONS = 6;
const MAX_KEY_POINTS = 6;
const LIVE_STATUSES = new Set([undefined, '', 'live', 'approved']);

let cached: Map<string, RepoExamQuestion[]> | null = null;
let cachedMtimeMs = 0;
let cachedCount = 0;
/** Set by content-refresh.ts once a published copy has been fetched and validated. */
let remote: Map<string, RepoExamQuestion[]> | null = null;
let remoteCount = 0;

function defaultPath(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // plus-api/src (or dist)
  return resolve(here, '..', '..', 'plus', 'exam-questions.json');
}

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** One row of the file → a question the exam can draw, or null (with the reason). */
export function liveQuestion(raw: unknown, contentId: string): { q: RepoExamQuestion | null; why?: string } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { q: null, why: 'not an object' };
  const r = raw as Record<string, unknown>;
  const status = typeof r.status === 'string' ? r.status.trim() : undefined;
  if (!LIVE_STATUSES.has(status)) return { q: null }; // review / rejected: silently not live
  const id = str(r.id);
  if (!ID_RE.test(id)) return { q: null, why: `${contentId}: id «${id}» is not an r- id` };
  const prompt = str(r.prompt_fa);
  if (!prompt) return { q: null, why: `${id}: empty prompt_fa` };
  const kind = str(r.kind) || (Array.isArray(r.options) ? 'mcq' : Array.isArray(r.key_points) ? 'free' : '');
  if (kind === 'mcq') {
    const options = Array.isArray(r.options) ? r.options.map(str) : [];
    if (options.length < 2 || options.length > MAX_OPTIONS || options.some((o) => !o)) return { q: null, why: `${id}: options` };
    if (new Set(options).size !== options.length) return { q: null, why: `${id}: duplicate options` };
    const correct = r.correct;
    if (typeof correct !== 'number' || !Number.isInteger(correct) || correct < 0 || correct >= options.length) {
      return { q: null, why: `${id}: correct` };
    }
    return { q: { id, kind: 'mcq', prompt_fa: prompt, options, correct } };
  }
  if (kind === 'free') {
    const pts = Array.isArray(r.key_points) ? r.key_points : [];
    const key_points = pts.map((p, i) => {
      const text = p && typeof p === 'object' ? str((p as Record<string, unknown>).text) : str(p);
      const pid = (p && typeof p === 'object' ? str((p as Record<string, unknown>).id) : '') || `${id}-k${i + 1}`;
      return { id: pid, text };
    });
    if (!key_points.length || key_points.length > MAX_KEY_POINTS || key_points.some((p) => !p.text)) return { q: null, why: `${id}: key_points` };
    return { q: { id, kind: 'free', prompt_fa: prompt, key_points } };
  }
  return { q: null, why: `${id}: kind` };
}

/**
 * The whole file → content_id → live questions. Shape failures of single
 * rows are dropped with one warning each (a bad row must not take 300 good
 * ones down with it); a payload that is not this file at all returns null.
 */
function parseFile(raw: unknown, label: string): { map: Map<string, RepoExamQuestion[]>; count: number } | null {
  if (!raw || typeof raw !== 'object') return null;
  const f = raw as RepoFile;
  if (!f.byContent || typeof f.byContent !== 'object' || Array.isArray(f.byContent)) return null;
  const map = new Map<string, RepoExamQuestion[]>();
  const ids = new Set<string>();
  let count = 0;
  let dropped = 0;
  for (const [contentId, entry] of Object.entries(f.byContent)) {
    const rows = entry && typeof entry === 'object' && Array.isArray((entry as { questions?: unknown }).questions)
      ? (entry as { questions: unknown[] }).questions : null;
    if (!rows) { dropped += 1; continue; }
    const out: RepoExamQuestion[] = [];
    for (const row of rows) {
      const { q, why } = liveQuestion(row, contentId);
      if (!q) { if (why) { dropped += 1; warn(`[exam-questions] ${label}: dropped ${why}`); } continue; }
      if (ids.has(q.id)) { dropped += 1; warn(`[exam-questions] ${label}: dropped duplicate id ${q.id}`); continue; }
      ids.add(q.id);
      out.push(q);
    }
    if (out.length) { map.set(contentId, out); count += out.length; }
  }
  if (dropped) warn(`[exam-questions] ${label}: ${dropped} row(s) dropped, ${count} live`);
  return { map, count };
}

function warn(msg: string): void {
  // eslint-disable-next-line no-console
  if (process.env.NODE_ENV !== 'test') console.warn(msg);
}

/**
 * Adopt a freshly published file. Refused when it carries no live question
 * at all: like applyRemoteBadges, an empty file passes every shape check
 * while closing every pathway's article pool, and no publish ever produces
 * one — emptying the bank is a deploy-time decision.
 *
 * @returns true if the payload was adopted.
 */
export function applyRemoteExamQuestions(raw: unknown): boolean {
  const parsed = parseFile(raw, 'published');
  if (!parsed || parsed.count === 0) return false;
  remote = parsed.map;
  remoteCount = parsed.count;
  return true;
}

/** Which copy is being served — for the boot/refresh log and for tests. */
export function examQuestionsSource(): string {
  return remote ? `published (${remoteCount} live question(s))` : 'image/disk';
}

/** Test-only: forget the fetched copy so a case can start from the baked file. */
export function resetRemoteExamQuestions(): void {
  remote = null;
  remoteCount = 0;
}

function disk(): Map<string, RepoExamQuestion[]> {
  const path = config.examQuestionsPath || defaultPath();
  try {
    const mtime = statSync(path).mtimeMs;
    if (cached && mtime === cachedMtimeMs) return cached;
    const parsed = parseFile(JSON.parse(readFileSync(path, 'utf8')), path);
    if (!parsed) throw new Error('not an exam-questions file');
    cached = parsed.map;
    cachedCount = parsed.count;
    cachedMtimeMs = mtime;
  } catch (err) {
    if (cached) return cached; // keep the last good copy on a transient read error
    warn(`[exam-questions] could not load ${path}; the repo source of article questions is empty (${(err as Error).message})`);
    cached = new Map();
    cachedCount = 0;
  }
  return cached;
}

function current(): Map<string, RepoExamQuestion[]> {
  return remote ?? disk();
}

/** Live repo questions written for one article, in file order. */
export function repoQuestionsFor(contentId: string): RepoExamQuestion[] {
  return current().get(contentId) ?? [];
}

/** content_id → live count, for the roster/state counters that sum per pathway. */
export function repoQuestionCounts(): Map<string, number> {
  const out = new Map<string, number>();
  for (const [cid, qs] of current()) out.set(cid, qs.length);
  return out;
}

/** How many live questions the served copy holds — for the admin panel. */
export function repoQuestionTotal(): number {
  return remote ? remoteCount : (disk(), cachedCount);
}
