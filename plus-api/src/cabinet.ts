import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from './config.js';

/**
 * Server view of `plus/cabinet-papers.json` (tools/build_cabinet_papers.py
 * output): for each site hashtag, the papers of «کتابخانهٔ دنت‌کست» that answer
 * the same topic, best first. The bridge from Persian site tags to the
 * library's English tags is authored in plus/cabinet-bridge.json; this file is
 * only its compiled result. Loaded and cached the way flashcards.ts caches its
 * file (reload on file change, remote copy wins, last-good on a read error).
 */

export interface CabinetPaperRow {
  /** title */ t: string;
  /** year */ y?: number | string;
  /** study type */ ty?: string;
  /** journal */ j?: string;
  /** key finding, already shortened */ kf?: string;
  /** Drive view link */ v?: string;
  /** Drive download link */ d?: string;
}

interface CabinetFile {
  version: number;
  byTag: Record<string, string[]>;
  papers: Record<string, CabinetPaperRow>;
}

const EMPTY: CabinetFile = { version: 0, byTag: {}, papers: {} };

let cached: CabinetFile | null = null;
let cachedMtimeMs = 0;
/** Set by content-refresh.ts once a published copy has been fetched and validated. */
let remote: CabinetFile | null = null;

function defaultPath(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // plus-api/src (or dist)
  return resolve(here, '..', '..', 'plus', 'cabinet-papers.json');
}

/**
 * Adopt a freshly published copy. Refused when it is not the expected shape or
 * when it maps no tag at all: an empty file passes every structural check and
 * would silently remove every paper suggestion.
 *
 * @returns true if the payload was adopted.
 */
export function applyRemoteCabinet(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const f = raw as CabinetFile;
  if (!f.byTag || typeof f.byTag !== 'object' || Array.isArray(f.byTag)) return false;
  if (!f.papers || typeof f.papers !== 'object' || Array.isArray(f.papers)) return false;
  const lists = Object.values(f.byTag);
  if (lists.length === 0) return false;
  if (!lists.every((ids) => Array.isArray(ids) && ids.every((id) => typeof id === 'string' && f.papers[id]))) return false;
  remote = f;
  return true;
}

/** Which copy is being served — for the boot/refresh log and for tests. */
export function cabinetSource(): string {
  return remote ? `published (version ${remote.version})` : 'image/disk';
}

/** Test-only: forget the fetched copy so a case can start from the baked file. */
export function resetRemoteCabinet(): void {
  remote = null;
}

function getFile(): CabinetFile {
  if (remote) return remote;
  const path = config.cabinetPath || defaultPath();
  try {
    const mtime = statSync(path).mtimeMs;
    if (cached && mtime === cachedMtimeMs) return cached;
    cached = JSON.parse(readFileSync(path, 'utf8')) as CabinetFile;
    cachedMtimeMs = mtime;
  } catch (err) {
    if (cached) return cached; // keep the last good copy on a transient read error
    // eslint-disable-next-line no-console
    console.warn(`[cabinet] could not load ${path}; the assistant will suggest no library papers`);
    cached = EMPTY;
  }
  return cached;
}

/** Library paper ids for a site tag key, best first ([] when the tag has no bridge). */
export function cabinetIdsFor(tagKey: string): string[] {
  return getFile().byTag[tagKey] ?? [];
}

export function cabinetPaper(id: string): CabinetPaperRow | null {
  return getFile().papers[id] ?? null;
}
