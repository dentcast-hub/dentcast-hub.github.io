import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { getClusters } from '../src/content-index.js';
import { getPathways } from '../src/pathways.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

// A real cluster with enough content to exercise both suggestion buckets (see
// plus/content-index.json), plus the same known-good pathway step the
// pathways.test.ts suite uses.
const [CLUSTER_A, CLUSTER_B] = getClusters()
  .filter((c) => c.contentCount >= 3)
  .sort((a, b) => b.contentCount - a.contentCount);
const PATHWAY_ID = 'occlusion';
const [STEP_0] = getPathways().find((p) => p.id === PATHWAY_ID)!.steps;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  phone = '09121200003';
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

describe('free-tier allowance', () => {
  it('gives a free user the diagnosis but not the prescription', async () => {
    const res = await app.inject({ method: 'GET', url: '/reading-compass', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // Coverage numbers are facts about the reader's own activity — never withheld.
    expect(body).toHaveProperty('total_read');
    expect(body).toHaveProperty('clusters');
    // The named articles that would close the gap are what premium buys, and
    // they are stripped in the process rather than hidden by the page.
    expect(body.same_area).toEqual([]);
    expect(body.unexplored).toEqual([]);
    expect(body.blind_spots_locked).toBe(true);
    // ...but their SIZE survives, because that is the argument.
    expect(body.unexplored_count).toBeGreaterThan(0);
  });

  it('gives a premium user the full map', async () => {
    await makePremium();
    const res = await app.inject({ method: 'GET', url: '/reading-compass', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.json().blind_spots_locked).toBeUndefined();
    expect(res.json().unexplored.length).toBeGreaterThan(0);
  });

  it('blocks an unauthenticated request with 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/reading-compass' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /reading-compass', () => {
  it('reports nothing read yet, but still offers exploration suggestions', async () => {
    await makePremium();
    const res = await app.inject({ method: 'GET', url: '/reading-compass', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total_read).toBe(0);
    expect(body.clusters).toEqual([]);
    expect(body.top_cluster).toBeNull();
    expect(body.same_area).toEqual([]);
    expect(body.pathways).toEqual([]);
    expect(body.unexplored.length).toBeGreaterThan(0);
  });

  it('names the top cluster and suggests its own unread content, not what was just read', async () => {
    await makePremium();
    const firstId = CLUSTER_A.contentIds[0];
    await createHighlight(firstId);

    const res = await app.inject({ method: 'GET', url: '/reading-compass', headers: { cookie } });
    const body = res.json();
    expect(body.total_read).toBe(1);
    expect(body.top_cluster.key).toBe(CLUSTER_A.key);
    expect(body.top_cluster.read).toBe(1);
    expect(body.top_cluster.total).toBe(CLUSTER_A.contentCount);

    const sameAreaIds = body.same_area.map((i: { content_id: string }) => i.content_id);
    expect(sameAreaIds).not.toContain(firstId);
    for (const id of sameAreaIds) expect(CLUSTER_A.contentIds).toContain(id);
  });

  it('never suggests the top cluster as unexplored', async () => {
    await makePremium();
    await createHighlight(CLUSTER_A.contentIds[0]);

    const res = await app.inject({ method: 'GET', url: '/reading-compass', headers: { cookie } });
    const body = res.json();
    const unexploredIds = body.unexplored.map((i: { content_id: string }) => i.content_id);
    for (const id of CLUSTER_A.contentIds) expect(unexploredIds).not.toContain(id);
    // The next-largest untouched cluster should show up among the suggestions.
    const anyFromClusterB = CLUSTER_B.contentIds.some((id) => unexploredIds.includes(id));
    expect(anyFromClusterB).toBe(true);
  });

  it('surfaces pathway progress the same way the pathways route derives it', async () => {
    await makePremium();
    await createHighlight(STEP_0.content_id);

    const res = await app.inject({ method: 'GET', url: '/reading-compass', headers: { cookie } });
    const body = res.json();
    const occlusion = body.pathways.find((p: { id: string }) => p.id === PATHWAY_ID);
    expect(occlusion).toBeTruthy();
    expect(occlusion.completed_steps).toBe(1);
  });
});
