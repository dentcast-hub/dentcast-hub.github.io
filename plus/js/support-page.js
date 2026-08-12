// /plus/support.html — the reader's own support threads.
//
// The gate here is deliberately NOT the one every other /plus page uses. Those
// pages are premium features, so anonymous -> login and free -> upsell. This
// page is a door, and the reader most likely to need it is the one who is not
// premium yet: the student asking for a discount, the person whose payment did
// not activate. So a signed-in reader ALWAYS gets the real view. Since
// «پشتیبانی و مشاوره» left the form (services/support.ts FORM_KINDS — the
// premium question path is now «گفت‌وگوی زیر مطلب», under an article), no kind
// this form offers is ever locked, so there is nothing left to grey out here.
import { el, faNum } from './util.js';
import { currentUser, meStatus, api } from './api.js';
import { unreachableGate } from './premium-cta.js';
import { openLoginModal } from './login-modal.js';
import { registerSW } from './pwa.js';

const FA_DATE = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
});
const when = (iso) => { try { return FA_DATE.format(new Date(iso)); } catch (_) { return ''; } };

// Fixed on purpose (handoff decision 2.6) — the only inbox the Bale bot photo
// path does not silently swallow. Not read from the API: it is not a setting a
// reader ever needs to be told is configurable.
const SUPPORT_TELEGRAM_URL = 'https://t.me/dentcast_support';

async function copyToClipboard(text, btn) {
  const original = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'کپی شد ✓';
  } catch (_) {
    btn.textContent = 'کپی نشد';
  }
  setTimeout(() => { btn.textContent = original; }, 1600);
}

/* ------------------------------------------------------------- the form -- */

// «نمی‌توانم از درگاه استفاده کنم» is a DOOR, not a kind: it carries no
// data-kind and never opens a ticket — it sends the reader to the purchase
// page, where واریز به حساب (or the gift-card rail) actually solves this
// (handoff decision 2.10). A ticket here has no months, no confirm button and
// no link to a subscription; it would just get lost among bug reports.
const ROUTE_CHIP_ICON = '🏦';
const ROUTE_CHIP_LABEL = 'نمی‌توانم از درگاه استفاده کنم';
const KIND_ICON = { bug: '🛠️', billing: '💳', student: '🎓' };

function kindChip(k, selected, onPick) {
  const btn = el('button', {
    type: 'button',
    class: 'dcp-chip dcp-support-kind' + (selected ? ' is-active' : ''),
  }, `${KIND_ICON[k.key] || ''} ${k.title_fa}`);
  btn.addEventListener('click', () => onPick(k.key));
  return btn;
}

function routeChip() {
  const a = el('a', {
    class: 'dcp-chip dcp-support-kind dcp-support-kind-route',
    href: '/plus/pricing.html',
  }, `${ROUTE_CHIP_ICON} ${ROUTE_CHIP_LABEL} ›`);
  return a;
}

function newTicketForm(kinds, onDone) {
  let selected = (kinds.find((k) => !k.locked) || kinds[0] || {}).key || '';

  const grid = el('div', { class: 'dcp-support-kinds' });
  const hint = el('p', { class: 'dcp-muted' }, '');
  const subject = el('input', { class: 'dcp-input', type: 'text', maxlength: '120', placeholder: 'موضوع' });
  const body = el('textarea', { class: 'dcp-input', rows: '5', maxlength: '4000', placeholder: 'توضیح بدهید…' });

  const photoChk = el('input', { type: 'checkbox', id: 'tk-photo' });
  const photoLabel = el('label', { for: 'tk-photo', class: 'dcp-support-photo-label' }, [
    photoChk, el('span', {}, 'عکسی دارم که برای این درخواست می‌فرستم'),
  ]);
  const photoNote = el('p', { class: 'dcp-muted dcp-support-photo-note' }, [
    'بعد از ثبت، کد پیگیری می‌گیرید. عکس را با همان کد به ',
    el('a', { href: SUPPORT_TELEGRAM_URL, target: '_blank', rel: 'noopener' }, 't.me/dentcast_support'),
    ' بفرستید.',
  ]);
  photoNote.hidden = true;
  photoChk.addEventListener('change', () => { photoNote.hidden = !photoChk.checked; });

  const out = el('div', { class: 'dcp-muted' }, '');
  const send = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ثبت درخواست');

  const drawGrid = () => {
    grid.replaceChildren(
      ...kinds.map((k) => kindChip(k, k.key === selected, (key) => { selected = key; drawGrid(); })),
      routeChip(),
    );
    const k = kinds.find((x) => x.key === selected);
    hint.textContent = k ? k.hint_fa : '';
  };
  drawGrid();

  send.addEventListener('click', async () => {
    const s = subject.value.trim();
    const b = body.value.trim();
    if (!selected) { out.textContent = 'یک دسته را انتخاب کنید.'; return; }
    if (!s || !b) { out.textContent = 'موضوع و متن هر دو لازم‌اند.'; return; }
    send.disabled = true;
    out.textContent = 'در حال ثبت…';
    try {
      const r = await api.openTicket({
        kind: selected, subject: s, body: b, has_photo: photoChk.checked,
      });
      subject.value = ''; body.value = ''; photoChk.checked = false; photoNote.hidden = true;
      out.textContent = '';
      onDone(r.ticket, photoChk.checked);
    } catch (e) {
      out.textContent = (e && e.body && e.body.message) || 'ثبت نشد. دوباره تلاش کنید.';
    } finally {
      send.disabled = false;
    }
  });

  return el('details', { class: 'dcp-card', style: 'margin-bottom:14px', open: '' }, [
    el('summary', {}, 'درخواست تازه'),
    el('div', { style: 'display:flex;flex-direction:column;gap:10px;margin-top:10px' },
      [grid, hint, subject, body, photoLabel, photoNote, send, out]),
  ]);
}

