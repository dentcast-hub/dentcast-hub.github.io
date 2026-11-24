# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-121"
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
    "content_id": "insight/insight-121",
    "context": {
      "approvals": [
        {
          "decision": "\u0644\u0645\u06cc\u0646\u062a \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627\u061b \u0622\u06cc\u0627 \u0636\u0639\u0641 \u0628\u0627\u0646\u062f\u06cc\u0646\u06af \u0631\u0627 \u0628\u0627\u06cc\u062f \u0628\u0627 \u062a\u0631\u0627\u0634 \u0628\u06cc\u0634\u062a\u0631 \u062c\u0628\u0631\u0627\u0646 \u06a9\u0631\u062f\u061f",
          "evidence": [
            "founder text, digest in context.inputs"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0646\u0642\u062f \u0627\u0633\u062a\u062f\u0644\u0627\u0644 \u00ab\u062a\u0631\u0627\u0634 \u0628\u06cc\u0634\u062a\u0631 \u0628\u0631\u0627\u06cc \u062c\u0628\u0631\u0627\u0646 \u0628\u0627\u0646\u062f\u06cc\u0646\u06af \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627\u00bb: \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u0633\u0631\u0627\u0645\u06cc\u06a9 \u0627\u06a9\u0633\u06cc\u062f\u06cc \u0627\u0633\u062a\u060c \u067e\u0631\u0648\u062a\u06a9\u0644 \u0628\u0627\u0646\u062f\u06cc\u0646\u06af \u062e\u0648\u062f\u0634 \u0631\u0627 \u062f\u0627\u0631\u062f \u0648 \u062d\u0641\u0638 \u0645\u06cc\u0646\u0627 \u0627\u0635\u0644 \u0637\u0631\u0627\u062d\u06cc \u0622\u0645\u0627\u062f\u0647\u200c\u0633\u0627\u0632\u06cc \u0648\u0646\u06cc\u0631 \u0627\u0633\u062a.",
          "evidence": [
            "standing acceptance (Hard Rule 14): agent-composed caption"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "lead paragraph is the founder's own first paragraph (author_original)",
          "evidence": [
            "first_cut_lead_provenance_v1"
          ],
          "scope": "authored-intro",
          "status": "not_required"
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
            "founder text digest bound in context.inputs"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder text, first paragraph"
        },
        {
          "english": {
            "evidence": [
              "file on disk"
            ],
            "path": "insight/en/insight-121.html",
            "status": "ready"
          },
          "evidence": [
            "ledger C.4.13 to C.5.6-b completed"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "DES COMMENTARY record installed (score 19, band E, relay ingest)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "ordinary post"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "esthetic / veneers-laminates from live PILLARS"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "capsules and related links within the 5-link cap"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "canonical hashtags only"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "brain entry clinical-121 at end"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "ceramics and esthetic placements"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "title-only pulse line in index.html"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "English mirror built; lint clean"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title and caption confirmed; M2 approved"
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
          "note": "founder article text",
          "ref": "founder-text:clinical-121",
          "sha256": "88242ceb2dc540399ec7f8b7cc927aec51fd5453fca22884cd87bcc40add6207"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "evidence": "founder approved question r-zirconia-bond in chat; written to plus/exam-questions.json; validate_exam_questions.py: 0 errors",
          "kind": "M2",
          "step": "C.5.6"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "modules 01-02, global rules, agent-parity, checkpoints read"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "routing: text yes, paper no, category clinical, not a challenge"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed: clinical-120 last, next 121; PILLARS esthetic/veneers-laminates"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "category clinical (Clinical insight) locked"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number 121; content_id insight/insight-121"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder text received and digest-bound"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: text reads natural, no rewrite applied"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no image, no audio, no external link"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper attached; step 4.10 branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 1 COMMENTARY: source_text is the page own body text, no DOI"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary post (not a challenge)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse line drafted in the clinical no-spoiler pattern"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "LiteCast branch inactive: category is clinical"
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
        "reason": "LiteCast inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast inactive",
        "status": "skipped"
      },
      {
        "evidence": [
          "template locked: insight/insight-120.html"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "page built by asserted clone+patch; presentation lint clean; en mirror built"
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
        "reason": "LiteCast inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast inactive",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar esthetic / subtopic veneers-laminates from live PILLARS"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "capsules injected: glossary + /pillar/esthetic/"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/index.html row updated to the new title and URL"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates 2026-11-24 on fa and en pages"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "template untouched: git diff --quiet insight/insight-120.html"
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
        "reason": "not a NoteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "no NoteCast/episode pair",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "not a numbered series page",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached",
        "status": "skipped"
      },
      {
        "evidence": [
          "DES COMMENTARY scored 17 band E in an isolated context; record installed; fidelity null per source exception"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "glossary back-link analysis run: no term link applied"
        ],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no glossary term published in this run"
        ],
        "id": "C.4.7-b",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "inline semantic link analysis: no strong in-body candidate"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "related section within the 5-link cap: 2 capsules + 3 semantic links"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DefinedTermSet entry written under insight/insight-121 in plus/faq-corpus.json"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage binary questions written standalone in plus/faq-corpus.json"
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
        "reason": "ordinary post, not a challenge",
        "status": "skipped"
      },
      {
        "evidence": [
          "hashtags resolved to canonical concepts only"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry appended at the end with the clinical-120 key set"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "recorded pillar matches step 2.4"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "placed in ceramics and esthetic pathways; 4.12-b awaits M2"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle gate: no candidate passed all five gates confidently"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "M2 answered; title/caption confirmed; provenance author_original; ten-scope lock recorded"
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
      "insight/en/insight-121.html",
      "insight/index.html",
      "insight/insight-121.html",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/des/insight/insight-121.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/js/home-bundles.js",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: insight/insight-121.html, insight/en/insight-121.html, insight/index.html, index.html, dentcast-brain.json, plus/des-scores.json, plus/faq-corpus.json, plus/pathways.json, plus/exam-questions.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
