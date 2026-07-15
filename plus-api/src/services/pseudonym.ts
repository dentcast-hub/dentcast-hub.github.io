/**
 * Generated Persian pseudonyms. `profiles.display_name` defaults to one of these
 * at signup; the user can rename it later from the profile page. Kept dental /
 * study themed and neutral. No real names, no phone digits.
 */

const ADJECTIVES = [
  'کنجکاو',
  'کوشا',
  'دقیق',
  'آرام',
  'روشن',
  'پویا',
  'ژرف',
  'باحوصله',
  'تیزبین',
  'پیگیر',
];

const NOUNS = [
  'مینا',
  'عاج',
  'ریشه',
  'تاج',
  'لثه',
  'کانال',
  'براکت',
  'کامپوزیت',
  'سرامیک',
  'ایمپلنت',
];

/** Deterministic when `seed` is given (useful for tests/seed data). */
export function generatePseudonym(seed?: number): string {
  const r = seed === undefined ? Math.random() : (Math.abs(seed) % 997) / 997;
  const adj = ADJECTIVES[Math.floor(r * ADJECTIVES.length) % ADJECTIVES.length];
  const noun = NOUNS[Math.floor(r * 100 * NOUNS.length) % NOUNS.length];
  const tag = String((seed ?? Math.floor(Math.random() * 9000)) % 900 + 100);
  return `${adj} ${noun} ${tag}`;
}
