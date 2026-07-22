# DentCast Plus — Pathways catalog (v1) — 2026-07-22

Full first-pass catalog of learning pathways for Plus Phase 3. **Everything
here is inert data** — `plus/pathways.json` is loaded by no page or script yet.
This is the founder-facing content layer, ready to curate before activation.

## Doctrine (recap)

- **Pillar = where a content item lives** (exactly one home in the taxonomy).
- **Pathway = a curated journey through content** — it may cross pillars, and
  **one item can appear in many pathways** (unlike a pillar). Schema: steps are
  explicit `content_id` lists (`plus/pathways.json`, spec §5), no pillar coupling.
- Each pathway is ordered **prerequisite → advanced** in conceptual blocks; the
  last step of each block is a `milestone`.
- **Litecast is excluded** from all professional pathways (patient-facing, `.ir`).

## The 14 pathways

| id | title_fa | steps | shape |
|---|---|---|---|
| `implant-surgical` | ایمپلنت: جراحی، طرح‌ریزی و سلامت پری‌ایمپلنت | 39 | pillar (split) |
| `implant-prosthetic` | ایمپلنت پروتزی: اجزا، اسکن دیجیتال و طراحی رستوریشن | 55 | pillar (split) |
| `fixed-pros-core` | پروتز ثابت (جامع) | 86 | pillar (early draft) |
| `biomimetic` | دندانپزشکی بیومیمتیک و ترمیم ادهزیو | 82 | cross-pillar |
| `ceramics` | سرامیک دندانی: از انتخاب ماده تا سمان | 35 | cross-pillar |
| `treatment-planning` | طرح درمان و تصمیم‌گیری بالینی | 34 | cross-pillar |
| `occlusion` | اکلوژن: از تحلیل تا بازسازی و اختلالات | 32 | pillar |
| `esthetic` | زیبایی و طراحی لبخند | 25 | cross-pillar |
| `operative-cariology` | کاریولوژی و ترمیم مستقیم | 20 | pillar |
| `evidence-literacy` | سواد نقد شواهد و تصمیم‌گیری علمی | 15 | cross-pillar (metanotes) |
| `removable-pros` | پروتز متحرک و اوردنچر | 14 | pillar |
| `ai-dentistry` | هوش مصنوعی در دندانپزشکی | 12 | cross-pillar (+promptologist) |
| `failure-troubleshooting` | چرا شکست خورد؟ عیب‌یابی و مدیریت شکست | 12 | cross-pillar (problem-led) |
| `digital` | دندانپزشکی دیجیتال: اسکن، CAD/CAM و ورک‌فلو | 11 | pillar |

## Coverage (run `python3 tools/pathway_scout.py --coverage` to refresh)

- **389 / 419** content items sit in ≥1 pathway.
- **76** items sit in **multiple** pathways — the multi-membership the founder
  asked for (e.g. ceramic surface-prep + resin cementation appear in
  `biomimetic`, `ceramics` and `esthetic`; ferrule/post items in `biomimetic`,
  `fixed-pros-core`, `failure-troubleshooting`).
- **30 uncovered**, of which **19 are litecast** (excluded by design). The
  remaining 11 are genuine orphans with no coherent pathway home:
  intro (ep-1), the 100th special (ep-100), drug interactions
  (ep-22 + notecast-22, → oral-medicine, no pathway), 5 Dentopedia equipment
  items (suck-back, handpiece colors, loupes, portable x-ray, painless
  injection), laser debonding (ep-124-1), practice branding (ep-143-1).
  Leaving these uncovered is correct unless an "equipment / practice" pathway
  is later wanted.

## Notable cross-pillar decisions

- **Implant split**: the 94-step `implantology-core` draft was retired and
  replaced by `implant-surgical` (biology/surgery) + `implant-prosthetic`
  (components/restoration). 94 steps was too long for one route.
- **AI**: the standalone `promptologist` draft was absorbed into `ai-dentistry`
  (concept episodes → promptologist series).
- **Biomimetic vs esthetic vs ceramics**: anterior veneers live in `esthetic`;
  ceramic material science lives in `ceramics`; `biomimetic` borrows both where
  a bonded posterior restoration needs them. Same files, three journeys.
- **chairside** (25 case reports) had been in no pathway; now anchors
  `treatment-planning` and seeds `failure-troubleshooting`, `occlusion`,
  `esthetic`, both implant pathways.
- **metanotes** (critical appraisals) anchor `evidence-literacy`.

## Tooling

- `tools/pathway_scout.py TERM…` — ranked candidates across the whole brain
  (Persian-normalized), for authoring cross-pillar pathways.
- `tools/pathway_scout.py --steps TERM…` — steps-JSON skeleton.
- `tools/pathway_scout.py --coverage` — audit 0 / 1 / many pathway membership.

## Still pending (unchanged from Phase 3 plan)

1. Founder curation pass on ordering/trimming per pathway.
2. `plus-api`: pathway endpoints behind `requirePremium` (`GET /pathways`,
   enroll, advance `current_step`; table `user_pathways` exists) + pathway
   summary in `GET /me`.
3. Frontend pathway page + rule-based "ادامه بده" widget.
4. Audio-completion signal in the player (episodes) before recommending "بشنو".
5. AI recommendation layer (Phase 5) — candidates-from-rules, pick+justify by
   the model — after the rule-based loop proves itself.
