# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-51"
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
    "content_id": "chairside/chairside-51",
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
        },
        {
          "decision": "Founder asked that the earlier piece on occlusal adjustment with bite registration or digital scan be linked to this one: resolved to clinical-103 /insight/insight-103.html \u00ab\u0627\u0635\u0644\u0627\u062d \u0627\u06a9\u0644\u0648\u0698\u0646 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646\u200c\u0647\u0627\u06cc \u06a9\u0648\u062a\u0627\u0647 \u0628\u0627 \u06a9\u0645\u06a9 \u0628\u0627\u06cc\u062a \u0631\u062c\u06cc\u0633\u062a\u0631\u06cc\u0634\u0646 \u0648 \u0627\u0633\u06a9\u0646 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u00bb (founder word \u00ab\u0648\u0627\u06cc\u062a\u00bb = bite). Scoped approval to link it.",
          "evidence": [
            "founder chat message 2026-11-10",
            "dentcast-brain.json clinical-103"
          ],
          "kind": "founder_request",
          "scope": "related content"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "note": "founder text, transcribed verbatim from the doc's 5 text paragraphs",
          "ref": "artifact:claude-docs/52b29f07 (founder doc \u00ab\u0634\u0631\u062d \u0648\u06cc\u0632\u06cc\u062a: \u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631\u00bb, rev 2)",
          "sha256": "ef36963b97636f107a7475f845f0f79bedb19e2d670d96447fff7065e592065d"
        },
        {
          "note": "founder clinical photo, 930x1040 webp, alt \u00ab\u062a\u0645\u0627\u0633\u200c\u0647\u0627\u06cc \u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 \u0631\u0648\u06cc \u0628\u0631\u06cc\u062c\u00bb",
          "ref": "artifact-asset:52b29f07/de7c08685eda9bbc8329499ae41d4be8.webp",
          "sha256": "e036c1ce7b3ea908bfd1a3022cc0c35c77c95ccf532a7593e8605bd5629a0b8d"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "checks": {
            "arithmetic": "ok",
            "audit_2d": "not owed (COMMENTARY)",
            "band": "E ok",
            "fidelity": "[null] \u2014 COMMENTARY self-record, no call owed",
            "persian_text": "verify_publish --des-text ok; 3 interpretation sentences checked against text, kept",
            "quotes": "item1 verbatim in source_text; item4 verbatim from chairside/index.html with note naming it",
            "rating_rule": "des_record_guard check ok (no RESEARCH domains)",
            "schema": "COMMENTARY nulls ok"
          },
          "content_id": "chairside/chairside-51",
          "kind": "des_receipt",
          "m3b": "none \u2014 no Fidelity units",
          "step": "C.4.13",
          "stored": "plus/des-scores.json key chairside/chairside-51 via dentcast_text_io.json_append",
          "summary": "COMMENTARY, source_text = page own body (title + 4 founder paragraphs + figure caption), FULL_TEXT; no DOI/lookup (basket 1). SOURCE call: claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9) --tools '' --model opus --no-session-persistence, fresh empty dir; model reported claude-opus-5-5; CLI 2.1.322. Result des_version 3.7, des_score 12 = 5+4+0+0+3, band E, provisional false."
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Read complete: CLAUDE.md, workflows/README.md, global/README.md + dentcast_global_rules core pages 1-3 and pathway-standings/certificate/exam sections, agent-parity.md, publish-checkpoints.md, publish-handoff-tool.md, modules 01 and 02. Capability: ls-remote OK, push to ccr-* branch, GitHub MCP for Actions/PR."
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (founder Claude Doc, 5 paragraphs + 1 image), paper file no \u2192 normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain parsed once: 603 entries; chairside latest = chairside-50 (keys type,id,title,caption,hashtags,keywords,page_url,pillar{primary,secondary,subtopic}); array tail = chairside-50; live PILLARS read (occlusion: occlusal-analysis-adjustment \u2026)"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Type: founder said \u00ab\u0686\u06cc\u0631 \u0633\u0627\u06cc\u062f\u00bb \u2192 brain type chairside (folder chairside/)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Next number: max chairside-50 + 1 = chairside-51; no gap"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Text supplied in founder Claude Doc (input digest ef36963b\u2026)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "De-AI pass: \u00ab\u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a\u00bb \u2014 colloquial first-person clinical narration, varied rhythm, no clich\u00e9s or filler; text kept byte-identical (colloquial register has chairside precedent: chairside-16/29/35/39/45)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Media: one image supplied in the doc (artifact asset de7c0868\u2026, 930x1040 webp, 32 KB) \u2192 chairside/cs51-1.webp per chairside csNN-k naming; no audio/video field in chairside entries"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No paper file attached \u2192 step 4.10 branch skipped"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Basket 1 COMMENTARY: founder own case narration and reasoning, no DOI/PubMed/references block; source_text = page text"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ordinary post (\u00ab\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc\u00bb): a case narration, not a question post"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent drafts in chairside precedent pattern \u00ab\u06cc\u06a9 \u0648\u06cc\u0632\u06cc\u062a \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f.\u00bb (index.html, chairside-48..50), title-only, no spoiler"
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
        "reason": "Not LiteCast (locked category chairside); module 03 step 0 applies only to LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template = chairside/chairside-50.html (previous same-category page), kept byte-unchanged (checked at C.4 with git diff --quiet)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "chairside/chairside-51.html cloned from chairside-50: structure identical, domain dentcast.org kept, GA4 deferred snippet once, two preconnect with crossorigin at head top, no trustseal; body = founder 4 paragraphs byte-copied + figure cs51-1.webp (alt copied from founder doc, figcaption = same words); title \u00ab\u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631\u00bb = founder doc heading without its \u00ab\u0634\u0631\u062d \u0648\u06cc\u0632\u06cc\u062a:\u00bb label; caption agent-composed (178 chars); body opens with founder paragraph (lead origin author_original); chairside template has no chip row"
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
        "reason": "Not LiteCast (LiteCast link step only)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast (LiteCast link step only)",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar.primary=occlusion (clear single fit: occlusal contacts of a bridge, articulating-paper reading); subtopic=occlusal-analysis-adjustment (analysis of contact distribution/quality; clear fit vs occlusal-scheme-guidance); secondary [] ; standing acceptance"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with exactly 2 capsules: /glossary/ and /pillar/occlusion/ (cloned links from chairside-50 removed from the new page, budget now 2/5)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "chairside/index.html is hand-maintained: added \u00ab\u0648\u06cc\u0632\u06cc\u062a \u06f5\u06f1 \u2014 \u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631\u00bb row at top, sibling markup"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Dates audit: all 7 date occurrences = 2026-11-10 (datePublished, dateModified, lastReviewed, 2 visible time tags x datetime/text); OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- chairside/chairside-50.html \u2192 exit 0 (template unchanged)"
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
        "reason": "Not NoteCast (parent episode step only for NoteCast)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not NoteCast (NoteCast credit only)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not Promptologist (prev/next only for Promptologist)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [
          "plus/des-scores.json chairside/chairside-51: COMMENTARY 3.7, 12/E, fidelity [null]; Part 3 checks (1)-(7) green; no M3b; receipt in context.validation"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "chairside/chairside-51.html",
      "chairside/cs51-1.webp",
      "chairside/en/chairside-51.html",
      "chairside/index.html",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plus/assistant-tags.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: chairside/chairside-51.html, chairside/cs51-1.webp, chairside/index.html, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
