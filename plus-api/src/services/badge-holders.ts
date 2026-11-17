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
  /** One plain sentence: who holds this — «کسی که ۲۵ بار مطلبی را در ساعتِ اولِ انتشارش خوانده.» */
  meaning_fa: string;
  /** What it takes, in the catalog's own unit: «۳۰ روز», «همهٔ مسیرها». Empty when the catalog gives no number. */
  need_fa: string;
  /** The catalog's sentence for reaching this level, and its longer explanation. */
  unlock_fa: string;
  detail_fa: string;
  /** Readers whose ledger row is at this level or above. */
  holders: number;
}

interface Slot {
  key: string; level: number; title_fa: string; level_fa: string; kind: 'badge' | 'medal'; visibility: string;
  meaning_fa: string; need_fa: string; unlock_fa: string; detail_fa: string;
}

const toFa = (n: number): string => String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

/**
 * «کسی که …» — what a holder DID, per metric.
 *
 * The catalog's own copy cannot be used for this: it is written to the reader
 * («هفت روزِ پشتِ هم برگشتی») and in a voice, while the panel needs the plain
 * fact about a third person. So each metric the catalog measures gets one
 * sentence here, taking the level's threshold. A metric with no entry (a badge
 * added to badges.json later) falls back to the catalog's threshold and unit,
 * so a new badge reads thinner rather than wrong; the test below walks the
 * whole catalog and fails on any metric that has no sentence.
 */
type Count = number | 'all';
const cnt = (n: Count, one: string, many: (x: string) => string, all: string): string =>
  n === 'all' ? all : n === 1 ? one : many(toFa(n));
const MEANING: Record<string, (n: Count) => string> = {
  longest_streak: (n) => `کسی که ${cnt(n, 'یک روز', (x) => `${x} روز پشتِ‌سرهم`, 'همیشه')} فعال بوده.`,
  streak_comeback: () => 'کسی که استریکش شکسته و دوباره برگشته.',
  shield_used: () => 'کسی که دست‌کم یک بار سپرِ استریکش را خرج کرده.',
  episodes_completed: (n) => `کسی که ${cnt(n, 'اولین اپیزودش', (x) => `${x} اپیزودِ متفاوت`, 'همهٔ اپیزودها')} را تا آخر شنیده.`,
  articles_completed: (n) => `کسی که ${cnt(n, 'اولین مطلبش', (x) => `${x} مطلبِ متفاوت`, 'همهٔ مطالب')} را تا آخر خوانده.`,
  max_content_in_week: (n) => `کسی که در یک هفته (شنبه تا جمعه) ${cnt(n, 'یک محتوا', (x) => `${x} محتوا`, 'همه‌چیز')} را تمام کرده.`,
  highlights: (n) => `کسی که ${cnt(n, 'اولین هایلایتش را', (x) => `${x} هایلایت`, 'همه‌چیز را')} ${n === 1 ? 'کشیده' : 'ساخته'}.`,
  highlights_with_note: (n) => `کسی که روی ${cnt(n, 'یک هایلایت', (x) => `${x} هایلایت`, 'همهٔ هایلایت‌هایش')} یادداشت نوشته.`,
  distinct_folders: (n) => `کسی که از ${cnt(n, 'یک بخشِ', (x) => `${x} بخشِ متفاوتِ`, 'همهٔ بخش‌های')} سایت محتوا تمام کرده.`,
  folders_completed: (n) => `کسی که همهٔ مطالبِ ${cnt(n, 'یک بخش', (x) => `${x} بخش`, 'همهٔ بخش‌ها')} را تمام کرده.`,
  archive_read: () => 'کسی که مطلبی با بیش از دو سال قدمت را خوانده.',
  early_reads: (n) => `کسی که ${cnt(n, 'یک بار', (x) => `${x} بار`, 'همیشه')} مطلبی را در ساعتِ اولِ انتشارش خوانده.`,
  night_activity: () => 'کسی که بین نیمه‌شب و ۴ صبح فعال بوده.',
  dawn_activity: () => 'کسی که قبل از ۶ صبح فعال بوده.',
  weekend_pair: () => 'کسی که پنجشنبه و جمعهٔ یک هفته هر دو فعال بوده.',
  weeks_no_demotion: (n) => `کسی که ${cnt(n, 'یک هفته', (x) => `${x} هفتهٔ پشتِ‌سرهم`, 'همیشه')} در لیگ سقوط نکرده.`,
  pathways_completed: (n) => `کسی که ${cnt(n, 'یک مسیرِ یادگیری', (x) => `${x} مسیرِ یادگیری`, 'همهٔ مسیرهای یادگیری')} را کامل تمام کرده.`,
  review_sessions: (n) => `کسی که در ${cnt(n, 'یک روز', (x) => `${x} روزِ متفاوت`, 'همهٔ روزها')} کارت مرور کرده.`,
  collections: (n) => `کسی که ${cnt(n, 'اولین کالکشنش را', (x) => `${x} کالکشن`, 'کالکشن')} ساخته.`,
  collection_items: (n) => `کسی که ${cnt(n, 'یک مورد', (x) => `${x} مورد`, 'همه‌چیز')} در کالکشن‌هایش گذاشته.`,
  challenges_settled: (n) => `کسی که به ${cnt(n, 'یک چالش', (x) => `${x} چالش`, 'همهٔ چالش‌ها')} جوابِ کاملاً درست داده.`,
  tiers_won: (n) => `کسی که در ${cnt(n, 'یک لیگ', (x) => `${x} لیگِ متفاوت`, 'همهٔ لیگ‌ها')} اولِ گروهش شده.`,
  shares: (n) => `کسی که ${cnt(n, 'یک مطلب', (x) => `${x} مطلب`, 'همهٔ مطالب')} را بعد از خواندنِ خودش به اشتراک گذاشته.`,
  founder_seat: () => 'کسی که جزو پانصد کاربرِ اولِ دنت‌کست پلاس بوده.',
  pillar_seat: () => 'کسی که جزو پنجاه خریدارِ اولِ اشتراک پریمیوم بوده.',
  'grant:companion': () => 'کسی که خودت این نشان را به او داده‌ای، برای سهمی که در ساختنِ دنت‌کست داشته.',
  'grant:student': () => 'کسی که واریزِ دانشجویی‌اش را تأیید کرده‌ای.',
  'grant:anniversary7': () => 'کسی که این نشان را در هفت‌سالگیِ دنت‌کست از تو گرفته.',
};
export function meaningOf(metric: string, threshold: Count | undefined, fallback: string): string {
  const say = MEANING[metric];
  if (say) return say(threshold ?? 1);
  if (metric.startsWith('grant:')) return 'کسی که خودت این نشان را به او داده‌ای.';
  return fallback ? `کسی که به «${fallback}» رسیده.` : '';
}

