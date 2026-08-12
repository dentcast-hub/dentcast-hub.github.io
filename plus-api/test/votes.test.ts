import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { resetBoardCache, SEED_HALF_AT } from '../src/services/votes.js';

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

const ART = 'chairside/chairside-30';
const OTHER = 'notecast/episode-28';

async function userId(phone: string): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [phone]);
  return r.rows[0].id;
}

/** Put an engagement row in the log — the only source the board's seed reads. */
async function logActivity(phone: string, action: string, contentId: string): Promise<void> {
  await pool.query(
    `insert into user_activity (user_id, action, content_id) values ($1, $2, $3)`,
    [await userId(phone), action, contentId],
  );
}

describe('POST /votes', () => {
  it('refuses an anonymous caller', async () => {
    const res = await app.inject({ method: 'POST', url: '/votes', payload: { content_id: ART } });
    expect(res.statusCode).toBe(401);
    const rows = await pool.query('select 1 from content_votes');
    expect(rows.rowCount).toBe(0);
  });

  it('records one heart and returns the fresh count', async () => {
    const cookie = await loginAs(app, '09120000001');
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ hearts: 1, voted: true });
  });

  // The whole reason the request carries an explicit `vote` rather than toggling:
  // a retry after a timeout must repeat the press, never undo it.
  it('is idempotent — pressing twice is still one heart', async () => {
    const cookie = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });
    expect(res.json()).toEqual({ hearts: 1, voted: true });
    const rows = await pool.query('select 1 from content_votes');
    expect(rows.rowCount).toBe(1);
  });

  it('counts one heart per person, not per press', async () => {
    const a = await loginAs(app, '09120000001');
    const b = await loginAs(app, '09120000002');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie: b }, payload: { content_id: ART } });
    expect(res.json()).toEqual({ hearts: 2, voted: true });
  });

  it('refuses a malformed content id', async () => {
    const cookie = await loginAs(app, '09120000001');
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: '../etc' } });
    expect(res.statusCode).toBe(400);
  });

  // A heart is one second of work. Everything in SCORING_ACTIONS is an act of
  // study, and score is never deducted — so a vote must leave the log alone.
  it('writes no activity row, so it can never earn XP or keep a streak', async () => {
    const cookie = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });
    const rows = await pool.query('select 1 from user_activity');
    expect(rows.rowCount).toBe(0);
  });
});

describe('POST /votes { vote: false }', () => {
  it('takes the heart back', async () => {
    const cookie = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART, vote: false } });
    expect(res.json()).toEqual({ hearts: 0, voted: false });
  });

  it('is idempotent — withdrawing a vote that is not there is fine', async () => {
    const cookie = await loginAs(app, '09120000001');
    const res = await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART, vote: false } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ hearts: 0, voted: false });
  });
});

describe('GET /votes?id=', () => {
  it('serves the count to an anonymous reader, with voted false', async () => {
    const cookie = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie }, payload: { content_id: ART } });

    const res = await app.inject({ method: 'GET', url: `/votes?id=${ART}` });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ hearts: 1, voted: false });
  });

  it('tells a signed-in reader whether the heart is theirs', async () => {
    const a = await loginAs(app, '09120000001');
    const b = await loginAs(app, '09120000002');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });

    expect((await app.inject({ method: 'GET', url: `/votes?id=${ART}`, headers: { cookie: a } })).json())
      .toEqual({ hearts: 1, voted: true });
    expect((await app.inject({ method: 'GET', url: `/votes?id=${ART}`, headers: { cookie: b } })).json())
      .toEqual({ hearts: 1, voted: false });
  });

  it('reports an unvoted page as zero rather than 404', async () => {
    const res = await app.inject({ method: 'GET', url: `/votes?id=${OTHER}` });
    expect(res.json()).toEqual({ hearts: 0, voted: false });
  });
});

