// مسیریاب — renders the wizard (شغل → حوزه → زیرموضوع → سطح آشنایی) and the
// resulting flowchart. Only «چیکاره‌ای؟» (step ۱) is free — founder feedback
// (2026-08-26): the earlier "one real hop free" demo let a free visitor walk
// the whole wizard and see a real suggestion before ever meeting a paywall,
// which read as "no premium stop at all". Everything past persona selection
// (mode, حوزه, زیرموضوع, سطح, and the whole flowchart) is premium — see
// renderPersonaGate(). Because of that, the flow itself is only ever reached
// by a premium visitor, so it carries no tier cap of its own any more.
import { el, icon, faNum } from './util.js?v=47';
import { api } from './api.js?v=47';
import { premiumCta, guestPremiumExtras, lapsedNote } from './premium-cta.js?v=47';
import { openLoginModal } from './login-modal.js?v=47';
import { loadEngine, catalog, rootsFor, optionsFor, nodeInfo, accentFor, bundles, pathwayById, sequenceNextId } from './wayfinder-engine.js?v=47';
import { markReturnTrail } from './return-trail.js?v=47';

const returnToWayfinder = () => markReturnTrail({
  url: '/plus/wayfinder.html', eyebrow: 'مسیریاب', title: 'مسیریاب یادگیری', iconId: 'icon-radar',
});

// The wizard's own progress — separate from مسیر بازگشت (return-trail.js),
// which only remembers WHERE to send someone back; this remembers what they
// had actually built once they got there. Without it, every return to
// /plus/wayfinder.html — via the return-trail chip, the browser's own back
// button, or just a bookmark — was a fresh renderWayfinder() call: state is
// a plain object private to that one closure, so the wizard always
// restarted at «چیکاره‌ای؟» no matter how many steps deep the reader had
// gone (founder report, 2026-08-26 — "این آزاردهنده‌ست"). localStorage, like
// return-trail.js, so a same-origin new tab (an opened article) never
// matters — the ORIGINAL tab already keeps its state in memory regardless;
// this is for every other way of coming back. A day, not 45 minutes like
// return-trail's own TTL: a research thread through the catalog is
// reasonably resumed the next day, and every id in it is re-validated
// against the live catalog on restore anyway (see tryRestore below), so an
// actually-stale snapshot degrades to a fresh start rather than a broken one.
const WF_STATE_KEY = 'dcp:wayfinder-state';
const WF_STATE_TTL_MS = 24 * 60 * 60 * 1000;

function persistWfState(state) {
  try {
    localStorage.setItem(WF_STATE_KEY, JSON.stringify({ ...state, ts: Date.now() }));
  } catch (_) { /* ignore */ }
}

function readPersistedWfState() {
  let raw;
  try { raw = localStorage.getItem(WF_STATE_KEY); } catch (_) { return null; }
  if (!raw) return null;
  let rec;
  try { rec = JSON.parse(raw); } catch (_) { return null; }
  if (!rec || Date.now() - rec.ts > WF_STATE_TTL_MS) {
    try { localStorage.removeItem(WF_STATE_KEY); } catch (_) { /* ignore */ }
    return null;
  }
  return rec;
}

const FLAVORS = {
  continue: { name: 'ادامه مسیر', hint: 'قدم منطقی بعدی', primary: true, iconId: 'icon-arrow-left' },
  deeper: { name: 'عمیق‌تر برو', hint: 'همون موضوع، جزئیات بیشتر', iconId: 'icon-microscope' },
  format: { name: 'با فرمت دیگه', hint: 'همون مبحث، شکل متفاوت', iconId: 'icon-film' },
  lateral: { name: 'جانبی', hint: 'مبحث مرتبط، زاویه‌ی تازه', iconId: 'icon-link' },
};
const FLAVOR_ORDER = ['continue', 'deeper', 'format', 'lateral'];

// `pillars` is only a per-persona RECOMMENDATION order (renderPillarGrid
// sorts these first with a «پیشنهادی» badge) — never a filter. Every حوزه in
// the real catalog stays pickable from every شغل; the pillars/subtopics
// THEMSELVES, and every content suggestion inside them, are real and live
// (wayfinder-engine.js / catalog()).
const PERSONAS = [
  { key: 'labtech', title: 'پروتزیست', sub: 'تکنسین لابراتوار پروتز', pillars: ['fixed-pros', 'ceramics', 'esthetic', 'removable-pros'] },
  { key: 'dentist', title: 'دندان‌پزشک', sub: 'عمومی یا متخصص', pillars: ['fixed-pros', 'removable-pros', 'implantology', 'occlusion', 'bonding'] },
  { key: 'student', title: 'دانشجوی دندان‌پزشکی', sub: 'پایه‌های بالینی و تصمیم‌گیری', pillars: ['operative', 'bonding', 'fixed-pros', 'treatment-planning'] },
];

