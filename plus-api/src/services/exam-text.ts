import type { ExamQuestion, NormalizeResult } from './pathway-exams.js';

/**
 * PLAIN TEXT IN, QUESTIONS OUT — so the founder never has to produce JSON.
 *
 * The exam form originally took a JSON array, on the assumption that
 * NotebookLM could be asked for one. It cannot: it answers in prose, and the
 * founder was left either hand-writing JSON or pasting the prose into another
 * model first to have it converted (founder, 2026-09-13: «نوت‌بوک ال‌ام خروجی
 * نمی‌دهد … یه جوری که همه‌چی راحت باشه»). A conversion step performed by hand
 * before every exam is a step that will eventually be skipped, so the parser
 * belongs here, where the paste already lands.
 *
 * The shape it reads is the one people already write exams in:
 *
 *   ۱. متن سؤال تستی
 *   الف) گزینهٔ اول
 *   ب) گزینهٔ دوم ✓
 *   ج) گزینهٔ سوم
 *
 *   ۲. متن سؤال تشریحی
 *   نکته‌ها:
 *   - نکتهٔ کلیدی اول
 *   - نکتهٔ کلیدی دوم
 *
 * One rule makes it deterministic rather than clever: **a DIGIT starts a
 * question, a LETTER or a BULLET continues one.** Everything else follows —
 * «۲)» is never mistaken for the second option of question 1, and a wrapped
 * stem is just a line that starts with neither.
 *
 * It NEVER guesses the answer. A multiple-choice question whose correct
 * option is not marked (a ✓/✅/★/*, a «(درست)», or a «پاسخ: ب» line) is
 * refused by number, because a silently-wrong answer key fails a reader who
 * answered correctly — the one error in this system nobody would notice.
 * Two markings that disagree are refused for the same reason.
 */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
/** Persian/Arabic digits → ASCII, for matching only; question text keeps its own. */
const asciiDigits = (s: string): string => s.replace(/[۰-۹٠-٩]/g, (d) => {
  const fa = FA_DIGITS.indexOf(d);
  return String(fa >= 0 ? fa : AR_DIGITS.indexOf(d));
});

/**
 * Collapse real whitespace and nothing else. A **ZWNJ is not a space**
 * (Hard Rule 16): «داخل‌دهانی» is one word and «داخل دهانی» is two, and this
 * text is printed to a reader verbatim, so the parser may never touch it. Only
 * the bidi marks go, since they carry no meaning inside a line we re-lay-out.
 */
const clean = (s: string): string => s
  .replace(/[\u200e\u200f]/g, '')
  .replace(/[ \t\u00a0]+/g, ' ')
  .trim();

/** For comparing a MARKER («الف») only — here a ZWNJ really is noise. */
const foldMarker = (s: string): string => clean(s).replace(/\u200c/g, '');

const TICKS = /[✓✔✅☑★🔹]|\(\s*(?:درست|صحیح|پاسخ|correct)\s*\)|\*{1,2}\s*$/u;
const OPTION_LETTERS = ['الف', 'ب', 'پ', 'ت', 'ج', 'د', 'ه', 'و'];
const LATIN_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];

/**
 * A gap inside a Persian keyword may be a space OR a ZWNJ — «نکته‌ها» is one
 * word joined by U+200C, and since `clean()` (rightly) leaves that character
 * alone, every keyword pattern has to admit it. Missing this read every
 * «نکته‌ها:» line as a stray option and turned free-text questions into
 * multiple-choice ones with no marked answer.
 */
const Z = '[\\s\\u200c]*';
const POINTS_HEAD = new RegExp(
  `^(?:نکته${Z}ها|نکته${Z}های${Z}کلیدی|نکات(?:${Z}کلیدی)?|کلیدها|پاسخ${Z}کلیدی|key${Z}points|points|rubric)${Z}[:：]?${Z}(.*)$`,
  'iu',
);
const ANSWER_LINE = new RegExp(
  `^(?:پاسخ(?:${Z}(?:درست|صحیح))?|جواب(?:${Z}(?:درست|صحیح))?|گزینه${Z}ی?${Z}(?:درست|صحیح)|answer|correct)${Z}[:：]${Z}(.+)$`,
  'iu',
);

