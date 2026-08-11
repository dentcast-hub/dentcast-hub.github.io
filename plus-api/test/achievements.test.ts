// The achievements section. Two properties carry the whole design and both are
// easy to break silently, so both are pinned here:
//
//   1. Every badge is DERIVED, never written down. So a brand-new account with
//      history already has its history lit, and a metric nobody computes is a
//      badge that quietly never lights for anyone.
//   2. A medal must never be minted for doing nothing — league-finalize.ts
//      writes final_rank for every member of every group, including the ones
//      the UI itself calls non-competitive and members who earned no XP at all.
import { describe, it, expect, beforeEach, afterAll, afterEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeApp, resetDb, loginAs } from './helpers.js';
import { pool } from '../src/db.js';
import {
  getBadgeCatalog, evaluateBadge, applyRemoteBadges, badgesSource, resetRemoteBadges,
  type Badge,
} from '../src/badges.js';

let app: FastifyInstance;
let cookie: string;
let phone: string;

/**
 * Every metric services/achievements.ts actually produces. The catalog is data
 * and can be edited without touching code, so this list is the seam where a
 * typo'd or invented metric turns into a caught test instead of a badge that
 * silently reads 0 forever.
 */
const COMPUTED = new Set([
  'longest_streak', 'streak_comeback', 'shield_used', 'episodes_completed',
  'articles_completed', 'max_content_in_week', 'highlights', 'highlights_with_note',
  'distinct_folders', 'folders_completed', 'archive_read', 'night_activity',
  'dawn_activity', 'weekend_pair', 'early_reads', 'weeks_no_demotion',
  'pathways_completed', 'review_sessions', 'collections', 'collection_items',
  'shares', 'tiers_won', 'founder_seat', 'pillar_seat',
]);

beforeEach(async () => {
  await resetDb();
  if (!app) app = await makeApp();
  phone = '09121200077';
  cookie = await loginAs(app, phone);
});

afterAll(async () => {
  await app?.close();
  await pool.end();
});

async function userId(): Promise<string> {
  const r = await pool.query<{ id: string }>('select id from profiles where phone = $1', [phone]);
  return r.rows[0].id;
}

async function get() {
  const res = await app.inject({ method: 'GET', url: '/achievements', headers: { cookie } });
  expect(res.statusCode).toBe(200);
  return res.json();
}

const badgeOf = (body: { badges: Array<{ key: string }> }, key: string) =>
  body.badges.find((b) => b.key === key);

/** Put the user in a finalized group of `size` members, at `rank`, in `tierSlug`. */
async function finalizedWeek(opts: {
  week: string; tierSlug: string; rank: number; size: number; weeklyXp: number;
  outcome?: string;
  /** The group's frozen capacity — its tier's own population since 0033. A
   *  group that reaches it is valid however small it is, which is what makes a
   *  medal reachable at the thin top of the ladder. Defaults clear of it. */
  capacity?: number;
}): Promise<void> {
  const me = await userId();
  const tier = await pool.query<{ id: string }>(
    'select id from league_tiers where slug = $1', [opts.tierSlug],
  );
  const league = await pool.query<{ id: string }>(
    `insert into leagues (tier_id, week_start, week_end, status, capacity_at_creation)
     values ($1, $2, ($2::date + 6), 'finalized', $3) returning id`,
    [tier.rows[0].id, opts.week, opts.capacity ?? 8],
  );
  const leagueId = league.rows[0].id;
  await pool.query(
    `insert into league_members (league_id, user_id, week_start, weekly_xp, final_rank, outcome)
     values ($1, $2, $3, $4, $5, $6)`,
    [leagueId, me, opts.week, opts.weeklyXp, opts.rank, opts.outcome ?? 'stayed'],
  );
  // Fill the group out with throwaway accounts so `count(*) over (partition by
  // league_id)` sees the size the test is actually describing.
  for (let i = 1; i < opts.size; i += 1) {
    const other = await pool.query<{ id: string }>(
      `insert into profiles (phone, display_name) values ($1, $2) returning id`,
      [`0990000${opts.week.slice(-2)}${String(i).padStart(2, '0')}`, `عضو ${i}`],
    );
    await pool.query(
      `insert into league_members (league_id, user_id, week_start, weekly_xp, final_rank, outcome)
       values ($1, $2, $3, 1, $4, 'stayed')`,
      [leagueId, other.rows[0].id, opts.week, opts.rank === 1 ? i + 1 : 1],
    );
  }
}

