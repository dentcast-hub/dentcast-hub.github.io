import { config } from './config.js';
import { runFreeDigest } from './services/article-notify.js';
import { runStreakReminders } from './services/streak-reminder.js';
import { runReactivationNudges } from './services/reactivation.js';

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
