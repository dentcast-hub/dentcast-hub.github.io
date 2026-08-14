// Homepage "از کجا شروع کنم؟" — starter bundles as their own rail, right
// after "تازه‌های دنت‌کست" (see index.html, #dcHomeBundles / #dcdHomeBundles,
// and .dentcast/bundles-handoff.md §4 for the design). Same two-slot pattern
// as home-features.js: one per shell, only the visible one is ever unhidden.
//
// The card list is hand-maintained here (id, glyph, title, step count) rather
// than fetched from GET /pathways, for the same reason home-features.js's
// CARDS array is hardcoded: that endpoint is requirePremium-gated, so a
// signed-out or free visitor — most of this page's audience — could never see
// it. Keep this list in step with the bundle entries in plus/pathways.json,
// same convention as home-features.js's CARDS staying in step with
// PREMIUM_FEATURES. `glyph` is a symbol id from the shared icon sprite
// (assets/icons/icons.svg — the single source of truth for every icon on the
// site; see assets/icons/README.md), never a raw emoji.
import { el, faNum, icon } from './util.js';
import { currentUser, api } from './api.js';
import { pricingHref, premiumCta } from './premium-cta.js';
import { openSheet, gateCard } from './sheet.js';

const BUNDLES = [
  { id: 'bundle-laminate', glyph: 'icon-tooth', title: 'لمینیت: شروع کن', steps: 6 },
  { id: 'bundle-bonding', glyph: 'icon-droplet', title: 'باندینگ و ادهزیو: شروع کن', steps: 5 },
  { id: 'bundle-ceramic-select', glyph: 'icon-ceramic', title: 'انتخاب سرامیک: شروع کن', steps: 6 },
  { id: 'bundle-ceramic-cement', glyph: 'icon-flask', title: 'آماده‌سازی سطح و سمان سرامیک: شروع کن', steps: 7 },
  { id: 'bundle-post-core', glyph: 'icon-post', title: 'پست و کور: شروع کن', steps: 7 },
  { id: 'bundle-implant-parts', glyph: 'icon-implant', title: 'اجزای پروتز ایمپلنت: شروع کن', steps: 7 },
  { id: 'bundle-implant-surgery', glyph: 'icon-scalpel', title: 'تصمیم‌های جراحی ایمپلنت: شروع کن', steps: 7 },
  { id: 'bundle-occlusion-rehab', glyph: 'icon-occlusion', title: 'اکلوژن در بازسازی: شروع کن', steps: 7 },
  { id: 'bundle-biomimetic', glyph: 'icon-sprout', title: 'بیومیمتیک: شروع کن', steps: 6 },
  { id: 'bundle-crown-prep', glyph: 'icon-tooth-restoration', title: 'تراش و قالب‌گیری: شروع کن', steps: 6 },
];

const SLOT_IDS = ['dcHomeBundles', 'dcdHomeBundles'];

function bundleHref(id) { return '/plus/pathway.html?id=' + encodeURIComponent(id); }

function bundleRailCard(b) {
  const card = el('a', { class: 'dcb-railcard', href: bundleHref(b.id) }, [
    el('span', { class: 'dcb-railcard-glyph' }, icon(b.glyph)),
    el('p', { class: 'dcb-railcard-title' }, b.title),
    el('div', { class: 'dcb-railcard-foot' }, [
      el('span', { class: 'dcb-railcard-meta' }, faNum(b.steps) + ' قدم'),
    ]),
  ]);
  card.dataset.dcbBundle = b.id;
  return card;
}

function section(isPremium) {
  const more = isPremium
    ? el('a', { class: 'dcb-band-more', href: '/plus/pathways.html' }, 'همه‌ی باندل‌ها ›')
    : el('a', { class: 'dcb-band-more', href: pricingHref('home-bundles') }, 'پریمیوم چیست؟ ›');

  const rail = el('div', { class: 'dcb-railwrap' }, BUNDLES.map(bundleRailCard));

  // The homepage's tab-swipe state machine lives on #mobile-body
  // (touchstart records the start point, touchend decides and switches
  // panels). index.html excludes gestures that start inside
  // '.dc-rail, .dcb-railwrap' — but that exclusion ships in the HTML, and a
  // returning phone can hold a cached index.html from before this rail
  // existed, where a flick on it "swipes the whole page" (founder report,
  // 2026-08-09). So the rail defends its own gestures too: stop every touch
  // phase from bubbling to #mobile-body. All three phases, not just
  // touchstart — a stopped touchstart with leaked touchmove/touchend would
  // feed the panel handler a STALE start point from some earlier gesture and
  // make it fire on garbage deltas. Passive: nothing here prevents native
  // scrolling; it only keeps the page's own listeners out of it.
  ['touchstart', 'touchmove', 'touchend'].forEach((t) => {
    rail.addEventListener(t, (e) => e.stopPropagation(), { passive: true });
  });

  return el('div', { class: 'dcb-band-inner' }, [
    el('div', { class: 'dcb-band-row' }, [
      el('h2', { class: 'dcb-band-title' }, [
        icon('icon-lightning'),
        ' از کجا شروع کنم؟',
        el('span', { class: 'dcb-band-count' }, faNum(BUNDLES.length) + ' باندل'),
      ]),
      more,
    ]),
    el('p', { class: 'dcb-band-hint' }, 'هسته‌ی هر موضوع در چند قدم — بدون نکته‌های حاشیه‌ای.'),
    rail,
  ]);
}

