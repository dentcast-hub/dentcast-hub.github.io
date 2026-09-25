import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import {
  getPathways, getPathwayById, isCertifiable, isOpenPathway, mayOpenPathway,
  applyRemotePathways, resetRemotePathways,
} from '../src/pathways.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

// The real "occlusion" pathway's first three steps (see plus/pathways.json),
// used as known-good content_ids that also resolve in plus/content-index.json.
const PATHWAY_ID = 'occlusion';
const [STEP_0, STEP_1, STEP_2] = getPathways().find((p) => p.id === PATHWAY_ID)!.steps;

// Two real bundles: "bonding" has no prereq and continues into "biomimetic";
// "laminate" points to "bonding" as its prereq and continues into "esthetic".
// Exercises kind/glyph/prereq_bundle/continues_pathway end to end.
const BUNDLE_ID = 'bundle-laminate';
const PREREQ_BUNDLE_ID = 'bundle-bonding';
const [BUNDLE_STEP_0] = getPathways().find((p) => p.id === BUNDLE_ID)!.steps;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  phone = '09121200002';
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function makePremium(): Promise<void> {
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
}

async function userId(): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [phone]);
  return r.rows[0].id;
}

async function createHighlight(contentId: string): Promise<void> {
  const res = await app.inject({
    method: 'POST',
    url: '/highlights',
    headers: { cookie },
    payload: { content_id: contentId, exact: 'یک متن هایلایت‌شده برای تست' },
  });
  expect(res.statusCode).toBe(201);
}

