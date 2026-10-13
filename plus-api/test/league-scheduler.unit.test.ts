import { beforeEach, afterEach, it, expect, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  finalize: vi.fn(), grant: vi.fn(), expire: vi.fn(), outcome: vi.fn(), prize: vi.fn(),
}));
vi.mock('../src/config.js', () => ({ config: { streakTimezone: 'Asia/Tehran' } }));
vi.mock('../src/services/league-finalize.js', () => ({ finalizeDueWeeks: mocks.finalize }));
vi.mock('../src/services/premium-prize.js', () => ({ grantWeeklyPrizes: mocks.grant, expirePremiumPrizes: mocks.expire }));
vi.mock('../src/services/league-notify.js', () => ({ notifyLeagueOutcomes: mocks.outcome }));
vi.mock('../src/services/premium-prize-notify.js', () => ({ notifyPremiumPrizes: mocks.prize }));

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-09T20:29:59Z')); // one second before Saturday
  vi.clearAllMocks();
  mocks.finalize.mockResolvedValue({ weeks: 0 });
  mocks.grant.mockResolvedValue({ granted: 0 });
  mocks.expire.mockResolvedValue({ expired: 0 });
  mocks.outcome.mockResolvedValue({ notified: 0 });
  mocks.prize.mockResolvedValue({ notified: 0 });
  // Other schedulers are imported by the same module but never started here.
  const others = {
    'article-notify': ['runFreeDigest', 'runPremiumBacklog'],
    broadcast: ['releaseHeldBroadcastPushes'], 'streak-reminder': ['runStreakReminders'],
    reactivation: ['runReactivationNudges'], 'review-notify': ['runReviewReminders'],
    'assistant-learning': ['attributeStrongSignals'], subscription: ['sweepExpiredSubscriptions'],
    'payment-cap-alert': ['checkCapacityAlert'],
    'subscription-reminder': ['runSubscriptionReminders', 'runWinbackReminders'],
    'payment-reconcile': ['reconcilePendingPayments'], 'pathway-standings': ['runPathwayAlerts'],
    'pathway-exams': ['announceOpenExams', 'runReaderPathwayNotices'], 'monthly-report': ['runMonthlyReports'],
  };
  for (const [module, names] of Object.entries(others)) {
    vi.doMock(`../src/services/${module}.js`, () => Object.fromEntries(names.map((name) => [name, vi.fn()])));
  }
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it('recovers on boot, grants after finalization, and still runs at midnight', async () => {
  const { startLeagueScheduler } = await import('../src/scheduler.js');
  const stop = startLeagueScheduler();
  await vi.advanceTimersByTimeAsync(0);
  expect(mocks.finalize).toHaveBeenCalledTimes(1);
  expect(mocks.grant).toHaveBeenCalledTimes(1);
  expect(mocks.finalize.mock.invocationCallOrder[0]).toBeLessThan(mocks.grant.mock.invocationCallOrder[0]);
  await vi.advanceTimersByTimeAsync(1000);
  expect(mocks.finalize).toHaveBeenCalledTimes(2);
  stop();
  expect(vi.getTimerCount()).toBe(0);
});

it('does not overlap a slow boot recovery with midnight or restart a stopped scheduler', async () => {
  let finish!: (value: { weeks: number }) => void;
  mocks.finalize.mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
  const { startLeagueScheduler } = await import('../src/scheduler.js');
  const stop = startLeagueScheduler();
  await vi.advanceTimersByTimeAsync(1000);
  expect(mocks.finalize).toHaveBeenCalledTimes(1);
  stop();
  finish({ weeks: 0 });
  await vi.advanceTimersByTimeAsync(0);
  expect(mocks.grant).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('retries at midnight after a failed boot recovery', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.finalize.mockRejectedValueOnce(new Error('temporary failure'));
  const { startLeagueScheduler } = await import('../src/scheduler.js');
  const stop = startLeagueScheduler();
  await vi.advanceTimersByTimeAsync(1000);
  expect(mocks.finalize).toHaveBeenCalledTimes(2);
  expect(mocks.grant).toHaveBeenCalledTimes(1);
  stop();
});
