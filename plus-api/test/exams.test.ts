// آزمون مسیر — the whole road from a finished pathway to a certificate:
// the founder's form, who may sit it, the draw, grading (arithmetic for
// multiple choice, the model twice for free text), the supervised period,
// the founder's queue, and the certificate issued in the same act as the
// pass. Design: services/pathway-exams.ts.
import {
  describe, it, expect, beforeEach, afterEach, afterAll, vi,
} from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool, withTransaction } from '../src/db.js';
import { config } from '../src/config.js';
import { ai } from '../src/providers/registry.js';
import {
  getPathwayById, getPathways, isCertifiable, MIN_CERTIFICATE_STEPS,
  applyRemotePathways, resetRemotePathways,
} from '../src/pathways.js';
import {
  normalizeQuestions, upsertForm, getForm, deleteForm, formRoster, assignExam,
  publishForm, unpublishForm, announceOpenExams,
  addQuestion, appendQuestions, removeQuestion, nextQuestionId,
  examState, startAttempt, submitAttempt, ruleAttempt, queueRows, attemptRoster, getAttempt,
  drawQuestions, tally, setCertificateIntent, type ExamQuestion,
  addContentQuestion, removeContentQuestion, listContentQuestions, pathwaysContaining, normalizeContentId, poolFor,
} from '../src/services/pathway-exams.js';
import { issueCertificate, listCertificates } from '../src/services/certificates.js';
import { availableCredits } from '../src/services/discount-credits.js';
import { getCardsFor } from '../src/flashcards.js';
import { readFileSync } from 'node:fs';
import { mergeProfiles } from '../src/services/merge-profiles.js';
import { resetRateLimits } from '../src/services/rate-limit.js';

let app: FastifyInstance;
let cookie: string;
const phone = '09121200093';
const founderPhone = '09121200094';

const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

const PATHWAY = 'digital';
const STEPS = getPathwayById(PATHWAY)!.steps.map((s) => s.content_id);
const BUNDLE_ID = 'bundle-digital-core';

const MCQ = (n: number, correct = 1): ExamQuestion => ({
  id: `m${n}`, kind: 'mcq', prompt_fa: `سؤال تستی ${n}`, options: ['الف', 'ب', 'ج', 'د'], correct,
});
const FREE = (n: number): ExamQuestion => ({
  id: `f${n}`, kind: 'free', prompt_fa: `سؤال تشریحی ${n}`,
  key_points: [{ id: `f${n}-k1`, text: 'نکته اول' }, { id: `f${n}-k2`, text: 'نکته دوم' }, { id: `f${n}-k3`, text: 'نکته سوم' }],
});
const LONG = 'این یک پاسخ تشریحی است که به اندازهٔ کافی بلند است تا از حداقل طول عبور کند.';

const originalAlert = config.pathwayAlert.alertPhone;
const originalSupport = config.support.alertPhone;

beforeEach(async () => {
  await resetDb();
  resetRateLimits();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, phone);
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
  config.pathwayAlert.alertPhone = '';
  config.support.alertPhone = '';
});

afterEach(() => { vi.restoreAllMocks(); });

afterAll(async () => {
  config.pathwayAlert.alertPhone = originalAlert;
  config.support.alertPhone = originalSupport;
  await app?.close();
  await pool.end();
});

async function userId(p = phone): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [p]);
  return r.rows[0].id;
}

/** Finish the pathway: one article_completed row per step. */
async function finish(uid: string): Promise<void> {
  for (const cid of STEPS) {
    await pool.query(`insert into user_activity (user_id, action, content_id) values ($1, 'article_completed', $2)`, [uid, cid]);
  }
}

/**
 * A form plus the founder's «اعلام آمادگی» — which is what an exam a reader
 * can sit actually is since migration 0067. Every test below that is not
 * ABOUT publishing says so through this helper, so the gate is exercised on
 * every one of them rather than mocked away.
 */
async function openForm(pathwayId: string, input: Parameters<typeof upsertForm>[1]) {
  const r = await upsertForm(pathwayId, input);
  await publishForm(pathwayId);
  return r;
}

/** Press «شروع این مسیر». */
async function enroll(uid: string): Promise<void> {
  await pool.query(
    `insert into user_pathways (user_id, pathway_id, current_step) values ($1, $2, 0) on conflict do nothing`, [uid, PATHWAY],
  );
}

const adminPost = (url: string, body: unknown) => app.inject({
  method: 'POST', url, headers: { authorization: basic }, payload: body as object,
});
const adminGet = (url: string) => app.inject({ method: 'GET', url, headers: { authorization: basic } });
const get = (url: string, c = cookie) => app.inject({ method: 'GET', url, headers: { cookie: c } });
const post = (url: string, body: unknown, c = cookie) => app.inject({
  method: 'POST', url, headers: { cookie: c }, payload: body as object,
});

const agree = (points: { id: string }[], state: 'covered' | 'missing' = 'covered') =>
  vi.spyOn(ai, 'matchKeyPoints').mockImplementation(async ({ keyPoints }) =>
    keyPoints.map((k) => ({ id: k.id, state })));

async function notices(uid: string): Promise<{ kind: string; title: string; body: string }[]> {
  const r = await pool.query<{ kind: string; title: string; body: string }>(
    'select kind, title, body from notification_log where user_id = $1 order by id', [uid],
  );
  return r.rows;
}

/* ----------------------------------------------------------- the paste -- */

describe('normalizeQuestions — the founder\'s paste, leniently', () => {
  it('reads NotebookLM-ish keys: question/q, choices, a letter or the option text as the answer, bare-string key points', () => {
    const r = normalizeQuestions({
      questions: [
        { question: 'کدام؟', choices: ['یک', 'دو', 'سه', 'چهار'], answer: 'ب' },
        { q: 'چرا؟', type: 'تشریحی', points: ['نکته اول', 'نکته دوم'] },
        { text: 'کدام یک؟', options: [{ label: 'x' }, { label: 'y' }], correct: 'y' },
        { prompt: 'کدام‌یک؟', options: ['a', 'b', 'c'], correct: 'C.' },
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.questions.map((q) => q.id)).toEqual(['q1', 'q2', 'q3', 'q4']);
    expect(r.questions[0]).toMatchObject({ kind: 'mcq', correct: 1, options: ['یک', 'دو', 'سه', 'چهار'] });
    expect(r.questions[1]).toMatchObject({ kind: 'free', key_points: [{ id: 'q2-k1', text: 'نکته اول' }, { id: 'q2-k2', text: 'نکته دوم' }] });
    expect(r.questions[2]).toMatchObject({ kind: 'mcq', correct: 1, options: ['x', 'y'] });
    expect(r.questions[3]).toMatchObject({ kind: 'mcq', correct: 2 });
  });

  it('keeps our own shape verbatim, ids included', () => {
    const r = normalizeQuestions([MCQ(1), FREE(1)]);
    expect(r).toEqual({ ok: true, questions: [MCQ(1), FREE(1)] });
  });

  it('names the question it refuses', () => {
    const bad = (x: unknown) => { const r = normalizeQuestions(x); return r.ok ? '' : r.error; };
    expect(bad('x')).toContain('آرایه');
    expect(bad([])).toContain('دست‌کم');
    expect(bad([{ options: ['a', 'b'], correct: 0 }])).toContain('سؤال 1');
    expect(bad([MCQ(1), { q: 'x', options: ['فقط یکی'], correct: 0 }])).toContain('سؤال 2');
    expect(bad([{ q: 'x', options: ['a', 'b'], correct: 'z' }])).toContain('گزینهٔ درست');
    expect(bad([{ q: 'x', options: ['a', 'b'], correct: 5 }])).toContain('گزینهٔ درست');
    expect(bad([{ q: 'x', kind: 'free' }])).toContain('key_points');
    expect(bad([{ q: 'x', key_points: [] }])).toContain('نکتهٔ کلیدی');
    expect(bad([{ q: 'x' }])).toContain('نه گزینه');
  });

  it('de-duplicates a repeated id rather than refusing the paste', () => {
    const r = normalizeQuestions([{ id: 'a', q: 'x', options: ['1', '2'], correct: 0 }, { id: 'a', q: 'y', options: ['1', '2'], correct: 1 }]);
    expect(r.ok && r.questions.map((q) => q.id)).toEqual(['a', 'a-2']);
  });
});

/* --------------------------------------------------------------- forms -- */

describe('the form', () => {
  it('is created with the founder\'s defaults — 70%, two attempts, a week, five rulings — and upserts in place', async () => {
    const { form, created } = await openForm(PATHWAY, { questions: [MCQ(1), FREE(1)] });
    expect(created).toBe(true);
    expect(form).toMatchObject({ pass_percent: 70, max_attempts: 2, retry_days: 7, supervised_until: 5, draw: 15 });

    const again = await openForm(PATHWAY, { questions: [MCQ(1)], draw: 1, passPercent: 80, note: ' n ' });
    expect(again.created).toBe(false);
    expect(again.form.id).toBe(form.id);
    expect(again.form).toMatchObject({ pass_percent: 80, draw: 1, note: 'n' });
    expect(again.form.questions).toHaveLength(1);
  });

  it('takes the founder\'s prose straight, previews it first, and stores what was previewed', async () => {
    const paste = [
      '۱. در اسکن داخل‌دهانی، بیشترین سهم خطا از کدام است؟',
      'الف) رنگ اسکن‌بادی',
      'ب) طول مسیر اسکن ✓',
      'ج) ضخامت پودر',
      '',
      '۲. چرا trueness و precision یکی نیستند؟',
      'نکته‌ها:',
      '- خطای سیستماتیک در برابر تصادفی',
      '- نبودِ مرجع برای دهان واقعی',
    ].join('\n');

    // the dry run: what did it read?
    const pre = await adminPost('/admin/exam-forms/parse', { questions: paste });
    expect(pre.statusCode).toBe(200);
    expect(pre.json()).toMatchObject({ mcq_count: 1, free_count: 1 });
    const questions = pre.json().questions;
    expect(questions[0]).toMatchObject({ kind: 'mcq', correct: 1 });
    // the founder's own words, ZWNJ included — never re-typed
    expect(questions[0].prompt_fa).toBe('در اسکن داخل‌دهانی، بیشترین سهم خطا از کدام است؟');
    expect(questions[1].key_points).toHaveLength(2);

    // saving sends the REVIEWED array, and prose saved directly lands the same way
    const saved = await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions });
    expect(saved.json().form.questions).toEqual(questions);
    const direct = await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions: paste });
    expect(direct.json().form.questions).toEqual(questions);

    // and a paste it cannot read is refused by question number, writing nothing
    const bad = await adminPost('/admin/exam-forms/parse', { questions: '۱. کدام؟\nالف) یک\nب) دو' });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().message).toContain('سؤال 1');
    const badSave = await adminPost('/admin/exam-forms', { pathway_id: 'ceramics', questions: '۱. کدام؟\nالف) یک\nب) دو' });
    expect(badSave.statusCode).toBe(400);
    expect(await getForm('ceramics')).toBeNull();
  });

  it('refuses a bundle and a bad paste, writing nothing', async () => {
    await expect(upsertForm(BUNDLE_ID, { questions: [MCQ(1)] })).rejects.toThrow('unknown_pathway');
    await expect(upsertForm(PATHWAY, { questions: [{ q: 'x' }] })).rejects.toThrow(/^invalid_questions:/);
    expect(await getForm(PATHWAY)).toBeNull();
  });

  it('is listed with its counts, and the panel route round-trips the founder\'s numbers', async () => {
    const res = await adminPost('/admin/exam-forms', {
      pathway_id: PATHWAY, questions: [MCQ(1), MCQ(2), FREE(1)], draw: 1, retry_days: 0, supervised_until: 0,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().form.questions).toHaveLength(3);

    const list = await adminGet('/admin/exam-forms');
    expect(list.json().forms).toHaveLength(1);
    expect(list.json().forms[0]).toMatchObject({
      pathway_id: PATHWAY, mcq_count: 2, free_count: 1, draw: 1, rulings: 0, retry_days: 0,
      attempts: { open: 0, queued: 0, passed: 0, failed: 0 },
    });
    const roster = await formRoster();
    expect(roster[0].title_fa).toBe(getPathwayById(PATHWAY)!.title_fa);

    const bad = await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions: [{ q: 'x' }] });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().message).toContain('سؤال 1');

    const one = await adminGet(`/admin/exam-forms/${PATHWAY}`);
    expect(one.json().form.questions[0].correct).toBe(1); // the founder sees the key

    expect((await adminPost('/admin/exam-forms/delete', { pathway_id: PATHWAY })).json().deleted).toBe(true);
    expect(await getForm(PATHWAY)).toBeNull();
  });
});

