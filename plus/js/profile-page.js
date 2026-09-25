// Controller for the standalone /plus/profile.html page. Renders the same
// profile the header overlay uses. Requires login.
import { currentUser, meStatus } from './api.js?v=160';
import { unreachableGate } from './premium-cta.js?v=160';
import { openLoginModal } from './login-modal.js?v=160';
import { renderProfile } from './profile.js?v=160';
import { el } from './util.js?v=160';
import { openSheet } from './sheet.js?v=160';
import { certificateTerms } from './certificate-terms.js?v=160';
import { registerSW } from './pwa.js?v=160';
import { wirePageBack } from './page-back.js?v=160';

/**
 * A GATE THAT SAYS WHAT IS BEHIND THE DOOR.
 *
 * Four surfaces deep-link into a profile section — the homepage premium rail
 * and the exam page's passed card (`#certificates`), the homepage messenger
 * chips (`#connect`), the monthly report (`#achievements`) — and for a
 * signed-out visitor all four used to arrive at one sentence that names none
 * of them: «برای دیدن پروفایل وارد شوید.» A card promised something, and the
 * door answered about something else.
 *
 * The machinery was already here and simply ran too late: the deep-link block
 * at the bottom of this file reads the hash, scrolls and flashes — AFTER the
 * gate, so for a signed-out reader the hash was discarded. The same hash is
 * read one step earlier now.
 *
 * Three rules this card rests on.
 *
 * **It says what the thing IS before asking for anything** — the argument
 * up-board's gate card makes («nobody buys an ordering they have never seen»).
 *
 * **«ورود» leads and there is NO purchase link.** This door does not want a
 * subscription: the certificate wall, the messenger chips and the badge shelf
 * all open on a free account, so a buy button here would sell something the
 * reader can already have. And a signed-out visitor may be a subscriber who is
 * simply not logged in on this device — the 401/402 split `premium-cta.js` and
 * up-board already keep.
 *
 * **An unknown hash, or none, takes exactly the road it took before.** That is
 * what makes this additive: nothing that used to render differently does.
 */
const GATE = {
  certificates: {
    icon: '🎓',
    title: 'گواهی‌نامهٔ تکمیل مسیر',
    lead: 'یک مسیر یادگیری را تا آخرین قدم بخوان و آزمون پایانی‌اش را بده؛ گواهی به نام خودت صادر می‌شود، با کد یکتا و صفحهٔ تأیید عمومی.',
    foot: 'گواهی‌نامه‌هایت در پروفایل می‌نشیند — با حساب رایگان هم دیده می‌شود.',
    // The one named door with a second button: the terms sheet is pure client
    // code with no API call, so a visitor with no account at all can read
    // every condition before deciding whether to make one.
    terms: true,
  },
  connect: {
    icon: '💬',
    title: 'اتصال به بله و تلگرام',
    lead: 'وصل کن تا خبرِ مطلب تازه و یادآوری‌ها همان‌جا برسد — بی‌آنکه لازم باشد سایت را باز کنی.',
    foot: 'وصل‌کردن و قطع‌کردن هر وقت خواستی، از همان بخش.',
  },
  achievements: {
    icon: '🏅',
    title: 'افتخارها و نشان‌ها',
    lead: 'نشان‌هایت از روی همان کاری که کرده‌ای ساخته می‌شوند — چیزی جداگانه ثبت نمی‌شود، پس از همان لحظه‌ای که حساب بسازی تاریخت هم حساب شده است.',
    foot: 'با حساب رایگان هم دیده می‌شود.',
  },
};

/** The section the visitor asked for, or '' — exported for the DOM test. */
export function gateKey(hash = location.hash) {
  const id = (hash || '').replace(/^#/, '');
  return Object.prototype.hasOwnProperty.call(GATE, id) ? id : '';
}

/**
 * The gate. `key` empty (no hash, or one this map does not know) gives the
 * card that shipped before any of this.
 */
export function gateCard(key, onLogin) {
  const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
  btn.addEventListener('click', onLogin);
  const c = GATE[key];
  if (!c) return el('div', { class: 'dcp-gate' }, [el('p', {}, 'برای دیدن پروفایل وارد شوید.'), btn]);

  const row = el('div', { class: 'dcp-gn-row' }, [btn]);
  if (c.terms) {
    const more = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button', 'data-cert-terms-btn': '' }, 'شرایط گواهی‌نامه');
    more.addEventListener('click', () => openSheet(certificateTerms(null)));
    row.appendChild(more);
  }
  return el('div', { class: 'dcp-gate is-named', 'data-gate-key': key }, [
    el('div', { class: 'dcp-gn-hd' }, [
      el('span', { class: 'dcp-gn-ico', 'aria-hidden': 'true' }, c.icon),
      el('div', {}, [
        el('div', { class: 'dcp-gn-kick' }, 'در پروفایلِ تو'),
        el('b', {}, c.title),
      ]),
    ]),
    el('p', { class: 'dcp-gn-lead' }, c.lead),
    row,
    el('p', { class: 'dcp-gn-foot' }, c.foot),
  ]);
}

async function main() {
  registerSW();
  wirePageBack();
  const root = document.getElementById('dcp-root');
  if (!root) return;
  const user = await currentUser();
  // The API answered nothing — which is NOT the same as "no subscription".
  // See unreachableGate: for the minutes an API is down, this gate used to
  // tell paying subscribers to go and buy a subscription.
  if (!user && meStatus() === 'error') { unreachableGate(root); return; }
  if (!user) {
    // The hash goes into returnTo, or the deep link dies at the door: the OTP
    // path survives by accident (its `location.reload()` re-loads this very
    // URL, fragment and all) while a Telegram login is a REAL redirect and
    // came back to the top of the profile instead of the section that was
    // tapped. `sanitizeReturnTo` on the API takes a root-relative path and a
    // fragment rides along untouched.
    const returnTo = location.pathname + location.hash;
    root.replaceChildren(gateCard(gateKey(), async () => {
      const res = await openLoginModal({ returnTo });
      if (res && res.user) location.reload();
    }));
    return;
  }
  await renderProfile(root, { me: user });

  // Deep-link support: /plus/profile.html#connect (from the homepage Bale/Telegram
  // chips) scrolls to and briefly highlights that section. renderProfile mounts
  // asynchronously, so we look the target up only after it has resolved.
  const id = (location.hash || '').replace(/^#/, '');
  const target = id && document.getElementById(id);
  if (target) {
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.classList.add('dcp-flash');
      setTimeout(() => target.classList.remove('dcp-flash'), 1800);
    });
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
