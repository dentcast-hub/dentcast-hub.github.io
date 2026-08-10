// Homepage personal card, in the existing "یادگیری هفتگی" slot (spec 2.4).
// Two states: anonymous invitation, and logged-in free daily status. NO due-card
// counter for free users, not even a zero or a locked stub. No minutes target.
import { el, faNum, streakIsActiveToday, STREAK_ACTIVITY_EVENT } from './util.js';
import { currentUser, api } from './api.js';
import { openLoginModal, openOrgNotice } from './login-modal.js';
import { getModel, contentInfo } from './content-index.js';
import { isOrgHost, detectContentId, baleEnabled, telegramLoginEnabled } from './config.js';
import { ensurePushSubscription, removePushSubscription } from './push.js';
import { leagueChip, maybeAnnounceOutcome } from './league.js';

function flame(active) {
  return el('span', { class: 'dc-plus-flame' + (active ? ' is-active' : ''), 'aria-hidden': 'true' }, '🔥');
}

// Crafted inline icons for the signed-out promo feature chips (cleaner than
// emoji). Static markup, injected via innerHTML on a plain span.
const IC_FLAME = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13 2s1 3-1.5 5.5S8 12 8 14a4 4 0 0 0 8 .3c.2-2.3-1.3-3.8-1-5.8 1.6.8 2.4 2 2.6 3.9A6.5 6.5 0 1 1 8.7 6.3 12 12 0 0 0 13 2z"/></svg>';
const IC_STAR = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 21.2l1.4-6.8L2.2 9.7l6.9-.7z"/></svg>';
const IC_BELL = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 22a2.3 2.3 0 0 0 2.3-2.3H9.7A2.3 2.3 0 0 0 12 22zm7-6.3-1.7-2v-3.2a5.4 5.4 0 0 0-4.2-5.3V4.5a1.1 1.1 0 1 0-2.2 0v.7A5.4 5.4 0 0 0 6.7 10.5v3.2L5 15.7a.9.9 0 0 0 .7 1.5h12.6a.9.9 0 0 0 .7-1.5z"/></svg>';
// The «؟» caption's shield line. Plain language, short sentences, and every
// number from the server (`first_cost`, `step`, `next_in`) so the copy can never
// disagree with the ladder the API actually applies.
function shieldCapText(fz) {
  const first = fz.first_cost || 200;
  const step = fz.step || 50;
  let t = '🛡️ سپر یعنی یک روز مرخصی. اگر یک روز نیایی، سپر خودش خرج می‌شود و زنجیره‌ات '
        + 'نمی‌شکند. سپر اول ' + faNum(first) + ' امتیاز است و هر سپر بعدی '
        + faNum(step) + ' امتیاز گران‌تر؛ امتیازت هم کم نمی‌شود. پس سپرت را نگه دار.';
  if (fz.next_in) t += ' ' + faNum(fz.next_in) + ' امتیاز تا سپر بعدی.';
  return t;
}

// Hover text for the badge: what you hold, and what the next one costs.
function shieldTitle(available, fz) {
  let t = 'سپر استریک: ' + faNum(available);
  if (fz.next_in) {
    t += ' — ' + faNum(fz.next_in) + ' امتیاز تا سپر بعدی';
    if (fz.next_cost) t += ' (سپر بعدی ' + faNum(fz.next_cost) + ' امتیاز)';
  }
  return t;
}

// Streak-shield row, identical to the پیشخوان's: one icon per shield in hand.
// There is no cap, so there are no empty slots to draw — when the user holds
// none, a single dimmed shield stands in as the "not yet" state.
function paintShields(host, available) {
  const icons = [];
  for (let i = 0; i < Math.max(1, available); i += 1) {
    icons.push(el('span', { class: 'dc-plus-shield-ico' + (i < available ? '' : ' is-empty') }, '🛡️'));
  }
  host.replaceChildren(...icons);
}

