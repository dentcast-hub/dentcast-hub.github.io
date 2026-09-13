import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from './config.js';

/**
 * Server view of dentcast-hashtag-reference.json — the canonical hashtag
 * library (CLAUDE.md: "the reference owns the VOCABULARY, the brain owns the
 * ASSIGNMENT"). The API already gets the assignment through content-index.json
 * (`tags`, one entry per real #hashtag with its content_ids); what it lacked
 * was two things only the reference knows and that the concept views need:
 *
 *   · a concept's DOMAIN — «اینسایت», «نوت_کست», «دنتکست» are tags too, and a
 *     "your highlights about اینسایت" view is a folder filter wearing a
 *     concept's clothes. `brand` and `web` are not concepts.
 *   · a concept's other NAMES (aliases, variants) — so a highlight whose text
 *     says «رزین سمان» is found under «سمان رزینی».
 *
 * Note the two files spell keys differently: the reference writes
 * «سمان_رزینی», the index «سمان رزینی». Every lookup here goes through
 * foldName(), which is also the join services/highlight-concepts.ts uses
 * against glossary titles, so one folding rule decides all three.
 *
 * Optional on purpose: a missing file leaves every domain unknown (kept) and
 * every concept with its one canonical name. Read once, reloaded on mtime.
 */

export interface HashtagConcept {
  key: string;
  domain?: string | null;
  aliases?: string[];
  variants?: string[];
}

interface RefFile { concepts?: HashtagConcept[]; aliases?: Record<string, string> }

let cached: RefFile | null = null;
let cachedMtimeMs = 0;
let byFolded: Map<string, HashtagConcept> | null = null;
let aliasToCanonical: Map<string, string> | null = null;
/** Set by content-refresh.ts once a published copy has been fetched and validated. */
let remote: RefFile | null = null;
/** Bumped whenever the copy in service changes, so a derived catalog can tell. */
let version = 0;

/**
 * Adopt a freshly published reference (content-refresh.ts). A hashtag minted
 * at publish (Hard Rule 15) lands here with its domain and aliases; without
 * this the API would keep the reference it was built with and a new concept
 * would carry no domain (kept, harmless) and no aliases (found only by its
 * own name) until the next image. The gate: a non-empty `concepts` array of
 * objects with a string key.
 */
export function applyRemoteHashtagRef(raw: unknown): boolean {
  const ref = raw as RefFile | null;
  if (!ref || typeof ref !== 'object' || !Array.isArray(ref.concepts) || ref.concepts.length === 0) return false;
  if (!ref.concepts.every((c) => c && typeof c.key === 'string')) return false;
  remote = ref;
  byFolded = null;
  aliasToCanonical = null;
  version += 1;
  return true;
}

export function hashtagRefSource(): string {
  return remote ? `published (${remote.concepts?.length ?? 0} concepts)` : 'image/disk';
}

/** A number that changes whenever the copy in service does (disk reload or adoption). */
export function hashtagRefVersion(): number {
  load();
  return version;
}

/** Test-only. */
export function resetRemoteHashtagRef(): void {
  remote = null;
  byFolded = null;
  aliasToCanonical = null;
  version += 1;
}

/**
 * One folding rule for a tag/concept/glossary NAME: lowercase, Arabic ی/ک →
 * Persian, zero-widths and tashkeel stripped, `_`/`-`/`/` read as spaces,
 * whitespace collapsed. A ZWNJ inside a word is dropped rather than turned
 * into a space (the same choice hl-view.js's foldFa makes for search), so
 * «سمان‌های» and «سمانهای» fold alike.
 */
export function foldName(s: string): string {
  return String(s || '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[​-‏ً-ْـ]/g, '')
    .replace(/[_\-/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

function defaultPath(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, '..', '..', 'dentcast-hashtag-reference.json');
}

function load(): RefFile {
  if (remote) return remote;
  const path = config.hashtagRefPath || defaultPath();
  try {
    const mtime = statSync(path).mtimeMs;
    if (cached && mtime === cachedMtimeMs) return cached;
    cached = JSON.parse(readFileSync(path, 'utf8')) as RefFile;
    cachedMtimeMs = mtime;
    byFolded = null;
    aliasToCanonical = null;
    version += 1;
  } catch {
    if (!cached) cached = {};
  }
  return cached;
}

function index(): { byFolded: Map<string, HashtagConcept>; aliasToCanonical: Map<string, string> } {
  const ref = load();
  if (!byFolded || !aliasToCanonical) {
    byFolded = new Map();
    aliasToCanonical = new Map();
    for (const c of ref.concepts || []) {
      if (!c || typeof c.key !== 'string') continue;
      byFolded.set(foldName(c.key), c);
      for (const n of [...(c.aliases || []), ...(c.variants || [])]) {
        if (typeof n === 'string' && n.trim()) aliasToCanonical.set(foldName(n), foldName(c.key));
      }
    }
    for (const [alias, canonical] of Object.entries(ref.aliases || {})) {
      if (typeof alias === 'string' && typeof canonical === 'string') aliasToCanonical.set(foldName(alias), foldName(canonical));
    }
  }
  return { byFolded, aliasToCanonical };
}

/** The concept a folded name resolves to — its own key, or through an alias — or null. */
export function conceptForName(name: string): HashtagConcept | null {
  const { byFolded, aliasToCanonical } = index();
  const f = foldName(name);
  return byFolded.get(f) ?? byFolded.get(aliasToCanonical.get(f) ?? '') ?? null;
}

/** The concept's domain, or null when the reference does not know the name. */
export function conceptDomain(name: string): string | null {
  return conceptForName(name)?.domain ?? null;
}

/** Every folded name that means this concept: the key, its aliases, its variants. */
export function conceptNames(name: string): string[] {
  const c = conceptForName(name);
  const out = new Set<string>([foldName(name)]);
  if (c) {
    out.add(foldName(c.key));
    for (const n of [...(c.aliases || []), ...(c.variants || [])]) if (typeof n === 'string') out.add(foldName(n));
  }
  return [...out].filter((n) => n.length >= 3);
}
