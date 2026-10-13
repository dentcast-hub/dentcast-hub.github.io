import { defineConfig } from 'vitest/config';
import base from './vitest.config.js';

// Regression tests with mocked storage: no PostgreSQL or external services.
export default defineConfig({
  ...base,
  test: { ...base.test, globalSetup: [], include: ['test/league-*.unit.test.ts', 'test/league.dom.test.ts'] },
});
