import type { AiProvider } from './types.js';

/**
 * Dev/test provider: zero network, zero cost, fully deterministic. It never
 * guesses — it always returns no tags, so a dev/test round falls straight
 * through to the honest pillar-catalog fallback in
 * services/case-assistant.ts. That keeps the whole stopping/fallback logic
 * (max rounds, empty catalog, nothing relevant found) testable without a real
 * key, exactly as it was before the tag round existed.
 */
export class StubAiProvider implements AiProvider {
  readonly name = 'stub';

  async selectTags(): Promise<string[]> {
    return [];
  }
}