/** Persian, Arabic and ASCII digits — a number is a number however it is typed. */
const D = '[0-9\u06F0-\u06F9\u0660-\u0669]';
/** `۱.` `2)` `3 -` `سؤال ۴:` `Q5.` — a question begins. */
const STEM_LINE = new RegExp(`^(?:(?:سؤال|سوال|پرسش|question|q)\\s*)?[#]?(${D}+)\\s*[.)\\-–—:]\\s*(.+)$`, 'iu');
/** `الف)` `ب -` `c.` — an option continues one. */
const OPTION_LINE = /^([؀-ۿa-zA-Z]{1,3})\s*[.)\-–—:]\s+(.+)$/u;
/** `-` `•` `*` `–` — a bullet: an option or a key point, decided by context. */
const BULLET_LINE = /^[-•*–—◦▪]\s+(.+)$/u;

interface Draft {
  n: number;
  stem: string[];
  options: { text: string; ticked: boolean }[];
  points: string[];
  answerHint: string | null;
  inPoints: boolean;
}

const newDraft = (n: number, stem: string): Draft => ({
  n, stem: [stem], options: [], points: [], answerHint: null, inPoints: false,
});

function stripTick(text: string): { text: string; ticked: boolean } {
  let t = text;
  let ticked = false;
  // A tick can sit on either side, and a founder may write both a ✓ and «(درست)».
  for (let i = 0; i < 3; i += 1) {
    const before = t;
    t = t.replace(/^\s*(?:[✓✔✅☑★🔹]|\*{1,2})\s*/u, () => { ticked = true; return ''; });
    t = t.replace(/\s*(?:[✓✔✅☑★🔹]|\*{1,2})\s*$/u, () => { ticked = true; return ''; });
    t = t.replace(/\s*\(\s*(?:درست|صحیح|پاسخ|correct)\s*\)\s*$/iu, () => { ticked = true; return ''; });
    if (t === before) break;
  }
  return { text: clean(t), ticked };
}

/** «ب» / «2» / the option's own text → an index, or null. */
function resolveHint(hint: string, options: string[]): number | null {
  const h = foldMarker(hint).replace(/[.)]+$/, '');
  const li = OPTION_LETTERS.indexOf(h);
  if (li >= 0 && li < options.length) return li;
  const en = LATIN_LETTERS.indexOf(h.toLowerCase());
  if (en >= 0 && en < options.length) return en;
  const num = asciiDigits(h);
  if (/^\d+$/.test(num)) {
    const one = Number(num) - 1; // humans count from one
    if (one >= 0 && one < options.length) return one;
  }
  const exact = options.findIndex((o) => o === h);
  return exact >= 0 ? exact : null;
}

function finish(d: Draft, out: ExamQuestion[]): string | null {
  const prompt = clean(d.stem.join(' '));
  if (!prompt) return `سؤال ${d.n}: متنی ندارد.`;
  const hasOptions = d.options.length > 0;
  const hasPoints = d.points.length > 0;

  if (hasOptions && hasPoints) {
    return `سؤال ${d.n}: هم گزینه دارد هم نکتهٔ کلیدی — یکی از این دو را بردار.`;
  }
  if (!hasOptions && !hasPoints) {
    return `سؤال ${d.n}: نه گزینه‌ای دارد (تستی) نه نکتهٔ کلیدی (تشریحی).`;
  }

  if (hasOptions) {
    const options = d.options.map((o) => o.text);
    const ticked = d.options.map((o, i) => (o.ticked ? i : -1)).filter((i) => i >= 0);
    const hinted = d.answerHint === null ? null : resolveHint(d.answerHint, options);

    if (ticked.length > 1) return `سؤال ${d.n}: بیش از یک گزینه علامت خورده.`;
    if (d.answerHint !== null && hinted === null) {
      return `سؤال ${d.n}: «پاسخ: ${clean(d.answerHint)}» به هیچ گزینه‌ای نمی‌خورد.`;
    }
    if (ticked.length === 1 && hinted !== null && ticked[0] !== hinted) {
      return `سؤال ${d.n}: علامتِ گزینه و خطِ «پاسخ» دو چیز مختلف می‌گویند.`;
    }
    const correct = ticked.length === 1 ? ticked[0] : hinted;
    if (correct === null) {
      return `سؤال ${d.n}: گزینهٔ درست مشخص نشده — جلوی گزینهٔ درست ✓ بگذار یا خطِ «پاسخ: ب» بنویس.`;
    }
    out.push({ id: `q${d.n}`, kind: 'mcq', prompt_fa: prompt, options, correct });
    return null;
  }

  out.push({
    id: `q${d.n}`,
    kind: 'free',
    prompt_fa: prompt,
    key_points: d.points.map((text, i) => ({ id: `q${d.n}-k${i + 1}`, text })),
  });
  return null;
}

