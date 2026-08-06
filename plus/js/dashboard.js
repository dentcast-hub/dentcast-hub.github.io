// Reusable dashboard renderer. Used by the /plus/ page AND the header overlay, so
// the dashboard opens the same way from anywhere. Site design language (light),
// not a separate dark theme (prototype-feedback override).
import { el, faNum, streakIsActiveToday } from './util.js';
import { api } from './api.js';
import { getModel, contentInfo, FOLDER_EN } from './content-index.js';
import { leagueEntryButton } from './league.js';
import { openCollectionPicker, boardCover } from './collections.js';
import { LABELS, PALETTE, PREMIUM_FEATURES } from './config.js';
import { renewalBanner } from './renewal-banner.js';
import { premiumCta } from './premium-cta.js';

const labelFa = (k) => (LABELS.find((l) => l.key === k) || {}).fa || '';
const colorCss = (k) => (PALETTE.find((p) => p.key === k) || {}).css || 'transparent';

// Folders intentionally left out of the per-folder reading-progress widget
// (not article-style reading content). The folder list itself is still derived
// dynamically from the content index; this only hides these specific keys.
const PROGRESS_EXCLUDE = new Set(['photocast', 'litecast']);

// `more`: an optional longer explanation, tucked behind a «؟» beside the hint —
// same hidden-by-default reveal the homepage promo card already uses for its
// score caption (dc-plus-info/dc-plus-scorecap/dc-plus-capline).
function section(title, hint, body, more) {
  const children = [el('h2', { class: 'dcp-dash-h2' }, title)];
  if (hint) {
    if (more) {
      const cap = el('p', { class: 'dc-plus-scorecap', hidden: true }, el('span', { class: 'dc-plus-capline' }, more));
      const infoBtn = el('button', { class: 'dc-plus-info', type: 'button', title: 'توضیح بیشتر', 'aria-label': 'توضیح بیشتر' }, '؟');
      infoBtn.addEventListener('click', () => { cap.hidden = !cap.hidden; });
      children.push(el('div', { class: 'dcp-sec-hint-row' }, [el('p', { class: 'dcp-sec-hint' }, hint), infoBtn]), cap);
    } else {
      children.push(el('p', { class: 'dcp-sec-hint' }, hint));
    }
  }
  children.push(body);
  return el('section', { class: 'dcp-dash-sec' }, children);
}

function streakDetail(me) {
  const active = streakIsActiveToday(me.last_active_day);
  return el('div', { class: 'dcp-streak-detail' }, [
    el('span', { class: 'dcp-streak-flamebig' + (active ? ' is-active' : '') }, '🔥'),
    el('div', { class: 'dcp-streak-nums' }, [
      el('span', { class: 'dcp-streak-num' }, faNum(me.current_streak || 0)),
      el('span', { class: 'dcp-streak-unit' }, active ? 'روز پیاپی، امروز فعال بودید' : 'روز پیاپی، امروز هنوز فعالیتی ثبت نشده'),
    ]),
    el('div', { class: 'dcp-streak-record' }, [
      el('b', {}, faNum(me.longest_streak || 0)),
      el('span', {}, 'رکورد شما'),
    ]),
  ]);
}

function continueBlock(progress, model) {
  const info = progress.last_content_id ? contentInfo(model, progress.last_content_id) : null;
  if (!info) return el('div', { class: 'dcp-muted' }, 'هنوز مطلبی را شروع نکرده‌اید.');
  return el('a', { class: 'dcp-continue', href: info.url }, [
    el('span', { class: 'dcp-continue-lead' }, 'ادامه: '),
    el('span', {}, info.title),
  ]);
}

