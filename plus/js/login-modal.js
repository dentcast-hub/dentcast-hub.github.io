// Login is a MODAL, never a page (spec 2.5). Two steps: phone -> OTP code.
// Resolves with { user, return_to } on success, or null if the user cancels.
import { el, faNum } from './util.js';
import { api, ApiError, currentUser } from './api.js';
import {
  isOrgHost, irMirrorUrl,
  telegramLoginEnabled, telegramCallbackUrl, telegramBotUsername,
} from './config.js';

let overlay = null;
// While the mandatory nickname step is showing, every dismissal path (×,
// Escape, backdrop click) is locked: Plus requires a chosen name (leaderboard).
let locked = false;

function close(resolve, value) {
  if (locked) return;
  if (overlay) { overlay.remove(); overlay = null; }
  document.removeEventListener('keydown', onKey);
  resolve(value);
}

let onKey = () => {};

// A chosen pseudonym is what the leaderboard shows. The backend either leaves
// display_name empty/null until the user picks one, or (later) sends
// name_chosen:false. Either way this is the single source of truth.
export function nameIsChosen(user) {
  if (!user) return false;
  if (user.name_chosen === false) return false;
  return !!(user.display_name && user.display_name.trim());
}

// The nickname step, shared by first-login onboarding and the standalone gate.
// Returns { node, focus }. onSaved(updatedUser) fires only after a valid name
// is persisted. There is no skip — a name is required.
function buildNameStep({ user, onSaved }) {
  // Never pre-fill an auto-generated name; make the user type a real pseudonym.
  const nameInput = el('input', {
    type: 'text', class: 'dcp-input', maxlength: '40',
    value: nameIsChosen(user) ? user.display_name : '',
  });
  const msg = el('div', { class: 'dcp-modal-msg', role: 'status' });
  const saveBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ذخیره و ادامه');

  async function save() {
    const name = nameInput.value.trim();
    if (name.length < 2) { msg.textContent = 'یک اسم مستعار (حداقل ۲ حرف) وارد کنید.'; nameInput.focus(); return; }
    saveBtn.disabled = true;
    msg.textContent = 'در حال ذخیره...';
    try {
      const u = await api.updateMe({ display_name: name });
      onSaved({ ...user, display_name: (u && u.display_name) || name, name_chosen: true });
    } catch (e) {
      msg.textContent = e instanceof ApiError ? e.message : 'ذخیره نشد؛ دوباره تلاش کنید.';
      saveBtn.disabled = false;
    }
  }
  saveBtn.onclick = save;
  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });

  const node = el('div', { class: 'dcp-modal-step' }, [
    el('label', { class: 'dcp-label' }, 'یک اسم مستعار برای خودتان انتخاب کنید'),
    nameInput,
    el('p', { class: 'dcp-modal-sub', style: 'margin:0' }, 'نام واقعی لازم نیست. همین اسم در پروفایل و لیدربورد نمایش داده می‌شود و بعداً از پروفایل قابل تغییر است.'),
    msg,
    el('div', { class: 'dcp-editor-actions' }, [saveBtn]),
  ]);
  return { node, focus: () => setTimeout(() => { nameInput.focus(); nameInput.select(); }, 30) };
}

// Standalone, non-dismissable gate: for an already-logged-in user who has no
// chosen name yet (e.g. backend left display_name empty). Resolves with the
// updated user once a name is saved. There is no cancel.
export function openNameGate({ user } = {}) {
  return new Promise((resolve) => {
    if (overlay) overlay.remove();
    locked = true;

    const card = el('div', { class: 'dcp-modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'انتخاب اسم مستعار' }, [
      el('h2', { class: 'dcp-modal-title' }, 'اسم مستعار خود را انتخاب کنید'),
      el('p', { class: 'dcp-modal-sub' }, 'برای استفاده از دنت‌کست پلاس یک اسم مستعار لازم است.'),
    ]);
    const step = buildNameStep({
      user: user || {},
      onSaved: (u) => { locked = false; if (overlay) { overlay.remove(); overlay = null; } document.removeEventListener('keydown', onKey); resolve(u); },
    });
    card.appendChild(step.node);

    overlay = el('div', { class: 'dcp-modal-overlay' }, [card]); // no backdrop-close handler
    document.body.appendChild(overlay);
    onKey = () => {}; // Escape does nothing while locked
    document.addEventListener('keydown', onKey);
    step.focus();
  });
}

