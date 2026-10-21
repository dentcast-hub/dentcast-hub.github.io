# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "dentai/promptologist/prompt-append2-2"
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
    "category": "promptologist",
    "content_id": "dentai/promptologist/prompt-append2-2",
    "context": {
      "approvals": [
        {
          "decision": "Founder confirmed all four proposed hashtags and prepared illustrated text",
          "evidence": [
            "Founder confirmation in current publication session: all approved"
          ],
          "scope": "Four hashtags and illustrated submitted text",
          "status": "confirmed"
        },
        {
          "decision": "Founder explicitly requested completing all steps and merging when finished",
          "evidence": [
            "Founder explicit instruction in active publication session to finish all stages and merge"
          ],
          "scope": "Complete publishing, Git delivery, PR and merge after all gates pass",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "decision": "Remove never-created dentai/promptologist/images from declared targets: all four actual WebP files are adjacent to the article and remain individually watched. No existing file or drift is removed.",
          "evidence": [
            "Git has never tracked this path; current snapshot records missing with empty index; actual four asset paths are preserved in target_paths"
          ],
          "scope": "Correct unused planned asset directory in target inventory"
        }
      ],
      "delivery": [
        {
          "evidence": [
            "https://github.com/dentcast-hub/dentcast-hub.github.io/pull/948",
            "Remote head 0addba58eda7c38d1697ac49f3fc4682e42c0b51 observed synchronized; tree c0d280203d02f4fc5285cc04a9e5e7381738b895 matches local verified tree; all 28 uploaded blob hashes matched"
          ],
          "scope": "Authorized GitHub feature branch and review delivery"
        }
      ],
      "inputs": [
        {
          "reference": "Founder supplied full tutorial and screenshot ZIP in current publication request"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "content_id": "dentai/promptologist/prompt-append2-2",
          "exit_code": 1,
          "expected_caption": "\u062d\u0627\u0644\u0627 \u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u06cc\u062f \u0627\u06cc\u0646 \u062f\u0633\u062a\u0648\u0631 \u0631\u0627 \u0646\u06af\u0647 \u062f\u0627\u0631\u06cc\u062f\u061b \u0647\u0645 \u0628\u0631\u0627\u06cc \u0627\u0633\u062a\u0641\u0627\u062f\u0647\u200c\u0647\u0627\u06cc \u0628\u0639\u062f\u06cc\u060c \u0647\u0645 \u0628\u0631\u0627\u06cc \u0631\u0648\u0632\u06cc \u06a9\u0647 \u0634\u0627\u06cc\u062f \u0628\u0647 \u0627\u06cc\u0646 \u0627\u06a9\u0627\u0646\u062a \u062f\u0633\u062a\u0631\u0633\u06cc \u0646\u062f\u0627\u0634\u062a\u0647 \u0628\u0627\u0634\u06cc\u062f.",
          "expected_title": "\u067e\u06cc\u0648\u0633\u062a \u06f2 \u0640 \u0642\u0633\u0645\u062a \u06f2: \u0627\u0648\u0644\u06cc\u0646 \u0641\u0627\u06cc\u0644 \u0631\u0627 \u0628\u06cc\u0631\u0648\u0646 \u0627\u0632 \u0627\u06a9\u0627\u0646\u062a \u0646\u06af\u0647 \u062f\u0627\u0631\u06cc\u0645",
          "kind": "phase_f",
          "output_sha256": "ce0e67526118c1915ca3575dbe0aeae4d474443bf553edfaa2e61813431a0db4",
          "recorded_at": "2026-10-21T10:55:40+00:00",
          "summary": "96 passed, 0 warned, 1 failed  \u2014 publish is INCOMPLETE"
        },
        {
          "content_id": "dentai/promptologist/prompt-append2-2",
          "exit_code": 0,
          "expected_caption": "\u062d\u0627\u0644\u0627 \u0645\u06cc\u200c\u062e\u0648\u0627\u0647\u06cc\u062f \u0627\u06cc\u0646 \u062f\u0633\u062a\u0648\u0631 \u0631\u0627 \u0646\u06af\u0647 \u062f\u0627\u0631\u06cc\u062f\u061b \u0647\u0645 \u0628\u0631\u0627\u06cc \u0627\u0633\u062a\u0641\u0627\u062f\u0647\u200c\u0647\u0627\u06cc \u0628\u0639\u062f\u06cc\u060c \u0647\u0645 \u0628\u0631\u0627\u06cc \u0631\u0648\u0632\u06cc \u06a9\u0647 \u0634\u0627\u06cc\u062f \u0628\u0647 \u0627\u06cc\u0646 \u0627\u06a9\u0627\u0646\u062a \u062f\u0633\u062a\u0631\u0633\u06cc \u0646\u062f\u0627\u0634\u062a\u0647 \u0628\u0627\u0634\u06cc\u062f.",
          "expected_title": "\u067e\u06cc\u0648\u0633\u062a \u06f2 \u0640 \u0642\u0633\u0645\u062a \u06f2: \u0627\u0648\u0644\u06cc\u0646 \u0641\u0627\u06cc\u0644 \u0631\u0627 \u0628\u06cc\u0631\u0648\u0646 \u0627\u0632 \u0627\u06a9\u0627\u0646\u062a \u0646\u06af\u0647 \u062f\u0627\u0631\u06cc\u0645",
          "kind": "phase_f",
          "output_sha256": "0255954a12c2db9eabf73bc36facbdfbb81e33c0916f2c9644b5e9b48e396bea",
          "recorded_at": "2026-10-21T10:56:50+00:00",
          "summary": "97 passed, 0 warned, 0 failed  \u2014 publish is COMPLETE"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Read active AGENTS, routers, agent parity, complete global sections and applicable modules; source revision 3596ca1"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "User supplied tutorial text and screenshot ZIP; no paper attachment; ordinary page publication"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed all 566 brain entries; identified 23 promptologist entries, latest append2-1 schema and live PILLARS taxonomy"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder explicitly chose promptologist"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "User title explicitly identifies appendix 2 part 2; predecessor append2-1 exists"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Complete founder text preserved in prepared article.md"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Read text: natural explanatory prose, no genuine AI style rewrites necessary"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Four user-supplied screenshots inspected and converted losslessly to WebP"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ZIP contains screenshots only, no attached research paper"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "COMMENTARY: original practical tutorial, no identified research paper; source is own body FULL_TEXT"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ordinary instructional article, supplied complete explanatory body rather than challenge question"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse uses exact supplied title as link text, no spoiler; established series announcement pattern"
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
        "reason": "Promptologist is not LiteCast; isolated branch inactive under module 03",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Promptologist is not LiteCast; isolated branch inactive under module 03",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Promptologist is not LiteCast; isolated branch inactive under module 03",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Promptologist is not LiteCast; isolated branch inactive under module 03",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Promptologist is not LiteCast; isolated branch inactive under module 03",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template locked: append2-1 SHA256 captured in publication-work/template-hash.txt"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "New Persian page built with exact submitted text and title, original opening, 4 lossless WebP figures/captions, GA once and both API preconnects"
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
        "reason": "Promptologist is not LiteCast; ordinary enrichment applies",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Promptologist is not LiteCast; ordinary enrichment applies",
        "status": "skipped"
      },
      {
        "evidence": [
          "Live taxonomy: practice-infrastructure / llm-tools; tutorial concerns GitHub workspace and agent file handling, matching previous appendix"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Exactly one related section, two site capsules; pillar URL canonical trailing slash, 3 slots remain"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Hand-maintained series landing: added part 2 once under appendix 2 after part 1; same row structure"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Meta audit all OK: exact title and source excerpt caption; org canonical; Article/Breadcrumb URLs; published/modified 2026-10-21; reading time computed 6 min"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Predecessor template SHA256 unchanged: 4caf7a3dc5bb666fba505344b1699720ab487e5c63958a8f5c154dfcb06b3906"
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
        "reason": "Not NoteCast or core episode; no sibling evidence pair",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not NoteCast or core episode; no sibling evidence pair",
        "status": "skipped"
      },
      {
        "evidence": [
          "New previous points to append2-1, next empty; predecessor only next slot changed; before 4caf7a3dc5bb666fba505344b1699720ab487e5c63958a8f5c154dfcb06b3906 after 5a8b961edb72ea4e1ec612ec2d1d3fe8c67edafd7b9b1374c04ecd5681e681e7"
        ],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Reviewed all 109 glossary concepts semantically: no substantive GitHub/Markdown/agent concept; clinical example alone does not justify backlink; 0 candidates"
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
        "reason": "Not glossary publication; no new term to cross-link",
        "status": "skipped"
      },
      {
        "evidence": [
          "Fresh body analysis against glossary and core episodes: 0 qualifying concepts; surgical aftercare is illustrative, article teaches file ownership; no clinical links added"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Compared brain subjects; selected previous appendix (prerequisite), own workspace, input privacy; filled 3 available slots, total 5. Hash 1f52c1d1b9a68ea2715ffa1e728453be03dda4b6b588169e63bd84ae513e83ee -> a4d9a6898ec9eab91804378d69f379892b98a9f12f21f9c3669b241e7bb224bc"
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
        "reason": "No attached research paper; screenshot ZIP does not trigger Drive/catalog/DOI branch",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No attached research paper; screenshot ZIP does not trigger Drive/catalog/DOI branch",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No attached research paper; screenshot ZIP does not trigger Drive/catalog/DOI branch",
        "status": "skipped"
      },
      {
        "evidence": [
          "Authored 4 atomic definitions in FAQ corpus; standalone concepts with unique stable IDs; no FAQ answer copied; no on-page schema"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Five actual standalone binary FAQ questions authored in committed FAQ corpus; verdicts explicit, no deixis"
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "COMMENTARY own FULL_TEXT, full v3.4 instructions read: computed 12/E (5+4+0+3+0), quotes/arithmetic/band/schema verified; self-record Fidelity lawful null; no DOI or quartile guessed"
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
        "reason": "Ordinary tutorial, not Challenge",
        "status": "skipped"
      },
      {
        "evidence": [
          "All 4 founder-approved tags resolved to existing canonical concepts by direct reference and simulate; no mint or alias needed; sync/check follows actual brain write"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "New entry at absolute flat brain tail; identical previous promptologist key shape, exact supplied title and excerpt caption, canonical tags, locked pillar"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified primary practice-infrastructure and subtopic llm-tools against live taxonomy, no new keys, matching related capsule"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Catalog explicitly includes the whole Promptologist course; unmistakable continuation placed in ai-dentistry after appendix2-1, milestone false; tool score ASK judged against actual catalog, no other pathway needs file-upload tutorial"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No candidate bundle continues ai-dentistry; zero bundles applicable; no bundle files edited"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Exact-title no-spoiler announcement inserted first, prior first six retained verbatim, bottom item removed; exactly 7 Pulse lines"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "All 8 applicable builders/checks succeeded; 4 cards and 5 binary questions indexed, new pillar page/sidecar and plus/up-board updated; image injector changed 0 existing pages; no asset-version rollback"
        ],
        "id": "C.8",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Content version stamped from final content inputs after all builders"
        ],
        "id": "C.7",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Full English body translated with same 6 sections, 4 figures and captions; universal English chrome, noindex/no hreflang, inverse document toggles, reciprocal English series nav; meta-1 hash unchanged; injectors/sitemap/stamp passed"
        ],
        "id": "D",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Persian page has dc-notify true exactly once; existing main Action handles notification with API dedup"
        ],
        "id": "E",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "phase_f:0255954a12c2db9eabf73bc36facbdfbb81e33c0916f2c9644b5e9b48e396bea"
        ],
        "id": "F",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          ".dentcast/publication-reports/promptologist-prompt-append2-2.md contains actual stage outcomes, canonical skips, 97/0/0 gate, builder evidence, limitations and scoped file list"
        ],
        "id": "G",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/publication-reports/promptologist-prompt-append2-2.md",
      "dentai/promptologist/en/prompt-append2-1.html",
      "dentai/promptologist/en/prompt-append2-2.html",
      "dentai/promptologist/index.html",
      "dentai/promptologist/prompt-append2-1.html",
      "dentai/promptologist/prompt-append2-2-01-github-home.webp",
      "dentai/promptologist/prompt-append2-2-02-new-repository.webp",
      "dentai/promptologist/prompt-append2-2-03-repository-name.webp",
      "dentai/promptologist/prompt-append2-2-04-upload-files.webp",
      "dentai/promptologist/prompt-append2-2.html",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "pillar/index.html",
      "pillar/practice-infrastructure/index.html",
      "pillar/practice-infrastructure/structure.json",
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
    "note": "Correct initial unused directory declaration only; preserve all actual assets and complete evidence"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