function progressBars(progress, model) {
  // Reading-progress layer (spec 2.9), built over the SAME shared content-index
  // model the navigation tree uses. The FOLDER LIST and each folder's total come
  // from the static content index (model.folders) so every folder always renders,
  // even before the user has read anything. Only the numerator (how many the user
  // has READ = article_completed) comes from /progress. Recomputed every mount,
  // never cached; as new articles ship the totals grow and a folder's percent
  // drops until they are read.
  const folders = (model.folders || []).filter((f) => f.total > 0 && !PROGRESS_EXCLUDE.has(f.key));
  if (!folders.length) return el('div', { class: 'dcp-muted' }, 'هنوز پوشه‌ای برای نمایش نیست.');
  const readByKey = new Map((progress.folder_progress || []).map((f) => [f.key, f.read || 0]));
  const list = el('div', { class: 'dcp-progress-list' });
  for (const f of folders) {
    const read = Math.min(readByKey.get(f.key) || 0, f.total);
    // f.total > 0 here (divide-by-zero guarded above); clamp to 0..100.
    const pct = Math.max(0, Math.min(100, Math.round((read / f.total) * 100)));
    list.appendChild(el('div', { class: 'dcp-progress-row' }, [
      f.url
        ? el('a', { class: 'dcp-progress-name', dir: 'ltr', href: f.url }, FOLDER_EN[f.key] || f.key)
        : el('span', { class: 'dcp-progress-name', dir: 'ltr' }, FOLDER_EN[f.key] || f.key),
      el('div', { class: 'dcp-progress-track' },
        el('div', { class: 'dcp-progress-fill', style: 'width:' + pct + '%' })),
      el('span', { class: 'dcp-progress-val' }, '٪' + faNum(pct)),
    ]));
  }
  return list;
}

function scoreBlock(progress) {
  // Score number + streak shields (سپر استریک). Shields cost more each time
  // (first_cost, then +step) and there is no holding cap; one is spent
  // automatically to save the streak on a missed day. One icon per shield held.
  const f = progress.freezes || {};
  const available = Math.max(0, f.available || 0);
  const first = f.first_cost || 200;
  const step = f.step || 50;

  const wrap = el('div', { class: 'dcp-score-wrap' }, [
    el('div', { class: 'dcp-score' }, [
      el('span', { class: 'dcp-score-n' }, faNum(progress.score || 0)),
      el('span', { class: 'dcp-muted' }, 'امتیاز'),
    ]),
  ]);

  // Where the points came from. The per-content line is the whole point of the
  // component: a listener who finishes a second episode on a day they were
  // already active sees this number move even though the day bonus did not.
  const done = progress.score_content_completed || 0;
  if (done) {
    wrap.appendChild(el('p', { class: 'dcp-score-parts' },
      faNum(done) + ' محتوا را تمام کرده‌اید (هرکدام '
      + faNum(progress.score_points_per_content || 5) + ' امتیاز) و '
      + faNum(progress.score_active_days || 0) + ' روز فعال بوده‌اید (هرکدام '
      + faNum(progress.score_points_per_active_day || 10) + ' امتیاز).'));
  }

  const icons = el('span', { class: 'dcp-freeze-icons', 'aria-hidden': 'true' });
  for (let i = 0; i < Math.max(1, available); i += 1) {
    icons.appendChild(el('span', { class: 'dcp-freeze-ico' + (i < available ? '' : ' is-empty') }, '🛡️'));
  }
  wrap.appendChild(el('div', { class: 'dcp-freeze' }, [
    icons,
    el('span', { class: 'dcp-freeze-label' }, 'سپر استریک: ' + faNum(available)),
  ]));

  let hint = 'سپر یعنی یک روز مرخصی. اگر یک روز فعالیت نکنید، سپر خودش خرج می‌شود و استریکتان نمی‌شکند. سپر اول ' + faNum(first) + ' امتیاز است و هر سپر بعدی ' + faNum(step) + ' امتیاز گران‌تر؛ امتیازتان هم کم نمی‌شود. پس سپرتان را نگه دارید.';
  if (f.next_in) hint += ' ' + faNum(f.next_in) + ' امتیاز تا سپر بعدی.';
  wrap.appendChild(el('p', { class: 'dcp-freeze-hint' }, hint));
  return wrap;
}