describe('premium gate — per PATHWAY, not per route', () => {
  // A pathway opens to a free account by its own entry in the file
  // (`premium: false`, isOpenPathway). The cases flag one themselves through
  // applyRemotePathways — the same door content-refresh.ts adopts a published
  // copy with — so they do not depend on which pathway ships open this month.
  const OPEN_ID = PATHWAY_ID;
  const openOne = () => {
    const raw = JSON.parse(JSON.stringify(getPathways())) as { id: string; premium: boolean }[];
    for (const x of raw) x.premium = x.id !== OPEN_ID;
    expect(applyRemotePathways(raw)).toBe(true);
  };
  afterEach(() => { resetRemotePathways(); });

  it('blocks a free user with 402 on a premium pathway, and still shows it in the catalog as locked', async () => {
    const detail = await app.inject({ method: 'GET', url: `/pathways/${BUNDLE_ID}`, headers: { cookie } });
    expect(detail.statusCode).toBe(402);
    const enroll = await app.inject({ method: 'POST', url: `/pathways/${BUNDLE_ID}/enroll`, headers: { cookie } });
    expect(enroll.statusCode).toBe(402);
    const list = await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } });
    expect(list.statusCode).toBe(200);
    const b = list.json().pathways.find((p: { id: string }) => p.id === BUNDLE_ID);
    expect(b).toMatchObject({ open: false, free: false });
  });

  it('opens a `premium: false` pathway to a free user: catalog, detail and enrolment', async () => {
    openOne();
    const list = (await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } })).json().pathways;
    expect(list.find((p: { id: string }) => p.id === OPEN_ID)).toMatchObject({ open: true, free: true });
    expect(list.filter((p: { open: boolean }) => p.open).map((p: { id: string }) => p.id)).toEqual([OPEN_ID]);
    const detail = await app.inject({ method: 'GET', url: `/pathways/${OPEN_ID}`, headers: { cookie } });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().free).toBe(true);
    const enroll = await app.inject({ method: 'POST', url: `/pathways/${OPEN_ID}/enroll`, headers: { cookie } });
    expect(enroll.statusCode).toBe(200);
    expect((await app.inject({ method: 'GET', url: `/pathways/${BUNDLE_ID}`, headers: { cookie } })).statusCode).toBe(402);
  });

  it('a premium user opens everything, and the free pathway says so', async () => {
    openOne();
    await makePremium();
    const list = (await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } })).json().pathways;
    expect(list.every((p: { open: boolean }) => p.open)).toBe(true);
    expect(list.find((p: { id: string }) => p.id === OPEN_ID).free).toBe(true);
  });

  it('an absent key is premium — only a literal false opens a pathway', () => {
    const p = getPathwayById(PATHWAY_ID)!;
    expect(isOpenPathway({ ...p, premium: undefined as unknown as boolean })).toBe(false);
    expect(isOpenPathway({ ...p, premium: false })).toBe(true);
    expect(mayOpenPathway('free', { ...p, premium: true })).toBe(false);
    expect(mayOpenPathway('premium', { ...p, premium: true })).toBe(true);
  });

  it('ships «ارزیابی شواهد و استدلال بالینی» open to everybody (founder, 1405/07/03)', () => {
    resetRemotePathways();
    const p = getPathwayById('evidence-literacy')!;
    expect(p.title_fa).toBe('ارزیابی شواهد و استدلال بالینی');
    expect(isOpenPathway(p)).toBe(true);
  });

  it('blocks an unauthenticated request with 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/pathways' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /pathways — the certificate chip\'s four states', () => {
  it('says whether a pathway certifies, whether this reader asked for it, and whether they hold it', async () => {
    await makePremium();
    const uid = await userId();

    const plain = (await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } })).json()
      .pathways as Array<Record<string, unknown>>;
    const occlusion = plain.find((p) => p.id === PATHWAY_ID)!;
    expect(occlusion).toMatchObject({ certifiable: true, certificate_intent: null, certificate_held: false });
    // The chip reads the same one predicate every other door reads — the
    // pending flag and the step floor both — never a copy of either rule.
    // Which pathways are closed this month is an editorial fact, so it is
    // compared, not listed; the rules themselves are tested in exams.test.ts.
    for (const p of plain.filter((x) => x.kind !== 'bundle')) {
      expect(p.certifiable).toBe(isCertifiable(getPathwayById(p.id as string)));
    }
    // A bundle is never certificate-sized, and draws no chip either way.
    expect(plain.find((p) => p.id === BUNDLE_ID)).toMatchObject({ certifiable: false });

    await pool.query(
      `insert into user_pathways (user_id, pathway_id, current_step, certificate_intent)
       values ($1, $2, 0, 'wanted')`, [uid, PATHWAY_ID],
    );
    await pool.query(
      `insert into certificates (user_id, pathway_id, verify_code, holder_name)
       values ($1, $2, 'DC-T3S-T01', 'آزمون')`, [uid, PATHWAY_ID],
    );
    const after = (await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } })).json()
      .pathways as Array<Record<string, unknown>>;
    expect(after.find((p) => p.id === PATHWAY_ID)).toMatchObject({
      certificate_intent: 'wanted', certificate_held: true,
    });

    // A revoked certificate leaves the pathway un-ticked — the chip shows
    // what stands today, exactly as the profile wall's disc does.
    await pool.query(`update certificates set revoked_at = now() where user_id = $1`, [uid]);
    const revoked = (await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } })).json()
      .pathways as Array<Record<string, unknown>>;
    expect(revoked.find((p) => p.id === PATHWAY_ID)).toMatchObject({ certificate_held: false });
  });
});

describe('GET /pathways', () => {
  it('lists every pathway with zero progress when unenrolled and untouched', async () => {
    await makePremium();
    const res = await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const list = res.json().pathways as Array<Record<string, unknown>>;
    expect(list.length).toBe(getPathways().length);
    const occlusion = list.find((p) => p.id === PATHWAY_ID)!;
    expect(occlusion.enrolled).toBe(false);
    expect(occlusion.current_step).toBe(0);
    expect(occlusion.completed_steps).toBe(0);
    expect(occlusion.is_complete).toBe(false);

    // A full pathway carries no kind; both kinds carry a glyph — full
    // pathways got one on 1405/06/21 for the profile's certificate wall,
    // which draws a disc per pathway (plus/js/certificates.js).
    expect(occlusion.kind).toBeNull();
    expect(occlusion.glyph).toBe('icon-occlusion');
    const bundle = list.find((p) => p.id === BUNDLE_ID)!;
    expect(bundle.kind).toBe('bundle');
    expect(bundle.glyph).toBe('icon-tooth');
  });

  it('gives progress credit for content consumed before enrolling', async () => {
    await makePremium();
    await createHighlight(STEP_0.content_id);
    const res = await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } });
    const occlusion = (res.json().pathways as Array<Record<string, unknown>>).find((p) => p.id === PATHWAY_ID)!;
    expect(occlusion.enrolled).toBe(false);
    expect(occlusion.current_step).toBe(1);
    expect(occlusion.completed_steps).toBe(1);
  });
});