// --- .org notice (TEMPORARY) ------------------------------------------------
// Shown on the .org hosts in place of the OTP modal (see isOrgHost in
// config.js). It (1) logs the anonymous demand signal reusing the single
// whitelisted anon event -- the entry source and the .org marker ride in
// content_id as `org:<source>[:<contentId>]`, queryable via content_id LIKE
// 'org:%' -- and (2) deep-links the same page on dentcast.ir. Fully dismissable
// (×, Escape, backdrop, بعداً). Resolves null, so callers that check res.user
// simply do nothing. Delete together with the isOrgHost gates once
// api.dentcast.org is live.
export function openOrgNotice({ source = 'login', contentId } = {}) {
  const tag = 'org:' + source + (contentId ? ':' + contentId : '');
  api.anonEvent('workbench_button_anon_click', tag).catch(() => {});

  return new Promise((resolve) => {
    if (overlay) overlay.remove();
    locked = false;

    // A <button> (not an <a>) so it inherits the exact primary-button styling;
    // it navigates on click. Path + query + hash are preserved by irMirrorUrl.
    const goBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ادامه در dentcast.ir');
    const laterBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'بعداً');

    const card = el('div', { class: 'dcp-modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'دنت‌کست پلاس' }, [
      el('button', { class: 'dcp-modal-close', type: 'button', 'aria-label': 'بستن', onclick: () => close(resolve, null) }, '×'),
      el('h2', { class: 'dcp-modal-title' }, 'دنت‌کست پلاس'),
      el('p', { class: 'dcp-modal-sub' },
        'امکانات دنت‌کست پلاس (میز کار، هایلایت و یادداشت) فعلاً از نسخه‌ی dentcast.ir در دسترس است. همین صفحه را همان‌جا باز کنید و ادامه دهید.'),
      el('div', { class: 'dcp-editor-actions' }, [goBtn, laterBtn]),
    ]);

    goBtn.onclick = () => { window.location.href = irMirrorUrl(); };
    laterBtn.onclick = () => close(resolve, null);

    overlay = el('div', { class: 'dcp-modal-overlay', onclick: (e) => { if (e.target === overlay) close(resolve, null); } }, [card]);
    document.body.appendChild(overlay);
    setTimeout(() => goBtn.focus(), 30);

    onKey = (e) => { if (e.key === 'Escape') close(resolve, null); };
    document.addEventListener('keydown', onKey);
  });
}

// The official Telegram Login Widget, shown ABOVE the phone/OTP step on the
// hosts where it applies (dentcast.org). It is a REDIRECT widget: clicking it
// navigates the whole tab to Telegram and then to the API callback
// (data-auth-url), which sets the session cookie and sends the browser back to
// `returnTo`. So there is no JS callback and nothing to await here — the modal
// simply unloads with the navigation. Returns null when Telegram login is not
// enabled for this host.
function buildTelegramBlock(returnTo) {
  if (!telegramLoginEnabled()) return null;

  // The widget script renders its iframe button in place of itself, so it must
  // be appended live to the DOM (not built as a string). data-request-access
  // ="write" asks the user to let the bot message them — needed for the future
  // notification channel (new posts, streak reminders).
  const holder = el('div', { class: 'dcp-tg-holder' });
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://telegram.org/js/telegram-widget.js?22';
  s.setAttribute('data-telegram-login', telegramBotUsername());
  s.setAttribute('data-size', 'large');
  s.setAttribute('data-userpic', 'true');
  s.setAttribute('data-radius', '10');
  s.setAttribute('data-request-access', 'write');
  s.setAttribute('data-auth-url', telegramCallbackUrl(returnTo));
  holder.appendChild(s);

  return el('div', { class: 'dcp-modal-step dcp-tg-step' }, [
    el('div', { class: 'dcp-tg-caption' }, 'ورود سریع با تلگرام'),
    holder,
    el('div', { class: 'dcp-modal-or' }, [el('span', {}, 'یا با شماره موبایل')]),
  ]);
}

