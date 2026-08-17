import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { one, query, withTransaction, type Queryable } from '../db.js';
import { fold, keysFor, titleTokens, jaccard, sameAuthor, roundHalfUp, bandFor } from './des-identity.js';

/**
 * ارزیاب DES — the paper corpus. DB-backed identity lookup and the founder's
 * validation gate for a scored record.
 *
 * Deliberately NOT plus/des-scores.json (handoff RULE 3): that file is fetched
 * by plus/js/des.js on every article page load, keyed by content_id (a page
 * path — a reader's paper has no page), and written by the publishing
 * workflow under verify_publish.py's gate. This is a separate table with a
 * separate writer.
 *
 * ONE PAPER, MANY KEYS: des_paper_keys maps every identifier or title hash
 * ever seen onto a paper id, so an abstract and a full text of the same study
 * — or a typo'd resubmission — land on one record instead of forking it.
 */

/* ------------------------------------------------------- validation gate -- */

const TOOL_DOMAIN_COUNT: Record<string, number> = {
  RoB2: 5, 'ROBINS-I': 5, 'AMSTAR-2': 6, QUIN: 6, 'QUADAS-2': 4,
};

interface Domain { domain?: string; rating?: string; evidence_quote?: string; note?: string; }
interface Penalty { item?: string; base_points?: number; points?: number; note?: string; }
interface DesRecord {
  content_type?: string;
  s_design?: { value?: number };
  q_method?: { tool?: string; multiplier?: number; domains?: Domain[] };
  penalties?: Penalty[];
  des_score?: number;
  band?: string;
  text_basis?: string;
  provisional?: boolean;
  interpretation_fa?: string;
  [key: string]: unknown;
}

/**
 * Recompute the whole DES arithmetic and return every disagreement found, in
 * Persian, ready to show the founder. An empty array means the record is
 * arithmetically sound — it says nothing about whether the JUDGEMENTS
 * (which domain rated `high`, which quote was chosen) are right; that stays
 * the founder's call.
 *
 * Ported line-for-line from tools/des_library.py's validate(), the tested
 * reference. Keep the two in agreement.
 */
export function validateDesRecord(rec: DesRecord): string[] {
  const p: string[] = [];
  const ct = rec.content_type;
  if (ct !== 'RESEARCH') {
    if (ct === 'COMMENTARY' || ct === 'NOT_APPRAISABLE') return p;
    return [`content_type نامعتبر: ${JSON.stringify(ct)}`];
  }

  const sd = rec.s_design?.value;
  const qm = rec.q_method || {};
  const mult = qm.multiplier;
  if (!Number.isInteger(sd) || (sd as number) < 0 || (sd as number) > 100) {
    p.push(`s_design.value نامعتبر: ${JSON.stringify(sd)}`);
  }
  if (typeof mult !== 'number') {
    p.push(`multiplier نامعتبر: ${JSON.stringify(mult)}`);
  }
  if (p.length) return p;

  const design = sd as number;
  const m = mult as number;

  if (![0.3, 0.55, 0.8, 1.0].includes(m)) {
    p.push(`multiplier باید یکی از ۰٫۳۰/۰٫۵۵/۰٫۸۰/۱٫۰۰ باشد، نه ${m}`);
  }

  const tool = qm.tool || '';
  const doms = qm.domains || [];
  const expected = TOOL_DOMAIN_COUNT[tool];
  if (expected === undefined) {
    p.push(`ابزار نامعتبر: ${JSON.stringify(tool)}`);
  } else if (doms.length !== expected) {
    p.push(`${tool} باید دقیقاً ${expected} دامنه داشته باشد، ${doms.length} دارد`);
  }

  for (const d of doms) {
    if (!['low', 'some_concerns', 'high', 'NR'].includes(d.rating || '')) {
      p.push(`rating نامعتبر در «${d.domain}»: ${JSON.stringify(d.rating)}`);
    }
    if (!d.evidence_quote && !d.note) {
      p.push(`دامنه‌ی «${d.domain}» نه نقل‌قول دارد نه note`);
    }
  }

  // multiplier must follow from the counts (Step 3c), not from judgement
  const high = doms.filter((d) => d.rating === 'high').length;
  const conc = doms.filter((d) => d.rating === 'some_concerns' || d.rating === 'NR').length;
  let want: number;
  if (high >= 2) want = 0.3;
  else if (high === 1 || conc >= 3) want = 0.55;
  else if (conc >= 1) want = 0.8;
  else want = 1.0;
  if (m > want) {
    p.push(
      `ضریب با شمارش دامنه‌ها نمی‌خواند: ${high} high، ${conc} some_concerns → حداکثر ${want.toFixed(2)}، ولی ${m.toFixed(2)} آمده`,
    );
  }

  // every penalty row must be present, and each scaled per Step 4a
  const pens = rec.penalties || [];
  if (pens.length !== 4) {
    p.push(`باید هر چهار ردیف جریمه ذکر شوند (حتی وقتی صفرند)، ${pens.length} آمده`);
  }
  let total = 0;
  for (const pen of pens) {
    const bp = pen.base_points;
    const pts = pen.points;
    if (!Number.isInteger(bp) || !Number.isInteger(pts)) {
      p.push(`جریمه‌ی «${pen.item}» عدد صحیح نیست`);
      continue;
    }
    if (pts) {
      const wantPts = Math.max(1, roundHalfUp(((bp as number) * design) / 100));
      if (pts !== wantPts) {
        p.push(`جریمه‌ی «${pen.item}»: باید ${wantPts} باشد (max(1, ${bp}×${design}÷100))، ${pts} آمده`);
      }
    }
    if (pts === 0 && !pen.note) {
      p.push(`جریمه‌ی صفرِ «${pen.item}» باید note داشته باشد`);
    }
    total += pts as number;
  }

  const wantScore = Math.max(0, roundHalfUp(design * m) - total);
  if (rec.des_score !== wantScore) {
    p.push(`des_score باید ${wantScore} باشد (round_half_up(${design}×${m.toFixed(2)}) − ${total})، ${JSON.stringify(rec.des_score)} آمده`);
  }
  const wantBand = bandFor(wantScore);
  if (rec.band !== wantBand) {
    p.push(`band باید ${wantBand} باشد برای امتیاز ${wantScore}، ${JSON.stringify(rec.band)} آمده`);
  }

  if ((rec.text_basis === 'ABSTRACT_ONLY' || rec.text_basis === 'SECONDARY_REPORT') && !rec.provisional) {
    p.push(`${rec.text_basis} باید provisional=true باشد`);
  }
  if (rec.text_basis === 'FULL_TEXT' && rec.provisional) {
    p.push('FULL_TEXT نباید provisional باشد');
  }

  const interp = rec.interpretation_fa || '';
  if (interp.split(/\s+/).filter(Boolean).length > 60) {
    p.push(`interpretation_fa بیش از ۶۰ واژه است (${interp.split(/\s+/).filter(Boolean).length})`);
  }
  if ((interp.match(/[.!؟]/g) || []).length > 4) {
    p.push('interpretation_fa بیش از چهار جمله است');
  }
  return p;
}

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

