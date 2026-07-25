// DentCast Spot — central, config-driven ad system. Loaded on every page by the
// loader hook in dc-nav.js (the ONLY hook; no page carries ad markup of its own).
//
// NAMING IS DELIBERATELY NEUTRAL ("spot", never "ad"): EasyList carries a
// generic element-hiding rule `##.dc-ad` (and blocks many ad-ish paths), so
// Opera's built-in blocker & co. hid the entire old dc-ad system. Never put
// "ad"/"ads" in this system's file names, URL paths, class names, ids, or
// data attributes — verify new names against EasyList before shipping.
//
// Single source of truth: /spot/spot-config.json. Turning the master switch or a
// slot off there leaves ZERO trace on the site — no DOM, no stylesheet, nothing.
//
// Visibility rule: ads render for anonymous visitors AND signed-in free (Plus)
// users. Only tier === 'premium' hides every ad ("بدون تبلیغات" is a premium
// perk). The tier check shares plus.js's cached /me request, but never blocks
// rendering more than TIER_TIMEOUT_MS — if the API is slow/unreachable the
// visitor is treated as free and a late "premium" answer removes the ads.
//
// Rotation: rotation.sequence cycles one step per page-view that shows an ad
// (localStorage counter). Entries: "premium", "sponsor" (weighted round-robin
// over enabled sponsors), or a specific sponsor id. Missing creative at a step
// falls back to the other kind; nothing available → nothing renders.
//
// Targeting: a creative may carry "slots": [...] (where it renders) and/or
// "audience": ["anon"|"plus"] (who sees it). No field = everyone, everywhere —
// so by default signed-out and signed-in visitors see the same campaign.
//
// The article card is inserted at a SECTION BOUNDARY (before the middle h2/h3)
// so it can never sit inside a sentence a workbench highlight spans, and it is
// user-select:none + hidden entirely in study mode (body.dcp-study) so the
// میز کار experience stays clean.

import { findProseRoot } from '/plus/js/config.js';

const CONFIG_URL = '/spot/spot-config.json';
const SPOT_V = new URL(import.meta.url).search; // carry ?v= from the loader onto the config fetch
const TIER_TIMEOUT_MS = 3000;
// localStorage keys keep their historical names — invisible to blockers, and
// renaming them would reset every visitor's rotation position.
const K_TICK = 'dcAds.tick'; // rotation step, advances once per ad-showing page view
const K_RR = 'dcAds.rr'; // sponsor round-robin cursor

