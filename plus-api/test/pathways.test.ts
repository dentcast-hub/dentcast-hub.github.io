import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { getPathways } from '../src/pathways.js';

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

async function createHighlight(contentId: string): Promise<void> {
  const res = await app.inject({
    method: 'POST',
    url: '/highlights',
    headers: { cookie },
    payload: { content_id: contentId, exact: 'یک متن هایلایت‌شده برای تست' },
  });
  expect(res.statusCode).toBe(201);
}

describe('requirePremium gate', () => {
  it('blocks a free user with 402 on every pathway route', async () => {
    const list = await app.inject({ method: 'GET', url: '/pathways', headers: { cookie } });
    expect(list.statusCode).toBe(402);
    const detail = await app.inject({ method: 'GET', url: `/pathways/${PATHWAY_ID}`, headers: { cookie } });
    expect(detail.statusCode).toBe(402);
    const enroll = await app.inject({ method: 'POST', url: `/pathways/${PATHWAY_ID}/enroll`, headers: { cookie } });
    expect(enroll.statusCode).toBe(402);
  });

  it('blocks an unauthenticated request with 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/pathways' });
    expect(res.statusCode).toBe(401);
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

    // A full pathway carries no kind/glyph; a bundle carries both.
    expect(occlusion.kind).toBeNull();
    expect(occlusion.glyph).toBeNull();
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
    expect(body.glyph).toBeNull();
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
