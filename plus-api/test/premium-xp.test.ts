import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { getPathways } from '../src/pathways.js';

/**
 * The premium earning paths (migration 0030): MORE WAYS to earn league XP, never
 * a multiplier on an act a free reader also performs.
 *
 * That distinction is the entire design, and it is not self-enforcing — every
 * one of these cases pins one half of it. The first describe block holds the
 * line ("a free reader and a premium reader are paid the SAME for reading"),
 * and the rest check that each new path pays once, is capped, and cannot be
 * farmed by repeating a one-tap action.
 */

let app: FastifyInstance;

const PATHWAY_ID = 'occlusion';
const STEPS = getPathways().find((p) => p.id === PATHWAY_ID)!.steps;
/** A page inside the pathway, and one deliberately outside it. */
const IN_PATH = STEPS[0].content_id;
const OFF_PATH = 'insight/insight-77';

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function makePremium(phone: string): Promise<void> {
  await pool.query(`update profiles set tier = 'premium' where phone = $1`, [phone]);
}

/** A logged-in reader; premium by `profiles.tier`, the column requirePremium reads. */
async function reader(phone: string, { premium = false } = {}): Promise<string> {
  const cookie = await loginAs(app, phone);
  if (premium) await makePremium(phone);
  return cookie;
}

const act = (cookie: string, action: string, content_id?: string) => app.inject({
  method: 'POST', url: '/activity', headers: { cookie }, payload: { action, content_id },
});

const myXp = async (cookie: string): Promise<number> => (
  await app.inject({ method: 'GET', url: '/league', headers: { cookie } })
).json().my_weekly_xp ?? 0;

const enroll = (cookie: string, id: string) => app.inject({
  method: 'POST', url: `/pathways/${id}/enroll`, headers: { cookie },
});

const newBoard = (cookie: string, title: string) => app.inject({
  method: 'POST', url: '/collections', headers: { cookie }, payload: { title },
});

const pin = (cookie: string, boardId: string, content_id: string) => app.inject({
  method: 'POST', url: `/collections/${boardId}/items`, headers: { cookie }, payload: { content_id },
});

async function setConfig(key: string, value: string): Promise<void> {
  await pool.query('update league_config set value = $2 where key = $1', [key, value]);
}

// ── the line that must not move ───────────────────────────────────────────────

describe('the per-action prices stay plan-blind', () => {
  it('a premium reader and a free reader are paid IDENTICALLY for the same read', async () => {
    const free = await reader('09131000001');
    const prem = await reader('09131000002', { premium: true });

    await act(free, 'article_completed', OFF_PATH);
    await act(prem, 'article_completed', OFF_PATH);

    // 5 active bonus + 5 read, for both. If this ever diverges, the league has
    // become pay-to-win and score.ts:102 is no longer true.
    expect(await myXp(free)).toBe(10);
    expect(await myXp(prem)).toBe(10);
  });

  it('premium alone, with nothing enrolled and no board, earns nothing extra', async () => {
    const prem = await reader('09131000003', { premium: true });
    await act(prem, 'article_completed', IN_PATH); // a pathway page, but not THEIR pathway
    await act(prem, 'highlight_created', IN_PATH);
    await act(prem, 'card_reviewed_manual', IN_PATH);
    expect(await myXp(prem)).toBe(5 + 5 + 1 + 2);
  });
});

// ── pathway steps ─────────────────────────────────────────────────────────────

describe('xp_pathway_step', () => {
  it('pays on top of xp_read for a page inside an ENROLLED pathway', async () => {
    const cookie = await reader('09131000010', { premium: true });
    expect((await enroll(cookie, PATHWAY_ID)).statusCode).toBe(200);

    // Enrolling is itself a path: +5 (xp_pathway_enrolled). No active bonus —
    // enrolling is not a scoring action.
    expect(await myXp(cookie)).toBe(5);

    await act(cookie, 'article_completed', IN_PATH);
    // +5 active +5 read +3 pathway step
    expect(await myXp(cookie)).toBe(5 + 5 + 5 + 3);
  });

  it('pays nothing for a page OUTSIDE the enrolled pathway', async () => {
    const cookie = await reader('09131000011', { premium: true });
    await enroll(cookie, PATHWAY_ID);
    await act(cookie, 'article_completed', OFF_PATH);
    expect(await myXp(cookie)).toBe(5 + 5 + 5); // enrol + active + read, no bonus
  });

  it('requires ENROLMENT, not merely that the page sits in some pathway', async () => {
    // computeProgress credits browsing before enrolment (routes/pathways.ts) —
    // XP deliberately does not, because "an article that happens to be in a
    // pathway" is most of the library.
    const cookie = await reader('09131000012', { premium: true });
    await act(cookie, 'article_completed', IN_PATH);
    expect(await myXp(cookie)).toBe(10);
  });

  it('does not pay twice for re-reading the same step in one week', async () => {
    const cookie = await reader('09131000013', { premium: true });
    await enroll(cookie, PATHWAY_ID);
    await act(cookie, 'article_completed', IN_PATH);
    const after = await myXp(cookie);
    await act(cookie, 'article_completed', IN_PATH);
    expect(await myXp(cookie)).toBe(after);
  });

  it('stops at the weekly ceiling', async () => {
    const cookie = await reader('09131000014', { premium: true });
    await setConfig('xp_pathway_step_weekly_cap', '2');
    await enroll(cookie, PATHWAY_ID);

    for (const s of STEPS.slice(0, 4)) await act(cookie, 'article_completed', s.content_id);
    // enrol 5 + active 5 + 4 reads × 5 + only TWO step bonuses × 3
    expect(await myXp(cookie)).toBe(5 + 5 + 20 + 6);
  });

  it('a reader whose premium lapsed keeps the enrolment but stops earning the bonus', async () => {
    const cookie = await reader('09131000015', { premium: true });
    await enroll(cookie, PATHWAY_ID);
    await pool.query(`update profiles set tier = 'free' where phone = $1`, ['09131000015']);

    await act(cookie, 'article_completed', IN_PATH);
    expect(await myXp(cookie)).toBe(5 + 5 + 5); // enrol (paid while premium) + active + read
  });

  it('a LEAGUE PRIZE winner earns it — premium held without a subscription row', async () => {
    // premium-prize.ts grants premium by writing profiles.tier, never a
    // `subscriptions` row. Gating on user_activity.premium (which reads
    // `subscriptions`) would give a winner the pathway pages for two days and
    // pay them nothing for using them.
    const phone = '09131000016';
    const cookie = await reader(phone, { premium: true });
    const uid = (await pool.query<{ id: string }>(
      'select id from profiles where phone = $1', [phone],
    )).rows[0].id;
    await pool.query(
      `insert into premium_grants (user_id, week_start, granted_at, expires_at)
       values ($1, '2026-01-03', now(), now() + interval '2 days')`,
      [uid],
    );
    const subs = await pool.query('select 1 from subscriptions where user_id = $1', [uid]);
    expect(subs.rowCount).toBe(0); // the precondition this case exists for

    await enroll(cookie, PATHWAY_ID);
    await act(cookie, 'article_completed', IN_PATH);
    expect(await myXp(cookie)).toBe(5 + 5 + 5 + 3);
  });
});