/* ------------------------------------------------------- the builder -- */

describe('the paste box is a question BANK — a batch adds, never replaces', () => {
  const BATCH_1 = '۱. اول؟\nالف) یک ✓\nب) دو\n\n۲. دوم؟\nالف) یک\nب) دو ✓';
  const BATCH_2 = '۱. سوم؟\nالف) یک ✓\nب) دو\n\n۲. چرا؟\nنکته‌ها:\n- اول\n- دوم';

  it('a second batch lands beside the first, with ids the pool does not hold', async () => {
    const one = await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions: BATCH_1, mode: 'append' });
    expect(one.json()).toMatchObject({ mode: 'append', created: true, added: 2, skipped: 0 });
    // both batches were parsed as q1, q2 — the bank must not trust that
    const two = await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions: BATCH_2, mode: 'append' });
    expect(two.json()).toMatchObject({ created: false, added: 2, skipped: 0 });
    const qs = (await getForm(PATHWAY))!.questions;
    expect(qs.map((q) => q.prompt_fa)).toEqual(['اول؟', 'دوم؟', 'سوم؟', 'چرا؟']);
    expect(qs.map((q) => q.id)).toEqual(['q1', 'q2', 'q3', 'q4']);
    const free = qs[3];
    expect(free.kind === 'free' && free.key_points.map((k) => k.id)).toEqual(['q4-k1', 'q4-k2']);
  });

  it('the same batch pasted twice does not double, and the settings stay the founder\'s', async () => {
    await openForm(PATHWAY, { questions: [MCQ(1)], passPercent: 85, draw: 4, note: 'دست‌ساز' });
    const r1 = await appendQuestions(PATHWAY, { questions: BATCH_1, passPercent: 70, draw: 15 });
    expect(r1.added.map((q) => q.id)).toEqual(['q2', 'q3']); // after m1
    const r2 = await appendQuestions(PATHWAY, { questions: BATCH_1 + '\n\n۳. تازه؟\nالف) یک\nب) دو ✓' });
    expect(r2).toMatchObject({ skipped: 2 });
    expect(r2.added.map((q) => q.prompt_fa)).toEqual(['تازه؟']);
    expect(r2.form).toMatchObject({ pass_percent: 85, draw: 4, note: 'دست‌ساز', published_at: expect.any(Date) });
    expect(r2.form.questions).toHaveLength(4);
    // a batch that is ALL repeats writes nothing and says so
    const r3 = await appendQuestions(PATHWAY, { questions: BATCH_1 });
    expect(r3).toMatchObject({ added: [], skipped: 2 });
    expect(r3.form.questions).toHaveLength(4);
  });

  it('a ZWNJ is not a space — «اسکن‌شده» and «اسکن شده» are two different prompts', async () => {
    await appendQuestions(PATHWAY, { questions: [{ question: 'اسکن‌شده؟', options: ['الف', 'ب'], correct: 0 }] });
    const r = await appendQuestions(PATHWAY, { questions: [{ question: 'اسکن شده؟', options: ['الف', 'ب'], correct: 0 }] });
    expect(r).toMatchObject({ skipped: 0 });
    expect(r.added).toHaveLength(1);
  });

  it('«ویرایش» still replaces, and a bad batch writes nothing', async () => {
    await appendQuestions(PATHWAY, { questions: BATCH_1 });
    const bad = await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions: '۱. کدام؟\nالف) یک\nب) دو', mode: 'append' });
    expect(bad.statusCode).toBe(400);
    expect((await getForm(PATHWAY))!.questions).toHaveLength(2);
    const edited = await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions: [MCQ(9)], mode: 'replace' });
    expect(edited.json().form.questions).toHaveLength(1);
    await expect(appendQuestions(BUNDLE_ID, { questions: BATCH_1 })).rejects.toThrow('unknown_pathway');
  });
});

describe('the question builder — one written question at a time', () => {
  it('creates the form on the first question, with the founder\'s own defaults', async () => {
    const r = await addQuestion(PATHWAY, { kind: 'mcq', prompt_fa: 'کدام؟', options: ['الف', 'ب', 'ج'], correct: 2 });
    expect(r.created).toBe(true);
    expect(r.form).toMatchObject({ pass_percent: 70, max_attempts: 2, retry_days: 7, supervised_until: 5, draw: 15 });
    expect(r.question).toMatchObject({ id: 'q1', kind: 'mcq', correct: 2 });
    expect((await getForm(PATHWAY))!.questions).toHaveLength(1);
  });

  it('appends without touching the form\'s own settings', async () => {
    await openForm(PATHWAY, { questions: [MCQ(1)], passPercent: 85, draw: 4, retryDays: 0, supervisedUntil: 0, note: 'دست‌ساز' });
    const r = await addQuestion(PATHWAY, { kind: 'free', prompt_fa: 'چرا؟', key_points: ['اول', 'دوم'] });
    expect(r.created).toBe(false);
    // the thing upsertForm would have reset:
    expect(r.form).toMatchObject({ pass_percent: 85, draw: 4, retry_days: 0, supervised_until: 0, note: 'دست‌ساز' });
    expect(r.form.questions).toHaveLength(2);
    expect(r.form.questions[0].id).toBe('m1'); // the existing question keeps its id
  });

  it('mints an id nothing holds, stamps the key points under it, and never renumbers', async () => {
    await addQuestion(PATHWAY, { kind: 'mcq', prompt_fa: 'یک؟', options: ['الف', 'ب'], correct: 0 });
    await addQuestion(PATHWAY, { kind: 'mcq', prompt_fa: 'دو؟', options: ['الف', 'ب'], correct: 1 });
    expect(await removeQuestion(PATHWAY, 'q1')).toEqual({ removed: true, remaining: 1 });

    const third = await addQuestion(PATHWAY, { kind: 'free', prompt_fa: 'سه؟', key_points: ['الف', 'ب'] });
    expect(third.question.id).toBe('q3'); // never q1 again, never renumbering q2
    expect((third.question as { key_points: { id: string }[] }).key_points.map((k) => k.id)).toEqual(['q3-k1', 'q3-k2']);
    expect(third.form.questions.map((q) => q.id)).toEqual(['q2', 'q3']);

    expect(nextQuestionId([])).toBe('q1');
    expect(nextQuestionId([{ id: 'q9', kind: 'mcq', prompt_fa: 'x', options: ['a', 'b'], correct: 0 }])).toBe('q10');
  });

  it('refuses a question that cannot be graded, and writes nothing', async () => {
    await expect(addQuestion(PATHWAY, { kind: 'mcq', prompt_fa: 'کدام؟', options: ['تنها گزینه'], correct: 0 }))
      .rejects.toThrow(/^invalid_questions:/);
    await expect(addQuestion(PATHWAY, { kind: 'mcq', prompt_fa: '  ', options: ['الف', 'ب'], correct: 0 }))
      .rejects.toThrow(/^invalid_questions:/);
    await expect(addQuestion(PATHWAY, { kind: 'free', prompt_fa: 'چرا؟', key_points: [] }))
      .rejects.toThrow(/^invalid_questions:/);
    await expect(addQuestion(BUNDLE_ID, { kind: 'mcq', prompt_fa: 'x', options: ['a', 'b'], correct: 0 }))
      .rejects.toThrow('unknown_pathway');
    expect(await getForm(PATHWAY)).toBeNull();
  });

  it('deleting a question leaves an attempt that is already open exactly as it was', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1), MCQ(2)] });
    await assignExam(uid, PATHWAY);
    const started = await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    expect(started.ok && started.attempt.questions).toHaveLength(2);

    expect((await removeQuestion(PATHWAY, 'm2')).remaining).toBe(1);
    const open = (await examState(uid, PATHWAY)).open!;
    expect(open.questions).toHaveLength(2); // the snapshot is its own copy
    const graded = await submitAttempt(uid, PATHWAY, { m1: 1, m2: 1 });
    expect(graded.ok && graded.attempt.mcq_total).toBe(2);
  });

  it('the panel routes append, list and delete — and a question that is not there is a 404', async () => {
    const add = await adminPost('/admin/exam-forms/questions', {
      pathway_id: PATHWAY,
      question: { kind: 'mcq', prompt_fa: 'کدام گزینه؟', options: ['الف', 'ب', 'ج', 'د'], correct: 1 },
    });
    expect(add.statusCode).toBe(200);
    expect(add.json()).toMatchObject({ created: true, count: 1 });
    expect(add.json().question.id).toBe('q1');

    const free = await adminPost('/admin/exam-forms/questions', {
      pathway_id: PATHWAY, question: { kind: 'free', prompt_fa: 'چرا؟', key_points: ['اول', 'دوم', 'سوم'] },
    });
    expect(free.json()).toMatchObject({ created: false, count: 2 });

    const listed = await adminGet(`/admin/exam-forms/${PATHWAY}`);
    expect(listed.json().form.questions.map((q: { id: string }) => q.id)).toEqual(['q1', 'q2']);

    const gone = await adminPost('/admin/exam-forms/questions/delete', { pathway_id: PATHWAY, question_id: 'q1' });
    expect(gone.json()).toMatchObject({ removed: true, remaining: 1 });
    const again = await adminPost('/admin/exam-forms/questions/delete', { pathway_id: PATHWAY, question_id: 'q1' });
    expect(again.statusCode).toBe(404);

    const bad = await adminPost('/admin/exam-forms/questions', {
      pathway_id: PATHWAY, question: { kind: 'mcq', prompt_fa: 'کدام؟', options: ['فقط یکی'], correct: 0 },
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error).toBe('invalid_questions');
  });
});

