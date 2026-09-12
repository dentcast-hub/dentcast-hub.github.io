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
import { getPathwayById } from '../src/pathways.js';
import {
  normalizeQuestions, upsertForm, getForm, deleteForm, formRoster, assignExam,
  examState, startAttempt, submitAttempt, ruleAttempt, queueRows, attemptRoster, getAttempt,
  drawQuestions, tally, type ExamQuestion,
} from '../src/services/pathway-exams.js';
import { issueCertificate, listCertificates } from '../src/services/certificates.js';
import { availableCredits } from '../src/services/discount-credits.js';
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
    const { form, created } = await upsertForm(PATHWAY, { questions: [MCQ(1), FREE(1)] });
    expect(created).toBe(true);
    expect(form).toMatchObject({ pass_percent: 70, max_attempts: 2, retry_days: 7, supervised_until: 5, mcq_draw: 0, free_draw: 0 });

    const again = await upsertForm(PATHWAY, { questions: [MCQ(1)], mcqDraw: 1, passPercent: 80, note: ' n ' });
    expect(again.created).toBe(false);
    expect(again.form.id).toBe(form.id);
    expect(again.form).toMatchObject({ pass_percent: 80, mcq_draw: 1, note: 'n' });
    expect(again.form.questions).toHaveLength(1);
  });

  it('refuses a bundle and a bad paste, writing nothing', async () => {
    await expect(upsertForm(BUNDLE_ID, { questions: [MCQ(1)] })).rejects.toThrow('unknown_pathway');
    await expect(upsertForm(PATHWAY, { questions: [{ q: 'x' }] })).rejects.toThrow(/^invalid_questions:/);
    expect(await getForm(PATHWAY)).toBeNull();
  });

  it('is listed with its counts, and the panel route round-trips the founder\'s numbers', async () => {
    const res = await adminPost('/admin/exam-forms', {
      pathway_id: PATHWAY, questions: [MCQ(1), MCQ(2), FREE(1)], mcq_draw: 1, retry_days: 0, supervised_until: 0,
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().form.questions).toHaveLength(3);

    const list = await adminGet('/admin/exam-forms');
    expect(list.json().forms).toHaveLength(1);
    expect(list.json().forms[0]).toMatchObject({
      pathway_id: PATHWAY, mcq_count: 2, free_count: 1, mcq_draw: 1, rulings: 0, retry_days: 0,
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

/* --------------------------------------------------------- eligibility -- */

describe('who may sit it', () => {
  it('no form → no_form; a form but neither finished nor assigned → locked; finished → ready; assigned → ready', async () => {
    const uid = await userId();
    expect((await examState(uid, PATHWAY)).state).toBe('no_form');

    await upsertForm(PATHWAY, { questions: [MCQ(1)] });
    const locked = await examState(uid, PATHWAY);
    expect(locked.state).toBe('locked');
    expect(locked.rules).toMatchObject({ question_count: 1, mcq_count: 1, free_count: 0, pass_percent: 70 });
    expect(locked.is_complete).toBe(false);

    await assignExam(uid, PATHWAY);
    expect((await examState(uid, PATHWAY)).state).toBe('ready');
  });

  it('finishing the pathway is the other door', async () => {
    const uid = await userId();
    await upsertForm(PATHWAY, { questions: [MCQ(1)] });
    await finish(uid);
    const s = await examState(uid, PATHWAY);
    expect(s.state).toBe('ready');
    expect(s.is_complete).toBe(true);
    expect(s.assigned).toBe(false);
  });

  it('tells a reader let in early when the form finally appears — and only then, once', async () => {
    const uid = await userId();
    const early = await adminPost('/admin/exams', { phone, pathway_id: PATHWAY });
    expect(early.json().has_form).toBe(false);
    expect(await notices(uid)).toHaveLength(0); // nothing to sit yet — no notice

    const created = await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions: [MCQ(1)] });
    expect(created.json().notified).toBe(1);
    const n = await notices(uid);
    expect(n).toHaveLength(1);
    expect(n[0].kind).toBe('exam_assigned');
    expect(n[0].body).toContain(getPathwayById(PATHWAY)!.title_fa);

    // editing the form is not news; assigning AFTER the form is, once
    const edited = await adminPost('/admin/exam-forms', { pathway_id: PATHWAY, questions: [MCQ(1), MCQ(2)] });
    expect(edited.json().notified).toBe(0);
    await loginAs(app, '09121200097');
    const late = await adminPost('/admin/exams', { phone: '09121200097', pathway_id: PATHWAY });
    expect(late.json().has_form).toBe(true);
    expect(await notices(await userId('09121200097'))).toHaveLength(1);
    expect(await notices(uid)).toHaveLength(1);
  });

  it('is premium: 401 signed out, 402 free, and a bundle is 404', async () => {
    expect((await app.inject({ method: 'GET', url: `/exams/${PATHWAY}` })).statusCode).toBe(401);
    await pool.query(`update profiles set tier = 'free' where phone = $1`, [phone]);
    expect((await get(`/exams/${PATHWAY}`)).statusCode).toBe(402);
    await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
    expect((await get(`/exams/${BUNDLE_ID}`)).statusCode).toBe(404);
    expect((await get(`/exams/${PATHWAY}`)).json()).toMatchObject({ ok: true, state: 'no_form' });
  });

  it('a certificate already held (issued by hand) reads as passed', async () => {
    const uid = await userId();
    await upsertForm(PATHWAY, { questions: [MCQ(1)] });
    await issueCertificate(uid, PATHWAY, { holderName: 'x', notify: false });
    const s = await examState(uid, PATHWAY);
    expect(s.state).toBe('passed');
    expect(s.certificate!.verify_url).toMatch(/^\/plus\/certificate\.html\?c=DC-/);
  });
});

/* ------------------------------------------------------------ the draw -- */

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
    await upsertForm(PATHWAY, { questions: [MCQ(1), MCQ(2), MCQ(3), FREE(1), FREE(2)], mcqDraw: 2, freeDraw: 1 });
    await assignExam(uid, PATHWAY);

    const locked = await post(`/exams/${PATHWAY}/start`, { holder_name: '   ' });
    expect(locked.statusCode).toBe(400);

    const r = await post(`/exams/${PATHWAY}/start`, { holder_name: 'دکتر آزمایشی' });
    expect(r.statusCode).toBe(200);
    const s = r.json();
    expect(s.state).toBe('open');
    expect(s.open.holder_name).toBe('دکتر آزمایشی');
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
    expect(again.json().open.holder_name).toBe('دکتر آزمایشی');
    expect(await attemptRoster()).toHaveLength(1);
  });

  it('refuses to start when locked', async () => {
    const uid = await userId();
    await upsertForm(PATHWAY, { questions: [MCQ(1)] });
    const r = await startAttempt(uid, PATHWAY, 'x');
    expect(r.ok).toBe(false);
    expect(r.state.state).toBe('locked');
  });
});

