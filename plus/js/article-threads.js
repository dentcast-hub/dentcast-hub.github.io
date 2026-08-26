// گفت‌وگوی زیر مطلب — the conversation beneath an article.
//
// Two halves that look like one block:
//
//   · Published threads, which ANY visitor sees (signed out included). A thread
//     is public only because the founder published it, so what appears here is
//     never the raw output of a comment box — it is the part of the conversation
//     somebody decided was worth reading.
//   · The reader's own thread, private between them and the founder, which only
//     a premium reader can write to.
//
// The block is drawn LAZILY behind an IntersectionObserver. It sits under the
// prose, the whole API is `no-store` (server.ts), and most readers never scroll
// this far — so fetching on load would add an uncached request to every article
// view site-wide to render something nobody looked at.
//
// TWO SURFACES, like votes.js and share before it: a standalone article page,
// and the desktop shell, which fetches an article into column C with dc-nav.js
// stripped out. mountArticleThreads() is exported for that second case, because
// a feature that quietly works on phones and not on desktop is the exact gap
// buildShareButton() was written to close.
import { api, currentUser } from './api.js?v=24';
import { el, faNum, icon } from './util.js?v=24';

const FA_DATE = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const when = (iso) => { try { return FA_DATE.format(new Date(iso)); } catch (_) { return ''; } };

// `showStatus`: only the reader's OWN thread needs to say which of their
// messages are public — a message in the public list (`publicThread` below)
// is public by definition, saying so again would be noise. Publishing is per
// MESSAGE, not per thread (0048): the reader's question and the founder's
// reply are two separate decisions, and a mixed thread is the normal case,
// not an edge one.
function bubble(m, authorName, showStatus) {
  const mine = m.author === 'founder';
  const who = (mine ? 'دکتر شهابیان' : authorName) + ' · ' + when(m.created_at)
    + (showStatus ? (m.is_public ? ' · عمومی' : ' · خصوصی') : '');
  return el('div', { class: 'dc-th-msg' + (mine ? ' dc-th-msg-founder' : '') }, [
    el('div', { class: 'dc-th-who' }, who),
    el('div', { class: 'dc-th-body' }, m.body),
  ]);
}

function publicThread(t) {
  return el('article', { class: 'dc-th-pub' }, t.messages.map((m) => bubble(m, t.author_name)));
}

/* --------------------------------------------------------- the composer -- */

function composer(contentId, mine, onPosted) {
  const box = el('textarea', {
    class: 'dc-th-input', rows: '3', maxlength: '4000',
    placeholder: mine ? 'ادامه‌ی گفت‌وگو…' : 'نظر یا سؤالتان دربارهٔ همین مطلب…',
  });
  const out = el('div', { class: 'dc-th-note' }, '');
  const send = el('button', { class: 'dc-th-send', type: 'button' }, 'ارسال');

  send.addEventListener('click', async () => {
    const body = box.value.trim();
    if (!body) { out.textContent = 'متن خالی است.'; return; }
    send.disabled = true;
    out.textContent = 'در حال ارسال…';
    try {
      await api.postThread(contentId, body);
      box.value = '';
      out.textContent = '';
      await onPosted();
    } catch (e) {
      out.textContent = (e && e.body && e.body.message) || 'ارسال نشد.';
    } finally {
      send.disabled = false;
    }
  });

  return el('div', { class: 'dc-th-compose' }, [
    box,
    // Said BEFORE they write, not after it is published. The founder's switch
    // can put this thread on the page for everyone, and somebody who would
    // rather that never happened deserves to know while the box is still empty.
    el('div', { class: 'dc-th-note' },
      'این گفت‌وگو خصوصی است و فقط شما و دکتر شهابیان آن را می‌بینید — مگر اینکه ایشان تصمیم بگیرد آن را با نامِ نمایشیِ شما زیر همین مطلب عمومی کند.'),
    el('div', { class: 'dc-th-row' }, [send, out]),
  ]);
}

