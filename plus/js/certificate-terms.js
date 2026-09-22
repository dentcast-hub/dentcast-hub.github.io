// «شرایط گواهی‌نامه» — one sheet, opened from every surface that mentions a
// certificate.
//
// It exists because the terms used to live in exactly one place: exam-page.js's
// `contract()`, which renders only when a form's `rules` are in hand — i.e.
// only once the founder has written that pathway's questions. For every pathway
// that has no form yet, the reader was asked «گواهی‌نامه می‌خواهی؟» with no way
// at all to find out what a certificate is or what earning one costs.
//
// NO NUMBERS (founder, 1405/06/29). Publishing step 5.6 files new content into
// existing pathways, so a step count printed today is wrong next week; and a
// form stores its own copy of the exam's rules, so a question count or a
// threshold quoted here would be a promise about a pathway whose exam may say
// something else. The only place a number is stated is the exam page itself,
// where it comes from the form the reader is about to sit and is true by
// construction. Everything here is what does not change.
import { el } from './util.js?v=130';
import { closeSheet } from './sheet.js?v=130';
// The certificate's own words live in ONE place (CERT_TEXT) and are imported
// by every renderer — the DOM sheet, the canvas download, and now this. The
// «امتیاز بازآموزی نیست» line in particular belongs in front of the decision,
// not only under a certificate already issued.
import { CERT_TEXT } from './certificate-image.js?v=130';

/** What must be true — identical for every pathway, which is why it is stated once. */
const EARN = [
  'در مسیر ثبت‌نام کرده باشی («شروع این مسیر»).',
  'همهٔ قدم‌های مسیر را خوانده یا شنیده باشی؛ پیشرفت خودش از روی مطالعه‌ات حساب می‌شود.',
  'آزمون پایانیِ مسیر را بدهی و قبول شوی.',
  'در زمان آزمون، اشتراک پریمیوم فعال داشته باشی.',
  'نام و نام خانوادگی واقعی‌ات را برای چاپ روی گواهی بنویسی؛ با نام مستعار گواهی صادر نمی‌شود.',
];

/** What it buys — also identical everywhere. */
const GET = [
  'گواهی به نام و نام خانوادگی واقعی خودت؛ بعد از صدور تغییر نمی‌کند.',
  'کد یکتا و صفحهٔ تأیید عمومی، برای گذاشتن روی لینکدین یا رزومه.',
  'فایل دانلودی A4 و نسخهٔ مربع برای استوری.',
  'یک تخفیف یک‌بارمصرف روی خرید بعدی‌ات.',
];

function list(items, marker) {
  return el('ul', { class: 'dcp-terms' }, items.map((t, i) => el('li', {}, [
    el('i', { 'aria-hidden': 'true' }, marker === 'n' ? String(i + 1).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]) : '◆'),
    el('span', {}, t),
  ])));
}

/**
 * The sheet body. `titleFa` is the pathway it was opened from, or null when
 * opened from a surface that is not about one pathway (the catalog's intro).
 *
 * `onBack` is for the one caller that opens this FROM another sheet (the
 * profile wall's locked card): openSheet replaces whatever was open, so
 * without a way back the reader would have to find the disc again.
 */
export function certificateTerms(titleFa, onBack) {
  return el('div', { class: 'dcp-cert-card', 'data-cert-terms': '' }, [
    el('div', { class: 'dcp-cert-card-kicker' }, 'گواهی‌نامهٔ تکمیل مسیر یادگیری'),
    titleFa ? el('b', {}, titleFa) : el('b', {}, 'مسیرهای کامل'),
    el('div', { class: 'dcp-terms-h' }, 'برای گرفتنش'),
    list(EARN, 'n'),
    el('div', { class: 'dcp-terms-h' }, 'چه چیزی به دست می‌آید'),
    list(GET, '◆'),
    // Deliberately says WHERE the numbers are rather than what they are.
    el('p', { class: 'dcp-terms-pend' },
      'تعداد سؤال، نصاب قبولی و تعداد تلاش‌ها برای هر مسیر جداگانه تعیین می‌شود و در صفحهٔ آزمونِ همان مسیر — وقتی باز شود — نوشته شده است.'),
    el('p', { class: 'dcp-terms-fine' }, CERT_TEXT.fine),
    el('button', {
      class: 'dcp-btn dcp-btn-ghost dcp-ach-close', type: 'button',
      onclick: () => (onBack ? onBack() : closeSheet()),
    }, onBack ? 'بازگشت' : 'بستن'),
  ]);
}
