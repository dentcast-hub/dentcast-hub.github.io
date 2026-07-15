/**
 * Development seed. Creates a couple of demo users with highlights, card_state
 * rows, and activity so the dashboard, tree, and archive have something to show
 * in local dev. Idempotent: re-running replaces the seed users.
 *
 *   npm run seed
 *
 * Never run against production data.
 */
import { pool, withTransaction, query } from '../db.js';
import { generatePseudonym } from '../services/pseudonym.js';
import { getIndex } from '../content-index.js';

const SEED_PHONES = ['09120000001', '09120000002'];

// Real content_ids from the taxonomy index so the tree + topic archive have data.
const idx = getIndex();
const cluster0 = idx.clusters[0]; // implantology
const cluster1 = idx.clusters[1]; // fixed-pros
const FREE_CONTENT = (cluster0?.contentIds || ['implantology/x']).slice(0, 2);
const FREE_CONTENT_B = (cluster1?.contentIds || ['fixed-pros/x']).slice(0, 1);
const PREMIUM_CONTENT = (idx.clusters[2]?.contentIds || ['bonding/x']).slice(0, 1);

type SeedHighlight = {
  content_id: string;
  exact: string;
  prefix?: string;
  suffix?: string;
  color?: string;
  underline?: boolean;
  cloze_markers?: Array<[number, number]>;
  note?: string;
  label?: 'important' | 'unclear' | 'clinical_pearl';
};

const FREE_HIGHLIGHTS: SeedHighlight[] = [
  {
    content_id: FREE_CONTENT[0],
    exact: 'سمان‌های رزینی به سه دسته‌ی کاملا اچینگ، خوداچ و خودچسب تقسیم می‌شوند',
    prefix: 'به طور کلی ',
    suffix: ' که هر کدام کاربرد خود را دارند.',
    color: 'yellow',
    label: 'important',
    note: 'برای امتحان بورد مهم است.',
    cloze_markers: [[0, 12]],
  },
  {
    content_id: FREE_CONTENT[0],
    exact: 'پیوند به عاج همیشه ضعیف‌تر از پیوند به مینا است',
    prefix: 'باید توجه داشت که ',
    suffix: '.',
    color: 'green',
    label: 'clinical_pearl',
  },
  {
    content_id: FREE_CONTENT[1] || FREE_CONTENT[0],
    exact: 'سندبلاست سطح زیرکونیا پیش از باندینگ ضروری است',
    prefix: '',
    suffix: ' تا گیر میکرومکانیکی ایجاد شود.',
    color: 'blue',
    underline: true,
    label: 'important',
  },
  {
    content_id: FREE_CONTENT_B[0],
    exact: 'پرایمرهای حاوی MDP بهترین دوام باند را فراهم می‌کنند',
    color: 'yellow',
    note: 'MDP = 10-MDP monomer',
  },
];

const PREMIUM_HIGHLIGHTS: SeedHighlight[] = [
  {
    content_id: PREMIUM_CONTENT[0],
    exact: 'هیپوکلریت سدیم استاندارد طلایی شست‌وشوی کانال است',
    color: 'yellow',
    label: 'important',
  },
];

async function upsertUser(
  phone: string,
  tier: 'free' | 'premium',
  seed: number,
): Promise<string> {
  // Remove any previous seed rows for this phone (cascades to highlights,
  // card_state, activity), then create fresh.
  await query('delete from profiles where phone = $1', [phone]);
  const res = await query<{ id: string }>(
    `insert into profiles (phone, display_name, tier)
     values ($1, $2, $3)
     returning id`,
    [phone, generatePseudonym(seed), tier],
  );
  return res.rows[0].id;
}

async function insertHighlight(userId: string, h: SeedHighlight): Promise<void> {
  await withTransaction(async (client) => {
    const hl = await client.query<{ id: string }>(
      `insert into highlights
         (user_id, content_id, exact, prefix, suffix, color, underline, cloze_markers, note, label)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10)
       returning id`,
      [
        userId,
        h.content_id,
        h.exact,
        h.prefix ?? null,
        h.suffix ?? null,
        h.color ?? null,
        h.underline ?? false,
        JSON.stringify(h.cloze_markers ?? []),
        h.note ?? null,
        h.label ?? null,
      ],
    );
    const highlightId = hl.rows[0].id;
    // Every highlight gets its card_state row (box 1, next_review_at null),
    // on every plan, so a premium upgrade never needs a backfill.
    await client.query(
      `insert into card_state (user_id, highlight_id, box, next_review_at)
       values ($1, $2, 1, null)`,
      [userId, highlightId],
    );
    await client.query(
      `insert into user_activity (user_id, action, content_id, meta)
       values ($1, 'highlight_created', $2, $3::jsonb)`,
      [userId, h.content_id, JSON.stringify({ highlight_id: highlightId })],
    );
  });
}

async function main(): Promise<void> {
  console.log('Seeding DentCast Plus dev data...');

  const freeId = await upsertUser(SEED_PHONES[0], 'free', 1);
  for (const h of FREE_HIGHLIGHTS) await insertHighlight(freeId, h);
  await query(
    `insert into user_activity (user_id, action, content_id)
     values ($1, 'article_completed', $2)`,
    [freeId, FREE_CONTENT[0]],
  );

  const premiumId = await upsertUser(SEED_PHONES[1], 'premium', 2);
  for (const h of PREMIUM_HIGHLIGHTS) await insertHighlight(premiumId, h);

  console.log(`  free user   : ${SEED_PHONES[0]}  (${freeId})`);
  console.log(`  premium user: ${SEED_PHONES[1]}  (${premiumId})`);
  console.log('Done. Streak caches are left at 0; run `npm run rebuild-streaks` to compute them.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