// `accent` is this pillar's REAL color from tools/build_pillar.py's own
// PILLAR_ACCENT_RGB (via plus/pillar-subtopics.json) — the same one that
// pillar's own /pillar/<slug>/ page uses. Cards with no single subject
// (persona, mode, level) pass none and stay brand blue.
function pickCard({ title, sub, active, badge, accent, cls = '', onClick }) {
  const style = accent ? `--wf-rgb-l:${accent.light};--wf-rgb-d:${accent.dark || accent.light};` : null;
  const card = el('button', {
    type: 'button',
    class: `dcp-wf-card${active ? ' is-active' : ''}${accent ? ' has-accent' : ''}${cls ? ' ' + cls : ''}`,
    style,
    onclick: onClick,
  }, [
    el('div', { class: 'dcp-wf-card-top' }, [
      el('h3', {}, title),
      badge ? el('span', { class: 'dcp-wf-badge' }, badge) : (active ? el('span', { class: 'dcp-wf-active-flag' }, 'در حال نمایش') : null),
    ]),
    sub ? el('p', { class: 'dcp-wf-card-sub' }, sub) : null,
  ]);
  return card;
}

function stepSection(numLabel, text) {
  const label = el('div', { class: 'dcp-wf-step-label' }, [
    el('span', { class: 'dcp-wf-step-num' }, numLabel),
    el('span', {}, text),
  ]);
  const grid = el('div', { class: 'dcp-wf-grid' });
  const section = el('section', { class: 'dcp-wf-step' }, [label, grid]);
  return { section, grid };
}

function folderFa(model, typeKey) {
  const f = (model.folders || []).find((x) => x.key === typeKey);
  return f ? f.fa : typeKey;
}

