import { config } from '../../config.js';
import type { AiProvider } from './types.js';
import { StubAiProvider } from './stub.js';
import { OpenAiCompatibleProvider } from './openai-compatible.js';

/** Pick the AI provider from config, same shape as createSmsSender(). */
export function createAiProvider(): AiProvider {
  switch (config.ai.provider) {
    case 'stub':
      return new StubAiProvider();
    case 'openai-compatible':
      return new OpenAiCompatibleProvider();
    default:
      throw new Error(`Unknown AI_PROVIDER: ${config.ai.provider}`);
  }
}

export type { AiProvider } from './types.js';
