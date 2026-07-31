import type { AiProvider, NarrowRoundInput, NarrowRoundResult } from './types.js';

/**
 * Dev/test provider: zero network, zero cost, fully deterministic. It always
 * offers the first few catalog entries back (real keys, so downstream
 * validation always passes) and never claims `done` on its own — the actual
 * stopping logic (max rounds, running out of catalog) lives entirely in
 * services/case-assistant.ts, so that logic is testable without a real key.
 */
export class StubAiProvider implements AiProvider {
  readonly name = 'stub';

  async narrowCase({ catalog }: NarrowRoundInput): Promise<NarrowRoundResult> {
    if (!catalog.length) return { done: true };
    return {
      done: false,
      question: 'کدام‌یک به شرایط بیمار نزدیک‌تر است؟',
      options: catalog.slice(0, 4),
    };
  }

  /** Never guesses: keeps the keyword-search round deterministic (and free)
   * in dev/test — it always falls straight through to the pillar-tree
   * fallback in services/case-assistant.ts, exactly like round 1 did before
   * the hashtag round existed. */
  async suggestKeywords(): Promise<string[]> {
    return [];
  }
}
