// «گواهی‌نامه‌ها» — the wall of pathway certificates, and the sheet one opens.
//
// The shape is the badge wall's, deliberately (.dcp-bg-* vocabulary, one disc
// per thing, locked ones dashed and dim): a reader meets this section right
// under «افتخارات» and should not have to learn a second way of reading a
// shelf. What differs is what a disc MEANS. A badge disc is a level — bronze,
// silver, gold — so it carries a metal. A certificate has no levels: you hold
// it or you do not, so the earned disc wears the site's green tick and the
// unearned one is simply waiting.
//
// Every full pathway is on the wall, not only the earned ones — same argument
// the badge wall makes, and the reason `GET /certificates` returns the whole
// catalog: a shelf showing only what you have says nothing about what there
// is to earn.
//
// A revoked certificate does NOT tick its pathway. The wall shows what stands
// today; the record of a revoked one lives in the API's `certificates` list
// and on its own verify page, which still answers for the code.
import { el, faNum, icon } from './util.js?v=74';
import { openSheet, closeSheet } from './sheet.js?v=74';
import { downloadCertificate } from './certificate-image.js?v=74';

const FA_DATE = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const when = (iso) => { try { return FA_DATE.format(new Date(iso)); } catch (_) { return ''; } };

const origin = () => (typeof location !== 'undefined' && location.origin) || 'https://dentcast.ir';
const absoluteVerifyUrl = (c) => origin() + c.verify_url;

/* ---------------------------------------------------------------- copy -- */

async function copyTo(btn, textValue, done = 'کپی شد ✓') {
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(textValue);
    btn.textContent = done;
  } catch (_) {
    btn.textContent = 'کپی نشد';
  }
  setTimeout(() => { btn.textContent = original; }, 1600);
}

function copyRow(label, value, { ltr = false } = {}) {
  const btn = el('button', { class: 'dcp-btn dcp-btn-ghost dcp-btn-sm', type: 'button' }, 'کپی');
  btn.addEventListener('click', () => copyTo(btn, value));
  return el('div', { class: 'dcp-cert-field' }, [
    el('span', { class: 'dcp-cert-field-k' }, label),
    el('span', { class: 'dcp-cert-field-v', dir: ltr ? 'ltr' : 'rtl' }, value),
    btn,
  ]);
}

/* --------------------------------------------------------------- sheet -- */

/**
 * What LinkedIn's «Licenses & certifications» form asks for, in its own
 * order, ready to paste.
 *
 * This is here because the flow the founder wants — the certificate showing
 * up on a LinkedIn profile — is not an integration, it is five fields typed
 * once. LinkedIn stores «Credential ID» and «Credential URL» and renders a
 * «Show credential» button from them; the URL is our verify page, so pressing
 * it lands on the document with the verdict above it. Handing over the exact
 * strings is the whole of what we can usefully do, and it removes the step
 * where somebody types the code wrong.
 */
function linkedinFields(c) {
  return el('div', { class: 'dcp-cert-linkedin' }, [
    el('div', { class: 'dcp-cert-sub' }, 'برای افزودن به لینکدین (بخش Licenses & certifications):'),
    copyRow('Name', `${c.pathway_title_fa} — گواهی‌نامهٔ تکمیل مسیر یادگیری`),
    copyRow('Issuing organization', 'دنت‌کست'),
    copyRow('Credential ID', c.verify_code, { ltr: true }),
    copyRow('Credential URL', absoluteVerifyUrl(c), { ltr: true }),
  ]);
}

function downloadRow(c) {
  const mk = (label, format) => {
    const btn = el('button', { class: 'dcp-btn' + (format === 'a4' ? '' : ' dcp-btn-ghost'), type: 'button' }, label);
    btn.addEventListener('click', async () => {
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'در حال ساخت…';
      try {
        await downloadCertificate(c, format);
        btn.textContent = 'دانلود شد ✓';
      } catch (_) {
        btn.textContent = 'ساخته نشد';
      }
      setTimeout(() => { btn.disabled = false; btn.textContent = original; }, 1800);
    });
    return btn;
  };
  return el('div', { class: 'dcp-cert-actions' }, [
    mk('دانلود گواهی (PNG)', 'a4'),
    mk('نسخهٔ مربع برای استوری', 'square'),
    el('a', {
      class: 'dcp-btn dcp-btn-ghost', href: c.verify_url, target: '_blank', rel: 'noopener',
    }, 'صفحهٔ تأیید ›'),
  ]);
}

/** The card a held certificate opens. */
export function heldCard(c) {
  return el('div', { class: 'dcp-cert-card' }, [
    el('div', { class: 'dcp-cert-card-hd' }, [
      el('span', { class: 'dcp-cert-tick is-lg' }, '✓'),
      el('div', {}, [
        el('div', { class: 'dcp-cert-card-kicker' }, 'گواهی‌نامهٔ تکمیل مسیر یادگیری'),
        el('b', {}, c.pathway_title_fa),
      ]),
    ]),
    el('p', { class: 'dcp-cert-card-lead' },
      `به نام ${c.holder_name || '—'} · صادر شده در ${when(c.issued_at)}`),
    el('div', { class: 'dcp-cert-code-row' }, [
      el('code', { class: 'dcp-cert-code', dir: 'ltr' }, c.verify_code),
      (() => {
        const b = el('button', { class: 'dcp-btn dcp-btn-ghost dcp-btn-sm', type: 'button' }, 'کپی کد');
        b.addEventListener('click', () => copyTo(b, c.verify_code));
        return b;
      })(),
    ]),
    downloadRow(c),
    linkedinFields(c),
    el('button', {
      class: 'dcp-btn dcp-btn-ghost dcp-ach-close', type: 'button', onclick: () => closeSheet(),
    }, 'بستن'),
  ]);
}

