# FAQ Corpus Audit — Quiz vs. Flashcard Readiness

Read-only audit. No content was modified. All numbers below are derived by
parsing every `.html` file in the repository (719 files scanned) and every
alternate content-snapshot JSON at the repo root.

---

## 1. Inventory

**Where FAQ content lives today: exactly one place, one format.**

- Format: `schema.org` `FAQPage` JSON-LD (`<script type="application/ld+json">`)
  embedded in each page's `<head>`/`<body>`.
- Shape: `FAQPage.mainEntity[]` → `Question { name, acceptedAnswer: { Answer, text } }`.
- **No visible on-page FAQ widget exists anywhere in the site.** A
  site-wide grep for FAQ-shaped HTML (`سوالات متداول`, `پرسش‌های متداول`,
  `frequently asked`, `class="faq`, `id="faq`, `faq-item`, etc.) outside the
  JSON-LD blocks returns **zero matches**. The FAQ content is SEO structured
  data only — no reader has ever seen it rendered as a Q&A block on the page.
- Not present in `dentcast-brain.json` (confirmed: zero `"faq"` keys in the
  brain or in any of the alternate snapshots — `dentcast.json`,
  `dentcast-updated.json`, `dentcast-reserve.json`, `check.json`). FAQ is
  page-local only, same pattern as the newer `DefinedTermSet` flashcard
  blocks (`tools/build_flashcards_index.mjs`, workflow step 4.11) — but
  unlike flashcards, FAQ items carry **no `@id`** at any level (not on the
  `FAQPage` block, not on individual `Question` items).

**Coverage counts** (content articles only — index/listing pages excluded):

| Content type | Articles | With FAQ | Without FAQ |
|---|---:|---:|---:|
| LiteCast | 34 | **34** | 0 |
| DentAI | 55 | 0 | 55 |
| Insight | 108 | 0 | 108 |
| Episodes | 210 | 0 | 210 |
| Glossary | 117 | 0 | 117 |
| NoteCast | 38 | 0 | 38 |
| Chairside | 50 | 0 | 50 |
| MetaNotes | 35 | 0 | 35 |
| ShareHub | 18 | 0 | 18 |
| Pillar | 10 | 0 | 10 |
| Photocast | 6 | 0 | 6 |
| Patients | 1 | 0 | 1 |
| **Total** | **684** | **34 (5.0%)** | **650 (95.0%)** |

FAQ exists **only** on LiteCast pages (33 topical articles + `lite-CAST` #1–34,
one file — `litecast/index.html` — is a listing page and correctly has none)
plus 2 site-meta items on the homepage `index.html` (about the DentCast
product/Radar tool itself, not clinical content). Every other content type in
the repo — DentAI, Insight, Episodes, Glossary, NoteCast, Chairside,
MetaNotes, ShareHub, Pillar, Photocast, Patients — has **zero** FAQ items.

**Total FAQ items: 151** (149 clinical/LiteCast + 2 homepage/product).

**Field structure of a single FAQ item, verbatim** (`litecast/lite-CAST1.html`):

```json
{
  "@type": "Question",
  "name": "قانون ۲-۲-۲ در دندان‌پزشکی چیست؟",
  "acceptedAnswer": {
    "@type": "Answer",
    "text": "قانون ۲-۲-۲ یعنی روزی دو بار مسواک زدن، هر بار به مدت دو دقیقه، و مراجعه به دندان‌پزشک دو بار در سال برای معاینه و پیشگیری."
  }
}
```

**Stable identifier: none.** No `@id` on the `Question`, the `Answer`, or the
parent `FAQPage` block itself, in any of the 151 items across all 35 files.
The only positional handle is array index inside `mainEntity`, which is not
guaranteed stable if an item is later inserted, removed, or reordered.

---

## 2. Per-item classification (all 151 items)

| Bucket | Count | % of total |
|---|---:|---:|
| DISCRETE | 30 | 19.9% |
| BINARY | 46 | 30.5% |
| ENUMERABLE | 22 | 14.6% |
| OPEN | 53 | 35.1% |
| **Total** | **151** | **100%** |

