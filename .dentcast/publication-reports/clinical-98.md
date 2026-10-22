# Clinical Insight 98 — publication report

Prepared on 2026-10-22. Publication candidate is complete and mechanically verified on its feature branch (`publish/insight-98-shade-grayscale`, PR #953). Main integration and a live-site check follow Delivery 3 and checkpoint cleanup.

## Content and approvals

- Category: `clinical`; content ID: `insight/insight-98`; brain id `clinical-98`; sequence contiguous through 97, next number 98.
- Title (exact): یک ترفند ساده برای انتخاب رنگ راحت‌تر
- Caption (exact): وقتی بین دو شید شک داریم، عکس سیاه‌وسفید کمک می‌کند Value یا روشنی و تیرگی آن‌ها را ساده‌تر با دندان مقایسه کنیم.
- Founder confirmed: full Persian body as drafted on the branch; opening paragraph; ordinary post (not Challenge); Pulse sentence; taxonomy `esthetic` / `shade-and-whitening`.
- Writing-style review: no rewrites required beyond the already-approved draft.
- Image: founder-supplied WebP `insight/insight98-shade-value-grayscale.webp` (no fabricated media). No research paper attached.
- Persian page: `/insight/insight-98.html`; English page: `/insight/en/insight-98.html`.

## Template, identity and metadata

- Structural predecessor: `insight/insight-97.html` (template SHA256 `bf35846784b97e3b6de25d447752c4d6c1a2c63799c9304564c3aa5f591fe282`).
- Metadata audit: exact title/description on metadata, OG, Twitter and BlogPosting JSON-LD; canonical `.org`; `datePublished` = `dateModified` = `2026-10-22`. Deferred GA4 once; MedicalWebPage `healthCondition` set to Dental Shade Selection.
- Landing `insight/index.html`: newest-first link with the exact title (manual landing correction recorded).

## Taxonomy and links

- Live PILLARS: `esthetic` / `shade-and-whitening` (structured subtopic; no new pillar/subtopic minted).
- Brain entry appended last (571/571); key set/order matches clinical-97; no DES fields in brain.
- Navigation capsules: glossary + `/pillar/esthetic/`.
- C.4.7: glossary reviewed; no unmistakable back-link candidate for this Value/grayscale tip (bleaching same subtopic but different concept and already at 5-link cap) — 0 back-links.
- C.4.7-b skipped: not a glossary publication.
- C.4.8: fresh body analysis; Value/Grayscale have no glossary entries; weak bleaching/translucency matches skipped — 0 inline glossary/episode anchors.
- C.4.9: کاوش بیشتر at Hard Rule 9 cap (5): insight-91 (Value), insight-92 (shade match), episode-68 (final color factors) plus nav capsules. No self-link.
- None of 4.7/4.8/4.9 was skipped because a predecessor lacked links.

## Hashtags, pathways and Pulse

- Canonical tags reused: `#اینسایت` `#ولیو` `#انتخاب_shade` `#زیبایی`. `hashtag_ref.py --check` OK.
- Pathway: inserted into `esthetic` immediately after `sharehub/share-26` (founder option الف). Coverage ≥1 pathway.
- Bundle `bundle-laminate`: rejected GATE 2 — title is a clinical tip/trick, not laminate-continuation content. No bundle count edits.
- Pulse: new exact-title line first; previous six retained; bottom line removed; exactly seven lines.

## Educational tools and DES

- Flashcards: 3 authored DefinedTerms (`#flashcards-c1`–`c3`) in corpus; not FAQ copies. Quiz: 3 standalone binary FAQs with explicit بله/خیر openings. Index builders re-run in C.8.
- DES basket COMMENTARY on the authored tip text. Score 15 band E; fidelity lawful null self-record (no independent cited source). Item 4 cites Insight landing declaration verbatim. No DOI/abstract/quartile guessed. Record under `plus/des-scores.json` key `insight/insight-98` only.
- Paper / NoteCast / Promptologist / LiteCast / Challenge branches not applicable. Challenge line: مطلب معمولی.

## Builds and English mirror

Builders ran in canonical order (homepage counters, pillar, flashcards/quiz/plus/up-board indexes, stamp-version, hreflang/noindex check, sitemap). English mirror is structure-faithful; en is noindex/follow, self-canonical, out of sitemap; fa↔en toggles inverse; chrome `metanotes/en/meta-1.html` unchanged. Persian page carries exactly one `dc-notify=true`.

Final fa page SHA256 `604ebf6c184e31256003a08618adbcbf5b4c12c4c2081054b6e917d319c9d9ae`; en SHA256 `59253fcac03b594579def735ca73de97507e775b246968c870b85feaaf5770db`.

## Phase F

Command: `python tools/dentcast_publish_handoff.py verify` → `tools/verify_publish.py insight/insight-98` (no separate expect-title/caption strings beyond founder-approved brain fields already on the page).

**90 passed, 1 warned, 0 failed — publish is COMPLETE**

Only warning: H1 includes intentional house-style chrome `Insight 98 —` before the exact title. Deliberate.

## Delivery cuts

1. `f9938a254f` — page construction and semantic linking (C.4.9), unfinished handoff.
2. `c9ecf2cb48` — DES/Fidelity COMMENTARY 15/E and FAQ/flashcards (C.4.13), unfinished handoff. (D1/D2 rewritten on the feature branch solely to correct handoff `content_id` from `clinical-98` to path form `insight/insight-98`.)
3. Delivery 3 — final builders/EN/pathway/Phase F/report, completion receipt, handoff deletion (this cut).

## Modified paths (final scoped set)

`.dentcast/PUBLISH-HANDOFF.md` (deleted at cut 3), `.dentcast/publication-reports/clinical-98.md`, `.dentcast/publication-reports/insight/insight-98.completion.json`, `dentcast-brain.json`, `index.html`, `insight/en/insight-98.html`, `insight/index.html`, `insight/insight-98.html`, `insight/insight98-shade-value-grayscale.webp`, `pillar/esthetic/index.html`, `pillar/esthetic/structure.json`, `pillar/index.html`, `pillar/structure.json`, `player.html`, `plus/content-index.json`, `plus/des-scores.json`, `plus/faq-corpus.json`, `plus/flashcards-index.json`, `plus/pathways.json`, `plus/quiz-index.json`, `service-worker.js`, `sitemap.xml`, `up-board/index.json`.
