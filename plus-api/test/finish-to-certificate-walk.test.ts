// FINISHING A PATHWAY OPENS ITS EXAM, WHATEVER THE PLAN — walked as people.
//
// Founder, 1405/07/03: the pathway's arrangement (its order, its progress,
// which step is left) is what a subscription buys; the certificate attests to
// the reading and the exam. So a reader without a subscription who read a
// whole pathway with their own account may sit its exam — and is told how
// close they are, once, without ever being told WHICH steps are left.
//
// Every step goes through the surfaces a person uses and asserts both halves
// of the brief: the reader does not learn more than they should, and does not
// see less than they should. The pathway open to everybody («ارزیابی شواهد و
// استدلال بالینی») is walked too, to prove none of this touches it.
import {
  describe, it, expect, beforeEach, afterEach, afterAll, vi,
} from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import {
  getPathways, getPathwayById, applyRemotePathways, resetRemotePathways, MIN_CERTIFICATE_STEPS,
} from '../src/pathways.js';
import { announceOpenExams, runReaderPathwayNotices } from '../src/services/pathway-exams.js';
import { resetRateLimits } from '../src/services/rate-limit.js';

const PATHWAY = 'digital';
const OPEN_PATHWAY = 'evidence-literacy';
const STEPS = getPathwayById(PATHWAY)!.steps.map((s) => s.content_id);
const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  resetRateLimits();
  if (!app) app = await makeApp();
  config.payments.enabled = true;
});
afterEach(() => { resetRemotePathways(); vi.restoreAllMocks(); });
afterAll(async () => { await app?.close(); await pool.end(); });

const as = (cookie: string) => ({
  get: (url: string) => app.inject({ method: 'GET', url, headers: { cookie } }),
  post: (url: string, body: unknown = {}) => app.inject({ method: 'POST', url, headers: { cookie }, payload: body as object }),
});
const adminPost = (url: string, body: unknown) => app.inject({
  method: 'POST', url, headers: { authorization: basic }, payload: body as object,
});
async function uidOf(phone: string): Promise<string> {
  return (await pool.query<{ id: string }>('select id from profiles where phone = $1', [phone])).rows[0].id;
}
async function read(phone: string, ids: string[]): Promise<void> {
  const id = await uidOf(phone);
  for (const cid of ids) {
    await pool.query(`insert into user_activity (user_id, action, content_id) values ($1, 'article_completed', $2)`, [id, cid]);
  }
}
async function inbox(phone: string) {
  return (await pool.query<{ kind: string; title: string; body: string; url: string | null }>(
    'select kind, title, body, url from notification_log where user_id = $1 order by created_at', [await uidOf(phone)],
  )).rows;
}
/** What the nightly timer does for readers, in its order. */
async function night(): Promise<void> {
  await announceOpenExams();
  await runReaderPathwayNotices();
}
async function founderOpensExam(pathwayId = PATHWAY): Promise<void> {
  for (const n of [1, 2]) {
    const r = await adminPost('/admin/exam-forms/questions', {
      pathway_id: pathwayId,
      question: { kind: 'mcq', prompt_fa: `سؤال ${n}؟`, options: ['الف', 'ب', 'ج'], correct: 1 },
    });
    expect(r.statusCode).toBe(200);
  }
  expect((await adminPost('/admin/exam-forms/publish', { pathway_id: pathwayId })).statusCode).toBe(200);
}
async function sitAndPass(me: ReturnType<typeof as>, pathwayId = PATHWAY) {
  const st = await me.post(`/exams/${pathwayId}/start`, { holder_first_name: 'مهسا', holder_last_name: 'رضایی' });
  expect(st.statusCode).toBe(200);
  const answers = Object.fromEntries(st.json().open.questions.map((q: { id: string }) => [q.id, 1]));
  const done = await me.post(`/exams/${pathwayId}/submit`, { answers });
  expect(done.json().state).toBe('passed');
  return done.json();
}

/* ══════════════════════════════════════════════════════════════════════════ */

