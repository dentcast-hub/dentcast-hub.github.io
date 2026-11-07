# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-106"
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
    "content_id": "insight/insight-106",
    "context": {
      "approvals": [
        {
          "decision": "\u0644\u06cc\u0641\u062a \u0644\u062b\u0647\u061b \u0686\u0631\u0627 \u06af\u0627\u0647\u06cc \u0628\u0631\u062f\u0627\u0634\u062a\u0646 \u0644\u062b\u0647 \u0628\u0647\u200c\u062a\u0646\u0647\u0627\u06cc\u06cc \u06a9\u0627\u0641\u06cc \u0646\u06cc\u0633\u062a\u061f",
          "evidence": [
            "queue/23-insight-gingival-lift-bone-sounding/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/23-insight-gingival-lift-bone-sounding/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 ed64d6f047c0248f19bef1ec3315e7c787264873cc4149f44cfd17162adfcb96)",
            "queue/23-insight-gingival-lift-bone-sounding/SHA256SUMS (frozen files, sha256 1f89bbd340c1ec9f262a7e99ed6de1721fd2d1a5d9e123f38cbef438d7aced30)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u067e\u06cc\u0634 \u0627\u0632 \u0644\u06cc\u0641\u062a \u0644\u062b\u0647 \u0628\u0627\u06cc\u062f \u0628\u062f\u0627\u0646\u06cc\u0645 \u06a9\u0631\u0633\u062a \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u06a9\u062c\u0627\u0633\u062a\u061b \u0627\u06af\u0631 \u0628\u0631\u0627\u06cc \u0627\u062a\u0635\u0627\u0644 \u0633\u0648\u067e\u0631\u0627\u06a9\u0631\u0633\u062a\u0627\u0644 \u0641\u0636\u0627 \u0646\u0645\u0627\u0646\u062f\u060c \u0628\u0631\u062f\u0627\u0634\u062a\u0646 \u0644\u062b\u0647 \u0628\u0647\u200c\u062a\u0646\u0647\u0627\u06cc\u06cc \u0645\u0645\u06a9\u0646 \u0627\u0633\u062a \u0628\u0647 Rebound \u0628\u0631\u0633\u062f \u0648 \u0645\u0627\u0631\u062c\u06cc\u0646\u06cc \u06a9\u0647 \u062f\u0631 \u0645\u0648\u0642\u0639\u06cc\u062a \u062c\u062f\u06cc\u062f \u0642\u0631\u0627\u0631 \u06af\u06cc\u0631\u062f\u060c \u0648\u0627\u0631\u062f \u0627\u06cc\u0646 \u0627\u062a\u0635\u0627\u0644 \u0634\u0648\u062f.",
          "evidence": [
            "queue/23-insight-gingival-lift-bone-sounding/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/23-insight-gingival-lift-bone-sounding/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 ed64d6f047c0248f19bef1ec3315e7c787264873cc4149f44cfd17162adfcb96)",
            "queue/23-insight-gingival-lift-bone-sounding/SHA256SUMS (frozen files, sha256 1f89bbd340c1ec9f262a7e99ed6de1721fd2d1a5d9e123f38cbef438d7aced30)"
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
            "queue/23-insight-gingival-lift-bone-sounding/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 ed64d6f047c0248f19bef1ec3315e7c787264873cc4149f44cfd17162adfcb96)",
            "queue/23-insight-gingival-lift-bone-sounding/SHA256SUMS (frozen files, sha256 1f89bbd340c1ec9f262a7e99ed6de1721fd2d1a5d9e123f38cbef438d7aced30)"
          ],
          "kind": "queue_approvals_v1",
          "queue_ref": "queue/23-insight-gingival-lift-bone-sounding",
          "receipt_sha256": "4b9727361503722a0462263896c5d83596670ceaf06533a6be1ec7f0042d5929",
          "sha256sums": "1f89bbd340c1ec9f262a7e99ed6de1721fd2d1a5d9e123f38cbef438d7aced30",
          "status_sha256": "ed64d6f047c0248f19bef1ec3315e7c787264873cc4149f44cfd17162adfcb96"
        },
        {
          "evidence": [
            "queue/23-insight-gingival-lift-bone-sounding/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 ed64d6f047c0248f19bef1ec3315e7c787264873cc4149f44cfd17162adfcb96)",
            "queue/23-insight-gingival-lift-bone-sounding/SHA256SUMS (frozen files, sha256 1f89bbd340c1ec9f262a7e99ed6de1721fd2d1a5d9e123f38cbef438d7aced30)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/23-insight-gingival-lift-bone-sounding/01-\u0645\u062a\u0646.md (frozen; its opening paragraph was approved in preparation)"
        },
        {
          "english": {
            "evidence": [
              "queue/23-insight-gingival-lift-bone-sounding/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md (frozen)"
            ],
            "path": "insight/en/insight-106.html",
            "status": "ready"
          },
          "evidence": [
            "generated by tools/queue_ledger.py from the frozen item (receipt 4b9727361503722a0462263896c5d83596670ceaf06533a6be1ec7f0042d5929)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "queue/23-insight-gingival-lift-bone-sounding/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 ed64d6f047c0248f19bef1ec3315e7c787264873cc4149f44cfd17162adfcb96)",
                "queue/23-insight-gingival-lift-bone-sounding/SHA256SUMS (frozen files, sha256 1f89bbd340c1ec9f262a7e99ed6de1721fd2d1a5d9e123f38cbef438d7aced30)",
                "mechanical defaults: {\"field\": \"pathway\", \"rule\": \"mechanical pathway rule\", \"value\": null}"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/23-insight-gingival-lift-bone-sounding/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md; brain entry None"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/23-insight-gingival-lift-bone-sounding/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md verbatim -> insight/en/insight-106.html"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/23-insight-gingival-lift-bone-sounding/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md list; hashtag_ref.py --sync/--check passed"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/23-insight-gingival-lift-bone-sounding/11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md; applied ['Biologic Width', '\u06a9\u0631\u0627\u0648\u0646 \u0644\u0646\u062a\u0646\u06cc\u0646\u06af']; 4.7 [{'term': 'biological-width', 'skipped': 'cap 5 reached (Hard Rule 9)'}, {'term': 'crown-lengthening', 'skipped': 'cap 5 reached (Hard Rule 9)'}]; 4.9 [['/sharehub/share-24.html', '\u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u06a9\u0648\u062a\u0627\u0647: \u0639\u0644\u062a \u0648 \u062f\u0631\u0645\u0627\u0646'], ['/episodes/episode-75.html', '\u0639\u0631\u0636 \u0628\u06cc\u0648\u0644\u0648\u0698\u06cc\u06a9\u061b DME \u06cc\u0627 \u0627\u0641\u0632\u0627\u06cc\u0634 \u0637\u0648\u0644 \u062a\u0627\u062c'], ['/chairside/chairside-7.html', '\u062a\u062c\u0627\u0648\u0632 \u062a\u0631\u0645\u06cc\u0645 \u0628\u0647 \u0628\u06cc\u0648\u0644\u0648\u0698\u06cc\u06a9 \u0648\u06cc\u062f\u062b']]"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "pathway_place.py mechanical rule: [{'pathway': 'fixed-pros', 'after': 'sharehub/share-24', 'why': 'top candidate (mechanical default)'}]"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/23-insight-gingival-lift-bone-sounding/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q5; seven-line rotation {'added': '\u06cc\u06a9 \u0627\u06cc\u0646\u0633\u0627\u06cc\u062a \u0628\u0627\u0644\u06cc\u0646\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/insight/insight-106.html\">\u0644\u06cc\u0641\u062a \u0644\u062b\u0647\u061b \u0686\u0631\u0627 \u06af\u0627\u0647\u06cc \u0628\u0631\u062f\u0627\u0634\u062a\u0646 \u0644\u062b\u0647 \u0628\u0647\\u200c\u062a\u0646\u0647\u0627\u06cc\u06cc \u06a9\u0627\u0641\u06cc \u0646\u06cc\u0633\u062a\u061f</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f', 'dropped': '<li><a href=\"/sharehub/share-46.html\">\u0622\u06cc\u0627 \u0628\u0631\u0627\u06cc \u067e\u0631\u0648\u062a\u0632 \u0641\u0648\u0644\\u200c\u0622\u0631\u0686 \u0648\u0627\u0642\u0639\u0627\u064b \u0628\u0647 \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\\u200c\u0628\u0627\u0631 \u0646\u06cc\u0627\u0632 \u062f\u0627\u0631\u06cc\u0645\u061f</a></li>'}"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/23-insight-gingival-lift-bone-sounding/05-DES-Fidelity installed by queue_install_des.py (record f0f5c4011c31975b97368032b63603c9c282e234decda527435ae721ef356b01)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/23-insight-gingival-lift-bone-sounding/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md pillar/subtopic (brain entry written by queue_apply)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/23-insight-gingival-lift-bone-sounding/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q4.9: not a Challenge (the queue lane refuses Challenge items)"
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
          "queue_manifest check complete; dry run clean (23-insight-gingival-lift-bone-sounding)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue_apply receipt sha256 07a8759af966b1781010b84379b144fba15bb784eafca730fbe35b06bd1d4b40"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.8 ['Biologic Width', '\u06a9\u0631\u0627\u0648\u0646 \u0644\u0646\u062a\u0646\u06cc\u0646\u06af']; 4.7 [{'term': 'biological-width', 'skipped': 'cap 5 reached (Hard Rule 9)'}, {'term': 'crown-lengthening', 'skipped': 'cap 5 reached (Hard Rule 9)'}]; 4.9 [['/sharehub/share-24.html', '\u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u06a9\u0648\u062a\u0627\u0647: \u0639\u0644\u062a \u0648 \u062f\u0631\u0645\u0627\u0646'], ['/episodes/episode-75.html', '\u0639\u0631\u0636 \u0628\u06cc\u0648\u0644\u0648\u0698\u06cc\u06a9\u061b DME \u06cc\u0627 \u0627\u0641\u0632\u0627\u06cc\u0634 \u0637\u0648\u0644 \u062a\u0627\u062c'], ['/chairside/chairside-7.html', '\u062a\u062c\u0627\u0648\u0632 \u062a\u0631\u0645\u06cc\u0645 \u0628\u0647 \u0628\u06cc\u0648\u0644\u0648\u0698\u06cc\u06a9 \u0648\u06cc\u062f\u062b']]"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways [{'pathway': 'fixed-pros', 'after': 'sharehub/share-24', 'why': 'top candidate (mechanical default)'}]"
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
      "insight/en/insight-106.html",
      "insight/index.html",
      "insight/insight-106.html",
      "plus/assistant-tags.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: .dentcast/queue-frozen-des.json, dentcast-brain.json, dentcast-hashtag-reference.json, index.html, insight/en/insight-106.html, insight/index.html, insight/insight-106.html, plus/assistant-tags.json, plus/content-index.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
