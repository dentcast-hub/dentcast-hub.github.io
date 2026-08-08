import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from './config.js';

/**
 * Server view of `plus/badges.json` — the achievement catalog behind the
 * profile's «افتخارات» section. Versioned in the repo, NOT in the DB, and
 * loaded/cached exactly the way pathways.ts caches the pathway definitions
 * (reload on file change, remote copy wins, last-good on a read error).
 *
 * The reason it is a file and not a table is the same reason pathways.json is:
 * a badge's thresholds and its Persian copy are editorial decisions that get
 * retuned far more often than the code around them, and every retune through a
 * migration would be a deploy. Here it is a commit to the site.
 *
 * NOTHING about a user lives here. No badge is written down at the moment it is
 * earned: achievements.ts derives every one of them from data the product
 * already keeps, which is what makes the whole section retroactive — the day it
 * ships, existing readers open it and find their history already lit, with no
 * backfill to run and no "earned_at" column that could disagree with the log it
 * was derived from.
 */

export type MetalTier = 'bronze' | 'silver' | 'gold';
export type Visibility = 'always' | 'mystery' | 'earned_only';

export interface BadgeLevel {
  tier: MetalTier;
  /** A number, or the literal 'all' — resolved against a live total (see resolveThreshold). */
  threshold: number | 'all';
  unlock_fa: string;
  /** Rare: a level that measures something different from its badge (treasury's bronze). */
  metric?: string;
  /**
   * Reaching this level mints a one-time subscription discount of this many
   * percent (services/discount-credits.ts). Silver and gold levels carry it;
   * bronzes and one-shot badges deliberately never do.
   */
  discount_percent?: number;
}

export interface Badge {
  key: string;
  title_fa: string;
  icon: string;
  group: string;
  premium: boolean;
  leveled: boolean;
  visibility: Visibility;
  metric: string;
  threshold?: number;
  unit_fa?: string;
  locked_fa: string | null;
  unlock_fa?: string;
  detail_fa: string;
  levels?: BadgeLevel[];
}

export interface Medal {
  key: string;
  title_fa: string;
  metal_fa: string;
  rank: number;
  metric: string;
  locked_fa: string;
  unlock_fa: string;
  detail_fa: string;
}

export interface BadgeGroup { key: string; title_fa: string; }

export interface BadgeCatalog {
  version: number;
  groups: BadgeGroup[];
  medals: { items: Medal[] };
  badges: Badge[];
}

const EMPTY: BadgeCatalog = { version: 0, groups: [], medals: { items: [] }, badges: [] };

let cached: BadgeCatalog | null = null;
let cachedMtimeMs = 0;
/** Set by content-refresh.ts once a published copy has been fetched and validated. */
let remote: BadgeCatalog | null = null;

function defaultPath(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // plus-api/src (or dist)
  return resolve(here, '..', '..', 'plus', 'badges.json');
}

/**
 * Adopt a freshly published catalog.
 *
 * A catalog with no badges is refused for the same reason applyRemotePathways
 * refuses an empty array: it passes every structural check while emptying the
 * whole section, and editing a badge never produces one. Shipping zero badges
 * would be a deploy-time decision, so it stays a deploy-time action.
 *
 * The shape check is deliberately shallow — enough to be sure the payload is
 * this file and not someone else's JSON, not a schema validator. A badge with a
 * metric nobody computes simply reads as value 0 (see achievements.ts), which
 * is a badge that never lights rather than a route that 500s.
 *
 * @returns true if the payload was adopted.
 */
export function applyRemoteBadges(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const c = raw as BadgeCatalog;
  if (!Array.isArray(c.badges) || c.badges.length === 0) return false;
  if (!c.medals || !Array.isArray(c.medals.items)) return false;
  const ok = c.badges.every((b) => b && typeof b === 'object'
    && typeof b.key === 'string' && typeof b.title_fa === 'string'
    && typeof b.metric === 'string');
  if (!ok) return false;
  remote = c;
  return true;
}

