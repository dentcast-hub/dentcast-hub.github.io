/**
 * Provider-agnostic AI narrowing step. The AI's ONLY job is classification: given
 * a free-text description and the prior Q&A history, either ask one more
 * multiple-choice question (options drawn from `catalog`, nothing else) or
 * declare it has enough to resolve. It never sees or produces article content,
 * a diagnosis, or free-form advice — see services/case-assistant.ts, which is
 * the thing that actually resolves a finished round to real DentCast articles
 * and which re-validates every option key the provider returns against the
 * same catalog before trusting it.
 */

export interface NarrowOption {
  key: string;
  label: string;
}

export interface NarrowHistoryEntry {
  question: string;
  options: NarrowOption[];
  answer: { key: string; label: string } | { custom: string };
}

export interface NarrowRoundInput {
  description: string;
  history: NarrowHistoryEntry[];
  /** The ONLY option keys valid this round — server-derived, never client-supplied. */
  catalog: NarrowOption[];
}

export type NarrowRoundResult =
  | { done: false; question: string; options: NarrowOption[] }
  | { done: true };

export interface AiProvider {
  readonly name: string;
  narrowCase(input: NarrowRoundInput): Promise<NarrowRoundResult>;
}
