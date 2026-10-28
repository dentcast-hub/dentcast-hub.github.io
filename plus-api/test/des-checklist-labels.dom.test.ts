// @vitest-environment jsdom
// The spec's COMMENTARY checklist names its four items in English and Part 4
// stores the spec's objects verbatim, so a record may carry the English label
// or the Persian one. The reader-facing card always shows Persian
// (founder, 1405/08/06) — checked here on the REAL shipped module.
import { describe, it, expect } from 'vitest';
import { sourceBlock } from '../../plus/js/des.js';

const commentary = (labels: string[]) => ({
  des_version: '3.5', content_type: 'COMMENTARY', question_type: null, text_basis: 'FULL_TEXT',
  citation: { title: 'عنوان', authors: '', year: null, journal: '', doi: '' },
  journal_quartile: { value: 'NR', source: 'NR' }, s_design: null, q_method: null, penalties: null,
  commentary_checklist: labels.map((item, i) => ({ item, points: i === 1 ? 0 : 3, evidence_quote: '' })),
  des_score: 14, band: 'E', provisional: false, fact_fa: '', interpretation_fa: '',
});

const EN = ['reasoning chain is explicit', 'relationship to published evidence is stated',
  'scope of the claim is bounded', 'explicitly labeled as experience/opinion, not evidence'];
const FA = ['زنجیره‌ی استدلال صریح است', 'نسبتش با شواهد منتشرشده بیان شده است',
  'دامنه‌ی ادعا محدود شده است', 'صریحاً تجربه/دیدگاه نامیده شده، نه شواهد'];

describe('DES commentary checklist labels', () => {
  it('shows the Persian label for a record stored with the spec\'s English labels', () => {
    const text = sourceBlock(commentary(EN), 0, 1).textContent || '';
    for (const fa of FA) expect(text).toContain(fa);
    for (const en of EN) expect(text).not.toContain(en);
  });

  it('shows a record already stored in Persian unchanged', () => {
    const text = sourceBlock(commentary(FA), 0, 1).textContent || '';
    for (const fa of FA) expect(text).toContain(fa);
  });
});
