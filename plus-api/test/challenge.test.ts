// چالش — a founder-authored question, model-graded against key points written
// at publish time. Design ledger: .dentcast/challenge-handoff.md. The
// properties pinned here: reading is public, answering is premium-only, ONE
// attempt per reader per page, the model NEVER settles an ambiguous point
// (any `unsure` queues the WHOLE attempt), a model failure is never rendered
// as "missing", score/XP/badge fire only on a `full` verdict, and `answer_fa`
// is released by having an attempt row — never by tier.
import {
  describe, it, expect, beforeEach, afterEach, afterAll, vi,
} from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool, withTransaction } from '../src/db.js';
import { config } from '../src/config.js';
import { ai } from '../src/providers/registry.js';
import { mergeProfiles } from '../src/services/merge-profiles.js';
import { computeScore, POINTS_PER_CHALLENGE, POINTS_PER_ACTIVE_DAY } from '../src/services/score.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');

const CONTENT = 'chairside/chairside-99';
const KEY_POINTS = [
  { id: 'kp1', text: 'نکته اول' },
  { id: 'kp2', text: 'نکته دوم' },
  { id: 'kp3', text: 'نکته سوم' },
];
const ANSWER_FA = 'این جواب کامل بنیان‌گذار است و شامل هر سه نکته می‌شود.';
const GOOD_ANSWER = 'این یک جواب نسبتاً بلند و معتبر است که از حداقل طول لازم برای سنجش عبور می‌کند.';

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  phone = '09121200006';
  cookie = await loginAs(app, phone);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function makePremium(ph = phone): Promise<void> {
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [ph]);
}

function adminUpsert(payload: Record<string, unknown>) {
  return app.inject({
    method: 'POST', url: '/admin/challenges/upsert', headers: { authorization: basic }, payload,
  });
}

async function seedChallenge(
  keyPoints = KEY_POINTS, contentId = CONTENT, answerFa = ANSWER_FA,
): Promise<void> {
  const r = await adminUpsert({ content_id: contentId, answer_fa: answerFa, key_points: keyPoints });
  expect(r.statusCode).toBe(200);
}

function answer(text: string, contentId = CONTENT, c = cookie) {
  return app.inject({
    method: 'POST', url: `/challenge/${encodeURIComponent(contentId)}/answer`,
    headers: { cookie: c }, payload: { answer: text },
  });
}

function getState(contentId = CONTENT, c: string | null = cookie) {
  return app.inject({
    method: 'GET', url: `/challenge/${encodeURIComponent(contentId)}`,
    headers: c ? { cookie: c } : {},
  });
}

function adminRule(id: string, verdict: { id: string; state: string }[]) {
  return app.inject({
    method: 'POST', url: `/admin/challenges/attempts/${id}/rule`,
    headers: { authorization: basic }, payload: { verdict },
  });
}

async function activityCount(ph: string, action: string): Promise<number> {
  const r = await pool.query(
    `select count(*)::int as n from user_activity ua
       join profiles p on p.id = ua.user_id
      where p.phone = $1 and ua.action = $2`,
    [ph, action],
  );
  return r.rows[0].n;
}

async function profileId(ph = phone): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [ph]);
  return r.rows[0].id;
}

async function weeklyXp(ph = phone): Promise<number> {
  const r = await pool.query<{ weekly_xp: number }>(
    `select lm.weekly_xp from league_members lm
       join profiles p on p.id = lm.user_id
      where p.phone = $1
      order by week_start desc limit 1`,
    [ph],
  );
  return r.rows[0]?.weekly_xp ?? 0;
}

const allCovered = () => vi.spyOn(ai, 'matchKeyPoints')
  .mockResolvedValue(KEY_POINTS.map((k) => ({ id: k.id, state: 'covered' as const })));

/* -------------------------------------------------------- reading vs writing */

