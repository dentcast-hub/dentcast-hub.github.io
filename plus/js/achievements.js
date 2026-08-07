import { el, faNum } from './util.js';
import { api } from './api.js';
import { openSheet, closeSheet } from './sheet.js';

/**
 * The profile's «افتخارات» section: two league medals and the badge wall.
 *
 * This module draws; it decides nothing. Which badges exist, what they say, in
 * what order they appear, and whether a mystery is still a secret are all
 * settled by GET /achievements — so a second surface that ever renders this
 * data shows the same wall, and a badge's copy is never half-here-half-there.
 *
 * Two rules from the catalog are worth restating because they are visual and
 * this file is where they become real:
 *
 *   · A level is a RING COLOUR, never a word. The wall never writes «طلا»;
 *     only the medal row does, and there it never stands alone («طلای
 *     کامپوزیت»). Two metal scales share this section — the league's seven
 *     dental materials and the badges' bronze/silver/gold — and the word is
 *     what would collide, so the word stays on one side of the line.
 *
 *   · Dark and lit differ by a class, not by an asset. Every badge is one
 *     24×24 monoline icon drawn from ICONS below; unearned is the same icon at
 *     low opacity behind a dashed ring. Twenty badges, zero image files, and no
 *     way for the two states to drift apart visually.
 */

/* Monoline, 24×24, stroked with currentColor. Keyed by the catalog's `icon`. */
const ICONS = {
  flame: '<path d="M12 3c3 4 5 5.6 5 9a5 5 0 0 1-10 0c0-2 .9-3.6 2.4-5 .3 1.3.9 2.1 1.7 2.5C11.4 7.2 11 5.2 12 3z"/>',
  phoenix: '<path d="M12 21V8"/><path d="M12 8C9.6 9.2 6.4 11.4 4 16c3.6 0 6-1.2 8-3.4"/><path d="M12 8c2.4 1.2 5.6 3.4 8 8-3.6 0-6-1.2-8-3.4"/><path d="M12 8V4l2.2 1.4"/>',
  shield: '<path d="M12 3l7.5 3v5.4c0 4.9-3.1 8.2-7.5 10.1C7.6 19.6 4.5 16.3 4.5 11.4V6z"/>',
  head: '<path d="M4 14v-2.2a8 8 0 0 1 16 0V14"/><rect x="2.5" y="13.5" width="4" height="7" rx="2"/><rect x="17.5" y="13.5" width="4" height="7" rx="2"/>',
  book: '<path d="M12 6.5C10 5 7 4.4 4 5v13c3-.6 6 0 8 1.5"/><path d="M12 6.5C14 5 17 4.4 20 5v13c-3-.6-6 0-8 1.5"/><path d="M12 6.5v13"/>',
  storm: '<path d="M7.5 14.5a3.7 3.7 0 0 1 .6-7.4 5 5 0 0 1 9.3 1.5 3.3 3.3 0 0 1 .1 5.9"/><path d="M13 13l-2.6 4.2H13L11 21.5"/>',
  quill: '<path d="M4 20l1.4-4.2L16.3 4.9l2.8 2.8L8.2 18.6z"/><path d="M14.2 7l2.8 2.8"/><path d="M4 20l3-1"/>',
  note: '<path d="M4.5 6.5h11"/><path d="M4.5 10.5h8"/><path d="M4.5 14.5h5"/><path d="M13.6 19.5H11v-2.6l5.6-5.6 2.6 2.6z"/>',
  compass: '<circle cx="12" cy="12" r="8.6"/><path d="M15.4 8.6l-1.9 4.9-4.9 1.9 1.9-4.9z"/>',
  flag: '<path d="M6.5 21V3.6"/><path d="M6.5 4.7l10 2.9-10 2.9z"/>',
  hourglass: '<path d="M7 3h10"/><path d="M7 21h10"/><path d="M8 3c0 5 4 6 4 9s-4 4-4 9"/><path d="M16 3c0 5-4 6-4 9s4 4 4 9"/>',
  eagle: '<path d="M2.5 13.4c3.2 0 5.4-1.1 7-3.6L12 6.2l2.5 3.6c1.6 2.5 3.8 3.6 7 3.6"/><path d="M12 6.2V17"/><path d="M9.6 17h4.8"/>',
  moon: '<path d="M20.2 14.3A8.6 8.6 0 1 1 9.9 3.9a6.9 6.9 0 0 0 10.3 10.4z"/>',
  dawn: '<path d="M3.5 19h17"/><path d="M12 4v3"/><path d="M5.9 6.9l2.1 2.1"/><path d="M18.1 6.9L16 9"/><path d="M7.2 19a4.8 4.8 0 0 1 9.6 0"/>',
  cal: '<rect x="3.6" y="6" width="16.8" height="14.4" rx="2.4"/><path d="M3.6 10.4h16.8"/><path d="M8.2 3.5v4"/><path d="M15.8 3.5v4"/>',
  anchor: '<circle cx="12" cy="5.3" r="2.3"/><path d="M12 7.6V21"/><path d="M8 11.4h8"/><path d="M4.6 14.6A7.6 7.6 0 0 0 12 21a7.6 7.6 0 0 0 7.4-6.4"/>',
  route: '<circle cx="6.4" cy="18.4" r="2.3"/><circle cx="17.6" cy="5.6" r="2.3"/><path d="M6.4 16.1c0-5.4 11.2-5.2 11.2-8.2"/>',
  recall: '<path d="M20 12a8 8 0 1 1-2.9-6.2"/><path d="M20.4 4.2v4.2h-4.2"/><path d="M12 8.4v4l2.6 1.6"/>',
  chest: '<path d="M3.4 10.2h17.2v9.4H3.4z"/><path d="M3.4 10.2L5.6 6h12.8l2.2 4.2"/><path d="M12 10.2v9.4"/><path d="M9.6 14h4.8"/>',
  // A lantern with a flame in it — «چراغ‌دار». Five strokes rather than one
  // solid shape, because at the 25px the wall actually draws these a filled
  // lantern collapses into a blob; the ring, cap, two waisted sides and base
  // are what still read as a lantern that small (checked at size, not at 100%).
  // The flame is deliberately the SAME curve as the `flame` badge above, scaled
  // down: the two mean related things — one keeps the fire, the other carries it
  // to somebody else — and a reader holding both should be able to see that.
  lamp: '<path d="M10.5 4.2v-.7a1.5 1.5 0 0 1 3 0v.7"/><path d="M6.8 7.2 8.9 4.2h6.2l2.1 3"/><path d="M8.6 7.2c-.9 3.6-.9 6.6 0 9.8"/><path d="M15.4 7.2c.9 3.6.9 6.6 0 9.8"/><path d="M6.8 20 8.9 17h6.2l2.1 3z"/><path d="M12 8.8c2 2.6 3 3.7 3 5.6a3 3 0 0 1-6 0c0-1.2.55-2.15 1.45-3 .18.78.54 1.26 1.02 1.5-.4-.86-.6-2.2.53-4.1z"/>',
  star: '<path d="M12 3.4l2.7 5.5 6 .9-4.35 4.2 1.05 6-5.4-2.85L6.6 20l1.05-6L3.3 9.8l6-.9z"/>',
};

