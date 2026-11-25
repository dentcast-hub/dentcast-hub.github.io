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
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": []
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
    "note": "Index-only refresh after staging delivery paths: sharehub/share-60.html, sharehub/index.html, dentcast_cabinet_full_catalog.json, .dentcast/cabinet-enrichment/results.jsonl, plus/des-scores.json, .dentcast/relay/HANDOFF-share-60.md"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
