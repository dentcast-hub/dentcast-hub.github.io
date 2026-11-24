# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-121"
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
    "content_id": "insight/insight-121",
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
          "modules 01/02, global README and all 5 selected pages, agent-parity and publish-checkpoints read completely"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text present, no attached paper file: normal publish route (Phase 0, row 1)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once (639 entries; 120 clinical; last clinical-120 / insight-120); PILLARS read live from tools/build_pillar.py"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type=clinical (insight/); taxonomy: chairside is not case reports, insight is clinical notes"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "number 121; max existing insight page insight-120"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder supplied the full text"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "one style-only rewrite applied: '\u0628\u0627\u0639\u062b \u0627\u06cc\u062c\u0627\u062f \u0686\u0646\u062f \u0645\u0634\u06a9\u0644 \u0647\u0645\u200c\u0632\u0645\u0627\u0646 \u0634\u062f\u0647 \u0627\u0633\u062a' -> '\u0686\u0646\u062f \u0645\u0634\u06a9\u0644 \u0631\u0627 \u0647\u0645\u200c\u0632\u0645\u0627\u0646 \u0633\u0627\u062e\u062a\u0647 \u0627\u0633\u062a'; everything else byte-identical"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "image supplied by founder; saved as insight/insight121-1.webp (WebP 1400x1209, 281 KB, under 1600px/300KB)"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no accompanying paper file: paper branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES basket 1 (COMMENTARY): founder's own case narrative, no DOI/PubMed/reference list on the page"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary post, not a challenge (no question body, no answer supplied)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse per insight precedent: \u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab{title}\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f (title as link text, no spoiler)"
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
        "reason": "not LiteCast: category clinical, LiteCast branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "template locked: insight/insight-120.html identified as the previous same-category page and left byte-unchanged"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "cloned insight-120 structure; .org domain kept; GA once; two preconnect with crossorigin; no enamad seal; body opens with the founder's own first paragraph (author_original); 3 marked \u2206 headings; presentation_lint clean"
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
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar.primary=fixed-pros, subtopic=failures (closest fit: failing splinted crowns, overhang, bone loss, re-treatment); competing candidate treatment-planning/extraction-vs-preservation not chosen"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "capsules: \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/fixed-pros/ at the head of the section"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/index.html is hand-maintained: added insight-121 row at the top matching sibling markup"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "all dates 2026-11-24: datePublished/dateModified/lastReviewed and both visible time elements"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- insight/insight-120.html is empty: template untouched"
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
        "reason": "not a NoteCast: no parent episode",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "not a NoteCast or episode pair",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "not a numbered series with ep-nav",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached",
        "status": "skipped"
      },
      {
        "evidence": [
          "COMMENTARY basket: source_text = text-of-record from presentation_diff (3314 chars), text_basis FULL_TEXT; SOURCE call in a tool-less API process with .dentcast/des-v3.7-knowledge.md as system prompt; des_score 15, band E, checklist 4+0+3+3; evidence quotes verbatim (item 4 from insight/index.html declaration with note); verify_publish --des-text ok; des_record_guard ok; stored in plus/des-scores.json; Fidelity omitted: basket-1 self-record"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "started"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "index.html",
      "insight/en/insight-121.html",
      "insight/index.html",
      "insight/insight-121.html",
      "insight/insight121-1.webp",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: insight/insight-121.html, insight/insight121-1.webp, insight/index.html, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
