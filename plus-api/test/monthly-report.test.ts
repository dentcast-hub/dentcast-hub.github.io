import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getClusters } from '../src/content-index.js';
import { getPathways } from '../src/pathways.js';
import { getBadgeCatalog } from '../src/badges.js';
import { jalaliMonth, startOfDayInstant, addDays, dayInTz } from '../src/services/time.js';
import { dayToJalali } from '../src/services/jalali.js';
import {
  monthWindow, shiftMonthKey, longestRun, computeMonthlyReport, runMonthlyReports,
  reportHeadline, availableMonths,
} from '../src/services/monthly-report.js';

let app: FastifyInstance;
let cookie: string;
const phone = '09121200091';
const otherPhone = '09121200092';

// The month the report is ABOUT is always the last completed one, relative to
// the real clock, so the calendar arithmetic under test never rots.
const CURRENT = jalaliMonth(new Date(), config.streakTimezone);
const PREV = shiftMonthKey(CURRENT, -1);
const PREV2 = shiftMonthKey(CURRENT, -2);
const W = monthWindow(PREV)!;
const W2 = monthWindow(PREV2)!;
const CUR = monthWindow(CURRENT)!;

/** An instant `days` days into the window, at noon Tehran — never on a boundary. */
function inside(w: { from_day: string }, days = 3): Date {
  return new Date(startOfDayInstant(addDays(w.from_day, days), config.streakTimezone).getTime() + 12 * 3600_000);
}

// Two real clusters and a real pathway step, so nothing here resolves nowhere.
const [CLUSTER_A, CLUSTER_B] = getClusters()
  .filter((c) => c.contentCount >= 3)
  .sort((a, b) => b.contentCount - a.contentCount);
const PATHWAY = getPathways().find((p) => p.id === 'occlusion' && !p.kind)!;
const STEP_0 = PATHWAY.steps[0].content_id;
const LEVELED_BADGE = getBadgeCatalog().badges.find((b) => b.leveled && b.levels && b.levels.length >= 2)!;
const ONESHOT_BADGE = getBadgeCatalog().badges.find((b) => !b.leveled)!;

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function userId(p = phone): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [p]);
  return r.rows[0].id;
}

/** Backdate the account so the months under test exist for it. */
async function ageAccount(p = phone, before: Date = W2.start): Promise<void> {
  await pool.query('update profiles set created_at = $2 where phone = $1', [p, new Date(before.getTime() - 40 * 86_400_000)]);
}

async function setTier(tier: string, p = phone): Promise<void> {
  await pool.query('update profiles set tier = $2 where phone = $1', [p, tier]);
}

async function act(action: string, contentId: string | null, at: Date, meta: Record<string, unknown> = {}, p = phone): Promise<void> {
  await pool.query(
    `insert into user_activity (user_id, action, content_id, meta, created_at) values ($1, $2, $3, $4::jsonb, $5)`,
    [await userId(p), action, contentId, JSON.stringify(meta), at],
  );
}

async function highlight(contentId: string, at: Date, note: string | null = null, p = phone): Promise<void> {
  await pool.query(
    `insert into highlights (user_id, content_id, exact, note, created_at) values ($1, $2, 'متن', $3, $4)`,
    [await userId(p), contentId, note, at],
  );
}

async function kept(day: string, p = phone): Promise<void> {
  const at = new Date(startOfDayInstant(day, config.streakTimezone).getTime() + 15 * 3600_000);
  await act('streak_kept', null, at, { day, streak: 1 }, p);
}

async function get(url: string, c = cookie) {
  return app.inject({ method: 'GET', url, headers: { cookie: c } });
}

