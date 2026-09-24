// Audio hub — ONE place that knows an episode is being listened to, whichever
// player the listener pressed.
//
// The site plays an episode from four places that never knew about each other:
// the episode page's own <audio id="ep-audio"> (212 generated pages), the
// homepage hero's play button, the header podcast drawer (/player.html in an
// iframe) and the episodes list's inline /player.html. Only player.html ever
// remembered where the listener was; the other two forgot on every page change,
// and none but player.html told the lock screen what was playing. And because
// this is an MPA, every navigation destroys whatever <audio> was playing — no
// browser keeps sound alive across two full documents, so «the podcast stops
// when I open a folder» is the architecture, not a bug any page can fix alone.
//
// What this module does about it, and only this (stage 1, founder 1405/07/01):
//   · every episode <audio> writes the SAME resume record player.html already
//     writes (localStorage «dc-resume-state», plus PUT /player/state for a
//     signed-in reader) — one record, so every player resumes every other;
//   · an episode page's player restores that position on its first play;
//   · every episode <audio> tells the lock screen / notification what it is
//     (Media Session: title, artwork, ±15, scrub);
//   · starting one pauses all the others (the header music included);
//   · on any other page a small bar offers «ادامه‌ی شنیدن» from the saved
//     second. When the listener left a page WHILE it was playing, the bar
//     tries to carry on by itself; a browser that refuses sound without a tap
//     gets the same bar, paused, one tap away. Nothing is ever started for a
//     listener who had paused.
//
// No page carries hub markup (the rule every shared control here follows):
// episode pages are found by their #ep-audio, any other in-document <audio> is
// adopted when it plays (a capture listener — `play` does not bubble), and the
// homepage hero, whose Audio lives in no document, hands itself over through
// window.dcAudioHub / window.dcAudioPending (the dcpPendingListen shape).
// player.html keeps its own record-keeping (#dc-audio is never adopted); the
// hub only asks it to stop when something else starts.
import { apiBase } from './api.js?v=147';
import { el, faNum } from './util.js?v=147';
import { fmtClock, segmentActive } from './clip-audio.js?v=147';

export const RESUME_KEY = 'dc-resume-state';   // player.html's own record — same key, same shape
export const META_KEY = 'dc-resume-meta';      // what the bar needs to draw it without the 500 KB catalog
export const DISMISS_KEY = 'dc-resume-dismissed';
export const HANDOFF_KEY = 'dc-audio-handoff'; // sessionStorage: «this TAB left a page mid-play»

