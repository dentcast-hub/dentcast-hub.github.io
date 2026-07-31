import { config } from '../config.js';
import { query } from '../db.js';
import { dayInTz } from './time.js';
import { sendCapped, inAwakeWindow } from './notify-policy.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * League promotion/demotion notification — PREMIUM, event-driven.
 *
 * The event is week finalization (services/league-finalize.ts), so this is called
 * straight after finalizeDueWeeks() rather than on a schedule of its own. Two
 * things stop that from meaning "a push at midnight":
 *
 *   - the AWAKE WINDOW (09:00-22:00 Tehran). Weeks are finalized at 00:00;
 *     delivering there would wake people up. Outside the window this is a no-op —
 *     nothing is claimed, so nothing is lost — and the morning release sweep at
 *     awakeStartHour announces it. Set the two hours equal to fire always.
 *   - a FRESHNESS guard: only weeks that ended recently. If the container was
 *     down for a fortnight, coming back must not announce ancient results.
 *
 * Only promoted/demoted are announced; 'stayed' is not news. The in-app outcome
 * banner (`outcome_seen`, POST /league/outcome/seen) is untouched and still shows
 * every outcome to every tier — this adds a PUSH for premium, it does not replace
 * anything free users already see.
 *
 * Delivery is claimed (outcome_notified_at) before sending, so an overlapping
 * sweep cannot double-announce and a capped/failed delivery is never retried into
 * a stale push days later.
 */

/** How far back a finalized week may be and still be worth announcing. */
const FRESH_DAYS = 7;

export async function notifyLeagueOutcomes(now: Date = new Date()): Promise<{ notified: number }> {
  if (!inAwakeWindow(now)) return { notified: 0 };

  const today = dayInTz(now, config.streakTimezone);
  const due = await query<{
    id: string;
    user_id: string;
    outcome: 'promoted' | 'demoted';
    final_rank: number | null;
    to_tier: string | null;
  }>(
    `select m.id, m.user_id, m.outcome, m.final_rank, nt.name_fa as to_tier
       from league_members m
       join leagues l on l.id = m.league_id
       join profiles p on p.id = m.user_id
       left join league_tiers nt on nt.id = p.current_tier_id
      where l.status = 'finalized'
        and l.week_end >= ($1::date - $2::int)
        and m.outcome in ('promoted', 'demoted')
        and m.outcome_notified_at is null
        and p.tier = 'premium'
        -- Opt-OUT, reusing the switch the profile page already writes: a user who
        -- turned notifications off must not start getting a new kind instead.
        and coalesce((p.settings->'reminders'->>'streak')::boolean, true) = true
        and (
          exists (select 1 from push_subscriptions s where s.user_id = p.id)
          or p.telegram_id is not null
          or p.bale_id is not null
        )
      order by m.id`,
    [today, FRESH_DAYS],
  );

  let notified = 0;
  for (const m of due.rows) {
    const tier = m.to_tier || 'بالاتر';
    const message: NotificationMessage = m.outcome === 'promoted'
      ? {
        title: 'صعود کردی 🎉',
        body: `هفته را در جایگاه ${m.final_rank ?? '—'} بستی و به لیگ ${tier} رفتی. هفته‌ی تازه شروع شده — جایگاهت را نگه دار.`,
        url: '/plus/',
        tag: 'league_outcome',
      }
      : {
        title: 'دنت‌کست پلاس',
        body: `این هفته به لیگ ${tier} برگشتی. هفته‌ی تازه از صفر شروع شده — جبرانش کن.`,
        url: '/plus/',
        tag: 'league_outcome',
      };

    // Claim first; a dropped (capped) or failed delivery is not retried, so an
    // outcome is announced at most once and never late.
    await query('update league_members set outcome_notified_at = now() where id = $1', [m.id]);
    if (await sendCapped(m.user_id, message, 'league', now)) notified += 1;
  }

  return { notified };
}
