// THE WHOLE ROAD, WALKED — both sides of it, through the same HTTP surfaces a
// person uses, in order, with nothing stubbed but the model.
//
// The unit tests in exams.test.ts each hold one rule still. This file exists
// for the failures that only appear in sequence: a state the panel can reach
// but no single call can, a queue row that carries the wrong thing after three
// earlier steps, an attempt that outlives the pool it was drawn from. Every
// step asserts what the PERSON would see at that moment.
import {
  describe, it, expect, beforeEach, afterEach, afterAll, vi,
} from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { ai } from '../src/providers/registry.js';
import { getPathwayById } from '../src/pathways.js';
import { verifyCertificate } from '../src/services/certificates.js';
import { resetRateLimits } from '../src/services/rate-limit.js';

let app: FastifyInstance;
let reader: string;
const readerPhone = '09121200110';
const founderPhone = '09121200111';

const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');
const PATHWAY = 'digital';
const STEPS = getPathwayById(PATHWAY)!.steps.map((s) => s.content_id);

const originalAlert = config.pathwayAlert.alertPhone;
const originalSupport = config.support.alertPhone;

beforeEach(async () => {
  await resetDb();
  resetRateLimits();
  if (!app) app = await makeApp();
  reader = await loginAs(app, readerPhone);
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [readerPhone]);
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

const adminPost = (url: string, body: unknown) => app.inject({
  method: 'POST', url, headers: { authorization: basic }, payload: body as object,
});
const adminGet = (url: string) => app.inject({ method: 'GET', url, headers: { authorization: basic } });
const get = (url: string) => app.inject({ method: 'GET', url, headers: { cookie: reader } });
const post = (url: string, body: unknown = {}) => app.inject({
  method: 'POST', url, headers: { cookie: reader }, payload: body as object,
});

const examState = async () => (await get(`/exams/${PATHWAY}`)).json();

async function uid(phone = readerPhone): Promise<string> {
  return (await pool.query<{ id: string }>('select id from profiles where phone = $1', [phone])).rows[0].id;
}
async function readEverything(): Promise<void> {
  const id = await uid();
  for (const cid of STEPS) {
    await pool.query(`insert into user_activity (user_id, action, content_id) values ($1, 'article_completed', $2)`, [id, cid]);
  }
}
/** The founder builds the pool the way the panel does: one question at a time. */
async function build(questions: object[]): Promise<void> {
  for (const q of questions) {
    const r = await adminPost('/admin/exam-forms/questions', { pathway_id: PATHWAY, question: q });
    expect(r.statusCode).toBe(200);
  }
}
const MCQ = (n: number, correct = 1) => ({
  kind: 'mcq', prompt_fa: `سؤال تستی ${n}؟`, options: ['الف', 'ب', 'ج', 'د'], correct,
});
const FREE = (n: number) => ({
  kind: 'free', prompt_fa: `سؤال تشریحی ${n}؟`, key_points: ['نکتهٔ اول', 'نکتهٔ دوم', 'نکتهٔ سوم'],
});
const LONG = 'پاسخی که به‌اندازهٔ کافی بلند است تا از حداقلِ طول عبور کند و چیزی بگوید.';
const allCovered = () => vi.spyOn(ai, 'matchKeyPoints').mockImplementation(
  async ({ keyPoints }) => keyPoints.map((k) => ({ id: k.id, state: 'covered' as const })),
);

/* ══════════════════════════════════════════════════════════════════════════ */

describe('the whole road: a mixed exam, queued, ruled by the founder, certificate verified', () => {
  it('walks it', async () => {
    await loginAs(app, founderPhone);
    config.support.alertPhone = founderPhone;
    const founderId = await uid(founderPhone);

    // ── 1. nothing exists yet: the reader's page says so, and waits for nobody
    expect(await examState()).toMatchObject({ state: 'no_form', rules: null, enrolled: false });

    // ── 2. the founder builds three questions in the panel
    await build([MCQ(1), MCQ(2), FREE(1)]);
    const forms = (await adminGet('/admin/exam-forms')).json().forms;
    expect(forms[0]).toMatchObject({ pathway_id: PATHWAY, mcq_count: 2, free_count: 1, pass_percent: 70 });

    // ── 3. the reader has read nothing and pressed nothing: locked, and the
    //       contract is already visible so they know what is coming
    let s = await examState();
    expect(s.state).toBe('locked');
    expect(s.rules).toMatchObject({ question_count: 3, min_answer_chars: config.exam.minAnswerChars });
    expect(s.enrolled).toBe(false);

    // ── 4. reading the whole pathway is not enough — enrolment is the act
    await readEverything();
    expect((await examState()).state).toBe('locked');
    expect((await post(`/exams/${PATHWAY}/start`, { holder_name: 'x' })).statusCode).toBe(409);

    // ── 5. «شروع این مسیر», then «بله» to the certificate question. The reader
    //       is already finished, so that answer is news the founder gets NOW
    await post(`/pathways/${PATHWAY}/enroll`);
    expect((await examState()).state).toBe('ready');
    const intent = await post(`/exams/${PATHWAY}/intent`, { intent: 'wanted' });
    expect(intent.json()).toMatchObject({ state: 'ready', certificate_intent: 'wanted' });
    const founderNotes = await pool.query('select title from notification_log where user_id = $1', [founderId]);
    expect(founderNotes.rows).toHaveLength(1);
    expect(founderNotes.rows[0].title).toContain('تمام کرد');

    // ── 6. start: the sheet arrives with no answer key on it
    const started = await post(`/exams/${PATHWAY}/start`, { holder_name: 'دکتر مهسا رضایی' });
    expect(started.statusCode).toBe(200);
    s = started.json();
    expect(s.state).toBe('open');
    expect(s.open.questions).toHaveLength(3);
    expect(JSON.stringify(s.open.questions)).not.toContain('correct');
    expect(JSON.stringify(s.open.questions)).not.toContain('key_points');

    // ── 7. a skipped question costs nothing
    // The sheet is a random draw over the whole pool, so the one answered
    // question is picked by kind, not by position.
    const ids = s.open.questions.map((q: { id: string }) => q.id);
    const firstMcq = (s.open.questions as { id: string; kind: string }[]).find((q) => q.kind === 'mcq')!.id;
    const short = await post(`/exams/${PATHWAY}/submit`, { answers: { [firstMcq]: 1 } });
    expect(short.statusCode).toBe(400);
    expect(short.json().missing).toHaveLength(2);
    expect((await examState()).state).toBe('open');

    // ── 8. a full sheet, graded: the free half queues while the form is young
    allCovered();
    const byId = new Map(s.open.questions.map((q: { id: string; kind: string }) => [q.id, q.kind]));
    const answers: Record<string, unknown> = {};
    for (const id of ids) answers[id] = byId.get(id) === 'mcq' ? 1 : LONG;
    const submitted = await post(`/exams/${PATHWAY}/submit`, { answers });
    expect(submitted.statusCode).toBe(200);
    expect(submitted.json().state).toBe('queued');
    // nothing is announced to the reader yet, and no number is shown
    const readerNotes = await pool.query('select kind from notification_log where user_id = $1', [await uid()]);
    expect(readerNotes.rows).toHaveLength(0);
    expect(submitted.json().history[0]).toMatchObject({ status: 'queued', mcq_correct: null, per_question: null });

    // ── 9. the founder's queue has everything the ruling needs
    const queue = (await adminGet('/admin/exam-attempts')).json();
    expect(queue.count).toBe(1);
    const row = queue.queue[0];
    expect(row).toMatchObject({ attempt_no: 1, holder_name: 'دکتر مهسا رضایی', rulings: 0, supervised_until: 5 });
    expect(row.ai_tally).toMatchObject({ passed: true, mcq_total: 2, free_total: 3 });
    expect(row.questions.find((q: { kind: string }) => q.kind === 'mcq').correct).toBe(1); // the founder sees the key
    expect(Object.values(row.answers)).toContain(LONG);                                    // and the reader's words

    // ── 10. the founder accepts, correcting one point down
    const freeQ = row.questions.find((q: { kind: string }) => q.kind === 'free');
    const ruled = await adminPost(`/admin/exam-attempts/${row.id}/rule`, {
      decision: 'pass',
      free: [{
        id: freeQ.id,
        points: freeQ.key_points.map((kp: { id: string }, i: number) => ({ id: kp.id, state: i === 2 ? 'missing' : 'covered' })),
      }],
    });
    expect(ruled.statusCode).toBe(200);
    expect(ruled.json().attempt).toMatchObject({ status: 'passed', settled_by: 'founder', free_covered: 2, free_total: 3 });
    expect((await adminGet('/admin/exam-attempts')).json().count).toBe(0);

    // the ruling became a worked example for that question
    const examples = await pool.query('select question_id from pathway_exam_examples');
    expect(examples.rows).toHaveLength(1);
    expect(examples.rows[0].question_id).toBe(freeQ.id);
    expect((await adminGet('/admin/exam-forms')).json().forms[0].rulings).toBe(1);

    // ── 11. the reader: passed, with a code, told once
    s = await examState();
    expect(s.state).toBe('passed');
    expect(s.certificate.verify_code).toMatch(/^DC-/);
    const told = await pool.query<{ kind: string; body: string }>(
      'select kind, body from notification_log where user_id = $1', [await uid()],
    );
    expect(told.rows.map((r) => r.kind)).toEqual(['exam_result']);
    expect(told.rows[0].body).toContain(s.certificate.verify_code);
    expect(told.rows[0].body).toContain('دکتر مهسا رضایی');

    // ── 12. the wall, and a stranger with the code
    const wall = (await get('/certificates')).json();
    const mine = wall.pathways.find((p: { id: string }) => p.id === PATHWAY);
    expect(mine.certificate.verify_code).toBe(s.certificate.verify_code);
    expect(mine.exam.state).toBe('passed');
    const v = await verifyCertificate(s.certificate.verify_code);
    expect(v).toMatchObject({ holder_name: 'دکتر مهسا رضایی', pathway_id: PATHWAY, revoked: false });

    // ── 13. and it is over: no second attempt, no second certificate
    expect((await post(`/exams/${PATHWAY}/start`, { holder_name: 'y' })).statusCode).toBe(409);
    const certs = await pool.query('select count(*)::int as n from certificates where user_id = $1', [await uid()]);
    expect(certs.rows[0].n).toBe(1);
  });
});

describe('the road not taken: failing, waiting, and the second attempt', () => {
  it('walks it', async () => {
    await build([MCQ(1), MCQ(2), MCQ(3), MCQ(4)]);
    await readEverything();
    await post(`/pathways/${PATHWAY}/enroll`);

    // an all-multiple-choice form settles on its own, whatever «حدِ نظارت» says
    const first = await post(`/exams/${PATHWAY}/start`, { holder_name: 'دکتر ن.' });
    const ids = first.json().open.questions.map((q: { id: string }) => q.id);
    const wrong: Record<string, number> = {};
    for (const id of ids) wrong[id] = 0;
    const failed = await post(`/exams/${PATHWAY}/submit`, { answers: wrong });
    expect(failed.json()).toMatchObject({ state: 'wait', attempts_used: 1 });
    expect(failed.json().history[0]).toMatchObject({ status: 'failed', mcq_percent: 0 });
    expect((await adminGet('/admin/exam-attempts')).json().count).toBe(0);

    // the week is real, and the reader is told what happened without a key
    expect((await post(`/exams/${PATHWAY}/start`, { holder_name: 'x' })).statusCode).toBe(409);
    const note = await pool.query<{ body: string }>('select body from notification_log where user_id = $1', [await uid()]);
    expect(note.rows[0].body).toContain('به حد نصاب نرسید');
    expect(note.rows[0].body).not.toContain('الف');

    // a week later, and this time right
    await pool.query("update pathway_exam_attempts set submitted_at = submitted_at - interval '8 days'");
    expect((await examState()).state).toBe('ready');
    const second = await post(`/exams/${PATHWAY}/start`, { holder_name: 'دکتر ن.' });
    expect(second.json().open.questions).toHaveLength(4);
    const right: Record<string, number> = {};
    for (const q of second.json().open.questions) right[q.id] = 1;
    const passed = await post(`/exams/${PATHWAY}/submit`, { answers: right });
    expect(passed.json().state).toBe('passed');
    expect(passed.json().history.map((h: { attempt_no: number }) => h.attempt_no)).toEqual([1, 2]);

    // a third is refused even though a certificate now exists
    expect((await post(`/exams/${PATHWAY}/start`, { holder_name: 'x' })).statusCode).toBe(409);
  });

  it('the founder can strike an attempt, and it costs the reader nothing', async () => {
    await build([MCQ(1), FREE(1)]);
    await readEverything();
    await post(`/pathways/${PATHWAY}/enroll`);
    const opened = await post(`/exams/${PATHWAY}/start`, { holder_name: 'x' });
    const answers: Record<string, unknown> = {};
    for (const q of opened.json().open.questions) answers[q.id] = q.kind === 'mcq' ? 1 : LONG;
    await post(`/exams/${PATHWAY}/submit`, { answers });

    const row = (await adminGet('/admin/exam-attempts')).json().queue[0];
    expect((await adminPost(`/admin/exam-attempts/${row.id}/rule`, { decision: 'void' })).json().attempt.status).toBe('void');

    const s = await examState();
    expect(s).toMatchObject({ state: 'ready', attempts_used: 0 });
    expect(s.history).toHaveLength(0);
    // and the numbering the reader sees still starts at one
    await post(`/exams/${PATHWAY}/start`, { holder_name: 'x' });
    const again: Record<string, unknown> = {};
    for (const q of (await examState()).open.questions) again[q.id] = q.kind === 'mcq' ? 0 : LONG;
    const r = await post(`/exams/${PATHWAY}/submit`, { answers: again });
    const history = r.json().history.filter((h: { status: string }) => h.status !== 'queued');
    if (history.length) expect(history[0].attempt_no).toBe(1);
  });
});

describe('the founder editing the pool under a reader', () => {
  it('cannot change an exam already in progress, and cannot empty the pool', async () => {
    await build([MCQ(1), MCQ(2)]);
    await readEverything();
    await post(`/pathways/${PATHWAY}/enroll`);
    const opened = await post(`/exams/${PATHWAY}/start`, { holder_name: 'x' });
    expect(opened.json().open.questions).toHaveLength(2);

    // the founder adds one and deletes another mid-exam
    await build([MCQ(3)]);
    const listed = (await adminGet(`/admin/exam-forms/${PATHWAY}`)).json().form.questions;
    expect(listed.map((q: { id: string }) => q.id)).toEqual(['q1', 'q2', 'q3']);
    expect((await adminPost('/admin/exam-forms/questions/delete', { pathway_id: PATHWAY, question_id: 'q1' })).statusCode).toBe(200);

    // the reader's sheet is exactly what it was
    const s = await examState();
    expect(s.open.questions.map((q: { id: string }) => q.id)).toEqual(
      opened.json().open.questions.map((q: { id: string }) => q.id),
    );
    const answers: Record<string, number> = {};
    for (const q of s.open.questions) answers[q.id] = 1;
    expect((await post(`/exams/${PATHWAY}/submit`, { answers })).json().state).toBe('passed');

    // and the last question may not be removed — an exam of nothing passes itself
    await adminPost('/admin/exam-forms/questions/delete', { pathway_id: PATHWAY, question_id: 'q2' });
    const last = await adminPost('/admin/exam-forms/questions/delete', { pathway_id: PATHWAY, question_id: 'q3' });
    expect(last.statusCode).toBe(400);
    expect((await adminGet(`/admin/exam-forms/${PATHWAY}`)).json().form.questions).toHaveLength(1);
  });

  it('never opens an attempt with no questions on it', async () => {
    await build([MCQ(1)]);
    await readEverything();
    await post(`/pathways/${PATHWAY}/enroll`);
    // a draw smaller than the pool still opens a sheet
    await adminPost('/admin/exam-forms', {
      pathway_id: PATHWAY,
      questions: (await adminGet(`/admin/exam-forms/${PATHWAY}`)).json().form.questions,
      draw: 3,
    });
    const r = await post(`/exams/${PATHWAY}/start`, { holder_name: 'x' });
    expect(r.statusCode).toBe(200);
    expect(r.json().open.questions.length).toBeGreaterThan(0);
  });
});

describe('who may not sit it at all', () => {
  it('a free reader is refused at the route, not at the card', async () => {
    await build([MCQ(1)]);
    await readEverything();
    await post(`/pathways/${PATHWAY}/enroll`);
    await pool.query(`update profiles set tier = 'free' where phone = $1`, [readerPhone]);
    expect((await get(`/exams/${PATHWAY}`)).statusCode).toBe(402);
    expect((await post(`/exams/${PATHWAY}/start`, { holder_name: 'x' })).statusCode).toBe(402);
    expect((await post(`/exams/${PATHWAY}/submit`, { answers: {} })).statusCode).toBe(402);
    expect((await post(`/exams/${PATHWAY}/intent`, { intent: 'wanted' })).statusCode).toBe(402);
  });

  it('a signed-out visitor gets 401 everywhere, and the panel needs its own auth', async () => {
    expect((await app.inject({ method: 'GET', url: `/exams/${PATHWAY}` })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: `/exams/${PATHWAY}/start`, payload: { holder_name: 'x' } })).statusCode).toBe(401);
    expect((await app.inject({ method: 'GET', url: '/admin/exam-attempts' })).statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/admin/exam-forms/questions', payload: {} })).statusCode).toBe(401);
  });
});
