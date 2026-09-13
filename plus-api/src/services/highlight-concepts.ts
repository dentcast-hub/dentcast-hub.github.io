import { pool, query, type Queryable } from '../db.js';
import { getIndex, getContentInfo, folderOf, folderLabel, type Tag } from '../content-index.js';
import { getGlossaryTerms, getGlossaryTerm, type GlossaryTerm } from '../glossary.js';
import { foldName, conceptDomain, conceptNames } from '../hashtag-ref.js';

/**
 * «نمای موضوعی هایلایت‌ها» — the reader's own highlights, aggregated by
 * CONCEPT across every article they appear in. The spec's "thematic retrieval
 * views" (§1, Premium: «all my highlights about resin cements, aggregated
 * across every article they appear in, derived from the tag/cluster
 * taxonomy»), the second premium addition chosen from the 2026-09-13 review.
 *
 * Nothing is stored and nobody tags anything. A highlight sits on a page, the
 * page carries the site's own #hashtags (content-index.json `tags`, assigned
 * by the founder at publish), and each hashtag is a concept in the hashtag
 * reference. So «which concepts do my highlights reach» is a join the data
 * already contains — the same move the compass makes with pillars, one level
 * finer. The reader's own text is never re-interpreted; what premium buys is
 * the ARRANGEMENT over data that stays theirs on every plan (the library's
 * own boundary).
 *
 * Two signals, kept apart and both reported (`match`):
 *   · `tag`  — the highlight is on a page that CARRIES the concept's hashtag.
 *              The page is about it; the highlight may or may not name it.
 *   · `text` — the highlight's own words contain one of the concept's names
 *              (its key, the reference's aliases/variants, a glossary term's
 *              synonyms). Found even on a page that was never tagged with it.
 * `both` when the two agree. Neither alone is the truth: a page tagged
 * «سمان رزینی» has highlights about its introduction too, and a sentence that
 * mentions cement on an occlusion page is still a note about cement.
 *
 * The glossary is joined BY NAME (glossary.json carries no hashtags): a term's
 * fa_title, title and synonyms are folded with the same rule as the tag keys
 * and the reference's aliases (hashtag-ref.ts foldName — «سمان_رزینی»,
 * «سمان رزینی» and «سمان‌رزینی» are one name), plus the «های» plural stripped,
 * so «سمان‌های رزینی» finds «سمان رزینی». 73 of 109 terms resolve this way
 * at the time of writing; the rest are narrow sub-terms («سمان رزینی
 * لایت‌کیور») that the text signal still serves.
 *
 * Brand and web-domain tags («اینسایت», «نوت_کست», «دنتکست») are not
 * concepts and are excluded — a "your highlights about اینسایت" view is the
 * folder filter wearing a concept's clothes.
 */

// The same column list routes/highlights.ts selects, so a card here is the
// same object the library and the boards draw (hl-view.js vocabulary).
const SELECT_COLS = `id, content_id, exact, prefix, suffix, color, underline,
  cloze_markers, note, label, content_hash, created_at, updated_at`;

export interface HighlightRow {
  id: string;
  content_id: string;
  exact: string;
  prefix: string | null;
  suffix: string | null;
  color: string | null;
  underline: boolean;
  cloze_markers: unknown;
  note: string | null;
  label: string | null;
  content_hash: string | null;
  created_at: string;
  updated_at: string;
}

export type Match = 'tag' | 'text' | 'both';
export interface MatchedHighlight extends HighlightRow { match: Match }

export interface ConceptGlossaryLink { slug: string; url: string; fa_title: string }

export interface ConceptSummary {
  key: string;
  fa: string;
  /** The reader's highlights that reach this concept (tag OR text). */
  highlights: number;
  /** Distinct articles those highlights sit on. */
  articles: number;
  /** How many pages on the whole site carry the tag — the concept's size. */
  pages_total: number;
  glossary: ConceptGlossaryLink | null;
}

export interface ConceptArticle {
  content_id: string;
  title: string;
  url: string;
  type: string;
  folder: string;
  folder_fa: string;
  last_highlight_at: string;
  count: number;
  highlights: MatchedHighlight[];
}

export interface ConceptView {
  concept: { key: string; fa: string; pages_total: number; glossary: ConceptGlossaryLink | null };
  total: number;
  article_count: number;
  articles: ConceptArticle[];
}

export interface GlossaryNotes {
  term: { slug: string; fa_title: string; url: string };
  /** The concepts the term resolved to (tag keys), for the «همه‌ی هایلایت‌های این مفهوم» link. */
  concepts: { key: string; fa: string }[];
  total: number;
  article_count: number;
  articles: ConceptArticle[];
}

const EXCLUDED_DOMAINS = new Set(['brand', 'web']);
const MIN_NAME_LEN = 3;

// ---------------------------------------------------------------- catalog ---

