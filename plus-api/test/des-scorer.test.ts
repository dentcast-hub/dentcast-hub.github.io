import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { validateSubmission } from '../src/services/des-gate.js';
import {
  keyHash, allDois, allPmids, paperScope, pickIdentifier,
} from '../src/services/des-identity.js';
import { createPaper, nearDuplicates } from '../src/services/des-library.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  phone = '09121200005';
  cookie = await loginAs(app, phone);
  await pool.query('update profiles set tier = $2 where phone = $1', [phone, 'premium']);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

function submit(payload: Record<string, unknown>) {
  return app.inject({ method: 'POST', url: '/des/submit', headers: { cookie }, payload });
}

function adminAnswer(id: string, payload: Record<string, unknown>) {
  return app.inject({
    method: 'POST', url: `/admin/des/${id}/answer`, headers: { authorization: basic }, payload,
  });
}

/* ---------------------------------------------------------- fixtures ---- */

const TITLE = 'Smoking in relation to early dental implant failure: a systematic review and meta-analysis';

const ABSTRACT_FA = 'کارآزمایی بالینی تصادفی‌شده‌ی دوسوکور. هشتاد و چهار بیمار به‌طور تصادفی به دو گروه '
  + 'درمان یک‌جلسه‌ای و چندجلسه‌ای تخصیص یافتند و درد پس از درمان در ۲۴ و ۴۸ ساعت و یک هفته با مقیاس VAS '
  + 'ثبت شد. تخصیص با جدول اعداد تصادفی رایانه‌ای انجام شد و ارزیابان پیامد نسبت به گروه‌بندی ناآگاه بودند. '
  + 'میانگین درد در گروه یک‌جلسه‌ای در ۲۴ ساعت بالاتر بود اما این تفاوت در یک هفته از بین رفت و نتایج نشان '
  + 'داد که تفاوت معناداری بین دو روش در پیگیری یک‌هفته‌ای وجود ندارد و هر دو رویکرد قابل قبول است.';

const ENGLISH_ABSTRACT = [
  'Objective: To assess the association between smoking and early dental implant failure.',
  'Methods: Five databases were searched without language restriction. Eighty-four patients were',
  'randomized to single-visit or multiple-visit treatment using a computer-generated randomization',
  'table with sealed opaque envelopes; outcome assessors were blinded to group allocation.',
  'Postoperative pain was recorded on a 0-10 visual analogue scale at 24 hours, 48 hours and one week.',
  'Results: Mean VAS score at 24 hours was 3.8 (SD 1.9) in the single-visit group and 2.6 (SD 1.7) in',
  'the multiple-visit group (p = 0.014, 95% CI 0.25 to 2.15). The difference was no longer statistically',
  'significant at one week. Analgesic consumption was higher in the single-visit group. No serious',
  'adverse events were reported among the eighty-four patients enrolled in this cohort.',
  'Conclusions: Single-visit treatment was associated with greater pain on the first day, but both',
  'approaches produced comparable outcomes by the end of the first week of follow-up in this trial.',
].join(' ');

const JUNK_FA = 'خیلی از دوستان می‌پرسند بهترین راه از بین بردن پوسیدگی چیست. تجربه‌ی شخصی من نشان داده '
  + 'ترکیب روغن نارگیل و جوش شیرین معجزه می‌کند و ظرف چند هفته اثرش را می‌بینید. من خودم این روش را به '
  + 'ده‌ها نفر معرفی کرده‌ام و همه راضی بودند. کافی است هر شب قبل از خواب این کار را تکرار کنید و از '
  + 'مصرف شیرینی پرهیز کنید که نتیجه‌اش را به‌زودی خواهید دید و دیگر نیازی به دندان‌پزشک نخواهید داشت.';