const LOCKED_LINE = {
  ready: ['آزمون برایت باز است', 'مسیر را تمام کرده‌ای (یا زودتر راه داده شده‌ای). با قبولی در آزمون، گواهی‌نامه به نام خودت صادر می‌شود.', 'رفتن به آزمون'],
  open: ['یک آزمون نیمه‌کاره داری', 'سؤال‌ها همان‌هایی‌اند که دیده‌ای؛ برگرد و ارسال کن.', 'ادامهٔ آزمون'],
  queued: ['پاسخ‌هایت در حال بررسی است', 'نتیجهٔ آزمون در «اطلاعیه» می‌آید و گواهی همان لحظه صادر می‌شود.', 'دیدن وضعیت'],
  wait: ['این بار به نصاب نرسید', 'تلاش بعدی به‌زودی باز می‌شود — تاریخش در صفحهٔ آزمون.', 'دیدن نتیجه'],
  exhausted: ['تلاش‌های آزمون تمام شد', 'نتیجه در صفحهٔ آزمون است.', 'دیدن نتیجه'],
};

/**
 * The card an un-earned pathway opens: what it is, and how it is earned —
 * or, when an exam is already in play (`p.exam.state` from GET
 * /certificates), where it stands and the way to it.
 */
export function lockedCard(p) {
  const ex = p.exam && LOCKED_LINE[p.exam.state];
  const examHref = (p.exam && p.exam.url) || `/plus/exam.html?id=${encodeURIComponent(p.id)}`;
  return el('div', { class: 'dcp-cert-card', 'data-cert-exam': (p.exam && p.exam.state) || '' }, [
    el('div', { class: 'dcp-cert-card-hd' }, [
      el('span', { class: 'dcp-bg-disc is-md is-off' }, [icon(p.glyph || 'icon-flag', { class: 'dcp-cert-ico' })]),
      el('div', {}, [
        el('div', { class: 'dcp-cert-card-kicker' }, ex ? ex[0] : 'هنوز صادر نشده'),
        el('b', {}, p.title_fa),
      ]),
    ]),
    el('p', { class: 'dcp-cert-card-lead' }, ex ? ex[1]
      : 'این مسیر را تا آخرین قدم بخوان؛ نزدیک پایان، آزمونِ مسیر برایت گذاشته می‌شود و با قبولی در آن، گواهی‌نامه به نام خودت صادر می‌شود.'),
    el('div', { class: 'dcp-cert-actions' }, [
      ex ? el('a', { class: 'dcp-btn', href: examHref }, ex[2]) : null,
      el('a', { class: 'dcp-btn' + (ex ? ' dcp-btn-ghost' : ''), href: `/plus/pathway.html?id=${encodeURIComponent(p.id)}` }, 'رفتن به مسیر'),
    ].filter(Boolean)),
    el('button', {
      class: 'dcp-btn dcp-btn-ghost dcp-ach-close', type: 'button', onclick: () => closeSheet(),
    }, 'بستن'),
  ]);
}

/* ---------------------------------------------------------------- wall -- */

function tile(p) {
  const held = p.certificate;
  const disc = el('span', { class: 'dcp-bg-disc is-sm dcp-cert-disc ' + (held ? 'is-on' : 'is-off') }, [
    icon(p.glyph || 'icon-flag', { class: 'dcp-cert-ico' }),
  ]);
  // The green tick rides ON the disc, the way a stamp lands on a document —
  // not beside the name, where it would read as a list bullet.
  if (held) disc.appendChild(el('span', { class: 'dcp-cert-tick' }, '✓'));
  return el('button', {
    class: 'dcp-bg-tile', type: 'button',
    'aria-label': (held ? 'گواهی‌نامهٔ مسیر ' : 'مسیر ') + p.title_fa,
    onclick: () => openSheet(held ? heldCard(held) : lockedCard(p)),
  }, [
    disc,
    // The SHORT label here, the full title inside the sheet: «دندانپزشکی
    // بیومیمتیک و ترمیم ادهزیو» under a 56px disc is four wrapped lines and
    // the grid stops reading as a grid. Falls back to the full title, so a
    // pathway added without a short_fa still draws.
    el('span', { class: 'dcp-bg-name' + (held ? '' : ' is-off') }, p.short_fa || p.title_fa),
    el('span', { class: 'dcp-bg-bar-spacer' }),
  ]);
}

/**
 * The section body, or null when there is nothing to draw — the profile drops
 * the whole section in that case rather than printing an empty shelf.
 */
export function certificatesBody(data) {
  const pathways = data && Array.isArray(data.pathways) ? data.pathways : [];
  if (!pathways.length) return null;
  const held = pathways.filter((p) => p.certificate).length;
  return el('div', {}, [
    el('p', { class: 'dcp-cert-tally' }, held
      ? `${faNum(held)} گواهی‌نامه از ${faNum(pathways.length)} مسیر.`
      : 'با تمام‌کردن یک مسیر و قبولی در آزمون آن، گواهی‌نامه‌اش این‌جا می‌نشیند.'),
    el('div', { class: 'dcp-bg-wall' }, pathways.map(tile)),
  ]);
}
