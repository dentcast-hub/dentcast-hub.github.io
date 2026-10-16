---
name: glossary-writer
description: >
  Generate scientific content for DentCast glossary (دانشنامه) terms. Use this
  skill whenever the user asks to create, draft, or write a glossary term /
  دانشنامه entry for the DentCast site — for a single term or a cluster of
  terms. The skill produces ONLY the scientific input the publishing workflow
  expects: English term, Persian title (fa_title), and the three fixed Persian
  prose sections (تعریف / مرز مفهوم و سوءبرداشت‌ها / نقش در تصمیم‌گیری درمانی).
  It does NOT generate HTML, metadata, JSON-LD, synonyms, FAQ, or Pulse — the
  publishing workflow generates all of that automatically.
---

# DentCast Glossary Writer

## What this skill is for

DentCast (dentcast.ir / dentcast.org) is an evidence-based Persian dental
knowledge platform built around the DentCast podcast (article review, clinical
reasoning, deep prosthodontic and restorative concepts). The glossary
(دانشنامه) is the "definitional destination" of an interconnected content
ecosystem: podcast episodes, NoteCast summaries, Insight articles, and glossary
terms all link to each other semantically. Each glossary term defines one
concept precisely and self-sufficiently.

This skill generates the **scientific body** of a glossary term — and nothing
else. A separate publishing workflow (in `.dentcast/workflows/`) takes this
output and builds the full HTML page, metadata, JSON-LD, synonyms, FAQ, cross-
links, and the glossary.json entry. **This skill must stay strictly inside its
lane: produce clean scientific input, let the workflow do the rest.**

## Output — exactly what to produce

For each term, output **only** the following, in this order:

1. **English term** — becomes the page `<h1>` and the DefinedTerm name.
   Example: `Biological Width`
2. **fa_title** (Persian title) — becomes the page subtitle / alternateName.
   Example: `عرض بیولوژیک`
3. **Three Persian prose sections**, under these exact headings, in this exact
   order:
   - `تعریف`
   - `مرز مفهوم و سوءبرداشت‌ها`
   - `نقش در تصمیم‌گیری درمانی`

Do **NOT** produce: HTML, slug, URLs, meta tags, JSON-LD, dates, author/bio,
synonyms, FAQ, Pulse sentence, "کاوش بیشتر" links, or any wrapper. The workflow
generates all of these. Emitting them creates conflict with the workflow.

Do **NOT** add any extra section, bullet list, heading, summary, or
introductory/closing remark beyond the three sections. Scope discipline is a
hard rule (see below).

## Core principles

This is **YMYL medical content** for dentists and dental students. The
following principles are non-negotiable:

- **Clinical accuracy over fluency or false certainty.** Unsupported claims,
  incorrect simplifications, or manufactured certainty are not acceptable. When
  the literature is genuinely divided or a value is an average rather than a
  fixed threshold, say so — do not flatten nuance into false precision.
- **Self-sufficiency.** Each term must be fully understandable on its own page.
  These pages are definitional anchor points for AI-driven search engines, so
  the concept must be completely explained in place, not by reference elsewhere.
- **Consistency with the existing glossary.** Structure, tone, and depth must
  match existing terms. Inconsistency between pages is a serious defect.
- **The output is a draft, not a final.** Dr. Shahabian reviews, edits, and
  approves every entry. Your role is a precise, coherent, on-style draft — never
  the published version. The "نقش در تصمیم‌گیری درمانی" section in particular
  receives the most careful human review, because it requires real clinical
  judgment; write it according to the logic of the concept, but never bluff
  clinical specifics that sound plausible but aren't precise.

## How each section must behave

**تعریف (Definition)**
- A precise, standard definition of the concept as the field defines it — not a
  rewrite of any single source.
- Include the concrete anatomy / mechanism / measurable values where they exist.
- This is the section the model handles most reliably; keep it clean and exact.

**مرز مفهوم و سوءبرداشت‌ها (Concept boundary & misconceptions)**
- This is the **core distinguishing section** of every term and the hardest to
  write well. It must NOT be generic or boilerplate.
- It must target the **specific common misconception(s) of THIS concept** — the
  actual error a dentist or student tends to make about this exact term.