function goodRecord(overrides: Record<string, unknown> = {}) {
  return {
    des_version: '2.2',
    content_type: 'RESEARCH',
    question_type: 'ETIOLOGY',
    text_basis: 'FULL_TEXT',
    citation: {
      title: TITLE, authors: 'Fan YY, Li S, Cai YJ, Wei T, Ye P', year: 2024,
      journal: 'Journal of Dentistry', doi: '10.1016/j.jdent.2024.105396',
    },
    s_design: { value: 100, anchor: 'SR/meta-analysis', evidence_quote: 'x' },
    q_method: {
      tool: 'AMSTAR-2',
      domains: [
        { domain: 'protocol registered', rating: 'low', evidence_quote: 'x' },
        { domain: 'literature search', rating: 'low', evidence_quote: 'x' },
        { domain: 'excluded studies', rating: 'some_concerns', evidence_quote: 'x' },
        { domain: 'risk of bias', rating: 'low', evidence_quote: 'x' },
        { domain: 'meta-analytical methods', rating: 'low', evidence_quote: 'x' },
        { domain: 'publication bias', rating: 'low', evidence_quote: 'x' },
      ],
      multiplier: 0.8,
    },
    penalties: [
      { item: 'conflict of interest / commercial funding', base_points: 8, points: 0, note: 'disclosed' },
      { item: 'prospective registration (RCTs only)', base_points: 5, points: 0, note: 'not applicable to a systematic review' },
      { item: 'sample size justification', base_points: 5, points: 0, note: 'not applicable to a secondary study' },
      { item: 'insufficient follow-up duration', base_points: 3, points: 0, note: 'not applicable' },
    ],
    commentary_checklist: null,
    des_score: 80,
    band: 'A',
    provisional: false,
    fact_fa: 'این مقاله نمره 80 از 100 را در سطح شواهد A کسب می‌کند.',
    interpretation_fa: 'این متاآنالیز با پروتکل ثبت‌شده و جستجوی جامع نشان می‌دهد سیگار کشیدن ریسک را بالا می‌برد.',
    ...overrides,
  };
}

