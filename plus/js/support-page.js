// /plus/support.html — the reader's own support threads.
//
// The gate here is deliberately NOT the one every other /plus page uses. Those
// pages are premium features, so anonymous -> login and free -> upsell. This
// page is a door, and the reader most likely to need it is the one who is not
// premium yet: the student asking for a discount, the person whose payment did
// not activate. So a signed-in reader ALWAYS gets the real view, and the plan
// only decides which KINDS the form offers — the locked one is shown as locked
// rather than hidden, because a door you cannot see is one you cannot decide
// about. The server enforces the same rule per kind (services/support.ts).
import { el, faNum } from './util.js';
import { currentUser, meStatus, api } from './api.js';
import { unreachableGate } from './premium-cta.js';
import { openLoginModal } from './login-modal.js';
import { registerSW } from './pwa.js';

const FA_DATE = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
});
const when = (iso) => { try { return FA_DATE.format(new Date(iso)); } catch (_) { return ''; } };

/* ------------------------------------------------------------- the form -- */

function newTicketForm(kinds, onDone) {
  const sel = el('select', { class: 'dcp-input', id: 'tk-kind' },
    kinds.map((k) => el('option', {
      value: k.key, disabled: k.locked ? '' : null,
    }, k.title_fa + (k.locked ? ' — ویژه‌ی پریمیوم' : ''))));

  const hint = el('p', { class: 'dcp-muted' }, '');
  const subject = el('input', { class: 'dcp-input', type: 'text', maxlength: '120', placeholder: 'موضوع' });
  const body = el('textarea', { class: 'dcp-input', rows: '5', maxlength: '4000', placeholder: 'توضیح بدهید…' });
  const out = el('div', { class: 'dcp-muted' }, '');
  const send = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ثبت درخواست');

  const syncHint = () => {
    const k = kinds.find((x) => x.key === sel.value);
    hint.textContent = k ? k.hint_fa : '';
  };
  sel.addEventListener('change', syncHint);

  // Land on the first kind this reader can actually use, so the form does not
  // open pre-refused.
  const firstOpen = kinds.find((k) => !k.locked);
  if (firstOpen) sel.value = firstOpen.key;
  syncHint();

  send.addEventListener('click', async () => {
    const s = subject.value.trim();
    const b = body.value.trim();
    if (!s || !b) { out.textContent = 'موضوع و متن هر دو لازم‌اند.'; return; }
    send.disabled = true;
    out.textContent = 'در حال ثبت…';
    try {
      const r = await api.openTicket({ kind: sel.value, subject: s, body: b });
      subject.value = ''; body.value = '';
      out.textContent = '';
      onDone(r.ticket);
    } catch (e) {
      out.textContent = (e && e.body && e.body.message) || 'ثبت نشد. دوباره تلاش کنید.';
    } finally {
      send.disabled = false;
    }
  });

  return el('details', { class: 'dcp-card', style: 'margin-bottom:14px' }, [
    el('summary', {}, 'درخواست تازه'),
    el('div', { style: 'display:flex;flex-direction:column;gap:10px;margin-top:10px' },
      [sel, hint, subject, body, send, out]),
  ]);
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

  const parts = [thread];

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
    t.status === 'closed'
      ? badge('بسته')
      : badge(t.awaiting === 'user' ? 'پاسخ آمد' : 'در انتظار پاسخ', t.awaiting === 'user'),
  ]);

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

  root.replaceChildren(
    el('h2', { class: 'dcp-pw-heading' }, 'پشتیبانی'),
    el('p', { class: 'dcp-muted' },
      'سؤال، مشکل پرداخت، گزارش باگ یا درخواست تخفیف دانشجویی را این‌جا بنویسید. پاسخ در همین صفحه و در «اطلاعیه» به شما می‌رسد.'),
    newTicketForm(kinds, () => refresh()),
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
