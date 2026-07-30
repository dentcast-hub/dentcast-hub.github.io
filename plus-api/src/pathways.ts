import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { config } from './config.js';
import { getContentInfo } from './content-index.js';

/**
 * Server view of `plus/pathways.json` (spec section 5): curated, cross-pillar
 * learning journeys, versioned in the repo and NOT stored in the DB. Only
 * enrollment + a progress cache live in `user_pathways`. Loaded and cached the
 * same way content-index.ts caches the taxonomy index (reload on file change).
 */

export interface PathwayStep {
  content_id: string;
  milestone: boolean;
}

export interface Pathway {
  id: string;
  title_fa: string;
  description_fa: string;
  premium: boolean;
  steps: PathwayStep[];
  reserved: Record<string, unknown>;
}

let cached: Pathway[] | null = null;
let cachedMtimeMs = 0;

function defaultPath(): string {
  const here = dirname(fileURLToPath(import.meta.url)); // plus-api/src (or dist)
  return resolve(here, '..', '..', 'plus', 'pathways.json');
}

export function getPathways(): Pathway[] {
  const path = config.pathwaysPath || defaultPath();
  try {
    const mtime = statSync(path).mtimeMs;
    if (cached && mtime === cachedMtimeMs) return cached;
    cached = JSON.parse(readFileSync(path, 'utf8')) as Pathway[];
    cachedMtimeMs = mtime;
  } catch (err) {
    if (cached) return cached; // keep the last good copy on a transient read error
    // eslint-disable-next-line no-console
    console.warn(`[pathways] could not load ${path}; pathway routes will be empty`);
    cached = [];
  }
  return cached;
}

export function getPathwayById(id: string): Pathway | null {
  return getPathways().find((p) => p.id === id) || null;
}

export interface ResolvedStep {
  content_id: string;
  milestone: boolean;
  title: string;
  url: string;
  type: string;
  completed: boolean;
}

/** Steps resolved to display metadata (via the content-index) + per-user completion. */
export function resolveSteps(pathway: Pathway, consumed: Set<string>): ResolvedStep[] {
  return pathway.steps.map((s) => {
    const info = getContentInfo(s.content_id);
    return {
      content_id: s.content_id,
      milestone: s.milestone,
      title: info?.title ?? s.content_id,
      url: info?.url ?? `/${s.content_id}.html`,
      type: info?.type ?? s.content_id.split('/')[0],
      completed: consumed.has(s.content_id),
    };
  });
}

export interface PathwayProgress {
  // Index of the first not-yet-completed step (0..total): the "resume here"
  // cursor. v1 pathways are strictly linear, so this stops at the first gap
  // even if a later step was completed out of order.
  current_step: number;
  completed_steps: number; // total steps completed, anywhere in the list
  total_steps: number;
  is_complete: boolean;
}

/** Derives progress from the user's own consumption — never advanced by a client call. */
export function computeProgress(pathway: Pathway, consumed: Set<string>): PathwayProgress {
  const total = pathway.steps.length;
  let current = 0;
  while (current < total && consumed.has(pathway.steps[current].content_id)) current += 1;
  const completedSteps = pathway.steps.reduce((n, s) => n + (consumed.has(s.content_id) ? 1 : 0), 0);
  return {
    current_step: current,
    completed_steps: completedSteps,
    total_steps: total,
    is_complete: total > 0 && completedSteps === total,
  };
}
