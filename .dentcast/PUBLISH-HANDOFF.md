# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-114"
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
    "content_id": "insight/insight-114",
    "context": {
      "approvals": [
        {
          "decision": "\u0686\u0631\u0627 \u06cc\u06a9 \u0628\u0627\u0631 \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u06cc \u062f\u0642\u06cc\u0642\u0627\u064b \u0627\u0632 \u0648\u0633\u0637 \u06a9\u0627\u0646\u0627\u0644 \u067e\u06cc\u0686 \u0645\u06cc\u200c\u0634\u06a9\u0646\u062f\u061f",
          "evidence": [
            "founder data: doc heading (paragraph hash b15008ba verified)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0628\u0627\u0631 \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u06cc \u06cc\u06a9 \u067e\u0631\u0648\u062a\u0632 \u062b\u0627\u0628\u062a \u0641\u0648\u0644\u200c\u0622\u0631\u0686 \u0631\u0648\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0627\u0632 \u0648\u0633\u0637 \u06a9\u0627\u0646\u0627\u0644 \u067e\u06cc\u0686 \u0622\u062e\u0631\u06cc\u0646 \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0634\u06a9\u0633\u062a\u0647 \u0627\u0633\u062a\u060c \u0646\u0647 \u0627\u0632 \u06a9\u0627\u0646\u062a\u06cc\u0644\u0648\u0631. \u0686\u0631\u0627 \u0627\u06cc\u0646 \u0646\u0642\u0637\u0647 \u0628\u06cc\u0634\u062a\u0631 \u0627\u0632 \u0628\u0642\u06cc\u0647\u200c\u06cc \u0628\u0627\u0631 \u062f\u0631 \u062e\u0637\u0631 \u0634\u06a9\u0633\u062a\u0646 \u0628\u0648\u062f\u0647 \u0648 \u062f\u0631 \u0637\u0631\u0627\u062d\u06cc \u062c\u062f\u06cc\u062f \u0686\u0647 \u0628\u0627\u06cc\u062f \u062a\u063a\u06cc\u06cc\u0631 \u06a9\u0646\u062f\u061f",
          "evidence": [
            "agent proposal, standing acceptance (Hard Rule 14); listed in Push-2 report"
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
          "basis": "standing acceptance (Hard Rule 14)",
          "kind": "pillar_subtopic",
          "primary": "implantology",
          "reason": "implant-supported full-arch titanium framework fracture: design of the restoration (cantilever length, bar height, metal around screw channel, material/fatigue) -> restoration-design (\u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646: \u0631\u06cc\u062a\u0646\u0634\u0646\u060c \u0633\u0645\u0627\u0646\u060c \u0645\u062a\u0631\u06cc\u0627\u0644 \u0648 \u0627\u0650\u0645\u0631\u062c\u0650\u0646\u0633); competing prosthetic-components (screw/abutment) rejected: the failing element is the framework, not a component",
          "step": "C.2.4",
          "subtopic": "restoration-design"
        },
        {
          "audit_2d": "not owed (COMMENTARY)",
          "command": "claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md --tools '' --model opus --no-session-persistence --output-format json (empty dir)",
          "fidelity": "null slot: basket-1 COMMENTARY self-record, no FIDELITY owed (des_fidelity_units: 0 units)",
          "kind": "des_run",
          "m3b": "none",
          "model_reported": "claude-opus-5-5",
          "part3": {
            "arithmetic": "5+4+0+3+3=15 ok",
            "band": "E ok",
            "des_text": "verify_publish --des-text rc 0",
            "quotes": "items 1,3 verbatim in page text; item 4 = insight/index.html declaration with mandatory note",
            "rating_rule": "des_record_guard check rc 0",
            "schema": "spec object verbatim"
          },
          "part3_6_edit": {
            "after": "\u0627\u06cc\u0646 \u0646\u0648\u0634\u062a\u0647 \u06a9\u0627\u0645\u0646\u062a\u0631\u06cc \u0627\u0633\u062a \u0648 \u0627\u0645\u062a\u06cc\u0627\u0632 \u06f1\u06f5 \u062f\u0631 \u0628\u0627\u0646\u062f E \u06af\u0631\u0641\u062a\u0647 \u0627\u0633\u062a.",
            "before": "\u0627\u06cc\u0646 Insight \u062f\u0631 \u062a\u0631\u06a9 COMMENTARY \u0627\u0645\u062a\u06cc\u0627\u0632 \u06f1\u06f5 \u0648 \u0628\u0627\u0646\u062f E \u0645\u06cc\u200c\u06af\u06cc\u0631\u062f.",
            "field": "fact_fa",
            "reason": "\u00ab\u062a\u0631\u06a9\u00bb (track) unclear to a reader, reads as crack on a fracture page"
          },
          "result": {
            "band": "E",
            "des_score": 15,
            "provisional": false,
            "question_type": null
          },
          "source": "\u0645\u062a\u0646\u0650 \u062e\u0648\u062f\u0650 \u0645\u0637\u0644\u0628 (page body, FULL_TEXT)",
          "step": "C.4.13",
          "system_prompt_sha256": "709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9",
          "track": "COMMENTARY"
        },
        {
          "basis": "standing acceptance (Hard Rule 14)",
          "c4_7": {
            "applied": [],
            "borderline_skipped": [
              "abutment: article is about the bar, abutment only named",
              "occlusal-splint: night guard is one closing sentence",
              "flexural-strength: text means section geometry, glossary entry is ceramic material property"
            ],
            "strong": [
              "bruxism (cap 6/5 -> skipped)",
              "screw-retained (cap 5/5 -> skipped)"
            ]
          },
          "c4_8": {
            "applied": [
              {
                "phrase": "\u0627\u0628\u0627\u062a\u0645\u0646\u062a",
                "reason": "technical sense: the last abutment whose screw channel fractured",
                "target": "/glossary/abutment.html"
              },
              {
                "phrase": "\u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u0645",
                "reason": "patient condition, clinical sense",
                "target": "/glossary/bruxism.html"
              },
              {
                "phrase": "\u0646\u0627\u06cc\u062a\u200c\u06af\u0627\u0631\u062f",
                "reason": "night guard is an occlusal splint, recommended as treatment",
                "target": "/glossary/occlusal-splint.html"
              }
            ],
            "borderline_skipped": [
              "\u0645\u0642\u0627\u0648\u0645\u062a \u062f\u0631 \u0628\u0631\u0627\u0628\u0631 \u0634\u06a9\u0633\u062a\u0646 (Bending Strength) -> flexural-strength: geometric vs material sense",
              "\u0645\u06cc\u0644\u200c\u0634\u062f\u0647 -> milling: passing mention",
              "\u0627\u06a9\u0644\u0648\u0698\u0646/\u062d\u0631\u06a9\u0627\u062a \u0637\u0631\u0641\u06cc -> insight-87 canine guidance: tangential"
            ]
          },
          "c4_9": {
            "applied": [
              {
                "label": "\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u200c\u0628\u0627\u0631 \u062f\u0631 \u067e\u0631\u0648\u062a\u0632 \u0641\u0648\u0644\u200c\u0622\u0631\u0686",
                "reason": "same object: titanium bar in full-arch",
                "target": "/sharehub/share-46.html"
              },
              {
                "label": "\u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u0645 \u0648 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0641\u0648\u0644 \u0622\u0631\u0686",
                "reason": "bruxism + full-arch implant prosthesis",
                "target": "/sharehub/share-11.html"
              },
              {
                "label": "\u0634\u06a9\u0633\u062a \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0627\u0632 \u0646\u06cc\u0631\u0648\u0647\u0627\u06cc \u067e\u0627\u0631\u0627\u0641\u0627\u0646\u06a9\u0634\u0646\u0627\u0644",
                "reason": "implant component fracture under concentrated paraphunctional load",
                "target": "/chairside/chairside-23.html"
              }
            ],
            "borderline_skipped": [
              "/sharehub/share-17.html zirconia bridge in bruxer (material differs)",
              "/insight/insight-87.html canine guidance in full arch",
              "/chairside/chairside-38.html abutment screw fracture (impact cause)"
            ],
            "cap": "5/5 after",
            "free_slots": 3
          },
          "kind": "links",
          "step": "C.4.7-C.4.9"
        },
        {
          "checks": "hashtag_ref --sync ok; --check OK; build_plus_index run and both outputs reverted",
          "composition": "brand + decision (#\u06a9\u0627\u0646\u062a\u06cc_\u0644\u06cc\u0648\u0631, #\u0637\u0631\u0627\u062d\u06cc_\u0641\u0631\u06cc\u0645_\u0648\u0631\u06a9) + specific <=10 (#\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645_\u0628\u0627\u0631 3, #\u0637\u0631\u0627\u062d\u06cc_\u0641\u0631\u06cc\u0645_\u0648\u0631\u06a9 3, #\u0639\u0648\u0627\u0631\u0636_\u0645\u06a9\u0627\u0646\u06cc\u06a9\u06cc 4)",
          "final": [
            "#\u0646\u06a9\u062a\u0647_\u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc",
            "#\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645_\u0628\u0627\u0631",
            "#\u0637\u0631\u0627\u062d\u06cc_\u0641\u0631\u06cc\u0645_\u0648\u0631\u06a9",
            "#\u06a9\u0627\u0646\u062a\u06cc_\u0644\u06cc\u0648\u0631",
            "#\u0639\u0648\u0627\u0631\u0636_\u0645\u06a9\u0627\u0646\u06cc\u06a9\u06cc",
            "#\u0627\u06cc\u0645\u067e\u0644\u0646\u062a_\u0641\u0648\u0644_\u0622\u0631\u0686",
            "#\u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u0645",
            "#\u0627\u06a9\u0644\u0648\u0698\u0646_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a"
          ],
          "gate": "pass (>=1)",
          "kind": "hashtags",
          "minted": [],
          "questions": [
            "\u0628\u0627\u0631 \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u06cc \u0641\u0648\u0644 \u0622\u0631\u0686 \u0686\u0631\u0627 \u0627\u0632 \u06a9\u0627\u0646\u0627\u0644 \u067e\u06cc\u0686 \u0634\u06a9\u0633\u062a\u061f",
            "\u0637\u0648\u0644 \u06a9\u0627\u0646\u062a\u06cc\u0644\u0648\u0631 \u062f\u0631 \u067e\u0631\u0648\u062a\u0632 \u0641\u0648\u0644 \u0622\u0631\u0686 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u06cc \u0686\u0642\u062f\u0631 \u0628\u0627\u0634\u0647\u061f",
            "\u0628\u06cc\u0645\u0627\u0631 \u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u062a \u0628\u0627 \u067e\u0631\u0648\u062a\u0632 \u0641\u0648\u0644 \u0622\u0631\u0686 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u06cc \u0686\u0647 \u0645\u0644\u0627\u062d\u0638\u0627\u062a\u06cc \u062f\u0627\u0631\u0647\u061f",
            "\u0628\u0627\u0631 \u0641\u0648\u0644 \u0622\u0631\u0686 \u0631\u0648 \u0686\u0637\u0648\u0631 \u0637\u0631\u0627\u062d\u06cc \u06a9\u0646\u06cc\u0645 \u06a9\u0647 \u0646\u0634\u06a9\u0646\u0647\u061f"
          ],
          "reachability": {
            "Q1": "\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645 \u0628\u0627\u0631 rank 3 / \u0639\u0648\u0627\u0631\u0636 \u0645\u06a9\u0627\u0646\u06cc\u06a9\u06cc rank 4 -> surfaces",
            "Q2": "\u06a9\u0627\u0646\u062a\u06cc \u0644\u06cc\u0648\u0631 rank 9 -> not in first 4",
            "Q3": "\u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u0645 rank 7 -> not in first 4",
            "Q4": "\u0637\u0631\u0627\u062d\u06cc \u0641\u0631\u06cc\u0645 \u0648\u0631\u06a9 rank 3 -> surfaces"
          },
          "resolving": {
            "#\u0627\u06a9\u0644\u0648\u0698\u0646_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a": "\u0648\u0642\u062a\u06cc \u0647\u0631 \u062f\u0648 \u0641\u06a9 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0627\u0631\u0646\u062f\u060c \u0627\u06cc\u0646 \u0628\u0627\u0632\u062e\u0648\u0631\u062f \u062d\u0633\u06cc \u062f\u0631 \u0647\u0631 \u062f\u0648 \u0637\u0631\u0641 \u06a9\u0645\u062a\u0631 \u0627\u0633\u062a.",
            "#\u0627\u06cc\u0645\u067e\u0644\u0646\u062a_\u0641\u0648\u0644_\u0622\u0631\u0686": "\u062f\u0631 \u067e\u0631\u0648\u062a\u0632 \u0641\u0648\u0644\u200c\u0622\u0631\u0686\u060c \u0627\u0633\u062a\u062d\u06a9\u0627\u0645 \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645 \u0628\u0647\u200c\u062a\u0646\u0647\u0627\u06cc\u06cc \u062f\u0648\u0627\u0645 \u067e\u0631\u0648\u062a\u0632 \u0631\u0627 \u062a\u0636\u0645\u06cc\u0646 \u0646\u0645\u06cc\u200c\u06a9\u0646\u062f.",
            "#\u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u0645": "\u062f\u0631 \u0628\u06cc\u0645\u0627\u0631 \u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u062a\u060c \u062a\u0645\u0627\u0633\u200c\u0647\u0627\u06cc \u0633\u0646\u06af\u06cc\u0646 \u0631\u0648\u06cc \u06a9\u0627\u0646\u062a\u06cc\u0644\u0648\u0631 \u0628\u0627\u06cc\u062f \u062d\u0630\u0641 \u0634\u0648\u0646\u062f \u0648 \u0646\u0627\u06cc\u062a\u200c\u06af\u0627\u0631\u062f \u0647\u0645 \u0628\u062e\u0634\u06cc \u0627\u0632 \u062f\u0631\u0645\u0627\u0646 \u062f\u0631 \u0646\u0638\u0631 \u06af\u0631\u0641\u062a\u0647 \u0634\u0648\u062f.",
            "#\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645_\u0628\u0627\u0631": "\u062f\u0631 \u0636\u062e\u06cc\u0645 \u06a9\u0631\u062f\u0646 \u0628\u0627\u0631\u060c \u062c\u0647\u062a \u0622\u0646 \u0645\u0647\u0645 \u0627\u0633\u062a.",
            "#\u0637\u0631\u0627\u062d\u06cc_\u0641\u0631\u06cc\u0645_\u0648\u0631\u06a9": "\u067e\u0633 \u0627\u06af\u0631 \u0641\u0636\u0627 \u0627\u062c\u0627\u0632\u0647 \u0628\u062f\u0647\u062f\u060c \u0628\u0647\u062a\u0631 \u0627\u0633\u062a \u0627\u0631\u062a\u0641\u0627\u0639 \u0628\u0627\u0631 \u062f\u0631 \u0646\u0627\u062d\u06cc\u0647\u200c\u06cc \u0622\u062e\u0631\u06cc\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u06cc\u0634\u062a\u0631 \u0634\u0648\u062f.",
            "#\u0639\u0648\u0627\u0631\u0636_\u0645\u06a9\u0627\u0646\u06cc\u06a9\u06cc": "\u0648\u0642\u062a\u06cc \u0628\u06cc\u0634\u062a\u0631\u06cc\u0646 \u0646\u06cc\u0631\u0648 \u0648 \u06a9\u0645\u062a\u0631\u06cc\u0646 \u0641\u0644\u0632 \u062f\u0631 \u06cc\u06a9 \u0646\u0642\u0637\u0647 \u0628\u0627\u0634\u0646\u062f\u060c \u0637\u0628\u06cc\u0639\u06cc \u0627\u0633\u062a \u06a9\u0647 \u0627\u06cc\u0646 \u0646\u0642\u0637\u0647 \u0636\u0639\u06cc\u0641\u200c\u062a\u0631\u06cc\u0646 \u0628\u062e\u0634 \u0628\u0627\u0631 \u0628\u0627\u0634\u062f.",
            "#\u06a9\u0627\u0646\u062a\u06cc_\u0644\u06cc\u0648\u0631": "\u0628\u0627 \u06a9\u0648\u062a\u0627\u0647 \u0634\u062f\u0646 \u06a9\u0627\u0646\u062a\u06cc\u0644\u0648\u0631\u060c \u0628\u0627\u0632\u0648\u06cc \u0627\u0647\u0631\u0645 (Lever Arm) \u06a9\u0648\u062a\u0627\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f \u0648 \u0646\u06cc\u0631\u0648\u06cc \u062e\u0645\u0634\u06cc \u0631\u0648\u06cc \u0622\u062e\u0631\u06cc\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u06a9\u0645 \u0645\u06cc\u200c\u0634\u0648\u062f."
          },
          "reused": "all 8 canonical (simulate)",
          "skipped": {
            "#\u0634\u06a9\u0633\u062a_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a": "implant itself not lost",
            "#\u0641\u06cc\u062a_\u067e\u0631\u0648\u062a\u0632": "Passive Fit only a possible factor, not established as cause",
            "#\u067e\u0631\u0648\u062a\u0632_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a": "umbrella, density already 8"
          },
          "step": "C.5.0"
        },
        {
          "basis": "standing acceptance",
          "keywords": [
            "\u06a9\u0627\u0646\u0627\u0644 \u067e\u06cc\u0686",
            "\u0646\u06cc\u0631\u0648\u06cc \u062e\u0645\u0634\u06cc",
            "\u062e\u0633\u062a\u06af\u06cc \u0641\u0644\u0632",
            "Stress Concentration",
            "\u0627\u0631\u062a\u0641\u0627\u0639 \u0628\u0627\u0631",
            "Passive Fit",
            "\u0644\u06cc\u06af\u0627\u0645\u0627\u0646 \u067e\u0631\u06cc\u0648\u062f\u0646\u062a\u0627\u0644",
            "\u0646\u0627\u06cc\u062a\u200c\u06af\u0627\u0631\u062f"
          ],
          "kind": "brain_keywords",
          "note": "page JSON-LD keywords set to the same list",
          "step": "C.5"
        },
        {
          "coverage": "full pathways 1.52 per item (curated baseline 1.38)",
          "kind": "pathways",
          "not_placed": {
            "ceramics": "material differs",
            "fixed-pros": "tooth-borne focus",
            "implant-surgical": "surgical pathway, not prosthetic design",
            "occlusion": "occlusion only a sub-factor",
            "post-and-core": "unrelated",
            "treatment-planning": "tangential"
          },
          "placed": [
            {
              "after": "chairside/chairside-36",
              "milestone": false,
              "pathway": "implant-prosthetic",
              "reason": "full-arch implant framework biomechanics; sits after the cantilever/splinting design block (episodes 161-162, share-28, share-45, chairside-36)"
            },
            {
              "after": "chairside/chairside-36",
              "milestone": false,
              "pathway": "failure-troubleshooting",
              "reason": "analysis of a prosthetic failure and redesign"
            }
          ],
          "step": "C.5.6",
          "tool_flags": "all ASK (scores 51/15); placed by semantic judgment as unmistakable homes per module 10 step 2"
        },
        {
          "keys": [
            1,
            2,
            0
          ],
          "kind": "exam_questions",
          "m2": "sent; founder approved all three one by one (\u062a\u0623\u06cc\u06cc\u062f \u00d73)",
          "pathways": [
            "implant-prosthetic",
            "failure-troubleshooting"
          ],
          "rows": [
            "r-4ca78763",
            "r-7490ea85",
            "r-3b3afbf1"
          ],
          "step": "C.5.6 (4.12-\u0628)",
          "validator": "validate_exam_questions.py 0 errors (12 pre-existing warnings, none on insight-114); --draft-check 0/0"
        },
        {
          "candidates": {
            "bundle-implant-impression": "\u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1: \u067e\u0648\u0634\u0647\u0654 insight/)",
            "bundle-implant-parts": "\u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1: \u067e\u0648\u0634\u0647\u0654 insight/)"
          },
          "kind": "bundles",
          "step": "C.5.6-b"
        },
        {
          "evidence": [
            "insight/insight-114.html first <p> = founder paragraph byte-identical"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder doc first body paragraph (hash 395794fa) opens the page body"
        },
        {
          "count": 7,
          "inserted": "\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/insight/insight-114.html\">\u0686\u0631\u0627 \u06cc\u06a9 \u0628\u0627\u0631 \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u06cc \u062f\u0642\u06cc\u0642\u0627\u064b \u0627\u0632 \u0648\u0633\u0637 \u06a9\u0627\u0646\u0627\u0644 \u067e\u06cc\u0686 \u0645\u06cc\u200c\u0634\u06a9\u0646\u062f\u061f</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f",
          "kind": "pulse",
          "removed": "insight-110 line",
          "step": "C.6"
        },
        {
          "english": {
            "evidence": [
              "file on disk; 7 h3/9 p/3 figures parity with fa"
            ],
            "path": "insight/en/insight-114.html",
            "status": "ready"
          },
          "evidence": [
            "all founder messages closed (pending_questions empty)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13 des_run: COMMENTARY 15/E stored, fidelity null (basket 1), no M3b"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Question 4.9: \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc; C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "pillar implantology/restoration-design (C.2.4), landing row insight/index.html"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 0 back-links (caps), C.4.8 3 inline, C.4.9 3 capsules 5/5"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 8 canonical tags, 0 mints, --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "brain clinical-114 appended, keyset parity; faq-corpus FAQ 9 + cards 4"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "implant-prosthetic + failure-troubleshooting; exam rows r-4ca78763,r-7490ea85,r-3b3afbf1 approved in M2; bundles rejected gate 1"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html pulse: new top line, oldest removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "insight/en/insight-114.html authored from locked text; toggles inverse; noindex; 0 hreflang; meta-1 untouched"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title founder data; caption standing acceptance; M2 approved x3; no M1/M3b"
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
          "note": "founder article text (Claude Docs doc, rev 63)",
          "ref": "artifact:RdekpGw4CGN4r1bGs9bNyr#text",
          "sha256": "7ad9c01818ef0f6d6519b2866a881905f076f45d3f5912a27d8c9a6ce975c6f7"
        },
        {
          "note": "image 1",
          "ref": "artifact:RdekpGw4CGN4r1bGs9bNyr#img1",
          "sha256": "9ca4c71ec06e675fcf5e2542fa446d158cb7cb48f36df0d3c50e1b9ca643a5f7"
        },
        {
          "note": "image 2",
          "ref": "artifact:RdekpGw4CGN4r1bGs9bNyr#img2",
          "sha256": "3f1cad078a4b2b929111ac39a9c74780852e63574c2619c4a2a41f7be84eaa31"
        },
        {
          "note": "image 3",
          "ref": "artifact:RdekpGw4CGN4r1bGs9bNyr#img3",
          "sha256": "a1b7e0cf5faec30acd7a61bfd71e227a1f094ed69d17b08880221052ae1a7179"
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
          "read: README.md, global/README.md + all core sections (dentcast_global_rules --read pages 1-3), agent-parity.md, publish-checkpoints.md, publish-handoff-tool.md, modules 01,02"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (Claude Docs artifact RdekpGw4CGN4r1bGs9bNyr), paper file no -> normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 625 entries; latest clinical clinical-113 keyset type,id,title,caption,hashtags,keywords,page_url,pillar{primary,secondary,subtopic}; live PILLARS read from tools/build_pillar.py on origin/main"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder chose \u00abClinical Insight\u00bb via AskUserQuestion -> brain type clinical"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "max clinical id clinical-113 -> clinical-114, insight/insight-114.html (no gap)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text from Claude Docs doc rev 63, 17 paragraphs verified byte-exact against doc paragraph hashes (sha256[:8]); bound by digest in context.inputs"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5 de-AI scan: \u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a (no genuine AI tells; author voice, concrete case reasoning)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: insight type uses images; 3 founder images from artifact assets (webp 1080x970, 930x960, 1080x970; 60/48/39 KB, within 1600px/300KB) -> insight114-1..3.webp in doc order matched visually to alt texts; captions = founder alt texts"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached -> step 4.10 branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES basket 1 COMMENTARY: no DOI/PubMed/\u0645\u0646\u0627\u0628\u0639 on page; founder own clinical reasoning on a colleague case -> page text is source_text"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary article (\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc): request is an article, no question/answer post"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent-drafted in clinical precedent pattern, title only: \u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f (standing acceptance)"
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
        "reason": "LiteCast branch inactive: locked category clinical (module 03 step 0)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast only (module 03 0.1); category clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast only (module 03 0.2); category clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast only (module 03 0.3); category clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast only (module 03 0.4); category clinical",
        "status": "skipped"
      },
      {
        "evidence": [
          "template insight/insight-113.html (latest clinical page on disk), enrolled in target_paths"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/insight-114.html cloned from insight-113: body = text of record (17 paragraphs, founder h2 -> template h3), 3 figures with founder alt texts as alt+figcaption, meta/OG/Twitter/canonical/JSON-LD values swapped, .org domain kept, GA4 snippet once, 2 preconnect crossorigin at top, no trustseal, no chip row in template; opening <p> is founder own first paragraph (lead origin author_original); lang-btn -> en/insight-114.html"
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
        "reason": "LiteCast only (module 03 0.5); category clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast only (module 03 0.6); category clinical",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar implantology / subtopic restoration-design (decision recorded with reason)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/implantology/ (2 of 5 budget), cloned extra links removed"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/index.html hand-maintained static list: new <li> insight-114 added at top, sibling markup, unnumbered type"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "date audit table: BlogPosting datePublished/dateModified, MedicalWebPage datePublished/dateModified/lastReviewed, trustline two <time> = 2026-11-19 (before: 2026-11-17 cloned) all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- insight/insight-113.html: clean (template unchanged)"
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
        "reason": "NoteCast only (module 04 4.5); category clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "episode/NoteCast pair only (module 04 4.5-\u0628); category clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "numbered series with ep-nav only (module 04 4.6); insight is unnumbered, no ep-nav",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7); paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7); paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7); no DOI credit",
        "status": "skipped"
      },
      {
        "evidence": [
          "plus/des-scores.json insight/insight-114: COMMENTARY 15/E, fidelity [null]; Part 3 checks green; no M3b (decision des_run)"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "fresh semantic review of 110 glossary terms: strong bruxism, screw-retained both at/over cap (related_cap 6/5, 5/5) -> skipped; borderline abutment, occlusal-splint, flexural-strength skipped; 0 back-links written (decision links)"
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
        "reason": "4.7-\u0628: skipped \u2014 not a glossary publish",
        "status": "skipped"
      },
      {
        "evidence": [
          "3 inline anchors on first occurrence: \u0627\u0628\u0627\u062a\u0645\u0646\u062a->/glossary/abutment.html, \u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u0645->/glossary/bruxism.html, \u0646\u0627\u06cc\u062a\u200c\u06af\u0627\u0631\u062f->/glossary/occlusal-splint.html; borderline recorded; git diff shows only anchors"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "related section 2 nav + 3 content = 5/5 (related_cap): share-46, share-11, chairside-23; borderline recorded"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent insight/insight-114 definedTermSets: 4 authored DefinedTerms #flashcards-c1..c4 (Fulcrum, Stress Concentration, Fatigue, section height effect); none copies a FAQ answer; comparison-shaped FAQ #9 not carded"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage 9 Q/A, all standalone (no deixis); 6 binary (\u0622\u06cc\u0627\u2026) each opening \u0628\u0644\u0647\u061b/\u062e\u06cc\u0631\u061b (Q1,4,6,7,8); Q2,3,5,9 open-ended; 4.12-\u0628: evaluated at 5.6"
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
        "reason": "ordinary post (Question 4.9 \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc); no challenge markup",
        "status": "skipped"
      },
      {
        "evidence": [
          "8 canonical tags reused, 0 minted; --sync + --check OK; reachability passes for Q1/Q4 (decision hashtags)"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "clinical-114 appended at end of brain array (json_append), key set/order identical to clinical-113 incl. pillar{primary,secondary,subtopic}"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain pillar implantology/restoration-design == C.2.4 decision; capsule href /pillar/implantology/ matches; no new subtopic"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways.json: insight-114 in implant-prosthetic + failure-troubleshooting after chairside-36; coverage 1.52; 4.12-\u0628: 3 MCQ approved in M2, written to plus/exam-questions.json, validator 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle-implant-parts \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1), bundle-implant-impression \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1): insight/ folder; no bundle edit"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse line inserted at top of index.html .dc-pulse-list, insight-110 line removed (7 lines); en mirror insight/en/insight-114.html + fa toggle; second_cut_editorial_lock_v1 recorded (10 scopes)"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "insight/en/insight-114.html",
      "insight/index.html",
      "insight/insight-113.html",
      "insight/insight-114.html",
      "insight/insight114-1.webp",
      "insight/insight114-2.webp",
      "insight/insight114-3.webp",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: insight/insight-114.html, insight/en/insight-114.html, index.html, dentcast-brain.json, dentcast-hashtag-reference.json, plus/faq-corpus.json, plus/pathways.json, plus/exam-questions.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