describe('the Jalali month window', () => {
  it('spans exactly the days ICU says the month has', () => {
    const w = monthWindow('1405-06')!; // شهریور: 31 days
    expect(w.days).toBe(31);
    expect(dayToJalali(w.from_day)).toEqual({ jy: 1405, jm: 6, jd: 1 });
    expect(dayToJalali(w.to_day)).toEqual({ jy: 1405, jm: 6, jd: 31 });
    expect(dayToJalali(addDays(w.to_day, 1)).jm).toBe(7);
    expect(w.title_fa).toBe('شهریور ۱۴۰۵');
    const mehr = monthWindow('1405-07')!;
    expect(mehr.days).toBe(30);
    expect(mehr.start.getTime()).toBe(w.end.getTime());
  });

  it('lets ICU decide how long Esfand is', () => {
    const w = monthWindow('1405-12')!;
    expect([29, 30]).toContain(w.days);
    expect(dayToJalali(addDays(w.to_day, 1))).toEqual({ jy: 1406, jm: 1, jd: 1 });
  });

  it('refuses what is not a month', () => {
    expect(monthWindow('1405-13')).toBeNull();
    expect(monthWindow('1405-00')).toBeNull();
    expect(monthWindow('nope')).toBeNull();
  });

  it('shifts across a year boundary in both directions', () => {
    expect(shiftMonthKey('1405-01', -1)).toBe('1404-12');
    expect(shiftMonthKey('1405-12', 1)).toBe('1406-01');
    expect(shiftMonthKey('1405-06', -7)).toBe('1404-11');
  });

  it('measures the longest run of consecutive days', () => {
    expect(longestRun([])).toBe(0);
    expect(longestRun(['2026-08-24'])).toBe(1);
    expect(longestRun(['2026-08-24', '2026-08-25', '2026-08-27', '2026-08-28', '2026-08-29'])).toBe(3);
    expect(longestRun(['2026-08-29', '2026-08-28', '2026-08-28'])).toBe(2);
  });
});

describe('the gate', () => {
  it('blocks a free user with 402 and a stranger with 401', async () => {
    expect((await get('/report/monthly')).statusCode).toBe(402);
    expect((await app.inject({ method: 'GET', url: '/report/monthly' })).statusCode).toBe(401);
    expect((await get('/report/months')).statusCode).toBe(402);
  });
});

describe('GET /report/months', () => {
  it('lists every month from the account\'s first to the current one, newest first', async () => {
    await setTier('premium');
    await ageAccount();
    const res = await get('/report/months');
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.current).toBe(CURRENT);
    expect(body.months[0]).toBe(CURRENT);
    expect(body.months).toContain(PREV);
    expect(body.months).toContain(PREV2);
    expect(body.months.length).toBeGreaterThanOrEqual(3);
  });

  it('a brand-new account owns only the current month', async () => {
    await setTier('premium');
    const body = (await get('/report/months')).json();
    expect(body.months).toEqual([CURRENT]);
  });
});

