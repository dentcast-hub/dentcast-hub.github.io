import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import { finalizeWeek } from '../src/services/league-finalize.js';
import { getLeagueConfig } from '../src/services/league-config.js';
import { config } from '../src/config.js';

const WEEK = '2026-01-03';       // opaque week key for finalize unit tests
let seq = 0;

async function tierId(slug: string): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from league_tiers where slug = $1', [slug]);
  return r.rows[0].id;
}
async function tierOf(userId: string): Promise<string> {
  const r = await pool.query<{ slug: string }>(
    'select t.slug from profiles p join league_tiers t on t.id = p.current_tier_id where p.id = $1',
    [userId],
  );
  return r.rows[0]?.slug;
}
async function memberOf(userId: string): Promise<{ final_rank: number; outcome: string }> {
  const r = await pool.query<{ final_rank: number; outcome: string }>(
    'select final_rank, outcome from league_members where user_id = $1 order by week_start desc limit 1',
    [userId],
  );
  return r.rows[0];
}
async function setConfig(key: string, value: string): Promise<void> {
  await pool.query('update league_config set value = $2 where key = $1', [key, value]);
}
async function seedStat(week: string, active: number): Promise<void> {
  await pool.query(
    `insert into league_weekly_stats (week_start, active_users, groups_count, avg_fill_pct)
     values ($1, $2, 1, 100) on conflict (week_start) do update set active_users = excluded.active_users`,
    [week, active],
  );
}

/** Create a group in `tierSlug` with the given members ({xp, at}), status closed. */
async function seedGroup(
  tierSlug: string, capacity: number, members: Array<{ xp: number; at: string }>, week = WEEK,
): Promise<{ leagueId: string; userIds: string[] }> {
  const tid = await tierId(tierSlug);
  const lg = await pool.query<{ id: string }>(
    `insert into leagues (tier_id, week_start, week_end, status, capacity_at_creation)
     values ($1, $2, $2, 'closed', $3) returning id`,
    [tid, week, capacity],
  );
  const leagueId = lg.rows[0].id;
  const userIds: string[] = [];
  for (const m of members) {
    seq += 1;
    const u = await pool.query<{ id: string }>(
      'insert into profiles (display_name, current_tier_id) values ($1, $2) returning id',
      [`u${seq}`, tid],
    );
    const uid = u.rows[0].id;
    userIds.push(uid);
    await pool.query(
      `insert into league_members (league_id, user_id, week_start, weekly_xp, first_reached_current_xp_at)
       values ($1, $2, $3, $4, $5)`,
      [leagueId, uid, week, m.xp, m.at],
    );
  }
  return { leagueId, userIds };
}

const T = (h: number) => `2026-01-03T${String(h).padStart(2, '0')}:00:00Z`;

beforeEach(async () => { await resetDb(); });
afterAll(async () => { await pool.end(); });

// --- edge rules (§7) --------------------------------------------------------