function lsGet(key) {
  try { return parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch (_) { return 0; }
}
function lsSet(key, n) {
  try { localStorage.setItem(key, String(n)); } catch (_) { /* private mode */ }
}

function track(name, params) {
  const send = () => { if (window.gtag) window.gtag('event', name, params); };
  // GA is deferred until window load; queue the event for then if needed.
  if (window.gtag) send();
  else window.addEventListener('load', () => setTimeout(send, 0), { once: true });
}

// ── creative selection ───────────────────────────────────────────────────────

// Optional per-creative targeting. "slots": ["home", ...] limits WHERE a
// creative renders; "audience": ["anon"] / ["plus"] limits WHO sees it —
// "anon" = signed-out visitor, "plus" = signed-in non-premium user (premium
// users never see ads at all). A missing field = everywhere / everyone, so by
// default every visitor class sees the same campaign.
function allowedIn(creative, slotName, audience) {
  const slotOk = !Array.isArray(creative.slots) || creative.slots.includes(slotName);
  const audOk = !Array.isArray(creative.audience) || creative.audience.includes(audience);
  return slotOk && audOk;
}

function enabledSponsors(cfg, slotName, audience) {
  const list = (cfg.creatives && cfg.creatives.sponsors) || [];
  return list.filter((s) => s && s.enabled && s.url && allowedIn(s, slotName, audience));
}

function premiumCreative(cfg, slotName, audience) {
  const p = cfg.creatives && cfg.creatives.premium;
  return p && p.enabled !== false && p.url && allowedIn(p, slotName, audience) ? p : null;
}

function nextSponsor(cfg, slotName, audience) {
  const sponsors = enabledSponsors(cfg, slotName, audience);
  if (!sponsors.length) return null;
  const pool = [];
  sponsors.forEach((s) => {
    const w = Math.max(1, Math.floor(s.weight) || 1);
    for (let i = 0; i < w; i++) pool.push(s);
  });
  const cursor = lsGet(K_RR);
  lsSet(K_RR, cursor + 1);
  return pool[cursor % pool.length];
}

// One creative per page view: every slot on the page shows the same campaign,
// and the rotation counter advances once (tickOnce, after the first successful
// render). A step whose creative is missing or not allowed in this slot / for
// this audience falls back to the other kind; nothing eligible → nothing
// renders.
function pickCreative(cfg, slotName, audience) {
  const seq = (cfg.rotation && Array.isArray(cfg.rotation.sequence) && cfg.rotation.sequence.length)
    ? cfg.rotation.sequence
    : ['premium'];
  const step = seq[lsGet(K_TICK) % seq.length];
  if (step === 'premium') return premiumCreative(cfg, slotName, audience) || nextSponsor(cfg, slotName, audience);
  if (step === 'sponsor') return nextSponsor(cfg, slotName, audience) || premiumCreative(cfg, slotName, audience);
  // a specific sponsor id
  const named = enabledSponsors(cfg, slotName, audience).find((s) => s.id === step);
  return named || nextSponsor(cfg, slotName, audience) || premiumCreative(cfg, slotName, audience);
}

let ticked = false;
function tickOnce() {
  if (ticked) return;
  ticked = true;
  lsSet(K_TICK, lsGet(K_TICK) + 1);
}

// ── card styles ──────────────────────────────────────────────────────────────

// The CSS ships INLINE inside this module (a <style> tag, not a <link>): the
// dentcast.ir mirror sits behind Arvan object storage + CDN, which served the
// standalone spot.css in a way the browser refused to apply as a stylesheet
// (content-minified, wrong/nosniffed content-type) — cards rendered unstyled.
// One file, one request, nothing for a CDN or MIME guesser to break.
//
// Native look: same surfaces/typography vars as the site (dc-theme.css).
// Orange theme — same amber family (#F5A208) as the Deonet ad inside the
// homepage Pulse card: soft gradient tint, bold saturated border, dark body
// text, solid-amber CTA pill. Study mode (body.dcp-study) hides all cards.
const SPOT_CSS = `
.dc-spot { margin: 1.25rem 0; user-select: none; -webkit-user-select: none; }
body.dcp-study .dc-spot { display: none !important; }
.dc-spot-link {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  background: linear-gradient(135deg, rgba(245, 162, 8, 0.12), rgba(245, 162, 8, 0.04));
  border: 2px solid rgba(245, 162, 8, 0.65);
  border-radius: 16px;
  text-decoration: none;
  color: var(--txt, #0a1a33);
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.dc-spot-link:hover { border-color: #f5a208; box-shadow: 0 4px 14px rgba(245, 162, 8, 0.18); }
.dc-spot-link:active { transform: scale(0.99); }
.dc-spot-img { width: 44px; height: 44px; border-radius: 10px; object-fit: cover; flex: 0 0 auto; }
.dc-spot-body { flex: 1 1 auto; min-width: 0; }
.dc-spot-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  margin-bottom: 0.375rem;
  color: #b07d00;
  background: rgba(245, 162, 8, 0.16);
  letter-spacing: 0.02em;
}
[data-theme="dark"] .dc-spot-badge { color: #f5b63e; background: rgba(245, 162, 8, 0.14); }
.dc-spot-title { display: block; font-size: 0.88rem; font-weight: 800; line-height: 1.7; color: var(--txt, #0a1a33); }
.dc-spot-text { margin: 0.25rem 0 0; font-size: 0.78rem; line-height: 1.9; color: var(--txt, #0a1a33); opacity: 0.85; }
.dc-spot-cta {
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  white-space: nowrap;
  color: #fff;
  background: #f5a208;
  box-shadow: 0 2px 8px rgba(245, 162, 8, 0.35);
}
.dc-spot--article { margin: 1.5rem 0; }
.dc-spot--article .dc-spot-text, .dc-spot--article .dc-spot-title { margin-top: 0.25rem; }
.dc-spot--dashboard, .dc-spot--profile { margin: 1.125rem 0; }
.dc-spot--episodes { margin: 0.875rem 0 2.75rem; }
@media (min-width: 720px) { .dc-spot--episodes { margin: 1rem 0 4rem; } }
@media (max-width: 480px) {
  .dc-spot-link { flex-wrap: wrap; }
  .dc-spot-cta { margin-inline-start: auto; }
}
`;

// ── card DOM ─────────────────────────────────────────────────────────────────

let cssInjected = false;
function injectCss() {
  if (cssInjected) return;
  cssInjected = true;
  const style = document.createElement('style');
  style.textContent = SPOT_CSS;
  document.head.appendChild(style);
}

function isSponsor(creative) {
  return creative.id !== 'premium';
}

function buildCard(creative, slotName) {
  injectCss();
  const aside = document.createElement('aside');
  aside.className = 'dc-spot dc-spot--' + slotName + (isSponsor(creative) ? ' dc-spot--sponsor' : ' dc-spot--premium');
  aside.setAttribute('data-dc-spot', creative.id || '');

  const a = document.createElement('a');
  a.className = 'dc-spot-link';
  a.href = creative.url;
  const external = /^https?:\/\//.test(creative.url);
  if (external) a.target = '_blank';
  // rel="sponsored" is Google link-scheme compliance — it only applies to
  // crawlable http(s) links. mailto:/internal urls (house placeholders) get none.
  a.rel = external ? (isSponsor(creative) ? 'sponsored noopener' : 'noopener') : '';

  if (creative.image) {
    const img = document.createElement('img');
    img.className = 'dc-spot-img';
    img.src = creative.image;
    img.alt = '';
    img.loading = 'lazy';
    a.appendChild(img);
  }

  const body = document.createElement('div');
  body.className = 'dc-spot-body';
  const badge = document.createElement('span');
  badge.className = 'dc-spot-badge';
  badge.textContent = creative.badge || (isSponsor(creative) ? 'حمایت‌شده' : 'دنت‌کست پلاس');
  body.appendChild(badge);
  if (creative.title) {
    const t = document.createElement('strong');
    t.className = 'dc-spot-title';
    t.textContent = creative.title;
    body.appendChild(t);
  }
  if (creative.text) {
    const p = document.createElement('p');
    p.className = 'dc-spot-text';
    p.textContent = creative.text;
    body.appendChild(p);
  }
  a.appendChild(body);

  if (creative.cta) {
    const cta = document.createElement('span');
    cta.className = 'dc-spot-cta';
    cta.textContent = creative.cta;
    a.appendChild(cta);
  }

  a.addEventListener('click', () => {
    track('ad_click', { ad_slot: slotName, ad_creative: creative.id || 'unknown' });
  });
  aside.appendChild(a);
  return aside;
}

const seenImpressions = new Set();
function impression(creative, slotName) {
  const key = slotName + ':' + (creative.id || '');
  if (seenImpressions.has(key)) return;
  seenImpressions.add(key);
  track('ad_impression', { ad_slot: slotName, ad_creative: creative.id || 'unknown' });
}

// ── page detection ───────────────────────────────────────────────────────────

function pageType() {
  const path = location.pathname;
  if (path === '/' || path === '/index.html') return 'home';
  if (path === '/player.html') return 'player';
  if (path === '/episodes.html') return 'episodes';
  if (document.querySelector('main.article-content-wrap') && findProseRoot()) return 'article';
  return null;
}

// ── slot renderers (each returns true if it placed an ad) ────────────────────

function renderArticle(cfg, creative) {
  const slot = cfg.slots.article;
  const prose = findProseRoot();
  if (!prose) return false;
  const minP = slot.min_paragraphs == null ? 8 : slot.min_paragraphs;
  const paragraphs = prose.querySelectorAll('p').length;
  const card = buildCard(creative, 'article');

  const placeEnd = () => { prose.appendChild(card); return true; };

  if (slot.position === 'end') return placeEnd();
  if (slot.position === 'top') { prose.insertBefore(card, prose.firstChild); return true; }
  // middle (default): short articles fall back per config.
  if (paragraphs < minP) return slot.fallback === 'none' ? false : placeEnd();
  // Before the middle heading — a section boundary, never mid-sentence.
  const heads = Array.from(prose.querySelectorAll('h2, h3'));
  if (heads.length >= 2) {
    const target = heads[Math.floor(heads.length / 2)];
    target.parentNode.insertBefore(card, target);
    return true;
  }
  return slot.fallback === 'none' ? false : placeEnd();
}

function renderHome(cfg, creative) {
  // The homepage has two layouts (mobile #mobile-body / desktop #dc-desktop-root),
  // each with its own Pulse card; place a card after whichever exists. Only the
  // active layout is displayed, so at most one is visible.
  let placed = false;
  ['#dcPulseCard', '#dcdPulse'].forEach((sel) => {
    const pulse = document.querySelector(sel);
    if (!pulse) return;
    const card = buildCard(creative, 'home');
    pulse.parentNode.insertBefore(card, pulse.nextSibling);
    placed = true;
  });
  return placed;
}

function renderPlayer(cfg, creative) {
  // Above the «جستجو در دنت‌کست» box; falls back to above the episode list.
  const anchor = document.querySelector('.dc-search-box') || document.getElementById('dc-list');
  if (!anchor) return false;
  const card = buildCard(creative, 'player');
  anchor.parentNode.insertBefore(card, anchor);
  return true;
}

function renderEpisodes(cfg, creative) {
  // One card right below the «اپیزود پیشنهادی» (featured) section. Fallback for
  // safety: if the featured section is ever missing, sit just above the archive.
  const card = buildCard(creative, 'episodes');
  const featured = document.getElementById('featured-episode');
  const anchor = featured && (featured.closest('section') || featured);
  if (anchor) {
    anchor.parentNode.insertBefore(card, anchor.nextSibling);
    return true;
  }
  const list = document.getElementById('episodeList');
  if (!list) return false;
  const archive = list.closest('section') || list;
  archive.parentNode.insertBefore(card, archive);
  return true;
}

// ── overlay slots (پیشخوان / پروفایل) ────────────────────────────────────────

// The dashboard and profile are client-rendered views (the standalone /plus/
// pages AND the header overlay on any page) that re-render on every open — so
// these slots are DOM-driven, not URL-driven: watch for the anchor section
// («استریک» on the dashboard, «پلن» on the profile — both .dcp-dash-sec blocks
// titled by a .dcp-dash-h2) and keep one card seated right below it. Both
// views only render for signed-in users, so in practice the audience here is
// always "plus".
function watchOverlaySlot(cfg, slotName, anchorTitle, audienceNow) {
  let creative = null;
  let card = null;
  const seat = () => {
    if (adsKilled) return;
    const heads = document.querySelectorAll('.dcp-dash-sec > .dcp-dash-h2');
    for (const h of heads) {
      if (h.textContent.trim() !== anchorTitle) continue;
      const sec = h.parentElement;
      if (card && sec.nextElementSibling === card) return;
      if (!creative) creative = pickCreative(cfg, slotName, audienceNow());
      if (!creative) return;
      if (!card) card = buildCard(creative, slotName);
      sec.parentNode.insertBefore(card, sec.nextSibling);
      impression(creative, slotName);
      tickOnce();
      return;
    }
  };
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; seat(); });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  seat();
}