// The four transparency rows, in the spec's own order. The store settled on
// Persian strings long ago (40+ records use exactly these); a scoring model
// (or a founder pasting one) handed the English table paraphrases it, so it
// is normalised here rather than trusted. base_points is a property of the
// ROW, never the paper.
const PENALTY_ROWS: Array<[number, string, RegExp]> = [
  [8, 'بیانیه‌ی تعارض منافع وجود ندارد', /conflict|interest|تعارض|منافع/i],
  [5, 'کارآزمایی به‌صورت پیش‌نگر ثبت نشده', /regist|prospectiv|ثبت|پیش‌?نگر/i],
  [5, 'توجیه حجم نمونه یا آنالیز توان وجود ندارد', /sample|size|power|نمونه|توان/i],
  [3, 'دوره‌ی پیگیری کوتاه‌تر از آنچه پیامد لازم دارد', /follow|پیگیری/i],
];

/**
 * Fix conventions the DES spec does not state but the store has settled on.
 * Returns the record (mutated in place) plus a human-readable log of what
 * changed. Judgement — which domain rated what, which quote was chosen — is
 * never touched.
 */
export function normaliseDesRecord(rec: DesRecord): { rec: DesRecord; changed: string[] } {
  const changed: string[] = [];

  for (const key of ['fact_fa', 'interpretation_fa'] as const) {
    const v = rec[key] as string | undefined;
    if (v && /[0-9]/.test(v)) {
      rec[key] = v.replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
      changed.push(`${key}: ارقام لاتین → فارسی`);
    }
  }

  for (const pen of rec.penalties || []) {
    const item = String(pen.item || '');
    for (const [bp, faName, pat] of PENALTY_ROWS) {
      if (pen.base_points === bp && pat.test(item)) {
        if (item !== faName) {
          pen.item = faName;
          changed.push(`جریمه: «${item.slice(0, 34)}» → «${faName}»`);
        }
        break;
      }
    }
  }

  return { rec, changed };
}

/* -------------------------------------------------------------- hashtags -- */

let hashtagCache: Set<string> | null = null;
let hashtagMtime = 0;

function hashtagRefPath(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // plus-api/src/services (or dist)
  return resolve(here, '..', '..', '..', 'dentcast-hashtag-reference.json');
}

/**
 * Every canonical tag string, reloaded when the reference file's mtime
 * changes — the same pattern content-index.ts uses for the taxonomy.
 */
