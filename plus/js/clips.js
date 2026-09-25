// قطعه‌های صوتی — the capture control under a player, and the sheet after it.
//
// One row under the transport («شروع قطعه»), on both players the site owns:
// the episode page's own <audio id="ep-audio"> and the shared /player.html
// (inline on the episode page AND in the header's headphone drawer). No page
// carries this markup — the same rule as the article action row: a shared
// module puts it there, so the 210 episode pages needed no rebuild.
//
// Three ways to say where a clip is, one sheet (founder-approved mockup,
// .dentcast/audio-clips-mockup.html):
//   · start/stop while listening — the button, the primary path;
//   · two handles on a zoomed window (two minutes around the clip, so a
//     finger can place half a second) plus ±۱ nudges — inside the sheet;
//   · «or say how long» — 15/30/60/90 chips that keep the start and compute
//     the end — inside the same sheet.
//
// WHO: the button is drawn for everybody and wears amber (site-wide: «this is
// what a subscription buys»); the gate is on the TAP. Anonymous → login; free →
// the premium card; premium → recording starts. Founder decision 2026-09-13,
// argued in routes/clips.ts: audio is the one place where the value of a single
// mark is felt in full the moment it is made, so this is gated at creation.
import { el, faNum } from './util.js?v=148';
import { api, currentUser } from './api.js?v=148';
import { openLoginModal } from './login-modal.js?v=148';
import { openSheet, closeSheet, gateCard } from './sheet.js?v=148';
import { premiumCta } from './premium-cta.js?v=148';
import { LABELS } from './config.js?v=148';
import { toast } from './hl-view.js?v=148';
import {
  fmtClock, fmtLength, episodeNumber, episodeCatalog, playSegment, stopSegment, seekWhenReady,
} from './clip-audio.js?v=148';

/** A clip shorter than this is a mis-tap; the end press waits for it. */
export const MIN_CLIP_S = 1;
/** Longer than this is the episode, not a clip (mirrors routes/clips.ts). */
export const MAX_CLIP_S = 600;
/** «شروع −۱۵» — you always notice a little late that this part matters. */
const NUDGE_BACK_S = 15;
const LENGTH_CHIPS = [15, 30, 60, 90];
const SNAP_S = 0.5;

const HEADPHONES = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 14a9 9 0 0 1 18 0"/><path d="M5 14h3v7H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2z"/><path d="M19 14h-3v7h3a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2z"/></svg>';
const SCISSORS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/></svg>';
const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const STOP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h12v12H6z"/></svg>';

const snap = (t) => Math.round(t / SNAP_S) * SNAP_S;
const clamp = (t, lo, hi) => Math.min(hi, Math.max(lo, t));

// One control per <audio> element; the shared player re-mounts on every
// episode switch and must update the one it has rather than stack a second.
const controls = new WeakMap();

/** What the strip and the sheet know about the episode's length. */
function durationOf(audioEl, catalogRow) {
  const d = audioEl.duration;
  if (Number.isFinite(d) && d > 0) return d;
  return catalogRow && catalogRow.duration_s ? catalogRow.duration_s : null;
}

/**
 * Mount (or update) the clip control for one player.
 *
 * @param audioEl   the <audio> the clip is taken from
 * @param contentId «episodes/episode-101»
 * @param host      the player card the row is appended to (.ep-player-wrap / .dc-main-player)
 * @param seekEl    the transport's <input type=range>; the clip strip is drawn under it
 * @param episodeLabel optional «اپیزود ۱۰۱» for the sheet's sub line
 */
export function mountClipControl({ audioEl, contentId, host, seekEl = null, episodeLabel = null }) {
  if (!audioEl || !contentId || !host) return null;
  let c = controls.get(audioEl);
  if (c) { c.retarget(contentId, episodeLabel); return c; }
  c = buildControl({ audioEl, contentId, host, seekEl, episodeLabel });
  controls.set(audioEl, c);
  return c;
}

