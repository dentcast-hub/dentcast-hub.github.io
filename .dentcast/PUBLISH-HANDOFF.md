# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-56"
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
    "content_id": "chairside/chairside-56",
    "context": {
      "approvals": [
        {
          "decision": "\u0642\u0628\u0644 \u0627\u0632 \u062e\u0627\u0631\u062c \u06a9\u0631\u062f\u0646 \u06cc\u06a9 \u0628\u0631\u06cc\u062c \u0642\u062f\u06cc\u0645\u06cc\u060c \u0686\u0631\u0627 \u0628\u0627\u06cc\u062f \u0627\u0645\u06a9\u0627\u0646 \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646\u06cc \u0622\u0646 \u0631\u0627 \u0628\u0631\u0631\u0633\u06cc \u06a9\u0646\u06cc\u0645\u061f",
          "evidence": [
            "founder data: first line of the submitted text, copied codepoint for codepoint"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0628\u06cc\u0645\u0627\u0631 \u0628\u0627 \u0633\u0627\u0628\u0642\u0647 \u0627\u0633\u062a\u0641\u0627\u062f\u0647 \u0637\u0648\u0644\u0627\u0646\u06cc\u200c\u0645\u062f\u062a \u0627\u0632 \u06cc\u06a9 \u0628\u0631\u06cc\u062c \u0642\u062f\u06cc\u0645\u06cc \u062f\u0631 \u0646\u0627\u062d\u06cc\u0647 \u062e\u0644\u0641\u06cc \u0641\u06a9 \u067e\u0627\u06cc\u06cc\u0646 \u0631\u0627\u0633\u062a (\u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627\u06cc \u06f5 \u062a\u0627 \u06f8) \u0628\u0631\u0627\u06cc \u0645\u0634\u0627\u0648\u0631\u0647 \u0628\u0647\u200c\u0645\u0646\u0638\u0648\u0631 \u062f\u0631\u0645\u0627\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0645\u0631\u0627\u062c\u0639\u0647 \u06a9\u0631\u062f. \u0686\u0631\u0627 \u067e\u06cc\u0634 \u0627\u0632 \u062e\u0627\u0631\u062c \u06a9\u0631\u062f\u0646 \u0628\u0631\u06cc\u062c\u060c \u0628\u0627\u06cc\u062f \u0627\u0645\u06a9\u0627\u0646 \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646\u06cc \u0622\u0646 \u0628\u0631\u0631\u0633\u06cc \u0648 \u062a\u0623\u06cc\u06cc\u062f \u0634\u0648\u062f\u061f",
          "evidence": [
            "agent proposal under standing acceptance, built from the founder's own sentences"
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
          "decision": "\u0633\u0647 \u067e\u06cc\u0634\u200c\u0646\u0648\u06cc\u0633 \u0631\u062f \u0634\u062f\u061b \u0641\u0642\u0637 \u0633\u0624\u0627\u0644 \u06f2 \u062a\u0623\u06cc\u06cc\u062f \u0648 \u062f\u0631 plus/exam-questions.json \u0646\u0648\u0634\u062a\u0647 \u0634\u062f (r-ed885e82\u060c \u06a9\u0644\u06cc\u062f \u06af\u0632\u06cc\u0646\u0647\u0654 \u06f3)\u061b \u0628\u0642\u06cc\u0647 \u0646\u0648\u0634\u062a\u0647 \u0646\u0634\u062f",
          "evidence": [
            "validate_exam_questions.py --content chairside/chairside-56: 1 live, 0 error, 0 warning"
          ],
          "kind": "exam_bank_decision_v1",
          "source_ref": "founder message: \u00ab\u0633\u0648\u0627\u0644 \u06f2 \u062a\u0627\u06cc\u06cc\u062f\u00bb"
        },
        {
          "evidence": [
            "body opens with the founder's paragraph; no agent-authored lead was added"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder's own first paragraph opens the body: \u00ab\u0628\u06cc\u0645\u0627\u0631\u06cc \u0628\u0627 \u0633\u0627\u0628\u0642\u0647 \u0627\u0633\u062a\u0641\u0627\u062f\u0647 \u0637\u0648\u0644\u0627\u0646\u06cc\u200c\u0645\u062f\u062a \u0627\u0632 \u06cc\u06a9 \u0628\u0631\u06cc\u062c \u0642\u062f\u06cc\u0645\u06cc \u2026 \u0645\u0631\u0627\u062c\u0639\u0647 \u06a9\u0631\u062f.\u00bb"
        },
        {
          "english": {
            "evidence": [
              "translated from locked text; metanotes/en/meta-1.html untouched"
            ],
            "path": "chairside/en/chairside-56.html",
            "status": "ready"
          },
          "evidence": [
            "pulse, English mirror, brain entry, pathways, DES record and exam row all written before Push 2"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13: COMMENTARY DES via relay, score 12 band E, Part 3 green, stored under chairside/chairside-56"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.14 skipped \u2014 ordinary post, no data-dc-challenge-question markup"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "pillar treatment-planning / replacing-missing-teeth (C.2.4, C.5.5); brain tail parity; canonical hashtags"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 both glossary candidates at cap 5/5 (none added); C.4.8 two inline anchors; C.4.9 three capsules, related_cap 5/5"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 five reused canonical tags; hashtag_ref --sync green, --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5 brain entry appended last, same 8 keys; JSON valid"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "5.6 fixed-pros after sharehub/share-39, treatment-planning after sharehub/share-48; bundle candidate rejected GATE 1; exam row r-ed885e82 approved"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html: new pulse line first, oldest line removed"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "chairside/en/chairside-56.html authored before C.6; noindex follow, self-canonical .org, zero hreflang, inverse toggles, presentation_lint clean"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title (founder data) and caption (standing acceptance) confirmed; lead origin author_original; M2 question approved"
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
          "README + global router and all selected global sections + agent-parity + publish-checkpoints + modules 01/02 read completely (this session)"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u062a\u0646 \u0647\u0633\u062a (\u0634\u0631\u062d \u0648\u06cc\u0632\u06cc\u062a \u0648 \u0686\u06cc\u0631\u0633\u0627\u06cc\u062f)\u061b \u0641\u0627\u06cc\u0644 \u0645\u0642\u0627\u0644\u0647\u0654 \u067e\u0698\u0648\u0647\u0634\u06cc \u067e\u06cc\u0648\u0633\u062a \u0646\u0634\u062f\u0647 \u2192 \u0645\u0633\u06cc\u0631 \u0627\u0646\u062a\u0634\u0627\u0631 \u0639\u0627\u062f\u06cc \u0628\u062f\u0648\u0646 \u0634\u0627\u062e\u0647\u0654 \u067e\u06cc\u067e\u0631"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain \u06cc\u06a9\u200c\u0628\u0627\u0631 parse \u0634\u062f: 642 \u0627\u0646\u062a\u0631\u06cc\u060c 55 chairside\u060c \u0622\u062e\u0631\u06cc\u0646 chairside-55 \u0628\u0627 \u0647\u0645\u0627\u0646 \u06a9\u0644\u06cc\u062f\u0647\u0627\u061b PILLARS \u0632\u0646\u062f\u0647 \u0627\u0632 tools/build_pillar.py \u062e\u0648\u0627\u0646\u062f\u0647 \u0634\u062f"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0646\u0648\u0639 \u0642\u0641\u0644 \u0634\u062f: chairside (\u0648\u06cc\u0632\u06cc\u062a) \u2014 \u0628\u0646\u06cc\u0627\u0646\u200c\u06af\u0630\u0627\u0631: \u00ab\u0634\u0631\u062d \u0648\u06cc\u0632\u06cc\u062a \u0648 \u0686\u06cc\u0631\u0633\u0627\u06cc\u062f \u0647\u0633\u062a\u00bb"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0634\u0645\u0627\u0631\u0647\u0654 \u0628\u0639\u062f\u06cc: chairside-56 (\u0628\u06cc\u0634\u06cc\u0646\u0647\u0654 \u0633\u0631\u06cc 55 + 1)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u062a\u0646 \u06a9\u0627\u0645\u0644 \u0627\u0632 \u0628\u0646\u06cc\u0627\u0646\u200c\u06af\u0630\u0627\u0631 \u062f\u0631 \u0647\u0645\u06cc\u0646 \u062f\u0631\u062e\u0648\u0627\u0633\u062a \u062f\u0631\u06cc\u0627\u0641\u062a \u0634\u062f"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u067e\u0627\u0633 de-AI \u0631\u0648\u06cc \u0645\u062a\u0646 \u0627\u0646\u062c\u0627\u0645 \u0634\u062f: \u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0627\u0633\u062a\u060c \u0647\u06cc\u0686 \u0628\u0627\u0632\u0646\u0648\u06cc\u0633\u06cc\u0650 \u0633\u0628\u06a9\u06cc \u0644\u0627\u0632\u0645 \u0646\u0628\u0648\u062f (\u06f0 \u062a\u063a\u06cc\u06cc\u0631)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0639\u06a9\u0633 \u067e\u06cc\u0648\u0633\u062a\u200c\u0634\u062f\u0647 \u0628\u0647 WebP \u062a\u0628\u062f\u06cc\u0644 \u0634\u062f: chairside/cs56-1.webp\u060c 1568\u00d71152\u060c 87KB (\u2264300KB\u060c long edge \u22641600) \u0648 \u0628\u0631\u0627\u06cc \u0635\u0641\u062d\u0647 \u0627\u0633\u062a\u0641\u0627\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": "\u067e\u06cc\u067e\u0631\u06cc \u067e\u06cc\u0648\u0633\u062a \u0646\u0634\u062f\u0647 \u2014 \u0645\u0633\u06cc\u0631 \u06f4.\u06f1\u06f0 \u063a\u06cc\u0631\u0641\u0639\u0627\u0644 (skip \u0645\u0633\u062a\u0646\u062f \u0633\u0624\u0627\u0644 \u06f4.\u06f7)",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u0633\u0628\u062f\u0650 \u06f1 COMMENTARY \u2014 \u0645\u062a\u0646 \u062a\u0623\u0644\u06cc\u0641\u06cc\u0650 \u062e\u0648\u062f\u0650 \u0628\u0646\u06cc\u0627\u0646\u200c\u06af\u0630\u0627\u0631 (\u0631\u0648\u0627\u06cc\u062a \u0648\u06cc\u0632\u06cc\u062a)\u060c \u0647\u06cc\u0686 DOI/PubMed/\u0641\u0647\u0631\u0633\u062a \u0645\u0646\u0627\u0628\u0639 \u062f\u0631 \u0635\u0641\u062d\u0647 \u0646\u06cc\u0633\u062a\u061b source_text = \u0645\u062a\u0646 \u062e\u0648\u062f\u0650 \u0635\u0641\u062d\u0647"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u067e\u0633\u062a \u0645\u0639\u0645\u0648\u0644\u06cc \u0627\u0633\u062a\u060c \u0646\u0647 \u0686\u0627\u0644\u0634\u061b \u0633\u0624\u0627\u0644 \u06f4.\u06f9 = \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (C.4.14 \u0628\u0639\u062f\u0627\u064b skipped)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u062c\u0645\u0644\u0647\u0654 \u067e\u0627\u0644\u0633 \u0631\u0627 \u0628\u0646\u06cc\u0627\u0646\u200c\u06af\u0630\u0627\u0631 \u0646\u0646\u0648\u0634\u062a\u0647\u061b \u0627\u06cc\u062c\u0646\u062a \u062f\u0631 C.6 \u062f\u0631 \u0627\u0644\u06af\u0648\u06cc \u0647\u0645\u0627\u0646 \u0646\u0648\u0639 (\u0648\u06cc\u0632\u06cc\u062a) \u067e\u06cc\u0634\u200c\u0646\u0647\u0627\u062f \u0645\u06cc\u200c\u062f\u0647\u062f \u2014 \u0628\u06cc\u200c\u0627\u0633\u067e\u0648\u06cc\u0644\u0631\u060c \u0645\u062a\u0646 \u0644\u06cc\u0646\u06a9 = \u0639\u0646\u0648\u0627\u0646"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0634\u0627\u062e\u0647\u0654 LiteCast \u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062a \u2014 \u0646\u0648\u0639 \u0642\u0641\u0644\u200c\u0634\u062f\u0647 chairside \u0627\u0633\u062a\u061b \u0645\u0631\u0627\u062d\u0644 \u06f0.\u06f1\u2013\u06f0.\u06f6 \u0627\u0650\u0639\u0645\u0627\u0644 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f"
        ],
        "id": "C.0",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "\u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u2014 LiteCast \u0646\u06cc\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "\u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u2014 LiteCast \u0646\u06cc\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "\u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u2014 LiteCast \u0646\u06cc\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "\u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u2014 LiteCast \u0646\u06cc\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u062a\u0645\u067e\u0644\u06cc\u062a \u0642\u0641\u0644 \u0634\u062f: chairside/chairside-55.html \u2014 \u062f\u0631 target_paths \u062b\u0628\u062a \u0648 \u0628\u0627 git diff --quiet \u062f\u0633\u062a\u200c\u0646\u062e\u0648\u0631\u062f\u0647 \u062a\u0623\u06cc\u06cc\u062f \u0634\u062f"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "chairside-56.html \u0627\u0632 \u062a\u0645\u067e\u0644\u06cc\u062a \u06a9\u0644\u0648\u0646 \u0634\u062f\u061b \u0645\u062a\u0646 \u062b\u0628\u062a\u200c\u0634\u062f\u0647 (\u067e\u0633 \u0627\u0632 Q3.5) \u0628\u0627 \u0633\u0627\u062e\u062a\u0627\u0631 \u0646\u0645\u0627\u06cc\u0634\u06cc: \u06f4 \u0639\u0646\u0648\u0627\u0646 \u0634\u0645\u0627\u0631\u0647\u200c\u062f\u0627\u0631\u060c \u06cc\u06a9 \u0642\u0627\u0628 \u062c\u0645\u0644\u0647\u0654 \u06a9\u0644\u06cc\u062f\u06cc\u060c \u06cc\u06a9 \u06a9\u0627\u062f\u0631 \u00ab\u0646\u062a\u06cc\u062c\u0647\u00bb\u061b GA4 \u0648 preconnect \u0627\u0632 \u06a9\u0644\u0648\u0646 \u0633\u0627\u0644\u0645\u061b JSON-LD \u0645\u0639\u062a\u0628\u0631\u061b presentation_lint \u0633\u0628\u0632\u061b \u062f\u0627\u0645\u0646\u0647\u0654 .org \u062d\u0641\u0638 \u0634\u062f"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0646\u0648\u0639 chairside"
        ],
        "id": "C.0.5",
        "module": "03-litecast-and-page.md",
        "reason": "\u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u2014 LiteCast \u0646\u06cc\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u0646\u0648\u0639 chairside"
        ],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "\u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u2014 LiteCast \u0646\u06cc\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u067e\u06cc\u0644\u0627\u0631: treatment-planning\u060c \u0633\u0627\u0628\u200c\u062a\u0627\u067e\u06cc\u06a9: replacing-missing-teeth \u2014 \u0645\u0648\u0636\u0648\u0639\u060c \u062a\u0631\u062a\u06cc\u0628 \u062f\u0631\u0645\u0627\u0646 \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646\u06cc \u0628\u0631\u06cc\u062c \u0628\u0627 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0627\u0633\u062a\u061b \u06af\u0632\u06cc\u0646\u0647\u0654 \u0646\u0632\u062f\u06cc\u06a9\u200c\u062a\u0631: extraction-vs-preservation \u06a9\u0647 \u062f\u0631\u0628\u0627\u0631\u0647\u0654 \u0646\u06af\u0647\u200c\u062f\u0627\u0634\u062a\u0646/\u06a9\u0634\u06cc\u062f\u0646 \u06cc\u06a9 \u062f\u0646\u062f\u0627\u0646 \u0627\u0633\u062a \u0646\u0647 \u062a\u0635\u0645\u06cc\u0645 \u062f\u0648\u0645\u0631\u062d\u0644\u0647\u200c\u0627\u06cc \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646\u06cc"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u062f\u0648 \u06a9\u067e\u0633\u0648\u0644 \u067e\u0627\u06cc\u0647: \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 \u2192 /glossary/ \u0648 \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc \u2192 /pillar/treatment-planning/\u061b \u0633\u0647 \u062c\u0627\u06cc \u0627\u0632 \u0633\u0642\u0641 \u06f5 \u0628\u0631\u0627\u06cc \u06f4.\u06f8/\u06f4.\u06f9 \u0645\u0627\u0646\u062f\u0647"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "chairside/index.html \u062f\u0633\u062a\u06cc \u0646\u06af\u0647 \u062f\u0627\u0634\u062a\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f\u061b \u0631\u062f\u06cc\u0641 \u00ab\u0648\u06cc\u0632\u06cc\u062a \u06f5\u06f6 \u2014 <\u0639\u0646\u0648\u0627\u0646>\u00bb \u0628\u0627\u0644\u0627\u06cc \u0631\u062f\u06cc\u0641 \u06f5\u06f5 \u0627\u0641\u0632\u0648\u062f\u0647 \u0634\u062f"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u062a\u0627\u0631\u06cc\u062e 2026-11-25 \u062f\u0631 title/JSON-LD/og/trustline \u06cc\u06a9\u0633\u0627\u0646 \u0634\u062f (datePublished=dateModified=lastReviewed)\u061b \u0647\u06cc\u0686 2026-11-24 \u0628\u0627\u0642\u06cc \u0646\u0645\u0627\u0646\u062f\u0647"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- chairside/chairside-55.html \u0633\u0628\u0632 \u0627\u0633\u062a\u061b \u062a\u0645\u067e\u0644\u06cc\u062a \u062f\u0633\u062a\u200c\u0646\u062e\u0648\u0631\u062f\u0647"
        ],
        "id": "C.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0628\u062f\u0648\u0646 \u0627\u067e\u06cc\u0632\u0648\u062f \u0648\u0627\u0644\u062f"
        ],
        "id": "C.4.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "\u0641\u0642\u0637 NoteCast \u2014 \u0627\u06cc\u0646 \u0627\u0646\u062a\u0634\u0627\u0631 chairside \u0627\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u0628\u062f\u0648\u0646 \u062c\u0641\u062a \u0627\u067e\u06cc\u0632\u0648\u062f"
        ],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "\u0641\u0642\u0637 NoteCast/\u0627\u067e\u06cc\u0632\u0648\u062f \u2014 \u0627\u06cc\u0646 \u0627\u0646\u062a\u0634\u0627\u0631 chairside \u0627\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u0635\u0641\u062d\u0647\u0654 \u0642\u0628\u0644\u06cc \u0641\u0627\u0642\u062f \u0646\u0648\u0627\u0631 \u0642\u0628\u0644\u06cc/\u0628\u0639\u062f\u06cc"
        ],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "\u0633\u0631\u06cc \u0634\u0645\u0627\u0631\u0647\u200c\u062f\u0627\u0631 \u0628\u0627 ep-nav \u0646\u06cc\u0633\u062a\u061b chairside-55 \u0647\u06cc\u0686 \u0628\u0644\u0627\u06a9 ep-nav \u0646\u062f\u0627\u0631\u062f",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u0628\u062f\u0648\u0646 \u0641\u0627\u06cc\u0644 \u0645\u0642\u0627\u0644\u0647"
        ],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "\u067e\u06cc\u067e\u0631\u06cc \u067e\u06cc\u0648\u0633\u062a \u0646\u0634\u062f\u0647 \u2014 \u0634\u0627\u062e\u0647\u0654 \u06f4.\u06f1\u06f0 \u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u0628\u062f\u0648\u0646 \u06a9\u0627\u062a\u0627\u0644\u0648\u06af/Drive"
        ],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "\u067e\u06cc\u067e\u0631\u06cc \u067e\u06cc\u0648\u0633\u062a \u0646\u0634\u062f\u0647 \u2014 \u0634\u0627\u062e\u0647\u0654 \u06f4.\u06f1\u06f0 \u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u0628\u062f\u0648\u0646 \u06a9\u0631\u062f\u06cc\u062a \u0646\u0648\u06cc\u0633\u0646\u062f\u0647/DOI"
        ],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "\u067e\u06cc\u067e\u0631\u06cc \u067e\u06cc\u0648\u0633\u062a \u0646\u0634\u062f\u0647 \u2014 \u0634\u0627\u062e\u0647\u0654 \u06f4.\u06f1\u06f0 \u063a\u06cc\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u0645\u0633\u06cc\u0631 \u0631\u0644\u0647 (\u0686\u062a \u062a\u0627\u0632\u0647\u0654 \u0628\u0646\u06cc\u0627\u0646\u200c\u06af\u0630\u0627\u0631)\u061b system prompt des-v3.7-knowledge.md sha256 709be964\u2026\u061b model UNVERIFIED (\u0628\u0646\u06cc\u0627\u0646\u200c\u06af\u0630\u0627\u0631 \u0646\u0627\u0645\u0634 \u0631\u0627 \u0646\u06af\u0641\u062a)\u061b source_text = \u0645\u062a\u0646 \u062b\u0628\u062a\u200c\u0634\u062f\u0647\u0654 \u0635\u0641\u062d\u0647 \u0627\u0632 presentation_diff (FULL_TEXT\u060c COMMENTARY)\u061b des_repair \u0628\u062f\u0648\u0646 \u062a\u0631\u0645\u06cc\u0645\u061b \u0646\u0642\u0644\u200c\u0642\u0648\u0644\u200c\u0647\u0627 verbatim\u061b \u062d\u0633\u0627\u0628 5+4+0+3+0=12\u061b \u0628\u0627\u0646\u062f E (\u06f5\u2013\u06f1\u06f9)\u061b schema/Commentary Checklist \u062f\u0631\u0633\u062a\u061b verify_publish --des-text \u0633\u0628\u0632 (\u0628\u062f\u0648\u0646 \u06a9\u0644\u0645\u0647\u0654 \u0645\u0645\u0646\u0648\u0639\u0647)\u061b \u0631\u06a9\u0648\u0631\u062f \u062f\u0631 plus/des-scores.json \u0632\u06cc\u0631 chairside/chairside-56 \u0630\u062e\u06cc\u0631\u0647 \u0634\u062f\u060c \u0628\u062f\u0648\u0646 fidelity (\u0628\u0633\u06a9\u062a \u06f1)"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0628\u0631\u0631\u0633\u06cc \u0645\u0639\u0646\u0627\u06cc\u06cc \u06f1\u06f1\u06f0 \u062a\u0631\u0645 \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647: dental-implant \u0648 treatment-plan (\u0627\u0646\u0648\u0627\u0639 \u0642\u0627\u0628\u0644\u200c\u062f\u0627\u0646\u0634\u200c\u0646\u0627\u0645\u0647)\u060c \u0647\u0631 \u062f\u0648 \u0628\u0627 related_cap \u062f\u0631 \u06f5/\u06f5 (at_cap) \u0648 \u0647\u06cc\u0686 \u0628\u06a9\u200c\u0644\u06cc\u0646\u06a9\u06cc \u0627\u0641\u0632\u0648\u062f\u0647 \u0646\u0634\u062f\u061b \u0647\u06cc\u0686 \u0635\u0641\u062d\u0647\u0654 \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 \u062a\u063a\u06cc\u06cc\u0631 \u0646\u06a9\u0631\u062f"
        ],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0646\u0648\u0639 chairside \u0627\u0633\u062a\u060c \u0646\u0647 \u0648\u0627\u0698\u0647\u200c\u0646\u0627\u0645\u0647"
        ],
        "id": "C.4.7-b",
        "module": "05-semantic-linking.md",
        "reason": "4.7-\u0628: skipped \u2014 not a glossary publish",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u062a\u062d\u0644\u06cc\u0644 \u0645\u0639\u0646\u0627\u06cc\u06cc \u062a\u0627\u0632\u0647 \u0631\u0648\u06cc \u0628\u062f\u0646\u0647: \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb (\u067e\u0627\u0631\u0627\u06af\u0631\u0627\u0641 \u0634\u0631\u062d \u062d\u0627\u0644) \u2192 /glossary/dental-implant.html \u0648 \u00ab\u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631\u06cc \u0646\u062f\u0627\u0631\u062f\u00bb \u2192 /chairside/chairside-51.html\u061b \u0645\u0631\u0632\u06cc\u200c\u0647\u0627\u06cc \u0631\u062f\u0634\u062f\u0647: \u00ab\u062a\u0631\u062a\u06cc\u0628 \u0627\u0646\u062c\u0627\u0645 \u062f\u0631\u0645\u0627\u0646\u00bb \u2192 treatment-plan\u060c \u00ab\u0628\u0627\u0631\u0647\u0627\u06cc \u0627\u06a9\u0644\u0648\u0632\u0627\u0644\u06cc\u00bb \u0648 \u00ab\u067e\u0631\u06cc\u0648\u062f\u0646\u062a\u06cc\u0633\u062a\u00bb \u0628\u06cc\u200c\u0647\u062f\u0641\u061b text-of-record \u06cc\u06a9\u0633\u0627\u0646 \u0645\u0627\u0646\u062f"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u06f2 \u06a9\u067e\u0633\u0648\u0644 \u067e\u0627\u06cc\u0647 + \u06f3 \u062c\u0627\u06cc \u0622\u0632\u0627\u062f\u061b \u0633\u0647 \u0644\u06cc\u0646\u06a9 \u0642\u0648\u06cc \u0627\u0636\u0627\u0641\u0647 \u0634\u062f: chairside-52\u060c chairside-51\u060c insight-13\u061b related_cap = 5/5 at_cap\u061b \u0645\u0631\u0632\u06cc\u200c\u0647\u0627\u06cc episode-150-2 \u0648 insight-42 \u0631\u062f \u0634\u062f\u0646\u062f"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0633\u0647 DefinedTerm \u0632\u06cc\u0631 chairside/chairside-56 \u062f\u0631 plus/faq-corpus.json (c1 \u062f\u0648\u0627\u0645 \u0628\u0631\u06cc\u062c\u060c c2 \u062a\u0631\u062a\u06cc\u0628 \u062f\u0631\u0645\u0627\u0646\u060c c3 \u067e\u06cc\u0627\u0645\u062f \u063a\u06cc\u0631\u0642\u0627\u0628\u0644\u200c\u0628\u0631\u06af\u0634\u062a)\u061b \u0647\u0645\u0647 authored \u0648 \u0645\u0633\u062a\u0642\u0644 \u0627\u0632 \u0645\u062a\u0646 FAQ"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0633\u0647 \u067e\u0631\u0633\u0634 \u0628\u0627\u06cc\u0646\u0631\u06cc \u0628\u062f\u0648\u0646 \u062f\u06cc\u06a9\u0633\u06cc\u0633 \u0628\u0627 \u067e\u0627\u0633\u062e\u200c\u0647\u0627\u06cc \u00ab\u062e\u06cc\u0631\u061b/\u0628\u0644\u0647\u061b/\u062e\u06cc\u0631\u061b\u00bb \u062f\u0631 FAQPage \u0632\u06cc\u0631 chairside/chairside-56"
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0633\u0624\u0627\u0644 \u06f4.\u06f9 = \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc"
        ],
        "id": "C.4.14",
        "module": "09-challenge.md",
        "reason": "\u067e\u0633\u062a \u0639\u0627\u062f\u06cc \u0627\u0633\u062a\u060c \u0646\u0647 \u0686\u0627\u0644\u0634 \u2014 \u0647\u06cc\u0686 \u0645\u0627\u0631\u06a9\u200c\u0622\u067e data-dc-challenge-question \u0631\u0648\u06cc \u0635\u0641\u062d\u0647 \u0646\u06cc\u0633\u062a",
        "status": "skipped"
      },
      {
        "evidence": [
          "\u06f4 \u0633\u0624\u0627\u0644 \u062f\u0646\u062f\u0627\u0646\u200c\u067e\u0632\u0634\u06a9\u061b \u0644\u06cc\u0633\u062a \u06a9\u0627\u0646\u0648\u0646\u06cc\u06a9\u0627\u0644 \u0647\u0645\u0647 reuse \u0628\u062f\u0648\u0646 mint: #\u0648\u06cc\u0632\u06cc\u062a\u060c #\u062a\u0648\u0627\u0644\u06cc_\u062f\u0631\u0645\u0627\u0646\u060c #\u062c\u0627\u06cc\u06af\u0632\u06cc\u0646\u06cc_\u062f\u0646\u062f\u0627\u0646\u060c #\u0628\u0631\u06cc\u062c\u060c #\u062a\u0635\u0645\u06cc\u0645_\u062f\u0631\u0645\u0627\u0646\u06cc\u061b \u06af\u06cc\u062a \u062a\u0631\u06a9\u06cc\u0628 \u06af\u0630\u0634\u062a\u061b \u0635\u0641\u062d\u0647 \u0686\u06cc\u067e\u200c\u0631\u0648 \u0646\u062f\u0627\u0631\u062f"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0627\u0646\u062a\u0631\u06cc chairside-56 \u0622\u062e\u0631\u06cc\u0646 \u0639\u0646\u0635\u0631 \u0622\u0631\u0627\u06cc\u0647 \u0628\u0627 \u0647\u0645\u0627\u0646 \u06f8 \u06a9\u0644\u06cc\u062f chairside-55\u061b caption/title \u0639\u06cc\u0646 \u0635\u0641\u062d\u0647\u061b hashtag_ref --sync \u0648 --check \u0633\u0628\u0632\u061b build_cabinet_papers --check OK\u061b build_plus_index \u0627\u062c\u0631\u0627 \u0648 revert \u0634\u062f"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain.pillar = treatment-planning / replacing-missing-teeth\u060c \u062f\u0642\u06cc\u0642\u0627\u064b \u0645\u0642\u062f\u0627\u0631 C.2.4\u061b \u0633\u0627\u0628\u200c\u062a\u0627\u067e\u06cc\u06a9 \u062f\u0631 PILLARS \u0645\u0648\u062c\u0648\u062f\u061b \u06a9\u067e\u0633\u0648\u0644 /pillar/treatment-planning/"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u062f\u0648 \u0645\u0633\u06cc\u0631 STRONG: fixed-pros \u0628\u0639\u062f \u0627\u0632 sharehub/share-39 \u0648 treatment-planning \u0628\u0639\u062f \u0627\u0632 sharehub/share-48\u061b \u0647\u0631 \u062f\u0648 insert \u0634\u062f\u061b coverage \u0628\u062f\u0648\u0646 UNCOVERED. 4.12-\u0628: \u062f\u0648 \u067e\u06cc\u0634\u200c\u0646\u0648\u06cc\u0633 \u0631\u062f \u0648 \u0633\u0624\u0627\u0644 \u06f2 \u062a\u0623\u06cc\u06cc\u062f \u0634\u062f \u0648 \u062f\u0631 \u0628\u0627\u0646\u06a9 \u0646\u0648\u0634\u062a\u0647 \u0634\u062f (r-ed885e82)\u061b validate \u0633\u0628\u0632"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u06cc\u06a9 \u06a9\u0627\u0646\u062f\u06cc\u062f: bundle-crown-prep (\u0627\u062f\u0627\u0645\u0647\u0654 fixed-pros) \u2014 \u06af\u06cc\u062a \u06f1 (\u0646\u0648\u0639): \u067e\u0648\u0634\u0647\u0654 chairside \u0647\u0631\u06af\u0632 \u0648\u0627\u0631\u062f \u0628\u0627\u0646\u062f\u0644 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f \u21d2 \u0631\u062f \u0634\u062f"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u067e\u0627\u0644\u0633: \u062e\u0637 \u00ab\u0642\u0628\u0644 \u0627\u0632 \u062e\u0627\u0631\u062c \u06a9\u0631\u062f\u0646 \u06cc\u06a9 \u0628\u0631\u06cc\u062c \u0642\u062f\u06cc\u0645\u06cc\u2026\u00bb \u0628\u0627\u0644\u0627\u062a\u0631\u06cc\u0646 \u0648 \u062e\u0637 insight-118 \u062d\u0630\u0641 \u0634\u062f\u061b \u0622\u06cc\u0646\u0647\u0654 \u0627\u0646\u06af\u0644\u06cc\u0633\u06cc chairside/en/chairside-56.html (noindex follow\u060c self-canonical .org\u060c \u0635\u0641\u0631 hreflang\u060c \u062a\u0627\u06af\u0644 \u0645\u0639\u06a9\u0648\u0633\u060c presentation_lint \u0633\u0628\u0632)\u061b \u062a\u0627\u06af\u0644 fa \u2192 en/chairside-56.html\u061b \u0642\u0641\u0644 \u062f\u0647\u200c\u0628\u062e\u0634\u06cc second_cut_editorial_lock_v1 \u062b\u0628\u062a \u0634\u062f\u061b M2 \u0628\u0633\u062a\u0647 \u0634\u062f (\u0633\u0624\u0627\u0644 \u06f2 \u062a\u0623\u06cc\u06cc\u062f \u0648 \u062f\u0631 \u0628\u0627\u0646\u06a9)\u061b approvals \u0639\u0646\u0648\u0627\u0646/\u06a9\u067e\u0634\u0646 \u0648 first_cut_lead_provenance=author_original \u062b\u0628\u062a \u0634\u062f"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/relay/des-chairside-56.md",
      "chairside/chairside-55.html",
      "chairside/chairside-56-1.webp",
      "chairside/chairside-56.html",
      "chairside/cs56-1.webp",
      "chairside/en/chairside-56.html",
      "chairside/index.html",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: chairside/chairside-56.html, chairside/en/chairside-56.html, chairside/cs56-1.webp, chairside/index.html, dentcast-brain.json, dentcast-hashtag-reference.json, index.html, plus/des-scores.json, plus/faq-corpus.json, plus/pathways.json, plus/exam-questions.json, .dentcast/relay/des-chairside-56.md"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