export async function renderWayfinder(root, me) {
  root.replaceChildren(el('p', { class: 'dcp-loading' }, 'در حال آماده‌سازی مسیریاب…'));

  const engine = await loadEngine();
  const pillarCatalog = catalog(engine);
  const isPremium = !!(me && me.tier === 'premium');

  const state = { personaKey: null, mode: null, pillarKey: null, subtopicKey: null, bundleId: null, path: [] };

  const wrap = el('div', { class: 'dcp-wf' });
  const { section: personaStep, grid: personaGrid } = stepSection('۱', 'چیکاره‌ای؟');
  const { section: modeStep, grid: modeGrid } = stepSection('۲', 'چطور شروع کنیم؟');
  const compassStep = el('section', { class: 'dcp-wf-step' }, [
    el('div', { class: 'dcp-wf-step-label' }, [el('span', { class: 'dcp-wf-step-num' }, '۳'), el('span', {}, 'قطب‌نما')]),
  ]);
  const { section: pillarStep, grid: pillarGrid } = stepSection('۳', 'دوست داری از کدوم حوزه شروع کنیم؟');
  // دانشجو-only: a «باندل‌های شروع» shortcut ABOVE the normal pillar grid —
  // founder feedback: a student is better served starting from a bundle's
  // curated basics than picking a whole حوزه cold. Still just an offer, not
  // a gate — the pillar grid right below it stays the full, unfiltered
  // catalog for anything a bundle doesn't cover.
  const bundleGrid = el('div', { class: 'dcp-wf-grid dcp-wf-bundle-grid' });
  const bundleHint = el('p', { class: 'dcp-wf-substep-hint' },
    'برای دانشجو: بهتره اول از یه باندلِ شروع بری — پایه‌های همون موضوع رو قدم‌به‌قدم می‌بینی.');
  const pillarHint = el('p', { class: 'dcp-wf-substep-hint' },
    'یا مستقیم برو سراغ حوزه‌ها — شامل چیزهایی هم که تو باندل‌ها نیست:');
  const bundleBlock = el('div', { class: 'dcp-wf-bundle-block', hidden: true }, [bundleHint, bundleGrid, pillarHint]);
  pillarStep.insertBefore(bundleBlock, pillarGrid);
  const { section: subtopicStep, grid: subtopicGrid } = stepSection('۴', 'کدوم زیرموضوعش؟');
  const { section: levelStep, grid: levelGrid } = stepSection('۵', 'توی این زیرموضوع در چه سطحی هستی؟');
  const bundleBanner = el('div', { class: 'dcp-wf-bundle-banner', hidden: true });
  const chainWrap = el('div', { class: 'dcp-wf-chain' });
  const flowSection = el('section', { class: 'dcp-wf-step dcp-wf-flow', hidden: true }, [bundleBanner, chainWrap]);

  modeStep.hidden = true;
  compassStep.hidden = true;
  pillarStep.hidden = true;
  subtopicStep.hidden = true;
  levelStep.hidden = true;

  wrap.append(personaStep, modeStep, compassStep, pillarStep, subtopicStep, levelStep, flowSection);
  root.replaceChildren(wrap);

  function hide(...els) { els.forEach((e) => { e.hidden = true; }); }
  function show(e) { e.hidden = false; }
  // Every step reveal scrolls to itself — matching the mockup, where picking
  // an answer always brought the newly-opened question into view instead of
  // leaving the reader to find it themselves further down the page.
  function reveal(e) {
    show(e);
    requestAnimationFrame(() => e.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function persist() { persistWfState(state); }

  function renderPersonaGrid() {
    personaGrid.replaceChildren(...PERSONAS.map((p) => pickCard({
      title: p.title,
      sub: p.sub,
      active: state.personaKey === p.key,
      onClick: () => selectPersona(p.key),
    })));
  }

  function selectPersona(key) {
    if (state.personaKey === key) return;
    state.personaKey = key;
    state.mode = null; state.pillarKey = null; state.subtopicKey = null; state.bundleId = null; state.path = [];
    renderPersonaGrid();
    hide(compassStep, pillarStep, subtopicStep, levelStep, flowSection);
    if (isPremium) renderModeGrid();
    else renderPersonaGate();
    reveal(modeStep);
    persist();
  }

  // Only «چیکاره‌ای؟» is free — everything from here on (mode, حوزه,
  // زیرموضوع, سطح, and the whole flowchart) is premium. Shown inside
  // modeStep's own grid, reusing its «چطور شروع کنیم؟» heading, the same way
  // renderCompassStep reuses compassStep's heading for its own gate.
  function renderPersonaGate() {
    if (!me) {
      const signIn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
      signIn.addEventListener('click', async () => {
        const res = await openLoginModal({ returnTo: location.pathname });
        if (res && res.user) location.reload();
      });
      modeGrid.replaceChildren(el('div', { class: 'dcp-wf-gate' }, [
        el('p', {}, 'قدمِ اول رایگانه — برای ادامه‌ی مسیریاب (انتخاب حوزه، زیرموضوع و کل مسیر) اول وارد شو.'),
        signIn,
        ...guestPremiumExtras('wayfinder-persona'),
      ]));
      return;
    }
    const note = lapsedNote(me);
    modeGrid.replaceChildren(el('div', { class: 'dcp-wf-gate' }, [
      note ? el('p', { class: 'dcp-gate-lapsed' }, note) : null,
      el('p', {}, 'قدمِ اول رایگانه — بقیه‌ی مسیریاب، از انتخاب حوزه تا کل فلوچارت، ویژه‌ی دنت‌کست پریمیومه.'),
      premiumCta('wayfinder-persona'),
    ].filter(Boolean)));
  }

  function renderModeGrid() {
    modeGrid.replaceChildren(
      pickCard({
        title: 'خودم مسیر رو می‌چینم',
        sub: 'قدم به قدم، خودت حوزه و سطح آشنایی رو انتخاب می‌کنی',
        active: state.mode === 'manual',
        onClick: () => selectMode('manual'),
      }),
      pickCard({
        title: 'قطب‌نما حدس بزنه',
        sub: 'من مسیرو برات می‌چینم — بر اساس فعالیت‌های قبلیت',
        cls: 'is-compass',
        badge: 'قطب‌نما · پریمیوم',
        active: state.mode === 'compass',
        onClick: () => selectMode('compass'),
      }),
    );
  }

  function selectMode(mode) {
    if (state.mode === mode) return;
    state.mode = mode;
    state.pillarKey = null; state.subtopicKey = null; state.bundleId = null; state.path = [];
    renderModeGrid();
    hide(flowSection);
    if (mode === 'compass') {
      hide(pillarStep, subtopicStep, levelStep);
      renderCompassStep();
      reveal(compassStep);
    } else {
      hide(compassStep, subtopicStep, levelStep);
      renderBundleBlock();
      renderPillarGrid();
      reveal(pillarStep);
    }
    persist();
  }

  // Only دانشجو gets the «باندل‌های شروع» shortcut — پروتزیست/دندان‌پزشک go
  // straight to the full حوزه grid, exactly as before.
  function renderBundleBlock() {
    bundleBlock.hidden = state.personaKey !== 'student';
    if (bundleBlock.hidden) return;
    renderBundleGrid();
  }

  function renderBundleGrid() {
    bundleGrid.replaceChildren(...bundles(engine).map((b) => pickCard({
      title: b.title_fa,
      sub: b.description_fa || `${faNum((b.steps || []).length)} قدم`,
      active: state.bundleId === b.id,
      onClick: () => startBundle(b.id),
    })));
  }

  function startBundle(id) {
    const b = pathwayById(engine, id);
    if (!b || !b.steps || !b.steps.length) return;
    state.bundleId = id;
    state.pillarKey = null; state.subtopicKey = null;
    state.path = [b.steps[0].content_id];
    renderBundleGrid();
    renderPillarGrid();
    hide(subtopicStep, levelStep);
    renderChain();
    reveal(flowSection);
    persist();
  }

  // قطب‌نما reuses the SAME real report /plus/reading-compass.html already
  // shows (api.readingCompass() — a coverage derivation over the user's own
  // consumption, no interest-guessing) — never a second, invented signal.
  // Its two buckets map directly onto مسیریاب's two compass suggestions:
  // `same_area` (unread items in the pillar read the most) seeds "ادامه در
  // همون حوزه", `unexplored` (items from the largest untouched پیلارها)
  // seeds "یه حوزه‌ی تازه کشف کن". Picking either just seeds state.path and
  // hands off to the exact same optionsFor-driven flow every other entry
  // point uses — قطب‌نما only guesses the START, never invents a suggestion
  // engine of its own.
  async function renderCompassStep() {
    if (!me) {
      const signIn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
      signIn.addEventListener('click', async () => {
        const res = await openLoginModal({ returnTo: location.pathname });
        if (res && res.user) location.reload();
      });
      compassStep.replaceChildren(compassStep.firstChild, el('div', { class: 'dcp-wf-gate' }, [
        el('p', {}, 'قطب‌نما از رویِ تاریخچه‌ی واقعیِ مطالعه‌ات پیشنهاد می‌ده — برای دیدنش اول وارد شو.'),
        signIn,
        ...guestPremiumExtras('wayfinder-compass'),
      ]));
      return;
    }
    if (!isPremium) {
      const note = lapsedNote(me);
      compassStep.replaceChildren(compassStep.firstChild, el('div', { class: 'dcp-wf-gate' }, [
        note ? el('p', { class: 'dcp-gate-lapsed' }, note) : null,
        el('p', {}, 'قطب‌نما ویژه‌ی دنت‌کست پریمیومه — از رویِ چیزهایی که واقعاً خوندی مسیرو برات می‌چینه.'),
        premiumCta('wayfinder-compass'),
      ].filter(Boolean)));
      return;
    }

    compassStep.replaceChildren(compassStep.firstChild, el('p', { class: 'dcp-loading' }, 'در حال بررسیِ تاریخچه‌ی مطالعه‌ات…'));
    const data = await api.readingCompass().catch(() => null);
    // stale response guard: persona/mode may have changed while this was in flight
    if (state.mode !== 'compass') return;

    if (!data || !data.total_read) {
      compassStep.replaceChildren(compassStep.firstChild, compassEmptyCard(
        'هنوز چیزی برای قطب‌نما نیست',
        'قطب‌نما وقتی فعال می‌شه که حداقل یه مقاله یا اپیزود رو تموم کرده باشی.'));
      return;
    }

    const cards = [];
    if (data.top_cluster && data.same_area.length) {
      const seed = data.same_area[0];
      cards.push(pickCard({
        title: `ادامه در «${data.top_cluster.fa}»`,
        sub: `بیشترین مطالعه‌ات همین‌جا بوده — «${seed.title}» رو هنوز نخوندی`,
        accent: accentFor(engine, data.top_cluster.key),
        onClick: () => startFromCompass(seed.content_id),
      }));
    }
    if (data.unexplored.length) {
      const seed = data.unexplored[0];
      const seedInfo = nodeInfo(engine, seed.content_id);
      cards.push(pickCard({
        title: 'یه حوزه‌ی تازه رو کشف کن',
        sub: `اصلاً سراغش نرفتی — شروع با «${seed.title}»`,
        accent: seedInfo ? accentFor(engine, seedInfo.cluster) : null,
        onClick: () => startFromCompass(seed.content_id),
      }));
    }
    if (!cards.length) {
      compassStep.replaceChildren(compassStep.firstChild, compassEmptyCard(
        'همه‌چیزو خوندی',
        'همه‌ی چیزهایی که قطب‌نما می‌شناسه رو تا الان خوندی — خودت یه حوزه رو انتخاب کن.'));
      return;
    }
    compassStep.replaceChildren(compassStep.firstChild, el('div', { class: 'dcp-wf-grid' }, cards));
  }

  function compassEmptyCard(title, sub) {
    return el('div', { class: 'dcp-wf-card dcp-wf-compass-soon' }, [
      el('div', { class: 'dcp-wf-card-top' }, [el('h3', {}, title)]),
      el('p', { class: 'dcp-wf-card-sub' }, sub),
      el('button', {
        type: 'button', class: 'dcp-btn dcp-btn-ghost',
        onclick: () => selectMode('manual'),
      }, 'خودم مسیر رو می‌چینم'),
    ]);
  }

  function startFromCompass(contentId) {
    if (!contentId) return;
    state.pillarKey = null; state.subtopicKey = null; state.bundleId = null;
    state.path = [contentId];
    hide(pillarStep, subtopicStep, levelStep);
    renderChain();
    reveal(flowSection);
    persist();
  }
  // Persona never blocks a حوزه — it only sorts the persona's own pillars to
  // the front with a «پیشنهادی» hint. A دندان‌پزشک still reaches «دیجیتال»
  // (founder feedback: the curated list was read as a hard wall, not a
  // suggestion — every حوزه has to stay reachable from every شغل).
  function renderPillarGrid() {
    const persona = PERSONAS.find((p) => p.key === state.personaKey);
    const recommended = new Set(persona ? persona.pillars : []);
    const rows = [...pillarCatalog].sort((a, b) => {
      const ra = recommended.has(a.key) ? 0 : 1;
      const rb = recommended.has(b.key) ? 0 : 1;
      return ra - rb;
    });
    pillarGrid.replaceChildren(...rows.map((c) => {
      const active = state.pillarKey === c.key;
      return pickCard({
        title: c.title_fa,
        sub: `${faNum(c.count)} محتوا در این حوزه`,
        active,
        badge: (!active && recommended.has(c.key)) ? 'پیشنهادی' : null,
        accent: { light: c.accentRgb, dark: c.accentRgbDark },
        onClick: () => selectPillar(c.key),
      });
    }));
  }

  function selectPillar(key) {
    if (state.pillarKey === key && !state.bundleId) return;
    state.pillarKey = key; state.subtopicKey = null; state.bundleId = null; state.path = [];
    renderBundleGrid();
    renderPillarGrid();
    renderSubtopicGrid();
    hide(levelStep, flowSection);
    reveal(subtopicStep);
    persist();
  }

  function renderSubtopicGrid() {
    const c = pillarCatalog.find((x) => x.key === state.pillarKey);
    const accent = c ? { light: c.accentRgb, dark: c.accentRgbDark } : null;
    subtopicGrid.replaceChildren(...(c ? c.subtopics : []).map((s) => pickCard({
      title: s.title_fa,
      sub: `${faNum(s.count)} محتوا در این زیرموضوع`,
      active: state.subtopicKey === s.slug,
      accent,
      onClick: () => selectSubtopic(s.slug),
    })));
  }

  function selectSubtopic(slug) {
    if (state.subtopicKey === slug) return;
    state.subtopicKey = slug; state.path = [];
    renderSubtopicGrid();
    renderLevelGrid();
    hide(flowSection);
    reveal(levelStep);
    persist();
  }

  function renderLevelGrid() {
    const roots = rootsFor(engine, state.pillarKey, state.subtopicKey);
    const c = pillarCatalog.find((x) => x.key === state.pillarKey);
    const s = c ? c.subtopics.find((x) => x.slug === state.subtopicKey) : null;
    const label = s ? s.title_fa : '';
    const accent = c ? { light: c.accentRgb, dark: c.accentRgbDark } : null;
    const cards = [
      pickCard({
        title: 'از پایه شروع کن',
        sub: `قدم اولِ «${label}» رو نشونم بده`,
        active: state.path[0] === (roots && roots.basic),
        accent,
        onClick: () => startFlow(roots.basic),
      }),
    ];
    if (roots && roots.advanced) {
      cards.push(pickCard({
        title: 'باهاش آشنام',
        sub: `رد شو، عمیق‌ترِ «${label}» رو بیار`,
        active: state.path[0] === roots.advanced,
        accent,
        onClick: () => startFlow(roots.advanced),
      }));
    }
    levelGrid.replaceChildren(...cards);
  }

  function startFlow(rootId) {
    if (!rootId) return;
    state.path = [rootId];
    renderLevelGrid();
    renderChain();
    reveal(flowSection);
    persist();
  }

  // ---------------- flowchart ----------------

  function chip(text, cls) { return el('span', { class: `dcp-wf-chip${cls ? ' ' + cls : ''}` }, text); }

  function pillarFa(clusterKey) {
    const c = (engine.model.clusters || []).find((x) => x.key === clusterKey);
    return c ? c.fa : clusterKey;
  }

  function nodeChips(info) {
    return [chip(folderFa(engine.model, info.type)), chip(pillarFa(info.cluster), 'dcp-wf-chip-pillar')];
  }

  function accentStyle(clusterKey) {
    const a = accentFor(engine, clusterKey);
    return a ? `--wf-rgb-l:${a.light};--wf-rgb-d:${a.dark || a.light};` : null;
  }

  // While a باندل is active, «ادامه مسیر» follows the bundle's OWN curated
  // step order, never the generic engine guess — the generic `continue`
  // follows whichever pathway lists a content_id FIRST (a full pathway,
  // ahead of any bundle), which is a much more granular, unrelated next step
  // than what the bundle itself curated. Once the bundle's steps run out,
  // sequenceNextId simply returns null and the wizard falls through to the
  // engine's own suggestion — the natural "بسته تموم شد، حالا آزاد ادامه بده"
  // moment, with no separate end-of-bundle screen needed.
  function getOptions(id, visited) {
    const opts = optionsFor(engine, id, visited);
    if (state.bundleId) {
      const seqNext = sequenceNextId(pathwayById(engine, state.bundleId), id);
      if (seqNext && !visited.has(seqNext)) {
        opts.continue = seqNext;
        for (const f of ['deeper', 'format', 'lateral']) {
          if (opts[f] === seqNext) delete opts[f];
        }
      }
    }
    return opts;
  }

  // Shown only while the LAST node is still one of the bundle's own steps —
  // the moment a detour (عمیق‌تر/فرمت دیگه/جانبی) takes the reader off that
  // curated list, this quietly disappears rather than keep claiming a bundle
  // that is no longer actually being followed.
  function renderBundleBanner() {
    const b = state.bundleId ? pathwayById(engine, state.bundleId) : null;
    const lastId = state.path[state.path.length - 1];
    const stillInBundle = !!(b && (b.steps || []).some((s) => s.content_id === lastId));
    bundleBanner.hidden = !stillInBundle;
    if (!stillInBundle) return;
    const stepNo = (b.steps || []).findIndex((s) => s.content_id === lastId) + 1;
    bundleBanner.replaceChildren(
      el('span', { class: 'dcp-wf-bundle-tag' }, 'باندل شروع'),
      el('span', {}, `${b.title_fa} — قدم ${faNum(stepNo)} از ${faNum((b.steps || []).length)}`)
    );
  }

  function renderChain() {
    renderBundleBanner();
    chainWrap.replaceChildren();
    state.path.forEach((id, i) => {
      const isLast = i === state.path.length - 1;
      const info = nodeInfo(engine, id);
      const style = info ? accentStyle(info.cluster) : null;
      const item = el('div', { class: `dcp-wf-chain-item${style ? ' has-accent' : ''}`, style });
      if (!info) { chainWrap.appendChild(item); return; }

      if (isLast) {
        item.appendChild(fullNode(info));
        // The flow is only ever reached by a premium visitor (renderPersonaGate
        // blocks everyone else before step ۲), so there is no tier cap here —
        // a path can only run out for a genuine lack-of-more-content reason.
        const visited = new Set(state.path);
        const opts = getOptions(id, visited);
        const flavors = FLAVOR_ORDER.filter((f) => opts[f]);
        if (!flavors.length) item.appendChild(naturalEnd());
        else item.appendChild(optionsBlock(opts, flavors, i));
      } else {
        item.appendChild(histNode(info, id, i));
      }
      chainWrap.appendChild(item);
    });
  }

  function fullNode(info) {
    const style = accentStyle(info.cluster);
    return el('div', { class: `dcp-wf-node${style ? ' has-accent' : ''}`, style }, [
      el('div', { class: 'dcp-wf-node-chips' }, nodeChips(info)),
      el('h2', {}, info.title),
      // Until now the current step had no way to actually be READ — every
      // control here only picked what becomes the NEXT step. New tab, on
      // purpose: this whole flow is client-side state (persona → pillar →
      // subtopic → level → chain), rebuilt from nothing on load, so leaving
      // in the same tab would silently reset the wizard the moment someone
      // came back from the article.
      info.url ? el('a', { class: 'dcp-wf-node-open', href: info.url, target: '_blank', rel: 'noopener', onclick: returnToWayfinder }, [
        icon('icon-book', { class: 'dc-icon' }),
        el('span', {}, 'مطالعه‌ی این مطلب'),
      ]) : null,
    ].filter(Boolean));
  }

  function histNode(info, id, idx) {
    const chosenId = state.path[idx + 1];
    const visited = new Set(state.path.slice(0, idx + 1));
    const opts = getOptions(id, visited);
    const flavors = FLAVOR_ORDER.filter((f) => opts[f]);
    const pills = flavors.map((f) => {
      const targetId = opts[f];
      const isChosen = targetId === chosenId;
      const targetInfo = nodeInfo(engine, targetId);
      const targetAccent = targetInfo ? accentFor(engine, targetInfo.cluster) : null;
      const pillStyle = targetAccent ? `--wf-pill-rgb:${targetAccent.light};` : null;
      const pillBtn = el('button', {
        type: 'button',
        class: `dcp-wf-pill${isChosen ? ' is-chosen' : ''}`,
        style: pillStyle,
        title: `${FLAVORS[f].name}: ${targetInfo ? targetInfo.title : ''}`,
        onclick: () => goTo(idx, targetId),
      }, [icon(FLAVORS[f].iconId, { class: 'dc-icon dcp-wf-pill-icon' }), el('span', {}, (targetInfo ? targetInfo.title : '').slice(0, 22))]);
      // Same reasoning as the option cards below: picking this pill only
      // rebuilds the chain from here — it never opens the article. A small
      // separate open-in-new-tab affordance beside it does that instead,
      // without giving up the pill's own job of steering the flow.
      const openLink = targetInfo && targetInfo.url ? el('a', {
        class: 'dcp-wf-pill-open', href: targetInfo.url, target: '_blank', rel: 'noopener',
        title: 'باز کردنِ مقاله در تب جدید', 'aria-label': 'باز کردنِ «' + targetInfo.title + '» در تب جدید',
        onclick: returnToWayfinder,
      }, icon('icon-book', { class: 'dc-icon' })) : null;
      return el('div', { class: 'dcp-wf-pill-wrap' }, [pillBtn, openLink].filter(Boolean));
    });
    const style = accentStyle(info.cluster);
    return el('div', { class: `dcp-wf-hist${style ? ' has-accent' : ''}`, style }, [
      el('div', { class: 'dcp-wf-hist-chips' }, nodeChips(info)),
      el('div', { class: 'dcp-wf-hist-title' }, info.title),
      el('div', { class: 'dcp-wf-pill-row' }, pills),
    ]);
  }

  function optionsBlock(opts, flavors, idx) {
    const cards = flavors.map((f) => {
      const targetId = opts[f];
      const info = nodeInfo(engine, targetId);
      const spec = FLAVORS[f];
      // has-accent scopes --wf-accent to THIS option's own target pillar (a
      // جانبی suggestion often points at a different pillar than the current
      // node), so its pillar chip never just inherits the CURRENT node's color.
      const style = info ? accentStyle(info.cluster) : null;
      // Was one <button> for the whole card, so the ONLY thing clicking it
      // could do was pick this as the next step in the chain — never open
      // the article itself. Now a <div> holding two separate actions: the
      // body (still a button, still advances the chain — that behaviour
      // doesn't change) and, only when there's somewhere to send it, an
      // explicit "read it" link. New tab: the chain built so far is pure
      // client-side state, gone on reload, so leaving this tab would reset
      // the whole وایفایندر the moment someone came back from the article.
      const body = el('button', {
        type: 'button',
        class: 'dcp-wf-option-body',
        onclick: () => goTo(idx, targetId),
      }, [
        el('div', { class: 'dcp-wf-option-flavor' }, [
          el('span', { class: 'dcp-wf-option-ico' }, [icon(spec.iconId)]),
          el('div', {}, [
            el('span', { class: 'dcp-wf-option-name' }, spec.name),
            el('span', { class: 'dcp-wf-option-hint' }, spec.hint),
          ]),
        ]),
        el('span', { class: 'dcp-wf-option-title' }, info ? info.title : ''),
        info ? el('div', { class: 'dcp-wf-option-meta' }, [chip(folderFa(engine.model, info.type)), chip(pillarFa(info.cluster), 'dcp-wf-chip-pillar')]) : null,
      ]);
      const openLink = info && info.url ? el('a', {
        class: 'dcp-wf-option-open', href: info.url, target: '_blank', rel: 'noopener',
        onclick: returnToWayfinder,
      }, [icon('icon-book', { class: 'dc-icon' }), el('span', {}, 'مطالعه‌ی مستقیم')]) : null;
      return el('div', {
        class: `dcp-wf-option${spec.primary ? ' is-primary' : ''}${style ? ' has-accent' : ''}`,
        style,
      }, [body, openLink].filter(Boolean));
    });
    return el('div', {}, [
      el('div', { class: 'dcp-wf-connector' }, `${faNum(flavors.length)} گزینه برای قدم بعد`),
      el('div', { class: 'dcp-wf-options' }, cards),
    ]);
  }

  // A premium visitor's own path can genuinely run out (no unvisited item
  // shares this subtopic/cluster/tags any more) — never sold a subscription
  // they already own, just pointed at another subtopic.
  function naturalEnd() {
    const back = el('button', { type: 'button', class: 'dcp-btn dcp-btn-ghost' }, 'برگشتن به انتخاب زیرموضوع');
    back.addEventListener('click', () => subtopicStep.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    return el('div', { class: 'dcp-wf-gate' }, [
      el('h2', {}, 'به همین‌جا رسیدی'),
      el('p', { class: 'dcp-muted' }, 'دیگه پیشنهاد تازه‌ای توی همین زیرموضوع نمونده — از یه زیرموضوعِ دیگه ادامه بده.'),
      back,
    ]);
  }

  function goTo(idx, targetId) {
    state.path = state.path.slice(0, idx + 1).concat([targetId]);
    renderChain();
    requestAnimationFrame(() => {
      const items = chainWrap.querySelectorAll('.dcp-wf-chain-item');
      const last = items[items.length - 1];
      if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    persist();
  }

  // Re-plays a persisted snapshot of `state` through the SAME render/reveal
  // calls a person clicking through would trigger — never a raw DOM/state
  // copy, so a future change to how a step renders can't drift out of step
  // with what restore produces. Validated bottom-up BEFORE anything is
  // mutated: every id it would apply is checked against the just-loaded,
  // live engine/catalog first, and the whole thing is abandoned at the
  // first mismatch (a pillar renamed, a content id unpublished since the
  // snapshot was taken) rather than applying a partially-broken restore.
  // Returns true if it restored something (caller then skips its own
  // from-scratch renderPersonaGrid()).
  function tryRestore() {
    const rec = readPersistedWfState();
    if (!rec || !rec.personaKey) return false;
    if (!PERSONAS.some((p) => p.key === rec.personaKey)) return false;
    if (rec.mode && rec.mode !== 'manual' && rec.mode !== 'compass') return false;

    let pillarEntry = null;
    if (rec.mode === 'manual' && rec.pillarKey) {
      pillarEntry = pillarCatalog.find((c) => c.key === rec.pillarKey);
      if (!pillarEntry) return false;
      if (rec.subtopicKey && !pillarEntry.subtopics.some((s) => s.slug === rec.subtopicKey)) return false;
    }
    if (rec.mode === 'manual' && rec.bundleId && !pathwayById(engine, rec.bundleId)) return false;
    if (rec.path && rec.path.length && rec.path.some((id) => !nodeInfo(engine, id))) return false;

    // Validated — apply, in the same order a person would have clicked.
    // state.path is set here, up front, rather than down at the flowSection
    // block below: renderLevelGrid() (reached earlier, from the subtopicKey
    // branch) reads state.path[0] to flag which level card is "در حال
    // نمایش" — setting it after that render left the level step's own
    // active badge missing on every restore.
    state.path = rec.path ? rec.path.slice() : [];
    state.personaKey = rec.personaKey;
    renderPersonaGrid();
    show(modeStep);

    if (!isPremium) {
      // Lapsed or never premium since this was saved: stop exactly where a
      // live click would — at the gate, nothing past step ۱ restored.
      renderPersonaGate();
      return true;
    }

    if (rec.mode) {
      state.mode = rec.mode;
      renderModeGrid();
      if (rec.mode === 'compass') {
        hide(pillarStep, subtopicStep, levelStep);
        show(compassStep);
        renderCompassStep();
      } else {
        hide(compassStep);
        show(pillarStep);
        renderBundleBlock();
        renderPillarGrid();

        if (rec.bundleId) {
          state.bundleId = rec.bundleId;
          renderBundleGrid();
          renderPillarGrid();
          hide(subtopicStep, levelStep);
        } else if (rec.pillarKey) {
          state.pillarKey = rec.pillarKey;
          renderBundleGrid();
          renderPillarGrid();
          renderSubtopicGrid();
          show(subtopicStep);

          if (rec.subtopicKey) {
            state.subtopicKey = rec.subtopicKey;
            renderSubtopicGrid();
            renderLevelGrid();
            show(levelStep);
          }
        }
      }
    }

    if (state.path.length) {
      renderChain();
      show(flowSection);
    }

    // One jump to the deepest point reached — not reveal()'s smooth scroll,
    // which is for a click reacting to something already on screen; this is
    // a page load with nothing to animate from.
    requestAnimationFrame(() => {
      const target = !flowSection.hidden ? flowSection
        : !levelStep.hidden ? levelStep
        : !subtopicStep.hidden ? subtopicStep
        : !pillarStep.hidden ? pillarStep
        : !compassStep.hidden ? compassStep
        : modeStep;
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
    return true;
  }

  if (!tryRestore()) renderPersonaGrid();
}
