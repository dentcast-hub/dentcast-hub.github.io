// The founder's paste, as prose. NotebookLM answers in prose, so this parser
// is the door the exam form actually gets used through — and the property it
// has to hold is that it never INVENTS an answer key: a question whose correct
// option is not marked is refused by number, because a silently-wrong key
// fails a reader who answered correctly, which is the one error in this
// system nobody would notice. Design: src/services/exam-text.ts.
import { describe, it, expect } from 'vitest';
import { parseQuestionText, looksLikeJson } from '../src/services/exam-text.js';
import { parseQuestions } from '../src/services/pathway-exams.js';

const ok = (raw: string) => {
  const r = parseQuestionText(raw);
  if (!r.ok) throw new Error(`expected a parse, got: ${r.error}`);
  return r.questions;
};
const err = (raw: string) => {
  const r = parseQuestionText(raw);
  return r.ok ? '' : r.error;
};

describe('the shape the panel asks NotebookLM for', () => {
  it('reads it exactly', () => {
    const qs = ok(`
۱. در اسکن داخل‌دهانی یک بریج چهار واحدی، بیشترین سهم در خطای انباشته از کدام است؟
الف) رنگ اسکن‌بادی
ب) طول مسیر اسکن و کم‌بودن نقاط مرجع ✓
ج) ترتیب اسکن فک مقابل
د) ضخامت لایهٔ پودر

۲. چرا trueness و precision را نمی‌توان یکی گرفت؟
نکته‌ها:
- تفکیک خطای سیستماتیک از خطای تصادفی
- نبودن مرجع صنعتی برای دهان واقعی
- اثر طول قوس بر انباشت خطا
`);
    expect(qs).toHaveLength(2);
    expect(qs[0]).toMatchObject({
      id: 'q1', kind: 'mcq', correct: 1,
      prompt_fa: 'در اسکن داخل‌دهانی یک بریج چهار واحدی، بیشترین سهم در خطای انباشته از کدام است؟',
    });
    expect((qs[0] as { options: string[] }).options).toEqual([
      'رنگ اسکن‌بادی', 'طول مسیر اسکن و کم‌بودن نقاط مرجع', 'ترتیب اسکن فک مقابل', 'ضخامت لایهٔ پودر',
    ]);
    expect(qs[1]).toMatchObject({ id: 'q2', kind: 'free' });
    expect((qs[1] as { key_points: { id: string; text: string }[] }).key_points).toEqual([
      { id: 'q2-k1', text: 'تفکیک خطای سیستماتیک از خطای تصادفی' },
      { id: 'q2-k2', text: 'نبودن مرجع صنعتی برای دهان واقعی' },
      { id: 'q2-k3', text: 'اثر طول قوس بر انباشت خطا' },
    ]);
  });
});

