# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-56"
- Status: in_progress
- Next canonical step: "C.8"
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "sharehub",
    "content_id": "sharehub/share-56",
    "context": {
      "approvals": [
        {
          "decision": "\u0627\u0633\u06a9\u0646 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644 \u0641\u0648\u0644\u200c\u0622\u0631\u0686 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u061b \u0648\u0627\u0642\u0639\u0627\u064b \u0686\u0642\u062f\u0631 \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u06cc\u0645 \u0628\u0647 \u0622\u0646 \u0627\u0639\u062a\u0645\u0627\u062f \u06a9\u0646\u06cc\u0645\u061f",
          "evidence": [
            "queue/24-sharehub-fullarch-implant-ios-accuracy/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/24-sharehub-fullarch-implant-ios-accuracy/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 9d087442e589ad8f63fb37b630f1ad26beea90bf60235e4982c9750cad28231a)",
            "queue/24-sharehub-fullarch-implant-ios-accuracy/SHA256SUMS (frozen files, sha256 bca2126ca9968faef8138ce904ab1da74a0800c543ff0cf981f8b3ee52833bf5)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0627\u0633\u06a9\u0646\u0631 \u062f\u0627\u062e\u0644\u200c\u062f\u0647\u0627\u0646\u06cc \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u062f \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627\u06cc \u06cc\u06a9 \u0642\u0648\u0633 \u06a9\u0627\u0645\u0644 \u0631\u0627 \u0628\u0647\u200c\u0627\u0646\u062f\u0627\u0632\u0647\u0654 \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0645\u062a\u062f\u0627\u0648\u0644 \u062b\u0628\u062a \u06a9\u0646\u062f\u061f \u0645\u0631\u0648\u0631 \u0633\u06cc\u0633\u062a\u0645\u0627\u062a\u06cc\u06a9\u06cc \u062f\u0631 JPD \u0646\u0634\u0627\u0646 \u0645\u06cc\u200c\u062f\u0647\u062f \u067e\u0627\u0633\u062e \u0628\u0647 \u0641\u0627\u0635\u0644\u0647\u0654 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627 \u0648 \u0631\u0648\u0634 \u0627\u0633\u06a9\u0646 \u0628\u0633\u062a\u06af\u06cc \u062f\u0627\u0631\u062f.",
          "evidence": [
            "queue/24-sharehub-fullarch-implant-ios-accuracy/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/24-sharehub-fullarch-implant-ios-accuracy/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 9d087442e589ad8f63fb37b630f1ad26beea90bf60235e4982c9750cad28231a)",
            "queue/24-sharehub-fullarch-implant-ios-accuracy/SHA256SUMS (frozen files, sha256 bca2126ca9968faef8138ce904ab1da74a0800c543ff0cf981f8b3ee52833bf5)"
          ],
          "scope": "caption",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "kind": "queue_lane_v1"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "evidence": [
            "queue/24-sharehub-fullarch-implant-ios-accuracy/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 9d087442e589ad8f63fb37b630f1ad26beea90bf60235e4982c9750cad28231a)",
            "queue/24-sharehub-fullarch-implant-ios-accuracy/SHA256SUMS (frozen files, sha256 bca2126ca9968faef8138ce904ab1da74a0800c543ff0cf981f8b3ee52833bf5)"
          ],
          "kind": "queue_approvals_v1",
          "queue_ref": "queue/24-sharehub-fullarch-implant-ios-accuracy",
          "receipt_sha256": "de7e9adf48748bb90bcee77fdd51edcd6f05669e86292ab12523d1ac0efc3b78",
          "sha256sums": "bca2126ca9968faef8138ce904ab1da74a0800c543ff0cf981f8b3ee52833bf5",
          "status_sha256": "9d087442e589ad8f63fb37b630f1ad26beea90bf60235e4982c9750cad28231a"
        },
        {
          "evidence": [
            "queue/24-sharehub-fullarch-implant-ios-accuracy/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 9d087442e589ad8f63fb37b630f1ad26beea90bf60235e4982c9750cad28231a)",
            "queue/24-sharehub-fullarch-implant-ios-accuracy/SHA256SUMS (frozen files, sha256 bca2126ca9968faef8138ce904ab1da74a0800c543ff0cf981f8b3ee52833bf5)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/24-sharehub-fullarch-implant-ios-accuracy/01-\u0645\u062a\u0646.md (frozen; its opening paragraph was approved in preparation)"
        },
        {
          "english": {
            "evidence": [
              "queue/24-sharehub-fullarch-implant-ios-accuracy/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md (frozen)"
            ],
            "path": "sharehub/en/share-56.html",
            "status": "ready"
          },
          "evidence": [
            "generated by tools/queue_ledger.py from the frozen item (receipt de7e9adf48748bb90bcee77fdd51edcd6f05669e86292ab12523d1ac0efc3b78)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "queue/24-sharehub-fullarch-implant-ios-accuracy/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 9d087442e589ad8f63fb37b630f1ad26beea90bf60235e4982c9750cad28231a)",
                "queue/24-sharehub-fullarch-implant-ios-accuracy/SHA256SUMS (frozen files, sha256 bca2126ca9968faef8138ce904ab1da74a0800c543ff0cf981f8b3ee52833bf5)",
                "mechanical defaults: {\"field\": \"backlinks_47\", \"rule\": \"11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md 4.7 has no frozen back-link with its link text \u2014 none is added\", \"value\": []}; {\"field\": \"pathway\", \"rule\": \"mechanical pathway rule\", \"value\": null}; {\"rule\": \"hashtag not in the library and not ordered minted: dropped\", \"tags\": [\"#Share_Hub\"]}; {\"field\": \"author\", \"rule\": \"the author/source of the latest sharehub brain entry\", \"value\": {\"name\": \"\u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646\", \"source\": \"https://dentcast.org\"}}"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/24-sharehub-fullarch-implant-ios-accuracy/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md; brain entry /sharehub/share-56.html"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/24-sharehub-fullarch-implant-ios-accuracy/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md verbatim -> sharehub/en/share-56.html"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/24-sharehub-fullarch-implant-ios-accuracy/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md list; hashtag_ref.py --sync/--check passed"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/24-sharehub-fullarch-implant-ios-accuracy/11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md; applied ['\u0627\u0633\u06a9\u0646\u0631 \u062f\u0627\u062e\u0644\\u200c\u062f\u0647\u0627\u0646\u06cc', '\u0627\u0633\u06a9\u0646\\u200c\u0628\u0627\u062f\u06cc\\u200c\u0647\u0627']; 4.7 []; 4.9 [['/sharehub/share-2.html', '\u0628\u0647\u06cc\u0646\u0647\\u200c\u0633\u0627\u0632\u06cc \u062f\u0642\u062a \u0627\u0633\u06a9\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a'], ['/episodes/episode-144-2.html', '\u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u062f\u0631 \u0627\u0633\u06a9\u0646 \u0641\u0648\u0644 \u0622\u0631\u0686'], ['/episodes/episode-133.html', '\u0627\u0641\u0632\u0627\u06cc\u0634 \u062f\u0642\u062a \u0627\u0633\u06a9\u0646 \u0628\u0627 \u0627\u0633\u06a9\u0646\\u200c\u0628\u0627\u062f\u06cc\\u200c\u0647\u0627']]"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "pathway_place.py mechanical rule: [{'pathway': 'implant-prosthetic', 'after': 'insight/insight-112', 'why': 'STRONG'}, {'pathway': 'fixed-pros', 'after': 'insight/insight-103', 'why': 'STRONG'}]"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/24-sharehub-fullarch-implant-ios-accuracy/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q5; seven-line rotation {'added': '<a href=\"/sharehub/share-56.html\">\u0627\u0633\u06a9\u0646 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644 \u0641\u0648\u0644\\u200c\u0622\u0631\u0686 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u061b \u0648\u0627\u0642\u0639\u0627\u064b \u0686\u0642\u062f\u0631 \u0645\u06cc\\u200c\u062a\u0648\u0627\u0646\u06cc\u0645 \u0628\u0647 \u0622\u0646 \u0627\u0639\u062a\u0645\u0627\u062f \u06a9\u0646\u06cc\u0645\u061f</a>', 'dropped': '<li>\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/insight/insight-109.html\">\u0642\u0627\u0644\u0628\\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0647\u062f\u0641</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f</li>'}"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/24-sharehub-fullarch-implant-ios-accuracy/05-DES-Fidelity installed by queue_install_des.py (record d009c4d210ef1e7f8d604928c79007abc3e6e89fcbf6904027551ded7103cf14)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/24-sharehub-fullarch-implant-ios-accuracy/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md pillar/subtopic (brain entry written by queue_apply)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/24-sharehub-fullarch-implant-ios-accuracy/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q4.9: not a Challenge (the queue lane refuses Challenge items)"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            }
          ]
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
          "queue-route.md read; tools/queue_publish.py run"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue_manifest check complete; dry run clean (24-sharehub-fullarch-implant-ios-accuracy)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue_apply receipt sha256 58c4751fa4166625a8aeb92e36d651181c4808e445abee30ff8690a7a7bb3438"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.8 ['\u0627\u0633\u06a9\u0646\u0631 \u062f\u0627\u062e\u0644\\u200c\u062f\u0647\u0627\u0646\u06cc', '\u0627\u0633\u06a9\u0646\\u200c\u0628\u0627\u062f\u06cc\\u200c\u0647\u0627']; 4.7 []; 4.9 [['/sharehub/share-2.html', '\u0628\u0647\u06cc\u0646\u0647\\u200c\u0633\u0627\u0632\u06cc \u062f\u0642\u062a \u0627\u0633\u06a9\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a'], ['/episodes/episode-144-2.html', '\u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u062f\u0631 \u0627\u0633\u06a9\u0646 \u0641\u0648\u0644 \u0622\u0631\u0686'], ['/episodes/episode-133.html', '\u0627\u0641\u0632\u0627\u06cc\u0634 \u062f\u0642\u062a \u0627\u0633\u06a9\u0646 \u0628\u0627 \u0627\u0633\u06a9\u0646\\u200c\u0628\u0627\u062f\u06cc\\u200c\u0647\u0627']]"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways [{'pathway': 'implant-prosthetic', 'after': 'insight/insight-112', 'why': 'STRONG'}, {'pathway': 'fixed-pros', 'after': 'insight/insight-103', 'why': 'STRONG'}]"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "single delivery before the Action"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/cabinet-enrichment/results.jsonl",
      ".dentcast/queue-frozen-des.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast_cabinet_enrichment.json",
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
      "sharehub/en/share-56.html",
      "sharehub/index.html",
      "sharehub/share-56.html",
      "sharehub/share56-fig1.webp",
      "sharehub/share56-fig2.webp",
      "sharehub/share56-fig3.webp",
      "sharehub/share56-fig4.webp",
      "sharehub/share56-fig5.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: .dentcast/cabinet-enrichment/results.jsonl, .dentcast/queue-frozen-des.json, dentcast-brain.json, dentcast-hashtag-reference.json, dentcast_cabinet_enrichment.json, dentcast_cabinet_full_catalog.json, index.html, plus/assistant-tags.json, plus/cabinet-papers.json, plus/cabinet-search.json, plus/content-index.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, sharehub/en/share-56.html, sharehub/index.html, sharehub/share-56.html, sharehub/share56-fig1.webp, sharehub/share56-fig2.webp, sharehub/share56-fig3.webp, sharehub/share56-fig4.webp, sharehub/share56-fig5.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
