// Listening-completion tracker — the audio twin of reading.js. Fires an
// `episode_listened` activity once a signed-in listener has actually heard
// LISTEN_FRACTION of an episode's real duration (clamped LISTEN_MIN_S..MAX_S),
// and fires it AGAIN on a later day if they listen again: re-hearing an episode
// pays (once per league week — see score.ts / league.ts, which price it; this
// file only decides when a listen HAPPENED, never what it is worth).
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
import { sendCompletion } from './outbox.js?v=257';
import { signalStreakActivity, tehranDay } from './util.js?v=257';
import {
  LISTEN_FRACTION, LISTEN_MIN_S, LISTEN_MAX_S, LS_LISTEN_AT, LS_LISTEN_ACC, LISTEN_ACC_MAX_AGE_MS,
} from './config.js?v=257';

// Date.now()-based so the day follows the same clock as every other time here.
const dayOf = (ms) => tehranDay(new Date(ms));

function readBank(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || 'null');
    if (!v || typeof v.s !== 'number' || !(v.s >= 0)) return 0;
    if (Date.now() - (Number(v.t) || 0) > LISTEN_ACC_MAX_AGE_MS) { localStorage.removeItem(key); return 0; }
    return v.s;
  } catch (_) { return 0; }
}
function writeBank(key, s) {
  try { localStorage.setItem(key, JSON.stringify({ s, t: Date.now() })); } catch (_) { /* private mode */ }
}
function dropBank(key) { try { localStorage.removeItem(key); } catch (_) { /* ignore */ } }

// Headroom on the wall-clock ceiling below, for tick jitter and for a playback
// rate that changes part-way through a tick.
const RATE_TOLERANCE = 1.5;

