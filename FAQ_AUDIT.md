# FAQ Corpus Audit — Quiz vs. Flashcard Readiness

**Scope:** Read-only audit. No repo file was modified, generated, or rewritten to produce this report. All numbers below come from a one-time script pass over the current repository state (`.dentcast/`, category directories, `index.html`) plus manual per-item classification of every extracted FAQ entry.

---

## 1. Inventory

**Where FAQ content lives:** exactly one place — `schema.org` `FAQPage` JSON-LD blocks (`<script type="application/ld+json">…</script>`), nested inside an `@graph` array alongside the page's primary `TechArticle`/`Article` node. There is no other FAQ storage format in the repo: no front matter, no separate FAQ JSON/YAML data files, no CMS-style FAQ database, and — critically — **no visible on-page HTML rendering**. Every one of a spot-checked sample across `chairside`, `insight`, `notecast`, `litecast`, and `glossary` had zero matches for `سوالات متداول`, `frequently asked`, `<details>`, `accordion`, or any `faq`-named CSS class/id in the visible markup. The FAQ items exist purely for search-engine consumption; a site visitor never sees them rendered as a UI.

| Metric | Count |
|---|---|
| Total HTML files scanned | 720 |
| Files containing a `FAQPage` block | 334 |
| Files with no FAQ | 386 |
| Total individual FAQ items (`Question` nodes) | **1,062** |
| JSON parse errors encountered | 0 |

**Verbatim structure of one FAQ item** (`chairside/chairside-1.html`, item index 0 of 1,062), exactly as it appears in the file:

```json
{
  "@type": "Question",
  "name": "چرا بستنِ مستقیمِ دیاستمِ میدلاین با لمینیت در این کیس مشکل داشت؟",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "چون بستنِ مستقیمِ دیاستم با لمینیت باعثِ افزایشِ عرضِ سانترال‌ها می‌شد؛ چون بیمار به ابعادِ نرمالِ دندان‌های خودش عادت داشت، پهن‌شدنِ دندان‌ها می‌توانست از نظرِ ذهنی و زیبایی‌شناختی برایش قابلِ پذیرش نباشد."
  }
}
```

This shape (`name` + `acceptedAnswer.text`) is **identical across all 1,062 items, all 12 content types**, with zero schema drift found.

**Stable identifier: none.** A `Question` node carries no `@id`, no slug, no numeric key — nothing that survives outside its position in the `mainEntity` array of its parent `FAQPage`. The only addressable identifier in the whole structure is the *page-level* `FAQPage.@id` (e.g. `https://dentcast.org/chairside/chairside-1.html#faq`), which identifies an entire FAQ block, not an individual question. Today the only way to reference "item 3 of the FAQ on page X" is by array index, which is not stable against future edits (inserting or reordering a question in that array silently reassigns every downstream index).

---

## 2. Per-item classification

