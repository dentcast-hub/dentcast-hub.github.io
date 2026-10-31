# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-43"
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
    "category": "sharehub",
    "content_id": "sharehub/share-43",
    "context": {
      "approvals": [
        {
          "decision": "\u062d\u0641\u0638 \u062f\u0646\u062f\u0627\u0646 \u06cc\u0627 \u06a9\u0634\u06cc\u062f\u0646 \u0622\u0646\u061f \u0633\u0647 \u062f\u0631\u0645\u0627\u0646 \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646 \u0627\u0632 \u0646\u06af\u0627\u0647 \u067e\u0631\u0648\u062a\u0632\u06cc",
          "evidence": [
            "queue/02-sharehub-keep-or-extract/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval 1405/08/06"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0631\u06cc\u0634\u0647 \u0627\u0632 \u0646\u0638\u0631 \u0627\u0646\u062f\u0648 \u0642\u0627\u0628\u0644 \u0646\u06af\u0647\u062f\u0627\u0631\u06cc \u0627\u0633\u062a\u060c \u0627\u0645\u0627 \u062a\u0627\u062c\u06cc \u0628\u0631\u0627\u06cc \u0633\u0627\u062e\u062a\u0646 \u0646\u0645\u0627\u0646\u062f\u0647 \u0627\u0633\u062a. \u0628\u06cc\u0646 \u062d\u0641\u0638 \u0648 \u06a9\u0634\u06cc\u062f\u0646 \u0647\u0645\u06cc\u0634\u0647 \u0641\u0642\u0637 \u062f\u0648 \u0631\u0627\u0647 \u0646\u062f\u0627\u0631\u06cc\u0645\u060c \u0648\u0644\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u062f\u0631\u0633\u062a \u0627\u0632 \u062c\u0627\u06cc \u062f\u06cc\u06af\u0631\u06cc \u0634\u0631\u0648\u0639 \u0645\u06cc\u200c\u0634\u0648\u062f.",
          "evidence": [
            "queue/02-sharehub-keep-or-extract/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval 1405/08/06"
          ],
          "scope": "caption",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "decision": "Below the page title, outside article body",
          "evidence": [
            "queue/02-sharehub-keep-or-extract/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval 1405/08/06"
          ],
          "kind": "subtitle_placement"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "evidence": [
            "The opening paragraph was present in the frozen author text and was copied unchanged into the body; no agent-authored lead was added."
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/02-sharehub-keep-or-extract/01-\u0645\u062a\u0646.md \u2014 opening paragraph in \u00ab\u0645\u0642\u062f\u0645\u0647\u00bb\u060c supplied by the author"
        },
        {
          "english": {
            "evidence": [
              "source and mirror reviewed before Push 2; EN generated structure-parity-checked (h2 7, h3 5, p 28, li 3, figure 5)"
            ],
            "path": "sharehub/en/share-43.html",
            "status": "ready"
          },
          "evidence": [
            "current-run editorial close review by the executing agent on 2026-10-31"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13: DES 5/E reused from queue prep, Part 3 revalidated on founder-ruled PDF text; Fidelity rerun on final 117 units, 100 HIGH, Part 3b u114 fixed by founder answer '\u0627\u0635\u0644\u0627\u062d \u06a9\u0646' (2026-10-31); .dentcast/des-fidelity-plans/sharehub/share-43.json"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Q4.9: ordinary article, not a Challenge (queue 07, founder 1405/08/06); C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "pillar treatment-planning / extraction-vs-preservation confirmed C.2.4 and verified C.5.5 against live PILLARS"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 cap audit, C.4.8 four inline anchors; C.6 audit found three share-42 clone-residue TMD capsules in the related section and replaced them with episode-150-2, chairside-16, chairside-21 (same preserve-or-extract decision)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0: batch A112, hashtag_ref --check OK, three founder-approved concepts minted, reuse of five existing"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5: brain entry id 43 appended; key set equals share-42; page JSON-LD keywords synced to brain (clone residue removed)"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6: treatment-planning and fixed-pros placed; C.5.6-b bundle-crown-prep rejected at gate 3; 3 exam MCQs added, validator 0 errors"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html Pulse: title-only line for share-43 at top (exact approved text), lowest line removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "sharehub/en/share-43.html authored from queue 06 (founder: no review needed, approval #10) with the u114 scope fix mirrored; toggles are exact inverses; noindex, no hreflang"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue approvals #1-#12 (hash-verified) plus 2026-10-31 founder answers: use uploaded PDF despite hash difference; u114 '\u0627\u0635\u0644\u0627\u062d \u06a9\u0646'"
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
          "ref": "queue/02-sharehub-keep-or-extract/01-\u0645\u062a\u0646.md",
          "sha256": "7b3a4e07df0f5316bd0be25c3050d2d22c03c6515cc3e08353e717dcb95cab07"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
          "sha256": "728d307481679ffe676e8cd958b929c4321780d0e253844ce2260bb3521e7dd2"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md",
          "sha256": "83db04d13cee1ad53e63f33ab10f81d3ef5ecfb40d0d58fe7b5955c1d1ac7b26"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md",
          "sha256": "772c791d9024f9047981ef4ef7d6cd8e310ab0f8be310d5237c68fb520fbef5d"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/05-DES-Fidelity/des.json",
          "sha256": "1c0a2795c5d7cbe95acdffab263966857416b6d3924ff3fcff74f9b19cc280b7"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/05-DES-Fidelity/fidelity.json",
          "sha256": "2e366ba1773d10c4662c8d1f2eea92ec18e05c6ce074ffe636d130cc2f2c5142"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/08-\u0633\u0624\u0627\u0644\u200c\u0647\u0627\u06cc-\u0622\u0632\u0645\u0648\u0646.json",
          "sha256": "4f97f01a0cf30353f338bcd8728b8328c2d94ac89ea7ca9e8cf02cef4a48e165"
        },
        {
          "ref": "queue/02-sharehub-keep-or-extract/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md",
          "sha256": "e495d5deced2ca2ee90a94bd4faa1ebb3c14b3c84a6af5de026a6aff317e0af1"
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
          ".dentcast/workflows/modules/01-hard-rules.md read; queue selection and approvals verified; Hard Rules 1\u201315 loaded"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Text and attached paper both exist; normal ShareHub route plus all three paper-ingestion parts applies. Source: queue status and 01-\u0645\u062a\u0646.md / 04-\u0645\u0646\u0628\u0639/\u0645\u0646\u0627\u0628\u0639.md."
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md; founder-approved category sharehub"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md; no series"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Live main ShareHub tail: share-42; next identifier share-43"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/01-\u0645\u062a\u0646.md; SHA256 verified"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md; both Q3.5 edits approved and included"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/03-\u062a\u0635\u0627\u0648\u06cc\u0631/\u062a\u0635\u0627\u0648\u06cc\u0631.md; five approved WebP files and alt text"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/02-sharehub-keep-or-extract/04-\u0645\u0646\u0628\u0639/\u0645\u0646\u0627\u0628\u0639.md; DOI 10.1111/iej.13723; archived Drive PDF receipt"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.8 approved RESEARCH/FULL_TEXT; DOI and Drive PDF SHA256 verified (8743fa0f\u2026528e3); all supplied DES evidence quotes and all 53 nonempty Fidelity source_quote fields match extracted paper text after canonical normalization; DES arithmetic 15\u00d70.3=4.5\u21925, band E; fidelity 116-unit counts/score/level and founder u38 correction checked; verify_publish.py --des-text passes."
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ordinary ShareHub post; founder-approved not-Challenge decision in queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md; no Challenge markup route."
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Exact approved Pulse text is title only: \u00ab\u062d\u0641\u0638 \u062f\u0646\u062f\u0627\u0646 \u06cc\u0627 \u06a9\u0634\u06cc\u062f\u0646 \u0622\u0646\u061f \u0633\u0647 \u062f\u0631\u0645\u0627\u0646 \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646 \u0627\u0632 \u0646\u06af\u0627\u0647 \u067e\u0631\u0648\u062a\u0632\u06cc\u00bb; queue/02-sharehub-keep-or-extract/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md."
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Locked category is sharehub, so LiteCast-only branch is inactive and general specialist page path applies."
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
        "reason": "Not a LiteCast publication; module 03 explicitly limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not a LiteCast publication; module 03 explicitly limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not a LiteCast publication; module 03 explicitly limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not a LiteCast publication; module 03 explicitly limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template: sharehub/share-42.html; SHA256 9c2840e429196f3fdf4160af89782a5a5e5a601915518de2358b00e6047a533d; source file left untouched."
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Cloned locked ShareHub template; page body converted from approved queue article; founder subtitle stays outside scored body; five byte-matching images copied; exact approved title and caption applied; first prose paragraph precedes list; preconnect and lazy GA4 survived."
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
        "reason": "This publication is sharehub; module 03 limits this substep to LiteCast pages.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "This publication is sharehub; module 03 limits this substep to LiteCast pages.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Clear semantic match: treatment-planning / extraction-vs-preservation; live subtopic title \u00ab\u062d\u0641\u0638 \u06cc\u0627 \u06a9\u0634\u06cc\u062f\u0646 \u062f\u0646\u062f\u0627\u0646\u00bb covers the article\u2019s central preserve-or-extract decision."
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Existing typed-brain capsule retained; its href now points to /pillar/treatment-planning/ (trailing slash). Existing inherited links kept pending mandatory semantic-link budget."
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/index.html contains exactly one new Share-43 link at the top of the static listing, matching the existing title/author convention."
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Date/meta audit: share-43 canonical and alternate URLs, title and approved caption metadata aligned; datePublished and dateModified are 2026-10-31; no stale share-42 URL remains; preconnect/GA present; no trust seal."
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Locked ShareHub template share-42.html still hashes to 9c2840e429196f3fdf4160af89782a5a5e5a601915518de2358b00e6047a533d."
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
        "reason": "Only NoteCast pages modify a parent episode related-content block; this publication is ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "DES/article-credit mirroring applies only to NoteCast/core-episode pairs; this publication is ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist-only series navigation is inapplicable to ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Candidates: crown-lengthening, ferrule-effect, treatment-plan, dental-implant. Each existing \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb section is already at or above the five-link cap (counts 6, 6, 5, 5 respectively); per Hard Rule 9 no glossary page was edited."
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
        "reason": "This is a ShareHub page, not a glossary term; step 4.7-b only runs for glossary publishes.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Body-link diff only: 0b48d07f641f91bc27e6de7b2a9acc89366735dd37f3111d4bdc4737c20789a7 \u2192 319bf7108d4a29b997d39dcbd0e46a9f35cbe0558882aa9a42a2e102954052dd; anchors added: episode-151, ferrule-effect, dental-implant, crown-lengthening; each first occurrence only."
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "The brain comparison was completed; five-link cap left no available slot for a new related link, and the author-original first paragraph provenance is now recorded."
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Early Drive filing 1405/08/06 recorded in queue/02-sharehub-keep-or-extract/04-\u0645\u0646\u0628\u0639/\u0645\u0646\u0627\u0628\u0639.md (rename+move, drive_id 17x7HdcjV103MD6vsyaStrOipBN3V5f6O, subfolder severe damage tooth); not repeated. Re-verified today via Drive metadata: title is the renamed paper title, parentId 1ZvPK2VWLtXbfvtvlaxU78zFg7TbJ3a4E, size 2826086 bytes. Founder uploaded a copy (sha256 811f5785...9dc2, 2821823 bytes) that differs from the earlier recorded hash 8743fa0f...528e3; founder ruling: use that PDF."
        ],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Catalog entry P2949 appended (key set identical to P2948; DOI 10.1111/iej.13723, Int Endod J 2022, PubMed PMID 35279858 metadata+abstract; Drive ids from early filing; topic severe damage tooth; linked_episodes sharehub/share-43; key_finding/clinical_bottom_line empty; tags semantic+topic+title-derived, announced as agent proposal). total_papers=2159 tracks array; tag_index +1 per added tag; 2200 claim threshold not crossed. Step-8 bridge reachability deferred: linked_episodes puts the paper under every hashtag of share-43 once brain entry/content-index exist; verify with build_cabinet_papers.py --check after C.5."
        ],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Part 3 credit: sharehub/share-43.html sha256 319bf710...52dd -> a2f4b0f5...3d2; only diff is the ShareHub-style .author block (\u0646\u0648\u06cc\u0633\u0646\u062f\u0647: + first author Gianluca Plotino anchored to https://doi.org/10.1111/iej.13723, PubMed PMID 35279858 and PDF page 1 agree); no isBasedOn in template; author-note untouched."
        ],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent[sharehub/share-43].definedTermSets: 5 authored DefinedTerm cards (surgical extrusion, intentional replantation, autotransplantation, PDL role, flexible splint), ids #flashcards-c1..c5, source=authored, grounded in approved body, none copies a FAQ answer (checked); builder run deferred to module 11 mechanical stage."
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage in plus/faq-corpus.json byContent[sharehub/share-43]: 7 standalone yes/no questions (no article deixis, checked by regex), each answer opens with \u0628\u0644\u0647/\u062e\u06cc\u0631 verdict and is grounded in the approved body; no comparison-shaped items needed dropping. 4.12-\u0628 exam questions evaluated at C.5.6 (queue 08 file, 3 founder-approved MCQs). Quiz builder deferred to module 11 mechanical stage."
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES reused (queue 05 des.json, v3.5, 5/E, FULL_TEXT, RESEARCH/THERAPY), not rerun; validated in Part 3 against source_text freshly extracted with pdftotext from the founder-uploaded PDF (sha256 811f5785...9dc2, 2821823 bytes). Founder ruling (verbatim, 2026-10-31): the earlier hash 8743fa0f may have been miscomputed and the founder did not alter the PDF; explicit order to use this PDF. All 3 DES quotes substring-found, verify_publish --des-text word check ok. source_text sha256 58621235...3a (72173 chars; cleanup counts identical to the queue prep run: 15 watermark, 15 headers, 25 page numbers, 3 footnotes, 63 panel labels; heading spacing repaired; conclusion pinned verbatim). Fidelity executed anew for final sharehub/share-43 (117 units, subtitle outside scored body): claude -p separate processes, checker claude-sonnet-5-5 effort medium x2 + 1 tie-break (10 units), orphan sweep claude-opus-5-5 effort high (14 units, 9 found, 5 found nowhere reported: u46 u47 u58 u116 u117), re-check of 9 found units x2 + tie-break, Opus review of flagged u114 (agree). Part 3b: u114 ALTERED (POPULATION_OR_CONDITION_CHANGED); founder answer \u0627\u0635\u0644\u0627\u062d \u06a9\u0646; page edited \"\u0627\u06cc\u0646 \u062f\u0631\u0645\u0627\u0646\u200c\u0647\u0627\" -> \"\u0627\u06a9\u0633\u062a\u0631\u0648\u0698\u0646 \u062c\u0631\u0627\u062d\u06cc\" (only surface carrying it; EN mirror not yet written), u114 re-checked x2 -> MATCHES; vote --base accepted. Final: 63 assessable, 63 MATCHES, 11 NOT_IN_SOURCE, 4 AUTHOR_VIEW, 39 NOT_A_CLAIM, score 100 HIGH. Stored in plus/des-scores.json; plan in .dentcast/des-fidelity-plans/sharehub/share-43.json. Cost UNVERIFIED. Earlier u38 hedge fix confirmed MATCHES."
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
        "reason": "Ordinary article: founder answered Question 4.9 not a Challenge (queue 07, 1405/08/06); page carries no data-dc-challenge-question markup; module 09 branch inactive.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Final canonical list (order per queue 09): #Share_Hub #Curated_Content #\u062d\u0641\u0638_\u062f\u0646\u062f\u0627\u0646 #\u0627\u06a9\u0633\u062a\u0631\u0648\u0698\u0646_\u062c\u0631\u0627\u062d\u06cc #\u0631\u06cc_\u067e\u0644\u0646\u062a\u06cc\u0634\u0646_\u0639\u0645\u062f\u06cc #\u0627\u062a\u0648\u062a\u0631\u0646\u0633\u067e\u0644\u0646\u062a\u06cc\u0634\u0646 #\u0641\u0631\u0648\u0644 #\u0627\u0641\u0632\u0627\u06cc\u0634_\u0637\u0648\u0644_\u062a\u0627\u062c. Reused existing: #Share_Hub #Curated_Content #\u062d\u0641\u0638_\u062f\u0646\u062f\u0627\u0646 #\u0641\u0631\u0648\u0644 #\u0627\u0641\u0632\u0627\u06cc\u0634_\u0637\u0648\u0644_\u062a\u0627\u062c (hashtag_ref --simulate). Minted 3 founder-approved concepts via .dentcast/hashtag-batches/A112-share-43.json (--apply through a wrapper that skips the semantically unchanged brain write because dentcast-brain.json has mixed line endings; reference + sync ok): definitions, use_when, four alias slots each; no articles row. Composition gate: series tags + decision tag #\u062d\u0641\u0638_\u062f\u0646\u062f\u0627\u0646 + specific tags (<=10 pages) the minted three. Resolving sentences and the 4 dentist questions are in the batch note. Accepted --sync note: pre-existing alias \u0627\u06a9\u0633\u062a\u0631\u0648\u0698\u0646 of #\u0633\u0648\u067e\u0631\u0627\u0627\u0631\u0627\u067e\u0634\u0646 folds the word, so lexical simulate for the new tag fails; left untouched, reported. Bridge: catalog P2949 linked_episodes leads every hashtag of the page; verify build_cabinet_papers --check and question-side reachability after the brain write."
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain entry appended at end of flat dentcast-brain.json (584 entries): type sharehub, id 43, title/caption copied from queue 02 (founder-approved strings), author/source per share-40..42 precedent, hashtags = canonical list C.5.0, keywords = queue 09 verbatim, url /sharehub/share-43.html, pillar treatment-planning / extraction-vs-preservation; key set identical to share-42. Byte-preserving append (file has mixed EOL; CRLF tail). Clone residue fixed: page JSON-LD keywords still carried share-42 values (TMD, ...) -> replaced with brain keywords (Hard Rule 17). hashtag_ref --sync, build_plus_index (output reverted; regenerated by post-Push-2 workflow), hashtag_ref --check OK, build_cabinet_papers --check OK; P2949 in byTag for \u0627\u062a\u0648\u062a\u0631\u0646\u0633\u067e\u0644\u0646\u062a\u06cc\u0634\u0646, \u0627\u06a9\u0633\u062a\u0631\u0648\u0698\u0646 \u062c\u0631\u0627\u062d\u06cc, \u0631\u06cc \u067e\u0644\u0646\u062a\u06cc\u0634\u0646 \u0639\u0645\u062f\u06cc (position 1) and pdl. Question-side reachability: Q1/Q3/Q4 resolve through the three exact one-page labels; Q2 (ferrule vs crown lengthening) rests on umbrella tags #\u0641\u0631\u0648\u0644/#\u0627\u0641\u0632\u0627\u06cc\u0634_\u0637\u0648\u0644_\u062a\u0627\u062c whose live API ranking cannot be reproduced locally (UNVERIFIED)."
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain pillar {primary: treatment-planning, secondary: [], subtopic: extraction-vs-preservation} equals the C.2.4 decision (clear semantic match, recorded in ledger); live PILLARS (origin/main cf246a7 ancestor of HEAD) contains the subtopic slug; page capsule links /pillar/treatment-planning/; no extra keys vs share-42 pillar shape."
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathway_place.py candidates: treatment-planning 88 STRONG, fixed-pros 40 STRONG, others ASK (not placed). Inserted sharehub/share-43 in treatment-planning after chairside/chairside-16 (index 55, milestone false, 77 steps) and fixed-pros after chairside/chairside-16 (index 130, 135 steps) \u2014 two full pathways, no third; neither anchor splits a series; json valid. 4.12-\u0628: 3 founder-approved MCQs (queue 08, approval #8, key of Q1 chosen by founder) written to plus/exam-questions.json ids r-1de2f516 r-eba5a34e r-da698887 (sha1 rule), validate_exam_questions.py 0 errors. Coverage output lists only pre-existing uncovered items."
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Candidate bundles = those continuing the two joined pathways: treatment-planning has none; fixed-pros has bundle-crown-prep (6 steps: Goodacre prep 1-2, resistance form, BOPT, two-stage impression 1-2). Verdict for bundle-crown-prep: \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f3 \u2014 coverage: the bundle teaches prep/impression basics; share-43 compares surgical tooth-preservation options and fills no hole in that core; gate \u06f2 also doubtful since it is advanced alternatives, not a beginner concept). No bundle edit, no home-bundles.js or asset bump needed."
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: index.html has the exact approved title-only line for share-43 at the top, lowest line (chairside-45) removed, 7 lines kept. English mirror sharehub/en/share-43.html authored from queue 06 (+ the u114 scope fix mirrored), structure parity with fa body (h2 7, h3 5, p 28, li 3, figure 5), noindex/no hreflang, GA/chrome from share-42 en template, fa toggle already present and exact inverse. Title and caption approvals confirmed in context.approvals (queue 02, exact strings). Ten-scope second_cut_editorial_lock_v1 recorded. Also fixed at this gate: three TMD related-capsules left from the share-42 clone in the fa page replaced by episode-150-2, chairside-16, chairside-21."
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/des-fidelity-plans/sharehub/share-43.json",
      ".dentcast/hashtag-batches/A112-share-43.json",
      "PULSE.md",
      "brain.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast_cabinet_full_catalog.json",
      "index.html",
      "plus/cabinet-bridge.json",
      "plus/cabinet-papers.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-43.html",
      "sharehub/index.html",
      "sharehub/share-43.html",
      "sharehub/share43-fig1.webp",
      "sharehub/share43-fig2.webp",
      "sharehub/share43-fig3.webp",
      "sharehub/share43-fig4.webp",
      "sharehub/share43-fig5.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, dentcast_cabinet_full_catalog.json, index.html, plus/cabinet-papers.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, sharehub/share-43.html, .dentcast/des-fidelity-plans/sharehub/share-43.json, .dentcast/hashtag-batches/A112-share-43.json, sharehub/en/share-43.html"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
