import { config } from '../config.js';
import { getAliases, getClusters, getContentInfo, getTags, type Tag } from '../content-index.js';
import { ai } from '../providers/registry.js';
import type { NarrowHistoryEntry, NarrowOption } from '../providers/ai/types.js';
import { getConsumedContentIds } from './consumption.js';
import {
  hashDescription, recordRound, recordChoice, type OfferedOption,
} from './assistant-learning.js';

/**
 * «دستیار هوشمند» (premium). The AI has exactly ONE job here: read the free-text
 * description and understand what it MEANS — that «نسج» is «بافت», that "not
 * enough tissue for a crown" is the ferrule/crown-lengthening problem — and
 * translate that understanding into the site's OWN real hashtags. Everything
 * after that (hashtag -> articles) is ordinary search and belongs to code,
 * exactly like the site's own global-search.js, which answers instantly with no
 * model at all. The model never picks an article, never invents a hashtag,
 * never writes the question, never decides to stop, and never gives clinical
 * advice.
 *
 * That means a round that needs the model makes exactly ONE call:
 *
 *   description + refinements -> ai.selectTags(catalog = every real site tag)
 *     -> validated in code against the live index (anything else is dropped)
 *     -> dedupeByContentCoverage -> at most 4 options + a fixed question
 *     -> the user picks -> resolve() (plain search: hashtag -> articles)
 *
 * The predecessor asked the model twice — once to guess topic phrases blind,
 * once to pick 4 of 10 — and bridged the guesses to real tags with a purely
 * lexical word-overlap score. That is what put unrelated crown tags in front of
 * a «نبود فرول» case (no site tag and no alias contains the word «نسج» at all)
 * and what measured 15-53s to the first question. Showing the model the real
 * vocabulary is both the correctness fix and the latency fix.
 *
 * Two catalogs, in order:
 *  1. The site's REAL #hashtags (nextRootCatalog). Most tags are used on a
 *     single piece of content (~75% of site tags), so this reaches niche
 *     content no fixed category tree could, without cross-listing that content
 *     under every plausible pillar.
 *  2. The fixed pillar -> subtopic tree (nextClusterCatalog), the honest
 *     fallback for when the model finds nothing genuinely relevant (a very
 *     generic description, something off-topic, or the stub/dev provider,
 *     which never guesses on purpose) — asked with its OWN question text, so
 *     it never pretends to be a list of relevant matches.
 *
 * The level, the round cap and the stopping decision are all made HERE, in
 * plain code, from the user's own answer keys. Entirely stateless server-side:
 * the client resends the whole history each call.
 */

const ARTICLES_PER_MATCH = 4;
// The FINAL number of tag options ever shown to the user.
const MAX_TAG_OPTIONS = 4;
const TAG_PREFIX = 'tag:';
// The question is ours, not the model's: it is the same every round, so there
// is nothing for a model to get wrong or be steered into writing. Exported so
// a test asserts the real string rather than a retyped copy of it.
export const DEFAULT_QUESTION = 'کدام‌یک به شرایط بیمار نزدیک‌تر است؟';
// Shown INSTEAD of the above when the model found no genuinely relevant tag.
// A different sentence on purpose: the pillar list is a broad-area question,
// not a shortlist of matches, and offering it under the usual wording would
// claim a relevance nothing here has.
export const FALLBACK_QUESTION = 'از توضیحت به هشتگ مستقیمی نرسیدم؛ نزدیک‌ترین حیطه‌ی کلی کدام است؟';

export interface CaseArticle {
  content_id: string;
  title: string;
  url: string;
  type: string;
}

export type CaseStep =
  | { done: false; question: string; options: NarrowOption[]; round_id?: string | null }
  | { done: true; matched_fa: string | null; articles: CaseArticle[]; round_id?: string | null };

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
 * ("غیر از این‌ها" -> types something else) each get handed to the next tag
 * selection, instead of being dead ends. */
function customAnswers(history: NarrowHistoryEntry[]): string[] {
  return history.filter((h): h is NarrowHistoryEntry & { answer: { custom: string } } => 'custom' in h.answer)
    .map((h) => h.answer.custom);
}

// ZWNJ (half-space) + the two directional marks — invisible, but they split
// what should be one word into two tokens if left in. Written as escapes, not
// literal invisible characters, so they can't get silently stripped by an
// editor/formatter.
const ZERO_WIDTH = /[\u200c\u200e\u200f]/g;

