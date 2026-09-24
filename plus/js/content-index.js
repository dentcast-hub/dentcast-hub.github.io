// The single client-side model of the content index (clusters / subtopics /
// slugs). The dashboard navigation tree renders a highlight-count layer over it;
// the Phase 3 hex completion map will render a progress layer over the SAME
// model with a different data source. Do not fork this into two features.
let modelPromise;

// refresh:true re-fetches the content index (used when the dashboard opens, in
// case new content has been published since the page loaded).
export function getModel({ refresh = false } = {}) {
  if (refresh) modelPromise = undefined;
  if (!modelPromise) {
    modelPromise = fetch('/plus/content-index.json' + (refresh ? '?t=' + (window.performance ? Math.floor(performance.now()) : '') : ''), { credentials: 'omit', cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { folders: [], clusters: [], byContent: {} }))
      .catch(() => ({ folders: [], clusters: [], byContent: {} }));
  }
  return modelPromise;
}

// The API's folder numbers, re-based on the PUBLISHED index this browser just
// read. The API keeps its own copy of the index and that copy can lag the site
// by a publish (plak1-6, 1405/07/02: the site said six parts, the API said
// five, so a reader who had read all six saw «۵ از ۵» on the section page and
// ٪۸۳ on the dashboard). The total is therefore the larger of the two — a
// folder only ever grows between rebuilds — and the reader's count is the
// API's UNCAPPED `consumed`, capped here against that total. An older API that
// sends no `consumed` keeps its own capped `read`, and a model that failed to
// load changes nothing.
export function freshFolders(apiFolders, model) {
  const staticTotal = new Map(((model && model.folders) || []).map((f) => [f.key, f.total || 0]));
  return (apiFolders || []).map((f) => {
    const total = Math.max(f.total || 0, staticTotal.get(f.key) || 0);
    const n = typeof f.consumed === 'number' ? f.consumed : (f.read || 0);
    return { ...f, total, read: Math.min(n, total) };
  });
}

// content_id -> { cluster, subtopic, type, title, url } or null.
export function contentInfo(model, contentId) {
  return (model.byContent && model.byContent[contentId]) || null;
}

// English brand names per content type/folder key (the index only carries the
// Persian label). Shared by the dashboard's per-folder progress bars and the
// learning-pathway step list, so the same type always reads the same way.
// Falls back to the folder key itself so a new folder still renders something.
export const FOLDER_EN = {
  episodes: 'Podcast',
  notecast: 'NoteCast',
  insight: 'Clinical Insight',
  dentai: 'DentAI',
  chairside: 'Chairside',
  metanotes: 'MetaNote',
  glossary: 'Glossary',
  sharehub: 'ShareHub',
  photocast: 'PhotoCast',
  'dentcast-plus': 'DentCast+',
  promptologist: 'Promptologist',
  'plak-sefr': 'Plak-e Sefr',
};

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
