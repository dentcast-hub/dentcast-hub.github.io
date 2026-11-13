# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-54"
- Status: in_progress
- Next canonical step: "C.4.7"
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "chairside",
    "content_id": "chairside/chairside-54",
    "context": {
      "approvals": [],
      "decisions": [
        {
          "kind": "ledger_order_v2"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "note": "founder visit text with title",
          "ref": "chat:founder-message/text",
          "sha256": "b99532263c5bf672c130cf0dfd0d31631c242d36ca9570125637c1c027f032f1"
        },
        {
          "note": "founder radiograph image to convert to WebP",
          "ref": "chat:founder-message/image-90711.jpg",
          "sha256": "e157b4804d30223677c5440e0b6bff9b2ea70cb68d46c5c069301e8d0d2b339f"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": []
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "CLAUDE.md, workflows/README.md, global/README.md + selected core sections (repo-core, ads, publication-surfaces, des-display, site-invariants) via dentcast_global_rules.py --read pages 1-2, agent-parity.md, publish-checkpoints.md, publish-handoff-tool.md, modules 01 and 02 read completely. Capability pre-check: git ls-remote origin works; push to non-main branch ccr-e8ffd2e6-c2sc0b; Actions monitoring and PR/merge via GitHub MCP"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder message carries visit text and one radiograph image, no research paper: normal publication, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed brain once (608 entries); latest same-category chairside-53 key order type,id,title,caption,hashtags,keywords,page_url,pillar; URL /chairside/chairside-N.html, images chairside/csN-k.webp, en mirror chairside/en/; live PILLARS read from tools/build_pillar.py on fresh origin/main"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder says \u00ab\u0627\u06cc\u0646 \u0634\u0631\u062d \u0648\u06cc\u0632\u06cc\u062a\u0647\u00bb; \u0648\u06cc\u0632\u06cc\u062a is the reader-facing name of Chairside (repo-core): locked type chairside"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain chairside max 53, next chairside-54 (content_id chairside/chairside-54)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Full text supplied in founder message; first line is the founder title \u00ab\u0648\u0642\u062a\u06cc \u062e\u0648\u0627\u0633\u062a\u0647\u0654 \u0628\u06cc\u0645\u0627\u0631 \u0628\u0627 \u062f\u0631\u0645\u0627\u0646 \u062f\u0631\u0633\u062a \u0647\u0645\u200c\u062e\u0648\u0627\u0646\u06cc \u0646\u062f\u0627\u0631\u062f\u00bb (Hard Rule 16 copy); bound by digest b9953226"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Single de-AI pass: first-person clinical narration with natural rhythm, no formulaic openers or clich\u00e9 filler; no rewrites, text of record unchanged"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder supplied one periapical radiograph image (90711.jpg, 945x619) and asked to convert to WebP and place in text: chairside/cs54-1.webp; no audio/video"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No paper file attached; step 4.10 branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Basket 1 COMMENTARY: founder's own visit narration and reasoning, no DOI/PubMed/references; page body is source_text (FULL_TEXT); fidelity null by self-COMMENTARY exception"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ordinary visit narration, not a Challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent drafts in recent Chairside pattern \u00ab\u06cc\u06a9 \u0648\u06cc\u0632\u06cc\u062a \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<title>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f.\u00bb, title linked to /chairside/chairside-54.html, no spoiler (standing acceptance)"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.0",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: chairside locked at B.1",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: no LightGlossary write",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: specialist track",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: same-category Chairside template",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: ordinary publication",
        "status": "skipped"
      },
      {
        "evidence": [
          "chairside/chairside-53.html is latest same-category structural template, enrolled in target_paths, kept byte-unchanged"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Structural clone of chairside-53: founder title copied verbatim to title/h1/og/twitter/headline/breadcrumb; agent caption on description/og/twitter/JSON-LD; nine founder paragraphs verbatim; founder radiograph as /chairside/cs54-1.webp (945x619, 120 KB WebP) after first paragraph with agent alt; dates 2026-11-13; .org domain, two crossorigin preconnects and one GA4 snippet survived; no seal; dc-notify left to Phase E; no chip row in template; body opens with founder paragraph (lead origin author_original)"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.0.5",
        "module": "03-litecast-and-page.md",
        "reason": "Category chairside: not LiteCast; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Category chairside: not LiteCast; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar.primary treatment-planning, subtopic comprehensive-diagnosis: the visit's subject is that crown removal is part of diagnosis/prognosis before retreatment and prosthetic planning. Competing: extraction-vs-preservation (prognosis of tooth 2 left mentioned only as an example) and fixed-pros/failures; closest semantic match is comprehensive-diagnosis (standing acceptance)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "One dc-related-section with exactly the two canonical capsules /glossary/ and /pillar/treatment-planning/; cloned semantic capsules of chairside-53 removed from the new page (4.9 fills fresh)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "chairside/index.html is hand-maintained: new top row \u00ab\u0648\u06cc\u0632\u06cc\u062a \u06f5\u06f4 \u2014 <founder title>\u00bb added with exact sibling markup above chairside-53; byte-preserving insert"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Dates audit: datePublished/dateModified/lastReviewed and both visible <time> = 2026-11-13; no stale 2026-11-12 left in new page"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- chairside/chairside-53.html succeeds: template unchanged"
        ],
        "id": "C.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Chairside ordinary article: not NoteCast; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Chairside ordinary article: not NoteCast credit; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Chairside ordinary article: not an ordered ep-nav Promptologist series; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (B.4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (B.4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (B.4.7)",
        "status": "skipped"
      },
      {
        "evidence": [
          "COMMENTARY basket: source_text = founder title + nine body paragraphs as shipped, FULL_TEXT. SOURCE run: claude -p in empty dir, system prompt .dentcast/des-v3.7-knowledge.md (sha256 709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9), --tools '' --model opus, modelUsage claude-opus-5-5. Run 1 metadata lacked the section (12/E, item 4 = 0 with note that chairside/ earns +3); run 2 with section chairside/ in metadata stored: des_score 15, band E, checklist 4/0/3/3 (item 4 from chairside/index.html declaration with mandatory note). Part 3: quotes verbatim, 5+10=15, band E, COMMENTARY schema; verify_publish --des-text ok; des_record_guard check ok. Part 3(6): interpretation_fa sentence 2 narrowed by agent. Fidelity slot null (self-COMMENTARY; des_fidelity_units 0 units). Stored under chairside/chairside-54 in plus/des-scores.json via json_append. No M3b"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "chairside/chairside-53.html",
      "chairside/chairside-54.html",
      "chairside/cs54-1.webp",
      "chairside/en/chairside-53.html",
      "chairside/en/chairside-54.html",
      "chairside/index.html",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "pillar/index.html",
      "pillar/structure.json",
      "pillar/treatment-planning/index.html",
      "pillar/treatment-planning/structure.json",
      "player.html",
      "plus/assistant-tags.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/des/chairside/chairside-54.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/flashcards-index.json",
      "plus/pathways.json",
      "plus/quiz-index.json",
      "service-worker.js",
      "sitemap.xml",
      "up-board/index.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: chairside/chairside-54.html, chairside/cs54-1.webp, chairside/index.html, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