OPEN is the largest single bucket. DISCRETE + BINARY + ENUMERABLE (the three
buckets with *some* grading path) together are 98/151 (64.9%), but DISCRETE +
BINARY specifically — the two buckets actually amenable to MC/T-F without
further authored work — are 76/151 (50.3%).

---

## 3. Distractor feasibility (DISCRETE + BINARY only, N=76)

| Result | Count | % of 76 |
|---|---:|---:|
| PASS (≥3 plausible real-domain wrong options) | 62 | 81.6% |
| FAIL (no non-filler distractor pool) | 14 | 18.4% |

By bucket: DISCRETE 29 pass / 1 fail. BINARY 33 pass / 13 fail.

DISCRETE items pass distractor-feasibility almost universally because they
key off real, swappable domain alternatives: materials (titanium vs. steel
vs. ceramic), imaging modalities (PA/bitewing vs. panoramic vs. CBCT),
numeric thresholds (~3 months osseointegration, 24–72h post-op pain window,
4–8/8–12-week smoking-cessation windows, rice-grain/pea-size fluoride
dosing). BINARY items fail far more often: a plain confirm/deny with no
distinguishing clinical detail behind it only has one real opposite (the
flip itself) — anything beyond that is invented filler, not a "real domain
alternative."

**Five concrete FAIL examples:**

1. **`litecast/lite-CAST34.html`** — "اگر کودکم مقداری از خمیر را قورت
   بدهد چه می‌شود؟" — the answer is pure reassurance built around one
   illustrative dose calculation; there is no natural family of alternative
   wrong quantities to distract with without fabricating implausible numbers.
   (DISCRETE)
2. **`litecast/lite-CAST17.html`** — "شل شدن پیچ ایمپلنت به معنی خراب شدن
   ایمپلنت است؟" → خیر. A flat denial with no distinguishing clinical
   detail; the only real wrong option is the flip itself (Yes).
3. **`litecast/lite-CAST30.html`** — "تورم و کبودی بعد از جراحی ایمپلنت
   طبیعی است؟" → بله. Plain confirmation of a routine post-op fact; no
   competing real-world claim exists to contrast it against.
4. **`litecast/lite-CAST32.html`** — "آیا دندانی که آبسه کرده را می‌توان
   کشید؟" → بله. Basic factual confirmation, no threshold or nuance to vary.
5. **`litecast/lite-CAST1.html`** — "آیا رعایت قانون ۲-۲-۲ واقعاً از
   پوسیدگی دندان جلوگیری می‌کند؟" → بله. Simple effectiveness confirmation;
   any additional wrong options would be arbitrary invented percentages, not
   domain alternatives.

---

## 4. Answer shape statistics (N=151)

- Word count: **min 15, median 28, p90 52, max 67.**
- Answers containing a specific numeric value/threshold: **13/151 (8.6%)**
  (11 with Arabic/Persian digits, plus 2 more using spelled-out numbers like
  "دو برابر" adjacent to a unit).
- Answers longer than 60 words (the flashcard-back ceiling): **2/151 (1.3%)**
  — effectively the entire corpus already fits on a flashcard back by length
  alone; length is not the bottleneck for either use case.

---

## 5. Duplication and coverage

- **Near-duplicate items across different articles:** at least 3 pairs (6
  items, ~4% of the corpus) are the same question re-asked with near-identical
  wording and near-identical answers in two different LiteCast files:
  - "ایمپلنت دیجیتال چیست؟" (`lite-CAST14.html`) ≈ "ایمپلنت دیجیتال یعنی
    چی؟" (`lite-CAST9.html`) — same definition, same content.
  - "ایمپلنت دیجیتال چه تفاوتی با روش معمول دارد؟" appears near-verbatim in
    both `lite-CAST14.html` and `lite-CAST9.html`.
  - "شل شدن پیچ ایمپلنت یعنی ایمپلنت خراب شده است؟" → خیر, appears in both
    `lite-CAST17.html` and `lite-CAST10.html` with the same reasoning restated.
  - Beyond exact duplicates, a **templated question skeleton** — "آیا [X]
    برای همه مناسب است؟" answered "خیر… به استخوان/لثه/سلامت عمومی/طرح درمان
    بستگی دارد" — is reused near-verbatim across at least 3 different implant
    sub-topics (`lite-CAST12.html`, `lite-CAST14.html`, `lite-CAST15.html`),
    and "مزیت اصلی … برای بیمار چیست؟" / "چه تفاوتی با روش معمول دارد؟" are
    reused the same way across the immediate-implant and digital-implant
    articles.