/* --------------------------------------------------------- eligibility -- */

describe('who may sit it', () => {
  it('no form → no_form; a form but neither finished nor assigned → locked; assigned → enrolled + ready', async () => {
    const uid = await userId();
    expect((await examState(uid, PATHWAY)).state).toBe('no_form');

    await openForm(PATHWAY, { questions: [MCQ(1)] });
    const locked = await examState(uid, PATHWAY);
    expect(locked.state).toBe('locked');
    expect(locked.rules).toMatchObject({ question_count: 1, mcq_count: 1, free_count: 0, pass_percent: 70 });
    expect(locked.is_complete).toBe(false);
    expect(locked.enrolled).toBe(false);

    // letting somebody in puts them on the pathway too
    await assignExam(uid, PATHWAY);
    const s = await examState(uid, PATHWAY);
    expect(s.state).toBe('ready');
    expect(s.enrolled).toBe(true);
    const up = await pool.query('select count(*)::int as n from user_pathways where user_id = $1 and pathway_id = $2', [uid, PATHWAY]);
    expect(up.rows[0].n).toBe(1);
  });

  it('finishing the pathway is the other door — but only for a reader who pressed «شروع این مسیر»', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await finish(uid);
    const before = await examState(uid, PATHWAY);
    expect(before.state).toBe('locked');
    expect(before.is_complete).toBe(true);
    expect(before.enrolled).toBe(false);

    await enroll(uid);
    const s = await examState(uid, PATHWAY);
    expect(s.state).toBe('ready');
    expect(s.enrolled).toBe(true);
    expect(s.assigned).toBe(false);
    expect((await startAttempt(uid, PATHWAY, 'مهسا رضایی')).ok).toBe(true);
  });

  it('a «بله» from a reader nowhere near the end still reaches the founder, and says whether the exam is OPEN', async () => {
    const uid = await userId();
    await loginAs(app, founderPhone);
    config.support.alertPhone = founderPhone;
    const fid = await userId(founderPhone);
    // One step of nineteen: runPathwayAlerts has nothing to say about them,
    // which is exactly the case that used to be announced to nobody.
    await pool.query(
      `insert into user_activity (user_id, action, content_id) values ($1, 'article_completed', $2)`, [uid, STEPS[0]],
    );

    expect((await post(`/exams/${PATHWAY}/intent`, { intent: 'wanted' })).statusCode).toBe(200);
    const notes = await notices(fid);
    expect(notes).toHaveLength(1);
    expect(notes[0].title).toContain('گواهی‌نامه می‌خواهد');
    expect(notes[0].body).toContain('هنوز باز نشده');

    // The same wish, said again or taken back and repeated, is one wish.
    await post(`/exams/${PATHWAY}/intent`, { intent: 'declined' });
    await post(`/exams/${PATHWAY}/intent`, { intent: 'wanted' });
    expect(await notices(fid)).toHaveLength(1);
  });

  it('a wish for a pathway whose exam is already OPEN says there is nothing to do', async () => {
    const uid = await userId();
    await loginAs(app, founderPhone);
    config.support.alertPhone = founderPhone;
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await pool.query(
      `insert into user_activity (user_id, action, content_id) values ($1, 'article_completed', $2)`, [uid, STEPS[0]],
    );

    await post(`/exams/${PATHWAY}/intent`, { intent: 'wanted' });
    const notes = await notices(await userId(founderPhone));
    expect(notes).toHaveLength(1);
    expect(notes[0].body).toContain('باز است');
  });

  it('the founder wishing on their own account pings nobody', async () => {
    config.support.alertPhone = phone;
    const uid = await userId();
    await post(`/exams/${PATHWAY}/intent`, { intent: 'wanted' });
    expect(await notices(uid)).toHaveLength(0);
  });

  it('writing the form tells NOBODY — «اعلام آمادگی» tells whoever can actually sit it', async () => {
    const ready = await userId();                       // asked + finished the pathway
    await finish(ready); await enroll(ready);
    await setCertificateIntent(ready, PATHWAY, 'wanted');

    await loginAs(app, '09121200095');
    const reading = await userId('09121200095');         // asked, still reading
    await setCertificateIntent(reading, PATHWAY, 'wanted');

    await loginAs(app, '09121200096');
    const assignee = await userId('09121200096');        // let in by hand, reads nothing
    await assignExam(assignee, PATHWAY);

    await loginAs(app, '09121200097');
    const declined = await userId('09121200097');        // «فعلاً نه» is not a subscription
    await setCertificateIntent(declined, PATHWAY, 'declined');

    // Saving questions is not an announcement — and the reader sees nothing.
    const saved = await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions: [MCQ(1)] });
    expect(saved.json()).toMatchObject({ ok: true, created: true, published: false });
    for (const uid of [ready, reading, assignee, declined]) expect(await notices(uid)).toHaveLength(0);
    expect((await examState(ready, PATHWAY)).state).toBe('no_form');

    // The press. Only the two who can sit it are told; the one still reading
    // is counted as waiting and told by the nightly sweep instead.
    const opened = await adminPost('/admin/exam-forms/publish', { pathway_id: PATHWAY });
    expect(opened.json()).toMatchObject({ ok: true, already: false, told: 2, waiting: 1 });
    for (const uid of [ready, assignee]) {
      const told = (await notices(uid)).filter((n) => n.title.includes('باز شد'));
      expect(told).toHaveLength(1);
      expect(told[0].kind).toBe('exam_assigned');
    }
    expect(await notices(reading)).toHaveLength(0);
    expect(await notices(declined)).toHaveLength(0);
    expect((await examState(ready, PATHWAY)).state).toBe('ready');

    // Pressing again, or adding a question, tells nobody a second time.
    const again = await adminPost('/admin/exam-forms/publish', { pathway_id: PATHWAY });
    expect(again.json()).toMatchObject({ already: true, told: 0 });
    expect(await notices(ready)).toHaveLength(1);
  });

  it('the one still reading is told the night they reach the end — once, ever', async () => {
    const uid = await userId();
    await enroll(uid);
    await setCertificateIntent(uid, PATHWAY, 'wanted');
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    expect(await notices(uid)).toHaveLength(0);          // nothing yet: still reading

    // The sweep finds nobody while a step is missing…
    expect((await announceOpenExams()).told).toHaveLength(0);
    await finish(uid);
    // …and finds them the first night after they finish.
    const run = await announceOpenExams();
    expect(run.told).toEqual([{ user_id: uid, pathway_id: PATHWAY }]);
    const n = await notices(uid);
    expect(n).toHaveLength(1);
    expect(n[0].body).toContain('تمام کرده‌ای');

    // Every later night is silent — the marker is a high-water mark, so a
    // pathway that GROWS under them (progress goes backwards) never
    // re-announces.
    expect((await announceOpenExams()).told).toHaveLength(0);
    expect(await notices(uid)).toHaveLength(1);
  });

  it('a lapsed subscriber is told too — and, having finished, may simply sit it', async () => {
    const uid = await userId();
    await finish(uid); await enroll(uid);
    await setCertificateIntent(uid, PATHWAY, 'wanted');
    await pool.query(`update profiles set tier = 'free' where id = $1`, [uid]);
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    expect((await announceOpenExams()).told).toHaveLength(1);
    const n = await notices(uid);
    expect(n).toHaveLength(1);
    expect(n[0].body).toContain('هر وقت خواستی شروع کن');
    expect(n[0].body).not.toContain('اشتراک');
    expect((await get(`/exams/${PATHWAY}`)).json()).toMatchObject({ ok: true, state: 'ready' });
  });

  it('«گواهی می‌خواهی؟» — the answer enrols, is reversible, and a «بله» from somebody near the end reaches the founder at once', async () => {
    const uid = await userId();
    await loginAs(app, founderPhone);
    config.support.alertPhone = founderPhone;
    await finish(uid);

    const yes = await post(`/exams/${PATHWAY}/intent`, { intent: 'wanted' });
    expect(yes.statusCode).toBe(200);
    expect(yes.json()).toMatchObject({ enrolled: true, certificate_intent: 'wanted', state: 'no_form' });
    const founderNotes = await notices(await userId(founderPhone));
    expect(founderNotes).toHaveLength(1);
    expect(founderNotes[0].title).toContain('تمام کرد');

    // the nightly sweep has nothing new to say about them
    const again = await adminPost('/admin/pathways/run-alerts', {});
    expect(again.json().crossings).toHaveLength(0);

    const no = await post(`/exams/${PATHWAY}/intent`, { intent: 'declined' });
    expect(no.json().certificate_intent).toBe('declined');
    expect((await get('/me')).json().active_pathway).toMatchObject({ id: PATHWAY, certificate_intent: 'declined' });
    expect((await post(`/exams/${PATHWAY}/intent`, { intent: 'maybe' })).statusCode).toBe(400);
    expect((await post(`/exams/${BUNDLE_ID}/intent`, { intent: 'wanted' })).statusCode).toBe(404);
  });

  it('starting the exam answers the question by itself', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(uid, PATHWAY);
    expect((await examState(uid, PATHWAY)).certificate_intent).toBeNull();
    await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    expect((await examState(uid, PATHWAY)).certificate_intent).toBe('wanted');
  });

  it('the wall reads the same rule', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await finish(uid);
    expect((await get('/certificates')).json().pathways.find((p: { id: string }) => p.id === PATHWAY).exam.state).toBe('locked');
    await enroll(uid);
    expect((await get('/certificates')).json().pathways.find((p: { id: string }) => p.id === PATHWAY).exam.state).toBe('ready');
  });

  it('tells a reader let in early when the exam OPENS — and only then, once', async () => {
    const uid = await userId();
    const early = await adminPost('/admin/exams', { phone, pathway_id: PATHWAY });
    expect(early.json().exam_open).toBe(false);
    expect(await notices(uid)).toHaveLength(0); // nothing to sit yet — no notice

    await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions: [MCQ(1)] });
    expect(await notices(uid)).toHaveLength(0); // a draft is still nothing to sit
    expect((await adminPost('/admin/exam-forms/publish', { pathway_id: PATHWAY })).json().told).toBe(1);
    const n = await notices(uid);
    expect(n).toHaveLength(1);
    expect(n[0].kind).toBe('exam_assigned');
    expect(n[0].body).toContain(getPathwayById(PATHWAY)!.title_fa);

    // editing the form is not news; assigning AFTER it is open is, once
    const edited = await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions: [MCQ(1), MCQ(2)] });
    expect(edited.json().published).toBe(true);
    await loginAs(app, '09121200097');
    const late = await adminPost('/admin/exams', { phone: '09121200097', pathway_id: PATHWAY });
    expect(late.json().exam_open).toBe(true);
    expect(await notices(await userId('09121200097'))).toHaveLength(1);
    expect(await notices(uid)).toHaveLength(1);
  });

  it('a draft is invisible, an un-publish closes the door, and an attempt in flight survives it', async () => {
    const uid = await userId();
    await finish(uid); await enroll(uid);
    await upsertForm(PATHWAY, { questions: [MCQ(1), MCQ(2)] });
    // A form with questions, unpublished: the reader sees what they saw
    // before any question existed — no rules, nothing to start.
    const draft = await examState(uid, PATHWAY);
    expect(draft).toMatchObject({ state: 'no_form', rules: null });
    expect((await startAttempt(uid, PATHWAY, 'مهسا رضایی')).ok).toBe(false);

    await publishForm(PATHWAY);
    expect((await examState(uid, PATHWAY)).state).toBe('ready');
    expect((await startAttempt(uid, PATHWAY, 'مهسا رضایی')).ok).toBe(true);

    // Closing it stops NEW attempts only: the open one keeps its own snapshot
    // and is still submittable.
    expect(await unpublishForm(PATHWAY)).toBe(true);
    expect((await examState(uid, PATHWAY)).state).toBe('open');
    expect((await post(`/exams/${PATHWAY}/submit`, { answers: { m1: 1, m2: 1 } })).statusCode).toBe(200);
  });

  it('publishing refuses a pathway with no form and a pool that is empty', async () => {
    const empty = await adminPost('/admin/exam-forms/publish', { pathway_id: PATHWAY });
    expect(empty.statusCode).toBe(400);
    expect(empty.json().error).toBe('no_form');
    expect((await adminPost('/admin/exam-forms/publish', { pathway_id: BUNDLE_ID })).statusCode).toBe(400);
  });

  it('is premium: 401 signed out, 402 free, and a bundle is 404', async () => {
    expect((await app.inject({ method: 'GET', url: `/exams/${PATHWAY}` })).statusCode).toBe(401);
    await pool.query(`update profiles set tier = 'free' where phone = $1`, [phone]);
    expect((await get(`/exams/${PATHWAY}`)).statusCode).toBe(402);
    await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
    expect((await get(`/exams/${BUNDLE_ID}`)).statusCode).toBe(404);
    expect((await get(`/exams/${PATHWAY}`)).json()).toMatchObject({ ok: true, state: 'no_form' });
  });

  it('a pathway open to everybody (`premium: false`) opens its exam to a free reader too', async () => {
    const raw = JSON.parse(JSON.stringify(getPathways())) as { id: string; premium: boolean }[];
    raw.find((x) => x.id === PATHWAY)!.premium = false;
    expect(applyRemotePathways(raw)).toBe(true);
    try {
      await pool.query(`update profiles set tier = 'free' where phone = $1`, [phone]);
      expect((await get(`/exams/${PATHWAY}`)).json()).toMatchObject({ ok: true, state: 'no_form' });
      expect((await post(`/exams/${PATHWAY}/intent`, { intent: 'wanted' })).statusCode).toBe(200);
      // Every other pathway keeps its gate.
      const other = getPathways().find((p) => p.id !== PATHWAY && p.kind !== 'bundle')!.id;
      expect((await get(`/exams/${other}`)).statusCode).toBe(402);
    } finally {
      resetRemotePathways();
    }
  });

  it('a certificate already held (issued by hand) reads as passed', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await issueCertificate(uid, PATHWAY, { holderName: 'مهسا رضایی', notify: false });
    const s = await examState(uid, PATHWAY);
    expect(s.state).toBe('passed');
    expect(s.certificate!.verify_url).toMatch(/^\/plus\/certificate\.html\?c=DC-/);
  });
});

