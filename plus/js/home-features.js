// The premium features as their OWN homepage section, under the Spot card.
//
// They used to live inside the personal card (#dcPlusHomeCard) — one locked row
// for «قطب‌نمای مطالعه» and nothing at all for the other five. That position was
// wrong in both directions at once: inside a card whose whole job is the
// reader's own state, a lock is easy to miss AND it crowds the thing it sits
// next to. Five more of them would have made the card mostly advertisement,
// which is the exact failure the dashboard already recorded and fixed
// (dashboard.js, founder feedback 2026-07-31).
//
// So the features left the card. What is left in the card is only the reader's
// own material; what is here is a proper section in the homepage's OWN card
// grammar — a section label with an accent bar, then one list card per feature
// with an icon and a line of what it does. #card-library is the precedent: a
// premium thing already living as its own homepage card, with its own lock
// badge, rather than as a line inside somebody else's card.
//
// Three rules keep it from reading as a billboard:
//   1. ONE buy link for the whole section, in the section header — not one per
//      card. Six buttons is what makes a page look like an ad.
//   2. For a subscriber the same six cards go LIVE (the pathway step, today's
//      due count, the collection count, the highlight total). The section is
//      then a real navigation block, which is what makes its presence
//      defensible to the free reader sitting next to it.
//   3. It is placed BELOW the ad card — deliberately not above the fold, and
//      never between the reader and the content they came for.
//
// Placement is by static anchor, not by measurement: index.html carries an
// empty slot right after each Pulse card, and spot.js inserts its own card at
// exactly that boundary (`pulse.nextSibling`), so the ad lands between the two
// with no coordination between the modules. When there is no ad — a premium
// visitor, or the slot switched off — the section simply moves up under the
// Pulse and nothing else changes.
import { el, faNum } from './util.js';
import { currentUser, api } from './api.js';
import { PREMIUM_FEATURES } from './config.js';
import { pricingHref } from './premium-cta.js';

// Crafted inline icons, one per feature (same reasoning as home-card.js's promo
// chips: emoji would sit at a different weight than the site's own stroke icons).
const IC = {
  pathway: '<path d="M4 18h5l3-6 3 9 2-3h3"/><circle cx="4" cy="18" r="1.2"/>',
  assistant: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/><circle cx="12" cy="12" r="3"/>',
  cards: '<rect x="3" y="6" width="13" height="13" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v11"/>',
  collections: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-4 1 2-5z"/>',
  library: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"/>',
};

// The NAMES come from PREMIUM_FEATURES — the canonical list the dashboard, the
// prize banner and the price page all read, kept in step with the API's copy by
// a test. Addressed by INDEX, the same way dashboard.js addresses it, which is
// why a new feature is only ever appended to the end of that array.
//
// The SENTENCES are written here rather than reused from that list, for the same
// reason premium-benefits.js writes its own: those hints are in-product tooltips
// in the dashboard's casual voice («بریز», «بخون»), and this section is read by
// people who do not have the feature yet. Same features, register to match.
const F = PREMIUM_FEATURES;
const CARDS = [
  { f: F[1], ico: IC.pathway,     href: '/plus/pathways.html',        sub: 'از پیش‌نیاز تا پیشرفته، به ترتیبِ درست' },
  { f: F[4], ico: IC.assistant,   href: '/plus/assistant.html',       sub: 'شرح کیس را بنویسید، به مرتبط‌ترین مطلب برسید' },
  { f: F[0], ico: IC.cards,       href: '/plus/cards.html',           sub: 'هایلایت‌ها درست پیش از فراموش‌شدن برمی‌گردند' },
  { f: F[2], ico: IC.collections, href: '/plus/collections.html',     sub: 'هایلایت‌ها و مقاله‌ها در پوشه‌های خودتان' },
  { f: F[3], ico: IC.compass,     href: '/plus/reading-compass.html', sub: 'چقدر از هر پیلار را خوانده‌اید، کجا جا مانده' },
  { f: F[5], ico: IC.library,     href: '/plus/highlights.html',      sub: 'همه‌ی هایلایت‌هایتان یکجا، با یادداشت و جستجو' },
];

// The two slots index.html carries — one per homepage layout. Both are filled:
// only the displayed one is visible (the mobile shell is display:none under
// body.dc-desktop-ui), which is the same thing spot.js does with its own card.
const SLOT_IDS = ['dcPlusFeatures', 'dcdPlusFeatures'];

