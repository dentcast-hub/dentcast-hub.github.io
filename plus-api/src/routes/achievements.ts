import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { getBadgeCatalog, evaluateBadge, type MetalTier } from '../badges.js';
import { getTiers } from '../services/league.js';
import { getPathways } from '../pathways.js';
import { computeAchievementFacts } from '../services/achievements.js';
import {
  syncAchievements, pendingAnnouncements, markAnnouncementsSeen,
} from '../services/achievement-sync.js';
import {
  badgeCredits, grantCredits, referralCredits, spentSources, creditPercent, pickCredits,
  CREDIT_CAP_PERCENT, type DiscountCredit,
} from '../services/discount-credits.js';
import { PILLAR_DISCOUNT_PERCENT } from '../services/pillar.js';

/**
 * GET /achievements — the profile's «افتخارات» section: two league medals and
 * the badge wall.
 *
 * FREE ON EVERY PLAN, on purpose. Three of the badges can only be earned with
 * premium tools and are marked as such, but the shelf itself is not a premium
 * view: it is the reward surface for the habit the whole product is trying to
 * build, and the readers most in need of a reason to come back tomorrow are
 * exactly the ones who have not subscribed. Gating it would aim the mechanic
 * away from the cohort it exists for.
 *
 * The route is a pure read. Every badge is derived (see services/achievements.ts),
 * so this is safe to call as often as the profile is opened and there is no
 * write path that could disagree with it.
 */