function buildControl({ audioEl, contentId, host, seekEl, episodeLabel }) {
  const doc = host.ownerDocument || document;
  const state = { contentId, episodeLabel, clips: [], rec: null, catalogRow: null, ticker: 0 };

  // --- the row ------------------------------------------------------------
  const btn = el('button', { class: 'dcp-clip-btn', type: 'button', 'aria-pressed': 'false' });
  const hint = el('span', { class: 'dcp-clip-hint' });
  const live = el('span', { class: 'dcp-clip-live', dir: 'ltr', hidden: true });
  const back = el('button', { class: 'dcp-clip-nudge', type: 'button', hidden: true, title: 'شروع را ' + faNum(NUDGE_BACK_S) + ' ثانیه عقب ببر' }, 'شروع −' + faNum(NUDGE_BACK_S));
  const cap = el('p', { class: 'dcp-sheet-cap dcp-clip-cap', hidden: true },
    'تکه‌ای از پادکست را با یادداشتت نگه می‌داری — همان‌طور که یک جمله را در مقاله هایلایت می‌کنی. از دفترچه‌ی هایلایت‌ها همان تکه دوباره پخش می‌شود، و می‌توانی آن را در کالکشن بگذاری.');
  const info = el('button', { class: 'dcp-wb-info', type: 'button', title: 'هایلایت صوتی یعنی چی؟', 'aria-label': 'هایلایت صوتی یعنی چی؟' }, '؟');
  info.addEventListener('click', () => { cap.hidden = !cap.hidden; });
  const row = el('div', { class: 'dcp-clip-row', 'data-dc-clip-row': '' }, [btn, live, back, hint, info, cap]);
  host.appendChild(row);

  // --- the strip under the transport's range: the reader's clips on this bar --
  const strip = el('div', { class: 'dcp-clip-strip', dir: 'ltr', 'aria-hidden': 'true' });
  if (seekEl && seekEl.parentNode) seekEl.insertAdjacentElement('afterend', strip);
  else row.insertAdjacentElement('beforebegin', strip);

  function paintIdle() {
    btn.className = 'dcp-clip-btn';
    btn.innerHTML = HEADPHONES + '<span>هایلایت صوتی</span>';
    btn.setAttribute('aria-pressed', 'false');
    btn.disabled = false;
    live.hidden = true;
    back.hidden = true;
    hint.hidden = false;
    info.hidden = false;
    // The hint says what the button DOES — «شروع قطعه» alone told nobody
    // anything (founder, 2026-09-13): the mechanism in one line, the reader's
    // own count once they have some, and the «؟» beside it for the rest.
    hint.textContent = state.clips.length
      ? faNum(state.clips.length) + ' هایلایت صوتی روی این اپیزود داری'
      : 'مثل هایلایت متن، برای صدا: اول بزن، آخرِ تکه دوباره بزن';
  }

  function paintRecording() {
    btn.className = 'dcp-clip-btn is-rec';
    btn.innerHTML = '<span class="dcp-clip-dot" aria-hidden="true"></span><span>پایان هایلایت</span>';
    btn.setAttribute('aria-pressed', 'true');
    live.hidden = false;
    back.hidden = false;
    hint.hidden = true;
    info.hidden = true;
    cap.hidden = true;
    tick();
  }

  function tick() {
    if (!state.rec) return;
    const now = audioEl.currentTime || 0;
    const len = Math.max(0, now - state.rec.start);
    live.innerHTML = 'از <b>' + fmtClock(state.rec.start) + '</b> · ' + fmtClock(len);
    // The end press is refused until the clip can carry a sentence.
    btn.disabled = len < MIN_CLIP_S;
    paintStrip();
  }

  // --- strip ----------------------------------------------------------------
  function paintStrip() {
    const dur = durationOf(audioEl, state.catalogRow);
    strip.replaceChildren();
    if (!dur) return;
    const pct = (t) => Number(clamp((t / dur) * 100, 0, 100).toFixed(2));
    for (const clip of state.clips) {
      const zone = el('button', {
        class: 'dcp-clip-zone', type: 'button',
        style: `left:${pct(clip.start_s)}%;width:${Math.max(0.6, pct(clip.end_s) - pct(clip.start_s))}%`,
        title: fmtClock(clip.start_s) + ' → ' + fmtClock(clip.end_s) + (clip.note ? ' · ' + clip.note : ''),
        'aria-label': 'پخش هایلایت صوتی ' + fmtClock(clip.start_s) + ' تا ' + fmtClock(clip.end_s),
      });
      zone.addEventListener('click', () => { playSegment(audioEl, { start: clip.start_s, end: clip.end_s }); });
      strip.appendChild(zone);
    }
    if (state.rec) {
      const now = Math.max(audioEl.currentTime || 0, state.rec.start);
      strip.appendChild(el('span', {
        class: 'dcp-clip-zone is-live',
        style: `left:${pct(state.rec.start)}%;width:${Math.max(0.6, pct(now) - pct(state.rec.start))}%`,
      }));
    }
    strip.setAttribute('aria-hidden', 'false');
  }

  // --- data -----------------------------------------------------------------
  async function loadClips() {
    const user = await currentUser();
    state.clips = [];
    if (user) {
      try { state.clips = (await api.listClips(state.contentId)).clips || []; } catch (_) { state.clips = []; }
    }
    const n = episodeNumber(state.contentId);
    if (n != null && !state.catalogRow) {
      try { state.catalogRow = (await episodeCatalog()).get(n) || null; } catch (_) { state.catalogRow = null; }
    }
    if (!state.rec) paintIdle();
    paintStrip();
  }

  // --- the tap ---------------------------------------------------------------
  async function onTap() {
    if (state.rec) { finish(); return; }
    const user = await currentUser();
    if (!user) {
      const res = await openLoginModal({ returnTo: location.pathname + location.search });
      if (!res || !res.user) return;
      await loadClips();
      return onTap();
    }
    if (user.tier !== 'premium') {
      openSheet(gateCard({
        title: 'هایلایت صوتی ویژه‌ی پریمیوم است',
        sub: 'با پریمیوم هر تکه از پادکست را که به کارت آمد نگه می‌داری — شروع را بزن، پایان را بزن — و همان تکه بعداً از دفترچه‌ی هایلایت‌هایت پخش می‌شود.',
        cta: premiumCta('gate-clip'),
      }));
      return;
    }
    state.rec = { start: snap(audioEl.currentTime || 0) };
    paintRecording();
    state.ticker = setInterval(tick, 250);
  }

  function stopTicker() { if (state.ticker) { clearInterval(state.ticker); state.ticker = 0; } }

  function finish() {
    const rec = state.rec;
    if (!rec) return;
    const end = snap(audioEl.currentTime || 0);
    if (end - rec.start < MIN_CLIP_S) return; // the button is disabled here anyway
    stopTicker();
    state.rec = null;
    paintIdle();
    paintStrip();
    // Nothing keeps playing behind the sheet: pause here, and the sheet parks
    // the player on the start so the transport's own play agrees with it.
    if (!audioEl.paused) { try { audioEl.pause(); } catch (_) { /* ignore */ } }
    openClipSheet({
      audioEl, contentId: state.contentId, episodeLabel: state.episodeLabel,
      start: rec.start, end: Math.min(end, rec.start + MAX_CLIP_S),
      duration: durationOf(audioEl, state.catalogRow),
      onSaved: (clip) => {
        state.clips = [...state.clips, clip].sort((a, b) => a.start_s - b.start_s);
        paintIdle();
        paintStrip();
      },
    });
  }

  function cancelRecording(reason) {
    if (!state.rec) return;
    stopTicker();
    state.rec = null;
    paintIdle();
    paintStrip();
    if (reason) toast(reason, { icon: '!' });
  }

  btn.addEventListener('click', onTap);
  back.addEventListener('click', () => {
    if (!state.rec) return;
    state.rec.start = Math.max(0, snap(state.rec.start - NUDGE_BACK_S));
    tick();
  });
  audioEl.addEventListener('loadedmetadata', paintStrip);
  // Starting over from the top (the shared player's own «episode ended, next»)
  // or a seek back BEFORE the start makes the recorded start meaningless.
  audioEl.addEventListener('seeking', () => {
    if (state.rec && (audioEl.currentTime || 0) < state.rec.start - 0.5) cancelRecording('هایلایت صوتی لغو شد — به قبل از شروع برگشتی');
  });

  paintIdle();
  loadClips();
  syncEpisodeTransport(audioEl, host);

  return {
    retarget(newContentId, newLabel) {
      if (newContentId === state.contentId) { if (newLabel) state.episodeLabel = newLabel; return; }
      if (state.rec) cancelRecording('هایلایت صوتی لغو شد — اپیزود عوض شد');
      state.contentId = newContentId;
      state.episodeLabel = newLabel || null;
      state.catalogRow = null;
      state.clips = [];
      paintIdle();
      paintStrip();
      loadClips();
    },
    refresh: loadClips,
    row, strip,
    // test hooks
    get state() { return state; },
  };
}