function icon(path) {
  const s = el('span', { class: 'dcp-hf-ico', 'aria-hidden': 'true' });
  s.innerHTML = '<svg viewBox="0 0 24 24">' + path + '</svg>'; // static, trusted markup
  return s;
}

/**
 * The right-hand chip. For a free or signed-out reader it is the lock the rest
 * of the site uses; for a subscriber it is the feature's own live state, or a
 * plain «باز کردن» where there is no honest number to show.
 */
function stateChip(text, live) {
  return el('span', { class: 'dcp-hf-state' + (live ? ' is-live' : '') }, text);
}

function featureCard(c, isPremium) {
  const state = stateChip(isPremium ? 'باز کردن' : '🔒', isPremium);
  const card = el('a', { class: 'dc-list-card dcp-hf-card', href: c.href }, [
    icon(c.ico),
    el('div', { class: 'dc-list-card-main' }, [
      el('div', { class: 'dc-list-card-title' }, c.f.title),
      el('div', { class: 'dc-list-card-sub' }, c.sub),
    ]),
    state,
  ]);
  card.dataset.dcpFeature = c.f.title;
  return card;
}

function section(me) {
  const isPremium = !!me && me.tier === 'premium';
  // One buy link for the whole section — see rule 1 at the top. A subscriber is
  // never offered a purchase here; their header link is the dashboard instead.
  const more = isPremium
    ? el('a', { class: 'dcp-hf-more', href: '/plus/' }, 'پیشخوان ›')
    : el('a', { class: 'dcp-hf-more', href: pricingHref('home-features') }, 'پریمیوم چیست؟ ›');

  const wrap = el('div', { class: 'dcp-hf' }, [
    el('div', { class: 'dcp-hf-sec' }, [
      el('h2', { class: 'dcp-hf-label' }, 'دنت‌کست پریمیوم'),
      more,
    ]),
    ...CARDS.map((c) => featureCard(c, isPremium)),
  ]);
  return wrap;
}

/** Write one card's live state into every rendered copy of the section. */
function paint(title, text) {
  document.querySelectorAll('[data-dcp-feature="' + title + '"] .dcp-hf-state')
    .forEach((n) => { n.textContent = text; });
}

/**
 * Live values for a subscriber.
 *
 * The first two are FREE: /me already carries `active_pathway` and
 * `due_card_count`, and the card is rendered from the same answer. The other two
 * cost one request each and are therefore fired AFTER the section is on screen,
 * never awaited, and left at «باز کردن» if they fail — a homepage must not wait
 * on a count.
 *
 * «قطب‌نمای مطالعه» and «دستیار هوشمند» deliberately carry no number: the
 * compass payload has no single overall figure (its percentages are per-pillar,
 * so a bare «٪۲۴» here would be ambiguous), and the assistant has no state at
 * all — it is a wizard you start.
 */
function fillLive(me) {
  const p = me.active_pathway;
  if (p) {
    paint(F[1].title, p.is_complete
      ? 'کامل شد'
      : 'قدم ' + faNum(p.current_step) + ' از ' + faNum(p.total_steps));
  }
  if (me.due_card_count > 0) paint(F[0].title, faNum(me.due_card_count) + ' کارت');

  api.recentHighlights(1)
    .then((d) => { if (d && d.total) paint(F[5].title, faNum(d.total) + ' هایلایت'); })
    .catch(() => { /* leave «باز کردن» rather than guess */ });
  api.listCollections()
    .then((d) => {
      if (d && d.collections && d.collections.length) {
        paint(F[2].title, faNum(d.collections.length) + ' کالکشن');
      }
    })
    .catch(() => { /* leave «باز کردن» */ });
}

export async function initHomeFeatures() {
  const slots = SLOT_IDS.map((id) => document.getElementById(id)).filter(Boolean);
  if (!slots.length) return;
  try {
    const me = await currentUser();
    slots.forEach((slot) => {
      slot.replaceChildren(section(me));
      slot.hidden = false;
    });
    if (me && me.tier === 'premium') fillLive(me);
  } catch (_) {
    // Progressive enhancement: a homepage that cannot reach the API keeps the
    // slot empty rather than showing a section of dead cards.
    slots.forEach((slot) => { slot.hidden = true; });
  }
}
