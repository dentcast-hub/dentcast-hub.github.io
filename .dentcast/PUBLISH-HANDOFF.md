# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-40"
- Status: in_progress
- Next canonical step: "C.4.14"
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "sharehub",
    "content_id": "sharehub/share-40",
    "context": {
      "approvals": [
        {
          "decision": "ShareHub",
          "evidence": [
            "Founder confirmation in active publication conversation, 2026-10-23"
          ],
          "scope": "category",
          "status": "confirmed"
        },
        {
          "decision": "\u0628\u0631\u06cc\u062c \u0628\u0627 \u0631\u06cc\u062a\u06cc\u0646\u0631 \u0648\u0646\u06cc\u0631\u061b \u0686\u0647 \u0632\u0645\u0627\u0646\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u0645\u0646\u0627\u0633\u0628\u06cc \u0627\u0633\u062a\u061f",
          "evidence": [
            "Founder confirmation in active publication conversation, 2026-10-23"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "#Share_Hub #RBFDP #\u0628\u0631\u06cc\u062c #\u0644\u0645\u06cc\u0646\u06cc\u062a_\u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc #\u0644\u06cc\u062a\u06cc\u0648\u0645_\u062f\u06cc_\u0633\u06cc\u0644\u06cc\u06a9\u0627\u062a",
          "evidence": [
            "Founder confirmation in active publication conversation, 2026-10-23"
          ],
          "scope": "hashtags",
          "status": "confirmed"
        },
        {
          "decision": "Use the first paragraph of ARTICLE.md verbatim; no newly authored opening",
          "evidence": [
            "Founder confirmation in active publication conversation, 2026-10-23"
          ],
          "scope": "opening paragraph",
          "status": "confirmed"
        },
        {
          "decision": "Continue selected editorial package through canonical workflow; no merge authorized",
          "evidence": [
            "Founder confirmation in active publication conversation, 2026-10-23"
          ],
          "scope": "publication preparation",
          "status": "confirmed"
        },
        {
          "decision": "Rename supplied Drive paper to its real article title and move into correct cabinet topic folder; update cabinet and use full paper for DES",
          "evidence": [
            "Founder explicit Drive instruction 2026-10-23"
          ],
          "scope": "Drive filing",
          "status": "confirmed"
        },
        {
          "decision": "\u0627\u0635\u0644\u0627\u062d \u06a9\u0646 \u2014 apply exact proposed rewrite shown for this sentence",
          "evidence": [
            "Founder explicit approval: \u0627\u0635\u0644\u0627\u062d \u06a9\u0646 \u062e\u0648\u062f\u062a \u0647\u0645\u06cc\u0646 \u062f\u0648 \u0645\u0648\u0631\u062f \u0631\u0648"
          ],
          "scope": "Fidelity founder decision u68",
          "status": "confirmed"
        },
        {
          "decision": "\u0627\u0635\u0644\u0627\u062d \u06a9\u0646 \u2014 apply exact proposed rewrite shown for this sentence",
          "evidence": [
            "Founder explicit approval: \u0627\u0635\u0644\u0627\u062d \u06a9\u0646 \u062e\u0648\u062f\u062a \u0647\u0645\u06cc\u0646 \u062f\u0648 \u0645\u0648\u0631\u062f \u0631\u0648"
          ],
          "scope": "Fidelity founder decision u75",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "evidence": "Contiguous ShareHub IDs 1\u201339; founder confirmed ShareHub intake and proposed title",
          "kind": "intake_identity_bound"
        },
        {
          "doi": "10.32592/3dj.14.1.8",
          "kind": "source_basis",
          "reference": "User-attached PDF 1737-383756-en-1664285.pdf",
          "text_basis": "FULL_TEXT"
        },
        {
          "folder_id": "14ez2Wd98xDyVs1hN2NZnR5tjkKv22zh2",
          "kind": "paper_filing",
          "reason": "Resin-bonded veneer-retained fixed bridges; same topic folder as preceding occlusal-veneer bridge paper",
          "topic_path": "Maryland bridge"
        },
        {
          "checker_model": "gpt-6-luna",
          "checker_reasoning": "medium",
          "independent_contexts": true,
          "kind": "scientific_model_routing",
          "per_role_selection": true,
          "pricing": "UNVERIFIED",
          "reviewer_model": "gpt-6-astra",
          "reviewer_reasoning": "medium"
        },
        {
          "kind": "scientific_input_replaced",
          "reason": "Two-column Library extraction interleaved sentences; replace with logical reading-order extraction from founder-supplied Drive file of the same PDF. Prior scientific runs superseded.",
          "source_reference": "Drive 1gLyrSp6vLIRDR_pFoCsgndsCSKrWwfxG; same PDF size 1145768 bytes",
          "source_sha256": "e9a3ff51cf5f1a47e4abdabf5caf1ecc1fcac88e86e801e2ed492c0d991e83af"
        },
        {
          "decision": "Apply the two proposed rewrites exactly; rerun only these units against unchanged full source.",
          "kind": "fidelity-edits",
          "units": [
            "u68",
            "u75"
          ]
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "reference": ".dentcast/work/vrfdp-veneer-bridge-2025/WORK-HANDOFF.md",
          "scope": "Editorial package explicitly selected by founder for publication on 2026-10-23"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "artifacts": [
            {
              "path": "/tmp/vrfdp-fidelity/out-src0-3.json",
              "sha256": "87a41c8fbfe897026ef4e2634b61f9462846ab1f8c7f17a0404f5247b49e08ee"
            },
            {
              "path": "/tmp/vrfdp-fidelity/review.json",
              "sha256": "fbb0cb02c9c6444db22b80c3cf59eb2dc5e0244fdd7592d40c2d1955e8ef1b83"
            },
            {
              "path": "/tmp/vrfdp-fidelity/adjudicate.json",
              "sha256": "21d62fe8ab60e443848737555309f2fe3a166df9f4b579e8d2031a616a927fdf"
            },
            {
              "path": "/tmp/vrfdp-fidelity/out-src0-1.json",
              "sha256": "ab837b1f5d84885075fdf4873cdb6ce0dc5c3f4615b22dfd8184f710a9dc7372"
            },
            {
              "path": "/tmp/vrfdp-fidelity/voted-src0.json",
              "sha256": "52d5da1d21b253b8e7e742c53b54636964e9bf5dd3b379a5f6e366209e0d66d9"
            },
            {
              "path": "/tmp/vrfdp-fidelity/out-src0-2.json",
              "sha256": "3ba80d0ba3246274afb982a1c9b199e5fe104ea5a66baa024ad28cbd6b86bcc2"
            },
            {
              "path": "/tmp/vrfdp-fidelity/input-src0.json",
              "sha256": "914555776018cd083570ce5d4fa4a996097dca0e20f76150aa1e339cda277150"
            },
            {
              "path": "/tmp/vrfdp-des.json",
              "sha256": "2901c09f1d30f59e30d969d345922b09361df8d06a90abeccd441bb1b235747c"
            },
            {
              "path": "/tmp/vrfdp-source.txt",
              "sha256": "e9a3ff51cf5f1a47e4abdabf5caf1ecc1fcac88e86e801e2ed492c0d991e83af"
            }
          ],
          "fidelity_level": "HIGH",
          "fidelity_score": 98,
          "flagged": [
            "u68",
            "u75"
          ],
          "kind": "scientific-founder-gate",
          "note": "Actual independent runs. SOURCE isolated from Fidelity. All three current checker outputs and final voted result pass 15 schema/quote checks each. Third checker repaired own encoding/exact-quotation issues without changing verdicts. All votes closed; strong-review dissents retained for u68/u75. Explicit per-sentence founder decision pending before final Fidelity storage. Not final publication verification.",
          "open_vote_items": [],
          "source_band": "E",
          "source_basis": "FULL_TEXT",
          "source_score": 15
        }
      ]
    },
    "external_actions": [
      {
        "evidence": [
          "Drive update_file succeeded; metadata readback confirms exact article filename and sole parent 14ez2Wd98xDyVs1hN2NZnR5tjkKv22zh2"
        ],
        "id": "drive-paper-rename-move",
        "status": "completed",
        "target": "Drive file 1gLyrSp6vLIRDR_pFoCsgndsCSKrWwfxG"
      }
    ],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Read active router, agent-parity, modules 01/02 and core global sections; repository HEAD includes current main ba834964bda1c9afcf215d31038b023c306c6aa9"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Editorial ARTICLE.md plus attached paper 1737-383756-en-1664285.pdf (identified in selected WORK-HANDOFF.md); ordinary research page and paper ingestion active"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed all 571 brain entries; discovered categories and latest same-category schema; ShareHub IDs 1\u201339 contiguous, next 40; live PILLARS loaded from current-main builder"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder confirmation 2026-10-23: proposed ShareHub category accepted"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ShareHub sequence 1\u201339 is contiguous; assigned sharehub/share-40"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ARTICLE.md selected unchanged; founder explicitly requires its verbatim first paragraph as opening"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Editorial style pass: clinically specific prose, no rewrite necessary; original article retained"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Three WebP photographs supplied in editorial package; no audio or video required by latest ShareHub schema"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Attached five-page PDF libfile_e4429d6a677c81919d82bb2bb86338e6 read fully; paper ingestion active"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "RESEARCH FULL_TEXT: Alikhasi et al. 2025, DOI 10.32592/3dj.14.1.8; source resolved from attached PDF"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder selected a full clinical article with introduction/explanation/conclusion and confirmed ShareHub; ordinary publication, not a challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse will use confirmed title as link text in standard ShareHub announcement; no findings disclosed"
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
        "reason": "ShareHub, not LiteCast",
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
        "reason": "Specialist ShareHub follows general linking",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub template applies",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "ShareHub general workflow applies",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template sharehub/share-39.html locked with SHA256 recorded in local /tmp/vrfdp-template.sha; template remains untouched"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/share-40.html structurally cloned from share-39; full original article preserved with first paragraph verbatim; 3 supplied WebP figures positioned and credited; source credit corrected; English toggle deferred until real pair exists"
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
        "reason": "Not LiteCast; general body linking at C.4.8",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; general related links at C.4.9",
        "status": "skipped"
      },
      {
        "evidence": [
          "Semantic determination: fixed-pros / crowns-onlays, matching restorative bridge/retainer design rather than general esthetics; announced to founder"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Exactly 2 specialist capsules inserted once: /glossary/ and /pillar/fixed-pros/; 3 remaining slots"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Hand-maintained ShareHub landing gains exactly one newest-first link to share-40 with confirmed title and existing author convention; CRLF preserved"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Audit: confirmed title/description, canonical and OG URL share-40; all CreativeWork dates 2026-10-23; predecessor ID absent; original opening preserved"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sha256sum -c /tmp/vrfdp-template.sha: sharehub/share-39.html OK, predecessor unchanged"
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
        "reason": "ShareHub, not NoteCast; no parent episode",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "ShareHub, no paired episode/NoteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "ShareHub, not Promptologist",
        "status": "skipped"
      },
      {
        "evidence": [
          "Reviewed all 109 glossary concepts. Strong candidates lithium-disilicate, onlay, canine-guidance, feldspathic-porcelain, dental-implant, tooth-wear each already have 5 related links; no backlink added under hard cap"
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
        "reason": "ShareHub publication adds no new glossary term",
        "status": "skipped"
      },
      {
        "evidence": [
          "Fresh semantic analysis: 6 first-occurrence inline anchors to dental-implant, lithium-disilicate, onlay, tooth-wear, canine-guidance and feldspathic-porcelain. Tag-stripped text unchanged; no duplicate targets"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Fresh full-brain conceptual review; filled 3 remaining slots with dentai-7 (anterior resin-bonded bridge framework), share-39 (occlusal-veneer retained bridge), notecast episode-37 (proximal contact management in veneer preparations); 5 total links"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Renamed existing supplied Drive file and moved from cabinet root to Maryland bridge folder 14ez2Wd98xDyVs1hN2NZnR5tjkKv22zh2; original file ID retained and metadata verified"
        ],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Catalog P2945 added with retained Drive ID, exact real paper title, Maryland bridge topic, DOI, abstract, verified 1145768-byte size, semantic tags including title tag and ShareHub-40 link. Same keys as P2944. total_papers=2260; historical scan counters preserved; no round-hundred claim crossed"
        ],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Source author anchor already correct: Marzieh Alikhasi \u2192 https://doi.org/10.32592/3dj.14.1.8; matched user-attached full paper, supplied Drive PDF and published PDF search. DOI resolver tool unavailable; no DOI inferred. Existing site byline preserved; page hash unchanged"
        ],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "3 authored concept flashcards added to plus/faq-corpus.json only: veneer retainer, connector, role of pre-existing veneer indication; distinct unique IDs and complete definitions"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4 standalone binary quiz FAQ questions added; explicit yes/no answers, no article deixis, all body-grounded. Flashcard descriptions independently authored, not FAQ copies"
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Clean reading-order Drive full text re-scored in isolated SOURCE gpt-6-luna medium: 15/E THERAPY; quotes/arithmetic/schema/band validated against corrected source; all 75 final body units in canonical Fidelity block; prior interleaved extraction runs superseded"
        ],
        "id": "C.4.13/source-validation",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Two independent clean-source full checker contexts completed on identical canonical 75-unit block, gpt-6-luna medium; output artifacts separate. Initial vote identifies 11 disagreement units and agreed flagged u68 requiring strong review"
        ],
        "id": "C.4.13/checker-runs",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Both exact proposed rewrites explicitly approved and applied. Independent edited-unit-only rechecks agree MATCHES for u68/u75. Final rebase 100 HIGH; all schema/quotes checks PASS. Receipts sharehub/share40-fidelity-audit.json."
        ],
        "id": "C.4.13/vote-review",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Final source and Fidelity outputs stored verbatim parallel: FULL_TEXT SOURCE 15/E THERAPY non-provisional, Fidelity100 HIGH with51MATCHES6NOT_IN_SOURCE1AUTHOR_VIEW17NOT_A_CLAIM zero ALTERED/REVERSED. DOI verified from supplied PDF, no invented abstract/quartile. Scientific audit retained, approved corrections propagated into English translation preparation."
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
    "target_paths": [
      ".dentcast/work/vrfdp-veneer-bridge-2025/ARTICLE.md",
      ".dentcast/work/vrfdp-veneer-bridge-2025/WORK-HANDOFF.md",
      "dentcast-brain.json",
      "dentcast_cabinet_full_catalog.json",
      "plus/des-scores.json",
      "plus/faq-corpus.json",
      "sharehub/index.html",
      "sharehub/share-40.html",
      "sharehub/share40-fidelity-audit.json",
      "sharehub/share40-fig1.webp",
      "sharehub/share40-fig2.webp",
      "sharehub/share40-fig3.webp",
      "sharehub/share40-publication-report.json"
    ]
  },
  "reconciliation": {
    "note": "Refresh staged cut2 snapshot after actual scoped review; preserve original DES CRLF bytes outside new record, final science receipts, cabinet action and corpus. No unrelated changes."
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
