import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from './config.js';

/**
 * Server view of `plus/flashcards-index.json` (tools/build_flashcards_index.mjs
 * output) — the source of truth for every AI review card's text. Versioned in
 * the repo, NOT in the DB, and loaded/cached exactly the way pathways.ts and
 * badges.ts cache their files (reload on file change, remote copy wins,
 * last-good on a read error).
 *
 * Nothing about a user's schedule lives here — see ai_card_state
 * (migration 0035) for that half.
 */

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  source?: string;
  source_faq_index?: number;
}

interface FlashcardsFile {
  version: number;
  byContent: Record<string, { cards: FlashCard[] }>;
}

const EMPTY: FlashcardsFile = { version: 0, byContent: {} };

let cached: FlashcardsFile | null = null;
let cachedMtimeMs = 0;
/** Set by content-refresh.ts once a published copy has been fetched and validated. */
let remote: FlashcardsFile | null = null;

function defaultPath(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // plus-api/src (or dist)
  return resolve(here, '..', '..', 'plus', 'flashcards-index.json');
}

/**
 * Adopt a freshly published index.
 *
 * An empty `byContent` is refused for the same reason an empty pathways array
 * or an empty badge catalog is: it passes every structural check while
 * emptying the whole feature, and a backfill run never produces one.
 *
 * @returns true if the payload was adopted.
 */
export function applyRemoteFlashcards(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const f = raw as FlashcardsFile;
  if (!f.byContent || typeof f.byContent !== 'object' || Array.isArray(f.byContent)) return false;
  const entries = Object.values(f.byContent);
  if (entries.length === 0) return false;
  const ok = entries.every((entry) => entry && Array.isArray(entry.cards)
    && entry.cards.every((c) => c && typeof c === 'object'
      && typeof c.id === 'string' && c.id.length > 0
      && typeof c.front === 'string' && c.front.length > 0
      && typeof c.back === 'string' && c.back.length > 0));
  if (!ok) return false;
  remote = f;
  return true;
}

/** Which copy is being served — for the boot/refresh log and for tests. */
export function flashcardsSource(): string {
  return remote ? `published (version ${remote.version})` : 'image/disk';
}

/** Test-only: forget the fetched copy so a case can start from the baked file. */
export function resetRemoteFlashcards(): void {
  remote = null;
}

function getFile(): FlashcardsFile {
  if (remote) return remote;
  const path = config.flashcardsPath || defaultPath();
  try {
    const mtime = statSync(path).mtimeMs;
    if (cached && mtime === cachedMtimeMs) return cached;
    cached = JSON.parse(readFileSync(path, 'utf8')) as FlashcardsFile;
    cachedMtimeMs = mtime;
  } catch (err) {
    if (cached) return cached; // keep the last good copy on a transient read error
    // eslint-disable-next-line no-console
    console.warn(`[flashcards] could not load ${path}; AI review cards will be empty`);
    cached = EMPTY;
  }
  return cached;
}

export function getCardsFor(contentId: string): FlashCard[] {
  return getFile().byContent[contentId]?.cards ?? [];
}

export function getCard(contentId: string, cardId: string): FlashCard | null {
  return getCardsFor(contentId).find((c) => c.id === cardId) ?? null;
}

export function contentIdsWithCards(): string[] {
  return Object.keys(getFile().byContent);
}