// --- the episode page's own play button -----------------------------------------
// tools/episodes_template.html's transport repaints its ▶/⏸ only inside its own
// click handler (and on `ended`), never from the element's events — so a play
// or pause that comes from HERE (a clip preview, a zone tap, the pause behind
// the sheet) left the icon saying the opposite of what the audio was doing.
// The shared player (/player.html) listens to play/pause itself and needs no
// help; these two strings are the template's own icons, byte for byte.
const EP_ICON_PLAY = '<svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/></svg>';
const EP_ICON_PAUSE = '<svg class="dc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.15em;display:inline-block"><circle cx="12" cy="12" r="10"/><path d="M10 8v8"/><path d="M14 8v8"/></svg>';
function syncEpisodeTransport(audioEl, host) {
  const play = host.querySelector('#ep-play');
  if (!play) return;
  audioEl.addEventListener('play', () => { play.innerHTML = EP_ICON_PAUSE; });
  audioEl.addEventListener('pause', () => { play.innerHTML = EP_ICON_PLAY; });
}

// --- the sheet ---------------------------------------------------------------
/**
 * Open the clip sheet for [start, end] on `audioEl`. Saves through
 * POST /clips (a new clip) or PATCH /clips/:id (`existing`), and calls
 * onSaved(clip) with the server's copy.
 */
