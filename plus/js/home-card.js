// Homepage personal card, in the existing "یادگیری هفتگی" slot (spec 2.4).
// Two states: anonymous invitation, and logged-in free daily status. NO due-card
// counter for free users, not even a zero or a locked stub. No minutes target.
import { el, faNum, streakIsActiveToday } from './util.js';
import { currentUser, api } from './api.js';
import { openLoginModal, openOrgNotice } from './login-modal.js';
import { getModel, contentInfo } from './content-index.js';
import { INVITE_LINE, isOrgHost, detectContentId, baleEnabled, telegramLoginEnabled } from './config.js';
import { ensurePushSubscription, removePushSubscription } from './push.js';

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

  // Score (⭐) sits inline beside the streak. It's the same number the future
  // leagues rank on, so surfacing it now is the stepping stone toward that. No
  // "rank" label yet — just the personal total.
  const scoreBadge = (typeof progress.score === 'number')
    ? el('span', { class: 'dc-plus-score', title: 'امتیاز شما' }, [
        el('span', { class: 'dc-plus-score-ico', 'aria-hidden': 'true' }, '⭐'),
        el('span', { class: 'dc-plus-score-n' }, faNum(progress.score)),
        el('span', { class: 'dc-plus-score-lbl' }, 'امتیاز'),
      ])
    : null;

  // A line back into the user's own material: ONLY the LAST article they read,
  // as a link. Prefer the server's activity-derived last_content_id; fall back to
  // the most recent highlight's article. If neither resolves, show nothing here —
  // never a "your highlights" line.
  const recentId = (recent && recent.highlights && recent.highlights[0])
    ? recent.highlights[0].content_id : null;
  const lastId = progress.last_content_id || recentId;
  const last = lastId ? contentInfo(model, lastId) : null;

  const rows = [streakLine];
  if (scoreBadge) rows.push(scoreBadge);
  if (last) {
    // Episodes are audio (the only content that fires episode_listened), so the
    // lead reads "ادامه گوش دادن"; everything else is "ادامه خواندن".
    const lead = last.type === 'episodes' ? 'ادامه گوش دادن: ' : 'ادامه خواندن: ';
    rows.push(el('a', { class: 'dc-plus-material', href: last.url }, [
      el('span', { class: 'dc-plus-material-lead' }, lead),
      el('span', {}, last.title),
    ]));
  }

  // Premium-only due-card line. Never rendered for free users (not even zero).
  // (No premium teaser line on the home card, per prototype feedback.)
  if (me.tier === 'premium' && typeof me.due_card_count === 'number') {
    rows.push(el('a', { class: 'dc-plus-due', href: '/plus/' },
      faNum(me.due_card_count) + ' کارت برای مرور'));
  }

  // Connection chips on their own line: invite (○) when off, tick (✓) when on.
  rows.push(connectionsRow(me));

  card.replaceChildren(el('div', { class: 'dc-plus-home-inner' }, rows));
}

// The connection strip: notifications (a light inline on/off toggle) plus Bale /
// Telegram (status only — their connect flows live on the profile, so the card
// stays light and never embeds a redirect widget or a popup+poll). A chip shows
// ✓ when active and ○ (an invitation) when not.
function connectionsRow(me) {
  const r = (me.settings && me.settings.reminders) || {};
  let notifOn = !!(r.new_content || r.streak);
  const chips = [];

  // نوتیف — a master on/off. ON enables both reminders (+ tries to subscribe the
  // browser); OFF disables both. The profile keeps the granular per-type toggles.
  const notifIco = el('span', { class: 'dc-plus-chip-ico', 'aria-hidden': 'true' }, notifOn ? '✓' : '○');
  const notifChip = el('button', {
    class: 'dc-plus-chip' + (notifOn ? ' is-on' : ''), type: 'button', 'aria-pressed': String(notifOn),
  }, [notifIco, el('span', {}, 'نوتیف')]);
  notifChip.addEventListener('click', async () => {
    const next = !notifOn;
    notifChip.disabled = true;
    // Subscribe FIRST while the click gesture is still live (an earlier await
    // would consume it). Preference is saved regardless of the browser outcome.
    if (next) { try { await ensurePushSubscription(); } catch (_) { /* keep pref */ } }
    await api.updateMe({ settings: { reminders: { new_content: next, streak: next } } }).catch(() => {});
    if (!next) { try { await removePushSubscription(); } catch (_) { /* ignore */ } }
    notifOn = next;
    notifChip.classList.toggle('is-on', next);
    notifChip.setAttribute('aria-pressed', String(next));
    notifIco.textContent = next ? '✓' : '○';
    notifChip.disabled = false;
    currentUser({ refresh: true }); // keep the shared /me snapshot in sync
  });
  chips.push(notifChip);

  // بله — connect/manage on the profile (deep-link + poll is too heavy for here).
  if (baleEnabled()) {
    chips.push(el('a', { class: 'dc-plus-chip' + (me.bale_linked ? ' is-on' : ''), href: '/plus/profile.html' }, [
      el('span', { class: 'dc-plus-chip-ico', 'aria-hidden': 'true' }, me.bale_linked ? '✓' : '○'),
      el('span', {}, 'بله'),
    ]));
  }

  // تلگرام — show only where it can be connected (.org) or is already linked; the
  // widget doesn't work on .ir, so an un-linked .ir user doesn't see a dead chip.
  if (me.telegram_linked || telegramLoginEnabled()) {
    chips.push(el('a', { class: 'dc-plus-chip' + (me.telegram_linked ? ' is-on' : ''), href: '/plus/profile.html' }, [
      el('span', { class: 'dc-plus-chip-ico', 'aria-hidden': 'true' }, me.telegram_linked ? '✓' : '○'),
      el('span', {}, 'تلگرام'),
    ]));
  }

  return el('div', { class: 'dc-plus-chips' }, chips);
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
