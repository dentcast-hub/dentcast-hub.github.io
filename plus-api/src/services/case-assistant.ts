import { config } from '../config.js';
import { getClusters, getContentInfo, getTags } from '../content-index.js';
import { ai } from '../providers/registry.js';
import type { NarrowHistoryEntry, NarrowOption } from '../providers/ai/types.js';
import { getConsumedContentIds } from './consumption.js';

/**
 * «دستیار هوشمند» (premium): the AI's role is narrowing ONLY — turning a free-text
 * case description into a short multiple-choice round — never picking the final
 * article and never giving clinical advice.
 *
 * Two narrowing strategies, tried in order:
 *  1. Keyword search over the site's REAL #hashtags (nextRootCatalog/tagMatchScore
 *     below). The AI reads the free text and suggests short topic phrases; this
 *     module — not the model — matches those against every real site tag and
 *     offers the best matches. Most tags are used on a single piece of content
 *     (checked: ~75% of ~1,300 site tags), so this reaches niche content no
 *     fixed category tree could, without needing that content cross-listed under
 *     every plausible pillar.
 *  2. The original fixed pillar -> subtopic tree (nextClusterCatalog/resolve's
 *     cluster branch), kept as a fallback for whatever the tag search finds
 *     nothing for (a very generic description, an odd phrasing, or the stub/dev
 *     AI provider, which never guesses keywords on purpose).
 * Either way the level and the round cap are decided HERE, in plain code, from
 * the user's own answer keys; the AI is only ever shown the catalog this module
 * computed and can only ever return keys from it (openai-compatible.ts
 * re-validates that independently, so a compromised/hallucinating model still
 * cannot point outside real content). Entirely stateless server-side: the
 * client resends the whole history each call.
 */

const ARTICLES_PER_MATCH = 4;
const MAX_TAG_OPTIONS = 4;
// A real site tag is usually 1-3 words; requiring at least half of them to
// show up among the AI's suggested phrases keeps a bare one-word coincidence
// (e.g. a generic "دندان" hit) from outranking a tag that's actually specific
// to the case.
const TAG_MATCH_THRESHOLD = 0.5;
const TAG_PREFIX = 'tag:';
// Same generic fallback text openai-compatible.ts/stub.ts already use when a
// provider doesn't (or, here, must not be allowed to) supply its own question.
const DEFAULT_QUESTION = 'کدام‌یک به شرایط بیمار نزدیک‌تر است؟';

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

function tagByKey(key: string) {
  return getTags().find((t) => t.key === key) ?? null;
}

/** The last answer that actually picked a real option (skips free-text "custom" answers). */
function lastConcreteKey(history: NarrowHistoryEntry[]): string | null {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const a = history[i].answer;
    if (!('custom' in a)) return a.key;
  }
  return null;
}

/** Every free-text answer so far, in order — the user's own refinements
 * ("غیر از این‌ها" -> types something else) each get folded back into the
 * next keyword search, instead of being dead ends. */
function customAnswers(history: NarrowHistoryEntry[]): string[] {
  return history.filter((h): h is NarrowHistoryEntry & { answer: { custom: string } } => 'custom' in h.answer)
    .map((h) => h.answer.custom);
}

// ZWNJ (half-space) + the two directional marks — invisible, but they split
// what should be one word into two tokens if left in. Written as escapes, not
// literal invisible characters, so they can't get silently stripped by an
// editor/formatter.
const ZERO_WIDTH = /[\u200c\u200e\u200f]/g;

