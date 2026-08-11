// Build plus/flashcards-index.json — the premium app's Leitner seed catalog.
//
// This file is GENERATED, never hand-written. The single source of truth for
// flashcard content is `plus/faq-corpus.json` — the FAQ/flashcards corpus
// extracted verbatim out of page JSON-LD when the hidden-schema SEO issue
// was fixed (see .dentcast/faq-schema-removal-handoff.md). Pages no longer
// carry a `DefinedTermSet` block themselves; authoring a page's flashcards
// still writes a `DefinedTermSet` (schema.org's real vocabulary for "a set of
// defined terms/concepts", i.e. exactly what a flashcard is — a concept + its
// explanation, not a question) — it just lands in the corpus under the new
// page's content id (see workflow step 4.11), not on the page. This script
// reads the corpus and reshapes it into the per-content_id lookup the
// backend seeds a reader's deck from on `article_completed`.
//
// content_id = page path relative to repo root, without the leading slash or
// ".html" (matches toContentId() in build_quiz_index.mjs and the corpus
// extractor).
//
// Run from the repo root:  node tools/build_flashcards_index.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Same exclusions the old page-walk enforced structurally (SKIP_DIR_NAMES
// 'litecast'/'en' + the generic "any index.html is a landing page, not
// content" skip). The corpus carries no pillar/<slug>/index entries (pillar
// pages have no FAQ/flashcards schema), so the old "add pillar index.html
// back" special case is moot here — nothing to re-admit.
function isExcludedContentId(contentId) {
  const segments = contentId.split('/');
  if (segments[0] === 'litecast') return true;
  if (segments.includes('en')) return true;
  if (segments[segments.length - 1] === 'index') return true;
  return false;
}

const corpus = JSON.parse(
  readFileSync(resolve(root, 'plus', 'faq-corpus.json'), 'utf8')
);

const byContent = {};
let totalCards = 0;
let totalPages = 0;

for (const [contentId, entry] of Object.entries(corpus.byContent)) {
  if (isExcludedContentId(contentId)) continue;
  const sets = entry.definedTermSets || [];
  if (!sets.length) continue;

  const cards = [];
  for (const set of sets) {
    for (const term of set.hasDefinedTerm) {
      if (!term || term['@type'] !== 'DefinedTerm' || !term.name || !term.description) continue;
      cards.push({
        id: term['@id'] ? String(term['@id']).split('#').pop() : `c${cards.length + 1}`,
        front: term.name,
        back: term.description,
        source: term.source === 'authored' ? 'authored' : 'faq',
        ...(term.sourceFaqIndex !== undefined ? { source_faq_index: term.sourceFaqIndex } : {}),
      });
    }
  }
  if (!cards.length) continue;

  byContent[contentId] = { cards };
  totalCards += cards.length;
  totalPages += 1;
}

const out = {
  version: 1,
  generatedFrom: 'plus/faq-corpus.json (#flashcards DefinedTermSet blocks; see workflow step 4.11)',
  contentCount: totalPages,
  cardCount: totalCards,
  byContent,
};

writeFileSync(resolve(root, 'plus', 'flashcards-index.json'), JSON.stringify(out, null, 0) + '\n');
console.log(`Wrote plus/flashcards-index.json: ${totalPages} pages, ${totalCards} cards.`);
