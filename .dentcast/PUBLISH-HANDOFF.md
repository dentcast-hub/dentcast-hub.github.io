# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-43"
- Status: in_progress
- Next canonical step: null
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "chairside",
    "content_id": "chairside/chairside-43",
    "context": {
      "approvals": [
        {
          "decision": "Approved all five explicitly presented intake items",
          "evidence": [
            "Current session: founder confirmation \u0647\u0645\u0647 \u062a\u0627\u06cc\u06cc\u062f"
          ],
          "scope": "typo, hashtags, keywords, ordinary publication and Pulse",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "evidence": "Author selected Chairside; full brain scan confirms next number 43",
          "kind": "intake_identity_bound"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "evidence": [
            "Current session: Chairside manuscript and 66945.jpg"
          ],
          "scope": "author submission"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "content_id": "chairside/chairside-43",
          "exit_code": 1,
          "expected_caption": "\u0627\u0645\u0631\u0648\u0632 \u0628\u06cc\u0645\u0627\u0631\u06cc \u0628\u0631\u0627\u06cc \u0645\u0634\u0627\u0648\u0631\u0647 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627 \u0686\u067e \u0645\u0631\u0627\u062c\u0639\u0647 \u06a9\u0631\u062f\u0647 \u0628\u0648\u062f. \u062f\u0646\u062f\u0627\u0646 \u0647\u0646\u0648\u0632 \u06a9\u0634\u06cc\u062f\u0647 \u0646\u0634\u062f\u0647 \u0628\u0648\u062f\u060c \u0627\u0645\u0627 \u0642\u0631\u0627\u0631 \u0628\u0648\u062f \u0628\u0627 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646 \u0634\u0648\u062f. \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0686\u067e \u0628\u0647\u200c\u0634\u062f\u062a \u0628\u0647 \u0633\u0645\u062a \u062f\u06cc\u0633\u062a\u0627\u0644 \u062c\u0627\u0628\u0647\u200c\u062c\u0627 \u0634\u062f\u0647 \u0628\u0648\u062f\u060c \u0644\u062a\u0631\u0627\u0644 \u0647\u0645\u0627\u0646 \u0633\u0645\u062a \u0627\u0628\u0639\u0627\u062f \u0628\u0633\u06cc\u0627\u0631 \u06a9\u0648\u0686\u06a9\u06cc \u062f\u0627\u0634\u062a \u0648 \u062f\u06cc\u0627\u0633\u062a\u0645 \u0628\u0632\u0631\u06af\u06cc \u0628\u06cc\u0646 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u062f\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0634\u062f.",
          "expected_title": "\u0641\u0636\u0627\u06cc \u0627\u0636\u0627\u0641\u0647 \u0631\u0627 \u0628\u0627 \u06cc\u06a9 \u062f\u0646\u062f\u0627\u0646 \u062f\u06cc\u06af\u0631 \u067e\u0631 \u06a9\u0646\u06cc\u0645 \u06cc\u0627 \u062c\u0627\u0628\u0647\u200c\u062c\u0627\u06cc\u0634 \u06a9\u0646\u06cc\u0645\u061f",
          "kind": "phase_f",
          "output_sha256": "c51af69ba2b38b2daaea4392f990376c8aa018d7c88246d87ebcede694b560bf",
          "recorded_at": "2026-10-21T17:16:02+00:00",
          "summary": "92 passed, 0 warned, 1 failed  \u2014 publish is INCOMPLETE"
        },
        {
          "content_id": "chairside/chairside-43",
          "exit_code": 0,
          "expected_caption": "\u0627\u0645\u0631\u0648\u0632 \u0628\u06cc\u0645\u0627\u0631\u06cc \u0628\u0631\u0627\u06cc \u0645\u0634\u0627\u0648\u0631\u0647 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627 \u0686\u067e \u0645\u0631\u0627\u062c\u0639\u0647 \u06a9\u0631\u062f\u0647 \u0628\u0648\u062f. \u062f\u0646\u062f\u0627\u0646 \u0647\u0646\u0648\u0632 \u06a9\u0634\u06cc\u062f\u0647 \u0646\u0634\u062f\u0647 \u0628\u0648\u062f\u060c \u0627\u0645\u0627 \u0642\u0631\u0627\u0631 \u0628\u0648\u062f \u0628\u0627 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646 \u0634\u0648\u062f. \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0686\u067e \u0628\u0647\u200c\u0634\u062f\u062a \u0628\u0647 \u0633\u0645\u062a \u062f\u06cc\u0633\u062a\u0627\u0644 \u062c\u0627\u0628\u0647\u200c\u062c\u0627 \u0634\u062f\u0647 \u0628\u0648\u062f\u060c \u0644\u062a\u0631\u0627\u0644 \u0647\u0645\u0627\u0646 \u0633\u0645\u062a \u0627\u0628\u0639\u0627\u062f \u0628\u0633\u06cc\u0627\u0631 \u06a9\u0648\u0686\u06a9\u06cc \u062f\u0627\u0634\u062a \u0648 \u062f\u06cc\u0627\u0633\u062a\u0645 \u0628\u0632\u0631\u06af\u06cc \u0628\u06cc\u0646 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u062f\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0634\u062f.",
          "expected_title": "\u0641\u0636\u0627\u06cc \u0627\u0636\u0627\u0641\u0647 \u0631\u0627 \u0628\u0627 \u06cc\u06a9 \u062f\u0646\u062f\u0627\u0646 \u062f\u06cc\u06af\u0631 \u067e\u0631 \u06a9\u0646\u06cc\u0645 \u06cc\u0627 \u062c\u0627\u0628\u0647\u200c\u062c\u0627\u06cc\u0634 \u06a9\u0646\u06cc\u0645\u061f",
          "kind": "phase_f",
          "output_sha256": "731d7324247792a92fda6205603b8a61678c2ff74709acffc9224674550c907b",
          "recorded_at": "2026-10-21T17:16:31+00:00",
          "summary": "96 passed, 0 warned, 0 failed  \u2014 publish is COMPLETE"
        },
        {
          "evidence": [
            ".dentcast/publication-reports/chairside-43.md"
          ],
          "result": "96 passed, 0 warned, 0 failed",
          "scope": "Phase F"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Read active routers, global core sections, agent parity, modules 01/02 and checkpoint protocol at main 90cdf44"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Author manuscript plus clinical JPEG; no paper attached; normal Chairside publication"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed all 567 brain entries; discovered 14 categories; Chairside 1\u201342 contiguous; latest schema/template chairside-42; live PILLARS read"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Author explicitly selected chairside"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Contiguous Chairside sequence 1\u201342; next number 43"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Full author manuscript supplied; exact original retained in session"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Natural prose; only approved typo correction \u062f\u0648 \u0645\u06cc\u0644\u06cc\u200c\u0645\u062a\u0631\u06cc\u0627 \u0628\u06cc\u0634\u062a\u0631 to \u062f\u0648 \u0645\u06cc\u0644\u06cc\u200c\u0645\u062a\u0631 \u06cc\u0627 \u0628\u06cc\u0634\u062a\u0631"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "66945.jpg attachment exists locally; author explicitly requests WebP"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No research paper attached; clinical JPEG only"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "COMMENTARY FULL_TEXT; own case reasoning; no cited retrievable paper; no supplied DES JSON"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder approved ordinary publication in intake bundle"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder approved exact article title as Pulse link text"
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
        "reason": "Not LiteCast: Chairside",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: brain source",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: specialist ecosystem",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: same Chairside template",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: ordinary publishing applies",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template chairside-42.html SHA256 ee9291452b957ae21b847ecbf4c4baab7d30153b76caa2849881bbedf524ebef"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Cloned Chairside 42 structure; copied 26 author paragraphs with approved typo only; original lead retained; WebP 1152x1536 generated; meta/schema updated"
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
        "reason": "Not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "treatment-planning/comprehensive-diagnosis; case concerns diagnostic space allocation rather than modality comparison or surgical technique"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "One related section; two navigation capsules; correct treatment-planning root; 3 remaining slots"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Hand-maintained Chairside landing: single new newest-first row with number 43 and verbatim title"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Audit title/caption/canonical/OG/Twitter/schema/image dimensions all current; dates 2026-10-20 -> 2026-10-21; FA locale; GA once; preconnects once"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Predecessor unchanged: ee9291452b957ae21b847ecbf4c4baab7d30153b76caa2849881bbedf524ebef"
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
        "reason": "Not NoteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not episode/NoteCast pair",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not Promptologist",
        "status": "skipped"
      },
      {
        "evidence": [
          "Reviewed glossary concepts. Treatment plan, implant crown and dental implant are relevant; all already have five related links, so no backlink edits permitted. No diastema/midline term exists."
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
        "reason": "Not a glossary publication",
        "status": "skipped"
      },
      {
        "evidence": [
          "Fresh glossary/episode analysis: first technical implant, implant crown and treatment plan mentions linked. Landing insertion and schema keyword correction verified after failed import was corrected; no author prose changed."
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Added three high-confidence related links; two nav plus three content links = five"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached; no Drive filing",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached; no catalog enrichment",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached; no paper credit",
        "status": "skipped"
      },
      {
        "evidence": [
          "Three authored concept cards in FAQ corpus; unique sequential fragments; no page JSON-LD flashcards"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Four self-contained binary FAQ items in corpus; all answer keys explicit; grounded in author reasoning; no article deixis"
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES v3.4 COMMENTARY FULL_TEXT 15/E; evidence 4+0+3+3; quotes normalized and checked; schema/arithmetic/band valid; no Fidelity owed for own commentary"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.14",
        "module": "09-challenge.md",
        "reason": "Ordinary article confirmed",
        "status": "skipped"
      },
      {
        "evidence": [
          "Four founder-approved concepts resolve to existing canonical tags; no minting"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Appended final flat-array entry; identical Chairside schema; copied title/caption and approved tags/keywords"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified treatment-planning/comprehensive-diagnosis equals earlier decision and valid live taxonomy"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Placed after Chairside 42 in treatment-planning and implant-prosthetic; both STRONG and substantive conceptual fit; no milestone; weak peripheral scores rejected as not substantive homes"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Every bundle continuing joined pathways rejected at gate 1: chairside folder disallowed; no bundle changes"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Exact approved title linked at Pulse top; prior first six preserved and bottom removed; seven rows"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Homepage/pillars+structure/flashcards/quiz/image attrs/Plus/up-board builders succeeded; canonical hashtag check green; non-episode and non-Challenge builders not applicable"
        ],
        "id": "C.8",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Content version stamped after builders"
        ],
        "id": "C.7",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "English mirror: 26 paragraph translation; same Chairside structure/styles, universal English chrome; reciprocal toggles; noindex and zero hreflang; meta-1 hash cbc906959b3c89e10adc4394c6b10a93f4ac1a335c0457ca8019e8c34674314f unchanged; injectors/sitemap passed"
        ],
        "id": "D",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-notify true exactly once on Persian page; automated delivery occurs only after main publication"
        ],
        "id": "E",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "phase_f:731d7324247792a92fda6205603b8a61678c2ff74709acffc9224674550c907b"
        ],
        "id": "F",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          ".dentcast/publication-reports/chairside-43.md contains complete results, exact Phase F log and remaining merge boundary"
        ],
        "id": "G",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/publication-reports/chairside-43.md",
      "chairside/chairside-43.html",
      "chairside/chairside43.webp",
      "chairside/en/chairside-43.html",
      "chairside/index.html",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "pillar/index.html",
      "pillar/structure.json",
      "pillar/treatment-planning/index.html",
      "pillar/treatment-planning/structure.json",
      "player.html",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/faq-corpus.json",
      "plus/flashcards-index.json",
      "plus/pathways.json",
      "plus/quiz-index.json",
      "service-worker.js",
      "sitemap.xml",
      "up-board/index.json"
    ]
  },
  "reconciliation": {
    "note": "Reviewed actual scoped changes and source requirements for this transition"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
