// Reusable dashboard renderer. Used by the /plus/ page AND the header overlay, so
// the dashboard opens the same way from anywhere. Site design language (light),
// not a separate dark theme (prototype-feedback override).
import { el, faNum, streakIsActiveToday } from './util.js';
import { api } from './api.js';
import { renderTree } from './tree.js';
import { getModel, contentInfo } from './content-index.js';
import { LABELS, PALETTE } from './config.js';

const labelFa = (k) => (LABELS.find((l) => l.key === k) || {}).fa || '';
const colorCss = (k) => (PALETTE.find((p) => p.key === k) || {}).css || 'transparent';

// Premium tiles. Leaderboard is intentionally NOT here (removed). "نماهای موضوعی"
// renamed to something concrete.
const PREMIUM_TILES = [
  'مرور زمان‌بندی‌شده',
  'مسیرهای یادگیری',
  'جمع‌بندی موضوعی هایلایت‌ها',
  'گزارش ماهانه',
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

function progressBars(progress) {
  const rows = (progress.folder_progress || []).filter((f) => f.engaged > 0);
  if (!rows.length) return el('div', { class: 'dcp-muted' }, 'با خواندن و هایلایت کردن، پیشرفت هر پوشه اینجا پر می‌شود.');
  const list = el('div', { class: 'dcp-progress-list' });
  for (const f of rows) {
    const pct = f.total ? Math.round((f.engaged / f.total) * 100) : 0;
    list.appendChild(el('div', { class: 'dcp-progress-row' }, [
      el('span', { class: 'dcp-progress-name' }, f.fa),
      el('span', { class: 'dcp-progress-val' }, faNum(f.engaged) + ' از ' + faNum(f.total) + ' (٪' + faNum(pct) + ')'),
      el('div', { class: 'dcp-progress-track' }, el('div', { class: 'dcp-progress-fill', style: 'width:' + pct + '%' })),
    ]));
  }
  return list;
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
  const [me, progress, model] = await Promise.all([
    preMe ? Promise.resolve(preMe) : api.me().catch(() => null),
    api.progress().catch(() => ({})),
    getModel(),
  ]);
  if (!me) { root.replaceChildren(el('div', { class: 'dcp-gate' }, 'برای دیدن پیشخوان وارد شوید.')); return; }

  const treeWrap = el('div', {});
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
    section('پوشه‌های سایت', 'هر پوشه به صفحه‌ی خودش می‌رود؛ عدد کنارش تعداد هایلایت‌های شما در آن پوشه است.', treeWrap),
    section('پیشرفت هر پوشه', 'نسبت مطالبی که در هر پوشه خوانده یا هایلایت کرده‌اید به کل آن پوشه.', progressBars(progress)),
    section('امتیاز شما', 'امتیاز از روی فعالیت شما ساخته می‌شود و پایه‌ی رقابت‌های بعدی است.',
      el('div', { class: 'dcp-score' }, [el('span', { class: 'dcp-score-n' }, faNum(progress.score || 0)), el('span', { class: 'dcp-muted' }, 'امتیاز')])),
    section('هایلایت‌های اخیر', null, recentWrap),
    section('پریمیوم', 'به‌زودی در دسترس.', premiumTiles()),
  );

  root.replaceChildren(...children.filter(Boolean));
  renderTree(treeWrap);
  recentWrap.replaceChildren(await recentBlock(model));
}