// The dashboard's own short list: the six most recent highlights. It is a
// PREVIEW, never the whole surface — a reader with highlights across dozens of
// articles used to have nothing else (user report, 2026-08-05), so the footer
// always says how many there really are and links into the full library
// (/plus/highlights.html, premium). Six rows for every plan; what premium buys
// is the library, not extra rows here.
async function recentBlock(model, isPremium) {
  const data = await api.recentHighlights(6).catch(() => ({ highlights: [] }));
  const total = data.total || data.highlights.length;
  if (!data.highlights.length) return el('div', { class: 'dcp-muted' }, 'هنوز هایلایتی ندارید.');
  const list = el('div', { class: 'dcp-recent-list' });
  for (const h of data.highlights) {
    const info = contentInfo(model, h.content_id);
    // ?dcphl=<id> makes the article open its workbench and scroll to THIS
    // highlight (plus.js), so the row never lands you on a page where your own
    // highlights are invisible until you press «میز کار» again. The text
    // fragment stays as a fallback for a highlight whose anchor no longer
    // matches the page.
    const link = el('a', { class: 'dcp-recent-link', href: (info ? info.url : '#') + '?dcphl=' + encodeURIComponent(h.id) + '#:~:text=' + encodeURIComponent(h.exact.slice(0, 100)) }, [
      el('span', { class: 'dcp-recent-text' }, h.exact.slice(0, 70)),
      h.label ? el('span', { class: 'dcp-card-label' }, labelFa(h.label)) : null,
    ]);
    const collectBtn = el('button', { class: 'dcp-recent-collect', type: 'button', 'aria-label': 'افزودن به کالکشن', title: 'افزودن به کالکشن' }, '🗂');
    collectBtn.addEventListener('click', (e) => { e.preventDefault(); openCollectionPicker({ highlightId: h.id }); });
    const del = el('button', { class: 'dcp-recent-del', type: 'button', 'aria-label': 'حذف هایلایت', title: 'حذف' }, '×');
    const row = el('div', { class: 'dcp-recent-row' }, [link, collectBtn, del]);

    del.addEventListener('click', (e) => {
      e.preventDefault();
      if (row.querySelector('.dcp-recent-confirm')) return;
      const yes = el('button', { class: 'dcp-btn dcp-btn-danger', type: 'button' }, 'حذف');
      const no = el('button', { class: 'dcp-btn dcp-btn-ghost', type: 'button' }, 'انصراف');
      const confirm = el('span', { class: 'dcp-recent-confirm' }, ['حذف شود؟', yes, no]);
      no.onclick = () => confirm.remove();
      yes.onclick = async () => {
        yes.disabled = true;
        try {
          await api.deleteHighlight(h.id);
          row.remove();
          if (!list.children.length) list.appendChild(el('div', { class: 'dcp-muted' }, 'هایلایتی نمانده.'));
        } catch (_) { yes.disabled = false; }
      };
      row.appendChild(confirm);
    });
    list.appendChild(row);
  }

  const countText = data.article_count
    ? faNum(total) + ' هایلایت در ' + faNum(data.article_count) + ' مطلب'
    : faNum(total) + ' هایلایت';
  const foot = el('div', { class: 'dcp-recent-foot' }, [
    el('span', {}, countText),
    isPremium
      ? el('a', { class: 'dcp-pw-alllink', href: '/plus/highlights.html' }, 'دفترچه‌ی هایلایت‌ها ›')
      // Free: the same destination, which shows the upsell itself — one place
      // that explains the boundary, never a second copy to keep in sync.
      : el('a', { class: 'dcp-pw-alllink', href: '/plus/highlights.html' }, '🔒 دیدنِ همه یکجا'),
  ]);
  return el('div', {}, [list, foot]);
}

// A free user's teaser for a LIVE premium feature: the section's own hint
// already says what it does, so the locked card stays the lock chip + a way to
// act — never a second paragraph repeating the section above it.
//
// The chip alone used to be the whole card, on the reasoning that clicking it
// leads to the feature's page which explains the boundary there. True, but it
// asked every interested reader to take a step in the dark first: a lock with
// nothing beside it says "no" and offers nothing. Five of these sit down this
// page, so the buy link is the quiet ghost variant — five loud buttons would
// read as a dashboard that is mostly advertisement.
function lockedFeatureCard(href, from) {
  return el('div', { class: 'dcp-locked-card' }, [
    el('a', { class: 'dcp-locked-link', href }, el('span', { class: 'dcp-soon-badge' }, '🔒 ویژه‌ی پریمیوم')),
    premiumCta(from, { ghost: true }),
  ]);
}