describe('GET /report/monthly', () => {
  it('defaults to the last completed month and refuses the future, the bad, and the pre-account', async () => {
    await setTier('premium');
    await ageAccount();
    const res = await get('/report/monthly');
    expect(res.statusCode).toBe(200);
    expect(res.json().month.key).toBe(PREV);
    expect(res.json().in_progress).toBe(false);

    expect((await get(`/report/monthly?month=${shiftMonthKey(CURRENT, 1)}`)).json().error).toBe('future_month');
    expect((await get('/report/monthly?month=1405-13')).json().error).toBe('bad_month');
    expect((await get('/report/monthly?month=1300-01')).json().error).toBe('before_account');
    expect((await get('/report/monthly?month=abc')).statusCode).toBe(400);
  });

  it('marks the current month as still moving', async () => {
    await setTier('premium');
    const res = await get(`/report/monthly?month=${CURRENT}`);
    expect(res.statusCode).toBe(200);
    expect(res.json().in_progress).toBe(true);
    const today = dayToJalali(dayInTz(new Date(), config.streakTimezone)).jd;
    expect(res.json().calendar.today).toBe(today);
  });

  it('records one usage row, like the compass', async () => {
    await setTier('premium');
    await get(`/report/monthly?month=${CURRENT}`);
    const r = await pool.query(
      `select meta from user_activity where user_id = $1 and action = 'report_viewed'`, [await userId()],
    );
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].meta.month).toBe(CURRENT);
  });

  it('counts the month, and only the month', async () => {
    await setTier('premium');
    await ageAccount();
    const idA = CLUSTER_A.contentIds[0];
    const idA2 = CLUSTER_A.contentIds[1];
    // Inside PREV:
    await act('article_completed', idA, inside(W, 2));
    await act('article_completed', idA, inside(W, 9)); // re-read: still ONE article
    await act('article_completed', idA2, inside(W, 10));
    await act('episode_listened', 'episodes/ep-1', inside(W, 4));
    await act('review_finished', idA, inside(W, 5), { result: 'remembered' });
    await act('review_finished', idA, inside(W, 6), { result: 'forgot' });
    await act('streak_freeze_used', null, inside(W, 7), { frozen_day: addDays(W.from_day, 6), day: addDays(W.from_day, 7) });
    await highlight(idA, inside(W, 2), 'یادداشت');
    await highlight(idA, inside(W, 3));
    await kept(addDays(W.from_day, 2));
    await kept(addDays(W.from_day, 3));
    await kept(addDays(W.from_day, 4));
    await kept(addDays(W.from_day, 9));
    // Outside PREV (the month before, and the current one):
    await act('article_completed', CLUSTER_A.contentIds[2], inside(W2, 5));
    await highlight(CLUSTER_A.contentIds[2], inside(W2, 5));
    await kept(addDays(W2.from_day, 5));
    await act('article_completed', 'insight/insight-99', inside(CUR, 0));
    // The very first instant of the month belongs to it; the instant before does not.
    await act('episode_listened', 'episodes/ep-2', W.start);
    await act('episode_listened', 'episodes/ep-3', new Date(W.start.getTime() - 1));

    const res = await get(`/report/monthly?month=${PREV}`);
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.counts).toEqual({
      articles: 2, episodes: 2, highlights: 2, notes: 1, cards_reviewed: 2, active_days: 4,
    });
    expect(body.previous).toEqual({
      articles: 1, episodes: 1, highlights: 1, notes: 0, cards_reviewed: 0, active_days: 1,
    });
    expect(body.longest_run).toBe(3);
    expect(body.shields_used).toBe(1);
    expect(body.calendar.active).toEqual([3, 4, 5, 10]);
    expect(body.calendar.shielded).toEqual([7]);
    expect(body.calendar.today).toBe(W.days);
    expect(body.calendar.first_weekday).toBe((new Date(`${W.from_day}T12:00:00Z`).getUTCDay() + 1) % 7);
    expect(body.first_month).toBe(jalaliMonth(new Date(W2.start.getTime() - 40 * 86_400_000), config.streakTimezone));
  });

  it('tells a pillar\'s coverage before and after, and names the dormant ones', async () => {
    await setTier('premium');
    await ageAccount();
    // Cluster A: one item read before the month, one inside it.
    await act('article_completed', CLUSTER_A.contentIds[0], inside(W2, 5));
    await act('article_completed', CLUSTER_A.contentIds[1], inside(W, 5));
    // Cluster B: read before, untouched this month -> dormant.
    await highlight(CLUSTER_B.contentIds[0], inside(W2, 6));

    const body = (await get(`/report/monthly?month=${PREV}`)).json();
    expect(body.pillars).toHaveLength(1);
    const a = body.pillars[0];
    expect(a.key).toBe(CLUSTER_A.key);
    expect(a.read_this_month).toBe(1);
    expect(a.coverage_before_pct).toBe(Math.round((1 / CLUSTER_A.contentCount) * 100));
    expect(a.coverage_after_pct).toBe(Math.round((2 / CLUSTER_A.contentCount) * 100));
    expect(body.dormant.map((d: { key: string }) => d.key)).toEqual([CLUSTER_B.key]);
    expect(body.dormant[0].read_before).toBe(1);
    // Never-touched clusters are nobody's business here.
    expect(body.dormant.length + body.pillars.length).toBeLessThan(getClusters().length);
  });

  it('reads a highlighted item as consumed in the month it was FIRST touched', async () => {
    await setTier('premium');
    await ageAccount();
    const id = CLUSTER_A.contentIds[0];
    await highlight(id, inside(W2, 3)); // first touch: the month before
    await act('article_completed', id, inside(W, 3)); // finished this month
    const body = (await get(`/report/monthly?month=${PREV}`)).json();
    expect(body.counts.articles).toBe(1); // the completion event is this month's…
    expect(body.pillars).toEqual([]); // …but the item was already consumed, so coverage did not move
    expect(body.read_items).toEqual([]);
  });

  it('lists what was read this month, newest first, and counts the rest', async () => {
    await setTier('premium');
    await ageAccount();
    const ids = CLUSTER_A.contentIds.slice(0, 3);
    await act('article_completed', ids[0], inside(W, 1));
    await act('article_completed', ids[1], inside(W, 8));
    await highlight(ids[2], inside(W, 4));
    const body = (await get(`/report/monthly?month=${PREV}`)).json();
    expect(body.read_items.map((i: { content_id: string }) => i.content_id)).toEqual([ids[1], ids[2], ids[0]]);
    expect(body.read_items_total).toBe(3);
    expect(body.read_items[0].title).toBeTruthy();
    expect(body.read_items[0].url).toMatch(/^\//);
  });

  it('reports pathway steps taken this month, and a finish line crossed in it', async () => {
    await setTier('premium');
    await ageAccount();
    await act('article_completed', STEP_0, inside(W, 2));
    let body = (await get(`/report/monthly?month=${PREV}`)).json();
    // 149 steps are shared between pathways, so the same article can move two
    // of them at once — the report lists each pathway it moved.
    const find = (b: { pathways: { id: string }[] }) => b.pathways.find((p) => p.id === PATHWAY.id)!;
    expect(find(body)).toMatchObject({
      steps_this_month: 1, completed_steps: 1, total_steps: PATHWAY.steps.length,
      is_complete: false, completed_this_month: false,
    });

    // Finish the whole pathway inside the month.
    for (const s of PATHWAY.steps.slice(1)) await act('article_completed', s.content_id, inside(W, 10));
    body = (await get(`/report/monthly?month=${PREV}`)).json();
    expect(find(body).is_complete).toBe(true);
    expect(find(body).completed_this_month).toBe(true);
    expect(find(body).steps_this_month).toBe(PATHWAY.steps.length);
    // Bundles that share those steps are never listed.
    expect(body.pathways.every((p: { id: string }) => !getPathways().find((q) => q.id === p.id)?.kind)).toBe(true);
  });

  it('folds the league weeks whose Saturday falls in the month', async () => {
    await setTier('premium');
    await ageAccount();
    const uid = await userId();
    const tier = await pool.query<{ id: string }>(`select id from league_tiers where slug = 'acrylic'`);
    const mk = async (weekStart: string, rank: number | null, outcome: string | null, xp: number) => {
      const lg = await pool.query<{ id: string }>(
        `insert into leagues (tier_id, week_start, week_end, status, capacity_at_creation)
         values ($1, $2::date, ($2::date + 6), 'finalized', 8) returning id`,
        [tier.rows[0].id, weekStart],
      );
      await pool.query(
        `insert into league_members (league_id, user_id, week_start, weekly_xp, final_rank, outcome)
         values ($1, $2, $3::date, $4, $5, $6)`,
        [lg.rows[0].id, uid, weekStart, xp, rank, outcome],
      );
    };
    await mk(addDays(W.from_day, 1), 2, 'promoted', 40);
    await mk(addDays(W.from_day, 8), 5, 'stayed', 12);
    await mk(addDays(W2.from_day, 1), 1, 'promoted', 60); // the month before: not ours

    const body = (await get(`/report/monthly?month=${PREV}`)).json();
    expect(body.league.weeks).toHaveLength(2);
    expect(body.league.weeks[0]).toMatchObject({ tier_fa: 'آکریل', final_rank: 2, outcome: 'promoted', weekly_xp: 40, group_size: 1 });
    expect(body.league.weeks[0].week_start_fa).toMatch(/^[۰-۹]+ /);
    expect(body.league.best_rank).toBe(2);
    expect(body.league.promotions).toBe(1);
    expect(body.league.total_xp).toBe(52);
  });

  it('names the badges announced in the month, with the metal of a leveled one', async () => {
    await setTier('premium');
    await ageAccount();
    const uid = await userId();
    await pool.query(
      `insert into achievement_announcements (user_id, badge_key, level, announced_at) values
         ($1, $2, 2, $3), ($1, $4, 1, $5), ($1, 'no-such-badge', 1, $3)`,
      [uid, LEVELED_BADGE.key, inside(W, 4), ONESHOT_BADGE.key, inside(W, 6)],
    );
    const body = (await get(`/report/monthly?month=${PREV}`)).json();
    expect(body.badges).toHaveLength(2);
    expect(body.badges[0]).toMatchObject({ key: LEVELED_BADGE.key, level: 2, metal: LEVELED_BADGE.levels![1].tier, title_fa: LEVELED_BADGE.title_fa });
    expect(body.badges[1]).toMatchObject({ key: ONESHOT_BADGE.key, metal: null });
  });
});

