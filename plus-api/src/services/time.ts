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

/**
 * The Jalali (Persian) calendar month containing `instant`, as 'YYYY-MM' —
 * e.g. '1405-05' for Mordad 1405.
 *
 * Used by the payment-capacity counter, whose monthly cap is set by an Iranian
 * regulator and therefore resets on the first of a PERSIAN month, not a
 * Gregorian one. The two are never less than three weeks apart, so counting the
 * wrong one would leave the counter reading nearly a full month of transactions
 * that the gateway has already forgotten — turning customers away while real
 * capacity sat unused.
 *
 * No library: Node ships full ICU, so the Persian calendar is a locale
 * extension on the same Intl formatter the Gregorian helpers above already use.
 * 'nu-latn' forces Latin digits — the default numbering for a Persian locale is
 * Eastern Arabic ('۱۴۰۵'), which would make these strings unsortable and
 * uncomparable to anything.
 */
export function jalaliMonth(instant: Date | string | number = new Date(), tz = config.streakTimezone): string {
  const d = instant instanceof Date ? instant : new Date(instant);
  const parts = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}`;
}

/** The Gregorian calendar month containing `instant`, as 'YYYY-MM'. */
export function gregorianMonth(instant: Date | string | number = new Date(), tz = config.streakTimezone): string {
  return dayInTz(instant, tz).slice(0, 7);
}

/** `day` moved by n whole calendar days ('YYYY-MM-DD' in, 'YYYY-MM-DD' out). */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * 86_400_000).toISOString().slice(0, 10);
}

/** The calendar day before `day`. */
export function previousDay(day: string): string {
  return addDays(day, -1);
}

/** The calendar day after `day`. */
export function nextDay(day: string): string {
  return addDays(day, 1);
}

/**
 * The zone's UTC offset (ms) at a given instant, read from the zone rather than
 * assumed. Iran has had no DST since 2022, but this helper must not be the
 * reason that stops being true.
 */
function zoneOffsetMs(instant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const get = (t: string): number => Number(parts.find((p) => p.type === t)?.value ?? 0);
  // `% 24` because an h23 cycle still renders midnight as '24' in some ICU builds.
  const asIfUtc = Date.UTC(
    get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'),
  );
  return asIfUtc - instant.getTime();
}

/**
 * The instant local midnight begins on `day`.
 *
 * Exists because a duration promised to a user has to be a CALENDAR promise,
 * not a stopwatch reading. Anything derived by adding N × 86_400_000 to
 * "whatever instant the job happened to run at" carries that run's own latency
 * forward, and a daily sweep comparing `<= now` then misses it by the few
 * seconds of drift and waits another full day. Anchoring both ends of such a
 * span to this boundary makes the comparison exact. See premium-prize.ts.
 */
export function startOfDayInstant(day: string, tz = config.streakTimezone): Date {
  const [y, m, d] = day.split('-').map(Number);
  const wallClock = Date.UTC(y, m - 1, d);
  // Two passes: the first offset is read at an instant that may sit on the far
  // side of a transition from the answer; re-reading at the corrected instant
  // settles it.
  const first = wallClock - zoneOffsetMs(new Date(wallClock), tz);
  const settled = wallClock - zoneOffsetMs(new Date(first), tz);
  return new Date(settled);
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
