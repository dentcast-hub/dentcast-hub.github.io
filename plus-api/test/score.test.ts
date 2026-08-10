import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import {
  computeScore, POINTS_PER_ACTIVE_DAY, POINTS_PER_CONTENT,
} from '../src/services/score.js';

// The per-content component of the score. Before it existed, consumption only
// ever bought the day's first +10: the reported bug was a listener whose first
// podcast moved the number and whose next three did nothing, on a page type
// that is also excluded from the workbench and so cannot earn highlight points
// either.

let app: FastifyInstance;
let cookie: string;
let userId: string;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, '09121400077');
  userId = (await (await app.inject({ method: 'GET', url: '/me', headers: { cookie } })).json()).id;
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

function listen(contentId: string) {
  return app.inject({
    method: 'POST', url: '/activity', headers: { cookie },
    payload: { action: 'episode_listened', content_id: contentId },
  });
}

function read(contentId: string) {
  return app.inject({
    method: 'POST', url: '/activity', headers: { cookie },
    payload: { action: 'article_completed', content_id: contentId },
  });
}

const score = async () => (await computeScore(pool, userId)).score;

describe('per-content score', () => {
  it('the reported bug: a SECOND podcast on the same day still moves the score', async () => {
    await listen('episodes/episode-1');
    const afterFirst = await score();

    await listen('episodes/episode-2');
    const afterSecond = await score();

    // The first listen bought the active day (+10) AND its own content (+5).
    expect(afterFirst).toBe(POINTS_PER_ACTIVE_DAY + POINTS_PER_CONTENT);
    // The second buys no new day — but it is a new episode, so it must still pay.
    expect(afterSecond - afterFirst).toBe(POINTS_PER_CONTENT);

    await listen('episodes/episode-3');
    expect((await score()) - afterSecond).toBe(POINTS_PER_CONTENT);
  });

  it('replaying the SAME episode never pays twice inside one week', async () => {
    await listen('episodes/episode-1');
    const once = await score();

    for (let i = 0; i < 5; i += 1) await listen('episodes/episode-1');

    expect(await score()).toBe(once); // a loop must not beat working through the catalogue
  });

  // Re-listening pays again, but only once a week — the same window league.ts
  // prices xp_listen in. Rows are written straight to the log with explicit
  // dates because the rule is about the calendar, not about the request.
  it('the SAME episode pays again in a later week, and only once per week', async () => {
    // 2026-08-08 is a Saturday: week A = 08-08..08-14, week B = 08-15..08-21.
    await pool.query(
      `insert into user_activity (user_id, action, content_id, created_at) values
         ($1,'episode_listened','episodes/episode-1','2026-08-09T08:00:00Z'),
         ($1,'episode_listened','episodes/episode-1','2026-08-11T08:00:00Z'),
         ($1,'episode_listened','episodes/episode-1','2026-08-17T08:00:00Z')`,
      [userId],
    );
    // Two distinct weeks, three listens: two payments, not three and not one.
    expect((await computeScore(pool, userId)).content_completed).toBe(2);
  });

  // The asymmetry is deliberate (see score.ts): a podcast is re-heard on
  // purpose, a re-opened article is a revisit the workbench already pays for.
  it('re-READING the same article in a later week still pays only once', async () => {
    await pool.query(
      `insert into user_activity (user_id, action, content_id, created_at) values
         ($1,'article_completed','insight/insight-20','2026-08-09T08:00:00Z'),
         ($1,'article_completed','insight/insight-20','2026-08-17T08:00:00Z')`,
      [userId],
    );
    expect((await computeScore(pool, userId)).content_completed).toBe(1);
  });

  it('reading and listening to the same page are two engagements', async () => {
    await read('notecast/episode-38');
    const afterRead = await score();
    await listen('notecast/episode-38');

    // Same content_id, different action — the league already scores xp_read and
    // xp_listen separately for one page, and the score now agrees with it.
    expect((await score()) - afterRead).toBe(POINTS_PER_CONTENT);
  });

  it('articles pay per article too, not only through highlights', async () => {
    await read('insight/insight-20');
    const afterFirst = await score();
    await read('insight/insight-27');

    expect((await score()) - afterFirst).toBe(POINTS_PER_CONTENT);
  });

  it('an action with no content_id contributes no per-content points', async () => {
    await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'article_completed' },
    });
    const b = await computeScore(pool, userId);

    expect(b.content_completed).toBe(0);
    expect(b.score).toBe(POINTS_PER_ACTIVE_DAY); // the active day, and nothing else
  });

  // The single most consequential thing about sharing, and the one that would be
  // invisible in review: if `content_shared` ever joined SCORING_ACTIONS or the
  // streak's QUALIFYING_ACTIONS, one tap would mint an active day — worth 10
  // points and a day of streak — and score is never deducted, so every account
  // would keep it. Pinned as behaviour rather than trusted to a comment.
  it('a share earns no all-time score and no active day', async () => {
    await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'content_shared', content_id: 'insight/insight-31' },
    });
    const b = await computeScore(pool, userId);
    expect(b.score).toBe(0);
    expect(b.active_days).toBe(0);
    expect(b.content_completed).toBe(0);
  });

  it('a share of a FINISHED article still adds nothing beyond the read itself', async () => {
    await read('insight/insight-32');
    const before = await score();
    await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'content_shared', content_id: 'insight/insight-32' },
    });
    expect(await score()).toBe(before);
  });

  it('a review or a highlight buys no per-content points', async () => {
    await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'card_reviewed_manual', content_id: 'episodes/episode-1' },
    });
    expect((await computeScore(pool, userId)).content_completed).toBe(0);
  });

  it('the breakdown adds up to the score it reports', async () => {
    await listen('episodes/episode-1');
    await read('insight/insight-20');
    await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: 'insight/insight-20', exact: 'یک', color: 'yellow' },
    });

    const b = await computeScore(pool, userId);
    expect(b.content_completed).toBe(2);
    expect(b.score).toBe(
      b.active_days * POINTS_PER_ACTIVE_DAY
      + b.content_completed * POINTS_PER_CONTENT
      + b.total_highlights,
    );
  });

  it('active days still pay, and are not double-counted by the new component', async () => {
    // Three listens spread over three distinct Tehran days.
    await pool.query(
      `insert into user_activity (user_id, action, content_id, created_at) values
         ($1,'episode_listened','episodes/episode-1','2025-03-01T08:00:00Z'),
         ($1,'episode_listened','episodes/episode-2','2025-03-02T08:00:00Z'),
         ($1,'episode_listened','episodes/episode-3','2025-03-03T08:00:00Z')`,
      [userId],
    );
    const b = await computeScore(pool, userId);

    expect(b.active_days).toBe(3);
    expect(b.content_completed).toBe(3);
    expect(b.score).toBe(3 * POINTS_PER_ACTIVE_DAY + 3 * POINTS_PER_CONTENT);
  });
});

