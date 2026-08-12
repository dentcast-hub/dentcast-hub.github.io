// Header rework (spec 2.5 + prototype feedback) as progressive enhancement over
// the dc-nav.js header. Keeps logo, podcast, hamburger. Adds:
//  - streak flame: two states (on today / off), logged-in only, links /plus.
//  - person icon (SVG): gray for guests -> login modal; blue for logged-in ->
//    a toggle that opens a small menu (پیشخوان / پروفایل), each of which opens as
//    an OVERLAY. Clicking the person again closes whatever is open.
import { el, faNum, streakIsActiveToday, STREAK_ACTIVITY_EVENT } from './util.js';
import { currentUser, api } from './api.js';
import { isOrgHost, detectContentId } from './config.js';
import { openLoginModal, openOrgNotice, openNameGate, nameIsChosen } from './login-modal.js';
import { openOverlay, closeOverlay, overlayOpen } from './overlay.js';
import { renderDashboard } from './dashboard.js';
import { renderProfile } from './profile.js';
import { maybeShowWelcome } from './welcome.js';
import { startTour, maybeOfferTour, tourMenuAvailable, initTourAutostart } from './tour.js';
import { maybeShowNotifPrompt } from './notif-prompt.js';
import { healPushSubscription } from './push.js';
import { maybeShowPremiumPopup } from './premium-popup.js';
import { renderNotices, NOTICES_SEEN_EVENT } from './notices.js';
import { maybeCelebrate, ACHIEVEMENTS_SEEN_EVENT } from './achievements.js';
import { subscriptionMenuLabel, pricingHref } from './premium-cta.js';
import { installLibraryGate } from './library-gate.js';

// Inlined so it can never 404. Built via innerHTML on an HTML button (not
// createElement('svg')) so the parser creates properly namespaced SVG nodes;
// createElement('svg') would produce an unrenderable HTML element (empty icon).
const PERSON_SVG =
  '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" ' +
  'style="width:1.3em;height:1.3em;display:block">' +
  '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';

function buildFlame(user) {
  // A PASSIVE indicator only (both desktop and mobile): two states — lit (a
  // qualifying action was completed today, Asia/Tehran) or unlit. NOT a link or
  // button; clicking added no information, only an extra action. The streak
  // count lives on the homepage card and the dashboard, never in the header.
  const active = streakIsActiveToday(user.last_active_day);
  const label = active ? 'امروز فعال بوده‌اید' : 'امروز هنوز فعالیتی ثبت نشده';
  return el('span', {
    class: 'dc-topbar-btn dcp-flame-btn' + (active ? ' is-active' : ''),
    role: 'img', 'aria-label': label, title: label,
  }, [
    el('span', { class: 'dcp-flame-ico', 'aria-hidden': 'true' }, '🔥'),
  ]);
}

function personSvg(colorClass) {
  const btn = el('button', { class: 'dc-topbar-btn dcp-person-btn ' + colorClass, type: 'button' });
  // Setting innerHTML with an <svg> string on an HTML element yields real,
  // namespaced SVG nodes that render (and give the button a clickable size).
  btn.innerHTML = PERSON_SVG;
  return btn;
}

/**
 * The unread mark: a dot on the corner of the account icon, NOT a recolouring
 * of the icon itself.
 *
 * The person icon is the identity indicator — gray means guest, blue means
 * signed in — and turning it red would make one element carry two meanings and
 * say both badly: a reader could no longer tell at a glance whether they are
 * logged in, and red on an account icon reads as "something is wrong with your
 * account" rather than "you have news". A corner dot keeps the identity colour
 * intact, matches what every messaging app has already taught people, and can
 * grow a number later without a redesign.
 *
 * Colour is never the whole signal: the aria-label carries the count too, so the
 * mark exists for a screen reader and for anyone who cannot separate the hues.
 */
function paintPersonDot(btn, count) {
  if (!btn) return;
  let dot = btn.querySelector('.dcp-person-dot');
  if (count > 0 && !dot) {
    dot = el('i', { class: 'dcp-person-dot', 'aria-hidden': 'true' });
    btn.appendChild(dot);
  } else if (count <= 0 && dot) {
    dot.remove();
  }
  btn.setAttribute(
    'aria-label',
    count > 0 ? 'حساب شما — ' + faNum(count) + ' اطلاعیهٔ خوانده‌نشده' : 'حساب شما',
  );
}

function buildGuestPerson() {
  const btn = personSvg('is-guest');
  btn.setAttribute('aria-label', 'ورود');
  btn.addEventListener('click', async () => {
    // .org gate (temporary): show the dentcast.ir notice instead of OTP; the
    // anon demand signal is logged inside openOrgNotice (marked org:header).
    if (isOrgHost()) { openOrgNotice({ source: 'header', contentId: detectContentId() }); return; }
    const res = await openLoginModal({ returnTo: location.pathname + location.search });
    if (res && res.user) location.reload();
  });
  return btn;
}

