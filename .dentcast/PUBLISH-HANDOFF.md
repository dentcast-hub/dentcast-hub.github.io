# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-50"
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
    "category": "chairside",
    "content_id": "chairside/chairside-50",
    "context": {
      "approvals": [
        {
          "decision": "\u0648\u0642\u062a\u06cc \u0641\u0636\u0627\u06cc \u0628\u0627\u0642\u06cc\u200c\u0645\u0627\u0646\u062f\u0647\u200c\u06cc \u0627\u0631\u062a\u0648\u062f\u0646\u0633\u06cc \u0628\u0647 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u0633\u067e\u0631\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f",
          "evidence": [
            "queue/34-chairside-ortho-space-restorative-closure/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/34-chairside-ortho-space-restorative-closure/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 d340952786ad35a861520d60985c87adc49fb5440bba08919cf6dffc5d336322)",
            "queue/34-chairside-ortho-space-restorative-closure/SHA256SUMS (frozen files, sha256 dae461ebc7f1e50db105451c680945de922eb828c150b4332c9ecf9dfe82d0fc)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0645\u062a\u062e\u0635\u0635 \u0627\u0631\u062a\u0648\u062f\u0646\u0633\u06cc \u0641\u0636\u0627\u0647\u0627\u06cc \u062e\u0644\u0641\u06cc \u0631\u0627 \u0628\u0631\u0627\u06cc \u0628\u0627\u0632\u0633\u0627\u0632\u06cc \u067e\u0631\u0648\u062a\u0632\u06cc \u0646\u06af\u0647 \u062f\u0627\u0634\u062a\u0647 \u0628\u0648\u062f\u060c \u0627\u0645\u0627 \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627\u06cc \u062f\u0648 \u0637\u0631\u0641 \u0627\u06cc\u0646 \u0641\u0636\u0627\u0647\u0627 \u0641\u0631\u0645 \u0648 \u06a9\u0627\u0646\u062a\u0648\u0631 \u06a9\u0627\u0645\u0644\u06cc \u062f\u0627\u0634\u062a\u0646\u062f. \u0628\u0633\u062a\u0646 \u0641\u0636\u0627 \u0628\u0627 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u062f\u0631 \u0686\u0646\u06cc\u0646 \u0634\u0631\u0627\u06cc\u0637\u06cc \u0686\u0647 \u0647\u0632\u06cc\u0646\u0647\u200c\u0627\u06cc \u062f\u0627\u0631\u062f\u061f",
          "evidence": [
            "queue/34-chairside-ortho-space-restorative-closure/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/34-chairside-ortho-space-restorative-closure/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 d340952786ad35a861520d60985c87adc49fb5440bba08919cf6dffc5d336322)",
            "queue/34-chairside-ortho-space-restorative-closure/SHA256SUMS (frozen files, sha256 dae461ebc7f1e50db105451c680945de922eb828c150b4332c9ecf9dfe82d0fc)"
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
            "queue/34-chairside-ortho-space-restorative-closure/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 d340952786ad35a861520d60985c87adc49fb5440bba08919cf6dffc5d336322)",
            "queue/34-chairside-ortho-space-restorative-closure/SHA256SUMS (frozen files, sha256 dae461ebc7f1e50db105451c680945de922eb828c150b4332c9ecf9dfe82d0fc)"
          ],
          "kind": "queue_approvals_v1",
          "queue_ref": "queue/34-chairside-ortho-space-restorative-closure",
          "receipt_sha256": "c437d95212484d063c3905deb8d36b94568edf7911fce2c0bccf9cd0692da752",
          "sha256sums": "dae461ebc7f1e50db105451c680945de922eb828c150b4332c9ecf9dfe82d0fc",
          "status_sha256": "d340952786ad35a861520d60985c87adc49fb5440bba08919cf6dffc5d336322"
        },
        {
          "evidence": [
            "queue/34-chairside-ortho-space-restorative-closure/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 d340952786ad35a861520d60985c87adc49fb5440bba08919cf6dffc5d336322)",
            "queue/34-chairside-ortho-space-restorative-closure/SHA256SUMS (frozen files, sha256 dae461ebc7f1e50db105451c680945de922eb828c150b4332c9ecf9dfe82d0fc)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/34-chairside-ortho-space-restorative-closure/01-\u0645\u062a\u0646.md (frozen; its opening paragraph was approved in preparation)"
        },
        {
          "english": {
            "evidence": [
              "queue/34-chairside-ortho-space-restorative-closure/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md (frozen)"
            ],
            "path": "chairside/en/chairside-50.html",
            "status": "ready"
          },
          "evidence": [
            "generated by tools/queue_ledger.py from the frozen item (receipt c437d95212484d063c3905deb8d36b94568edf7911fce2c0bccf9cd0692da752)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "queue/34-chairside-ortho-space-restorative-closure/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 d340952786ad35a861520d60985c87adc49fb5440bba08919cf6dffc5d336322)",
                "queue/34-chairside-ortho-space-restorative-closure/SHA256SUMS (frozen files, sha256 dae461ebc7f1e50db105451c680945de922eb828c150b4332c9ecf9dfe82d0fc)",
                "mechanical defaults: {\"field\": \"backlinks_47\", \"rule\": \"11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md 4.7 has no frozen back-link with its link text \u2014 none is added\", \"value\": []}; {\"field\": \"pathway\", \"rule\": \"mechanical pathway rule\", \"value\": null}"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/34-chairside-ortho-space-restorative-closure/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md; brain entry None"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/34-chairside-ortho-space-restorative-closure/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md verbatim -> chairside/en/chairside-50.html"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/34-chairside-ortho-space-restorative-closure/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md list; hashtag_ref.py --sync/--check passed"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/34-chairside-ortho-space-restorative-closure/11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md; applied []; 4.7 []; 4.9 [['/chairside/chairside-43.html', '\u067e\u0631 \u06a9\u0631\u062f\u0646 \u0641\u0636\u0627\u06cc \u0627\u0636\u0627\u0641\u0647 \u06cc\u0627 \u062c\u0627\u0628\u0647\\u200c\u062c\u0627\u06cc\u06cc \u062f\u0646\u062f\u0627\u0646'], ['/chairside/chairside-2.html', '\u0641\u0636\u0627\u06cc \u067e\u0631\u0645\u0648\u0644\u0631 \u062f\u0631 \u0645\u062d\u062f\u0648\u062f\u06cc\u062a \u0627\u0631\u062a\u0648\u062f\u0646\u0633\u06cc'], ['/insight/insight-19.html', '\u0627\u0631\u0632\u06cc\u0627\u0628\u06cc \u0641\u0636\u0627\u06cc \u0628\u0627\u0632\u0633\u0627\u0632\u06cc \u0627\u0631\u062a\u0648\u062f\u0646\u0633\u06cc\u2013\u067e\u0631\u0648\u062a\u0632\u06cc']]"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "pathway_place.py mechanical rule: [{'pathway': 'treatment-planning', 'after': 'insight/insight-19', 'why': 'STRONG'}, {'pathway': 'fixed-pros', 'after': 'insight/insight-57', 'why': 'STRONG'}]"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/34-chairside-ortho-space-restorative-closure/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q5; seven-line rotation {'added': '\u06cc\u06a9 \u0648\u06cc\u0632\u06cc\u062a \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/chairside/chairside-50.html\">\u0648\u0642\u062a\u06cc \u0641\u0636\u0627\u06cc \u0628\u0627\u0642\u06cc\\u200c\u0645\u0627\u0646\u062f\u0647\\u200c\u06cc \u0627\u0631\u062a\u0648\u062f\u0646\u0633\u06cc \u0628\u0647 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u0633\u067e\u0631\u062f\u0647 \u0645\u06cc\\u200c\u0634\u0648\u062f</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f.', 'dropped': '<li>\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/insight/insight-105.html\">\u0641\u0631\u0648\u0644 \u062f\u0631 \u062f\u0646\u062f\u0627\u0646 \u067e\u0627\u06cc\u0647 \u067e\u0627\u0631\u0633\u06cc\u0644: \u0686\u0631\u0627 \u0631\u0648\u06a9\u0634 \u0642\u062f\u06cc\u0645\u06cc \u0631\u0627 \u0628\u0627\u06cc\u062f \u062f\u0631\u0622\u0648\u0631\u062f</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f</li>'}"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/34-chairside-ortho-space-restorative-closure/05-DES-Fidelity installed by queue_install_des.py (record 88be0ac19b05b2b7a5f71ecf4b0afa5c04973ef038cffb8c14e341ef5d660deb)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/34-chairside-ortho-space-restorative-closure/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md pillar/subtopic (brain entry written by queue_apply)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/34-chairside-ortho-space-restorative-closure/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q4.9: not a Challenge (the queue lane refuses Challenge items)"
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
          "queue_manifest check complete; dry run clean (34-chairside-ortho-space-restorative-closure)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue_apply receipt sha256 2c7e77ea7055c30da66745365f61a169138e3c7c32c77ebaf486fc1fb6bec828"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.8 []; 4.7 []; 4.9 [['/chairside/chairside-43.html', '\u067e\u0631 \u06a9\u0631\u062f\u0646 \u0641\u0636\u0627\u06cc \u0627\u0636\u0627\u0641\u0647 \u06cc\u0627 \u062c\u0627\u0628\u0647\\u200c\u062c\u0627\u06cc\u06cc \u062f\u0646\u062f\u0627\u0646'], ['/chairside/chairside-2.html', '\u0641\u0636\u0627\u06cc \u067e\u0631\u0645\u0648\u0644\u0631 \u062f\u0631 \u0645\u062d\u062f\u0648\u062f\u06cc\u062a \u0627\u0631\u062a\u0648\u062f\u0646\u0633\u06cc'], ['/insight/insight-19.html', '\u0627\u0631\u0632\u06cc\u0627\u0628\u06cc \u0641\u0636\u0627\u06cc \u0628\u0627\u0632\u0633\u0627\u0632\u06cc \u0627\u0631\u062a\u0648\u062f\u0646\u0633\u06cc\u2013\u067e\u0631\u0648\u062a\u0632\u06cc']]"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways [{'pathway': 'treatment-planning', 'after': 'insight/insight-19', 'why': 'STRONG'}, {'pathway': 'fixed-pros', 'after': 'insight/insight-57', 'why': 'STRONG'}]"
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
      "chairside/chairside-50.html",
      "chairside/cs50-1.webp",
      "chairside/cs50-2.webp",
      "chairside/en/chairside-50.html",
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
    "note": "Index-only refresh after staging delivery paths: .dentcast/queue-frozen-des.json, chairside/chairside-50.html, chairside/cs50-1.webp, chairside/cs50-2.webp, chairside/en/chairside-50.html, chairside/index.html, dentcast-brain.json, dentcast-hashtag-reference.json, index.html, plus/assistant-tags.json, plus/content-index.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
