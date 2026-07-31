import { getClusters, getContentInfo } from '../content-index.js';
import { getPathways, computeProgress } from '../pathways.js';
import { getConsumedContentIds } from './consumption.js';

/**
 * «قطب‌نمای مطالعه» (premium): a coverage report, not an interest guess. It
 * cross-references what the user has actually consumed (getConsumedContentIds
 * — the same source pathway progress and the dashboard use) against the
 * taxonomy already folded into content-index.json from dentcast-brain.json's
 * pillar fields, and against plus/pathways.json. No new data is stored; this
 * is a pure derivation, recomputed on every request like pathway progress.
 */

export interface CompassCluster {
  key: string;
  fa: string;
  read: number;
  total: number;
  coverage_pct: number; // read/total for THIS cluster — "چند درصد این پیلار را خوانده‌اید"
  share_pct: number; // read/total_read — "چه سهمی از کل مطالعه‌تان اینجا بوده"
}

export interface CompassItem {
  content_id: string;
  title: string;
  url: string;
  type: string;
}

export interface CompassPathway {
  id: string;
  title_fa: string;
  completed_steps: number;
  total_steps: number;
  pct: number;
  is_complete: boolean;
}

export interface ReadingCompass {
  total_read: number;
  clusters: CompassCluster[]; // read > 0, sorted by read desc
  top_cluster: CompassCluster | null;
  pathways: CompassPathway[]; // completed_steps > 0, sorted desc
  same_area: CompassItem[]; // unread items in top_cluster
  unexplored: CompassItem[]; // items from the largest untouched clusters
}

const SAME_AREA_LIMIT = 5;
const UNEXPLORED_CLUSTERS = 2;
const UNEXPLORED_PER_CLUSTER = 3;

function toItem(contentId: string): CompassItem | null {
  const info = getContentInfo(contentId);
  if (!info) return null;
  return { content_id: contentId, title: info.title, url: info.url, type: info.type };
}

export async function computeReadingCompass(userId: string): Promise<ReadingCompass> {
  const consumed = await getConsumedContentIds(userId);
  const totalRead = consumed.size;
  const rawClusters = getClusters().filter((c) => c.contentCount > 0);

  const clusters: CompassCluster[] = rawClusters
    .map((c) => {
      const read = c.contentIds.reduce((n, id) => n + (consumed.has(id) ? 1 : 0), 0);
      return {
        key: c.key,
        fa: c.fa,
        read,
        total: c.contentCount,
        coverage_pct: Math.round((read / c.contentCount) * 100),
        share_pct: totalRead > 0 ? Math.round((read / totalRead) * 100) : 0,
      };
    })
    .sort((a, b) => b.read - a.read);

  const topCluster = clusters.find((c) => c.read > 0) ?? null;

  const sameArea: CompassItem[] = [];
  if (topCluster) {
    const raw = rawClusters.find((c) => c.key === topCluster.key)!;
    for (const id of raw.contentIds) {
      if (consumed.has(id)) continue;
      const item = toItem(id);
      if (item) sameArea.push(item);
      if (sameArea.length >= SAME_AREA_LIMIT) break;
    }
  }

  const untouched = clusters.filter((c) => c.read === 0).sort((a, b) => b.total - a.total);
  const unexplored: CompassItem[] = [];
  for (const uc of untouched.slice(0, UNEXPLORED_CLUSTERS)) {
    const raw = rawClusters.find((c) => c.key === uc.key)!;
    let picked = 0;
    for (const id of raw.contentIds) {
      const item = toItem(id);
      if (item) { unexplored.push(item); picked += 1; }
      if (picked >= UNEXPLORED_PER_CLUSTER) break;
    }
  }

  const pathways: CompassPathway[] = getPathways()
    .map((p) => {
      const progress = computeProgress(p, consumed);
      return {
        id: p.id,
        title_fa: p.title_fa,
        completed_steps: progress.completed_steps,
        total_steps: progress.total_steps,
        pct: progress.total_steps > 0 ? Math.round((progress.completed_steps / progress.total_steps) * 100) : 0,
        is_complete: progress.is_complete,
      };
    })
    .filter((p) => p.completed_steps > 0)
    .sort((a, b) => b.completed_steps - a.completed_steps);

  return {
    total_read: totalRead,
    clusters: clusters.filter((c) => c.read > 0),
    top_cluster: topCluster,
    pathways,
    same_area: sameArea,
    unexplored,
  };
}
