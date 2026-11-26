# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-61"
- Status: in_progress
- Next canonical step: "C.4.13"
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "sharehub",
    "content_id": "sharehub/share-61",
    "context": {
      "approvals": [],
      "decisions": [
        {
          "attached_paper": "no",
          "challenge": "no",
          "kind": "intake_facts_v1"
        },
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
          "decision": "3 MCQs approved verbatim by founder (\u00ab\u0633\u0648\u0627\u0644\u0647\u0627 \u062a\u0627\u06cc\u06cc\u062f\u00bb); check not duplicate in target pathway",
          "evidence": [
            "founder chat reply"
          ],
          "kind": "exam_questions_m2",
          "status": "confirmed"
        },
        {
          "decision": "S1 SOURCE call stored: RESEARCH DIAGNOSTIC narrative-review row, des_score 4, band E, FULL_TEXT, model claude-opus-5-5, system prompt sha256 709be964\u2026; interpretation_fa sentence 5 narrowed (Part 3(6)); fidelity slot pending sweeper run",
          "evidence": [
            "plus/des-scores.json sharehub/share-61"
          ],
          "kind": "des_source_record",
          "status": "recorded"
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
          "readpack sharehub/attached-paper=unknown/challenge=no/des=research/isolated/sources-one, pack.txt read top to bottom"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text: founder Claude Docs artifact (rev 50); no paper file; English slide transcript = fidelity source only; route: normal publish"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 60 sharehub entries, latest share-60 key set [type,id,title,caption,author,source,hashtags,keywords,url,pillar]; template sharehub/share-60.html; live PILLARS read from main"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type=sharehub (founder: \u00ab\u0646\u0648\u0639 \u0634\u06cc\u0631\u0647\u0627\u0628\u00bb)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number share-61 (max 60 +1)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text: founder Claude Docs doc \u00ab\u062b\u0628\u062a \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0631 \u0641\u0648\u0644\u200c\u0622\u0631\u0686 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u061b \u06a9\u062f\u0627\u0645 \u0631\u0648\u0634 \u062f\u0642\u06cc\u0642\u200c\u062a\u0631 \u0627\u0633\u062a\u061f\u00bb rev 50"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5: \u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a (no rewrites applied)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: 15 webp images from founder zip (01..18, 14-chart not in text \u2192 unused); no audio/video"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached; 4.10 branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 2 (research, determinate source): one DOI-less source S1 = Dr. Jonathan Ng teaching-notebook slides (English transcript supplied by founder); founder: \u00ab\u0641\u0642\u0637 \u0627\u0632 \u0645\u062a\u0646 \u0628\u0631\u0627\u06cc \u0633\u0646\u062c\u0634 \u0641\u06cc\u062f\u06cc\u0644\u06cc\u062a\u06cc \u0627\u0633\u062a\u0641\u0627\u062f\u0647 \u06a9\u0646\u00bb \u2192 SOURCE call on that text, FIDELITY on same text"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent draft (standing acceptance) in sharehub precedent pattern; M2: 3 questions approved (\u00ab\u0633\u0648\u0627\u0644\u0647\u0627 \u062a\u0627\u06cc\u06cc\u062f\u00bb), M1 images supplied (zip)"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "LiteCast branch inactive (category sharehub)"
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
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [
          "template sharehub/share-60.html (latest sharehub page), in target_paths"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/share-61.html cloned from share-60 (scripted, count asserts); body = founder doc text, 112 paragraphs + 2 tables verified against doc per-paragraph sha256 (0 mismatch); 15 figures share61-fig1..15.webp; domain .org kept; GA4/preconnect from clone; no e-namad; opening <p> before first list; presentation: 14 section numbers (data-dc-presentation), 2 unlabelled dc-box-tip frames around author-labelled \u00ab\u0646\u06a9\u062a\u0647 \u0639\u0645\u0644\u06cc\u00bb paragraphs; presentation_lint clean"
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
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar digital / subtopic intraoral-scanning (clear fit: digital acquisition of full-arch implant positions; same home as share-56); competing implantology/prosthetic-components weaker (topic is scanning accuracy, not components)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with 2 capsules: /glossary/ + /pillar/digital/"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/index.html hand-maintained: row added at top \u00ab\u2026 (\u0645\u0637\u0644\u0628\u06cc \u0627\u0632 Dr. Jonathan Ng)\u00bb"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: JSON-LD datePublished=dateModified=2026-11-26; no other date field/visible date in template"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- sharehub/share-60.html: clean"
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
        "reason": "NoteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast-only credit step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "started"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-61.html",
      "sharehub/index.html",
      "sharehub/share-60.html",
      "sharehub/share-61.html",
      "sharehub/share61-fig1.webp",
      "sharehub/share61-fig10.webp",
      "sharehub/share61-fig11.webp",
      "sharehub/share61-fig12.webp",
      "sharehub/share61-fig13.webp",
      "sharehub/share61-fig14.webp",
      "sharehub/share61-fig15.webp",
      "sharehub/share61-fig2.webp",
      "sharehub/share61-fig3.webp",
      "sharehub/share61-fig4.webp",
      "sharehub/share61-fig5.webp",
      "sharehub/share61-fig6.webp",
      "sharehub/share61-fig7.webp",
      "sharehub/share61-fig8.webp",
      "sharehub/share61-fig9.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, index.html, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, sharehub/en/share-61.html, sharehub/index.html, sharehub/share-60.html, sharehub/share-61.html, sharehub/share61-fig1.webp, sharehub/share61-fig10.webp, sharehub/share61-fig11.webp, sharehub/share61-fig12.webp, sharehub/share61-fig13.webp, sharehub/share61-fig14.webp, sharehub/share61-fig15.webp, sharehub/share61-fig2.webp, sharehub/share61-fig3.webp, sharehub/share61-fig4.webp, sharehub/share61-fig5.webp, sharehub/share61-fig6.webp, sharehub/share61-fig7.webp, sharehub/share61-fig8.webp, sharehub/share61-fig9.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
