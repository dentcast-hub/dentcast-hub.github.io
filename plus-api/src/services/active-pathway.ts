import { pool } from '../db.js';
import { getPathwayById, computeProgress } from '../pathways.js';
import { getConsumedContentIds } from './consumption.js';

export interface ActivePathwaySummary {
  id: string;
  title_fa: string;
  current_step: number;
  total_steps: number;
  is_complete: boolean;
}

/**
 * The one FULL pathway GET /me headlines: the most recently started
 * enrollment that is still in progress, falling back to the most recently
 * completed one so a user who finished everything still sees something.
 * Null with no enrollments (never a stale/locked stub — same convention as
 * due_card_count).
 *
 * Bundles are excluded entirely: the dashboard's «مسیر یادگیری» block shows
 * full pathways only, and bundles live in their own «از کجا شروع کنم؟»
 * block, fed by GET /pathways (founder decision, 2026-08-09 — the two must
 * never mix again). The filter runs in JS because "is this a bundle" lives
 * in pathways.json, not the enrollment table — a user has at most a handful
 * of enrollments, so this is cheap.
 */
export async function getActivePathwaySummary(userId: string): Promise<ActivePathwaySummary | null> {
  const rows = await pool.query<{ pathway_id: string; started_at: string; completed_at: string | null }>(
    `select pathway_id, started_at, completed_at from user_pathways where user_id = $1`,
    [userId],
  );
  const candidates = rows.rows
    .map((r) => ({ ...r, pathway: getPathwayById(r.pathway_id) }))
    .filter((r): r is typeof r & { pathway: NonNullable<typeof r.pathway> } => !!r.pathway) // definition since removed from pathways.json
    .filter((r) => r.pathway.kind !== 'bundle');
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const aDone = a.completed_at ? 1 : 0;
    const bDone = b.completed_at ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const aTime = new Date(a.completed_at ?? a.started_at).getTime();
    const bTime = new Date(b.completed_at ?? b.started_at).getTime();
    return bTime - aTime;
  });

  const { pathway } = candidates[0];
  const consumed = await getConsumedContentIds(userId);
  const progress = computeProgress(pathway, consumed);
  return {
    id: pathway.id,
    title_fa: pathway.title_fa,
    current_step: progress.current_step,
    total_steps: progress.total_steps,
    is_complete: progress.is_complete,
  };
}
