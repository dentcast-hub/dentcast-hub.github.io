// مسیریاب — renders the wizard (شغل → حوزه → زیرموضوع → سطح آشنایی) and the
// resulting flowchart. The free depth is capped at one real suggestion past
// the starting point: enough to show the mechanism actually works, short
// enough that nobody learns the whole subtopic before ever seeing the
// premium gate (founder feedback — some demo chains ran too long).
import { el, icon, faNum } from './util.js?v=24';
import { premiumCta, guestPremiumExtras, lapsedNote } from './premium-cta.js?v=24';
import { openLoginModal } from './login-modal.js?v=24';
import { loadEngine, catalog, rootsFor, optionsFor, nodeInfo, accentFor } from './wayfinder-engine.js?v=24';

const FLAVORS = {
  continue: { name: 'ادامه مسیر', hint: 'قدم منطقی بعدی', primary: true, iconId: 'icon-arrow-left' },
  deeper: { name: 'عمیق‌تر برو', hint: 'همون موضوع، جزئیات بیشتر', iconId: 'icon-microscope' },
  format: { name: 'با فرمت دیگه', hint: 'همون مبحث، شکل متفاوت', iconId: 'icon-film' },
  lateral: { name: 'جانبی', hint: 'مبحث مرتبط، زاویه‌ی تازه', iconId: 'icon-link' },
};
const FLAVOR_ORDER = ['continue', 'deeper', 'format', 'lateral'];

