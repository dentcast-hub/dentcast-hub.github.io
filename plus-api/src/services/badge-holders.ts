/**
 * نشان‌های کمیاب — how many readers hold each badge level, and who they are.
 * Read-only; it writes nothing.
 *
 * The wall derives every badge per reader at read time (services/achievements.ts),
 * which is exactly why nothing could answer «who has this one»: there is no
 * row to count, and deriving ~25 metrics for every account on a panel click is
 * a load problem we would be giving ourselves. So this reads the one thing that
 * IS written — `achievement_announcements`, the ledger achievement-sync.ts keeps
 * of what each reader has been told — and three properties of that ledger shape
 * what the panel may claim:
 *
 *  · It is a HIGH-WATER MARK. A badge that later goes dark («فاتح» after a
 *    publish drops a folder below complete) stays in it, so a count here reads
 *    «reached this at some point», never «holds it this minute». For asking who
 *    earned something rare that is the better question anyway.
 *
 *  · One row per (reader, badge) carrying the HIGHEST level reached. So a level's
 *    count is every row at that level OR ABOVE — a gold holder reached silver —
 *    and the counts fall monotonically from bronze to gold.
 *
 *  · An account appears only once it has been synced, which happens on its first
 *    write after migration 0025. An account silent since then is absent, and
 *    `accounts` (the denominator the percentages use) is the ledger's own
 *    population for that reason, not the size of `profiles`.
 *
 * The date on a row is when we TOLD the reader. For an account that existed
 * before the ledger, the first sync filed its whole history at once and silently
 * (`seedSilently`: `seen_at` and `announced_at` are the same instant), so that
 * date is not an earning date and is reported as `seeded` instead of printed.
 *
 * Medals live in the same ledger under `medal:<key>` with the league tier order
 * as their level, and are listed per tier with the name the wall gives them.
 */

import { query, one } from '../db.js';
import { getBadgeCatalog } from '../badges.js';
import { getTiers } from './league.js';

export const HOLDERS_CAP = 200;

const METAL_FA = ['برنز', 'نقره', 'طلا'];

export interface RarityRow {
  /** The ledger key: a badge key, or `medal:<key>`. */
  key: string;
  level: number;
  title_fa: string;
  /** «برنز» / «نقره» / «طلا» for a leveled badge; empty for a one-shot badge or a medal. */
  level_fa: string;
  kind: 'badge' | 'medal';
  visibility: string;
  /** Readers whose ledger row is at this level or above. */
  holders: number;
}

interface Slot { key: string; level: number; title_fa: string; level_fa: string; kind: 'badge' | 'medal'; visibility: string }

/** Every (key, level) the panel can ask about, in catalog order. */
async function slots(): Promise<Slot[]> {
  const catalog = getBadgeCatalog();
  const out: Slot[] = [];
  for (const b of catalog.badges) {
    if (b.leveled && b.levels?.length) {
      b.levels.forEach((_, i) => out.push({
        key: b.key, level: i, title_fa: b.title_fa, level_fa: METAL_FA[i] ?? String(i + 1),
        kind: 'badge', visibility: b.visibility,
      }));
    } else {
      out.push({ key: b.key, level: 0, title_fa: b.title_fa, level_fa: '', kind: 'badge', visibility: b.visibility });
    }
  }
  const tiers = await getTiers();
  for (const m of catalog.medals.items) {
    for (const t of tiers) {
      out.push({
        key: `medal:${m.key}`, level: t.tier_order, title_fa: `${m.metal_fa} ${t.name_fa}`,
        level_fa: '', kind: 'medal', visibility: 'always',
      });
    }
  }
  return out;
}

export async function badgeRarity(): Promise<{ accounts: number; rows: RarityRow[] }> {
  const [all, counts, acc] = await Promise.all([
    slots(),
    query<{ badge_key: string; level: number; n: number }>(
      `select badge_key, level, count(*)::int as n
         from achievement_announcements group by badge_key, level`,
    ),
    one<{ n: number }>('select count(distinct user_id)::int as n from achievement_announcements'),
  ]);
  const rows: RarityRow[] = all.map((s) => ({
    ...s,
    holders: counts.rows
      .filter((c) => c.badge_key === s.key && c.level >= s.level)
      .reduce((sum, c) => sum + c.n, 0),
  }));
  // Rarest first among what somebody actually holds; the never-reached ones go
  // last, since «nobody yet» is a different fact from «almost nobody». A medal
  // tier nobody has reached is not a row at all — four of the seven league tiers
  // are not even active, and listing them would bury the list in zeros.
  const kept = rows.filter((r) => r.kind === 'badge' || r.holders > 0);
  const order = new Map(kept.map((r, i) => [r, i]));
  kept.sort((a, b) => {
    if ((a.holders === 0) !== (b.holders === 0)) return a.holders === 0 ? 1 : -1;
    return a.holders - b.holders || order.get(a)! - order.get(b)!;
  });
  return { accounts: acc?.n ?? 0, rows: kept };
}

export interface HolderRow {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  /** The level this reader actually reached — may be above the one asked for. */
  level: number;
  level_fa: string;
  announced_at: string;
  /** True when the row was filed by the silent catch-up, so its date is not an earning date. */
  seeded: boolean;
}

export interface HoldersPage {
  key: string;
  level: number;
  title_fa: string;
  level_fa: string;
  total: number;
  cap: number;
  rows: HolderRow[];
}

/** null when (key, level) is not something the catalog defines. */
export async function badgeHolders(key: string, level: number): Promise<HoldersPage | null> {
  const all = await slots();
  const slot = all.find((s) => s.key === key && s.level === level);
  if (!slot) return null;
  const label = (lv: number): string => all.find((s) => s.key === key && s.level === lv)?.[
    slot.kind === 'medal' ? 'title_fa' : 'level_fa'] ?? '';

  const total = await one<{ n: number }>(
    'select count(*)::int as n from achievement_announcements where badge_key = $1 and level >= $2',
    [key, level],
  );
  const res = await query<{
    id: string; display_name: string | null; phone: string | null;
    level: number; announced_at: string; seeded: boolean;
  }>(
    `select p.id, p.display_name, nullif(p.phone, '') as phone, a.level,
            a.announced_at, (a.seen_at is not null and a.seen_at = a.announced_at) as seeded
       from achievement_announcements a
       join profiles p on p.id = a.user_id
      where a.badge_key = $1 and a.level >= $2
      order by a.level desc, a.announced_at desc, p.id
      limit $3`,
    [key, level, HOLDERS_CAP],
  );
  return {
    key, level, title_fa: slot.title_fa, level_fa: slot.level_fa,
    total: total?.n ?? 0, cap: HOLDERS_CAP,
    rows: res.rows.map((r) => ({
      user_id: r.id, display_name: r.display_name, phone: r.phone,
      level: r.level, level_fa: label(r.level),
      announced_at: new Date(r.announced_at).toISOString(), seeded: r.seeded,
    })),
  };
}