/**
 * Orthographic variants of ONE word, folded together before tokenizing.
 *
 * A dentist writes "بیومیمتیک" one day and "بایومیمتیک" — or "بایو میمتیک"
 * with a space — the next, and so does a model asked to echo a label back. To
 * a plain string comparison those are three unrelated tokens, so a tag written
 * with the third spelling is simply not found. Handling it here rather than by
 * putting every spelling on every article keeps one tag per concept.
 *
 * Substitution is on the normalized STRING, not on tokens, because a spaced
 * spelling ("بایو میمتیک") is two tokens that must collapse into one. Longest
 * pattern first so a prefix cannot claim a longer match.
 *
 * The table is authored in dentcast-hashtag-reference.json and carried into
 * content-index.json by tools/build_plus_index.mjs, so it reloads with the
 * index rather than needing a code change per new spelling.
 */
let aliasCacheKey: unknown = null;
let aliasCache: Array<[string, string]> = [];

function aliases(): Array<[string, string]> {
  const table = getAliases();
  if (aliasCacheKey !== table) {
    aliasCache = Object.entries(table)
      // A pattern contained in its own replacement grows without bound
      // ("پروگنوز" -> "پروگنوز دندان"). tools/hashtag_ref.py rejects these when
      // it compiles the table; this is the same rule enforced at the point of
      // use, so a hand-edited content-index.json cannot reintroduce one.
      .filter(([variant, canonical]) => {
        const v = variant.split(' ');
        const c = canonical.split(' ');
        return !c.some((_x, i) => v.every((p, k) => c[i + k] === p));
      })
      .sort((a, b) => b[0].length - a[0].length);
    aliasCacheKey = table;
  }
  return aliasCache;
}

