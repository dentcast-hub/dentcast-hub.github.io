import { config } from '../config.js';

/**
 * Asia/Tehran calendar-day helpers. The streak day boundary is Tehran local
 * midnight, not UTC (spec section 4). A day is identified by its 'YYYY-MM-DD'
 * string in the configured timezone.
 */

export function dayInTz(instant: Date | string | number, tz = config.streakTimezone): string {
  const d = instant instanceof Date ? instant : new Date(instant);
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** The calendar day before `day` ('YYYY-MM-DD' in, 'YYYY-MM-DD' out). */
export function previousDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) - 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** The calendar day after `day`. */
export function nextDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + 86_400_000).toISOString().slice(0, 10);
}

/**
 * The Saturday that starts the week containing `day` (Iranian week starts on
 * Saturday). getUTCDay: 0=Sun..6=Sat, so days-since-Saturday = (weekday + 1) % 7.
 */
export function weekStartSaturday(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const back = (weekday + 1) % 7;
  let cursor = day;
  for (let i = 0; i < back; i += 1) cursor = previousDay(cursor);
  return cursor;
}

/** Whole-day distance a - b (both 'YYYY-MM-DD'); positive if a is later. */
export function dayDiff(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86_400_000);
}