describe('a reader with no subscription', () => {
  it('walks from «two steps left» to a certificate, and never learns which steps', async () => {
    const phone = '09121400001';
    const me = as(await loginAs(app, phone));

    // ── The catalog: the pathway is there, locked, with HOW FAR but not WHERE.
    await read(phone, STEPS.slice(0, -2));
    const row = (await me.get('/pathways')).json().pathways.find((p: { id: string }) => p.id === PATHWAY);
    expect(row).toMatchObject({ open: false, completed_steps: STEPS.length - 2, total_steps: STEPS.length, current_step: null });
    expect(JSON.stringify(row)).not.toMatch(/content_id|"steps"/);
    // The pathway page stays the subscription's.
    expect((await me.get(`/pathways/${PATHWAY}`)).statusCode).toBe(402);
    // The exam: the same 402, saying which door, and nothing else.
    const locked = await me.get(`/exams/${PATHWAY}`);
    expect(locked.statusCode).toBe(402);
    expect(Object.keys(locked.json()).sort()).toEqual(['error', 'message', 'reason']);

    // ── The night: «two steps left», once, pointing at the exam page.
    await night();
    let box = await inbox(phone);
    expect(box).toHaveLength(1);
    expect(box[0]).toMatchObject({ kind: 'pathway_progress', url: `/plus/exam.html?id=${PATHWAY}` });
    expect(box[0].body).toContain('فقط ۲ قدم');
    for (const cid of STEPS) expect(box[0].body).not.toContain(cid);
    await night();
    expect(await inbox(phone)).toHaveLength(1);

    // ── They finish. No exam yet: told they finished, and that they will hear.
    await read(phone, STEPS.slice(-2));
    await night();
    box = await inbox(phone);
    expect(box).toHaveLength(2);
    expect(box[1].body).toContain("هنوز آماده نیست");
    const wall = async () => (await me.get('/certificates')).json().pathways.find((p: { id: string }) => p.id === PATHWAY);
    expect((await wall()).exam.state).toBe('no_form');

    // ── The founder opens the exam: told the same day, once.
    await founderOpensExam();
    box = await inbox(phone);
    expect(box).toHaveLength(3);
    expect(box[2]).toMatchObject({ kind: 'exam_assigned' });
    expect(box[2].body).toContain('هر وقت خواستی شروع کن');
    expect(box[2].body).not.toContain('اشتراک');
    await night();
    expect(await inbox(phone)).toHaveLength(3);

    // ── Every surface agrees the door is open, and the page will not send
    //    them into the pathway page they cannot open.
    expect((await wall()).exam.state).toBe('ready');
    const s = (await me.get(`/exams/${PATHWAY}`)).json();
    expect(s).toMatchObject({ state: 'ready', pathway_open: false, discount: { percent: 10, first_purchase: false } });

    // ── They sit it and pass: a certificate, and ٪۱۰ off their first purchase.
    const passed = await sitAndPass(me);
    expect(passed.certificate.verify_code).toMatch(/^DC-/);
    box = await inbox(phone);
    expect(box[box.length - 1].body).toContain('۱۰٪ تخفیف');
    const verify = await app.inject({ method: 'GET', url: `/certificates/verify/${passed.certificate.verify_code}` });
    expect(verify.statusCode).toBe(200);
    const plans = (await me.get('/pay/plans')).json();
    expect(plans.onetime_discount).toMatchObject({ percent: 10, first_purchase_percent: 0 });

    // ── And the pathway page is still the subscription's.
    expect((await me.get(`/pathways/${PATHWAY}`)).statusCode).toBe(402);
    expect((await wall()).certificate.verify_code).toBe(passed.certificate.verify_code);
  });

  it('one short of the end: no exam, no «done», and nothing written on their behalf', async () => {
    const phone = '09121400002';
    const me = as(await loginAs(app, phone));
    await founderOpensExam();
    await read(phone, STEPS.slice(0, -1));
    await night();
    const box = await inbox(phone);
    expect(box).toHaveLength(1);
    expect(box[0].body).toContain('فقط یک قدم');
    expect((await me.get(`/exams/${PATHWAY}`)).statusCode).toBe(402);
    expect((await me.post(`/exams/${PATHWAY}/intent`, { intent: 'wanted' })).statusCode).toBe(402);
    expect((await pool.query('select 1 from user_pathways where user_id = $1', [await uidOf(phone)])).rowCount).toBe(0);
  });

  it('reading logged out leaves no record — so the rule reaches only signed-in reading', async () => {
    const phone = '09121400003';
    const me = as(await loginAs(app, phone));
    await founderOpensExam();
    await night();
    expect(await inbox(phone)).toHaveLength(0);
    expect((await me.get(`/exams/${PATHWAY}`)).statusCode).toBe(402);
  });
});

