// Reusable profile renderer (spec 2.7). Used by the /plus/profile.html page and
// the header overlay. Site design language; a clear, readable week strip. Nothing
// here is mandatory: the pseudonym is editable, no real name is ever required.
import { el, faNum, tehranDay } from './util.js';
import { api } from './api.js';

const WEEKDAY_FA = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']; // Sun..Sat
function weekdayLetter(dayStr) {
  const [y, m, d] = dayStr.split('-').map(Number);
  return WEEKDAY_FA[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
function dayOfMonth(dayStr) { return faNum(Number(dayStr.split('-')[2])); }

function section(title, body) {
  return el('section', { class: 'dcp-dash-sec' }, [el('h2', { class: 'dcp-dash-h2' }, title), body]);
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
  return el('div', {}, [
    el('div', { class: 'dcp-field-row' }, [input, save, msg]),
    el('p', { class: 'dcp-sec-hint' }, 'نام واقعی لازم نیست. همین اسم مستعار در پروفایل و رقابت‌های آینده استفاده می‌شود.'),
  ]);
}

function weekStrip(week) {
  const today = tehranDay();
  // Saturday is week[0]. Render right-to-left and force the order at the element
  // level (dir + inline direction) so شنبه is always the first cell on the right,
  // regardless of any cached/ltr context.
  const strip = el('div', { class: 'dcp-week-strip', dir: 'rtl', style: 'direction:rtl' });
  for (const d of week) {
    const future = d.day > today; // this week can extend past today (Sat start)
    strip.appendChild(el('div', {
      class: 'dcp-week-cell'
        + (d.day === today ? ' is-today' : '')
        + (future ? ' is-future' : ''),
      title: d.day,
    }, [
      el('span', { class: 'dcp-week-day' }, weekdayLetter(d.day)),
      el('span', { class: 'dcp-week-date' }, dayOfMonth(d.day)),
      // Completed day = the streak flame (not a colour change).
      el('span', { class: 'dcp-week-flame', 'aria-hidden': 'true' }, d.active ? '🔥' : ''),
    ]));
  }
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
    el('p', { class: 'dcp-sec-hint' }, 'رقابت با خودتان، نه دیگران.'),
  ]);
}

function remindersBlock(me) {
  const enabled = !!(me.settings && me.settings.reminders && me.settings.reminders.enabled);
  const cb = el('input', { type: 'checkbox' });
  cb.checked = enabled;
  cb.addEventListener('change', () => api.updateMe({ settings: { reminders: { enabled: cb.checked } } }).catch(() => {}));
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
  return el('div', {}, [btn, el('p', { class: 'dcp-sec-hint' }, 'داده شما همیشه و در هر پلنی قابل دریافت است.')]);
}

export async function renderProfile(root, { me: preMe } = {}) {
  root.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  const [me, stats] = await Promise.all([
    preMe ? Promise.resolve(preMe) : api.me().catch(() => null),
    api.profileStats().catch(() => ({ week: [], month_vs_month: null, records: {} })),
  ]);
  if (!me) { root.replaceChildren(el('div', { class: 'dcp-gate' }, 'برای دیدن پروفایل وارد شوید.')); return; }

  const logoutBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'خروج از حساب');
  logoutBtn.addEventListener('click', async () => { await api.logout().catch(() => {}); location.href = '/'; });

  root.replaceChildren(
    el('div', { class: 'dcp-dash-hello' }, 'پروفایل'),
    section('نام مستعار', pseudonymBlock(me)),
    section('پلن', el('div', {}, [
      el('div', { class: 'dcp-plan' }, me.tier === 'premium' ? 'پریمیوم' : 'رایگان'),
      el('p', { class: 'dcp-sec-hint' }, 'نسخه بتای باز. کاربران اولیه هنگام فعال شدن پریمیوم مزایای عضو مؤسس می‌گیرند.'),
    ])),
    section('هفته شما', stats.week && stats.week.length ? weekStrip(stats.week) : el('div', { class: 'dcp-muted' }, '—')),
    section('رکوردها', el('div', { class: 'dcp-records' }, [
      el('div', {}, [el('b', {}, faNum(stats.records?.current_streak || 0)), el('span', {}, 'استریک فعلی')]),
      el('div', {}, [el('b', {}, faNum(stats.records?.longest_streak || 0)), el('span', {}, 'بلندترین استریک')]),
    ])),
    section('مقایسه ماه به ماه', stats.month_vs_month ? monthCompare(stats.month_vs_month) : el('div', { class: 'dcp-muted' }, '—')),
    section('شماره موبایل', el('div', { dir: 'ltr', class: 'dcp-phone' }, me.phone || '—')),
    section('تلگرام', el('div', {}, [
      el('div', {}, me.telegram_linked ? 'متصل است.' : 'هنوز متصل نشده است.'),
      el('p', { class: 'dcp-sec-hint' }, 'اتصال تلگرام برای یادآوری‌ها از طریق ربات انجام می‌شود.'),
    ])),
    section('یادآوری‌ها', remindersBlock(me)),
    section('داده‌های من', exportBlock()),
    el('div', { class: 'dcp-dash-sec' }, [logoutBtn]),
  );
}