/* ------------------------------------------------------------ the draw -- */

/*
 * A reader WITHOUT a subscription on a premium pathway (founder, 1405/07/03):
 * the pathway page stays theirs to open only with a subscription, but the exam
 * opens once they have FINISHED it with their own reading — «we guarantee
 * that whoever read it all can earn it, not that everybody will».
 */
describe('a reader without a subscription', () => {
  const free = () => pool.query(`update profiles set tier = 'free' where phone = $1`, [phone]);
  const sit = async () => {
    const st = await post(`/exams/${PATHWAY}/start`, { holder_first_name: 'مهسا', holder_last_name: 'رضایی' });
    expect(st.statusCode).toBe(200);
    return st.json().open.questions.map((q: { id: string }) => q.id) as string[];
  };

  it('has not finished: every exam door is the premium 402, saying which door it is', async () => {
    await free();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    const uid = await userId();
    for (const cid of STEPS.slice(0, -1)) {
      await pool.query(`insert into user_activity (user_id, action, content_id) values ($1, 'article_completed', $2)`, [uid, cid]);
    }
    const g = await get(`/exams/${PATHWAY}`);
    expect(g.statusCode).toBe(402);
    expect(g.json()).toMatchObject({ error: 'premium_required', reason: 'incomplete' });
    expect((await post(`/exams/${PATHWAY}/intent`, { intent: 'wanted' })).statusCode).toBe(402);
    expect((await post(`/exams/${PATHWAY}/start`, { holder_first_name: 'مهسا', holder_last_name: 'رضایی' })).statusCode).toBe(402);
    // Nothing was written on their behalf.
    expect((await pool.query('select 1 from user_pathways where user_id = $1', [uid])).rowCount).toBe(0);
  });

  it('has finished: enrolled by finishing, sits, passes, holds a certificate and ٪۱۰ — the pathway page stays locked', async () => {
    await free();
    await openForm(PATHWAY, { questions: [MCQ(1), MCQ(2)] });
    const uid = await userId();
    await finish(uid);
    expect((await get(`/pathways/${PATHWAY}`)).statusCode).toBe(402);

    const s = (await get(`/exams/${PATHWAY}`)).json();
    expect(s).toMatchObject({ ok: true, state: 'ready', enrolled: true, is_complete: true });
    const ids = await sit();
    const done = await post(`/exams/${PATHWAY}/submit`, { answers: Object.fromEntries(ids.map((id) => [id, 1])) });
    expect(done.json()).toMatchObject({ state: 'passed' });
    expect(done.json().certificate.verify_code).toMatch(/^DC-/);
    const credits = await availableCredits(uid);
    expect(credits.find((c) => c.kind === 'grant')?.percent).toBe(10);
    expect((await get(`/pathways/${PATHWAY}`)).statusCode).toBe(402);
  });

  it('a pathway that GROWS mid-attempt never strands the attempt, and a pass stays readable', async () => {
    await free();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await finish(await userId());
    const ids = await sit();
    const raw = JSON.parse(JSON.stringify(getPathways())) as { id: string; steps: { content_id: string }[] }[];
    const extra = raw.find((x) => x.id !== PATHWAY && x.steps.length)!.steps
      .find((st) => !STEPS.includes(st.content_id))!;
    raw.find((x) => x.id === PATHWAY)!.steps.push(extra);
    expect(applyRemotePathways(raw)).toBe(true);
    try {
      expect((await get(`/exams/${PATHWAY}`)).json().state).toBe('open');
      const done = await post(`/exams/${PATHWAY}/submit`, { answers: { [ids[0]]: 1 } });
      expect(done.json().state).toBe('passed');
      expect((await get(`/exams/${PATHWAY}`)).json().state).toBe('passed');
    } finally {
      resetRemotePathways();
    }
  });

  it('let in early by the founder: through the door without finishing', async () => {
    await free();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(await userId(), PATHWAY);
    expect((await get(`/exams/${PATHWAY}`)).json()).toMatchObject({ ok: true, state: 'ready', assigned: true });
  });

  it('a subscriber is untouched, and the pathway open to everybody still needs no finishing', async () => {
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    expect((await get(`/exams/${PATHWAY}`)).json()).toMatchObject({ ok: true, state: 'locked' });
    await free();
    const raw = JSON.parse(JSON.stringify(getPathways())) as { id: string; premium: boolean }[];
    raw.find((x) => x.id === PATHWAY)!.premium = false;
    expect(applyRemotePathways(raw)).toBe(true);
    try {
      expect((await get(`/exams/${PATHWAY}`)).json()).toMatchObject({ ok: true, state: 'locked', enrolled: false });
    } finally {
      resetRemotePathways();
    }
  });
});

describe('the draw', () => {
  it('takes the whole pool at 0, n otherwise, and prefers questions the reader has not seen', () => {
    const pool_ = [MCQ(1), MCQ(2), MCQ(3), MCQ(4)];
    expect(drawQuestions(pool_, 0, new Set())).toHaveLength(4);
    const first = drawQuestions(pool_, 2, new Set());
    expect(first).toHaveLength(2);
    const second = drawQuestions(pool_, 2, new Set(first.map((q) => q.id)));
    expect(second.map((q) => q.id).sort()).toEqual(pool_.filter((q) => !first.includes(q)).map((q) => q.id).sort());
    // pool smaller than the draw: everything, once
    expect(drawQuestions(pool_, 9, new Set(['m1']))).toHaveLength(4);
  });

  it('starting opens an attempt with the key stripped, and a second start hands back the same attempt', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1), MCQ(2), MCQ(3), FREE(1), FREE(2)], draw: 3 });
    await assignExam(uid, PATHWAY);

    const locked = await post(`/exams/${PATHWAY}/start`, { holder_name: '   ' });
    expect(locked.statusCode).toBe(400);

    const r = await post(`/exams/${PATHWAY}/start`, { holder_name: 'دکتر مهسا رضایی' });
    expect(r.statusCode).toBe(200);
    const s = r.json();
    expect(s.state).toBe('open');
    expect(s.open.holder_name).toBe('دکتر مهسا رضایی');
    expect(s.open.reference).toMatch(/^E-[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    expect(s.open.questions).toHaveLength(3);
    for (const q of s.open.questions) {
      expect(q).not.toHaveProperty('correct');
      expect(q).not.toHaveProperty('key_points');
      if (q.kind === 'free') expect(q.point_count).toBe(3);
      else expect(q.options).toHaveLength(4);
    }
    expect(JSON.stringify(s)).not.toContain('نکته اول');

    const again = await post(`/exams/${PATHWAY}/start`, { holder_name: 'کس دیگر' });
    expect(again.statusCode).toBe(409);
    expect(again.json().open.reference).toBe(s.open.reference);
    expect(again.json().open.holder_name).toBe('دکتر مهسا رضایی');
    expect(await attemptRoster()).toHaveLength(1);
  });

  it('refuses to start when locked', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    const r = await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    expect(r.ok).toBe(false);
    expect(r.state.state).toBe('locked');
  });
});

/* --------------------------------------------------------- submitting -- */