function legalHashtags(): Set<string> {
  const path = hashtagRefPath();
  try {
    const mtime = statSync(path).mtimeMs;
    if (hashtagCache && mtime === hashtagMtime) return hashtagCache;
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as { concepts?: Array<{ tag: string }> };
    hashtagCache = new Set((parsed.concepts || []).map((c) => c.tag));
    hashtagMtime = mtime;
  } catch {
    if (hashtagCache) return hashtagCache;
    hashtagCache = new Set();
  }
  return hashtagCache;
}

/**
 * Resolve proposed hashtags to the canonical set. Anything that does not
 * resolve is DROPPED, never stored — a submission never mints a new concept
 * and never stores an alias as if it were the canonical tag (handoff §5.3).
 */
export function resolveHashtags(proposed: string[]): string[] {
  const legal = legalHashtags();
  const out: string[] = [];
  for (const t of proposed) {
    const tag = String(t || '').trim();
    if (tag && legal.has(tag) && !out.includes(tag)) out.push(tag);
  }
  return out;
}

/* --------------------------------------------------------------- lookup -- */

export interface LookupHit {
  paperId: string;
  via: 'doi' | 'pmid' | 'title';
  des: unknown;
  hashtags: string[];
}

interface PaperRow {
  id: string;
  doi: string | null;
  pmid: string | null;
  title: string;
  first_author: string | null;
  year: number | null;
  hashtags: string[];
  des: unknown;
}

/** Exact lookup, strongest key first. Never scans, never compares text. */
export async function lookupExact(
  c: { doi?: string | null; pmid?: string | null; title?: string | null },
  client?: Queryable,
): Promise<LookupHit | null> {
  const keys = keysFor(c);
  for (const key of keys) {
    const row = await one<{ paper_id: string }>(
      'select paper_id from des_paper_keys where key = $1',
      [key],
      client,
    );
    if (row) {
      const paper = await one<PaperRow>('select * from des_papers where id = $1', [row.paper_id], client);
      if (paper) {
        const via = key.startsWith('doi:') ? 'doi' : key.startsWith('pmid:') ? 'pmid' : 'title';
        return { paperId: paper.id, via, des: paper.des, hashtags: paper.hashtags };
      }
    }
  }
  return null;
}

export interface Candidate {
  paperId: string;
  score: number;
  title: string;
  authors: string;
  year: number | null;
  doi: string | null;
  authorAgrees: boolean | null;
}

/**
 * Near-duplicate titles, ranked. Token-set Jaccard, measured on the site's own
 * 54 unique research titles (see des-identity.ts's STOPWORDS comment and the
 * handoff §4/§10): 0.55 is the cut, far below the 0.90 that would catch
 * almost nothing beyond word reordering, because no threshold alone can
 * separate a typo (0.82) from a genuinely different paper (worst real false
 * positive: 0.86). Author agreement is the corroborating signal, not the key.
 *
 * Scans des_papers directly — acceptable at this corpus's size (a founder's
 * manually-scored library, not the site's 2000+ paper cabinet); revisit if it
 * ever needs to.
 */
const FUZZY_MIN = 0.55;

export async function nearDuplicates(
  title: string,
  author?: string,
  client?: Queryable,
): Promise<Candidate[]> {
  const q = titleTokens(title);
  if (q.size < 3) return [];
  const rows = (await query<PaperRow>('select * from des_papers', [], client)).rows;
  const out: Candidate[] = [];
  for (const row of rows) {
    const score = jaccard(q, titleTokens(row.title));
    if (score >= FUZZY_MIN) {
      out.push({
        paperId: row.id,
        score,
        title: row.title,
        authors: row.first_author || '',
        year: row.year,
        doi: row.doi,
        authorAgrees: author ? sameAuthor(row.first_author || '', author) : null,
      });
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out;
}

/** Attach a submission's keys to an EXISTING paper — never touches its score. */
export async function attachKeys(paperId: string, keys: string[], client?: Queryable): Promise<void> {
  for (const key of keys) {
    await query(
      'insert into des_paper_keys (key, paper_id) values ($1, $2) on conflict (key) do nothing',
      [key, paperId],
      client,
    );
  }
}

export interface CreatePaperInput {
  doi: string | null;
  pmid: string | null;
  title: string;
  firstAuthor: string | null;
  year: number | null;
  hashtags: string[];
  des: unknown;
  specVersion: string;
}

/** Create a brand-new paper and attach its own keys, in one transaction. */
export async function createPaper(input: CreatePaperInput): Promise<string> {
  return withTransaction(async (client) => {
    const row = (await one<{ id: string }>(
      `insert into des_papers (doi, pmid, title, first_author, year, hashtags, des, spec_version)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning id`,
      [
        input.doi, input.pmid, input.title, input.firstAuthor, input.year,
        input.hashtags, JSON.stringify(input.des), input.specVersion,
      ],
      client,
    ))!;
    await attachKeys(row.id, keysFor({ doi: input.doi, pmid: input.pmid, title: input.title }), client);
    return row.id;
  });
}

/** fold() re-exported for callers that only need normalisation, not a key. */
export { fold };