describe('GET /pathways/:id', () => {
  it('404s on an unknown pathway id', async () => {
    await makePremium();
    const res = await app.inject({ method: 'GET', url: '/pathways/does-not-exist', headers: { cookie } });
    expect(res.statusCode).toBe(404);
  });

  it('resolves each step to title/url/type and marks per-step completion', async () => {
    await makePremium();
    await createHighlight(STEP_0.content_id);
    const res = await app.inject({ method: 'GET', url: `/pathways/${PATHWAY_ID}`, headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.steps.length).toBe(getPathways().find((p) => p.id === PATHWAY_ID)!.steps.length);
    const step0 = body.steps[0];
    expect(step0.content_id).toBe(STEP_0.content_id);
    expect(step0.completed).toBe(true);
    expect(typeof step0.title).toBe('string');
    expect(typeof step0.url).toBe('string');
    expect(body.steps[1].completed).toBe(false);
    expect(body.current_step).toBe(1);

    // A full pathway resolves kind/glyph/prereq_bundle/continues_pathway to null.
    expect(body.kind).toBeNull();
    expect(body.glyph).toBe('icon-occlusion');
    expect(body.prereq_bundle).toBeNull();
    expect(body.continues_pathway).toBeNull();
  });

  it('stops current_step at the first gap even if a later step was consumed', async () => {
    await makePremium();
    await createHighlight(STEP_0.content_id);
    await createHighlight(STEP_2.content_id); // skip STEP_1
    const res = await app.inject({ method: 'GET', url: `/pathways/${PATHWAY_ID}`, headers: { cookie } });
    const body = res.json();
    expect(body.current_step).toBe(1); // stuck behind the STEP_1 gap
    expect(body.completed_steps).toBe(2); // but both consumed steps count toward the total
  });
});

describe('GET /pathways/:id — bundles', () => {
  it('resolves kind/glyph and a prereq_bundle referral to its title', async () => {
    await makePremium();
    const res = await app.inject({ method: 'GET', url: `/pathways/${BUNDLE_ID}`, headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.kind).toBe('bundle');
    expect(body.glyph).toBe('icon-tooth');
    expect(body.prereq_bundle).toEqual({ id: PREREQ_BUNDLE_ID, title_fa: 'باندینگ و ادهزیو: شروع کن', glyph: 'icon-droplet' });
    expect(body.continues_pathway).toEqual({ id: 'esthetic', title_fa: expect.any(String) });
  });

  it('resolves prereq_bundle to null for a bundle with none', async () => {
    await makePremium();
    const res = await app.inject({ method: 'GET', url: `/pathways/${PREREQ_BUNDLE_ID}`, headers: { cookie } });
    expect(res.json().prereq_bundle).toBeNull();
    expect(res.json().continues_pathway).toEqual({ id: 'biomimetic', title_fa: expect.any(String) });
  });

  it('only the last step of a bundle carries milestone: true', async () => {
    await makePremium();
    const res = await app.inject({ method: 'GET', url: `/pathways/${BUNDLE_ID}`, headers: { cookie } });
    const steps = res.json().steps as Array<{ milestone: boolean }>;
    expect(steps.slice(0, -1).every((s) => !s.milestone)).toBe(true);
    expect(steps.at(-1)!.milestone).toBe(true);
  });
});

describe('POST /pathways/:id/enroll', () => {
  it('enrolls, seeding progress from content already consumed', async () => {
    await makePremium();
    await createHighlight(STEP_0.content_id);

    const res = await app.inject({ method: 'POST', url: `/pathways/${PATHWAY_ID}/enroll`, headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.enrolled).toBe(true);
    expect(body.current_step).toBe(1);
    expect(body.started_at).toBeTruthy();

    const row = await pool.query(
      `select current_step from user_pathways where pathway_id = $1`,
      [PATHWAY_ID],
    );
    expect(row.rows[0].current_step).toBe(1);
  });

  it('is idempotent: enrolling twice keeps the original started_at', async () => {
    await makePremium();
    const first = await app.inject({ method: 'POST', url: `/pathways/${PATHWAY_ID}/enroll`, headers: { cookie } });
    const second = await app.inject({ method: 'POST', url: `/pathways/${PATHWAY_ID}/enroll`, headers: { cookie } });
    expect(first.json().started_at).toBe(second.json().started_at);

    const count = await pool.query(`select count(*)::int as n from user_pathways`);
    expect(count.rows[0].n).toBe(1);
  });

  it('404s on an unknown pathway id', async () => {
    await makePremium();
    const res = await app.inject({ method: 'POST', url: '/pathways/does-not-exist/enroll', headers: { cookie } });
    expect(res.statusCode).toBe(404);
  });

  it('enrolls in a bundle the same way as a full pathway', async () => {
    await makePremium();
    await createHighlight(BUNDLE_STEP_0.content_id);
    const res = await app.inject({ method: 'POST', url: `/pathways/${BUNDLE_ID}/enroll`, headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json().current_step).toBe(1);
  });

  it('keeps the current_step cache in sync on later reads (lazy write-back)', async () => {
    await makePremium();
    await app.inject({ method: 'POST', url: `/pathways/${PATHWAY_ID}/enroll`, headers: { cookie } });
    await createHighlight(STEP_0.content_id);
    await createHighlight(STEP_1.content_id);

    await app.inject({ method: 'GET', url: `/pathways/${PATHWAY_ID}`, headers: { cookie } });
    const row = await pool.query(
      `select current_step, completed_at from user_pathways where pathway_id = $1`,
      [PATHWAY_ID],
    );
    expect(row.rows[0].current_step).toBe(2);
    expect(row.rows[0].completed_at).toBeNull();
  });
});

describe('GET /me active_pathway', () => {
  it('is null with no enrollments', async () => {
    await makePremium();
    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(res.json().active_pathway).toBeNull();
  });

  it('surfaces the enrolled pathway with live progress', async () => {
    await makePremium();
    await app.inject({ method: 'POST', url: `/pathways/${PATHWAY_ID}/enroll`, headers: { cookie } });
    await createHighlight(STEP_0.content_id);

    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    const active = res.json().active_pathway;
    expect(active.id).toBe(PATHWAY_ID);
    expect(active.current_step).toBe(1);
    expect(active.is_complete).toBe(false);
  });

  it('is absent for a free user with no premium history', async () => {
    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(res.json().active_pathway).toBeNull();
  });

  it('excludes bundles: a bundle-only enrollment leaves active_pathway null', async () => {
    // The dashboard's «مسیر یادگیری» block shows full pathways only; bundles
    // live in their own «از کجا شروع کنم؟» block fed by GET /pathways.
    await makePremium();
    await app.inject({ method: 'POST', url: `/pathways/${BUNDLE_ID}/enroll`, headers: { cookie } });
    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(res.json().active_pathway).toBeNull();
  });

  it('a newer bundle enrollment never displaces the active full pathway', async () => {
    await makePremium();
    // Full pathway FIRST (older), bundle SECOND (newer) — if recency alone
    // decided, the bundle would win; the kind filter is what keeps the
    // pathway on top.
    await app.inject({ method: 'POST', url: `/pathways/${PATHWAY_ID}/enroll`, headers: { cookie } });
    await app.inject({ method: 'POST', url: `/pathways/${BUNDLE_ID}/enroll`, headers: { cookie } });

    const res = await app.inject({ method: 'GET', url: '/me', headers: { cookie } });
    expect(res.json().active_pathway.id).toBe(PATHWAY_ID);
    expect('kind' in res.json().active_pathway).toBe(false);
  });
});
