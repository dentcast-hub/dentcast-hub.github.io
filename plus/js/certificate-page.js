// /plus/certificate.html?c=DC-XXX-XXX — the public page for a pathway
// completion certificate: the document itself, and the verdict on it.
//
// No gate of any kind, on purpose: the reader of this page is whoever a
// certificate was shown to — an employer, a colleague, somebody clicking the
// "credential URL" on a LinkedIn profile — and they have no account here.
// The API side is the sessionless GET /certificates/verify/:code, which
// answers about the document and nothing else (name as printed, pathway,
// date, revoked-or-not). This page prints exactly that and computes nothing.
//
// Two things are on the page, in this order, and the order is the design:
//   1. the VERDICT — one sentence a stranger came here to read: genuine,
//      revoked, or no such certificate. Always above the sheet, because the
//      sheet is a picture and pictures can be faked; the verdict is what the
//      site says.
//   2. the SHEET — the certificate as approved (2026-09-12): white, quiet,
//      start-aligned, no frame, the name in Amiri, one blue mark. Printable
//      to A4 landscape from the button under it — the browser's own print
//      does Persian shaping, which is why there is no PDF library.
//
// Four states, and conflating any two is the bug:
//   · found + live     → «این گواهی اصل است» + the sheet.
//   · found + revoked  → «باطل شده» + the sheet, greyed. Still shown: a
//                        revoked code is a record, and hiding it would read
//                        as "never existed" to the person checking.
//   · not found (404)  → «ثبت نشده» — and nothing more, so the page cannot
//                        tell a mistyped code from a forged one any faster
//                        than guessing.
//   · anything else    → «نتوانستیم بررسی کنیم» — a dead API is not a forged
//                        certificate, and must never be printed as one.
import { el } from './util.js?v=76';
import { api } from './api.js?v=76';
import { registerSW } from './pwa.js?v=76';
import { downloadCertificate } from './certificate-image.js?v=76';

const LOGO = '/logo-v2.png';
const VERIFY_HOST = 'dentcast.ir/plus/certificate.html';
const SIGNER = { name: 'دکتر فواد شهابیان', role: 'بنیان‌گذار دنت‌کست' };
const OFFERED = 'یک مسیر یادگیری در دنت‌کست — جامع‌ترین منبع فارسی پروتز';
const FINE = 'دنت‌کست تکمیل این مسیر و قبولی در آزمون پایانی آن را تأیید می‌کند. این گواهی امتیاز بازآموزی یا مدرک رسمی محسوب نمی‌شود.';

const FA_DATE = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
export const when = (iso) => { try { return FA_DATE.format(new Date(iso)); } catch (_) { return ''; } };

/** Normalise what a human typed: case, spaces, a missing or doubled dash. */
export function cleanCode(raw) {
  const s = String(raw || '').trim().toUpperCase().replace(/[\s_]+/g, '').replace(/-+/g, '-');
  // "DCK4M7QA" → "DC-K4M-7QA" so a code retyped without dashes still matches.
  const bare = s.replace(/-/g, '');
  if (/^[A-Z0-9]{8}$/.test(bare)) return `${bare.slice(0, 2)}-${bare.slice(2, 5)}-${bare.slice(5)}`;
  return s;
}

function codeFromUrl() {
  return cleanCode(new URLSearchParams(location.search).get('c') || '');
}

/* ------------------------------------------------------------ the sheet -- */

/** The certificate as approved. `v` is the verify payload; nothing else. */
export function sheet(v) {
  return el('div', { class: 'dc-cert-shell' }, [
    el('div', { class: 'dc-cert' + (v.revoked ? ' is-revoked' : ''), 'data-cert-sheet': '' }, [
      el('div', { class: 'dc-cert-top' }, [
        el('div', { class: 'dc-cert-mark' }, [
          el('img', { src: LOGO, alt: '' }),
          el('b', {}, 'دنت‌کست'),
        ]),
        el('div', { class: 'dc-cert-kicker' }, v.revoked ? 'باطل شده' : 'گواهی‌نامهٔ تکمیل مسیر یادگیری'),
      ]),
      el('div', { class: 'dc-cert-body' }, [
        el('div', { class: 'dc-cert-date' }, when(v.issued_at)),
        el('div', { class: 'dc-cert-holder' }, v.holder_name || '—'),
        el('div', { class: 'dc-cert-lead' }, 'مسیر یادگیریِ'),
        el('div', { class: 'dc-cert-pathway' }, v.pathway_title_fa),
        el('div', { class: 'dc-cert-lead' }, 'را با موفقیت به پایان رسانده و آزمون پایانی آن را گذرانده است.'),
        el('div', { class: 'dc-cert-offered' }, OFFERED),
      ]),
      el('div', { class: 'dc-cert-foot' }, [
        el('div', { class: 'dc-cert-sig' }, [
          el('div', { class: 'dc-cert-sig-line' }),
          el('div', { class: 'dc-cert-sig-name' }, SIGNER.name),
          el('div', { class: 'dc-cert-sig-role' }, SIGNER.role),
        ]),
        el('div', { class: 'dc-cert-ver' }, [
          el('div', { class: 'dc-cert-ver-badge' }, [el('i', {}, '✓'), ' گواهی تأییدشده']),
          el('div', { class: 'dc-cert-ver-id' }, v.verify_code),
          el('div', { class: 'dc-cert-ver-url' }, VERIFY_HOST),
        ]),
      ]),
      el('div', { class: 'dc-cert-fine' }, FINE),
    ]),
  ]);
}

/* ---------------------------------------------------------- the verdict -- */

