// DentCast Spot — central, config-driven ad system. Loaded by the loader hook
// at the end of dc-nav.js on every page that pulls in dc-nav.js — which is
// every page except the two standalone /plus/ full-page views (index.html,
// profile.html): they have their own minimal header, not the full site nav,
// so they carry the SAME small loader snippet inline instead of pulling in
// all of dc-nav.js. No page carries ad MARKUP of its own — only this loader
// snippet is ever duplicated, config-driven exactly like the primary hook.
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
// Visibility rule — three visitor classes, decided BEFORE anything renders:
//   anon    (signed out)        → sees ads
//   plus    (signed in, free)   → sees ads, targeted separately from anon
//   premium (tier === 'premium')→ never, anywhere ("بدون تبلیغات" is the perk)
//
// The class comes from plus.js's shared /me, plus a localStorage memory of what
// this device was LAST CONFIRMED to be (K_CLASS), written only on a real answer.
// That memory is what makes the premium promise hold on a slow API: a device
// known to be premium waits for the answer instead of rendering "as anon" and
// pulling the card afterwards — a premium user must never see the flash. A
// device known to be plus renders immediately with plus targeting instead of
// being served the anon-only "join Plus" card. A device that has never signed in
// has no memory, renders as anon at once, and a late premium answer still
// removes every card (removeAllAds) as a last resort.


//
// Rotation: rotation.sequence cycles one step per rotation unit (localStorage
// counter). Entries: "premium", "sponsor" (weighted round-robin over enabled
// sponsors), or a specific sponsor id. Missing creative at a step falls back to
// the other kind; nothing available → nothing renders.
//
// Rotation cadence (rotation.advance): "view" (default) takes one step per
// ad-showing page view. "session" takes one step per VISIT — every page opened
// within rotation.session_minutes of the previous one shows the SAME campaign,
// and the next session moves one step down the sequence. That is what makes a
// four-beat sequence like ["premium","premium","premium","sponsor"] mean "three
// whole sessions of one ad, a different one on the fourth visit".
//
// Targeting: a creative may carry "slots": [...] (where it renders) and/or
// "audience": ["anon"|"plus"] (who sees it). No field = everyone, everywhere —
// so by default signed-out and signed-in visitors see the same campaign.
//
// Measurement counts a SEEN ad, not a rendered one: a card must be at least 50%
// on screen for one continuous second in a foreground tab before it counts
// (the IAB display rule; tunable via `seen` in the config). Only the two classes
// that get ads can generate events at all — premium never renders one — so the
// report is exactly "how often anon and plus visitors actually saw each
// campaign". Every seen impression and click is reported TWICE — to GA4
// (ad_impression / ad_click with ad_slot, ad_creative, viewer) and to our own
// API (spot_impression / spot_click on /anon/event for guests, /activity for
// signed-in users). Our API is the source of truth because adblockers drop GA
// but not a same-site subdomain; GA stays as the cross-check. Signed-out
// visitors are measured exactly like signed-in ones — no login is involved in
// counting. Reporting recipe: .dentcast/workflows/spot-report.md.
//
// The article card is inserted at a SECTION BOUNDARY (before the middle h2/h3)
// so it can never sit inside a sentence a workbench highlight spans, and it is
// user-select:none + hidden entirely in study mode (body.dcp-study) so the
// میز کار experience stays clean.

import { findProseRoot, PROSE_SELECTORS } from '/plus/js/config.js';

const CONFIG_URL = '/spot/spot-config.json';
const SPOT_V = new URL(import.meta.url).search; // carry ?v= from the loader onto the config fetch
const TIER_TIMEOUT_MS = 3000;
// localStorage keys keep their historical names — invisible to blockers, and
// renaming them would reset every visitor's rotation position.
const K_TICK = 'dcAds.tick'; // rotation step, advances once per rotation unit
const K_RR = 'dcAds.rr'; // sponsor round-robin cursor, advances with the step
const K_SEEN = 'dcAds.seen'; // ms stamp of the last page view (session heartbeat)
const K_HELD = 'dcAds.held'; // 1 = the current session already took its step
const K_CLASS = 'dcAds.vc'; // last CONFIRMED viewer class on this device: anon|plus|premium
const DEFAULT_SESSION_MINUTES = 30; // idle gap that starts a new session

