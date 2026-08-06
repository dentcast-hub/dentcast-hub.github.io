import { config } from './config.js';
import { runFreeDigest, runPremiumBacklog } from './services/article-notify.js';
import { runStreakReminders } from './services/streak-reminder.js';
import { runReactivationNudges } from './services/reactivation.js';
import { finalizeDueWeeks } from './services/league-finalize.js';
import { notifyLeagueOutcomes } from './services/league-notify.js';
import { grantWeeklyPrizes, expirePremiumPrizes } from './services/premium-prize.js';
import { notifyPremiumPrizes } from './services/premium-prize-notify.js';
import { runReviewReminders } from './services/review-notify.js';
import { attributeStrongSignals } from './services/assistant-learning.js';
import { sweepExpiredSubscriptions } from './services/subscription.js';
import { checkCapacityAlert } from './services/payment-cap-alert.js';
import { runSubscriptionReminders } from './services/subscription-reminder.js';
import { reconcilePendingPayments } from './services/payment-reconcile.js';

/**
 * Daily free-digest scheduler. Fires runFreeDigest() at freeDigestHour:00 in the
 * streak timezone (Asia/Tehran) and reschedules after each run. Kept out of
 * buildServer() so tests never spawn timers; the digest logic itself is a plain
 * function tested directly.
 *
 * We work off the timezone WALL CLOCK (via Intl) rather than a fixed UTC offset,
 * so it stays correct regardless of the host clock's zone. Iran has no DST, but
 * this also survives any future change.
 */

function secondsIntoDayInTz(now: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0');
  return get('hour') * 3600 + get('minute') * 60 + get('second');
}

/** Milliseconds from `now` until the next occurrence of `hour`:00:00 in `tz`. */
export function msUntilNextRun(now: Date, hour: number, tz: string): number {
  const nowSec = secondsIntoDayInTz(now, tz);
  const targetSec = hour * 3600;
  let deltaSec = targetSec - nowSec;
  if (deltaSec <= 0) deltaSec += 86_400; // already past today -> tomorrow
  return deltaSec * 1000 - now.getMilliseconds();
}

