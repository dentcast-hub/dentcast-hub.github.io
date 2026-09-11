import { config } from '../config.js';
import { one, query } from '../db.js';
import { getPathways, type Pathway } from '../pathways.js';
import { sendCapped } from './notify-policy.js';

/**
 * WHO IS NEAR THE END OF A PATHWAY — the founder-facing half of the completion
 * certificate.
 *
 * The certificate plan is deliberately lazy: no exam is written until a real
 * person is close to earning one. That only works if something tells us they
 * are close, and until now nothing could. Pathway progress is DERIVED
 * (`pathways.ts` computeProgress) from the reader's own consumption, and the
 * `user_pathways` row is a CACHE that routes/pathways.ts writes back only when
 * the reader happens to open the pathway page. So a reader can go from step 2
 * to step 112 without a single row changing anywhere — the progress exists, but
 * only as a number nobody has computed yet. This module computes it.
 *
 * Four rules the rest of the file depends on.
 *
 * **The measure is `completed_steps`, never `current_step`.** `current_step` is
 * the "resume here" cursor and stops at the FIRST gap, so somebody who skipped
 * step 2 and read the other 114 has `current_step = 1`. As a reading cursor
 * that is right; as an answer to "how much is left" it is off by a hundred.
 * What decides whether an exam is needed is how many of the pathway's items are
 * still unread, anywhere in the list.
 *
 * **Bundles are excluded.** A bundle is 5-8 steps ("just the core"), and a
 * certificate for finishing six articles would spend the credibility of the one
 * that means something. Only full pathways (kind absent) stand here.
 *
 * **Progress can go BACKWARDS, and that is normal.** Publishing step 5.6 places
 * new content into existing pathways, so a reader who was at 0 remaining on
 * Tuesday is at 2 remaining on Wednesday through no act of their own. Hence the
 * alert markers are a HIGH-WATER MARK (the same shape achievement-sync.ts uses
 * for badges): once we have said "this person is near the end", a pathway that
 * grows under them never says it again.
 *
 * **The alert is one message per RUN, not one per person.** The first sweep
 * after this ships will find everybody who is ALREADY near the end — that is
 * precisely the news the founder does not currently have — and fifty separate
 * notifications is how that news gets muted instead of read.
 */

export type PathwayAlertLevel = 'near' | 'done';

/** 'done' supersedes 'near': blowing straight past the threshold announces once. */
const RANK: Record<PathwayAlertLevel, number> = { near: 1, done: 2 };

/** The marker action. Written on the READER's row — it is a fact about them. */
const ACTION = 'pathway_milestone';

export interface PathwayStanding {
  user_id: string;
  display_name: string;
  tier: string;
  pathway_id: string;
  title_fa: string;
  total_steps: number;
  completed_steps: number;
  /** Steps of this pathway the reader has not consumed. 0 = pathway finished. */
  remaining: number;
  enrolled: boolean;
  started_at: Date | null;
  /** Highest level already announced to the founder, or null. */
  alerted: PathwayAlertLevel | null;
}

/** Full pathways only — see the bundle rule above. */
function fullPathways(): Pathway[] {
  return getPathways().filter((p) => p.kind !== 'bundle');
}

/**
 * Every (reader, pathway) pair the reader has made any progress on, richest
 * first (fewest steps remaining).
 *
 * ONE query for everybody's consumption rather than one per user: the set is
 * bounded twice over — only content that is a step of some pathway is selected,
 * and only readers who consumed at least one such page come back at all.
 */
