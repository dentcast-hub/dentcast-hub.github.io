import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { getIndex } from '../src/content-index.js';

let app: FastifyInstance;
let cookie: string;

// Pick real content_ids from the taxonomy so tree/topic have something to group.
const idx = getIndex();
const cluster = idx.clusters[0];
const sub = cluster.subtopics[0];
const cidsInSub = sub.contentIds.slice(0, 2);

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, '09121400001');
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function addHighlight(content_id: string, exact: string) {
  return app.inject({
    method: 'POST', url: '/highlights', headers: { cookie },
    payload: { content_id, exact, color: 'yellow' },
  });
}

describe('GET /tree', () => {
  it('aggregates highlight counts per taxonomy branch with links, no bodies', async () => {
    await addHighlight(cidsInSub[0], 'اول');
    await addHighlight(cidsInSub[0], 'دوم');
    await addHighlight(cidsInSub[1] || cidsInSub[0], 'سوم');

    const res = await app.inject({ method: 'GET', url: '/tree', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total_highlights).toBe(3);

    const branch = body.clusters.find((c: any) => c.key === cluster.key);
    expect(branch).toBeTruthy();
    expect(branch.count).toBe(3);
    expect(branch.topicKey).toBe('cluster:' + cluster.key);
    const subBranch = branch.subtopics.find((s: any) => s.key === sub.key);
    expect(subBranch.count).toBe(3);
    // no highlight bodies leak into the tree
    expect(JSON.stringify(body)).not.toContain('اول');
  });
});

describe('GET /highlights?topic=', () => {
  it('returns the per-topic archive across the branch content, in card form', async () => {
    await addHighlight(cidsInSub[0], 'کارت یک');
    await addHighlight(cidsInSub[1] || cidsInSub[0], 'کارت دو');

    const res = await app.inject({
      method: 'GET', url: '/highlights?topic=subtopic:' + sub.key, headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.topic_fa).toBe(sub.fa);
    expect(body.highlights.length).toBeGreaterThanOrEqual(2);
    // card form carries exact/cloze/note/label + anchor fields
    expect(body.highlights[0]).toHaveProperty('exact');
    expect(body.highlights[0]).toHaveProperty('cloze_markers');
  });

  it('404s on an unknown topic', async () => {
    const res = await app.inject({ method: 'GET', url: '/highlights?topic=cluster:nope', headers: { cookie } });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /export/highlights', () => {
  it('dumps the user data with an attachment header', async () => {
    await addHighlight(cidsInSub[0], 'برای اکسپورت');
    const res = await app.inject({ method: 'GET', url: '/export/highlights', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-disposition']).toContain('attachment');
    const body = res.json();
    expect(body.count).toBe(1);
    expect(body.highlights[0].exact).toBe('برای اکسپورت');
  });
});

describe('GET /progress', () => {
  it('reports totals and last content', async () => {
    await addHighlight(cidsInSub[0], 'یک');
    const res = await app.inject({ method: 'GET', url: '/progress', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total_highlights).toBe(1);
    expect(body.last_content_id).toBe(cidsInSub[0]);
  });
});