describe('the catalog and the service cannot drift apart', () => {
  it('names only metrics the service computes', () => {
    const catalog = getBadgeCatalog();
    expect(catalog.badges.length).toBeGreaterThan(0);
    // The granted class registers itself by convention: a metric of
    // `grant:<the badge's own key>` is computed generically from badge_grants
    // rows (services/achievements.ts folds each row in), so it is "computed"
    // exactly when the key matches — `grant:companion` on a badge whose key is
    // anything else would silently never light, which is what this catches.
    const computed = (b: Badge) => COMPUTED.has(b.metric) || b.metric === `grant:${b.key}`;
    const unknown = catalog.badges
      .filter((b) => !computed(b))
      .map((b) => `${b.key}:${b.metric}`);
    expect(unknown).toEqual([]);
    const unknownLevels = catalog.badges.flatMap((b) => (b.levels ?? [])
      .filter((l) => l.metric && !COMPUTED.has(l.metric))
      .map((l) => `${b.key}:${l.metric}`));
    expect(unknownLevels).toEqual([]);
  });

  it('gives every badge the copy its state will ask for', () => {
    for (const b of getBadgeCatalog().badges) {
      expect(b.icon, `${b.key} needs an icon`).toBeTruthy();
      expect(b.detail_fa, `${b.key} needs detail copy`).toBeTruthy();
      if (b.leveled) {
        // A leveled badge shows locked copy before bronze and one line per level.
        expect(b.locked_fa, `${b.key} needs locked copy`).toBeTruthy();
        expect(b.levels?.length).toBe(3);
        for (const l of b.levels!) expect(l.unlock_fa, `${b.key}/${l.tier}`).toBeTruthy();
      } else if (b.visibility !== 'earned_only') {
        expect(b.unlock_fa, `${b.key} needs unlock copy`).toBeTruthy();
      }
    }
  });

  it('orders every leveled badge bronze < silver < gold', () => {
    for (const b of getBadgeCatalog().badges.filter((x) => x.leveled)) {
      const nums = (b.levels ?? [])
        .map((l) => (typeof l.threshold === 'number' ? l.threshold : Infinity));
      for (let i = 1; i < nums.length; i += 1) {
        expect(nums[i], `${b.key} level ${i}`).toBeGreaterThan(nums[i - 1]);
      }
    }
  });
});

describe('evaluateBadge', () => {
  const leveled = (): Badge => ({
    key: 't', title_fa: 'ت', icon: 'flame', group: 'habit', premium: false, leveled: true,
    visibility: 'always', metric: 'highlights', locked_fa: 'x', detail_fa: 'y',
    levels: [
      { tier: 'bronze', threshold: 1, unlock_fa: 'b' },
      { tier: 'silver', threshold: 50, unlock_fa: 's' },
      { tier: 'gold', threshold: 300, unlock_fa: 'g' },
    ],
  });

  it('lights bronze on the very first one', () => {
    const e = evaluateBadge(leveled(), 1);
    expect(e.earned).toBe(true);
    expect(e.metal).toBe('bronze');
    expect(e.target).toBe(50);
  });

  it('measures progress from the level already held, not from zero', () => {
    // 63 highlights is 13 of the way along the 50 -> 300 leg, not 21% of 300.
    const e = evaluateBadge(leveled(), 63);
    expect(e.metal).toBe('silver');
    expect(e.ratio).toBeCloseTo(13 / 250, 5);
  });

  it('stops at gold with nothing left to count', () => {
    const e = evaluateBadge(leveled(), 900);
    expect(e.metal).toBe('gold');
    expect(e.target).toBeNull();
    expect(e.ratio).toBe(1);
  });

  it("treats an unresolvable 'all' threshold as unreachable, never as earned", () => {
    const b = leveled();
    b.levels![2].threshold = 'all';
    // No total supplied for the metric: gold must stay dark rather than light up
    // for everyone, which is the failure mode that would be invisible in review.
    expect(evaluateBadge(b, 10_000).metal).toBe('silver');
    expect(evaluateBadge(b, 10_000, { highlights: 400 }).metal).toBe('gold');
  });

  it('gives a one-shot badge no metal and no partial credit past 1', () => {
    const one: Badge = {
      key: 'p', title_fa: 'ققنوس', icon: 'phoenix', group: 'habit', premium: false,
      leveled: false, visibility: 'always', metric: 'streak_comeback', threshold: 1,
      locked_fa: 'x', unlock_fa: 'y', detail_fa: 'z',
    };
    expect(evaluateBadge(one, 0).earned).toBe(false);
    const e = evaluateBadge(one, 1);
    expect(e.earned).toBe(true);
    expect(e.metal).toBe('plain');
    expect(e.target).toBeNull();
  });
});

