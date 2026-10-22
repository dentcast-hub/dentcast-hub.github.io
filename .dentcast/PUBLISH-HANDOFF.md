# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-39"
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
    "content_id": "sharehub/share-39",
    "context": {
      "approvals": [
        {
          "decision": "Explicit user request",
          "evidence": [
            "Current user publication instruction"
          ],
          "scope": "Upload attached PDF to appropriate Drive folder, rename to real article title, enrich DentCast cabinet and DOI author credit",
          "status": "confirmed"
        },
        {
          "decision": "User approved #\u0628\u0631\u06cc\u062c_\u0628\u0627\u0646\u062f\u0634\u0648\u0646\u062f\u0647 #\u0627\u06a9\u0644\u0648\u0632\u0627\u0644_\u0648\u0646\u06cc\u0631 #\u0622\u0646\u0644\u0647_\u0628\u0631\u06cc\u062c #RBFDP #\u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 and RBFPD, Resin-Bonded Bridge, Occlusal Veneer, Onlay Bridge, Tabletop Bridge search equivalents",
          "evidence": [
            "Current conversation: explicit approval of proposed search hashtags and equivalent keyword phrases"
          ],
          "scope": "Search hashtags and keyword variants",
          "status": "confirmed"
        },
        {
          "decision": "Publishing request authorizes preparing and delivering changes on feature branch; no merge authorization",
          "evidence": [
            "Current ShareHub publication request and confirmation to continue"
          ],
          "scope": "Feature-branch publication deliveries",
          "status": "confirmed"
        },
        {
          "decision": "Extract/crop actual paper figures, exclude printed surrounding text/captions, save WebP and place in corresponding Persian sections",
          "evidence": [
            "User follow-up requesting cropped article images in Persian article"
          ],
          "scope": "PDF figures in Persian article",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "filing",
          "reason": "Posterior resin-bonded bridge clinical evaluation; exact existing cabinet topic and live Drive folder",
          "topic_path": "Maryland bridge"
        },
        {
          "cabinet_id": "P2944",
          "kind": "drafts",
          "status": "Prepared locally only; catalog not yet changed and no publication delivered"
        },
        {
          "kind": "figures",
          "result": "Seven exact embedded PDF figure images extracted; captions are outside image bounds and excluded; original panel markers retained; only Persian page receives figures"
        },
        {
          "decision": "total_papers tracks current papers array (2258 -> 2259); historical scan/match counters do not match array and are preserved",
          "kind": "catalog_counters"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "doi": "10.1111/jerd.70161",
          "reference": "User-supplied ShareHub body and attached PDF"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "bytes": 1083470,
          "file_id": "1EPexRej8M-K-rY87nvbwT5Q4FRNt01Xh",
          "kind": "Drive readback",
          "parent": "14ez2Wd98xDyVs1hN2NZnR5tjkKv22zh2",
          "result": "Matches upload and local PDF size"
        },
        {
          "kind": "correction",
          "result": "Page authoring initially failed on unused bs4 import; reset C.2 onward before retry, no content existed at that attempt"
        },
        {
          "after": "caed60e69861dc11b9746c96165581be58c2863b737035ee3c561ef802d86e07",
          "before": "19abd34331f8121f0cd85186554c2f9b01947632a360945de8066cbc03e9612e",
          "path": "glossary/mdp.html"
        },
        {
          "after": "b74de26115f9b8287aaa402e9899b1660693ce0a0218b44e2d295da337242343",
          "before": "492aafb99a3612c72d59f74d56c0dc86d4fbdefe6334ecfb248cd181da9c68b8",
          "path": "glossary/zirconia-primer.html"
        },
        {
          "after": "502175ddba93e581a375c0f7d77c0592b5c9c76be025e50bf4b611ac799028a3",
          "before": "628ee16ae75f493689e226b0a2ec17e5abee52588f8bccb81dcb22a6cf553930",
          "path": "glossary/dual-cure-resin-cement.html"
        },
        {
          "after": "2225c189db95ef6c7fd6fbc0f321c7e7a9a0c8a5ae535308e9deeef3a57ddf6f",
          "before": "d9fe64fac349c319bac061d900c50611364b0a4d1697f8b7f3d2dcca6ab651f0",
          "path": "glossary/translucency.html"
        },
        {
          "after": "dee5032286bce8aceded3988213e268843e89a7a56109441d8162931594648df",
          "before": "c6d72b77ef9b7a5480030be59f788fcd051e524476c2c7620425b93aed707ded",
          "step": "4.8",
          "targets": [
            [
              "\u0627\u06cc\u0645\u067e\u0644\u0646\u062a",
              "dental-implant"
            ],
            [
              "\u0631\u06cc\u062a\u06cc\u0646\u0631 \u0627\u06cc\u0646\u0644\u0647\u200c\u0627\u06cc",
              "inlay"
            ],
            [
              "\u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u0645",
              "bruxism"
            ],
            [
              "\u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627\u06cc \u0645\u0648\u0646\u0648\u0644\u06cc\u062a\u06cc\u06a9",
              "zirconia"
            ],
            [
              "\u062a\u0631\u0646\u0633\u0644\u0648\u0633\u0646\u0633\u06cc",
              "translucency"
            ],
            [
              "\u0633\u0646\u062f\u0628\u0644\u0627\u0633\u062a",
              "sandblasting"
            ],
            [
              "\u067e\u0631\u0627\u06cc\u0645\u0631 \u062d\u0627\u0648\u06cc MDP",
              "mdp"
            ],
            [
              "\u0633\u0645\u0627\u0646 \u0631\u0632\u06cc\u0646\u06cc \u062f\u0648\u0627\u0644\u200c\u06a9\u06cc\u0648\u0631",
              "dual-cure-resin-cement"
            ],
            [
              "\u0627\u06cc\u0632\u0648\u0644\u0627\u0633\u06cc\u0648\u0646",
              "isolation"
            ]
          ]
        },
        {
          "after": "2820a0234b187589e722aef5ffc675f2d3b0e7fece1f9f8ac1a9104b96248630",
          "before": "dee5032286bce8aceded3988213e268843e89a7a56109441d8162931594648df",
          "step": "4.9",
          "targets": [
            [
              "/dentai/dentai-7.html",
              "\u0639\u0645\u0644\u06a9\u0631\u062f \u0628\u0627\u0644\u06cc\u0646\u06cc RBFDP\u0647\u0627\u06cc \u0642\u062f\u0627\u0645\u06cc \u0648 \u0637\u0631\u0627\u062d\u06cc \u0641\u0631\u06cc\u0645\u200c\u0648\u0631\u06a9"
            ],
            [
              "/notecast/episode-11.html",
              "\u0622\u0645\u0627\u062f\u0647\u200c\u0633\u0627\u0632\u06cc \u0633\u0637\u062d \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u2014 \u0627\u0632 \u0633\u0646\u062f\u0628\u0644\u0627\u0633\u062a \u062a\u0627 \u0628\u0627\u0646\u062f\u06cc\u0646\u06af"
            ],
            [
              "/notecast/episode-17.html",
              "\u0641\u0627\u0632\u0647\u0627\u06cc \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u0648 \u062a\u06a9\u0627\u0645\u0644 \u0622\u0646 \u2014 \u0646\u0633\u0644\u200c\u0647\u0627\u06cc \u0645\u062e\u062a\u0644\u0641 \u0648 \u062e\u0648\u0627\u0635 \u0641\u0627\u0632\u06cc"
            ]
          ]
        },
        {
          "kind": "delivery_reconciliation",
          "result": "Fresh ls-remote equals local HEAD and GitHub-created first delivery; all page/glossary/index bytes identical to delivered tree; sole later difference is local handoff containing observed completed delivery receipt and user image authorization. Recorded actual helper blockage before reconciling continuation."
        },
        {
          "basis": "FULL_TEXT",
          "checker_reasoning": "high",
          "checker_requested_model": "gpt-6-luna",
          "executed_model_identifier": "Requested model accepted by delegation API; per-agent runtime introspection UNVERIFIED",
          "independent_contexts": true,
          "kind": "scientific_preflight",
          "per_role_model_selection": true,
          "price": "UNVERIFIED",
          "reviewer_reasoning": "high",
          "reviewer_requested_model": "gpt-6-astra",
          "source_text_sha256": "dae1798d91190d3dd52ce6bd604856fd011bc23642900bd506c08dca664948b3"
        },
        {
          "checker1_result": "82 units; 58 MATCHES, 0 ALTERED, 0 REVERSED; full quotes validated",
          "checker2_result": "82 units; 57 MATCHES, 1 ALTERED, 0 REVERSED; full quotes validated",
          "disagreement_only_run": "u3,u32,u48,u75,u81; isolated checker launched with same requested model/settings",
          "extraction_repair": "Floating TABLE 6/header moved outside an interrupted sentence; both checkers and SOURCE scorer revalidated against same final complete text",
          "kind": "scientific_progress",
          "source_result": "SOURCE JSON validated; 23/D; all evidence quotes match final column-aware extraction",
          "source_text_sha256": "6e47ba6a3b77e6f622089b5a723b8d0156593fe296d83db3d350db98cec81405"
        }
      ]
    },
    "external_actions": [
      {
        "evidence": [
          "Drive upload returned success, id 1EPexRej8M-K-rY87nvbwT5Q4FRNt01Xh in verified Maryland bridge folder"
        ],
        "id": "drive-upload-occlusal-veneer-20261022",
        "status": "completed",
        "target": "Google Drive folder 14ez2Wd98xDyVs1hN2NZnR5tjkKv22zh2; DOI 10.1111/jerd.70161"
      },
      {
        "evidence": [
          "GitHub branch created at ad72369643ea834d2fee979f7a2509c519312301; matching local tree verified by git diff"
        ],
        "id": "github-delivery-1",
        "status": "completed",
        "target": "Feature branch publish/share-39-occlusal-veneer-bridge, first publication delivery"
      }
    ],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Loaded active routers, core global sections, agent-parity and canonical modules 01/02; selected Google Drive connector delivery and GitHub API transport; main c007caf7 matches checkout"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Text plus attached full paper: ordinary ShareHub with all three paper-ingestion parts"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed full brain and glossary; category schema latest sharehub/share-38; contiguous ShareHub 1-38; taxonomy from main"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "User explicitly selected sharehub"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "38 contiguous numbered entries; next share-39"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Full user text preserved in private article.txt"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Writing-style review: natural explanatory clinical text; no edits required"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Text-only article; no media field in same-category brain schema; PDF handled separately"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Attached full PDF activates paper ingestion"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "RESEARCH: one original clinical study; DOI 10.1111/jerd.70161; FULL_TEXT available"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "User supplied ordinary article with introduction, explanation and conclusion, not a challenge question"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse proposal follows title-only precedent: exact supplied title linked to /sharehub/share-39.html"
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
        "reason": "Category is ShareHub, not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Category is ShareHub, not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Category is ShareHub, not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Category is ShareHub, not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Category is ShareHub, not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template sharehub/share-38.html locked; SHA256 stored privately in template.sha256"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Created actual share-39.html from ShareHub38; supplied text and original opening retained; no new authored lead or phantom English toggle"
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
          "fixed-pros/crowns-onlays; posterior tooth-supported bridge design is the primary subject"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Two specialist capsules inserted and counted; related budget three"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Hand-maintained ShareHub index: one new link inserted before share38; CRLF preserved; scope enrolled"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Meta audit all OK: supplied title/caption synchronized, share39 paths, dates 2026-10-22; stale strings absent"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Template hash unchanged"
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
          "Reviewed glossary concepts: MDP, zirconia-primer, dual-cure resin cement and translucency linked back; other related pages at 5+ link cap preserved; per-page hashes in semantic-hashes.json"
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
        "reason": "Not glossary publication",
        "status": "skipped"
      },
      {
        "evidence": [
          "Nine first-occurrence technical anchors: implant, inlay retainer, bruxism, zirconia, translucency, sandblast, MDP, dual-cure cement, isolation; body text preserved"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Fresh semantic comparison: RBFDP framework review, zirconia bonding protocol and zirconia phases selected; two nav plus three related links exactly at cap"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Drive upload completed and readback verified earlier: Maryland bridge folder, real-title filename, id 1EPexRej8M-K-rY87nvbwT5Q4FRNt01Xh, 1083470 bytes; no duplicate"
        ],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "Delivery 1 exists remotely with matching content tree; helper rejected refreshed local receipt because it demands byte-identical handoff after receipt update",
        "status": "completed"
      },
      {
        "evidence": [
          "Added catalog P2944, exact enriched schema and verified Drive links, paper abstract and semantic tags; seven inspected WebP figures inserted only in Persian article without printed surrounding captions"
        ],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified DOI/title/first author against supplied PDF and Wiley/PubMed; sole visible reference is first-author name linked to DOI, no full reference list; page JSON-LD site authorship preserved"
        ],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Four atomic authored concept cards in FAQ corpus, stable unique IDs, no on-page flashcard schema; decision-shaped concepts not forced into definition copies"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Four standalone binary quiz questions, all answers open with explicit yes/no verdict; no article deixis and no new clinical claims"
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "SOURCE FULL_TEXT 23/D; independent Fidelity 2 full runs plus 5-unit tie-break, canonical vote 58 MATCHES, zero ALTERED/REVERSED, 100 HIGH, no unresolved or stronger-review duties. All evidence quotes normalized against full text; no scientific body changes."
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
      "dentcast-brain.json",
      "dentcast_cabinet_full_catalog.json",
      "glossary/dual-cure-resin-cement.html",
      "glossary/mdp.html",
      "glossary/translucency.html",
      "glossary/zirconia-primer.html",
      "plus/des-scores.json",
      "plus/faq-corpus.json",
      "sharehub/en/share-39.html",
      "sharehub/index.html",
      "sharehub/share-39.html",
      "sharehub/share39-figure-1.webp",
      "sharehub/share39-figure-2.webp",
      "sharehub/share39-figure-3.webp",
      "sharehub/share39-figure-4.webp",
      "sharehub/share39-figure-5.webp",
      "sharehub/share39-figure-6.webp",
      "sharehub/share39-figure-7.webp"
    ]
  },
  "reconciliation": {
    "note": "Reviewed actual publication changes and evidence"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
