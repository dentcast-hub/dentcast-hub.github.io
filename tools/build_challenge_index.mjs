// Build plus/challenges.json — the چالش block's PUBLIC half only.
//
// This file is GENERATED, never hand-written (handoff §11.4). It carries
// exactly the question text and the image path for every published چالش —
// NEVER the founder's answer and NEVER the key points (RULE 2): those live in
// the `challenges` database table only, written through GET /admin, because
// this file is fetched straight off the CDN by any browser and a committed
// answer key defeats the premium gate and the feature in one devtools tab.
//
// Source of truth: the page's own markup. Workflow step 4.14 writes, inside
// the folder's normal prose box, a question element carrying
// `data-dc-challenge-question` and (optionally) an `<img data-dc-challenge-image>`
// beside it — the چالش's "body", the same way an ordinary post's body is its
// prose. This script walks the specialist content folders, finds that
// markup, and reshapes it into the per-content_id lookup plus/js/challenge.js
// fetches.
//
// content_id = page path relative to repo root, without the leading slash or
// ".html" — the same identifier plus/content-index.json, the quiz index and
// the flashcards index use.
//
// Run from the repo root:  node tools/build_challenge_index.mjs
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Same exclusions the flashcards/quiz builders enforce: LiteCast is `.ir`-only
// with its own separate brain and no چالش machinery of its own (RULE 16's
// sibling exception), `/en/` mirrors get no چالش (RULE 16 — a different
// content_id with no row in `challenges`), and an `index.html` leaf is a
// landing page, never content.
function isExcludedContentId(contentId) {
  const segments = contentId.split('/');
  if (segments[0] === 'litecast') return true;
  if (segments.includes('en')) return true;
  if (segments[segments.length - 1] === 'index') return true;
  return false;
}

// The specialist content folders a چالش can be published into (handoff §0 —
// "an existing folder, chairside/, insight/, whichever the founder names").
// Everything else (plus/, plus-api/, tools/, assets/, pillar/, up-board/,
// spot/, glossary/, …) is infrastructure or a differently-shaped generated
// page and is never walked.
const CONTENT_DIRS = [
  'chairside', 'dentai', 'dentcast-plus', 'episodes', 'insight',
  'litecast', 'metanotes', 'notecast', 'sharehub',
];

function walkHtml(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walkHtml(full));
    else if (/\.html$/i.test(name)) out.push(full);
  }
  return out;
}

// Strip tags + collapse the handful of HTML entities the founder's own
// prose can carry (&amp;/&lt;/&gt;/&quot;/&#39;/&nbsp;), same posture every
// other builder in this directory takes rather than pulling in an HTML parser.
function textOf(fragment) {
  return fragment
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractChallenge(html) {
  if (!html.includes('data-dc-challenge-question')) return null;

  const qMatch = html.match(/<([a-zA-Z0-9]+)\b[^>]*\bdata-dc-challenge-question\b[^>]*>([\s\S]*?)<\/\1>/);
  const question = qMatch ? textOf(qMatch[2]) : '';
  if (!question) return null;

  const imgMatch = html.match(/<img\b[^>]*\bdata-dc-challenge-image\b[^>]*>/);
  let image = null;
  if (imgMatch) {
    const src = imgMatch[0].match(/\bsrc\s*=\s*"([^"]+)"/) || imgMatch[0].match(/\bsrc\s*=\s*'([^']+)'/);
    image = src ? src[1] : null;
  }
  if (!image) {
    const qOpen = html.match(/<([a-zA-Z0-9]+)\b[^>]*\bdata-dc-challenge-question\b[^>]*>/);
    if (qOpen) {
      const attr = qOpen[0].match(/\bdata-dc-challenge-image\s*=\s*"([^"]+)"/)
        || qOpen[0].match(/\bdata-dc-challenge-image\s*=\s*'([^']+)'/);
      image = attr ? attr[1] : null;
    }
  }

  return { question, image };
}

const byContent = {};
let totalPages = 0;

for (const dir of CONTENT_DIRS) {
  for (const file of walkHtml(join(root, dir))) {
    const contentId = relative(root, file).replace(/\\/g, '/').replace(/\.html$/i, '');
    if (isExcludedContentId(contentId)) continue;

    const html = readFileSync(file, 'utf8');
    const challenge = extractChallenge(html);
    if (!challenge) continue;

    byContent[contentId] = challenge;
    totalPages += 1;
  }
}

// The one mistake that cannot be walked back once this file is in git
// history: never let the founder's answer or key points leak into the public
// index, even by an accidental future edit to the extraction above.
//
// image must be site-absolute (leading "/"), never a bare filename. The
// standalone page happens to render a bare filename correctly (the document
// itself lives in the same folder), but plus/js/challenge.js writes this
// value straight into <img src>, and the desktop 3-column shell injects the
// article's markup IN PLACE inside index.html (not an iframe) — a bare
// filename then resolves against the site root and 404s there. insight-68
// shipped exactly this bug (fixed 2026-08-30: "insight68.webp" -> "/insight/
// insight68.webp"); this assertion is what stops it recurring silently.
for (const [contentId, entry] of Object.entries(byContent)) {
  if ('answer_fa' in entry || 'key_points' in entry) {
    throw new Error('build_challenge_index: answer_fa/key_points must never appear in plus/challenges.json');
  }
  if (entry.image && !entry.image.startsWith('/')) {
    throw new Error(
      `build_challenge_index: ${contentId}'s data-dc-challenge-image ("${entry.image}") ` +
      'is not site-absolute — prefix it with the folder path (e.g. "/insight/insight68.webp") ' +
      'or it breaks on the desktop shell.'
    );
  }
}

const out = {
  version: 1,
  generatedFrom: 'page markup (data-dc-challenge-question / data-dc-challenge-image); see workflow step 4.14',
  contentCount: totalPages,
  byContent,
};

writeFileSync(resolve(root, 'plus', 'challenges.json'), JSON.stringify(out, null, 0) + '\n');
console.log(`Wrote plus/challenges.json: ${totalPages} چالش pages.`);