/** Start the scheduler. Returns a stop() that cancels the pending timer. */
export function startArticleScheduler(): () => void {
  let timer: NodeJS.Timeout;

  const schedule = () => {
    const delay = msUntilNextRun(new Date(), config.articleNotify.freeDigestHour, config.streakTimezone);
    timer = setTimeout(() => {
      void runFreeDigest(new Date())
        .then((r) => {
          if (r.articles > 0) {
            // eslint-disable-next-line no-console
            console.log(`[article-digest] sent ${r.articles} article(s) to ${r.recipients} free user(s)`);
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[article-digest] run failed', err);
        })
        .finally(schedule); // reschedule for the next day regardless of outcome
    }, delay);
    // Do not keep the process alive solely for this timer.
    if (typeof timer.unref === 'function') timer.unref();
  };

  schedule();
  return () => clearTimeout(timer);
}

/**
 * Start the daily streak-reminder scheduler. Fires runStreakReminders() at
 * streakReminder.hour:00 (Asia/Tehran) and reschedules after each run. Same
 * timezone-wall-clock + unref pattern as the article digest above.
 */
export function startStreakReminderScheduler(): () => void {
  let timer: NodeJS.Timeout;

  const schedule = () => {
    const delay = msUntilNextRun(new Date(), config.streakReminder.hour, config.streakTimezone);
    timer = setTimeout(() => {
      void runStreakReminders(new Date())
        .then((r) => {
          if (r.reminded > 0) {
            // eslint-disable-next-line no-console
            console.log(`[streak-reminder] reminded ${r.reminded} user(s)`);
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[streak-reminder] run failed', err);
        })
        .finally(schedule);
    }, delay);
    if (typeof timer.unref === 'function') timer.unref();
  };

  schedule();
  return () => clearTimeout(timer);
}

/**
 * Start the daily league-finalization check. Runs at 00:00 Asia/Tehran and
 * finalizes any week whose groups have closed (week_end < today). Daily (not
 * weekly) so a missed run self-heals the next day; finalizeDueWeeks is idempotent.
 * Same timezone-wall-clock + unref pattern as the others.
 *
 * Also drives the weekly premium prize: grantWeeklyPrizes() flips a winner's
 * profiles.tier the INSTANT their week finalizes (never held for the awake
 * window — only the push about it waits, exactly like promotion/demotion
 * already works), and expirePremiumPrizes() reverts anyone whose prize_days are
 * up. Both are cheap idempotent daily re-scans, same self-healing shape as
 * finalizeDueWeeks itself.
 *
 * The expiry sweep ALSO runs once at startup. It is the only thing that ever
 * reverts an expired prize — nothing expires lazily on read, so /me would keep
 * answering `premium` — and this process is deployed by hand. A deploy that
 * happens to straddle 00:00 Tehran would otherwise skip that night's sweep
 * entirely and leave every winner premium until the next midnight.
 */
export function startLeagueScheduler(): () => void {
  let timer: NodeJS.Timeout;

  void expirePremiumPrizes(new Date()).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[premium-prize] boot expiry sweep failed', err);
  });

  const schedule = () => {
    const delay = msUntilNextRun(new Date(), 0, config.streakTimezone); // 00:00 Tehran
    timer = setTimeout(() => {
      void finalizeDueWeeks(new Date())
        .then(async (r) => {
          if (r.weeks > 0) {
            // eslint-disable-next-line no-console
            console.log(`[league] finalized ${r.weeks} week(s): +${r.promotions} promoted, -${r.demotions} demoted`);
          }
          const prizes = await grantWeeklyPrizes(new Date());
          if (prizes.granted > 0) {
            // eslint-disable-next-line no-console
            console.log(`[premium-prize] granted ${prizes.granted} week-long prize(s)`);
          }
          await expirePremiumPrizes(new Date());
          // Announce the moment they exist. At the default 00:00 run this is a
          // no-op (outside the awake window) and the morning sweep below sends
          // them at 09:00; it matters for any finalize inside the window.
          await notifyLeagueOutcomes(new Date());
          await notifyPremiumPrizes(new Date());
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[league] finalization run failed', err);
        })
        .finally(schedule);
    }, delay);
    if (typeof timer.unref === 'function') timer.unref();
  };

  schedule();
  return () => clearTimeout(timer);
}

/**
 * Morning release sweep for everything the awake window held overnight, at
 * awakeStartHour (09:00 Tehran): premium pushes for articles published after
 * 22:00, and league outcomes from the 00:00 finalization. Also the self-heal path
 * if the container was down when the event happened. No-op when nothing is held,
 * and idempotent — each article and each membership is claimed exactly once.
 *
 * The two run in sequence, not in parallel, so a user who has both waiting gets
 * them in a predictable order rather than racing for the same daily-cap slots.
 */
export function startHeldNotificationsScheduler(): () => void {
  let timer: NodeJS.Timeout;

  const schedule = () => {
    const delay = msUntilNextRun(new Date(), config.notify.awakeStartHour, config.streakTimezone);
    timer = setTimeout(() => {
      void (async () => {
        const articles = await runPremiumBacklog(new Date());
        if (articles.articles > 0) {
          // eslint-disable-next-line no-console
          console.log(`[article-premium] released ${articles.articles} held article(s) to ${articles.recipients} premium user(s)`);
        }
        const league = await notifyLeagueOutcomes(new Date());
        if (league.notified > 0) {
          // eslint-disable-next-line no-console
          console.log(`[league-notify] announced ${league.notified} outcome(s)`);
        }
        const prizeNotified = await notifyPremiumPrizes(new Date());
        if (prizeNotified.notified > 0) {
          // eslint-disable-next-line no-console
          console.log(`[premium-prize] announced ${prizeNotified.notified} prize(s)`);
        }
      })()
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[held-notifications] run failed', err);
        })
        .finally(schedule);
    }, delay);
    if (typeof timer.unref === 'function') timer.unref();
  };

  schedule();
  return () => clearTimeout(timer);
}