describe('submitting', () => {
  it('refuses an incomplete sheet by question id and keeps the attempt open', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1), FREE(1)] });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'مهسا رضایی');

    const r = await post(`/exams/${PATHWAY}/submit`, { answers: { m1: 1, f1: 'کوتاه' } });
    expect(r.statusCode).toBe(400);
    expect(r.json()).toMatchObject({ error: 'incomplete', missing: ['f1'] });
    const r2 = await post(`/exams/${PATHWAY}/submit`, { answers: { m1: 9, f1: LONG } });
    expect(r2.json().missing).toEqual(['m1']);
    expect((await examState(uid, PATHWAY)).state).toBe('open');
  });

  it('with no open attempt is 409', async () => {
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    const r = await post(`/exams/${PATHWAY}/submit`, { answers: {} });
    expect(r.statusCode).toBe(409);
    expect(r.json().error).toBe('no_open_attempt');
  });

  it('multiple choice settles on its own: a pass issues the certificate, the credit and the notice in one act', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1), MCQ(2), MCQ(3)] }); // 2/3 = 67 < 70 fails; 3/3 passes
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'دکتر نگار حسینی');

    const r = await post(`/exams/${PATHWAY}/submit`, { answers: { m1: 1, m2: '1', m3: 1 } });
    expect(r.statusCode).toBe(200);
    const s = r.json();
    expect(s.state).toBe('passed');
    expect(s.history).toHaveLength(1);
    expect(s.history[0]).toMatchObject({
      status: 'passed', passed: true, mcq_correct: 3, mcq_total: 3, mcq_percent: 100, free_total: 0, free_percent: null,
    });
    const byId = (xs: { id: string }[]) => xs.slice().sort((a, b) => a.id.localeCompare(b.id));
    expect(byId(s.history[0].per_question)).toEqual([
      { id: 'm1', kind: 'mcq', correct: true }, { id: 'm2', kind: 'mcq', correct: true }, { id: 'm3', kind: 'mcq', correct: true },
    ]);
    expect(s.certificate.verify_code).toMatch(/^DC-/);

    const certs = await listCertificates(uid);
    expect(certs).toHaveLength(1);
    expect(certs[0].holder_name).toBe('دکتر نگار حسینی');
    expect(certs[0].attempt_id).toBe(s.history[0].id);
    expect((await availableCredits(uid)).find((c) => c.kind === 'grant')?.percent).toBe(10);

    const n = await notices(uid);
    expect(n.map((x) => x.kind)).toEqual(['exam_result']); // one message, not the certificate's too
    expect(n[0].body).toContain(certs[0].verify_code);
    expect(n[0].body).toContain('دکتر نگار حسینی');

    const row = (await attemptRoster())[0];
    expect(row).toMatchObject({ status: 'passed', settled_by: 'ai', attempt_no: 1 });
  });

  it('a fail below 70% waits a week, a second attempt draws the unseen questions, and the third is refused', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1), MCQ(2), MCQ(3), MCQ(4)], draw: 2 });
    await assignExam(uid, PATHWAY);
    const first = await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    const drawn1 = first.ok ? first.attempt.questions.map((q) => q.id) : [];
    const wrong = Object.fromEntries(drawn1.map((id) => [id, 0]));

    const r = await post(`/exams/${PATHWAY}/submit`, { answers: wrong });
    expect(r.json().state).toBe('wait');
    expect(r.json().history[0]).toMatchObject({ status: 'failed', passed: false, mcq_correct: 0, mcq_total: 2, mcq_percent: 0 });
    const retryAt = new Date(r.json().retry_at).getTime();
    expect(retryAt - Date.now()).toBeGreaterThan(6.9 * 86_400_000);
    expect(retryAt - Date.now()).toBeLessThan(7.1 * 86_400_000);
    expect((await notices(uid)).map((x) => x.kind)).toEqual(['exam_result']);
    expect((await notices(uid))[0].body).toContain('به حد نصاب نرسید');

    const tooSoon = await post(`/exams/${PATHWAY}/start`, { holder_name: 'مهسا رضایی' });
    expect(tooSoon.statusCode).toBe(409);
    expect(tooSoon.json().state).toBe('wait');

    // a week later
    await pool.query(`update pathway_exam_attempts set submitted_at = submitted_at - interval '8 days'`);
    expect((await examState(uid, PATHWAY)).state).toBe('ready');
    const second = await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    expect(second.ok).toBe(true);
    const drawn2 = second.ok ? second.attempt.questions.map((q) => q.id) : [];
    expect(second.ok && second.attempt.attempt_no).toBe(2);
    expect(drawn2.some((id) => drawn1.includes(id))).toBe(false);

    const r2 = await post(`/exams/${PATHWAY}/submit`, { answers: Object.fromEntries(drawn2.map((id) => [id, 0])) });
    expect(r2.json().state).toBe('exhausted');
    expect(r2.json().attempts_used).toBe(2);
    expect((await examState(uid, PATHWAY)).state).toBe('exhausted');
  });

  it('does not depend on the mix — an all-multiple-choice pool goes end to end', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1), MCQ(2), MCQ(3), MCQ(4)] });
    await assignExam(uid, PATHWAY);
    const s = await examState(uid, PATHWAY);
    expect(s.rules).toMatchObject({ question_count: 4, mcq_count: 4, free_count: 0 });

    await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    const r = await submitAttempt(uid, PATHWAY, { m1: 1, m2: 1, m3: 1, m4: 0 }); // 3/4 = 75%
    expect(r.ok && r.attempt.status).toBe('passed');
    // no free half, so nothing waits on the founder however new the form is
    expect(r.ok && r.attempt.settled_by).toBe('ai');
    expect(await queueRows()).toHaveLength(0);
    expect(r.ok && r.attempt.free_total).toBe(0);
    expect(await listCertificates(uid)).toHaveLength(1);
  });

  it('does not depend on the mix — an all-free-text pool goes end to end', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [FREE(1), FREE(2)], supervisedUntil: 0 });
    await assignExam(uid, PATHWAY);
    const s = await examState(uid, PATHWAY);
    expect(s.rules).toMatchObject({ question_count: 2, mcq_count: 0, free_count: 2 });

    await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    agree([]);
    const r = await submitAttempt(uid, PATHWAY, { f1: LONG, f2: LONG });
    expect(r.ok && r.attempt.status).toBe('passed');
    expect(r.ok && r.attempt.mcq_total).toBe(0);
    expect(await listCertificates(uid)).toHaveLength(1);
  });

  it('a one-question form is a form, and a lopsided pool draws what it has', async () => {
    const uid = await userId();
    // 1 free + 9 mcq, drawing 5 from the WHOLE pool — the sheet's mix is
    // whatever the draw produced, never a count per kind (founder: «۱۵ تا
    // سؤال رندوم» over a pool he keeps adding to).
    await openForm(PATHWAY, {
      questions: [FREE(1), ...Array.from({ length: 9 }, (_, i) => MCQ(i + 1))],
      draw: 5, supervisedUntil: 0,
    });
    await assignExam(uid, PATHWAY);
    const started = await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    expect(started.ok).toBe(true);
    const drawn = started.ok ? started.attempt.questions : [];
    expect(drawn).toHaveLength(5);
    expect(new Set(drawn.map((q) => q.id)).size).toBe(5);
    expect((await examState(uid, PATHWAY)).rules!.question_count).toBe(5);

    // asking for more than the pool holds draws the pool, never zero
    await openForm(PATHWAY, { questions: [MCQ(1), MCQ(2)], draw: 20 });
    const other = await userId();
    expect((await examState(other, PATHWAY)).rules!.question_count).toBe(2);
  });

  it('is rate limited per reader', async () => {
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    for (let i = 0; i < config.exam.maxSubmitsPerHour; i += 1) await post(`/exams/${PATHWAY}/submit`, { answers: {} });
    expect((await post(`/exams/${PATHWAY}/submit`, { answers: {} })).statusCode).toBe(429);
  });
});

/* --------------------------------------------------------- free text -- */

describe('free text and the model', () => {
  it('an unusable model answer (the stub) queues the attempt with nothing decided, and pings the founder', async () => {
    const founderCookie = await loginAs(app, founderPhone);
    expect(founderCookie).toBeTruthy();
    config.support.alertPhone = founderPhone;
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1), FREE(1)], supervisedUntil: 0 });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'مهسا رضایی');

    const r = await post(`/exams/${PATHWAY}/submit`, { answers: { m1: 1, f1: LONG } });
    expect(r.json().state).toBe('queued');
    expect(r.json().history[0]).toMatchObject({ status: 'queued', passed: null, mcq_correct: null, per_question: null });

    const q = await queueRows();
    expect(q).toHaveLength(1);
    expect(q[0].ai_tally).toBeNull();
    expect(q[0].verdict!.find((v) => v.id === 'f1')).toMatchObject({ kind: 'free', unsure: true, points: null });
    expect((await notices(uid))).toHaveLength(0);
    const founderNotes = await notices(await userId(founderPhone));
    expect(founderNotes).toHaveLength(1);
    expect(founderNotes[0].body).toContain('مطمئن نبود');
  });

  it('two agreeing runs settle on their own once the form has left its supervised period', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [FREE(1), FREE(2)], supervisedUntil: 0 });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'دکتر نگار حسینی');
    const spy = agree([]);

    const r = await post(`/exams/${PATHWAY}/submit`, { answers: { f1: LONG, f2: LONG } });
    expect(r.json().state).toBe('passed');
    expect(r.json().history[0]).toMatchObject({ free_covered: 6, free_total: 6, free_percent: 100, mcq_total: 0 });
    expect(r.json().history[0].per_question.slice().sort((a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id))).toEqual([
      { id: 'f1', kind: 'free', covered: 3, total: 3 }, { id: 'f2', kind: 'free', covered: 3, total: 3 },
    ]);
    expect(spy).toHaveBeenCalledTimes(4); // twice per question
    expect((await attemptRoster())[0].settled_by).toBe('ai');
    expect(await listCertificates(uid)).toHaveLength(1);
  });

  it('two runs that disagree are not a verdict — the attempt queues', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [FREE(1)], supervisedUntil: 0 });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    vi.spyOn(ai, 'matchKeyPoints')
      .mockResolvedValueOnce(FREE(1).kind === 'free' ? (FREE(1) as { key_points: { id: string }[] }).key_points.map((k) => ({ id: k.id, state: 'covered' as const })) : [])
      .mockResolvedValueOnce([{ id: 'f1-k1', state: 'covered' }, { id: 'f1-k2', state: 'missing' }, { id: 'f1-k3', state: 'covered' }]);

    const r = await post(`/exams/${PATHWAY}/submit`, { answers: { f1: LONG } });
    expect(r.json().state).toBe('queued');
    expect((await queueRows())[0].ai_tally).toBeNull();
  });

  it('a confident fail below 70% settles as failed, with the reader told how many points landed', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [FREE(1)], supervisedUntil: 0 });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue([
      { id: 'f1-k1', state: 'covered' }, { id: 'f1-k2', state: 'missing' }, { id: 'f1-k3', state: 'missing' },
    ]);
    const r = await post(`/exams/${PATHWAY}/submit`, { answers: { f1: LONG } });
    expect(r.json().state).toBe('wait');
    expect(r.json().history[0]).toMatchObject({ status: 'failed', free_covered: 1, free_total: 3, free_percent: 33 });
    expect((await notices(uid))[0].body).toContain('تشریحی ۱ نکته از ۳');
    expect(await listCertificates(uid)).toHaveLength(0);
  });

  it('while supervised, a confident verdict still waits for the founder — pre-filled', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1), FREE(1)] }); // supervised_until 5
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    agree([]);
    const r = await post(`/exams/${PATHWAY}/submit`, { answers: { m1: 1, f1: LONG } });
    expect(r.json().state).toBe('queued');
    const q = await queueRows();
    expect(q[0].ai_tally).toMatchObject({ passed: true, mcq_correct: 1, free_covered: 3 });
    expect(q[0].rulings).toBe(0);
    expect(q[0].supervised_until).toBe(5);
    expect(await listCertificates(uid)).toHaveLength(0);
  });

  it('a mixed attempt reports a pass only when BOTH parts clear 70%', () => {
    const v = (mcqRight: number, mcqTotal: number, covered: number, total: number) => tally([
      ...Array.from({ length: mcqTotal }, (_, i) => ({ id: `m${i}`, kind: 'mcq' as const, correct: i < mcqRight })),
      { id: 'f', kind: 'free' as const, unsure: false, by: 'ai' as const,
        points: Array.from({ length: total }, (_, i) => ({ id: `k${i}`, state: i < covered ? 'covered' as const : 'missing' as const })) },
    ], 70);
    expect(v(10, 10, 1, 3).passed).toBe(false);
    expect(v(5, 10, 3, 3).passed).toBe(false);
    expect(v(7, 10, 3, 4).passed).toBe(true);   // 70 and 75
    expect(v(7, 10, 2, 3).passed).toBe(false);  // 67 on free
    expect(tally([], 70).passed).toBe(true);    // vacuous, never reached in practice
  });
});

