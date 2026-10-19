# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-36"
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
    "category": "sharehub",
    "content_id": "sharehub/share-36",
    "context": {
      "approvals": [
        {
          "decision": "Preserve founder text without rewriting",
          "evidence": [
            "Founder publication instruction, 2026-10-19"
          ],
          "scope": "final article text",
          "status": "confirmed"
        },
        {
          "decision": "Founder accepted proposed dual DES and full-text two-checker evaluation",
          "evidence": [
            "Founder instruction \u0627\u0646\u062c\u0627\u0645 \u0628\u062f\u0647 after evaluation proposal, 2026-10-19"
          ],
          "scope": "separate source DES and fresh independent Fidelity",
          "status": "confirmed"
        },
        {
          "decision": "Merge after actual completion and successful required gates",
          "evidence": [
            "Founder instruction \u0628\u0631\u0648 \u062a\u0627 \u0627\u0646\u062a\u0647\u0627 \u0648 \u0628\u0639\u062f \u0627\u062a\u0645\u0627\u0645 \u0645\u0631\u062c \u06a9\u0646, 2026-10-19"
          ],
          "scope": "merge",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "evidence": "ShareHub sequence 1 through 35; next 36 verified in brain and disk",
          "kind": "intake_identity_bound"
        },
        {
          "fidelity": {
            "altered": 0,
            "author_view": 30,
            "matches": 14,
            "not_a_claim": 7,
            "not_assessable": 0,
            "not_in_source": 2,
            "reversed": 0
          },
          "kind": "scientific_result",
          "level": "HIGH",
          "no_text_changes": true,
          "review_packet": "libfile_e08bb9477b748191aa4b1e217918edd5",
          "score": 100,
          "self_des": "19/E validated and reused unchanged",
          "source_des": "16/E COMMENTARY FULL_TEXT separately evaluated"
        },
        {
          "evidence": "Founder explicitly chose treatment-planning focus, 2026-10-19",
          "kind": "taxonomy",
          "primary": "treatment-planning",
          "subtopic": "comprehensive-diagnosis"
        },
        {
          "decision": "Approved proposed tags/keywords plus Spear concept, resolve canonical spelling",
          "evidence": "Founder requested add Spear hashtag and proceed to completion",
          "kind": "metadata"
        },
        {
          "decision": "Use publicly found article/PDF link; do not link or file via DentCast cabinet",
          "evidence": "Founder instruction \u0646\u0645\u06cc\u062e\u0648\u0627\u06cc\u0645 \u0628\u0647 \u06a9\u0627\u0628\u06cc\u0646\u062a \u062f\u0646\u062a\u200c\u06a9\u0633\u062a \u0644\u06cc\u0646\u06a9 \u0628\u0634\u0647 ... \u0633\u0631\u0686 \u06af\u0648\u06af\u0644 \u06a9\u0646 \u0648 \u0627\u0648\u0646\u0648 \u0644\u06cc\u0646\u06a9 \u06a9\u0646",
          "kind": "paper_branch_override"
        }
      ],
      "delivery": [
        {
          "evidence": [
            "Phase F:111 passed,0 warned,0 failed",
            "https://github.com/dentcast-hub/dentcast-hub.github.io/tree/feat/share-36-occlusal-planning"
          ],
          "scope": "local publication gates and authorized branch delivery before main merge"
        }
      ],
      "inputs": [
        {
          "original_personal_des": "libfile_d7614837eef481919a67ac131713b176",
          "rejected_preview": "libfile_7561a3d99b008191b7d769a934e9831b",
          "source_pdf": "libfile_91ee825c88208191bb14a5eb43b1e6ed",
          "validated_review_packet": "libfile_e08bb9477b748191aa4b1e217918edd5"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "disagreement_only_third_units": 7,
          "executed_model_ids": "UNVERIFIED (not exposed in child runtime)",
          "full_checker_runs": 2,
          "input_sha256": "5e600ecfb0cd60fdff161d6a9042c6b844bb6e505c89b596366573c7b8196e2d",
          "price": "UNVERIFIED",
          "requested_checker": {
            "model": "gpt-6-luna",
            "reasoning": "medium"
          },
          "requested_strong_reviewer": {
            "model": "gpt-6-astra",
            "reasoning": "medium"
          },
          "segmentation": "Official split_page with explicit reference-heading boundary; title-in-prose premature-stop heuristic excluded. assign/build/vote official functions unchanged. Only external source routed; self-commentary is a separate DES record.",
          "source_sha256": "291b1db0b0d015d2aebd1b16a3a1d89ddc492da7cb4646eea75a5b904839466c",
          "spec": "DES/Fidelity 3.4",
          "strong_adjudication_units": [
            "u3",
            "u24"
          ]
        },
        {
          "page_checks": "Draft only. English, taxonomy, enrichments, paper filing, builders, learning layer and Phase F are NOT complete. Do not report published.",
          "scientific_checks": "PASS: both DES canonical keys, arithmetic, band, all quote substrings; Fidelity 53 exact input quotes, whole source sentences, F4 counts, full-text basis, conclusion echo; official vote_source/main settled 7 ties and 2 strong adjudications"
        },
        {
          "content_id": "sharehub/share-36",
          "exit_code": 0,
          "expected_caption": null,
          "expected_title": "\u0628\u0627\u0632\u0633\u0627\u0632\u06cc \u0627\u06a9\u0644\u0648\u0698\u0646 \u062f\u0631 \u06a9\u06cc\u0633\u200c\u0647\u0627\u06cc \u067e\u06cc\u0686\u06cc\u062f\u0647\u061b \u0686\u0631\u0627 \u0627\u0632 \u0642\u062f\u0627\u0645 \u0628\u0627\u0644\u0627 \u0634\u0631\u0648\u0639 \u0645\u06cc\u200c\u06a9\u0646\u0645\u061f",
          "kind": "phase_f",
          "output_sha256": "80031a17c8b76846563350c521fd171a44579602e5cef97c4980148c3e8302cf",
          "recorded_at": "2026-10-19T10:00:56+00:00",
          "summary": "111 passed, 0 warned, 0 failed  \u2014 publish is COMPLETE"
        },
        {
          "english": "Full translation; structure and language/SEO/canonical/toggles checked. Optional screenshot unavailable because no local Chromium executable; did not claim screenshot inspection.",
          "final_scientific_checks": "PASS: final body equals approved text after stripping anchors; all 53 submitted-article units unchanged, language toggle excluded as chrome; 19/E self DES unchanged; no rerun",
          "learning": "3 cards and4binary quiz; treatment-planning+occlusion paths; bundle rejected gate2; full pathway density1.51",
          "source_link": "Public DSD article page found and verified via web search; full PDF link preserved; no cabinet entry or Drive upload per founder"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
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
        "reason": "ShareHub category; LiteCast branch inapplicable",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub uses brain, not LiteCast source",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub specialist linking applies",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub same-category clone applies",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub ordinary workflow applies",
        "status": "skipped"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Executed and validated in this publication session; founder-approved input and repo discovery receipts preserved in prior checkpoints."
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
        "reason": "ShareHub, not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub, not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "Founder chose treatment-planning focus; comprehensive-diagnosis is its exact relevant live subtopic"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Exactly two nav capsules; primary treatment-planning; global 5-link budget respected"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Static ShareHub landing receives exact title once, newest-first, same row markup"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Canonical, OG/Twitter title and description, JSON-LD dates/author audited; all identity values refer to share-36 and 2026-10-19"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Locked predecessor SHA256 unchanged"
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
        "reason": "ShareHub has no episode/NoteCast sibling",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "ShareHub is not Promptologist",
        "status": "skipped"
      },
      {
        "evidence": [
          "Semantically reviewed glossary: treatment-plan, tooth-wear, VDO, smile-design qualify but all four related sections already contain five links; no edits"
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
          "Four unmistakable first-occurrence technical anchors inserted; original episode-116 link retained; text unchanged"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Three strongest brain matches added after two nav capsules, exactly five links; conceptual planning/incisal-edge/full-mouth-rehab matches"
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
        "reason": "Founder requested external article link instead of DentCast cabinet filing",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "Founder external-source override: no cabinet catalog entry",
        "status": "skipped"
      },
      {
        "evidence": [
          "Direct public DSD article page verified through web search; Spear source credit links there, original full PDF link remains; no DOI guessed"
        ],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Three atomic authored DefinedTerms, body-grounded and not FAQ copies, unique stable IDs; corpus only"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Four standalone binary FAQ questions; explicit verdict first clauses; all answers grounded in approved body; corpus only"
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Validated stored independent full-text Fidelity 14/14, no altered/reversed; original self DES 19/E unchanged, independent source DES16/E; all 53 quotes still exact after anchors; receipts libfile_e08bb9477b748191aa4b1e217918edd5"
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
        "reason": "Ordinary ShareHub article, not a Challenge",
        "status": "skipped"
      },
      {
        "evidence": [
          "Five prior canonical concepts reused; founder-requested #\u0627\u0633\u067e\u06cc\u0631 minted with Spear/Frank Spear aliases; final metadata agreed"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "share-36 appended to absolute end of flat brain; exact ShareHub key/nesting order, approved author/title/metadata and pillar"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Recorded primary treatment-planning and live subtopic comprehensive-diagnosis verified; nav capsule agrees"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Placed in treatment-planning after insight-95 and occlusion after episode-132 (series boundary preserved), milestone false. Other pathways rejected semantically: no preparation/material/implant-specific instruction or veneer protocol; primary focus is diagnostic planning."
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle-occlusion-rehab rejected at gate 2: personal why-I-start-here reflection, not whole introductory concept; no bundle modified"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse exact title at absolute top, former six lines retained, oldest removed; exactly seven announcements"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ran homepage, all pillars/sidecars, flashcards, quiz, image attrs, Plus and up-board builders. Counters709, sharehub74 combined legacy/current; new ShareHub tree/indices present; episode/challenge builders inapplicable."
        ],
        "id": "C.8",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Content-hash version stamped after Phase C builders; will restamp after English and final normalization"
        ],
        "id": "C.7",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Complete English translation, canonical English chrome, identical paragraph/list/section counts, noindex/no hreflang, exact inverse toggles, template lock, enforcement and sitemap all pass"
        ],
        "id": "D",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Validated actual dc-notify=true marker once on fa page; main notification remains automated"
        ],
        "id": "E",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "phase_f:80031a17c8b76846563350c521fd171a44579602e5cef97c4980148c3e8302cf"
        ],
        "id": "F",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder-visible publication report in session: Phase F111 pass zero warnings/failures; dual DES16/E source19/E author, Fidelity14/14, 3 cards4quiz, correct pillar/source/Pulse/English; proceeding authorized merge"
        ],
        "id": "G",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "sharehub/share-36.html",
      "sharehub/en/share-36.html",
      "sharehub/index.html",
      "plus/des-scores.json",
      "plus/faq-corpus.json",
      "index.html",
      "glossary/treatment-plan.html",
      "glossary/tooth-wear.html",
      "glossary/vertical-dimension-of-occlusion.html",
      "dentcast-hashtag-reference.json",
      ".dentcast/hashtag-batches/A91-share-36.json",
      "plus/pathways.json",
      "plus/content-index.json",
      "plus/flashcards-index.json",
      "plus/quiz-index.json",
      "up-board/index.json",
      "service-worker.js",
      "player.html",
      "sitemap.xml",
      "pillar/index.html",
      "pillar/structure.json",
      "pillar/treatment-planning/index.html",
      "pillar/treatment-planning/structure.json"
    ]
  },
  "reconciliation": {
    "note": "Reviewed actual work and scoped publication evidence; no unrelated edits"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
