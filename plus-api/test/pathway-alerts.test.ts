import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';
import { getPathways } from '../src/pathways.js';
import {
  pathwayStandings, runPathwayAlerts, levelFor, alertable,
} from '../src/services/pathway-standings.js';

let app: FastifyInstance;
let cookie: string;
const phone = '09121200077';
const founderPhone = '09121200078';

const basic = 'Basic ' + Buffer.from(
  `${config.admin.user}:${config.admin.password}`).toString('base64');

// A real SHORT pathway (17 steps), so a case can push somebody to the end
// without inventing content ids that resolve nowhere.
const PATHWAY_ID = 'digital';
const STEPS = getPathways().find((p) => p.id === PATHWAY_ID)!.steps.map((s) => s.content_id);
const BUNDLE_IDS = new Set(getPathways().filter((p) => p.kind === 'bundle').map((p) => p.id));

// This file retunes shared config, and config is a process-wide singleton that
// outlives the file. helpers.ts already had to learn this the hard way with
// league_config: a knob left changed here decides whether some LATER file
// passes, which makes the failure depend on file order and surface in
// somebody else's commit. So: originals captured once, restored in afterAll.
const ORIGINAL = {
  nearRemaining: config.pathwayAlert.nearRemaining,
  alertPhone: config.pathwayAlert.alertPhone,
  supportPhone: config.support.alertPhone,
};

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  cookie = await loginAs(app, phone);
  config.pathwayAlert.nearRemaining = 5;
  config.pathwayAlert.alertPhone = '';
  config.support.alertPhone = '';
});

afterAll(async () => {
  config.pathwayAlert.nearRemaining = ORIGINAL.nearRemaining;
  config.pathwayAlert.alertPhone = ORIGINAL.alertPhone;
  config.support.alertPhone = ORIGINAL.supportPhone;
  await app?.close();
  await pool.end();
});

async function userId(p = phone): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [p]);
  return r.rows[0].id;
}

async function setTier(tier: string, p = phone): Promise<void> {
  await pool.query('update profiles set tier = $2 where phone = $1', [p, tier]);
}

/** Mark content read, the way the reading tracker does. */
/** The reader said «بله» to «گواهی می‌خواهی؟» — enrols them too. */
async function wantCert(p = phone, intent: 'wanted' | 'declined' = 'wanted'): Promise<void> {
  const id = await userId(p);
  await pool.query(
    `insert into user_pathways (user_id, pathway_id, certificate_intent, certificate_intent_at) values ($1, $2, $3, now())
     on conflict (user_id, pathway_id) do update set certificate_intent = excluded.certificate_intent`,
    [id, PATHWAY_ID, intent],
  );
}

async function consume(contentIds: string[], p = phone): Promise<void> {
  const id = await userId(p);
  for (const contentId of contentIds) {
    await pool.query(
      `insert into user_activity (user_id, action, content_id) values ($1, 'article_completed', $2)`,
      [id, contentId],
    );
  }
}

/** A founder account whose phone is the configured alert target. */
async function makeFounder(): Promise<string> {
  await loginAs(app, founderPhone);
  config.pathwayAlert.alertPhone = founderPhone;
  return userId(founderPhone);
}

function standingFor(rows: Awaited<ReturnType<typeof pathwayStandings>>, id = PATHWAY_ID) {
  return rows.find((s) => s.pathway_id === id);
}

describe('pathway standings', () => {
  it('derives progress from consumption alone, with no enrollment anywhere', async () => {
    await setTier('premium');
    await consume(STEPS.slice(0, 4));

    const rows = await pathwayStandings();
    const s = standingFor(rows)!;
    expect(s.completed_steps).toBe(4);
    expect(s.total_steps).toBe(STEPS.length);
    expect(s.remaining).toBe(STEPS.length - 4);
    expect(s.enrolled).toBe(false);
    // Nothing was written to the enrollment cache — the whole point.
    const cache = await pool.query('select 1 from user_pathways');
    expect(cache.rowCount).toBe(0);
  });

  it('counts completed steps anywhere, not the resume cursor', async () => {
    await setTier('premium');
    // Skip the FIRST step and read every other one. computeProgress's
    // current_step would say 0; what matters here is that one step is left.
    await consume(STEPS.slice(1));

    const s = standingFor(await pathwayStandings())!;
    expect(s.completed_steps).toBe(STEPS.length - 1);
    expect(s.remaining).toBe(1);
  });

  it('never reports a bundle', async () => {
    await setTier('premium');
    await consume(STEPS);
    const rows = await pathwayStandings();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.filter((r) => BUNDLE_IDS.has(r.pathway_id))).toHaveLength(0);
  });

  it('omits a pathway the reader has not touched at all', async () => {
    await setTier('premium');
    await consume(STEPS.slice(0, 2));
    const rows = await pathwayStandings();
    for (const r of rows) expect(r.completed_steps).toBeGreaterThan(0);
  });

  it('sorts fewest-remaining first', async () => {
    await setTier('premium');
    await consume(STEPS);
    const rows = await pathwayStandings();
    const remaining = rows.map((r) => r.remaining);
    expect([...remaining].sort((a, b) => a - b)).toEqual(remaining);
  });
});

