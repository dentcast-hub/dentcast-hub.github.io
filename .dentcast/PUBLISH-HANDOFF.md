# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-57"
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
    "content_id": "sharehub/share-57",
    "context": {
      "approvals": [
        {
          "decision": "\u0641\u0631\u06cc\u0645\u200c\u0648\u0631\u06a9 RPD\u061b \u0622\u06cc\u0627 \u067e\u0631\u06cc\u0646\u062a \u0633\u0647\u200c\u0628\u0639\u062f\u06cc \u0641\u0644\u0632 \u0648\u0627\u0642\u0639\u0627\u064b \u0628\u0647\u062a\u0631 \u0627\u0632 \u0631\u06cc\u062e\u062a\u0647\u200c\u06af\u0631\u06cc \u0627\u0633\u062a\u061f",
          "evidence": [
            "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 377c7362e473ac9b97a068016b3a8779fe0b3563bd7c602ba9e2fc7ffe56426a)",
            "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/SHA256SUMS (frozen files, sha256 acf35dbd03f1c70814ccdb6d13adc3425be7c94441d2623343f2fc4d40d0945e)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u062f\u0642\u062a\u0650 \u0627\u0646\u062f\u0627\u0632\u0647\u200c\u06af\u06cc\u0631\u06cc\u200c\u0634\u062f\u0647\u0654 \u06cc\u06a9 \u0641\u0631\u06cc\u0645\u200c\u0648\u0631\u06a9 \u067e\u0627\u0631\u0633\u06cc\u0644 \u0628\u0627 \u0646\u0634\u0633\u062a\u0646\u0634 \u062f\u0631 \u062f\u0647\u0627\u0646 \u06cc\u06a9\u06cc \u0646\u06cc\u0633\u062a. \u06cc\u06a9 \u0645\u0631\u0648\u0631 \u0633\u06cc\u0633\u062a\u0645\u0627\u062a\u06cc\u06a9 \u0648 \u06cc\u06a9 \u0645\u0637\u0627\u0644\u0639\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0646\u0634\u0627\u0646 \u0645\u06cc\u200c\u062f\u0647\u0646\u062f \u067e\u0631\u06cc\u0646\u062a \u0641\u0644\u0632 \u0648 \u0631\u06cc\u062e\u062a\u0647\u200c\u06af\u0631\u06cc \u0631\u0627 \u0686\u0637\u0648\u0631 \u0628\u0627\u06cc\u062f \u0628\u0627 \u0647\u0645 \u0633\u0646\u062c\u06cc\u062f.",
          "evidence": [
            "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 377c7362e473ac9b97a068016b3a8779fe0b3563bd7c602ba9e2fc7ffe56426a)",
            "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/SHA256SUMS (frozen files, sha256 acf35dbd03f1c70814ccdb6d13adc3425be7c94441d2623343f2fc4d40d0945e)"
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
            "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 377c7362e473ac9b97a068016b3a8779fe0b3563bd7c602ba9e2fc7ffe56426a)",
            "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/SHA256SUMS (frozen files, sha256 acf35dbd03f1c70814ccdb6d13adc3425be7c94441d2623343f2fc4d40d0945e)"
          ],
          "kind": "queue_approvals_v1",
          "queue_ref": "queue/27-sharehub-rpd-3d-printed-vs-cast-framework",
          "receipt_sha256": "6c010a76a70ef23787eeb69350ce524574d4365d3f596e43b0253eb94e37d711",
          "sha256sums": "acf35dbd03f1c70814ccdb6d13adc3425be7c94441d2623343f2fc4d40d0945e",
          "status_sha256": "377c7362e473ac9b97a068016b3a8779fe0b3563bd7c602ba9e2fc7ffe56426a"
        },
        {
          "evidence": [
            "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 377c7362e473ac9b97a068016b3a8779fe0b3563bd7c602ba9e2fc7ffe56426a)",
            "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/SHA256SUMS (frozen files, sha256 acf35dbd03f1c70814ccdb6d13adc3425be7c94441d2623343f2fc4d40d0945e)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/01-\u0645\u062a\u0646.md (frozen; its opening paragraph was approved in preparation)"
        },
        {
          "english": {
            "evidence": [
              "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md (frozen)"
            ],
            "path": "sharehub/en/share-57.html",
            "status": "ready"
          },
          "evidence": [
            "generated by tools/queue_ledger.py from the frozen item (receipt 6c010a76a70ef23787eeb69350ce524574d4365d3f596e43b0253eb94e37d711)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 377c7362e473ac9b97a068016b3a8779fe0b3563bd7c602ba9e2fc7ffe56426a)",
                "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/SHA256SUMS (frozen files, sha256 acf35dbd03f1c70814ccdb6d13adc3425be7c94441d2623343f2fc4d40d0945e)",
                "mechanical defaults: {\"field\": \"backlinks_47\", \"rule\": \"11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md 4.7 has no frozen back-link with its link text \u2014 none is added\", \"value\": []}; {\"field\": \"pathway\", \"rule\": \"mechanical pathway rule\", \"value\": null}; {\"rule\": \"hashtag not in the library and not ordered minted: dropped\", \"tags\": [\"#Share_Hub\"]}; {\"field\": \"author\", \"rule\": \"the author/source of the latest sharehub brain entry\", \"value\": {\"name\": \"\u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646\", \"source\": \"https://dentcast.org\"}}"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md; brain entry /sharehub/share-57.html"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md verbatim -> sharehub/en/share-57.html"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md list; hashtag_ref.py --sync/--check passed"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md; applied ['\u0627\u0633\u06a9\u0646\u0631 \u062f\u0627\u062e\u0644\\u200c\u062f\u0647\u0627\u0646\u06cc']; 4.7 []; 4.9 [['/sharehub/share-55.html', '\u0637\u0631\u0627\u062d\u06cc RPD \u062f\u0631 \u0639\u0635\u0631 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u061b \u0686\u0647 \u0686\u06cc\u0632\u06cc \u0648\u0627\u0642\u0639\u0627\u064b \u062a\u063a\u06cc\u06cc\u0631 \u06a9\u0631\u062f\u0647 \u0627\u0633\u062a\u061f'], ['/sharehub/share-54.html', '\u062b\u0628\u062a \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644 \u062f\u0647\u0627\u0646 \u0628\u06cc\\u200c\u062f\u0646\u062f\u0627\u0646']]"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "pathway_place.py mechanical rule: [{'pathway': 'implant-prosthetic', 'after': 'sharehub/share-55', 'why': 'STRONG'}, {'pathway': 'digital', 'after': 'dentai/dentai-21', 'why': 'STRONG'}]"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q5; seven-line rotation {'added': '<a href=\"/sharehub/share-57.html\">\u0641\u0631\u06cc\u0645\\u200c\u0648\u0631\u06a9 RPD\u061b \u0622\u06cc\u0627 \u067e\u0631\u06cc\u0646\u062a \u0633\u0647\\u200c\u0628\u0639\u062f\u06cc \u0641\u0644\u0632 \u0648\u0627\u0642\u0639\u0627\u064b \u0628\u0647\u062a\u0631 \u0627\u0632 \u0631\u06cc\u062e\u062a\u0647\\u200c\u06af\u0631\u06cc \u0627\u0633\u062a\u061f</a>', 'dropped': '<li>\u06cc\u06a9 \u0648\u06cc\u062f\u06cc\u0648 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/dentcast-plus/video-15.html\">\u0631\u0627\u0628\u0631\u062f\u0645 \u0639\u0645\u0631 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0631\u0627 \u0628\u06cc\u0634\u062a\u0631 \u0645\u06cc\\u200c\u06a9\u0646\u062f\u061f</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f</li>'}"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/05-DES-Fidelity installed by queue_install_des.py (record c415e737845cdd3526fe40efc7ef90a7afdeba237e69f90a38f4a81e646c820f)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md pillar/subtopic (brain entry written by queue_apply)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/27-sharehub-rpd-3d-printed-vs-cast-framework/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q4.9: not a Challenge (the queue lane refuses Challenge items)"
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
          "queue_manifest check complete; dry run clean (27-sharehub-rpd-3d-printed-vs-cast-framework)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue_apply receipt sha256 c0de39fc3ad8e661faf794d982c62218743d6c4d35d75cd9fb04d7f648a2ba65"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.8 ['\u0627\u0633\u06a9\u0646\u0631 \u062f\u0627\u062e\u0644\\u200c\u062f\u0647\u0627\u0646\u06cc']; 4.7 []; 4.9 [['/sharehub/share-55.html', '\u0637\u0631\u0627\u062d\u06cc RPD \u062f\u0631 \u0639\u0635\u0631 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u061b \u0686\u0647 \u0686\u06cc\u0632\u06cc \u0648\u0627\u0642\u0639\u0627\u064b \u062a\u063a\u06cc\u06cc\u0631 \u06a9\u0631\u062f\u0647 \u0627\u0633\u062a\u061f'], ['/sharehub/share-54.html', '\u062b\u0628\u062a \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644 \u062f\u0647\u0627\u0646 \u0628\u06cc\\u200c\u062f\u0646\u062f\u0627\u0646']]"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways [{'pathway': 'implant-prosthetic', 'after': 'sharehub/share-55', 'why': 'STRONG'}, {'pathway': 'digital', 'after': 'dentai/dentai-21', 'why': 'STRONG'}]"
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
      ".dentcast/des-fidelity-plans/sharehub/share-57.json",
      ".dentcast/queue-frozen-des.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
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
      "sharehub/en/share-57.html",
      "sharehub/index.html",
      "sharehub/share-57.html",
      "sharehub/share57-fig1.webp",
      "sharehub/share57-fig2.webp",
      "sharehub/share57-fig3.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: .dentcast/des-fidelity-plans/sharehub/share-57.json, .dentcast/queue-frozen-des.json, dentcast-brain.json, dentcast-hashtag-reference.json, dentcast_cabinet_full_catalog.json, index.html, plus/assistant-tags.json, plus/cabinet-papers.json, plus/cabinet-search.json, plus/content-index.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, sharehub/en/share-57.html, sharehub/index.html, sharehub/share-57.html, sharehub/share57-fig1.webp, sharehub/share57-fig2.webp, sharehub/share57-fig3.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
