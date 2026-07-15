// Profile page (spec 2.7): pseudonym (editable), plan, week streak strip,
// records, month-vs-month, phone, Telegram link status, reminders, export my
// highlights, logout.
import { el, faNum } from './util.js';
import { currentUser, api } from './api.js';
import { openLoginModal } from './login-modal.js';
import { registerSW } from './pwa.js';

const DAY_LETTERS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']; // not weekday-aligned; strip is chronological

function section(title, body) {
  return el('section', { class: 'dcp-dash-sec' }, [el('h2', { class: 'dcp-dash-h2' }, title), body]);
}

function showGate(root) {
  const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
  btn.addEventListener('click', async () => {
    const res = await openLoginModal({ returnTo: '/plus/profile.html' });
    if (res && res.user) location.reload();
  });
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [el('p', {}, 'برای دیدن پروفایل وارد شوید.'), btn]));
}

function pseudonymBlock(me) {
  const input = el('input', { class: 'dcp-input', value: me.display_name || '', maxlength: '40' });
  const msg = el('span', { class: 'dcp-inline-msg' });
  const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ذخیره');
  save.addEventListener('click', async () => {
    const name = input.value.trim();
    if (!name) { msg.textContent = 'نام نمی‌تواند خالی باشد.'; return; }
    save.disabled = true;
    try { await api.updateMe({ display_name: name }); msg.textContent = 'ذخیره شد.'; }
    catch (_) { msg.textContent = 'خطا در ذخیره.'; }
    save.disabled = false;
  });
  return el('div', { class: 'dcp-field-row' }, [input, save, msg]);
}

function weekStrip(week) {
  const strip = el('div', { class: 'dcp-week-strip' });
  week.forEach((d, i) => {
    strip.appendChild(el('div', { class: 'dcp-week-cell' + (d.active ? ' is-active' : ''), title: d.day }, [
      el('span', { class: 'dcp-week-dot' }, d.active ? '🔥' : ''),
      el('span', { class: 'dcp-week-lbl' }, DAY_LETTERS[i]),
    ]));
  });
  return strip;
}

function monthCompare(m) {
  const row = (label, a, b) => {
    const diff = a - b;
    const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '=';
    return el('div', { class: 'dcp-cmp-row' }, [
      el('span', {}, label),
      el('span', {}, faNum(a) + ' این ماه'),
      el('span', { class: 'dcp-cmp-arrow ' + (diff >= 0 ? 'up' : 'down') }, arrow + ' ' + faNum(Math.abs(diff))),
    ]);
  };
  return el('div', { class: 'dcp-cmp' }, [
    row('هایلایت', m.highlights_this, m.highlights_last),
    row('روزهای فعال', m.active_days_this, m.active_days_last),
    el('p', { class: 'dcp-muted' }, 'رقابت با خودتان، نه دیگران.'),
  ]);
}

function remindersBlock(me) {
  const enabled = !!(me.settings && me.settings.reminders && me.settings.reminders.enabled);
  const cb = el('input', { type: 'checkbox' });
  cb.checked = enabled;
  cb.addEventListener('change', async () => {
    await api.updateMe({ settings: { reminders: { enabled: cb.checked } } }).catch(() => {});
  });
  return el('label', { class: 'dcp-switch' }, [cb, el('span', {}, 'یادآوری‌های مطالعه')]);
}

function exportBlock() {
  const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'دریافت هایلایت‌های من');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const data = await api.exportHighlights();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = el('a', { href: url, download: 'dentcast-highlights.json' });
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (_) { /* ignore */ }
    btn.disabled = false;
  });
  return el('div', {}, [
    btn,
    el('p', { class: 'dcp-muted' }, 'داده شما همیشه و در هر پلنی قابل دریافت است.'),
  ]);
}

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;
  const user = await currentUser();
  if (!user) { showGate(root); return; }

  root.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  const [me, stats] = await Promise.all([
    api.me().catch(() => user),
    api.profileStats().catch(() => ({ week: [], month_vs_month: null, records: {} })),
  ]);

  const planNote = me.tier === 'premium' ? 'پریمیوم' : 'رایگان';
  const logoutBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'خروج از حساب');
  logoutBtn.addEventListener('click', async () => { await api.logout().catch(() => {}); location.href = '/'; });

  root.replaceChildren(
    el('div', { class: 'dcp-dash-hello' }, 'پروفایل'),
    section('نام مستعار', pseudonymBlock(me)),
    section('پلن', el('div', {}, [
      el('div', { class: 'dcp-plan' }, planNote),
      el('p', { class: 'dcp-muted' }, 'نسخه بتای باز. کاربران اولیه هنگام فعال شدن پریمیوم مزایای عضو مؤسس می‌گیرند.'),
    ])),
    section('هفته شما', stats.week && stats.week.length ? weekStrip(stats.week) : el('div', { class: 'dcp-muted' }, '—')),
    section('رکوردها', el('div', { class: 'dcp-records' }, [
      el('div', {}, 'استریک فعلی: ' + faNum(stats.records?.current_streak || 0) + ' روز'),
      el('div', {}, 'بلندترین استریک: ' + faNum(stats.records?.longest_streak || 0) + ' روز'),
    ])),
    section('مقایسه ماه به ماه', stats.month_vs_month ? monthCompare(stats.month_vs_month) : el('div', { class: 'dcp-muted' }, '—')),
    section('شماره موبایل', el('div', { dir: 'ltr', class: 'dcp-phone' }, me.phone || '—')),
    section('تلگرام', el('div', {}, [
      el('div', {}, me.telegram_linked ? 'متصل است.' : 'هنوز متصل نشده است.'),
      el('p', { class: 'dcp-muted' }, 'اتصال تلگرام برای یادآوری‌ها از طریق ربات انجام می‌شود.'),
    ])),
    section('یادآوری‌ها', remindersBlock(me)),
    section('داده‌های من', exportBlock()),
    el('div', { class: 'dcp-dash-sec' }, [logoutBtn]),
  );
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
