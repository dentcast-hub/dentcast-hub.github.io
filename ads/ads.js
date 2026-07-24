// DentCast Ads — central, config-driven ad system. Loaded on every page by the
// loader hook in dc-nav.js (the ONLY hook; no page carries ad markup of its own).
//
// Single source of truth: /ads/ads-config.json. Turning the master switch or a
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
// The article card is inserted at a SECTION BOUNDARY (before the middle h2/h3)
// so it can never sit inside a sentence a workbench highlight spans, and it is
// user-select:none + hidden entirely in study mode (body.dcp-study) so the
// میز کار experience stays clean.

import { findProseRoot } from '/plus/js/config.js';

const CONFIG_URL = '/ads/ads-config.json';
const CSS_URL = '/ads/ads.css';
const ADS_V = new URL(import.meta.url).search; // carry ?v= from the loader onto ads.css
const TIER_TIMEOUT_MS = 3000;
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

function enabledSponsors(cfg) {
  const list = (cfg.creatives && cfg.creatives.sponsors) || [];
  return list.filter((s) => s && s.enabled && s.url);
}

function premiumCreative(cfg) {
  const p = cfg.creatives && cfg.creatives.premium;
  return p && p.enabled !== false && p.url ? p : null;
}

function nextSponsor(cfg) {
  const sponsors = enabledSponsors(cfg);
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
// and the rotation counter advances once (in main(), after a successful render).
function pickCreative(cfg) {
  const seq = (cfg.rotation && Array.isArray(cfg.rotation.sequence) && cfg.rotation.sequence.length)
    ? cfg.rotation.sequence
    : ['premium'];
  const step = seq[lsGet(K_TICK) % seq.length];
  if (step === 'premium') return premiumCreative(cfg) || nextSponsor(cfg);
  if (step === 'sponsor') return nextSponsor(cfg) || premiumCreative(cfg);
  // a specific sponsor id
  const named = enabledSponsors(cfg).find((s) => s.id === step);
  return named || nextSponsor(cfg) || premiumCreative(cfg);
}

// ── card DOM ─────────────────────────────────────────────────────────────────

let cssInjected = false;
function injectCss() {
  if (cssInjected) return;
  cssInjected = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = CSS_URL + ADS_V;
  document.head.appendChild(link);
}

function isSponsor(creative) {
  return creative.id !== 'premium';
}

function buildCard(creative, slotName) {
  injectCss();
  const aside = document.createElement('aside');
  aside.className = 'dc-ad dc-ad--' + slotName + (isSponsor(creative) ? ' dc-ad--sponsor' : ' dc-ad--premium');
  aside.setAttribute('data-dc-ad', creative.id || '');

  const a = document.createElement('a');
  a.className = 'dc-ad-link';
  a.href = creative.url;
  const external = /^https?:\/\//.test(creative.url);
  if (external) a.target = '_blank';
  a.rel = isSponsor(creative) ? 'sponsored noopener' : (external ? 'noopener' : '');

  if (creative.image) {
    const img = document.createElement('img');
    img.className = 'dc-ad-img';
    img.src = creative.image;
    img.alt = '';
    img.loading = 'lazy';
    a.appendChild(img);
  }

  const body = document.createElement('div');
  body.className = 'dc-ad-body';
  const badge = document.createElement('span');
  badge.className = 'dc-ad-badge';
  badge.textContent = creative.badge || (isSponsor(creative) ? 'حمایت‌شده' : 'دنت‌کست پلاس');
  body.appendChild(badge);
  if (creative.title) {
    const t = document.createElement('strong');
    t.className = 'dc-ad-title';
    t.textContent = creative.title;
    body.appendChild(t);
  }
  if (creative.text) {
    const p = document.createElement('p');
    p.className = 'dc-ad-text';
    p.textContent = creative.text;
    body.appendChild(p);
  }
  a.appendChild(body);

  if (creative.cta) {
    const cta = document.createElement('span');
    cta.className = 'dc-ad-cta';
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
  const list = document.getElementById('dc-list');
  if (!list) return false;
  const card = buildCard(creative, 'player');
  list.parentNode.insertBefore(card, list);
  return true;
}

function renderEpisodes(cfg, creative) {
  const list = document.getElementById('episodeList');
  if (!list) return false;
  const slot = cfg.slots.episodes;
  const everyN = Math.max(4, slot.every_n || 12);
  const max = Math.max(1, slot.max || 3);

  // The archive re-appends every episode <li> on sort/"show more" (archRender),
  // which shoves foreign nodes to the end — so after every render we re-seat the
  // ad rows after each Nth VISIBLE episode. Our own moves are invisible to the
  // observer because we disconnect while re-seating.
  const ads = [];
  const place = () => {
    const visible = Array.from(list.children).filter(
      (li) => !li.classList.contains('dc-ad-li') && !li.classList.contains('ep-hidden')
    );
    let k = 0;
    for (let i = everyN - 1; i < visible.length && k < max; i += everyN, k++) {
      if (!ads[k]) {
        const li = document.createElement('li');
        li.className = 'dc-ad-li';
        li.appendChild(buildCard(creative, 'episodes'));
        ads[k] = li;
      }
      const anchor = visible[i];
      if (anchor.nextSibling !== ads[k]) list.insertBefore(ads[k], anchor.nextSibling);
    }
    // Park unused ad rows out of the DOM (list shrank below their position).
    for (let j = k; j < ads.length; j++) {
      if (ads[j] && ads[j].parentNode) ads[j].parentNode.removeChild(ads[j]);
    }
  };

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      observer.disconnect();
      place();
      observe();
    });
  });
  const observe = () => observer.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  place();
  observe();
  return ads.length > 0;
}

// ── premium check ────────────────────────────────────────────────────────────

function currentTier() {
  // Shares plus.js's cached /me (same module URL → same instance). Never rejects.
  return import('/plus/js/api.js')
    .then((m) => m.currentUser())
    .then((user) => (user && user.tier) || 'free')
    .catch(() => 'free');
}

function removeAllAds() {
  document.querySelectorAll('.dc-ad, .dc-ad-li').forEach((el) => el.remove());
}

// ── boot ─────────────────────────────────────────────────────────────────────

async function main() {
  let cfg;
  try {
    const res = await fetch(CONFIG_URL + ADS_V, { cache: 'no-store' });
    if (!res.ok) return;
    cfg = await res.json();
  } catch (_) { return; }
  if (!cfg || !cfg.enabled) return; // master off → zero trace

  const type = pageType();
  if (!type || !cfg.slots || !cfg.slots[type] || !cfg.slots[type].enabled) return;

  // Don't hold rendering hostage to a slow API: after TIER_TIMEOUT_MS assume
  // free; if the real answer later says premium, take the ads down.
  if (cfg.premium_hides_ads !== false) {
    const tierPromise = currentTier();
    const tier = await Promise.race([
      tierPromise,
      new Promise((resolve) => setTimeout(() => resolve('free'), TIER_TIMEOUT_MS)),
    ]);
    if (tier === 'premium') return;
    tierPromise.then((t) => { if (t === 'premium') removeAllAds(); });
  }

  const creative = pickCreative(cfg);
  if (!creative) return;

  const renderers = { article: renderArticle, home: renderHome, player: renderPlayer, episodes: renderEpisodes };
  const placed = renderers[type](cfg, creative);
  if (placed) {
    impression(creative, type);
    lsSet(K_TICK, lsGet(K_TICK) + 1); // advance the rotation once per ad-showing page view
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { main().catch(() => {}); });
} else {
  main().catch(() => {});
}