// ── enrolling ─────────────────────────────────────────────────────────────────

describe('xp_pathway_enrolled', () => {
  it('pays once per pathway — re-enrolling is idempotent and adds nothing', async () => {
    const cookie = await reader('09131000020', { premium: true });
    await enroll(cookie, PATHWAY_ID);
    await enroll(cookie, PATHWAY_ID);
    expect(await myXp(cookie)).toBe(5);
  });

  it('stops at the weekly ceiling of enrolments', async () => {
    const all = getPathways();
    if (all.length < 3) return; // ceiling is 2; nothing to prove with fewer
    const cookie = await reader('09131000021', { premium: true });
    for (const p of all.slice(0, 3)) await enroll(cookie, p.id);
    expect(await myXp(cookie)).toBe(10); // 2 × 5, third one capped
  });
});

// ── collections ───────────────────────────────────────────────────────────────

describe('xp_collection_created / xp_collection_item', () => {
  it('pays for a board and for a pin', async () => {
    const cookie = await reader('09131000030', { premium: true });
    const board = (await newBoard(cookie, 'برد اول')).json().collection;
    expect(await myXp(cookie)).toBe(3);

    expect((await pin(cookie, board.id, OFF_PATH)).statusCode).toBe(201);
    expect(await myXp(cookie)).toBe(4);
  });

  it('re-pinning the same page pays once, and does not eat the weekly ceiling', async () => {
    // POST /collections/:id/items writes an activity row on the idempotent
    // replay too, and the same page can be pinned to many boards. Both would
    // print XP without the per-content guard; and if the ceiling counted rows
    // rather than distinct pages, this reader would end the week unable to earn
    // for pages they had never pinned.
    const cookie = await reader('09131000031', { premium: true });
    const b1 = (await newBoard(cookie, 'برد یک')).json().collection;
    await setConfig('xp_collection_created_weekly_cap', '2');
    const b2 = (await newBoard(cookie, 'برد دو')).json().collection;

    for (let i = 0; i < 4; i += 1) await pin(cookie, b1.id, OFF_PATH);
    await pin(cookie, b2.id, OFF_PATH); // same page, different board

    expect(await myXp(cookie)).toBe(3 + 3 + 1); // two boards + ONE pin

    await pin(cookie, b1.id, IN_PATH); // a different page still pays
    expect(await myXp(cookie)).toBe(3 + 3 + 1 + 1);
  });

  it('stops at the weekly ceiling of boards', async () => {
    const cookie = await reader('09131000032', { premium: true });
    await newBoard(cookie, 'یک');
    await newBoard(cookie, 'دو');
    await newBoard(cookie, 'سه');
    expect(await myXp(cookie)).toBe(3); // cap is 1
  });

  it('stops at the weekly ceiling of pins', async () => {
    const cookie = await reader('09131000033', { premium: true });
    await setConfig('xp_collection_item_weekly_cap', '2');
    const board = (await newBoard(cookie, 'برد')).json().collection;
    for (const c of ['a/one', 'a/two', 'a/three', 'a/four']) await pin(cookie, board.id, c);
    expect(await myXp(cookie)).toBe(3 + 2);
  });

  it('a weight of zero switches the path off entirely', async () => {
    const cookie = await reader('09131000034', { premium: true });
    await setConfig('xp_collection_created', '0');
    await newBoard(cookie, 'برد');
    // Nothing was earned, so the reader was never placed into a group either.
    const body = (await app.inject({ method: 'GET', url: '/league', headers: { cookie } })).json();
    expect(body.joined).toBe(false);
  });
});
