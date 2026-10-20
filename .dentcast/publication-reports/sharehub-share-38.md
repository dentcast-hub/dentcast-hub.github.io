# ShareHub 38 — Reverse Scan Body

Date: 2026-10-20

## Content

- Persian page: `sharehub/share-38.html`
- English companion: `sharehub/en/share-38.html`
- Image: `sharehub/share38.webp` (1536×768; 88,128 bytes)
- Title: Reverse Scan Body چیست و چرا به آن نیاز داریم؟
- Caption: در بازسازی فول‌آرچ، موقعیت ایمپلنت‌ها را چطور می‌توان از یک پروتز موقت با فیت تأییدشده به محیط دیجیتال منتقل کرد؟
- Author: Dr. Foad Shahabian
- References: none supplied or added.
- DES: v3.4 COMMENTARY, 12/100, band E. FIDELITY: null because this is the page's own commentary record.

## Recorded changes (original publish — PR #939 / #940)

- Added the ShareHub landing-page link and typed brain entry.
- Assigned pillar `digital`, subtopic `digital-workflow`.
- Added generated indexes, DES record, flashcards/quiz, up-board, sitemap.
- Preserved the scientific content; corrected only spacing/punctuation and obvious spelling.

## Completion pass — 2026-10-20 (this branch)

### 5.0 Hashtags (Hard Rule 15)

- Minted `#Reverse_Scan_Body` via `.dentcast/hashtag-batches/A91-share-38.json`.
- Replaced out-of-library `#فول_آرچ_ایمپلنتی` → canonical `#ایمپلنت_فول_آرچ`.
- Replaced out-of-library `#اسکن_ایمپلنت` → canonical `#اسکن_بادی`.
- Final brain tags: `#Share_Hub`, `#Curated_Content`, `#Reverse_Scan_Body`, `#ایمپلنت_فول_آرچ`, `#دندانپزشکی_دیجیتال`, `#اسکن_بادی`.
- `hashtag_ref.py --check`: OK.

### Cross-linking (Hard Rule 11)

- **4.7 glossary → new content:** analyzed `scan-body`, `intraoral-scanner`, `abutment`, `dental-implant`, `ti-base`, `implant-supported-crown`, `implant-loading`, `emergence-profile`. All already at the 5-link cap (or over). **0 back-links added** (documented empty-at-cap result). 4.7-ب: skipped — not a glossary publish.
- **4.8 in-body:** fresh analysis; auto-applied three first-occurrence anchors in the conventional-digital paragraph: `اسکن‌بادی‌ها` → `/glossary/scan-body.html`, `اباتمنت‌ها` → `/glossary/abutment.html`, `اسکن داخل‌دهانی` → `/glossary/intraoral-scanner.html`. Rendered wording unchanged aside from the anchors.
- **4.9 related:** section had 4 links including a **wrong** `share-9` target (tobacco/failure article mislabeled as full-arch scan accuracy). Replaced with `/sharehub/share-2.html` (بهینه‌سازی دقت اسکن داخل‌دهانی ایمپلنت). Added `/episodes/episode-133.html` (اسکن‌بادی). Final count **5/5** (at cap): دانشنامه، فهرست موضوعی، share-2، episode-106-2، episode-133.

### Pathways & bundles (5.6 / 5.6-ب)

- Was incorrectly `--at-start` on both `digital` and `implant-prosthetic`.
- Repositioned: `digital` after `episodes/episode-106-2`; `implant-prosthetic` after `episodes/episode-144-2`.
- Still in exactly 2 full pathways (cap). No third pathway.
- **باندل:** candidate `bundle-implant-parts` (`continues_pathway: implant-prosthetic`) → **رد شد (گیت ۲)** — title is a technique explainer («چیست و چرا…»), not a beginner whole-concept core for the abutment/parts starter bundle. `digital` → **باندل: بدون کاندید**.

### Builders + Phase F

- Ran: homepage counters, `build_pillar.py all`, flashcards index, quiz index, img attrs, plus index, up-board, sitemap, `stamp-version.py` last (`3d885f9cdd`).
- Phase F: `python tools/verify_publish.py sharehub/share-38 --expect-title "…" --expect-caption "…"` → **87 passed, 0 warned, 0 failed — publish is COMPLETE**.

## Verification status

Original PRs #939/#940 merged the article to main. This completion pass closes the undocumented semantic/hashtag/pathway gaps and re-certifies Phase F on final bytes.