- **Concentration:** FAQ is 100% concentrated in LiteCast, and within
  LiteCast it is itself concentrated — roughly **24 of 34 articles (~71%)**
  are implant/root-canal/crown/prosthodontic topics (matching DentCast's own
  prosthodontics focus), the remaining ~29% spread thinly across brushing,
  cold sores, veneers, doctor-selection, X-ray choice, diabetes, waterjet,
  abscess extraction, amalgam, and fluoride. Items per article range from
  2 to 10 (median ≈ 4).

---

## 6. Ten representative samples (spanning all four buckets)

**DISCRETE**
1. Q: "ایمپلنت از چه جنسی ساخته می‌شود؟" A: "بیشتر ایمپلنت‌ها از تیتانیوم یا
   آلیاژهای سازگار با بدن ساخته می‌شوند که بدن آن‌ها را پس نمی‌زند و توانایی
   اتصال به استخوان را دارند." (`lite-CAST12.html`)
2. Q: "قانون ۲-۲-۲ در دندان‌پزشکی چیست؟" A: "قانون ۲-۲-۲ یعنی روزی دو بار
   مسواک زدن، هر بار به مدت دو دقیقه، و مراجعه به دندان‌پزشک دو بار در سال
   برای معاینه و پیشگیری." (`lite-CAST1.html`)
3. Q: "آیا خمیردندان فلورایددار برای کودکان بی‌خطر است؟ چقدر باید زد؟" A:
   "بله، به شرط رعایت مقدار. توصیهٔ فعلی این است که برای کودک زیر ۳ سال از
   همان رویش اولین دندان به اندازهٔ یک دانهٔ برنج و برای کودک ۳ تا ۶ سال به
   اندازهٔ یک نخود خمیر استفاده شود…" (`lite-CAST34.html`)

**BINARY**
4. Q: "آیا واترجت جای نخ دندان را می‌گیرد؟" A: "خیر. واترجت و نخ دندان دو
   کار متفاوت انجام می‌دهند؛ واترجت فضای بین دندان‌ها را می‌شوید اما پلاک
   چسبیده به سطح دندان را جدا نمی‌کند…" (`lite-CAST27.html`)
5. Q: "شنیده‌ام زیر آمالگام پوسیدگی پنهان می‌شود. درست است؟" A: "گاهی ممکن
   است در لبه هر پرکردگی‌ای پوسیدگی شروع شود، اما یک خط تیره… به‌خودی‌خود
   نشانه پوسیدگی زیر آن نیست…" (`lite-CAST33.html`)
6. Q: "شل شدن پیچ ایمپلنت به معنی خراب شدن ایمپلنت است؟" A: "خیر. شل شدن
   پیچ معمولاً به معنی خرابی خود ایمپلنت نیست، اما باید بررسی شود…"
   (`lite-CAST17.html`)

**ENUMERABLE**
7. Q: "مراحل ایمپلنت شامل چه بخش‌هایی است؟" A: "درمان ایمپلنت معمولاً شامل
   ارزیابی اولیه، آماده‌سازی در صورت نیاز، قرار دادن پایه ایمپلنت، دوره
   ترمیم و جوش خوردن، و در نهایت مرحله بارگذاری و نصب روکش است."
   (`lite-CAST13.html`)