describe('a subscriber', () => {
  it('sees the whole pathway, gets no progress notices, and finishing is enough — no «شروع» needed', async () => {
    const phone = '09121400004';
    const me = as(await loginAs(app, phone));
    await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
    const page = (await me.get(`/pathways/${PATHWAY}`)).json();
    expect(page.steps).toHaveLength(STEPS.length); // the arrangement is theirs
    expect((await me.get('/pathways')).json().pathways.find((p: { id: string }) => p.id === PATHWAY).current_step).toBe(0);

    await read(phone, STEPS.slice(0, -2));
    await night();
    expect(await inbox(phone)).toHaveLength(0); // they have the page

    await read(phone, STEPS.slice(-2));
    await founderOpensExam();
    const box = await inbox(phone);
    expect(box.map((n) => n.kind)).toEqual(['exam_assigned']); // told, unasked
    expect((await me.get(`/exams/${PATHWAY}`)).json()).toMatchObject({ state: 'ready', pathway_open: true });
    await sitAndPass(me);
  });
});

describe('the pathway open to everybody is untouched', () => {
  it('as shipped: a free reader opens it, its exam reads «pending», and no reader notice ever fires for it', async () => {
    const phone = '09121400005';
    const me = as(await loginAs(app, phone));
    expect((await me.get(`/pathways/${OPEN_PATHWAY}`)).statusCode).toBe(200);
    expect((await me.get(`/exams/${OPEN_PATHWAY}`)).json()).toMatchObject({ ok: true, state: 'pending' });
    await read(phone, getPathwayById(OPEN_PATHWAY)!.steps.map((s) => s.content_id));
    await night();
    expect(await inbox(phone)).toHaveLength(0);
  });

  it('once released: sat without finishing-as-a-door, ٪۲۰ whole on a first purchase, and still no progress notice', async () => {
    const raw = JSON.parse(JSON.stringify(getPathways())) as Array<{ id: string; certificate?: string; steps: { content_id: string; milestone?: boolean }[] }>;
    const p = raw.find((x) => x.id === OPEN_PATHWAY)!;
    delete p.certificate;
    const extra = raw.find((x) => x.id === PATHWAY)!.steps.filter((s) => !p.steps.some((t) => t.content_id === s.content_id));
    while (p.steps.length < MIN_CERTIFICATE_STEPS) p.steps.push({ ...extra.shift()!, milestone: false });
    expect(applyRemotePathways(raw)).toBe(true);

    const phone = '09121400006';
    const me = as(await loginAs(app, phone));
    const ids = p.steps.map((s) => s.content_id);
    await read(phone, ids.slice(0, -1));
    await founderOpensExam(OPEN_PATHWAY);
    await night();
    expect((await inbox(phone)).filter((n) => n.kind === 'pathway_progress')).toHaveLength(0);
    // The page is theirs, so the exam's own rule applies: enrol, finish, sit.
    const s0 = (await me.get(`/exams/${OPEN_PATHWAY}`)).json();
    expect(s0).toMatchObject({ state: 'locked', pathway_open: true, discount: { percent: 20, first_purchase: true } });
    await read(phone, ids.slice(-1));
    expect((await me.get(`/exams/${OPEN_PATHWAY}`)).json().state).toBe('ready');
    await sitAndPass(me, OPEN_PATHWAY);
    expect((await me.get('/pay/plans')).json().onetime_discount).toMatchObject({ percent: 20, first_purchase_percent: 20 });
  });
});
