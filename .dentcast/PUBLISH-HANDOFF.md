# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-53"
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
    "content_id": "chairside/chairside-53",
    "context": {
      "approvals": [
        {
          "decision": "\u0686\u0631\u0627 \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0642\u0628\u0644\u0627\u064b \u0628\u0647 \u0647\u0645 \u0686\u0633\u0628\u06cc\u062f\u0647 \u0628\u0648\u062f\u0646\u062f\u060c \u0641\u0627\u0635\u0644\u0647 \u0627\u06cc\u062c\u0627\u062f \u0645\u06cc\u200c\u0634\u0648\u062f\u061f",
          "evidence": [
            "Founder-approved article title."
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0628\u06cc\u0645\u0627\u0631 \u0645\u06cc\u200c\u06af\u0641\u062a \u0631\u0648\u0632 \u062a\u062d\u0648\u06cc\u0644 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627 \u0628\u06cc\u0646 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0641\u0627\u0635\u0644\u0647\u200c\u0627\u06cc \u0646\u0628\u0648\u062f. \u0648\u0642\u062a\u06cc \u0641\u0627\u0635\u0644\u0647 \u0628\u0647\u200c\u062a\u062f\u0631\u06cc\u062c \u0628\u0627\u0632 \u0645\u06cc\u200c\u0634\u0648\u062f\u060c \u0686\u0647 \u0686\u06cc\u0632\u0647\u0627\u06cc\u06cc \u0631\u0627 \u0628\u0627\u06cc\u062f \u0628\u0631\u0631\u0633\u06cc \u06a9\u0646\u06cc\u0645\u061f",
          "evidence": [
            "Agent proposal under standing acceptance."
          ],
          "scope": "caption",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "kind": "ledger_order_v2"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "evidence": [
            "Verified the opening paragraph is identical in chairside/chairside-53.html."
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "Founder-approved article.md opening paragraph"
        },
        {
          "english": {
            "evidence": [
              "Checked the inverse toggles and English robots policy."
            ],
            "path": "chairside/en/chairside-53.html",
            "status": "ready"
          },
          "evidence": [
            "Publication decisions resolved in C.6."
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "Approved DES v3.7 COMMENTARY 15/E; quotes checked; Fidelity null."
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Standard Chairside with no challenge."
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "Treatment planning / comprehensive diagnosis."
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "Two related Chairside cases; no citation or inline target."
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "Three canonical tags; hashtag reference check passed."
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "Exact Chairside brain schema and landing listing."
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "Only borderline candidates; no full pathway placement."
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "Seven items, newest title at top."
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "Full English mirror and inverse toggles."
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "Founder approved article, image, DES and publication; caption per standing acceptance."
              ],
              "scope": "author_approvals",
              "status": "resolved"
            }
          ]
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "sha256": "f4d39861a334010436256a3cb4be5c456216355b0c2c5e133d7d6ab4a454ba93"
        },
        {
          "sha256": "c08cde375a2aace265b127f24df4f6fadd25d1ac87f677e41265b7d01e60b7ff"
        },
        {
          "sha256": "c5d69f4db6d290038898da741ccae2d40b8522cd1572a6be96f69c9c7e0af448"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": []
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Active modular route at dbc73a3; verified Chairside readpack, path-selected global rules, connected GitHub branch creation."
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Approved article.md and WebP supplied; no paper attached. Direct publication."
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-brain.json chairside-52 and chairside/chairside-52.html; active PILLARS taxonomy."
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder explicitly selected Chairside."
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Latest Chairside 52, next free Chairside 53."
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder-approved article.md; SHA-256 bound."
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder instructed exact text; reviewed prose and applied zero rewrites."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder-supplied 1536\u00d7784 WebP and exact alt from article.md."
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No paper file or DOI supplied."
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "COMMENTARY basket 1, approved full body and approved DES v3.7 JSON."
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Standard Chairside case narrative, no Challenge."
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse title-only announcement follows Chairside precedent."
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.0",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only steps do not apply to Chairside",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only steps do not apply to Chairside",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only steps do not apply to Chairside",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only steps do not apply to Chairside",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only steps do not apply to Chairside",
        "status": "skipped"
      },
      {
        "evidence": [
          "Previous same-category template chairside/chairside-52.html, untouched."
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Chairside template rendered; extracted eight paragraphs equal the approved article and figure precedes prose."
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.0.5",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-specific inline links",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-specific explore links",
        "status": "skipped"
      },
      {
        "evidence": [
          "Live taxonomy: treatment-planning/comprehensive-diagnosis, since the focus is diagnosing migration before a prosthetic decision."
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "One explore section with glossary and treatment-planning capsules, same template markup."
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Top numbered Chairside landing row."
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Chairside 53 date fields set to 2026-11-12."
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Same-category template untouched, verified with git diff --quiet."
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
        "reason": "NoteCast-only parent navigation",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "No audio or NoteCast pair",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Chairside template has no ep-nav",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "No attached paper",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No attached paper",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No attached paper or paper credit",
        "status": "skipped"
      },
      {
        "evidence": [
          "Founder approved supplied DES v3.7 JSON, 15/E, FULL_TEXT. Recomputed arithmetic; exact body/landing quotes checked, DES record guard passed; Fidelity null for COMMENTARY."
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Checked glossary terms. Occlusal splint and VDO are different concepts; no applicable backlink."
        ],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.7-b",
        "module": "05-semantic-linking.md",
        "reason": "Glossary-publish-only cross-link sweep",
        "status": "skipped"
      },
      {
        "evidence": [
          "Reviewed inline targets; no exact first-occurrence concept match. Related clinical cases surfaced in Explore."
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Added Chairside 14 (periodontal diagnostic clue) and 41 (why crown replacement alone is insufficient). Four total capsules."
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Two distinct concept cards, authored from approved body."
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Two standalone yes/no questions, each with an explicit \u062e\u06cc\u0631 verdict; scored pathway exam evaluated at C.5.6."
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.14",
        "module": "09-challenge.md",
        "reason": "Ordinary Chairside; no Challenge",
        "status": "skipped"
      },
      {
        "evidence": [
          "Canonical concepts #\u06a9\u06cc\u0633_\u0628\u0627\u0644\u06cc\u0646\u06cc, #\u062f\u06cc\u0627\u0633\u062a\u0645 and #\u0631\u0648\u06a9\u0634_\u0627\u0633\u067e\u0644\u06cc\u0646\u062a; no mint. The article explicitly addresses movement of a splinted group and widening at the group boundary."
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Appended schema-parity chairside-53 entry."
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Treatment planning/comprehensive diagnosis exists and matches the diagnosis-first decision."
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathway_place.py found only borderline candidates, including treatment planning and fixed prosthodontics. No full pathway placement; scored pathway exam inapplicable."
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": "No full pathway placement, so no bundle candidates",
        "status": "skipped"
      },
      {
        "evidence": [
          "Title-only Pulse line, English mirror and inverse toggles verified; editorial lock recorded."
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "chairside/chairside-53.html",
      "chairside/cs53-1.webp",
      "chairside/en/chairside-53.html",
      "chairside/index.html",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plus/des-scores.json",
      "plus/faq-corpus.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: chairside/en/chairside-53.html, index.html, dentcast-brain.json, dentcast-hashtag-reference.json, plus/faq-corpus.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
