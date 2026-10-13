import { describe, it, expect, vi } from 'vitest';
import type pg from 'pg';
import { moveCurrentLeagueMembership } from '../src/services/league.js';
import type { LeagueConfig } from '../src/services/league-config.js';

vi.mock('../src/db.js', () => ({ pool: {} }));
vi.mock('../src/services/score.js', () => ({ SCORING_ACTIONS: [], CONSUMPTION_ACTIONS: [], SHARE_ACTION: 'content_shared' }));
vi.mock('../src/services/league-config.js', () => ({}));
vi.mock('../src/pathways.js', () => ({ getPathways: () => [] }));

const week = { week_start: '2026-10-10', week_end: '2026-10-16' };
const cfg = { min_group_capacity: 3, group_size_current: 8 } as LeagueConfig;

describe('late promotion/demotion preserves the current competition', () => {
  it.each(['promoted-tier', 'demoted-tier'])('moves the existing membership into %s without rewriting XP', async (tierId) => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [{ id: 'membership', tier_id: 'old-tier' }] })
      .mockResolvedValueOnce({ rows: [{ n: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: 'destination', capacity_at_creation: 5 }] })
      .mockResolvedValueOnce({ rows: [{ n: 3 }] })
      .mockResolvedValueOnce({ rows: [] });
    await moveCurrentLeagueMembership({ query } as unknown as pg.PoolClient, 'user', tierId, week, cfg);
    expect(query.mock.calls[0][1]).toEqual(['user', week.week_start]);
    expect(query.mock.calls[2][1]).toEqual([tierId, week.week_start]);
    expect(query.mock.calls[4]).toEqual(['update league_members set league_id = $2 where id = $1', ['membership', 'destination']]);
  });

  it.each([{ rows: [] }, { rows: [{ id: 'membership', tier_id: 'new-tier' }] }])('leaves absent or already correct memberships alone', async ({ rows }) => {
    const query = vi.fn().mockResolvedValue({ rows });
    await moveCurrentLeagueMembership({ query } as unknown as pg.PoolClient, 'user', 'new-tier', week, cfg);
    expect(query).toHaveBeenCalledTimes(1);
  });
});
