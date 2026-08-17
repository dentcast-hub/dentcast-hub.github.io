import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from '../config.js';

/**
 * Server view of `plus/des-library.json` — the founder's own, out-of-band
 * paper corpus. Versioned in the repo, NOT in the DB, loaded/cached exactly
 * the way badges.ts and pathways.ts cache their catalogs (reload on file
 * change, remote copy wins, last-good on a read error).
 *
 * This is a SECOND source feeding the same lookup a reader's own submission
 * hits (see des-library.ts's lookupExact/nearDuplicates): des_papers/
 * des_paper_keys stay exactly as built — Postgres, written live when the
 * founder answers a specific reader's request through the admin panel — but
 * a paper the founder adds proactively, in chat, with no reader waiting on
 * it, has no live request to answer through. tools/des_library.py's `add`
 * command already does that validate+normalise+near-duplicate-gate dance
 * against this very file; this module is what lets the LIVE API see what it
 * wrote, the same way a publish becomes visible to the taxonomy without an
 * image rebuild.
 *
 * File is keyed by content — an `index` of every key ever seen (doi:/pmid:/
 * ttl:) onto a paper id, and a `papers` map of id -> the stored record. See
 * tools/des_library.py's `new_library()`/`keys_for()` for the authoring side.
 */

export interface FileLibraryPaper {
  id: string;
  keys: string[];
  hashtags: string[];
  /** The spec's output object, verbatim — includes its own `citation` block. */
  des: {
    citation?: { title?: string; authors?: string; year?: number; doi?: string };
    [key: string]: unknown;
  };
  scored_at?: string;
  scored_by?: string | null;
  submitted_by?: string | null;
  also_cited_by?: string[];
}

export interface FileLibrary {
  version: number;
  index: Record<string, string>;
  papers: Record<string, FileLibraryPaper>;
}

const EMPTY: FileLibrary = { version: 0, index: {}, papers: {} };

let cached: FileLibrary | null = null;
let cachedMtimeMs = 0;
/** Set by content-refresh.ts once a published copy has been fetched and validated. */
let remote: FileLibrary | null = null;

function defaultPath(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // plus-api/src/services (or dist)
  return resolve(here, '..', '..', '..', 'plus', 'des-library.json');
}

/**
 * Adopt a freshly published library.
 *
 * A library with no papers is refused for the same reason applyRemoteBadges
 * refuses an empty catalog: it passes every structural check while emptying
 * the whole corpus, and `tools/des_library.py add` never produces one — the
 * baked file already carries at least one entry, so zero is a signal
 * something upstream broke, not a legitimate edit.
 *
 * @returns true if the payload was adopted.
 */
export function applyRemoteDesLibrary(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const c = raw as FileLibrary;
  if (!c.papers || typeof c.papers !== 'object' || Object.keys(c.papers).length === 0) return false;
  if (!c.index || typeof c.index !== 'object') return false;
  const ok = Object.values(c.papers).every((p) => p && typeof p === 'object'
    && typeof p.id === 'string' && Array.isArray(p.keys) && p.des && typeof p.des === 'object');
  if (!ok) return false;
  remote = c;
  return true;
}

/** Which copy is being served — for the boot/refresh log and for tests. */
export function desLibrarySource(): string {
  return remote ? `published (${Object.keys(remote.papers).length} paper(s))` : 'image/disk';
}

/** Test-only: forget the fetched copy so a case can start from the baked file. */
export function resetRemoteDesLibrary(): void {
  remote = null;
}

export function getFileLibrary(): FileLibrary {
  if (remote) return remote;
  const path = config.desLibraryPath || defaultPath();
  try {
    const mtime = statSync(path).mtimeMs;
    if (cached && mtime === cachedMtimeMs) return cached;
    cached = JSON.parse(readFileSync(path, 'utf8')) as FileLibrary;
    cachedMtimeMs = mtime;
  } catch {
    if (cached) return cached; // keep the last good copy on a transient read error
    cached = EMPTY;
  }
  return cached;
}
