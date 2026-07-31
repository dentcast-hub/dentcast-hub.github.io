import { buildServer } from './server.js';
import { config } from './config.js';
import { closePool } from './db.js';
import {
  startArticleScheduler, startStreakReminderScheduler, startReactivationScheduler,
  startLeagueScheduler, startHeldNotificationsScheduler, startReviewReminderScheduler,
} from './scheduler.js';
import { startBalePolling } from './services/bale-updates.js';

async function main(): Promise<void> {
  const app = await buildServer();

  // Daily jobs (Asia/Tehran): the free-article digest (21:00), the streak
  // reminder (20:00), the reactivation nudge for no-streak users (20:00), league
  // finalization (00:00), the morning release of everything the awake window held
  // overnight (09:00), and the premium review-cards-due reminder (09:00).
  // Started here (not in buildServer) so tests never start real timers.
  const stopScheduler = startArticleScheduler();
  const stopStreakReminder = startStreakReminderScheduler();
  const stopReactivation = startReactivationScheduler();
  const stopLeague = startLeagueScheduler();
  const stopHeldNotifications = startHeldNotificationsScheduler();
  const stopReviewReminder = startReviewReminderScheduler();
  // Bale connect worker: long-polls getUpdates and links chat_ids (no-op without
  // a BALE_BOT_TOKEN). Primary path since Bale's webhook delivery is unreliable.
  const stopBalePolling = startBalePolling();

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down`);
    stopScheduler();
    stopStreakReminder();
    stopReactivation();
    stopLeague();
    stopHeldNotifications();
    stopReviewReminder();
    stopBalePolling();
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
