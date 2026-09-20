import { describe, it, expect } from 'vitest';
import {
  normalizeHolderName, isRealHolderName, assertHolderName, holderNameFrom, holderNameMessageFa,
} from '../src/services/holder-name.js';
import { generatePseudonym } from '../src/services/pseudonym.js';

/**
 * A certificate is a document a stranger reads. The verify page asserts that
 * the person NAMED on it finished the pathway — which a generated alias
 * asserts about nobody — so the real first name and family name are asked for
 * and nothing else is printable (founder, 2026-09-20).
 */
describe('the name on a certificate', () => {
  it('takes a real first name and family name', () => {
    expect(normalizeHolderName('مهسا رضایی')).toEqual({ ok: true, name: 'مهسا رضایی' });
    expect(isRealHolderName('نگار حسینی نژاد')).toBe(true);
    expect(isRealHolderName('Mahsa Rezaei')).toBe(true);
  });

  it('tidies the spacing and keeps the title the reader wrote', () => {
    expect(assertHolderName('  دکتر   مهسا  رضایی ')).toBe('دکتر مهسا رضایی');
  });

  it('refuses a given name with no family name beside it — title or no title', () => {
    expect(normalizeHolderName('مهسا')).toEqual({ ok: false, problem: 'incomplete' });
    // «دکتر» is a title, not a family name: «دکتر مهسا» is one name.
    expect(normalizeHolderName('دکتر مهسا')).toEqual({ ok: false, problem: 'incomplete' });
    expect(normalizeHolderName('Dr. Mahsa')).toEqual({ ok: false, problem: 'incomplete' });
  });

  it('refuses an initial — a letter is not a family name', () => {
    expect(normalizeHolderName('دکتر ن.')).toEqual({ ok: false, problem: 'incomplete' });
    expect(normalizeHolderName('م. رضایی')).toEqual({ ok: false, problem: 'incomplete' });
  });

  it('refuses the generated pseudonym every account carries, tag or no tag', () => {
    expect(normalizeHolderName(generatePseudonym(7))).toEqual({ ok: false, problem: 'pseudonym' });
    expect(normalizeHolderName('کنجکاو مینا ۴۲۱')).toEqual({ ok: false, problem: 'pseudonym' });
    expect(normalizeHolderName('کنجکاو مینا')).toEqual({ ok: false, problem: 'pseudonym' });
  });

  it('refuses any digit, in either script — a name has none', () => {
    expect(normalizeHolderName('مهسا رضایی ۲')).toEqual({ ok: false, problem: 'pseudonym' });
    expect(normalizeHolderName('مهسا رضایی 2')).toEqual({ ok: false, problem: 'pseudonym' });
  });

  it('is empty when there is nothing there', () => {
    expect(normalizeHolderName('   ')).toEqual({ ok: false, problem: 'required' });
    expect(normalizeHolderName(null)).toEqual({ ok: false, problem: 'required' });
  });

  it('does not read a ZWNJ as a space (Hard Rule 16)', () => {
    // «علی‌رضا» is ONE name; splitting on the joiner would let it pass alone.
    expect(normalizeHolderName('علی‌رضا')).toEqual({ ok: false, problem: 'incomplete' });
    expect(isRealHolderName('علی‌رضا موسوی')).toBe(true);
    // …and a family name written with one is a family name.
    expect(isRealHolderName('جلال آل‌احمد')).toBe(true);
  });

  it('throws a code every route already knows how to say in Persian', () => {
    expect(() => assertHolderName('')).toThrow('holder_name_required');
    expect(() => assertHolderName('مهسا')).toThrow('holder_name_incomplete');
    expect(() => assertHolderName('کنجکاو مینا ۴۲۱')).toThrow('holder_name_pseudonym');
    expect(holderNameMessageFa('holder_name_pseudonym')).toContain('نام واقعی');
    expect(holderNameMessageFa('not_found')).toBeNull();
  });

  it('reads two fields from a body, and refuses a half-filled pair', () => {
    expect(holderNameFrom({ holder_first_name: 'مهسا', holder_last_name: 'رضایی' })).toBe('مهسا رضایی');
    expect(() => holderNameFrom({ holder_first_name: 'مهسا' })).toThrow('holder_name_incomplete');
    expect(() => holderNameFrom({ holder_last_name: 'رضایی' })).toThrow('holder_name_incomplete');
    // One string is still read — the founder's single field on the queue row.
    expect(holderNameFrom({ holder_name: 'مهسا رضایی' })).toBe('مهسا رضایی');
  });
});
