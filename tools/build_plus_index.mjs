// Build plus/content-index.json — the single taxonomy model shared by the
// dashboard navigation tree (Phase 1) and the hex completion map (Phase 3).
//
// The taxonomy STRUCTURE and LABELS are taken from the site's own pillar pages
// (pillar/index.html for the categories, pillar/<key>/index.html for each
// category's subcategories), so the tree mirrors the real site exactly: same
// hierarchy, same Persian labels, same order. Highlight COUNTS are layered on at
// runtime by the API; only the user's highlights live in the DB.
//
// Content is mapped into this structure from dentcast-brain.json (pillar.primary
// / pillar.subtopic). content_id = page_url without the leading slash and
// ".html" (matches the client's detectContentId()).
//
// Run from the repo root:  node tools/build_plus_index.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');
const toContentId = (url) => url.replace(/^\/+/, '').replace(/\.html$/i, '');

// The real site content folders (the top level of the dashboard tree), in the
// order they should appear. Each links to its landing page; the article total is
// counted from disk so per-folder progress is accurate.
const FOLDER_META = [
  ['episodes', 'پادکست', '/episodes.html'],
  ['notecast', 'نوت‌کست', '/notecast/'],
  ['insight', 'کلینیکال اینسایت', '/insight/'],
  ['dentai', 'دنت‌ای‌آی', '/dentai/'],
  ['chairside', 'چیرساید', '/chairside/'],
  ['metanotes', 'متانوت', '/metanotes/'],
  ['litecast', 'لایت‌کست', '/litecast/'],
  ['glossary', 'دانشنامه', '/glossary/'],
  ['photocast', 'فوتوکست', '/photocast/'],
  ['sharehub', 'شیرهاب', '/sharehub/'],
];

function countArticles(folderKey) {
  const dir = resolve(root, folderKey);
  if (!existsSync(dir)) return 0;
  try {
    return readdirSync(dir).filter((f) => /\.html$/i.test(f) && f.toLowerCase() !== 'index.html').length;
  } catch (_) { return 0; }
}

