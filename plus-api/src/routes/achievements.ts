import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
import { getBadgeCatalog, evaluateBadge, type MetalTier } from '../badges.js';
import { getTiers } from '../services/league.js';
import { getPathways } from '../pathways.js';
import { computeAchievementFacts } from '../services/achievements.js';

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
        ? b.levels.map((l, i) => ({
          tier: l.tier, threshold: e.thresholds[i], unlock_fa: l.unlock_fa, done: e.level >= i,
        }))
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

    return reply.send({
      summary: {
        earned: earned.length,
        total: badges.length,
        bronze: countMetal('bronze'),
        silver: countMetal('silver'),
        gold: countMetal('gold'),
      },
      medals,
      badges,
    });
  });
}