export function initListeningTracker({ contentId, audioEl }) {
  if (!contentId || !audioEl) return null;

  // At most one post per episode per Tehran day — not once per session,
  // because a re-listen is worth something (once per league week, priced
  // server-side), and not per 20h window, which skipped a real streak day
  // whenever two sittings were less than 20 hours apart across midnight.
  //
  // The gate only suppresses duplicate posts; the payment rules live on the
  // server, so being generous here costs nothing but a log row — and that row
  // is what keeps a re-listener's streak alive on the day they hear it again.
  const atKey = LS_LISTEN_AT + contentId;
  let lastAt = 0;
  try { lastAt = Number(localStorage.getItem(atKey) || 0); } catch (_) { /* no storage */ }
  if (lastAt && dayOf(lastAt) === dayOf(Date.now())) return null;

  // Seconds heard on earlier pages (LS_LISTEN_ACC). This page's own play is
  // added in `unsaved` and folded into the bank every few seconds, ADDITIVELY
  // (read-add-write), so two trackers for one episode — the shell swapping
  // players, the hub's bar taking over — never overwrite each other's time.
  const bankKey = LS_LISTEN_ACC + contentId;
  let unsaved = 0;
  const saveBank = () => {
    if (unsaved <= 0) return;
    writeBank(bankKey, readBank(bankKey) + unsaved);
    unsaved = 0;
  };
  const heardS = () => readBank(bankKey) + unsaved;

  let playedS = 0;       // accumulated seconds of REAL forward playback (this page)
  let lastTime = null;   // audioEl.currentTime at the previous credited tick
  let lastWall = 0;      // Date.now() at that same tick
  let fired = false;

  // Threshold scales with THIS episode's duration; until metadata is known we
  // fall back to the floor so a very short clip can still complete promptly.
  function thresholdS() {
    const dur = audioEl.duration;
    if (!dur || !isFinite(dur)) return LISTEN_MIN_S;
    return Math.min(LISTEN_MAX_S, Math.max(LISTEN_MIN_S, dur * LISTEN_FRACTION));
  }

  // Fold the media time advanced since the last tick into playedS, capped by
  // what the wall clock could physically account for: you cannot have heard more
  // media-seconds than (elapsed seconds × playback rate). A pause gives delta≈0,
  // a backward seek gives a negative delta, and a scrub to the end asks for ~20
  // minutes of media across ~200ms of wall time — the ceiling rejects it.
  //
  // Date.now(), NOT performance.now(): the clock has to keep counting while the
  // page is SUSPENDED (phone locked, app switched, background tab), because that
  // is precisely the span we must credit. This replaces a fixed 5s tick-gap cap,
  // which treated every suspension as a seek — the media kept playing, timeupdate
  // stopped firing, and the one huge delta on resume was thrown away, so
  // listening to a whole episode with the screen off earned nothing at all.
  // A monotonic clock is not needed: a backward wall-clock jump only zeroes the
  // ceiling for a single tick and then re-baselines.
  function credit() {
    const t = audioEl.currentTime || 0;
    const now = Date.now();
    if (lastTime !== null) {
      const delta = t - lastTime;
      const allowed = ((now - lastWall) / 1000) * (audioEl.playbackRate || 1) * RATE_TOLERANCE;
      if (delta > 0) {
        const add = Math.min(delta, Math.max(0, allowed));
        playedS += add;
        unsaved += add;
        if (unsaved >= 5) saveBank();
      }
    }
    lastTime = t;
    lastWall = now;
  }

  function onTime() {
    credit();
    if (!fired && heardS() >= thresholdS()) complete();
  }

  // A seek resets the reference point WITHOUT crediting the skipped span. This
  // stays the primary anti-scrub guard; the ceiling above is the backstop for a
  // position jump that arrives without a seeking event.
  function onSeeking() { lastTime = null; lastWall = Date.now(); }

  function complete() {
    fired = true;
    cleanup();
    // The bank has done its job: the next report of this episode (another day)
    // starts from zero, the same threshold as anyone's first.
    unsaved = 0;
    dropBank(bankKey);
    // Queued first, sent second (outbox.js): the 20h de-dup stamp is written
    // only once the server has accepted the listen. Stamping first — as this
    // did until 1405/07/02 — meant a send lost to a navigation or a network
    // blink was never retried, and the next 20 hours refused to try again.
    // The flame lights once the server HAS the listen — lighting it on send
    // told a listener whose request never landed that the day was kept.
    sendCompletion('episode_listened', contentId).then((ok) => {
      if (!ok) return;
      try { localStorage.setItem(atKey, String(Date.now())); } catch (_) { /* private mode */ }
      signalStreakActivity();
    });
  }

  // Reaching the end counts ONLY if it was genuinely played through — this both
  // (a) blocks the "drag the scrubber to the end" exploit (then playedS is tiny)
  // and (b) lets a clip SHORTER than LISTEN_MIN_S complete (its threshold floor
  // is unreachable by real play, but hearing ~all of it should still count).
  // credit() runs first: if the page was suspended for the tail of the episode,
  // the final timeupdate may never be delivered and `ended` is the only event
  // that arrives — the span it closes is real playback and must still count.
  function onEnded() {
    if (fired) return;
    credit();
    const dur = audioEl.duration || 0;
    const heard = heardS();
    if (heard >= thresholdS() || (dur > 0 && heard >= dur * 0.85)) complete();
    else saveBank();
  }

  // A pause, a hidden tab or a page going away is where a sitting ends: bank
  // what this page heard so the next page carries on from it.
  function onPause() { if (!fired) saveBank(); }

  function onHidden() { if (document.hidden) onPause(); }

  function cleanup() {
    audioEl.removeEventListener('timeupdate', onTime);
    audioEl.removeEventListener('seeking', onSeeking);
    audioEl.removeEventListener('ended', onEnded);
    audioEl.removeEventListener('pause', onPause);
    try {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', onPause);
    } catch (_) { /* no window */ }
  }

  audioEl.addEventListener('timeupdate', onTime);
  audioEl.addEventListener('seeking', onSeeking);
  audioEl.addEventListener('ended', onEnded);
  audioEl.addEventListener('pause', onPause);
  try {
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPause);
  } catch (_) { /* no window */ }

  // Handle so a shared player (player.html) can tear this down when it swaps to
  // a different episode and start a fresh tracker for the new content_id. A
  // stop banks what was heard first: the swap ends this sitting, not the
  // listener's progress through the episode.
  return { stop: () => { if (!fired) saveBank(); cleanup(); }, contentId };
}