/* ----------------------------------------------------------- founder -- */

describe('the founder\'s ruling', () => {
  async function queued(): Promise<{ uid: string; id: string }> {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1), FREE(1)] });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'نام اولیه');
    agree([]);
    await post(`/exams/${PATHWAY}/submit`, { answers: { m1: 1, f1: LONG } });
    const q = await queueRows();
    expect(q).toHaveLength(1);
    return { uid, id: q[0].id };
  }

  it('pass: settles, writes the per-point ruling as an example, issues the certificate with the name typed, counts as a ruling', async () => {
    const { uid, id } = await queued();
    const res = await adminPost(`/admin/exam-attempts/${id}/rule`, {
      decision: 'pass', holder_name: 'دکتر نگار نهایی',
      free: [{ id: 'f1', points: [{ id: 'f1-k1', state: 'covered' }, { id: 'f1-k2', state: 'covered' }, { id: 'f1-k3', state: 'missing' }] }],
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().attempt).toMatchObject({
      status: 'passed', settled_by: 'founder', holder_name: 'دکتر نگار نهایی', free_covered: 2, free_total: 3, mcq_correct: 1,
    });
    const certs = await listCertificates(uid);
    expect(certs[0].holder_name).toBe('دکتر نگار نهایی');
    expect(certs[0].attempt_id).toBe(id);

    const ex = await pool.query('select question_id, answer_text, verdict from pathway_exam_examples');
    expect(ex.rows).toHaveLength(1);
    expect(ex.rows[0].question_id).toBe('f1');
    expect(ex.rows[0].answer_text).toBe(LONG);
    expect(ex.rows[0].verdict[2]).toEqual({ id: 'f1-k3', state: 'missing' });

    expect((await formRoster())[0].rulings).toBe(1);
    expect(await queueRows()).toHaveLength(0);
    const n = await notices(uid);
    expect(n.map((x) => x.kind)).toEqual(['exam_result']);
    expect(n[0].title).toContain('قبول');
    expect((await examState(uid, PATHWAY)).state).toBe('passed');
  });

  it('the stored examples reach the next grading of the same question', async () => {
    const { id } = await queued();
    await ruleAttempt(id, { decision: 'pass', free: [{ id: 'f1', points: [{ id: 'f1-k1', state: 'covered' }, { id: 'f1-k2', state: 'covered' }, { id: 'f1-k3', state: 'covered' }] }] });

    // a second reader on the same form
    const other = await loginAs(app, '09121200095');
    await pool.query(`update profiles set tier = 'premium' where phone = $1`, ['09121200095']);
    const uid2 = await userId('09121200095');
    await assignExam(uid2, PATHWAY);
    await startAttempt(uid2, PATHWAY, 'سارا کریمی');
    const spy = agree([]);
    await post(`/exams/${PATHWAY}/submit`, { answers: { m1: 1, f1: LONG + ' دوم' } }, other);
    expect(spy.mock.calls[0][0].examples).toEqual([{ answer: LONG, verdict: [
      { id: 'f1-k1', state: 'covered' }, { id: 'f1-k2', state: 'covered' }, { id: 'f1-k3', state: 'covered' },
    ] }]);
  });

  it('fail: settles as failed with the model\'s verdict kept when no per-point ruling is given, starts the retry clock', async () => {
    const { uid, id } = await queued();
    const res = await adminPost(`/admin/exam-attempts/${id}/rule`, { decision: 'fail' });
    expect(res.json().attempt).toMatchObject({ status: 'failed', settled_by: 'founder', free_covered: 3, free_total: 3 });
    expect(await listCertificates(uid)).toHaveLength(0);
    expect((await examState(uid, PATHWAY)).state).toBe('wait');
    expect((await notices(uid))[0].body).toContain('به حد نصاب نرسید');
    expect(await pool.query('select count(*)::int as n from pathway_exam_examples').then((r) => r.rows[0].n)).toBe(0);
  });

  it('void: spends nothing — the reader may start again at once, and a second void is a no-op', async () => {
    const { uid, id } = await queued();
    expect((await adminPost(`/admin/exam-attempts/${id}/rule`, { decision: 'void' })).json().attempt.status).toBe('void');
    const s = await examState(uid, PATHWAY);
    expect(s.state).toBe('ready');
    expect(s.attempts_used).toBe(0);
    expect(s.history).toHaveLength(0);
    expect((await adminPost(`/admin/exam-attempts/${id}/rule`, { decision: 'void' })).statusCode).toBe(200);
    const next = await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    expect(next.ok).toBe(true);
    expect(next.state.open).not.toBeNull();
    // the reader-facing ordinal skips the void; the row's own number does not
    expect(next.ok && next.attempt.attempt_no).toBe(2);
    await submitAttempt(uid, PATHWAY, { m1: 0, f1: LONG });
    const after = await examState(uid, PATHWAY);
    expect(after.history.map((h) => h.attempt_no)).toEqual([1]);
  });

  it('refuses a ruling on a settled attempt, a bad point set, and a passed attempt cannot be voided', async () => {
    const { id } = await queued();
    const bad = await adminPost(`/admin/exam-attempts/${id}/rule`, { decision: 'pass', free: [{ id: 'f1', points: [{ id: 'nope', state: 'covered' }] }] });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error).toBe('bad_verdict');
    expect((await getAttempt(id))!.status).toBe('queued');

    await ruleAttempt(id, { decision: 'pass' });
    expect((await adminPost(`/admin/exam-attempts/${id}/rule`, { decision: 'fail' })).json().error).toBe('not_queued');
    expect((await adminPost(`/admin/exam-attempts/${id}/rule`, { decision: 'void' })).json().error).toBe('not_queued');
    expect((await adminPost('/admin/exam-attempts/00000000-0000-0000-0000-000000000000/rule', { decision: 'pass' })).statusCode).toBe(404);
  });

  it('the queue and the record are one route, oldest waiting first', async () => {
    const { id } = await queued();
    const res = await adminGet('/admin/exam-attempts');
    expect(res.json().count).toBe(1);
    expect(res.json().queue[0].id).toBe(id);
    // The founder sees the key… (the sheet is a random draw over the whole
    // pool now, so the MCQ is found by kind, not by position.)
    const mcq = (res.json().queue[0].questions as { kind: string; correct?: number }[]).find((q) => q.kind === 'mcq')!;
    expect(mcq.correct).toBe(1);
    expect(res.json().queue[0].answers.f1).toBe(LONG);           // …and the reader's words
    expect(res.json().attempts[0]).toMatchObject({ id, status: 'queued', attempt_no: 1 });
  });

  it('is behind admin auth', async () => {
    expect((await app.inject({ method: 'GET', url: '/admin/exam-attempts' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/admin/exam-forms' })).statusCode).toBe(401);
  });
});

/* ---------------------------------------------------------- the edges -- */

describe('edges', () => {
  it('a pass on a pathway whose certificate was already issued by hand mints no second code', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    const manual = await issueCertificate(uid, PATHWAY, { holderName: 'نیما مرادی', notify: false });
    await submitAttempt(uid, PATHWAY, { m1: 1 });
    const certs = await listCertificates(uid);
    expect(certs).toHaveLength(1);
    expect(certs[0].verify_code).toBe(manual.certificate.verify_code);
  });

  it('deleting the form takes its attempts and examples, leaves the certificate (attempt_id nulled)', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    await submitAttempt(uid, PATHWAY, { m1: 1 });
    await deleteForm(PATHWAY);
    expect(await attemptRoster()).toHaveLength(0);
    const certs = await listCertificates(uid);
    expect(certs).toHaveLength(1);
    expect(certs[0].attempt_id).toBeNull();
    expect((await examState(uid, PATHWAY)).state).toBe('passed'); // the certificate still stands
  });

  it('GET /certificates carries one word per pathway on the exam', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(uid, PATHWAY);
    const res = await get('/certificates');
    const mine = res.json().pathways.find((p: { id: string }) => p.id === PATHWAY);
    expect(mine.exam).toEqual({ state: 'ready', url: `/plus/exam.html?id=${PATHWAY}` });
    const other = res.json().pathways.find((p: { id: string }) => p.id !== PATHWAY);
    expect(other.exam.state).toBe('no_form');
  });

  it('merging profiles carries attempts across and drops the colliding attempt numbers', async () => {
    const a = await userId();
    await loginAs(app, '09121200096');
    const b = await userId('09121200096');
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(a, PATHWAY);
    await assignExam(b, PATHWAY);
    await startAttempt(a, PATHWAY, 'آرش نوری'); await submitAttempt(a, PATHWAY, { m1: 0 });
    await startAttempt(b, PATHWAY, 'بهار صادقی'); await submitAttempt(b, PATHWAY, { m1: 0 });
    await withTransaction((c) => mergeProfiles(c, b, a));
    const rows = await pool.query('select user_id, attempt_no from pathway_exam_attempts');
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toMatchObject({ user_id: a, attempt_no: 1 });
  });

  it('a submit that lands while the founder is ruling does not double-settle', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [FREE(1)], supervisedUntil: 0 });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    let ruled = false;
    vi.spyOn(ai, 'matchKeyPoints').mockImplementation(async ({ keyPoints }) => {
      if (!ruled) {
        ruled = true;
        const q = await queueRows();
        await ruleAttempt(q[0].id, { decision: 'fail' });
      }
      return keyPoints.map((k) => ({ id: k.id, state: 'covered' as const }));
    });
    const r = await submitAttempt(uid, PATHWAY, { f1: LONG });
    expect(r.ok && r.attempt.status).toBe('failed');
    expect(await listCertificates(uid)).toHaveLength(0);
  });
});

