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
 * The one pathway GET /me headlines: the most recently started enrollment
 * that is still in progress, falling back to the most recently completed one
 * so a user who finished everything still sees something. Null with no
 * enrollments (never a stale/locked stub — same convention as due_card_count).
 */
export async function getActivePathwaySummary(userId: string): Promise<ActivePathwaySummary | null> {
  const row = await pool.query<{ pathway_id: string }>(
    `select pathway_id from user_pathways
      where user_id = $1
      order by (completed_at is null) desc, coalesce(completed_at, started_at) desc
      limit 1`,
    [userId],
  );
  const pathwayId = row.rows[0]?.pathway_id;
  if (!pathwayId) return null;
  const pathway = getPathwayById(pathwayId);
  if (!pathway) return null; // definition since removed from pathways.json

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
