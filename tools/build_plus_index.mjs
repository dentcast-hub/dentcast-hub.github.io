// Build plus/content-index.json from dentcast-brain.json.
//
// This compact index is the single taxonomy model shared by:
//   - the dashboard navigation tree (Phase 1)
//   - the hex completion map (Phase 3, a different data layer over the same model)
//   - the server (/tree, /highlights?topic, /progress)
//
// content_id = page_url without the leading slash and ".html" (matches the
// client's detectContentId()). Run from the repo root:  node tools/build_plus_index.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const brain = JSON.parse(readFileSync(resolve(root, 'dentcast-brain.json'), 'utf8'));

const CLUSTER_FA = {
  implantology: 'ایمپلنتولوژی',
  'fixed-pros': 'پروتز ثابت',
  bonding: 'باندینگ',
  ceramics: 'سرامیک',
  occlusion: 'اکلوژن',
  'treatment-planning': 'طرح درمان',
  esthetic: 'زیبایی',
  operative: 'ترمیمی',
  'removable-pros': 'پروتز متحرک',
  digital: 'دیجیتال',
  'oral-medicine': 'طب دهان',
};

const SUBTOPIC_FA = {
  cementation: 'سمان‌گذاری', preparation: 'تراش', impression: 'قالب‌گیری',
  'post-and-core': 'پست و کور', 'crowns-onlays': 'روکش و آنله', failures: 'شکست‌ها',
  strategies: 'راهبردها', clinical: 'بالینی', advanced: 'پیشرفته',
  types: 'انواع', 'surface-prep': 'آماده‌سازی سطح', indications: 'اندیکاسیون‌ها', basics: 'مبانی',
  'vertical-dimension': 'بعد عمودی', 'tooth-wear-dahl': 'سایش دندان و روش دال',
  'tmd-orofacial-pain': 'اختلالات مفصل و درد صورت', 'occlusal-analysis-adjustment': 'آنالیز و تنظیم اکلوزال',
  'occlusal-scheme-guidance': 'طرح و گاید اکلوزال',
  'peri-implant-health': 'سلامت اطراف ایمپلنت', 'surgical-planning': 'طرح جراحی',
  'restoration-design': 'طراحی رستوریشن', 'prosthetic-components': 'اجزای پروتزی', fundamentals: 'مبانی',
  'implant-overdentures': 'اوردنچر متکی بر ایمپلنت', 'snap-on-smile': 'اسنپ‌ان‌اسمایل', 'complete-dentures': 'دنچر کامل',
  'smile-design': 'طراحی لبخند', 'veneers-laminates': 'ونیر و لمینت', 'shade-and-whitening': 'رنگ و سفید کردن',
  'caries-management': 'مدیریت پوسیدگی', 'direct-restorations': 'ترمیم مستقیم', 'cracked-tooth': 'دندان ترک‌خورده',
  'cad-cam': 'کد/کم', 'intraoral-scanning': 'اسکن داخل‌دهانی', ai: 'هوش مصنوعی', 'digital-workflow': 'گردش‌کار دیجیتال',
  'comprehensive-diagnosis': 'تشخیص جامع', 'replacing-missing-teeth': 'جایگزینی دندان ازدست‌رفته',
  'extraction-vs-preservation': 'کشیدن یا حفظ دندان',
};

const prettify = (s) => s.replace(/-/g, ' ');
const toContentId = (url) => url.replace(/^\/+/, '').replace(/\.html$/i, '');

const byContent = {};
const clusters = new Map(); // key -> { key, fa, contentIds:Set, subs: Map }

for (const e of brain) {
  const url = e.page_url;
  const primary = e.pillar && e.pillar.primary;
  if (!url || !primary) continue;
  const contentId = toContentId(url);
  if (byContent[contentId]) continue; // first wins
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

  if (!clusters.has(primary)) {
    clusters.set(primary, { key: primary, fa: CLUSTER_FA[primary] || prettify(primary), contentIds: new Set(), subs: new Map() });
  }
  const c = clusters.get(primary);
  c.contentIds.add(contentId);
  if (subtopic) {
    if (!c.subs.has(subtopic)) c.subs.set(subtopic, { key: subtopic, fa: SUBTOPIC_FA[subtopic] || prettify(subtopic), contentIds: new Set() });
    c.subs.get(subtopic).contentIds.add(contentId);
  }
}

const clustersOut = [...clusters.values()]
  .map((c) => ({
    key: c.key,
    fa: c.fa,
    contentCount: c.contentIds.size,
    contentIds: [...c.contentIds],
    subtopics: [...c.subs.values()]
      .map((s) => ({ key: s.key, fa: s.fa, contentCount: s.contentIds.size, contentIds: [...s.contentIds] }))
      .sort((a, b) => b.contentCount - a.contentCount),
  }))
  .sort((a, b) => b.contentCount - a.contentCount);

const out = {
  version: 1,
  generatedFrom: 'dentcast-brain.json',
  clusterCount: clustersOut.length,
  contentCount: Object.keys(byContent).length,
  clusters: clustersOut,
  byContent,
};

const outPath = resolve(root, 'plus', 'content-index.json');
writeFileSync(outPath, JSON.stringify(out, null, 0) + '\n');
console.log(`Wrote ${outPath}: ${out.clusterCount} clusters, ${out.contentCount} content pages.`);
