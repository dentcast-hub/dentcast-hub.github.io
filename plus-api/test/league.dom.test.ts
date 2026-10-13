// @vitest-environment jsdom
import { beforeEach, it, expect, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ league: vi.fn(), seen: vi.fn() }));
vi.mock('/plus/js/api.js', () => ({ api: { league: mocks.league, leagueOutcomeSeen: mocks.seen } }));
vi.mock('/plus/js/config.js', () => ({ PREMIUM_FEATURES: [] }));

beforeEach(() => { document.body.innerHTML = ''; vi.clearAllMocks(); });

const data = (canPromote: boolean) => ({
  joined: true, tier: { name_fa: canPromote ? 'آمالگام' : 'تیتانیوم', tier_order: canPromote ? 2 : 7 },
  can_promote: canPromote, neutral_mode: false, promotion_zone: canPromote ? 2 : 0,
  demotion_zone: 0, size: 2, promotion_min_weekly_xp: 30,
  members: [{ rank: 1, display_name: 'A', weekly_xp: 50 }, { rank: 2, display_name: 'B', weekly_xp: 40 }],
});

it('shows highest-tier competition instead of impossible promotion conditions', async () => {
  mocks.league.mockResolvedValue(data(false));
  const { openLeagueOverlay } = await import('/plus/js/league.js');
  await openLeagueOverlay();
  expect(document.querySelector('.dcp-lg-foot')?.textContent).toContain('بالاترین لیگ');
  expect(document.querySelector('.dcp-lg-foot')?.textContent).not.toContain('برای صعود');
  expect(document.querySelector('.dcp-lg-zone.is-up')).toBeNull();
});

it('keeps promotion conditions for lower tiers', async () => {
  mocks.league.mockResolvedValue(data(true));
  const { openLeagueOverlay } = await import('/plus/js/league.js');
  await openLeagueOverlay();
  expect(document.querySelector('.dcp-lg-foot')?.textContent).toContain('برای صعود');
  expect(document.querySelector('.dcp-lg-zone.is-up')).not.toBeNull();
});

it('does not call staying in titanium a failure to earn promotion XP', async () => {
  const { maybeAnnounceOutcome } = await import('/plus/js/league.js');
  const d = data(false);
  await maybeAnnounceOutcome({ ...d, pending_outcome: { outcome: 'stayed', final_rank: 1, new_tier: d.tier } });
  expect(document.querySelector('.dcp-lg-announce')?.textContent).toContain('بالاترین لیگ');
  expect(document.querySelector('.dcp-lg-announce')?.textContent).not.toContain('امتیاز کافی برای صعود');
});
