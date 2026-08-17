import { createHash } from 'node:crypto';

/**
 * ارزیاب DES — identity primitives. Pure functions, no DB, no I/O.
 *
 * Ported from the tested reference implementation, tools/des_library.py
 * (itself validated against the site's own 56 scored research sources before
 * any of this was written in TypeScript — see .dentcast/des-scorer-handoff.md
 * §4 for the measurements that set every threshold below). Keep the two in
 * sync if either changes; the Python tool remains the founder's own
 * command-line lookup and must keep agreeing with the API.
 *
 * WHAT THIS FILE IS FOR: turning a paper's citation into a small set of KEYS —
 * DOI, PMID, a folded-title hash — so that finding "have we scored this
 * before" is a dictionary hit, never a scan and never a comparison of the
 * paper's actual text. See services/des-library.ts for the DB-backed lookup
 * built on top of these.
 */

/**
 * Persian folding for KEY MATERIAL ONLY — never applied to text shown to a
 * reader. ZWNJ (U+200C) and bidi marks are not spaces; ی/ي and ک/ك are two
 * spellings of one letter. Same reasoning as plus/js/hl-view.js's foldFa.
 */
export function fold(input: unknown): string {
  let t = String(input ?? '');
  t = t.replace(/[‌‎‏]/g, '');
  t = t.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک');
  t = t.replace(/[ً-ْ]/g, ''); // harakat
  t = t.replace(/[.,;:!?()[\]{}"'«»،؛؟\-–—/\\]/g, ' ');
  return t.replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Key hash for a title. ALL whitespace is removed, not merely collapsed.
 *
 * `fold()` strips ZWNJ, so «نظام‌مند» becomes «نظاممند» while a reader who
 * typed a real space gives «نظام مند» — two different strings, so two
 * spellings of one title minted two keys and the same title never matched
 * itself. `foldFa` in hl-view.js has the identical shape and gets away with
 * it only because its search is a substring test; a KEY is an equality test
 * and cannot. Removing whitespace collapses all three spellings — ZWNJ,
 * space, joined — onto one key. Safe here because a paper title is a long
 * letter sequence: two different papers do not collide on it.
 */
export function keyHash(input: unknown): string {
  const s = fold(input).replace(/\s+/g, '');
  return createHash('sha1').update(s, 'utf8').digest('hex').slice(0, 10);
}

export interface CitationLike {
  doi?: string | null;
  pmid?: string | null;
  title?: string | null;
}

/**
 * Identity keys, strongest first: DOI, PMID, then a title hash — and the
 * title key is minted only when a title is present (RULE 1: ambiguity
 * declines; a title that cannot be trusted mints no key rather than a
 * guessed one).
 *
 * Author+year is deliberately NOT a key: two papers by one author in one
 * year is ordinary, so it may corroborate a title match but must never
 * decide one — see sameAuthor() below, used only inside nearDuplicates().
 */
export function keysFor(c: CitationLike): string[] {
  const out: string[] = [];
  const doi = (c.doi || '').trim().toLowerCase();
  const pmid = String(c.pmid || '').trim();
  const title = (c.title || '').trim();
  if (doi) out.push(`doi:${doi}`);
  if (pmid) out.push(`pmid:${pmid}`);
  if (title) out.push(`ttl:${keyHash(title)}`);
  return out;
}

/**
 * Content words of a title, stopwords out — a fallback for NEAR-DUPLICATE
 * matching, never a replacement for the exact key. Stopwords are roughly a
 * third of any title and shared by every paper, so leaving them in inflates
 * every comparison equally without separating anything.
 */
const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'in', 'on', 'for', 'to', 'and', 'or', 'with', 'by', 'from',
  'at', 'as', 'is', 'are', 'its', 'this', 'that', 'after', 'before', 'during',
  'between', 'vs', 'versus', 'study', 'studies',
]);

export function titleTokens(t: unknown): Set<string> {
  const words = fold(t).match(/[a-z]+/g) || [];
  return new Set(words.filter((w) => w.length > 2 && !STOPWORDS.has(w)));
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Word set of the FIRST author's name, initials dropped, order irrelevant.
 *
 * Taking "the last token" looked obvious and was wrong on the very first real
 * pair tested: a journal writes "Fan YY", a scoring model writes "Ying-Ying
 * Fan" — the last token is `yy` in one and `fan` in the other, so the SAME
 * paper failed its own author-agreement check. A word-set intersection makes
 * both sides contain `fan` however the name is printed.
 */
export function authorWords(authors: unknown): Set<string> {
  const first = String(authors ?? '').split(/[,;،]/)[0] || '';
  const words = fold(first).match(/[a-z]+/g) || [];
  return new Set(words.filter((w) => w.length > 2));
}

/**
 * A CORROBORATING signal inside an already-narrow near-duplicate candidate
 * list — never a key on its own. Two authors sharing a surname is a
 * tolerable false match here; a paper failing its own author check is not.
 */
export function sameAuthor(a: unknown, b: unknown): boolean {
  const wa = authorWords(a);
  const wb = authorWords(b);
  if (wa.size === 0 || wb.size === 0) return false;
  for (const x of wa) if (wb.has(x)) return true;
  return false;
}

/** Word count, for the free gate and the ABSTRACT_ONLY/FULL_TEXT guess. */
export function wordCount(t: unknown): number {
  return fold(paperScope(t)).split(' ').filter(Boolean).length;
}

/**
 * Truncate a submission at the point OTHER papers' identifiers begin.
 *
 * Not a heuristic window: these section headers announce themselves by name,
 * and everything after the name belongs to someone else's paper. Without
 * this, a copied PubMed page's "Similar articles" block supplies a
 * plausible-looking WRONG PMID for the paper actually being submitted (a
 * real failure this caught: the extracted PMID was a ~1997 article, the
 * extracted year was 2016).
 */
export function paperScope(t: unknown): string {
  const s = String(t ?? '');
  const m = s.match(
    /(^|\n)\s*(similar articles|cited by|references?|bibliography|related information|mesh terms|publication types|منابع|مراجع|فهرست منابع)\b/i,
  );
  return m ? s.slice(0, m.index) : s;
}

export function allDois(s: unknown): string[] {
  const out: string[] = [];
  const re = /10\.\d{4,9}\/[^\s"'<>,;)\]]+/g;
  let m: RegExpExecArray | null;
  const text = String(s ?? '');
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(text))) {
    const v = m[0].toLowerCase().replace(/[.,;]$/, '');
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

export function allPmids(s: unknown): string[] {
  const out: string[] = [];
  const re = /(?:pmid[:\s]*|pubmed\.ncbi\.nlm\.nih\.gov\/)([0-9]{6,9})/gi;
  let m: RegExpExecArray | null;
  const text = String(s ?? '');
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(text))) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/**
 * Identifier selection. The LINK FIELD WINS ALWAYS — the reader put it there
 * on purpose. Body text is consulted only when the field is empty, and only
 * when it names exactly ONE candidate (or exactly one sits in the paper's own
 * front matter, the first 900 characters of its scope). Several candidates
 * with no way to prefer one ⇒ none: RULE 1, ambiguity declines.
 */
export function pickIdentifier(fromLink: string[], fromBody: string[], head: string): string | null {
  if (fromLink.length === 1) return fromLink[0];
  if (fromLink.length > 1) return null;
  if (fromBody.length === 1) return fromBody[0];
  if (fromBody.length > 1) {
    const inHead = fromBody.filter((v) => head.includes(v));
    if (inHead.length === 1) return inHead[0];
    return null;
  }
  return null;
}

/** Lines a copied web page carries that are not the paper itself. */
const CHROME =
  /(skip to|main (page )?content|official website|\.gov\b|cookie|sign in|log ?in|create account|navigation|search|menu|javascript|browser|save\b|email\b|permalink|clipboard|share\b|cite\b|display options|full[- ]text links|similar articles|cited by|mesh terms|related information|figures?\b|copy download|actions\b|https?:\/\/|www\.)/i;

function looksLikeTitle(s: string): boolean {
  if (!s) return false;
  if (CHROME.test(s)) return false;
  if (/[.؛]$/.test(s)) return false; // a sentence, not a heading
  // must contain a letter, tested Unicode-aware — `\W` is ASCII-only in JS and
  // would reject every pure-Persian title ever written.
  if (!/\p{L}/u.test(s)) return false;
  // not a citation line: no real title carries an identifier or an author list
  if (/10\.\d{4}|pmid|doi\s*:/i.test(s)) return false;
  if (/et\s*al\.?|و همکاران/i.test(s)) return false;
  const words = s.split(/\s+/).filter(Boolean).length;
  return words >= 6 && words <= 35;
}

/**
 * Fallback title detection — used only when the reader supplied none.
 * Structure beats position: the title is the last real line ABOVE
 * "Abstract"/"چکیده", which survives a copied PubMed page far better than
 * "the first line" (whose title-page-dump failure — "Skip to main page
 * content" becoming every reader's title key — is the reason RULE 1 exists).
 */
export function findTitle(text: unknown): string | null {
  const lines = String(text ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  let at = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^(abstract|چکیده)\b[:：]?$/i.test(lines[i])) {
      at = i;
      break;
    }
  }
  if (at > 0) {
    for (let j = at - 1; j >= 0 && j >= at - 6; j -= 1) {
      if (looksLikeTitle(lines[j])) return lines[j];
    }
    return null;
  }
  for (let k = 0; k < Math.min(lines.length, 5); k += 1) {
    if (looksLikeTitle(lines[k])) return lines[k];
  }
  return null;
}

/**
 * Half AWAY FROM ZERO, per the DES spec (Step 5): a product of exactly .5
 * always rounds up. `Math.round` in JS already does this for positives, but
 * spelling it out keeps the rule visible and correct for the theoretical
 * negative case rather than relying on a language default nobody re-reads.
 */
export function roundHalfUp(x: number): number {
  return x >= 0 ? Math.floor(x + 0.5) : -Math.floor(-x + 0.5);
}

export const BAND_RANGES: Array<[string, number, number]> = [
  ['A', 80, 100],
  ['B', 60, 79],
  ['C', 40, 59],
  ['D', 20, 39],
  ['E', 0, 19],
];

export function bandFor(score: number): string | null {
  for (const [name, lo, hi] of BAND_RANGES) {
    if (score >= lo && score <= hi) return name;
  }
  return null;
}

/**
 * Five bilingual research-signal families. What separates a study from an
 * opinion is METHODOLOGICAL language, not topical vocabulary — "دندان" and
 * "روش" appear in a home-remedy post as readily as in a trial; `p = 0.014`,
 * `n = 42` and `Methods:` do not.
 *
 * Every family carries BOTH languages. An earlier gate had five Persian
 * families and folded all of English into one, so a fully English abstract
 * scored at most 1 of 6 and was rejected outright — most of the real input.
 * A language-shaped gate is not a gate, it is a filter on language.
 *
 * Match against the RAW text, never `fold()`ed — folding strips the
 * punctuation `p < 0.05` and `Methods:` depend on to be recognised at all.
 */
export const RESEARCH_SIGNALS: RegExp[] = [
  /randomi[sz]ed|controlled trial|clinical trial|cohort|case[-\s]?control|cross[-\s]?sectional|systematic review|meta[-\s]?analys|in vitro|in vivo|double[-\s]?blind|placebo|split[-\s]?mouth|کارآزمایی|مرور نظام|فراتحلیل|هم‌?گروهی|مورد[-\s]?شاهد|مقطعی|آزمایشگاهی|دوسوکور/i,
  /\bp\s*[<=>]\s*0?[.,]\d|\bp[-\s]?value|\bn\s*=\s*\d|95\s*%|confidence interval|standard deviation|\bSD\b|\bCI\b|statistically significan|معنادار|انحراف معیار|فاصله اطمینان|سطح معنی/i,
  /\d+\s*(patients?|subjects?|teeth|tooth|specimens?|samples?|participants?|cases|volunteers?)|[\d۰-۹]+\s*(بیمار|نمونه|دندان|شرکت‌کننده|مورد|داوطلب)/i,
  /\b(background|objectives?|aims?|materials?|methods?|results?|conclusions?|discussion)\s*[:：]|(زمینه|هدف|روش‌?ها|مواد و روش|نتایج|نتیجه‌?گیری|بحث|یافته‌?ها)\s*[:：]/i,
  /\b(mean|median|prevalence|incidence|odds ratio|risk ratio|hazard ratio|survival rate|follow[-\s]?up)\b|میانگین|میانه|شیوع|نسبت شانس|پیگیری/i,
];

export function hasResearchSignal(text: unknown): boolean {
  const t = String(text ?? '');
  return RESEARCH_SIGNALS.some((re) => re.test(t));
}