describe('/progress exposes the new component and its rank agrees with it', () => {
  it('reports content_completed and a rank derived from the same formula', async () => {
    await listen('episodes/episode-1');
    await listen('episodes/episode-2');
    await read('insight/insight-20');

    const body = await (await app.inject({
      method: 'GET', url: '/progress', headers: { cookie },
    })).json();

    expect(body.score_content_completed).toBe(3);
    expect(body.score_points_per_content).toBe(POINTS_PER_CONTENT);
    expect(body.score).toBe(POINTS_PER_ACTIVE_DAY + 3 * POINTS_PER_CONTENT);
    // The rank query is a second, whole-table copy of the arithmetic. If it ever
    // drifts from computeScore the user is ranked against a number that is not
    // the one on their card — with one user in the table, rank must be 1.
    expect(body.rank).toBe(1);
  });

  it('ranks a heavier listener ahead of a lighter one', async () => {
    for (let i = 1; i <= 6; i += 1) await listen('episodes/episode-' + i);
    const mine = await (await app.inject({
      method: 'GET', url: '/progress', headers: { cookie },
    })).json();

    const other = await loginAs(app, '09121400078');
    await app.inject({
      method: 'POST', url: '/activity', headers: { cookie: other },
      payload: { action: 'episode_listened', content_id: 'episodes/episode-1' },
    });
    const theirs = await (await app.inject({
      method: 'GET', url: '/progress', headers: { cookie: other },
    })).json();

    expect(mine.score).toBeGreaterThan(theirs.score);
    expect(mine.rank).toBe(1);
    expect(theirs.rank).toBe(2); // the same-day active bonus ties; the episodes break it
  });
});
