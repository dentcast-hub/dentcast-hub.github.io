// Reusable profile renderer (spec 2.7). Used by the /plus/profile.html page and
// the header overlay. Site design language; a clear, readable week strip. Nothing
// here is mandatory: the pseudonym is editable, no real name is ever required.
import { el, faNum, tehranDay } from './util.js';
import { api, ApiError, currentUser } from './api.js';
import { ensurePushSubscription, removePushSubscription, pushSupported } from './push.js';
import { telegramLoginEnabled, telegramCallbackUrl, telegramBotUsername } from './config.js';
import { baleEnabled, baleDeepLink } from './config.js';

const WEEKDAY_FA = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش']; // Sun..Sat
function weekdayLetter(dayStr) {
  const [y, m, d] = dayStr.split('-').map(Number);
  return WEEKDAY_FA[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}
// The week strip shows the Persian (Shamsi) day-of-month, not the Gregorian
// one, since that's the calendar Iranian users read dates in. `dayStr` is
// already the correct Tehran calendar day ('YYYY-MM-DD', Gregorian-encoded);
// noon UTC + timeZone:'UTC' keeps that exact day fixed while re-rendering it
// in the Persian calendar (no DST/offset drift).
function dayOfMonth(dayStr) {
  const [y, m, d] = dayStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  const day = new Intl.DateTimeFormat('en-US-u-ca-persian', { day: 'numeric', timeZone: 'UTC' }).format(date);
  return faNum(day);
}

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
  // Send the WHOLE reminders state (not just the toggled key): the server
  // shallow-merges `settings || {reminders:{...}}`, so a single-key patch would
  // replace the reminders object and wipe the sibling toggle.
  const patch = () => api.updateMe({ settings: { reminders: { ...state } } }).catch(() => {});

  // The stored preference is INDEPENDENT of the browser push permission: turning
  // a reminder on always saves, even when the browser has notifications blocked.
  // We still try to (re)create the push subscription so delivery works; if that
  // fails we KEEP the toggle on and just explain how to unblock. That is what
  // lets both toggles be flipped on/off freely without ever getting stuck when a
  // browser (e.g. Opera) has blocked notifications for the site.
  const guidanceText = (res) => res === 'denied'
    ? 'اعلان‌ها در مرورگر بلاک شده. ترجیح ذخیره شد؛ برای دریافت نوتیف، از تنظیمات سایتِ مرورگر آن را Allow کن.'
    : res === 'unsupported'
      ? 'مرورگر شما از اعلان پشتیبانی نمی‌کند. ترجیح ذخیره شد ولی نوتیف ارسال نمی‌شود.'
      : 'ترجیح ذخیره شد؛ فعال‌سازی اعلان فعلاً ناموفق بود و بعداً دوباره تلاش می‌شود.';

  const mk = (key, label) => {
    const cb = el('input', { type: 'checkbox' });
    cb.checked = state[key];
    cb.addEventListener('change', async () => {
      const on = cb.checked;
      state[key] = on; // the toggle reflects the user's intent no matter what
      if (on) {
        // Call ensurePushSubscription FIRST so the click gesture is still active
        // for the permission prompt (any earlier await would consume it). The
        // toggle stays on regardless of the outcome; we only annotate delivery.
        msg.textContent = 'در حال فعال‌سازی اعلان‌ها...';
        const res = await ensurePushSubscription();
        msg.textContent = res === 'ok' ? '' : guidanceText(res);
      } else {
        msg.textContent = '';
      }
      await patch();
      // Everything off -> drop the browser subscription so none lingers.
      if (!state.new_content && !state.streak) await removePushSubscription();
    });
    return el('label', { class: 'dcp-switch' }, [cb, el('span', {}, label)]);
  };

  const block = el('div', { class: 'dcp-toggle-list' }, [
    mk('new_content', 'نوتیف مطلب جدید'),
    mk('streak', 'یادآوری استریک'),
    msg,
  ]);

  // Self-heal: if a reminder is on and the browser already grants notifications,
  // make sure a live subscription exists (the user may have unblocked in browser
  // settings, or turned a toggle on earlier while blocked and has since allowed).
  // Only when permission is already 'granted' so we never prompt without a gesture.
  if ((state.new_content || state.streak) && pushSupported() && Notification.permission === 'granted') {
    ensurePushSubscription().catch(() => {});
  }

  return block;
}

