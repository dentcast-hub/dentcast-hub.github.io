# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-107"
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
    "content_id": "insight/insight-107",
    "context": {
      "approvals": [
        {
          "decision": "\u062a\u063a\u06cc\u06cc\u0631 \u0631\u0646\u06af \u0631\u0648\u06a9\u0634 \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u0628\u0627 \u0633\u0645\u0627\u0646 \u0645\u0648\u0642\u062a\u061b \u0686\u0631\u0627 \u0631\u0646\u06af \u0631\u0648\u06a9\u0634 \u0628\u0627 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0647\u0645\u0627\u0647\u0646\u06af \u0646\u06cc\u0633\u062a\u061f",
          "evidence": [
            "queue/38-insight-zirconia-crown-shade-temporary-cement/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/38-insight-zirconia-crown-shade-temporary-cement/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 b19a20cf772bef5f05f50708d9a6c00e8c282ebcb25c5e2e0ea1c3b98dbe571c)",
            "queue/38-insight-zirconia-crown-shade-temporary-cement/SHA256SUMS (frozen files, sha256 533051851dc9c1f12e0c4694a71a82153bf75a76afc6eedc1508c5f7fbb58122)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0633\u0645\u0627\u0646 \u0645\u0648\u0642\u062a \u0633\u0641\u06cc\u062f \u0648 \u06af\u0686\u06cc \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u062f \u0631\u0648\u06a9\u0634 \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u0631\u0627 \u0631\u0648\u0634\u0646\u200c\u062a\u0631 \u0648 \u06a9\u062f\u0631\u062a\u0631 \u0646\u0634\u0627\u0646 \u062f\u0647\u062f\u061b \u0627\u0645\u062a\u062d\u0627\u0646 \u06a9\u0631\u062f\u0646 \u0631\u0648\u06a9\u0634 \u0628\u062f\u0648\u0646 \u0633\u0645\u0627\u0646 \u0646\u0634\u0627\u0646 \u0645\u06cc\u200c\u062f\u0647\u062f \u0627\u062e\u062a\u0644\u0627\u0641 \u0631\u0646\u06af \u0627\u0632 \u062e\u0648\u062f \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u0627\u0633\u062a \u06cc\u0627 \u0627\u0632 \u0644\u0627\u06cc\u0647\u200c\u06cc \u0633\u0645\u0627\u0646 \u0632\u06cc\u0631 \u0622\u0646.",
          "evidence": [
            "queue/38-insight-zirconia-crown-shade-temporary-cement/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/38-insight-zirconia-crown-shade-temporary-cement/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 b19a20cf772bef5f05f50708d9a6c00e8c282ebcb25c5e2e0ea1c3b98dbe571c)",
            "queue/38-insight-zirconia-crown-shade-temporary-cement/SHA256SUMS (frozen files, sha256 533051851dc9c1f12e0c4694a71a82153bf75a76afc6eedc1508c5f7fbb58122)"
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
            "queue/38-insight-zirconia-crown-shade-temporary-cement/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 b19a20cf772bef5f05f50708d9a6c00e8c282ebcb25c5e2e0ea1c3b98dbe571c)",
            "queue/38-insight-zirconia-crown-shade-temporary-cement/SHA256SUMS (frozen files, sha256 533051851dc9c1f12e0c4694a71a82153bf75a76afc6eedc1508c5f7fbb58122)"
          ],
          "kind": "queue_approvals_v1",
          "queue_ref": "queue/38-insight-zirconia-crown-shade-temporary-cement",
          "receipt_sha256": "0fce26d834b1c69c03b2ae6e80d9d264fa20e3183dbf22a00abb798c02ef1134",
          "sha256sums": "533051851dc9c1f12e0c4694a71a82153bf75a76afc6eedc1508c5f7fbb58122",
          "status_sha256": "b19a20cf772bef5f05f50708d9a6c00e8c282ebcb25c5e2e0ea1c3b98dbe571c"
        },
        {
          "evidence": [
            "queue/38-insight-zirconia-crown-shade-temporary-cement/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 b19a20cf772bef5f05f50708d9a6c00e8c282ebcb25c5e2e0ea1c3b98dbe571c)",
            "queue/38-insight-zirconia-crown-shade-temporary-cement/SHA256SUMS (frozen files, sha256 533051851dc9c1f12e0c4694a71a82153bf75a76afc6eedc1508c5f7fbb58122)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/38-insight-zirconia-crown-shade-temporary-cement/01-\u0645\u062a\u0646.md (frozen; its opening paragraph was approved in preparation)"
        },
        {
          "english": {
            "evidence": [
              "queue/38-insight-zirconia-crown-shade-temporary-cement/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md (frozen)"
            ],
            "path": "insight/en/insight-107.html",
            "status": "ready"
          },
          "evidence": [
            "generated by tools/queue_ledger.py from the frozen item (receipt 0fce26d834b1c69c03b2ae6e80d9d264fa20e3183dbf22a00abb798c02ef1134)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "queue/38-insight-zirconia-crown-shade-temporary-cement/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 b19a20cf772bef5f05f50708d9a6c00e8c282ebcb25c5e2e0ea1c3b98dbe571c)",
                "queue/38-insight-zirconia-crown-shade-temporary-cement/SHA256SUMS (frozen files, sha256 533051851dc9c1f12e0c4694a71a82153bf75a76afc6eedc1508c5f7fbb58122)",
                "mechanical defaults: {\"field\": \"backlinks_47\", \"rule\": \"11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md 4.7 has no frozen back-link with its link text \u2014 none is added\", \"value\": []}; {\"field\": \"pathway\", \"rule\": \"mechanical pathway rule\", \"value\": null}; {\"rule\": \"4.8 approved link phrase not in body\", \"skipped\": [\"\u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 (\u0628\u0646\u062f \u06f1: \u00ab\u0631\u0648\u06a9\u0634 \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627\u00bb)\", \"\u0633\u0645\u0627\u0646 \u0631\u0632\u06cc\u0646\u06cc (\u0628\u0646\u062f \u06f1: \u00ab\u0628\u0627 \u0633\u0645\u0627\u0646 \u0631\u0632\u06cc\u0646\u06cc \u0633\u0645\u0627\u0646 \u06a9\u0631\u062f\u0645\u00bb)\", \"\u0633\u0631\u0627\u0645\u06cc\u06a9\u200c\u0647\u0627\u06cc \u0634\u06cc\u0634\u0647\u200c\u0627\u06cc (\u0628\u0646\u062f \u06f3)\", \"\u062a\u063a\u06cc\u06cc\u0631 \u0631\u0646\u06af \u0631\u0648\u06a9\u0634 \u0628\u0639\u062f \u0627\u0632 \u0633\u0645\u0627\u0646 \u062f\u0627\u0626\u0645 (\u0628\u0646\u062f \u06f6: \u00ab\u0642\u0628\u0644\u0627\u064b \u062f\u0631\u0628\u0627\u0631\u0647\u200c\u06cc \u062a\u063a\u06cc\u06cc\u0631 \u0631\u0646\u06af \u0631\u0648\u06a9\u0634 \u0628\u0639\u062f \u0627\u0632 \u0633\u0645\u0627\u0646 \u062f\u0627\u0626\u0645 \u0646\u0648\u0634\u062a\u0647 \u0628\u0648\u062f\u0645\u00bb)\"]}"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/38-insight-zirconia-crown-shade-temporary-cement/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md; brain entry None"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/38-insight-zirconia-crown-shade-temporary-cement/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md verbatim -> insight/en/insight-107.html"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/38-insight-zirconia-crown-shade-temporary-cement/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md list; hashtag_ref.py --sync/--check passed"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/38-insight-zirconia-crown-shade-temporary-cement/11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md; applied []; 4.7 []; 4.9 [['/insight/insight-92.html', '\u062a\u0637\u0627\u0628\u0642 \u0631\u0646\u06af \u0644\u0645\u06cc\u0646\u06cc\u062a \u0648 \u0631\u0648\u06a9\u0634 \u062f\u0631 \u06cc\u06a9 \u06a9\u06cc\u0633'], ['/chairside/chairside-40.html', '\u0633\u0645\u0627\u0646 \u0645\u0648\u0642\u062a \u06cc\u0627 \u062f\u0627\u0626\u0645 \u0628\u0631\u0627\u06cc \u0647\u0645\u0627\u0647\u0646\u06af\u06cc \u0631\u0646\u06af \u0631\u0648\u06a9\u0634\\u200c\u0647\u0627'], ['/episodes/episode-68.html', '\u0639\u0648\u0627\u0645\u0644 \u0645\u0624\u062b\u0631 \u0628\u0631 \u0631\u0646\u06af \u0646\u0647\u0627\u06cc\u06cc']]"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "pathway_place.py mechanical rule: [{'pathway': 'fixed-pros', 'after': 'notecast/episode-3', 'why': 'STRONG'}, {'pathway': 'ceramics', 'after': 'notecast/episode-3', 'why': 'STRONG'}]"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/38-insight-zirconia-crown-shade-temporary-cement/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q5; seven-line rotation {'added': '\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/insight/insight-107.html\">\u062a\u063a\u06cc\u06cc\u0631 \u0631\u0646\u06af \u0631\u0648\u06a9\u0634 \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u0628\u0627 \u0633\u0645\u0627\u0646 \u0645\u0648\u0642\u062a\u061b \u0686\u0631\u0627 \u0631\u0646\u06af \u0631\u0648\u06a9\u0634 \u0628\u0627 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0647\u0645\u0627\u0647\u0646\u06af \u0646\u06cc\u0633\u062a\u061f</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f', 'dropped': '<li><a href=\"/sharehub/share-49.html\">\u0646\u0633\u0628\u062a \u062a\u0627\u062c \u0628\u0647 \u0631\u06cc\u0634\u0647\u061b \u0686\u0642\u062f\u0631 \u0645\u06cc\\u200c\u062a\u0648\u0627\u0646 \u0628\u0647 \u0639\u062f\u062f\u0647\u0627\u06cc \u06a9\u0644\u0627\u0633\u06cc\u06a9 \u0627\u0639\u062a\u0645\u0627\u062f \u06a9\u0631\u062f\u061f</a></li>'}"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/38-insight-zirconia-crown-shade-temporary-cement/05-DES-Fidelity installed by queue_install_des.py (record 06769c1167d0e100521d3080de0cb739ea1a902c697aa87eb6a92908c23ac109)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/38-insight-zirconia-crown-shade-temporary-cement/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md pillar/subtopic (brain entry written by queue_apply)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/38-insight-zirconia-crown-shade-temporary-cement/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q4.9: not a Challenge (the queue lane refuses Challenge items)"
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
          "queue_manifest check complete; dry run clean (38-insight-zirconia-crown-shade-temporary-cement)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue_apply receipt sha256 aaba07e9966912a9e9d526afc34810a20bc8040463e1eb7f872f3366255527b1"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.8 []; 4.7 []; 4.9 [['/insight/insight-92.html', '\u062a\u0637\u0627\u0628\u0642 \u0631\u0646\u06af \u0644\u0645\u06cc\u0646\u06cc\u062a \u0648 \u0631\u0648\u06a9\u0634 \u062f\u0631 \u06cc\u06a9 \u06a9\u06cc\u0633'], ['/chairside/chairside-40.html', '\u0633\u0645\u0627\u0646 \u0645\u0648\u0642\u062a \u06cc\u0627 \u062f\u0627\u0626\u0645 \u0628\u0631\u0627\u06cc \u0647\u0645\u0627\u0647\u0646\u06af\u06cc \u0631\u0646\u06af \u0631\u0648\u06a9\u0634\\u200c\u0647\u0627'], ['/episodes/episode-68.html', '\u0639\u0648\u0627\u0645\u0644 \u0645\u0624\u062b\u0631 \u0628\u0631 \u0631\u0646\u06af \u0646\u0647\u0627\u06cc\u06cc']]"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways [{'pathway': 'fixed-pros', 'after': 'notecast/episode-3', 'why': 'STRONG'}, {'pathway': 'ceramics', 'after': 'notecast/episode-3', 'why': 'STRONG'}]"
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
      "insight/en/insight-107.html",
      "insight/index.html",
      "insight/insight-107.html",
      "insight/insight107-1.webp",
      "plus/assistant-tags.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: .dentcast/queue-frozen-des.json, dentcast-brain.json, dentcast-hashtag-reference.json, index.html, insight/en/insight-107.html, insight/index.html, insight/insight-107.html, insight/insight107-1.webp, plus/assistant-tags.json, plus/content-index.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
