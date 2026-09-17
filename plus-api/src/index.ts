import { buildServer } from './server.js';
import { config } from './config.js';
import { closePool } from './db.js';
import {
  startArticleScheduler, startStreakReminderScheduler, startReactivationScheduler,
  startLeagueScheduler, startHeldNotificationsScheduler, startReviewReminderScheduler,
  startAssistantLearningScheduler, startSubscriptionScheduler,
  startSubscriptionReminderScheduler, startWinbackScheduler, startPaymentReconcileScheduler,
  startPathwayAlertScheduler, startMonthlyReportScheduler,
} from './scheduler.js';
import { startBalePolling } from './services/bale-updates.js';
import { startContentRefresh } from './content-refresh.js';

async function main(): Promise<void> {
  const app = await buildServer();

  // Daily jobs (Asia/Tehran): the free-article digest (21:00), the streak
  // reminder (20:00), the reactivation nudge for no-streak users (20:00), league
  // finalization (00:00), the subscription expiry sweep (00:00), the morning
  // release of everything the awake window held overnight (09:00), and the
  // premium review-cards-due reminder (09:00).
  // Started here (not in buildServer) so tests never start real timers.
  const stopScheduler = startArticleScheduler();
  const stopStreakReminder = startStreakReminderScheduler();
  const stopReactivation = startReactivationScheduler();
  const stopLeague = startLeagueScheduler();
  const stopHeldNotifications = startHeldNotificationsScheduler();
  const stopReviewReminder = startReviewReminderScheduler();
  const stopAssistantLearning = startAssistantLearningScheduler();
  // Its own timer, not chained behind the league's: the sweep is the last word
  // on who is premium and must keep running on a night league finalization dies.
  const stopSubscriptions = startSubscriptionScheduler();
  // Mid-morning, so "three days left" arrives when it can be acted on.
  const stopSubscriptionReminders = startSubscriptionReminderScheduler();
  // 21:30: the win-back, a week after a subscription ended with no renewal. Its
  // own timer because the hour is the message — a deadline wants a morning, an
  // offer wants an evening — and 21:30 rather than 21:00 because the free
  // digest owns that minute and a lapsed reader is a free reader.
  const stopWinback = startWinbackScheduler();
  // Every 15 minutes, plus once at boot: finish or close payments the customer
  // never came back from. Minutes rather than daily because the row it looks for
  // is somebody already charged, and Zibal reverses an unverified transaction.
  const stopPaymentReconcile = startPaymentReconcileScheduler();
  // Late evening: who has come within a few steps of finishing a learning
  // pathway, and who has just finished one. Nothing else in the system knows —
  // pathway progress is derived, and its cache only moves when the reader opens
  // the pathway page — so without this the certificate can only ever be asked
  // for, never offered.
  const stopPathwayAlerts = startPathwayAlertScheduler();
  // گزارش ماهانه: announce last month's report to premium readers in the first
  // days of each Jalali month. The report itself is derived on request; this
  // only writes the اطلاعیه row that says it exists.
  const stopMonthlyReports = startMonthlyReportScheduler();
  // Bale connect worker: long-polls getUpdates and links chat_ids (no-op without
  // a BALE_BOT_TOKEN). Primary path since Bale's webhook delivery is unreliable.
  const stopBalePolling = startBalePolling();
  // Pull the published taxonomy/pathways instead of waiting for the next image
  // build: the files are baked in at build time, so without this every article
  // published on the static site needs a redeploy before the assistant, the
  // dashboard tree and the pathway pages can see it.
  const stopContentRefresh = startContentRefresh();

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down`);
    stopScheduler();
    stopStreakReminder();
    stopReactivation();
    stopLeague();
    stopHeldNotifications();
    stopReviewReminder();
    stopAssistantLearning();
    stopSubscriptions();
    stopSubscriptionReminders();
    stopWinback();
    stopPaymentReconcile();
    stopPathwayAlerts();
    stopMonthlyReports();
    stopBalePolling();
    stopContentRefresh();
    await app.close();
    await closePool();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: config.port, host: config.host });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
