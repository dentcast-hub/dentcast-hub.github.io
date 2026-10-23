# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "dentai/promptologist/prompt-append2-4"
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
    "category": "promptologist",
    "content_id": "dentai/promptologist/prompt-append2-4",
    "context": {
      "approvals": [],
      "decisions": [
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "category": "promptologist",
          "challenge": false,
          "des_basis": "COMMENTARY",
          "kind": "routing_basis_v1",
          "paper_file": false,
          "pillar": "practice-infrastructure",
          "subtopic": "llm-tools"
        },
        {
          "evidence": [
            "review:initial-paragraph-unchanged-in-article-blob:05a7e80ffb8a4f445f55b7e0657a73d8f06bfe2e"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder-submitted-first-paragraph:2026-10-23:\u067e\u06cc\u0648\u0633\u062a-\u06f2-\u0642\u0633\u0645\u062a-\u06f4"
        },
        {
          "builder_ref": "manual-index:dentai/promptologist/index.html:real-ai-item-rows",
          "evidence": [
            "github:blob:05a7e80ffb8a4f445f55b7e0657a73d8f06bfe2e",
            "github:blob:fa655b76a73aa4bea3cf8d31cbba1e5eea0a3938",
            "github:blob:03044e3e6a115052c6c1e6062143c51b3115ef49",
            "review:all-first-cut-modified-paths"
          ],
          "kind": "first_cut_scope_audit_v1",
          "landing_mode": "included",
          "landing_path": "dentai/promptologist/index.html",
          "observed_changed_paths": [
            "dentai/promptologist/prompt-append2-4.html",
            "dentai/promptologist/prompt-append2-3.html",
            "dentai/promptologist/index.html"
          ],
          "related_changed_paths": [
            "dentai/promptologist/prompt-append2-3.html"
          ]
        },
        {
          "kind": "pulse_draft_v1",
          "page_url": "/dentai/promptologist/prompt-append2-4.html",
          "text": "\u067e\u06cc\u0648\u0633\u062a \u06f2 \u0640 \u0642\u0633\u0645\u062a \u06f4: \u062a\u063a\u06cc\u06cc\u0631\u0627\u062a \u0686\u0637\u0648\u0631 \u062b\u0628\u062a \u0645\u06cc\u200c\u0634\u0648\u0646\u062f \u0648 \u0628\u0647 \u06af\u06cc\u062a\u200c\u0647\u0627\u0628 \u0645\u06cc\u200c\u0631\u0633\u0646\u062f\u061f"
        }
      ],
      "delivery": [],
      "inputs": [
        "author-chat-message:2026-10-23:Promptologist-append2-4-full-Persian-text",
        "observed-main:76e7448af7baf404e0314f79553d888c125c7e5c"
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        "Reviewed real uncommitted blobs and source template, including reciprocal navigation and 5-link cap; these are content checks, not scientific DES/Fidelity"
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "review:active-workflow@main:76e7448a:3-delivery-policy"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "review:author-provided-text-no-attached-paper"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "review:dentcast-brain.json@main:572-items:prompt-append2-1..3"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "review:promptologist-existing-open-section"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "review:prompt-append2-3=>prompt-append2-4"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "github:blob:05a7e80ffb8a4f445f55b7e0657a73d8f06bfe2e",
          "review:original-article-text-submitted-by-founder"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "review:AI-style-scan:original-author-text-retained-no-edit"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "review:text-only-no-new-multimedia-provided"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "review:no-paper-attached:paper-branch-inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "review:commentary:author-Git-tutorial-no-paper-identifier"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "review:regular-informational-post-not-a-Challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "draft:Pulse:title-only:\u067e\u06cc\u0648\u0633\u062a \u06f2 \u0640 \u0642\u0633\u0645\u062a \u06f4: \u062a\u063a\u06cc\u06cc\u0631\u0627\u062a \u0686\u0637\u0648\u0631 \u062b\u0628\u062a \u0645\u06cc\u200c\u0634\u0648\u0646\u062f \u0648 \u0628\u0647 \u06af\u06cc\u062a\u200c\u0647\u0627\u0628 \u0645\u06cc\u200c\u0631\u0633\u0646\u062f\u061f"
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
        "reason": "LiteCast-only: this is Promptologist",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only content registry",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only isolation rules",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only page construction",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only taxonomy exception",
        "status": "skipped"
      },
      {
        "evidence": [
          "github:blob:fa655b76a73aa4bea3cf8d31cbba1e5eea0a3938",
          "review:previous-page-template-cloned"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "github:blob:05a7e80ffb8a4f445f55b7e0657a73d8f06bfe2e",
          "review:author-body+new-page-metadata"
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
        "reason": "LiteCast-only internal body links",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only related capsules",
        "status": "skipped"
      },
      {
        "evidence": [
          "review:live-build_pillar.py:practice-infrastructure/llm-tools"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "github:blob:05a7e80ffb8a4f445f55b7e0657a73d8f06bfe2e",
          "review:2-global-capsules"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "github:blob:03044e3e6a115052c6c1e6062143c51b3115ef49",
          "review:hand-maintained-landing-new-link-once"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "github:blob:05a7e80ffb8a4f445f55b7e0657a73d8f06bfe2e",
          "review:2026-10-23-datePublished+dateModified"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "github:blob:fa655b76a73aa4bea3cf8d31cbba1e5eea0a3938",
          "github:blob:05a7e80ffb8a4f445f55b7e0657a73d8f06bfe2e",
          "review:prior-page-nav-only-change"
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
        "reason": "NoteCast parent episode only",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast/core-episode shared DES only",
        "status": "skipped"
      },
      {
        "evidence": [
          "github:blob:fa655b76a73aa4bea3cf8d31cbba1e5eea0a3938",
          "github:blob:05a7e80ffb8a4f445f55b7e0657a73d8f06bfe2e",
          "review:both-series-nav-links"
        ],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "review:109-glossary-entries:no-qualifying-specialist-related-page"
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
        "reason": "Glossary term publication only",
        "status": "skipped"
      },
      {
        "evidence": [
          "review:body-vs-glossary/episodes:no-strong-inline-link"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "github:blob:05a7e80ffb8a4f445f55b7e0657a73d8f06bfe2e",
          "review:2-global+3-semantically-related-capsules:5-max"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.14",
        "module": "09-challenge.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.8",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.7",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "D",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "E",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "F",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "G",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "pending"
      }
    ],
    "target_paths": [
      "dentai/promptologist/index.html",
      "dentai/promptologist/prompt-append2-3.html",
      "dentai/promptologist/prompt-append2-4.html"
    ]
  },
  "reconciliation": null,
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