describe('a published catalog may replace the baked one, but never blank it', () => {
  afterEach(() => resetRemoteBadges());

  it('adopts a well-formed payload', () => {
    expect(badgesSource()).toBe('image/disk');
    const good = { version: 2, groups: [], medals: { items: [] }, badges: [
      { key: 'k', title_fa: 'ک', icon: 'flame', group: 'habit', premium: false,
        leveled: false, visibility: 'always', metric: 'highlights',
        locked_fa: null, detail_fa: '' },
    ] };
    expect(applyRemoteBadges(good)).toBe(true);
    expect(badgesSource()).toBe('published (1 badge(s))');
  });

  it.each([
    ['an HTML error page', '<!doctype html><title>404</title>'],
    ['null', null],
    ['an array where the catalog belongs', []],
    ['a catalog with no medals block', { version: 1, badges: [{ key: 'k', title_fa: 'ک', metric: 'm' }] }],
    ['a structurally valid but EMPTY catalog', { version: 1, groups: [], medals: { items: [] }, badges: [] }],
  ])('rejects %s and keeps the current copy', (_label, payload) => {
    expect(applyRemoteBadges(payload)).toBe(false);
    expect(badgesSource()).toBe('image/disk');
  });
});

describe('GET /achievements', () => {
  it('needs a session', async () => {
    const res = await app.inject({ method: 'GET', url: '/achievements' });
    expect(res.statusCode).toBe(401);
  });

  it('answers a brand-new account with a full, dark wall — never an empty one', async () => {
    const body = await get();
    // Exactly one thing is already true of a brand-new account — it is an early
    // one — and «پیشگام» says so. Everything else is dark but present.
    expect(body.badges.filter((b: { earned: boolean }) => b.earned).map((b: { key: string }) => b.key))
      .toEqual(['founder_reader']);
    expect(body.badges.length).toBeGreaterThan(10);
    expect(body.medals).toHaveLength(2);
    expect(body.medals.every((m: { earned: boolean }) => !m.earned)).toBe(true);
    // The locked medal asks for the rank; it does not yet name a tier.
    expect(body.medals[0].name_fa).toBe('مدال طلا');
  });

  it('hides a mystery badge completely until it is earned', async () => {
    const body = await get();
    const owl = badgeOf(body, 'night_owl');
    expect(owl).toBeTruthy();
    expect(owl.hidden).toBe(true);
    expect(owl.title_fa).toBeNull();
    expect(owl.icon).toBeNull();
    expect(owl.lead_fa).toBeNull();   // the criterion is the secret
    expect(owl.detail_fa).toBeNull();
  });

  it('omits an earned_only badge rather than showing it permanently locked', async () => {
    // A fresh test account is inside the founder seats, so force it out of them
    // by ageing every other profile ahead of it.
    await pool.query(
      `insert into profiles (phone, display_name, created_at)
       select '0912' || lpad(g::text, 7, '0'), 'x', now() - interval '10 days'
         from generate_series(1, 600) g`,
    );
    const body = await get();
    expect(badgeOf(body, 'founder_reader')).toBeUndefined();
  });

  it('lights «پیشگام» for an early account', async () => {
    const body = await get();
    const founder = badgeOf(body, 'founder_reader');
    expect(founder.earned).toBe(true);
    expect(founder.lead_fa).toContain('اولین‌های');
  });

  it('keeps «ستون» invisible until the account has actually paid, then lights it off the ledger', async () => {
    // Absent, not dark: the fill state is a secret (the badge's
    // _visibility_reason) — an unearned «ستون» on the wall would tell every
    // reader whether we are still under fifty paying accounts.
    const before = await get();
    expect(badgeOf(before, 'pillar')).toBeUndefined();

    // One settled gateway purchase — the same row services/pillar.ts ranks.
    // Derived, not written: no badge row exists anywhere, only this payment.
    const me = await userId();
    await pool.query(
      `insert into payments (user_id, amount_rial, months, gateway, order_id, status,
                             verified_at, period_jalali, period_gregorian)
       values ($1, 60000000, 6, 'zibal', 'pillar_test', 'paid', now(),
               to_char(now(), 'YYYY-MM'), to_char(now(), 'YYYY-MM'))`,
      [me],
    );
    const after = await get();
    const lit = badgeOf(after, 'pillar');
    expect(lit.earned).toBe(true);
    expect(lit.lead_fa).toContain('بیست درصد');
  });

  it('puts earned badges first and mysteries last', async () => {
    await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: 'notecast/episode-1', exact: 'یک متن هایلایت‌شده برای تست' },
    });
    const body = await get();
    const firstDark = body.badges.findIndex((b: { earned: boolean }) => !b.earned);
    const firstMystery = body.badges.findIndex((b: { hidden: boolean }) => b.hidden);
    expect(body.badges[0].earned).toBe(true);
    expect(firstMystery).toBeGreaterThan(firstDark);
    // and the mysteries run to the end, uninterrupted
    expect(body.badges.slice(firstMystery).every((b: { hidden: boolean }) => b.hidden)).toBe(true);
  });

  it('earns «قلم» bronze off a single highlight and counts it in the summary', async () => {
    await app.inject({
      method: 'POST', url: '/highlights', headers: { cookie },
      payload: { content_id: 'notecast/episode-1', exact: 'یک متن هایلایت‌شده برای تست' },
    });
    const body = await get();
    const quill = badgeOf(body, 'quill');
    expect(quill.earned).toBe(true);
    expect(quill.metal).toBe('bronze');
    expect(quill.value).toBe(1);
    expect(quill.target).toBe(50);
    expect(quill.lead_fa).toContain('اولین هایلایتت');
    expect(quill.levels.map((l: { done: boolean }) => l.done)).toEqual([true, false, false]);
    expect(body.summary.bronze).toBeGreaterThanOrEqual(1);
  });

  // «چراغ‌دار» is the one badge whose metric carries a precondition, and the
  // precondition is the badge's whole meaning — so it is pinned here as well as
  // in league.test.ts. The wall and the ladder must agree about a given tap:
  // a badge that lit for a share the league had refused to pay for would be the
  // two surfaces telling the reader different things about the same act.
  const share = (contentId: string, action = 'content_shared') => app.inject({
    method: 'POST', url: '/activity', headers: { cookie }, payload: { action, content_id: contentId },
  });

  it('leaves «چراغ‌دار» dark for sharing something that was never read', async () => {
    await share('insight/insight-7');
    const lamp = badgeOf(await get(), 'lamplighter');
    expect(lamp.earned).toBe(false);
    expect(lamp.value).toBe(0);
    expect(lamp.lead_fa).toContain('تا آخر خوانده‌ای'); // the locked copy states the rule
  });

  it('lights «چراغ‌دار» bronze once the shared article was finished first', async () => {
    await share('insight/insight-8', 'article_completed');
    await share('insight/insight-8');
    const lamp = badgeOf(await get(), 'lamplighter');
    expect(lamp.earned).toBe(true);
    expect(lamp.metal).toBe('bronze');
    expect(lamp.value).toBe(1);
    expect(lamp.target).toBe(10);
  });

  it('counts each article once however often it is sent on', async () => {
    await share('insight/insight-8', 'article_completed');
    for (let i = 0; i < 4; i += 1) await share('insight/insight-8');
    expect(badgeOf(await get(), 'lamplighter').value).toBe(1);
  });
});

