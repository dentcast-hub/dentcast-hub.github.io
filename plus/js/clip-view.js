// The clip CARD — how a saved قطعه‌ی صوتی is drawn wherever it is listed (the
// دفترچه today; a collection board whenever it learns the kind). Same rule as
// hl-view.js: one vocabulary, so the same clip never looks like two things.
//
// A clip row is a card, never a link (the library's first rule). Its content
// is the clip itself: a play button that plays THIS segment right here, the
// span, a small bar showing where in the episode it sits, and the note. Going
// to the episode is one action among others and lands ON the clip (?dcclip=).
import { el, faNum } from './util.js?v=132';
import { api } from './api.js?v=132';
import { LABELS } from './config.js?v=132';
import { noteBlock, labelChip, actionBtn, confirmStrip, toast, copyToClipboard } from './hl-view.js?v=132';
import { fmtClock, fmtLength, episodeNumber, episodeCatalog, playSegment, stopSegment } from './clip-audio.js?v=132';

const PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';

/** The episode link that lands ON the clip (plus.js reads ?dcclip=). */
export function clipHref(url, clipId) {
  if (!url) return '#';
  return url + (url.includes('?') ? '&' : '?') + 'dcclip=' + encodeURIComponent(clipId);
}

/** Plain-text form of a clip, for the copy actions. */
export function clipAsText(clip, article = null) {
  const head = '[' + fmtClock(clip.start_s) + ' → ' + fmtClock(clip.end_s) + ']' + (article ? ' ' + article.title : '');
  const note = (clip.note || '').trim();
  return note ? head + '\n— ' + note : head;
}

/**
 * One <audio> for the whole page: the episode file is resolved from the site's
 * own catalog (dentcast.json, the same rows /player.html plays from), so a clip
 * plays without the episode page. Pressing play on one card pauses another.
 */
