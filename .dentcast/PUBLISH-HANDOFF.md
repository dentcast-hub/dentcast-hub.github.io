# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-116"
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
    "category": "clinical",
    "content_id": "insight/insight-116",
    "context": {
      "approvals": [
        {
          "decision": "\u0634\u06a9\u0633\u062a \u0645\u06a9\u0631\u0631 \u06a9\u0627\u0646\u06a9\u062a\u0648\u0631 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u06cc \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u062f\u0631 \u0628\u06cc\u0645\u0627\u0631 \u067e\u0627\u0631\u0627\u0641\u0627\u0646\u06a9\u0634\u0646\u0627\u0644",
          "evidence": [
            "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 74a715a4870fd5083349e5e6e5c1d9e7671981402f6abd0d6c6b1e30e5a6d07a)",
            "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/SHA256SUMS (frozen files, sha256 81e4178e78fda065c3a85a3dd59dbd4f88a529d21e70e987f587f0af0bbb6cb5)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u06cc \u0645\u062a\u0635\u0644 \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u062f\u0631 \u0628\u06cc\u0645\u0627\u0631 \u067e\u0627\u0631\u0627\u0641\u0627\u0646\u06a9\u0634\u0646\u0627\u0644 \u062f\u0648 \u0628\u0627\u0631 \u0627\u0632 \u06a9\u0627\u0646\u06a9\u062a\u0648\u0631 \u0634\u06a9\u0633\u062a\u0646\u062f. \u0645\u0633\u0626\u0644\u0647 \u0646\u06cc\u0631\u0648\u0633\u062a\u061b \u062a\u0646\u0638\u06cc\u0645 \u0627\u06a9\u0644\u0648\u0698\u0646\u060c \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u062c\u062f\u0627 \u0627\u0632 \u0647\u0645\u060c \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627\u06cc 3Y \u0648 \u06a9\u0646\u062a\u0631\u0644 \u0646\u06cc\u0631\u0648 \u0628\u0627\u06cc\u062f \u0628\u0627 \u0647\u0645 \u062f\u06cc\u062f\u0647 \u0634\u0648\u0646\u062f.",
          "evidence": [
            "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 74a715a4870fd5083349e5e6e5c1d9e7671981402f6abd0d6c6b1e30e5a6d07a)",
            "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/SHA256SUMS (frozen files, sha256 81e4178e78fda065c3a85a3dd59dbd4f88a529d21e70e987f587f0af0bbb6cb5)"
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
            "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 74a715a4870fd5083349e5e6e5c1d9e7671981402f6abd0d6c6b1e30e5a6d07a)",
            "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/SHA256SUMS (frozen files, sha256 81e4178e78fda065c3a85a3dd59dbd4f88a529d21e70e987f587f0af0bbb6cb5)"
          ],
          "kind": "queue_approvals_v1",
          "queue_ref": "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction",
          "receipt_sha256": "e9942c53902a1adf40e37a0e30370eac1056a907b1fc1e0b8a02261579e457dc",
          "sha256sums": "81e4178e78fda065c3a85a3dd59dbd4f88a529d21e70e987f587f0af0bbb6cb5",
          "status_sha256": "74a715a4870fd5083349e5e6e5c1d9e7671981402f6abd0d6c6b1e30e5a6d07a"
        },
        {
          "evidence": [
            "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 74a715a4870fd5083349e5e6e5c1d9e7671981402f6abd0d6c6b1e30e5a6d07a)",
            "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/SHA256SUMS (frozen files, sha256 81e4178e78fda065c3a85a3dd59dbd4f88a529d21e70e987f587f0af0bbb6cb5)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/01-\u0645\u062a\u0646.md (frozen; its opening paragraph was approved in preparation)"
        },
        {
          "english": {
            "evidence": [
              "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md (frozen)"
            ],
            "path": "insight/en/insight-116.html",
            "status": "ready"
          },
          "evidence": [
            "generated by tools/queue_ledger.py from the frozen item (receipt e9942c53902a1adf40e37a0e30370eac1056a907b1fc1e0b8a02261579e457dc)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 74a715a4870fd5083349e5e6e5c1d9e7671981402f6abd0d6c6b1e30e5a6d07a)",
                "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/SHA256SUMS (frozen files, sha256 81e4178e78fda065c3a85a3dd59dbd4f88a529d21e70e987f587f0af0bbb6cb5)",
                "mechanical defaults: {\"field\": \"backlinks_47\", \"rule\": \"11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md 4.7 has no frozen back-link with its link text \u2014 none is added\", \"value\": []}; {\"field\": \"pathway\", \"rule\": \"mechanical pathway rule\", \"value\": null}; {\"rule\": \"4.8 approved link phrase not in body\", \"skipped\": [\"\u0646\u0627\u06cc\u062a \u06af\u0627\u0631\u062f (\u0644\u0646\u06af\u0631 \u0631\u0648\u06cc \u06a9\u0644 \u0648\u0627\u0698\u0647\u0654 \u00ab\u0646\u0627\u06cc\u062a \u06af\u0627\u0631\u062f\u06cc\u00bb)\"]}"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md; brain entry None"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md verbatim -> insight/en/insight-116.html"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md list; hashtag_ref.py --sync/--check passed"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md; applied ['\u0631\u0648\u06a9\u0634\\u200c\u0647\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u06cc', '\u06af\u0631\u0648\u067e \u0641\u0627\u0646\u06a9\u0634\u0646', '\u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627', '\u06af\u0627\u06cc\u062f \u0628\u0647 \u06a9\u0627\u0646\u06cc\u0646']; 4.7 []; 4.9 [['/sharehub/share-17.html', '\u0634\u06a9\u0633\u062a \u0628\u0631\u06cc\u062c \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u062f\u0631 \u0628\u06cc\u0645\u0627\u0631 \u0628\u0631\u0648\u06a9\u0633\u0631'], ['/sharehub/share-28.html', '\u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u06cc\u0627 \u062c\u062f\u0627: \u0631\u0648\u06a9\u0634\\u200c\u0647\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\\u200c\u0647\u0627\u06cc \u0645\u062c\u0627\u0648\u0631'], ['/chairside/chairside-23.html', '\u0634\u06a9\u0633\u062a \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0627\u0632 \u0646\u06cc\u0631\u0648\u0647\u0627\u06cc \u067e\u0627\u0631\u0627\u0641\u0627\u0646\u06a9\u0634\u0646\u0627\u0644']]"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "pathway_place.py mechanical rule: [{'pathway': 'ceramics', 'after': 'sharehub/share-17', 'why': 'STRONG'}, {'pathway': 'fixed-pros', 'after': 'sharehub/share-17', 'why': 'STRONG'}]"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q5; seven-line rotation {'added': '\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/insight/insight-116.html\">\u0634\u06a9\u0633\u062a \u0645\u06a9\u0631\u0631 \u06a9\u0627\u0646\u06a9\u062a\u0648\u0631 \u0631\u0648\u06a9\u0634\\u200c\u0647\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u06cc \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u062f\u0631 \u0628\u06cc\u0645\u0627\u0631 \u067e\u0627\u0631\u0627\u0641\u0627\u0646\u06a9\u0634\u0646\u0627\u0644</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f', 'dropped': '<li>\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/insight/insight-114.html\">\u0686\u0631\u0627 \u06cc\u06a9 \u0628\u0627\u0631 \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u06cc \u062f\u0642\u06cc\u0642\u0627\u064b \u0627\u0632 \u0648\u0633\u0637 \u06a9\u0627\u0646\u0627\u0644 \u067e\u06cc\u0686 \u0645\u06cc\\u200c\u0634\u06a9\u0646\u062f\u061f</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f</li>'}"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/05-DES-Fidelity installed by queue_install_des.py (record 176b6103387329d36042e75b6f7ddf90f9f5570b63ce0e7321b46e027998c9f4)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md pillar/subtopic (brain entry written by queue_apply)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/48-insight-zirconia-implant-crown-connector-fracture-parafunction/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q4.9: not a Challenge (the queue lane refuses Challenge items)"
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
          "queue_manifest check complete; dry run clean (48-insight-zirconia-implant-crown-connector-fracture-parafunction)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue_apply receipt sha256 3cb1bd1b008df868464d6321266170935eb797bd28d3e75ab4bb5cf788af9d2d"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.8 ['\u0631\u0648\u06a9\u0634\\u200c\u0647\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u06cc', '\u06af\u0631\u0648\u067e \u0641\u0627\u0646\u06a9\u0634\u0646', '\u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627', '\u06af\u0627\u06cc\u062f \u0628\u0647 \u06a9\u0627\u0646\u06cc\u0646']; 4.7 []; 4.9 [['/sharehub/share-17.html', '\u0634\u06a9\u0633\u062a \u0628\u0631\u06cc\u062c \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u062f\u0631 \u0628\u06cc\u0645\u0627\u0631 \u0628\u0631\u0648\u06a9\u0633\u0631'], ['/sharehub/share-28.html', '\u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u06cc\u0627 \u062c\u062f\u0627: \u0631\u0648\u06a9\u0634\\u200c\u0647\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\\u200c\u0647\u0627\u06cc \u0645\u062c\u0627\u0648\u0631'], ['/chairside/chairside-23.html', '\u0634\u06a9\u0633\u062a \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0627\u0632 \u0646\u06cc\u0631\u0648\u0647\u0627\u06cc \u067e\u0627\u0631\u0627\u0641\u0627\u0646\u06a9\u0634\u0646\u0627\u0644']]"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways [{'pathway': 'ceramics', 'after': 'sharehub/share-17', 'why': 'STRONG'}, {'pathway': 'fixed-pros', 'after': 'sharehub/share-17', 'why': 'STRONG'}]"
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
      ".dentcast/queue-frozen-des.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "insight/en/insight-116.html",
      "insight/index.html",
      "insight/insight-116.html",
      "insight/insight116-1.webp",
      "insight/insight116-2.webp",
      "insight/insight116-3.webp",
      "plus/assistant-tags.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: .dentcast/queue-frozen-des.json, dentcast-brain.json, dentcast-hashtag-reference.json, index.html, insight/en/insight-116.html, insight/index.html, insight/insight-116.html, insight/insight116-1.webp, insight/insight116-2.webp, insight/insight116-3.webp, plus/assistant-tags.json, plus/content-index.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
