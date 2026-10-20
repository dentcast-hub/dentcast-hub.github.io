# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-96"
- Status: in_progress
- Next canonical step: null
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "clinical",
    "content_id": "insight/insight-96",
    "context": {
      "approvals": [
        {
          "decision": "Founder approved supplied content and requested completion through merge",
          "evidence": [
            "founder-request-2026-10-20-and-caption-approval"
          ],
          "scope": "title, original body, image, approved hashtags and keywords, approved spoiler-free caption; publish through merge",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "evidence": "continuous-series-1-through-95-next-96",
          "kind": "intake_identity_bound"
        }
      ],
      "delivery": [
        {
          "evidence": [
            ".dentcast/publication-reports/clinical-96.md",
            ".dentcast/publication-reports/clinical-96/phase-f.log"
          ],
          "scope": "verified publication files prepared for authorized branch delivery"
        }
      ],
      "inputs": [
        {
          "reference": "founder-submitted-clinical-insight-2026-10-20"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "content_id": "insight/insight-96",
          "exit_code": 0,
          "expected_caption": "\u0686\u0646\u062f \u0641\u06cc\u06a9\u0633\u0686\u0631 \u062f\u0631 \u0646\u0627\u062d\u06cc\u0647\u0654 \u0642\u062f\u0627\u0645\u060c \u0645\u062f\u062a \u06a9\u0648\u062a\u0627\u0647\u06cc \u067e\u0633 \u0627\u0632 \u062f\u0631\u0645\u0627\u0646 \u0634\u06a9\u0633\u062a\u0647\u200c\u0627\u0646\u062f\u061b \u0628\u0631\u0631\u0633\u06cc \u0639\u0644\u062a \u0631\u0627 \u0627\u0632 \u06a9\u062c\u0627 \u0634\u0631\u0648\u0639 \u06a9\u0646\u06cc\u0645\u061f",
          "expected_title": "\u0634\u06a9\u0633\u062a \u0686\u0646\u062f \u0641\u06cc\u06a9\u0633\u0686\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u061b \u0639\u0644\u062a \u0686\u0647 \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u062f \u0628\u0627\u0634\u062f\u061f",
          "kind": "phase_f",
          "output_sha256": "80c120ff8a03a4fa8431ebd7a61748e26cf8bc120237ad2cb57a25037a8c4367",
          "recorded_at": "2026-10-20T12:40:16+00:00",
          "summary": "92 passed, 1 warned, 0 failed  \u2014 publish is COMPLETE"
        },
        {
          "content_id": "insight/insight-96",
          "exit_code": 0,
          "expected_caption": "\u0686\u0646\u062f \u0641\u06cc\u06a9\u0633\u0686\u0631 \u062f\u0631 \u0646\u0627\u062d\u06cc\u0647\u0654 \u0642\u062f\u0627\u0645\u060c \u0645\u062f\u062a \u06a9\u0648\u062a\u0627\u0647\u06cc \u067e\u0633 \u0627\u0632 \u062f\u0631\u0645\u0627\u0646 \u0634\u06a9\u0633\u062a\u0647\u200c\u0627\u0646\u062f\u061b \u0628\u0631\u0631\u0633\u06cc \u0639\u0644\u062a \u0631\u0627 \u0627\u0632 \u06a9\u062c\u0627 \u0634\u0631\u0648\u0639 \u06a9\u0646\u06cc\u0645\u061f",
          "expected_title": "\u0634\u06a9\u0633\u062a \u0686\u0646\u062f \u0641\u06cc\u06a9\u0633\u0686\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u061b \u0639\u0644\u062a \u0686\u0647 \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u062f \u0628\u0627\u0634\u062f\u061f",
          "kind": "phase_f",
          "output_sha256": "f327f110372a39e4becaeeddf72ee0038cfc924b9b58e00d828f27ffb8facd16",
          "recorded_at": "2026-10-20T12:41:07+00:00",
          "summary": "92 passed, 1 warned, 0 failed  \u2014 publish is COMPLETE"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "active-rules-and-global-sections-read"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder-text-and-image-no-paper"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "full-brain-parsed-categories-and-live-PILLARS-reviewed"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder-selected-clinical-insight"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sequence-96-announced-and-accepted"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder-original-complete-text"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "style-reviewed-no-changes-needed"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "attached-66726-jpg-and-verified-webp-conversion"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no-paper-attached"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "COMMENTARY-own-clinical-reasoning-no-retrievable-paper"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary-insight-with-public-answer-and-DES-explicitly-requested"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "title-only-Pulse-established-insight-pattern"
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
        "reason": "clinical-not-LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "clinical-not-LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "clinical-not-LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "clinical-not-LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "clinical-not-LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "template-sha256-22ab92613757ca38d2fb1696d3d603077ac75027f0e5ce64494455bbcb303c5f"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/insight-96.html-original-prose-and-WebP-cloned-structure"
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
        "reason": "clinical-not-LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "clinical-not-LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "semantic-decision-occlusion-occlusal-analysis-adjustment-announced"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "two-navigation-capsules-glossary-and-occlusion-pillar"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/index.html-one-new-static-link"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "metadata-audit-all-title-caption-dates-2026-10-20-OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "template-hash-unchanged-22ab92613757ca38d2fb1696d3d603077ac75027f0e5ce64494455bbcb303c5f"
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
        "reason": "not-NoteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "not-episode-or-NoteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "not-Promptologist",
        "status": "skipped"
      },
      {
        "evidence": [
          "dental-implant-only-qualifying-glossary-page-at-five-link-cap-no-edit"
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
        "reason": "not-glossary-publish",
        "status": "skipped"
      },
      {
        "evidence": [
          "two-first-occurrence-inline-links-dental-implant-and-episode60"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "three-ranked-related-capsules-five-total-links"
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
        "reason": "no-paper-attached",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no-paper-attached",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no-paper-attached",
        "status": "skipped"
      },
      {
        "evidence": [
          "plus/faq-corpus.json-three-authored-atomic-non-FAQ-copy-flashcards"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "three-standalone-verdict-first-binary-FAQ-in-corpus-only"
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "des-v3.4-COMMENTARY-15-E-quotes-arithmetic-band-schema-verified-fidelity-not-applicable"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.14",
        "module": "09-challenge.md",
        "reason": "ordinary-public-insight-not-challenge",
        "status": "skipped"
      },
      {
        "evidence": [
          "all-four-approved-tags-reuse-canonical-library-concepts"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain-tail-clinical-96-key-order-parity-confirmed"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "live-taxonomy-and-capsule-match-locked-pillar"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "semantic-placement-occlusion-after-share17-and-implant-prosthetic-after-chairside23-no-series-split-no-third-path"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "candidate-bundles-rejected-gate1-insight-type"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse-title-only-first-bottom-insight94-removed-seven-lines"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "builder-logs-homepage-pillar-flashcards-quiz-img-plus-upboard-and-tags-all-exit0"
        ],
        "id": "C.8",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "content-version-stamper-run-after-builders"
        ],
        "id": "C.7",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "English-mirror-translation-inverse-toggles-noindex-zero-hreflang-chrome-standard-unchanged"
        ],
        "id": "D",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "fa-dc-notify-marker-exactly-once"
        ],
        "id": "E",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "phase_f:f327f110372a39e4becaeeddf72ee0038cfc924b9b58e00d828f27ffb8facd16"
        ],
        "id": "F",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          ".dentcast/publication-reports/clinical-96.md"
        ],
        "id": "G",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/publication-reports/clinical-96.md",
      ".dentcast/publication-reports/clinical-96/01.log",
      ".dentcast/publication-reports/clinical-96/02.log",
      ".dentcast/publication-reports/clinical-96/03.log",
      ".dentcast/publication-reports/clinical-96/04.log",
      ".dentcast/publication-reports/clinical-96/05.log",
      ".dentcast/publication-reports/clinical-96/06.log",
      ".dentcast/publication-reports/clinical-96/07.log",
      ".dentcast/publication-reports/clinical-96/08.log",
      ".dentcast/publication-reports/clinical-96/phase-f.log",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "insight/en/insight-96.html",
      "insight/implant-fixture-fractures.webp",
      "insight/index.html",
      "insight/insight-96.html",
      "pillar/index.html",
      "pillar/occlusion/index.html",
      "pillar/occlusion/structure.json",
      "pillar/structure.json",
      "player.html",
      "plus/content-index.json",
      "plus/des-scores.json",
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
    "note": "Reviewed scoped publication files and actual result evidence"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