export function createClipPlayer() {
  const audio = document.createElement('audio');
  audio.preload = 'none';
  audio.hidden = true;
  audio.setAttribute('data-dc-clip-player', '');
  document.body.appendChild(audio);
  let current = null; // { card, clip, contentId }
  const listeners = new Set();

  function notify() { for (const fn of listeners) fn(current); }

  async function srcFor(contentId) {
    const n = episodeNumber(contentId);
    if (n == null) return null;
    const row = (await episodeCatalog()).get(n);
    return row ? row.audio_url : null;
  }

  return {
    audio,
    /** The card currently playing, or null. */
    get current() { return current; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    async play(clip, contentId, { onTick, onDone } = {}) {
      const src = await srcFor(contentId);
      if (!src) throw new Error('no_audio');
      // Claim the player BEFORE tearing the previous segment down: its onDone
      // fires synchronously inside stopSegment()/playSegment(), and must find
      // that the player already belongs to this clip — otherwise it nulls
      // `current` and the change notice stops the card that just started.
      current = { clip, contentId };
      notify();
      if (audio.getAttribute('src') !== src) {
        stopSegment(audio);
        audio.setAttribute('src', src);
      }
      return playSegment(audio, {
        start: clip.start_s, end: clip.end_s,
        onTick,
        onDone: (reason) => {
          if (current && current.clip.id === clip.id) { current = null; notify(); }
          if (onDone) onDone(reason);
        },
      });
    },
    stop() { stopSegment(audio); },
    /** Episode length for the position bar, when the catalog knows it. */
    async durationOf(contentId) {
      const n = episodeNumber(contentId);
      if (n == null) return null;
      const row = (await episodeCatalog()).get(n);
      return row && row.duration_s ? row.duration_s : null;
    },
  };
}

/**
 * Edit a clip WHERE YOU FOUND IT — note, label and a second either way on each
 * end. PATCH /clips/:id; onSaved(updated) gets the server's copy.
 */
export function clipInlineEditor(clip, { onSaved, onClose }) {
  const ta = el('textarea', { class: 'dcp-hlib-ta', rows: '3', placeholder: 'یادداشتت را اینجا بنویس…', 'aria-label': 'یادداشت قطعه' });
  ta.value = clip.note || '';
  const span = { start: clip.start_s, end: clip.end_s };
  let label = clip.label || null;

  const labelBtns = [{ key: null, fa: 'بدون برچسب' }, ...LABELS.map((l) => ({ key: l.key, fa: l.fa }))].map((d) => {
    const b = el('button', { class: 'dcp-hlib-chip' + (d.key === label ? ' is-on' : ''), type: 'button' }, d.fa);
    b.addEventListener('click', () => { label = d.key; labelBtns.forEach((x) => x.classList.remove('is-on')); b.classList.add('is-on'); });
    return b;
  });

  const tStart = el('span', { class: 'dcp-clip-t', dir: 'ltr' });
  const tEnd = el('span', { class: 'dcp-clip-t', dir: 'ltr' });
  const paintTimes = () => { tStart.textContent = fmtClock(span.start); tEnd.textContent = fmtClock(span.end); };
  const nudge = (which, delta) => {
    const b = el('button', { class: 'dcp-clip-nudge', type: 'button', 'aria-label': (which === 'start' ? 'شروع ' : 'پایان ') + (delta > 0 ? '+' : '−') + faNum(Math.abs(delta)) + ' ثانیه' }, (delta > 0 ? '+' : '−') + faNum(Math.abs(delta)));
    b.addEventListener('click', () => {
      const next = Math.round((span[which] + delta) * 10) / 10;
      if (which === 'start') span.start = Math.max(0, Math.min(next, span.end - 1));
      else span.end = Math.max(span.start + 1, next);
      paintTimes();
    });
    return b;
  };
  const ends = el('div', { class: 'dcp-clip-ends' }, [
    el('div', { class: 'dcp-clip-end' }, [el('span', { class: 'dcp-clip-lab' }, 'شروع'), nudge('start', -1), tStart, nudge('start', 1)]),
    el('div', { class: 'dcp-clip-end' }, [el('span', { class: 'dcp-clip-lab' }, 'پایان'), nudge('end', -1), tEnd, nudge('end', 1)]),
  ]);
  paintTimes();

  const msg = el('span', { class: 'dcp-hlib-msg', role: 'status' });
  const save = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ذخیره');
  const cancel = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');
  const box = el('div', { class: 'dcp-hlib-editor' }, [
    ta,
    ends,
    el('div', { class: 'dcp-hlib-erow' }, labelBtns),
    el('div', { class: 'dcp-hlib-erow dcp-hlib-esave' }, [save, cancel, msg]),
  ]);
  cancel.addEventListener('click', () => { box.remove(); if (onClose) onClose(); });
  save.addEventListener('click', async () => {
    save.disabled = true;
    msg.textContent = '';
    const patch = { note: ta.value.trim() || null, label };
    if (span.start !== clip.start_s) patch.start_s = span.start;
    if (span.end !== clip.end_s) patch.end_s = span.end;
    try {
      const { clip: updated } = await api.updateClip(clip.id, patch);
      box.remove();
      onSaved(updated);
      toast('ذخیره شد');
    } catch (_) {
      save.disabled = false;
      msg.textContent = 'ذخیره نشد؛ دوباره تلاش کن.';
    }
  });
  ta.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') save.click();
    if (e.key === 'Escape') cancel.click();
  });
  setTimeout(() => ta.focus(), 0);
  return box;
}

/**
 * The playable part of a clip — play button, span, position bar, status — as
 * one node with a `stop()` and a `repaint()`. Shared by the دفترچه card and
 * the collection pin, which differ only in the actions under it.
 *
 * @param contentId  the episode
 * @param clip       { id, start_s, end_s }
 * @param player     createClipPlayer() for the page (null → the play button is inert)
 */