export function openLoginModal({ returnTo = location.pathname } = {}) {
  // .org backstop: the OTP modal must never open on the .org hosts (no phone
  // entry, no SMS spend). Any caller that reaches here on .org -- including the
  // /plus dashboard/profile pages -- gets the notice instead. The three primary
  // entry points short-circuit earlier with their own source label.
  if (isOrgHost()) return openOrgNotice({ source: 'login' });
  return new Promise((resolve) => {
    if (overlay) overlay.remove();
    locked = false;

    const phoneInput = el('input', {
      type: 'tel', inputmode: 'numeric', class: 'dcp-input',
      placeholder: '09xxxxxxxxx', dir: 'ltr', autocomplete: 'tel',
    });
    const msg = el('div', { class: 'dcp-modal-msg', role: 'status' });
    const primaryBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'دریافت کد');

    const stepPhone = el('div', { class: 'dcp-modal-step' }, [
      el('label', { class: 'dcp-label', for: '' }, 'شماره موبایل'),
      phoneInput,
      msg,
      primaryBtn,
    ]);

    const card = el('div', { class: 'dcp-modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'ورود به دنت‌کست پلاس' }, [
      el('button', { class: 'dcp-modal-close', type: 'button', 'aria-label': 'بستن', onclick: () => close(resolve, null) }, '×'),
      el('h2', { class: 'dcp-modal-title' }, 'ورود'),
      el('p', { class: 'dcp-modal-sub' }, 'با شماره موبایل وارد شوید. کد یکبار مصرف برایتان ارسال می‌شود.'),
      stepPhone,
    ]);

    // On the .org hosts, offer "Login with Telegram" above the phone step (the
    // user chose Telegram + OTP). Elsewhere (.ir) the block is null and only the
    // OTP flow shows.
    const tgBlock = buildTelegramBlock(returnTo);
    if (tgBlock) {
      const sub = card.querySelector('.dcp-modal-sub');
      if (sub) sub.textContent = 'با تلگرام وارد شوید، یا از شماره موبایل استفاده کنید.';
      card.insertBefore(tgBlock, stepPhone);
    }

    overlay = el('div', { class: 'dcp-modal-overlay', onclick: (e) => { if (e.target === overlay) close(resolve, null); } }, [card]);
    document.body.appendChild(overlay);
    setTimeout(() => phoneInput.focus(), 30);

    onKey = (e) => { if (e.key === 'Escape') close(resolve, null); };
    document.addEventListener('keydown', onKey);

    let phone = '';

    async function submitPhone() {
      phone = phoneInput.value.trim();
      if (!phone) { msg.textContent = 'شماره را وارد کنید.'; return; }
      primaryBtn.disabled = true;
      msg.textContent = 'در حال ارسال کد...';
      try {
        const res = await api.requestOtp(phone);
        showCodeStep(res && res.dev_code);
      } catch (e) {
        msg.textContent = e instanceof ApiError ? e.message : 'ارسال کد ناموفق بود.';
        primaryBtn.disabled = false;
      }
    }

    function showCodeStep(devCode) {
      const codeInput = el('input', {
        type: 'text', inputmode: 'numeric', class: 'dcp-input dcp-input-code',
        placeholder: '- - - - -', dir: 'ltr', maxlength: '6', autocomplete: 'one-time-code',
      });
      const codeMsg = el('div', { class: 'dcp-modal-msg', role: 'status' });
      const verifyBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
      const backBtn = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'اصلاح شماره');

      const hint = devCode
        ? el('div', { class: 'dcp-modal-devhint' }, 'کد تست: ' + faNum(devCode))
        : null;

      const stepCode = el('div', { class: 'dcp-modal-step' }, [
        el('label', { class: 'dcp-label' }, 'کد پیامک‌شده به ' + faNum(phone)),
        codeInput,
        hint,
        codeMsg,
        verifyBtn,
        backBtn,
      ]);
      card.replaceChild(stepCode, stepPhone.isConnected ? stepPhone : stepCode);
      setTimeout(() => codeInput.focus(), 30);

      backBtn.onclick = () => { card.replaceChild(stepPhone, stepCode); primaryBtn.disabled = false; msg.textContent = ''; };

      async function submitCode() {
        const code = codeInput.value.trim();
        if (!code) { codeMsg.textContent = 'کد را وارد کنید.'; return; }
        verifyBtn.disabled = true;
        codeMsg.textContent = 'در حال بررسی...';
        try {
          const res = await api.verifyOtp(phone, code, returnTo);
          currentUser({ refresh: true }); // invalidate cached /me
          if (res.is_new) showOnboardingStep(stepCode, res);
          else close(resolve, { user: res.user, return_to: res.return_to });
        } catch (e) {
          codeMsg.textContent = e instanceof ApiError ? e.message : 'ورود ناموفق بود.';
          verifyBtn.disabled = false;
        }
      }

      // First login: a MANDATORY nickname step. Plus is built around a chosen
      // pseudonym (it's the leaderboard identity), so there is no skip and the
      // modal cannot be dismissed until a valid name is saved. No real name is
      // ever required — any pseudonym works.
      function showOnboardingStep(prevStep, res) {
        locked = true; // lock ×/Escape/backdrop until a name is saved
        const step = buildNameStep({
          user: res.user,
          onSaved: (user) => { locked = false; close(resolve, { user, return_to: res.return_to }); },
        });
        card.replaceChild(step.node, prevStep);
        card.querySelector('.dcp-modal-close')?.classList.add('is-hidden');
        step.focus();
      }
      verifyBtn.onclick = submitCode;
      codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitCode(); });
    }

    primaryBtn.onclick = submitPhone;
    phoneInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPhone(); });
  });
}
