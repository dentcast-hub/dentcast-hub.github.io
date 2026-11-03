# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-45"
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
    "content_id": "sharehub/share-45",
    "context": {
      "approvals": [
        {
          "decision": "\u0627\u062e\u062a\u0644\u0627\u0641 \u0627\u0631\u062a\u0641\u0627\u0639 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627\u06cc \u0645\u062c\u0627\u0648\u0631 \u0648 \u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646: \u0631\u0648\u06a9\u0634\u200c\u0647\u0627 \u0631\u0627 \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u06a9\u0646\u06cc\u0645 \u06cc\u0627 \u0645\u0633\u062a\u0642\u0644 \u0628\u0633\u0627\u0632\u06cc\u0645\u061f",
          "evidence": [
            "queue/07-sharehub-adjacent-implant-platform-splinting/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/07-sharehub-adjacent-implant-platform-splinting/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 22930b7cf64fe08b6fa7bde2b7d3048a0832c6f2c3466d84852c65c912cff3b2)",
            "queue/07-sharehub-adjacent-implant-platform-splinting/SHA256SUMS (frozen files, sha256 94b6c20a57e7e9954c51dc3544a2903963b8ac769b3bd3ee5ae56060e1f2a203)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0647\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0641\u0627\u0635\u0644\u0647 \u0627\u0641\u0642\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627 \u062f\u0642\u062a \u06a9\u0631\u062f\u0647\u200c\u0627\u06cc\u0645 \u062a\u0648\u06cc \u0627\u06cc\u0646 \u0645\u0642\u0627\u0644\u0647 \u0628\u0647 \u0627\u062b\u0631 \u0627 \u0627\u062e\u062a\u0644\u0627\u0641 \u0639\u0645\u0648\u062f\u06cc \u0648 \u062a\u0627\u062b\u06cc\u0631\u0634 \u0628\u0631 \u0628\u0627\u0641\u062a \u0627\u0633\u062a\u062e\u0648\u0627\u0646\u06cc \u0645\u06cc\u200c\u067e\u0631\u062f\u0627\u0632\u06cc\u0645",
          "evidence": [
            "queue/07-sharehub-adjacent-implant-platform-splinting/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/07-sharehub-adjacent-implant-platform-splinting/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 22930b7cf64fe08b6fa7bde2b7d3048a0832c6f2c3466d84852c65c912cff3b2)",
            "queue/07-sharehub-adjacent-implant-platform-splinting/SHA256SUMS (frozen files, sha256 94b6c20a57e7e9954c51dc3544a2903963b8ac769b3bd3ee5ae56060e1f2a203)"
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
            "queue/07-sharehub-adjacent-implant-platform-splinting/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 22930b7cf64fe08b6fa7bde2b7d3048a0832c6f2c3466d84852c65c912cff3b2)",
            "queue/07-sharehub-adjacent-implant-platform-splinting/SHA256SUMS (frozen files, sha256 94b6c20a57e7e9954c51dc3544a2903963b8ac769b3bd3ee5ae56060e1f2a203)"
          ],
          "kind": "queue_approvals_v1",
          "queue_ref": "queue/07-sharehub-adjacent-implant-platform-splinting",
          "receipt_sha256": "934ead79ee206fbd4b4f49032312e9fc59b118a0cc99bf5ec0de57a2942b6be6",
          "sha256sums": "94b6c20a57e7e9954c51dc3544a2903963b8ac769b3bd3ee5ae56060e1f2a203",
          "status_sha256": "22930b7cf64fe08b6fa7bde2b7d3048a0832c6f2c3466d84852c65c912cff3b2"
        },
        {
          "evidence": [
            "queue/07-sharehub-adjacent-implant-platform-splinting/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 22930b7cf64fe08b6fa7bde2b7d3048a0832c6f2c3466d84852c65c912cff3b2)",
            "queue/07-sharehub-adjacent-implant-platform-splinting/SHA256SUMS (frozen files, sha256 94b6c20a57e7e9954c51dc3544a2903963b8ac769b3bd3ee5ae56060e1f2a203)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/07-sharehub-adjacent-implant-platform-splinting/01-\u0645\u062a\u0646.md (frozen; its opening paragraph was approved in preparation)"
        },
        {
          "english": {
            "evidence": [
              "queue/07-sharehub-adjacent-implant-platform-splinting/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md (frozen)"
            ],
            "path": "sharehub/en/share-45.html",
            "status": "ready"
          },
          "evidence": [
            "generated by tools/queue_ledger.py from the frozen item (receipt 934ead79ee206fbd4b4f49032312e9fc59b118a0cc99bf5ec0de57a2942b6be6)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "queue/07-sharehub-adjacent-implant-platform-splinting/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 22930b7cf64fe08b6fa7bde2b7d3048a0832c6f2c3466d84852c65c912cff3b2)",
                "queue/07-sharehub-adjacent-implant-platform-splinting/SHA256SUMS (frozen files, sha256 94b6c20a57e7e9954c51dc3544a2903963b8ac769b3bd3ee5ae56060e1f2a203)",
                "mechanical defaults: {\"field\": \"catalog\", \"rule\": \"04-\u0645\u0646\u0628\u0639/\u0645\u0646\u0627\u0628\u0639.md holds no frozen catalog entry\", \"value\": [{\"skip\": \"catalog Part 2 fields are not frozen in the item; nothing is written to the catalog (a follow-up for the founder, never a publish-day guess)\"}]}; {\"field\": \"backlinks_47\", \"rule\": \"11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md 4.7 has no frozen back-link with its link text \u2014 none is added\", \"value\": []}; {\"field\": \"explore_49\", \"rule\": \"no frozen 4.9 selection \u2014 nothing is added (queue-route: 4.9 only a frozen choice)\", \"value\": []}; {\"field\": \"pathway\", \"rule\": \"mechanical pathway rule\", \"value\": null}; {\"field\": \"author\", \"rule\": \"the author/source of the latest sharehub brain entry\", \"value\": {\"name\": \"\u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646\", \"source\": \"https://dentcast.org\"}}"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/07-sharehub-adjacent-implant-platform-splinting/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md; brain entry /sharehub/share-45.html"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/07-sharehub-adjacent-implant-platform-splinting/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md verbatim -> sharehub/en/share-45.html"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/07-sharehub-adjacent-implant-platform-splinting/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md list; hashtag_ref.py --sync/--check passed"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/07-sharehub-adjacent-implant-platform-splinting/11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md; applied ['\u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u06a9\u0631\u062f\u0646 \u0631\u0648\u06a9\u0634\\u200c\u0647\u0627', '\u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0645\u0627\u0631\u0698\u06cc\u0646\u0627\u0644', '\u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644', '\u0627\u0628\u0627\u062a\u0645\u0646\u062a']; 4.7 []; 4.9 []"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "pathway_place.py mechanical rule: [{'pathway': 'implant-surgical', 'after': 'sharehub/share-28', 'why': 'STRONG'}, {'pathway': 'implant-prosthetic', 'after': 'sharehub/share-28', 'why': 'STRONG'}]"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/07-sharehub-adjacent-implant-platform-splinting/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q5; seven-line rotation {'added': '<a href=\"/sharehub/share-45.html\">\u0627\u062e\u062a\u0644\u0627\u0641 \u0627\u0631\u062a\u0641\u0627\u0639 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\\u200c\u0647\u0627\u06cc \u0645\u062c\u0627\u0648\u0631 \u0648 \u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646: \u0631\u0648\u06a9\u0634\\u200c\u0647\u0627 \u0631\u0627 \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u06a9\u0646\u06cc\u0645 \u06cc\u0627 \u0645\u0633\u062a\u0642\u0644 \u0628\u0633\u0627\u0632\u06cc\u0645\u061f</a>', 'dropped': '<li><a href=\"/insight/insight-99.html\">\u062a\u0631\u0627\u0634 \u06a9\u0645\u062a\u0631 \u0647\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0639\u0646\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u0628\u0647\u062a\u0631 \u0646\u06cc\u0633\u062a!</a></li>'}"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/07-sharehub-adjacent-implant-platform-splinting/05-DES-Fidelity installed by queue_install_des.py (record 62e5fac5de895d9a9d45b57017d1bc1d0b57c39befbcd569b9b02f9945792b87)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/07-sharehub-adjacent-implant-platform-splinting/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md pillar/subtopic (brain entry written by queue_apply)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/07-sharehub-adjacent-implant-platform-splinting/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q4.9: not a Challenge (the queue lane refuses Challenge items)"
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
          "queue_manifest check complete; dry run clean (07-sharehub-adjacent-implant-platform-splinting)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue_apply receipt sha256 f5c98850b506c3c80dff92ec5bf536df9ef2d4ac9085b4b29966dd3628221d26"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.8 ['\u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u06a9\u0631\u062f\u0646 \u0631\u0648\u06a9\u0634\\u200c\u0647\u0627', '\u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0645\u0627\u0631\u0698\u06cc\u0646\u0627\u0644', '\u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644', '\u0627\u0628\u0627\u062a\u0645\u0646\u062a']; 4.7 []; 4.9 []"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways [{'pathway': 'implant-surgical', 'after': 'sharehub/share-28', 'why': 'STRONG'}, {'pathway': 'implant-prosthetic', 'after': 'sharehub/share-28', 'why': 'STRONG'}]"
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
      ".dentcast/des-fidelity-plans/sharehub/share-45.json",
      ".dentcast/des-source-markers.json",
      ".dentcast/queue-frozen-des.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast_cabinet_full_catalog.json",
      "index.html",
      "plus/assistant-tags.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-45.html",
      "sharehub/index.html",
      "sharehub/share-45.html",
      "sharehub/share45-fig1.webp",
      "sharehub/share45-fig2.webp",
      "sharehub/share45-fig3.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: .dentcast/des-fidelity-plans/sharehub/share-45.json, .dentcast/des-source-markers.json, .dentcast/queue-frozen-des.json, dentcast-brain.json, dentcast-hashtag-reference.json, dentcast_cabinet_full_catalog.json, index.html, plus/assistant-tags.json, plus/content-index.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, sharehub/en/share-45.html, sharehub/index.html, sharehub/share-45.html, sharehub/share45-fig1.webp, sharehub/share45-fig2.webp, sharehub/share45-fig3.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
