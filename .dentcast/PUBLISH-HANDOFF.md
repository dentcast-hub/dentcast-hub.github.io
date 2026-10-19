# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-36"
- Status: blocked
- Next canonical step: "C.2.4"
- Blocker: "Founder choice needed for pillar/subtopic, metadata tags/keywords, and PubMed source credit when DOI is unverified. Scientific evaluations are complete; page publishing steps remain pending."

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": "Founder choice needed for pillar/subtopic, metadata tags/keywords, and PubMed source credit when DOI is unverified. Scientific evaluations are complete; page publishing steps remain pending.",
    "category": "sharehub",
    "content_id": "sharehub/share-36",
    "context": {
      "approvals": [
        {
          "decision": "Preserve founder text without rewriting",
          "evidence": [
            "Founder publication instruction, 2026-10-19"
          ],
          "scope": "final article text",
          "status": "confirmed"
        },
        {
          "decision": "Founder accepted proposed dual DES and full-text two-checker evaluation",
          "evidence": [
            "Founder instruction \u0627\u0646\u062c\u0627\u0645 \u0628\u062f\u0647 after evaluation proposal, 2026-10-19"
          ],
          "scope": "separate source DES and fresh independent Fidelity",
          "status": "confirmed"
        },
        {
          "decision": "No merge without explicit further founder confirmation",
          "evidence": [
            "Founder original publication instruction, 2026-10-19"
          ],
          "scope": "merge",
          "status": "rejected"
        }
      ],
      "decisions": [
        {
          "evidence": "ShareHub sequence 1 through 35; next 36 verified in brain and disk",
          "kind": "intake_identity_bound"
        },
        {
          "fidelity": {
            "altered": 0,
            "author_view": 30,
            "matches": 14,
            "not_a_claim": 7,
            "not_assessable": 0,
            "not_in_source": 2,
            "reversed": 0
          },
          "kind": "scientific_result",
          "level": "HIGH",
          "no_text_changes": true,
          "review_packet": "libfile_e08bb9477b748191aa4b1e217918edd5",
          "score": 100,
          "self_des": "19/E validated and reused unchanged",
          "source_des": "16/E COMMENTARY FULL_TEXT separately evaluated"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "original_personal_des": "libfile_d7614837eef481919a67ac131713b176",
          "rejected_preview": "libfile_7561a3d99b008191b7d769a934e9831b",
          "source_pdf": "libfile_91ee825c88208191bb14a5eb43b1e6ed",
          "validated_review_packet": "libfile_e08bb9477b748191aa4b1e217918edd5"
        }
      ],
      "pending_questions": [
        {
          "options": [
            "occlusion/occlusal-scheme-guidance",
            "treatment-planning/comprehensive-diagnosis"
          ],
          "recommendation": "occlusion/occlusal-scheme-guidance",
          "scope": "taxonomy"
        },
        {
          "proposed_keywords": [
            "\u0628\u0627\u0632\u0633\u0627\u0632\u06cc \u0627\u06a9\u0644\u0648\u0698\u0646",
            "\u0627\u06cc\u0646\u0633\u0627\u06cc\u0632\u0627\u0644 \u0627\u062c",
            "\u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0645\u0627\u06af\u0632\u06cc\u0644\u0627",
            "\u067e\u0631\u0648\u0648\u06cc\u0698\u0646\u0627\u0644",
            "Facially Generated Treatment Planning",
            "Spear"
          ],
          "proposed_tags": [
            "#Share_Hub",
            "#Curated_Content",
            "#\u0627\u06a9\u0644\u0648\u0698\u0646",
            "#\u0628\u0627\u0632\u0633\u0627\u0632\u06cc_\u06a9\u0627\u0645\u0644_\u062f\u0647\u0627\u0646",
            "#\u0637\u0631\u062d_\u062f\u0631\u0645\u0627\u0646"
          ],
          "scope": "tags and keywords"
        },
        {
          "proposal": "Use verified PubMed PMID 10650364 for Frank Spear hyperlink; DOI search did not resolve a verified DOI",
          "scope": "source credit"
        }
      ],
      "unrelated_changes": [],
      "validation": [
        {
          "disagreement_only_third_units": 7,
          "executed_model_ids": "UNVERIFIED (not exposed in child runtime)",
          "full_checker_runs": 2,
          "input_sha256": "5e600ecfb0cd60fdff161d6a9042c6b844bb6e505c89b596366573c7b8196e2d",
          "price": "UNVERIFIED",
          "requested_checker": {
            "model": "gpt-6-luna",
            "reasoning": "medium"
          },
          "requested_strong_reviewer": {
            "model": "gpt-6-astra",
            "reasoning": "medium"
          },
          "segmentation": "Official split_page with explicit reference-heading boundary; title-in-prose premature-stop heuristic excluded. assign/build/vote official functions unchanged. Only external source routed; self-commentary is a separate DES record.",
          "source_sha256": "291b1db0b0d015d2aebd1b16a3a1d89ddc492da7cb4646eea75a5b904839466c",
          "spec": "DES/Fidelity 3.4",
          "strong_adjudication_units": [
            "u3",
            "u24"
          ]
        },
        {
          "page_checks": "Draft only. English, taxonomy, enrichments, paper filing, builders, learning layer and Phase F are NOT complete. Do not report published.",
          "scientific_checks": "PASS: both DES canonical keys, arithmetic, band, all quote substrings; Fidelity 53 exact input quotes, whole source sentences, F4 counts, full-text basis, conclusion echo; official vote_source/main settled 7 ties and 2 strong adjudications"
        }
      ]
    },
    "external_actions": [],
    "status": "blocked",
    "steps": [
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
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
        "reason": "ShareHub category; LiteCast branch inapplicable",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub uses brain, not LiteCast source",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub specialist linking applies",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub same-category clone applies",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub ordinary workflow applies",
        "status": "skipped"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
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
        "reason": "ShareHub, not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub, not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Founder choice needed for pillar/subtopic, metadata tags/keywords, and PubMed source credit when DOI is unverified. Scientific evaluations are complete; page publishing steps remain pending.",
        "status": "blocked"
      },
      {
        "evidence": [],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.7-b",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "pending"
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
      "dentcast-brain.json",
      "sharehub/share-36.html",
      "sharehub/en/share-36.html",
      "sharehub/index.html",
      "plus/des-scores.json",
      "plus/faq-corpus.json",
      "index.html"
    ]
  },
  "reconciliation": {
    "note": "Reviewed actual work and scoped publication evidence; no unrelated edits"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