8. Q: "چه علائمی بعد از عصب‌کشی طبیعی نیست و باید بررسی شود؟" A: "درد شدید
   و مداوم، تورم لثه یا صورت، تب یا ترشح از ناحیه دندان نیاز به بررسی دارد و
   بهتر است سریع‌تر با دندانپزشک تماس بگیرید." (`lite-CAST21.html`)

**OPEN**
9. Q: "چرا خمیردندان باید فلوراید داشته باشد؟" A: "چون فلوراید سطح مینا را
   در برابر اسید مقاوم می‌کند و از پوسیدگی جلوگیری می‌کند… خمیردندان
   پرمصرف‌ترین شکل استفاده از فلوراید در جهان است و همین سادگی، آن را به
   مؤثرترین ابزار پیشگیری روزمره تبدیل کرده است." (`lite-CAST34.html`)
10. Q: "منظور از «بهترین دکتر» یا «بهترین کلینیک دندانپزشکی» چیست؟" A:
    "اصطلاح «بهترین دکتر» یا «بهترین کلینیک» تعریف ثابت و واحدی ندارد و به
    عواملی مانند نوع مشکل دندانی، شرایط بیمار، سطح درمان مورد نیاز و
    انتظارات فردی بستگی دارد." (`lite-CAST11.html`)

---

## 7. Verdict

- **Quiz-ready today, with zero runtime AI, distractors aside:** 76/151
  items (DISCRETE + BINARY, 50.3%). Once distractor feasibility is applied,
  **62/151 (41.1%)** are actually gradable with a defensible ≥3-option
  answer key without inventing filler. The rest of DISCRETE/BINARY (14
  items) could still support true/false grading (a 2-way key), just not a
  rich multiple-choice.
- **Is 62–76 items enough to build a scoring system around?** Numerically,
  yes for a pilot — but **only inside LiteCast**. The corpus is not evenly
  distributed: FAQ exists on 34 of 684 real articles (5.0%). A quiz feature
  built from current FAQ data has content on a single content type and
  effectively zero reach into DentAI, Insight, Episodes, Glossary, NoteCast,
  Chairside, MetaNotes, ShareHub, Pillar, or Photocast — 95% of the site's
  articles would show no quiz at all.
- **The corpus is dominated by OPEN items (35.1%, the largest single
  bucket)**, and even within DISCRETE/BINARY roughly a third of BINARY items
  (13/46) don't clear the distractor bar. This is a direct consequence of
  how these FAQs were written: they answer real patient questions with
  clinically appropriate hedging ("بستگی دارد", "در برخی موارد", "تصمیم
  نهایی را دندان‌پزشک می‌گیرد") rather than committing to a single
  checkable fact. For quiz-readiness to shift, FAQ generation would need to
  deliberately produce a *quota* of atomic, single-fact Q&A pairs per
  article (definitions, named materials, numeric thresholds, indication
  lists) as a distinct category from the current judgment/trade-off style —
  the current generation process makes no such distinction and optimizes for
  patient-readable nuance, not gradability.
- **Structural blockers for either use case:**
  1. **No stable IDs at all** — not on `Question`, not on `Answer`, not on
     the `FAQPage` block. Any downstream system (quiz answer keys, flashcard
     `card_state`, spaced-repetition tracking) needs a stable per-item
     handle that survives edits; today the only handle is array position,
     which silently breaks if an item is inserted/reordered/removed.
  2. **FAQ is invisible to readers** — it exists only as JSON-LD, never
     rendered on the page. Neither a quiz nor a flashcard feature can point
     users at "the FAQ section" because no such section is ever displayed;
     the content would be surfacing for the first time as reader-facing
     content, not repurposing something already reviewed in that role.
  3. **Coverage is 95% empty** — building either feature "on the FAQ corpus"
     today effectively means building it for LiteCast only.
  4. **Near-duplicate/templated items** (§5) would need dedup before
     scoring, or a user could hit the same question twice across two
     different articles with slightly different scripted phrasing.
  5. No item is context-dependent in a way that breaks stand-alone use —
     every question/answer pair in the sample stands alone without needing
     the surrounding article — so that specific failure mode was **not**
     observed. The blockers are the ID, visibility, and coverage gaps above.
