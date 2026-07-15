// Homepage personal card, in the existing "یادگیری هفتگی" slot (spec 2.4).
// Two states: anonymous invitation, and logged-in free daily status. NO due-card
// counter for free users, not even a zero or a locked stub. No minutes target.
import { el, faNum, streakIsActive } from './util.js';
import { currentUser, api } from './api.js';
import { openLoginModal } from './login-modal.js';
import { getModel, contentInfo } from './content-index.js';
import { INVITE_LINE } from './config.js';

function flame(active) {
  return el('span', { class: 'dc-plus-flame' + (active ? ' is-active' : ''), 'aria-hidden': 'true' }, '🔥');
}

function renderAnon(card) {
  const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
  btn.addEventListener('click', async () => {
    const res = await openLoginModal({ returnTo: '/plus/' });
    if (res && res.user) location.reload();
  });
  card.replaceChildren(el('div', { class: 'dc-plus-home-inner dc-plus-anon' }, [
    el('p', { class: 'dc-plus-anon-line' }, INVITE_LINE),
    btn,
  ]));
}

async function renderLoggedIn(card, user) {
  const [me, progress, model] = await Promise.all([
    api.me().catch(() => user),
    api.progress().catch(() => ({})),
    getModel(),
  ]);

  const active = streakIsActive(me.last_active_day);
  const streakLine = el('a', { class: 'dc-plus-streak', href: '/plus/' }, [
    flame(active),
    el('span', { class: 'dc-plus-streak-n' }, faNum(me.current_streak || 0)),
    el('span', { class: 'dc-plus-streak-lbl' }, 'روز پیاپی'),
  ]);

  // A line back into the user's own material.
  const last = progress.last_content_id ? contentInfo(model, progress.last_content_id) : null;
  let materialLine;
  if (last) {
    materialLine = el('a', { class: 'dc-plus-material', href: last.url }, [
      el('span', { class: 'dc-plus-material-lead' }, 'ادامه خواندن: '),
      el('span', {}, last.title),
    ]);
  } else {
    const n = progress.total_highlights || 0;
    materialLine = el('a', { class: 'dc-plus-material', href: '/plus/cards.html' },
      n ? faNum(n) + ' هایلایت شما' : 'اولین هایلایت خود را بسازید');
  }

  const rows = [streakLine, materialLine];

  // Premium-only due-card line. Never rendered for free users (not even zero).
  if (me.tier === 'premium' && typeof me.due_card_count === 'number') {
    rows.push(el('a', { class: 'dc-plus-due', href: '/plus/' },
      faNum(me.due_card_count) + ' کارت برای مرور'));
  }

  // One quiet premium line (teaser), for everyone; visibly secondary.
  rows.push(el('a', { class: 'dc-plus-premium-line', href: '/plus/' }, 'مسیر یادگیری زمان‌بندی‌شده، به‌زودی'));

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
