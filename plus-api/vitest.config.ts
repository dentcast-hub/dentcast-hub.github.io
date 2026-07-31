import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Tests run against a dedicated database so they never touch dev/seed data.
// global-setup.ts creates it and applies migrations once per run.
export default defineConfig({
  // The site's browser modules import each other by absolute site path
  // ('/plus/js/api.js'), which the static server resolves from the repo root.
  // Map that root here so a jsdom test can drive the REAL shipped file
  // (spot/spot.js) instead of a copy that can drift from it.
  resolve: {
    alias: [
      { find: /^\/plus\//, replacement: path.join(repoRoot, 'plus/') },
      { find: /^\/spot\//, replacement: path.join(repoRoot, 'spot/') },
    ],
  },
  test: {
    environment: 'node',
    globalSetup: './test/global-setup.ts',
    fileParallelism: false, // all files share one test DB; avoid cross-file races
    hookTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://dentcast:dentcast@localhost:5432/dentcast_plus_test',
      // Throwaway bot tokens so the Telegram-login route/verifier have keys under
      // test. dotenv does not override an already-set env var, so these win over
      // the real tokens in .env. Tests sign their payloads with these values.
      TELEGRAM_BOT_TOKEN: '123456:TEST-telegram-bot-token',
      TELEGRAM_BOT_TOKEN_IR: '999999:TEST-telegram-ir-bot-token',
      // Known Bale webhook secret so /webhooks/bale/:secret is exercisable. The
      // bot token stays empty, so baleSendMessage() stub-logs (no real network).
      BALE_WEBHOOK_SECRET: 'test-bale-webhook-secret',
      // Force the deterministic, offline AI provider. Without this, a developer
      // who has the real AI_PROVIDER/AI_API_KEY in .env (as production does)
      // would have the assistant suite call the live gateway on every run —
      // real money, real latency, and assertions that depend on a model's mood.
      AI_PROVIDER: 'stub',
    },
  },
});
