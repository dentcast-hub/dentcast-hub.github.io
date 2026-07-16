import { buildServer } from './server.js';
import { config } from './config.js';
import { closePool } from './db.js';
import { startArticleScheduler } from './scheduler.js';

async function main(): Promise<void> {
  const app = await buildServer();

  // Daily free-article digest at 21:00 Asia/Tehran. Lives here (not in
  // buildServer) so tests never start real timers.
  const stopScheduler = startArticleScheduler();

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received, shutting down`);
    stopScheduler();
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
