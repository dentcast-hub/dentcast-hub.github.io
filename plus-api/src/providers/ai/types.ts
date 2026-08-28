/**
 * Provider-agnostic semantic indexing step. The AI's ONLY job is understanding:
 * given a free-text case description, bridge the speaker's own words to the
 * site's REAL hashtags (it is shown the whole catalog) and return a subset of
 * them. It never picks an article, never writes the question, never decides
 * when to stop, and never gives a diagnosis or free-form advice — see
 * services/case-assistant.ts, which owns all of that in plain code and which
 * re-validates every string the provider returns against the live content index
 * before any of it reaches a user.
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

export interface SelectTagsInput {
  /** The user's free-text description (capped at 500 chars by the route). */
  description: string;
  /** The user's own "غیر از این‌ها" free-text refinements, in order. */
  refinements: string[];
  /** The Persian label of every REAL site hashtag — the full catalog. */
  catalog: string[];
}

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
   * The model's only job: understand what the free text actually MEANS
   * (synonyms, clinical vocabulary, the concept behind the complaint) and
   * return the closest labels VERBATIM from `catalog` — most relevant first,
   * at most 8, and [] when nothing is genuinely relevant. Picking articles,
   * writing the question and deciding to stop are not this method's job.
   *
   * Returns an empty array on anything unusable, never throws for a
   * malformed-but-parseable answer: a degraded round falls through to the
   * honest pillar fallback in services/case-assistant.ts, not an error screen.
   */
  selectTags(input: SelectTagsInput): Promise<string[]>;
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