describe('it forgives how a person actually types', () => {
  it('a «پاسخ: ب» line instead of a tick', () => {
    const qs = ok('۳. کدام؟\nالف) یک\nب) دو\nج) سه\nپاسخ: ب');
    expect(qs[0]).toMatchObject({ kind: 'mcq', correct: 1 });
  });

  it('the answer named by number, by Latin letter, or by its own text', () => {
    expect(ok('۱. کدام؟\nالف) یک\nب) دو\nپاسخ صحیح: ۲')[0]).toMatchObject({ correct: 1 });
    expect(ok('1. which?\na) one\nb) two\nc) three\nanswer: C')[0]).toMatchObject({ correct: 2 });
    expect(ok('۱. کدام؟\nالف) کامپوزیت\nب) آمالگام\nجواب: آمالگام')[0]).toMatchObject({ correct: 1 });
  });

  it('a stem wrapped over several lines, a markdown heading above it, and bold', () => {
    const qs = ok('## آزمون مسیر دیجیتال\nاین سؤال‌ها از منابع نوت‌بوک است.\n\n۱. **در یک کیس** با آنتاگونیست طبیعی\nو فضای بین‌فکی کم، کدام انتخاب است؟\nالف) زیرکونیا مونولیتیک ✓\nب) پرسلن-متال');
    expect(qs).toHaveLength(1);
    expect(qs[0].prompt_fa).toBe('در یک کیس با آنتاگونیست طبیعی و فضای بین‌فکی کم، کدام انتخاب است؟');
    expect(qs[0]).toMatchObject({ correct: 0 });
  });

  it('bullets as options when a tick says which, and bullets as key points under «نکته‌ها»', () => {
    const mcq = ok('۱. کدام؟\n- یک\n- دو ✓\n- سه');
    expect(mcq[0]).toMatchObject({ kind: 'mcq', correct: 1 });
    const free = ok('۱. چرا؟\nنکات کلیدی:\n• اول\n• دوم');
    expect(free[0]).toMatchObject({ kind: 'free' });
    expect((free[0] as { key_points: unknown[] }).key_points).toHaveLength(2);
  });

  it('an inline key-point list after the colon', () => {
    const qs = ok('۱. چرا؟\nنکته‌ها: اول، دوم؛ سوم');
    expect((qs[0] as { key_points: { text: string }[] }).key_points.map((k) => k.text))
      .toEqual(['اول', 'دوم', 'سوم']);
  });

  it('«سؤال ۴:» and «Q5.» as numbering, and a tick written before the option', () => {
    const qs = ok('سؤال ۴: کدام؟\nالف) یک\n✓ ب) دو\n\nQ5. باز چرا؟\nنکته‌ها:\n- الف');
    expect(qs).toHaveLength(2);
    expect(qs[0]).toMatchObject({ kind: 'mcq', correct: 1 });
    expect(qs[1]).toMatchObject({ kind: 'free' });
  });

  it('a digit always starts a question — «۲)» is never option two of question one', () => {
    const qs = ok('۱. اول؟\nالف) یک\nب) دو ✓\n۲. دوم؟\nالف) یک ✓\nب) دو');
    expect(qs).toHaveLength(2);
    expect(qs.map((q) => q.prompt_fa)).toEqual(['اول؟', 'دوم؟']);
  });

  it('ids are minted in order, so the ruling and the examples line up', () => {
    expect(ok('۱. الف؟\n- یک ✓\n- دو\n۷. ب؟\n- یک ✓\n- دو').map((q) => q.id)).toEqual(['q1', 'q2']);
  });
});

describe('it never invents an answer key', () => {
  it('refuses an unmarked multiple-choice question, by number, and says how to mark it', () => {
    const e = err('۱. کدام؟\nالف) یک\nب) دو\nج) سه');
    expect(e).toContain('سؤال 1');
    expect(e).toContain('✓');
  });

  it('refuses two ticks, and a tick that disagrees with the «پاسخ» line', () => {
    expect(err('۱. کدام؟\nالف) یک ✓\nب) دو ✓')).toContain('بیش از یک گزینه');
    expect(err('۱. کدام؟\nالف) یک ✓\nب) دو\nپاسخ: ب')).toContain('دو چیز مختلف');
    expect(err('۱. کدام؟\nالف) یک\nب) دو\nپاسخ: ز')).toContain('نمی‌خورد');
  });

  it('refuses a question that is both kinds, one with neither, and a paste with none', () => {
    expect(err('۱. کدام؟\nالف) یک ✓\nنکته‌ها:\n- الف')).toContain('هم گزینه دارد هم نکتهٔ کلیدی');
    expect(err('۱. یک سؤال بی‌چیز؟')).toContain('نه گزینه‌ای دارد');
    expect(err('فقط چند خط حرف، بدون هیچ شماره‌ای')).toContain('سؤالی پیدا نشد');
    expect(err('')).toContain('سؤالی پیدا نشد');
  });

  it('refuses a one-option question through the shared validator', () => {
    const r = parseQuestions('۱. کدام؟\nالف) تنها گزینه ✓');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('۲');
  });
});

describe('one door for prose and JSON', () => {
  it('takes an array, a {questions:[…]} object, and prose — and says so when the JSON is broken', () => {
    const arr = '[{"kind":"mcq","prompt_fa":"کدام؟","options":["الف","ب"],"correct":1}]';
    expect(parseQuestions(arr).ok).toBe(true);
    expect(parseQuestions(JSON.parse(arr)).ok).toBe(true);
    expect(parseQuestions(`{"questions": ${arr}}`).ok).toBe(true);
    expect(parseQuestions('۱. کدام؟\nالف) یک ✓\nب) دو').ok).toBe(true);

    const broken = parseQuestions('[{"kind":"mcq",');
    expect(broken.ok).toBe(false);
    if (!broken.ok) expect(broken.error).toContain('JSON');

    expect(parseQuestions('   ').ok).toBe(false);
    expect(looksLikeJson('  [{')).toBe(true);
    expect(looksLikeJson('۱. کدام؟')).toBe(false);
  });
});