export async function achievementRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', requireAuth);

  app.get('/achievements', async (request, reply) => {
    const user = request.user!;
    const catalog = getBadgeCatalog();
    const [facts, tiers] = await Promise.all([
      computeAchievementFacts(user.id, user.longest_streak),
      getTiers(),
    ]);

    // Thresholds written as 'all' resolve against what exists right now, so
    // publishing a sixteenth pathway moves the goal instead of un-earning a gold.
    const totals: Record<string, number> = { pathways_completed: getPathways().length };

    // The monetary layer: which one-time credits exist, and which are spent.
    // Guarded as a unit — the wall predates the discount tables and must keep
    // rendering if they are missing; a null here simply hides the money strip
    // and the per-level chips, never the badges.
    let spent: Set<string> | null = null;
    let readyCredits: DiscountCredit[] = [];
    let spentCredits: DiscountCredit[] = [];
    try {
      // referralCredits() joins here too — its own doc explains why leaving
      // it out would show the profile a SMALLER number than /pay/plans
      // quotes for the exact same account (pay.ts:52-54's own promise).
      const [grants, referral] = await Promise.all([
        grantCredits(user.id), referralCredits(user.id),
      ]);
      spent = await spentSources(user.id);
      const mine = [...badgeCredits(facts), ...grants, ...referral];
      readyCredits = mine.filter((c) => !spent!.has(c.source));
      // The other half of the same partition. A reader looking at «تخفیف‌های
      // من» is asking about their whole position, and "what is left" alone
      // cannot answer it: an account that has spent everything reads
      // identically to one that never earned anything.
      spentCredits = mine.filter((c) => spent!.has(c.source));
    } catch {
      spent = null;
      readyCredits = [];
      spentCredits = [];
    }
    const groupName = new Map(catalog.groups.map((g) => [g.key, g.title_fa]));
    const tierByOrder = new Map(tiers.map((t) => [t.tier_order, t]));

    const medals = catalog.medals.items.map((m) => {
      const best = facts.medals[m.rank]?.best_tier_order ?? 0;
      const tier = best > 0 ? tierByOrder.get(best) ?? null : null;
      return {
        key: m.key,
        title_fa: m.title_fa,
        earned: !!tier,
        // The medal never says a bare «طلا» — the tier is half its meaning, and
        // the word alone would collide with the badge wall's own metal levels.
        name_fa: tier ? `${m.metal_fa} ${tier.name_fa}` : m.title_fa,
        tier: tier ? { slug: tier.slug, name_fa: tier.name_fa, tier_order: tier.tier_order } : null,
        lead_fa: tier ? m.unlock_fa : m.locked_fa,
        detail_fa: m.detail_fa,
      };
    });

    const rows = catalog.badges
      .map((b) => ({ b, e: evaluateBadge(b, facts.metrics[b.metric] ?? 0, totals) }))
      // earned_only: a badge whose condition can never again be met by anyone
      // is not shown greyed out — a permanently locked tile is only an insult.
      .filter(({ b, e }) => !(b.visibility === 'earned_only' && !e.earned));

    // Ordering is decided here, not in the client, so every surface that ever
    // renders this list shows the same wall: earned first (strongest metal
    // first), then whatever is closest to being earned, then the mysteries.
    rows.sort((x, y) => {
      const rank = (r: typeof x) => (r.e.earned ? 0 : r.b.visibility === 'mystery' ? 2 : 1);
      if (rank(x) !== rank(y)) return rank(x) - rank(y);
      if (x.e.earned) return y.e.level - x.e.level;
      const toFirst = (r: typeof x) => (r.e.thresholds[0] > 0 ? r.e.value / r.e.thresholds[0] : 0);
      return toFirst(y) - toFirst(x);
    });

    const badges = rows.map(({ b, e }) => {
      // A mystery still dark keeps its secret: no name, no icon, no criterion.
      // Finding it is the whole reward, and a tooltip would spend it.
      const hidden = b.visibility === 'mystery' && !e.earned;
      const levels = b.leveled && b.levels
        ? b.levels.map((l, i) => {
          const done = e.level >= i;
          const pct = typeof l.discount_percent === 'number' && l.discount_percent > 0
            ? l.discount_percent
            : null;
          return {
            tier: l.tier, threshold: e.thresholds[i], unlock_fa: l.unlock_fa, done,
            // The money on this level, and where it stands: 'ready' | 'spent'
            // for a reached level, 'future' for one still being climbed to.
            // Null percent = a level that simply carries no money (bronzes).
            discount_percent: pct,
            discount_state: pct === null || spent === null
              ? null
              : !done ? 'future' : spent.has(`badge:${b.key}:${l.tier}`) ? 'spent' : 'ready',
          };
        })
        : null;
      return {
        key: b.key,
        hidden,
        title_fa: hidden ? null : b.title_fa,
        icon: hidden ? null : b.icon,
        group_fa: hidden ? null : groupName.get(b.group) ?? b.group,
        premium: b.premium,
        leveled: b.leveled,
        earned: e.earned,
        level: e.level,
        metal: e.metal,
        value: e.value,
        target: e.target,
        ratio: e.ratio,
        unit_fa: b.unit_fa ?? null,
        // The one line the tile and the sheet lead with: what you did, or what
        // is being asked. Chosen server-side so the two never fall out of step.
        lead_fa: hidden
          ? null
          : e.earned
            ? (b.leveled && b.levels ? b.levels[e.level].unlock_fa : b.unlock_fa ?? '')
            : b.locked_fa ?? '',
        detail_fa: hidden ? null : b.detail_fa,
        levels,
      };
    });

    const earned = badges.filter((b) => b.earned);
    const countMetal = (m: MetalTier) => earned.filter((b) => b.metal === m).length;

    // Reconcile the announcement ledger with what this response just said, while
    // the facts are still in hand — the profile page must not pay for the same
    // ten queries twice. `force` skips the debounce: a reader who has the wall
    // open is entitled to an answer current to the second, and this is the one
    // call site where the work is already done.
    //
    // Fire-and-forget: the shelf renders whether or not the ledger caught up,
    // and an announcement is worth exactly nothing if chasing it can 500 the
    // page the announcement is about.
    syncAchievements(user.id, { facts, force: true })
      .catch(() => { /* the wall is the product; the ledger is bookkeeping */ });

    // The money strip's numbers. `ready_percent` is everything unspent (it can
    // sit above the cap — the strip says the rest waits for a later purchase);
    // `next_purchase_percent` is the figure /pay/start would actually apply
    // right now, pillar included. Null when the credit tables were unreachable.
    const pillarPct = (facts.metrics.pillar_seat ?? 0) > 0 ? PILLAR_DISCOUNT_PERCENT : 0;
    const discount = spent === null ? null : {
      ready_percent: creditPercent(readyCredits),
      // What has already been consumed by a purchase — the half of the ledger
      // «تخفیف‌های من» needs in order to be a position rather than a teaser.
      // Counted on the same definition availableCredits() uses (a credit is
      // spent while its payment reads pending or paid), so ready + spent is
      // always everything this account has ever held, with no third state.
      spent_percent: creditPercent(spentCredits),
      cap_percent: CREDIT_CAP_PERCENT,
      pillar_percent: pillarPct,
      next_purchase_percent: pillarPct + creditPercent(pickCredits(readyCredits)),
    };

    return reply.send({
      summary: {
        earned: earned.length,
        total: badges.length,
        bronze: countMetal('bronze'),
        silver: countMetal('silver'),
        gold: countMetal('gold'),
      },
      discount,
      medals,
      badges,
    });
  });

  /**
   * GET /achievements/pending — the celebration queue: badges announced but not
   * yet acknowledged, oldest first.
   *
   * Separate from the wall because it answers a different question. The wall is
   * "what is true"; this is "what have we not told you yet", and only the second
   * one can be spent. The client shows these as one card (with paging when
   * several arrived together — three overlays in a row is a punishment, not a
   * reward) and then calls POST /achievements/seen.
   */
  app.get('/achievements/pending', async (request, reply) => {
    const items = await pendingAnnouncements(request.user!.id);
    return reply.send({ items });
  });

  // POST /achievements/seen — acknowledge the celebration. Mirrors
  // POST /league/outcome/seen and POST /premium/grant/seen exactly.
  app.post('/achievements/seen', async (request, reply) => {
    await markAnnouncementsSeen(request.user!.id);
    return reply.send({ ok: true });
  });
}
