// Weekly-league UI: reusable tier badge, the home-card league chip, the league
// overlay (this week's group table), and the finalized-outcome announcement.
// Data comes from GET /league (the backend already returns everything: members,
// ranks, zone sizes, countdown, neutral-mode, and any pending outcome).
import { el, faNum } from './util.js';
import { api } from './api.js';
import { PREMIUM_FEATURES } from './config.js';

const TOOTH = '<svg class="dcp-tier-tooth" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C8 2 5 4 5 8c0 3 1 5 1.6 8.5C7 19 7.6 22 9 22c1.2 0 1.3-2 1.6-4 .2-1.4.5-2 1.4-2s1.2.6 1.4 2c.3 2 .4 4 1.6 4 1.4 0 2-3 2.4-5.5C19 13 20 11 20 8c0-4-3-6-8-6z"/></svg>';

/** A tier shield badge. `size` ∈ xs|sm|md|lg. Tier 7 (titanium) gets light text. */
export function tierBadge(order, { size = 'md' } = {}) {
  const b = el('span', {
    class: `dcp-tier dcp-tier-t${order} dcp-tier-${size}` + (order >= 7 ? ' is-dark' : ''),
    'aria-hidden': 'true',
  });
  b.innerHTML = `${TOOTH}<span class="dcp-tier-ord">${faNum(order)}</span>`;
  return b;
}

const tierOf = (data) => data.group_tier || data.tier || { name_fa: '', tier_order: 1 };

/** The compact league chip for the home card. Opens the overlay on click. */
export function leagueChip(data) {
  const t = tierOf(data);
  const btn = el('button', { class: 'dcp-lg-chip', type: 'button', 'aria-label': 'لیگ من' }, [
    tierBadge(t.tier_order, { size: 'xs' }),
    el('b', {}, 'لیگ ' + t.name_fa),
    (data.joined && data.my_rank)
      ? el('span', { class: 'dcp-lg-chip-r' }, '· رتبهٔ ' + faNum(data.my_rank))
      : el('span', { class: 'dcp-lg-chip-r is-muted' }, '· شرکت کن'),
  ]);
  btn.addEventListener('click', () => openLeagueOverlay());
  return btn;
}

/** A labelled entry button (dashboard / profile) that opens the overlay. */
export function leagueEntryButton(data) {
  const t = tierOf(data);
  const btn = el('button', { class: 'dcp-lg-entry', type: 'button' }, [
    tierBadge(t.tier_order, { size: 'sm' }),
    el('span', { class: 'dcp-lg-entry-txt' }, [
      el('b', {}, 'لیگ ' + t.name_fa),
      el('span', { class: 'dcp-lg-entry-sub' },
        (data.joined && data.my_rank) ? ('رتبهٔ شما: ' + faNum(data.my_rank)) : 'این هفته هنوز وارد نشده‌اید'),
    ]),
    el('span', { class: 'dcp-lg-entry-arrow', 'aria-hidden': 'true' }, '‹'),
  ]);
  btn.addEventListener('click', () => openLeagueOverlay());
  return btn;
}

function fmtRemaining(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return 'به‌زودی بسته می‌شود';
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  if (d >= 1) return faNum(d) + ' روز' + (h ? ' و ' + faNum(h) + ' ساعت' : '') + ' مانده';
  if (h >= 1) return faNum(h) + ' ساعت مانده';
  return faNum(Math.max(1, Math.floor(sec / 60))) + ' دقیقه مانده';
}

function memberRow(m, { up, down, size }) {
  const rank = m.rank;
  const inUp = up > 0 && rank <= up;
  const inDown = down > 0 && rank > size - down;
  const cls = 'dcp-lg-row' + (m.is_me ? ' is-me' : '') + (inUp ? ' is-up' : '') + (inDown ? ' is-down' : '');
  const initial = m.is_me ? 'تو' : (m.display_name || '؟').trim().slice(0, 1);
  return el('div', { class: cls }, [
    el('span', { class: 'dcp-lg-rk' }, faNum(rank)),
    el('span', { class: 'dcp-lg-av' }, initial),
    el('span', { class: 'dcp-lg-nm' }, m.display_name || 'ناشناس'),
    el('span', { class: 'dcp-lg-xp' }, [el('b', {}, faNum(m.weekly_xp || 0)), el('small', {}, 'XP')]),
  ]);
}