// Which pillars matter to each job is an editorial call (like the rest of
// the wizard's copy) — the pillars/subtopics THEMSELVES, and every content
// suggestion inside them, are real and live (wayfinder-engine.js / catalog()).
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

  const state = { personaKey: null, mode: null, pillarKey: null, subtopicKey: null, path: [] };

  const wrap = el('div', { class: 'dcp-wf' });
  const { section: personaStep, grid: personaGrid } = stepSection('۱', 'چیکاره‌ای؟');
  const { section: modeStep, grid: modeGrid } = stepSection('۲', 'چطور شروع کنیم؟');
  const compassStep = el('section', { class: 'dcp-wf-step' }, [
    el('div', { class: 'dcp-wf-step-label' }, [el('span', { class: 'dcp-wf-step-num' }, '۳'), el('span', {}, 'قطب‌نما')]),
  ]);
  const { section: pillarStep, grid: pillarGrid } = stepSection('۳', 'دوست داری از کدوم حوزه شروع کنیم؟');
  const { section: subtopicStep, grid: subtopicGrid } = stepSection('۴', 'کدوم زیرموضوعش؟');
  const { section: levelStep, grid: levelGrid } = stepSection('۵', 'توی این زیرموضوع در چه سطحی هستی؟');
  const chainWrap = el('div', { class: 'dcp-wf-chain' });
  const flowSection = el('section', { class: 'dcp-wf-step dcp-wf-flow', hidden: true }, [chainWrap]);

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
    state.mode = null; state.pillarKey = null; state.subtopicKey = null; state.path = [];
    renderPersonaGrid();
    renderModeGrid();
    hide(compassStep, pillarStep, subtopicStep, levelStep, flowSection);
    reveal(modeStep);
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
    state.pillarKey = null; state.subtopicKey = null; state.path = [];
    renderModeGrid();
    hide(flowSection);
    if (mode === 'compass') {
      hide(pillarStep, subtopicStep, levelStep);
      renderCompassComingSoon();
      reveal(compassStep);
    } else {
      hide(compassStep, subtopicStep, levelStep);
      renderPillarGrid();
      reveal(pillarStep);
    }
  }

  function renderCompassComingSoon() {
    const body = el('div', { class: 'dcp-wf-card dcp-wf-compass-soon' }, [
      el('div', { class: 'dcp-wf-card-top' }, [
        el('h3', {}, 'قطب‌نما به‌زودی'),
        el('span', { class: 'dcp-wf-badge' }, 'در دست ساخت'),
      ]),
      el('p', { class: 'dcp-wf-card-sub' },
        'قطب‌نما باید بر اساس فعالیت واقعیِ حسابت پیشنهاد بده — این بخش هنوز به آن دیتا وصل نشده، پس چیزی ساختگی نشونت نمی‌دیم. فعلاً از «خودم مسیر رو می‌چینم» استفاده کن.'),
      el('button', {
        type: 'button', class: 'dcp-btn dcp-btn-ghost',
        onclick: () => selectMode('manual'),
      }, 'خودم مسیر رو می‌چینم'),
    ]);
    compassStep.replaceChildren(compassStep.firstChild, body);
  }

  function renderPillarGrid() {
    const persona = PERSONAS.find((p) => p.key === state.personaKey);
    const rows = persona.pillars
      .map((key) => pillarCatalog.find((c) => c.key === key))
      .filter(Boolean);
    pillarGrid.replaceChildren(...rows.map((c) => pickCard({
      title: c.title_fa,
      sub: `${faNum(c.count)} محتوا در این حوزه`,
      active: state.pillarKey === c.key,
      accent: { light: c.accentRgb, dark: c.accentRgbDark },
      onClick: () => selectPillar(c.key),
    })));
  }

  function selectPillar(key) {
    if (state.pillarKey === key) return;
    state.pillarKey = key; state.subtopicKey = null; state.path = [];
    renderPillarGrid();
    renderSubtopicGrid();
    hide(levelStep, flowSection);
    reveal(subtopicStep);
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

  function renderChain() {
    chainWrap.replaceChildren();
    state.path.forEach((id, i) => {
      const isLast = i === state.path.length - 1;
      const info = nodeInfo(engine, id);
      const style = info ? accentStyle(info.cluster) : null;
      const item = el('div', { class: `dcp-wf-chain-item${style ? ' has-accent' : ''}`, style });
      if (!info) { chainWrap.appendChild(item); return; }

      if (isLast) {
        item.appendChild(fullNode(info));
        const visited = new Set(state.path);
        const cappedByTier = !isPremium && i >= 1; // one real hop free, then the gate
        if (cappedByTier) {
          item.appendChild(endGate());
        } else {
          const opts = optionsFor(engine, id, visited);
          const flavors = FLAVOR_ORDER.filter((f) => opts[f]);
          if (!flavors.length) item.appendChild(naturalEnd());
          else item.appendChild(optionsBlock(opts, flavors, i));
        }
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
    ]);
  }

  function histNode(info, id, idx) {
    const chosenId = state.path[idx + 1];
    const visited = new Set(state.path.slice(0, idx + 1));
    const opts = optionsFor(engine, id, visited);
    const flavors = FLAVOR_ORDER.filter((f) => opts[f]);
    const pills = flavors.map((f) => {
      const targetId = opts[f];
      const isChosen = targetId === chosenId;
      const targetInfo = nodeInfo(engine, targetId);
      const targetAccent = targetInfo ? accentFor(engine, targetInfo.cluster) : null;
      const pillStyle = targetAccent ? `--wf-pill-rgb:${targetAccent.light};` : null;
      return el('button', {
        type: 'button',
        class: `dcp-wf-pill${isChosen ? ' is-chosen' : ''}`,
        style: pillStyle,
        title: `${FLAVORS[f].name}: ${targetInfo ? targetInfo.title : ''}`,
        onclick: () => goTo(idx, targetId),
      }, [icon(FLAVORS[f].iconId, { class: 'dc-icon dcp-wf-pill-icon' }), el('span', {}, (targetInfo ? targetInfo.title : '').slice(0, 22))]);
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
      return el('button', {
        type: 'button',
        class: `dcp-wf-option${spec.primary ? ' is-primary' : ''}${style ? ' has-accent' : ''}`,
        style,
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
    });
    return el('div', {}, [
      el('div', { class: 'dcp-wf-connector' }, `${faNum(flavors.length)} گزینه برای قدم بعد`),
      el('div', { class: 'dcp-wf-options' }, cards),
    ]);
  }

  function endGate() {
    const from = 'wayfinder-flow';
    const kids = [
      el('h2', {}, 'همین‌جا نسخه‌ی رایگان تموم می‌شه'),
      el('p', { class: 'dcp-muted' }, 'بقیه‌ی این مسیر، و بقیه‌ی مسیرهای مشابه، با پریمیوم باز می‌مونه و پیشرفتت خودکار ثبت می‌شه.'),
    ];
    if (!me) {
      const signIn = el('button', { class: 'dcp-btn dcp-btn-primary', type: 'button' }, 'ورود');
      signIn.addEventListener('click', async () => {
        const res = await openLoginModal({ returnTo: location.pathname });
        if (res && res.user) location.reload();
      });
      kids.push(signIn, ...guestPremiumExtras(from));
    } else {
      const note = lapsedNote(me);
      if (note) kids.push(el('p', { class: 'dcp-gate-lapsed' }, note));
      kids.push(premiumCta(from));
    }
    return el('div', { class: 'dcp-wf-gate' }, kids);
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
  }

  renderPersonaGrid();
}