// Messenger connection (spec 2.7). Both channels feed the API's provider-agnostic
// notification sender (streak reminders + new-article), delivered to whatever a
// user has connected (Telegram, Bale, and/or web push). Both are FREE for everyone
// (a connected messenger is the universal notification channel), never premium.
//   - Telegram (تلگرام): connecting also enables passwordless login (widget). The
//     widget is .org-only, so telegramLoginBlock returns null on .ir.
//   - Bale (بله): NOTIFICATIONS ONLY, no login widget. Connecting deep-links to the
//     Bale bot with a one-time token; the bot webhook links the chat_id. Shown on
//     both sites (domestic, unfiltered).
function messengerBlock(me) {
  const rows = [];

  // Telegram — connect / connected. telegramLoginBlock returns null where the
  // widget can't run (currently .ir).
  const tg = telegramLoginBlock(me);
  if (tg) {
    rows.push(el('div', { class: 'dcp-messenger-provider' }, [
      el('div', { class: 'dcp-messenger-name' }, 'تلگرام'),
      tg,
    ]));
  }

  // Bale — notification channel (connect / connected).
  const bale = baleBlock(me);
  if (bale) {
    rows.push(el('div', { class: 'dcp-messenger-provider' }, [
      el('div', { class: 'dcp-messenger-name' }, 'بله'),
      bale,
    ]));
  }

  return el('div', { class: 'dcp-messenger' }, rows);
}

// Bale connect/connected (notifications only — NO login). Distinct from Telegram:
// Bale has no login widget, so we cannot get the chat_id from a signed payload.
// Instead the connect button asks the API for a one-time token, opens the Bale bot
// deep link (ble.ir/<bot>?start=<token>), and polls /me until the bot webhook has
// linked the chat_id. Returns null only if Bale is force-disabled for the page.
function baleBlock(me) {
  if (!baleEnabled()) return null;

  const msg = el('span', { class: 'dcp-inline-msg' });

  if (me.bale_linked) {
    const children = [
      el('div', { class: 'dcp-tg-linked' }, [
        el('span', { class: 'dcp-tg-linked-ico', 'aria-hidden': 'true' }, '✓'),
        el('span', {}, 'حساب بله متصل است'),
      ]),
      el('p', { class: 'dcp-sec-hint' }, 'یادآوری استریک و اطلاع مطلب جدید از بله برایتان ارسال می‌شود.'),
    ];
    const unlinkBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'قطع اتصال بله');
    unlinkBtn.addEventListener('click', async () => {
      unlinkBtn.disabled = true;
      msg.textContent = 'در حال قطع...';
      try {
        await api.unlinkBale();
        currentUser({ refresh: true });
        msg.textContent = 'بله قطع شد.';
        setTimeout(() => location.reload(), 700);
      } catch (e) {
        msg.textContent = e instanceof ApiError ? e.message : 'قطع اتصال ناموفق بود.';
        unlinkBtn.disabled = false;
      }
    });
    children.push(el('div', { class: 'dcp-field-row', style: 'margin-top:8px' }, [unlinkBtn, msg]));
    return el('div', {}, children);
  }

  const connectBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'اتصال به بله');
  let polling = false;
  connectBtn.addEventListener('click', async () => {
    if (polling) return;
    connectBtn.disabled = true;
    msg.textContent = 'در حال ساخت لینک اتصال...';
    let token;
    try {
      const res = await api.connectBale();
      token = res && res.token;
    } catch (e) {
      msg.textContent = e instanceof ApiError ? e.message : 'ساخت لینک ناموفق بود.';
      connectBtn.disabled = false;
      return;
    }
    if (!token) { msg.textContent = 'ساخت لینک ناموفق بود.'; connectBtn.disabled = false; return; }

    // Open the bot in Bale. A pop-up blocker may stop window.open, so also show a
    // tappable fallback link that carries the same deep link.
    const link = baleDeepLink(token);
    window.open(link, '_blank', 'noopener');
    msg.replaceChildren(
      el('span', {}, 'در بله دکمه‌ی Start (شروع) را بزنید. '),
      el('a', { href: link, target: '_blank', rel: 'noopener' }, 'باز کردن بله'),
    );

    // Poll /me until the webhook links the chat_id (or the token TTL elapses).
    polling = true;
    let tries = 0;
    const MAX_TRIES = 40; // 40 x 3s = 2 min
    const timer = setInterval(async () => {
      tries += 1;
      const fresh = await currentUser({ refresh: true });
      if (fresh && fresh.bale_linked) {
        clearInterval(timer);
        polling = false;
        msg.textContent = 'بله متصل شد.';
        setTimeout(() => location.reload(), 700);
      } else if (tries >= MAX_TRIES) {
        clearInterval(timer);
        polling = false;
        connectBtn.disabled = false;
        msg.replaceChildren(
          el('span', {}, 'هنوز وصل نشد. اگر Start را زده‌اید کمی صبر کنید یا دوباره تلاش کنید. '),
          el('a', { href: link, target: '_blank', rel: 'noopener' }, 'باز کردن بله'),
        );
      }
    }, 3000);
  });

  return el('div', {}, [
    el('div', { class: 'dcp-field-row' }, [connectBtn]),
    el('p', { class: 'dcp-sec-hint' }, 'با اتصال بله، یادآوری استریک و اطلاع مطلب جدید را در پیام‌رسان بله می‌گیرید. بله جایگزین ورود نیست؛ فقط کانال دریافت نوتیف است.'),
    msg,
  ]);
}