/** «۳۰ روز» / «همهٔ مسیر» — the threshold as the wall would say it, or '' for a one-shot with no unit. */
function needOf(threshold: number | 'all' | undefined, unit: string | undefined): string {
  if (threshold === 'all') return unit ? `همهٔ ${unit}ها` : 'همه';
  if (typeof threshold !== 'number') return '';
  return unit ? `${toFa(threshold)} ${unit}` : (threshold > 1 ? toFa(threshold) : '');
}

/** Every (key, level) the panel can ask about, in catalog order. */
async function slots(): Promise<Slot[]> {
  const catalog = getBadgeCatalog();
  const out: Slot[] = [];
  for (const b of catalog.badges) {
    if (b.leveled && b.levels?.length) {
      b.levels.forEach((lv, i) => out.push({
        key: b.key, level: i, title_fa: b.title_fa, level_fa: METAL_FA[i] ?? String(i + 1),
        kind: 'badge', visibility: b.visibility,
        meaning_fa: meaningOf(lv.metric ?? b.metric, lv.threshold, needOf(lv.threshold, b.unit_fa)),
        need_fa: needOf(lv.threshold, b.unit_fa), unlock_fa: lv.unlock_fa ?? '', detail_fa: b.detail_fa ?? '',
      }));
    } else {
      out.push({
        key: b.key, level: 0, title_fa: b.title_fa, level_fa: '', kind: 'badge', visibility: b.visibility,
        meaning_fa: meaningOf(b.metric, b.threshold, needOf(b.threshold, b.unit_fa)),
        need_fa: needOf(b.threshold, b.unit_fa), unlock_fa: b.unlock_fa ?? '', detail_fa: b.detail_fa ?? '',
      });
    }
  }
  const tiers = await getTiers();
  for (const m of catalog.medals.items) {
    for (const t of tiers) {
      out.push({
        key: `medal:${m.key}`, level: t.tier_order, title_fa: `${m.metal_fa} ${t.name_fa}`,
        level_fa: '', kind: 'medal', visibility: 'always',
        meaning_fa: `کسی که در لیگِ ${t.name_fa} ${m.rank === 1 ? 'اولِ' : m.rank === 2 ? 'دومِ' : `نفرِ ${toFa(m.rank)}ِ`} گروهش شده.`,
        need_fa: `رتبهٔ ${toFa(m.rank)} گروه در لیگِ ${t.name_fa}`, unlock_fa: m.unlock_fa ?? '', detail_fa: m.detail_fa ?? '',
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