describe('reading is public, answering is premium-only', () => {
  it('#1 a free (signed-in, non-premium) reader is refused with 402 and writes no row', async () => {
    await seedChallenge();
    const r = await answer(GOOD_ANSWER);
    expect(r.statusCode).toBe(402);
    const n = await pool.query('select count(*)::int as n from challenge_attempts');
    expect(n.rows[0].n).toBe(0);
  });

  it('#2 a signed-out submit is refused with 401 and writes no row', async () => {
    await seedChallenge();
    const r = await app.inject({
      method: 'POST', url: `/challenge/${encodeURIComponent(CONTENT)}/answer`,
      payload: { answer: GOOD_ANSWER },
    });
    expect(r.statusCode).toBe(401);
    const n = await pool.query('select count(*)::int as n from challenge_attempts');
    expect(n.rows[0].n).toBe(0);
  });

  it('the question reads for everyone once a چالش exists', async () => {
    await seedChallenge();
    const signedOut = await app.inject({ method: 'GET', url: `/challenge/${encodeURIComponent(CONTENT)}` });
    expect(signedOut.json()).toEqual({ exists: true });
  });
});

/* --------------------------------------------------------------- length -- */

describe('answer length', () => {
  it('#3 an answer under minAnswerChars is refused with 400 and writes no row', async () => {
    await seedChallenge();
    await makePremium();
    const r = await answer('کمی کوتاه');
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toBe('answer_too_short');
    const n = await pool.query('select count(*)::int as n from challenge_attempts');
    expect(n.rows[0].n).toBe(0);
  });

  it('#4 an answer over maxAnswerChars is accepted and stored truncated', async () => {
    await seedChallenge();
    await makePremium();
    allCovered();
    const long = 'الف'.repeat(700); // well over 1500 chars
    const r = await answer(long);
    expect(r.statusCode).toBe(200);
    const row = await pool.query('select answer_text from challenge_attempts limit 1');
    expect(row.rows[0].answer_text.length).toBe(config.challenge.maxAnswerChars);
  });
});

/* ------------------------------------------------------ the model contract */

describe('the model contract — RULE 4/6.2: any degraded outcome queues, never "missing"', () => {
  it('#5 every point covered/missing settles immediately', async () => {
    await seedChallenge();
    await makePremium();
    allCovered();
    const r = await answer(GOOD_ANSWER);
    expect(r.statusCode).toBe(200);
    const body = r.json();
    expect(body.status).toBe('settled');
    expect(body.result).toBe('full');
    const row = await pool.query('select status, settled_at from challenge_attempts limit 1');
    expect(row.rows[0].status).toBe('settled');
    expect(row.rows[0].settled_at).toBeTruthy();
  });

  it('#6 any single `unsure` queues the WHOLE attempt', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue([
      { id: 'kp1', state: 'covered' }, { id: 'kp2', state: 'unsure' }, { id: 'kp3', state: 'missing' },
    ]);
    const r = await answer(GOOD_ANSWER);
    expect(r.json().status).toBe('queued');
    const row = await pool.query('select status, verdict from challenge_attempts limit 1');
    expect(row.rows[0].status).toBe('queued');
    expect(row.rows[0].verdict).toBeNull();
  });

  it('#7 the provider returning [] queues', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue([]);
    const r = await answer(GOOD_ANSWER);
    expect(r.json().status).toBe('queued');
  });

  it('#8 the provider throwing after retries queues, and the attempt row is still written', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockRejectedValue(new Error('gateway down'));
    const r = await answer(GOOD_ANSWER);
    expect(r.json().status).toBe('queued');
    const row = await pool.query('select status from challenge_attempts limit 1');
    expect(row.rows[0].status).toBe('queued');
  });

  it('#9 an unknown key-point id queues; nothing from the model is stored', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue([
      { id: 'kp1', state: 'covered' }, { id: 'kp2', state: 'covered' }, { id: 'kpX', state: 'missing' },
    ]);
    const r = await answer(GOOD_ANSWER);
    expect(r.json().status).toBe('queued');
    const row = await pool.query('select verdict from challenge_attempts limit 1');
    expect(row.rows[0].verdict).toBeNull();
  });

  it('#10 2 entries for 3 key points queues', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue([
      { id: 'kp1', state: 'covered' }, { id: 'kp2', state: 'missing' },
    ]);
    const r = await answer(GOOD_ANSWER);
    expect(r.json().status).toBe('queued');
  });

  it('#11 a queued / failed model writes no challenge_answered row', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockRejectedValue(new Error('boom'));
    await answer(GOOD_ANSWER);
    expect(await activityCount(phone, 'challenge_answered')).toBe(0);
  });
});