// --- 1. Categories (clusters) from the pillar hub, in site order ------------
const hub = read('pillar/index.html');
const clusterOrder = [];
const clusterFa = {};
// Split into per-card chunks so each chunk holds exactly one data-pillar and one
// pillar-card-name, regardless of how much markup sits between them.
for (const card of hub.split('pillar-card-row').slice(1)) {
  const key = card.match(/data-pillar="([a-z0-9-]+)"/);
  const label = card.match(/pillar-card-name">\s*([^<]+?)\s*</);
  if (!key || !label || clusterFa[key[1]]) continue;
  clusterFa[key[1]] = label[1];
  clusterOrder.push(key[1]);
}

// --- 2. Subcategories (subtopics) from each pillar page, in site order ------
const subOrder = {}; // clusterKey -> [subKey...]
const subFa = {}; // clusterKey -> { subKey: label }
for (const c of clusterOrder) {
  subOrder[c] = [];
  subFa[c] = {};
  const file = `pillar/${c}/index.html`;
  if (!existsSync(resolve(root, file))) continue;
  const html = read(file);
  // Each chunk starts at a data-subtopic key and contains its pillar-card-title.
  for (const chunk of html.split('data-subtopic="').slice(1)) {
    const key = chunk.match(/^([a-z0-9-]+)"/);
    const label = chunk.match(/pillar-card-title">\s*([^<]+?)\s*</);
    if (!key || !label || subFa[c][key[1]]) continue;
    subFa[c][key[1]] = label[1];
    subOrder[c].push(key[1]);
  }
}

// --- 3. Map brain content into the structure --------------------------------
const brain = JSON.parse(read('dentcast-brain.json'));
const byContent = {};
const clusterContent = new Map(clusterOrder.map((c) => [c, new Set()]));
const subContent = new Map(); // `${cluster}::${sub}` -> Set
const prettify = (s) => s.replace(/-/g, ' ');

for (const e of brain) {
  // The brain schema is inconsistent: most types carry the page URL in `page_url`,
  // but some (all of sharehub, most of notecast) use `url`. Read either so every
  // brain entry lands in byContent — otherwise those types were silently missing
  // from the dashboard tree and the homepage "continue" resolution.
  const url = e.page_url || e.url;
  if (!url) continue;
  const contentId = toContentId(url);
  if (byContent[contentId]) continue; // first wins
  const primary = (e.pillar && e.pillar.primary) || null;
  const subtopic = (e.pillar && e.pillar.subtopic) || null;
  const type = contentId.split('/')[0];
  byContent[contentId] = {
    cluster: primary,
    subtopic,
    type,
    title: e.title || contentId,
    url,
    secondary: (e.pillar && e.pillar.secondary) || [],
  };
  // Pillar categories feed the Phase 3 map; only pillar-tagged content joins them.
  if (!primary || !clusterContent.has(primary)) continue;
  clusterContent.get(primary).add(contentId);
  if (subtopic) {
    const k = `${primary}::${subtopic}`;
    if (!subContent.has(k)) subContent.set(k, new Set());
    subContent.get(k).add(contentId);
  }
}

// --- 3b. Glossary (دانشنامه) — its own file, not the brain -------------------
// Fold glossary terms into the SAME maps so they show in the dashboard tree and
// resolve for the homepage "continue" line. Each term carries slug/url/fa_title
// and its own pillar, so it slots into clusters just like brain content.
const glossaryTerms = JSON.parse(read('glossary/glossary.json')).glossary || [];
for (const e of glossaryTerms) {
  const url = e.url;
  if (!url) continue;
  const contentId = toContentId(url);
  if (byContent[contentId]) continue; // first wins
  const primary = (e.pillar && e.pillar.primary) || null;
  const subtopic = (e.pillar && e.pillar.subtopic) || null;
  byContent[contentId] = {
    cluster: primary,
    subtopic,
    type: 'glossary',
    title: e.fa_title || e.title || contentId,
    url,
    secondary: (e.pillar && e.pillar.secondary) || [],
  };
  if (!primary || !clusterContent.has(primary)) continue;
  clusterContent.get(primary).add(contentId);
  if (subtopic) {
    const k = `${primary}::${subtopic}`;
    if (!subContent.has(k)) subContent.set(k, new Set());
    subContent.get(k).add(contentId);
  }
}

// --- 4. Emit, preserving the site's order -----------------------------------
const clusters = clusterOrder.map((c) => {
  const ids = clusterContent.get(c) || new Set();
  // Subtopics: the pillar page's order, plus any brain subtopics not listed
  // there (so no content is silently orphaned), appended after.
  const known = subOrder[c] || [];
  const extras = [...new Set(
    [...ids].map((id) => byContent[id].subtopic).filter((s) => s && !subFa[c][s]),
  )];
  const subKeys = [...known, ...extras];
  return {
    key: c,
    fa: clusterFa[c] || prettify(c),
    contentCount: ids.size,
    contentIds: [...ids],
    subtopics: subKeys.map((s) => {
      const sids = subContent.get(`${c}::${s}`) || new Set();
      return { key: s, fa: subFa[c][s] || prettify(s), contentCount: sids.size, contentIds: [...sids] };
    }),
  };
});

// Real site folders (dashboard tree top level): landing link + article total.
const folders = FOLDER_META.map(([key, fa, url]) => ({ key, fa, url, total: countArticles(key) }))
  .filter((f) => f.total > 0);

const out = {
  version: 3,
  generatedFrom: 'pillar/*.html + folder file counts + dentcast-brain.json',
  clusterCount: clusters.length,
  folderCount: folders.length,
  contentCount: Object.keys(byContent).length,
  folders,
  clusters,
  byContent,
};

writeFileSync(resolve(root, 'plus', 'content-index.json'), JSON.stringify(out, null, 0) + '\n');
console.log(`Wrote plus/content-index.json: ${folders.length} folders, ${clusters.length} pillar categories, ${out.contentCount} content pages.`);
console.log('Folders (dashboard tree top level):');
for (const f of folders) console.log(`  ${f.fa} (${f.key}) -> ${f.url} · ${f.total} مقاله`);