/** The panel shown right after a ticket is opened — the reference, and the
 *  Telegram hand-off only when the reader said a photo is coming. */
function successPanel(ticket, withPhoto) {
  const copyBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'کپی کد پیگیری');
  copyBtn.addEventListener('click', () => copyToClipboard(ticket.reference, copyBtn));

  const parts = [
    el('b', {}, '✅ درخواست ثبت شد'),
    el('p', { style: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap' }, [
      el('code', {}, ticket.reference), copyBtn,
    ]),
  ];
  if (withPhoto) {
    parts.push(
      el('p', {}, [
        'عکس را همراه همین کد به ',
        el('a', { href: SUPPORT_TELEGRAM_URL, target: '_blank', rel: 'noopener' }, 't.me/dentcast_support'),
        ' بفرستید. بدون کد، عکس به درخواست شما وصل نمی‌شود.',
      ]),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: SUPPORT_TELEGRAM_URL, target: '_blank', rel: 'noopener' },
        'رفتن به تلگرام پشتیبانی'),
    );
  } else {
    parts.push(el('p', {}, 'اگر بعداً عکسی لازم شد، کد از پایین همین درخواست در دسترس می‌ماند.'));
  }
  return el('div', { class: 'dcp-card dcp-support-success' }, parts);
}

/* ----------------------------------------------------------- one thread -- */

function messageBubble(m) {
  return el('div', {
    class: 'dcp-card',
    style: 'padding:10px 12px;'
      + (m.author === 'founder' ? 'border-inline-start:3px solid var(--dcp-accent, #2f7de0);' : ''),
  }, [
    el('div', { class: 'dcp-muted', style: 'font-size:.78rem' },
      (m.author === 'founder' ? 'دنت‌کست' : 'شما') + ' · ' + when(m.created_at)),
    el('div', { style: 'white-space:pre-wrap;margin-top:4px' }, m.body),
  ]);
}

/** The code+copy row above every open thread — for when the photo comes later. */
function ticketCodeRow(ticket) {
  const copyBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'کپی');
  copyBtn.addEventListener('click', () => copyToClipboard(ticket.reference, copyBtn));
  return el('div', { class: 'dcp-support-code-row' }, [
    el('span', { class: 'dcp-muted' }, 'کد پیگیری'),
    el('code', {}, ticket.reference),
    copyBtn,
  ]);
}