export function openClipSheet({ audioEl, contentId, episodeLabel = null, start, end, duration = null, existing = null, onSaved }) {
  const span = { start: snap(start), end: snap(end) };
  const dur = Number.isFinite(duration) && duration > 0 ? duration : null;
  const maxT = dur || Infinity;
  const label = { value: existing ? existing.label || null : null };

  // The window: two minutes around the clip (or the clip plus a margin when
  // it is longer), never past the episode's ends. Every pixel is then half a
  // second on a phone, which is what makes the handles usable.
  let w0 = Math.max(0, span.start - 30);
  let w1 = Math.min(maxT, Math.max(span.end + 30, w0 + 120));
  if (w1 - w0 < 60 && dur) w0 = Math.max(0, w1 - 60);

  const title = el('h2', { class: 'dcp-sheet-title' }, existing ? 'ویرایش هایلایت صوتی' : 'هایلایت صوتی جدید');
  const sub = el('p', { class: 'dcp-sheet-sub dcp-clip-sub' });
  const win = el('div', { class: 'dcp-clip-win', dir: 'ltr', role: 'group', 'aria-label': 'ریزتنظیم شروع و پایان' });
  const sel = el('div', { class: 'dcp-clip-sel' });
  const playhead = el('div', { class: 'dcp-clip-ph', hidden: true });
  const hStart = el('button', { class: 'dcp-clip-h', type: 'button', 'aria-label': 'دستگیره‌ی شروع', 'data-end': 'start' });
  const hEnd = el('button', { class: 'dcp-clip-h', type: 'button', 'aria-label': 'دستگیره‌ی پایان', 'data-end': 'end' });
  const ticks = el('div', { class: 'dcp-clip-ticks' });
  win.append(ticks, sel, playhead, hStart, hEnd);

  const tStart = el('span', { class: 'dcp-clip-t', dir: 'ltr' });
  const tEnd = el('span', { class: 'dcp-clip-t', dir: 'ltr' });
  const nudge = (which, delta) => {
    const b = el('button', { class: 'dcp-clip-nudge', type: 'button', 'aria-label': (which === 'start' ? 'شروع ' : 'پایان ') + (delta > 0 ? '+' : '−') + faNum(Math.abs(delta)) + ' ثانیه' }, (delta > 0 ? '+' : '−') + faNum(Math.abs(delta)));
    b.addEventListener('click', () => { setEnd(which, span[which] + delta); preview(which); });
    return b;
  };
  const ends = el('div', { class: 'dcp-clip-ends' }, [
    el('div', { class: 'dcp-clip-end' }, [el('span', { class: 'dcp-clip-lab' }, 'شروع'), nudge('start', -1), tStart, nudge('start', 1)]),
    el('div', { class: 'dcp-clip-end' }, [el('span', { class: 'dcp-clip-lab' }, 'پایان'), nudge('end', -1), tEnd, nudge('end', 1)]),
  ]);

  const chips = LENGTH_CHIPS.map((n) => {
    const b = el('button', { class: 'dcp-hlib-chip dcp-clip-chip', type: 'button', 'data-len': String(n) }, faNum(n) + ' ث');
    b.addEventListener('click', () => { setEnd('end', span.start + n); preview('end'); });
    return b;
  });
  const lenRow = el('div', { class: 'dcp-clip-len' }, [el('span', { class: 'dcp-clip-lab' }, 'یا طولش را بگو:'), ...chips]);

  const ta = el('textarea', { class: 'dcp-hlib-ta', rows: '2', placeholder: 'یادداشت (اختیاری) — چرا این تکه مهم است؟', 'aria-label': 'یادداشت قطعه' });
  ta.value = existing ? existing.note || '' : '';
  const labelBtns = [{ key: null, fa: 'بدون برچسب' }, ...LABELS.map((l) => ({ key: l.key, fa: l.fa }))].map((d) => {
    const b = el('button', { class: 'dcp-hlib-chip' + (d.key === label.value ? ' is-on' : ''), type: 'button' }, d.fa);
    b.addEventListener('click', () => {
      label.value = d.key;
      labelBtns.forEach((x) => x.classList.remove('is-on'));
      b.classList.add('is-on');
    });
    return b;
  });

  const msg = el('span', { class: 'dcp-hlib-msg', role: 'status' });
  const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, existing ? 'ذخیره' : 'ذخیره‌ی هایلایت');
  const listen = el('button', { class: 'dcp-btn dcp-btn-ghost dcp-clip-listen', type: 'button' });
  const cancel = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');
  const foot = el('div', { class: 'dcp-clip-foot' }, [save, listen, cancel, msg]);

  const card = el('div', { class: 'dcp-sheet-card dcp-clip-sheet', role: 'dialog', 'aria-label': title.textContent }, [
    title, sub, win, ends, lenRow, ta, el('div', { class: 'dcp-hlib-erow' }, labelBtns), foot,
  ]);

  // --- geometry ---------------------------------------------------------------
  const pct = (t) => ((t - w0) / (w1 - w0)) * 100;
  function layout() {
    sel.style.left = pct(span.start) + '%';
    sel.style.width = Math.max(0, pct(span.end) - pct(span.start)) + '%';
    hStart.style.left = pct(span.start) + '%';
    hEnd.style.left = pct(span.end) + '%';
    tStart.textContent = fmtClock(span.start);
    tEnd.textContent = fmtClock(span.end);
    const len = span.end - span.start;
    sub.replaceChildren(
      document.createTextNode(faNum(episodeLabel || epLabel(contentId)) + ' · '),
      el('b', { dir: 'ltr' }, fmtClock(span.start) + ' تا ' + fmtClock(span.end)),
      document.createTextNode(' · ' + fmtLength(len)),
    );
    chips.forEach((b) => b.classList.toggle('is-on', Math.abs(len - Number(b.dataset.len)) < SNAP_S));
    // The window grows when a handle is pushed to its edge.
    if (span.end > w1 - 5 && (!dur || w1 < dur)) { w1 = Math.min(maxT, span.end + 30); drawTicks(); layout(); }
    if (span.start < w0 + 5 && w0 > 0) { w0 = Math.max(0, span.start - 30); drawTicks(); layout(); }
  }
  function drawTicks() {
    const step = w1 - w0 <= 180 ? 30 : 60;
    ticks.replaceChildren();
    for (let t = Math.ceil(w0 / step) * step; t <= w1; t += step) {
      ticks.appendChild(el('span', { class: 'dcp-clip-tick', style: 'left:' + pct(t) + '%' }, [el('i', {}, fmtClock(t))]));
    }
  }
  function setEnd(which, t) {
    t = snap(t);
    if (which === 'start') span.start = clamp(t, Math.max(0, span.end - MAX_CLIP_S), span.end - MIN_CLIP_S);
    else span.end = clamp(t, span.start + MIN_CLIP_S, Math.min(maxT, span.start + MAX_CLIP_S));
    layout();
  }

  // Dragging: pointer events with capture, so a finger that leaves the window
  // keeps moving the handle it picked up.
  for (const h of [hStart, hEnd]) {
    const which = h.dataset.end;
    let dragging = false;
    h.addEventListener('pointerdown', (e) => {
      dragging = true;
      h.setPointerCapture(e.pointerId);
      h.classList.add('is-drag');
      e.preventDefault();
    });
    h.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const r = win.getBoundingClientRect();
      if (!r.width) return;
      const t = w0 + ((e.clientX - r.left) / r.width) * (w1 - w0);
      setEnd(which, t);
    });
    const up = () => { if (!dragging) return; dragging = false; h.classList.remove('is-drag'); preview(which); };
    h.addEventListener('pointerup', up);
    h.addEventListener('pointercancel', up);
    // Keyboard: arrows move the handle by a second.
    h.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { setEnd(which, span[which] - 1); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { setEnd(which, span[which] + 1); e.preventDefault(); }
    });
  }

  // --- listening --------------------------------------------------------------
  let playing = false;
  function paintListen() {
    listen.innerHTML = (playing ? STOP : PLAY) + '<span>' + (playing ? 'توقف' : 'گوش بده') + '</span>';
  }
  function runSegment(from, to) {
    playing = true;
    paintListen();
    playhead.hidden = false;
    return playSegment(audioEl, {
      start: from, end: to,
      onTick: (t) => { playhead.style.left = clamp(pct(t), 0, 100) + '%'; },
      onDone: () => { playing = false; playhead.hidden = true; paintListen(); },
    });
  }
  /** Hear the edge you just moved: three seconds after the start, or before the end. */
  function preview(which) {
    if (which === 'start') runSegment(span.start, Math.min(span.end, span.start + 3));
    else runSegment(Math.max(span.start, span.end - 3), span.end);
  }
  listen.addEventListener('click', () => {
    if (playing) { stopSegment(audioEl); return; }
    runSegment(span.start, span.end);
  });

  // --- save -------------------------------------------------------------------
  save.addEventListener('click', async () => {
    save.disabled = true;
    msg.textContent = '';
    const body = { start_s: span.start, end_s: span.end, note: ta.value.trim() || null, label: label.value };
    try {
      const res = existing
        ? await api.updateClip(existing.id, body)
        : await api.createClip({ content_id: contentId, ...body });
      stopSegment(audioEl);
      closeSheet();
      toast(existing ? 'هایلایت صوتی ذخیره شد' : 'هایلایت صوتی ذخیره شد · در دفترچه‌ی هایلایت‌ها');
      if (onSaved) onSaved(res.clip);
    } catch (e) {
      save.disabled = false;
      msg.textContent = e && e.status === 402
        ? 'هایلایت صوتی ویژه‌ی پریمیوم است.'
        : 'ذخیره نشد؛ دوباره تلاش کن.';
    }
  });
  cancel.addEventListener('click', () => { stopSegment(audioEl); closeSheet(); });
  ta.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save.click();
  });

  drawTicks();
  layout();
  paintListen();
  openSheet(card);
  // Park the player on the start so the transport's own play button agrees
  // with the sheet; audible only when the reader presses something.
  seekWhenReady(audioEl, span.start).catch(() => {});
  return card;
}

