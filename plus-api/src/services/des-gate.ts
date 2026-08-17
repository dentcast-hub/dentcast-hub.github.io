import { fold, paperScope, wordCount, hasResearchSignal } from './des-identity.js';

/**
 * ارزیاب DES — the free gate. Runs before any founder time is spent, and it
 * is deliberately GENEROUS: it stops only what it is certain about. A false
 * stop costs a reader their paper; a false pass costs the founder one look at
 * a submission they reject in a few seconds. See handoff §6.1 / RULE (§10):
 * "the free gate is generous; the founder is strict."
 */

export type IssueSeverity = 'stop' | 'warn';
export interface Issue { severity: IssueSeverity; message: string; }

export interface GateInput {
  title: string;
  body: string;
  claim: 'ABSTRACT_ONLY' | 'FULL_TEXT';
  hasPdf: boolean;
}

export interface GateResult {
  issues: Issue[];
  stop: boolean;
}

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function faNum(n: number): string {
  return String(n).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function validateSubmission(input: GateInput): GateResult {
  const issues: Issue[] = [];
  const title = input.title || '';
  const body = input.body || '';

  if (!fold(title)) {
    issues.push({ severity: 'stop', message: 'عنوان مقاله را بنویس — بدون آن نمی‌توانم پیدایش کنم.' });
  }

  if (!input.hasPdf) {
    const n = wordCount(body);
    if (n < 80) {
      issues.push({
        severity: 'stop',
        message: `متن برای ارزیابی خیلی کوتاه است (${faNum(n)} واژه). یا چکیده‌ی کامل بگذار، یا تیکِ PDF را بزن.`,
      });
    } else if (!hasResearchSignal(body)) {
      if (n < 300) {
        issues.push({
          severity: 'stop',
          message: 'این متن نشانه‌ای از یک گزارش پژوهشی ندارد — نه طرح مطالعه، نه آمار، نه تعداد نمونه.',
        });
      } else {
        issues.push({
          severity: 'warn',
          message: 'نشانه‌های روش‌شناختی در این متن پیدا نشد. اگر مقاله‌ی پژوهشی نباشد نمی‌توانم بسنجمش.',
        });
      }
    }

    // title/body incoherence — only meaningful once the length check passed
    if (n >= 80 && fold(title)) {
      const titleWords = fold(title).split(' ').filter((w) => w.length >= 4);
      if (titleWords.length >= 3) {
        const bodyFolded = fold(paperScope(body));
        const seen = titleWords.filter((w) => bodyFolded.includes(w)).length;
        if (seen / titleWords.length < 0.34) {
          issues.push({ severity: 'warn', message: 'عنوان با متن هم‌خوان نیست — مطمئنی هر دو مالِ یک مقاله‌اند؟' });
        }
      }
    }

    if (input.claim === 'FULL_TEXT' && n >= 80 && n <= 600) {
      issues.push({
        severity: 'warn',
        message: `این متن ${faNum(n)} واژه است — اندازه‌ی یک چکیده. به‌عنوان چکیده می‌سنجمش.`,
      });
    }
  }

  return { issues, stop: issues.some((i) => i.severity === 'stop') };
}