describe('a medal is never minted for doing nothing', () => {
  it('ignores a first place in a group too small to be competitive', async () => {
    // 3 members: below league_config.min_valid_group_size (6). The UI already
    // refuses to promise promotion here, so a medal must not claim a win.
    await finalizedWeek({ week: '2026-01-03', tierSlug: 'acrylic', rank: 1, size: 3, weeklyXp: 40 });
    const body = await get();
    expect(body.medals[0].earned).toBe(false);
  });

  it('ignores a first place earned with zero weekly XP', async () => {
    await finalizedWeek({ week: '2026-01-10', tierSlug: 'acrylic', rank: 1, size: 8, weeklyXp: 0 });
    const body = await get();
    expect(body.medals[0].earned).toBe(false);
  });

  it('awards gold, named for the tier, on a real win', async () => {
    await finalizedWeek({ week: '2026-01-17', tierSlug: 'acrylic', rank: 1, size: 8, weeklyXp: 40 });
    const body = await get();
    expect(body.medals[0].earned).toBe(true);
    expect(body.medals[0].name_fa).toBe('طلای آکریل');
    expect(body.medals[0].tier.tier_order).toBe(1);
    expect(body.medals[1].earned).toBe(false); // silver is its own climb
  });

  it('keeps the highest tier ever won, and never walks it back', async () => {
    await finalizedWeek({ week: '2026-02-07', tierSlug: 'composite', rank: 1, size: 8, weeklyXp: 90 });
    // A later, lower win must not overwrite the better one — this is the whole
    // promise of the medal: relegation cannot take back what was won.
    await finalizedWeek({
      week: '2026-02-14', tierSlug: 'acrylic', rank: 1, size: 8, weeklyXp: 30, outcome: 'demoted',
    });
    const body = await get();
    expect(body.medals[0].name_fa).toBe('طلای کامپوزیت');
    expect(body.medals[0].tier.tier_order).toBe(3);
  });

  it('tracks silver independently of gold', async () => {
    await finalizedWeek({ week: '2026-03-07', tierSlug: 'amalgam', rank: 2, size: 8, weeklyXp: 55 });
    const body = await get();
    expect(body.medals[0].earned).toBe(false);
    expect(body.medals[1].earned).toBe(true);
    expect(body.medals[1].name_fa).toBe('نقرهٔ آمالگام');
  });
});

