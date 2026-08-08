import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from './config.js';

/**
 * Server view of `plus/quota.json` — the free tier's allowance on every premium
 * feature. Versioned in the repo, NOT in the DB, and loaded/cached exactly the
 * way badges.ts and pathways.ts cache theirs (reload on file change, remote copy
 * wins, last-good on a read error).
 *
 * It is a file for a sharper reason than those two. A quota number is a PRICE:
 * three cards or five, one collection or two, is a question the funnel answers
 * and keeps re-answering, and the whole point of shipping a taste layer is to
 * watch what it does and move the number. Behind a migration, every one of those
 * moves is a schema change and an image build; here it is a commit to the site,
 * live within one content-refresh tick.
 *
 * NOTHING about a user lives here, and no counter is stored anywhere. Every
 * number a reader is measured against is DERIVED at read time from data the
 * product already keeps — review answers in `user_activity`, assistant runs in
 * `assistant_rounds`, boards in `collections` (see services/quota.ts). That is
 * the same doctrine the achievements wall is built on, and it buys the same two
 * things: the allowance can never disagree with the log it came from, and
 * lowering a limit tomorrow does not have to reconcile with counters written
 * under yesterday's.
 */

export type QuotaPeriod = 'day' | 'month' | 'total';

/** The three consumable allowances. A fourth would be a config edit + a call site. */
export type QuotaKey = 'review_cards' | 'assistant_runs' | 'collections';

export const QUOTA_KEYS: QuotaKey[] = ['review_cards', 'assistant_runs', 'collections'];

export interface QuotaRule {
  limit: number;
  period: QuotaPeriod;
  label_fa: string;
  exhausted_fa: string;
  remaining_fa: string;
}

export interface QuotaPreviews {
  /** Rows GET /highlights/library returns to a free reader. */
  highlight_library_rows: number;
  /** How many pathways, in catalog order, a free reader may open in full. */
  pathways_free_count: number;
  /** Whether a free reader gets the blind-spot map or only the headline percentages. */
  compass_blind_spots: boolean;
  /** Cabinet searches per device per day — enforced in the page, see the note below. */
  library_searches_per_day: number;
}

export interface QuotaCopy {
  highlight_library_fa: string;
  pathways_fa: string;
  compass_fa: string;
  library_fa: string;
}

export interface QuotaConfig {
  version: number;
  quotas: Record<QuotaKey, QuotaRule>;
  previews: QuotaPreviews;
  copy: QuotaCopy;
}

/**
 * The floor if the file cannot be read at all.
 *
 * Deliberately GENEROUS rather than zero. A config this module failed to load is
 * our fault, and the failure mode of a zero floor is that every free reader is
 * told they are out of allowance on a feature they have not touched — a product
 * that looks broken and dishonest at the same time. Erring high costs a few
 * cards; erring low costs the reader's trust in the number.
 */
const FALLBACK: QuotaConfig = {
  version: 0,
  quotas: {
    review_cards: {
      limit: 3,
      period: 'day',
      label_fa: 'کارت مرور',
      exhausted_fa: 'سقف رایگانِ امروز پر شده است.',
      remaining_fa: 'امروز {n} کارت رایگان مانده',
    },
    assistant_runs: {
      limit: 2,
      period: 'month',
      label_fa: 'کیس دستیار هوشمند',
      exhausted_fa: 'سقف رایگانِ این ماه پر شده است.',
      remaining_fa: 'این ماه {n} کیس رایگان مانده',
    },
    collections: {
      limit: 1,
      period: 'total',
      label_fa: 'کالکشن',
      exhausted_fa: 'کالکشنِ رایگانت ساخته شده است.',
      remaining_fa: '{n} کالکشن رایگان مانده',
    },
  },
  previews: {
    highlight_library_rows: 20,
    pathways_free_count: 1,
    compass_blind_spots: false,
    library_searches_per_day: 3,
  },
  copy: {
    highlight_library_fa: 'بخشی از دفترچه را می‌بینی؛ کل آن با پریمیوم.',
    pathways_fa: 'مسیر اول باز است؛ بقیه با پریمیوم.',
    compass_fa: 'درصد کلی را می‌بینی؛ نقشه‌ی کامل با پریمیوم.',
    library_fa: 'جستجوی رایگانِ امروز تمام شد؛ فهرست همچنان باز است.',
  },
};