// "You won a week of premium" banner: the league's weekly top-tier prize
// (plus-api's premium-prize.ts already flipped tier=premium the instant the
// week finalized — this is just the one-time announcement). Shown first, above
// even the hello line, and acknowledged once via POST /premium/grant/seen —
// same shape as the league outcome banner's outcome_seen.
function premiumGrantBanner(grant) {
  // Length is DERIVED from the grant itself, never written into the copy: this
  // banner claimed "one week" for a while after the prize became three days,
  // which promised the winner something the system then took back on day four.
  const days = Math.max(1, Math.round(
    (new Date(grant.expires_at) - new Date(grant.granted_at)) / 86400000,
  ));
  const list = el('ul', { class: 'dcp-prize-list' }, PREMIUM_FEATURES.map((f) =>
    el('li', {}, [el('b', {}, f.title + ': '), f.hint])));
  const dismiss = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'متوجه شدم');
  // A winner who earns nothing next week, with no explanation, concludes the
  // league is broken rather than that it is somebody else's turn.
  const cooldown = grant.cooldown_weeks > 0
    ? el('p', { class: 'dcp-sec-hint' },
      faNum(grant.cooldown_weeks) + ' هفته‌ی بعد نوبتِ بقیه‌ی گروه است؛ بعدش دوباره می‌توانی برنده شوی.')
    : null;
  const banner = el('div', { class: 'dcp-prize-banner' }, [
    el('h2', { class: 'dcp-prize-h' }, '🎉 نفر اولِ گروهت شدی: ' + faNum(days) + ' روز پرمیوم'),
    el('p', { class: 'dcp-sec-hint' },
      'این هفته در گروهت اول شدی — تا ' + faNum(days) + ' روز همه‌ی این‌ها برات بازه:'),
    list,
    cooldown,
    dismiss,
  ].filter(Boolean));
  dismiss.addEventListener('click', async () => {
    dismiss.disabled = true;
    await api.premiumGrantSeen().catch(() => {});
    banner.remove();
  });
  return banner;
}

function reviewDueBlock(me) {
  const count = me.due_card_count || 0;
  if (count > 0) {
    return el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/cards.html' },
      faNum(count) + ' کارت برای مرور');
  }
  return el('div', { class: 'dcp-muted' }, [
    'امروز چیزی برای مرور نداری. ',
    el('a', { href: '/plus/cards.html' }, 'هایلایت کردن رو شروع کن'),
  ]);
}

// Premium "مسیر یادگیری" block: /me already carries active_pathway (the most
// recently started still-in-progress enrollment, or the last completed one),
// so no extra request is needed here. current_step doubles as a plain count of
// steps done — "قدم ۳ از ۲۰" reads naturally either way.
function pathwayBlock(me) {
  const p = me.active_pathway;
  const allLink = el('a', { class: 'dcp-pw-alllink', href: '/plus/pathways.html' }, 'همه مسیرها');
  if (!p) {
    return el('div', { class: 'dcp-pw-dash' }, [
      el('div', { class: 'dcp-muted' }, 'هنوز مسیری را شروع نکرده‌اید.'),
      allLink,
    ]);
  }
  const pct = p.total_steps > 0 ? Math.round((p.current_step / p.total_steps) * 100) : 0;
  return el('div', { class: 'dcp-pw-dash' }, [
    el('a', { class: 'dcp-pw-dash-title', href: '/plus/pathway.html?id=' + encodeURIComponent(p.id) }, p.title_fa),
    el('div', { class: 'dcp-progress-track' }, el('div', { class: 'dcp-progress-fill', style: 'width:' + pct + '%' })),
    el('div', { class: 'dcp-pw-dash-foot' }, [
      el('span', {}, p.is_complete ? 'این مسیر را کامل کرده‌اید 🎉' : ('قدم ' + faNum(p.current_step) + ' از ' + faNum(p.total_steps))),
      allLink,
    ]),
  ]);
}

// Premium "کالکشن‌ها" block: the same Pinterest board-cover strip as the
// catalog page, just capped short — a few boards + their real covers, newest
// first. The full grid lives on /plus/collections.html.
async function collectionsBlock() {
  const data = await api.listCollections().catch(() => null);
  if (!data || !data.collections.length) {
    return el('div', { class: 'dcp-muted' }, [
      'هنوز کالکشنی نساخته‌ای. ',
      el('a', { href: '/plus/collections.html' }, 'یکی بساز'),
    ]);
  }
  const strip = el('div', { class: 'dcp-cl-dash-strip' }, data.collections.slice(0, 4).map((c) => el('a', {
    class: 'dcp-cl-dash-board', href: '/plus/collection.html?id=' + encodeURIComponent(c.id),
  }, [
    boardCover(c.preview, c),
    el('span', { class: 'dcp-cl-dash-name' }, c.title),
    el('span', { class: 'dcp-cl-dash-count' }, faNum(c.item_count) + ' مورد'),
  ])));
  return el('div', { class: 'dcp-pw-dash' }, [strip, el('a', { class: 'dcp-pw-alllink', href: '/plus/collections.html' }, 'همه‌ی کالکشن‌ها')]);
}

