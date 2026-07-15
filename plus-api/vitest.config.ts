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
    },
  },
});