// «جلودار» and «سلطان» read the SAME query the medals do, and therefore inherit
// the validity filter — but they ask it a different question ("how many tiers",
// not "how high"), and that difference is where a plausible-looking mistake
// hides: counting weeks instead of tiers, or counting a second place.
describe('«جلودار» و «سلطان» — لیگ‌های متمایز، نه هفته‌ها', () => {
  const win = (week: string, tierSlug: string) =>
    finalizedWeek({ week, tierSlug, rank: 1, size: 8, weeklyXp: 40 });

  it('counts one tier won three weeks running as one, not three', async () => {
    await win('2026-04-04', 'acrylic');
    await win('2026-04-11', 'acrylic');
    await win('2026-04-18', 'acrylic');
    const v = badgeOf(await get(), 'vanguard');
    expect(v.value).toBe(1);
    expect(v.earned).toBe(false); // bronze wants two DIFFERENT leagues
    expect(v.target).toBe(2);
  });

  it('lights bronze on a second, different league', async () => {
    await win('2026-04-04', 'acrylic');
    await win('2026-04-11', 'amalgam');
    const v = badgeOf(await get(), 'vanguard');
    expect(v.earned).toBe(true);
    expect(v.metal).toBe('bronze');
    expect(v.value).toBe(2);
    expect(v.target).toBe(4);
  });

  it('never counts a second place, however many leagues it happened in', async () => {
    await finalizedWeek({ week: '2026-04-04', tierSlug: 'acrylic', rank: 2, size: 8, weeklyXp: 40 });
    await finalizedWeek({ week: '2026-04-11', tierSlug: 'amalgam', rank: 2, size: 8, weeklyXp: 40 });
    expect(badgeOf(await get(), 'vanguard').value).toBe(0);
  });

  it('carries the validity filter through from the medal query', async () => {
    // Two different tiers, but both groups too small to be competitive. The
    // medals already refuse these; the badge must refuse them for the same
    // reason, or the wall would award a rank the medal row denies.
    await finalizedWeek({ week: '2026-04-04', tierSlug: 'acrylic', rank: 1, size: 3, weeklyXp: 40 });
    await finalizedWeek({ week: '2026-04-11', tierSlug: 'amalgam', rank: 1, size: 3, weeklyXp: 40 });
    const body = await get();
    expect(badgeOf(body, 'vanguard').value).toBe(0);
    expect(body.medals[0].earned).toBe(false); // and the medal agrees
  });

  it('keeps «سلطان» dark short of all seven, and lights it on the seventh', async () => {
    const ladder = ['acrylic', 'amalgam', 'composite', 'metal-ceramic',
      'lithium-disilicate', 'zirconia', 'titanium'];
    // Six of seven: «جلودار» is at its top level and «سلطان» is still one away.
    for (let i = 0; i < 6; i += 1) await win(`2026-05-0${i + 2}`, ladder[i]);
    let body = await get();
    expect(badgeOf(body, 'vanguard').metal).toBe('gold');
    const sultanBefore = badgeOf(body, 'sultan');
    expect(sultanBefore.earned).toBe(false);
    expect(sultanBefore.value).toBe(6);
    expect(sultanBefore.target).toBe(7);

    await win('2026-05-09', ladder[6]);
    body = await get();
    const sultan = badgeOf(body, 'sultan');
    expect(sultan.earned).toBe(true);
    // Above the ladder, not on it: a one-shot badge wears the accent ring, and
    // the wall must not hand it a metal it has no level to justify.
    expect(sultan.metal).toBe('plain');
    expect(sultan.levels).toBeNull();
    expect(sultan.lead_fa).toContain('هر هفت لیگ');
  });

  it('counts tiers that are not activated yet, since a finalized week is a fact', async () => {
    // max_active_tier_order is 3 today, so tiers 4-7 cannot be reached now —
    // but the metric reads finalized history, not the activation flag. If that
    // ever diverged, «سلطان» would become unearnable even after the ladder opens.
    await win('2026-06-06', 'zirconia');
    expect(badgeOf(await get(), 'vanguard').value).toBe(1);
  });
});