/** Which copy is being served — for the boot/refresh log and for tests. */
export function badgesSource(): string {
  return remote ? `published (${remote.badges.length} badge(s))` : 'image/disk';
}

/** Test-only: forget the fetched copy so a case can start from the baked file. */
export function resetRemoteBadges(): void {
  remote = null;
}

export function getBadgeCatalog(): BadgeCatalog {
  if (remote) return remote;
  const path = config.badgesPath || defaultPath();
  try {
    const mtime = statSync(path).mtimeMs;
    if (cached && mtime === cachedMtimeMs) return cached;
    cached = JSON.parse(readFileSync(path, 'utf8')) as BadgeCatalog;
    cachedMtimeMs = mtime;
  } catch (err) {
    if (cached) return cached; // keep the last good copy on a transient read error
    // eslint-disable-next-line no-console
    console.warn(`[badges] could not load ${path}; the achievements section will be empty`);
    cached = EMPTY;
  }
  return cached;
}

/**
 * A level's threshold as a number. 'all' means "every one there is" and is
 * resolved against a live total supplied by the caller (today: the number of
 * published pathways). Written as a keyword rather than a number on purpose —
 * a hardcoded 15 would silently un-earn the gold of everyone who had completed
 * every pathway the moment a sixteenth was published.
 */
export function resolveThreshold(
  level: BadgeLevel,
  metric: string,
  totals: Record<string, number>,
): number {
  if (typeof level.threshold === 'number') return level.threshold;
  // Unknown total -> unreachable rather than instantly earned. A badge that
  // stays dark is a missing total; a badge that lights for everyone is a lie.
  return totals[metric] ?? Number.MAX_SAFE_INTEGER;
}

export const METALS: MetalTier[] = ['bronze', 'silver', 'gold'];

export interface EvaluatedBadge {
  earned: boolean;
  /** -1 = not earned. 0..2 = bronze..gold. 0 for an earned one-shot badge. */
  level: number;
  metal: MetalTier | 'plain' | null;
  value: number;
  /** The next number being counted toward, or null once nothing is left. */
  target: number | null;
  /** 0..1 toward `target`, measured from the level already held. */
  ratio: number;
  thresholds: number[];
}

/**
 * Where a value puts a reader on one badge.
 *
 * ONE comparison, for every badge in the catalog: `value >= threshold`. Metrics
 * that are naturally inverted are normalised to a 0/1 before they get here (see
 * `founder_seat` in services/achievements.ts) rather than teaching this function
 * a second direction — with two comparisons, every future badge would carry the
 * question of which one it uses, and the answer would live in a field somebody
 * eventually forgets to set.
 *
 * Pure, so the catalog's own semantics can be tested without a database.
 */
export function evaluateBadge(
  badge: Badge,
  value: number,
  totals: Record<string, number> = {},
): EvaluatedBadge {
  if (!badge.leveled || !badge.levels?.length) {
    const need = badge.threshold ?? 1;
    const earned = value >= need;
    return {
      earned,
      level: earned ? 0 : -1,
      metal: earned ? 'plain' : null,
      value,
      target: earned ? null : need,
      ratio: earned ? 1 : Math.max(0, Math.min(1, value / need)),
      thresholds: [need],
    };
  }

  const thresholds = badge.levels.map((l) => resolveThreshold(l, l.metric ?? badge.metric, totals));
  let level = -1;
  for (let i = 0; i < thresholds.length; i += 1) if (value >= thresholds[i]) level = i;

  const earned = level >= 0;
  const target = level < thresholds.length - 1 ? thresholds[level + 1] : null;
  // Progress is measured from the level already held, not from zero: at 63 of a
  // 50→300 climb, "13 of 250" is the honest bar. From zero it would read 21%
  // full for someone who has only just started the leg.
  const floor = earned ? thresholds[level] : 0;
  const span = target === null ? 0 : target - floor;
  return {
    earned,
    level,
    metal: earned ? METALS[level] : null,
    value,
    target,
    ratio: target === null ? 1 : Math.max(0, Math.min(1, span > 0 ? (value - floor) / span : 1)),
    thresholds,
  };
}