// Premium «قطب‌نمای مطالعه» block: a coverage summary (top pillar + link to
// the full report), not an interest guess — see reading-compass.js/.ts.
async function compassBlock() {
  const data = await api.readingCompass().catch(() => null);
  const allLink = el('a', { class: 'dcp-pw-alllink', href: '/plus/reading-compass.html' }, 'مشاهده‌ی کامل قطب‌نما');
  if (!data || !data.total_read) {
    return el('div', { class: 'dcp-pw-dash' }, [
      el('div', { class: 'dcp-muted' }, 'هنوز چیزی نخوانده‌اید.'),
      allLink,
    ]);
  }
  const top = data.top_cluster;
  // Same pairing as the compass's badge: «بیشترین مطالعه» is a ranking by the
  // NUMBER of items read, the percent is that pillar's own coverage — name the
  // count so the low percent next to it doesn't read as a contradiction.
  const topLine = top
    ? top.fa + ' (' + (typeof top.read === 'number' ? faNum(top.read) + ' مورد، ' : '')
      + '٪' + faNum(top.coverage_pct) + ' پوشش)'
    : '';
  return el('div', { class: 'dcp-pw-dash' }, [
    top ? el('div', {}, [
      el('span', { class: 'dcp-muted' }, 'بیشترین مطالعه‌تان: '),
      el('b', {}, topLine),
    ]) : null,
    allLink,
  ].filter(Boolean));
}

// Premium «دستیار هوشمند» entry point. The wizard itself is multi-step, so the
// dashboard only carries a CTA into its own page — see case-assistant.js.
function assistantBlock() {
  return el('a', { class: 'dcp-btn dcp-btn-primary', href: '/plus/assistant.html' }, 'شروع دستیار');
}

