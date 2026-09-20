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

/**
 * Does this string look like one of the names above? Used by
 * `services/holder-name.ts`: a certificate is never issued to a pseudonym,
 * and the pseudonym almost every account carries is one of these.
 *
 * The numeric tag is not required — a reader who edited it off still has a
 * generated name, and a real person is not called «کنجکاو مینا».
 */
export function isGeneratedPseudonym(name: string): boolean {
  const parts = String(name ?? '').trim().split(/\s+/);
  if (parts.length < 2) return false;
  return ADJECTIVES.includes(parts[0]) && NOUNS.includes(parts[1]);
}