function lsGet(key) {
  try { return parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch (_) { return 0; }
}
function lsSet(key, n) {
  try { localStorage.setItem(key, String(n)); } catch (_) { /* private mode */ }
}
function lsGetStr(key) {
  try { return localStorage.getItem(key) || ''; } catch (_) { return ''; }
}
function lsSetStr(key, v) {
  try { localStorage.setItem(key, v); } catch (_) { /* private mode */ }
}

function track(name, params) {
  const send = () => { if (window.gtag) window.gtag('event', name, params); };
  // GA is deferred until window load; queue the event for then if needed.
  if (window.gtag) send();
  else window.addEventListener('load', () => setTimeout(send, 0), { once: true });
}

// Viewer class carried on every ad event as the "viewer" parameter: "anon"
// (signed-out) or "plus" (signed-in, non-premium). Premium never reaches a
// track() call — those users see no ads at all — so the dimension only ever
// carries these two values and "premium = 0 impressions" is by construction,
// not something to read out of the data. Resolved at EVENT time rather than
// card-build time, so a /me answer that lands late still labels the click
// correctly (the same lazy rule the targeting layer already uses).
let viewerNow = () => 'anon';

// ── first-party telemetry (our own API, alongside GA) ────────────────────────

// GA4 loses every adblocked visitor (googletagmanager.com is on EasyList; the
// Spot cards themselves are not). So the same two events also go to our own
// API, which is a same-site subdomain no filter list touches — those counters
// are the real numbers, GA is the cross-check.
//
// The server stores AGGREGATE COUNTERS keyed (day, slot, creative, viewer,
// kind), never one row per view, and it fills `viewer` itself from the session
// cookie — a client cannot mislabel its own traffic, so nothing here is
// security-relevant. Endpoint is chosen by login state only: /activity is
// behind requireAuth and 401s for a guest.
//
// Fire-and-forget, always: never block a render, never surface an error,
// never retry. A dropped impression is acceptable; a broken card is not.
// keepalive lets a click still report while the browser navigates away (the
// house ad's link is internal, so that tab really does unload).
const SPOT_EVENT = { impression: 'spot_impression', click: 'spot_click' };

/**
 * Telemetry heartbeat. Everything below is fire-and-forget, which used to mean a
 * dead reporting channel and an audience that genuinely saw no ads produced the
 * SAME silence — on 2026-07-27 that ambiguity cost a full investigation before
 * the numbers could be trusted at all.
 *
 * So a failed report says so through the OTHER channel: GA and our API fail
 * independently (an adblocker takes GA, a CORS/rate-limit/outage takes ours), so
 * both going quiet at once is itself the signal. Capped at one per page view —
 * this is a smoke alarm, not a log stream — and it never disturbs the page: a
 * failure to report a failure is simply dropped.
 */
let reportFailureSent = false;
function reportFailed(status, slotName) {
  if (reportFailureSent) return;
  reportFailureSent = true;
  try {
    track('spot_report_failed', { status: String(status), ad_slot: slotName, viewer: viewerNow() });
  } catch (_) { /* never let the alarm break the page */ }
}

function report(kind, slotName, creativeId) {
  const name = SPOT_EVENT[kind];
  const contentId = slotName + ':' + (creativeId || 'unknown');
  const post = (base, path, key) => fetch(base + path, {
    method: 'POST',
    credentials: 'include', // the session cookie is what labels this as "plus"
    keepalive: true,
    cache: 'no-store',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ [key]: name, content_id: contentId }),
  });
  import('/plus/js/api.js')
    .then((m) => m.apiBase())
    .then((base) => {
      if (viewerNow() !== 'plus') return post(base, '/anon/event', 'event');
      // We think this visitor is signed in — but the belief can come from the
      // device hint while the session has actually expired, and /activity is
      // behind requireAuth. Fall back once so the event is counted as a guest
      // rather than silently lost; the server labels the viewer either way.
      return post(base, '/activity', 'action')
        .then((res) => (res && res.status === 401 ? post(base, '/anon/event', 'event') : res));
    })
    // A 4xx/5xx does NOT reject fetch, so the status has to be read: a 400 wall
    // or a 429 ceiling is exactly the kind of failure that was invisible before.
    .then((res) => { if (res && !res.ok) reportFailed(res.status, slotName); })
    .catch(() => {
      reportFailed('network', slotName);
      // A network-level failure (not an HTTP error) may mean the cached base is
      // dead — self-heal so the NEXT event, and the next page's /me, re-probe
      // instead of retrying the same unreachable host all session.
      import('/plus/js/api.js').then((m) => m.forgetBase()).catch(() => {});
    });
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
  // The cursor moves with the rotation step (advanceRotation), not per call —
  // so every slot on the page, and every page of a held session, resolves the
  // same sponsor.
  return pool[lsGet(K_RR) % pool.length];
}

