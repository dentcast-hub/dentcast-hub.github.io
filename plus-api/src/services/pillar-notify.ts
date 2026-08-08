import { one } from '../db.js';
import { sendCapped } from './notify-policy.js';
import { pillarSeat, isPillarSeat, pillarRoster } from './pillar.js';
import { scheduleAchievementSync } from './achievement-sync.js';
import type { NotificationMessage } from '../providers/notifications/types.js';

/**
 * The «ستون» welcome — the founder's personal thank-you, delivered the moment
 * the seat is minted.
 *
 * Called fire-and-forget from settlePayment, and ONLY when the settling
 * payment was the account's first (the caller saw a null seat before the
 * settle). The seat is re-derived here, after the ledger moved, through the
 * same services/pillar.ts every other reader uses: if the fiftieth-first seat
 * went in the race between two first purchases, this quietly says nothing —
 * a person must never be thanked for a seat they did not get.
 *
 * Two deliberate departures from the 'achievement' kind's in-app-only rule,
 * both argued at the kind's own definition: this one travels (the reader is
 * returning from a bank redirect, not sitting on a calm surface), and it is
 * uncapped (once per lifetime cannot pester). It goes out with inbox:false —
 * the اطلاعیه row for the badge belongs to achievement-sync, which this file
 * pokes so that row and the celebration card land now rather than on the
 * reader's next unrelated write.
 */

const MESSAGE: NotificationMessage = {
  title: 'تو ستون شدی',
  body: 'وقتی هنوز هیچ‌چیز معلوم نبود، تو پای دنت‌کست ایستادی. نشان «ستون» از همین حالا '
    + 'روی پروفایلت است و هر تمدیدِ اشتراکت، در هر قیمتی و برای همیشه، بیست درصد '
    + 'ارزان‌تر تمام می‌شود. ممنون که ستون شدی.',
  url: '/plus/profile.html',
  tag: 'pillar_seat',
};

/**
 * Has this account ever been welcomed? A lifetime check, not per-day: the
 * welcome is once ever, and this one predicate is what makes the settle path
 * and the backfill unable to double-thank however they overlap.
 */
async function alreadyWelcomed(userId: string): Promise<boolean> {
  const row = await one<{ x: number }>(
    "select 1 as x from notification_log where user_id = $1 and kind = 'pillar_seat' limit 1",
    [userId],
  );
  return !!row;
}

/**
 * Thank one seat-holder, once ever. Returns true when the welcome actually
 * went out this call.
 */
async function sendPillarWelcome(userId: string, now: Date): Promise<boolean> {
  if (await alreadyWelcomed(userId)) return false;
  await sendCapped(userId, MESSAGE, 'pillar_seat', now, { inbox: false });
  // The wall's own machinery writes the اطلاعیه row and queues the
  // celebration; poking it here means both exist by the time the reader
  // lands back on the dashboard, not after their next highlight.
  scheduleAchievementSync(userId);
  return true;
}

/**
 * In-flight welcomes, so a test's truncate cannot deadlock against a send
 * still holding rows — same shape and same reason as drainAchievementSyncs.
 */
const inFlight = new Set<Promise<unknown>>();

/** Fire-and-forget: check the freshly-settled ledger, thank the seat-holder. */
export function schedulePillarWelcome(userId: string, now: Date = new Date()): void {
  const p = (async () => {
    const seat = await pillarSeat(userId);
    if (!isPillarSeat(seat)) return;
    await sendPillarWelcome(userId, now);
  })().catch(() => { /* gratitude never breaks a sale */ });
  inFlight.add(p);
  void p.finally(() => inFlight.delete(p));
}

/**
 * The retroactive half (founder's decision, 2026-08-08): the seats minted
 * BEFORE the welcome existed deserve the same message. Walks the roster and
 * thanks anyone never thanked; the lifetime predicate above makes it safe to
 * run any number of times, and safe alongside a settle happening mid-walk.
 * Triggered by POST /admin/pillar/welcome, deliberately manual: the founder
 * picks the hour a batch of phones buzzes, the way the broadcast form does.
 */
export async function pillarWelcomeBackfill(
  now: Date = new Date(),
): Promise<{ holders: number; welcomed: number; already: number }> {
  const roster = await pillarRoster();
  let welcomed = 0;
  for (const h of roster.holders) {
    // Serial and per-holder caught, like deliverBroadcast: one dead device
    // must not cost the rest of the roster their thank-you.
    try {
      if (await sendPillarWelcome(h.user_id, now)) welcomed += 1;
    } catch { /* skip this holder; the next run's predicate retries them */ }
  }
  return { holders: roster.holders.length, welcomed, already: roster.holders.length - welcomed };
}

/** Wait for every scheduled welcome to finish. For tests and clean shutdown. */
export async function drainPillarWelcomes(): Promise<void> {
  while (inFlight.size) await Promise.all([...inFlight]);
}
