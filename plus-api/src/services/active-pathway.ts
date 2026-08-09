import { pool } from '../db.js';
import { getPathwayById, computeProgress } from '../pathways.js';
import { getConsumedContentIds } from './consumption.js';

export interface ActivePathwaySummary {
  id: string;
  kind?: 'bundle';
  title_fa: string;
  current_step: number;
  total_steps: number;
  is_complete: boolean;
}

/**
 * The one pathway GET /me headlines. Ranking, in order: any in-progress
 * enrollment before any completed one; among in-progress enrollments, a
 * bundle before a full pathway (it is shorter and finishes sooner, so it is
 * the more useful thing to headline when both are running); ties broken by
 * most recently touched. Falls back to the most recently completed enrollment
 * so a user who finished everything still sees something. Null with no
 * enrollments (never a stale/locked stub — same convention as due_card_count).
 *
 * The ranking runs in JS rather than SQL because "is this a bundle" lives in
 * pathways.json, not the enrollment table — a user has at most a handful of
 * enrollments, so this is cheap.
 */
export async function getActivePathwaySummary(userId: string): Promise<ActivePathwaySummary | null> {
  const rows = await pool.query<{ pathway_id: string; started_at: string; completed_at: string | null }>(
    `select pathway_id, started_at, completed_at from user_pathways where user_id = $1`,
    [userId],
  );
  const candidates = rows.rows
    .map((r) => ({ ...r, pathway: getPathwayById(r.pathway_id) }))
    .filter((r): r is typeof r & { pathway: NonNullable<typeof r.pathway> } => !!r.pathway); // definition since removed from pathways.json
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const aDone = a.completed_at ? 1 : 0;
    const bDone = b.completed_at ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    const aBundle = a.pathway.kind === 'bundle' ? 0 : 1;
    const bBundle = b.pathway.kind === 'bundle' ? 0 : 1;
    if (aBundle !== bBundle) return aBundle - bBundle;
    const aTime = new Date(a.completed_at ?? a.started_at).getTime();
    const bTime = new Date(b.completed_at ?? b.started_at).getTime();
    return bTime - aTime;
  });

  const { pathway } = candidates[0];
  const consumed = await getConsumedContentIds(userId);
  const progress = computeProgress(pathway, consumed);
  return {
    id: pathway.id,
    ...(pathway.kind === 'bundle' ? { kind: 'bundle' as const } : {}),
    title_fa: pathway.title_fa,
    current_step: progress.current_step,
    total_steps: progress.total_steps,
    is_complete: progress.is_complete,
  };
}