const METAL_PIP = { bronze: 'b', silver: 's', gold: 'g' };

function icon(name, cls) {
  const svg = el('span', { class: cls, 'aria-hidden': 'true' });
  svg.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"`
    + ` stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.star}</svg>`;
  return svg;
}

/* ---------------------------------------------------------------- medals -- */

function medalTile(m) {
  const shield = el('span', {
    class: 'dcp-md-shield ' + (m.earned ? 'dcp-tier-t' + m.tier.tier_order : 'is-off')
      + (m.earned && m.tier.tier_order >= 7 ? ' is-dark' : ''),
  }, [icon('star', 'dcp-md-ico')]);

  return el('button', {
    class: 'dcp-md' + (m.earned ? ' is-earned' : ''),
    type: 'button',
    'aria-label': m.name_fa,
    onclick: () => openSheet(medalCard(m)),
  }, [
    shield,
    el('span', { class: 'dcp-md-name' + (m.earned ? '' : ' is-off') }, m.name_fa),
    el('span', { class: 'dcp-md-hint' }, m.earned ? 'بالاترین لیگی که در آن این رتبه را گرفته‌ای.' : m.lead_fa),
  ]);
}

function medalCard(m) {
  return el('div', { class: 'dcp-sheet-card' }, [
    el('div', { class: 'dcp-ach-sheet-hd' }, [
      el('span', {
        class: 'dcp-md-shield ' + (m.earned ? 'dcp-tier-t' + m.tier.tier_order : 'is-off')
          + (m.earned && m.tier.tier_order >= 7 ? ' is-dark' : ''),
      }, [icon('star', 'dcp-md-ico')]),
      el('div', {}, [
        el('h2', { class: 'dcp-sheet-title' }, m.name_fa),
        el('span', { class: 'dcp-ach-grp' }, 'لیگ'),
      ]),
    ]),
    el('p', { class: 'dcp-ach-lead' + (m.earned ? '' : ' is-locked') }, m.lead_fa),
    el('p', { class: 'dcp-ach-detail' }, m.detail_fa),
    closeRow(),
  ]);
}

/* --------------------------------------------------------------- badges -- */

function disc(b, size) {
  if (b.hidden) return el('span', { class: `dcp-bg-disc is-mystery ${size}` }, '؟');
  return el('span', {
    class: `dcp-bg-disc ${size} ` + (b.earned ? 'is-on is-' + b.metal : 'is-off'),
  }, [icon(b.icon, 'dcp-bg-ico')]);
}

