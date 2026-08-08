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

/**
 * What premium actually opens, named in the push itself. Without it the winner
 * reads "you got 3 days of premium" and has no idea what that buys — the whole
 * point of the prize is to make them USE the features, so naming them is the
 * message, not decoration.
 *
 * TITLES ONLY, no descriptions: a lock-screen notification collapses to about
 * two lines, so the full list (which the dashboard banner does show) would be
 * truncated mid-sentence and read as broken. The win and the duration come
 * first for the same reason — they survive the truncation.
 *
 * Mirrors PREMIUM_FEATURES in plus/js/dashboard.js, which is the banner's list.
 * test/premium-prize.test.ts reads that file and fails if the two drift apart.
 */
export const PREMIUM_FEATURE_TITLES = [
  'برای مرور امروز',
  'مسیر یادگیری',
  'کالکشن‌ها',
  'قطب‌نمای مطالعه',
  'دستیار هوشمند',
  'دفترچه‌ی هایلایت‌ها',
];

/** "الف، ب و ج" — a Persian list, with the final item joined by "و". */
function faList(items: string[]): string {
  if (items.length < 2) return items[0] ?? '';
  return items.slice(0, -1).join('، ') + ' و ' + items[items.length - 1];
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number): string => String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);

export async function notifyPremiumPrizes(now: Date = new Date()): Promise<{ notified: number }> {
  if (!inAwakeWindow(now)) return { notified: 0 };

  const today = dayInTz(now, config.streakTimezone);
  // tier_order comes along because the prize is no longer one length for
  // everybody (0033): the top tier's champion wins a longer one, and a push that
  // named the wrong number would break the promise on the day it ran out. It is
  // a LEFT join — a grant whose league row is somehow missing still gets its
  // notification, with the ordinary wording.
  const due = await query<{
    id: string; user_id: string; granted_at: string; expires_at: string; tier_order: number | null;
  }>(
    `select g.id, g.user_id, g.granted_at, g.expires_at, t.tier_order
       from premium_grants g
       join profiles p on p.id = g.user_id
       left join league_members lm on lm.user_id = g.user_id and lm.week_start = g.week_start
       left join leagues l on l.id = lm.league_id
       left join league_tiers t on t.id = l.tier_id
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

  // The length is read off the GRANT, never from a literal and no longer from
  // league_config either. This copy said "one week" for a while after the prize
  // became three days — a promise the system then broke on day four, which is
  // worse than saying nothing; since 0033 the same drift is possible within a
  // single week, because the top tier's prize is longer than everyone else's.
  // The two timestamps are the thing that actually decides when premium ends, so
  // they are the only honest source for a sentence about how long it lasts (the
  // dashboard banner has always computed it this way — plus/js/dashboard.js).
  //
  // And "top of the league" became "top of your group": the user can see their
  // group on screen, so it is both accurate AND the more meaningful of the two.
  const cfg = await getLeagueConfig();

  let notified = 0;
  for (const g of due.rows) {
    const days = Math.round(
      (new Date(g.expires_at).getTime() - new Date(g.granted_at).getTime()) / 86_400_000,
    );
    // The highest active tier has no promotion to win, so first place there is
    // the end of the ladder rather than a step on it. Naming that is the whole
    // point of the longer prize — a champion who reads the same sentence as
    // everybody else has no way to know they won something different.
    const isChampion = g.tier_order != null && g.tier_order >= cfg.max_active_tier_order;
    const message: NotificationMessage = {
      title: isChampion ? 'قهرمان شدی 🏆' : 'برنده شدی 🎉',
      body: (isChampion
        ? `اولِ بالاترین لیگِ دنت‌کست شدی — ${toFa(days)} روز پرمیوم مهمانِ ما هستی: `
        : `نفر اولِ گروهت شدی — ${toFa(days)} روز پرمیوم مهمانِ ما هستی: `)
        + `${faList(PREMIUM_FEATURE_TITLES)}.`,
      url: '/plus/',
      tag: 'premium_prize',
    };
    // Claim first; a dropped (capped) or failed delivery is not retried.
    await query('update premium_grants set notified_at = now() where id = $1', [g.id]);
    if (await sendCapped(g.user_id, message, 'premium_prize', now)) notified += 1;
  }
  return { notified };
}