describe('GET /votes/board', () => {
  it('is empty and honest before anything has happened', async () => {
    const res = await app.inject({ method: 'GET', url: '/votes/board' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.items).toEqual([]);
    expect(body.total_hearts).toBe(0);
    expect(body.seed_weight).toBe(1);
  });

  // The reason the seed exists at all: a board with no votes yet must still be
  // in a sensible order rather than an arbitrary one.
  it('ranks by derived engagement before a single vote is cast', async () => {
    await loginAs(app, '09120000001');
    await loginAs(app, '09120000002');
    // OTHER: two people highlighted it (3 each = 6).
    await logActivity('09120000001', 'highlight_created', OTHER);
    await logActivity('09120000002', 'highlight_created', OTHER);
    // ART: one person finished it (1).
    await logActivity('09120000001', 'article_completed', ART);

    resetBoardCache();
    const body = (await app.inject({ method: 'GET', url: '/votes/board' })).json();
    expect(body.items.map((i: { content_id: string }) => i.content_id)).toEqual([OTHER, ART]);
    expect(body.items[0].score).toBe(6);
    expect(body.items[0].hearts).toBe(0);
  });

  // One enthusiastic reader must not be able to install their own favourite at
  // the top of the site just by highlighting it twenty times.
  it('counts distinct people per action, not rows', async () => {
    await loginAs(app, '09120000001');
    for (let i = 0; i < 5; i += 1) await logActivity('09120000001', 'highlight_created', ART);

    resetBoardCache();
    const body = (await app.inject({ method: 'GET', url: '/votes/board' })).json();
    expect(body.items[0].score).toBe(3);
  });

  it('lets hearts outrank the seed', async () => {
    const a = await loginAs(app, '09120000001');
    const b = await loginAs(app, '09120000002');
    // OTHER starts ahead on engagement alone…
    await logActivity('09120000001', 'highlight_created', OTHER);
    await logActivity('09120000002', 'highlight_created', OTHER);
    // …and ART overtakes it on votes.
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: b }, payload: { content_id: ART } });
    await logActivity('09120000001', 'highlight_created', ART);
    await logActivity('09120000002', 'highlight_created', ART);

    resetBoardCache();
    const body = (await app.inject({ method: 'GET', url: '/votes/board' })).json();
    expect(body.items[0].content_id).toBe(ART);
    expect(body.total_hearts).toBe(2);
  });

  // A heart is worth 1 forever; only the inherited head start shrinks.
  it('fades the seed as site-wide hearts accumulate', async () => {
    await loginAs(app, '09120000001');
    await logActivity('09120000001', 'highlight_created', OTHER); // seed 3

    resetBoardCache();
    const before = (await app.inject({ method: 'GET', url: '/votes/board' })).json();
    expect(before.seed_weight).toBe(1);
    expect(before.items.find((i: { content_id: string }) => i.content_id === OTHER).score).toBe(3);

    // Enough hearts elsewhere to put the fade exactly at half.
    await pool.query(
      `insert into content_votes (user_id, content_id)
       select $1, 'filler/' || g from generate_series(1, $2) g`,
      [await userId('09120000001'), SEED_HALF_AT],
    );

    resetBoardCache();
    const after = (await app.inject({ method: 'GET', url: '/votes/board' })).json();
    expect(after.total_hearts).toBe(SEED_HALF_AT);
    expect(after.seed_weight).toBe(0.5);
    expect(after.items.find((i: { content_id: string }) => i.content_id === OTHER).score).toBe(1.5);
  });

  // The seed is demoted to a tiebreaker rather than retired. Without this, two
  // equally-hearted pages would be ordered by content_id — alphabetically — which
  // becomes most of the board's ordering once the weight is small.
  it('breaks a heart tie by engagement, not alphabetically', async () => {
    const a = await loginAs(app, '09120000001');
    await loginAs(app, '09120000002');
    // Same hearts on both…
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: OTHER } });
    // …and OTHER is the one people actually read. ART sorts first alphabetically
    // ('chairside/…' < 'notecast/…'), so a passing test here means the engagement
    // beat the alphabet.
    await logActivity('09120000001', 'highlight_created', OTHER);
    await logActivity('09120000002', 'highlight_created', OTHER);

    // Enough site-wide hearts that the seed is worth almost nothing as a SCORE
    // term — this is the state the tiebreaker exists for.
    await pool.query(
      `insert into content_votes (user_id, content_id)
       select $1, 'filler/' || g from generate_series(1, 20000) g`,
      [await userId('09120000001')],
    );

    resetBoardCache();
    const body = (await app.inject({ method: 'GET', url: '/votes/board' })).json();
    expect(body.seed_weight).toBeLessThan(0.02);
    const ranked = body.items
      .filter((i: { content_id: string }) => i.content_id === ART || i.content_id === OTHER)
      .map((i: { content_id: string }) => i.content_id);
    expect(ranked).toEqual([OTHER, ART]);
  });

  // The tiebreaker must never let engagement beat an actual vote.
  it('never lets the tiebreaker outrank a heart', async () => {
    const a = await loginAs(app, '09120000001');
    const b = await loginAs(app, '09120000002');
    // ART has one more heart; OTHER has all the engagement.
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: b }, payload: { content_id: ART } });
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: OTHER } });
    await logActivity('09120000001', 'highlight_created', OTHER);
    await logActivity('09120000002', 'highlight_created', OTHER);
    await pool.query(
      `insert into content_votes (user_id, content_id)
       select $1, 'filler/' || g from generate_series(1, 20000) g`,
      [await userId('09120000001')],
    );

    resetBoardCache();
    const body = (await app.inject({ method: 'GET', url: '/votes/board' })).json();
    const ranked = body.items
      .filter((i: { content_id: string }) => i.content_id === ART || i.content_id === OTHER)
      .map((i: { content_id: string }) => i.content_id);
    expect(ranked).toEqual([ART, OTHER]);
  });

  // Engagement is an aggregate of reader behaviour per article; the public board
  // owes nobody more than a heart count.
  it('does not publish the engagement number it sorts by', async () => {
    await loginAs(app, '09120000001');
    await logActivity('09120000001', 'highlight_created', ART);
    resetBoardCache();
    const body = (await app.inject({ method: 'GET', url: '/votes/board' })).json();
    expect(Object.keys(body.items[0]).sort()).toEqual(['content_id', 'hearts', 'score']);
  });

  it('orders equal scores deterministically', async () => {
    const a = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: OTHER } });

    resetBoardCache();
    const first = (await app.inject({ method: 'GET', url: '/votes/board' })).json();
    resetBoardCache();
    const second = (await app.inject({ method: 'GET', url: '/votes/board' })).json();
    expect(first.items).toEqual(second.items);
  });

  it('drops the votes of a deleted account', async () => {
    const a = await loginAs(app, '09120000001');
    await app.inject({ method: 'POST', url: '/votes', headers: { cookie: a }, payload: { content_id: ART } });
    await pool.query('delete from profiles where phone = $1', ['09120000001']);

    resetBoardCache();
    const body = (await app.inject({ method: 'GET', url: '/votes/board' })).json();
    expect(body.total_hearts).toBe(0);
  });
});
