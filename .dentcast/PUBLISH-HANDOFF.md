# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-43"
- Status: in_progress
- Next canonical step: "C.4.10.1"
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "sharehub",
    "content_id": "sharehub/share-43",
    "context": {
      "approvals": [
        {
          "decision": "\u062d\u0641\u0638 \u062f\u0646\u062f\u0627\u0646 \u06cc\u0627 \u06a9\u0634\u06cc\u062f\u0646 \u0622\u0646\u061f \u0633\u0647 \u062f\u0631\u0645\u0627\u0646 \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646 \u0627\u0632 \u0646\u06af\u0627\u0647 \u067e\u0631\u0648\u062a\u0632\u06cc",
          "evidence": [
            "queue/02-sharehub-keep-or-extract/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval 1405/08/06"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0631\u06cc\u0634\u0647 \u0627\u0632 \u0646\u0638\u0631 \u0627\u0646\u062f\u0648 \u0642\u0627\u0628\u0644 \u0646\u06af\u0647\u062f\u0627\u0631\u06cc \u0627\u0633\u062a\u060c \u0627\u0645\u0627 \u062a\u0627\u062c\u06cc \u0628\u0631\u0627\u06cc \u0633\u0627\u062e\u062a\u0646 \u0646\u0645\u0627\u0646\u062f\u0647 \u0627\u0633\u062a. \u0628\u06cc\u0646 \u062d\u0641\u0638 \u0648 \u06a9\u0634\u06cc\u062f\u0646 \u0647\u0645\u06cc\u0634\u0647 \u0641\u0642\u0637 \u062f\u0648 \u0631\u0627\u0647 \u0646\u062f\u0627\u0631\u06cc\u0645\u060c \u0648\u0644\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u062f\u0631\u0633\u062a \u0627\u0632 \u062c\u0627\u06cc \u062f\u06cc\u06af\u0631\u06cc \u0634\u0631\u0648\u0639 \u0645\u06cc\u200c\u0634\u0648\u062f.",
          "evidence": [
            "queue/02-sharehub-keep-or-extract/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval 1405/08/06"
          ],
          "scope": "caption",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "decision": "Below the page title, outside article body",
          "evidence": [
            "queue/02-sharehub-keep-or-extract/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval 1405/08/06"
          ],
          "kind": "subtitle_placement"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "evidence": [
            "The opening paragraph was present in the frozen author text and was copied unchanged into the body; no agent-authored lead was added."
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/02-sharehub-keep-or-extract/01-\u0645\u062a\u0646.md \u2014 opening paragraph in \u00ab\u0645\u0642\u062f\u0645\u0647\u00bb\u060c supplied by the author"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "ref": "queue/02-sharehub-keep-or-extract/01-\u0645\u062a\u0646.md",
          "sha256": "7b3a4e07df0f5316bd0be25c3050d2d22c03c6515cc3e08353e717dcb95cab07"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
          "sha256": "728d307481679ffe676e8cd958b929c4321780d0e253844ce2260bb3521e7dd2"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md",
          "sha256": "83db04d13cee1ad53e63f33ab10f81d3ef5ecfb40d0d58fe7b5955c1d1ac7b26"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md",
          "sha256": "772c791d9024f9047981ef4ef7d6cd8e310ab0f8be310d5237c68fb520fbef5d"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/05-DES-Fidelity/des.json",
          "sha256": "1c0a2795c5d7cbe95acdffab263966857416b6d3924ff3fcff74f9b19cc280b7"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/05-DES-Fidelity/fidelity.json",
          "sha256": "2e366ba1773d10c4662c8d1f2eea92ec18e05c6ce074ffe636d130cc2f2c5142"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/08-\u0633\u0624\u0627\u0644\u200c\u0647\u0627\u06cc-\u0622\u0632\u0645\u0648\u0646.json",
          "sha256": "4f97f01a0cf30353f338bcd8728b8328c2d94ac89ea7ca9e8cf02cef4a48e165"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md",
          "sha256": "e495d5deced2ca2ee90a94bd4faa1ebb3c14b3c84a6af5de026a6aff317e0af1"
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
          ".dentcast/workflows/modules/01-hard-rules.md read; queue selection and approvals verified; Hard Rules 1\u201315 loaded"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Text and attached paper both exist; normal ShareHub route plus all three paper-ingestion parts applies. Source: queue status and 01-\u0645\u062a\u0646.md / 04-\u0645\u0646\u0628\u0639/\u0645\u0646\u0627\u0628\u0639.md."
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md; founder-approved category sharehub"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md; no series"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Live main ShareHub tail: share-42; next identifier share-43"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/01-\u0645\u062a\u0646.md; SHA256 verified"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md; both Q3.5 edits approved and included"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/03-\u062a\u0635\u0627\u0648\u06cc\u0631/\u062a\u0635\u0627\u0648\u06cc\u0631.md; five approved WebP files and alt text"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/04-\u0645\u0646\u0628\u0639/\u0645\u0646\u0627\u0628\u0639.md; DOI 10.1111/iej.13723; archived Drive PDF receipt"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.8 approved RESEARCH/FULL_TEXT; DOI and Drive PDF SHA256 verified (8743fa0f\u2026528e3); all supplied DES evidence quotes and all 53 nonempty Fidelity source_quote fields match extracted paper text after canonical normalization; DES arithmetic 15\u00d70.3=4.5\u21925, band E; fidelity 116-unit counts/score/level and founder u38 correction checked; verify_publish.py --des-text passes."
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ordinary ShareHub post; founder-approved not-Challenge decision in queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md; no Challenge markup route."
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Exact approved Pulse text is title only: \u00ab\u062d\u0641\u0638 \u062f\u0646\u062f\u0627\u0646 \u06cc\u0627 \u06a9\u0634\u06cc\u062f\u0646 \u0622\u0646\u061f \u0633\u0647 \u062f\u0631\u0645\u0627\u0646 \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646 \u0627\u0632 \u0646\u06af\u0627\u0647 \u067e\u0631\u0648\u062a\u0632\u06cc\u00bb; queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md."
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Locked category is sharehub, so LiteCast-only branch is inactive and general specialist page path applies."
        ],
        "id": "C.0",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Not a LiteCast publication; module 03 explicitly limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not a LiteCast publication; module 03 explicitly limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not a LiteCast publication; module 03 explicitly limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not a LiteCast publication; module 03 explicitly limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template: sharehub/share-42.html; SHA256 9c2840e429196f3fdf4160af89782a5a5e5a601915518de2358b00e6047a533d; source file left untouched."
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Cloned locked ShareHub template; page body converted from approved queue article; founder subtitle stays outside scored body; five byte-matching images copied; exact approved title and caption applied; first prose paragraph precedes list; preconnect and lazy GA4 survived."
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
        "reason": "This publication is sharehub; module 03 limits this substep to LiteCast pages.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "This publication is sharehub; module 03 limits this substep to LiteCast pages.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Clear semantic match: treatment-planning / extraction-vs-preservation; live subtopic title \u00ab\u062d\u0641\u0638 \u06cc\u0627 \u06a9\u0634\u06cc\u062f\u0646 \u062f\u0646\u062f\u0627\u0646\u00bb covers the article\u2019s central preserve-or-extract decision."
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Existing typed-brain capsule retained; its href now points to /pillar/treatment-planning/ (trailing slash). Existing inherited links kept pending mandatory semantic-link budget."
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/index.html contains exactly one new Share-43 link at the top of the static listing, matching the existing title/author convention."
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Date/meta audit: share-43 canonical and alternate URLs, title and approved caption metadata aligned; datePublished and dateModified are 2026-10-31; no stale share-42 URL remains; preconnect/GA present; no trust seal."
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Locked ShareHub template share-42.html still hashes to 9c2840e429196f3fdf4160af89782a5a5e5a601915518de2358b00e6047a533d."
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
        "reason": "Only NoteCast pages modify a parent episode related-content block; this publication is ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "DES/article-credit mirroring applies only to NoteCast/core-episode pairs; this publication is ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist-only series navigation is inapplicable to ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Candidates: crown-lengthening, ferrule-effect, treatment-plan, dental-implant. Each existing \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb section is already at or above the five-link cap (counts 6, 6, 5, 5 respectively); per Hard Rule 9 no glossary page was edited."
        ],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.7-b",
        "module": "05-semantic-linking.md",
        "reason": "This is a ShareHub page, not a glossary term; step 4.7-b only runs for glossary publishes.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Body-link diff only: 0b48d07f641f91bc27e6de7b2a9acc89366735dd37f3111d4bdc4737c20789a7 \u2192 319bf7108d4a29b997d39dcbd0e46a9f35cbe0558882aa9a42a2e102954052dd; anchors added: episode-151, ferrule-effect, dental-implant, crown-lengthening; each first occurrence only."
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "The brain comparison was completed; five-link cap left no available slot for a new related link, and the author-original first paragraph provenance is now recorded."
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "PULSE.md",
      "brain.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast_cabinet_full_catalog.json",
      "index.html",
      "plus/cabinet-bridge.json",
      "plus/cabinet-papers.json",
      "plus/des-scores.json",
      "sharehub/en/share-43.html",
      "sharehub/index.html",
      "sharehub/share-43.html",
      "sharehub/share43-fig1.webp",
      "sharehub/share43-fig2.webp",
      "sharehub/share43-fig3.webp",
      "sharehub/share43-fig4.webp",
      "sharehub/share43-fig5.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: sharehub/index.html, sharehub/share-43.html, sharehub/share43-fig1.webp, sharehub/share43-fig2.webp, sharehub/share43-fig3.webp, sharehub/share43-fig4.webp, sharehub/share43-fig5.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