export async function pathwayStandings(): Promise<PathwayStanding[]> {
  const pathways = fullPathways();
  if (pathways.length === 0) return [];

  const stepIds = [...new Set(pathways.flatMap((p) => p.steps.map((s) => s.content_id)))];

  // Same union as consumption.ts's getConsumedContentIds, for every user at
  // once and narrowed to the content that can possibly matter here.
  const consumed = await query<{ user_id: string; content_id: string }>(
    `select distinct user_id, content_id from (
       select user_id, content_id from highlights where content_id = any($1)
       union
       select user_id, content_id from user_activity
        where action in ('article_completed','episode_listened') and content_id = any($1)
     ) t`,
    [stepIds],
  );
  if (consumed.rows.length === 0) return [];

  const byUser = new Map<string, Set<string>>();
  for (const row of consumed.rows) {
    let set = byUser.get(row.user_id);
    if (!set) { set = new Set(); byUser.set(row.user_id, set); }
    set.add(row.content_id);
  }

  const userIds = [...byUser.keys()];
  const profiles = await query<{ id: string; display_name: string; tier: string }>(
    `select id, display_name, tier from profiles where id = any($1)`,
    [userIds],
  );
  const profileOf = new Map(profiles.rows.map((p) => [p.id, p]));

  const enrollments = await query<{ user_id: string; pathway_id: string; started_at: Date }>(
    `select user_id, pathway_id, started_at from user_pathways where user_id = any($1)`,
    [userIds],
  );
  const enrolledAt = new Map(enrollments.rows.map((e) => [`${e.user_id}:${e.pathway_id}`, e.started_at]));

  const markers = await query<{ user_id: string; pathway_id: string; level: string }>(
    `select user_id, meta->>'pathway_id' as pathway_id, meta->>'level' as level
       from user_activity
      where action = $1 and user_id = any($2)`,
    [ACTION, userIds],
  );
  const alertedAt = new Map<string, PathwayAlertLevel>();
  for (const m of markers.rows) {
    const key = `${m.user_id}:${m.pathway_id}`;
    const level = m.level as PathwayAlertLevel;
    if (!RANK[level]) continue;
    const prev = alertedAt.get(key);
    if (!prev || RANK[level] > RANK[prev]) alertedAt.set(key, level);
  }

  const out: PathwayStanding[] = [];
  for (const [userId, set] of byUser) {
    const profile = profileOf.get(userId);
    if (!profile) continue; // a deleted account whose activity rows outlived it
    for (const p of pathways) {
      let completed = 0;
      for (const s of p.steps) if (set.has(s.content_id)) completed += 1;
      if (completed === 0) continue;
      const key = `${userId}:${p.id}`;
      out.push({
        user_id: userId,
        display_name: profile.display_name,
        tier: profile.tier,
        pathway_id: p.id,
        title_fa: p.title_fa,
        total_steps: p.steps.length,
        completed_steps: completed,
        remaining: p.steps.length - completed,
        enrolled: enrolledAt.has(key),
        started_at: enrolledAt.get(key) ?? null,
        alerted: alertedAt.get(key) ?? null,
      });
    }
  }

  // Fewest remaining first — the order the question is actually asked in.
  // Ties broken by how much of the pathway is behind them, so a near-finished
  // 116-step pathway outranks a near-finished 17-step one.
  out.sort((a, b) => a.remaining - b.remaining || b.completed_steps - a.completed_steps);
  return out;
}

/** The level a standing qualifies for right now, or null. */
export function levelFor(s: PathwayStanding, nearRemaining: number): PathwayAlertLevel | null {
  if (s.remaining === 0) return 'done';
  if (s.remaining <= nearRemaining) return 'near';
  return null;
}

/**
 * Whether this standing is the founder's business.
 *
 * ENROLLMENT is the real signal — the reader pressed a button saying they are
 * doing this pathway. A premium reader who never enrolled still counts once
 * they are this close: consuming 112 of 116 steps is not something that happens
 * by accident, and the certificate is about what they read, not what they
 * clicked.
 *
 * A FREE reader is excluded from the alert and from nothing else. They cannot
 * open a pathway page at all (routes/pathways.ts is requirePremium), so their
 * progress is genuinely incidental and alerting on it would be noise. They stay
 * in the admin table, with their tier on the row, because "a free reader is
 * three steps from finishing" is a fact worth seeing — just not one worth
 * waking somebody for.
 */
export function alertable(s: PathwayStanding): boolean {
  return s.enrolled || s.tier !== 'free';
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number | string): string => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

/** How many crossings to name before falling back to a count. */
const NAME_LIMIT = 8;

