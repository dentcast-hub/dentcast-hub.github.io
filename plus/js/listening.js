// Listening-completion tracker — the audio twin of reading.js. Fires a single
// `episode_listened` activity once a signed-in listener has actually heard
// LISTEN_FRACTION of an episode's real duration (clamped LISTEN_MIN_S..MAX_S).
//
// Why this exists: reading.js closed the "plain reading earns nothing" gap for
// text, but for a podcast-first site LISTENING was still invisible — a user who
// only listened produced no activity, no streak, and (crucially) no history for
// the pathway/recommendation layer to see. This closes that: listening now logs
// like reading does, and the header streak flame lights live.
//
// Real play only: we accumulate the forward delta of `currentTime` between
// timeupdate ticks, ignoring pauses and seeks (a jump to the end is a large or
// negative delta and is discarded), so seeking to the finish cannot fake it.
import { api } from './api.js';
import { signalStreakActivity } from './util.js';
import { LISTEN_FRACTION, LISTEN_MIN_S, LISTEN_MAX_S, SS_LISTEN_DONE } from './config.js';

// Max plausible gap between two timeupdate ticks of genuine playback (seconds).
// A larger jump is a seek/scrub, not listening, so its delta is not credited.
const MAX_TICK_GAP_S = 5;

export function initListeningTracker({ contentId, audioEl }) {
  if (!contentId || !audioEl) return null;

  // Once per episode per browser session (same rule as reading). A repeat within
  // the same Tehran day changes neither score nor active-day server-side, but
  // there is no reason to send it twice.
  const doneKey = SS_LISTEN_DONE + contentId;
  if (sessionStorage.getItem(doneKey)) return null;

  let playedS = 0;       // accumulated seconds of REAL forward playback
  let lastTime = null;   // audioEl.currentTime at the previous credited tick
  let fired = false;

  // Threshold scales with THIS episode's duration; until metadata is known we
  // fall back to the floor so a very short clip can still complete promptly.
  function thresholdS() {
    const dur = audioEl.duration;
    if (!dur || !isFinite(dur)) return LISTEN_MIN_S;
    return Math.min(LISTEN_MAX_S, Math.max(LISTEN_MIN_S, dur * LISTEN_FRACTION));
  }

  function onTime() {
    const t = audioEl.currentTime || 0;
    if (lastTime !== null) {
      const delta = t - lastTime;
      // Credit only small forward steps: a pause gives delta≈0, a seek gives a
      // big or negative delta — neither counts as listening.
      if (delta > 0 && delta <= MAX_TICK_GAP_S) playedS += delta;
    }
    lastTime = t;
    if (!fired && playedS >= thresholdS()) complete();
  }

  // A seek resets the reference point WITHOUT crediting the skipped span.
  function onSeeking() { lastTime = null; }

  function complete() {
    fired = true;
    cleanup();
    sessionStorage.setItem(doneKey, '1');
    // Fire-and-forget: requireAuth rejects an anonymous caller quietly; this is
    // a silent background signal, exactly like reading's article_completed.
    api.activity('episode_listened', contentId).catch(() => {});
    signalStreakActivity(); // light the header flame live
  }

  // Reaching the end counts ONLY if it was genuinely played through — this both
  // (a) blocks the "drag the scrubber to the end" exploit (then playedS is tiny)
  // and (b) lets a clip SHORTER than LISTEN_MIN_S complete (its threshold floor
  // is unreachable by real play, but hearing ~all of it should still count).
  function onEnded() {
    if (fired) return;
    const dur = audioEl.duration || 0;
    if (playedS >= thresholdS() || (dur > 0 && playedS >= dur * 0.85)) complete();
  }

  function cleanup() {
    audioEl.removeEventListener('timeupdate', onTime);
    audioEl.removeEventListener('seeking', onSeeking);
    audioEl.removeEventListener('ended', onEnded);
  }

  audioEl.addEventListener('timeupdate', onTime);
  audioEl.addEventListener('seeking', onSeeking);
  audioEl.addEventListener('ended', onEnded);

  // Handle so a shared player (player.html) can tear this down when it swaps to
  // a different episode and start a fresh tracker for the new content_id.
  return { stop: cleanup, contentId };
}