/** Write one bundle card's live meta/tag into every rendered copy (both shells). */
function paint(id, metaText, tagText) {
  document.querySelectorAll('[data-dcb-bundle="' + id + '"]').forEach((card) => {
    const foot = card.querySelector('.dcb-railcard-foot');
    if (!foot) return;
    const meta = foot.querySelector('.dcb-railcard-meta');
    if (meta) meta.textContent = metaText;
    if (tagText) {
      let tag = foot.querySelector('.dcb-railcard-tag');
      if (!tag) { tag = el('span', { class: 'dcb-railcard-tag' }); foot.appendChild(tag); }
      tag.textContent = tagText;
    }
  });
}

/** Live progress for a premium visitor — one request, fired AFTER the section
 * is on screen and never awaited, same "never block the homepage on a count"
 * rule as home-features.js's fillLive. Left at the static step count on
 * failure. */
function fillLive() {
  api.pathways()
    .then((d) => {
      const byId = new Map(((d && d.pathways) || []).map((p) => [p.id, p]));
      BUNDLES.forEach((b) => {
        const p = byId.get(b.id);
        if (!p) return;
        const metaText = faNum(p.completed_steps) + ' از ' + faNum(p.total_steps) + ' قدم';
        const tagText = p.is_complete ? 'تکمیل شد' : (p.enrolled || p.completed_steps > 0) ? 'ادامه' : null;
        paint(b.id, metaText, tagText);
      });
    })
    .catch(() => { /* leave the static step counts */ });
}

/* ---- gate on tap, for a free/guest visitor -------------------------------
   The bundle's own destination page (pathway-page.js) already gates for
   real; this is a lighter-weight sheet so the homepage doesn't cost a
   visitor a full navigate-then-see-a-gate round trip. Delegated (not bound
   per-card) so it keeps working across re-renders and both shells, same
   reasoning as installLibraryGate in library-gate.js. */

function isBundleLink(a) {
  if (!a || !a.getAttribute) return false;
  const href = a.getAttribute('href');
  if (!href) return false;
  try {
    const url = new URL(href, window.location.origin);
    if (url.pathname !== '/plus/pathway.html') return false;
    return (url.searchParams.get('id') || '').startsWith('bundle-');
  } catch (_) { return false; }
}

function openGate() {
  openSheet(gateCard({
    title: 'باندل‌های شروع، ویژه‌ی دنت‌کست پریمیوم است',
    sub: 'هر باندل، هسته‌ی یک موضوع در چند قدمِ مرتب — بدون نکته‌های حاشیه‌ای. با پریمیوم به هر ۱۰ باندل و مسیرهای کامل می‌رسید.',
    cta: premiumCta('gate-home-bundles'),
  }));
}

function installTapGate() {
  if (window.__dcHomeBundleGate) return;
  window.__dcHomeBundleGate = true;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let ctrl/middle-click through
    const a = e.target.closest && e.target.closest('a[href]');
    if (!isBundleLink(a)) return;
    e.preventDefault();
    const dest = a.href;
    currentUser()
      .then((user) => {
        if (user && user.tier === 'premium') { window.location.href = dest; return; }
        openGate();
      })
      .catch(() => { window.location.href = dest; }); // fail open — see library-gate.js
  }, true);
}

export async function initHomeBundles() {
  const slots = SLOT_IDS.map((id) => document.getElementById(id)).filter(Boolean);
  if (!slots.length) return;
  installTapGate();
  try {
    const me = await currentUser();
    const isPremium = !!(me && me.tier === 'premium');
    slots.forEach((slot) => {
      slot.replaceChildren(section(isPremium));
      slot.hidden = false;
    });
    if (isPremium) fillLive();
  } catch (_) {
    // Progressive enhancement: a homepage that cannot reach the API keeps the
    // slot empty rather than showing a section of dead cards.
    slots.forEach((slot) => { slot.hidden = true; });
  }
}
