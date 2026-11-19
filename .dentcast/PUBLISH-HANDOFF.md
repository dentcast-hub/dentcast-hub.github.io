# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-114"
- Status: in_progress
- Next canonical step: "C.4.7"
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
      "approvals": [],
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
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "insight/index.html",
      "insight/insight-113.html",
      "insight/insight-114.html",
      "insight/insight114-1.webp",
      "insight/insight114-2.webp",
      "insight/insight114-3.webp",
      "plus/des-scores.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: insight/insight-114.html, insight/index.html, insight/insight114-1.webp, insight/insight114-2.webp, insight/insight114-3.webp, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