/**
 * An unfinished series has no certificate — founder, 2026-09-13: a pathway
 * standing on a series still being published would attest to finishing
 * something that has no end yet. `certificate: 'pending'` in pathways.json
 * closes EVERY door at once: the wall, the exam, the wish, the founder's hand.
 * Removing the flag when the last part lands is the whole release.
 *
 * That release happened on 2026-09-20, when Chapter 7 Part 2 landed and the
 * flag came off `ai-dentistry`. The MECHANISM is still live and still has to
 * be tested, so these cases stop reading the flag out of the shipped catalog
 * and supply it themselves through `applyRemotePathways` — the module's own
 * test hook, and the same door content-refresh.ts adopts a published copy
 * with. Nothing guarantees a real pathway is ever flagged again, and a suite
 * that needs one to be is a suite that breaks on an ordinary editorial commit.
 */
describe('an unfinished series has no certificate (`certificate: pending`)', () => {
  const PENDING = 'ai-dentistry';

  beforeEach(() => {
    // A deep copy: the fixture must not reach into the module's own cached
    // objects, which every other case in this file reads.
    const raw = JSON.parse(JSON.stringify(getPathways())) as { id: string; certificate?: string }[];
    const p = raw.find((x) => x.id === PENDING);
    expect(p).toBeTruthy();
    p!.certificate = 'pending';
    expect(applyRemotePathways(raw)).toBe(true);
  });

  afterEach(() => { resetRemotePathways(); });

  it('the flag is set here, not borrowed from the shipped catalog', () => {
    resetRemotePathways();
    expect(getPathwayById(PENDING)?.certificate).toBeUndefined();
  });

  it('is what isCertifiable() reads, and it closes the pathway to every door', () => {
    expect(getPathwayById(PENDING)?.certificate).toBe('pending');
    expect(isCertifiable(getPathwayById(PENDING))).toBe(false);
    expect(isCertifiable(getPathwayById(PATHWAY))).toBe(true);
    expect(isCertifiable(getPathwayById(BUNDLE_ID))).toBe(false);
  });

  it('refuses publishing, an assignment, a wish and a hand-issued certificate — each by name', async () => {
    const uid = await userId();
    await expect(assignExam(uid, PENDING)).rejects.toThrow('pathway_pending');
    await expect(setCertificateIntent(uid, PENDING, 'wanted')).rejects.toThrow('pathway_pending');
    await expect(issueCertificate(uid, PENDING, { holderName: 'مهسا رضایی', notify: false })).rejects.toThrow('pathway_pending');
    await upsertForm(PENDING, { questions: [MCQ(1), MCQ(2)] });
    await expect(publishForm(PENDING)).rejects.toThrow('pathway_pending');
    expect((await getForm(PENDING))!.published_at).toBeNull();
    expect(await listCertificates(uid)).toHaveLength(0);
  });

  // The founder prepares a pending pathway's questions while its series is
  // still being written (1405/07/03): writing the bank is open, and NOTHING
  // of it reaches a reader until the flag comes off and he publishes.
  it('keeps the question bank open: a paste, a batch and one built question all land, as a draft', async () => {
    const uid = await userId();
    await upsertForm(PENDING, { questions: [MCQ(1)] });
    const batch = await appendQuestions(PENDING, { questions: [MCQ(2), MCQ(3)] });
    expect(batch.added).toHaveLength(2);
    const one = await addQuestion(PENDING, MCQ(4));
    expect(one.form.questions).toHaveLength(4);
    expect(one.form.published_at).toBeNull();
    await pool.query(`insert into user_pathways (user_id, pathway_id, current_step) values ($1, $2, 0)`, [uid, PENDING]);
    const st = await examState(uid, PENDING);
    expect(st.state).toBe('pending');
    expect(st.rules).toBeNull();
  });

  it('reads as its own state to the reader, and the routes say so rather than 404', async () => {
    const uid = await userId();
    await pool.query(`insert into user_pathways (user_id, pathway_id, current_step) values ($1, $2, 0)`, [uid, PENDING]);
    expect((await examState(uid, PENDING)).state).toBe('pending');
    const r = await get(`/exams/${PENDING}`);
    expect(r.statusCode).toBe(200);
    expect(r.json().state).toBe('pending');
    const w = await post(`/exams/${PENDING}/intent`, { intent: 'wanted' });
    expect(w.statusCode).toBe(409);
    expect(w.json()).toMatchObject({ error: 'pathway_pending', state: 'pending' });
    const st = await post(`/exams/${PENDING}/start`, { holder_name: 'مهسا رضایی' });
    expect(st.statusCode).toBe(409);
    expect(st.json().state).toBe('pending');
  });

  it('has no disc on the wall and no row in the founder\'s pickers', async () => {
    const wall = await get('/certificates');
    expect(wall.statusCode).toBe(200);
    const ids = (wall.json().pathways as { id: string }[]).map((p) => p.id);
    expect(ids).toContain(PATHWAY);
    expect(ids).not.toContain(PENDING);
    const cat = await adminGet('/admin/pathways/catalog');
    const row = (cat.json().pathways as { id: string; certifiable: boolean }[]).find((p) => p.id === PENDING);
    expect(row).toMatchObject({ certifiable: false });
    const issue = await adminPost('/admin/certificates/issue', { phone, pathway_id: PENDING, holder_name: 'مهسا رضایی', notify: false });
    expect(issue.statusCode).toBe(400);
    expect(issue.json().error).toBe('pathway_pending');
    const form = await adminPost('/admin/exam-forms', { pathway_id: PENDING, questions: [MCQ(1), MCQ(2)] });
    expect(form.statusCode).toBe(200);
    const pub = await adminPost('/admin/exam-forms/publish', { pathway_id: PENDING });
    expect(pub.statusCode).toBe(400);
    expect(pub.json().error).toBe('pathway_pending');
  });

  it('and once the flag comes off, every one of those doors opens', async () => {
    resetRemotePathways();
    const uid = await userId();
    expect(isCertifiable(getPathwayById(PENDING))).toBe(true);
    await expect(upsertForm(PENDING, { questions: [MCQ(1), MCQ(2)] })).resolves.toBeTruthy();
    await expect(setCertificateIntent(uid, PENDING, 'wanted')).resolves.toBeTruthy();
    const ids = ((await get('/certificates')).json().pathways as { id: string }[]).map((p) => p.id);
    expect(ids).toContain(PENDING);
  });
});

/**
 * Questions written for ONE ARTICLE, drawn by EVERY pathway that carries it
 * (founder, 2026-09-13: «هر مقاله‌ای که خواستم جداگونه براش سؤال طرح کنم …
 * به هر مسیری که توش هست اضافه بشه»). Never copied into a form — the pool
 * is derived at draw time — so a pathway that adopts the article later
 * draws it too.
 */

/**
 * A certificate needs a pathway big enough to mean something (founder,
 * 1405/07/02): «سواد نقد شواهد» is nine short metanotes, and a certificate
 * for it would sit on the wall beside one for 115 steps of fixed pros. The
 * floor lives in isCertifiable(), so it closes every door the pending flag
 * closes, with no flag to remember — and it opens again by itself once
 * publish step 5.6 has grown the pathway past it.
 */