describe('finalizeWeek — outcome edge rules', () => {
  it('small group (< min_valid_group_size) → everyone stays, no tier moves', async () => {
    const { userIds } = await seedGroup('amalgam', 8, [
      { xp: 90, at: T(1) }, { xp: 70, at: T(2) }, { xp: 50, at: T(3) }, { xp: 10, at: T(4) },
    ]); // size 4 < 6
    const res = await finalizeWeek(WEEK);
    expect(res.promotions).toBe(0);
    expect(res.demotions).toBe(0);
    for (const uid of userIds) {
      expect((await memberOf(uid)).outcome).toBe('stayed');
      expect(await tierOf(uid)).toBe('amalgam');
      expect((await memberOf(uid)).final_rank).toBeGreaterThan(0); // rank still recorded
    }
  });

  it('tie on weekly_xp broken by earlier first_reached_current_xp_at', async () => {
    const { userIds } = await seedGroup('amalgam', 6, [
      { xp: 100, at: T(5) },   // later
      { xp: 100, at: T(2) },   // earlier -> should rank #1
      { xp: 40, at: T(3) }, { xp: 30, at: T(4) }, { xp: 20, at: T(6) }, { xp: 10, at: T(7) },
    ]);
    await finalizeWeek(WEEK);
    expect((await memberOf(userIds[1])).final_rank).toBe(1); // earlier timestamp wins
    expect((await memberOf(userIds[0])).final_rank).toBe(2);
  });

  it('promotion needs BOTH promo-zone rank AND weekly_xp >= min (not filled → no demotions)', async () => {
    // capacity 8, size 6 -> valid but NOT filled. promotedCount = ceil(6*0.2)=2.
    const { userIds } = await seedGroup('amalgam', 8, [
      { xp: 50, at: T(1) },   // rank1, >=30 -> promoted
      { xp: 20, at: T(2) },   // rank2, <30  -> stays (rank alone insufficient)
      { xp: 15, at: T(3) }, { xp: 12, at: T(4) }, { xp: 8, at: T(5) }, { xp: 3, at: T(6) },
    ]);
    const res = await finalizeWeek(WEEK);
    expect(res.promotions).toBe(1);
    expect(res.demotions).toBe(0); // not filled -> no demotions
    expect(await tierOf(userIds[0])).toBe('composite');   // promoted up
    expect(await tierOf(userIds[1])).toBe('amalgam');      // stayed (xp too low)
    expect((await memberOf(userIds[5])).outcome).toBe('stayed'); // bottom, not demoted
  });

  it('filled group demotes the bottom zone; promotes qualifying top', async () => {
    // capacity 6, size 6 -> filled. promoted=2, demoted=2.
    const { userIds } = await seedGroup('amalgam', 6, [
      { xp: 60, at: T(1) }, { xp: 50, at: T(2) },  // promoted (>=30)
      { xp: 40, at: T(3) }, { xp: 30, at: T(4) },  // middle -> stayed
      { xp: 20, at: T(5) }, { xp: 10, at: T(6) },  // demoted
    ]);
    const res = await finalizeWeek(WEEK);
    expect(res.promotions).toBe(2);
    expect(res.demotions).toBe(2);
    expect(await tierOf(userIds[0])).toBe('composite');
    expect(await tierOf(userIds[1])).toBe('composite');
    expect(await tierOf(userIds[2])).toBe('amalgam');
    expect(await tierOf(userIds[4])).toBe('acrylic');   // demoted down
    expect(await tierOf(userIds[5])).toBe('acrylic');
  });

  it('no demotion out of tier 1 (acrylic)', async () => {
    const { userIds } = await seedGroup('acrylic', 6, [
      { xp: 60, at: T(1) }, { xp: 50, at: T(2) },
      { xp: 40, at: T(3) }, { xp: 30, at: T(4) },
      { xp: 20, at: T(5) }, { xp: 10, at: T(6) },
    ]);
    const res = await finalizeWeek(WEEK);
    expect(res.demotions).toBe(0);                 // bottom can't leave tier 1
    expect(await tierOf(userIds[5])).toBe('acrylic');
    expect((await memberOf(userIds[5])).outcome).toBe('stayed');
    expect(await tierOf(userIds[0])).toBe('amalgam'); // top still promoted up
  });

  it('no promotion out of the highest active tier; rank still recorded', async () => {
    // composite is the top active tier (max_active_tier_order = 3).
    const { userIds } = await seedGroup('composite', 6, [
      { xp: 90, at: T(1) }, { xp: 80, at: T(2) },
      { xp: 40, at: T(3) }, { xp: 30, at: T(4) },
      { xp: 20, at: T(5) }, { xp: 10, at: T(6) },
    ]);
    const res = await finalizeWeek(WEEK);
    expect(res.promotions).toBe(0);
    expect(await tierOf(userIds[0])).toBe('composite');
    expect((await memberOf(userIds[0])).outcome).toBe('stayed');
    expect((await memberOf(userIds[0])).final_rank).toBe(1); // recorded for future rewards
  });
});

// --- idempotency ------------------------------------------------------------

describe('finalizeWeek — idempotent', () => {
  it('re-running a finalized week changes nothing', async () => {
    const { userIds } = await seedGroup('amalgam', 6, [
      { xp: 60, at: T(1) }, { xp: 50, at: T(2) }, { xp: 40, at: T(3) },
      { xp: 30, at: T(4) }, { xp: 20, at: T(5) }, { xp: 10, at: T(6) },
    ]);
    const first = await finalizeWeek(WEEK);
    expect(first.finalized).toBe(1);
    const tierAfter = await tierOf(userIds[0]);

    const second = await finalizeWeek(WEEK);
    expect(second.finalized).toBe(0);          // nothing left to do
    expect(second.promotions).toBe(0);
    expect(await tierOf(userIds[0])).toBe(tierAfter); // unchanged
  });
});