/* --------------------------------------------------------- submitting -- */

describe('submitting', () => {
  it('refuses an incomplete sheet by question id and keeps the attempt open', async () => {
    const uid = await userId();
    await upsertForm(PATHWAY, { questions: [MCQ(1), FREE(1)] });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'x');

    const r = await post(`/exams/${PATHWAY}/submit`, { answers: { m1: 1, f1: 'کوتاه' } });
    expect(r.statusCode).toBe(400);
    expect(r.json()).toMatchObject({ error: 'incomplete', missing: ['f1'] });
    const r2 = await post(`/exams/${PATHWAY}/submit`, { answers: { m1: 9, f1: LONG } });
    expect(r2.json().missing).toEqual(['m1']);
    expect((await examState(uid, PATHWAY)).state).toBe('open');
  });

  it('with no open attempt is 409', async () => {
    await upsertForm(PATHWAY, { questions: [MCQ(1)] });
    const r = await post(`/exams/${PATHWAY}/submit`, { answers: {} });
    expect(r.statusCode).toBe(409);
    expect(r.json().error).toBe('no_open_attempt');
  });

  it('multiple choice settles on its own: a pass issues the certificate, the credit and the notice in one act', async () => {
    const uid = await userId();
    await upsertForm(PATHWAY, { questions: [MCQ(1), MCQ(2), MCQ(3)] }); // 2/3 = 67 < 70 fails; 3/3 passes
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'دکتر ن.');

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
    expect(certs[0].holder_name).toBe('دکتر ن.');
    expect(certs[0].attempt_id).toBe(s.history[0].id);
    expect((await availableCredits(uid)).find((c) => c.kind === 'grant')?.percent).toBe(10);

    const n = await notices(uid);
    expect(n.map((x) => x.kind)).toEqual(['exam_result']); // one message, not the certificate's too
    expect(n[0].body).toContain(certs[0].verify_code);
    expect(n[0].body).toContain('دکتر ن.');

    const row = (await attemptRoster())[0];
    expect(row).toMatchObject({ status: 'passed', settled_by: 'ai', attempt_no: 1 });
  });

  it('a fail below 70% waits a week, a second attempt draws the unseen questions, and the third is refused', async () => {
    const uid = await userId();
    await upsertForm(PATHWAY, { questions: [MCQ(1), MCQ(2), MCQ(3), MCQ(4)], mcqDraw: 2 });
    await assignExam(uid, PATHWAY);
    const first = await startAttempt(uid, PATHWAY, 'x');
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

    const tooSoon = await post(`/exams/${PATHWAY}/start`, { holder_name: 'x' });
    expect(tooSoon.statusCode).toBe(409);
    expect(tooSoon.json().state).toBe('wait');

    // a week later
    await pool.query(`update pathway_exam_attempts set submitted_at = submitted_at - interval '8 days'`);
    expect((await examState(uid, PATHWAY)).state).toBe('ready');
    const second = await startAttempt(uid, PATHWAY, 'x');
    expect(second.ok).toBe(true);
    const drawn2 = second.ok ? second.attempt.questions.map((q) => q.id) : [];
    expect(second.ok && second.attempt.attempt_no).toBe(2);
    expect(drawn2.some((id) => drawn1.includes(id))).toBe(false);

    const r2 = await post(`/exams/${PATHWAY}/submit`, { answers: Object.fromEntries(drawn2.map((id) => [id, 0])) });
    expect(r2.json().state).toBe('exhausted');
    expect(r2.json().attempts_used).toBe(2);
    expect((await examState(uid, PATHWAY)).state).toBe('exhausted');
  });

  it('is rate limited per reader', async () => {
    await upsertForm(PATHWAY, { questions: [MCQ(1)] });
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
    await upsertForm(PATHWAY, { questions: [MCQ(1), FREE(1)], supervisedUntil: 0 });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'x');

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
    await upsertForm(PATHWAY, { questions: [FREE(1), FREE(2)], supervisedUntil: 0 });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'دکتر ن.');
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
    await upsertForm(PATHWAY, { questions: [FREE(1)], supervisedUntil: 0 });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'x');
    vi.spyOn(ai, 'matchKeyPoints')
      .mockResolvedValueOnce(FREE(1).kind === 'free' ? (FREE(1) as { key_points: { id: string }[] }).key_points.map((k) => ({ id: k.id, state: 'covered' as const })) : [])
      .mockResolvedValueOnce([{ id: 'f1-k1', state: 'covered' }, { id: 'f1-k2', state: 'missing' }, { id: 'f1-k3', state: 'covered' }]);

    const r = await post(`/exams/${PATHWAY}/submit`, { answers: { f1: LONG } });
    expect(r.json().state).toBe('queued');
    expect((await queueRows())[0].ai_tally).toBeNull();
  });

  it('a confident fail below 70% settles as failed, with the reader told how many points landed', async () => {
    const uid = await userId();
    await upsertForm(PATHWAY, { questions: [FREE(1)], supervisedUntil: 0 });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'x');
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
    await upsertForm(PATHWAY, { questions: [MCQ(1), FREE(1)] }); // supervised_until 5
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'x');
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
    await upsertForm(PATHWAY, { questions: [MCQ(1), FREE(1)] });
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
      decision: 'pass', holder_name: 'دکتر نهایی',
      free: [{ id: 'f1', points: [{ id: 'f1-k1', state: 'covered' }, { id: 'f1-k2', state: 'covered' }, { id: 'f1-k3', state: 'missing' }] }],
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().attempt).toMatchObject({
      status: 'passed', settled_by: 'founder', holder_name: 'دکتر نهایی', free_covered: 2, free_total: 3, mcq_correct: 1,
    });
    const certs = await listCertificates(uid);
    expect(certs[0].holder_name).toBe('دکتر نهایی');
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
    await startAttempt(uid2, PATHWAY, 'y');
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
    const next = await startAttempt(uid, PATHWAY, 'x');
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
    expect(res.json().queue[0].questions[0].correct).toBe(1);   // the founder sees the key…
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
    await upsertForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'x');
    const manual = await issueCertificate(uid, PATHWAY, { holderName: 'دستی', notify: false });
    await submitAttempt(uid, PATHWAY, { m1: 1 });
    const certs = await listCertificates(uid);
    expect(certs).toHaveLength(1);
    expect(certs[0].verify_code).toBe(manual.certificate.verify_code);
  });

  it('deleting the form takes its attempts and examples, leaves the certificate (attempt_id nulled)', async () => {
    const uid = await userId();
    await upsertForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'x');
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
    await upsertForm(PATHWAY, { questions: [MCQ(1)] });
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
    await upsertForm(PATHWAY, { questions: [MCQ(1)] });
    await assignExam(a, PATHWAY);
    await assignExam(b, PATHWAY);
    await startAttempt(a, PATHWAY, 'a'); await submitAttempt(a, PATHWAY, { m1: 0 });
    await startAttempt(b, PATHWAY, 'b'); await submitAttempt(b, PATHWAY, { m1: 0 });
    await withTransaction((c) => mergeProfiles(c, b, a));
    const rows = await pool.query('select user_id, attempt_no from pathway_exam_attempts');
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toMatchObject({ user_id: a, attempt_no: 1 });
  });

  it('a submit that lands while the founder is ruling does not double-settle', async () => {
    const uid = await userId();
    await upsertForm(PATHWAY, { questions: [FREE(1)], supervisedUntil: 0 });
    await assignExam(uid, PATHWAY);
    await startAttempt(uid, PATHWAY, 'x');
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
