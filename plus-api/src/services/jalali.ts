import { addDays } from './time.js';

/**
 * Jalali (Persian) calendar dates, for the ONE place a founder types a date:
 * the clinic-closure form on the admin panel. Everything else in this API
 * stores and compares Gregorian 'YYYY-MM-DD' Tehran days (services/time.ts),
 * and that does not change here — a closure is stored Gregorian and only
 * *shown* and *typed* in Jalali.
 *
 * No library, and no hand-rolled leap-year table either. Node ships full ICU,
 * so Gregorian → Jalali is a locale extension on the same Intl formatter
 * `jalaliMonth()` in time.ts already relies on in production. The other
 * direction is that same formatter run backwards: estimate the day, ask ICU
 * what it is, step by the difference. The estimate lands within a day or two,
 * so it settles on the first or second pass — and because ICU is the only
 * thing that ever decides which Jalali year is 366 days long, the two
 * directions cannot disagree with each other.
 */

const FA_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/** getUTCDay(): 0=Sunday … 6=Saturday. */
const FA_WEEKDAYS = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

export type Jalali = { jy: number; jm: number; jd: number };

const FA_FORMAT = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
  timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit',
});

/** Noon UTC on `day`, so no rounding of any kind can land on a neighbour. */
function noon(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

/** The Jalali date of a Gregorian 'YYYY-MM-DD'. */
export function dayToJalali(day: string): Jalali {
  const parts = FA_FORMAT.formatToParts(noon(day));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { jy: get('year'), jm: get('month'), jd: get('day') };
}

/** 1-based day of the Jalali year: months 1-6 are 31 days, 7-11 are 30. */
function dayOfYear(jm: number, jd: number): number {
  return (jm <= 6 ? (jm - 1) * 31 : 186 + (jm - 7) * 30) + jd;
}

/**
 * The Gregorian 'YYYY-MM-DD' of a Jalali date, or null if that date does not
 * exist (month 13, the 31st of Esfand, 30 Esfand in a common year). Nothing
 * here knows which years are leap — a date is real exactly when the round trip
 * through ICU comes back unchanged, which is also what rejects the fake ones.
 */
export function jalaliToDay(jy: number, jm: number, jd: number): string | null {
  if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return null;
  if (jy < 1300 || jy > 1500 || jm < 1 || jm > 12 || jd < 1 || jd > 31) return null;

  // 1 Farvardin falls on 20 or 21 March of jy + 621; the loop below fixes the
  // day or two this estimate can be out by.
  let day = addDays(`${jy + 621}-03-21`, dayOfYear(jm, jd) - 1);
  for (let i = 0; i < 8; i += 1) {
    const cur = dayToJalali(day);
    if (cur.jy === jy && cur.jm === jm && cur.jd === jd) return day;
    const diff = (jy - cur.jy) * 365 + (dayOfYear(jm, jd) - dayOfYear(cur.jm, cur.jd));
    day = addDays(day, diff !== 0 ? diff : (jy > cur.jy ? 1 : -1));
  }
  return null;
}

const DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Latin digits → Persian, for anything a person reads. */
export function faDigits(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => DIGITS[Number(d)]);
}

/** Persian/Arabic digits → Latin, for anything a person typed. */
export function latinDigits(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/**
 * A founder-typed Jalali date → a Gregorian 'YYYY-MM-DD', or null.
 * Accepts '1405/06/14', '1405-06-14', '۱۴۰۵/۶/۱۴' and '1405.6.14'.
 */
export function parseJalali(input: string): string | null {
  const m = latinDigits(String(input)).trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!m) return null;
  return jalaliToDay(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** «۱۴ شهریور» — the short form the clinic pill says out loud. */
export function formatJalaliShort(day: string): string {
  const { jm, jd } = dayToJalali(day);
  return `${faDigits(jd)} ${FA_MONTHS[jm - 1]}`;
}

/** «شنبه ۱۴ شهریور ۱۴۰۵» — the long form the admin panel lists. */
export function formatJalaliLong(day: string): string {
  const { jy, jm, jd } = dayToJalali(day);
  const weekday = FA_WEEKDAYS[noon(day).getUTCDay()];
  return `${weekday} ${faDigits(jd)} ${FA_MONTHS[jm - 1]} ${faDigits(jy)}`;
}

/** «شنبه ۱۴ شهریور» — long enough to name the day, short enough for a pill. */
export function formatJalaliDay(day: string): string {
  return `${FA_WEEKDAYS[noon(day).getUTCDay()]} ${formatJalaliShort(day)}`;
}
