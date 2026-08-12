// Build plus/quiz-index.json — the premium app's scored-quiz question bank.
//
// This file is GENERATED, never hand-written. The single source of truth for
// quiz content is `plus/faq-corpus.json` — the FAQ/flashcards corpus
// extracted verbatim out of page JSON-LD when the hidden-schema SEO issue
// was fixed (see .dentcast/faq-schema-removal-handoff.md). Pages no longer
// carry a `FAQPage` block themselves; this script reads the corpus, collects
// every FAQ Question, and keeps only the BINARY (بله/خیر) ones — the subset
// whose answers can be graded objectively without authored distractors. A
// question qualifies only when BOTH hold:
//
//   1. the question is phrased as a yes/no question (starts with «آیا» or
//      «مگر», or ends in a yes/no tail like «درست است؟» / «امکان دارد؟»), and
//   2. its answer text OPENS with an explicit verdict — «بله» or «خیر»/«نه» —
//      inside the first clause (a leading concession like «برخلافِ باورِ
//      قدیمی، خیر؛ …» is fine). The verdict becomes the answer key.
//
// Anything ambiguous (both/neither polarity in the opening clause) is
// EXCLUDED — accuracy over coverage: a scored quiz must never grade against a
// guessed key. Authoring convention going forward (workflow step 4.12):
// binary FAQ answers open with an explicit «بله،»/«خیر؛» verdict, written
// into the corpus under the new page's content id, so new questions are
// picked up mechanically.
//
// content_id = page path relative to repo root, without the leading slash or
// ".html" (matches toContentId() in build_flashcards_index.mjs and the
// corpus extractor) — this is the article identifier the premium backend
// uses to map "reader finished article X" → "these are X's quiz questions".
//
// Scope: LiteCast (patient-facing), /en/ mirrors, and the homepage are
// excluded, same as the flashcards index.
//
// Run from the repo root:  node tools/build_quiz_index.mjs
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

// A question counts as yes/no-form when it opens with an interrogative
// yes/no particle («آیا»/«مگر») or ends in a Persian yes/no tail — BUT never
// when it carries a wh-interrogative (چه/چرا/چگونه/کدام/…), which looks
// superficially binary (it still ends in a verb + ؟) yet asks for an
// explanation, not true/false. The wh-guard is what makes the generic verb
// tails «می‌کند؟»/«می‌شود؟» safe to include: a wh-question ending in a verb is
// already rejected, so the tails only admit genuine yes/no phrasings like
// «… هم صدق می‌کند؟». (A «یا» inside a question is NOT treated as either/or —
// in this corpus it almost always joins synonyms/examples inside a real
// yes/no question, e.g. «آیا کانین نیرو را جذب یا توزیع می‌کند؟».)
// NB: JS `\b` does not recognize Persian letters as word chars, so a boundary
// after «آیا»/«مگر» must be spelled out as "space or start/end".
const WH_WORD = /(^|\s)(چرا|چگونه|چطور|کدام|چند|چقدر|کِی|کی |کجا|چه )/;
const YES_NO_QUESTION = (q) => {
  if (WH_WORD.test(q)) return false;
  return (
    /^\s*[«"']?(آیا|مگر)(\s|$)/.test(q) ||
    /(درست است\؟|درسته\؟|صحت دارد\؟|واقعیت دارد\؟|امکان دارد\؟|لازم است\؟|حتمی است\؟|کافی است\؟|یکسان است\؟|مهم است\؟|خطرناک است\؟|ضروری است\؟|بهتر است\؟|وجود دارد\؟|صدق می‌کند\؟|می‌شود\؟|می‌کند\؟)\s*[»"']?\s*$/.test(q)
  );
};

// Derive the boolean key from the answer's opening clause. Returns true
// (بله), false (خیر/نه), or null (ambiguous → excluded). The verdict may sit
// anywhere in the first clause (up to the first ؛ . :), so a leading
// concession — «برخلافِ باورِ قدیمی، خیر؛ …», «در مقایسه با مینا بله، …» —
// still resolves. A clause carrying BOTH polarities, or NEITHER (a hedged
// «در اغلب شرایط…» / conditional «اگر…»), returns null and is excluded:
// accuracy over coverage, never grade against a guessed key.
function deriveKey(answer) {
  const opening = answer.replace(/^[\s«"']+/, '');
  const clause = opening.split(/[؛.:]/)[0].slice(0, 80);
  // A verdict guarded by a comparison («در مقایسه با مینای طبیعی بله، …») is
  // conditional, not absolute — the answer flips on what you compare against,
  // so it is not a clean yes/no. Exclude.
  if (/مقایسه/.test(clause)) return null;
  const yes = /(^|[\s،؛«])بله([\s،؛.!»]|$)/.test(clause);
  const no = /(^|[\s،؛«])(خیر|نه)([\s،؛.!»]|$)/.test(clause);
  if (yes && !no) return true;
  if (no && !yes) return false;
  return null;
}

const byContent = {};
let totalQuestions = 0;
let totalPages = 0;
let scanned = 0;

for (const [contentId, entry] of Object.entries(corpus.byContent)) {
  if (isExcludedContentId(contentId)) continue;
  const faqPages = entry.faqPages || [];
  if (!faqPages.length) continue;

  const questions = [];
  for (const page of faqPages) {
    page.mainEntity.forEach((q, idx) => {
      if (!q || q['@type'] !== 'Question' || !q.name) return;
      const answer = q.acceptedAnswer && q.acceptedAnswer.text;
      if (!answer) return;
      scanned += 1;
      if (!YES_NO_QUESTION(q.name)) return;
      const key = deriveKey(answer);
      if (key === null) return;
      questions.push({
        id: `${contentId}#q${idx}`,
        source_faq_index: idx,
        question: q.name,
        answer_key: key,
        explanation: answer,
      });
    });
  }
  if (!questions.length) continue;

  byContent[contentId] = { questions };
  totalQuestions += questions.length;
  totalPages += 1;
}

const out = {
  version: 1,
  generatedFrom: 'plus/faq-corpus.json (binary subset of FAQPage questions; see workflow step 4.12)',
  contentCount: totalPages,
  questionCount: totalQuestions,
  byContent,
};

writeFileSync(resolve(root, 'plus', 'quiz-index.json'), JSON.stringify(out, null, 0) + '\n');
console.log(`Wrote plus/quiz-index.json: ${totalPages} pages, ${totalQuestions} binary questions (of ${scanned} FAQ items scanned).`);
