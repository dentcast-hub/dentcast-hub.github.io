/**
 * END-TO-END WALK of the dual-source article pool (founder, 1405/08/03):
 *
 *   «وقتی من یه پستی می‌ذارم از انواع مختلف، سوالش میره توی مخزنِ همون
 *   مسیر؛ و وقتی هم که توی ادمین می‌ذارم، اون هم میره.»
 *
 * One real step per content TYPE (chairside, dentai, dentcast-plus, episodes,
 * insight, metanotes, notecast, photocast, sharehub, taraz) is taken from the
 * live plus/pathways.json. For each, a question is "published" into the repo
 * file (what workflow step 4.12-ب commits) AND a question is posted through
 * the panel door (POST /admin/content-questions). Then every full pathway is
 * checked: the ones that carry the step draw BOTH questions; the ones that do
 * not, draw neither. A glossary term, which is in no pathway, feeds nothing.
 * Finally a reader sits an exam on one pathway and the drawn sheet carries
 * both. The table is printed so the walk can be read, not just trusted.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getPathways, getPathwayById } from '../src/pathways.js';
import {
  contentQuestionsFor, contentQuestionCount, upsertForm, publishForm, examState, startAttempt, formRoster,
} from '../src/services/pathway-exams.js';
import { applyRemoteExamQuestions, resetRemoteExamQuestions } from '../src/exam-questions.js';

let app: FastifyInstance;
let cookie: string;
const phone = '09121200999';
const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

/** One real pathway step per content type, chosen from the live file. */
function stepPerType(): Map<string, string> {
  const seen = new Map<string, string>();
  for (const p of getPathways()) {
    if (p.kind === 'bundle') continue;
    for (const st of p.steps) {
      const type = st.content_id.split('/')[0];
      if (!seen.has(type)) seen.set(type, st.content_id);
    }
  }
  return seen;
}

const pathwaysOf = (cid: string) => getPathways().filter((p) => p.kind !== 'bundle' && p.steps.some((s) => s.content_id === cid)).map((p) => p.id);
const slug = (cid: string) => cid.replace(/[^a-z0-9]/g, '');
const mcq = (id: string, label: string) => ({ id, kind: 'mcq', prompt_fa: `سؤالِ ${label}`, options: ['الف', 'ب', 'ج', 'د'], correct: 1 });

beforeAll(async () => {
  await resetDb();
  app = await makeApp();
  cookie = await loginAs(app, phone);
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
});
afterAll(async () => { resetRemoteExamQuestions(); await app?.close(); await pool.end(); });