function renderAnon(card) {
  const btn = el('button', { class: 'dcp-btn dc-plus-cta', type: 'button' }, [
    el('span', {}, 'شروع رایگان'),
    el('span', { class: 'dc-plus-cta-arrow', 'aria-hidden': 'true' }, '←'),
  ]);
  btn.addEventListener('click', async () => {
    // .org gate (temporary): show the dentcast.ir notice instead of OTP; the
    // anon demand signal is logged inside openOrgNotice (marked org:home).
    if (isOrgHost()) { openOrgNotice({ source: 'home', contentId: detectContentId() }); return; }
    const res = await openLoginModal({ returnTo: '/plus/' });
    if (res && res.user) location.reload();
  });

  const feat = (svg, label, tone) => {
    const ico = el('span', { class: 'dc-plus-feat-ico ' + tone, 'aria-hidden': 'true' });
    ico.innerHTML = svg; // static, trusted markup
    return el('span', { class: 'dc-plus-feat' }, [ico, el('span', {}, label)]);
  };

  const medal = el('span', { class: 'dc-plus-medal', 'aria-hidden': 'true' }, [
    el('span', { class: 'dc-plus-medal-fl' }, '🔥'),
  ]);

  card.replaceChildren(el('div', { class: 'dc-plus-promo' }, [
    el('div', { class: 'dc-plus-promo-top' }, [
      medal,
      el('div', {}, [
        el('h3', { class: 'dc-plus-promo-h' }, 'شعله‌ی یادگیری‌ات را روشن کن'),
        el('p', { class: 'dc-plus-promo-sub' }, 'رایگان وارد شو؛ پیشرفتت ثبت و همه‌جا همراهت می‌ماند.'),
      ]),
    ]),
    el('div', { class: 'dc-plus-promo-rule' }),
    el('div', { class: 'dc-plus-promo-bottom' }, [
      el('div', { class: 'dc-plus-feats' }, [
        feat(IC_FLAME, 'استریک روزانه', 't-fl'),
        feat(IC_STAR, 'امتیاز', 't-st'),
        feat(IC_BELL, 'نوتیف مطلب جدید', 't-bell'),
      ]),
      btn,
    ]),
  ]));
}

