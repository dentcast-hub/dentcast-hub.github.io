// The مسیریاب recommendation engine — computes "what to suggest next" live
// from the real content graph. Nothing here is hand-authored per article:
// `continue` prefers a curated pathway's own next step when the current
// content sits in one (plus/pathways.json); `deeper`/`format`/`lateral` come
// from plus/content-index.json's cluster/subtopic/hashtag overlap. As new
// content publishes and joins a cluster/subtopic or a pathway, it becomes a
// candidate automatically — nobody has to add a node by hand.
import { getModel, contentInfo } from './content-index.js?v=49';

let _pathwaysPromise;
function pathwaysModel() {
  if (!_pathwaysPromise) {
    _pathwaysPromise = fetch('/plus/pathways.json', { credentials: 'omit', cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []);
  }
  return _pathwaysPromise;
}

let _pillarsPromise;
function pillarsCatalog() {
  if (!_pillarsPromise) {
    _pillarsPromise = fetch('/plus/pillar-subtopics.json', { credentials: 'omit', cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({}));
  }
  return _pillarsPromise;
}

// id -> Set(tagKey), and id -> the next content_id along whichever curated
// pathway lists it first (a pathway a viewer never enrolled in still counts —
// this only borrows its ORDER, not its enrollment/progress machinery).
function buildIndexes(model, pathways) {
  const tagsOf = new Map();
  for (const t of model.tags || []) {
    for (const id of t.contentIds || []) {
      if (!tagsOf.has(id)) tagsOf.set(id, new Set());
      tagsOf.get(id).add(t.key);
    }
  }
  const nextInPathway = new Map();
  for (const pw of pathways) {
    const steps = pw.steps || [];
    for (let i = 0; i < steps.length - 1; i++) {
      const cur = steps[i].content_id;
      if (!nextInPathway.has(cur)) nextInPathway.set(cur, steps[i + 1].content_id);
    }
  }
  return { tagsOf, nextInPathway };
}

export async function loadEngine() {
  const [model, pathways, pillars] = await Promise.all([getModel(), pathwaysModel(), pillarsCatalog()]);
  const { tagsOf, nextInPathway } = buildIndexes(model, pathways);
  return { model, pillars, tagsOf, nextInPathway, pathways };
}

// Starter bundles («شروع کن») — a short, curated subset of ONE full
// pathway's steps, offered as the دانشجو persona's recommended entry point
// (founder feedback: a student is better served starting from the basics a
// bundle already curated than guessing a حوزه cold). `catalog()`/`optionsFor`
// never surface these — a bundle is picked as a whole, not discovered node
// by node.
export function bundles(engine) {
  return (engine.pathways || []).filter((p) => p.kind === 'bundle');
}

export function pathwayById(engine, id) {
  return (engine.pathways || []).find((p) => p.id === id) || null;
}

// The next content_id in a specific bundle/pathway's OWN step order — never
// the generic engine `continue`, which follows whichever pathway lists a
// content_id FIRST (full pathways before bundles) and can jump to a totally
// different, much more granular next step than the bundle's own curated one.
export function sequenceNextId(pw, currentId) {
  if (!pw) return null;
  const steps = pw.steps || [];
  const i = steps.findIndex((s) => s.content_id === currentId);
  if (i === -1 || i >= steps.length - 1) return null;
  return steps[i + 1].content_id;
}

// Real pillar → subtopic catalog for the wizard, but only subtopics that
// actually have published content — an editorial subtopic with zero live
// items (plus/pillar-subtopics.json carries the full taxonomy, ahead of
// content) never appears as something to pick.
export function catalog(engine) {
  const counts = new Map(); // "pillar|subtopic" -> count
  for (const info of Object.values(engine.model.byContent)) {
    if (!info.cluster || !info.subtopic) continue;
    const key = info.cluster + '|' + info.subtopic;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const out = [];
  for (const cluster of engine.model.clusters || []) {
    const def = engine.pillars[cluster.key];
    if (!def) continue; // no /pillar/ page for this cluster (e.g. oral-medicine)
    const subtopics = (def.subtopics || [])
      .map((s) => ({ slug: s.slug, title_fa: s.title_fa, count: counts.get(cluster.key + '|' + s.slug) || 0 }))
      .filter((s) => s.count > 0);
    if (!subtopics.length) continue;
    out.push({
      key: cluster.key, title_fa: cluster.fa, count: cluster.contentCount, subtopics,
      accentRgb: def.accent_rgb, accentRgbDark: def.accent_rgb_dark,
    });
  }
  return out;
}

// The SAME per-pillar accent tools/build_pillar.py uses for that pillar's own
// /pillar/<slug>/ page (PILLAR_ACCENT_RGB) — reused here, not reinvented, so
// a subject reads as the same color everywhere on the site.
export function accentFor(engine, pillarKey) {
  const c = (engine.model.clusters || []).find((x) => x.key === pillarKey);
  const def = c && engine.pillars[c.key];
  return def ? { light: def.accent_rgb, dark: def.accent_rgb_dark } : null;
}

// Natural insertion order (content-index.json is generated from
// dentcast-brain.json in publish order), never re-sorted — a sort would
// scramble the one signal of "earlier/simpler" this data actually carries.
function idsInSubtopic(engine, pillarKey, subtopicKey, exclude) {
  const out = [];
  for (const [id, info] of Object.entries(engine.model.byContent)) {
    if (exclude.has(id)) continue;
    if (info.cluster === pillarKey && info.subtopic === subtopicKey) out.push(id);
  }
  return out;
}

// The two entry points offered at "توی این زیرموضوع در چه سطحی هستی؟" —
// the subtopic's first item, and one roughly midway through it. `advanced`
// is null when the subtopic is too small to offer a distinct second entry.
export function rootsFor(engine, pillarKey, subtopicKey) {
  const ids = idsInSubtopic(engine, pillarKey, subtopicKey, new Set());
  if (!ids.length) return null;
  const basic = ids[0];
  const midIdx = Math.floor(ids.length / 2);
  const advanced = ids[midIdx] !== basic ? ids[midIdx] : null;
  return { basic, advanced };
}

// The (up to) four suggestions for `id`, given everything already shown
// this session (`visited`, a Set of content_ids so far). Any flavor with
// no honest candidate is simply left out of the returned object — never a
// fabricated dead end wearing an empty label.
export function optionsFor(engine, id, visited) {
  const info = contentInfo(engine.model, id);
  if (!info || !info.cluster || !info.subtopic) return {};
  const exclude = new Set(visited);
  exclude.add(id);

  const out = {};

  const nextId = engine.nextInPathway.get(id);
  if (nextId && !exclude.has(nextId)) out.continue = nextId;

  const sameSubtopic = idsInSubtopic(engine, info.cluster, info.subtopic, exclude)
    .filter((cid) => cid !== out.continue);

  if (!out.continue && sameSubtopic.length) out.continue = sameSubtopic[0];

  const deeperPool = sameSubtopic.filter((cid) => cid !== out.continue);
  if (deeperPool.length) out.deeper = deeperPool[0];

  const used = new Set([out.continue, out.deeper].filter(Boolean));
  const otherFormat = sameSubtopic.find(
    (cid) => !used.has(cid) && contentInfo(engine.model, cid).type !== info.type
  );
  if (otherFormat) out.format = otherFormat;
  if (out.format) used.add(out.format);

  const myTags = engine.tagsOf.get(id);
  if (myTags && myTags.size) {
    let best = null;
    let bestScore = 0;
    for (const [cid, cinfo] of Object.entries(engine.model.byContent)) {
      if (exclude.has(cid) || used.has(cid)) continue;
      if (!cinfo.cluster || cinfo.subtopic === info.subtopic) continue;
      const theirTags = engine.tagsOf.get(cid);
      if (!theirTags) continue;
      let shared = 0;
      for (const t of myTags) if (theirTags.has(t)) shared++;
      if (shared > bestScore) { bestScore = shared; best = cid; }
    }
    if (best) out.lateral = best;
  }

  return out;
}

export function nodeInfo(engine, id) {
  return contentInfo(engine.model, id);
}