export interface PathwayAlertCrossing {
  user_id: string;
  display_name: string;
  pathway_id: string;
  title_fa: string;
  level: PathwayAlertLevel;
  remaining: number;
  total_steps: number;
}

function messageFor(crossings: PathwayAlertCrossing[]): { title: string; body: string } {
  const done = crossings.filter((c) => c.level === 'done');
  const near = crossings.filter((c) => c.level === 'near');

  const title = done.length
    ? `${toFa(done.length)} نفر مسیر را تمام کرد`
    : `${toFa(near.length)} نفر به پایان مسیر نزدیک شد`;

  const line = (c: PathwayAlertCrossing): string => (c.level === 'done'
    ? `${c.display_name} — «${c.title_fa}» تمام شد (${toFa(c.total_steps)} قدم)`
    : `${c.display_name} — «${c.title_fa}»، ${toFa(c.remaining)} قدم مانده`);

  const named = [...done, ...near].slice(0, NAME_LIMIT).map(line);
  const rest = crossings.length - named.length;
  const body = named.join('\n')
    + (rest > 0 ? `\n… و ${toFa(rest)} نفر دیگر` : '')
    + '\nفهرست کامل در /admin، بخش «مسیرها».';

  return { title, body };
}

/** Who to tell. Falls back to the support alert phone — see the config note. */
async function alertTarget(): Promise<string | null> {
  const phone = config.pathwayAlert.alertPhone || config.support.alertPhone;
  if (!phone) return null;
  const row = await one<{ id: string }>('select id from profiles where phone = $1', [phone]);
  return row?.id ?? null;
}

export interface PathwayAlertRun {
  /** Everything that crossed a line on this run (markers written for each). */
  crossings: PathwayAlertCrossing[];
  /** Whether the founder's notification actually went out. */
  notified: boolean;
}

/**
 * Find the crossings, record them, tell the founder once.
 *
 * Markers are written even when there is nobody to notify. The marker says
 * "this has been observed", and an unconfigured alert phone must not turn the
 * next run into a duplicate announcement of the same week-old news — exactly
 * the reasoning payment-cap-alert.ts's claim-before-send uses.
 *
 * Never throws: this runs off a scheduler and is called by an admin button, and
 * a notification problem must not look like a data problem.
 */
export async function runPathwayAlerts(now: Date = new Date()): Promise<PathwayAlertRun> {
  const standings = await pathwayStandings();
  const threshold = config.pathwayAlert.nearRemaining;
  const crossings: PathwayAlertCrossing[] = [];

  for (const s of standings) {
    if (!alertable(s)) continue;
    const level = levelFor(s, threshold);
    if (!level) continue;
    if (s.alerted && RANK[s.alerted] >= RANK[level]) continue;
    crossings.push({
      user_id: s.user_id,
      display_name: s.display_name,
      pathway_id: s.pathway_id,
      title_fa: s.title_fa,
      level,
      remaining: s.remaining,
      total_steps: s.total_steps,
    });
  }

  if (crossings.length === 0) return { crossings, notified: false };

  for (const c of crossings) {
    await query(
      `insert into user_activity (user_id, action, meta) values ($1, $2, $3)`,
      [c.user_id, ACTION, JSON.stringify({
        pathway_id: c.pathway_id,
        level: c.level,
        remaining: c.remaining,
        total_steps: c.total_steps,
      })],
    );
  }

  const { title, body } = messageFor(crossings);
  // The console line is the channel that always exists, same doctrine as the
  // capacity alert: an unconfigured phone must not make this silent.
  // eslint-disable-next-line no-console
  console.log(`[pathway-alert] ${title} — ${crossings.map((c) => `${c.pathway_id}:${c.level}`).join(', ')}`);

  const userId = await alertTarget();
  if (!userId) return { crossings, notified: false };

  // 'system' — the founder-broadcast kind, exempt from the daily cap. This is
  // aimed at us, not at a reader, and it must not compete with their nudges.
  const notified = await sendCapped(
    userId, { title, body, url: '/admin', tag: 'pathway_alert' }, 'system', now,
  );
  return { crossings, notified };
}