let cached: QuotaConfig | null = null;
let cachedMtimeMs = 0;
/** Set by content-refresh.ts once a published copy has been fetched and validated. */
let remote: QuotaConfig | null = null;

function defaultPath(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // plus-api/src (or dist)
  return resolve(here, '..', '..', 'plus', 'quota.json');
}

/**
 * Adopt a freshly published config.
 *
 * The shape check is what stops a truncated file or an HTML error page from
 * becoming the site's pricing, and it is stricter than the badge one on purpose:
 * a badge that fails to parse goes dark, while a quota that parses wrong decides
 * what people can and cannot do. Every one of the three rules must be present
 * with a finite, non-negative integer limit and a period this module knows.
 *
 * A limit of 0 IS accepted — "this feature has no free tier" is a legitimate
 * editorial decision and the one number an operator might genuinely want to set
 * in a hurry. A missing or negative one is not.
 *
 * @returns true if the payload was adopted.
 */
function isValidQuota(raw: unknown): raw is QuotaConfig {
  if (!raw || typeof raw !== 'object') return false;
  const c = raw as QuotaConfig;
  if (!c.quotas || typeof c.quotas !== 'object') return false;
  if (!c.previews || typeof c.previews !== 'object') return false;

  const periods: QuotaPeriod[] = ['day', 'month', 'total'];
  for (const key of QUOTA_KEYS) {
    const rule = c.quotas[key];
    if (!rule || typeof rule !== 'object') return false;
    if (!Number.isInteger(rule.limit) || rule.limit < 0) return false;
    if (!periods.includes(rule.period)) return false;
    if (typeof rule.label_fa !== 'string' || typeof rule.exhausted_fa !== 'string') return false;
  }

  const p = c.previews;
  if (!Number.isInteger(p.highlight_library_rows) || p.highlight_library_rows < 0) return false;
  if (!Number.isInteger(p.pathways_free_count) || p.pathways_free_count < 0) return false;
  if (typeof p.compass_blind_spots !== 'boolean') return false;
  if (!Number.isInteger(p.library_searches_per_day) || p.library_searches_per_day < 0) return false;

  return true;
}

export function applyRemoteQuota(raw: unknown): boolean {
  if (!isValidQuota(raw)) return false;
  remote = raw;
  return true;
}

/** Which copy is being served — for the boot/refresh log and for tests. */
export function quotaSource(): string {
  return remote ? `published (v${remote.version})` : 'image/disk';
}

/** Test-only: forget the fetched copy so a case can start from the baked file. */
export function resetRemoteQuota(): void {
  remote = null;
}

export function getQuotaConfig(): QuotaConfig {
  if (remote) return remote;
  const path = config.quotaPath || defaultPath();
  try {
    const mtime = statSync(path).mtimeMs;
    if (cached && mtime === cachedMtimeMs) return cached;
    const parsed: unknown = JSON.parse(readFileSync(path, 'utf8'));
    // The same gate the remote copy passes. A hand-edited file with a typo must
    // not be able to do what a fetched one cannot.
    if (!isValidQuota(parsed)) throw new Error('quota.json failed its shape check');
    cached = parsed;
    cachedMtimeMs = mtime;
  } catch (err) {
    if (cached) return cached; // keep the last good copy on a transient read error
    // eslint-disable-next-line no-console
    console.warn(`[quota] could not load ${path} (${(err as Error).message}); using the built-in floor`);
    cached = FALLBACK;
  }
  return cached;
}

export function getQuotaRule(key: QuotaKey): QuotaRule {
  return getQuotaConfig().quotas[key] ?? FALLBACK.quotas[key];
}

export function getPreviews(): QuotaPreviews {
  return getQuotaConfig().previews ?? FALLBACK.previews;
}

export function getQuotaCopy(): QuotaCopy {
  return getQuotaConfig().copy ?? FALLBACK.copy;
}