describe('who the alert is for — whoever SAID they want the certificate', () => {
  it('a premium reader who never answered is in the table, not in the alert', async () => {
    await setTier('premium');
    await consume(STEPS.slice(0, STEPS.length - 2));
    const s = standingFor(await pathwayStandings())!;
    expect(s.certificate_intent).toBeNull();
    expect(alertable(s)).toBe(false);
    expect((await runPathwayAlerts(new Date())).crossings).toHaveLength(0);
  });

  it('a reader who enrolled but declined stays out — and the answer is on the row', async () => {
    await setTier('premium');
    await wantCert(phone, 'declined');
    await consume(STEPS.slice(0, STEPS.length - 2));
    const s = standingFor(await pathwayStandings())!;
    expect(s.enrolled).toBe(true);
    expect(s.certificate_intent).toBe('declined');
    expect(alertable(s)).toBe(false);
  });

  it('«بله» is the whole signal — tier and enrolment add nothing to it', async () => {
    await wantCert(); // tier stays free: they cannot sit, but they asked, and the founder should see it
    await consume(STEPS.slice(0, 15));
    const s = standingFor(await pathwayStandings())!;
    expect(s.certificate_intent).toBe('wanted');
    expect(alertable(s)).toBe(true);
  });
});

describe('levelFor', () => {
  const base = {
    user_id: 'u', display_name: 'x', tier: 'premium', pathway_id: 'p', title_fa: 't',
    total_steps: 20, enrolled: true, started_at: null, certificate_intent: 'wanted', alerted: null,
  } as const;
  const at = (remaining: number) => levelFor(
    { ...base, remaining, completed_steps: 20 - remaining }, 5,
  );

  it('is done at zero, near up to the threshold, and silent beyond it', () => {
    expect(at(0)).toBe('done');
    expect(at(1)).toBe('near');
    expect(at(5)).toBe('near');
    expect(at(6)).toBeNull();
  });
});

describe('runPathwayAlerts', () => {
  it('announces a near-the-end reader once and never again', async () => {
    await setTier('premium');
    await wantCert();
    const founder = await makeFounder();
    await consume(STEPS.slice(0, STEPS.length - 3)); // 3 remaining

    const first = await runPathwayAlerts(new Date());
    expect(first.crossings).toHaveLength(1);
    expect(first.crossings[0].level).toBe('near');
    expect(first.crossings[0].remaining).toBe(3);
    expect(first.notified).toBe(true);

    const notice = await pool.query(
      `select title, body from notification_log where user_id = $1 order by id desc limit 1`,
      [founder],
    );
    expect(notice.rows[0].title).toContain('نزدیک');
    expect(notice.rows[0].body).toContain('/admin');

    const second = await runPathwayAlerts(new Date());
    expect(second.crossings).toHaveLength(0);
  });

  it('records the marker on the reader, not the founder', async () => {
    await setTier('premium');
    await wantCert();
    await makeFounder();
    await consume(STEPS.slice(0, STEPS.length - 2));
    await runPathwayAlerts(new Date());

    const reader = await userId();
    const marks = await pool.query<{ user_id: string; meta: Record<string, unknown> }>(
      `select user_id, meta from user_activity where action = 'pathway_milestone'`,
    );
    expect(marks.rowCount).toBe(1);
    expect(marks.rows[0].user_id).toBe(reader);
    expect(marks.rows[0].meta.pathway_id).toBe(PATHWAY_ID);
    expect(marks.rows[0].meta.level).toBe('near');
  });

  it('announces a finished pathway as done, without a near first', async () => {
    await setTier('premium');
    await wantCert();
    await makeFounder();
    await consume(STEPS); // straight to zero

    const run = await runPathwayAlerts(new Date());
    const mine = run.crossings.filter((c) => c.pathway_id === PATHWAY_ID);
    expect(mine).toHaveLength(1);
    expect(mine[0].level).toBe('done');
    expect(mine[0].remaining).toBe(0);
  });

  it('still announces done for someone already announced as near', async () => {
    await setTier('premium');
    await wantCert();
    await makeFounder();
    await consume(STEPS.slice(0, STEPS.length - 3));
    expect((await runPathwayAlerts(new Date())).crossings).toHaveLength(1);

    await consume(STEPS.slice(STEPS.length - 3));
    const run = await runPathwayAlerts(new Date());
    const mine = run.crossings.filter((c) => c.pathway_id === PATHWAY_ID);
    expect(mine).toHaveLength(1);
    expect(mine[0].level).toBe('done');
  });

  it('stays quiet when a publish grows a pathway under a finished reader', async () => {
    await setTier('premium');
    await wantCert();
    await makeFounder();
    const reader = await userId();
    // Already announced as done.
    await pool.query(
      `insert into user_activity (user_id, action, meta) values ($1, 'pathway_milestone', $2)`,
      [reader, JSON.stringify({ pathway_id: PATHWAY_ID, level: 'done', remaining: 0 })],
    );
    // Two steps of the pathway are now unread — exactly what step 5.6 does when
    // it files new content into an existing pathway.
    await consume(STEPS.slice(0, STEPS.length - 2));

    const s = standingFor(await pathwayStandings())!;
    expect(s.alerted).toBe('done');
    expect(levelFor(s, 5)).toBe('near');
    const run = await runPathwayAlerts(new Date());
    expect(run.crossings.filter((c) => c.pathway_id === PATHWAY_ID)).toHaveLength(0);
  });

  it('writes the markers even when nobody is configured to be told', async () => {
    await setTier('premium');
    await wantCert();
    config.pathwayAlert.alertPhone = '';
    config.support.alertPhone = '';
    await consume(STEPS.slice(0, STEPS.length - 1));

    const run = await runPathwayAlerts(new Date());
    expect(run.crossings.length).toBeGreaterThan(0);
    expect(run.notified).toBe(false);
    // The claim is what stops tomorrow's run repeating week-old news.
    expect((await runPathwayAlerts(new Date())).crossings).toHaveLength(0);
  });

  it('falls back to the support alert phone', async () => {
    await setTier('premium');
    await wantCert();
    await loginAs(app, founderPhone);
    config.support.alertPhone = founderPhone;
    await consume(STEPS.slice(0, STEPS.length - 1));

    expect((await runPathwayAlerts(new Date())).notified).toBe(true);
  });

  it('sends ONE message however many readers cross at once', async () => {
    const founder = await makeFounder();
    const others = ['09121200081', '09121200082', '09121200083'];
    for (const p of others) {
      await loginAs(app, p);
      await setTier('premium', p);
      await wantCert(p);
      await consume(STEPS.slice(0, STEPS.length - 2), p);
    }

    const run = await runPathwayAlerts(new Date());
    expect(run.crossings.filter((c) => c.pathway_id === PATHWAY_ID)).toHaveLength(3);

    const notices = await pool.query(
      `select count(*)::int as n from notification_log where user_id = $1`,
      [founder],
    );
    expect(notices.rows[0].n).toBe(1);
  });
});

