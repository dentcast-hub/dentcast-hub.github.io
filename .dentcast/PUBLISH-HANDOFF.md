# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-42"
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
    "content_id": "chairside/chairside-42",
    "context": {
      "approvals": [
        {
          "decision": "Both exact proposed paragraphs approved",
          "evidence": [
            "Current-session founder reply: both proposed openings approved"
          ],
          "scope": "Persian and English opening paragraph",
          "status": "confirmed"
        },
        {
          "decision": "Chairside and ordinary post explicitly selected",
          "evidence": [
            "Current-session user request and ordinary-post answer"
          ],
          "scope": "Publication category and ordinary post",
          "status": "confirmed"
        },
        {
          "decision": "All four exact proposed metadata items approved",
          "evidence": [
            "Current-session founder reply to the exact scoped proposal"
          ],
          "scope": "Caption, English title, hashtags and keywords",
          "status": "confirmed"
        },
        {
          "decision": "treatment-planning / comprehensive-diagnosis explicitly selected",
          "evidence": [
            "Current-session founder reply to the exact scoped proposal"
          ],
          "scope": "Primary pillar and subtopic",
          "status": "confirmed"
        },
        {
          "decision": "Founder explicitly authorized merge and live verification",
          "evidence": [
            "Current-session founder reply to exact merge/live proposal"
          ],
          "scope": "Merge completed Chairside 42 into main and verify live publication",
          "status": "confirmed"
        }
      ],
      "decisions": [
        "Ordinary Chairside, user confirmed; next ID 42; own clinical commentary, no paper",
        "Single style pass: preserve original prose",
        "Template SHA256 df27aa4de1f565c376d30b017d5b3b3f32b44e704bd0eb7a75ba8e5157af20de",
        "Founder confirmed only two pathways; no additional esthetic/fixed-pros membership",
        "Technical report records all applicable canonical outcomes and skips at .dentcast/publication-reports/chairside-42.md"
      ],
      "delivery": [
        {
          "evidence": [
            "Git remote main and publication feature both observed at 69fea5651285d49c66dab47d8d7a3ad572ccda49",
            "https://github.com/dentcast-hub/dentcast-hub.github.io/commit/69fea5651285d49c66dab47d8d7a3ad572ccda49"
          ],
          "scope": "Authorized feature delivery and fast-forward merge into main"
        },
        {
          "evidence": [
            "https://dentcast.org/chairside/chairside-42.html",
            "https://dentcast.org/chairside/en/chairside-42.html",
            "https://dentcast.org/chairside/chairside42.webp",
            "https://dentcast.ir/chairside/chairside-42.html",
            "https://dentcast.ir/chairside/en/chairside-42.html",
            "https://dentcast.ir/chairside/chairside42.webp",
            ".dentcast/publication-reports/chairside-42.md"
          ],
          "scope": "Live Persian page, English mirror and WebP on both .org and .ir; six HTTP 200 responses and SHA256 equality with committed bytes"
        },
        {
          "evidence": [
            "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39487398661",
            "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39487400601",
            "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39487400358"
          ],
          "scope": "Pages deployment, live contract checks, new-article notification and asset guards observed successful"
        }
      ],
      "inputs": [
        "User supplied Chairside text and clinical image in current session"
      ],
      "pending_questions": [],
      "unrelated_changes": [
        "Pre-existing untracked .dentcast/work/share-38-phasef.txt"
      ],
      "validation": [
        "Pillow reopened generated WebP: 1280x680 pixels, 152508 bytes",
        "Git push dry-run to intended feature ref succeeded; no remote ref written yet",
        "Reviewed hashtag_ref --sync: seven existing concept counts updated for this publication; no aliases/concepts authored",
        {
          "content_id": "chairside/chairside-42",
          "exit_code": 1,
          "expected_caption": "\u0627\u0645\u0631\u0648\u0632 \u0628\u06cc\u0645\u0627\u0631\u06cc \u0628\u0631\u0627\u06cc \u0645\u0634\u0627\u0648\u0631\u0647 \u0645\u0631\u0627\u062c\u0639\u0647 \u06a9\u0631\u062f\u0647 \u0628\u0648\u062f \u06a9\u0647 \u062f\u0631 \u0646\u0627\u062d\u06cc\u0647 \u0644\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627 \u0633\u0645\u062a \u0686\u067e \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0627\u0634\u062a. \u0633\u0624\u0627\u0644\u0634 \u0627\u06cc\u0646 \u0628\u0648\u062f \u06a9\u0647 \u0622\u06cc\u0627 \u062f\u0631\u0645\u0627\u0646 \u0627\u0631\u062a\u0648\u062f\u0646\u0633\u06cc \u0628\u0647 \u0645\u0631\u062d\u0644\u0647\u200c\u0627\u06cc \u0631\u0633\u06cc\u062f\u0647 \u06a9\u0647 \u0628\u062a\u0648\u0627\u0646\u06cc\u0645 \u0631\u0648\u06a9\u0634 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0627 \u0628\u0633\u0627\u0632\u06cc\u0645 \u06cc\u0627 \u0647\u0646\u0648\u0632 \u0628\u0647 \u062c\u0627\u0628\u0647\u200c\u062c\u0627\u06cc\u06cc \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627 \u0646\u06cc\u0627\u0632 \u062f\u0627\u0631\u06cc\u0645\u061f",
          "expected_title": "\u0641\u0636\u0627\u06cc \u0627\u0636\u0627\u0641\u06cc \u06a9\u0646\u0627\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0627 \u0627\u0632 \u06a9\u062f\u0627\u0645 \u0633\u0645\u062a \u0628\u0628\u0646\u062f\u06cc\u0645\u061f",
          "kind": "phase_f",
          "output_sha256": "d9fc69e497a650072bcc2a4131ef1f74cf74044903257cf3f88a3b2f1112b07e",
          "recorded_at": "2026-10-20T19:49:20+00:00",
          "summary": "Verifier did not produce its expected summary"
        },
        {
          "content_id": "chairside/chairside-42",
          "exit_code": 0,
          "expected_caption": "\u0627\u0645\u0631\u0648\u0632 \u0628\u06cc\u0645\u0627\u0631\u06cc \u0628\u0631\u0627\u06cc \u0645\u0634\u0627\u0648\u0631\u0647 \u0645\u0631\u0627\u062c\u0639\u0647 \u06a9\u0631\u062f\u0647 \u0628\u0648\u062f \u06a9\u0647 \u062f\u0631 \u0646\u0627\u062d\u06cc\u0647 \u0644\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627 \u0633\u0645\u062a \u0686\u067e \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0627\u0634\u062a. \u0633\u0624\u0627\u0644\u0634 \u0627\u06cc\u0646 \u0628\u0648\u062f \u06a9\u0647 \u0622\u06cc\u0627 \u062f\u0631\u0645\u0627\u0646 \u0627\u0631\u062a\u0648\u062f\u0646\u0633\u06cc \u0628\u0647 \u0645\u0631\u062d\u0644\u0647\u200c\u0627\u06cc \u0631\u0633\u06cc\u062f\u0647 \u06a9\u0647 \u0628\u062a\u0648\u0627\u0646\u06cc\u0645 \u0631\u0648\u06a9\u0634 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0627 \u0628\u0633\u0627\u0632\u06cc\u0645 \u06cc\u0627 \u0647\u0646\u0648\u0632 \u0628\u0647 \u062c\u0627\u0628\u0647\u200c\u062c\u0627\u06cc\u06cc \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627 \u0646\u06cc\u0627\u0632 \u062f\u0627\u0631\u06cc\u0645\u061f",
          "expected_title": "\u0641\u0636\u0627\u06cc \u0627\u0636\u0627\u0641\u06cc \u06a9\u0646\u0627\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0627 \u0627\u0632 \u06a9\u062f\u0627\u0645 \u0633\u0645\u062a \u0628\u0628\u0646\u062f\u06cc\u0645\u061f",
          "kind": "phase_f",
          "output_sha256": "b12e652d4b335e6dd5bfca981d31c4edde73fd6fe9e961568624d52d20901a1a",
          "recorded_at": "2026-10-20T19:49:50+00:00",
          "summary": "95 passed, 0 warned, 0 failed  \u2014 publish is COMPLETE"
        },
        "Final rendered Persian prose equals the approved lead followed by all 14 original paragraphs codepoint-for-codepoint",
        "All six live publication files returned HTTP 200 and exact committed SHA256; remaining Arvan repository-wide header/sync run reported separately, not assumed successful"
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Loaded active global core, agent-parity, modules 01 and 02; python runtime and Git dry-run verified"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Current user supplies text and image only; ordinary page route, no attached research paper"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed complete 564-entry brain; discovered category schemas and contiguous Chairside 1-41; inspected predecessor and live PILLARS from main-derived branch"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "User explicitly selected Chairside"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Contiguous category sequence ends at 41; next identity chairside-42 announced"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Full title and clinical narrative supplied in current user message"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Completed single de-AI review; no genuine AI tells, preserve submitted text"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "User supplies clinical JPEG and explicitly requests WebP conversion"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Only clinical image attached; no paper branch"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Own case narration without retrievable research citation; COMMENTARY"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "User explicitly confirmed ordinary publication in reply to intake question"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Announced title-only Pulse line using same-category no-spoiler convention"
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
        "reason": "Not LiteCast: locked Chairside",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: brain is ordinary specialist brain",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: specialist links required",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: use Chairside template",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: ordinary specialist route",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template chairside/chairside-41.html SHA256 df27aa4de1f565c376d30b017d5b3b3f32b44e704bd0eb7a75ba8e5157af20de; structural template read"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "chairside/chairside-42.html built from locked same-category template; 14 original paragraphs plus approved lead; approved metadata and WebP 1280x680; SHA256 88aff9dbbcd736a43ecf40519db6564eb323ebacfec9aa1cd0a7e63a33dde994"
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
        "reason": "Not LiteCast: use specialist inline linking C.4.8",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: use specialist related linking C.4.9",
        "status": "skipped"
      },
      {
        "evidence": [
          "Founder explicitly chose treatment-planning / comprehensive-diagnosis from live taxonomy; held unchanged for downstream steps"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified single typed-brain related section with two specialist capsules; pillar target /pillar/treatment-planning/"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Hand-maintained chairside/index.html gained exactly one newest-first link, preserving sibling markup"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Date/meta audit: all title, caption, image, canonical and date surfaces agree; 2026-10-14 -> 2026-10-20, all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Template SHA256 unchanged: df27aa4de1f565c376d30b017d5b3b3f32b44e704bd0eb7a75ba8e5157af20de"
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
        "reason": "Chairside, not NoteCast: no parent episode",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Chairside, not episode/NoteCast pair: no mirrored evidence base",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Chairside, not Promptologist: no series prev-next mutation",
        "status": "skipped"
      },
      {
        "evidence": [
          "Fresh semantic glossary analysis: dental-implant: 5 links, cap reached; implant-supported-crown: 5 links, cap reached; emergence-profile: 7 links, cap reached; treatment-plan: 5 links, cap reached; no glossary pages mutated"
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
        "reason": "Chairside publishes no new glossary term; no unscoped cross-link sweep",
        "status": "skipped"
      },
      {
        "evidence": [
          "Four first-occurrence high-confidence inline glossary links: implant crown, dental implant, emergence profile, treatment plan; anchors only; SHA256 88aff9dbbcd736a43ecf40519db6564eb323ebacfec9aa1cd0a7e63a33dde994 -> baf269afc1c78e7af7f930a4626905c980e1054fa05d980b7cf7a9c577dfd89d"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Fresh whole-brain semantic review ranked insight-38, insight-19, chairside-1; inserted three specific capsules after two nav capsules, 2+3=5; SHA256 baf269afc1c78e7af7f930a4626905c980e1054fa05d980b7cf7a9c577dfd89d -> d5e772110463eca17ad0f31abd9d13b5874071370112643a14444b5e0e2bf793"
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
        "reason": "No attached research paper: no Drive upload",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No attached research paper: no cabinet catalog entry",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No attached research paper: no paper author/DOI credit",
        "status": "skipped"
      },
      {
        "evidence": [
          "Three authored atomic flashcards stored only in plus/faq-corpus.json, IDs flashcards-c1..c3; standalone definitions, no FAQ copies"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Four standalone binary FAQ items authored from the submitted reasoning; all answers open with explicit yes/no; no article deixis or invented outcomes"
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed DES v3.4 COMMENTARY on final own body: 5+4+0+3+3=15/E, full text, not provisional; four quote/arithmetic/band/schema checks passed. No supplied score; no DOI or quartile guessed. Fidelity not owed for own commentary self-record."
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
        "reason": "Founder confirmed ordinary post, not Challenge; no challenge markup or private answer",
        "status": "skipped"
      },
      {
        "evidence": [
          "All seven founder-approved hashtags resolve to existing canonical library concepts; no aliases or new concepts minted; hashtag_ref --check passed"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Appended chairside-42 as absolute last element of flat brain; key set/order and nested pillar shape exactly match Chairside 41"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain and capsule preserve founder-confirmed treatment-planning/comprehensive-diagnosis; live taxonomy and unchanged schema verified"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Inserted treatment-planning after insight-19 and implant-prosthetic after insight-10, milestone=false in both; no series split. Founder declined additional fixed-pros/esthetic membership. Coverage: 787 memberships/521 items=1.51 (curated baseline 1.38)."
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Candidate bundle-implant-parts rejected at gate 1: Chairside cases are never starter-bundle entries. No bundle changes or shared-asset bump required."
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Inserted title-only Chairside announcement as first Pulse line; preserved previous first six lines and removed insight-95 oldest line; exactly seven remain"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Canonical ordered builders all exited 0; homepage Chairside counter 41->42; pillar HTML+sidecar rebuilt; 3 cards and 4 quiz questions indexed; images injector no-op; Plus/up-board indexes and canonical hashtag check passed. No episode/challenge builder owed."
        ],
        "id": "C.8",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "stamp-version.py exited 0; content version 3d885f9cdd -> a0198655e7; worker and four brain-fetch URLs stamped after all brain/shared writes"
        ],
        "id": "C.7",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "English mirror built: all 14 paragraphs plus approved lead translated, Chairside structure/schema retained; English chrome from meta-1; noindex and zero hreflang; inverse toggles; chrome SHA256 87df46fcc3d2cacb7e8ffab9942e46670508ae5ac05af35c90a2f92492e87da0 unchanged. noindex check 296/0 missing; sitemap generated excluding en; stamp current. Global hreflang scan no-op on site pages, one extraneous node_modules Playwright snapshot error recorded."
        ],
        "id": "D",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified exactly one dc-notify=true marker in Persian page head; English translation has no marker; main-push notification automation applies after authorized merge."
        ],
        "id": "E",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "phase_f:b12e652d4b335e6dd5bfca981d31c4edde73fd6fe9e961568624d52d20901a1a"
        ],
        "id": "F",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          ".dentcast/publication-reports/chairside-42.md"
        ],
        "id": "G",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/publication-reports/chairside-42.md",
      "chairside/chairside-42.html",
      "chairside/chairside42.webp",
      "chairside/en/chairside-42.html",
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
    "note": "Reviewed actual scoped work and user decisions in continuous session"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
