// /plus/certificate.html?c=DC-XXX-XXX — the public verify page for a pathway
// completion certificate.
//
// No gate of any kind, on purpose: the reader of this page is whoever a
// certificate was shown to — an employer, a colleague, somebody clicking the
// "credential URL" on a LinkedIn profile — and they have no account here.
// The API side is the sessionless GET /certificates/verify/:code, which
// answers about the document and nothing else (name as printed, pathway,
// date, revoked-or-not). This page prints exactly that and computes nothing.
//
// Two answers and a third state, and conflating them is the bug:
//   · found + live     → the certificate, green.
//   · found + revoked  → the certificate, marked باطل. Still shown: a revoked
//                        code is a record, and hiding it would read as
//                        "never existed" to the person checking.
//   · not found (404)  → «چنین گواهی‌ای ثبت نشده» — and nothing more, so the
//                        page cannot be used to tell a mistyped code from a
//                        forged one any faster than guessing.
//   · anything else    → «نتوانستیم بررسی کنیم» — a dead API is not a forged
//                        certificate, and must never be printed as one.
import { el } from './util.js?v=69';
import { api } from './api.js?v=69';
import { registerSW } from './pwa.js?v=69';

const FA_DATE = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const when = (iso) => { try { return FA_DATE.format(new Date(iso)); } catch (_) { return ''; } };

function codeFromUrl() {
  const c = new URLSearchParams(location.search).get('c') || '';
  return c.trim().toUpperCase();
}

function lookupForm(initial) {
  const input = el('input', {
    class: 'dcp-input', type: 'text', placeholder: 'DC-XXX-XXX', value: initial || '',
    autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false',
  });
  const btn = el('button', { class: 'dcp-btn', type: 'button' }, 'بررسی');
  const form = el('form', { class: 'dcp-cert-lookup' }, [input, btn]);
  const go = (ev) => {
    if (ev) ev.preventDefault();
    const code = input.value.trim().toUpperCase();
    if (!code) return;
    const url = new URL(location.href);
    url.searchParams.set('c', code);
    history.replaceState(null, '', url);
    render(code);
  };
  form.addEventListener('submit', go);
  btn.addEventListener('click', go);
  return form;
}

function card(v) {
  const live = !v.revoked;
  return el('div', { class: 'dcp-cert-card' }, [
    el('div', { class: 'dcp-cert-kicker' }, 'گواهی تکمیل مسیر مطالعه · دنت‌کست'),
    el('div', { class: 'dcp-cert-holder' }, v.holder_name || '—'),
    el('div', { class: 'dcp-cert-pathway' }, `مسیر «${v.pathway_title_fa}» را تا آخرین قدم خواند و آزمونِ آن را گذراند.`),
    el('div', { class: 'dcp-cert-meta' }, `صادر شده در ${when(v.issued_at)}`),
    el('div', { class: 'dcp-cert-code', dir: 'ltr' }, v.verify_code),
    el('div', { class: 'dcp-cert-state ' + (live ? 'ok' : 'revoked') },
      live ? 'معتبر' : `باطل‌شده${v.revoked_at ? ` در ${when(v.revoked_at)}` : ''}`),
    // Said on the document itself, not in a footnote, because the one thing a
    // certificate from a podcast must never be mistaken for is a CE credit.
    el('div', { class: 'dcp-cert-note' },
      'این گواهی تکمیلِ یک مسیرِ مطالعهٔ علمی در دنت‌کست را تأیید می‌کند. '
      + 'امتیازِ بازآموزی نیست و جایگزینِ هیچ مدرکِ رسمی نمی‌شود.'),
  ]);
}

function message(kind, text) {
  return el('div', { class: 'dcp-gate' }, [
    el('p', {}, text),
    kind === 'unreachable'
      ? el('p', { class: 'dcp-muted' }, 'دسترسی به سرور برقرار نشد. کمی بعد دوباره امتحان کن — این به معنای نامعتبر بودن گواهی نیست.')
      : null,
  ].filter(Boolean));
}

async function render(code) {
  const root = document.getElementById('dcp-root');
  if (!code) {
    root.replaceChildren(
      el('div', { class: 'dcp-dash-hello' }, 'تأیید گواهی'),
      el('p', { class: 'dcp-muted' }, 'کدِ روی گواهی را وارد کن.'),
      lookupForm(''),
    );
    return;
  }
  root.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بررسی…'));
  try {
    const res = await api.certificateVerify(code);
    root.replaceChildren(card(res.certificate), lookupForm(code));
  } catch (e) {
    if (e && e.status === 404) {
      root.replaceChildren(message('missing', 'چنین گواهی‌ای ثبت نشده است.'), lookupForm(code));
    } else {
      root.replaceChildren(message('unreachable', 'نتوانستیم گواهی را بررسی کنیم.'), lookupForm(code));
    }
  }
}

registerSW();
render(codeFromUrl());
