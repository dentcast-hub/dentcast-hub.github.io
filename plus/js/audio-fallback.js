// «پخش شروع نشد؟» — the episode page's way out when its own file does not come.
//
// Every episode page plays its file from Arvan, inside Iran. During a cut of
// the international link that file does not reach a reader abroad, and the
// player simply sits on 00:00 with nothing said: the Acast player that exists
// for exactly this lives on /episodes.html alone, and a reader who came from
// Google, an article link or «قسمت بعدی» never sees it.
//
// So this only ever speaks after a FAILURE: the reader pressed play and either
// the element reported an error or nothing had started PATIENCE_MS later. On a
// file that plays — every normal day, on both domains — it draws nothing.
// Phrased as a question because a slow phone can also cross the line: the note
// is a door, never a verdict, and it leaves as soon as playback starts.
//
// The link is the show on Acast, not the episode: no per-episode Acast address
// exists anywhere in the repo (dentcast.json carries the Arvan file only).
// No page carries this markup; it is drawn next to whatever #ep-audio is on the
// page, the standalone episode and the desktop shell's injected one alike.

export const PATIENCE_MS = 10000;
export const ACAST_SHOW_URL = 'https://shows.acast.com/dentcast';

const watched = new WeakMap(); // element → its play handler

function fromAcast(audioEl) {
  try { return /(^|\.)acast\.com$/.test(new URL(audioEl.currentSrc || audioEl.src, location.href).hostname); }
  catch (_) { return false; }
}

function noteFor(audioEl) {
  const wrap = audioEl.closest('.ep-player-wrap') || audioEl.parentElement;
  if (!wrap || !wrap.parentNode) return null;
  let note = wrap.parentNode.querySelector(':scope > .dc-audio-alt');
  if (note) return note;
  note = document.createElement('p');
  note.className = 'dc-audio-alt';
  note.setAttribute('role', 'status');
  note.hidden = true;
  note.append('پخش شروع نشد؟ این قسمت روی Acast هم هست. ');
  const a = document.createElement('a');
  a.href = ACAST_SHOW_URL;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = 'شنیدن در Acast ›';
  note.append(a);
  wrap.after(note);
  return note;
}

function show(audioEl) {
  const note = noteFor(audioEl);
  if (note) note.hidden = false;
}

function hide(audioEl) {
  const wrap = audioEl.closest('.ep-player-wrap') || audioEl.parentElement;
  const note = wrap && wrap.parentNode && wrap.parentNode.querySelector(':scope > .dc-audio-alt');
  if (note) note.hidden = true;
}

export function watch(audioEl) {
  if (!audioEl) return null;
  if (watched.has(audioEl)) return watched.get(audioEl);
  let timer = 0;
  const stop = () => { if (timer) { clearTimeout(timer); timer = 0; } };
  const onPlay = () => {
    if (fromAcast(audioEl)) return;
    stop();
    if (audioEl.error) { show(audioEl); return; }
    timer = setTimeout(() => {
      timer = 0;
      // Started after all, or the reader already paused: say nothing.
      if (!audioEl.paused && audioEl.readyState < 3) show(audioEl);
    }, PATIENCE_MS);
  };
  watched.set(audioEl, onPlay);
  audioEl.addEventListener('play', onPlay);
  audioEl.addEventListener('playing', () => { stop(); hide(audioEl); });
  audioEl.addEventListener('pause', stop);
  audioEl.addEventListener('error', () => { stop(); if (!fromAcast(audioEl)) show(audioEl); });
  return onPlay;
}

export function initAudioFallback() {
  const el = document.getElementById('ep-audio');
  if (el) watch(el);
  // The desktop shell injects an episode after boot; catch its first press.
  document.addEventListener('play', (e) => {
    const t = e.target;
    // Capture at the document: a listener added to the target now still fires
    // for this same press (audio-hub relies on the same rule).
    if (t && t.id === 'ep-audio') watch(t);
  }, true);
}
