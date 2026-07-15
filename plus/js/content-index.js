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

// Detect the folder-landing topic key for the current path, or null. The card
// archive / flashcards live on each real folder landing page (/notecast/,
// /dentai/, ...), scoped to exactly that folder's content (prototype feedback).
// Article pages are handled as articles (workbench), not here.
export function landingTopicKey(model, pathname) {
  const segs = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  const isLanding = segs.length === 1 || (segs.length === 2 && segs[1] === 'index.html');
  if (!isLanding) return null;
  // Matches /folder/, /folder/index.html, and a root /folder.html landing.
  const folder = segs[0].replace(/\.html$/i, '');
  const known = (model.folders || []).some((f) => f.key === folder);
  return known ? 'folder:' + folder : null;
}
