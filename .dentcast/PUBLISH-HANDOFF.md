# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-104"
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
    "content_id": "insight/insight-104",
    "context": {
      "approvals": [
        {
          "decision": "\u0631\u0648\u06a9\u0634 \u06a9\u0648\u062a\u0627\u0647 \u06cc\u0627 \u062a\u0645\u0627\u0633 \u0632\u0648\u062f\u0631\u0633\u061f",
          "evidence": [
            "queue/11-insight-short-crown-or-premature-contact/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/11-insight-short-crown-or-premature-contact/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 5540ac3bdc9e2942bebdedc650d85fa9ce24a36d3989145673041ee15b8c6448)",
            "queue/11-insight-short-crown-or-premature-contact/SHA256SUMS (frozen files, sha256 6b6d9a017a0a9f55c8da05cdd4f2879dbcad645db12f13c19422c59607408b7d)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0631\u0648\u06a9\u0634 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u06a9\u0627\u0645\u0644\u0627\u064b \u0633\u0631 \u062c\u0627\u06cc\u0634 \u0646\u0634\u0633\u062a\u0647\u060c \u0627\u0645\u0627 \u0628\u0627 \u062f\u0646\u062f\u0627\u0646 \u0645\u0642\u0627\u0628\u0644 \u062a\u0645\u0627\u0633 \u06a9\u0627\u0641\u06cc \u0646\u062f\u0627\u0631\u062f.\n\n\u0622\u06cc\u0627 \u0628\u0627\u06cc\u062f \u0628\u0631\u0627\u06cc \u0627\u0635\u0644\u0627\u062d \u0627\u0631\u062a\u0641\u0627\u0639 \u0622\u0646 \u0631\u0627 \u0628\u0647 \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 \u0628\u0631\u06af\u0631\u062f\u0627\u0646\u06cc\u0645\u061f\n\n\u06af\u0627\u0647\u06cc \u0628\u0631\u0631\u0633\u06cc \u062f\u0642\u06cc\u0642\u200c\u062a\u0631 \u0627\u06a9\u0644\u0648\u0698\u0646 \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u062f \u0645\u0633\u06cc\u0631 \u062f\u0631\u0645\u0627\u0646 \u0631\u0627 \u062a\u063a\u06cc\u06cc\u0631 \u0628\u062f\u0647\u062f.",
          "evidence": [
            "queue/11-insight-short-crown-or-premature-contact/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/11-insight-short-crown-or-premature-contact/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 5540ac3bdc9e2942bebdedc650d85fa9ce24a36d3989145673041ee15b8c6448)",
            "queue/11-insight-short-crown-or-premature-contact/SHA256SUMS (frozen files, sha256 6b6d9a017a0a9f55c8da05cdd4f2879dbcad645db12f13c19422c59607408b7d)"
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
            "queue/11-insight-short-crown-or-premature-contact/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 5540ac3bdc9e2942bebdedc650d85fa9ce24a36d3989145673041ee15b8c6448)",
            "queue/11-insight-short-crown-or-premature-contact/SHA256SUMS (frozen files, sha256 6b6d9a017a0a9f55c8da05cdd4f2879dbcad645db12f13c19422c59607408b7d)"
          ],
          "kind": "queue_approvals_v1",
          "queue_ref": "queue/11-insight-short-crown-or-premature-contact",
          "receipt_sha256": "a254693b9c97f6d56e8dd0841d70fcbdb0194de4faed08f734ce2e18d0c1abd3",
          "sha256sums": "6b6d9a017a0a9f55c8da05cdd4f2879dbcad645db12f13c19422c59607408b7d",
          "status_sha256": "5540ac3bdc9e2942bebdedc650d85fa9ce24a36d3989145673041ee15b8c6448"
        },
        {
          "evidence": [
            "queue/11-insight-short-crown-or-premature-contact/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 5540ac3bdc9e2942bebdedc650d85fa9ce24a36d3989145673041ee15b8c6448)",
            "queue/11-insight-short-crown-or-premature-contact/SHA256SUMS (frozen files, sha256 6b6d9a017a0a9f55c8da05cdd4f2879dbcad645db12f13c19422c59607408b7d)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/11-insight-short-crown-or-premature-contact/01-\u0645\u062a\u0646.md (frozen; its opening paragraph was approved in preparation)"
        },
        {
          "english": {
            "evidence": [
              "queue/11-insight-short-crown-or-premature-contact/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md (frozen)"
            ],
            "path": "insight/en/insight-104.html",
            "status": "ready"
          },
          "evidence": [
            "generated by tools/queue_ledger.py from the frozen item (receipt a254693b9c97f6d56e8dd0841d70fcbdb0194de4faed08f734ce2e18d0c1abd3)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "queue/11-insight-short-crown-or-premature-contact/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 5540ac3bdc9e2942bebdedc650d85fa9ce24a36d3989145673041ee15b8c6448)",
                "queue/11-insight-short-crown-or-premature-contact/SHA256SUMS (frozen files, sha256 6b6d9a017a0a9f55c8da05cdd4f2879dbcad645db12f13c19422c59607408b7d)",
                "mechanical defaults: {\"field\": \"backlinks_47\", \"rule\": \"11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md 4.7 has no frozen back-link with its link text \u2014 none is added\", \"value\": []}; {\"field\": \"explore_49\", \"rule\": \"no frozen 4.9 selection \u2014 nothing is added (queue-route: 4.9 only a frozen choice)\", \"value\": []}; {\"field\": \"pathway\", \"rule\": \"mechanical pathway rule\", \"value\": null}"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/11-insight-short-crown-or-premature-contact/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md; brain entry None"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/11-insight-short-crown-or-premature-contact/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md verbatim -> insight/en/insight-104.html"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/11-insight-short-crown-or-premature-contact/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md list; hashtag_ref.py --sync/--check passed"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/11-insight-short-crown-or-premature-contact/11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md; applied ['\u0631\u0648\u06a9\u0634 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a', '\u062a\u0645\u0627\u0633 \u0627\u06a9\u0644\u0648\u0698\u0646\u06cc']; 4.7 []; 4.9 []"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "pathway_place.py mechanical rule: [{'pathway': 'implant-prosthetic', 'after': 'insight/insight-85', 'why': 'top candidate (mechanical default)'}]"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/11-insight-short-crown-or-premature-contact/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q5; seven-line rotation {'added': '\u06cc\u06a9 \u0627\u06cc\u0646\u0633\u0627\u06cc\u062a \u0628\u0627\u0644\u06cc\u0646\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/insight/insight-104.html\">\u0631\u0648\u06a9\u0634 \u06a9\u0648\u062a\u0627\u0647 \u06cc\u0627 \u062a\u0645\u0627\u0633 \u0632\u0648\u062f\u0631\u0633\u061f</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f', 'dropped': '<li>\u06cc\u06a9 \u0646\u0648\u062a\\u200c\u06a9\u0633\u062a \u062a\u0627\u0632\u0647 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/notecast/episode-44.html\">\u062a\u0631\u0645\u06cc\u0645 \u06a9\u0627\u0645\u067e\u0648\u0632\u06cc\u062a \u0642\u062f\u06cc\u0645\u06cc: \u0633\u0627\u06cc\u0644\u0646 \u0648 \u06a9\u06cc\u0648\u0631 \u0646\u06a9\u0631\u062f\u0646 \u0628\u0627\u0646\u062f\u06cc\u0646\u06af</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f</li>'}"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/11-insight-short-crown-or-premature-contact/05-DES-Fidelity installed by queue_install_des.py (record bc854cdd7215e852bbeb4e75c1e28ccc77d242867ecebbfb3a3b90dabed461b6)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/11-insight-short-crown-or-premature-contact/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md pillar/subtopic (brain entry written by queue_apply)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/11-insight-short-crown-or-premature-contact/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q4.9: not a Challenge (the queue lane refuses Challenge items)"
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
          "queue_manifest check complete; dry run clean (11-insight-short-crown-or-premature-contact)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue_apply receipt sha256 746b773d98cb2e0681165684d5dad71f59ecea0ae41feefb7153386bb12d0669"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.8 ['\u0631\u0648\u06a9\u0634 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a', '\u062a\u0645\u0627\u0633 \u0627\u06a9\u0644\u0648\u0698\u0646\u06cc']; 4.7 []; 4.9 []"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways [{'pathway': 'implant-prosthetic', 'after': 'insight/insight-85', 'why': 'top candidate (mechanical default)'}]"
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
      "insight/en/insight-104.html",
      "insight/index.html",
      "insight/insight-104.html",
      "insight/insight104-1.webp",
      "plus/assistant-tags.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: .dentcast/queue-frozen-des.json, dentcast-brain.json, dentcast-hashtag-reference.json, index.html, insight/en/insight-104.html, insight/index.html, insight/insight-104.html, insight/insight104-1.webp, plus/assistant-tags.json, plus/content-index.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
