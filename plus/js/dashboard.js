// Reusable dashboard renderer. Used by the /plus/ page AND the header overlay, so
// the dashboard opens the same way from anywhere. Site design language (light),
// not a separate dark theme (prototype-feedback override).
import { el, faNum, streakIsActiveToday } from './util.js';
import { api } from './api.js';
import { getModel, contentInfo } from './content-index.js';
import { LABELS, PALETTE } from './config.js';

const labelFa = (k) => (LABELS.find((l) => l.key === k) || {}).fa || '';
const colorCss = (k) => (PALETTE.find((p) => p.key === k) || {}).css || 'transparent';

// Folders intentionally left out of the per-folder reading-progress widget
// (not article-style reading content). The folder list itself is still derived
// dynamically from the content index; this only hides these specific keys.
const PROGRESS_EXCLUDE = new Set(['photocast', 'litecast']);

// English brand names for the progress widget titles (the index only carries the
// Persian label). Falls back to the folder key so a new folder still renders.
const FOLDER_EN = {
  episodes: 'Podcast',
  notecast: 'NoteCast',
  insight: 'Clinical Insight',
  dentai: 'DentAI',
  chairside: 'Chairside',
  metanotes: 'MetaNote',
  glossary: 'Glossary',
  sharehub: 'ShareHub',
};

// Premium tiles. Leaderboard is intentionally NOT here (removed). "نماهای موضوعی"
// renamed to something concrete.
const PREMIUM_TILES = [
  'مرور فلش‌کارت زمان‌بندی‌شده',
  'مسیرهای یادگیری',
  'جمع‌بندی موضوعی هایلایت‌ها',
  'کوییز و کسب امتیاز',
  'دستیار هوشمند',
];

function section(title, hint, body) {
  return el('section', { class: 'dcp-dash-sec' }, [
    el('h2', { class: 'dcp-dash-h2' }, title),
    hint ? el('p', { class: 'dcp-sec-hint' }, hint) : null,
    body,
  ]);
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
  // Score number + streak shields (سپر استریک). One shield per `points` of score,
  // up to `cap` held; a shield is spent automatically to save the streak on a
  // missed day. Filled icons = available, dimmed = empty slots.
  const f = progress.freezes || {};
  const cap = f.cap || 2;
  const available = Math.max(0, Math.min(cap, f.available || 0));
  const points = f.points || 150;

  const wrap = el('div', { class: 'dcp-score-wrap' }, [
    el('div', { class: 'dcp-score' }, [
      el('span', { class: 'dcp-score-n' }, faNum(progress.score || 0)),
      el('span', { class: 'dcp-muted' }, 'امتیاز'),
    ]),
  ]);

  const icons = el('span', { class: 'dcp-freeze-icons', 'aria-hidden': 'true' });
  for (let i = 0; i < cap; i += 1) {
    icons.appendChild(el('span', { class: 'dcp-freeze-ico' + (i < available ? '' : ' is-empty') }, '🛡️'));
  }
  wrap.appendChild(el('div', { class: 'dcp-freeze' }, [
    icons,
    el('span', { class: 'dcp-freeze-label' }, 'سپر استریک: ' + faNum(available) + ' از ' + faNum(cap)),
  ]));

  let hint = 'اگر یک روز فعالیت نکنید، یک سپر خرج می‌شود و استریکتان حفظ می‌شود. هر ' + faNum(points) + ' امتیاز یک سپر، تا سقف ' + faNum(cap) + '.';
  if (available < cap && f.next_in) hint += ' ' + faNum(f.next_in) + ' امتیاز تا سپر بعدی.';
  wrap.appendChild(el('p', { class: 'dcp-freeze-hint' }, hint));
  return wrap;
}

async function recentBlock(model) {
  const data = await api.recentHighlights(6).catch(() => ({ highlights: [] }));
  if (!data.highlights.length) return el('div', { class: 'dcp-muted' }, 'هنوز هایلایتی ندارید.');
  const list = el('div', { class: 'dcp-recent-list' });
  for (const h of data.highlights) {
    const info = contentInfo(model, h.content_id);
    const link = el('a', { class: 'dcp-recent-link', href: (info ? info.url : '#') + '#:~:text=' + encodeURIComponent(h.exact.slice(0, 100)) }, [
      el('span', { class: 'dcp-recent-text' }, h.exact.slice(0, 70)),
      h.label ? el('span', { class: 'dcp-card-label' }, labelFa(h.label)) : null,
    ]);
    const del = el('button', { class: 'dcp-recent-del', type: 'button', 'aria-label': 'حذف هایلایت', title: 'حذف' }, '×');
    const row = el('div', { class: 'dcp-recent-row' }, [link, del]);

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
  return list;
}

function premiumTiles() {
  const grid = el('div', { class: 'dcp-tile-grid' });
  for (const t of PREMIUM_TILES) {
    grid.appendChild(el('div', { class: 'dcp-tile' }, [
      el('span', { class: 'dcp-tile-lock', 'aria-hidden': 'true' }, '🔒'),
      el('span', { class: 'dcp-tile-name' }, t),
      el('span', { class: 'dcp-tile-soon' }, 'به زودی'),
    ]));
  }
  return grid;
}

export async function renderDashboard(root, { me: preMe } = {}) {
  root.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  // Always fetch fresh when the dashboard opens: /me and /progress are never
  // cached, and the content model is refreshed so newly published content is
  // reflected in the per-folder progress totals.
  const [me, progress, model] = await Promise.all([
    preMe ? Promise.resolve(preMe) : api.me().catch(() => null),
    api.progress().catch(() => ({})),
    getModel({ refresh: true }),
  ]);
  if (!me) { root.replaceChildren(el('div', { class: 'dcp-gate' }, 'برای دیدن پیشخوان وارد شوید.')); return; }

  const recentWrap = el('div', {}, el('div', { class: 'dcp-loading' }, '...'));
  const children = [
    el('div', { class: 'dcp-dash-hello' }, 'سلام، ' + (me.display_name || '')),
  ];

  // premium-only due block first (never for free)
  if (me.tier === 'premium') {
    children.push(section('برای مرور امروز', null, el('div', { class: 'dcp-muted' }, 'موتور زمان‌بندی در فاز بعد فعال می‌شود.')));
  }

  children.push(
    section('استریک', 'هر روز که بخوانید، هایلایت کنید یا مرور کنید، یک روز به زنجیره‌تان اضافه می‌شود. رکورد شما بیشترین زنجیره‌ای است که تا حالا ساخته‌اید و هیچ‌وقت پاک نمی‌شود.', streakDetail(me)),
    section('ادامه مطالعه', null, continueBlock(progress, model)),
    section('پیشرفت هر پوشه', 'برای هر پوشه، چند درصد از کل مطالب آن را خوانده‌اید (۰ تا ۱۰۰). هر بار پیشخوان باز شود به‌روز می‌شود.', progressBars(progress, model)),
    section('امتیاز شما', 'امتیاز از روی فعالیت شما ساخته می‌شود و پایه‌ی رقابت‌های بعدی است.', scoreBlock(progress)),
    section('هایلایت‌های اخیر', null, recentWrap),
    section('پریمیوم', 'به‌زودی در دسترس.', premiumTiles()),
  );

  root.replaceChildren(...children.filter(Boolean));
  recentWrap.replaceChildren(await recentBlock(model));
}
