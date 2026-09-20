// قطعه‌های صوتی — the audio engine every clip surface shares.
//
// A clip is two numbers on the episode's own file; nothing is cut and nothing
// is uploaded. Playing one is: seek the <audio> to start_s, watch timeupdate,
// pause at end_s. This module owns that and only that, so the episode page,
// the shared player (/player.html) and the دفترچه's mini player all play a
// clip the same way — and stop at the same place.
//
// Two facts about <audio> that the code below is shaped by:
//   · seeking BEFORE the element has any data can wedge it on some CDNs
//     (player.html documents this — currentTime reports the target forever
//     while playback never leaves zero), so a seek waits for `canplay`;
//   · on iOS the first play() must come from a user gesture, so playSegment()
//     calls play() synchronously inside the tap, muted, and unmutes once the
//     seek has landed — no audible bleed from wherever the element was.
import { faNum } from './util.js?v=105';

/** «07:27» — mm:ss, or h:mm:ss past the hour; Latin digits, tabular in CSS. */
export function fmtClock(s) {
  const t = Math.max(0, Math.floor(Number(s) || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  const mm = (h ? String(m).padStart(2, '0') : String(m).padStart(2, '0'));
  return (h ? h + ':' : '') + mm + ':' + String(sec).padStart(2, '0');
}

/** «۳۶ ثانیه» / «۱ دقیقه و ۵۱ ثانیه» — a clip's length, spoken. */
export function fmtLength(seconds) {
  const t = Math.max(0, Math.floor(Number(seconds) || 0));
  const m = Math.floor(t / 60);
  const s = t % 60;
  if (!m) return faNum(s) + ' ثانیه';
  if (!s) return faNum(m) + ' دقیقه';
  return faNum(m) + ' دقیقه و ' + faNum(s) + ' ثانیه';
}

/**
 * «episodes/episode-101» → 101, «episodes/episode-106-1» → 106.1 (player.html's
 * epSlug writes the catalog's «106.1» with a dash in the page slug), or null for
 * anything that is not an episode.
 */
export function episodeNumber(contentId) {
  const m = /^episodes\/episode-(\d+)(?:-(\d+))?$/.exec(String(contentId || ''));
  if (!m) return null;
  return Number(m[2] ? m[1] + '.' + m[2] : m[1]);
}

/** «21:46» / «1:02:03» from dentcast.json → seconds; null when unreadable. */
export function parseClock(text) {
  const parts = String(text || '').trim().split(':').map((p) => Number(p));
  if (!parts.length || parts.some((n) => !Number.isFinite(n))) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

// --- the episode catalog ---------------------------------------------------
// /dentcast.json is what /player.html plays from: one row per episode with its
// audio_url and duration. The دفترچه needs the same two facts to play a clip
// without opening the episode, and this is the only place they live outside
// the episode pages themselves. Fetched once, on first need, never at boot.
let catalog = null;
export async function episodeCatalog() {
  if (!catalog) {
    catalog = fetch('/dentcast.json?v=3', { cache: 'force-cache' })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows) => {
        const map = new Map();
        for (const row of Array.isArray(rows) ? rows : []) {
          const n = Number(row && row.episode);
          if (Number.isFinite(n) && row.audio_url) {
            map.set(n, { audio_url: row.audio_url, duration_s: parseClock(row.duration), title: row.title || '' });
          }
        }
        return map;
      })
      .catch(() => new Map());
  }
  return catalog;
}

/** Test-only: forget the fetched catalog. */
export function resetEpisodeCatalog() { catalog = null; }

// --- segment playback ------------------------------------------------------
// One watcher per <audio> element: starting a second segment on the same
// element replaces the first, and a plain pause by the listener ends it.
const watchers = new WeakMap();

function clearWatcher(audioEl) {
  const w = watchers.get(audioEl);
  if (!w) return;
  audioEl.removeEventListener('timeupdate', w.onTime);
  audioEl.removeEventListener('pause', w.onPause);
  audioEl.removeEventListener('ended', w.onPause);
  watchers.delete(audioEl);
  if (w.onDone) w.onDone(w.reason || 'stopped');
}

/** Is `audioEl` currently inside a playSegment() run? */
export function segmentActive(audioEl) {
  return watchers.has(audioEl);
}

/**
 * Seek `audioEl` to `t` as soon as it CAN be seeked, then resolve.
 * Loading is started if it has not been (preload="none" pages), and the
 * seek itself waits for data so the CDN wedge above cannot happen.
 */
export function seekWhenReady(audioEl, t) {
  return new Promise((resolve) => {
    const target = Math.max(0, Number(t) || 0);
    const doSeek = () => {
      try { audioEl.currentTime = target; } catch (_) { /* not seekable yet */ }
      resolve();
    };
    // HAVE_FUTURE_DATA (3) or better: data is there, seek now.
    if (audioEl.readyState >= 3) { doSeek(); return; }
    const once = () => { audioEl.removeEventListener('canplay', once); doSeek(); };
    audioEl.addEventListener('canplay', once);
    if (audioEl.preload === 'none') audioEl.preload = 'auto';
    // HAVE_NOTHING and not already fetching (NETWORK_LOADING is 2) — the
    // preload="none" case, where the element sits idle until something asks:
    // load() starts the fetch. Never called on an element that has data, so a
    // playing shared player is never reset by a seek.
    if (audioEl.readyState === 0 && audioEl.networkState !== 2) {
      try { audioEl.load(); } catch (_) { /* ignore */ }
    }
  });
}

/**
 * Play [start, end) on `audioEl` and pause at the end. Call it FROM the tap.
 *
 * `onTick(t)` fires on every timeupdate inside the segment (for a progress
 * bar), `onDone(reason)` once, with 'ended' (reached end_s), 'stopped' (the
 * listener paused or something else took the element) or 'replaced' (another
 * segment started on the same element).
 */
export function playSegment(audioEl, { start, end, onTick = null, onDone = null }) {
  const from = Math.max(0, Number(start) || 0);
  const to = Number(end);
  const prev = watchers.get(audioEl);
  if (prev) { prev.reason = 'replaced'; clearWatcher(audioEl); }

  const w = { onDone, reason: null, armed: false };
  w.onTime = () => {
    if (!w.armed) return;
    const t = audioEl.currentTime || 0;
    if (onTick) onTick(t);
    if (Number.isFinite(to) && t >= to - 0.05) {
      w.reason = 'ended';
      try { audioEl.pause(); } catch (_) { /* ignore */ }
      // Land exactly on the end so the bar reads «full», then let the pause
      // handler below file the reason.
      try { audioEl.currentTime = to; } catch (_) { /* ignore */ }
      clearWatcher(audioEl);
    }
  };
  w.onPause = () => { if (w.armed) clearWatcher(audioEl); };
  watchers.set(audioEl, w);
  audioEl.addEventListener('timeupdate', w.onTime);
  audioEl.addEventListener('pause', w.onPause);
  audioEl.addEventListener('ended', w.onPause);

  // The gesture-unlock: play() now, muted, so iOS counts this tap; the seek
  // lands asynchronously and only then does sound come through.
  const wasMuted = audioEl.muted;
  audioEl.muted = true;
  const playP = (() => { try { return Promise.resolve(audioEl.play()); } catch (e) { return Promise.reject(e); } })();
  playP.catch(() => { /* autoplay refused: the seek below still positions the element */ });

  return seekWhenReady(audioEl, from).then(() => {
    if (watchers.get(audioEl) !== w) return; // replaced while loading
    audioEl.muted = wasMuted;
    w.armed = true;
    if (audioEl.paused) {
      try { audioEl.play().catch(() => {}); } catch (_) { /* ignore */ }
    }
    if (onTick) onTick(audioEl.currentTime || from);
  });
}

/** Stop the segment run on `audioEl` (pausing it). No-op when none is running. */
export function stopSegment(audioEl) {
  if (!watchers.has(audioEl)) return;
  try { audioEl.pause(); } catch (_) { /* ignore */ }
  clearWatcher(audioEl);
}