describe('the headline', () => {
  it('names at most three things and the active days', () => {
    expect(reportHeadline({ articles: 4, episodes: 0, highlights: 12, notes: 2, cards_reviewed: 30, active_days: 9 }))
      .toBe('۴ مقاله، ۱۲ هایلایت، ۳۰ کارت مرور در ۹ روزِ فعال.');
    expect(reportHeadline({ articles: 1, episodes: 2, highlights: 3, notes: 0, cards_reviewed: 4, active_days: 0 }))
      .toBe('۱ مقاله، ۲ اپیزود، ۳ هایلایت.');
    expect(reportHeadline({ articles: 0, episodes: 0, highlights: 0, notes: 0, cards_reviewed: 0, active_days: 2 }))
      .toBe('۲ روزِ فعال.');
  });
});

describe('runMonthlyReports — the announcement', () => {
  /** 10:00 Tehran on Jalali day `jd` of the CURRENT month. */
  const at = (jd: number) => new Date(startOfDayInstant(addDays(CUR.from_day, jd - 1), config.streakTimezone).getTime() + 10 * 3600_000);

  async function sentRows(p = phone) {
    const r = await pool.query(
      `select kind, day, title, body, url, delivered from notification_log where user_id = $1 and kind = 'monthly_report' order by created_at`,
      [await userId(p)],
    );
    return r.rows;
  }

  it('announces last month once to a premium reader who did something in it', async () => {
    await setTier('premium');
    await ageAccount();
    await act('article_completed', CLUSTER_A.contentIds[0], inside(W, 2));
    await kept(addDays(W.from_day, 2));

    const first = await runMonthlyReports(at(2));
    expect(first).toEqual({ announced: 1, skipped: 0 });
    const rows = await sentRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe(`گزارش ${W.month_fa} آماده است`);
    expect(rows[0].body).toBe('۱ مقاله در ۱ روزِ فعال.');
    expect(rows[0].url).toBe(`/plus/report.html?month=${PREV}`);

    // The next morning inside the window: the row is the dedup.
    expect(await runMonthlyReports(at(3))).toEqual({ announced: 0, skipped: 0 });
    expect(await sentRows()).toHaveLength(1);
  });

  it('is silent past the grace window, for a free reader, and for an empty month', async () => {
    await ageAccount();
    await act('article_completed', CLUSTER_A.contentIds[0], inside(W, 2));
    // free:
    expect(await runMonthlyReports(at(2))).toEqual({ announced: 0, skipped: 0 });
    await setTier('premium');
    // past the window:
    expect(await runMonthlyReports(at(config.monthlyReport.graceDays + 1))).toEqual({ announced: 0, skipped: 0 });
    expect(await sentRows()).toHaveLength(0);

    // A second premium reader with nothing in the month is never knocked on.
    await loginAs(app, otherPhone);
    await setTier('premium', otherPhone);
    await ageAccount(otherPhone);
    expect(await runMonthlyReports(at(1))).toEqual({ announced: 1, skipped: 0 });
    expect(await sentRows(otherPhone)).toHaveLength(0);
  });

  it('does not announce a month the account did not exist in', async () => {
    await setTier('premium'); // created now, i.e. inside CURRENT
    await act('article_completed', CLUSTER_A.contentIds[0], inside(W, 2)); // backdated row, but no account then
    expect(await runMonthlyReports(at(1))).toEqual({ announced: 0, skipped: 0 });
  });

  it('a row whose activity is only a usage row is skipped as empty', async () => {
    await setTier('premium');
    await ageAccount();
    await act('compass_viewed', null, inside(W, 2));
    expect(await runMonthlyReports(at(1))).toEqual({ announced: 0, skipped: 1 });
    expect(await sentRows()).toHaveLength(0);
  });

  it('availableMonths bounds at the account\'s first month', async () => {
    await ageAccount();
    const months = await availableMonths(await userId(), new Date());
    expect(months[0]).toBe(CURRENT);
    expect(months[months.length - 1]).toBe(jalaliMonth(new Date(W2.start.getTime() - 40 * 86_400_000), config.streakTimezone));
    const w = monthWindow(PREV)!;
    const report = await computeMonthlyReport(await userId(), w, new Date());
    expect(report.month.key).toBe(PREV);
  });
});
