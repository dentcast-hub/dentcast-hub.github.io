import Fastify from 'fastify';
import { it, expect, vi } from 'vitest';
import { leagueRoutes } from '../src/routes/league.js';

const mocks = vi.hoisted(() => ({ query: vi.fn(), config: vi.fn() }));
vi.mock('../src/db.js', () => ({ pool: { query: mocks.query } }));
vi.mock('../src/services/league-config.js', () => ({ getLeagueConfig: mocks.config }));
vi.mock('../src/services/score.js', () => ({ SCORING_ACTIONS: [], CONSUMPTION_ACTIONS: [], SHARE_ACTION: 'content_shared' }));
vi.mock('../src/pathways.js', () => ({ getPathways: () => [] }));
vi.mock('../src/middleware/auth.js', () => ({ requireAuth: async (request: any) => { request.user = { id: 'me' }; } }));

it.each([
  { order: 2, size: 6, capacity: 8, population: 10, promo: 20, demo: 20, expected: 0 },
  { order: 2, size: 8, capacity: 8, population: 10, promo: 20, demo: 20, expected: 2 },
  { order: 1, size: 8, capacity: 8, population: 10, promo: 20, demo: 20, expected: 0 },
  { order: 7, size: 2, capacity: 3, population: 2, promo: 20, demo: 20, expected: 0 },
  { order: 2, size: 4, capacity: 4, population: 10, promo: 20, demo: 20, expected: 0 },
  { order: 2, size: 6, capacity: 6, population: 10, promo: 80, demo: 80, expected: 1 },
])('reports actual demotion eligibility: %j', async ({ order, size, capacity, population, promo, demo, expected }) => {
  mocks.config.mockResolvedValue({ timezone: 'Asia/Tehran', min_valid_group_size: 6,
    min_rankable_group_size: 2, promotion_pct: promo, demotion_pct: demo });
  const tiers = Array.from({ length: 7 }, (_, i) => ({ id: `tier-${i + 1}`, slug: `t${i + 1}`, tier_order: i + 1 }));
  mocks.query.mockImplementation(async (sql: string) => {
    if (sql.includes('from league_tiers')) return { rows: tiers };
    if (sql.includes('select current_tier_id')) return { rows: [{ current_tier_id: `tier-${order}` }] };
    if (sql.includes('outcome_seen')) return { rows: [] };
    if (sql.includes('select lm.league_id')) return { rows: [{ league_id: 'group', weekly_xp: 50,
      tier_id: `tier-${order}`, capacity_at_creation: capacity, population_at_creation: population }] };
    if (sql.includes('rank()')) return { rows: Array.from({ length: size }, (_, i) => ({
      user_id: i ? `u${i}` : 'me', display_name: `u${i}`, weekly_xp: 50 - i, rnk: i + 1,
    })) };
    throw new Error(`Unexpected SQL: ${sql}`);
  });
  const app = Fastify();
  try {
    await app.register(leagueRoutes);
    const response = await app.inject({ method: 'GET', url: '/league' });
    expect(response.statusCode).toBe(200);
    expect(response.json().demotion_zone).toBe(expected);
  } finally { await app.close(); }
});
