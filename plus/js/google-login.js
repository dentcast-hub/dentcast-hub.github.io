// «ورود با گوگل» — the official Google Identity Services button, mounted by the
// login modal (sign in) and by the profile (connect to the current account).
//
// It is Telegram's Login Widget one more time: a provider-drawn button, a signed
// payload, verification on OUR server (POST /auth/google) before a byte of it is
// trusted. Two differences shape this file. The button runs in POPUP mode, so
// there is no redirect and no auth-url: Google hands the page an ID token in a
// JS callback and the caller posts it with the ordinary api client, exactly
// like an OTP code. And Google draws the button itself (we never style it —
// Google's branding rules are strict and the official button is what readers
// already recognise), so what we own is the holder it renders into and the
// request for the shape the approved mockup chose: full width, 10px corners,
// Persian label (.dentcast/google-login-mockup.html, founder 1405/07/09).
//
// Shown on dentcast.org only (config.js googleLoginEnabled), the audience this
// exists for: a reader abroad has no Iranian SIM for the OTP and, until now,
// Telegram alone. Not on .ir, by the founder's call: the .ir site misbehaves
// behind a VPN and Google misbehaves without one, so the button would ask a
// reader to toggle their VPN twice in one login.
import { GOOGLE_CLIENT_ID, googleLoginEnabled } from './config.js?v=180';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

let loading = null;

function gsi() {
  const g = typeof window !== 'undefined' && window.google;
  return (g && g.accounts && g.accounts.id) || null;
}

// Load Google's script once; every later caller shares the promise. A failed
// load (filtered network, blocked third-party script) rejects and clears the
// memo, so a later attempt may try again rather than inherit the failure.
export function loadGsi() {
  const ready = gsi();
  if (ready) return Promise.resolve(ready);
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => {
      const id = gsi();
      if (id) resolve(id);
      else { loading = null; reject(new Error('gsi: loaded without accounts.id')); }
    };
    s.onerror = () => { loading = null; reject(new Error('gsi: script failed to load')); };
    document.head.appendChild(s);
  });
  return loading;
}

function isDark() {
  return typeof document !== 'undefined'
    && document.documentElement.getAttribute('data-theme') === 'dark';
}

// Google accepts a pixel width between 200 and 400. The holder is measured
// once attached, so the button fills the modal card (336px at the card's
// 380px max) and never overflows a narrower phone.
function widthFor(holder) {
  const w = Math.round((holder.getBoundingClientRect && holder.getBoundingClientRect().width) || holder.clientWidth || 0);
  if (!w) return 320;
  return Math.max(200, Math.min(400, w));
}

/**
 * Draw the Google button inside `holder`. Returns false (and draws nothing)
 * where Google login is not enabled; otherwise true, and the button appears
 * once Google's script is in. `onCredential(idToken)` fires with the signed
 * token; `onError(err)` when the script could not be loaded at all, so the
 * caller can say so instead of leaving an empty gap.
 *
 * `text` is Google's own label key: 'signin_with' («ورود با Google») on the
 * login modal, 'continue_with' («ادامه با Google») on the profile, where the
 * reader is already signed in and is connecting, not entering.
 */
export function mountGoogleButton(holder, { onCredential, onError, text = 'signin_with' } = {}) {
  if (!googleLoginEnabled() || !holder) return false;
  loadGsi()
    .then((id) => {
      const paint = () => {
        id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (resp) => {
            if (resp && resp.credential && typeof onCredential === 'function') onCredential(resp.credential);
          },
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });
        holder.textContent = '';
        id.renderButton(holder, {
          type: 'standard',
          theme: isDark() ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          locale: 'fa',
          logo_alignment: 'left',
          width: widthFor(holder),
        });
      };
      // Measure after layout: on the profile the holder is built before it is
      // attached, and a width read too early would fall back to the default.
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(paint);
      else paint();
    })
    .catch((err) => { if (typeof onError === 'function') onError(err); });
  return true;
}
