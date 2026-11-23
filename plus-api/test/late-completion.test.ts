// Active, but never counted — three server-side ways a real day of study went
// missing (user report 1405/09: «هر روز اومدم، سه روز سپر خورده»), pinned here.
//
// 1. A completion the browser could not deliver at once (outbox.js) was dated
//    on ARRIVAL: read on Saturday, delivered Monday morning, counted Monday —
//    Saturday took a shield. The outbox now sends `earned_at`, and the server
//    dates the row on it inside bounds that can never rewrite history.
// 2. Every read of an /en/ mirror was a 409 the outbox re-sent for thirty days
//    and that never counted. It is now credited to the Persian page it mirrors.
// 3. A premium card answered before it was due wrote nothing at all, though
//    review.js lit the flame for it. It now keeps the day (`review_early`) and
//    still pays nothing.
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { dayInTz } from '../src/services/time.js';
import { leagueWeek } from '../src/services/league.js';
import { getLeagueConfig } from '../src/services/league-config.js';
import { EARNED_AT_MAX_AGE_MS } from '../src/services/activity.js';
import { QUALIFYING_ACTIONS } from '../src/services/streak.js';
import { SCORING_ACTIONS } from '../src/services/score.js';

let app: FastifyInstance;
let cookie: string;
const phone = '09121200951';
const HOUR = 3600 * 1000;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

const post = (payload: Record<string, unknown>) => app.inject({
  method: 'POST', url: '/activity', headers: { cookie }, payload,
});

async function rows(action: string): Promise<Array<{ content_id: string | null; day: string; meta: Record<string, unknown> }>> {
  const r = await pool.query<{ content_id: string | null; day: string; meta: Record<string, unknown> }>(
    `select a.content_id, to_char(a.created_at at time zone $3, 'YYYY-MM-DD') as day, a.meta
       from user_activity a join profiles p on p.id = a.user_id
      where p.phone = $1 and a.action = $2 order by a.created_at`,
    [phone, action, config.streakTimezone],
  );
  return r.rows;
}

async function keptDays(): Promise<string[]> {
  return (await rows('streak_kept')).map((r) => String(r.meta.day));
}

/** Would an instant `msAgo` in the past still be in this league week? */
async function sameLeagueWeek(msAgo: number): Promise<boolean> {
  const tz = (await getLeagueConfig()).timezone;
  const now = new Date();
  return leagueWeek(dayInTz(new Date(now.getTime() - msAgo), tz)).week_start
    === leagueWeek(dayInTz(now, tz)).week_start;
}

describe('a late completion is dated on the day it was earned', () => {
  it('yesterday\'s read delivered today keeps yesterday', async () => {
    const earned = Date.now() - 26 * HOUR;
    const res = await post({ action: 'article_completed', content_id: 'insight/insight-1', earned_at: earned });
    expect(res.statusCode).toBe(200);
    const earnedDay = dayInTz(new Date(earned));
    const today = dayInTz(new Date());
    if (await sameLeagueWeek(26 * HOUR)) {
      expect((await rows('article_completed'))[0].day).toBe(earnedDay);
      expect((await rows('article_completed'))[0].meta.received_at).toBeTruthy();
      expect(await keptDays()).toEqual([earnedDay]);
      // …and today's own activity then continues the run, no shield involved.
      await post({ action: 'article_completed', content_id: 'insight/insight-2' });
      expect(await keptDays()).toEqual([earnedDay, today]);
      expect(await rows('streak_freeze_used')).toEqual([]);
    } else {
      // Across a league-week boundary the row is dated on arrival (XP must
      // never land in a week that may already be finalized).
      expect(await keptDays()).toEqual([today]);
    }
  });

  it('never dates a row before the last counted day (the engine is forward-only)', async () => {
    await post({ action: 'article_completed', content_id: 'insight/insight-1' });
    const today = dayInTz(new Date());
    await post({ action: 'article_completed', content_id: 'insight/insight-2', earned_at: Date.now() - 26 * HOUR });
    expect((await rows('article_completed')).map((r) => r.day)).toEqual([today, today]);
    expect(await keptDays()).toEqual([today]);
  });

  it('ignores an earned time that is too old, in the future, or on a non-completion', async () => {
    const today = dayInTz(new Date());
    await post({ action: 'article_completed', content_id: 'insight/insight-1', earned_at: Date.now() - EARNED_AT_MAX_AGE_MS - HOUR });
    await post({ action: 'article_completed', content_id: 'insight/insight-2', earned_at: Date.now() + 5 * HOUR });
    await post({ action: 'article_viewed', content_id: 'insight/insight-3', earned_at: Date.now() - 26 * HOUR });
    expect((await rows('article_completed')).map((r) => r.day)).toEqual([today, today]);
    expect((await rows('article_viewed')).map((r) => r.day)).toEqual([today]);
  });
});

describe('an English mirror counts as the page it mirrors', () => {
  it('credits /en/ reads to the Persian content_id', async () => {
    const res = await post({ action: 'article_completed', content_id: 'insight/en/insight-10' });
    expect(res.statusCode).toBe(200);
    expect((await rows('article_completed')).map((r) => r.content_id)).toEqual(['insight/insight-10']);
    expect(await keptDays()).toHaveLength(1);
  });

  it('a mirror with no Persian twin is a final 404, not a 409 to re-send', async () => {
    const res = await post({ action: 'article_completed', content_id: 'insight/en/no-such-page' });
    expect(res.statusCode).toBe(404);
    expect(await rows('article_completed')).toEqual([]);
  });
});

describe('an early premium review keeps the day and pays nothing', () => {
  it('is qualifying, never scoring', () => {
    expect(QUALIFYING_ACTIONS.has('review_early')).toBe(true);
    expect(SCORING_ACTIONS).not.toContain('review_early');
  });

  it('writes one review_early per Tehran day and counts the day', async () => {
    await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
    const hl = await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: 'glossary/resin-cements', exact: 'پیوند به عاج همیشه ضعیف‌تر است' },
    });
    const id = hl.json().highlight.id as string;
    // A fresh card is due tomorrow (box 1), so this answer is early. Creating
    // the highlight already counted today, so clear that to see the review's
    // own effect on the streak.
    await pool.query(
      `delete from user_activity where action in ('highlight_created', 'streak_kept')
         and user_id = (select id from profiles where phone = $1)`, [phone],
    );
    await pool.query(`update profiles set current_streak = 0, last_active_day = null where phone = $1`, [phone]);

    for (const result of ['remembered', 'forgot']) {
      const res = await app.inject({
        method: 'POST', url: '/review/answer', headers: { cookie },
        payload: { highlight_id: id, result },
      });
      expect(res.statusCode).toBe(200);
    }
    expect(await rows('review_finished')).toEqual([]);
    expect(await rows('review_early')).toHaveLength(1);
    expect(await keptDays()).toEqual([dayInTz(new Date())]);
  });
});
