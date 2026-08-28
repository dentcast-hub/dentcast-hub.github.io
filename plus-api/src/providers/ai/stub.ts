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

  // AI_PROVIDER=stub (the default, and what CI runs) — every attempt therefore
  // queues, which is the correct degraded behaviour (handoff §6.4) and lets
  // the whole challenge test suite run without a key.
  async matchKeyPoints(): Promise<{ id: string; state: 'covered' | 'missing' | 'unsure' }[]> {
    return [];
  }
}
