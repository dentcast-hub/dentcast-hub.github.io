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
import { api, currentUser } from './api.js';
import { el, faNum } from './util.js';

const FA_DATE = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
const when = (iso) => { try { return FA_DATE.format(new Date(iso)); } catch (_) { return ''; } };

function bubble(m, authorName) {
  const mine = m.author === 'founder';
  return el('div', { class: 'dc-th-msg' + (mine ? ' dc-th-msg-founder' : '') }, [
    el('div', { class: 'dc-th-who' }, (mine ? 'دکتر شهابیان' : authorName) + ' · ' + when(m.created_at)),
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

  // Nothing published, and this reader cannot write: render NOTHING. With 444
  // articles and a premium readership, an always-on comment box would sit empty
  // under almost every page forever — which reads as a dead site rather than a
  // quiet one, and is the whole reason publishing is a decision here. A heading
  // with an upsell under it is not content; it is an advert on every page.
  if (!threads.length && !isPremium) { host.remove(); return; }

  const parts = [el('h2', { class: 'dc-th-title' }, 'گفت‌وگو زیر این مطلب')];

  if (threads.length) {
    parts.push(el('div', { class: 'dc-th-count' }, faNum(threads.length) + ' گفت‌وگوی منتشرشده'));
    parts.push(...threads.map(publicThread));
  }

  // The reader's own thread, shown only to them. Drawn after the public ones so
  // the page reads the same for everybody down to this point.
  if (mine.thread) {
    parts.push(el('div', { class: 'dc-th-mine' }, [
      el('div', { class: 'dc-th-mine-head' },
        mine.thread.is_public ? 'گفت‌وگوی شما (عمومی شده)' : 'گفت‌وگوی خصوصی شما'),
      ...mine.messages.map((m) => bubble(m, 'شما')),
    ]));
  }

  // A non-premium reader only ever reaches here when there IS something to
  // read, so the upsell arrives beside real content rather than instead of it.
  parts.push(isPremium
    ? composer(contentId, mine.thread, () => draw(host, contentId))
    : upsell());

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
