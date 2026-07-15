// Controller for /plus/ (the dashboard, PWA start URL). Free-tier content per
// spec 2.6: streak detail, navigation tree, continue-where-you-were, recent
// highlights, per-cluster progress placeholder, visibly locked premium tiles,
// and a dormant leaderboard. No due-card counter for free users.
import { el, faNum, streakIsActive } from './util.js';
import { currentUser, api } from './api.js';
import { openLoginModal } from './login-modal.js';
import { renderTree } from './tree.js';
import { getModel, contentInfo } from './content-index.js';
import { LABELS, PALETTE } from './config.js';
import { registerSW } from './pwa.js';

const labelFa = (k) => (LABELS.find((l) => l.key === k) || {}).fa || '';
const colorCss = (k) => (PALETTE.find((p) => p.key === k) || {}).css || 'transparent';

const PREMIUM_TILES = [
  'مرور زمان‌بندی‌شده',
  'مسیرهای یادگیری',
  'نماهای موضوعی',
  'گزارش ماهانه',
  'دستیار هوشمند',
];

function section(title, body, extraClass = '') {
  return el('section', { class: 'dcp-dash-sec ' + extraClass }, [
    el('h2', { class: 'dcp-dash-h2' }, title),
    body,
  ]);
}

function showGate(root) {
  const btn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
  btn.addEventListener('click', async () => {
    const res = await openLoginModal({ returnTo: '/plus/' });
    if (res && res.user) location.reload();
  });
  root.replaceChildren(el('div', { class: 'dcp-gate' }, [
    el('p', {}, 'پیشخوان شخصی شما. برای ورود دکمه زیر را بزنید.'),
    btn,
  ]));
}

function streakDetail(me) {
  const active = streakIsActive(me.last_active_day);
  return el('div', { class: 'dcp-streak-detail' }, [
    el('div', { class: 'dcp-streak-big' }, [
      el('span', { class: 'dc-plus-flame' + (active ? ' is-active' : '') }, '🔥'),
      el('span', { class: 'dcp-streak-num' }, faNum(me.current_streak || 0)),
      el('span', { class: 'dcp-streak-unit' }, 'روز پیاپی'),
    ]),
    el('div', { class: 'dcp-streak-record' }, 'رکورد شما: ' + faNum(me.longest_streak || 0) + ' روز'),
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

async function recentBlock(model) {
  const data = await api.recentHighlights(8).catch(() => ({ highlights: [] }));
  if (!data.highlights.length) return el('div', { class: 'dcp-muted' }, 'هنوز هایلایتی ندارید.');
  const list = el('div', { class: 'dcp-recent-list' });
  for (const h of data.highlights) {
    const info = contentInfo(model, h.content_id);
    list.appendChild(el('a', { class: 'dcp-recent', href: (info ? info.url : '#') + '#:~:text=' + encodeURIComponent(h.exact.slice(0, 100)) }, [
      h.color ? el('span', { class: 'dcp-card-dot', style: 'background:' + colorCss(h.color) }) : null,
      el('span', { class: 'dcp-recent-text' }, h.exact.slice(0, 90)),
      h.label ? el('span', { class: 'dcp-card-label' }, labelFa(h.label)) : null,
    ]));
  }
  return list;
}

function premiumTiles() {
  const grid = el('div', { class: 'dcp-tile-grid' });
  for (const t of PREMIUM_TILES) {
    grid.appendChild(el('div', { class: 'dcp-tile is-locked' }, [
      el('span', { class: 'dcp-tile-lock', 'aria-hidden': 'true' }, '🔒'),
      el('span', { class: 'dcp-tile-name' }, t),
      el('span', { class: 'dcp-tile-soon' }, 'به زودی'),
    ]));
  }
  return grid;
}

async function main() {
  registerSW();
  const root = document.getElementById('dcp-root');
  if (!root) return;
  const user = await currentUser();
  if (!user) { showGate(root); return; }

  root.replaceChildren(el('div', { class: 'dcp-loading' }, 'در حال بارگذاری...'));
  const [me, progress, model] = await Promise.all([
    api.me().catch(() => user),
    api.progress().catch(() => ({})),
    getModel(),
  ]);

  const treeWrap = el('div', {});
  const recentWrap = el('div', {}, [el('div', { class: 'dcp-loading' }, '...')]);

  root.replaceChildren(
    el('div', { class: 'dcp-dash-hello' }, 'سلام، ' + (me.display_name || '')),
    section('استریک', streakDetail(me)),
    section('ادامه مطالعه', continueBlock(progress, model)),
    section('درخت موضوعی شما', treeWrap),
    section('هایلایت‌های اخیر', recentWrap),
    section('پیشرفت هر خوشه', el('div', { class: 'dcp-muted' }, 'به‌زودی: نقشه پیشرفت شما در هر خوشه.'), 'dcp-placeholder'),
    section('پریمیوم', premiumTiles(), 'dcp-premium'),
    // Leaderboard is built into the layout but stays dormant.
    section('جدول امتیاز', el('div', { class: 'dcp-muted' }, 'به‌زودی، وقتی تعداد کاربران کافی شد.'), 'dcp-dormant'),
  );

  renderTree(treeWrap);
  recentWrap.replaceChildren(await recentBlock(model));

  // Premium-only due-card queue block. Never rendered for free users.
  if (me.tier === 'premium') {
    root.insertBefore(
      section('برای مرور امروز', el('div', { class: 'dcp-muted' }, 'موتور زمان‌بندی در فاز بعد فعال می‌شود.'), 'dcp-due'),
      root.children[2],
    );
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
else main();