// Telegram login-linking (dentcast.org). Distinct from the messenger block
// above (that is the future NOTIFICATION integration). This lets an account
// gain Telegram as a SECOND way to sign in:
//   - already linked -> a "connected" confirmation.
//   - not linked, on a host where the widget works (.org) -> the official Login
//     Widget. Because the session cookie rides the widget's redirect to the API
//     callback, Telegram is linked to the CURRENT account (so afterwards phone
//     AND Telegram both identify the same user). Returns null where it does not
//     apply, so the section is omitted entirely.
function telegramLoginBlock(me) {
  if (me.telegram_linked) {
    const msg = el('span', { class: 'dcp-inline-msg' });
    const children = [
      el('div', { class: 'dcp-tg-linked' }, [
        el('span', { class: 'dcp-tg-linked-ico', 'aria-hidden': 'true' }, '✓'),
        el('span', {}, 'حساب تلگرام متصل است'),
      ]),
      el('p', { class: 'dcp-sec-hint' }, 'ورود سریع و دریافتِ نوتیف استریک و مطلب جدید از تلگرام فعال است.'),
    ];
    // Allow disconnecting ONLY when the account keeps another way in (a phone),
    // so a Telegram-only user can't lock themselves out.
    if (me.phone) {
      const unlinkBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'قطع اتصال تلگرام');
      unlinkBtn.addEventListener('click', async () => {
        unlinkBtn.disabled = true;
        msg.textContent = 'در حال قطع...';
        try {
          await api.unlinkTelegram();
          currentUser({ refresh: true });
          msg.textContent = 'تلگرام قطع شد.';
          setTimeout(() => location.reload(), 700);
        } catch (e) {
          msg.textContent = e instanceof ApiError ? e.message : 'قطع اتصال ناموفق بود.';
          unlinkBtn.disabled = false;
        }
      });
      children.push(el('div', { class: 'dcp-field-row', style: 'margin-top:8px' }, [unlinkBtn, msg]));
    } else {
      children.push(el('p', { class: 'dcp-sec-hint', style: 'margin-top:6px' },
        'برای قطع تلگرام، اول در بخش «شماره موبایل» شماره‌ات را تأیید کن تا راه ورود دیگری داشته باشی.'));
    }
    return el('div', {}, children);
  }
  if (!telegramLoginEnabled()) return null;

  const holder = el('div', { class: 'dcp-tg-holder' });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://telegram.org/js/telegram-widget.js?22';
  s.setAttribute('data-telegram-login', telegramBotUsername());
  s.setAttribute('data-size', 'large');
  s.setAttribute('data-userpic', 'false');
  s.setAttribute('data-radius', '10');
  s.setAttribute('data-request-access', 'write');
  s.setAttribute('data-auth-url', telegramCallbackUrl('/plus/profile.html'));
  holder.appendChild(s);

  return el('div', {}, [
    holder,
    el('p', { class: 'dcp-sec-hint' }, 'با اتصال تلگرام: ورود بدون کد پیامکی + دریافتِ نوتیف استریک و مطلب جدید از تلگرام. حساب فعلی و اطلاعاتتان حفظ می‌شود.'),
  ]);
}