Every one of the 1,062 items was read individually and assigned to exactly one bucket, applying a fixed rubric (yes/no "آیا…؟" questions → BINARY; "تفاوت X و Y" / explicit N-item lists / multi-step procedures → ENUMERABLE; single named term, number, or threshold with a defensible key → DISCRETE; causal "چرا" mechanism explanations, clinical judgment calls, and case-narrative "why did we do X in this patient" questions that don't reduce to one clean fact → OPEN).

| Bucket | Count | % of total |
|---|---:|---:|
| BINARY | 305 | 28.7% |
| OPEN | 285 | 26.8% |
| ENUMERABLE | 254 | 23.9% |
| DISCRETE | 218 | 20.5% |
| **Total** | **1,062** | **100%** |

The corpus is **not** dominated by any single bucket — it splits into roughly even quarters. But that even split hides a sharp split *by content type* (see §5): some content types are almost entirely quiz-material, others are almost entirely OPEN.

---

## 3. Distractor feasibility (DISCRETE + BINARY only)

523 items fall into DISCRETE or BINARY (218 + 305). Each was judged individually on whether ≥3 plausible wrong options exist from real domain alternatives (competing named materials/techniques/numbers actually used elsewhere in dentistry or elsewhere in this same corpus) versus only obviously-filler options.

| Verdict | Count | % of the 523 |
|---|---:|---:|
| PASS (defensible distractors exist) | 517 | 98.9% |
| FAIL | 6 | 1.1% |

The failure rate is low, but that is a consequence of most DISCRETE/BINARY items being narrow factual claims ("Is X the same as Y?", "What is the standard value for X?") where a real competing material, technique, or number is easy to find elsewhere in the same corpus. The 6 failures are structural, not random noise — they cluster into two patterns:

1. **Terminology collision within the same corpus.** Item #206 defines *"confabulation"* as the AI-hallucination-adjacent phenomenon; item #195 elsewhere defines the *same underlying phenomenon* as *"hallucination"*. A distractor generator working from this corpus alone would plausibly draw the "wrong" answer directly from another *real, correct* FAQ item — an self-inflicted false negative.
2. **No stable ground truth to grade against.** Several items answer a yes/no or single-value question with an explicit "it depends" — there is no single correct key to grade a learner's answer against.

**5 concrete examples of items that fail, and why:**

1. **`glossary/hallucination.html` #206** — Q: *"…کانفابولیشن…"* term definition. **Why it fails:** the correct-sounding "wrong" answer ("hallucination") is itself the correct answer to a *different* real item (#195) in the same corpus — the two terms describe the same phenomenon under different names, so an auto-generated distractor pool risks contradicting another entry the learner may already have seen.
2. **`index.html` #469** — Q: *"دنت‌کست چیست؟"* ("What is DentCast?"). **Why it fails:** this is a self-referential brand/product definition. There is no real competing "product" in the domain to draw a defensible wrong answer from — any distractor ("a dental supply marketplace," "a CE course platform") would have to be invented whole-cloth rather than sourced from a real alternative.
3. **`litecast/lite-CAST29.html` #760** — Q: *"هزینهٔ روکش از پایهٔ ایمپلنت جداست؟"* ("Is the crown priced separately from the implant base?"). **Why it fails:** the answer is *"در بسیاری از مراکز… جداگانه محاسبه می‌شود؛ اما نحوهٔ اعلام هزینه در مراکز مختلف متفاوت است"* — "it varies by clinic." There is no fixed true/false to grade against.
4. **`litecast/lite-CAST3.html` #763** — Q: *"تحلیل استخوان بعد از کشیدن دندان حتمی است؟"* ("Is bone loss after extraction inevitable?"). **Why it fails:** the answer never resolves to a clean yes/no — *"می‌تواند رخ دهد، اما میزان و سرعت آن… متفاوت است"* ("can happen, but the amount and speed vary") — leaving no stable key.
5. **`litecast/lite-CAST34.html` #791** — Q: *"آیا فلوراید خطرناک یا سمی است؟"* ("Is fluoride dangerous or toxic?"). **Why it fails:** the answer opens with *"پاسخ به مقدار بستگی دارد"* ("the answer depends on the dose") — the question itself was written expecting a dose-dependent essay answer, not a checkable fact.

(A sixth, `litecast/lite-CAST4.html` #798, fails for the same "hedges throughout, never commits" reason as #4 and #5 above.)

---

## 4. Answer shape statistics

Word counts are computed by whitespace splitting on the Persian/English mixed answer text (an approximation — ZWNJ-joined compounds count as one token).

| Statistic | Value |
|---|---:|
| Answers, total | 1,062 |
| Min length | 7 words |
| Median length | 35 words |
| 90th percentile | 55 words |
| Max length | 87 words |
| Mean length | 36.9 words |
| Answers containing a numeric value/threshold/range | 145 (13.7%) |
| Answers **> 60 words** (flashcard-back ceiling) | 53 (5.0%) |

Answer length is **not** a meaningful blocker for either use case: the median answer (35 words, roughly two short sentences) fits comfortably on a flashcard back, and even the 90th-percentile answer (55 words) stays under the stated 60-word ceiling. Only 1 in 20 answers would need trimming.

---

## 5. Duplication and coverage

**Near-duplicates across different articles:** an inverted-index pre-filter (shared non-stopword tokens) followed by exact `SequenceMatcher` scoring found **39 cross-article question pairs** at similarity ≥0.55 (restricted to pairs from *different* files only). The top of that list is near-verbatim duplication:

| Similarity | File A | File B | Shared question (or near) |
|---|---|---|---|
| 1.00 | `notecast/episode-11.html` | `notecast/episode-5.html` | *"چرا سطحِ زیرکونیا نباید با اسیدِ فسفریک تمیز شود؟"* — word-for-word identical |
| 0.96 | `glossary/dual-cure-resin-cement.html` | `glossary/self-cure-resin-cement.html` | discoloration-over-time question, material name swapped |
| 0.92 | `chairside/chairside-1.html` | `chairside/chairside-3.html` | *"تصمیمِ نهایی برای این بیمار چه بود؟"* |
| 0.90 | `litecast/lite-CAST12.html` | `litecast/lite-CAST14.html` | *"آیا ایمپلنت [دیجیتال] برای همه افراد مناسب است؟"* |
| 0.87 | `glossary/fiber-post.html` | `glossary/post-and-core.html` | *"آیا پست [فایبر / …] دندان را تقویت می‌کند؟"* |

39 pairs against 1,062 items is a modest duplication rate (~7% of items touch at least one near-duplicate pair), but it is concentrated in exactly the template-driven content (`glossary`, `litecast`) that is also the most quiz-ready — meaning a naive "one quiz question per FAQ item" build would visibly repeat itself to a user who works through more than one glossary term or LiteCast episode in the same session.

**Concentration by content type** — FAQ items are **not** evenly spread; ~20% of all items sit in `glossary` alone, and 5 content types (`glossary`, `insight`, `notecast`, `litecast`, `chairside`) account for 77% of the corpus:

| Content type | FAQ items | % of total | Articles with FAQ |
|---|---:|---:|---:|
| `glossary` (+ 22 `glossary/en`) | 212 (+22) | 20.0% (+2.1%) | 106 (+11) |
| `insight` | 195 | 18.4% | 54 |
| `notecast` | 156 | 14.7% | 36 |
| `litecast` | 149 | 14.0% | 34 |
| `chairside` | 104 | 9.8% | 25 |
| `dentai` | 83 | 7.8% | 27 |
| `metanotes` | 59 | 5.6% | 17 |
| `dentai/promptologist` | 30 | 2.8% | 9 |
| `sharehub` | 33 | 3.1% | 9 |
| `dentcast-plus` | 17 | 1.6% | 5 |
| `(root)` (`index.html`) | 2 | 0.2% | 1 |

More important than raw volume is the **bucket distribution *within* each content type**, which is sharply bimodal:

| Content type | N | DISCRETE | BINARY | ENUMERABLE | OPEN | OPEN % |
|---|---:|---:|---:|---:|---:|---:|
| `sharehub` | 33 | 19 | 4 | 10 | 0 | 0.0% |
| `glossary/en` | 22 | 1 | 19 | 2 | 0 | 0.0% |
| `notecast` | 156 | 79 | 7 | 68 | 2 | 1.3% |
| `glossary` | 212 | 3 | 176 | 23 | 10 | 4.7% |
| `litecast` | 149 | 31 | 67 | 31 | 20 | 13.4% |
| `dentai` | 83 | 28 | 17 | 23 | 15 | 18.1% |
| `dentcast-plus` | 17 | 7 | 0 | 3 | 7 | 41.2% |
| `metanotes` | 59 | 13 | 8 | 12 | 26 | 44.1% |
| `insight` | 195 | 23 | 2 | 62 | 108 | 55.4% |
| `dentai/promptologist` | 30 | 4 | 2 | 5 | 19 | 63.3% |
| `chairside` | 104 | 8 | 3 | 15 | 78 | 75.0% |

`glossary`, `litecast`, `notecast`, and `sharehub` are almost entirely quiz-material (0–13% OPEN). `chairside`, `dentai/promptologist`, `insight`, and `metanotes` are dominated by case-narrative reasoning (44–75% OPEN). This is a template effect, not randomness: glossary/litecast/notecast FAQs were generated in a fixed "Does X…? No, because…" / "What is X?" pattern; insight/chairside/metanotes FAQs were generated from real clinical case write-ups and default to "why did we do this in this patient" prose.

---

## 6. Samples (10 items, spanning all 4 buckets)

**DISCRETE — clean (index #719, `litecast/lite-CAST20.html`):**
> Q: عکس پانورامیک (OPG یا عکس بزرگ) چیست؟
> A: عکس پانورامیک یا OPG (که خیلی‌ها به آن «عکس بزرگ» می‌گویند) یک تصویر کلی از فک‌ها و تمام دندان‌هاست و برای بررسی وضعیت عمومی دهان کاربرد دارد.

**DISCRETE — clean (index #967, `notecast/episode-30.html`):**
> Q: مهم‌ترین ویژگیِ زیرکونیا که آن را از سایرِ سرامیک‌ها متمایز می‌کند چیست؟
> A: توانایی Phase Transformation؛ مکانیزمی که در پاسخ به استرس، باعثِ افزایشِ استحکامِ ماده می‌شود. در میانِ انواعِ زیرکونیا، HIP Zirconia (White Blocks) به‌صورتِ کاملاً سینترشده عرضه می‌شود، همگن‌تر است و پس از میلینگ نیازی به فایر ندارد، اما فشارِ بیشتری به ابزارِ میلینگ وارد می‌کند و احتمالِ ایجادِ نقص‌های سطحی در آن وجود دارد.

**DISCRETE — distractor-FAIL (index #469, `index.html`):**
> Q: دنت‌کست چیست؟
> A: پادکست علمی دندان‌پزشکی با روایت دکتر فواد شهابیان؛ مرور ساده و تحلیلی تازه‌ترین مقالات حوزهٔ پروتز، ایمپلنت و دندان‌پزشکی ترمیمی.

**BINARY — clean (index #723, `litecast/lite-CAST21.html`):**
> Q: آیا عصب‌کشی دندان درد دارد؟
> A: معمولاً خیر. عصب‌کشی با بی‌حسی کامل انجام می‌شود و بیشتر بیماران دردی هنگام درمان احساس نمی‌کنند. درد شدید معمولاً مربوط به التهاب یا عفونت قبل از درمان است.

**BINARY — clean, evidence-based (index #933, `notecast/episode-23.html`):**
> Q: آیا اورلودِ اکلوزالیِ تنها (بدونِ التهاب) باعثِ تحلیلِ استخوانِ اطرافِ ایمپلنت می‌شود؟
> A: خیر؛ طبقِ شواهدِ این مرورِ سیستماتیک، اورلود به‌تنهایی هیچ ارتباطِ معناداری با تحلیلِ استخوان ندارد. جالب اینکه در نبودِ التهاب، فشارهای اکلوزالی حتی ممکن است اثرِ آنابولیک (استخوان‌ساز) در اطرافِ ایمپلنت داشته باشند.

**BINARY — distractor-FAIL (index #791, `litecast/lite-CAST34.html`):**
> Q: آیا فلوراید خطرناک یا سمی است؟
> A: پاسخ به مقدار بستگی دارد. فلوراید در دوزهای خیلی بالا می‌تواند مضر باشد، ولی مقداری که در خمیردندان یا آب استاندارد به شما می‌رسد بسیار پایین‌تر از آن سطح است. انجمن دندان‌پزشکی آمریکا فلوراید را در مقادیر توصیه‌شده برای کودکان و بزرگسالان ایمن و مؤثر در پیشگیری از پوسیدگی می‌داند. یعنی مسئله خود فلوراید نیست، مقدار آن است.

**ENUMERABLE (index #442, `glossary/tooth-wear.html`):**
> Q: چهار مکانیسم سایش دندان کدام‌اند؟
> A: اتریشن (از تماس دندان با دندان)، ابریژن (سایش مکانیکی توسط جسم خارجی مثل مسواک)، اروژن (انحلال شیمیایی با اسید)، و ابفرکشن (فرضیه‌ای برای از دست رفتن بافت سرویکال زیر فشار اکلوزال).

**ENUMERABLE (index #953, `notecast/episode-28.html`):**
> Q: قانونِ ۴-۲-۲ McLaren چه چیزی را تعیین می‌کند؟
> A: این قانون سه معیار دارد: در حالتِ استراحت حدودِ ۴ میلی‌متر از سانترال‌های بالا دیده شود؛ در لبخندِ کامل، بیش از ۲ میلی‌متر لثه نمایان نشود؛ و فاصله‌ی خطِ اینسایزال تا لبِ پایین حداکثر ۲ میلی‌متر باشد. این مقادیر «اعدادِ طلایِ مطلق» نیستند، بلکه نقطه‌ی شروعِ طراحی‌اند و باید بر اساسِ صورت و ترجیحِ بیمار تنظیم شوند.

**OPEN — case narrative (index #484, `insight/insight-13.html`):**
> Q: چرا دندان کانین (دندان ۳) با وجود درمان ریشهٔ اخیر، حفظ نشد و کشیده شد؟
> A: در ارزیابی رادیوگرافی و کلینیکی مشخص شد فرول پالاتال (عامل حیاتی در کانین بالا) و فرول مزیال هر دو از بین رفته‌اند و موقعیت دندان همیشه تحت فشارهای لترال شدید قرار دارد. اگرچه در ظاهر می‌شد پست‌وکور گذاشت و روکش کرد، این فقط نگاه به وضعیت امروز بود؛ پیش‌بینی شکست فانکشنال آینده باعث شد حذف دندان و جایگزینی با ایمپلنت انتخاب شود.

**OPEN — clinical judgment (index #828, `metanotes/meta-13.html`):**
> Q: طبق این متن، علتِ واقعیِ «سندرمِ بیمارِ آشنا» چیست؟
> A: مشکل خودِ آشنایی نیست؛ مشکل این است که آشنایی دندانپزشک را وادار می‌کند ناخودآگاه از خط‌قرمزها و اصولِ درمانیِ خودش عدول کند تا طرف راضی شود، و همین عدول، پیش‌زمینه‌ی عوارضِ بعدی است.

---

## 7. Verdict

**How many items are quiz-ready today without any runtime AI, purely from what already exists in the repo?**

- **517 items** (DISCRETE + BINARY, distractor-feasibility PASS) are ready for MCQ / true-false conversion essentially as-is — the answer key and ≥3 defensible wrong options can be pulled from real domain alternatives already present in this corpus or in standard dental terminology, in an offline pass.
- **254 additional items** (ENUMERABLE) are quiz-convertible into multi-select / ordering / matching / categorization formats, but need a distinct offline content-engineering pass beyond "generate 3 distractors" — the list structure itself has to be turned into a set of gradable options (e.g. "which 4 of these are mechanisms of tooth wear" from a #442-style answer).
- Combined, **771 of 1,062 items (72.6%)** sit in a bucket that supports zero-runtime-AI auto-grading. That is large enough to build a scoring system around — it is not a thin slice of the corpus.
- **285 items (26.8%) are OPEN** — real, but a minority, not the dominant bucket. The corpus is **not** dominated by OPEN items overall.

**But that headline number hides an important shape.** The 771 quiz-ready items are not spread evenly — they are concentrated almost entirely in `glossary`, `litecast`, `notecast`, `sharehub`, and `dentai` (0–18% OPEN each), while `insight`, `chairside`, `metanotes`, and `dentai/promptologist` (44–75% OPEN each) contribute almost nothing to the quiz bucket. **If quiz-building draws only from the FAQ corpus as it stands, it will effectively be a glossary/litecast/notecast quiz, not a case-reasoning quiz.** The case-study content types (`insight`, `chairside`) are exactly the ones best suited to flashcards instead — self-rated recall of "why did the clinician do X" doesn't need a stable right/wrong key.

**What would have to change in FAQ generation for the OPEN share to shrink:** nothing needs to change for glossary/litecast/notecast — those are already quiz-shaped. For insight/chairside/metanotes, the "چرα" (why) causal-narrative template would need a second, parallel FAQ pass that extracts the *specific named facts* embedded in each case (a threshold number, a named technique, a yes/no clinical rule) as separate DISCRETE/BINARY items, rather than relying on the single long causal-explanation item that exists today. That is a generation-time decision, not something the audit can fix after the fact.

**Structural blockers, flagged as requested:**

1. **No stable per-item identifier.** Every `Question` node is addressable only by its array position inside `FAQPage.mainEntity`. Any quiz or flashcard system needs a durable key per item (for spaced-repetition state, for de-duplication, for analytics) that does not exist today and would have to be synthesized (e.g., a hash of `file + question text`) before either use case could be built.
2. **Answers that cannot stand alone without the surrounding article.** At minimum 64 items (6.0%) explicitly say "این کیس" / "این بیمار" ("this case" / "this patient") in the question or answer text — a floor, not a ceiling, since many more use implicit references ("این دندان," "این تکنیک") without the literal phrase. A flashcard drawn from one of these reads as clinically sound only if the learner has already read the source article; standalone it is a non-sequitur.
3. **Near-duplicate content (39 cross-article pairs, similarity ≥0.55, up to word-for-word identical).** A naive one-question-per-item build will visibly repeat itself for any user who works through more than one item in the same content family.
4. **FAQ content is 100% invisible schema markup — never rendered as UI anywhere on the site.** Neither quiz nor flashcard use has any existing rendering surface to repurpose; both are ground-up UI builds, and the content was authored for a search-engine parser, not for a person to read as a standalone card.
5. **6 items (1.1% of the DISCRETE/BINARY pool) have no gradable ground truth** — answers that explicitly hedge ("depends on the clinic," "depends on the dose") rather than committing to a checkable fact — and one terminology collision (#206 vs. #195) where a naive distractor generator would draw a "wrong" answer that is actually correct elsewhere in the same corpus. These need to be excluded from auto-grading, not force-fit into it.