// --- self-tuning ------------------------------------------------------------

describe('self-tuning — group size hysteresis + cooldown', () => {
  it('steps 8 → 12 when smoothed_active crosses 24', async () => {
    await seedStat('2025-12-13', 30);
    await seedStat('2025-12-20', 30);
    await seedStat('2025-12-27', 30);           // 3 priors; current adds 6 -> smoothed 24
    await seedGroup('amalgam', 8, Array.from({ length: 6 }, (_, i) => ({ xp: 10, at: T(i + 1) })));
    await finalizeWeek(WEEK);
    const v = (await pool.query("select value from league_config where key='group_size_current'")).rows[0].value;
    expect(v).toBe('12');
  });

  it('does NOT step down inside the hysteresis band, and respects cooldown', async () => {
    await setConfig('group_size_current', '12');
    // smoothed ~ 22 (above 0.8*24 = 19.2) -> must stay at 12.
    await seedStat('2025-12-13', 28);
    await seedStat('2025-12-20', 28);
    await seedStat('2025-12-27', 28);           // + current 4 -> (84+4)/4 = 22
    await seedGroup('amalgam', 12, Array.from({ length: 4 }, (_, i) => ({ xp: 10, at: T(i + 1) })));
    await finalizeWeek(WEEK);
    expect((await pool.query("select value from league_config where key='group_size_current'")).rows[0].value).toBe('12');
  });

  it('cooldown blocks a change that would otherwise happen', async () => {
    await setConfig('group_size_current', '8');
    await setConfig('group_size_last_changed_week', '2025-12-27'); // 1 week before WEEK < cooldown 4
    await seedStat('2025-12-13', 40);
    await seedStat('2025-12-20', 40);
    await seedStat('2025-12-27', 40);
    await seedGroup('amalgam', 8, Array.from({ length: 6 }, (_, i) => ({ xp: 10, at: T(i + 1) })));
    await finalizeWeek(WEEK);
    expect((await pool.query("select value from league_config where key='group_size_current'")).rows[0].value).toBe('8');
  });
});

describe('self-tuning — tier activation', () => {
  it('activates the next tier when the top active tier had a full group', async () => {
    // composite (order 3) is top active; a full group there opens metal-ceramic.
    await seedGroup('composite', 6, [
      { xp: 60, at: T(1) }, { xp: 50, at: T(2) }, { xp: 40, at: T(3) },
      { xp: 30, at: T(4) }, { xp: 20, at: T(5) }, { xp: 10, at: T(6) },
    ]); // size 6 == capacity 6 -> filled
    await finalizeWeek(WEEK);
    const active = (await pool.query("select is_active from league_tiers where slug='metal-ceramic'")).rows[0].is_active;
    expect(active).toBe(true);
    expect((await pool.query("select value from league_config where key='max_active_tier_order'")).rows[0].value).toBe('4');
  });

  it('does NOT activate a tier when no top group filled', async () => {
    await seedGroup('composite', 8, [
      { xp: 60, at: T(1) }, { xp: 50, at: T(2) }, { xp: 40, at: T(3) },
      { xp: 30, at: T(4) }, { xp: 20, at: T(5) }, { xp: 10, at: T(6) },
    ]); // size 6 < capacity 8 -> not filled
    await finalizeWeek(WEEK);
    expect((await pool.query("select is_active from league_tiers where slug='metal-ceramic'")).rows[0].is_active).toBe(false);
    expect((await pool.query("select value from league_config where key='max_active_tier_order'")).rows[0].value).toBe('3');
  });
});

// --- placement + API --------------------------------------------------------