// One creative per page view: every slot on the page shows the same campaign,
// and the rotation counter advances once (advanceRotation, after the first
// successful render) — and, in session cadence, not at all until the visitor
// comes back for a new session. A step whose creative is missing or not allowed
// in this slot / for this audience falls back to the other kind; nothing
// eligible → nothing renders.
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

// ── rotation cadence (per view vs. per session) ──────────────────────────────

// "view" (default, historical): the counters move AFTER an ad renders, so the
// next page view lands on the next step.
//
// "session": the counters move only at a SESSION BOUNDARY — never mid-visit.
// That is the whole point: the step has to stay frozen while the visitor is
// browsing, otherwise page 2 of the same visit would already show the next
// campaign. A visit ends after rotation.session_minutes without a page view
// (default 30, the usual analytics window); the heartbeat lives in
// localStorage, so it survives tab closes and is shared across tabs.
//
// K_HELD marks "the session that just ended actually showed an ad" — the new
// session steps only then. A visit where no slot ever rendered therefore burns
// no step: the campaign the visitor never saw is still waiting next time.
let sessionMode = false;
function openRotationWindow(cfg) {
  const rot = cfg.rotation || {};
  sessionMode = rot.advance === 'session';
  if (!sessionMode) return;
  const m = Number(rot.session_minutes);
  const minutes = m > 0 ? m : DEFAULT_SESSION_MINUTES;
  const now = Date.now();
  const last = lsGet(K_SEEN);
  if (last && now - last <= minutes * 60000) { lsSet(K_SEEN, now); return; } // same visit → frozen
  // New session: take the step the previous session earned, then re-arm.
  if (lsGet(K_HELD) === 1) {
    lsSet(K_TICK, lsGet(K_TICK) + 1);
    lsSet(K_RR, lsGet(K_RR) + 1);
    lsSet(K_HELD, 0);
  }
  lsSet(K_SEEN, now);
}

let ticked = false;
function advanceRotation() {
  if (ticked) return;
  ticked = true;
  // Session cadence: don't move the counters now — just record that this visit
  // used its step; openRotationWindow spends it when the next session starts.
  if (sessionMode) { lsSet(K_HELD, 1); return; }
  lsSet(K_TICK, lsGet(K_TICK) + 1);
  lsSet(K_RR, lsGet(K_RR) + 1);
}

// Per-SLOT audience gate, independent of per-creative "audience": a slot with
// "audience": ["anon"] renders only for signed-out visitors, ["plus"] only for
// signed-in non-premium users; no field = both (default). This decides whether
// the PLACEMENT exists for this viewer at all — per-creative audience then
// decides which campaign fills it. Checked lazily (at seat/open time) so late
// /me answers still count for the DOM-driven slots.
function slotAllows(cfg, name, audience) {
  const s = cfg.slots && cfg.slots[name];
  return !!(s && s.enabled && (!Array.isArray(s.audience) || s.audience.includes(audience)));
}

// ── card styles ──────────────────────────────────────────────────────────────