describe('GET /admin/pathways', () => {
  it('buckets by urgency and reports the settings it used', async () => {
    await setTier('premium');
    await wantCert();
    await consume(STEPS.slice(0, STEPS.length - 2));

    const res = await app.inject({
      method: 'GET', url: '/admin/pathways', headers: { authorization: basic },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.near_remaining).toBe(5);
    expect(body.alert_hour).toBe(config.pathwayAlert.hour);
    expect(body.counts.readers).toBe(1);

    const row = (body.near as Array<Record<string, unknown>>)
      .find((r) => r.pathway_id === PATHWAY_ID)!;
    expect(row.remaining).toBe(2);
    expect(row.alertable).toBe(true);
    expect(row.alerted).toBeNull();
  });

  it('shows a free reader with alertable false rather than hiding them', async () => {
    await consume(STEPS.slice(0, STEPS.length - 1));
    const res = await app.inject({
      method: 'GET', url: '/admin/pathways', headers: { authorization: basic },
    });
    const row = (res.json().near as Array<Record<string, unknown>>)
      .find((r) => r.pathway_id === PATHWAY_ID)!;
    expect(row.tier).toBe('free');
    expect(row.alertable).toBe(false);
  });

  it('refuses without admin credentials', async () => {
    const res = await app.inject({ method: 'GET', url: '/admin/pathways' });
    expect(res.statusCode).toBe(401);
  });

  it('runs the sweep on demand and reports what it found', async () => {
    await setTier('premium');
    await wantCert();
    await makeFounder();
    await consume(STEPS.slice(0, STEPS.length - 1));

    const res = await app.inject({
      method: 'POST', url: '/admin/pathways/run-alerts', headers: { authorization: basic },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().crossings.length).toBeGreaterThan(0);
    expect(res.json().notified).toBe(true);

    const again = await app.inject({
      method: 'POST', url: '/admin/pathways/run-alerts', headers: { authorization: basic },
    });
    expect(again.json().crossings).toHaveLength(0);
  });
});

describe('a pathway flagged `certificate: pending` is not in the standings at all', () => {
  it('has no row, however far anybody is along it — there is no exam to prepare', async () => {
    const PENDING = 'ai-dentistry';
    const uid = await userId();
    await pool.query(`insert into user_pathways (user_id, pathway_id, current_step, certificate_intent) values ($1, $2, 0, 'wanted')`, [uid, PENDING]);
    const rows = await pathwayStandings();
    expect(rows.some((r) => r.pathway_id === PENDING)).toBe(false);
  });
});
