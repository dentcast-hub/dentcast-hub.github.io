import { config } from './config.js';
import { runFreeDigest, runPremiumBacklog } from './services/article-notify.js';
import { runStreakReminders } from './services/streak-reminder.js';
import { runReactivationNudges } from './services/reactivation.js';
import { finalizeDueWeeks } from './services/league-finalize.js';
import { notifyLeagueOutcomes } from './services/league-notify.js';
import { grantWeeklyPrizes, expirePremiumPrizes } from './services/premium-prize.js';
import { notifyPremiumPrizes } from './services/premium-prize-notify.js';
import { runReviewReminders } from './services/review-notify.js';

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
 * already works), and expirePremiumPrizes() reverts anyone whose 7 days are up.
 * Both are cheap idempotent daily re-scans, same self-healing shape as
 * finalizeDueWeeks itself.
 */
export function startLeagueScheduler(): () => void {
  let timer: NodeJS.Timeout;

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