- Name the misconception directly, then correct it with reasoning. (Example for
  Biological Width: "it is not merely 'gum tissue'" + "the 2 mm figure is a
  statistical average, not a fixed threshold for every patient.")

**نقش در تصمیم‌گیری درمانی (Role in clinical decision-making)**
- Explain how the concept actually drives clinical decisions — which treatment
  choices it determines, what goes wrong if it's ignored.
- This section requires the most clinical precision and gets the most human
  review. Reason from the concept; do not invent specific protocols or numbers.
- End with a **weighty generalizing principle** — a single clinical-conceptual
  sentence that closes the section with force. (Example for Biological Width:
  "هر درمانی که این فضا را به رسمیت نشناسد، در واقع بیولوژی را نادیده گرفته است.")

## Tone and language rules

- Persian (RTL), scientific register, written for a professional dental
  audience.
- **Preserve established Finglish/technical terms as-is** — do not force-
  translate terms that the field uses in transliterated form. Examples:
  کراون لنگتنینگ, دیپ مارژین الویشن, اکستروژن ارتودونتیک, اپیتلیوم جانکشنال,
  کرست استخوان آلوئولار. Use the form a practicing Iranian prosthodontist
  actually uses, matching the existing glossary.
- Flowing scientific prose, not telegraphic. But no padding — every sentence
  carries information.
- No motivational language, no meta-commentary, no "in this article we will…".

## Working in batches

- Terms are produced in small batches (typically five at a time), ideally
  clustered by topic (e.g. five occlusion terms together) so definitions stay
  mutually consistent and share context.
- Do not accept a request to mass-produce 30 terms at once: quality of the
  "مرز مفهوم و سوءبرداشت‌ها" section degrades when the model is stretched, and
  it starts writing boilerplate. If asked for a large batch, produce a small
  coherent cluster and note that the rest should follow in further batches.

## Gold-standard example

The following is a real, approved term. Match its structure, tone, depth, and
the behavior of each section. This is the single most important reference in
this skill — when in doubt, write like this.

---

**English term:** Biological Width
**fa_title:** عرض بیولوژیک

**تعریف**
عرض بیولوژیک فضای فیزیولوژیکی است که توسط اتصال اپیتلیال جانکشنال و بافت همبند
سوپراکرستال بالای کرست استخوان آلوئولار اشغال می‌شود. در حالت طبیعی این فضا حدود
۲ تا ۳ میلی‌متر است: تقریباً ۱ میلی‌متر برای اپیتلیوم جانکشنال و ۱ میلی‌متر برای
اتصال کانکتیو تیشو. این فضا به‌عنوان یک سد بیولوژیک عمل می‌کند که محیط دهان را از
استخوان آلوئولار جدا نگه می‌دارد.

**مرز مفهوم و سوءبرداشت‌ها**
عرض بیولوژیک صرفاً «بافت لثه» نیست. این مفهوم شامل دو لایه بیولوژیکی مجزا با
عملکردهای متفاوت است و هر گونه رستوریشن یا تراشی که به این فضا تجاوز کند — حتی
اگر از نظر بالینی علامتی نداشته باشد — می‌تواند واکنش التهابی مزمن و تحلیل استخوان
آلوئولار ایجاد کند.

همچنین عدد «۲ میلی‌متر» که اغلب به‌عنوان حداقل فاصله ذکر می‌شود، یک میانگین آماری
است، نه یک حد ثابت برای همه بیماران. تنوع فردی قابل توجهی در ابعاد عرض بیولوژیک
وجود دارد و تصمیم‌گیری باید بر اساس بررسی بالینی هر مورد انجام شود.

**نقش در تصمیم‌گیری درمانی**
عرض بیولوژیک یکی از اصلی‌ترین عوامل تعیین‌کننده در تصمیم‌گیری درباره موقعیت مارژین
رستوریشن، نیاز به Crown lengthening و امکان استفاده از تکنیک دیپ مارژین الویشن
است. قرار دادن مارژین در ناحیه عرض بیولوژیک بدون برنامه‌ریزی مناسب منجر به التهاب
مزمن لثه، تحلیل استخوان و در نهایت شکست بلندمدت درمان می‌شود.

درک این مفهوم نه‌تنها برای طراحی مارژین ضروری است، بلکه در انتخاب میان گزینه‌هایی
مانند جراحی افزایش طول تاج، اکستروژن ارتودونتیک و دیپ مارژین الویشن نقش محوری
دارد. هر درمانی که این فضا را به رسمیت نشناسد، در واقع بیولوژی را نادیده گرفته
است.

---

## Final check before returning output

Before returning, verify:
- [ ] Only English term + fa_title + three sections — nothing else.
- [ ] The three headings are exactly: تعریف / مرز مفهوم و سوءبرداشت‌ها / نقش در تصمیم‌گیری درمانی.
- [ ] "مرز مفهوم و سوءبرداشت‌ها" targets a specific misconception of THIS term, not a generic statement.
- [ ] "نقش در تصمیم‌گیری درمانی" ends with a weighty generalizing principle.
- [ ] No invented clinical numbers/protocols presented as fixed fact.
- [ ] Finglish technical terms preserved in their established form.
- [ ] No extra sections, bullets, intros, or closing remarks added.

## Handoff to publishing workflow

This handoff runs **only when the user asks to create *and* publish** the term
(e.g. «ترم Ferrule Effect رو بساز و منتشر کن», "make and publish", "بساز و
منتشر کن"). If the user only asks to draft/write/generate the term, stop after
returning the body — do **not** hand off.

When publishing IS requested, the flow is two stages, in order:

1. **Generate first, unchanged.** Produce and return the term's body exactly as
   this skill always does — English term + fa_title + the three Persian
   sections — with no change to the generation behavior, scope, or output shape
   above.
2. **Then hand that output to the publishing workflow as its starting input.**
   Read `.dentcast/workflows/README.md` and begin its normal run, pre-filling
   only its **Phase B — Intake** entry points that this skill already knows:
   - **Phase B Question 1 (Type):** answer **`glossary`** — this is the locked
     category for the run.
   - **Phase B Question 3 (Text):** the body = the English term + fa_title + the
     three sections («تعریف / مرز مفهوم و سوءبرداشت‌ها / نقش در تصمیم‌گیری
     درمانی») just generated, passed verbatim as the «متن کامل».

   Then let the workflow proceed through the rest of its normal run.

**Hard constraint — feed the input, do NOT auto-approve the run.** The handoff
supplies only the two intake values above (type + text). It must **not** answer,
skip, pre-empt, or auto-confirm any other step of the workflow. In particular,
every one of the workflow's own confirmation gates stays fully interactive and
is still answered by the user, including but not limited to:
- Phase B **Question 2** (number/identifier), **Question 4** (media),
  **Question 5** (Pulse sentence + hyperlinked word).
- The link-insertion confirmations at Phase C steps **4.7**, **4.8**, and
  **4.9** — each of which requires the user's explicit confirmation before any
  link is inserted. Never insert links on the user's behalf; always present the
  candidates and wait for approval, exactly as the workflow specifies.

The skill produces the scientific input and points the workflow at it; the
workflow owns every decision and gate from there.