describe('GET /league — placement on first XP', () => {
  let app: FastifyInstance;
  beforeEach(async () => { app = await makeApp(); });

  it('a scoring action joins the user to a group; /league reflects it', async () => {
    const cookie = await loginAs(app, '09120000001');
    // A qualifying/scoring action -> +10 weekly_xp (new active day) + placement.
    const act = await app.inject({
      method: 'POST', url: '/activity', headers: { cookie },
      payload: { action: 'article_completed', content_id: 'insight/insight-1' },
    });
    expect(act.statusCode).toBe(200);

    const res = await app.inject({ method: 'GET', url: '/league', headers: { cookie } });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.joined).toBe(true);
    expect(body.my_weekly_xp).toBe(10);
    expect(body.my_rank).toBe(1);
    expect(body.neutral_mode).toBe(true);        // group of 1 is below validity
    expect(body.members).toHaveLength(1);
    expect(body.members[0].is_me).toBe(true);
    expect(body.tier.slug).toBe('acrylic');
  });

  it('a brand-new logged-in user with no XP is not placed', async () => {
    const cookie = await loginAs(app, '09120000002');
    const res = await app.inject({ method: 'GET', url: '/league', headers: { cookie } });
    expect(res.json().joined).toBe(false);
  });

  const act = (cookie, action, content_id) => app.inject({
    method: 'POST', url: '/activity', headers: { cookie }, payload: { action, content_id },
  });
  const myXp = async (cookie) => (await app.inject({ method: 'GET', url: '/league', headers: { cookie } })).json().my_weekly_xp;

  it('per-action XP: read once = +active(5) +read(5); re-reading the same article adds nothing', async () => {
    const cookie = await loginAs(app, '09120000003');
    await act(cookie, 'article_completed', 'insight/insight-1');
    await act(cookie, 'article_completed', 'insight/insight-1'); // same article, same day
    expect(await myXp(cookie)).toBe(10);
  });

  it('per-action XP: highlights are capped at 3 per article', async () => {
    const cookie = await loginAs(app, '09120000004');
    for (let i = 0; i < 4; i += 1) await act(cookie, 'highlight_created', 'insight/insight-2');
    expect(await myXp(cookie)).toBe(8); // 5 active + 1+1+1 (4th capped)
  });

  it('per-action XP: a podcast listen = +active(5) +listen(5)', async () => {
    const cookie = await loginAs(app, '09120000005');
    await act(cookie, 'episode_listened', 'episodes/episode-1');
    expect(await myXp(cookie)).toBe(10);
  });

  // ── content_shared ────────────────────────────────────────────────────────
  // The button behind these cases cannot be verified by anyone: navigator.share
  // resolves on a dismissed sheet on some platforms, and the clipboard fallback
  // reports nothing at all. So every rule below exists to make an unverifiable
  // tap safe to pay for, and each is pinned separately.

  it('a share of an UNREAD article pays nothing at all', async () => {
    const cookie = await loginAs(app, '09120000006');
    await act(cookie, 'content_shared', 'insight/insight-9');
    // Not 1, and not 5 either: the share must not have bought the daily active
    // bonus on the way past. `content_shared` is the one action that reaches
    // awardLeagueXp without being a scoring action, so nothing has happened
    // today that the league is willing to call activity — hence no group at all.
    const body = (await app.inject({ method: 'GET', url: '/league', headers: { cookie } })).json();
    expect(body.joined).toBe(false);
  });

  it('a share AFTER finishing the article pays xp_share, once per week', async () => {
    const cookie = await loginAs(app, '09120000007');
    await act(cookie, 'article_completed', 'insight/insight-3'); // 5 active + 5 read
    await act(cookie, 'content_shared', 'insight/insight-3');    // +1
    expect(await myXp(cookie)).toBe(11);
    await act(cookie, 'content_shared', 'insight/insight-3');    // same page, same week
    expect(await myXp(cookie)).toBe(11);
  });

  it('sharing mid-read does not burn the article\'s slot for the week', async () => {
    // The realistic sequence: share it while reading, then finish it. If
    // eligibility were "an article_completed row exists" rather than "the share
    // came after one", that first tap would have spent the week's only slot for
    // this page and the honest second share would pay nothing.
    const cookie = await loginAs(app, '09120000008');
    await act(cookie, 'content_shared', 'insight/insight-4');    // too early — 0
    await act(cookie, 'article_completed', 'insight/insight-4'); // 5 active + 5 read
    expect(await myXp(cookie)).toBe(10);
    await act(cookie, 'content_shared', 'insight/insight-4');    // +1
    expect(await myXp(cookie)).toBe(11);
  });

  it('stops paying past xp_share_weekly_cap, while reads keep paying', async () => {
    await setConfig('xp_share_weekly_cap', '2');
    const cookie = await loginAs(app, '09120000009');
    for (const id of ['a', 'b', 'c']) {
      await act(cookie, 'article_completed', `insight/share-${id}`);
      await act(cookie, 'content_shared', `insight/share-${id}`);
    }
    // 5 active + 3 reads × 5 + 2 shares × 1 (the third is over the cap).
    expect(await myXp(cookie)).toBe(22);
  });
});

