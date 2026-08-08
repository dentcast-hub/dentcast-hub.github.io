import { sendCapped } from './notify-policy.js';
import { pillarSeat, isPillarSeat } from './pillar.js';
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
 * In-flight welcomes, so a test's truncate cannot deadlock against a send
 * still holding rows — same shape and same reason as drainAchievementSyncs.
 */
const inFlight = new Set<Promise<unknown>>();

/** Fire-and-forget: check the freshly-settled ledger, thank the seat-holder. */
export function schedulePillarWelcome(userId: string, now: Date = new Date()): void {
  const p = (async () => {
    const seat = await pillarSeat(userId);
    if (!isPillarSeat(seat)) return;
    await sendCapped(userId, MESSAGE, 'pillar_seat', now, { inbox: false });
    // The wall's own machinery writes the اطلاعیه row and queues the
    // celebration; poking it here means both exist by the time the reader
    // lands back on the dashboard, not after their next highlight.
    scheduleAchievementSync(userId);
  })().catch(() => { /* gratitude never breaks a sale */ });
  inFlight.add(p);
  void p.finally(() => inFlight.delete(p));
}

/** Wait for every scheduled welcome to finish. For tests and clean shutdown. */
export async function drainPillarWelcomes(): Promise<void> {
  while (inFlight.size) await Promise.all([...inFlight]);
}