/**
 * Start the daily review-reminder scheduler (premium users with due Leitner
 * cards). Fires at reviewReminder.hour (09:00 Tehran) — a card's due-ness has no
 * event to hang on, so it gets the same daily treatment as the other reminders.
 */
export function startReviewReminderScheduler(): () => void {
  let timer: NodeJS.Timeout;

  const schedule = () => {
    const delay = msUntilNextRun(new Date(), config.reviewReminder.hour, config.streakTimezone);
    timer = setTimeout(() => {
      void runReviewReminders(new Date())
        .then((r) => {
          if (r.reminded > 0) {
            // eslint-disable-next-line no-console
            console.log(`[review-reminder] reminded ${r.reminded} premium user(s)`);
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[review-reminder] run failed', err);
        })
        .finally(schedule);
    }, delay);
    if (typeof timer.unref === 'function') timer.unref();
  };

  schedule();
  return () => clearTimeout(timer);
}

/**
 * Start the daily reactivation-nudge scheduler (users with no live streak).
 * Fires runReactivationNudges() at reactivation.hour:00 (Asia/Tehran) and
 * reschedules. Same timezone-wall-clock + unref pattern as the others.
 */
export function startReactivationScheduler(): () => void {
  let timer: NodeJS.Timeout;

  const schedule = () => {
    const delay = msUntilNextRun(new Date(), config.reactivation.hour, config.streakTimezone);
    timer = setTimeout(() => {
      void runReactivationNudges(new Date())
        .then((r) => {
          if (r.nudged > 0) {
            // eslint-disable-next-line no-console
            console.log(`[reactivation] nudged ${r.nudged} user(s)`);
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[reactivation] run failed', err);
        })
        .finally(schedule);
    }, delay);
    if (typeof timer.unref === 'function') timer.unref();
  };

  schedule();
  return () => clearTimeout(timer);
}

/**
 * Daily subscription sweep at 00:00 Tehran: settle every subscription that fell
 * due, and reconcile `profiles.tier` with what people have actually paid for.
 *
 * Runs at the day boundary because that is the unit the product speaks in — an
 * account that ran out at 14:00 keeps premium until that night, which is up to a
 * day of grace and always in the user's favour. See sweepExpiredSubscriptions()
 * for why precision here would make the product worse rather than better.
 *
 * A SEPARATE timer from the league scheduler even though both fire at 00:00.
 * They share an hour, not a purpose: the sweep is the last word on who is
 * premium, and it must keep running unchanged on a night when league
 * finalization throws. Chaining it behind finalizeDueWeeks would make a league
 * bug quietly stop expiring subscriptions — the one job that must not depend on
 * anything.
 */
export function startSubscriptionScheduler(): () => void {
  let timer: NodeJS.Timeout;

  const schedule = () => {
    const delay = msUntilNextRun(new Date(), 0, config.streakTimezone); // 00:00 Tehran
    timer = setTimeout(() => {
      void sweepExpiredSubscriptions(new Date())
        .then(async (r) => {
          // Also the nightly safety net for the gateway ceiling. The alert
          // normally fires the moment a payment pushes usage over the line;
          // this catches a month that crept up on us while nothing was selling
          // (a ceiling can also be reached by lowering it).
          await checkCapacityAlert(new Date()).catch(() => {});
          if (r.expired > 0 || r.demoted > 0 || r.promoted > 0) {
            // eslint-disable-next-line no-console
            console.log(
              `[subscriptions] ${r.expired} expired, ${r.demoted} demoted, ${r.promoted} repaired`,
            );
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[subscriptions] sweep failed', err);
        })
        .finally(schedule);
    }, delay);
    if (typeof timer.unref === 'function') timer.unref();
  };

  schedule();
  return () => clearTimeout(timer);
}

/**
 * The renewal reminders, at subscriptionReminder.hour Tehran (10:00 by default).
 *
 * Its own timer rather than a passenger on the midnight sweep, because the hour
 * is the point: the sweep runs when nobody is awake, and a message telling
 * somebody they have three days to renew is worth nothing if it arrives at
 * 00:00 and is buried by morning. Mid-morning is when it can actually be acted
 * on, and it is far from the 20:00/21:00 cluster the streak and digest already
 * occupy.
 *
 * Daily and idempotent, so a missed run self-heals: a container that was down
 * at 10:00 sends the same warnings at 10:00 tomorrow, and the ones already sent
 * stay sent.
 */
export function startSubscriptionReminderScheduler(): () => void {
  let timer: NodeJS.Timeout;

  const schedule = () => {
    const delay = msUntilNextRun(new Date(), config.subscriptionReminder.hour, config.streakTimezone);
    timer = setTimeout(() => {
      void runSubscriptionReminders(new Date())
        .then((r) => {
          if (r.soon > 0 || r.today > 0) {
            // eslint-disable-next-line no-console
            console.log(`[subscription-reminder] ${r.soon} ending soon, ${r.today} ending today`);
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[subscription-reminder] run failed', err);
        })
        .finally(schedule);
    }, delay);
    if (typeof timer.unref === 'function') timer.unref();
  };

  schedule();
  return () => clearTimeout(timer);
}

/**
 * Resolve payments the customer never came back from. Every
 * reconcileEveryMinutes, not once a day: the row it is looking for is somebody
 * who has been charged and has no subscription, and Zibal reverses a
 * transaction that is never verified — so this is a race against that window,
 * not a tidying job.
 *
 * Runs once at STARTUP too, before the interval. This process is deployed by
 * hand and can be down for a while; without the boot pass, a payment stranded
 * during a deploy would wait out the whole interval on top of the outage. The
 * sweep is idempotent and no-ops when there is nothing pending, so an extra run
 * costs one query.
 */
export function startPaymentReconcileScheduler(): () => void {
  let timer: NodeJS.Timeout;

  const run = () =>
    reconcilePendingPayments(new Date())
      .then((r) => {
        if (r.settled > 0 || r.closed > 0 || r.needsReview > 0) {
          // eslint-disable-next-line no-console
          console.log(
            `[payment-reconcile] checked ${r.checked}: ${r.settled} settled, ${r.closed} closed, ${r.left} left${r.needsReview ? `, ${r.needsReview} NEED REVIEW` : ''}`,
          );
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('[payment-reconcile] run failed', err);
      });

  void run();

  const tick = () => {
    timer = setTimeout(() => {
      void run().finally(tick);
    }, config.payments.reconcileEveryMinutes * 60 * 1000);
    if (typeof timer.unref === 'function') timer.unref();
  };

  tick();
  return () => clearTimeout(timer);
}

/**
 * Credit the assistant's strong outcome signals (a recommended article that got
 * read, highlighted or turned into a review card) to the round that suggested
 * it. Hourly, not daily: attribution only needs the 30-minute window to have
 * closed, and running it often keeps each pass small and the learned scores
 * roughly current. Idempotent — every round is marked as counted exactly once.
 */
export function startAssistantLearningScheduler(): () => void {
  let timer: NodeJS.Timeout;

  const tick = () => {
    timer = setTimeout(() => {
      void attributeStrongSignals(new Date())
        .then((r) => {
          if (r.credited > 0) {
            // eslint-disable-next-line no-console
            console.log(`[assistant-learning] credited ${r.credited}/${r.rounds} resolved round(s)`);
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('[assistant-learning] attribution run failed', err);
        })
        .finally(tick);
    }, 60 * 60 * 1000);
    if (typeof timer.unref === 'function') timer.unref();
  };

  tick();
  return () => clearTimeout(timer);
}
