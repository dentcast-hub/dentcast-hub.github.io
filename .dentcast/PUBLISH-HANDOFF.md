# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-37"
- Status: blocked
- Next canonical step: null
- Blocker: "Prepared and verified branch; standing founder merge approval required before main deployment; live cabinet UI check pending deployment."

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": "Prepared and verified branch; standing founder merge approval required before main deployment; live cabinet UI check pending deployment.",
    "category": "sharehub",
    "content_id": "sharehub/share-37",
    "context": {
      "approvals": [
        {
          "decision": "Approved final Persian article with aging in parentheses and all proposed metadata; Drive plus cabinet requested",
          "evidence": [
            "founder-approval-2026-10-20-share37"
          ],
          "scope": "article text/title and aging spelling; metadata and digital/cad-cam classification; upload PDF to Drive and cabinet",
          "status": "confirmed"
        },
        {
          "decision": null,
          "evidence": [],
          "scope": "merge prepared ShareHub37 publication into main",
          "status": "pending"
        }
      ],
      "decisions": [
        {
          "decision": "Existing Printer folder verified against live Drive children and cabinet P2147",
          "scope": "paper filing"
        }
      ],
      "delivery": [
        {
          "evidence": [
            "Drive file1TQebv8nTZQTwALXCh6xL43aY-Snuv5VU metadata readback: PDF678294 bytes; verified Printer parent"
          ],
          "scope": "Original paper PDF upload"
        },
        {
          "evidence": [
            "Phase F actual output:105 passed,0 warned,0 failed",
            ".dentcast/publication-reports/sharehub-share-37.md"
          ],
          "scope": "Prepared article verification"
        }
      ],
      "inputs": [
        {
          "reference": "founder-approved ShareHub article and uploaded full-text DOI 10.1016/j.prosdent.2025.11.040"
        }
      ],
      "pending_questions": [
        {
          "question": "Merge the fully prepared verified branch into main for live publication?",
          "scope": "merge"
        }
      ],
      "unrelated_changes": [],
      "validation": [
        {
          "content_id": "sharehub/share-37",
          "exit_code": 0,
          "expected_caption": "\u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u067e\u0631\u06cc\u0646\u062a\u06cc\u0650 \u062f\u0627\u0626\u0645 \u0686\u0647 \u0642\u0627\u0628\u0644\u06cc\u062a\u200c\u0647\u0627 \u0648 \u0645\u062d\u062f\u0648\u062f\u06cc\u062a\u200c\u0647\u0627\u06cc\u06cc \u062f\u0627\u0631\u0646\u062f\u061f \u0646\u06af\u0627\u0647\u06cc \u0628\u0627\u0644\u06cc\u0646\u06cc \u0628\u0647 \u0645\u0642\u0627\u0648\u0645\u062a\u060c \u062b\u0628\u0627\u062a \u0631\u0646\u06af\u060c \u0628\u0627\u0646\u062f \u0648 \u06a9\u06cc\u0641\u06cc\u062a \u0633\u0627\u062e\u062a \u0628\u0631 \u0627\u0633\u0627\u0633 \u06cc\u06a9 \u0631\u06cc\u0648\u06cc\u0648\u06cc \u0633\u06cc\u0633\u062a\u0645\u0627\u062a\u06cc\u06a9.",
          "expected_title": "\u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u067e\u0631\u06cc\u0646\u062a\u06cc\u0650 \u062f\u0627\u0626\u0645\u061b \u0686\u0642\u062f\u0631 \u0645\u06cc\u200c\u062a\u0648\u0627\u0646 \u0628\u0647 \u0622\u0646\u200c\u0647\u0627 \u0627\u0639\u062a\u0645\u0627\u062f \u06a9\u0631\u062f\u061f",
          "kind": "phase_f",
          "output_sha256": "62b308a166c75a19da52467e930f91db9f8c8f268d75fd005e6b13dd589e5bca",
          "recorded_at": "2026-10-20T07:24:00+00:00",
          "summary": "105 passed, 0 warned, 0 failed  \u2014 publish is COMPLETE"
        }
      ]
    },
    "external_actions": [
      {
        "evidence": [
          "Drive upload completed id 1TQebv8nTZQTwALXCh6xL43aY-Snuv5VU; metadata readback confirms PDF 678294 bytes in verified Printer folder"
        ],
        "id": "share37-drive-upload-1",
        "status": "completed",
        "target": "Drive folder Printer 1GIxwR7qzSDHBNwZsNJUlfjjWBcLCV5hX; full-text PDF DOI 10.1016/j.prosdent.2025.11.040"
      }
    ],
    "status": "blocked",
    "steps": [
      {
        "evidence": [
          "share37-session-verified-rules"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-0"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-A"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-B.1"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-B.2"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-B.3"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-B.3.5"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-B.4"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-B.4.7"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-B.4.8"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-B.4.9"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-B.5"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-C.0"
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
        "reason": "Not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "share37-session-verified-C.1"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-C.2"
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
          "share37-session-verified-C.2.4"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-C.2.5"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-C.2.6"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-C.3"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-C.4"
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
        "reason": "ShareHub, not NoteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "No episode/NoteCast pair",
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
          "share37-session-verified-C.4.7"
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
        "reason": "Not a glossary publish",
        "status": "skipped"
      },
      {
        "evidence": [
          "share37-session-verified-C.4.8"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share37-session-verified-C.4.9"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Drive file 1TQebv8nTZQTwALXCh6xL43aY-Snuv5VU uploaded and independently verified in Printer folder; size 678294 bytes"
        ],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Catalog P2943 appended in exact latest enriched schema with verified Drive id/URLs, Printer topic, semantic title-derived tags, full abstract; total_papers actual count 2258"
        ],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified DOI 10.1016/j.prosdent.2025.11.040 and first author Yohann Flottes; source credit under article linked to DOI"
        ],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Three atomic authored flashcards in faq-corpus; standalone definitions, not copied FAQ answers; no on-page hidden schema"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Five standalone binary FAQ questions; explicit yes/no openings; no article deixis; answers grounded in approved body"
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Independent SOURCE55C MATERIAL FULL_TEXT; two isolated Fidelity runs plus third tie-break yielded zero ALTERED/REVERSED; exact quotes checked; canonical record stored without public source text"
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
        "reason": "Ordinary review article, not Challenge",
        "status": "skipped"
      },
      {
        "evidence": [
          "Four approved canonical tags reused after real simulations; sync4 concepts; no new vocabulary"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Actual tail record share37 verified and id corrected to same-category numeric-string shape; metadata exact"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Confirmed digital/cad-cam exactly matches approval, live taxonomy, capsule, prior nested keys"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Semantic placement: digital after episode98 PEEK trilogy and fixed-pros after share32 Enamic; both milestonefalse, no splitseries; coverage2paths; overall1.51 baseline1.38"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Only candidate bundle-crown-prep rejected gate3: material-evidence update does not fill a missing preparation/impression core topic; no bundle edits"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "New title-only Pulse at absolute top dated28Mehr; retained priorfirst6 and removed insight93 bottom; exactly7"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "All applicable builders completed logs /tmp/share37-{home,pillar,flash,quiz,img,plus,tags,upboard}.log; no main drift; episode/challenge builders not applicable"
        ],
        "id": "C.8",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Real stamper run after brain/tags/builders; final version validated later"
        ],
        "id": "C.7",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Structure-faithful English mirror created with meta1 chrome; reciprocal toggles; noindex enforced, zero EN hreflang, sitemap excludes EN; standard hash unchanged"
        ],
        "id": "D",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-notify marker present exactly once; no direct messages sent; Action acts on eventual main push"
        ],
        "id": "E",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "phase_f:62b308a166c75a19da52467e930f91db9f8c8f268d75fd005e6b13dd589e5bca"
        ],
        "id": "F",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          ".dentcast/publication-reports/sharehub-share-37.md"
        ],
        "id": "G",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/publication-reports/sharehub-share-37.md",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast_cabinet_full_catalog.json",
      "glossary/hybrid-ceramics.html",
      "glossary/milling.html",
      "index.html",
      "pillar/digital/index.html",
      "pillar/digital/structure.json",
      "pillar/index.html",
      "pillar/structure.json",
      "player.html",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/faq-corpus.json",
      "plus/flashcards-index.json",
      "plus/pathways.json",
      "plus/quiz-index.json",
      "service-worker.js",
      "sharehub/en/share-35.html",
      "sharehub/en/share-37.html",
      "sharehub/index.html",
      "sharehub/share-35.html",
      "sharehub/share-37.html",
      "sitemap.xml",
      "up-board/index.json"
    ]
  },
  "reconciliation": {
    "note": "Prepared report and all work reviewed at actual delivery boundary; live merge remains pending standing founder approval"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