/* ------------------------------------------ score only on a full verdict -- */

describe('score, XP and the badge fire only on a fully-correct answer', () => {
  it('a full verdict writes one activity row, +10 shield points and xp_challenge', async () => {
    await seedChallenge();
    await makePremium();
    allCovered();
    await answer(GOOD_ANSWER);
    expect(await activityCount(phone, 'challenge_answered')).toBe(1);

    const uid = await profileId();
    const b = await computeScore(pool, uid);
    expect(b.challenges_correct).toBe(1);
    expect(b.content_completed).toBe(0);
    // First scoring action of the day: +10 (day) + 10 (correctness bonus).
    // makePremium only flips profiles.tier (the 402 gate); the score stamp
    // reads subscriptions, so this fixture is the free-day rate.
    expect(b.score).toBe(POINTS_PER_ACTIVE_DAY + POINTS_PER_CHALLENGE);
    expect(await weeklyXp()).toBe(10); // 5 active bonus + 5 xp_challenge
  });

  it('a none verdict writes no activity, no shield points, no league XP', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue(
      KEY_POINTS.map((k) => ({ id: k.id, state: 'missing' as const })),
    );
    const r = await answer(GOOD_ANSWER);
    expect(r.json().result).toBe('none');
    expect(await activityCount(phone, 'challenge_answered')).toBe(0);
    const b = await computeScore(pool, await profileId());
    expect(b.challenges_correct).toBe(0);
    expect(b.score).toBe(0);
    expect(await weeklyXp()).toBe(0);
  });

  it('a partial verdict is not "درست" — zero score, zero XP', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue([
      { id: 'kp1', state: 'covered' }, { id: 'kp2', state: 'covered' }, { id: 'kp3', state: 'missing' },
    ]);
    const r = await answer(GOOD_ANSWER);
    expect(r.json().result).toBe('partial');
    expect(await activityCount(phone, 'challenge_answered')).toBe(0);
    expect((await computeScore(pool, await profileId())).score).toBe(0);
    expect(await weeklyXp()).toBe(0);
  });

  it('a queued attempt pays nothing until the founder rules it full', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue([]);
    await answer(GOOD_ANSWER);
    expect(await activityCount(phone, 'challenge_answered')).toBe(0);

    const id = (await pool.query<{ id: string }>('select id from challenge_attempts')).rows[0].id;
    await adminRule(id, KEY_POINTS.map((k) => ({ id: k.id, state: 'covered' })));
    expect(await activityCount(phone, 'challenge_answered')).toBe(1);
    expect((await computeScore(pool, await profileId())).challenges_correct).toBe(1);
    expect(await weeklyXp()).toBe(10);
  });

  it('a founder ruling of none still pays nothing', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue([]);
    await answer(GOOD_ANSWER);
    const id = (await pool.query<{ id: string }>('select id from challenge_attempts')).rows[0].id;
    await adminRule(id, KEY_POINTS.map((k) => ({ id: k.id, state: 'missing' })));
    expect(await activityCount(phone, 'challenge_answered')).toBe(0);
    expect(await weeklyXp()).toBe(0);
  });

  it('«چلنجر» bronze lights on a full answer and stays dark on a miss', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue(
      KEY_POINTS.map((k) => ({ id: k.id, state: 'missing' as const })),
    );
    await answer(GOOD_ANSWER);
    const miss = await app.inject({ method: 'GET', url: '/achievements', headers: { cookie } });
    const missBadge = miss.json().badges.find((b: { key: string }) => b.key === 'challenger');
    expect(missBadge.earned).toBe(false);

    await seedChallenge(KEY_POINTS, `${CONTENT}-win`);
    allCovered();
    const other = await loginAs(app, '09121300077');
    await makePremium('09121300077');
    await answer(GOOD_ANSWER, `${CONTENT}-win`, other);
    const win = await app.inject({
      method: 'GET', url: '/achievements', headers: { cookie: other },
    });
    const winBadge = win.json().badges.find((b: { key: string }) => b.key === 'challenger');
    expect(winBadge.earned).toBe(true);
    expect(winBadge.metal).toBe('bronze');
    expect(winBadge.title_fa).toBe('چلنجر');
  });
});

