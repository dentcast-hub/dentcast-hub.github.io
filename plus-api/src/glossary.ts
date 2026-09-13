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

function defaultPath(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // plus-api/src (or dist)
  return resolve(here, '..', '..', 'glossary', 'glossary.json');
}

export function getGlossaryTerms(): GlossaryTerm[] {
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