/** What the site says about this code. Pure: state in, {kind, title, text} out. */
export function verdictFor(state, v) {
  if (state === 'ok') {
    return {
      kind: 'ok', title: 'این گواهی اصل است.',
      text: `دنت‌کست تأیید می‌کند که ${v.holder_name} مسیر یادگیریِ «${v.pathway_title_fa}» را با موفقیت به پایان رسانده و آزمون پایانی آن را گذرانده است. صادر شده در ${when(v.issued_at)}.`,
    };
  }
  if (state === 'revoked') {
    return {
      kind: 'revoked', title: 'این گواهی باطل شده است.',
      text: `شمارهٔ ${v.verify_code} زمانی معتبر بوده، اما دنت‌کست آن را${v.revoked_at ? ` در ${when(v.revoked_at)}` : ''} باطل کرده است و دیگر تأییدش نمی‌کند.`,
    };
  }
  if (state === 'missing') {
    return {
      kind: 'missing', title: 'گواهی‌ای با این شماره در دنت‌کست ثبت نشده است.',
      text: 'شماره را دوباره بررسی کنید. اگر مطمئنید درست است، این گواهی از سوی دنت‌کست صادر نشده.',
    };
  }
  return {
    kind: 'unreachable', title: 'نتوانستیم گواهی را بررسی کنیم.',
    text: 'دسترسی به سرور برقرار نشد. کمی بعد دوباره امتحان کنید — این به معنای نامعتبر بودن گواهی نیست.',
  };
}

function verdictBlock(vd) {
  const glyph = vd.kind === 'ok' ? '✓' : vd.kind === 'revoked' ? '✕' : '?';
  return el('div', { class: `dc-cert-verdict ${vd.kind}`, role: 'status', 'data-cert-verdict': vd.kind }, [
    el('i', {}, glyph),
    el('div', {}, [el('b', {}, vd.title), el('p', {}, vd.text)]),
  ]);
}

/* ----------------------------------------------------------- the lookup -- */

function lookupForm(initial, onGo) {
  const input = el('input', {
    id: 'certCode', class: 'dcp-input', type: 'text', placeholder: 'DC-XXX-XXX', value: initial || '',
    autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false',
    'aria-label': 'شمارهٔ گواهی',
  });
  const btn = el('button', { id: 'certGo', class: 'dcp-btn', type: 'submit' }, 'بررسی اصالت');
  const form = el('form', { class: 'dc-cert-lookup' }, [input, btn]);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const code = cleanCode(input.value);
    if (!code) return;
    onGo(code);
  });
  return form;
}

function intro() {
  return el('div', { class: 'dc-cert-intro' }, [
    el('div', { class: 'dcp-dash-hello' }, 'بررسی اصالت گواهی'),
    el('p', { class: 'dcp-muted' }, 'شمارهٔ روی گواهی را وارد کنید تا دنت‌کست تأیید کند این گواهی اصل است و مسیر آن به پایان رسیده.'),
  ]);
}

/* ---------------------------------------------------------- downloads -- */

/**
 * PNG, drawn on a canvas by certificate-image.js — no library, and no server
 * round trip. Print stays beside it because a PNG is what goes on LinkedIn
 * and a PDF is what gets attached to an email; neither replaces the other.
 */
function downloadBtn(label, v, format, id) {
  const btn = el('button', {
    id, class: 'dcp-btn' + (format === 'a4' ? '' : ' dcp-btn-ghost'), type: 'button',
  }, label);
  btn.addEventListener('click', async () => {
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'در حال ساخت…';
    try {
      await downloadCertificate(v, format);
      btn.textContent = 'دانلود شد ✓';
    } catch (_) {
      btn.textContent = 'ساخته نشد';
    }
    setTimeout(() => { btn.disabled = false; btn.textContent = original; }, 1800);
  });
  return btn;
}

function printBtn() {
  const btn = el('button', { id: 'certPrint', class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'چاپ / ذخیره به PDF');
  btn.addEventListener('click', () => window.print());
  return btn;
}

/* ------------------------------------------------------------- the page -- */

/**
 * Render the page into `root` for `code` (empty = the lookup alone).
 * Exported for the DOM test; the page itself boots at the bottom.
 */
export async function renderCertificate(root, code) {
  const go = (c) => {
    const url = new URL(location.href);
    url.searchParams.set('c', c);
    history.replaceState(null, '', url);
    renderCertificate(root, c);
  };

  if (!code) {
    root.replaceChildren(el('div', { class: 'dc-cert-page' }, [intro(), lookupForm('', go)]));
    return;
  }

  root.replaceChildren(el('div', { class: 'dc-cert-page' }, [
    intro(), lookupForm(code, go),
    el('div', { class: 'dcp-loading' }, 'در حال بررسی…'),
  ]));

  let state = 'unreachable';
  let v = null;
  try {
    const res = await api.certificateVerify(code);
    v = res.certificate;
    state = v.revoked ? 'revoked' : 'ok';
  } catch (e) {
    state = e && e.status === 404 ? 'missing' : 'unreachable';
  }

  const parts = [intro(), lookupForm(code, go), verdictBlock(verdictFor(state, v))];
  if (v) {
    parts.push(sheet(v), el('div', { class: 'dc-cert-actions' }, [
      downloadBtn('دانلود گواهی (PNG)', v, 'a4', 'certDownload'),
      downloadBtn('نسخهٔ مربع برای استوری', v, 'square', 'certDownloadSquare'),
      printBtn(),
    ]));
  }
  root.replaceChildren(el('div', { class: 'dc-cert-page' }, parts));
}

// Boot only on the real page. The DOM test renders into its own root.
const pageRoot = document.getElementById('dcp-root');
if (pageRoot) {
  registerSW();
  renderCertificate(pageRoot, codeFromUrl());
}