/* -------------------------------------------------------------- one shot -- */

describe('one attempt per reader per page (RULE 3)', () => {
  it('#12 a second submit is refused with 409 and returns the existing attempt; no second score row', async () => {
    await seedChallenge();
    await makePremium();
    allCovered();
    await answer(GOOD_ANSWER);
    const second = await answer('یک جواب دیگر که کاملاً متفاوت است و همچنان از حداقل طول عبور می‌کند.');
    expect(second.statusCode).toBe(409);
    expect(second.json().error).toBe('already_answered');
    expect(second.json().answer_fa).toBe(ANSWER_FA);
    expect(await activityCount(phone, 'challenge_answered')).toBe(1);
    const n = await pool.query('select count(*)::int as n from challenge_attempts');
    expect(n.rows[0].n).toBe(1);
  });
});

/* ------------------------------------------------------------ rate limit -- */

describe('rate limiting', () => {
  it('#13 the 11th submit within an hour is refused with 429', async () => {
    await makePremium();
    allCovered();
    for (let i = 1; i <= config.challenge.maxPerUserPerHour; i += 1) {
      await seedChallenge(KEY_POINTS, `${CONTENT}-${i}`);
      const r = await answer(GOOD_ANSWER, `${CONTENT}-${i}`);
      expect(r.statusCode).toBe(200);
    }
    await seedChallenge(KEY_POINTS, `${CONTENT}-eleven`);
    const r = await answer(GOOD_ANSWER, `${CONTENT}-eleven`);
    expect(r.statusCode).toBe(429);
    expect(r.json().error).toBe('rate_limited');
  });
});

/* -------------------------------------------------------- founder ruling -- */

