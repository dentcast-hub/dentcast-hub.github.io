// Jalali month keys ('YYYY-MM') on the client, from ICU — the same formatter
// plus-api/src/services/time.ts jalaliMonth() uses, so both sides name the
// same month at a boundary. A leaf module on purpose: the homepage rail only
// needs the name of last month, and must not import the whole report renderer
// (and its content-index/return-trail graph) to get it.
const FA_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

/** 'YYYY-MM' → «شهریور». */
export function monthName(key) {
  const m = Number(String(key).split('-')[1]);
  return FA_MONTHS[m - 1] || '';
}

/** The 'YYYY-MM' Jalali key n months from `key` (n may be negative). */
export function shiftMonth(key, n) {
  const [y, m] = String(key).split('-').map(Number);
  const idx = y * 12 + (m - 1) + n;
  return Math.floor(idx / 12) + '-' + String((idx % 12) + 1).padStart(2, '0');
}

/** Today's Jalali 'YYYY-MM' in Tehran. */
export function currentMonthKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', {
    timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit',
  }).formatToParts(now);
  const get = (t) => (parts.find((p) => p.type === t) || {}).value || '';
  return get('year') + '-' + get('month');
}