function normalizeFa(s: string): string {
  const base = s
    .replace(ZERO_WIDTH, ' ')
    .replace(/ك/g, 'ک')
    .replace(/ي/g, 'ی')
    .replace(/[#_]/g, ' ')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // One left-to-right pass over the tokens. Repeated string replacement cannot
  // be used: an alias whose replacement contains its own pattern ("پروگنوز" ->
  // "پروگنوز دندان") would rewrite its own output forever. Emitting past the
  // cursor terminates by construction, and matching whole token runs means an
  // alias replaces a complete word or a complete phrase - never cutting into a
  // word, which is what would maul "peri implantitis" or "اندوکراون".
  const toks = base.split(' ');
  const out: string[] = [];
  for (let i = 0; i < toks.length;) {
    let matched = 0;
    for (const [variant, canonical] of aliases()) { // longest pattern first
      const parts = variant.split(' ');
      if (parts.every((p, k) => toks[i + k] === p)) {
        out.push(...canonical.split(' '));
        matched = parts.length;
        break;
      }
    }
    if (matched) { i += matched; } else { out.push(toks[i]); i += 1; }
  }
  return out.join(' ');
}

// Common connector/filler words, dropped before a description is tokenized
// into the `searchWords` the learning tables record. A round logged under "و"
// or "یک" tells a later vocabulary-gap report nothing; real site tags are
// specialist phrases, never built from these, so dropping them costs nothing.
const STOPWORDS = new Set([
  'و', 'یا', 'با', 'بی', 'در', 'به', 'از', 'که', 'را', 'تا', 'برای', 'روی', 'یک', 'این', 'آن',
]);

function words(s: string): string[] {
  return normalizeFa(s).split(' ').filter((w) => w && !STOPWORDS.has(w));
}

/**
 * Fold every real site tag to its normalized form, so a label the model
 * returned survives an orthographic wobble (ي/ی, ك/ک, a ZWNJ where a space
 * belongs) but a label that names nothing real still does not. The tag's own
 * `key` is indexed too, since a model shown Persian labels occasionally
 * answers with the key form of one.
 *
 * `fa` wins on a collision: it is what the model was actually shown, and it is
 * the label the user will see. Cached against the exact `Tag[]` reference
 * getTags() returns — that reference only changes when content-index.ts
 * reloads the underlying file (a real redeploy, not per-request), so this
 * builds once per deploy, not once per assistant round.
 */
let lookupCacheKey: Tag[] | null = null;
let lookupCache: Map<string, Tag> | null = null;

function tagLookup(): Map<string, Tag> {
  const tags = getTags();
  if (lookupCacheKey === tags && lookupCache) return lookupCache;

  const map = new Map<string, Tag>();
  for (const t of tags) {
    const k = normalizeFa(t.key);
    if (k && !map.has(k)) map.set(k, t);
  }
  for (const t of tags) {
    const fa = normalizeFa(t.fa);
    if (fa) map.set(fa, t); // fa always wins over a key that folded the same way
  }

  lookupCacheKey = tags;
  lookupCache = map;
  return map;
}

/**
 * The safety net, unchanged in spirit: nothing the model said reaches a user
 * until it has been matched against a tag that really exists in the index.
 * Anything else is dropped silently — an invented hashtag simply is not an
 * option. The model's ORDER is kept (it sorted by relevance, which is the
 * whole thing we asked it for); duplicates collapse to the first mention.
 */
function validateTags(raw: string[]): Tag[] {
  const lookup = tagLookup();
  const seen = new Set<string>();
  const out: Tag[] = [];
  for (const s of raw) {
    const tag = lookup.get(normalizeFa(s));
    if (!tag || seen.has(tag.key)) continue;
    seen.add(tag.key);
    out.push(tag);
  }
  return out;
}

/**
 * Greedily keep only tags that bring at least one NEW content_id not already
 * covered by a higher-ranked tag. Necessary because most site tags are
 * single-article (each article gets its own bespoke AI-proposed hashtags at
 * publish time), so several near-duplicate tags ("سمان دائم", "گیر روکش", ...)
 * can all point at the SAME small handful of articles — and four options that
 * lead to one article are one option wearing four labels. Ranking is not this
 * function's job: the order it is handed is the model's own.
 */
function dedupeByContentCoverage(sorted: Tag[], limit: number): Tag[] {
  const covered = new Set<string>();
  const picked: Tag[] = [];
  for (const t of sorted) {
    if (picked.length >= limit) break;
    if (!t.contentIds.some((id) => !covered.has(id))) continue;
    for (const id of t.contentIds) covered.add(id);
    picked.push(t);
  }
  return picked;
}

/**
 * Tag-selection cache. The root round is one model call over the whole tag
 * catalog, and the cheapest possible round is the one that never makes it —
 * so an exact repeat of a description we have already understood is answered
 * from memory.
 *
 * It is safe to cache because the call is deterministic by construction:
 * temperature 0, no user identity in the input, and the result is only ever a
 * list of the site's own tag keys. Two users describing the same case should
 * reach the same tags.
 *
 * What is stored is the VALIDATED tag keys, not the model's raw strings: the
 * validation is pure and would produce the same answer anyway, and keeping
 * keys means a cache hit costs one Map lookup instead of re-folding text.
 *
 * In-process and bounded, the same trade-off rate-limit.ts documents: a restart
 * empties it and a second instance keeps its own copy, both of which cost at
 * most one extra model call. TTL exists so that re-tagged content eventually
 * changes the answer; MAX_ENTRIES so a flood of unique descriptions cannot grow
 * it without limit (oldest inserted is evicted first — Map preserves insertion
 * order, and a hit refreshes an entry's position).
 */
const TAG_SELECTION_TTL_MS = 24 * 60 * 60 * 1000;
const TAG_SELECTION_MAX_ENTRIES = 500;

const tagSelectionCache = new Map<string, { at: number; keys: string[] }>();

/** Same case, typed with different spacing/casing, is the same lookup. */
function tagSelectionCacheKey(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** The one model call, validated and memoised. Returns real tag keys, in the
 * order the model ranked them. */
async function cachedTagSelection(description: string, refinements: string[]): Promise<string[]> {
  const cacheKey = tagSelectionCacheKey([description, ...refinements].join('\n'));
  const hit = tagSelectionCache.get(cacheKey);
  if (hit && Date.now() - hit.at < TAG_SELECTION_TTL_MS) {
    tagSelectionCache.delete(cacheKey);
    tagSelectionCache.set(cacheKey, hit); // refresh recency
    return hit.keys;
  }
  if (hit) tagSelectionCache.delete(cacheKey); // expired

  // The model sees the site's real vocabulary and nothing else about it — just
  // the Persian labels, no counts and no definitions, which would multiply the
  // prompt for nothing.
  const picked = await ai.selectTags({
    description,
    refinements,
    catalog: getTags().map((t) => t.fa),
  });
  const keys = validateTags(picked).map((t) => t.key);

  // Never cache an empty result: that is what a failed/degraded round looks
  // like, and pinning it for a day would keep a user on the fallback catalog.
  if (keys.length) {
    tagSelectionCache.set(cacheKey, { at: Date.now(), keys });
    while (tagSelectionCache.size > TAG_SELECTION_MAX_ENTRIES) {
      const oldest = tagSelectionCache.keys().next().value as string | undefined;
      if (oldest === undefined) break;
      tagSelectionCache.delete(oldest);
    }
  }
  return keys;
}

/** Test/maintenance helper: forget every cached tag selection. */
export function clearTagSelectionCache(): void {
  tagSelectionCache.clear();
}

/**
 * Round 1 (or any round reached with only free text so far): the single model
 * call. It reads the description plus every "غیر از این‌ها" refinement, sees
 * the site's whole tag catalog, and returns the tags it understands the text
 * to be about; this module keeps only the ones that really exist and then
 * thins near-duplicates by content coverage.
 *
 * Returns null — not the pillar list — when nothing survives, so the caller
 * can say so honestly with its own question text.
 */
async function nextRootCatalog(description: string, history: NarrowHistoryEntry[]): Promise<NarrowOption[] | null> {
  const keys = await cachedTagSelection(description, customAnswers(history));
  const tags = keys.map(tagByKey).filter((t): t is Tag => Boolean(t));

  const options = dedupeByContentCoverage(tags, MAX_TAG_OPTIONS)
    .map((t) => ({ key: TAG_PREFIX + t.key, label: t.fa }));

  return options.length ? options : null;
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

  // Learning bookkeeping. The description itself is never stored — only the hash
  // that makes a repeat recognisable. The history's last entry IS the answer to
  // the round we showed previously, so the choice records itself here rather
  // than depending on the client to report it.
  const descHash = hashDescription(normalizeFa(description));
  const roundNo = history.length;
  const searchWords = [...new Set(words([description, ...customAnswers(history)].join('\n')))];
  if (roundNo > 0) {
    const last = history[history.length - 1].answer;
    await recordChoice({
      userId, descHash, roundNo: roundNo - 1,
      chosenKey: 'custom' in last ? null : last.key,
    }).catch(() => { /* learning must never break a round */ });
  }

  /** Log what we are about to show and hand the id back for click/feedback. */
  const logged = async (step: CaseStep): Promise<CaseStep> => {
    const offered: OfferedOption[] = step.done
      ? []
      : step.options.map((o, i) => ({ key: o.key, label: o.label, position: i + 1 }));
    const resolvedTag = step.done && lastConcreteKey(history)?.startsWith(TAG_PREFIX)
      ? lastConcreteKey(history)!.slice(TAG_PREFIX.length)
      : null;
    const roundId = await recordRound({
      userId, descHash, words: searchWords, roundNo, offered, resolvedTag,
    }).catch(() => null);
    return { ...step, round_id: roundId };
  };

  if (history.length >= config.assistant.maxRounds) return logged(await resolve(userId, history));

  const key = lastConcreteKey(history);
  // A tag is always a leaf — picking one resolves straight to its content,
  // there is no further narrowing under a single hashtag.
  if (key?.startsWith(TAG_PREFIX)) return logged(await resolve(userId, history));

  // A pillar was picked: show its own subtopics. Pure tree walking — a fixed
  // list and a fixed question, so this round costs no model call at all.
  if (key) {
    const catalog = nextClusterCatalog(key);
    if (!catalog) return logged(await resolve(userId, history)); // already a leaf
    return logged({ done: false, question: DEFAULT_QUESTION, options: catalog });
  }

  // The root round (or a round the user has only answered with free text).
  const options = await nextRootCatalog(description, history);
  if (options) return logged({ done: false, question: DEFAULT_QUESTION, options });

  // Nothing the model returned was a real site tag — say that, instead of
  // dressing the broad pillar list up as a shortlist of matches.
  return logged({
    done: false,
    question: FALLBACK_QUESTION,
    options: getClusters().map((c) => ({ key: c.key, label: c.fa })),
  });
}
