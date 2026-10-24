# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "litecast/lite-CAST41"
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
    "category": "litecast",
    "content_id": "litecast/lite-CAST41",
    "context": {
      "approvals": [
        {
          "decision": "Use the user-provided chairside case rewritten as approved opening of LiteCast 41",
          "evidence": [
            "User requested the previously drafted and SEO-revised complete article be published on 2026-10-24"
          ],
          "scope": "authored-intro",
          "status": "confirmed"
        },
        {
          "decision": "\u062f\u0646\u062f\u0627\u0646\u0645 \u062f\u0631\u062f \u0646\u062f\u0627\u0631\u062f\u061b \u0686\u0631\u0627 \u0628\u0627\u06cc\u062f \u0639\u0635\u0628\u200c\u06a9\u0634\u06cc \u06cc\u0627 \u0639\u0635\u0628\u200c\u06a9\u0634\u06cc \u0645\u062c\u062f\u062f \u06a9\u0646\u0645\u061f",
          "evidence": [
            "Article title from previous assistant draft accepted for publication in current conversation"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0622\u06cc\u0627 \u062f\u0646\u062f\u0627\u0646 \u0628\u062f\u0648\u0646 \u062f\u0631\u062f \u0646\u06cc\u0627\u0632 \u0628\u0647 \u0639\u0635\u0628\u200c\u06a9\u0634\u06cc \u062f\u0627\u0631\u062f\u061f \u0686\u0631\u0627 \u062f\u0646\u062f\u0627\u0646 \u0639\u0635\u0628\u200c\u06a9\u0634\u06cc\u200c\u0634\u062f\u0647 \u0628\u062f\u0648\u0646 \u062f\u0631\u062f \u0639\u0641\u0648\u0646\u062a \u0645\u06cc\u200c\u06a9\u0646\u062f\u061f \u0639\u0644\u062a \u0639\u0635\u0628\u200c\u06a9\u0634\u06cc \u0645\u062c\u062f\u062f\u060c \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647 \u0646\u0627\u0645\u0648\u0641\u0642 \u0648 \u0632\u0645\u0627\u0646 \u062a\u06a9\u0631\u0627\u0631 \u0622\u0646 \u0631\u0627 \u0628\u0634\u0646\u0627\u0633\u06cc\u062f.",
          "evidence": [
            "SEO description based on the immediately prior finalized text, requested for publication"
          ],
          "scope": "caption",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "evidence": [
            "User requested publishing after approving the SEO-structured LiteCast text, 2026-10-24"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "agent_authored",
          "source_ref": "Current conversation: user authorized publishing the previously written LiteCast story"
        },
        {
          "builder_ref": "Static LiteCast index HTML inspected at main ab4f00a71445a2c811e84c3712330ef928e910f0",
          "evidence": [
            "Inspected live last LiteCast page, all 40 JSON entries, and static landing list"
          ],
          "kind": "first_cut_scope_audit_v1",
          "landing_mode": "included",
          "landing_path": "litecast/index.html",
          "observed_changed_paths": [
            "litecast/lite-CAST41.html",
            "litecast/index.html",
            "litecast/lite-glossary.json"
          ],
          "related_changed_paths": []
        },
        {
          "attached_paper": false,
          "category_isolated": true,
          "challenge": false,
          "des_fidelity": "skipped per canonical LiteCast exception",
          "kind": "litecast_routing",
          "source": "litecast/lite-glossary.json"
        },
        {
          "capsules": [
            "/litecast/lite-CAST21.html",
            "/litecast/lite-CAST28.html",
            "/litecast/lite-CAST23.html"
          ],
          "inline": [
            "/litecast/lite-CAST28.html",
            "/litecast/lite-CAST23.html"
          ],
          "kind": "semantic_related",
          "reason": "Relevant LiteCast patient articles about root-canal treatment and restoration"
        },
        {
          "kind": "pulse_not_applicable",
          "reason": "LiteCast excluded from Pulse after checking historical homepage and source verify_publish.py"
        },
        {
          "basis": "Only existing canonical concepts in dentcast-hashtag-reference.json; root canal intent remains in actual title/body/SEO keywords",
          "canonical": [
            "#\u062f\u0631\u0645\u0627\u0646_\u0631\u06cc\u0634\u0647",
            "#\u0631\u0648\u06a9\u0634_\u062f\u0646\u062f\u0627\u0646",
            "#\u0633\u0644\u0627\u0645\u062a_\u062f\u0647\u0627\u0646",
            "#\u0622\u06af\u0627\u0647\u06cc_\u062f\u0631\u0645\u0627\u0646\u06cc"
          ],
          "kind": "hashtag_reconciliation",
          "previous": [
            "#\u0639\u0635\u0628_\u06a9\u0634\u06cc",
            "#\u062f\u0631\u0645\u0627\u0646_\u0631\u06cc\u0634\u0647",
            "#\u062f\u0646\u062f\u0627\u0646_\u0639\u0635\u0628_\u06a9\u0634\u06cc",
            "#\u0639\u0641\u0648\u0646\u062a_\u062f\u0646\u062f\u0627\u0646",
            "#\u0622\u06af\u0627\u0647\u06cc_\u062f\u0631\u0645\u0627\u0646\u06cc"
          ]
        },
        {
          "english": {
            "evidence": [
              "Canonical LiteCast .ir-only category, module 12 Phase D exemption"
            ],
            "path": null,
            "status": "exempt"
          },
          "evidence": [
            "All applicable steps through C.6 are resolved; public article and internal links exist at first cut; canonical tags adjusted for second cut; no unresolved user question or external action"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "Reviewed text against ESE 2023 S3 guideline DOI 10.1111/iej.13974: asymptomatic disease/retreatment contextualized; LiteCast DES/Fidelity exception recorded"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.14 skipped: this is an ordinary patient explainer and no challenge-answer material"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "LiteCast41 registered only in litecast/lite-glossary.json; no specialist brain/pillar injection"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "Actual LiteCast41 HTML contains in-body links to 28/23 and patient-related capsules to 21/28/23; no specialist capsules"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "Canonical concept match to dentcast-hashtag-reference.json: \u062f\u0631\u0645\u0627\u0646_\u0631\u06cc\u0634\u0647, \u0631\u0648\u06a9\u0634_\u062f\u0646\u062f\u0627\u0646, \u0633\u0644\u0627\u0645\u062a_\u062f\u0647\u0627\u0646, \u0622\u06af\u0627\u0647\u06cc_\u062f\u0631\u0645\u0627\u0646\u06cc"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "LiteCast41 JSON title/caption and page schema/head/index agree; entry is the 41st record"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "LiteCast patient format is excluded from premium specialist pathways and bundles by canonical module 10"
              ],
              "scope": "pathways",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "Category convention: main Pulse does not announce LiteCast; actual verify_publish.py explicitly bypasses LiteCast Pulse assertion"
              ],
              "scope": "pulse",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "Canonical LiteCast .ir-only English mirror exemption, no bilingual toggle"
              ],
              "scope": "english",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "User directed publication of the SEO-revised LiteCast text in this conversation; exact frozen title and caption approvals are attached"
              ],
              "scope": "author_approvals",
              "status": "resolved"
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
          "Completed applicable rules using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable 0 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable A using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable B.1 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable B.2 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable B.3 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable B.3.5 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable B.4 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable B.4.7 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable B.4.8 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable B.4.9 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": "Canonical LiteCast-only category exception at B.5; excluded from specialist/general route",
        "status": "skipped"
      },
      {
        "evidence": [
          "Completed applicable C.0 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "C.0",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable C.0.1 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable C.0.2 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Page cloned from lite-CAST40 with new public article and .ir metadata"
        ],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Litecast glossary entry #41 appended without altering history"
        ],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable C.1 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable C.2 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Applied exact internal links to lite-CAST28 and lite-CAST23"
        ],
        "id": "C.0.5",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Applied approved LiteCast-only related capsules for 21, 28 and 23"
        ],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Canonical LiteCast-only category exception at C.2.4; excluded from specialist/general route",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Canonical LiteCast-only category exception at C.2.5; excluded from specialist/general route",
        "status": "skipped"
      },
      {
        "evidence": [
          "Added #41 first in static category index"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable C.3 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed applicable C.4 using the approved LiteCast41 text, inspected category sources and pinned main SHA"
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
        "reason": "Canonical LiteCast-only category exception at C.4.5; excluded from specialist/general route",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Canonical LiteCast-only category exception at C.4.5-b; excluded from specialist/general route",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Canonical LiteCast-only category exception at C.4.6; excluded from specialist/general route",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": "Canonical LiteCast-only category exception at C.4.7; excluded from specialist/general route",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.7-b",
        "module": "05-semantic-linking.md",
        "reason": "Canonical LiteCast-only category exception at C.4.7-b; excluded from specialist/general route",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": "Canonical LiteCast-only category exception at C.4.8; excluded from specialist/general route",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": "Canonical LiteCast-only category exception at C.4.9; excluded from specialist/general route",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "LiteCast patient-explainer without attached paper; paper Drive ingestion inapplicable",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "LiteCast patient-explainer without paper or citation-to-score; paper extraction inapplicable",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No paper file / paper metadata to process; canonical LiteCast exception",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": "LiteCast excluded from professional flashcards (DefinedTermSet)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": "LiteCast excluded from scored quiz extraction",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": "Canonical LiteCast exclusion from DES and Fidelity; no research scoring record",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.14",
        "module": "09-challenge.md",
        "reason": "Ordinary LiteCast question-answer explainer, not a Challenge item",
        "status": "skipped"
      },
      {
        "evidence": [
          "Reviewed tags against dentcast-hashtag-reference.json at main ab4f00a71445a2c811e84c3712330ef928e910f0; reused #\u062f\u0631\u0645\u0627\u0646_\u0631\u06cc\u0634\u0647, #\u0631\u0648\u06a9\u0634_\u062f\u0646\u062f\u0627\u0646, #\u0633\u0644\u0627\u0645\u062a_\u062f\u0647\u0627\u0646 and #\u0622\u06af\u0627\u0647\u06cc_\u062f\u0631\u0645\u0627\u0646\u06cc"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Confirmed LiteCast41 glossary entry title, caption, canonical tag spelling, keyword content, and append position; specialist brain not edited"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": "No specialist brain pillar or structured subtopic for LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": "LiteCast patient material excluded from specialist learning pathways",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": "LiteCast excluded from specialist pathway bundles",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": "LiteCast has no established homepage Pulse convention; source verify_publish explicitly exempts LiteCast from Pulse link verification",
        "status": "skipped"
      }
    ],
    "target_paths": [
      "litecast/index.html",
      "litecast/lite-CAST41.html",
      "litecast/lite-glossary.json"
    ]
  },
  "reconciliation": {
    "note": "Complete verified third delivery after audited post-cut reconciliation"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
