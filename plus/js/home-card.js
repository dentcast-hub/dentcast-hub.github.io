// Homepage personal card, in the existing "یادگیری هفتگی" slot (spec 2.4).
// Two states: anonymous invitation, and logged-in free daily status. NO due-card
// counter for free users, not even a zero or a locked stub. No minutes target.
import { el, faNum, streakIsActiveToday } from './util.js';
import { currentUser, api } from './api.js';
import { openLoginModal, openOrgNotice } from './login-modal.js';
import { getModel, contentInfo } from './content-index.js';
import { INVITE_LINE, isOrgHost, detectContentId } from './config.js';

function flame(active) {
  return el('span', { class: 'dc-plus-flame' + (active ? ' is-active' : ''), 'aria-hidden': 'true' }, '🔥');
}

function renderAnon(card) {
  const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
  btn.addEventListener('click', async () => {
    // .org gate (temporary): show the dentcast.ir notice instead of OTP; the
    // anon demand signal is logged inside openOrgNotice (marked org:home).
    if (isOrgHost()) { openOrgNotice({ source: 'home', contentId: detectContentId() }); return; }
    const res = await openLoginModal({ returnTo: '/plus/' });
    if (res && res.user) location.reload();
  });
  card.replaceChildren(el('div', { class: 'dc-plus-home-inner dc-plus-anon' }, [
    el('p', { class: 'dc-plus-anon-line' }, INVITE_LINE),
    btn,
  ]));
}

async function renderLoggedIn(card, user) {
  const [me, progress, model, recent] = await Promise.all([
    api.me().catch(() => user),
    api.progress().catch(() => ({})),
    getModel(),
    // The most recent highlight is a reliable "last article read" fallback when
    // the activity-derived last_content_id is missing (limit 1, cheap).
    api.recentHighlights(1).catch(() => ({ highlights: [] })),
  ]);

  const active = streakIsActiveToday(me.last_active_day);
  const streakLine = el('a', { class: 'dc-plus-streak', href: '/plus/' }, [
    flame(active),
    el('span', { class: 'dc-plus-streak-n' }, faNum(me.current_streak || 0)),
    el('span', { class: 'dc-plus-streak-lbl' }, 'روز پیاپی'),
  ]);

  // A line back into the user's own material: ONLY the LAST article they read,
  // as a link. Prefer the server's activity-derived last_content_id; fall back to
  // the most recent highlight's article. If neither resolves, show nothing here —
  // never a "your highlights" line.
  const recentId = (recent && recent.highlights && recent.highlights[0])
    ? recent.highlights[0].content_id : null;
  const lastId = progress.last_content_id || recentId;
  const last = lastId ? contentInfo(model, lastId) : null;

  const rows = [streakLine];
  if (last) {
    rows.push(el('a', { class: 'dc-plus-material', href: last.url }, [
      el('span', { class: 'dc-plus-material-lead' }, 'ادامه خواندن: '),
      el('span', {}, last.title),
    ]));
  }

  // Premium-only due-card line. Never rendered for free users (not even zero).
  // (No premium teaser line on the home card, per prototype feedback.)
  if (me.tier === 'premium' && typeof me.due_card_count === 'number') {
    rows.push(el('a', { class: 'dc-plus-due', href: '/plus/' },
      faNum(me.due_card_count) + ' کارت برای مرور'));
  }

  card.replaceChildren(el('div', { class: 'dc-plus-home-inner' }, rows));
}

export async function initHomeCard() {
  const card = document.getElementById('dcPlusHomeCard');
  if (!card) return;
  try {
    const user = await currentUser();
    card.hidden = false;
    if (!user) renderAnon(card);
    else await renderLoggedIn(card, user);
  } catch (_) {
    // Keep the homepage pristine if anything fails: leave the slot hidden.
    card.hidden = true;
  }
}