// Phone section. For an account that already has a phone, just show it. For a
// phone-LESS account (typically Telegram-only, since Telegram never gives us the
// phone), offer an OTP step to prove a phone and RECOVER/MERGE an older phone
// account — reuniting a Telegram login with a pre-existing streak/history.
function phoneBlock(me) {
  if (me.phone) return el('div', { dir: 'ltr', class: 'dcp-phone' }, me.phone);

  const phoneInput = el('input', {
    type: 'tel', inputmode: 'numeric', class: 'dcp-input',
    placeholder: '09xxxxxxxxx', dir: 'ltr', autocomplete: 'tel',
  });
  const msg = el('span', { class: 'dcp-inline-msg' });
  const sendBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'دریافت کد');
  const codeArea = el('div', {});

  const container = el('div', {}, [
    el('p', { class: 'dcp-sec-hint', style: 'margin:0 0 10px' },
      'اتصال شماره موبایل اختیاری است و لازم نیست. فقط اگر قبلاً با شماره موبایل (ایران) حساب و استریک داشتی، برای یکی‌شدنِ حساب‌ها و بازگشتِ پیشرفت، شماره‌ات را تأیید کن.'),
    el('div', { class: 'dcp-field-row' }, [phoneInput, sendBtn]),
    codeArea,
    msg,
  ]);

  let phone = '';
  sendBtn.addEventListener('click', async () => {
    phone = phoneInput.value.trim();
    if (!phone) { msg.textContent = 'شماره را وارد کن.'; return; }
    sendBtn.disabled = true;
    msg.textContent = 'در حال ارسال کد...';
    try {
      const res = await api.requestOtp(phone);
      msg.textContent = '';
      buildCodeStep(res && res.dev_code);
    } catch (e) {
      msg.textContent = e instanceof ApiError ? e.message : 'ارسال کد ناموفق بود.';
      sendBtn.disabled = false;
    }
  });

  function buildCodeStep(devCode) {
    codeArea.replaceChildren();
    const codeInput = el('input', {
      type: 'text', inputmode: 'numeric', class: 'dcp-input',
      placeholder: 'کد پیامک‌شده', dir: 'ltr', maxlength: '6', autocomplete: 'one-time-code',
    });
    const verifyBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'تأیید و ادغام');
    codeArea.append(
      el('div', { class: 'dcp-field-row', style: 'margin-top:8px' }, [codeInput, verifyBtn]),
      devCode ? el('div', { class: 'dcp-modal-devhint' }, 'کد تست: ' + faNum(devCode)) : el('span', {}),
    );
    setTimeout(() => codeInput.focus(), 30);

    verifyBtn.addEventListener('click', async () => {
      const code = codeInput.value.trim();
      if (!code) { msg.textContent = 'کد را وارد کن.'; return; }
      verifyBtn.disabled = true;
      msg.textContent = 'در حال بررسی...';
      try {
        const res = await api.linkPhone(phone, code);
        currentUser({ refresh: true });
        msg.textContent = res && res.merged
          ? 'حساب قبلی‌ات پیدا و یکی شد؛ پیشرفتت برگشت.'
          : 'شماره ثبت شد.';
        setTimeout(() => location.reload(), 900);
      } catch (e) {
        msg.textContent = e instanceof ApiError ? e.message : 'تأیید ناموفق بود.';
        verifyBtn.disabled = false;
      }
    });
  }

  return container;
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
    section(me.phone ? 'شماره موبایل' : 'شماره موبایل (اختیاری)', phoneBlock(me)),
    // Telegram (login + notifications) + Bale (notifications only).
    section('اتصال به پیام‌رسان‌ها', messengerBlock(me)),
    section('یادآوری‌ها', remindersBlock(me)),
    el('div', { class: 'dcp-dash-sec' }, [logoutBtn]),
  );
}