describe('POST /admin/league/config', () => {
  const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');
  let app: FastifyInstance;
  beforeEach(async () => { app = await makeApp(); });

  function setCfg(body: unknown) {
    return app.inject({
      method: 'POST', url: '/admin/league/config',
      headers: { authorization: basic }, payload: body,
    });
  }

  it('requires admin credentials', async () => {
    const res = await app.inject({ method: 'POST', url: '/admin/league/config', payload: { key: 'x', value: 1 } });
    expect(res.statusCode).toBe(401);
  });

  it('changes a behavioural number and records why', async () => {
    const res = await setCfg({ key: 'promotion_min_weekly_xp', value: 25, reason: 'median came in under 30' });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true, changed: true, old_value: '30', value: '25' });
    expect((await getLeagueConfig()).promotion_min_weekly_xp).toBe(25);

    const audit = await pool.query(
      "select new_value, trigger_metric from league_audit_log where changed_key = 'promotion_min_weekly_xp'",
    );
    expect(audit.rows[0]).toMatchObject({ new_value: '25', trigger_metric: 'median came in under 30' });
  });

  it('rejects a value that is not a number for a numeric key', async () => {
    // Would not fail here but at finalize, a week later, on real users.
    const res = await setCfg({ key: 'promotion_min_weekly_xp', value: '۲۵ تا' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_value');
    expect((await getLeagueConfig()).promotion_min_weekly_xp).toBe(30);
  });

  it('rejects a negative value', async () => {
    expect((await setCfg({ key: 'promotion_pct', value: -5 })).statusCode).toBe(400);
  });

  it('lists the valid keys when the key is unknown', async () => {
    const res = await setCfg({ key: 'promotion_min_xp', value: 25 });
    expect(res.statusCode).toBe(404);
    expect(res.json().valid_keys).toContain('promotion_min_weekly_xp');
  });

  it('reports "unchanged" distinctly from a real change', async () => {
    const res = await setCfg({ key: 'promotion_min_weekly_xp', value: 30 });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ changed: false, note: 'unchanged' });
  });

  it('refuses a locked key with 409, and obeys force', async () => {
    await app.inject({
      method: 'POST', url: '/admin/league/lock',
      headers: { authorization: basic }, payload: { key: 'promotion_min_weekly_xp', locked: true },
    });

    const blocked = await setCfg({ key: 'promotion_min_weekly_xp', value: 25 });
    expect(blocked.statusCode).toBe(409);
    expect((await getLeagueConfig()).promotion_min_weekly_xp).toBe(30);

    const forced = await setCfg({ key: 'promotion_min_weekly_xp', value: 25, force: true });
    expect(forced.statusCode).toBe(200);
    expect((await getLeagueConfig()).promotion_min_weekly_xp).toBe(25);
  });
});

describe('GET /league — the scoring table the explainer shows', () => {
  let app: FastifyInstance;
  beforeEach(async () => { app = await makeApp(); });

  it('sends the live XP weights, so the "how do I score?" box cannot go stale', async () => {
    const cookie = await loginAs(app, '09121299001');
    const res = await app.inject({ method: 'GET', url: '/league', headers: { cookie } });

    expect(res.statusCode).toBe(200);
    const cfg = await getLeagueConfig();
    expect(res.json().xp).toEqual({
      read: cfg.xp_read,
      listen: cfg.xp_listen,
      highlight: cfg.xp_highlight,
      highlight_cap: cfg.xp_highlight_cap,
      review: cfg.xp_review,
      active_bonus: cfg.xp_active_bonus,
      share: cfg.xp_share,
      share_cap: cfg.xp_share_weekly_cap,
    });
  });

  it('follows a retune through the admin endpoint', async () => {
    const basic = 'Basic ' + Buffer.from(`${config.admin.user}:${config.admin.password}`).toString('base64');
    await app.inject({
      method: 'POST', url: '/admin/league/config',
      headers: { authorization: basic }, payload: { key: 'xp_read', value: 8 },
    });

    const cookie = await loginAs(app, '09121299002');
    const res = await app.inject({ method: 'GET', url: '/league', headers: { cookie } });
    expect(res.json().xp.read).toBe(8);
  });

  it('is present before the user has joined a group, since the box shows there too', async () => {
    const cookie = await loginAs(app, '09121299003');
    const res = await app.inject({ method: 'GET', url: '/league', headers: { cookie } });
    expect(res.json().joined).toBe(false);
    expect(res.json().xp.read).toBeTypeOf('number');
  });
});