function epLabel(contentId) {
  const n = episodeNumber(contentId);
  return n != null ? 'اپیزود ' + faNum(n) : 'این اپیزود';
}

// --- ?dcclip=<id> — the landing --------------------------------------------------
/**
 * The دفترچه's «شنیدن در اپیزود ›» carries ?dcclip=<id> (the ?dcphl= idea for
 * audio). On the episode page: park the player on the clip's start and draw a
 * one-line strip above the transport with a play button — never autoplay, the
 * first play on iOS must be the reader's own tap.
 */
export function deepLinkClipId(search = location.search) {
  try { return new URLSearchParams(search).get('dcclip') || null; } catch (_) { return null; }
}

export async function landOnClip({ audioEl, contentId, host, clipId = deepLinkClipId() }) {
  if (!clipId || !audioEl || !host) return false;
  const user = await currentUser();
  if (!user) return false;
  let clip = null;
  try { clip = (await api.getClip(clipId)).clip; } catch (_) { return false; }
  if (!clip || clip.content_id !== contentId) return false;
  const old = host.parentNode && host.parentNode.querySelector('.dcp-clip-land');
  if (old) old.remove();
  const play = el('button', { class: 'dcp-clip-land-go', type: 'button' });
  let playing = false;
  const paint = () => { play.innerHTML = (playing ? STOP : PLAY) + '<span>' + (playing ? 'توقف' : 'پخش هایلایت') + '</span>'; };
  play.addEventListener('click', () => {
    if (playing) { stopSegment(audioEl); return; }
    playing = true; paint();
    playSegment(audioEl, { start: clip.start_s, end: clip.end_s, onDone: () => { playing = false; paint(); } });
  });
  paint();
  const land = el('div', { class: 'dcp-clip-land', role: 'note' }, [
    el('span', {}, ['هایلایت صوتیِ تو · ', el('b', { dir: 'ltr' }, fmtClock(clip.start_s) + ' → ' + fmtClock(clip.end_s))]),
    clip.note ? el('span', { class: 'dcp-clip-land-note' }, clip.note) : null,
    play,
  ].filter(Boolean));
  host.insertAdjacentElement('beforebegin', land);
  try { host.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) { /* ignore */ }
  seekWhenReady(audioEl, clip.start_s).catch(() => {});
  return true;
}