function upsell() {
  return el('div', { class: 'dc-th-gate' }, [
    el('p', {}, 'نوشتن زیر مطلب‌ها ویژه‌ی اشتراک پریمیوم است.'),
    el('a', { class: 'dc-th-cta', href: '/plus/pricing.html' }, 'دیدن اشتراک'),
  ]);
}

// A plain reply affordance for a non-premium reader — no mention of a
// subscription until they press it. Saying "این ویژه‌ی پریمیوم است" before
// anyone asked to write reads as a paywall greeting every visitor; the gate
// still exists, it just waits to be asked for.
function askThenGate() {
  const btn = el('button', { class: 'dc-th-ask', type: 'button' }, [
    icon('icon-message', { class: 'dc-th-ask-ic' }),
    'پاسخ یا سؤال',
  ]);
  btn.addEventListener('click', () => btn.replaceWith(upsell()), { once: true });
  return btn;
}

/* ------------------------------------------------------------- the block -- */

async function draw(host, contentId) {
  const user = await currentUser();
  const isPremium = !!user && user.tier === 'premium';

  // The public half is fetched for everyone; the private half only for somebody
  // who could have one.
  const [pub, mine] = await Promise.all([
    api.publicThreads(contentId).catch(() => ({ threads: [] })),
    user ? api.myThread(contentId).catch(() => ({ thread: null, messages: [] }))
      : Promise.resolve({ thread: null, messages: [] }),
  ]);

  const threads = pub.threads || [];

  // Always rendered now — a reader who never sees the heading never learns
  // this exists. What used to gate visibility (host.remove() with nothing
  // published and no way to write) now only gates the WRITE side, and even
  // that is asked for (askThenGate), not announced up front.
  const parts = [el('h2', { class: 'dc-th-title' }, 'گفت‌وگو زیر این مطلب')];

  if (threads.length) {
    parts.push(el('div', { class: 'dc-th-count' }, faNum(threads.length) + ' گفت‌وگوی منتشرشده'));
    parts.push(...threads.map(publicThread));
  } else {
    parts.push(el('div', { class: 'dc-th-count' }, 'هنوز گفت‌وگویی منتشر نشده — اولین نفر باشید.'));
  }

  // The reader's own thread, shown only to them. Drawn after the public ones so
  // the page reads the same for everybody down to this point. The header is a
  // fixed label now, not a public/private state — that state is per MESSAGE
  // (each bubble says so itself via `showStatus`), and a thread with some
  // public and some private messages is the normal case, not an edge one.
  if (mine.thread) {
    parts.push(el('div', { class: 'dc-th-mine' }, [
      el('div', { class: 'dc-th-mine-head' }, 'گفت‌وگوی شما'),
      ...mine.messages.map((m) => bubble(m, 'شما', true)),
    ]));
  }

  parts.push(isPremium
    ? composer(contentId, mine.thread, () => draw(host, contentId))
    : askThenGate());

  host.replaceChildren(...parts);
}

/**
 * Mount the block under `anchor` for `contentId`.
 *
 * Returns false when there is nothing to mount onto, so both call sites can
 * stay one line. Idempotent per host: re-mounting the desktop shell on a second
 * article replaces the block rather than stacking a second one.
 */
export function mountArticleThreads(anchor, contentId) {
  if (!anchor || !contentId) return false;
  // Audio episodes carry this too, since 2026-08-12. Nothing here ever excluded
  // them — the block is written against a content_id and the API gates on
  // nothing else; they simply had no caller, because initArticle() (which used
  // to be the only one) bows out at the audio player. plus.js's
  // initEpisodeActions() is the second caller, anchored on the single `.ep-box`.
  const existing = anchor.parentNode && anchor.parentNode.querySelector('.dc-threads');
  if (existing) existing.remove();

  const host = el('section', { class: 'dc-threads' }, [
    el('div', { class: 'dc-th-skel' }, ' '),
  ]);
  anchor.insertAdjacentElement('afterend', host);

  let drawn = false;
  const go = () => {
    if (drawn) return;
    drawn = true;
    draw(host, contentId).catch(() => { host.remove(); });
  };

  if (typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); go(); }
    }, { rootMargin: '400px' });
    io.observe(host);
  } else {
    go();
  }
  return true;
}
