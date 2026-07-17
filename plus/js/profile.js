// Reusable profile renderer (spec 2.7). Used by the /plus/profile.html page and
// the header overlay. Site design language; a clear, readable week strip. Nothing
// here is mandatory: the pseudonym is editable, no real name is ever required.
import { el, faNum, tehranDay } from './util.js';
import { api, ApiError, currentUser } from './api.js';
import { ensurePushSubscription, removePushSubscription } from './push.js';

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
    if (name.length < 2) { msg.textContent = 'اسم مستعار باید حداقل ۲ حرف باشد.'; return; }
    save.disabled = true;
    msg.textContent = 'در حال ذخیره...';
    try {
      const u = await api.updateMe({ display_name: name });
      const saved = (u && u.display_name) || name;
      // Keep the shared snapshot (header menu / dashboard reuse this object) and
      // the /me cache in sync, so the new name shows everywhere without a reload.
      me.display_name = saved;
      input.value = saved;
      currentUser({ refresh: true });
      msg.textContent = 'ذخیره شد.';
    } catch (e) {
      // Surface the real reason instead of a generic error so a session/auth
      // problem is actionable (the server sends "ورود لازم است." on a 401).
      if (e instanceof ApiError && e.status === 401) msg.textContent = 'نشست شما منقضی شده؛ لطفاً دوباره وارد شوید.';
      else if (e instanceof ApiError) msg.textContent = e.message || 'خطا در ذخیره.';
      else msg.textContent = 'اتصال با سرور برقرار نشد؛ اینترنت/دامنه را بررسی کنید.';
    }
    save.disabled = false;
  });
  return el('div', {}, [
    el('div', { class: 'dcp-field-row' }, [input, save, msg]),
    el('p', { class: 'dcp-sec-hint' }, 'نام واقعی لازم نیست. همین اسم مستعار در پروفایل و لیدربورد نمایش داده می‌شود.'),
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

function planBlock() {
  const msg = el('span', { class: 'dcp-inline-msg' });
  const plus = el('span', { class: 'dcp-plan is-active' }, 'پلاس');
  const premium = el('button', { class: 'dcp-plan is-soon', type: 'button' }, 'پریمیوم');
  premium.addEventListener('click', () => { msg.textContent = 'به زودی'; });
  return el('div', { class: 'dcp-plan-row' }, [plus, premium, msg]);
}

function remindersBlock(me) {
  const r = (me.settings && me.settings.reminders) || {};
  const msg = el('span', { class: 'dcp-inline-msg' });
  const state = { new_content: !!r.new_content, streak: !!r.streak };
  // Deep-merge patch: send only the toggled key so sibling settings survive.
  const patch = (part) => api.updateMe({ settings: { reminders: part } }).catch(() => {});

  const denialText = (res) => res === 'denied'
    ? 'اجازه‌ی اعلان در مرورگر داده نشد.'
    : res === 'unsupported'
      ? 'مرورگر شما از اعلان پشتیبانی نمی‌کند.'
      : 'فعال‌سازی اعلان ناموفق بود.';

  const mk = (key, label) => {
    const cb = el('input', { type: 'checkbox' });
    cb.checked = state[key];
    cb.addEventListener('change', async () => {
      // Turning a reminder ON requires a working browser push subscription;
      // only flip the setting once the subscription is confirmed.
      if (cb.checked) {
        cb.disabled = true;
        msg.textContent = 'در حال فعال‌سازی اعلان‌ها...';
        const res = await ensurePushSubscription();
        cb.disabled = false;
        if (res !== 'ok') { cb.checked = false; msg.textContent = denialText(res); return; }
        msg.textContent = '';
      }
      state[key] = cb.checked;
      await patch({ [key]: cb.checked });
      // Everything off -> drop the browser subscription so none lingers.
      if (!state.new_content && !state.streak) removePushSubscription();
    });
    return el('label', { class: 'dcp-switch' }, [cb, el('span', {}, label)]);
  };

  return el('div', { class: 'dcp-toggle-list' }, [
    mk('new_content', 'نوتیف مطلب جدید'),
    mk('streak', 'یادآوری استریک'),
    msg,
  ]);
}

// Messenger connection (spec 2.7). COMING SOON ("به زودی"): both provider
// options render as selectable chips but are DISABLED. No connection flow runs,
// no provider is linked, nothing is stored. Presentational + locked only.
//
// NOT premium: when the real integration ships it is FREE for everyone, because
// the connected messenger is the login/OTP fallback and therefore must stay
// universal. The lock reads "coming soon," never "premium."
//
// Deferred build (Part B — recorded, do NOT implement here):
//   - Providers Bale (بله) and Telegram both sit behind the provider-agnostic
//     notification interface send(userId, message, kind) (spec 3). Bale is
//     domestic and the most cutoff-resilient path; Telegram is the second option
//     and OTP fallback. The connected messenger serves both OTP fallback and
//     notification delivery.
//   - New-article notification model:
//       * Premium: fires immediately on article_published (no schedule/queue).
//       * Free: each article gets notify_free_after = published_at + 24h; a cron
//         at 21:00 Asia/Tehran batches all due, unsent articles into ONE digest
//         ("یک مطلب جدید" / "N مطلب جدید"), sends once, marks them sent. Effective
//         free delay is 24-48h; if ever surfaced to users describe it honestly as
//         "۱ تا ۲ روز", never "۲۴ ساعت".
//       * The free/premium split lives in `kind` (article_premium vs
//         article_free_digest), not in the article or the channel. The article
//         itself is public and indexed at publish time; the delay is only on the
//         active push, never on access (principle 1).
//   - Streak notification is already handled by the existing system; no change.
function messengerBlock() {
  const opt = (label) => el('button', {
    class: 'dcp-provider-opt', type: 'button', disabled: 'disabled', 'aria-disabled': 'true',
  }, label);
  return el('div', { class: 'dcp-messenger' }, [
    el('div', { class: 'dcp-provider-row' }, [
      opt('بله'),
      opt('تلگرام'),
      el('span', { class: 'dcp-soon-badge' }, [
        el('span', { class: 'dcp-lock-ico', 'aria-hidden': 'true' }, '🔒'),
        el('span', {}, 'به زودی'),
      ]),
    ]),
    el('p', { class: 'dcp-sec-hint' }, 'نوتیف‌ها، پیام‌رسانی و کد ورود از طریق اپ متصل ارسال می‌شود.'),
  ]);
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
    section('پلن', planBlock()),
    section('هفته شما', stats.week && stats.week.length ? weekStrip(stats.week) : el('div', { class: 'dcp-muted' }, '—')),
    section('رکوردها', el('div', { class: 'dcp-records' }, [
      el('div', {}, [el('b', {}, faNum(stats.records?.current_streak || 0)), el('span', {}, 'استریک فعلی')]),
      el('div', {}, [el('b', {}, faNum(stats.records?.longest_streak || 0)), el('span', {}, 'بلندترین استریک')]),
    ])),
    section('مقایسه ماه به ماه', stats.month_vs_month ? monthCompare(stats.month_vs_month) : el('div', { class: 'dcp-muted' }, '—')),
    section('شماره موبایل', el('div', { dir: 'ltr', class: 'dcp-phone' }, me.phone || '—')),
    section('اتصال به اپ‌های پیام‌رسان', messengerBlock()),
    section('یادآوری‌ها', remindersBlock(me)),
    el('div', { class: 'dcp-dash-sec' }, [logoutBtn]),
  );
}