const SAVE_EVERY_MS = 5000;
const SERVER_EVERY_MS = 15000;           // player.html's own throttle
export const MIN_RESUME_S = 20;          // under this, starting over costs nothing
export const STALE_MS = 7 * 24 * 3600 * 1000;
export const HANDOFF_FRESH_MS = 30000;
const SKIP_S = 15;
const ARTIST = 'دکتر فواد شهابیان';
const ALBUM = 'دنت‌کست';
// The same two square PNGs player.html gives the lock screen.
const ARTWORK = [
  { src: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
  { src: '/favicon-512.png', sizes: '512x512', type: 'image/png' },
];

const adopted = new Map(); // HTMLAudioElement -> state
let active = null;         // the adopted element that played last
let bar = null;            // { root, audio, ... } while the resume bar is on screen
let catalogP = null;
let lastServerSave = 0;

// ── small pure helpers (exported for the test) ─────────────────────────────

function readJSON(store, key) {
  try { return JSON.parse(store.getItem(key)); } catch (_) { return null; }
}
function writeJSON(store, key, v) {
  try { store.setItem(key, JSON.stringify(v)); } catch (_) { /* full / blocked — silently skip */ }
}
function removeKey(store, key) {
  try { store.removeItem(key); } catch (_) { /* ignore */ }
}

/** «162- Cantilever…» → «Cantilever…» — player.html's epDisplayTitle, verbatim. */
export function cleanTitle(t) {
  return String(t || '').replace(/^\s*\d+(?:\.\d+)?\s*-\s*/, '').trim();
}

/** "22:08" / "1:02:03" → seconds; anything else → 0. */
export function parseDuration(s) {
  const parts = String(s || '').trim().split(':').map(Number);
  if (!parts.length || parts.some((n) => !Number.isFinite(n))) return 0;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

/** player.html's own rule: the last 30 s or ≥ 98 % counts as finished. */
export function nearEnd(pos, dur) {
  const d = Number(dur) || 0;
  return d > 0 && (pos >= d - 30 || pos >= d * 0.98);
}

function normSrc(u) {
  try { const x = new URL(u, location.href); x.hash = ''; return x.href; } catch (_) { return String(u || ''); }
}

function episodeOfPath(path) {
  const m = /\/episodes\/episode-(\d+)(?:\.html)?\/?$/.exec(path || '');
  return m ? Number(m[1]) : null;
}

function catalog() {
  if (!catalogP) {
    // Same URL and cache mode as clip-audio's episodeCatalog(), so the two
    // share one HTTP-cache entry instead of fetching 500 KB twice.
    catalogP = fetch('/dentcast.json?v=3', { cache: 'force-cache' })
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => (Array.isArray(j) ? j : []))
      .catch(() => []);
  }
  return catalogP;
}

function fromCatalog(ep) {
  return {
    episode: Number(ep.episode),
    title: cleanTitle(ep.title),
    page: ep.page_url || null,
    src: ep.audio_url || '',
    d: parseDuration(ep.duration),
  };
}

/** What an adopted element is: given by the caller, read off the episode page, or looked up by file. */
async function metaFor(audioEl, given) {
  if (given && given.episode != null) return { ...given, episode: Number(given.episode) };
  const pageEp = episodeOfPath(location.pathname);
  if (pageEp != null && audioEl.id === 'ep-audio') {
    const h = document.querySelector('.ep-title') || document.querySelector('h1');
    return {
      episode: pageEp,
      title: cleanTitle(h ? h.textContent : document.title),
      page: location.pathname,
      src: audioEl.getAttribute('src') || audioEl.currentSrc || audioEl.src || '',
      d: 0,
    };
  }
  const src = normSrc(audioEl.currentSrc || audioEl.src);
  if (!src) return null;
  // The episode listened to last is usually the one playing again.
  const cached = readJSON(localStorage, META_KEY);
  if (cached && cached.src && normSrc(cached.src) === src && cached.episode != null) return cached;
  const hit = (await catalog()).find((e) => normSrc(e.audio_url) === src);
  return hit ? fromCatalog(hit) : null;
}

/** Meta for an episode NUMBER (the resume record carries only that). */
async function metaForEpisode(n) {
  const cached = readJSON(localStorage, META_KEY);
  if (cached && Number(cached.episode) === Number(n) && cached.src) return cached;
  const hit = (await catalog()).find((e) => Number(e.episode) === Number(n));
  if (!hit) return null;
  const m = fromCatalog(hit);
  writeJSON(localStorage, META_KEY, m);
  return m;
}

// ── the record ─────────────────────────────────────────────────────────────

function signedIn() {
  try { return localStorage.getItem('dcp:signed-in') === '1'; } catch (_) { return false; }
}

function pushServer(rec, force) {
  if (!signedIn()) return;
  const now = Date.now();
  if (!force && now - lastServerSave < SERVER_EVERY_MS) return;
  lastServerSave = now;
  const body = JSON.stringify({ episode: rec.episode, position: rec.position, anchor: rec.anchor, speed: rec.speed });
  // apiBase() answers with a PROMISE (it may still be probing the mirrors).
  // Concatenated as a string it became «[object Promise]/player/state», a
  // relative URL on the page's own host, so no position ever reached the
  // account from these players (found walking the site, 1405/07/01).
  Promise.resolve(apiBase()).then((base) => fetch(base + '/player/state', {
    method: 'PUT',
    credentials: 'include',
    keepalive: !!force,
    headers: { 'content-type': 'application/json' },
    body,
  })).catch(() => { /* the local record is there either way */ });
}

function save(audioEl, force) {
  const st = adopted.get(audioEl);
  const m = st && st.meta;
  if (!m || !st.played || st.restoring) return;
  const now = Date.now();
  if (!force && now - st.lastSave < SAVE_EVERY_MS) return;
  st.lastSave = now;
  const prev = readJSON(localStorage, RESUME_KEY) || {};
  const same = Number(prev.episode) === m.episode;
  const rec = {
    episode: m.episode,
    position: audioEl.currentTime || 0,
    // player.html's auto-advance anchor: kept while the same episode runs on.
    anchor: same && prev.anchor != null ? prev.anchor : m.episode,
    // A page player at 1× says nothing about the listener's chosen speed, so
    // only a real change overwrites what player.html stored.
    speed: audioEl.playbackRate && audioEl.playbackRate !== 1 ? audioEl.playbackRate : (prev.speed != null ? prev.speed : 1),
    t: now,
  };
  writeJSON(localStorage, RESUME_KEY, rec);
  const d = Number.isFinite(audioEl.duration) && audioEl.duration > 0 ? audioEl.duration : m.d || 0;
  writeJSON(localStorage, META_KEY, { episode: m.episode, title: m.title, page: m.page, src: m.src, d });
  pushServer(rec, force);
}

// ── lock screen ────────────────────────────────────────────────────────────

let msWired = false;
function mediaSession(audioEl) {
  const ms = typeof navigator !== 'undefined' ? navigator.mediaSession : null;
  if (!ms) return;
  const st = adopted.get(audioEl);
  const m = st && st.meta;
  if (m && typeof window.MediaMetadata === 'function') {
    try {
      ms.metadata = new window.MediaMetadata({
        title: m.title || 'قسمت ' + faNum(m.episode),
        artist: ARTIST,
        album: ALBUM,
        artwork: ARTWORK,
      });
    } catch (_) { /* ignore */ }
  }
  if (msWired) return;
  msWired = true;
  const on = (action, fn) => { try { ms.setActionHandler(action, fn); } catch (_) { /* unsupported action */ } };
  const a = () => active;
  on('play', () => { const x = a(); if (x) x.play().catch(() => {}); });
  on('pause', () => { const x = a(); if (x) x.pause(); });
  on('seekbackward', (d) => { const x = a(); if (x) x.currentTime = Math.max(0, x.currentTime - ((d && d.seekOffset) || SKIP_S)); });
  on('seekforward', (d) => {
    const x = a(); if (!x) return;
    const to = x.currentTime + ((d && d.seekOffset) || SKIP_S);
    x.currentTime = Number.isFinite(x.duration) ? Math.min(x.duration, to) : to;
  });
  on('seekto', (d) => { const x = a(); if (x && d && Number.isFinite(d.seekTime)) x.currentTime = d.seekTime; });
}
function msState(v) {
  try { if (navigator.mediaSession) navigator.mediaSession.playbackState = v; } catch (_) { /* ignore */ }
}

// ── exclusivity ────────────────────────────────────────────────────────────

/** Pause every player except `keep`: adopted ones, player.html iframes, and (via event) dc-nav's music. */
/** Pause an adopted player on the hub's own account. The mark outlives the
 *  call because a browser fires `pause` a task later, not inside pause(). */
function yieldPlayer(a, st) {
  if (a.paused) return;
  st.yielded = true;
  try { a.pause(); } catch (_) { /* ignore */ }
}

function pauseOthers(keep) {
  adopted.forEach((st, a) => { if (a !== keep) yieldPlayer(a, st); });
  document.querySelectorAll('iframe').forEach((f) => {
    try {
      const x = f.contentDocument && f.contentDocument.getElementById('dc-audio');
      if (x && !x.paused) x.pause();
    } catch (_) { /* cross-origin — not ours */ }
  });
  try { document.dispatchEvent(new CustomEvent('dc:audio-exclusive')); } catch (_) { /* ignore */ }
}

/** Something outside the hub (player.html, the header music) started: step aside. */
export function pauseOwn() {
  adopted.forEach((st, a) => yieldPlayer(a, st));
  if (bar) closeBar(false);
}

// ── adoption ───────────────────────────────────────────────────────────────

// The listening signal (episode_listened, via plus.js's shared-player hook) for
// the hub's players that live in NO page: its own bar and the homepage hero.
// The hero used to have none — a whole episode heard from the homepage's play
// button counted for nothing in «اپیزودها»'s progress (1405/07/02). One
// tracker at a time, handed over only when a different element takes the air,
// so pausing and resuming the same player does not reset what it has heard.
let listenFor = null;
function trackListen(audioEl, episode) {
  if (!audioEl || !episode || listenFor === audioEl) return;
  listenFor = audioEl;
  try { if (window.dcpTrackListening) window.dcpTrackListening('episodes/episode-' + episode, audioEl); } catch (_) { /* ignore */ }
}

/** adopt() for a player handed over from outside (the homepage hero). */
function adoptHanded(audioEl, meta) {
  const st = adopt(audioEl, meta);
  if (audioEl && meta && meta.episode && !audioEl.isConnected) {
    audioEl.addEventListener('play', () => trackListen(audioEl, meta.episode));
    if (!audioEl.paused) trackListen(audioEl, meta.episode);
  }
  return st;
}

/**
 * Take `audioEl` under the hub. `meta` ({episode, title, page, src, d}) is
 * optional — without it the element is identified by its page or its file.
 * Idempotent; returns the element's state.
 */
export function adopt(audioEl, meta = null) {
  if (!audioEl) return null;
  const known = adopted.get(audioEl);
  if (known) return known;
  // inDoc: was this element ever part of the page? The hero's Audio never is,
  // so «not connected» on its pause means nothing — only an element that WAS
  // in the document and is no longer has been taken out of it.
  const st = { meta: null, metaP: null, armed: true, played: false, restoring: false, lastSave: 0, wasPlaying: false, yielded: false, inDoc: audioEl.isConnected };
  adopted.set(audioEl, st);
  st.metaP = metaFor(audioEl, meta).then((m) => { st.meta = m; return m; }).catch(() => null);

  audioEl.addEventListener('play', () => { if (audioEl.isConnected) st.inDoc = true; onPlay(audioEl); });
  audioEl.addEventListener('playing', () => { st.wasPlaying = true; msState('playing'); });
  audioEl.addEventListener('timeupdate', () => {
    if (!audioEl.paused) st.wasPlaying = true;
    save(audioEl, false);
  });
  audioEl.addEventListener('seeking', () => { if (!st.played) st.armed = false; });
  audioEl.addEventListener('pause', () => {
    save(audioEl, true);
    const was = st.wasPlaying;
    const yielded = st.yielded;
    st.wasPlaying = false;
    st.yielded = false;
    if (active === audioEl) msState('paused');
    // The desktop shell swaps column C's markup, and a media element taken out
    // of its document is paused by the browser. The shell itself is never
    // reloaded, so the hub can carry the episode on in an Audio of its own.
    // Never when the hub itself paused it to let another player speak.
    if (was && st.inDoc && !yielded && !audioEl.isConnected && audioEl !== (bar && bar.audio)) handoffDetached(audioEl);
  });
  audioEl.addEventListener('ended', () => save(audioEl, true));
  return st;
}

function onPlay(audioEl) {
  const st = adopted.get(audioEl);
  if (!st) return;
  active = audioEl;
  pauseOthers(audioEl);
  if (bar && bar.audio !== audioEl) closeBar(false);
  const first = !st.played;
  st.played = true;
  st.lastSave = Date.now(); // the first write waits a beat: position 0.2 is not news
  st.metaP.then(() => mediaSession(audioEl));
  if (first && st.armed) restoreOnFirstPlay(audioEl, st);
  st.armed = false;
}

/** The episode page's player picks up where ANY player left this episode. */
function restoreOnFirstPlay(audioEl, st) {
  if (segmentActive(audioEl) || (audioEl.currentTime || 0) >= 2) return; // a clip, or a deliberate seek
  const rec = readJSON(localStorage, RESUME_KEY);
  if (!rec || rec.episode == null) return;
  st.restoring = true;
  st.metaP.then((m) => {
    const pos = Number(rec.position) || 0;
    if (!m || Number(rec.episode) !== m.episode || pos < MIN_RESUME_S) { st.restoring = false; return; }
    const land = () => {
      // The duration is only certain now; a finished episode starts over.
      const dur = Number.isFinite(audioEl.duration) && audioEl.duration > 0 ? audioEl.duration : m.d || 0;
      // Somebody else placed the head in the meantime (a clip, a scrub): theirs wins.
      if (!nearEnd(pos, dur) && !segmentActive(audioEl) && (audioEl.currentTime || 0) < 2) {
        try { audioEl.currentTime = pos; } catch (_) { /* not seekable */ }
      }
      st.restoring = false;
    };
    // Seek only once data is there — the CDN wedge player.html documents.
    if (audioEl.readyState >= 3) land();
    else audioEl.addEventListener('canplay', land, { once: true });
  });
}

function onDocPlay(e) {
  const t = e.target;
  if (typeof HTMLAudioElement === 'undefined' || !(t instanceof HTMLAudioElement)) return;
  if (t.id === 'dc-audio') { pauseOwn(); return; } // standalone /player.html keeps its own books
  // Adopting here is enough: this is the capture phase at the document, and a
  // listener added to the target before the event reaches it still fires —
  // calling onPlay by hand as well ran it twice.
  if (!adopted.has(t)) adopt(t);
}

// ── the resume bar ─────────────────────────────────────────────────────────

const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';

function placeBar() {
  if (!bar) return;
  const nav = document.getElementById('dcBottomNav');
  let lift = 0;
  if (nav) {
    const r = nav.getBoundingClientRect();
    if (r.height && getComputedStyle(nav).display !== 'none') lift = r.height;
  }
  bar.root.style.setProperty('--dcp-abar-lift', lift + 'px');
  const top = bar.root.getBoundingClientRect().top;
  if (top) document.body.style.setProperty('--dcp-abar-top', Math.round(window.innerHeight - top) + 'px');
}

function closeBar(dismiss) {
  if (!bar) return;
  const b = bar;
  bar = null;
  if (dismiss) {
    const rec = readJSON(localStorage, RESUME_KEY);
    if (rec && rec.t != null) writeJSON(localStorage, DISMISS_KEY, rec.t);
  }
  try { if (!b.audio.paused) b.audio.pause(); } catch (_) { /* ignore */ }
  window.removeEventListener('resize', placeBar);
  b.root.remove();
  document.body.classList.remove('dcp-has-abar');
  document.body.style.removeProperty('--dcp-abar-top');
}

function showBar(meta, pos, speed, tryAuto) {
  if (bar) closeBar(false);
  const audio = new Audio();
  audio.preload = 'none';
  audio.src = meta.src;
  const rate = Number(speed) > 0 ? Number(speed) : 1;
  audio.defaultPlaybackRate = rate;
  audio.playbackRate = rate;
  const st = adopt(audio, meta);
  st.armed = false; // the bar seeks for itself below

  const dur = meta.d || 0;
  const playBtn = el('button', { type: 'button', class: 'dcp-abar-play', 'aria-label': 'ادامه‌ی پخش', html: ICON_PLAY });
  const time = el('span', { class: 'dcp-abar-time', text: fmtClock(pos) });
  const fill = el('i');
  const back = el('button', { type: 'button', class: 'dcp-abar-skip', 'aria-label': '۱۵ ثانیه عقب', text: '−' + faNum(SKIP_S) });
  const fwd = el('button', { type: 'button', class: 'dcp-abar-skip', 'aria-label': '۱۵ ثانیه جلو', text: '+' + faNum(SKIP_S) });
  const x = el('button', { type: 'button', class: 'dcp-abar-x', 'aria-label': 'بستن', text: '×' });
  const info = el(meta.page ? 'a' : 'span', { class: 'dcp-abar-info', href: meta.page || null }, [
    el('span', { class: 'dcp-abar-kick', text: 'ادامه‌ی شنیدن · قسمت ' + faNum(meta.episode) }),
    el('span', { class: 'dcp-abar-ttl', text: meta.title || 'قسمت ' + faNum(meta.episode) }),
  ]);
  const root = el('div', { class: 'dcp-abar', role: 'region', 'aria-label': 'ادامه‌ی شنیدن' }, [
    el('div', { class: 'dcp-abar-prog', 'aria-hidden': 'true' }, [fill]),
    playBtn, info, time, back, fwd, x,
  ]);
  const paint = () => {
    const t = audio.currentTime || pos;
    time.textContent = fmtClock(t);
    const d = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : dur;
    fill.style.width = d ? Math.min(100, (t / d) * 100) + '%' : '0%';
    const on = !audio.paused;
    playBtn.innerHTML = on ? ICON_PAUSE : ICON_PLAY;
    playBtn.setAttribute('aria-label', on ? 'مکث' : 'ادامه‌ی پخش');
    root.classList.toggle('is-playing', on);
  };

  let started = false;
  const start = () => {
    started = true;
    st.restoring = true;
    // play() inside the tap, muted, so iOS counts the gesture; sound comes
    // back once the head is on the saved second (clip-audio's playSegment move).
    audio.muted = true;
    const p = (() => { try { return Promise.resolve(audio.play()); } catch (e) { return Promise.reject(e); } })();
    p.catch(() => {});
    // play() has already started the fetch, so this waits for data and nothing
    // more. Never seekWhenReady() here: on an element play() has only just
    // asked for, networkState is not LOADING yet, so it calls load() — and
    // load() aborts that very play() (AbortError; found in Chromium, 1405/07/01).
    const land = () => {
      try { audio.currentTime = pos; } catch (_) { /* not seekable */ }
      st.restoring = false;
      audio.muted = false;
      paint();
    };
    if (audio.readyState >= 3) land();
    else audio.addEventListener('canplay', land, { once: true });
    return p;
  };
  playBtn.addEventListener('click', () => {
    if (!started) { start(); return; }
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });
  back.addEventListener('click', () => { if (!started) return; audio.currentTime = Math.max(0, audio.currentTime - SKIP_S); });
  fwd.addEventListener('click', () => {
    if (!started) return;
    const to = audio.currentTime + SKIP_S;
    audio.currentTime = Number.isFinite(audio.duration) ? Math.min(audio.duration, to) : to;
  });
  x.addEventListener('click', () => closeBar(true));
  ['play', 'pause', 'timeupdate', 'seeked'].forEach((ev) => audio.addEventListener(ev, paint));
  audio.addEventListener('ended', () => closeBar(false));

  bar = { root, audio, start };
  // The shared-player hook: listening from the bar counts toward
  // episode_listened exactly as listening from player.html does.
  trackListen(audio, meta.episode);
  document.body.appendChild(root);
  document.body.classList.add('dcp-has-abar');
  placeBar();
  window.addEventListener('resize', placeBar);
  paint();

  if (tryAuto) {
    // The listener left the last page mid-play. Carry on if the browser allows
    // sound without a tap; if it does not, unmuting pauses the element and the
    // bar simply waits, paused, for the one tap.
    start().catch(() => { started = false; paint(); });
  }
  return bar;
}

function handoffDetached(audioEl) {
  const st = adopted.get(audioEl);
  if (!st || !st.meta) return;
  const rec = readJSON(localStorage, RESUME_KEY);
  showBar(st.meta, audioEl.currentTime || 0, rec && rec.speed, true);
}

/** Decide, on arrival, whether this page should offer to carry on listening. */
export async function offerResume() {
  if (location.pathname === '/player.html') return;
  const hand = readJSON(sessionStorage, HANDOFF_KEY);
  removeKey(sessionStorage, HANDOFF_KEY);
  const rec = readJSON(localStorage, RESUME_KEY);
  if (!rec || rec.episode == null) return;
  const ep = Number(rec.episode);
  const fresh = !!(hand && Number(hand.episode) === ep && Date.now() - (Number(hand.t) || 0) < HANDOFF_FRESH_MS);
  const pos = fresh ? Number(hand.position) || 0 : Number(rec.position) || 0;

  // This episode's own page: its player restores on the first press.
  const pageEl = document.getElementById('ep-audio');
  if (pageEl && episodeOfPath(location.pathname) === ep) return;

  if (!fresh) {
    if (Date.now() - (Number(rec.t) || 0) > STALE_MS) return;
    if (pos < MIN_RESUME_S) return;
    if (readJSON(localStorage, DISMISS_KEY) === rec.t) return;
  }
  const meta = await metaForEpisode(ep);
  if (!meta || !meta.src || nearEnd(pos, meta.d)) return;
  if (active && !active.paused) return; // something is already playing here
  showBar(meta, pos, rec.speed, fresh);
}

// ── boot ───────────────────────────────────────────────────────────────────

/** Leaving a page mid-play: note it for the next page of THIS tab. */
function onPageHide() {
  if (active) save(active, true);
  if (active && !active.paused) {
    const st = adopted.get(active);
    if (st && st.meta) writeJSON(sessionStorage, HANDOFF_KEY, { episode: st.meta.episode, position: active.currentTime || 0, t: Date.now() });
  }
}

export function initAudioHub() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  // Inside a frame (the header drawer, the desktop viewer): the top window
  // owns listening; a frame only asks it to step aside when it starts.
  if (window.self !== window.top) {
    document.addEventListener('play', () => {
      try { if (window.top.dcAudioHub) window.top.dcAudioHub.pauseOwn(); } catch (_) { /* cross-origin */ }
    }, true);
    return;
  }
  if (window.dcAudioHub) return;
  window.dcAudioHub = { adopt: adoptHanded, pauseOwn };
  document.addEventListener('play', onDocPlay, true);
  const pageEl = document.getElementById('ep-audio');
  if (pageEl) adopt(pageEl);
  const pending = window.dcAudioPending;
  if (Array.isArray(pending)) {
    window.dcAudioPending = null;
    pending.forEach(([a, m]) => { const st = adoptHanded(a, m); if (a && !a.paused) onPlay(a); return st; });
  }
  window.addEventListener('pagehide', onPageHide);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && active) save(active, true);
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted && !bar) offerResume(); });
  offerResume();
}

/** Test seam: forget every adoption and the catalog promise. */
export function _resetAudioHubForTests() {
  if (bar) closeBar(false);
  adopted.clear();
  active = null;
  listenFor = null;
  catalogP = null;
  lastServerSave = 0;
  msWired = false;
  try { delete window.dcAudioHub; } catch (_) { window.dcAudioHub = undefined; }
}