function buildUserPerson(user) {
  const btn = personSvg('is-user');
  btn.setAttribute('aria-label', 'حساب شما');
  btn.setAttribute('aria-haspopup', 'true');
  paintPersonDot(btn, user.unread_notices || 0);
  // The dot goes out the moment the inbox or the celebration is acknowledged —
  // both fire their own event so this does not have to poll /me or wait for a
  // reload to stop claiming there is something unread.
  document.addEventListener(NOTICES_SEEN_EVENT, () => paintPersonDot(btn, 0));
  document.addEventListener(ACHIEVEMENTS_SEEN_EVENT, () => {
    currentUser({ refresh: true })
      .then((m) => paintPersonDot(btn, (m && m.unread_notices) || 0))
      .catch(() => { /* leave the dot as it is rather than lie in either direction */ });
  });

  let menu = null;
  const closeMenu = () => { if (menu) { menu.remove(); menu = null; document.removeEventListener('click', onDoc); } };
  const onDoc = (e) => { if (menu && !menu.contains(e.target) && e.target !== btn && !btn.contains(e.target)) closeMenu(); };

  const openMenu = () => {
    menu = el('div', { class: 'dcp-person-menu', role: 'menu' }, [
      el('button', { class: 'dcp-person-item', type: 'button', role: 'menuitem',
        onclick: () => { closeMenu(); openOverlay('dashboard', 'پیشخوان', (root) => renderDashboard(root, { me: user })); } }, 'پیشخوان'),
      el('button', { class: 'dcp-person-item', type: 'button', role: 'menuitem',
        onclick: () => { closeMenu(); openOverlay('profile', 'پروفایل', (root) => renderProfile(root, { me: user })); } }, 'پروفایل'),
      // اطلاعیه‌ها — an overlay, not a page: the host already exists, is
      // layout-aware (it docks over column C on the desktop shell) and is what
      // the two items above use. A third destination would have been a page, a
      // route and a head, for a list.
      el('button', { class: 'dcp-person-item dcp-person-item-notices', type: 'button', role: 'menuitem',
        onclick: () => { closeMenu(); openOverlay('notices', 'اطلاعیه‌ها', renderNotices); } }, [
        'اطلاعیه‌ها',
        (user.unread_notices || 0) > 0
          ? el('span', { class: 'dcp-person-pill' }, faNum(user.unread_notices))
          : null,
      ]),
      // Re-run the guided tour on demand (mobile shell only for now). On a
      // non-home page startTour hands off to the homepage via /?tour=1.
      tourMenuAvailable() ? el('button', { class: 'dcp-person-item', type: 'button', role: 'menuitem',
        onclick: () => { closeMenu(); if (overlayOpen()) closeOverlay(); startTour({ manual: true }); } }, 'راهنمای سایت') : null,
      // Buying a subscription, reachable from the account menu itself and not
      // only from inside the profile — the shortest path from "I want this" to
      // the price. A LINK, not a button, so it opens in a new tab like any
      // other destination. subscriptionMenuLabel returns null for a lifetime
      // account and the null child is dropped: a founder is offered nothing
      // rather than an item that would mean nothing to them.
      subscriptionMenuLabel(user)
        ? el('a', { class: 'dcp-person-item', role: 'menuitem',
          href: pricingHref('header-menu'), onclick: () => closeMenu() },
        subscriptionMenuLabel(user))
        : null,
      el('button', { class: 'dcp-person-item', type: 'button', role: 'menuitem',
        onclick: async () => { closeMenu(); await api.logout().catch(() => {}); location.reload(); } }, 'خروج'),
    ]);
    const wrap = btn.closest('.dcp-person-wrap') || btn.parentNode;
    wrap.appendChild(menu);
    setTimeout(() => document.addEventListener('click', onDoc), 0);
  };

  // Toggle cycle: closed -> menu -> (select) -> overlay -> person closes it.
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu) { closeMenu(); return; }
    if (overlayOpen()) { closeOverlay(); return; }
    openMenu();
  });

  const wrap = el('div', { class: 'dcp-person-wrap' }, [btn]);
  return wrap;
}

