import { buildServer } from './server.js';
import { config } from './config.js';
import { closePool } from './db.js';
import {
  startArticleScheduler, startStreakReminderScheduler, startReactivationScheduler,
} from './scheduler.js';

async function main(): Promise<void> {
  const app = await buildServer();

  // Daily jobs (Asia/Tehran): the free-article digest (21:00), the streak
  // reminder (20:00), and the reactivation nudge for no-streak users (20:00).
  // Started here (not in buildServer) so tests never start real timers.
  const stopScheduler = startArticleScheduler();
  const stopStreakReminder = startStreakReminderScheduler();
  const stopReactivation = startReactivationScheduler();

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down`);
    stopScheduler();
    stopStreakReminder();
    stopReactivation();
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
