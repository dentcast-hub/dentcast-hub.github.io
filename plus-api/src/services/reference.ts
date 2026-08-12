/**
 * Short human-carried reference tags.
 *
 * A reference exists so a conversation can LEAVE the site and come back: a gift
 * card is bought in a shop and emailed with the tag in its message; a student
 * card is photographed and sent to a messenger with the tag typed underneath.
 * In both cases the valuable thing never enters our system — only a tag that
 * matches what arrives to the account waiting for it.
 *
 * That is what fixes the alphabet. The tag is read aloud, typed by hand into a
 * box that is not ours, and then read back off a screen by a human, so every
 * pair that looks alike in a sans-serif face is excluded (0/O, 1/I/L, 5/S,
 * 8/B). Short enough to retype without resentment; a mistyped tag means an
 * arrival nobody can match.
 */

const TAG_ALPHABET = 'ACDEFGHJKMNPQRTUVWXY2346789';

/**
 * `<prefix>-XXX-YYY`. The prefix names the system the tag belongs to, so a
 * founder reading one out of a messenger knows which queue to open before
 * looking anything up.
 */
export function mintReference(prefix: string): string {
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += TAG_ALPHABET[Math.floor(Math.random() * TAG_ALPHABET.length)];
  }
  return `${prefix}-${out.slice(0, 3)}-${out.slice(3)}`;
}

/**
 * Normalise a tag a human typed back at us — lowercase, stray spaces, a missing
 * or duplicated separator. Matching is what the tag is FOR, so the read path
 * must be as forgiving as the alphabet is unambiguous.
 */
export function normalizeReference(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '');
}