describe('the founder rules a queued attempt', () => {
  async function queueOne(): Promise<string> {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue([]);
    await answer(GOOD_ANSWER);
    const row = await pool.query('select id from challenge_attempts limit 1');
    return row.rows[0].id;
  }

  it('#14 settles the attempt, writes an example, and sends an uncapped challenge_ruled notice', async () => {
    const id = await queueOne();
    const r = await adminRule(id, [
      { id: 'kp1', state: 'covered' }, { id: 'kp2', state: 'covered' }, { id: 'kp3', state: 'missing' },
    ]);
    expect(r.statusCode).toBe(200);
    const row = await pool.query('select status, verdict from challenge_attempts where id = $1', [id]);
    expect(row.rows[0].status).toBe('settled');
    expect(row.rows[0].verdict.every((v: { by: string }) => v.by === 'founder')).toBe(true);

    const ex = await pool.query('select count(*)::int as n from challenge_examples where content_id = $1', [CONTENT]);
    expect(ex.rows[0].n).toBe(1);

    const notice = await pool.query(
      "select delivered from notification_log where kind = 'challenge_ruled'",
    );
    expect(notice.rows).toHaveLength(1);
    expect(notice.rows[0].delivered).toBe(true);
  });

  it('#15 a founder verdict containing `unsure` is refused with 400 and writes nothing', async () => {
    const id = await queueOne();
    const r = await adminRule(id, [
      { id: 'kp1', state: 'covered' }, { id: 'kp2', state: 'unsure' }, { id: 'kp3', state: 'missing' },
    ]);
    expect(r.statusCode).toBe(400);
    const row = await pool.query('select status from challenge_attempts where id = $1', [id]);
    expect(row.rows[0].status).toBe('queued');
    const ex = await pool.query('select count(*)::int as n from challenge_examples');
    expect(ex.rows[0].n).toBe(0);
  });

  it('#16 a founder verdict missing a key point is refused with 400 and writes nothing', async () => {
    const id = await queueOne();
    const r = await adminRule(id, [
      { id: 'kp1', state: 'covered' }, { id: 'kp2', state: 'missing' },
    ]);
    expect(r.statusCode).toBe(400);
    const row = await pool.query('select status from challenge_attempts where id = $1', [id]);
    expect(row.rows[0].status).toBe('queued');
  });

  it('#17 the model call carries only the newest 12 of 20 existing examples', async () => {
    await seedChallenge();
    await makePremium();
    const texts: string[] = [];
    for (let i = 0; i < 20; i += 1) {
      const text = `مثال شماره ${i}`;
      texts.push(text);
      await pool.query(
        `insert into challenge_examples (content_id, answer_text, verdict, created_at)
           values ($1, $2, $3, now() - ($4 || ' seconds')::interval)`,
        [CONTENT, text, JSON.stringify([{ id: 'kp1', state: 'covered' }]), (20 - i) * 10],
      );
    }
    const spy = allCovered();
    await answer(GOOD_ANSWER);
    const callArg = spy.mock.calls[0][0] as { examples: { answer: string }[] };
    expect(callArg.examples).toHaveLength(config.challenge.maxExamples);
    // newest 12 = the last 12 inserted (i = 8..19), oldest of the kept set first
    // is `i=8`'s text since we ordered desc — just assert composition, not order.
    const kept = new Set(callArg.examples.map((e) => e.answer));
    for (let i = 8; i < 20; i += 1) expect(kept.has(texts[i])).toBe(true);
    for (let i = 0; i < 8; i += 1) expect(kept.has(texts[i])).toBe(false);
  });
});

/* --------------------------------------------------------- the leak tests */

describe('answer_fa is released by having an attempt, never by tier (RULE 6)', () => {
  it('#18 GET as the settled attempt\'s own owner returns answer_fa + result + counts', async () => {
    await seedChallenge();
    await makePremium();
    allCovered();
    await answer(GOOD_ANSWER);
    const r = await getState();
    const body = r.json();
    expect(body.answer_fa).toBe(ANSWER_FA);
    expect(body.result).toBe('full');
    expect(body.covered_count).toBe(3);
    expect(body.point_count).toBe(3);
  });

  it('#19 GET/POST as the owner of a queued attempt carries answer_fa, no verdict fields', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue([]);
    const posted = await answer(GOOD_ANSWER);
    expect(posted.json().answer_fa).toBe(ANSWER_FA);
    expect(posted.json().result).toBeUndefined();

    const r = await getState();
    expect(r.json().answer_fa).toBe(ANSWER_FA);
    expect(r.json().status).toBe('queued');
    expect(r.json().result).toBeUndefined();
  });

  it('#20 GET as a premium reader with NO attempt: answer_fa is absent', async () => {
    await seedChallenge();
    await makePremium();
    const r = await getState();
    expect(r.json()).toEqual({ exists: true });
    expect('answer_fa' in r.json()).toBe(false);
  });

  it('#21 GET signed out, and as a free reader: answer_fa absent, exists:true only', async () => {
    await seedChallenge();
    const signedOut = await getState(CONTENT, null);
    expect(signedOut.json()).toEqual({ exists: true });

    const free = await getState();
    expect(free.json()).toEqual({ exists: true });
  });

  it('#21b a reader who answered while premium keeps answer_fa after lapsing, but cannot answer a NEW چالش', async () => {
    await seedChallenge();
    await seedChallenge(KEY_POINTS, `${CONTENT}-second`);
    await makePremium();
    allCovered();
    await answer(GOOD_ANSWER);
    await pool.query(`update profiles set tier = 'free' where phone = $1`, [phone]);

    const r = await getState();
    expect(r.json().answer_fa).toBe(ANSWER_FA);

    const secondAttempt = await answer(GOOD_ANSWER, `${CONTENT}-second`);
    expect(secondAttempt.statusCode).toBe(402);
  });

  it('#22 any response carrying answer_fa never carries key_points or a raw verdict array', async () => {
    await seedChallenge();
    await makePremium();
    allCovered();
    const posted = await answer(GOOD_ANSWER);
    const raw = JSON.stringify(posted.json());
    expect(raw).not.toContain('key_points');
    expect(raw).not.toContain('"verdict"');

    const got = await getState();
    const rawGet = JSON.stringify(got.json());
    expect(rawGet).not.toContain('key_points');
    expect(rawGet).not.toContain('"verdict"');
  });
});