function normalizeFa(s: string): string {
  return s
    .replace(ZERO_WIDTH, ' ')
    .replace(/ك/g, 'ک')
    .replace(/ي/g, 'ی')
    .replace(/[#_]/g, ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Common connector/filler words, dropped before matching. Without this a
// generic word incidental to a real suggestion (e.g. "یک" in "یک عارضه‌ی
// نادر") can spuriously fully-match a short real tag that happens to be
// exactly that word plus one other (real example found in testing: تگ «کلاس
// یک» matching on "یک" alone). Real site tags are specialist phrases, never
// built from these — dropping them costs nothing.
const STOPWORDS = new Set([
  'و', 'یا', 'با', 'بی', 'در', 'به', 'از', 'که', 'را', 'تا', 'برای', 'روی', 'یک', 'این', 'آن',
]);

function words(s: string): string[] {
  return normalizeFa(s).split(' ').filter((w) => w && !STOPWORDS.has(w));
}

/**
 * Score one real site tag against the AI's suggested phrases: the fraction of
 * the TAG's own words that appear somewhere among the suggestions. Scoring
 * off the tag (not the suggestion) means a short, specific tag needs its
 * words fully covered to count, while a longer suggestion phrase can still
 * hit several different tags.
 */
function tagMatchScore(tagFa: string, suggestedWords: Set<string>): number {
  const tagWords = words(tagFa);
  if (!tagWords.length) return 0;
  const hits = tagWords.filter((w) => suggestedWords.has(w)).length;
  return hits / tagWords.length;
}

/**
 * Keyword-suggestion cache. The root round costs TWO sequential model calls
 * (suggest keywords, then narrow), and on a slow day that measured 15-53s to
 * the first question — so the cheapest win is not making the first call at all
 * when we have already answered this exact text.
 *
 * It is safe to cache because the call is deterministic by construction:
 * temperature 0, no user identity in the input, and the result is only ever a
 * list of topic phrases that then get matched against the site's tags IN CODE.
 * Two users describing the same case should get the same candidate tags.
 *
 * In-process and bounded, the same trade-off rate-limit.ts documents: a restart
 * empties it and a second instance keeps its own copy, both of which cost at
 * most one extra model call. TTL exists so that re-tagged content eventually
 * changes the answer; MAX_ENTRIES so a flood of unique descriptions cannot grow
 * it without limit (oldest inserted is evicted first — Map preserves insertion
 * order, and a hit refreshes an entry's position).
 */
const KEYWORD_TTL_MS = 24 * 60 * 60 * 1000;
const KEYWORD_MAX_ENTRIES = 500;

const keywordCache = new Map<string, { at: number; keywords: string[] }>();

/** Same case, typed with different spacing/casing, is the same lookup. */
function keywordCacheKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

async function cachedKeywords(searchText: string): Promise<string[]> {
  const key = keywordCacheKey(searchText);
  const hit = keywordCache.get(key);
  if (hit && Date.now() - hit.at < KEYWORD_TTL_MS) {
    keywordCache.delete(key);
    keywordCache.set(key, hit); // refresh recency
    return hit.keywords;
  }
  if (hit) keywordCache.delete(key); // expired

  const keywords = await ai.suggestKeywords(searchText);

  // Never cache an empty result: that is what a failed/degraded round looks
  // like, and pinning it for a day would keep a user on the fallback catalog.
  if (keywords.length) {
    keywordCache.set(key, { at: Date.now(), keywords });
    while (keywordCache.size > KEYWORD_MAX_ENTRIES) {
      const oldest = keywordCache.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      keywordCache.delete(oldest);
    }
  }
  return keywords;
}

/** Test/maintenance helper: forget every cached suggestion. */
export function clearKeywordCache(): void {
  keywordCache.clear();
}

/**
 * Round 1 (or any round reached with only free text so far): ask the AI to
 * read the case description + any "غیر از این‌ها" refinements and suggest
 * short topic phrases in the site's own hashtag style, then match those, IN
 * CODE, against every real site tag. Falls back to the original top-level
 * pillar catalog when nothing scores above threshold (a very generic
 * description, or the stub/dev provider, which never suggests anything).
 */
async function nextRootCatalog(description: string, history: NarrowHistoryEntry[]): Promise<NarrowOption[]> {
  const searchText = [description, ...customAnswers(history)].join('\n');
  const suggestions = await cachedKeywords(searchText);
  const suggestedWords = new Set(suggestions.flatMap((s) => words(s)));

  const options = suggestedWords.size
    ? getTags()
      .map((t) => ({ t, score: tagMatchScore(t.fa, suggestedWords), wordCount: words(t.fa).length }))
      .filter((x) => x.score >= TAG_MATCH_THRESHOLD)
      // A full match (score 1.0) is common to several tags at once — e.g. a
      // case about implant-crown cementation fully matches both the broad
      // "ایمپلنت" (85 articles) and the specific "زینک فسفات" (1 article).
      // Break ties toward the MORE SPECIFIC tag (more words), then the
      // NICHER one (fewer articles) — the opposite of popularity — so a
      // precise niche match never gets buried under a broad, popular one.
      .sort((a, b) => b.score - a.score || b.wordCount - a.wordCount || a.t.contentCount - b.t.contentCount)
      .slice(0, MAX_TAG_OPTIONS)
      .map(({ t }) => ({ key: TAG_PREFIX + t.key, label: t.fa }))
    : [];

  return options.length ? options : getClusters().map((c) => ({ key: c.key, label: c.fa }));
}

/** A pillar was already picked (the tag-search fallback path): what its next
 * round may offer — its own subtopics, or null if it's already a leaf. */
function nextClusterCatalog(key: string): NarrowOption[] | null {
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

  if (key?.startsWith(TAG_PREFIX)) {
    const tag = tagByKey(key.slice(TAG_PREFIX.length));
    if (tag) { contentIds = tag.contentIds; matchedFa = tag.fa; }
  } else if (key) {
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

  const key = lastConcreteKey(history);
  // A tag is always a leaf — picking one resolves straight to its content,
  // there is no further narrowing under a single hashtag.
  if (key?.startsWith(TAG_PREFIX)) return resolve(userId, history);

  const catalog = key ? nextClusterCatalog(key) : await nextRootCatalog(description, history);
  if (!catalog) return resolve(userId, history);

  const result = await ai.narrowCase({ description, history, catalog });
  if (result.done) {
    // Never trust "done" on the ROOT round (no real pick made yet): there is
    // nothing for resolve() to resolve against (lastConcreteKey would still
    // be null -> empty result), and more importantly, a description
    // ambiguous enough to need a first question at all ("روکش بیمارم
    // میوفته" - an implant crown or a natural-tooth one?) must always get
    // one, never a silent guess-and-continue. Present the very catalog we
    // just computed as the question instead of trusting an overconfident
    // "done" this early. Once a real pick HAS been made (key is set), the
    // user has already answered at least one clarifying question, so a
    // model-decided "done" there is a real resolution, not a guess.
    if (!key) return { done: false, question: DEFAULT_QUESTION, options: catalog.slice(0, MAX_TAG_OPTIONS) };
    return resolve(userId, history);
  }
  return { done: false, question: result.question, options: result.options };
}
