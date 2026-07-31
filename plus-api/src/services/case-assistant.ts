import { config } from '../config.js';
import { getClusters, getContentInfo } from '../content-index.js';
import { ai } from '../providers/registry.js';
import type { NarrowHistoryEntry, NarrowOption } from '../providers/ai/types.js';
import { getConsumedContentIds } from './consumption.js';

/**
 * «دستیار هوشمند» (premium): the AI's role is narrowing ONLY — turning a free-text
 * case description into a short multiple-choice round — never picking the final
 * article and never giving clinical advice. The level (cluster -> subtopic) and
 * the round cap are decided HERE, in plain code, from the user's own answer keys;
 * the AI is only ever shown the catalog this function computed and can only ever
 * return keys from it (openai-compatible.ts re-validates that independently, so
 * a compromised/hallucinating model still cannot point outside real content).
 * Entirely stateless server-side: the client resends the whole history each call.
 */

const ARTICLES_PER_MATCH = 4;

export interface CaseArticle {
  content_id: string;
  title: string;
  url: string;
  type: string;
}

export type CaseStep =
  | { done: false; question: string; options: NarrowOption[] }
  | { done: true; matched_fa: string | null; articles: CaseArticle[] };

function clusterByKey(key: string) {
  return getClusters().find((c) => c.key === key) ?? null;
}

function subtopicOwner(key: string) {
  for (const c of getClusters()) {
    const s = c.subtopics.find((x) => x.key === key);
    if (s) return { cluster: c, subtopic: s };
  }
  return null;
}

/** The last answer that actually picked a real option (skips free-text "custom" answers). */
function lastConcreteKey(history: NarrowHistoryEntry[]): string | null {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const a = history[i].answer;
    if (!('custom' in a)) return a.key;
  }
  return null;
}

/**
 * What the NEXT round is allowed to offer, derived purely from prior answers:
 * no selection yet -> top-level pillars; a pillar chosen -> its subtopics (or
 * nothing, if that pillar has none — already a leaf); a subtopic (or anything
 * unrecognized) -> nothing left to narrow. `null` means "resolve now".
 */
function nextCatalog(history: NarrowHistoryEntry[]): NarrowOption[] | null {
  const key = lastConcreteKey(history);
  if (!key) return getClusters().map((c) => ({ key: c.key, label: c.fa }));

  const cluster = clusterByKey(key);
  if (cluster) {
    if (!cluster.subtopics.length) return null;
    return cluster.subtopics.map((s) => ({ key: s.key, label: s.fa }));
  }
  return null; // a subtopic (leaf) or an unrecognized key — either way, stop here
}

function toArticle(contentId: string): CaseArticle | null {
  const info = getContentInfo(contentId);
  if (!info) return null;
  return { content_id: contentId, title: info.title, url: info.url, type: info.type };
}

async function resolve(userId: string, history: NarrowHistoryEntry[]): Promise<CaseStep> {
  const key = lastConcreteKey(history);
  let contentIds: string[] = [];
  let matchedFa: string | null = null;

  if (key) {
    const owner = subtopicOwner(key);
    if (owner) {
      contentIds = owner.subtopic.contentIds;
      matchedFa = owner.subtopic.fa;
    } else {
      const cluster = clusterByKey(key);
      if (cluster) { contentIds = cluster.contentIds; matchedFa = cluster.fa; }
    }
  }

  const consumed = await getConsumedContentIds(userId);
  const unread = contentIds.filter((id) => !consumed.has(id));
  const pool = unread.length ? unread : contentIds; // fully read already -> still show the match, not nothing

  const articles: CaseArticle[] = [];
  for (const id of pool) {
    const item = toArticle(id);
    if (item) articles.push(item);
    if (articles.length >= ARTICLES_PER_MATCH) break;
  }

  return { done: true, matched_fa: matchedFa, articles };
}

export async function nextCaseStep(
  userId: string,
  description: string,
  historyIn: NarrowHistoryEntry[],
): Promise<CaseStep> {
  // Never trust the client's history length: cap it here regardless of what was
  // sent, so a single description can drive at most maxRounds AI calls.
  const history = historyIn.slice(-config.assistant.maxRounds);
  if (history.length >= config.assistant.maxRounds) return resolve(userId, history);

  const catalog = nextCatalog(history);
  if (!catalog) return resolve(userId, history);

  const result = await ai.narrowCase({ description, history, catalog });
  if (result.done) return resolve(userId, history);
  return { done: false, question: result.question, options: result.options };
}
