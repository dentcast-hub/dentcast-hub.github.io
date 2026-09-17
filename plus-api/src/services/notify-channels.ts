import { one, type Queryable, pool } from '../db.js';
import type { NotificationKind } from '../providers/notifications/types.js';

/**
 * Per-CHANNEL notification preferences — «از کجا برسد».
 *
 * Until 2026-09-16 a reader had one switch («نوتیف‌ها») and whatever it turned
 * on went to EVERY channel they had connected: MultiNotificationSender fans a
 * message out to web push, Bale and Telegram alike, and each sender's only
 * question was "does this user have a destination here". There was no way to
 * say «streak on Bale, articles in the browser», and no way to add a channel
 * that costs money (SMS) without it firing for everyone who had a phone.
 *
 * The preference lives at `profiles.settings.notify_channels`, deliberately a
 * SIBLING of `settings.reminders` and not a key inside it: PATCH /me merges
 * `settings` one level deep, and three writers (profile.js, home-card.js,
 * notif-prompt.js) already send the WHOLE `reminders` object on every toggle —
 * a `channels` key nested under it would be wiped by the first of them.
 *
 *   settings.notify_channels = {
 *     webpush: { new_content: bool, streak: bool },
 *     bale:    { new_content: bool, streak: bool },
 *     sms:     { streak: bool },
 *   }
 *
 * Two defaults, and the asymmetry is the point:
 *   - webpush / bale: an ABSENT key means ON. Every account that exists today
 *     receives on every connected channel, and adding a preference must not
 *     silently switch anyone off.
 *   - sms: an ABSENT key means OFF. It costs money per message, it is the one
 *     channel a reader cannot mute from the notification itself, and it is
 *     premium — so it is opt-IN, by the reader, on the profile, and nowhere
 *     else. See services/streak-reminder.ts for the send itself.
 *
 * Only two kinds are governed here — the two the profile's matrix draws.
 * Everything else the site sends (league, review, support replies, payment
 * results, the founder's broadcast…) is either a reply the reader is owed or
 * news that has no per-channel preference, and passes through untouched.
 * Telegram is not in the matrix and is not governed: it is login-only on the
 * .ir host (api.telegram.org is filtered from the pod), and offering a switch
 * for a channel that does not deliver would be a promise nothing keeps.
 */

export type PrefChannel = 'webpush' | 'bale' | 'sms';
export type PrefKind = 'new_content' | 'streak';

/** Which preference column a notification kind falls under, or null if none. */
export function prefKindOf(kind: NotificationKind): PrefKind | null {
  if (kind === 'article_premium' || kind === 'article_free_digest') return 'new_content';
  if (kind === 'streak') return 'streak';
  return null;
}

function readFlag(settings: unknown, channel: PrefChannel, pref: PrefKind): boolean | undefined {
  const root = settings && typeof settings === 'object'
    ? (settings as Record<string, unknown>).notify_channels
    : undefined;
  const ch = root && typeof root === 'object' ? (root as Record<string, unknown>)[channel] : undefined;
  const v = ch && typeof ch === 'object' ? (ch as Record<string, unknown>)[pref] : undefined;
  return typeof v === 'boolean' ? v : undefined;
}

/**
 * Does this reader want `kind` on `channel`? A kind outside the matrix is
 * always wanted (the preference has nothing to say about it).
 */
export function channelWanted(settings: unknown, channel: PrefChannel, kind: NotificationKind): boolean {
  const pref = prefKindOf(kind);
  if (!pref) return true;
  const flag = readFlag(settings, channel, pref);
  if (flag !== undefined) return flag;
  return channel !== 'sms';
}

/**
 * The same question, asked of the database. Senders call this before looking
 * up their destination; it costs a query only for a governed kind, so the
 * dozen ungoverned kinds pay nothing.
 */
export async function channelWantedFor(
  userId: string,
  channel: PrefChannel,
  kind: NotificationKind,
  client: Queryable = pool,
): Promise<boolean> {
  if (!prefKindOf(kind)) return true;
  const row = await one<{ settings: unknown }>('select settings from profiles where id = $1', [userId], client);
  return channelWanted(row?.settings ?? {}, channel, kind);
}

/**
 * SQL for «this reader turned the streak SMS on», over a `profiles p` row.
 * Mirrors channelWanted(settings, 'sms', 'streak') exactly — including the
 * opt-in default — so the reminder's eligibility query and the admin panel's
 * count cannot disagree with the TypeScript read.
 */
export const SMS_STREAK_WANTED_SQL =
  "coalesce((p.settings->'notify_channels'->'sms'->>'streak')::boolean, false)";