function badgeTile(b) {
  const kids = [
    disc(b, 'is-sm'),
    el('span', { class: 'dcp-bg-name' + (b.earned ? '' : ' is-off') }, b.hidden ? '؟' : b.title_fa),
  ];
  // A bar only where there is something to show: at zero it would be a row of
  // empty troughs, which reads as failure rather than as a start line.
  if (!b.earned && !b.hidden && b.value > 0) {
    kids.push(el('span', { class: 'dcp-bg-bar' }, [
      el('i', { style: `width:${Math.round(b.ratio * 100)}%` }),
    ]));
  } else {
    kids.push(el('span', { class: 'dcp-bg-bar-spacer' }));
  }
  return el('button', {
    class: 'dcp-bg-tile', type: 'button',
    'aria-label': b.hidden ? 'نشانِ ناشناخته' : b.title_fa,
    onclick: () => openSheet(badgeCard(b)),
  }, kids);
}

function closeRow() {
  return el('button', {
    class: 'dcp-btn dcp-btn-ghost dcp-ach-close', type: 'button', onclick: () => closeSheet(),
  }, 'بستن');
}

function levelRow(lv, i, badge) {
  const isNext = !lv.done && badge.level === i - 1;
  return el('li', {
    class: 'dcp-ach-lv' + (lv.done ? ' is-done' : ' is-pending') + (isNext ? ' is-next' : ''),
  }, [
    el('span', { class: 'dcp-ach-pip is-' + METAL_PIP[lv.tier] }),
    el('span', { class: 'dcp-ach-lv-txt' }, lv.unlock_fa),
    lv.done
      ? el('span', { class: 'dcp-ach-lv-done' }, '✓')
      : el('span', { class: 'dcp-ach-lv-need' },
        faNum(lv.threshold) + (badge.unit_fa ? ' ' + badge.unit_fa : '')),
  ]);
}

function progressBlock(b) {
  // At the top level the bar is replaced by a statement. A full bar says
  // "nothing left"; naming the level says "you finished this one".
  if (b.earned && b.target === null) {
    return el('div', { class: 'dcp-ach-prog' }, [
      el('div', { class: 'dcp-ach-prog-lbl' }, [el('span', {}, 'بالاترین سطح')]),
    ]);
  }
  if (b.target === null) return null;
  return el('div', { class: 'dcp-ach-prog' }, [
    el('div', { class: 'dcp-ach-prog-lbl' }, [
      el('span', {}, b.earned ? 'تا سطحِ بعد' : 'تا روشن‌شدن'),
      el('span', {}, faNum(b.value) + ' از ' + faNum(b.target)),
    ]),
    el('div', { class: 'dcp-ach-prog-bar' }, [
      el('i', { style: `width:${Math.max(3, Math.round(b.ratio * 100))}%` }),
    ]),
  ]);
}

function badgeCard(b) {
  if (b.hidden) {
    return el('div', { class: 'dcp-sheet-card' }, [
      el('div', { class: 'dcp-ach-sheet-hd' }, [
        disc(b, 'is-md'),
        el('div', {}, [el('h2', { class: 'dcp-sheet-title' }, '؟')]),
      ]),
      el('p', { class: 'dcp-ach-lead is-locked' },
        'این نشان تا وقتی کسبش نکنی پنهان است. پیدا کردنش خودِ جایزه است.'),
      closeRow(),
    ]);
  }
  return el('div', { class: 'dcp-sheet-card' }, [
    el('div', { class: 'dcp-ach-sheet-hd' }, [
      disc(b, 'is-md'),
      el('div', {}, [
        el('h2', { class: 'dcp-sheet-title' }, b.title_fa),
        el('span', { class: 'dcp-ach-grp' }, b.group_fa + (b.premium ? ' · پریمیوم' : '')),
      ]),
    ]),
    el('p', { class: 'dcp-ach-lead' + (b.earned ? '' : ' is-locked') }, b.lead_fa),
    el('p', { class: 'dcp-ach-detail' }, b.detail_fa),
    b.levels
      ? el('ul', { class: 'dcp-ach-lv-list' }, b.levels.map((lv, i) => levelRow(lv, i, b)))
      : null,
    progressBlock(b),
    closeRow(),
  ].filter(Boolean));
}

/* -------------------------------------------------------------- section -- */

function tally(s) {
  const kids = [el('span', {}, [el('b', {}, faNum(s.earned)), ' از ' + faNum(s.total) + ' نشان'])];
  for (const [metal, n] of [['gold', s.gold], ['silver', s.silver], ['bronze', s.bronze]]) {
    if (!n) continue;
    kids.push(el('span', { class: 'dcp-ach-dot' }));
    kids.push(el('span', { class: 'dcp-ach-metal' }, [
      el('span', { class: 'dcp-ach-pip is-' + METAL_PIP[metal] }), faNum(n),
    ]));
  }
  return el('div', { class: 'dcp-ach-tally' }, kids);
}