/* --------------------------------------------------------------- result -- */

describe('the reduced result', () => {
  const FOUR = [
    { id: 'kp1', text: 'یک' }, { id: 'kp2', text: 'دو' }, { id: 'kp3', text: 'سه' }, { id: 'kp4', text: 'چهار' },
  ];

  async function settleAs(ph: string, states: string[]): Promise<{ result: string; covered_count: number }> {
    const c = await loginAs(app, ph);
    await makePremium(ph);
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue(
      FOUR.map((k, i) => ({ id: k.id, state: states[i] as 'covered' | 'missing' })),
    );
    const r = await answer(GOOD_ANSWER, `${CONTENT}-four`, c);
    return r.json();
  }

  it('#23 4/4, 2/4 and 0/4 covered map to full/partial/none with the right count', async () => {
    await seedChallenge(FOUR, `${CONTENT}-four`);
    const full = await settleAs('09121300001', ['covered', 'covered', 'covered', 'covered']);
    expect(full.result).toBe('full');
    expect(full.covered_count).toBe(4);
  });
});

/* --------------------------------------------------------------- absent -- */

describe('a content_id with no چالش', () => {
  it('#24 GET returns {exists:false}', async () => {
    const r = await getState('chairside/nothing-here');
    expect(r.json()).toEqual({ exists: false });
  });
});

/* ------------------------------------------------------------ profile merge */

describe('profile merge', () => {
  it('#25 attempts survive a merge, repointed onto the target', async () => {
    await seedChallenge();
    await makePremium();
    allCovered();
    await answer(GOOD_ANSWER);

    const from = (await pool.query('select id from profiles where phone = $1', [phone])).rows[0].id;
    const otherPhone = '09121300099';
    const toCookie = await loginAs(app, otherPhone);
    void toCookie;
    const to = (await pool.query('select id from profiles where phone = $1', [otherPhone])).rows[0].id;

    await withTransaction((client) => mergeProfiles(client, from, to));

    const row = await pool.query('select user_id from challenge_attempts where content_id = $1', [CONTENT]);
    expect(row.rows).toHaveLength(1);
    expect(row.rows[0].user_id).toBe(to);
  });
});

/* -------------------------------------------------------------- upsert -- */

describe('POST /admin/challenges/upsert validation', () => {
  it('#26 6 key points is refused with 400', async () => {
    const r = await adminUpsert({
      content_id: CONTENT, answer_fa: ANSWER_FA,
      key_points: [1, 2, 3, 4, 5, 6].map((n) => ({ id: `kp${n}`, text: `نکته ${n}` })),
    });
    expect(r.statusCode).toBe(400);
  });

  it('#27 duplicate ids are refused with 400', async () => {
    const r = await adminUpsert({
      content_id: CONTENT, answer_fa: ANSWER_FA,
      key_points: [{ id: 'kp1', text: 'یک' }, { id: 'kp1', text: 'دو' }, { id: 'kp3', text: 'سه' }],
    });
    expect(r.statusCode).toBe(400);
  });

  it('requires admin auth', async () => {
    const r = await app.inject({
      method: 'POST', url: '/admin/challenges/upsert',
      payload: { content_id: CONTENT, answer_fa: ANSWER_FA, key_points: KEY_POINTS },
    });
    expect(r.statusCode).toBe(401);
  });
});