/**
 * «یادآور» counts DAYS of reviewing, not cards answered.
 *
 * It counted rows. A card is born due (card_state is inserted with
 * next_review_at = null), so creating highlights and answering them straight
 * away minted hundreds of "sessions" in an afternoon — and this badge's silver
 * and gold mint REAL one-time purchase discounts (٪۱ / ٪۲). That made the wall
 * a way to farm money off a subscription, which is the one thing it must not
 * be. A day is the unit that cannot be looped.
 */
describe('«یادآور» — روزهای مرور، نه تعدادِ کارت‌ها', () => {
  const reviewOn = async (day: string, times: number): Promise<void> => {
    const uid = await userId();
    for (let i = 0; i < times; i += 1) {
      await pool.query(
        `insert into user_activity (user_id, action, content_id, created_at)
         values ($1, 'review_finished', $2, $3::timestamptz)`,
        [uid, `insight/insight-${i % 5 + 1}`, `${day}T09:${String(i % 60).padStart(2, '0')}:00+03:30`],
      );
    }
  };

  // `level` is an index into the catalog's levels: -1 unearned, 0 bronze,
  // 1 silver, 2 gold (evaluateBadge).
  const BRONZE = 0;
  const SILVER = 1;

  it('six hundred cards in one night is one day, not six hundred sessions', async () => {
    await reviewOn('2026-03-01', 600);
    const badge = badgeOf(await get(), 'recaller');
    expect(badge!.value).toBe(1);
    expect(badge!.level, 'a night of looping must not reach a paying level').toBe(BRONZE);
  });

  it('the paying levels need real calendar days, and they pay a discount', async () => {
    for (let d = 1; d <= 10; d += 1) {
      await reviewOn(`2026-03-${String(d).padStart(2, '0')}`, 3);
    }
    const badge = badgeOf(await get(), 'recaller');
    expect(badge!.value).toBe(10);
    expect(badge!.level).toBe(SILVER);
    // The reason the metric matters: this level is money.
    const silver = getBadgeCatalog().badges.find((b: Badge) => b.key === 'recaller')!
      .levels!.find((l) => l.tier === 'silver')!;
    expect(silver.discount_percent).toBe(1);
  });
});

/**
 * A medal at the thin top of the ladder.
 *
 * The validity filter is what stops a medal being minted for doing nothing, and
 * it used to be an absolute floor — which made the highest tier, the hardest
 * place on the site to finish first in, the one place a medal could never be
 * minted at all. It now asks the same question league-finalize.ts asks: at or
 * above the floor, OR full — a group holding its whole tier.
 */
describe('a medal follows the same validity rule as the league', () => {
  it('awards gold in a small group that held its whole tier', async () => {
    await finalizedWeek({
      week: '2026-04-04', tierSlug: 'composite', rank: 1, size: 5, weeklyXp: 40, capacity: 5,
    });
    const medal = (await get()).medals.find((m: { key: string }) => m.key === 'medal_gold');
    expect(medal.earned, 'five of five is a championship, not a thin group').toBe(true);
  });

  it('still refuses one that left room — the floor is intact where it belongs', async () => {
    await finalizedWeek({
      week: '2026-04-11', tierSlug: 'composite', rank: 1, size: 5, weeklyXp: 40, capacity: 15,
    });
    const medal = (await get()).medals.find((m: { key: string }) => m.key === 'medal_gold');
    expect(medal.earned).toBe(false);
  });
});