function buildCard(data, onClose) {
  const t = tierOf(data);
  const card = el('div', { class: 'dcp-lg-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'لیگ من' });

  const closeBtn = el('button', { class: 'dcp-modal-close', type: 'button', 'aria-label': 'بستن' }, '×');
  closeBtn.addEventListener('click', onClose);

  card.append(el('div', { class: 'dcp-lg-head' }, [
    closeBtn,
    tierBadge(t.tier_order, { size: 'md' }),
    el('div', { class: 'dcp-lg-head-txt' }, [
      el('h3', {}, 'لیگ ' + t.name_fa),
      el('p', { class: 'dcp-lg-head-sub' }, data.joined ? 'گروهِ این هفته' : 'این هفته وارد نشده‌اید'),
    ]),
  ]));
  // League timer as its own bar (clear, and never colliding with the × corner).
  card.append(el('div', { class: 'dcp-lg-timebar' }, [
    el('span', { class: 'dcp-lg-timebar-ico', 'aria-hidden': 'true' }, '⏳'),
    el('span', { class: 'dcp-lg-timebar-lbl' }, 'تا پایانِ هفتهٔ لیگ:'),
    el('b', {}, fmtRemaining(data.time_remaining_seconds).replace(' مانده', '')),
  ]));

  // Every number here comes from the API (league_config), never hardcoded: a
  // founder can retune the scoring at any time, and an explainer that says the
  // rules is the worst place to quietly go stale. Falls back to the shipped
  // defaults only if an older API answers without the table.
  const xp = data.xp || {};
  const n = (v, fallback) => faNum(typeof v === 'number' ? v : fallback);

  /**
   * The premium earning paths (migration 0029). Extra WAYS to earn — never a
   * better price on an act a free reader also performs — so the copy names the
   * feature every time («مسیر یادگیری», «کالکشن») rather than saying "premium
   * gets more", which would read as exactly the multiplier this is not.
   *
   * Returns an array so an older API (or all four paths switched off) simply
   * contributes nothing to the explainer.
   */
  function premiumHowto(p) {
    const line = (weight, text, cap, capText) => {
      if (!(Number(weight) > 0)) return null;
      return el('li', {}, text + ': +' + faNum(weight)
        + (Number(cap) > 0 ? ' (' + capText.replace('{n}', faNum(cap)) + ')' : ''));
    };
    const items = [
      line(p.pathway_step, 'خواندن یا شنیدنِ مطلبی که قدمِ یکی از مسیرهای یادگیریِ توست',
        p.pathway_step_cap, 'تا {n} مطلب در هفته'),
      line(p.pathway_enrolled, 'شروعِ یک مسیر یادگیری',
        p.pathway_enrolled_cap, 'تا {n} مسیر در هفته'),
      line(p.collection_created, 'ساختنِ یک کالکشن',
        p.collection_created_cap, 'تا {n} کالکشن در هفته'),
      line(p.collection_item, 'افزودنِ یک هایلایت یا صفحه به کالکشن',
        p.collection_item_cap, 'تا {n} مطلب در هفته'),
    ].filter(Boolean);
    if (!items.length) return [];
    return [
      el('p', {}, 'با پریمیوم، راه‌های بیشتری هم برای امتیاز گرفتن باز می‌شود '
        + '— امتیازِ کارهای بالا برای همه یکسان است:'),
      el('ul', { class: 'dcp-lg-howto-list' }, items),
    ];
  }
  const howto = () => el('details', { class: 'dcp-lg-howto' }, [
    el('summary', {}, 'چطور امتیازِ لیگ می‌گیرم؟'),
    el('ul', { class: 'dcp-lg-howto-list' }, [
      el('li', {}, 'خواندنِ کاملِ یک مقاله (تا آخر): +' + n(xp.read, 5)),
      el('li', {}, 'گوش‌دادنِ نصفِ یک پادکست: +' + n(xp.listen, 5)),
      el('li', {}, 'هر هایلایت: +' + n(xp.highlight, 1) + ' (تا ' + n(xp.highlight_cap, 3) + ' هایلایت در هر مقاله)'),
      el('li', {}, 'مرورِ کارت: +' + n(xp.review, 2)),
      el('li', {}, 'اولین فعالیتِ هر روز: +' + n(xp.active_bonus, 5)),
      // The share line carries its own condition, because that condition is the
      // whole rule: a tap on a page you have not finished pays nothing, and a
      // reader who learns that from the absence of a number instead of from a
      // sentence will read it as a bug.
      //
      // The weekly ceiling is printed only when there IS one. It was removed
      // (migration 0028) because sharing is the one action that brings someone
      // new here and a five-article week was worth one article read; the knob
      // stays, so this line has to survive it coming back — and must never
      // render «تا ۰ مطلب در هفته», which reads as "sharing pays nothing".
      el('li', {}, 'اشتراک‌گذاریِ مطلبی که تا آخر خوانده‌ای: +' + n(xp.share, 1)
        + (Number(xp.share_cap) > 0 ? ' (تا ' + n(xp.share_cap, 5) + ' مطلب در هفته)' : '')),
    ]),
    // The premium block. Shown to EVERYONE — a free reader has to be able to see
    // exactly what the four extra lines are, otherwise a premium neighbour with a
    // higher number reads as a hidden multiplier on the five lines above, which
    // is the one thing this design is built not to be. Each line renders only
    // while its weight is above zero, so switching a path off from the admin
    // config removes the promise instead of advertising «+۰».
    ...premiumHowto(xp.premium || {}),
    el('p', {}, 'فقط فعالیتِ همین هفته در لیگ حساب می‌شود و شنبه از نو صفر می‌شود.'),
  ]);

  if (!data.joined) {
    card.append(el('div', { class: 'dcp-lg-empty' }, [
      el('p', {}, 'این هفته هنوز واردِ لیگ نشده‌ای.'),
      el('p', { class: 'dcp-sec-hint' }, 'همین که یک مطلب بخوانی یا هایلایت کنی، به گروهِ این هفته اضافه می‌شوی و رقابت شروع می‌شود.'),
    ]));
    card.append(howto());
    return card;
  }

  const size = data.size || (data.members ? data.members.length : 0);
  const up = data.neutral_mode ? 0 : (data.promotion_zone || 0);
  const down = data.neutral_mode ? 0 : (data.demotion_zone || 0);
  const members = data.members || [];

  const body = el('div', { class: 'dcp-lg-body' });
  if (up > 0) {
    body.append(el('div', { class: 'dcp-lg-zone is-up' }, [el('span', {}, 'صعود به لیگِ بالاتر'), el('span', { class: 'dcp-lg-zone-ln' }), el('span', {}, '↑')]));
  }
  members.forEach((m, i) => {
    if (down > 0 && i === members.length - down) {
      body.append(el('div', { class: 'dcp-lg-zone is-down' }, [el('span', {}, '↓'), el('span', { class: 'dcp-lg-zone-ln' }), el('span', {}, 'سقوط به لیگِ پایین‌تر')]));
    }
    body.append(memberRow(m, { up, down, size }));
  });
  card.append(body);

  const foot = data.neutral_mode
    ? 'این هفته گروه هنوز کوچک است؛ صعود/سقوط وقتی فعال می‌شود که گروه پر شود. فعلاً فقط فعالیتت را جمع کن.'
    : 'برای صعود، هم باید در ناحیهٔ سبز باشی و هم حداقل ' + faNum(data.promotion_min_weekly_xp || 0) + ' امتیازِ هفتگی بگیری.';
  card.append(el('div', { class: 'dcp-lg-foot' }, foot));
  card.append(howto());
  return card;
}

let overlayEl = null;
function closeOverlay() {
  if (overlayEl) { overlayEl.remove(); overlayEl = null; }
  document.removeEventListener('keydown', onKey);
}
function onKey(e) { if (e.key === 'Escape') closeOverlay(); }

/** Fetch /league and show the overlay. Safe to call from anywhere. */
export async function openLeagueOverlay() {
  const data = await api.league().catch(() => null);
  if (!data) return;
  closeOverlay();
  const card = buildCard(data, closeOverlay);
  overlayEl = el('div', {
    class: 'dcp-modal-overlay dcp-lg-overlay',
    onclick: (e) => { if (e.target === overlayEl) closeOverlay(); },
  }, [card]);
  document.body.appendChild(overlayEl);
  document.addEventListener('keydown', onKey);
}

/**
 * The finalized-outcome announcement — the only "reward" of this phase, so it must
 * never be silent. Shown once when /league carries a pending_outcome, then cleared
 * server-side. `data` is a /league response (may be null).
 */
export async function maybeAnnounceOutcome(data) {
  const p = data && data.pending_outcome;
  if (!p) return;
  const nt = p.new_tier || {};
  const kind = p.outcome; // promoted | stayed | demoted
  const face = kind === 'promoted' ? '🎉' : kind === 'demoted' ? '💪' : '🔥';
  const title = kind === 'promoted' ? 'صعود کردی!' : kind === 'demoted' ? 'این هفته سقوط کردی' : 'دوباره وقتشه!';
  const line = kind === 'promoted'
    ? 'به لیگ ' + nt.name_fa + ' رفتی. رقابتِ این هفته سخت‌تر و شیرین‌تر است.'
    : kind === 'demoted'
      ? 'به لیگ ' + nt.name_fa + ' برگشتی. این هفته دوباره بالا بیا.'
      : 'این هفته امتیاز کافی برای صعود از لیگ ' + nt.name_fa + ' نیاوردی. هفته‌ی تازه از صفر شروع شده — این‌بار نفر اولِ گروهت شو.';

  const done = () => { closeOverlay(); api.leagueOutcomeSeen().catch(() => {}); };
  const okBtn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'دیدم');
  okBtn.addEventListener('click', done);

  const children = [
    el('div', { class: 'dcp-lg-announce-face', 'aria-hidden': 'true' }, face),
    tierBadge(nt.tier_order || 1, { size: 'lg' }),
    el('h3', {}, title),
    el('p', {}, line),
    el('p', { class: 'dcp-lg-announce-rank' }, 'رتبهٔ هفتهٔ گذشته: ' + faNum(p.final_rank || 0)),
  ];

  // The one outcome with room to pull the user back in: dangle the same
  // weekly top-of-group prize the win banner (dashboard.js premiumGrantBanner)
  // announces, plus a taste of what it unlocks. prize_days comes from /league
  // (league_config, founder-tunable) — never hardcoded, so this can't promise
  // a length the backend has since changed.
  if (kind === 'stayed' && data.prize_days > 0) {
    children.push(el('div', { class: 'dcp-lg-stay-teaser' }, [
      el('p', { class: 'dcp-lg-stay-line' },
        'نفر اولِ گروهت شو، ' + faNum(data.prize_days) + ' روز پرمیوم مهمونِ دنت‌کست باش:'),
      el('ul', { class: 'dcp-prize-list' }, PREMIUM_FEATURES.slice(0, 3).map((f) =>
        el('li', {}, [el('b', {}, f.title + ': '), f.hint]))),
    ]));
  }

  children.push(okBtn);
  const card = el('div', { class: 'dcp-lg-card dcp-lg-announce', role: 'dialog', 'aria-modal': 'true' }, children);

  closeOverlay();
  overlayEl = el('div', { class: 'dcp-modal-overlay dcp-lg-overlay', onclick: (e) => { if (e.target === overlayEl) done(); } }, [card]);
  document.body.appendChild(overlayEl);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') done(); });
}