describe('the free gate (validateSubmission) — generous, not strict', () => {
  it('#1 stops on an empty title', () => {
    const r = validateSubmission({ title: '', body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY', hasPdf: false });
    expect(r.stop).toBe(true);
  });

  it('#2 stops on a 6-word body with no PDF tick', () => {
    const r = validateSubmission({
      title: TITLE, body: 'یک جمله‌ی کوتاه دربارهٔ درمان ریشه است', claim: 'ABSTRACT_ONLY', hasPdf: false,
    });
    expect(r.stop).toBe(true);
  });

  it('#3 stops on a long body with zero research signal', () => {
    const r = validateSubmission({ title: 'درمان قطعی پوسیدگی با روش خانگی', body: JUNK_FA, claim: 'ABSTRACT_ONLY', hasPdf: false });
    expect(r.stop).toBe(true);
  });

  it('#4 [regression] accepts a fully English abstract', () => {
    const r = validateSubmission({ title: TITLE, body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY', hasPdf: false });
    expect(r.stop).toBe(false);
  });

  it('#5 accepts a PDF-ticked submission with no body', () => {
    const r = validateSubmission({ title: TITLE, body: '', claim: 'ABSTRACT_ONLY', hasPdf: true });
    expect(r.stop).toBe(false);
  });

  it('#6 warns (does not stop) when FULL_TEXT is claimed for a short body', () => {
    const r = validateSubmission({ title: TITLE, body: ABSTRACT_FA, claim: 'FULL_TEXT', hasPdf: false });
    expect(r.stop).toBe(false);
    expect(r.issues.some((i) => i.severity === 'warn' && /اندازه‌ی یک چکیده/.test(i.message))).toBe(true);
  });
});

/* ======================================================== identity ===== */

describe('identity keys — pure functions', () => {
  it('#8 ZWNJ / space / joined spellings of one title hit the same key', () => {
    const base = keyHash('مرور نظام‌مند سیگار و شکست ایمپلنت');
    expect(keyHash('مرور نظام مند سیگار و شکست ایمپلنت')).toBe(base);
    expect(keyHash('مرور نظاممند سیگار و شکست ایمپلنت')).toBe(base);
  });

  it('#9 Arabic ي/ك forms fold to the same key as ی/ک', () => {
    const base = keyHash('مرور نظام‌مند سیگار و شکست ایمپلنت');
    expect(keyHash('مرور نظام‌مند سيگار و شكست ايمپلنت')).toBe(base);
  });

  it('#11 a PubMed page dump resolves the paper\'s OWN pmid, not "Similar articles"\'s', () => {
    const dump = [
      'Skip to main page content', 'Log in    Search    Save',
      TITLE,
      'Fan YY, et al. J Dent. 2024. PMID: 38550112 doi: 10.1016/j.jdent.2024.105396',
      'Abstract', ABSTRACT_FA,
      'Similar articles',
      'Single-visit versus multiple-visit endodontic treatment. PMID: 9340725',
      'Postoperative pain after root canal therapy. PMID: 31122045',
    ].join('\n');
    const scope = paperScope(dump);
    const head = scope.slice(0, 900).toLowerCase();
    expect(pickIdentifier(allPmids(''), allPmids(scope), head)).toBe('38550112');
    expect(pickIdentifier(allDois(''), allDois(scope), head)).toBe('10.1016/j.jdent.2024.105396');
  });

  it('#12 a 12-DOI reference list does not confuse the front-matter DOI', () => {
    const refs = Array.from({ length: 12 }, (_, i) => `10.9999/ref.${i}`).join(', doi: ');
    const body = `${TITLE}\ndoi: 10.1016/j.jdent.2024.105396\n${ABSTRACT_FA}\nReferences\ndoi: ${refs}`;
    const scope = paperScope(body);
    const head = scope.slice(0, 900).toLowerCase();
    expect(pickIdentifier(allDois(''), allDois(scope), head)).toBe('10.1016/j.jdent.2024.105396');
  });
});

/* ============================================================ /des ===== */

describe('requirePremium / requireAuth gates', () => {
  it('blocks an unauthenticated request', async () => {
    const res = await app.inject({ method: 'GET', url: '/des/state' });
    expect(res.statusCode).toBe(401);
  });

  it('blocks a free (non-premium) user', async () => {
    const freeCookie = await loginAs(app, '09121200006');
    const res = await app.inject({ method: 'GET', url: '/des/state', headers: { cookie: freeCookie } });
    expect(res.statusCode).toBe(402);
  });
});

describe('POST /des/submit', () => {
  it('rejects a gate stop with 400', async () => {
    const res = await submit({ title: '', body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_input');
  });

  it('#7 answers instantly from an already-scored paper, spending no open slot', async () => {
    await createPaper({
      doi: '10.1016/j.jdent.2024.105396', pmid: null, title: TITLE, firstAuthor: 'Fan',
      year: 2024, hashtags: [], des: goodRecord(), specVersion: '2.2',
    });
    const res = await submit({ title: TITLE, body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY' });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.answered).toBe(true);
    expect(j.des.des_score).toBe(80);

    const state = await app.inject({ method: 'GET', url: '/des/state', headers: { cookie } });
    expect(state.json().open).toEqual([]);
    const rows = await pool.query('select count(*)::int as n from des_requests');
    expect(rows.rows[0].n).toBe(0);
  });

  it('#13 refuses a third open request with 429', async () => {
    const a = await submit({ title: 'مقاله‌ی اول دربارهٔ ایمپلنت', body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY' });
    const b = await submit({ title: 'مقاله‌ی دوم دربارهٔ ایمپلنت', body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY' });
    expect(a.statusCode).toBe(200);
    expect(b.statusCode).toBe(200);
    const c = await submit({ title: 'مقاله‌ی سوم دربارهٔ ایمپلنت', body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY' });
    expect(c.statusCode).toBe(429);
    expect(c.json().error).toBe('too_many_open');
  });

  it('#14 a known paper still answers instantly while at the open-request cap', async () => {
    await createPaper({
      doi: '10.1016/j.jdent.2024.105396', pmid: null, title: TITLE, firstAuthor: 'Fan',
      year: 2024, hashtags: [], des: goodRecord(), specVersion: '2.2',
    });
    await submit({ title: 'مقاله‌ی اول دربارهٔ ایمپلنت', body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY' });
    await submit({ title: 'مقاله‌ی دوم دربارهٔ ایمپلنت', body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY' });
    const res = await submit({ title: TITLE, body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY' });
    expect(res.statusCode).toBe(200);
    expect(res.json().answered).toBe(true);
  });

  it('files a new pending request with a reference code', async () => {
    const res = await submit({ title: TITLE, body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY' });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.answered).toBe(false);
    expect(j.reference).toMatch(/^D-[A-Z0-9]{3}-[A-Z0-9]{3}$/);

    const state = await app.inject({ method: 'GET', url: '/des/state', headers: { cookie } });
    expect(state.json().open).toHaveLength(1);
    expect(state.json().open[0].reference).toBe(j.reference);
  });
});

/* ========================================================= /admin/des == */

describe('GET/POST /admin/des*', () => {
  async function fileRequest(): Promise<string> {
    const res = await submit({ title: TITLE, body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY' });
    const list = await app.inject({ method: 'GET', url: '/admin/des', headers: { authorization: basic } });
    const row = list.json().pending.find((r: { reference: string }) => r.reference === res.json().reference);
    return row.id;
  }

  it('requires admin auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/des' });
    expect(res.statusCode).toBe(401);
  });

  it('#15 rejects arithmetic that does not add up — nothing written', async () => {
    const id = await fileRequest();
    const bad = goodRecord({ des_score: 85 });
    const res = await adminAnswer(id, { title: TITLE, record: JSON.stringify(bad) });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_record');
    const req = await pool.query('select status from des_requests where id = $1', [id]);
    expect(req.rows[0].status).toBe('pending');
    const papers = await pool.query('select count(*)::int as n from des_papers');
    expect(papers.rows[0].n).toBe(0);
  });

  it('#16 rejects AMSTAR-2 with the wrong domain count', async () => {
    const id = await fileRequest();
    const rec = goodRecord();
    (rec.q_method.domains as unknown[]).pop();
    const res = await adminAnswer(id, { title: TITLE, record: JSON.stringify(rec) });
    expect(res.statusCode).toBe(400);
    const papers = await pool.query('select count(*)::int as n from des_papers');
    expect(papers.rows[0].n).toBe(0);
  });

  it('#17/#18 normalises Latin digits and English penalty names, reporting both as warnings', async () => {
    const id = await fileRequest();
    const rec = goodRecord();
    (rec.penalties as Array<{ item: string }>)[0].item = 'conflict of interest declared';
    const res = await adminAnswer(id, { title: TITLE, record: JSON.stringify(rec), tags: '#ایمپلنت' });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.warnings.some((w: string) => /ارقام لاتین/.test(w))).toBe(true);
    expect(j.warnings.some((w: string) => /جریمه/.test(w))).toBe(true);

    const paper = await pool.query('select des, hashtags from des_papers where id = $1', [j.paper_id]);
    expect(paper.rows[0].des.fact_fa).toContain('۸۰');
    expect(paper.rows[0].des.penalties[0].item).toBe('بیانیه‌ی تعارض منافع وجود ندارد');
  });

  it('#21 a successful answer sends an uncapped des_result notification', async () => {
    const id = await fileRequest();
    const res = await adminAnswer(id, { title: TITLE, record: JSON.stringify(goodRecord()) });
    expect(res.statusCode).toBe(200);

    const req = await pool.query('select status, paper_id, answered_at from des_requests where id = $1', [id]);
    expect(req.rows[0].status).toBe('answered');
    expect(req.rows[0].paper_id).toBeTruthy();
    expect(req.rows[0].answered_at).toBeTruthy();

    const notif = await pool.query(
      "select kind, delivered from notification_log where kind = 'des_result'",
    );
    expect(notif.rows).toHaveLength(1);
    expect(notif.rows[0].delivered).toBe(true);
  });

  it('#22 drops a hashtag that is not in the canonical reference', async () => {
    const id = await fileRequest();
    const res = await adminAnswer(id, {
      title: TITLE, record: JSON.stringify(goodRecord()), tags: '#ایمپلنت, #یک_هشتگ_ساختگی_که_وجود_ندارد',
    });
    expect(res.statusCode).toBe(200);
    const paper = await pool.query('select hashtags from des_papers where id = $1', [res.json().paper_id]);
    expect(paper.rows[0].hashtags).toContain('#ایمپلنت');
    expect(paper.rows[0].hashtags).not.toContain('#یک_هشتگ_ساختگی_که_وجود_ندارد');
  });

  it('#19/#20 a near-duplicate title returns candidates; same_as attaches keys without creating a paper', async () => {
    const existingId = await createPaper({
      doi: null, pmid: null, title: TITLE, firstAuthor: 'Fan',
      year: 2024, hashtags: [], des: goodRecord({ citation: { ...goodRecord().citation, doi: null } }), specVersion: '2.2',
    });

    const typoTitle = TITLE.replace('Smoking', 'Smokig'); // one-letter typo, misses the exact key
    const id = await submit({ title: typoTitle, body: ENGLISH_ABSTRACT, claim: 'ABSTRACT_ONLY' })
      .then((r) => r.json().reference)
      .then(async (ref) => {
        const list = await app.inject({ method: 'GET', url: '/admin/des', headers: { authorization: basic } });
        return list.json().pending.find((r: { reference: string }) => r.reference === ref).id;
      });

    const rec = goodRecord({ citation: { ...goodRecord().citation, title: typoTitle, doi: null } });
    const dup = await adminAnswer(id, { title: typoTitle, record: JSON.stringify(rec) });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().error).toBe('near_duplicate');
    expect(dup.json().candidates[0].paperId).toBe(existingId);

    const attached = await adminAnswer(id, {
      title: typoTitle, record: JSON.stringify(rec), same_as: existingId,
    });
    expect(attached.statusCode).toBe(200);
    expect(attached.json().paper_id).toBe(existingId);

    const papers = await pool.query('select count(*)::int as n from des_papers');
    expect(papers.rows[0].n).toBe(1); // no new paper was created
    const keys = await pool.query('select key from des_paper_keys where paper_id = $1', [existingId]);
    expect(keys.rows.length).toBeGreaterThan(1); // the typo'd title's own key was attached
  });

  it('rejects a request without answering it', async () => {
    const id = await fileRequest();
    const res = await app.inject({ method: 'POST', url: `/admin/des/${id}/reject`, headers: { authorization: basic } });
    expect(res.statusCode).toBe(200);
    const req = await pool.query('select status from des_requests where id = $1', [id]);
    expect(req.rows[0].status).toBe('rejected');
  });
});

/* ==================================================== near-duplicates == */

describe('nearDuplicates (service level)', () => {
  it('#10 a typo\'d title misses the exact key but surfaces as a ~0.8+ candidate', async () => {
    await createPaper({
      doi: '10.1016/j.jdent.2024.105396', pmid: null, title: TITLE, firstAuthor: 'Fan YY',
      year: 2024, hashtags: [], des: goodRecord(), specVersion: '2.2',
    });
    const cands = await nearDuplicates(TITLE.replace('Smoking', 'Smokig'), 'Ying-Ying Fan');
    expect(cands.length).toBeGreaterThan(0);
    expect(cands[0].score).toBeGreaterThan(0.75);
    expect(cands[0].authorAgrees).toBe(true); // "Fan YY" vs "Ying-Ying Fan" — the authorWords fix
  });
});
