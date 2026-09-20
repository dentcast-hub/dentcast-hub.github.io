import { isGeneratedPseudonym } from './pseudonym.js';

/**
 * THE NAME ON A CERTIFICATE.
 *
 * A certificate is a document a stranger reads: it goes on a LinkedIn
 * profile, its code is typed into a public verify page, and the one thing
 * that page asserts is that the person NAMED on it finished the pathway.
 * A generated pseudonym — which is what `profiles.display_name` is until
 * the reader changes it — asserts nothing about anybody, so the founder's
 * rule (2026-09-20) is that the real first name and family name are ASKED
 * for, and a certificate is never issued without them.
 *
 * Hence this module rather than a check at each door. There are four doors
 * (the exam's start form, the founder's ruling field, the panel's hand
 * issue, and `issueCertificate` itself) and a rule written four times is a
 * rule that holds in three places. `issueCertificate` is the LAST of them
 * and validates too: whatever reaches it, a row with a pseudonym in
 * `holder_name` is never written.
 *
 * Three things the rules rest on.
 *
 * **A ZWNJ is not a space** (Hard Rule 16). «علی‌رضا» is one word and
 * «آل‌احمد» is one family name; splitting on it would read both as two
 * parts and let a single given name through. Only real whitespace
 * separates parts here.
 *
 * **A digit is never part of a name.** It is also what every generated
 * pseudonym ends with («کنجکاو مینا ۴۲۱»), so this one rule catches the
 * default display name of every account — `isGeneratedPseudonym` is the
 * belt to that braces, for a pseudonym whose tag was edited off.
 *
 * **A leading title is not a name part.** The field has always been
 * offered as «مثلاً دکتر مهسا رضایی», so «دکتر مهسا» must read as one
 * name and not two — otherwise the one reader who writes their title and
 * their given name would be told their name is complete when it is not.
 */

export type HolderNameProblem = 'required' | 'incomplete' | 'pseudonym';

export const HOLDER_NAME_MAX = 120;

/** What each refusal is called on the wire — and thrown as an Error message. */
export const HOLDER_NAME_ERROR: Record<HolderNameProblem, string> = {
  required: 'holder_name_required',
  incomplete: 'holder_name_incomplete',
  pseudonym: 'holder_name_pseudonym',
};

/** What the reader (or the founder) is told. One wording, every surface. */
export const HOLDER_NAME_MESSAGE_FA: Record<HolderNameProblem, string> = {
  required: 'نام و نام خانوادگی واقعی‌ات را بنویس — گواهی به همین نام صادر می‌شود.',
  incomplete: 'هم نام و هم نام خانوادگی لازم است؛ فقط نام کوچک یا حرف اول کافی نیست.',
  pseudonym: 'گواهی فقط به نام واقعی صادر می‌شود — نام مستعارِ حساب یا نامی که عدد دارد پذیرفته نیست.',
};

const ZWNJ = '‌';
// `\s` is every real space there is — NOT U+200C, which is a letter joiner
// inside a word («علی‌رضا» is one name, not two).
const SPACES = /\s+/g;
const DIGIT = /[0-9۰-۹٠-٩]/;
// Stripped before a part is measured, so «ن.» is one letter and not two.
const PUNCT = /[.,;:'،؛‘’“”`´«»()\[\]{}‹›\"]/g;

const TITLES = new Set(['دکتر', 'دکتور', 'مهندس', 'استاد', 'dr', 'doctor', 'prof', 'professor', 'mr', 'mrs', 'ms']);

const bare = (part: string) => part.replace(PUNCT, '').split(ZWNJ).join('');
const isTitle = (part: string) => TITLES.has(bare(part).toLowerCase());

export type HolderNameResult =
  | { ok: true; name: string }
  | { ok: false; problem: HolderNameProblem };

/**
 * Normalise and judge a name for a certificate. The name that comes back is
 * what gets printed: the title the reader wrote is KEPT (it is theirs), only
 * the spacing is tidied.
 */
export function normalizeHolderName(raw: unknown): HolderNameResult {
  const name = String(raw ?? '').replace(SPACES, ' ').trim().slice(0, HOLDER_NAME_MAX).trim();
  if (!name) return { ok: false, problem: 'required' };
  if (DIGIT.test(name) || isGeneratedPseudonym(name)) return { ok: false, problem: 'pseudonym' };

  const parts = name.split(' ');
  // A title is only a title in front of a name, never as a family name.
  if (parts.length > 1 && isTitle(parts[0])) parts.shift();
  if (parts.length < 2) return { ok: false, problem: 'incomplete' };
  if (parts.some((p) => bare(p).length < 2)) return { ok: false, problem: 'incomplete' };
  return { ok: true, name };
}

/** True when this string may be printed on a certificate. */
export function isRealHolderName(raw: unknown): boolean {
  return normalizeHolderName(raw).ok;
}

/**
 * The validated name, or a coded throw. Callers that already catch
 * `holder_name_required` keep working — that code is still one of the three.
 */
export function assertHolderName(raw: unknown): string {
  const r = normalizeHolderName(raw);
  if (!r.ok) throw new Error(HOLDER_NAME_ERROR[r.problem]);
  return r.name;
}

/** The Persian message for a thrown code, or null when it is not one of ours. */
export function holderNameMessageFa(code: string): string | null {
  for (const p of Object.keys(HOLDER_NAME_MESSAGE_FA) as HolderNameProblem[]) {
    if (HOLDER_NAME_ERROR[p] === code) return HOLDER_NAME_MESSAGE_FA[p];
  }
  return null;
}

/**
 * Read a name out of a request body. Two fields are what every surface now
 * ASKS with — an empty family-name box cannot be talked past, which is the
 * whole point — and `holder_name` stays accepted as one string for the
 * founder's own single field on the exam queue.
 */
export function holderNameFrom(input: {
  holder_name?: unknown; holder_first_name?: unknown; holder_last_name?: unknown;
}): string {
  const first = String(input.holder_first_name ?? '').trim();
  const last = String(input.holder_last_name ?? '').trim();
  if (first || last) {
    if (!first || !last) throw new Error(HOLDER_NAME_ERROR.incomplete);
    return assertHolderName(`${first} ${last}`);
  }
  return assertHolderName(input.holder_name);
}