describe('a question published with a post, and one typed in the panel, both land in every pathway that carries the post', () => {
  it('walks one step of every content type', async () => {
    const steps = stepPerType();
    expect(steps.size).toBeGreaterThanOrEqual(8);
    const glossary = 'glossary/abutment';
    expect(pathwaysOf(glossary)).toEqual([]);

    // ① "Publish": the repo file carries one question per step (+ one for the glossary term).
    const byContent: Record<string, { questions: unknown[] }> = {};
    for (const [type, cid] of steps) byContent[cid] = { questions: [mcq(`r-${slug(cid)}`, `ریپو ${type}`)] };
    byContent[glossary] = { questions: [mcq(`r-${slug(glossary)}`, 'ریپو glossary')] };
    expect(applyRemoteExamQuestions({ version: 1, byContent })).toBe(true);

    // ② "Panel": the founder types one question per step through the admin door.
    const adminIds = new Map<string, string>();
    for (const [type, cid] of steps) {
      const r = await app.inject({
        method: 'POST', url: '/admin/content-questions', headers: { authorization: basic },
        payload: { content_id: cid, question: { kind: 'mcq', prompt_fa: `سؤالِ ادمین ${type}`, options: ['الف', 'ب', 'ج', 'د'], correct: 0 } },
      });
      expect(r.statusCode, `${cid}: ${r.body}`).toBe(200);
      expect(r.json().pathways.map((p: { id: string }) => p.id)).toEqual(pathwaysOf(cid));
      adminIds.set(cid, r.json().question.id);
      // The panel's list shows both, the repo one read-only.
      const list = await app.inject({ method: 'GET', url: `/admin/content-questions?content=${encodeURIComponent(cid)}`, headers: { authorization: basic } });
      expect(list.json().questions.map((q: { question: { id: string } }) => q.question.id)).toEqual([r.json().question.id]);
      expect(list.json().repo_questions.map((q: { id: string }) => q.id)).toEqual([`r-${slug(cid)}`]);
    }

    // ③ Every full pathway: carries the step ⇒ draws both; does not ⇒ draws neither.
    const rows: string[] = [];
    for (const p of getPathways()) {
      if (p.kind === 'bundle') continue;
      const ids = new Set((await contentQuestionsFor(p)).map((q) => q.id));
      let expected = 0;
      for (const [type, cid] of steps) {
        const carries = p.steps.some((s) => s.content_id === cid);
        expect(ids.has(`r-${slug(cid)}`), `${p.id} / repo ${type}`).toBe(carries);
        expect(ids.has(adminIds.get(cid)!), `${p.id} / admin ${type}`).toBe(carries);
        if (carries) expected += 2;
      }
      expect(ids.has(`r-${slug(glossary)}`), `${p.id} / glossary`).toBe(false);
      expect(await contentQuestionCount(p)).toBe(expected);
      rows.push(`${p.id.padEnd(24)} ${String(expected).padStart(3)}  ← ${[...steps].filter(([, cid]) => p.steps.some((s) => s.content_id === cid)).map(([t]) => t).join(', ') || '—'}`);
    }
    // eslint-disable-next-line no-console
    console.log(['pathway                  pool  from (one repo + one admin question per type)', ...rows].join('\n'));

    // ④ A reader sits the exam on the pathway that carries the most of them: the sheet holds both kinds.
    const best = getPathways().filter((p) => p.kind !== 'bundle')
      .sort((a, b) => [...steps.values()].filter((c) => b.steps.some((s) => s.content_id === c)).length
        - [...steps.values()].filter((c) => a.steps.some((s) => s.content_id === c)).length)[0];
    await upsertForm(best.id, { questions: [{ kind: 'mcq', prompt_fa: 'سؤالِ خودِ مسیر', options: ['الف', 'ب'], correct: 0 }], draw: 0 });
    await publishForm(best.id);
    const uid = (await pool.query<{ id: string }>('select id from profiles where phone = $1', [phone])).rows[0].id;
    await pool.query(`insert into user_pathways (user_id, pathway_id, current_step) values ($1, $2, 0)`, [uid, best.id]);
    for (const st of getPathwayById(best.id)!.steps) {
      await pool.query(`insert into user_activity (user_id, action, content_id) values ($1, 'article_completed', $2)`, [uid, st.content_id]);
    }
    const state = await examState(uid, best.id);
    const carried = [...steps.values()].filter((c) => best.steps.some((s) => s.content_id === c));
    expect(state.state).toBe('ready');
    expect(state.rules!.question_count).toBe(1 + carried.length * 2);
    expect((await formRoster()).find((f) => f.pathway_id === best.id)!.content_count).toBe(carried.length * 2);
    const started = await startAttempt(uid, best.id, 'سارا احمدی');
    expect(started.ok).toBe(true);
    const drawn = started.ok ? started.attempt.questions.map((q) => q.id) : [];
    for (const cid of carried) {
      expect(drawn).toContain(`r-${slug(cid)}`);
      expect(drawn).toContain(adminIds.get(cid)!);
    }
    // eslint-disable-next-line no-console
    console.log(`reader sat «${best.title_fa}»: ${drawn.length} questions on the sheet = 1 form + ${carried.length} repo + ${carried.length} admin`);
  });
});
