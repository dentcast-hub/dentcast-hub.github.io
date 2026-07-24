import { config } from '../config.js';
import { pool, query, one } from '../db.js';
import { dayInTz } from './time.js';
import { displayStreak } from './streak.js';
import { SCORING_ACTIONS } from './score.js';
import { notifications } from '../providers/registry.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * Daily reactivation nudge for users with NO live streak — the "start your
 * streak" push. Deliberately gentle (once a day, both channels), because
 * over-nudging dormant users gets the bot blocked / push disabled and the channel
 * is then lost for good.
 *
 * Sent to a user when ALL hold:
 *   (a) they have a delivery channel (a push subscription OR a linked Telegram / Bale),
 *   (b) they have NOT explicitly disabled reminders (opt-OUT: streak toggle
 *       !== false — unset counts as "ok to nudge"),
 *   (c) no qualifying action TODAY (Asia/Tehran),
 *   (d) their streak is NOT alive (displayStreak < 1) — a savable streak is the
 *       streak-reminder's job, not this,
 *   (e) they are UNDER the cap: fewer than maxNudges nudges since their LAST real
 *       activity (so a dead account is never harassed; the count resets the
 *       moment they engage), and
 *   (f) they were not already nudged today (dedup, enforces once-a-day).
 *
 * The moment a user engages, their streak becomes >= 1 and they leave this cohort
 * entirely — falling back to the normal streak / new-article notifications.
 *
 * Deduped per Tehran day via an appended `reactivation_sent` marker — a
 * NON-qualifying, NON-scoring action, so it never touches streak or score.
 */

// Rotating copy so the nudge never reads robotic; each user cycles through these
// by how many nudges they've had since last engaging.
const MESSAGES: Array<{ title: string; body: string }> = [
  {
    title: 'دنت‌کست پلاس',
    body: 'امروز فقط ۵ دقیقه وقت بگذار و یک مقاله‌ی کوتاه بخوان 🔥 در یادگیری، تداوم از حجم مهم‌تر است — همین قدمِ کوچکِ هر روزه تو را جلو می‌برد.',
  },
  {
    title: 'دنت‌کست پلاس',
    body: 'شعله‌ات هنوز روشن نشده 🔥 یک مقاله‌ی کوتاهِ امروز، و استریکت شروع می‌شود.',
  },
  {
    title: 'دنت‌کست پلاس',
    body: 'یک نکته‌ی بالینیِ تازه منتظرِ توست 🦷 چند دقیقه بخوان و امروزت را فعال کن.',
  },
];

export async function runReactivationNudges(now: Date = new Date()): Promise<{ nudged: number }> {
  const tz = config.streakTimezone;
  const today = dayInTz(now, tz);

  const candidates = await query<{ id: string; current_streak: number; last_active_day: string | null }>(
    `select p.id, p.current_streak, p.last_active_day
       from profiles p
      where coalesce((p.settings->'reminders'->>'streak')::boolean, true) = true      -- (b) opt-out
        and (p.last_active_day is null or p.last_active_day <> $1::date)               -- (c) not active today
        and (                                                                          -- (a) has a channel
          exists (select 1 from push_subscriptions s where s.user_id = p.id)
          or p.telegram_id is not null
          or p.bale_id is not null
        )
        and not exists (                                                               -- (f) not nudged today
          select 1 from user_activity a
           where a.user_id = p.id and a.action = 'reactivation_sent'
             and (a.created_at at time zone $2)::date = $1::date
        )`,
    [today, tz],
  );

  let nudged = 0;
  for (const u of candidates.rows) {
    // (d) A still-alive streak belongs to the streak reminder, not here.
    const alive = await displayStreak(pool, u.id, u, today);
    if (alive >= 1) continue;

    // (e) Cap the nudges since the user's last real activity. Resets on engagement.
    const cntRow = await one<{ n: number }>(
      `select count(*)::int as n from user_activity
        where user_id = $1 and action = 'reactivation_sent'
          and created_at > coalesce(
            (select max(created_at) from user_activity
              where user_id = $1 and action = any($2)),
            'epoch'::timestamptz)`,
      [u.id, SCORING_ACTIONS],
    );
    const nudgesSoFar = cntRow?.n ?? 0;
    if (nudgesSoFar >= config.reactivation.maxNudges) continue;

    const copy = MESSAGES[nudgesSoFar % MESSAGES.length];
    const message: NotificationMessage = { ...copy, url: '/plus/', tag: 'reactivation' };

    try {
      // Claim first (append the dedup marker), then deliver best-effort.
      await query(
        `insert into user_activity (user_id, action, meta) values ($1, 'reactivation_sent', $2::jsonb)`,
        [u.id, JSON.stringify({ day: today, n: nudgesSoFar })],
      );
      await notifications.send(u.id, message, 'reminder');
      nudged += 1;
    } catch {
      /* best-effort: a missing destination / dead device never fails the batch */
    }
  }
  return { nudged };
}
