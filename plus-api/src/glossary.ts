import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from './config.js';

/**
 * Server view of glossary/glossary.json — the دانشنامه catalog the publishing
 * workflow writes (slug, titles, synonyms, pillar). Same loader shape as
 * content-index.ts's on-disk path: read once, reloaded when the file's mtime
 * changes, last-good copy kept on a transient error. The glossary carries no
 * hashtags of its own (build_plus_index.mjs notes this), which is exactly why
 * services/highlight-concepts.ts joins it to the tag catalog BY NAME — the
 * fa_title and the synonyms are the join key.
 */

export interface GlossaryTerm {
  slug: string;
  title: string;
  fa_title: string;
  synonyms: string[];
  url: string;
  pillar?: { primary?: string | null; secondary?: string[]; subtopic?: string | null };
}

interface GlossaryFile { glossary: GlossaryTerm[] }

let cached: GlossaryTerm[] | null = null;
let cachedMtimeMs = 0;
/** Set by content-refresh.ts once a published copy has been fetched and validated. */
let remote: GlossaryTerm[] | null = null;

/**
 * Adopt a freshly published glossary fetched from the live site
 * (content-refresh.ts). A term published this afternoon must answer its own
 * «یادداشت‌های خودت» block this afternoon, not after the next image build —
 * the founder publishes terms and builds nothing, and must not have to
 * remember that this file was ever baked. Same gate as the taxonomy index:
 * the payload must parse into a non-empty list of terms with a slug and a
 * fa_title, or the copy in service stands.
 */
export function applyRemoteGlossary(raw: unknown): boolean {
  const list = Array.isArray(raw) ? raw : (raw as GlossaryFile | null)?.glossary;
  if (!Array.isArray(list) || list.length === 0) return false;
  const terms = list.filter((t) => t && typeof t.slug === 'string' && typeof t.fa_title === 'string');
  if (terms.length === 0) return false;
  remote = terms;
  return true;
}

/** Which copy is being served — for the refresh log/status and for tests. */
export function glossarySource(): string {
  return remote ? `published (${remote.length} terms)` : 'image/disk';
}

/** Test-only: forget the fetched copy so a case can start from the baked file. */
export function resetRemoteGlossary(): void {
  remote = null;
}

function defaultPath(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // plus-api/src (or dist)
  return resolve(here, '..', '..', 'glossary', 'glossary.json');
}

export function getGlossaryTerms(): GlossaryTerm[] {
  if (remote) return remote;
  const path = config.glossaryPath || defaultPath();
  try {
    const mtime = statSync(path).mtimeMs;
    if (cached && mtime === cachedMtimeMs) return cached;
    const raw = JSON.parse(readFileSync(path, 'utf8')) as GlossaryFile | GlossaryTerm[];
    const list = Array.isArray(raw) ? raw : raw.glossary;
    cached = Array.isArray(list) ? list.filter((t) => t && typeof t.slug === 'string') : [];
    cachedMtimeMs = mtime;
  } catch {
    if (cached) return cached;
    // eslint-disable-next-line no-console
    console.warn(`[glossary] could not load ${path}; glossary notes will be empty`);
    cached = [];
  }
  return cached;
}

export function getGlossaryTerm(slug: string): GlossaryTerm | null {
  return getGlossaryTerms().find((t) => t.slug === slug) ?? null;
}
