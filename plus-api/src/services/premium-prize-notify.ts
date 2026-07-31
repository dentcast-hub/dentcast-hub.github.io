import { config } from '../config.js';
import { getLeagueConfig } from './league-config.js';
import { query } from '../db.js';
import { dayInTz } from './time.js';
import { sendCapped, inAwakeWindow } from './notify-policy.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * Premium-prize instant notification — same shape as league-notify.ts's
 * notifyLeagueOutcomes: gated by the awake window (grants themselves are NOT
 * held — profiles.tier flips instantly in premium-prize.ts — only the push
 * waits for a humane hour), claim-before-send via premium_grants.notified_at
 * so an overlapping sweep cannot double-announce.
 */

const FRESH_DAYS = 7;

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number): string => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

export async function notifyPremiumPrizes(now: Date = new Date()): Promise<{ notified: number }> {
  if (!inAwakeWindow(now)) return { notified: 0 };

  const today = dayInTz(now, config.streakTimezone);
  const due = await query<{ id: string; user_id: string }>(
    `select g.id, g.user_id
       from premium_grants g
       join profiles p on p.id = g.user_id
      where g.granted_at >= ($1::date - $2::int)
        and g.notified_at is null
        and coalesce((p.settings->'reminders'->>'streak')::boolean, true) = true
        and (
          exists (select 1 from push_subscriptions s where s.user_id = p.id)
          or p.telegram_id is not null
          or p.bale_id is not null
        )
      order by g.id`,
    [today, FRESH_DAYS],
  );

  // The length comes from league_config, never a literal. This copy said "one
  // week" for a while after the prize became three days — a promise the system
  // then broke on day four, which is worse than saying nothing. And "top of the
  // league" became "top of your group": the user can see their group of 8 on
  // screen, so it is both accurate now AND the more meaningful of the two.
  const cfg = await getLeagueConfig();
  const message: NotificationMessage = {
    title: 'برنده شدی 🎉',
    body: `نفر اولِ گروهت شدی — ${toFa(cfg.prize_days)} روز پرمیوم مهمانِ ما هستی.`,
    url: '/plus/',
    tag: 'premium_prize',
  };

  let notified = 0;
  for (const g of due.rows) {
    // Claim first; a dropped (capped) or failed delivery is not retried.
    await query('update premium_grants set notified_at = now() where id = $1', [g.id]);
    if (await sendCapped(g.user_id, message, 'premium_prize', now)) notified += 1;
  }
  return { notified };
}
