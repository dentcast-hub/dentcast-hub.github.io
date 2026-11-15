/**
 * Provider-agnostic grading step. The AI's ONLY job is understanding: given a
 * reader's free-text answer and a fixed list of key points, say which of them
 * the answer covers. It never writes an answer and never gives a diagnosis or
 * free-form advice — the callers (services/challenge.ts,
 * services/pathway-exams.ts) own everything else in plain code and re-validate
 * every verdict the provider returns against the live key-point set before any
 * of it reaches a user.
 */

export interface KeyPoint { id: string; text: string; }
export interface MatchExample { answer: string; verdict: { id: string; state: 'covered' | 'missing' }[]; }

export interface MatchKeyPointsInput {
  /** The founder's key points, 3–5 of them. The model may return no other id. */
  keyPoints: KeyPoint[];
  /** The reader's answer, capped by the route at config.challenge.maxAnswerChars. */
  answer: string;
  /** Founder rulings on earlier answers to THIS challenge, most recent first. */
  examples: MatchExample[];
}

export type PointState = 'covered' | 'missing' | 'unsure';

export interface AiProvider {
  readonly name: string;
  /**
   * چالش grading. For each key point, did the reader's answer cover it?
   * Returns one entry per key point, in the same order, or [] on anything
   * unusable — which the caller (services/challenge.ts) treats exactly like
   * an all-`unsure` answer and queues for the founder. Never asked for a
   * confidence number (handoff RULE 4): `unsure` is the confidence mechanism,
   * a first-class answer the system prompt actively invites, not a threshold
   * over a number that clusters on round values.
   */
  matchKeyPoints(input: MatchKeyPointsInput): Promise<{ id: string; state: PointState }[]>;
}