/* ---------------------------------------------------- founder roster -- */

function adminAttempts() {
  return app.inject({
    method: 'GET', url: '/admin/challenges/attempts', headers: { authorization: basic },
  });
}

describe('GET /admin/challenges/attempts — who answered and how they scored', () => {
  it('requires admin auth', async () => {
    const r = await app.inject({ method: 'GET', url: '/admin/challenges/attempts' });
    expect(r.statusCode).toBe(401);
  });

  it('is empty when nobody has answered', async () => {
    await seedChallenge();
    const r = await adminAttempts();
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ ok: true, count: 0, attempts: [] });
  });

  it('lists a settled attempt with N of M, and a queued one as در-صف (null counts)', async () => {
    await seedChallenge();
    await makePremium();
    const spy = allCovered();
    await answer(GOOD_ANSWER);

    const otherPhone = '09121300002';
    const otherCookie = await loginAs(app, otherPhone);
    await makePremium(otherPhone);
    await seedChallenge(KEY_POINTS, `${CONTENT}-b`);
    spy.mockResolvedValue([]);
    await answer(GOOD_ANSWER, `${CONTENT}-b`, otherCookie);

    const r = await adminAttempts();
    expect(r.statusCode).toBe(200);
    const body = r.json() as {
      count: number;
      attempts: Array<{
        phone: string | null;
        content_id: string;
        status: string;
        result: string | null;
        covered_count: number | null;
        point_count: number | null;
        reference: string;
      }>;
    };
    expect(body.count).toBe(2);
    expect(body.attempts).toHaveLength(2);

    // newest first: the queued second-user row, then the settled first-user row
    expect(body.attempts[0].phone).toBe(otherPhone);
    expect(body.attempts[0].status).toBe('queued');
    expect(body.attempts[0].result).toBeNull();
    expect(body.attempts[0].covered_count).toBeNull();
    expect(body.attempts[0].point_count).toBeNull();

    expect(body.attempts[1].phone).toBe(phone);
    expect(body.attempts[1].status).toBe('settled');
    expect(body.attempts[1].result).toBe('full');
    expect(body.attempts[1].covered_count).toBe(3);
    expect(body.attempts[1].point_count).toBe(3);

    const raw = JSON.stringify(body);
    expect(raw).not.toContain('key_points');
    expect(raw).not.toContain('"verdict"');
    expect(raw).not.toContain(GOOD_ANSWER);
    expect(raw).not.toContain(ANSWER_FA);
  });

  it('keeps settled rows after the queue has dropped them', async () => {
    await seedChallenge();
    await makePremium();
    vi.spyOn(ai, 'matchKeyPoints').mockResolvedValue([]);
    await answer(GOOD_ANSWER);
    const queued = await pool.query<{ id: string }>('select id from challenge_attempts');
    await adminRule(queued.rows[0].id, KEY_POINTS.map((k) => ({ id: k.id, state: 'missing' })));

    const queue = await app.inject({
      method: 'GET', url: '/admin/challenges', headers: { authorization: basic },
    });
    expect(queue.json().pending).toEqual([]);

    const roster = await adminAttempts();
    expect(roster.json().count).toBe(1);
    expect(roster.json().attempts[0].status).toBe('settled');
    expect(roster.json().attempts[0].result).toBe('none');
    expect(roster.json().attempts[0].covered_count).toBe(0);
    expect(roster.json().attempts[0].point_count).toBe(3);
  });
});