export function clipBody(contentId, clip, player) {
  let duration = null;
  if (player) player.durationOf(contentId).then((d) => { duration = d; paintBar(); }).catch(() => {});

  const playBtn = el('button', { class: 'dcp-clipcard-play', type: 'button', 'aria-label': 'پخش هایلایت صوتی' });
  const bar = el('div', { class: 'dcp-clipcard-bar', dir: 'ltr', 'aria-hidden': 'true' });
  const zone = el('span', { class: 'dcp-clipcard-zone' });
  const prog = el('span', { class: 'dcp-clipcard-prog' });
  const ph = el('span', { class: 'dcp-clipcard-ph', hidden: true });
  bar.append(zone, prog, ph);
  const ctxRow = el('div', { class: 'dcp-clipcard-ctx', dir: 'ltr' });
  const status = el('span', { class: 'dcp-clipcard-status' });
  const span = el('div', { class: 'dcp-clipcard-span', dir: 'ltr' });

  let playing = false;
  function paintPlay() {
    playBtn.innerHTML = playing ? PAUSE : PLAY;
    playBtn.classList.toggle('is-playing', playing);
    playBtn.setAttribute('aria-label', playing ? 'توقف' : 'پخش هایلایت صوتی');
  }
  function pct(t) {
    const d = duration || Math.max(clip.end_s * 1.05, 1);
    return Math.min(100, Math.max(0, (t / d) * 100));
  }
  function paintBar() {
    const left = pct(clip.start_s);
    const width = Math.max(0.8, pct(clip.end_s) - left);
    zone.style.left = left + '%';
    zone.style.width = width + '%';
    prog.style.left = left + '%';
    ctxRow.replaceChildren(el('span', {}, '00:00'), status, el('span', {}, duration ? fmtClock(duration) : ''));
    span.replaceChildren(
      el('span', { class: 'dcp-clipcard-times' }, fmtClock(clip.start_s) + ' → ' + fmtClock(clip.end_s)),
      el('span', { class: 'dcp-clipcard-len' }, fmtLength(clip.end_s - clip.start_s)),
    );
  }
  function onTick(t) {
    const left = pct(clip.start_s);
    prog.style.width = Math.max(0, pct(t) - left) + '%';
    ph.hidden = false;
    ph.style.left = pct(t) + '%';
    status.textContent = 'در حال پخش · ' + fmtClock(t);
  }
  function stopped() {
    playing = false;
    paintPlay();
    ph.hidden = true;
    prog.style.width = '0';
    status.textContent = '';
  }
  playBtn.addEventListener('click', async () => {
    if (!player) return;
    if (playing) { player.stop(); return; }
    playing = true;
    paintPlay();
    status.textContent = 'در حال بارگذاری…';
    try {
      await player.play(clip, contentId, { onTick, onDone: stopped });
    } catch (_) {
      stopped();
      toast('فایل این اپیزود پیدا نشد', { icon: '!' });
    }
  });
  // Another card took the player: this one reads as stopped at once.
  if (player) player.onChange((cur) => { if (playing && (!cur || cur.clip.id !== clip.id)) stopped(); });
  paintPlay();
  paintBar();

  const node = el('div', { class: 'dcp-clipcard' }, [
    playBtn,
    el('div', { class: 'dcp-clipcard-main' }, [span, bar, ctxRow]),
  ]);
  return {
    node,
    repaint: paintBar,
    stop: () => { if (playing && player) player.stop(); },
  };
}

/**
 * @param article  the episode group (title/url/folder/content_id)
 * @param clip     the clip itself (kind === 'clip')
 * @param ctx      { onDeleted(id), onUpdated(clip, article), showSource, player, source(article), onCollect(clip) }
 */
export function clipCard(article, clip, ctx) {
  const card = el('div', { class: 'dcp-hlib-card dcp-clipcard-wrap', 'data-clip': clip.id });
  const player = ctx.player;
  const body = clipBody(article.content_id, clip, player);

  function paint() {
    body.repaint();
    const note = noteBlock(clip.note);

    const edit = actionBtn('✎ ویرایش', {
      onClick: () => {
        if (card.querySelector('.dcp-hlib-editor')) return;
        card.appendChild(clipInlineEditor(clip, {
          onSaved: (updated) => { Object.assign(clip, updated); paint(); ctx.onUpdated(clip, article); },
        }));
      },
    });
    const copy = actionBtn('کپی', { onClick: (e) => copyToClipboard(clipAsText(clip, article), e.currentTarget) });
    // «🗂 کالکشن» only where the page can open the picker (the دفترچه passes
    // it in; a board draws its own pin actions instead).
    const collect = ctx.onCollect ? actionBtn('🗂 کالکشن', { onClick: () => ctx.onCollect(clip, article) }) : null;
    const go = actionBtn('شنیدن در اپیزود ›', { href: clipHref(article.url, clip.id) });
    const del = actionBtn('حذف', {
      danger: true,
      onClick: () => {
        if (card.querySelector('.dcp-recent-confirm')) return;
        card.appendChild(confirmStrip('این هایلایت صوتی حذف شود؟', async () => {
          body.stop();
          await api.deleteClip(clip.id);
          ctx.onDeleted(clip.id);
          toast('هایلایت صوتی حذف شد');
        }));
      },
    });
    const actions = el('div', { class: 'dcp-hlib-actions' },
      [el('span', { class: 'dcp-clipcard-kind' }, '🎧 هایلایت صوتی'), labelChip(clip.label), edit, copy, collect, go, del].filter(Boolean));

    const source = ctx.showSource && ctx.source ? ctx.source(article) : null;
    card.replaceChildren(...[source, body.node, note, actions].filter(Boolean));
  }

  paint();
  return card;
}