describe('a certificate needs at least MIN_CERTIFICATE_STEPS steps', () => {
  afterEach(() => { resetRemotePathways(); });

  const withSteps = (n: number) => {
    resetRemotePathways(); // slice the shipped pathway, never a copy already cut
    const raw = JSON.parse(JSON.stringify(getPathways())) as { id: string; steps: unknown[] }[];
    const p = raw.find((x) => x.id === PATHWAY)!;
    expect(p.steps.length).toBeGreaterThanOrEqual(MIN_CERTIFICATE_STEPS);
    p.steps = p.steps.slice(0, n);
    expect(applyRemotePathways(raw)).toBe(true);
  };

  it('one step short of the floor is not certifiable; the floor itself is', () => {
    withSteps(MIN_CERTIFICATE_STEPS - 1);
    expect(isCertifiable(getPathwayById(PATHWAY))).toBe(false);
    withSteps(MIN_CERTIFICATE_STEPS);
    expect(isCertifiable(getPathwayById(PATHWAY))).toBe(true);
  });

  it('a short pathway reads as pending to the reader; its bank can be written but not published', async () => {
    withSteps(MIN_CERTIFICATE_STEPS - 1);
    const uid = await userId();
    await pool.query(`insert into user_pathways (user_id, pathway_id, current_step) values ($1, $2, 0)`, [uid, PATHWAY]);
    expect((await examState(uid, PATHWAY)).state).toBe('pending');
    await upsertForm(PATHWAY, { questions: [MCQ(1), MCQ(2)] });
    await expect(publishForm(PATHWAY)).rejects.toThrow('pathway_pending');
    expect((await examState(uid, PATHWAY)).state).toBe('pending');
    await expect(setCertificateIntent(uid, PATHWAY, 'wanted')).rejects.toThrow('pathway_pending');
  });

  it('every shipped full pathway below the floor is also flagged pending — the file says what the rule does', () => {
    const short = getPathways().filter((p) => p.kind !== 'bundle' && p.steps.length < MIN_CERTIFICATE_STEPS);
    for (const p of short) expect(p.certificate).toBe('pending');
  });
});
describe('article questions — written once, drawn by every pathway the article is in', () => {
  // A step of `digital` that at least one other full pathway also carries.
  const SHARED = 'insight/insight-63';

  it('takes an id or a pasted URL, refuses an article the site does not have, and names where it lands', async () => {
    expect(normalizeContentId('https://dentcast.ir/insight/insight-63.html')).toBe(SHARED);
    expect(normalizeContentId('/insight/insight-63/')).toBe(SHARED);
    const where = pathwaysContaining(SHARED).map((p) => p.id);
    expect(where).toContain(PATHWAY);
    expect(where.length).toBeGreaterThanOrEqual(2);

    const r = await addContentQuestion('https://dentcast.ir/insight/insight-63.html', MCQ(1));
    expect(r.row.content_id).toBe(SHARED);
    expect(r.row.question.id).toMatch(/^c-[0-9a-f]{8}$/);      // its own id class, never a form's qN
    expect(r.pathways.map((p) => p.id)).toEqual(where);
    await expect(addContentQuestion('nope/nothing', MCQ(1))).rejects.toThrow('unknown_content');
    await expect(addContentQuestion(SHARED, { kind: 'mcq', prompt_fa: 'x', options: ['a'], correct: 0 })).rejects.toThrow('invalid_questions');
    expect(await listContentQuestions(SHARED)).toHaveLength(1);
  });

  it('joins the pool of every pathway that carries the article: rules, the draw, the roster, the wall', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)], draw: 0 });
    const free = await addContentQuestion(SHARED, { kind: 'free', prompt_fa: 'چرا؟', key_points: ['اول', 'دوم'] });
    expect((free.row.question as { key_points: { id: string }[] }).key_points.map((k) => k.id))
      .toEqual([`${free.row.question.id}-k1`, `${free.row.question.id}-k2`]);

    // the pathway's pool is its own question plus the article's
    const pathway = getPathwayById(PATHWAY)!;
    const poolQs = await poolFor(pathway, (await getForm(PATHWAY))!);
    expect(poolQs.map((q) => q.id).sort()).toEqual(['m1', free.row.question.id].sort());
    expect((await examState(uid, PATHWAY)).rules).toMatchObject({ question_count: 2, mcq_count: 1, free_count: 1 });

    // the draw hands the reader both
    await assignExam(uid, PATHWAY);
    const started = await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    expect(started.ok).toBe(true);
    const drawnIds = started.ok ? started.attempt.questions.map((q) => q.id).sort() : [];
    expect(drawnIds).toEqual(['m1', free.row.question.id].sort());

    // the roster counts it beside the form's own
    const roster = await formRoster();
    expect(roster.find((f) => f.pathway_id === PATHWAY)).toMatchObject({ mcq_count: 1, free_count: 0, content_count: 1 });

    // another pathway carrying the article sees it in its pool — and a form
    // that is nothing BUT article questions still reads as an exam
    const other = pathwaysContaining(SHARED).find((p) => p.id !== PATHWAY)!;
    await openForm(other.id, { questions: [MCQ(9)] });
    await removeQuestion(other.id, 'm9');               // last own question may go: the article keeps the pool alive
    expect((await getForm(other.id))!.questions).toHaveLength(0);
    const otherUser = await userId();
    expect((await examState(otherUser, other.id)).rules).toMatchObject({ question_count: 1, free_count: 1 });

    // and the wall agrees the exam exists for both
    const wall = await get('/certificates');
    const byId = new Map((wall.json().pathways as { id: string; exam: { state: string } }[]).map((p) => [p.id, p.exam.state]));
    expect(byId.get(other.id)).not.toBe('no_form');
  });

  it('is the form row that opens an exam — article questions alone do not', async () => {
    const uid = await userId();
    await addContentQuestion(SHARED, MCQ(2));
    expect((await examState(uid, PATHWAY)).state).toBe('no_form');   // no form for `digital` in this case
  });

  it('the panel routes: resolve, add, list, delete', async () => {
    const found = await adminGet(`/admin/content-questions?content=${encodeURIComponent('/insight/insight-63.html')}`);
    expect(found.statusCode).toBe(200);
    expect(found.json().content.id).toBe(SHARED);
    expect(found.json().pathways.map((p: { id: string }) => p.id)).toContain(PATHWAY);
    expect((await adminGet('/admin/content-questions?content=nope/nothing')).statusCode).toBe(404);

    const added = await adminPost('/admin/content-questions', { content_id: SHARED, question: MCQ(1) });
    expect(added.statusCode).toBe(200);
    expect(added.json()).toMatchObject({ ok: true, content_id: SHARED, count: 1 });
    expect(added.json().pathways.length).toBeGreaterThanOrEqual(2);
    expect((await adminPost('/admin/content-questions', { content_id: 'nope/x', question: MCQ(1) })).statusCode).toBe(400);

    const listed = await adminGet(`/admin/content-questions?content=${SHARED}`);
    expect(listed.json().questions).toHaveLength(1);
    const del = await adminPost('/admin/content-questions/delete', { id: added.json().id });
    expect(del.statusCode).toBe(200);
    expect(await removeContentQuestion(added.json().id)).toBe(false);
    expect(await listContentQuestions(SHARED)).toHaveLength(0);
  });
});

/**
 * Two question systems, and they never touch (founder, 2026-09-13: «کوییز
 * هوش مصنوعی … نمی‌خوام قاطی بشه»). Every article ships with AI-generated
 * review cards and quiz items (plus/flashcards-index.json,
 * plus/quiz-index.json, faq-corpus.json — src/flashcards.ts, routes/review.ts).
 * The exam draws from exactly two places, both founder-written:
 * pathway_exam_forms.questions and content_exam_questions. Nothing else.
 */
describe('the exam never draws from the AI quiz/flashcard system', () => {
  it('the exam service imports nothing from it, by name', () => {
    const src = readFileSync(new URL('../src/services/pathway-exams.ts', import.meta.url), 'utf8');
    const imports = src.split('\n').filter((l) => l.startsWith('import '));
    for (const bad of ['flashcards', 'review', 'quiz', 'faq']) {
      expect(imports.some((l) => l.toLowerCase().includes(bad)), `imports ${bad}`).toBe(false);
    }
  });

  it('a pathway whose steps carry AI cards still has an EMPTY pool until the founder writes a question', async () => {
    const withCards = STEPS.find((cid) => getCardsFor(cid).length > 0)!;
    expect(withCards, 'the fixture needs a digital step that has AI cards').toBeTruthy();
    const pathway = getPathwayById(PATHWAY)!;
    // Only content questions the founder wrote count — and there are none.
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    const poolQs = await poolFor(pathway, (await getForm(PATHWAY))!);
    expect(poolQs.map((q) => q.id)).toEqual(['m1']);
    await removeQuestion(PATHWAY, 'm1').catch(() => {});
    // The wall reads the same two sources: no founder question → no exam,
    // however many AI cards the articles carry.
    expect((await examState(await userId(), PATHWAY)).rules!.question_count).toBe(1);
  });
});

/* ------------------------------------------------- the name on the paper -- */

/**
 * A certificate is never issued to a pseudonym (founder, 2026-09-20). The
 * name is asked at the top of the exam, in two boxes, and it is the reader's
 * real one: the public verify page asserts that the person NAMED on the
 * paper finished the pathway, which a generated alias asserts about nobody.
 *
 * Four doors, one judge (services/holder-name.ts) — and the one that matters
 * most is the last: whatever is stored on an attempt, a certificate is not
 * minted from a name that cannot be printed.
 */
describe('the certificate carries a real name', () => {
  it('starting takes the first name and the family name as two fields', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(uid, PATHWAY);
    const r = await post(`/exams/${PATHWAY}/start`, { holder_first_name: 'مهسا', holder_last_name: 'رضایی' });
    expect(r.statusCode).toBe(200);
    expect(r.json().open.holder_name).toBe('مهسا رضایی');
  });

  it('refuses a given name alone, a half-filled pair, and the account pseudonym — each by its own code', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(uid, PATHWAY);

    const alone = await post(`/exams/${PATHWAY}/start`, { holder_name: 'مهسا' });
    expect(alone.statusCode).toBe(400);
    expect(alone.json().error).toBe('holder_name_incomplete');

    const half = await post(`/exams/${PATHWAY}/start`, { holder_first_name: 'مهسا', holder_last_name: '  ' });
    expect(half.statusCode).toBe(400);
    expect(half.json().error).toBe('holder_name_incomplete');

    const alias = await post(`/exams/${PATHWAY}/start`, { holder_name: 'کنجکاو مینا ۴۲۱' });
    expect(alias.statusCode).toBe(400);
    expect(alias.json().error).toBe('holder_name_pseudonym');
    expect(alias.json().message).toContain('نام واقعی');

    // None of them opened anything.
    expect(await attemptRoster()).toHaveLength(0);
    expect((await examState(uid, PATHWAY)).state).toBe('ready');
  });

  it('never mints a certificate from a name a document cannot carry — it waits for the founder instead', async () => {
    const uid = await userId();
    await openForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(uid, PATHWAY);
    await loginAs(app, founderPhone);
    config.support.alertPhone = founderPhone;
    const fid = await userId(founderPhone);
    await startAttempt(uid, PATHWAY, 'مهسا رضایی');
    // A row from before the rule existed: the only way to hold a name the
    // start form would refuse today.
    await pool.query(
      `update pathway_exam_attempts set holder_name = $2 where user_id = $1`, [uid, 'کنجکاو مینا ۴۲۱'],
    );

    const r = await post(`/exams/${PATHWAY}/submit`, { answers: { m1: 1 } });
    expect(r.statusCode).toBe(200);
    // It passed on the arithmetic, and it is NOT settled: no certificate, no
    // «بدون نام» on a paper a stranger verifies.
    expect(r.json().state).toBe('queued');
    expect(await listCertificates(uid)).toHaveLength(0);
    const q = await queueRows();
    expect(q).toHaveLength(1);
    const told = await notices(fid);
    expect(told.map((x) => x.title)).toContain('یک آزمون منتظر توست');
    expect(told.some((x) => x.body.includes('نامِ روی گواهی'))).toBe(true);

    // The founder cannot wave it through either…
    const refused = await adminPost(`/admin/exam-attempts/${q[0].id}/rule`, { decision: 'pass' });
    expect(refused.statusCode).toBe(400);
    expect(refused.json().error).toBe('holder_name_invalid');
    expect(await listCertificates(uid)).toHaveLength(0);
    expect((await getAttempt(q[0].id))!.status).toBe('queued');

    // …until he types the real name into the field already in front of him.
    const ok = await adminPost(`/admin/exam-attempts/${q[0].id}/rule`, {
      decision: 'pass', holder_name: 'مهسا رضایی',
    });
    expect(ok.statusCode).toBe(200);
    const certs = await listCertificates(uid);
    expect(certs).toHaveLength(1);
    expect(certs[0].holder_name).toBe('مهسا رضایی');
  });

  it('the hand issue asks for both halves too, and issueCertificate refuses whatever reaches it', async () => {
    const uid = await userId();
    const bad = await adminPost('/admin/certificates/issue', {
      user: phone, pathway_id: PATHWAY, holder_first_name: 'مهسا', holder_last_name: '',
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error).toBe('holder_name_incomplete');

    const good = await adminPost('/admin/certificates/issue', {
      user: phone, pathway_id: PATHWAY, holder_first_name: 'مهسا', holder_last_name: 'رضایی',
    });
    expect(good.statusCode).toBe(200);
    expect(good.json().certificate.holder_name).toBe('مهسا رضایی');

    await expect(issueCertificate(uid, PATHWAY, { holderName: 'کنجکاو مینا ۴۲۱', notify: false }))
      .rejects.toThrow('holder_name_pseudonym');
  });
});
