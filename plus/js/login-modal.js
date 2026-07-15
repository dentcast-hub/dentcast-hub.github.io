// Login is a MODAL, never a page (spec 2.5). Two steps: phone -> OTP code.
// Resolves with { user, return_to } on success, or null if the user cancels.
import { el, faNum } from './util.js';
import { api, ApiError, currentUser } from './api.js';

let overlay = null;

function close(resolve, value) {
  if (overlay) { overlay.remove(); overlay = null; }
  document.removeEventListener('keydown', onKey);
  resolve(value);
}

let onKey = () => {};

export function openLoginModal({ returnTo = location.pathname } = {}) {
  return new Promise((resolve) => {
    if (overlay) overlay.remove();

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
          close(resolve, { user: res.user, return_to: res.return_to });
        } catch (e) {
          codeMsg.textContent = e instanceof ApiError ? e.message : 'ورود ناموفق بود.';
          verifyBtn.disabled = false;
        }
      }
      verifyBtn.onclick = submitCode;
      codeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitCode(); });
    }

    primaryBtn.onclick = submitPhone;
    phoneInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitPhone(); });
  });
}