/** Split an inline list: «نکته‌ها: الف، ب؛ ج». */
const inlineList = (s: string): string[] => s
  .split(/[،؛;]|\s\/\s/)
  .map((x) => clean(x))
  .filter(Boolean);

/**
 * Parse a founder's plain-text paste. Returns the same shape
 * `normalizeQuestions` produces, so the caller validates once, in one place.
 */
export function parseQuestionText(raw: string): NormalizeResult {
  const lines = String(raw || '').split(/\r?\n/);
  const out: ExamQuestion[] = [];
  let d: Draft | null = null;
  let seen = 0;

  const close = (): string | null => {
    if (!d) return null;
    const err = finish(d, out);
    d = null;
    return err;
  };

  for (const rawLine of lines) {
    let line = clean(rawLine.replace(/^\s*#{1,6}\s*/, '').replace(/\*\*/g, ''));
    if (!line) continue;
    // «✓ ب) دو» — a tick in front of the marker belongs to the option, not to
    // the line's shape, so it comes off before anything is matched.
    let lineTicked = false;
    line = line.replace(/^(?:[✓✔✅☑★🔹])\s*/u, () => { lineTicked = true; return ''; });

    // a new question
    const stem = STEM_LINE.exec(line);
    if (stem) {
      const err = close();
      if (err) return { ok: false, error: err };
      seen += 1;
      d = newDraft(seen, stem[2]);
      continue;
    }

    if (!d) {
      // Text before the first numbered question is a heading or NotebookLM's
      // own preamble — ignored rather than refused, since it is always there.
      continue;
    }

    // «پاسخ: ب»
    const ans = ANSWER_LINE.exec(line);
    if (ans) { d.answerHint = ans[1]; continue; }

    // «نکته‌ها:» — possibly with the list on the same line
    const head = POINTS_HEAD.exec(line);
    if (head) {
      d.inPoints = true;
      if (head[1]) d.points.push(...inlineList(head[1]));
      continue;
    }

    const bullet = BULLET_LINE.exec(line);
    if (bullet) {
      const { text, ticked: own } = stripTick(bullet[1]);
      const ticked = own || lineTicked;
      if (d.inPoints || d.options.length === 0) {
        // A bullet list under a stem with no lettered options is a rubric
        // unless a later line proves otherwise; a bullet after options is a
        // fifth option written a different way.
        if (d.inPoints) d.points.push(text);
        else d.options.push({ text, ticked });
      } else {
        d.options.push({ text, ticked });
      }
      continue;
    }

    const opt = OPTION_LINE.exec(line);
    if (opt && !d.inPoints) {
      const marker = foldMarker(opt[1]);
      const known = OPTION_LETTERS.includes(marker) || LATIN_LETTERS.includes(marker.toLowerCase());
      if (known) {
        const { text, ticked: own } = stripTick(opt[2]);
        d.options.push({ text, ticked: own || lineTicked });
        continue;
      }
    }

    if (d.inPoints) { d.points.push(clean(line)); continue; }
    // anything else: the stem wrapped onto another line
    if (d.options.length === 0) d.stem.push(line);
  }

  const err = close();
  if (err) return { ok: false, error: err };
  if (!out.length) {
    return {
      ok: false,
      error: 'سؤالی پیدا نشد. هر سؤال باید با شمارهٔ خودش شروع شود («۱.»)، گزینه‌ها با الف/ب/ج/د و گزینهٔ درست با ✓.',
    };
  }
  return { ok: true, questions: out };
}

/** Does this paste look like JSON rather than prose? */
export const looksLikeJson = (raw: string): boolean => /^\s*[[{]/.test(String(raw || ''));
