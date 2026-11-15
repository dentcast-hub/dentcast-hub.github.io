import type { AiProvider } from './types.js';

/**
 * Dev/test provider: zero network, zero cost, fully deterministic. It never
 * guesses — it always returns no verdict, so every graded answer falls
 * straight through to its caller's degraded path, testable without a real
 * key.
 */
export class StubAiProvider implements AiProvider {
  readonly name = 'stub';

  // AI_PROVIDER=stub (the default, and what CI runs) — every attempt therefore
  // queues, which is the correct degraded behaviour (handoff §6.4) and lets
  // the whole challenge test suite run without a key.
  async matchKeyPoints(): Promise<{ id: string; state: 'covered' | 'missing' | 'unsure' }[]> {
    return [];
  }
}