interface Catalog {
  /** content_id → the tag keys the page carries (concept tags only). */
  tagsByContent: Map<string, string[]>;
  /** folded name → tag (key, its own aliases through the reference). */
  tagByFolded: Map<string, Tag>;
  /** tag key → the glossary term it names, if one does. */
  glossaryByTag: Map<string, GlossaryTerm>;
  /** glossary slug → the tag keys the term resolves to. */
  tagsByGlossary: Map<string, string[]>;
}

let catalogFor: object | null = null;
let catalogTerms: object | null = null;
let catalog: Catalog | null = null;

/** «سمان‌های رزینی» → also «سمان رزینی»: the one plural the glossary titles use. */
function nameForms(name: string): string[] {
  const f = foldName(name);
  const out = new Set<string>([f]);
  const singular = foldName(name.replace(/(‌|\s)های?\b/g, ' '));
  if (singular && singular !== f) out.add(singular);
  return [...out].filter((n) => n.length >= MIN_NAME_LEN);
}

/**
 * Built once per content-index version (and per glossary file), so a request
 * never re-walks 878 tags. The identity of getIndex()'s object is the version
 * key: content-refresh.ts swaps it wholesale when a publish lands.
 */
function getCatalog(): Catalog {
  const idx = getIndex();
  const terms = getGlossaryTerms();
  if (catalog && catalogFor === idx && catalogTerms === terms) return catalog;

  const tagsByContent = new Map<string, string[]>();
  const tagByFolded = new Map<string, Tag>();
  for (const t of idx.tags || []) {
    const domain = conceptDomain(t.key);
    if (domain && EXCLUDED_DOMAINS.has(domain)) continue;
    tagByFolded.set(foldName(t.key), t);
    for (const n of conceptNames(t.key)) if (!tagByFolded.has(n)) tagByFolded.set(n, t);
    for (const cid of t.contentIds) {
      let list = tagsByContent.get(cid);
      if (!list) { list = []; tagsByContent.set(cid, list); }
      list.push(t.key);
    }
  }

  const glossaryByTag = new Map<string, GlossaryTerm>();
  const tagsByGlossary = new Map<string, string[]>();
  for (const term of terms) {
    const keys = new Set<string>();
    for (const n of [term.fa_title, term.title, ...(term.synonyms || [])]) {
      if (typeof n !== 'string') continue;
      for (const f of nameForms(n)) {
        const t = tagByFolded.get(f);
        if (t) keys.add(t.key);
      }
    }
    if (!keys.size) continue;
    tagsByGlossary.set(term.slug, [...keys]);
    for (const k of keys) {
      // The first term whose OWN title names the tag wins; a synonym-only
      // match never displaces it («سمان رزینی» belongs to resin-cements even
      // though a narrower term lists it as a synonym too).
      const cur = glossaryByTag.get(k);
      const titled = nameForms(term.fa_title).includes(foldName(k));
      if (!cur || (titled && !nameForms(cur.fa_title).includes(foldName(k)))) glossaryByTag.set(k, term);
    }
  }

  catalog = { tagsByContent, tagByFolded, glossaryByTag, tagsByGlossary };
  catalogFor = idx;
  catalogTerms = terms;
  return catalog;
}

/** Test-only: forget the derived catalog so a case can rebuild it. */
export function resetConceptCatalog(): void {
  catalog = null;
}

function glossaryLink(tagKey: string): ConceptGlossaryLink | null {
  const t = getCatalog().glossaryByTag.get(tagKey);
  return t ? { slug: t.slug, url: t.url, fa_title: t.fa_title } : null;
}

function tagFor(name: string): Tag | null {
  return getCatalog().tagByFolded.get(foldName(name)) ?? null;
}

// ------------------------------------------------------------- the reader ---

async function highlightsOf(userId: string, db: Queryable): Promise<HighlightRow[]> {
  const res = await query<HighlightRow>(
    `select ${SELECT_COLS} from highlights where user_id = $1 order by created_at asc`,
    [userId],
    db,
  );
  return res.rows;
}

function textMatches(h: HighlightRow, names: string[]): boolean {
  if (!names.length) return false;
  const hay = foldName(h.exact) + ' ' + foldName(h.note || '');
  return names.some((n) => hay.includes(n));
}

/** Group matched highlights by article, most recently highlighted article first. */
function groupByArticle(rows: MatchedHighlight[]): ConceptArticle[] {
  const groups = new Map<string, { latest: string; highlights: MatchedHighlight[] }>();
  for (const h of rows) {
    let g = groups.get(h.content_id);
    if (!g) { g = { latest: h.created_at, highlights: [] }; groups.set(h.content_id, g); }
    g.highlights.push(h);
    if (h.created_at > g.latest) g.latest = h.created_at;
  }
  return [...groups.entries()]
    .sort((a, b) => (a[1].latest < b[1].latest ? 1 : a[1].latest > b[1].latest ? -1 : 0))
    .map(([contentId, g]) => {
      const info = getContentInfo(contentId);
      const folder = folderOf(contentId);
      return {
        content_id: contentId,
        title: info?.title ?? contentId,
        url: info?.url ?? `/${contentId}.html`,
        type: info?.type ?? folder,
        folder,
        folder_fa: folderLabel(folder),
        last_highlight_at: g.latest,
        count: g.highlights.length,
        highlights: g.highlights,
      };
    });
}

