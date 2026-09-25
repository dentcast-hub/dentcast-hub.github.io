// /plus/pathway.html?id=... — one pathway's detail view (Phase 3). Same
// premium gate shape as pathways.html/cards.html, drawn per pathway: a pathway
// open to everybody renders for a free reader too.
import { el } from './util.js?v=159';
import { premiumCta, lapsedNote, guestPremiumExtras, unreachableGate } from './premium-cta.js?v=159';
import { currentUser, meStatus, api } from './api.js?v=159';
import { openLoginModal } from './login-modal.js?v=159';
import { renderPathwayDetail } from './pathways.js?v=159';
import { openPathways } from './pathway-showcase.js?v=159';
import { registerSW } from './pwa.js?v=159';
import { wirePageBack } from './page-back.js?v=159';

function comingSoonGate(root, me) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    lapsedNote(me) ? el('p', { class: 'dcp-gate-lapsed' }, lapsedNote(me)) : null,
    el('p', {}, 'مسیرهای یادگیری، ویژه‌ی دنت‌کست پریمیوم است.'),
    el('p', { class: 'dcp-muted' }, 'هایلایت‌ها و مطالعه‌ی شما همین حالا هم ثبت می‌شود؛ با پریمیوم، پیشرفتتان در یک مسیرِ منظم دیده می‌شود.'),
    // Founder, 1405/07/03: the exam is not behind this gate — only the road to it.
    el('p', { class: 'dcp-muted' }, 'اگر همهٔ مطالب یک مسیر را با حساب کاربری‌ات خوانده باشی، آزمون پایانی و گواهی‌نامه‌اش بدون اشتراک هم برایت باز است.'),
    premiumCta('gate-pathway'),
    el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/' }, 'رفتن به پیشخوان'),
  ].filter(Boolean)));
}

/**
 * A reader without the plan who has read EVERY step of this premium pathway
 * with their own account (founder, 1405/07/03): the arrangement stays the
 * subscription's, but the exam and the certificate are theirs, so the page
 * says so and leads there instead of drawing the generic «اگر … خوانده باشی»
 * gate at somebody who already has.
 */
function finisherGate(root, id) {
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'این مسیر را تا آخر خوانده‌ای.'),
    el('p', { class: 'dcp-muted' }, 'آزمون پایانی و گواهی‌نامه‌اش بدون اشتراک هم برایت باز است. ترتیب مسیر و فهرست قدم‌ها با اشتراک پریمیوم دیده می‌شود.'),
    el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/exam.html?id=' + encodeURIComponent(id) }, 'رفتن به آزمون ›'),
    el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/profile.html#certificates' }, 'گواهی‌نامه‌ها'),
  ]));
}

/** Locked for this reader: the finisher's card when GET /pathways says they
 * have read it all, otherwise the ordinary gate (and that one on any error). */
async function lockedGate(root, id, me) {
  const mine = await api.pathways().catch(() => null);
  const row = mine && (mine.pathways || []).find((p) => p.id === id);
  if (row && row.is_complete && row.kind !== 'bundle') finisherGate(root, id);
  else comingSoonGate(root, me);
}

async function main() {
  registerSW();
  wirePageBack();
  const root = document.getElementById('dcp-root');
  if (!root) return;

  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    root.replaceChildren(el('div', { class: 'dcp-empty' }, [
      el('p', {}, 'مسیری مشخص نشده.'),
      el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/pathways.html' }, 'بازگشت به مسیرها'),
    ]));
    return;
  }

  const user = await currentUser();
  // The API answered nothing — which is NOT the same as "no subscription".
  // See unreachableGate: for the minutes an API is down, this gate used to
  // tell paying subscribers to go and buy a subscription.
  if (!user && meStatus() === 'error') { unreachableGate(root); return; }
  if (!user) {
    const returnTo = '/plus/pathway.html?id=' + encodeURIComponent(id);
    const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
    btn.addEventListener('click', async () => {
      const res = await openLoginModal({ returnTo });
      if (res && res.user) location.reload();
    });
    // A pathway open to every account is not «ویژه‌ی پریمیوم» — the showcase
    // that sent this guest here called it «باز برای همه».
    const open = await openPathways();
    root.replaceChildren(el('div', { class: 'dcp-gate' }, open.has(id) ? [
      el('p', {}, 'این مسیر برای همه باز است.'),
      el('p', { class: 'dcp-muted' }, 'با یک حساب رایگان وارد شو تا قدم‌ها و پیشرفتت را ببینی.'),
      btn,
    ] : [
      el('p', {}, 'برای دیدن این مسیر وارد شوید.'),
      btn,
      ...guestPremiumExtras('guest-pathway'),
    ]));
    return;
  }

  // Premium per PATHWAY (`premium: false` in pathways.json opens one to
  // everybody): a free reader asks like anyone else, and the server's 402 on
  // a premium pathway is what draws the gate.
  await renderPathwayDetail(root, id, user.tier !== 'premium' ? { onLocked: () => { void lockedGate(root, id, user); } } : {});
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
