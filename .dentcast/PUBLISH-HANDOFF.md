# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-97"
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
    "category": "clinical",
    "content_id": "insight/insight-97",
    "context": {
      "approvals": [
        {
          "decision": "Approved both exact proposed paragraphs.",
          "evidence": [
            "Founder confirmation in active publication conversation, 2026-10-21."
          ],
          "scope": "Persian opening paragraph and English translation",
          "status": "confirmed"
        },
        {
          "decision": "Founder approved proposed English title, four canonical hashtags and four keywords.",
          "evidence": [
            "Founder confirmation in active publication conversation, 2026-10-21, after metadata proposal."
          ],
          "scope": "English title, canonical hashtags and search keywords",
          "status": "confirmed"
        },
        {
          "decision": "Founder explicitly instructed final merge after completion.",
          "evidence": [
            "Founder instruction in active publication conversation, 2026-10-21: final merge requested."
          ],
          "scope": "Merge Clinical Insight 97 after all checks and branch delivery",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "evidence": "Founder Clinical Insight request, contiguous next number 97; no authoring begun.",
          "kind": "intake_identity_bound"
        },
        {
          "decision": "Use the already-approved Persian opening paragraph verbatim as description and caption.",
          "scope": "caption"
        },
        {
          "decision": "fixed-pros / post-and-core, determined semantically from live taxonomy.",
          "scope": "taxonomy"
        }
      ],
      "delivery": [
        {
          "evidence": [
            "https://github.com/dentcast-hub/dentcast-hub.github.io/pull/945",
            "All 22 uploaded blob IDs and final Git tree matched local committed bytes; exact checkpoint observed on synchronized remote branch."
          ],
          "scope": "GitHub branch delivery"
        }
      ],
      "inputs": [
        {
          "evidence": [
            "Founder supplied complete Persian Q&A for publication, 2026-10-21."
          ],
          "scope": "publication input"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "evidence": [
            "DES 3.4 own commentary 15/E, all four mechanical checks passed; lawful null Fidelity self-record.",
            "Two authored atomic cards and three standalone binary questions stored in corpus."
          ],
          "scope": "DES and educational corpus"
        },
        {
          "content_id": "insight/insight-97",
          "exit_code": 0,
          "expected_caption": "\u06af\u0627\u0647\u06cc \u062f\u0631\u0628\u0627\u0631\u0647 \u06a9\u06cc\u0641\u06cc\u062a \u0627\u0646\u062f\u0648 \u0645\u0637\u0645\u0626\u0646 \u0646\u06cc\u0633\u062a\u06cc\u0645\u060c \u0627\u0645\u0627 \u062f\u0646\u062f\u0627\u0646 \u0647\u0645 \u0628\u0631\u0627\u06cc \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u0628\u0647 \u067e\u0633\u062a \u0646\u06cc\u0627\u0632 \u062f\u0627\u0631\u062f. \u062f\u0631 \u0627\u06cc\u0646 \u0634\u0631\u0627\u06cc\u0637\u060c \u0622\u06cc\u0627 \u0633\u0645\u0627\u0646 \u0645\u0648\u0642\u062a \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0631\u06cc\u062e\u062a\u06af\u06cc \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u062f \u0631\u0627\u0647\u06cc \u0628\u0631\u0627\u06cc \u062d\u0641\u0638 \u0627\u0645\u06a9\u0627\u0646 \u062f\u0633\u062a\u0631\u0633\u06cc \u0645\u062c\u062f\u062f \u0628\u0647 \u06a9\u0627\u0646\u0627\u0644 \u0628\u0627\u0634\u062f\u061f",
          "expected_title": "\u0622\u06cc\u0627 \u0645\u06cc\u062a\u0648\u0627\u0646 \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0631\u06cc\u062e\u062a\u06af\u06cc \u0631\u0627 \u0633\u0645\u0627\u0646 \u0645\u0648\u0642\u062a \u06a9\u0631\u062f",
          "kind": "phase_f",
          "output_sha256": "bfee41a86691308bdbbe7f890e01f52bdbd9db838a8e465fbef0d07fba6d63b9",
          "recorded_at": "2026-10-21T05:46:07+00:00",
          "summary": "89 passed, 1 warned, 0 failed  \u2014 publish is COMPLETE"
        },
        {
          "evidence": [
            ".dentcast/publication-reports/clinical-97.md",
            "89 passed, 1 warned, 0 failed \u2014 publish is COMPLETE",
            "Verbatim authored body and Q&A order passed; original templates unchanged."
          ],
          "scope": "final publication validation"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Read active router, complete applicable core rules, agent parity, hard rules and checkpoint contract at current revision."
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder supplied publication text with no attached research paper; ordinary page route."
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed all 565 brain records, extracted category schemas and latest entries; derived current live PILLARS from main."
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder explicitly selected Clinical Insight; canonical type clinical."
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "All clinical numbers 1 through 96 present; next is 97, announced to founder."
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder supplied complete three-question Persian text and exact title in active conversation."
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Editorial review found natural Q&A voice, no genuine stylistic rewrites required; preserve text."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Latest clinical brain schema has no required image/audio/video fields; no media supplied in this request."
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No research paper attached; Drive/catalog branch does not apply."
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Own clinical reasoning with no cited retrievable study: COMMENTARY, FULL_TEXT; announced in conversation."
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Requested complete published clinical Q&A including all answers; ordinary article, not an interactive Challenge."
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse uses exact supplied title as link text; no spoiler content beyond title."
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
        "reason": "Not LiteCast; ordinary clinical article.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Predecessor insight/insight-96.html SHA256 c111fc0173ca0812d41db98d87ccb927b9c2f2c2da127656a477c547c3f097f0; no predecessor changes."
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Created insight/insight-97.html from locked predecessor shell; approved lead and verbatim three-question text, correct metadata/date/domain, one GA snippet, two preconnects, no inherited image or unrelated links."
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
        "reason": "Not LiteCast.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Semantic taxonomy decision: fixed-pros / post-and-core; primary subject is post placement/removal and ferrule, rather than a cement bonding protocol. Announced to founder."
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Added exactly one related section with glossary and fixed-pros navigation capsules; 2 of 5 slots used."
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Manually added one newest-first insight-97 link to static insight/index.html with exact supplied title and preserved original line endings."
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Audited old template 2026-10-20 -> new 2026-10-21; exact title/description across meta/OG/Twitter/JSON-LD, canonical and all displayed dates OK; no old identity remains."
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Predecessor SHA256 remains c111fc0173ca0812d41db98d87ccb927b9c2f2c2da127656a477c547c3f097f0."
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
        "reason": "Clinical article, not NoteCast.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "No episode/NoteCast sibling pair.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Clinical article, not Promptologist.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Reviewed all glossary concepts. Strong matches post-and-core/ferrule-effect/retention/dental-cement already have 6/6/5/5 related links: no additions under cap rule. Temporary-cement-contamination is adhesive-surface contamination, not substantive here; other terms do not qualify."
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
        "reason": "Not a glossary publication; no new term created.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Fresh semantic body review; linked first technical occurrence of cast/metal post, temporary cement, frictional retention and ferrule to matching glossary concepts. Four anchors only; body wording unchanged."
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Compared full brain titles and strongest candidate captions semantically; added insight-20, video-7 and insight-93 as highest-ranked complementary entries; 5 total capsules. Corrected post/core inline target placement to first exact compound mention in approved lead; text unchanged."
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
        "reason": "No attached research paper; no Drive upload.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No attached research paper; no cabinet catalog action.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No attached research paper or cited study; no research-author credit.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Authored two atomic concept cards (retrievability and frictional retention) in plus/faq-corpus.json only; distinct descriptions, unique stable IDs, no on-page FAQ/DefinedTermSet."
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Authored three standalone binary FAQ questions with explicit yes/no first clauses, no article deixis, answers grounded in submitted body; no card duplicates FAQ answers."
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Computed DES 3.4 COMMENTARY from exact full authored text: 15/E, transparency 15/19, FULL_TEXT non-provisional; quotes/arithmetic/band/exact key set PASS. Item 4 quotes insight/index.html with mandatory note. Fidelity null self-record exception, no cited research source; no DOI/abstract/quartile guessed."
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
        "reason": "Ordinary Clinical Insight Q&A, not interactive Challenge.",
        "status": "skipped"
      },
      {
        "evidence": [
          "All four founder-approved tags resolved to existing canonical concepts: #\u0627\u06cc\u0646\u0633\u0627\u06cc\u062a #\u067e\u0633\u062a_\u0648_\u06a9\u0648\u0631 #\u0633\u0645\u0627\u0646_\u0645\u0648\u0642\u062a #\u0641\u0631\u0648\u0644. No new vocabulary minted; checks/sync follow brain insertion."
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Appended clinical-97 as last of entire flat brain array; exact predecessor clinical key order/schema, approved title/lead caption/tags/keywords, frozen taxonomy decision; re-read PASS."
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified unchanged fixed-pros/post-and-core decision against live main PILLARS and page capsule; no reclassification."
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Placed in post-and-core immediately after insight/insight-20, milestone false. Reviewed catalog and candidate scopes: generic cement/temporary overlap does not make this a biomimetic, implant, ceramics or esthetic lesson; preserved fixed-pros/post-and-core split. One full pathway, no series split."
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle-post-core rejected at mechanical Gate 1: insight folder excluded from starter bundles. No bundle edits or home-bundle count changes."
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse new exact-title clinical announcement first, original first six preserved; removed bottom video-14 announcement; exactly 7, no spoilers."
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ran hashtag sync, homepage counters/rail, all pillar+sidecar builders, flashcards(2 added), quiz(3 added), image attributes(no changes), plus index, up-board; canonical tag check PASS. No asset-version rollback. Restored pathway writer EOL churn to original byte format with only intended insertion."
        ],
        "id": "C.8",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ran canonical content stamper after all Phase C builders; final content-derived version written to worker/home/player; will restamp after Phase D injectors."
        ],
        "id": "C.7",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Created full English Insight translation with approved title/lead, 16 paragraphs/6 headings matching fa, universal English chrome and source-type schemas; inverse toggles; noindex/no hreflang; standard hash unchanged. Injector/noindex/sitemap/stamper executed. Corrected draft chrome extraction before verification; no unrelated reference prose remains."
        ],
        "id": "D",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified exactly one dc-notify=true marker on Persian article; automated notification runs only on main integration, no manual external notifications sent."
        ],
        "id": "E",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "phase_f:bfee41a86691308bdbbe7f890e01f52bdbd9db838a8e465fbef0d07fba6d63b9"
        ],
        "id": "F",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          ".dentcast/publication-reports/clinical-97.md: actual Phase-F stdout, 89 passed/1 intentional chrome warning/0 failed, approvals/scopes/skips/linking/DES/English/builds and verbatim body comparison; all local content ready, main merge not authorized in current task."
        ],
        "id": "G",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/publication-reports/clinical-97.md",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "insight/en/insight-97.html",
      "insight/index.html",
      "insight/insight-97.html",
      "pillar/fixed-pros/index.html",
      "pillar/fixed-pros/structure.json",
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
      "sitemap.xml",
      "up-board/index.json"
    ]
  },
  "reconciliation": {
    "note": "Reviewed actual current work and scoped publication evidence."
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