export async function initHeader() {
  // BEFORE the early returns below, and deliberately so: the cabinet's premium
  // gate has to be armed on every page, including ones where this function
  // finds no topbar to enhance or has already run. It is idempotent and
  // delegated from `document`, so it does not care when dc-nav.js injects
  // #btn-cabinet or when moveToDrawer relocates it a few lines further down.
  try { installLibraryGate(); } catch (_) { /* non-fatal — the gate fails open */ }

  // The homepage ships TWO topbars: the mobile one (inside #mobile-shell, which
  // is display:none on the desktop UI) and the desktop one (inside the
  // .dcd-col-c header). A plain querySelector always returns the first (mobile)
  // bar, so on desktop the login/person icon landed in a hidden bar and there
  // was no way to log in. Pick the VISIBLE bar instead (getClientRects is empty
  // for a display:none subtree but non-empty for a visible fixed header).
  const bars = Array.from(document.querySelectorAll('.dc-topbar .dc-topbar-actions'));
  const actions = bars.find((b) => b.getClientRects().length > 0) || bars[0];
  if (!actions || actions.dataset.dcpHeader) return;
  actions.dataset.dcpHeader = '1';

  // Tour handoff (/?tour=1) — also armed here, not just in plus.js boot, so it
  // survives a stale cached plus.js entry (see initTourAutostart; idempotent).
  try { initTourAutostart(); } catch (_) { /* non-fatal */ }

  // The music + library buttons are NOT relocated here any more: dc-nav.js
  // emits them straight into the tool drawer in their final shape, so there is
  // no topbar->drawer move left to make (and no `dcp-booting` rule to clear).
  // That handoff was what made a slow connection show the old five-icon header
  // for a moment before it rearranged itself.

  // Render the guest header SYNCHRONOUSLY so it is final from the first paint:
  // no waiting on /me, which is slow and cross-site on the .org hosts (where it
  // always resolves to guest anyway). This removes the post-network icon pop-in
  // that read as a header "jump". The person icon is the only thing this
  // function still adds to the bar; the topbar's own height does not depend on
  // it, so its arrival costs no layout shift.
  let guestPerson = null;
  try { guestPerson = buildGuestPerson(); actions.appendChild(guestPerson); }
  catch (e) { if (window.console) console.warn('[plus header] guest render failed', e); }

  // A failed /me (API down, or cross-site on .org) leaves the guest header as
  // the final state. currentUser already swallows errors; guard anyway.
  let user = null;
  try { user = await currentUser(); } catch (_) { user = null; }
  if (!user) {
    // Confirmed guest: invite them in with the first-visit welcome box (capped
    // per device), pulsing the person icon toward the login entry point.
    try { maybeShowWelcome({ personBtn: guestPerson }); } catch (_) { /* non-fatal */ }
    // …and, on a session where that box did NOT speak, the premium offer. The
    // order is deliberate: the sign-up card owns a guest's very first visit
    // (homepage only, so a guest landing on an article gets the offer straight
    // away), and premium-popup.js bows out of any session where welcome ran.
    try { maybeShowPremiumPopup(null); } catch (_) { /* non-fatal */ }
    return; // guest header is correct; nothing to upgrade
  }

  // Plus requires a chosen pseudonym (leaderboard identity). If a logged-in user
  // somehow has none yet, gate behind a mandatory, non-dismissable name prompt.
  if (!nameIsChosen(user)) {
    try { user = await openNameGate({ user }); currentUser({ refresh: true }); }
    catch (_) { /* non-fatal: fall through to the logged-in upgrade */ }
  }

  // Upgrade the guest header to the logged-in one IN PLACE (flame + blue person
  // replacing the gray one), so a logged-in visitor sees only the icon swap and
  // the flame filling its spot, never a second relayout.
  try {
    const flame = buildFlame(user);
    if (guestPerson && guestPerson.parentNode === actions) actions.insertBefore(flame, guestPerson);
    else actions.appendChild(flame);
    // A qualifying action just happened today -> light the flame live, so the
    // user does not have to reload to see today's streak reflected.
    document.addEventListener(STREAK_ACTIVITY_EVENT, () => {
      flame.classList.add('is-active');
      flame.setAttribute('aria-label', 'امروز فعال بوده‌اید');
      flame.setAttribute('title', 'امروز فعال بوده‌اید');
    });
    const userPerson = buildUserPerson(user);
    if (guestPerson && guestPerson.parentNode === actions) actions.replaceChild(userPerson, guestPerson);
    else actions.appendChild(userPerson);
  } catch (e) {
    if (window.console) console.warn('[plus header] upgrade failed', e);
  }

  // Repair a stale push subscription for a reader who has notifications ON.
  // Deliberately here and not on the /plus/ dashboard: this is the one path that
  // runs on EVERY page for a signed-in reader — the article they are actually
  // reading — so a broken subscription heals wherever they happen to land,
  // instead of waiting for a visit to a page they may never open. Silent, never
  // prompts, once per tab session (see healPushSubscription).
  try {
    const rem = (user.settings && user.settings.reminders) || {};
    if (rem.new_content || rem.streak) healPushSubscription().catch(() => {});
  } catch (_) { /* non-fatal */ }

  // First login ever (account-scoped settings.tour_seen): offer the guided
  // tour. Guests get the welcome box above instead — never both.
  try {
    maybeOfferTour(user); // first login (mobile homepage): the guided-tour offer
    // Nudge the user to enable notifications (tour-styled, account-capped at 2,
    // once per session). It DEFERS while the tour offer/run is on screen — so on
    // the first mobile login it fires right after the tour closes (see tour.js),
    // and on desktop or on later logins it fires here.
    maybeShowNotifPrompt(user);
    // The premium offer, for a free account only — it stands down for a
    // subscriber or a founder, and for any session where the tour or the
    // notification nudge already appeared.
    maybeShowPremiumPopup(user);
  } catch (_) { /* non-fatal */ }
}
