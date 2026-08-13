import { one } from '../db.js';
import { sendCapped } from './notify-policy.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * The referrer's «کسی با کد تو مشترک شد» notice — structurally a copy of
 * pillar-notify.ts (same inFlight-Set / drain shape for tests), but simpler:
 * there is no backfill here, so no "already told them" dedup is needed — the
 * caller only ever invokes this once, from the exact same `seat === null`
 * vantage point (services/payment.ts's settlePayment) that gates the «ستون»
 * welcome, because a referred account can only ever claim a code on its
 * FIRST purchase (services/referrals.ts decision 2.5) and settlePayment's own
 * `status <> 'paid'` guard makes that transition happen at most once.
 *
 * Deliberately CAPPED — not added to notify-policy.ts's UNCAPPED set. This is
 * good news for the referrer, not a reply they are owed, so the daily cap may
 * hold it to اطلاعیه-only on a busy day; the row still lands either way.
 */

const MESSAGE: NotificationMessage = {
  title: 'کسی با کد تو مشترک شد',
  body: 'یک نفر با کد معرفِ تو مشترک شد. ٪۵ اعتبار روی خرید بعدی‌ات نشست؛ سقف مصرف هر خرید ٪۱۰ است.',
  url: '/plus/profile.html#referral',
  tag: 'referral_bonus',
};

/** In-flight sends, so a test's truncate cannot deadlock against one still holding rows. */
const inFlight = new Set<Promise<unknown>>();

/**
 * Fire-and-forget: if `referredUserId` was referred by someone, tell that
 * referrer. Self-contained — the caller does not need to know whether a
 * referral exists at all, only that this settle was this account's first.
 */
export function scheduleReferralNotify(referredUserId: string, now: Date = new Date()): void {
  const p = (async () => {
    const referral = await one<{ referrer_user_id: string }>(
      'select referrer_user_id from referrals where referred_user_id = $1',
      [referredUserId],
    );
    if (!referral) return;
    await sendCapped(referral.referrer_user_id, MESSAGE, 'referral_bonus', now);
  })().catch(() => { /* a notification never breaks a sale */ });
  inFlight.add(p);
  void p.finally(() => inFlight.delete(p));
}

/** Wait for every scheduled notify to finish. For tests and clean shutdown. */
export async function drainReferralNotifies(): Promise<void> {
  while (inFlight.size) await Promise.all([...inFlight]);
}