async function openThread(host, ticket, refresh) {
  host.replaceChildren(el('p', { class: 'dcp-muted' }, 'در حال خواندن…'));
  let data;
  try { data = await api.ticket(ticket.id); } catch (_) {
    host.replaceChildren(el('p', { class: 'dcp-muted' }, 'خوانده نشد.'));
    return;
  }
  const closed = data.ticket.status === 'closed';
  const thread = el('div', { style: 'display:flex;flex-direction:column;gap:8px;margin:10px 0' },
    data.messages.map(messageBubble));

  const parts = [ticketCodeRow(data.ticket), thread];

  if (closed) {
    const reopen = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'بازکردن دوباره');
    reopen.addEventListener('click', async () => {
      await api.reopenTicket(ticket.id).catch(() => {});
      refresh();
    });
    parts.push(el('p', { class: 'dcp-muted' }, 'این گفت‌وگو بسته شده است.'), reopen);
  } else {
    const box = el('textarea', { class: 'dcp-input', rows: '3', maxlength: '4000', placeholder: 'پاسخ…' });
    const out = el('div', { class: 'dcp-muted' }, '');
    const send = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ارسال');
    const close = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'بستن گفت‌وگو');
    send.addEventListener('click', async () => {
      const b = box.value.trim();
      if (!b) { out.textContent = 'متن خالی است.'; return; }
      send.disabled = true;
      try {
        await api.replyTicket(ticket.id, b);
        box.value = '';
        await openThread(host, ticket, refresh);
      } catch (e) {
        out.textContent = (e && e.body && e.body.message) || 'ارسال نشد.';
      } finally { send.disabled = false; }
    });
    close.addEventListener('click', async () => {
      await api.closeTicket(ticket.id).catch(() => {});
      refresh();
    });
    parts.push(box, el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, [send, close]), out);
  }

  host.replaceChildren(...parts);
}

/* ------------------------------------------------------------- the list -- */

function ticketCard(t, refresh) {
  const host = el('div', {});
  const badge = (text, hot) => el('span', {
    class: 'dcp-chip',
    style: hot ? 'background:#3a2a12;color:#e3b849' : null,
  }, text);

  const head = el('div', { style: 'display:flex;flex-wrap:wrap;gap:6px;align-items:center' }, [
    el('b', {}, t.subject),
    badge(t.kind_title_fa),
    badge(t.reference),
    t.has_photo ? badge('📎 عکس در راه', true) : null,
    t.status === 'closed'
      ? badge('بسته')
      : badge(t.awaiting === 'user' ? 'پاسخ آمد' : 'در انتظار پاسخ', t.awaiting === 'user'),
  ].filter(Boolean));

  const card = el('div', { class: 'dcp-card', style: 'margin-bottom:10px', dataset: { ticket: t.id } }, [
    head,
    el('div', { class: 'dcp-muted', style: 'font-size:.8rem;margin-top:4px' },
      faNum(t.message_count) + ' پیام · آخرین: ' + when(t.last_at)),
    host,
  ]);

  head.style.cursor = 'pointer';
  head.addEventListener('click', () => {
    if (host.firstChild) host.replaceChildren();
    else openThread(host, t, refresh);
  });
  return card;
}

async function render(root) {
  const refresh = () => render(root);
  let kinds = [];
  let tickets = [];
  try {
    const [k, list] = await Promise.all([api.ticketKinds(), api.tickets()]);
    kinds = k.kinds || [];
    tickets = list.tickets || [];
  } catch (_) {
    root.replaceChildren(el('p', { class: 'dcp-muted' }, 'ارتباط با سرور برقرار نشد.'));
    return;
  }

  const formHost = el('div', {});
  const successHost = el('div', {});
  formHost.replaceChildren(newTicketForm(kinds, (ticket, withPhoto) => {
    successHost.replaceChildren(successPanel(ticket, withPhoto));
    refresh();
  }));

  root.replaceChildren(
    el('h2', { class: 'dcp-pw-heading' }, 'پشتیبانی'),
    el('p', { class: 'dcp-muted' },
      'مشکل فنی، مشکل در پرداخت یا تخفیف دانشجویی را این‌جا بنویسید. پاسخ در همین صفحه و در «اطلاعیه» به شما می‌رسد.'),
    successHost,
    formHost,
    tickets.length
      ? el('div', {}, tickets.map((t) => ticketCard(t, refresh)))
      : el('p', { class: 'dcp-muted' }, 'هنوز درخواستی ثبت نکرده‌اید.'),
  );

  // Deep link from the notification: /plus/support.html?t=<id> opens that thread,
  // so the reader lands ON the answer rather than on a list to search.
  const want = new URLSearchParams(location.search).get('t');
  const target = want && root.querySelector(`[data-ticket="${CSS.escape(want)}"]`);
  if (target) {
    target.firstChild.click();
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;

  const user = await currentUser();
  if (!user && meStatus() === 'error') { unreachableGate(root); return; }
  if (!user) {
    const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
    btn.addEventListener('click', async () => {
      const res = await openLoginModal({ returnTo: '/plus/support.html' });
      if (res && res.user) location.reload();
    });
    root.replaceChildren(el('div', { class: 'dcp-gate' }, [
      el('p', {}, 'برای ثبت و پیگیری درخواست پشتیبانی وارد شوید.'),
      btn,
    ]));
    return;
  }

  await render(root);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
