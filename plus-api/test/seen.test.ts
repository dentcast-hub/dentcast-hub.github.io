import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { getIndex } from '../src/content-index.js';

let app: FastifyInstance;
let cookie: string;
let userId: string;

const idx = getIndex();
const ids = Object.keys(idx.byContent);
const opened = ids.find((i) => i.startsWith('insight/'))!;
const finished = ids.filter((i) => i.startsWith('insight/'))[1]!;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, '09121400021');
  userId = (await pool.query<{ id: string }>('select id from profiles where phone = $1', ['09121400021'])).rows[0].id;
  await pool.query(
    `insert into user_activity (user_id, action, content_id) values ($1,'article_viewed',$2), ($1,'article_completed',$3)`,
    [userId, opened, finished],
  );
});

afterAll(async () => { await app?.close(); await pool.end(); });

const premium = () => pool.query("update profiles set tier = 'premium' where id = $1", [userId]);
const seen = () => app.inject({ method: 'GET', url: '/seen', headers: { cookie } });

describe('GET /seen', () => {
  it('splits opened from finished for a premium reader', async () => {
    await premium();
    const body = (await seen()).json();
    expect(body.locked).toBe(false);
    expect(body.completed).toContain(finished);
    expect(body.viewed).toContain(opened);
    // the two lists never overlap: a finished page is not also "merely opened"
    expect(body.viewed).not.toContain(finished);
  });

  it('keeps the pre-split `seen` key so a cached client does not lose its ticks', async () => {
    await premium();
    const body = (await seen()).json();
    expect(body.seen).toEqual(expect.arrayContaining([opened, finished]));
  });

  it('gives a free reader counts and NOT ONE content_id', async () => {
    const res = await seen();
    expect(res.statusCode).toBe(200); // the door is shown, not slammed
    const body = res.json();
    expect(body.locked).toBe(true);
    expect(body.viewed).toBeUndefined();
    expect(body.completed).toBeUndefined();
    expect(body.seen).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain(finished);
    const insight = body.folders.find((f: any) => f.key === 'insight');
    expect(insight.read).toBe(1);       // the finished one; a mere open is not read
    expect(insight.total).toBeGreaterThan(1);
    expect(body.read).toBe(1);
  });

  it('counts a folder exactly as the dashboard progress bar does', async () => {
    const s = (await seen()).json();
    const p = (await app.inject({ method: 'GET', url: '/progress', headers: { cookie } })).json();
    for (const f of s.folders) {
      const bar = p.folder_progress.find((x: any) => x.key === f.key);
      expect(bar.read, `folder ${f.key}`).toBe(f.read);
      expect(bar.total, `folder ${f.key}`).toBe(f.total);
    }
  });

  it('publishes each folder prefix, so the client can resolve a two-level path', async () => {
    const body = (await seen()).json();
    const p = body.folders.find((f: any) => f.key === 'promptologist');
    expect(p.prefix).toBe('dentai/promptologist');
  });
});