/**
 * The section body. Returns null when the catalog could not be loaded at all,
 * so the caller can leave the section out entirely rather than render an empty
 * card — a heading over nothing is worse than no heading.
 */
export function achievementsBody(data) {
  if (!data || !Array.isArray(data.badges) || !data.badges.length) return null;
  return el('div', {}, [
    tally(data.summary),
    el('div', { class: 'dcp-md-row' }, (data.medals || []).map(medalTile)),
    el('div', { class: 'dcp-bg-wall' }, data.badges.map(badgeTile)),
  ]);
}

/* ---------------------------------------------------------- celebration -- */

/**
 * «نشانِ تازه» — the card that finally says a badge lit up.
 *
 * Where this may open is the whole design, and it is a WHITELIST rather than
 * "anywhere except an article": on the desktop shell an article is not a page at
 * all (index.html fetches it and injects it into column C), so a reader mid
 * paragraph is, by URL, on the homepage — and a blocklist would have covered
 * their screen at exactly the wrong moment. A whitelist is also safe against the
 * next page somebody adds, which stays silent by default.
 *
 * The two callers are the dashboard and the profile: surfaces the reader chose
 * to open, where an interruption is not one. Everywhere else, the dot on the
 * account icon is the entire announcement — it covers nothing, so it is the only
 * thing safe to show while somebody is reading.
 */
function celebrationDisc(item) {
  if (!item.icon) {
    // A league medal: no monoline icon in the catalog, so it wears the shield
    // the medal row already uses rather than borrowing a badge's glyph.
    return el('span', { class: 'dcp-md-shield dcp-tier-t4' }, [icon('star', 'dcp-md-ico')]);
  }
  return el('span', {
    class: 'dcp-bg-disc is-md is-on is-' + (item.metal || 'plain'),
  }, [icon(item.icon, 'dcp-bg-ico')]);
}

function celebrationCard(items, onDone) {
  let at = 0;
  const card = el('div', { class: 'dcp-sheet-card dcp-cel', role: 'dialog', 'aria-modal': 'true' });

  const paint = () => {
    const item = items[at];
    const more = items.length > 1;
    card.replaceChildren(
      el('div', { class: 'dcp-cel-hd' }, [
        celebrationDisc(item),
        el('div', {}, [
          el('span', { class: 'dcp-cel-eyebrow' }, 'نشانِ تازه'),
          el('h2', { class: 'dcp-sheet-title' }, item.title_fa),
        ]),
      ]),
      // The reason, in the catalog's own words for the level actually reached.
      // Never assembled here: a badge's copy is editorial and lives in
      // badges.json, and this card must not be the one surface that paraphrases.
      el('p', { class: 'dcp-cel-why' }, item.body_fa),
      // Several at once is common — a first session can light three — and three
      // overlays in a row is a punishment, not a reward. One card, paged.
      more ? el('div', { class: 'dcp-cel-count' }, faNum(at + 1) + ' از ' + faNum(items.length)) : null,
      el('div', { class: 'dcp-cel-actions' }, [
        at < items.length - 1
          ? el('button', {
            class: 'dcp-btn dcp-btn-primary', type: 'button',
            onclick: () => { at += 1; paint(); },
          }, 'بعدی')
          : el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button', onclick: onDone }, 'دیدم'),
        el('a', { class: 'dcp-btn dcp-btn-ghost', href: '/plus/profile.html' }, 'دیوارِ افتخارات'),
      ]),
    );
  };
  paint();
  return card;
}

/**
 * Show any queued badge announcements, then acknowledge them.
 *
 * Acknowledged when the card is DISMISSED, not when it is fetched: a reader who
 * closed a tab mid-card gets it again, which is the right way round for the one
 * moment this feature exists to deliver. `pending` comes from /me, so a surface
 * that already has the user costs nothing to gate on.
 */
export async function maybeCelebrate(me) {
  if (!me || !me.pending_achievements) return;
  let items = [];
  try {
    const res = await api.achievementsPending();
    items = (res && res.items) || [];
  } catch (_) { return; }
  if (!items.length) return;

  const done = () => {
    closeSheet();
    api.achievementsSeen()
      .then(() => { document.dispatchEvent(new CustomEvent(ACHIEVEMENTS_SEEN_EVENT)); })
      .catch(() => { /* it will simply be offered again next time */ });
  };
  openSheet(celebrationCard(items, done));
}

/** Fired once the celebration has been acknowledged, so the dot can go out. */
export const ACHIEVEMENTS_SEEN_EVENT = 'dcp:achievements-seen';
