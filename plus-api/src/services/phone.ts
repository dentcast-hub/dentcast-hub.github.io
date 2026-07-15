/**
 * Iranian mobile number normalization. We store a single canonical form
 * (09XXXXXXXXX) so `profiles.phone` is unique regardless of how the user typed
 * it (+98, 0098, spaces, Persian digits).
 */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (ch) => {
    const p = PERSIAN_DIGITS.indexOf(ch);
    if (p >= 0) return String(p);
    const a = ARABIC_DIGITS.indexOf(ch);
    if (a >= 0) return String(a);
    return ch;
  });
}

/**
 * Returns the canonical `09XXXXXXXXX` form, or null if the input is not a valid
 * Iranian mobile number.
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  let s = toLatinDigits(raw).replace(/[\s\-()]/g, '');
  if (s.startsWith('+98')) s = '0' + s.slice(3);
  else if (s.startsWith('0098')) s = '0' + s.slice(4);
  else if (s.startsWith('98') && s.length === 12) s = '0' + s.slice(2);
  else if (s.startsWith('9') && s.length === 10) s = '0' + s;

  if (/^09\d{9}$/.test(s)) return s;
  return null;
}
