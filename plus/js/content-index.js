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
// path is not one. Used for the landing-page card-archive entry point.
export function landingTopicKey(model, pathname) {
  const segs = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  // /pillar/<cluster>/(index.html)
  if (segs[0] === 'pillar' && segs[1] && segs[1] !== 'index.html') {
    const exists = (model.clusters || []).some((c) => c.key === segs[1]);
    return exists ? 'cluster:' + segs[1] : null;
  }
  // /<type>/index.html  or  /<type>/  (a content-type category landing page)
  const isIndex = segs.length === 2 && segs[1] === 'index.html';
  const isBareDir = segs.length === 1;
  if (isIndex || isBareDir) {
    const type = segs[0];
    const hasContent = Object.values(model.byContent || {}).some((v) => v.type === type);
    return hasContent ? 'type:' + type : null;
  }
  return null;
}
