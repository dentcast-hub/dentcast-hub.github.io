# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-53"
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
    "content_id": "sharehub/share-53",
    "context": {
      "approvals": [
        {
          "decision": "\u0648\u0642\u062a\u06cc \u0642\u062f\u0627\u0645\u06cc\u200c\u0647\u0627\u06cc \u067e\u0627\u06cc\u06cc\u0646 \u0628\u0631\u0627\u06cc \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u0628\u0627\u0644\u0627 \u0641\u0636\u0627 \u0646\u0645\u06cc\u200c\u06af\u0630\u0627\u0631\u0646\u062f\u060c \u0686\u0647 \u06a9\u0646\u06cc\u0645\u061f",
          "evidence": [
            "queue/20-sharehub-lower-incisal-reduction-anterior-space/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/20-sharehub-lower-incisal-reduction-anterior-space/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 6c95f0be26e44663cc080534fbe0757176bb0f93cf376b6d8ccb5a63484e0a67)",
            "queue/20-sharehub-lower-incisal-reduction-anterior-space/SHA256SUMS (frozen files, sha256 f723efcd26b13596376e7a49953227a54e23298f2cb6fedf8de8cf4eb1dfb1fc)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0644\u0628\u0647 \u0642\u062f\u0627\u0645\u06cc\u200c\u0647\u0627\u06cc \u067e\u0627\u06cc\u06cc\u0646 \u0628\u0631\u0627\u06cc \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u0628\u0627\u0644\u0627 \u062c\u0627 \u0646\u0645\u06cc\u200c\u06af\u0630\u0627\u0631\u062f\u061b \u062a\u0631\u0627\u0634 \u0627\u0646\u0633\u06cc\u0632\u0627\u0644 \u06a9\u0650\u06cc \u062c\u0632\u0626\u06cc \u0627\u0632 \u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646 \u0627\u0633\u062a \u0648 \u06a9\u0650\u06cc \u0645\u0634\u06a9\u0644 \u0627\u0632 OVD\u060c \u0631\u0627\u0628\u0637\u0647 \u0641\u06a9\u06cc \u06cc\u0627 \u0631\u0648\u06cc\u0634 \u062c\u0628\u0631\u0627\u0646\u06cc \u0627\u0633\u062a\u061f",
          "evidence": [
            "queue/20-sharehub-lower-incisal-reduction-anterior-space/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
            "queue/20-sharehub-lower-incisal-reduction-anterior-space/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 6c95f0be26e44663cc080534fbe0757176bb0f93cf376b6d8ccb5a63484e0a67)",
            "queue/20-sharehub-lower-incisal-reduction-anterior-space/SHA256SUMS (frozen files, sha256 f723efcd26b13596376e7a49953227a54e23298f2cb6fedf8de8cf4eb1dfb1fc)"
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
            "queue/20-sharehub-lower-incisal-reduction-anterior-space/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 6c95f0be26e44663cc080534fbe0757176bb0f93cf376b6d8ccb5a63484e0a67)",
            "queue/20-sharehub-lower-incisal-reduction-anterior-space/SHA256SUMS (frozen files, sha256 f723efcd26b13596376e7a49953227a54e23298f2cb6fedf8de8cf4eb1dfb1fc)"
          ],
          "kind": "queue_approvals_v1",
          "queue_ref": "queue/20-sharehub-lower-incisal-reduction-anterior-space",
          "receipt_sha256": "1faa6d5e86d52bdaebc32ea52fb4cf9059df0a2813eb88158060b53990daa55e",
          "sha256sums": "f723efcd26b13596376e7a49953227a54e23298f2cb6fedf8de8cf4eb1dfb1fc",
          "status_sha256": "6c95f0be26e44663cc080534fbe0757176bb0f93cf376b6d8ccb5a63484e0a67"
        },
        {
          "evidence": [
            "queue/20-sharehub-lower-incisal-reduction-anterior-space/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 6c95f0be26e44663cc080534fbe0757176bb0f93cf376b6d8ccb5a63484e0a67)",
            "queue/20-sharehub-lower-incisal-reduction-anterior-space/SHA256SUMS (frozen files, sha256 f723efcd26b13596376e7a49953227a54e23298f2cb6fedf8de8cf4eb1dfb1fc)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/20-sharehub-lower-incisal-reduction-anterior-space/01-\u0645\u062a\u0646.md (frozen; its opening paragraph was approved in preparation)"
        },
        {
          "english": {
            "evidence": [
              "queue/20-sharehub-lower-incisal-reduction-anterior-space/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md (frozen)"
            ],
            "path": "sharehub/en/share-53.html",
            "status": "ready"
          },
          "evidence": [
            "generated by tools/queue_ledger.py from the frozen item (receipt 1faa6d5e86d52bdaebc32ea52fb4cf9059df0a2813eb88158060b53990daa55e)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "queue/20-sharehub-lower-incisal-reduction-anterior-space/00-\u0648\u0636\u0639\u06cc\u062a.md (founder approvals table, sha256 6c95f0be26e44663cc080534fbe0757176bb0f93cf376b6d8ccb5a63484e0a67)",
                "queue/20-sharehub-lower-incisal-reduction-anterior-space/SHA256SUMS (frozen files, sha256 f723efcd26b13596376e7a49953227a54e23298f2cb6fedf8de8cf4eb1dfb1fc)",
                "mechanical defaults: {\"field\": \"backlinks_47\", \"rule\": \"11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md 4.7 has no frozen back-link with its link text \u2014 none is added\", \"value\": []}; {\"field\": \"pathway\", \"rule\": \"mechanical pathway rule\", \"value\": null}; {\"rule\": \"hashtag not in the library and not ordered minted: dropped\", \"tags\": [\"#Share_Hub\"]}; {\"field\": \"author\", \"rule\": \"the author/source of the latest sharehub brain entry\", \"value\": {\"name\": \"\u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646\", \"source\": \"https://dentcast.org\"}}"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/20-sharehub-lower-incisal-reduction-anterior-space/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md; brain entry /sharehub/share-53.html"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/20-sharehub-lower-incisal-reduction-anterior-space/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md verbatim -> sharehub/en/share-53.html"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/20-sharehub-lower-incisal-reduction-anterior-space/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md list; hashtag_ref.py --sync/--check passed"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/20-sharehub-lower-incisal-reduction-anterior-space/11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md; applied ['\u0633\u0627\u06cc\u06cc\u062f\u0647', '\u0627\u0631\u062a\u0641\u0627\u0639 \u0639\u0645\u0648\u062f\u06cc \u0627\u06a9\u0644\u0648\u0698\u0646', '\u0633\u0646\u062a\u0631\u06a9 \u0631\u06cc\u0644\u06cc\u0634\u0646', '\u0645\u0641\u0635\u0644 \u06af\u06cc\u062c\u06af\u0627\u0647\u06cc\\u200c\u0641\u06a9\u06cc', '\u062c\u0631\u0627\u062d\u06cc \u0627\u0641\u0632\u0627\u06cc\u0634 \u0637\u0648\u0644 \u062a\u0627\u062c', 'Dahl Concept']; 4.7 []; 4.9 [['/chairside/chairside-19.html', '\u062f\u0646\u062f\u0627\u0646 \u0645\u0642\u0627\u0628\u0644 \u0648 \u0641\u0636\u0627\u06cc \u0628\u0627\u0632\u0633\u0627\u0632\u06cc'], ['/insight/insight-43.html', '\u0628\u0627\u0632\u0633\u0627\u0632\u06cc VD \u0628\u062f\u0648\u0646 \u0627\u0633\u062a\u0627\u067e \u062e\u0644\u0641\u06cc'], ['/insight/insight-10.html', '\u0641\u0636\u0627\u06cc \u0642\u062f\u0627\u0645\u06cc \u062f\u0631 \u062f\u06cc\u067e \u0628\u0627\u06cc\u062a']]"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "pathway_place.py mechanical rule: [{'pathway': 'treatment-planning', 'after': 'insight/insight-6', 'why': 'STRONG'}, {'pathway': 'fixed-pros', 'after': 'chairside/chairside-50', 'why': 'STRONG'}]"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/20-sharehub-lower-incisal-reduction-anterior-space/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q5; seven-line rotation {'added': '<a href=\"/sharehub/share-53.html\">\u0648\u0642\u062a\u06cc \u0642\u062f\u0627\u0645\u06cc\\u200c\u0647\u0627\u06cc \u067e\u0627\u06cc\u06cc\u0646 \u0628\u0631\u0627\u06cc \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u0628\u0627\u0644\u0627 \u0641\u0636\u0627 \u0646\u0645\u06cc\\u200c\u06af\u0630\u0627\u0631\u0646\u062f\u060c \u0686\u0647 \u06a9\u0646\u06cc\u0645\u061f</a>', 'dropped': '<li><a href=\"/chairside/chairside-53.html\">\u0686\u0631\u0627 \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0642\u0628\u0644\u0627\u064b \u0628\u0647 \u0647\u0645 \u0686\u0633\u0628\u06cc\u062f\u0647 \u0628\u0648\u062f\u0646\u062f\u060c \u0641\u0627\u0635\u0644\u0647 \u0627\u06cc\u062c\u0627\u062f \u0645\u06cc\\u200c\u0634\u0648\u062f\u061f</a></li>'}"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/20-sharehub-lower-incisal-reduction-anterior-space/05-DES-Fidelity installed by queue_install_des.py (record 74deaa373b9d99c412e6635baeb16cfe4628ea18e1ed2ee179189e47f3cf6fd7)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/20-sharehub-lower-incisal-reduction-anterior-space/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md pillar/subtopic (brain entry written by queue_apply)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue/20-sharehub-lower-incisal-reduction-anterior-space/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q4.9: not a Challenge (the queue lane refuses Challenge items)"
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
          "queue_manifest check complete; dry run clean (20-sharehub-lower-incisal-reduction-anterior-space)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue_apply receipt sha256 1c6c0f04fa707ea507bf15ca24bc60c111404cee989c7a37f6b6748f5b0d03af"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.8 ['\u0633\u0627\u06cc\u06cc\u062f\u0647', '\u0627\u0631\u062a\u0641\u0627\u0639 \u0639\u0645\u0648\u062f\u06cc \u0627\u06a9\u0644\u0648\u0698\u0646', '\u0633\u0646\u062a\u0631\u06a9 \u0631\u06cc\u0644\u06cc\u0634\u0646', '\u0645\u0641\u0635\u0644 \u06af\u06cc\u062c\u06af\u0627\u0647\u06cc\\u200c\u0641\u06a9\u06cc', '\u062c\u0631\u0627\u062d\u06cc \u0627\u0641\u0632\u0627\u06cc\u0634 \u0637\u0648\u0644 \u062a\u0627\u062c', 'Dahl Concept']; 4.7 []; 4.9 [['/chairside/chairside-19.html', '\u062f\u0646\u062f\u0627\u0646 \u0645\u0642\u0627\u0628\u0644 \u0648 \u0641\u0636\u0627\u06cc \u0628\u0627\u0632\u0633\u0627\u0632\u06cc'], ['/insight/insight-43.html', '\u0628\u0627\u0632\u0633\u0627\u0632\u06cc VD \u0628\u062f\u0648\u0646 \u0627\u0633\u062a\u0627\u067e \u062e\u0644\u0641\u06cc'], ['/insight/insight-10.html', '\u0641\u0636\u0627\u06cc \u0642\u062f\u0627\u0645\u06cc \u062f\u0631 \u062f\u06cc\u067e \u0628\u0627\u06cc\u062a']]"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways [{'pathway': 'treatment-planning', 'after': 'insight/insight-6', 'why': 'STRONG'}, {'pathway': 'fixed-pros', 'after': 'chairside/chairside-50', 'why': 'STRONG'}]"
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
      ".dentcast/des-fidelity-plans/sharehub/share-53.json",
      ".dentcast/des-source-markers.json",
      ".dentcast/queue-frozen-des.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast_cabinet_full_catalog.json",
      "index.html",
      "plus/assistant-tags.json",
      "plus/cabinet-papers.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-53.html",
      "sharehub/index.html",
      "sharehub/share-53.html",
      "sharehub/share53-fig1.webp",
      "sharehub/share53-fig2.webp",
      "sharehub/share53-fig3.webp",
      "sharehub/share53-fig4.webp",
      "sharehub/share53-fig5.webp",
      "sharehub/share53-fig6.webp",
      "sharehub/share53-fig7.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: .dentcast/des-fidelity-plans/sharehub/share-53.json, .dentcast/des-source-markers.json, .dentcast/queue-frozen-des.json, dentcast-brain.json, dentcast-hashtag-reference.json, dentcast_cabinet_full_catalog.json, index.html, plus/assistant-tags.json, plus/cabinet-papers.json, plus/content-index.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, sharehub/en/share-53.html, sharehub/index.html, sharehub/share-53.html, sharehub/share53-fig1.webp, sharehub/share53-fig2.webp, sharehub/share53-fig3.webp, sharehub/share53-fig4.webp, sharehub/share53-fig5.webp, sharehub/share53-fig6.webp, sharehub/share53-fig7.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