async function renderLoggedIn(card, user) {
  const [me, progress, model, recent, league] = await Promise.all([
    api.me().catch(() => user),
    api.progress().catch(() => ({})),
    getModel(),
    // The most recent highlight is a reliable "last article read" fallback when
    // the activity-derived last_content_id is missing (limit 1, cheap).
    api.recentHighlights(1).catch(() => ({ highlights: [] })),
    api.league().catch(() => null),
  ]);

  // Keep handles to the flame + numbers so live updates (below) can patch them in
  // place, without re-rendering the whole card.
  const flameEl = flame(streakIsActiveToday(me.last_active_day));
  const streakNumEl = el('span', { class: 'dc-plus-streak-n' }, faNum(me.current_streak || 0));
  const streakLine = el('a', { class: 'dc-plus-streak', href: '/plus/' }, [
    flameEl,
    streakNumEl,
    el('span', { class: 'dc-plus-streak-lbl' }, 'روز پیاپی'),
  ]);

  // Score (⭐) sits inline beside the streak: the all-time total from score.ts
  // (active_days*10 + content_completed*5 + highlights). It UNLOCKS shields — it
  // is never spent, because there is no stored balance at all: score is derived
  // from the activity log, so it can only grow. It is also NOT the league
  // currency — the league ranks on weekly_xp, a separate per-action quantity
  // that resets every week (see services/league.ts). Never conflate the two, and
  // never call a shield "bought": the «؟» caption spells both out.
  const scoreNumEl = (typeof progress.score === 'number')
    ? el('span', { class: 'dc-plus-score-n' }, faNum(progress.score)) : null;
  const scoreBadge = scoreNumEl
    ? el('span', { class: 'dc-plus-score', title: 'امتیاز شما' }, [
        el('span', { class: 'dc-plus-score-ico', 'aria-hidden': 'true' }, '⭐'),
        scoreNumEl,
        el('span', { class: 'dc-plus-score-lbl' }, 'امتیاز'),
      ])
    : null;

  // Streak shields (سپر) — the very same value the پیشخوان shows, read from the
  // same `progress.freezes` payload, so the two never disagree: filled 🛡️ for a
  // shield in hand, dimmed slot for an empty one. Replaces the old «رتبه کل».
  let shieldIconsEl = null;
  let shieldNumEl = null;
  let shieldBadge = null;
  const fz = progress.freezes;
  if (fz) {
    const available = Math.max(0, fz.available || 0);
    shieldIconsEl = el('span', { class: 'dc-plus-shield-icos', 'aria-hidden': 'true' });
    paintShields(shieldIconsEl, available);
    shieldNumEl = el('span', { class: 'dc-plus-shield-n' }, faNum(available));
    shieldBadge = el('span', {
      class: 'dc-plus-shield', title: shieldTitle(available, fz),
    }, [shieldIconsEl, shieldNumEl, el('span', { class: 'dc-plus-shield-lbl' }, 'سپر')]);
  }

  // League chip (opens the weekly-league overlay). Present whenever /league
  // answered — even "not joined this week" shows the tier with a gentle nudge.
  let leagueChipEl = league ? leagueChip(league) : null;

  // A line back into the user's own material: ONLY the LAST article they read,
  // as a link. Prefer the server's activity-derived last_content_id; fall back to
  // the most recent highlight's article. If neither resolves, show nothing here —
  // never a "your highlights" line.
  const recentId = (recent && recent.highlights && recent.highlights[0])
    ? recent.highlights[0].content_id : null;
  const lastId = progress.last_content_id || recentId;
  const last = lastId ? contentInfo(model, lastId) : null;

  // Row 1 — the glanceable STAT RAIL: streak · score · سپر · league, tidy with
  // hairline dividers between whatever is present. A small «؟» reveals a one-line
  // scoring caption on demand (kept out of the way so the rail stays glanceable).
  const stats = [streakLine, scoreBadge, shieldBadge, leagueChipEl].filter(Boolean);
  const rail = el('div', { class: 'dc-plus-statrail' });
  stats.forEach((s, i) => {
    if (i) rail.appendChild(el('span', { class: 'dc-plus-div', 'aria-hidden': 'true' }));
    rail.appendChild(s);
  });
  // The «؟» caption: how the score is earned, plus — now that the rail carries
  // سپر — what a streak shield is and how it charges. The shield line is built
  // from the same `freezes` payload (never hardcoded numbers) and says the same
  // thing the پیشخوان says, so the two explanations can't drift apart.
  const shieldCapEl = fz ? el('span', { class: 'dc-plus-capline' }, shieldCapText(fz)) : null;
  // Read the rates off the payload, never hardcoded — same rule the shield line
  // follows, so retuning them server-side can't leave this caption lying.
  const perContent = progress.score_points_per_content || 5;
  const perDay = progress.score_points_per_active_day || 10;
  const scoreCap = el('p', { class: 'dc-plus-scorecap', hidden: true }, [
    el('span', { class: 'dc-plus-capline' },
      '⭐ هر پادکستی که گوش می‌دهی و هر مقاله‌ای که تمام می‌کنی '
      + faNum(perContent) + ' امتیاز دارد، هر روزِ فعال ' + faNum(perDay) + ' امتیاز، '
      + 'و هر هایلایت ۱ امتیاز. یک پادکست را که دوباره گوش بدهی هفته‌ی بعد '
      + 'دوباره امتیاز دارد؛ مقاله‌ی تکراری نه. '
      + 'امتیاز همیشه برایت می‌ماند و با آن سپر می‌گیری.'),
    el('span', { class: 'dc-plus-capline' },
      '🏆 XP چیز دیگری است: هر هفته از صفر شروع می‌شود و فقط جایگاهت در لیگِ آن هفته را می‌سازد.'),
    shieldCapEl,
  ].filter(Boolean));
  const capTitle = fz ? 'امتیاز و سپر چطور کار می‌کنند؟' : 'امتیاز چطور جمع می‌شود؟';
  const info = el('button', {
    class: 'dc-plus-info', type: 'button', title: capTitle, 'aria-label': capTitle,
  }, '؟');
  info.addEventListener('click', () => { scoreCap.hidden = !scoreCap.hidden; });
  rail.appendChild(info);

  const rows = [rail, scoreCap];

  // Row 2 — the one primary action: continue where you left off.
  if (last) {
    const lead = last.type === 'episodes' ? 'ادامه گوش دادن: ' : 'ادامه خواندن: ';
    rows.push(el('a', { class: 'dc-plus-material', href: last.url }, [
      el('span', { class: 'dc-plus-material-lead' }, lead),
      el('span', {}, last.title),
    ]));
  }
  // NOTE — no premium rows here any more. The due-card line and the locked
  // «قطب‌نمای مطالعه» row both moved OUT of this card and into the homepage's
  // own premium section under the ad (home-features.js): a lock is easy to miss
  // inside a card about the reader's own state, and it crowds what it sits next
  // to. This card is now only the reader's own material, and it is one row
  // SHORTER than it was — never add a premium teaser back into it.

  // Row 3 — connection chips, demoted to a lighter row under a divider.
  rows.push(el('div', { class: 'dc-plus-connrow' }, [connectionsRow(me)]));

  card.replaceChildren(el('div', { class: 'dc-plus-home-inner' }, rows));

  // Announce a finalized league outcome (promoted / stayed / demoted) once — the
  // only "reward" of this phase, so never silent. Clears itself server-side.
  maybeAnnounceOutcome(league);

  // Live update, no reload: patch the streak flame + streak/score/rank numbers and
  // the league chip in place when the user earns a qualifying action
  // (STREAK_ACTIVITY_EVENT, the same signal the header flame uses) or returns to
  // this page (bfcache restore / tab refocus). Guarded so overlaps coalesce.
  let refreshing = false;
  async function refreshStatus() {
    if (refreshing) return;
    refreshing = true;
    try {
      const [m2, p2, lg2] = await Promise.all([
        currentUser({ refresh: true }),
        api.progress().catch(() => null),
        api.league().catch(() => null),
      ]);
      if (m2) {
        flameEl.classList.toggle('is-active', streakIsActiveToday(m2.last_active_day));
        streakNumEl.textContent = faNum(m2.current_streak || 0);
      }
      if (scoreNumEl && p2 && typeof p2.score === 'number') {
        scoreNumEl.textContent = faNum(p2.score);
      }
      if (shieldBadge && p2 && p2.freezes) {
        const av2 = Math.max(0, p2.freezes.available || 0);
        paintShields(shieldIconsEl, av2);
        shieldNumEl.textContent = faNum(av2);
        shieldBadge.title = shieldTitle(av2, p2.freezes);
        // Keep the «؟» explanation honest too — «… امتیاز تا سپر بعدی» moves.
        if (shieldCapEl) shieldCapEl.textContent = shieldCapText(p2.freezes);
      }
      if (lg2 && leagueChipEl) {
        const fresh = leagueChip(lg2);
        leagueChipEl.replaceWith(fresh);
        leagueChipEl = fresh;
      }
    } finally {
      refreshing = false;
    }
  }
  document.addEventListener(STREAK_ACTIVITY_EVENT, refreshStatus);
  window.addEventListener('pageshow', (e) => { if (e.persisted) refreshStatus(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshStatus();
  });
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
    chips.push(el('a', { class: 'dc-plus-chip' + (me.bale_linked ? ' is-on' : ''), href: '/plus/profile.html#connect' }, [
      el('span', { class: 'dc-plus-chip-ico', 'aria-hidden': 'true' }, me.bale_linked ? '✓' : '○'),
      el('span', {}, 'بله'),
    ]));
  }

  // تلگرام — show only where it can be connected (.org) or is already linked; the
  // widget doesn't work on .ir, so an un-linked .ir user doesn't see a dead chip.
  if (me.telegram_linked || telegramLoginEnabled()) {
    chips.push(el('a', { class: 'dc-plus-chip' + (me.telegram_linked ? ' is-on' : ''), href: '/plus/profile.html#connect' }, [
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
