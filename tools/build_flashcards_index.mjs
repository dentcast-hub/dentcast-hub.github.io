// Build plus/flashcards-index.json — the premium app's Leitner seed catalog.
//
// This file is GENERATED, never hand-written. The single source of truth for
// flashcard content is each page's OWN JSON-LD: a `DefinedTermSet` block
// (schema.org's real vocabulary for "a set of defined terms/concepts", i.e.
// exactly what a flashcard is — a concept + its explanation, not a question).
// Publishing a page with flashcards means adding that block to the page
// itself (see `.dentcast/workflows/README.md` step 4.11); this script just
// walks the site, collects every such block, and reshapes it into the
// per-content_id lookup the backend seeds a reader's deck from on
// `article_completed`.
//
// content_id = page path relative to repo root, without the leading slash or
// ".html" (matches toContentId() in build_plus_index.mjs and the client's
// detectContentId()).
//
// Run from the repo root:  node tools/build_flashcards_index.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Directories that are never content (the app itself, tooling, non-page
// assets) or are explicitly out of scope for flashcards (LiteCast, per Phase
// C step 0 — it stays outside the specialist ecosystem; and `/en/` mirrors,
// which carry no independent brain entry/FAQ/flashcards of their own).
const SKIP_DIR_NAMES = new Set([
  '.git', '.github', '.dentcast', '.claude', '.cursor', '.vscode',
  'node_modules', 'assets', 'fonts', 'card', 'reports',
  'plus', 'plus-api', 'litecast', 'en',
]);

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR_NAMES.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) { walk(full, out); continue; }
    if (name.toLowerCase() === 'index.html') continue; // landing/listing pages, not content
    if (/\.html$/i.test(name)) out.push(full);
  }
}

const files = [];
walk(root, files);

// pillar/<slug>/index.html pages ARE content (each is a real pillar topic
// page), but the generic walk above skips every index.html to avoid category
// landing pages. Add them back explicitly.
const pillarDir = resolve(root, 'pillar');
try {
  for (const slug of readdirSync(pillarDir)) {
    if (SKIP_DIR_NAMES.has(slug)) continue;
    const idx = join(pillarDir, slug, 'index.html');
    try { if (statSync(idx).isFile()) files.push(idx); } catch (_) { /* not a topic dir */ }
  }
} catch (_) { /* no pillar dir */ }

const toContentId = (absPath) =>
  relative(root, absPath).replace(/\\/g, '/').replace(/\.html$/i, '');

// Pull every `<script type="application/ld+json">...</script>` block and
// return the parsed ones that are (or contain) a DefinedTermSet.
function extractDefinedTermSets(html) {
  const sets = [];
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    let parsed;
    try { parsed = JSON.parse(m[1]); } catch (_) { continue; }
    const candidates = Array.isArray(parsed) ? parsed : [parsed];
    for (const c of candidates) {
      if (c && c['@type'] === 'DefinedTermSet' && Array.isArray(c.hasDefinedTerm)) {
        sets.push(c);
      }
    }
  }
  return sets;
}

const byContent = {};
let totalCards = 0;
let totalPages = 0;

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const sets = extractDefinedTermSets(html);
  if (!sets.length) continue;

  const contentId = toContentId(file);
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
  generatedFrom: 'DefinedTermSet JSON-LD on each page (see workflow step 4.11)',
  contentCount: totalPages,
  cardCount: totalCards,
  byContent,
};

writeFileSync(resolve(root, 'plus', 'flashcards-index.json'), JSON.stringify(out, null, 0) + '\n');
console.log(`Wrote plus/flashcards-index.json: ${totalPages} pages, ${totalCards} cards.`);