// ── premium check ────────────────────────────────────────────────────────────

function currentUserSafe() {
  // Shares plus.js's cached /me (same module URL → same instance). Never
  // rejects; any failure = anonymous.
  return import('/plus/js/api.js')
    .then((m) => m.currentUser())
    .catch(() => null);
}

let adsKilled = false;
function removeAllAds() {
  adsKilled = true; // stops overlay watchers from re-seating their cards
  document.querySelectorAll('.dc-spot').forEach((el) => el.remove());
}

// ── boot ─────────────────────────────────────────────────────────────────────

async function main() {
  let cfg;
  try {
    const res = await fetch(CONFIG_URL + SPOT_V, { cache: 'no-store' });
    if (!res.ok) return;
    cfg = await res.json();
  } catch (_) { return; }
  if (!cfg || !cfg.enabled) return; // master off → zero trace

  const slots = cfg.slots || {};
  const slotOn = (name) => slots[name] && slots[name].enabled;
  const type = pageType();
  const pageSlot = type && slotOn(type) ? type : null;
  const overlaySlots = [];
  if (slotOn('dashboard')) overlaySlots.push(['dashboard', 'استریک']);
  if (slotOn('profile')) overlaySlots.push(['profile', 'پلن']);
  if (!pageSlot && !overlaySlots.length) return;

  // Resolve the viewer once — for premium hiding AND audience targeting — but
  // don't hold rendering hostage to a slow API: after TIER_TIMEOUT_MS assume
  // anonymous; if the real answer later says premium, take the ads down.
  const userPromise = currentUserSafe();
  let user = await Promise.race([
    userPromise,
    new Promise((resolve) => setTimeout(() => resolve(null), TIER_TIMEOUT_MS)),
  ]);
  if (cfg.premium_hides_ads !== false) {
    if (user && user.tier === 'premium') return;
    userPromise.then((u) => { if (u && u.tier === 'premium') removeAllAds(); });
  }
  // Late answers still sharpen targeting for overlay slots, which pick their
  // creative only when their section actually appears in the DOM.
  userPromise.then((u) => { if (u) user = u; });
  const audienceNow = () => (user ? 'plus' : 'anon');

  if (pageSlot) {
    const creative = pickCreative(cfg, pageSlot, audienceNow());
    if (creative) {
      const renderers = { article: renderArticle, home: renderHome, player: renderPlayer, episodes: renderEpisodes };
      const placed = renderers[pageSlot](cfg, creative);
      if (placed) {
        impression(creative, pageSlot);
        tickOnce(); // advance the rotation once per ad-showing page view
      }
    }
  }

  overlaySlots.forEach(([name, title]) => watchOverlaySlot(cfg, name, title, audienceNow));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { main().catch(() => {}); });
} else {
  main().catch(() => {});
}
