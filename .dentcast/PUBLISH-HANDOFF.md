# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "litecast/lite-CAST41"
- Status: in_progress
- Next canonical step: "C.4.10.1"
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
      }
    ],
    "target_paths": [
      "litecast/index.html",
      "litecast/lite-CAST41.html",
      "litecast/lite-glossary.json"
    ]
  },
  "reconciliation": null,
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