// The CSS ships INLINE inside this module (a <style> tag, not a <link>): the
// dentcast.ir mirror sits behind Arvan object storage + CDN, which served the
// standalone spot.css in a way the browser refused to apply as a stylesheet
// (content-minified, wrong/nosniffed content-type) — cards rendered unstyled.
// One file, one request, nothing for a CDN or MIME guesser to break.
//
// Native look: same surfaces/typography vars as the site (dc-theme.css).
// Orange theme — the amber family (#F5A208) inherited from the site's old
// Deonet pulse ad (since removed; Pulse is news-only now): soft gradient tint,
// bold saturated border, dark body text, solid-amber CTA pill. Study mode
// (body.dcp-study) hides all cards.
const SPOT_CSS = `
.dc-spot { margin: 1.25rem 0; user-select: none; -webkit-user-select: none; }
body.dcp-study .dc-spot { display: none !important; }
.dc-spot-link {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  /* The amber tint is translucent BY DESIGN, so it must sit on an opaque card
     surface — never straight on the page. The homepage hero is a dark artwork,
     and with only the tint the card's own dark body text landed on that image
     and disappeared (desktop, light theme). Layering the gradient over
     --card-bg keeps the same look on a normal page and makes the card legible
     wherever it is dropped. */
  background:
    linear-gradient(135deg, rgba(245, 162, 8, 0.12), rgba(245, 162, 8, 0.04)),
    var(--card-bg, #ffffff);
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
[data-theme="dark"] .dc-spot-link {
  background:
    linear-gradient(135deg, rgba(245, 162, 8, 0.12), rgba(245, 162, 8, 0.04)),
    var(--card-bg, #1e2c3a);
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
.dc-spot--search { margin: 0.75rem 0; }
.dc-spot--search .dc-spot-link { padding: 0.75rem 1rem; }
.dc-spot--archive { margin: 1.25rem 0 0.75rem; }
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
    track('ad_click', { ad_slot: slotName, ad_creative: creative.id || 'unknown', viewer: viewerNow() });
    report('click', slotName, creative.id);
  });
  aside.appendChild(a);
  // Every card counts itself, once it has actually been seen. Doing it here (the
  // one place a card is ever built) means no placement can be added later that
  // forgets to measure, or that measures at insertion by accident.
  armSeen(aside, creative, slotName);
  return aside;
}

// One impression per PLACEMENT per CONTENT VIEW — the standard ad-server rule,
// and the one the reporting depends on: the number a report calls "بار دیده شده"
// is the event COUNT, never the user count. A visitor who opens 20 pages
// generates 20 impressions; a page carrying three enabled slots generates three
// (one per card the visitor actually sees). The Set below only stops the SAME
// card in the SAME content view from being counted twice when an overlay watcher
// re-seats it — it never collapses repeat views.
const seenImpressions = new Set();
// The desktop shell reads ten articles inside ONE page load, so "page view"
// would silently mean "the first article, then nothing for the rest of the
// visit" — the sponsor delivered ten cards and would be billed for one. The
// shell clears the slot's key when it seats a card for a genuinely NEW article,
// which is the same event a phone reports as a page load. Nothing else may call
// this: the guard against double-counting one seated card stays intact.
function forgetImpression(slotName, creativeId) {
  seenImpressions.delete(slotName + ':' + (creativeId || ''));
}
function impression(creative, slotName) {
  const key = slotName + ':' + (creative.id || '');
  if (seenImpressions.has(key)) return;
  seenImpressions.add(key);
  track('ad_impression', { ad_slot: slotName, ad_creative: creative.id || 'unknown', viewer: viewerNow() });
  report('impression', slotName, creative.id);
  // The rotation step belongs to a SEEN ad, not a rendered one: a visit where
  // the visitor never scrolled to the card must not burn the campaign's turn.
  advanceRotation();
}

// ── viewability: an impression means SEEN, not rendered ──────────────────────

// A card that is inserted but never scrolled to was never delivered, and a
// sponsor report that counts it is selling air. So nothing is counted until the
// card is actually on screen: at least `seenRatio` of it visible, continuously,
// for `seenMs`, in a foreground tab (the IAB display rule — 50% for one second —
// which is what a sponsor's own agency will measure against).
//
// Consequences worth knowing when reading a report:
//   - an article card below the fold counts only if the visitor scrolls to it,
//   - a background/prerendered tab counts nothing until it is looked at,
//   - the two homepage layouts (mobile + desktop) both get a card inserted, but
//     only the displayed one can ever become visible, so it counts once,
//   - a premium answer that lands during the dwell removes the card before the
//     timer fires, so a premium visitor cannot leave an impression behind.
let seenRatio = 0.5;
let seenMs = 1000;
// The /me answer, once main() has asked for it. An impression is held until it
// settles (see done()); CLASS_WAIT_MS caps that hold so a hung request can never
// swallow a visit's telemetry outright.
let classPending = null;
const CLASS_WAIT_MS = 10000;

function armSeen(el, creative, slotName) {
  // No IntersectionObserver (very old browser): fall back to counting at
  // insertion rather than losing the visitor's traffic entirely.
  if (typeof IntersectionObserver === 'undefined') { impression(creative, slotName); return; }
  let timer = null;
  let inView = false;
  const stop = () => { if (timer) { clearTimeout(timer); timer = null; } };
  const fire = () => {
    if (adsKilled) return; // a premium answer pulled the card
    io.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    impression(creative, slotName);
  };
  const done = () => {
    timer = null;
    // Never count while the visitor class is still UNCONFIRMED. On a first-ever
    // visit with a slow API the card can be rendered, seen and its dwell
    // finished before /me answers — and if that answer says premium, an
    // impression would already be on the books, filed by the server (which
    // labels from the session cookie) under `plus`. Holding until the class
    // settles closes the last hole in "premium generates no ad data".
    if (!classPending) { fire(); return; }
    Promise.race([
      classPending,
      new Promise((resolve) => setTimeout(resolve, CLASS_WAIT_MS)),
    ]).then(fire);
  };
  const start = () => {
    if (timer || !inView || document.visibilityState === 'hidden') return;
    timer = setTimeout(done, seenMs);
  };
  const onVisibility = () => { if (document.visibilityState === 'hidden') stop(); else start(); };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { inView = e.isIntersecting && e.intersectionRatio >= seenRatio; });
    if (inView) start(); else stop();
  }, { threshold: [seenRatio] });
  io.observe(el);
  document.addEventListener('visibilitychange', onVisibility);
}

// ── page detection ───────────────────────────────────────────────────────────

function pageType() {
  const path = location.pathname;
  if (path === '/' || path === '/index.html') return 'home';
  if (path === '/player.html') return 'player';
  if (path === '/episodes.html') return 'episodes';
  if (document.querySelector('main.article-content-wrap') && findProseRoot()) return 'article';
  // LiteCast pages carry the same article-content-wrap shell but never carry
  // one of PROSE_SELECTORS on purpose — that selector doubles as the Plus
  // workbench gate (plus.js initArticle), and LiteCast is a deliberately
  // simpler, general-audience track that must never pick up
  // highlighting/study mode. Detect it by path instead, so the article slot
  // still reaches it without touching that shared selector.
  if (path.indexOf('/litecast/') === 0 && litecastProseRoot()) return 'article';
  return null;
}

// LiteCast's own prose root: a bare <article> inside the article shell, no
// PROSE_SELECTORS class. See the pageType() comment above for why this stays
// separate from findProseRoot() rather than extending PROSE_SELECTORS.
function litecastProseRoot() {
  return document.querySelector('main.article-content-wrap article');
}

// ── slot renderers (each returns true if it placed an ad) ────────────────────

function renderArticle(cfg, creative) {
  const prose = findProseRoot() || litecastProseRoot();
  if (!prose) return false;
  return placeArticleCard(cfg.slots.article, prose, buildCard(creative, 'article'));
}

// What counts as one block of body text for placement purposes. It is NOT just
// <p>: an Insight page carries its substance in a <ul> under a single opening
// paragraph, so counting paragraphs alone made a page with a real body look
// nearly empty — min_paragraphs failed and the card fell to the very end, which
// is the opposite of what "middle" asks for. Headings are deliberately absent
// here: they are labels, so they anchor the card (below) but never count as body.
const BODY_BLOCK_SEL = 'p, ul, ol, blockquote, figure, table, pre';

// The legal footer every content page carries is not body text. Counting it
// inflated every short body by one AND let placeEnd() append the card BELOW it —
// the worst position on the page, under the small print.
const NOT_BODY_SEL = '.dc-disclaimer';

// Outermost body blocks, in document order. A <p> inside an <li> or a
// <blockquote> is part of that block, not a second one.
function bodyBlocks(prose) {
  return Array.from(prose.querySelectorAll(BODY_BLOCK_SEL)).filter((el) => {
    if (el.closest(NOT_BODY_SEL)) return false;
    const outer = el.parentElement && el.parentElement.closest(BODY_BLOCK_SEL);
    return !(outer && prose.contains(outer));
  });
}

// The placement rule itself, shared by the TWO ways an article reaches a screen:
// a real article page (renderArticle) and the desktop shell, which injects an
// article's markup into the homepage with no navigation at all
// (window.dcSpotMountArticle below). One function so the card lands in the same
// place on both — a reader on a laptop and the same reader on a phone must not
// see the ad at different points in the text.
function placeArticleCard(slot, prose, card) {
  // "The end" means the end of the BODY, not the end of the container: the
  // disclaimer stays last, always.
  const disclaimer = prose.querySelector(NOT_BODY_SEL);
  const placeEnd = () => {
    if (disclaimer && disclaimer.parentNode) disclaimer.parentNode.insertBefore(card, disclaimer);
    else prose.appendChild(card);
    return true;
  };

  if (slot.position === 'end') return placeEnd();
  if (slot.position === 'top') { prose.insertBefore(card, prose.firstChild); return true; }

  // "middle" (default): aim for the UPPER THIRD so the card is seen, not buried at
  // the end. Target a block ~target_ratio down the body, then SNAP to the
  // nearest section heading (h2/h3) at/after it within the first ~60% — a clean
  // boundary, never mid-sentence. If no heading is near, sit right before the
  // target block (still a between-blocks boundary).
  const minP = slot.min_paragraphs == null ? 3 : slot.min_paragraphs;
  const ratio = slot.target_ratio == null ? 0.33 : slot.target_ratio;
  const blocks = bodyBlocks(prose);

  // One block or none: no interior boundary exists, so this is the ONLY case
  // that still falls back per config.
  if (blocks.length < 2) return slot.fallback === 'none' ? false : placeEnd();

  // Short body (under min_paragraphs): there is no meaningful "one third down",
  // but there IS a boundary — so sit after the opening block instead of giving
  // up and dropping to the end. On an Insight page that is between the opening
  // paragraph and the case list: still the upper half, which is the whole point.
  if (blocks.length < minP) { blocks[1].parentNode.insertBefore(card, blocks[1]); return true; }

  // Never before the very first block (keep an intro above the card).
  const targetP = blocks[Math.min(blocks.length - 1, Math.max(1, Math.round(blocks.length * ratio)))];
  const limitP = blocks[Math.min(blocks.length - 1, Math.round(blocks.length * 0.6))];
  const FOLLOWING = 4; // Node.DOCUMENT_POSITION_FOLLOWING
  let anchor = targetP;
  for (const h of prose.querySelectorAll('h2, h3')) {
    const afterTarget = (targetP.compareDocumentPosition(h) & FOLLOWING) !== 0;
    const afterLimit = (limitP.compareDocumentPosition(h) & FOLLOWING) !== 0;
    if (afterTarget && !afterLimit) { anchor = h; break; } // earliest heading in the upper window
  }
  anchor.parentNode.insertBefore(card, anchor);
  return true;
}

// findProseRoot() scoped to one container. The document-wide version is wrong in
// the shell: the injected article sits inside #dcd-content-area while the
// homepage around it has boxes of its own, and a document query would find one
// of those first and drop the card outside the article entirely.
function proseRootIn(container) {
  for (const sel of PROSE_SELECTORS) {
    const el = container.querySelector(sel);
    if (el) return el;
  }
  return null;
}

/**
 * Desktop shell (index.html), the article slot's second entry point.
 *
 * On a wide screen the homepage IS the app: clicking an item fetches the page,
 * strips its chrome — dc-nav.js, and therefore this file, included — and injects
 * the article's markup into #dcd-content-area. The URL never changes and nothing
 * re-runs, so spot.js (which ran once, on the homepage, and saw `home`) never
 * learned an article was on screen. That is why the in-article card was missing
 * on desktop while working on mobile: not config, not targeting — the slot's
 * trigger simply never fired.
 *
 * The shell already solves exactly this for the Plus workbench by calling a mount
 * hook after it injects; expose the same kind of hook and let it call ours. The
 * shell decides WHEN (it alone knows the fetched page was an article); we decide
 * WHERE, with the same placeArticleCard() the mobile path uses.
 *
 * Rotation is untouched: pickCreative/nextSponsor only READ the counters, so a
 * visitor opening ten articles in one shell session keeps seeing that session's
 * campaign, exactly as ten real page loads would. The card counts its own
 * impression when actually seen, like every other card.
 */
function setupShellArticleSlot(cfg, audienceNow) {
  window.dcSpotMountArticle = function (container) {
    if (adsKilled || !container) return false;
    if (!slotAllows(cfg, 'article', audienceNow())) return false;
    if (container.querySelector('.dc-spot--article')) return false; // already seated
    const prose = proseRootIn(container);
    if (!prose) return false; // no prose box: the mobile path would show nothing here either
    const creative = pickCreative(cfg, 'article', audienceNow());
    if (!creative) return false;
    // A new article in the shell is a new content view, so this card is a new
    // delivery — even though the browser never left the page. Without this the
    // whole visit would report one article impression no matter how much the
    // reader read (measured: article #2 reported nothing).
    forgetImpression('article', creative.id);
    return placeArticleCard(cfg.slots.article, prose, buildCard(creative, 'article'));
  };
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
    if (adsKilled || !slotAllows(cfg, slotName, audienceNow())) return;
    const heads = document.querySelectorAll('.dcp-dash-sec > .dcp-dash-h2');
    for (const h of heads) {
      if (h.textContent.trim() !== anchorTitle) continue;
      const sec = h.parentElement;
      if (card && sec.nextElementSibling === card) return;
      if (!creative) creative = pickCreative(cfg, slotName, audienceNow());
      if (!creative) return;
      if (!card) card = buildCard(creative, slotName); // arms its own seen-counter
      sec.parentNode.insertBefore(card, sec.nextSibling);
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

// ── search-overlay slot (جستجوی سراسری) ──────────────────────────────────────

// Every page carries the global-search bottom sheet (#dcGlobalBox) in its
// static markup: title, input, .dc-filter-list (the scope buttons), then the
// #dcResults box. The card sits between the two — below the filter buttons,
// above the results. The sheet is closed on load, so the card is inserted
// (and its impression counted) only on the FIRST actual open: dc-nav.js adds
// class "open" to the box; the homepage's own overlay sets body.dc-search-mode.
function setupSearchSlot(cfg, audienceNow) {
  const box = document.getElementById('dcGlobalBox');
  const results = document.getElementById('dcResults');
  if (!box || !results || !results.parentNode) return;
  const isOpen = () => box.classList.contains('open') || document.body.classList.contains('dc-search-mode');
  const seat = () => {
    if (adsKilled || !slotAllows(cfg, 'search', audienceNow())) return;
    const creative = pickCreative(cfg, 'search', audienceNow());
    if (!creative) return;
    results.parentNode.insertBefore(buildCard(creative, 'search'), results);
  };
  if (isOpen()) { seat(); return; }
  const observer = new MutationObserver(() => {
    if (!isOpen()) return;
    observer.disconnect();
    seat();
  });
  observer.observe(box, { attributes: true, attributeFilter: ['class'] });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

// ── archive-tab slot (تب آرشیو صفحهٔ اصلی) ───────────────────────────────────

// The homepage archive tab lists one .dc-list-card per archive; the card seats
// right below the «اپیزودهای پادکست» one. The tab is hidden until the user
// switches to it, so the card is inserted up front (it shows/hides with the
// panel) and — like every other placement now — counts only once it is really on
// screen. This slot used to be the ONLY one that checked visibility; that check
// now lives in buildCard/armSeen for all of them.
function setupArchiveSlot(cfg, audienceNow) {
  if (!slotAllows(cfg, 'archive', audienceNow())) return;
  const title = Array.from(document.querySelectorAll('.dc-list-card .dc-list-card-title'))
    .find((el) => el.textContent.trim().indexOf('اپیزودهای پادکست') === 0);
  const anchor = title && title.closest('.dc-list-card');
  if (!anchor) return;
  const creative = pickCreative(cfg, 'archive', audienceNow());
  if (!creative) return;
  anchor.parentNode.insertBefore(buildCard(creative, 'archive'), anchor.nextSibling);
}

// ── premium check ────────────────────────────────────────────────────────────

// The three visitor classes, and the ONLY thing that decides them. `premium`
// never sees an ad (that is the paid promise); `plus` (signed-in, free) and
// `anon` (signed-out) both do — they only differ in which campaign is targeted
// at them.
function classOf(user) {
  return user ? (user.tier === 'premium' ? 'premium' : 'plus') : 'anon';
}

// Ask /me and report WHY it answered what it answered. Shares plus.js's cached
// request (same module URL → same instance), never rejects. `status: 'error'`
// means the question could not be asked at all — treated very differently from
// a confirmed 'anon' below.
function viewerProbe() {
  return import('/plus/js/api.js')
    .then((m) => m.currentUser().then((user) => ({ user, status: m.meStatus() })))
    .catch(() => ({ user: null, status: 'error' }));
}

// What this device WAS, last time we got a straight answer. Written only on a
// confirmed answer, so a failed /me never overwrites a known premium with
// "anon". This is what closes the flash: the first paint of page 2 already
// knows what page 1 confirmed, instead of re-guessing "anon" every time.
function rememberClass(probe) {
  if (probe.status === 'user' || probe.status === 'anon') lsSetStr(K_CLASS, classOf(probe.user));
}
function hintedClass() {
  const h = lsGetStr(K_CLASS);
  return h === 'premium' || h === 'plus' ? h : 'anon';
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

  // Decide up front whether this page view may move the rotation, and keep the
  // session heartbeat alive on every page (not just ad-showing ones), so a
  // visitor browsing pages without slots doesn't get counted as a new session.
  openRotationWindow(cfg);

  // Viewability thresholds are config, not code (a sponsor contract may specify
  // its own). Defaults are the IAB display rule: 50% of the card, for 1s.
  const seenCfg = cfg.seen || {};
  if (Number(seenCfg.ratio) > 0 && Number(seenCfg.ratio) <= 1) seenRatio = Number(seenCfg.ratio);
  if (Number(seenCfg.ms) >= 0) seenMs = Number(seenCfg.ms);

  const slots = cfg.slots || {};
  const slotOn = (name) => slots[name] && slots[name].enabled;
  const type = pageType();
  const pageSlot = type && slotOn(type) ? type : null;
  const overlaySlots = [];
  if (slotOn('dashboard')) overlaySlots.push(['dashboard', 'استریک']);
  if (slotOn('profile')) overlaySlots.push(['profile', 'پلن']);
  const searchOn = slotOn('search');
  const archiveOn = slotOn('archive');
  // The desktop shell injects whole articles into the homepage without a
  // navigation, so the article slot has to be mountable on demand HERE, on a page
  // whose own type is `home`. Gated on the shell's container so no other page
  // pays for a hook it can never use.
  const shellArticle = slotOn('article') && !!document.getElementById('dcd-content-area');
  if (!pageSlot && !overlaySlots.length && !searchOn && !archiveOn && !shellArticle) return;

  // Resolve the viewer class ONCE, before anything renders. It decides two
  // things: whether an ad may exist at all (premium: never), and which campaign
  // is targeted (anon vs plus).
  //
  // The old rule — "assume anon after TIER_TIMEOUT_MS, undo later if premium" —
  // guessed wrong in both directions on a slow /me: a premium visitor saw an ad
  // flash before it was pulled, and a signed-in free visitor was served the
  // anon-targeted "join Plus" card (and that mismatch is visible in the
  // reporting: the server labels the impression `plus` from the session cookie
  // while the client had picked an `anon` creative). The device hint fixes the
  // common case; waiting fixes the premium case.
  const probe = viewerProbe();
  classPending = probe; // impressions wait on this before they may be counted
  probe.then(rememberClass);
  const hint = hintedClass();
  const premiumHides = cfg.premium_hides_ads !== false;

  // A device last confirmed as PREMIUM waits for the real answer — no timeout,
  // no fallback render. The wait is bounded anyway: the probe never rejects, it
  // resolves with status 'error' when the API is unreachable. Everyone else
  // keeps first paint independent of the API.
  const early = (premiumHides && hint === 'premium')
    ? await probe
    : await Promise.race([
      probe,
      new Promise((resolve) => setTimeout(() => resolve(null), TIER_TIMEOUT_MS)),
    ]);

  // No answer (timed out) or no way to ask (status 'error') → trust what this
  // device was last confirmed to be. A never-signed-in device has no hint and
  // stays 'anon', exactly as before.
  let viewerClass = (early && early.status !== 'error') ? classOf(early.user) : hint;

  if (premiumHides && viewerClass === 'premium') return; // zero trace, no impression

  // Safety net for the one case the hint cannot cover: a device signing in as
  // premium for the FIRST time here. The answer lands late, the ads come down.
  if (premiumHides) {
    probe.then((p) => { if (p.status === 'user' && classOf(p.user) === 'premium') removeAllAds(); });
  }
  // Late answers still sharpen targeting for overlay slots, which pick their
  // creative only when their section actually appears in the DOM.
  probe.then((p) => { if (p.status !== 'error') viewerClass = classOf(p.user); });
  const audienceNow = () => (viewerClass === 'anon' ? 'anon' : 'plus');
  viewerNow = audienceNow; // same answer drives targeting AND the measurement label

  if (pageSlot && slotAllows(cfg, pageSlot, audienceNow())) {
    const creative = pickCreative(cfg, pageSlot, audienceNow());
    if (creative) {
      const renderers = { article: renderArticle, home: renderHome, player: renderPlayer, episodes: renderEpisodes };
      // Placement only. The card counts itself (and moves the rotation) when the
      // visitor actually sees it — see armSeen.
      renderers[pageSlot](cfg, creative);
    }
  }

  overlaySlots.forEach(([name, title]) => watchOverlaySlot(cfg, name, title, audienceNow));
  if (searchOn) setupSearchSlot(cfg, audienceNow);
  if (archiveOn) setupArchiveSlot(cfg, audienceNow);
  if (shellArticle) setupShellArticleSlot(cfg, audienceNow);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { main().catch(() => {}); });
} else {
  main().catch(() => {});
}