/**
 * Every concept the reader's highlights reach, most highlighted first. The
 * text signal is included here too (a highlight naming «سمان رزینی» on an
 * untagged page counts), but it is only tried for concepts the reader's PAGES
 * already point at — scanning 878 name lists against every highlight on
 * every call would be the wrong kind of thorough, and a concept none of your
 * pages carries is, for the list, not yours yet.
 */
export async function conceptsFor(userId: string, db: Queryable = pool): Promise<{
  concepts: ConceptSummary[]; total_highlights: number; reached_highlights: number;
}> {
  const rows = await highlightsOf(userId, db);
  const cat = getCatalog();
  const idx = getIndex();
  const tagByKey = new Map((idx.tags || []).map((t) => [t.key, t]));

  // Candidate concepts: every tag on a page the reader highlighted.
  const candidates = new Set<string>();
  for (const h of rows) for (const k of cat.tagsByContent.get(h.content_id) || []) candidates.add(k);

  const reached = new Set<string>();
  const out: ConceptSummary[] = [];
  for (const key of candidates) {
    const tag = tagByKey.get(key);
    if (!tag) continue;
    const pages = new Set(tag.contentIds);
    const names = conceptNames(key);
    const hits = rows.filter((h) => pages.has(h.content_id) || textMatches(h, names));
    if (!hits.length) continue;
    for (const h of hits) reached.add(h.id);
    out.push({
      key,
      fa: tag.fa || key,
      highlights: hits.length,
      articles: new Set(hits.map((h) => h.content_id)).size,
      pages_total: tag.contentCount,
      glossary: glossaryLink(key),
    });
  }
  out.sort((a, b) => b.highlights - a.highlights || b.articles - a.articles || a.fa.localeCompare(b.fa, 'fa'));
  return { concepts: out, total_highlights: rows.length, reached_highlights: reached.size };
}

/** One concept, every highlight that reaches it, grouped by article — or null for an unknown/excluded tag. */
export async function conceptHighlights(userId: string, name: string, db: Queryable = pool): Promise<ConceptView | null> {
  const tag = tagFor(name);
  if (!tag) return null;
  const rows = await highlightsOf(userId, db);
  const pages = new Set(tag.contentIds);
  const names = conceptNames(tag.key);
  const matched: MatchedHighlight[] = [];
  for (const h of rows) {
    const byTag = pages.has(h.content_id);
    const byText = textMatches(h, names);
    if (!byTag && !byText) continue;
    matched.push({ ...h, match: byTag && byText ? 'both' : byTag ? 'tag' : 'text' });
  }
  const articles = groupByArticle(matched);
  return {
    concept: { key: tag.key, fa: tag.fa || tag.key, pages_total: tag.contentCount, glossary: glossaryLink(tag.key) },
    total: matched.length,
    article_count: articles.length,
    articles,
  };
}

/**
 * A glossary term's «یادداشت‌های خودت»: highlights on pages tagged with any
 * concept the term names, plus highlights whose text contains the term or a
 * synonym — so a narrow term with no tag of its own («سمان رزینی لایت‌کیور»)
 * still answers from the text. Null only for an unknown slug; a known term
 * with nothing to show returns total 0, and the page decides not to draw it.
 */
export async function glossaryNotes(userId: string, slug: string, db: Queryable = pool): Promise<GlossaryNotes | null> {
  const term = getGlossaryTerm(slug);
  if (!term) return null;
  const cat = getCatalog();
  const idx = getIndex();
  const tagByKey = new Map((idx.tags || []).map((t) => [t.key, t]));
  const keys = cat.tagsByGlossary.get(slug) || [];

  const pages = new Set<string>();
  const names = new Set<string>();
  for (const k of keys) {
    for (const cid of tagByKey.get(k)?.contentIds || []) pages.add(cid);
    for (const n of conceptNames(k)) names.add(n);
  }
  for (const n of [term.fa_title, term.title, ...(term.synonyms || [])]) {
    if (typeof n === 'string') for (const f of nameForms(n)) names.add(f);
  }
  const nameList = [...names];

  const rows = await highlightsOf(userId, db);
  const matched: MatchedHighlight[] = [];
  for (const h of rows) {
    const byTag = pages.has(h.content_id);
    const byText = textMatches(h, nameList);
    if (!byTag && !byText) continue;
    matched.push({ ...h, match: byTag && byText ? 'both' : byTag ? 'tag' : 'text' });
  }
  const articles = groupByArticle(matched);
  return {
    term: { slug: term.slug, fa_title: term.fa_title, url: term.url },
    concepts: keys.map((k) => ({ key: k, fa: tagByKey.get(k)?.fa || k })),
    total: matched.length,
    article_count: articles.length,
    articles,
  };
}