export async function renderDashboard(root, { me: preMe } = {}) {
  root.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  // Always fetch fresh when the dashboard opens: /me and /progress are never
  // cached, and the content model is refreshed so newly published content is
  // reflected in the per-folder progress totals.
  //
  // IMPORTANT: fetch /me FRESH every open — the header passes a `preMe` captured
  // at page boot, and using it made the streak number + "active today" look stale
  // after a just-completed read/highlight until a manual page refresh. Fall back
  // to that preMe only if the fresh fetch fails (offline / 401).
  const [me, progress, model, league] = await Promise.all([
    api.me().catch(() => preMe || null),
    api.progress().catch(() => ({})),
    getModel({ refresh: true }),
    api.league().catch(() => null),
  ]);
  if (!me) { root.replaceChildren(el('div', { class: 'dcp-gate' }, 'برای دیدن پیشخوان وارد شوید.')); return; }

  const recentWrap = el('div', {}, el('div', { class: 'dcp-loading' }, '...'));
  const collectionsWrap = el('div', {}, el('div', { class: 'dcp-loading' }, '...'));
  const compassWrap = el('div', {}, el('div', { class: 'dcp-loading' }, '...'));
  const children = [];
  // Unmissable, above even the hello line — see premiumGrantBanner().
  if (me.pending_premium_grant) children.push(premiumGrantBanner(me.pending_premium_grant));
  // Above the greeting for the same reason the prize banner is: a subscription
  // ending in two days changes what this whole page means, and it must not be
  // something you scroll past. Returns null for everyone it does not concern —
  // which is almost everyone, almost always.
  const renew = renewalBanner(me, 'dashboard');
  if (renew) children.push(renew);
  children.push(el('div', { class: 'dcp-dash-hello' }, 'سلام، ' + (me.display_name || '')));

  const isPremium = me.tier === 'premium';

  // Own-data sections FIRST, for every plan: a free (or even premium, no
  // difference in cost) visitor should see proof the site/their account is
  // alive — streak, what they're reading, real progress — before a wall of
  // locked premium teasers. With five live premium sections now (review due,
  // pathway, collections, compass, assistant), stacking all of them above
  // this reads as "the site is broken" for a free user (founder feedback,
  // 2026-07-31). One shared order for both plans, deliberately — it costs
  // nothing for premium (their content further down is still live) and keeps
  // this simple.
  children.push(
    section('استریک', 'هر روز که بخوانید، هایلایت کنید یا مرور کنید، یک روز به زنجیره‌تان اضافه می‌شود. رکورد شما بیشترین زنجیره‌ای است که تا حالا ساخته‌اید و هیچ‌وقت پاک نمی‌شود.', streakDetail(me)),
    league ? section('لیگ من', 'رتبه‌ات در گروهِ رقابتیِ این هفته؛ برای صعود به لیگِ بالاتر تلاش کن.', leagueEntryButton(league)) : null,
    section('ادامه مطالعه', null, continueBlock(progress, model)),
    section('پیشرفت هر پوشه', 'برای هر پوشه، چند درصد از کل مطالب آن را خوانده‌اید (۰ تا ۱۰۰). هر بار پیشخوان باز شود به‌روز می‌شود.', progressBars(progress, model)),
    // NOTE: امتیاز (all-time, unlocks shields at thresholds, never spent) and XP
    // هفتگی (ranks the league, resets weekly) are two separate quantities in the
    // API — never describe one as feeding the other, and never as a balance.
    section('امتیاز شما', 'هر پادکستِ تازه‌ای که گوش می‌دهید و هر مقاله‌ای که تمام می‌کنید امتیاز دارد، به‌علاوه‌ی هر روزِ فعال و هر هایلایت. امتیاز همیشه می‌ماند و کم نمی‌شود؛ با آن سپر می‌گیرید. لیگ هفتگی جداست و روی XP همان هفته حساب می‌شود.', scoreBlock(progress)),
    section('هایلایت‌های اخیر', 'تازه‌ترین هایلایت‌هایتان؛ همه‌شان یکجا در دفترچه‌ی هایلایت‌ها.', recentWrap),
  );

  // The premium feature sections come after: the live block for premium, a
  // locked-card teaser for free (linking to the feature's own page, which
  // does the actual gating).
  children.push(section(
    PREMIUM_FEATURES[0].title,
    PREMIUM_FEATURES[0].hint,
    isPremium ? reviewDueBlock(me) : lockedFeatureCard('/plus/cards.html', 'dash-cards'),
    'هایلایت‌هایی که تو مطالبِ مختلف زده‌اید، طبقِ زمان‌بندیِ علمیِ لایتنر، دقیقاً همون وقتی که وقتِ فراموش‌شدنشونه دوباره بهتان نشان داده می‌شود — همین باعث می‌شود واقعاً تو ذهنتان بماند.',
  ));
  children.push(section(
    PREMIUM_FEATURES[1].title,
    PREMIUM_FEATURES[1].hint,
    isPremium ? pathwayBlock(me) : lockedFeatureCard('/plus/pathways.html', 'dash-pathways'),
    'دیگر لازم نیست فکر کنید چه چیزی را بعد از چه چیزی بخوانید — خودمان مسیرِ یادگیریِ هر موضوع را قدم‌به‌قدم نشانتان می‌دهیم، تا در آن موضوع کاملاً مسلط شوید و مهارتِ واقعی پیدا کنید.',
  ));
  children.push(section(
    PREMIUM_FEATURES[2].title,
    PREMIUM_FEATURES[2].hint,
    isPremium ? collectionsWrap : lockedFeatureCard('/plus/collections.html', 'dash-collections'),
    'هر هایلایت یا مقاله‌ای که دلتان بخواهد را، بر اساسِ موضوعی که خودتان انتخاب می‌کنید، در یک پوشه‌ی دلخواه ذخیره می‌کنید — مثلاً برای یک امتحان، یک بیمارِ خاص، یا هر چیزِ دیگر.',
  ));
  children.push(section(
    PREMIUM_FEATURES[3].title,
    PREMIUM_FEATURES[3].hint,
    isPremium ? compassWrap : lockedFeatureCard('/plus/reading-compass.html', 'dash-compass'),
    'نه حدسِ سلیقه، بلکه آمارِ واقعیِ خواندن‌ها: چند درصد از هر پیلار را پوشش داده‌اید و بیشترین مطالعه‌تان کجا بوده. بر همین اساس دو دسته پیشنهاد می‌دهد: مطالبِ نخوانده‌ی همان حیطه برای ادامه، و حوزه‌هایی که هنوز اصلاً سراغشان نرفته‌اید برای کاوش.',
  ));
  children.push(section(
    PREMIUM_FEATURES[4].title,
    PREMIUM_FEATURES[4].hint,
    isPremium ? assistantBlock() : lockedFeatureCard('/plus/assistant.html', 'dash-assistant'),
    'فقط از بین چند گزینه انتخاب می‌کنی — نه گفتگوی آزاد. هوش مصنوعی هیچ تشخیص یا توصیه‌ی درمانی نمی‌دهد؛ فقط توضیحِ تو را به دسته‌بندی‌های خودِ سایت نگاشت می‌کند تا به مقاله‌ی مرتبط برسیم.',
  ));

  root.replaceChildren(...children.filter(Boolean));
  recentWrap.replaceChildren(await recentBlock(model, isPremium));
  if (isPremium) collectionsWrap.replaceChildren(await collectionsBlock());
  if (isPremium) compassWrap.replaceChildren(await compassBlock());
}
