import { defineConfig } from 'vitest/config';

// Tests run against a dedicated database so they never touch dev/seed data.
// global-setup.ts creates it and applies migrations once per run.
export default defineConfig({
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
    },
  },
});
