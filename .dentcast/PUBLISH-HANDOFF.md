# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-99"
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
    "category": "clinical",
    "content_id": "insight/insight-99",
    "context": {
      "approvals": [
        {
          "decision": "\u062a\u0631\u0627\u0634 \u06a9\u0645\u062a\u0631 \u0647\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0639\u0646\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u0628\u0647\u062a\u0631 \u0646\u06cc\u0633\u062a!",
          "evidence": [
            "Author supplied exact title in current request; unchanged by landing correction."
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "Prepare and deliver through Push 1 only; no Push 2, Actions dispatch or merge",
          "evidence": [
            "Explicit prior author scope retrieved for this exact Clinical Insight; no scope change requested."
          ],
          "scope": "publication-scope",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "evidence": [
            "First paragraph copied verbatim from author; no agent-authored lead"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "author-submitted first body paragraph"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "from_step": "C.2.6",
          "kind": "dependency_invalidation_v1",
          "reason": "Corrected landing ownership after searching actual tools: insight/index.html is hand-maintained, not builder-owned. Reexecute landing and downstream checks; standard-library body/meta checks passed after optional bs4 unavailable.",
          "superseded": {
            "approvals": [
              {
                "decision": "\u062a\u0631\u0627\u0634 \u06a9\u0645\u062a\u0631 \u0647\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0639\u0646\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u0628\u0647\u062a\u0631 \u0646\u06cc\u0633\u062a!",
                "evidence": [
                  "Author supplied title in publication request"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "Prepare and deliver through Push 1 only; no Push 2, Actions dispatch or merge",
                "evidence": [
                  "Author prior explicit scope retrieved for this same publication"
                ],
                "scope": "publication-scope",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [
              {
                "ref": "author-submitted Clinical Insight text and two attached JPEG diagrams"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "Insight landing is builder-owned: tools/build_section_indexes.py; will regenerate after brain entry at C.8, outside requested Push1 scope."
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Audited title, description, canonical, OG, Twitter, JSON-LD and visible dates; predecessor date 2026-10-22 replaced by 2026-10-28, no stale predecessor identity."
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Template insight-98 SHA256 unchanged from C.1."
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
                "reason": "Clinical Insight, not NoteCast; no parent episode.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Clinical Insight, not episode/NoteCast pair; no mirrored evidence credit.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Clinical Insight, not Promptologist; no series prev/next.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.7",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "started"
              },
              {
                "evidence": [],
                "id": "C.4.7-b",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.11",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.12",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.14",
                "module": "09-challenge.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.5.0",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.5.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.5.6",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.5.6-b",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.6",
                "module": "11-build-and-version.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.8",
                "module": "11-build-and-version.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.7",
                "module": "11-build-and-version.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "D",
                "module": "12-english-notify-verify.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "E",
                "module": "12-english-notify-verify.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "F",
                "module": "12-english-notify-verify.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "G",
                "module": "12-english-notify-verify.md",
                "reason": null,
                "status": "pending"
              }
            ],
            "validation": []
          }
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "ref": "author-submitted Clinical Insight text and two attached JPEG diagrams"
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
          "Read active routers, global core all six pages, parity, checkpoint protocol, full modules 01\u201305; authorized scope ends at C.4.9."
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Normal page route: supplied full text and two JPEG images; no paper attached."
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed entire flat brain; latest clinical-98, contiguous clinical 1\u201398; inspected live main PILLARS, fixed-pros preparation best fit."
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Author explicitly requested Clinical Insight; mapped to clinical and insight/."
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified contiguous 1\u201398 and absent insight-99; announced next identifier."
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Full author-supplied title, subtitle, ten body paragraphs retained verbatim in local input."
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Reviewed phrasing; clinical contrasts substantive, no genuine style change needed. Original retained."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Two attached 1536x804 diagrams converted WebP quality92, verified decode; place under insufficient-thickness paragraph and anatomical-reduction paragraph."
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No research paper attached; paper branch inapplicable."
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Author clinical commentary, no retrievable research citation; COMMENTARY track owed after Push1."
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Author requested publication of a complete explanatory Clinical Insight, not a question-body assessment; ordinary post, no challenge."
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse proposal uses title-only precedent: \u062a\u0631\u0627\u0634 \u06a9\u0645\u062a\u0631 \u0647\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0639\u0646\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u0628\u0647\u062a\u0631 \u0646\u06cc\u0633\u062a! links to /insight/insight-99.html; deferred until authorized later cut."
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
        "reason": "Clinical Insight category; LiteCast isolated track inactive.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; brain typed clinical source.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; specialist linking applies.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; clone clinical predecessor.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; general publication track.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Locked latest same-category template insight/insight-98.html; SHA256 stored for unchanged-template check."
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Cloned clinical-98 chrome/schema, swapped supplied title/subtitle/body verbatim, dates 2026-10-28, .org identity preserved, WebP after body paragraphs 4 and 6; no phantom English link. Exact body and JSON-LD checks pass."
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
        "reason": "Not LiteCast; specialist in-body links at C.4.8.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; specialist related links at C.4.9.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Clear semantic choice: fixed-pros / preparation; general preparation requirements, not specific ceramic materials or occlusal therapy."
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Added exactly one related section with glossary and /pillar/fixed-pros/ nav capsules, 2 of 5 slots."
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Added one link to static insight/index.html, newest first; exact author title; CRLF and other bytes preserved. Corrected earlier builder attribution."
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Standard-library audit passed for title, author-derived description, OG, Twitter, canonical, all JSON-LD dates and visible dates. Old 98 identity/date removed; new 99 and 2026-10-28 consistent."
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Original insight-98 SHA256 equals C.1 lock."
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
        "reason": "Clinical Insight, not NoteCast.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Clinical Insight, not episode/NoteCast pair.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Clinical Insight, not Promptologist.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Semantic glossary review: retention/resistance substantively discussed, both pages already at five-link cap; no edits allowed. No Structural Durability glossary term; other terms too tangential."
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
        "reason": "Not glossary publication; no new term for scoped backfill.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Fresh semantic pass: first body occurrence of tooth preparation\u2192episode113; first technical \u06af\u06cc\u0631\u2192retention and \u0645\u0642\u0627\u0648\u0645\u062a\u2192resistance. Only anchor wrappers changed; stripped text identical, targets exist; before/after hashes verified."
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Fresh semantic related-content pass selected Goodacre episode113/114 and overlay-preparation episode55; verified targets exist, only three capsules appended, total five links; actual hashes and verbatim body verified."
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "glossary/glossary.json",
      "insight/index.html",
      "insight/insight-98.html",
      "insight/insight-99.html",
      "insight/insight99-1.webp",
      "insight/insight99-2.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: insight/index.html, insight/insight-99.html, insight/insight99-1.webp, insight/insight99-2.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
