// The single client-side model of the content index (clusters / subtopics /
// slugs). The dashboard navigation tree renders a highlight-count layer over it;
// the Phase 3 hex completion map will render a progress layer over the SAME
// model with a different data source. Do not fork this into two features.
let modelPromise;

export function getModel() {
  if (!modelPromise) {
    modelPromise = fetch('/plus/content-index.json', { credentials: 'omit' })
      .then((r) => (r.ok ? r.json() : { clusters: [], byContent: {} }))
      .catch(() => ({ clusters: [], byContent: {} }));
  }
  return modelPromise;
}

// content_id -> { cluster, subtopic, type, title, url } or null.
export function contentInfo(model, contentId) {
  return (model.byContent && model.byContent[contentId]) || null;
}

// Detect the topic key for a topic/category landing page, or null if the current
// path is not one. The real topic/category landing pages are the pillar category
// pages (/pillar/<cluster>/); their archive is scoped to exactly that category's
// content (spec 2.8). Content-type index pages (/insight/, /notecast/) are NOT
// topics and get no archive entry point, so a landing page never shows a set that
// spans multiple categories.
export function landingTopicKey(model, pathname) {
  const segs = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (segs[0] === 'pillar' && segs[1] && segs[1] !== 'index.html') {
    const exists = (model.clusters || []).some((c) => c.key === segs[1]);
    return exists ? 'cluster:' + segs[1] : null;
  }
  return null;
}
