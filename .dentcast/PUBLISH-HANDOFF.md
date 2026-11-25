# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-60"
- Status: in_progress
- Next canonical step: "C.4.13"
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "sharehub",
    "content_id": "sharehub/share-60",
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
          "from_step": "rules",
          "kind": "dependency_invalidation_v1",
          "reason": "The founder-requested DES/Fidelity simplification changes .dentcast/workflows/modules/08-des-fidelity.md; it changes no page text, no DES score and no stored record, only the optional audit and re-check loop",
          "superseded": {
            "approvals": [],
            "delivery": [],
            "inputs": [],
            "steps": [
              {
                "evidence": [
                  "read complete: workflows/README.md, modules 01-02, global/README with all selected pages, agent-parity, publish-checkpoints, handoff-tool"
                ],
                "id": "rules",
                "module": "01-hard-rules.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "route: text + attached paper => normal publish plus 4.10 Parts 1-3"
                ],
                "id": "0",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "brain parsed once: 641 entries, sharehub=59, latest share-59 key set; live PILLARS read"
                ],
                "id": "A",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "type sharehub (single-paper reading; dentai/photocast closed)"
                ],
                "id": "B.1",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "next number 60 => sharehub/share-60"
                ],
                "id": "B.2",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "founder text supplied in session; title copied verbatim"
                ],
                "id": "B.3",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "de-AI pass: three style-only rewrites applied and recorded"
                ],
                "id": "B.3.5",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "no media field in the sharehub schema and none supplied"
                ],
                "id": "B.4",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "paper attached: Klein et al., DOI 10.1111/jerd.13351, FULL_TEXT text extracted from the PDF"
                ],
                "id": "B.4.7",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "DES basket 2 (research with a determinate source), FULL_TEXT"
                ],
                "id": "B.4.8",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "ordinary post, not a challenge"
                ],
                "id": "B.4.9",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Pulse drafted on the sharehub precedent (title as link text)"
                ],
                "id": "B.5",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "LiteCast branch inactive (sharehub)"
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
                "reason": "LiteCast-only step",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.2",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast-only step",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.3",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast-only step",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.4",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast-only step",
                "status": "skipped"
              },
              {
                "evidence": [
                  "template locked = sharehub/share-59.html (byte-unchanged)"
                ],
                "id": "C.1",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "page cloned from share-59 (structure only), values swapped, GA/preconnects intact, presentation layer built, lint clean"
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
                "reason": "LiteCast-only step",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast-only step",
                "status": "skipped"
              },
              {
                "evidence": [
                  "pillar esthetic / veneers-laminates"
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "two capsules: \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + /pillar/esthetic/"
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "sharehub/index.html top list item added"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "before/after meta table printed, all rows OK"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "git diff --quiet -- sharehub/share-59.html empty"
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
                "reason": "NoteCast-only step",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "NoteCast-only credit step",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Promptologist-only step",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Drive filing done by the founder; drive_id 1t4GxA8iJsDsr8XDdBXs0K8KnmJr-ReF_, no write performed"
                ],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "catalog P2967 appended (2132 papers), enrichment row present, coverage green"
                ],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "first-author credit Patrick Klein -> DOI on the page"
                ],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "started"
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
            "validation": []
          }
        }
      ],
      "delivery": [],
      "inputs": [],
      "pending_questions": [
        {
          "answered": false,
          "message": "M3b",
          "question": "u9: \u00ab\u0647\u0645\u0686\u0646\u06cc\u0646 \u0645\u0637\u0627\u0644\u0639\u0627\u062a\u06cc \u06a9\u0647 \u0631\u0636\u0627\u06cc\u062a \u0628\u06cc\u0645\u0627\u0631\u0627\u0646 \u0631\u0627 \u0628\u0631\u0631\u0633\u06cc \u06a9\u0631\u062f\u0647 \u0628\u0648\u062f\u0646\u062f\u060c \u0639\u0645\u0648\u0645\u0627\u064b \u0627\u0641\u0632\u0627\u06cc\u0634 \u0631\u0636\u0627\u06cc\u062a \u067e\u0633 \u0627\u0632 \u062f\u0631\u0645\u0627\u0646 \u0631\u0627 \u06af\u0632\u0627\u0631\u0634 \u06a9\u0631\u062f\u0647\u200c\u0627\u0646\u062f.\u00bb \u0642\u0627\u0637\u0639\u200c\u062a\u0631 \u0627\u0632 \u0645\u0646\u0628\u0639 (could generally note)\u061b \u0627\u0635\u0644\u0627\u062d \u06a9\u0646 / \u062e\u0648\u062f\u0645 \u0645\u06cc\u200c\u0646\u0648\u06cc\u0633\u0645 / \u0647\u0645\u06cc\u0646 \u0628\u0645\u0627\u0646\u062f",
          "step": "C.4.13"
        },
        {
          "answered": false,
          "message": "M3b",
          "question": "u46: \u00ab\u2026\u0627\u0633\u062a\u0641\u0627\u062f\u0647 \u0627\u0632 \u06af\u0627\u0631\u062f \u0627\u06a9\u0644\u0648\u0632\u0627\u0644 \u067e\u0633 \u0627\u0632 \u0633\u0645\u0627\u0646 \u06a9\u0631\u062f\u0646 \u0644\u0645\u06cc\u0646\u062a \u062f\u0631 \u0628\u06cc\u0645\u0627\u0631\u0627\u0646 \u062f\u0627\u0631\u0627\u06cc \u0639\u0627\u062f\u062a\u200c\u0647\u0627\u06cc \u067e\u0627\u0631\u0627\u0641\u0627\u0646\u06a9\u0634\u0646\u060c \u0627\u0642\u062f\u0627\u0645 \u0645\u0646\u0637\u0642\u06cc\u200c\u0627\u06cc \u0627\u0633\u062a.\u00bb \u0642\u0627\u0637\u0639\u200c\u062a\u0631 \u0627\u0632 \u0645\u0646\u0628\u0639 (might be beneficial)\u061b \u0627\u0635\u0644\u0627\u062d \u06a9\u0646 / \u062e\u0648\u062f\u0645 \u0645\u06cc\u200c\u0646\u0648\u06cc\u0633\u0645 / \u0647\u0645\u06cc\u0646 \u0628\u0645\u0627\u0646\u062f",
          "step": "C.4.13"
        }
      ],
      "unrelated_changes": [],
      "validation": [
        {
          "kind": "fidelity",
          "result": "sweeper+judge in two isolated tool-less claude -p processes (model claude-fable-5-2, spec sha256 of .dentcast/des-v3.7-knowledge.md as system prompt); judge agreed on all 47 units; --accept exit 0; 33/35 MATCHES, 2 ALTERED (u9,u46 HEDGE_REMOVED), score 97 HIGH; source_conclusion pinned to the paper's last Conclusion sentence; source_text recovered from .dentcast/relay/01-source-des.md",
          "step": "C.4.13"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read complete: workflows/README.md, modules 01-02, global/README with all selected pages, agent-parity, publish-checkpoints, handoff-tool; module 08 re-read after the founder-requested simplification"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "route: text + attached paper => normal publish plus 4.10 Parts 1-3"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 641 entries, sharehub=59, latest share-59 key set; live PILLARS read"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type sharehub (single-paper reading; dentai/photocast closed)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number 60 => sharehub/share-60"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder text supplied in session; title copied verbatim"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: three style-only rewrites applied and recorded"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no media field in the sharehub schema and none supplied"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "paper attached: Klein et al., DOI 10.1111/jerd.13351, FULL_TEXT"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES basket 2 (research with a determinate source), FULL_TEXT"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary post, not a challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse drafted on the sharehub precedent (title as link text)"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "LiteCast branch inactive (sharehub)"
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
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [
          "template locked = sharehub/share-59.html (byte-unchanged)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "page cloned from share-59 (structure only), values swapped, presentation layer built, presentation_lint clean"
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
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar esthetic / veneers-laminates"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "two capsules: \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + /pillar/esthetic/"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/index.html top list item added"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "before/after meta table printed, all rows OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- sharehub/share-59.html empty"
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
        "reason": "NoteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast-only credit step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist-only step",
        "status": "skipped"
      },
      {
        "evidence": [
          "Drive filing done by the founder; drive_id 1t4GxA8iJsDsr8XDdBXs0K8KnmJr-ReF_, no write performed"
        ],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "catalog P2967 appended (2132 papers), enrichment row present, coverage green"
        ],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "first-author credit Patrick Klein -> DOI on the page"
        ],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "started"
      }
    ],
    "target_paths": [
      ".dentcast/cabinet-enrichment/results.jsonl",
      ".dentcast/relay/HANDOFF-share-60.md",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast_cabinet_enrichment.json",
      "dentcast_cabinet_full_catalog.enriched.json",
      "dentcast_cabinet_full_catalog.json",
      "index.html",
      "plus/assistant-tags.json",
      "plus/cabinet-papers.json",
      "plus/cabinet-search.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-60.html",
      "sharehub/index.html",
      "sharehub/share-60.html"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
