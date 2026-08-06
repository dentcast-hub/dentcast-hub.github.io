import { buildServer } from './server.js';
import { config } from './config.js';
import { closePool } from './db.js';
import {
  startArticleScheduler, startStreakReminderScheduler, startReactivationScheduler,
  startLeagueScheduler, startHeldNotificationsScheduler, startReviewReminderScheduler,
  startAssistantLearningScheduler, startSubscriptionScheduler,
  startSubscriptionReminderScheduler, startPaymentReconcileScheduler,
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
  // Every 15 minutes, plus once at boot: finish or close payments the customer
  // never came back from. Minutes rather than daily because the row it looks for
  // is somebody already charged, and Zibal reverses an unverified transaction.
  const stopPaymentReconcile = startPaymentReconcileScheduler();
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
    stopPaymentReconcile();
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
