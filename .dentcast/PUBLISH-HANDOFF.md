# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-44"
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
    "category": "sharehub",
    "content_id": "sharehub/share-44",
    "context": {
      "approvals": [
        {
          "decision": "\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u06cc\u06a9\u200c\u062a\u06a9\u0647 \u06cc\u0627 \u062f\u0648\u062a\u06a9\u0647 (One-Piece / Two-Piece)\u061b \u0628\u0639\u062f \u0627\u0632 \u06f1\u06f5 \u0633\u0627\u0644 \u06a9\u062f\u0627\u0645 \u0628\u0647\u062a\u0631 \u0627\u0633\u062a\u061f",
          "evidence": [
            "queue/06-sharehub-one-piece-two-piece/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval #3 (1405/08/07), re-recorded after dependency invalidation"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u06cc\u06a9\u200c\u062a\u06a9\u0647 \u06cc\u0627 \u062f\u0648\u062a\u06a9\u0647\u061f \u0627\u06cc\u0646 \u0645\u0637\u0627\u0644\u0639\u0647 \u0628\u0639\u062f \u0627\u0632 \u06f1\u06f5 \u062a\u0627 \u06f1\u06f7 \u0633\u0627\u0644 \u0641\u0642\u0637 \u0628\u0647 \u0628\u0642\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0646\u06af\u0627\u0647 \u0646\u06a9\u0631\u062f\u0647 \u0648 \u0627\u0633\u062a\u062e\u0648\u0627\u0646\u060c \u0628\u0627\u0641\u062a \u0627\u0637\u0631\u0627\u0641 \u0648 \u067e\u0631\u0648\u062a\u0632 \u0631\u0627 \u0647\u0645 \u06a9\u0646\u0627\u0631 \u0647\u0645 \u0633\u0646\u062c\u06cc\u062f\u0647 \u0627\u0633\u062a.",
          "evidence": [
            "queue/06-sharehub-one-piece-two-piece/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval #5 (1405/08/07), re-recorded after dependency invalidation"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "Opening paragraph of 01-\u0645\u062a\u0646.md (agent-drafted from the founder's wording, approved by the founder: \u00ab\u0627\u0648\u06a9\u06cc \u2026 \u0628\u0633\u0627\u0632 \u0628\u0630\u0627\u0631 \u062a\u0648 \u0635\u0641 \u062a\u0645\u0648\u0645\u0634 \u06a9\u0646\u00bb)",
          "evidence": [
            "queue/06-sharehub-one-piece-two-piece/00-\u0648\u0636\u0639\u06cc\u062a.md approval #18 (1405/08/07), re-recorded after dependency invalidation"
          ],
          "scope": "authored-intro",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "evidence": [
            "queue 00-\u0648\u0636\u0639\u06cc\u062a.md approval #18: opening paragraph and whole 01-\u0645\u062a\u0646.md approved by the founder"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "agent_authored",
          "source_ref": "queue/06-sharehub-one-piece-two-piece/00-\u0648\u0636\u0639\u06cc\u062a.md approval #18 and 07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md: opening paragraph rewritten from the founder's own wording and finally approved by the founder 1405/08/07; copied unchanged into the body"
        },
        {
          "from_step": "C.2",
          "kind": "dependency_invalidation_v1",
          "reason": "Part 3 (module 06) adds the first-author DOI credit to the approved page; replaying C.2..C.4.10.3 with the same evidence. Opening paragraph unchanged; approvals to be re-recorded from queue evidence",
          "superseded": {
            "approvals": [
              {
                "decision": "\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u06cc\u06a9\u200c\u062a\u06a9\u0647 \u06cc\u0627 \u062f\u0648\u062a\u06a9\u0647 (One-Piece / Two-Piece)\u061b \u0628\u0639\u062f \u0627\u0632 \u06f1\u06f5 \u0633\u0627\u0644 \u06a9\u062f\u0627\u0645 \u0628\u0647\u062a\u0631 \u0627\u0633\u062a\u061f",
                "evidence": [
                  "queue/06-sharehub-one-piece-two-piece/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval #3 (1405/08/07) via queue 00-\u0648\u0636\u0639\u06cc\u062a.md; standing authorization 1405/08/06 and 1405/08/11"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "\u06cc\u06a9\u200c\u062a\u06a9\u0647 \u06cc\u0627 \u062f\u0648\u062a\u06a9\u0647\u061f \u0627\u06cc\u0646 \u0645\u0637\u0627\u0644\u0639\u0647 \u0628\u0639\u062f \u0627\u0632 \u06f1\u06f5 \u062a\u0627 \u06f1\u06f7 \u0633\u0627\u0644 \u0641\u0642\u0637 \u0628\u0647 \u0628\u0642\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0646\u06af\u0627\u0647 \u0646\u06a9\u0631\u062f\u0647 \u0648 \u0627\u0633\u062a\u062e\u0648\u0627\u0646\u060c \u0628\u0627\u0641\u062a \u0627\u0637\u0631\u0627\u0641 \u0648 \u067e\u0631\u0648\u062a\u0632 \u0631\u0627 \u0647\u0645 \u06a9\u0646\u0627\u0631 \u0647\u0645 \u0633\u0646\u062c\u06cc\u062f\u0647 \u0627\u0633\u062a.",
                "evidence": [
                  "queue/06-sharehub-one-piece-two-piece/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval #5 (1405/08/07) via queue 00-\u0648\u0636\u0639\u06cc\u062a.md; standing authorization 1405/08/06 and 1405/08/11"
                ],
                "scope": "caption",
                "status": "confirmed"
              },
              {
                "decision": "Opening paragraph of 01-\u0645\u062a\u0646.md (agent-drafted from the founder's wording, approved verbatim by the founder: \u00ab\u0627\u0648\u06a9\u06cc \u2026 \u0628\u0633\u0627\u0632 \u0628\u0630\u0627\u0631 \u062a\u0648 \u0635\u0641 \u062a\u0645\u0648\u0645\u0634 \u06a9\u0646\u00bb)",
                "evidence": [
                  "queue/06-sharehub-one-piece-two-piece/00-\u0648\u0636\u0639\u06cc\u062a.md approval #18, 1405/08/07, chat"
                ],
                "scope": "authored-intro",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [
              {
                "ref": "queue/06-sharehub-one-piece-two-piece/01-\u0645\u062a\u0646.md",
                "sha256": "fb0f40a4560b97a7ffa6877e9120c734d9a9f576039e57134cc13f5a5c43dbdb"
              },
              {
                "ref": "queue/06-sharehub-one-piece-two-piece/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
                "sha256": "4d626f9a5441d48ab14a5acdf9bec71425fd1e2a787e406ae29e20fcd45f15b3"
              },
              {
                "ref": "queue/06-sharehub-one-piece-two-piece/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md",
                "sha256": "4e0114c045067b6ec9657aabb510138b16ee74caaeffa945339c26969422f817"
              },
              {
                "ref": "queue/06-sharehub-one-piece-two-piece/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md",
                "sha256": "1861bc1aa94625eca8ede7d243dda4935e77778b348728f1f3a3791e28482ac4"
              },
              {
                "ref": "queue/06-sharehub-one-piece-two-piece/05-DES-Fidelity/des.json",
                "sha256": "ba0a013a4b13d59b703be4a39f447ce328b4af65a42b3cc97f132b3dc2aa1acb"
              },
              {
                "ref": "queue/06-sharehub-one-piece-two-piece/05-DES-Fidelity/fidelity.json",
                "sha256": "d1c8faafaa4cff8d767570214433b94283dcb3fe75e6fb12759cc15ca209dd11"
              },
              {
                "ref": "queue/06-sharehub-one-piece-two-piece/08-\u0633\u0624\u0627\u0644\u200c\u0647\u0627\u06cc-\u0622\u0632\u0645\u0648\u0646.json",
                "sha256": "2d95d6fb706fc49e59f4d21033ec2398de7fbdc02a424c5961f278898c17bc47"
              },
              {
                "ref": "queue/06-sharehub-one-piece-two-piece/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md",
                "sha256": "6a0e732a919ab89fb02704dfe3c48e72e54093bc96d6327f1f93619933d950e5"
              },
              {
                "ref": "queue/06-sharehub-one-piece-two-piece/10-\u0641\u0644\u0634\u200c\u06a9\u0627\u0631\u062a-FAQ.json",
                "sha256": "055b8ade0b791e119ac4c90bc7282e5b8e017c1c46e652458cd0aae2af579899"
              },
              {
                "ref": "queue/06-sharehub-one-piece-two-piece/11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md",
                "sha256": "8664bb6a7f8ef4bbe3bdf6da218f2ab60989f3d0aace5d110cc5917a424467ca"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "sharehub/share-44.html built mechanically from template share-43 + queue 01-\u0645\u062a\u0646.md/02/09 (text verbatim; org domain kept; GA and both preconnects present; no trustseal); image sharehub/share44-fig1.webp; queue_install_des --check-text: only the founder-ruled stale u3/u4 paragraph differs (00-\u0648\u0636\u0639\u06cc\u062a \u062d\u06a9\u0645 1405/08/07)"
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
                "reason": "Sharehub, not LiteCast; module 03 limits this substep to LiteCast pages.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": "Sharehub, not LiteCast; module 03 limits this substep to LiteCast pages.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "pillar implantology / subtopic peri-implant-health: queue 07 (founder-confirmed 1405/08/07), verified against live PILLARS read from main (implantology subtopics include peri-implant-health)"
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Typed brain entry: both capsules on sharehub/share-44.html \u2014 /glossary/ and /pillar/implantology/ (canonical form), single section"
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "sharehub/index.html is hand-maintained: one <li> added at top for share-44, same markup as siblings (git diff: +1 line)"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Date/meta audit: only datePublished/dateModified present = 2026-11-02 (today; --show-date prep_date null); no visible date lines; title/description/OG/Twitter/canonical/hreflang/JSON-LD/breadcrumb all carry share-44 + queue 02 strings; 0 residue of share-43"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Integrity: template sharehub/share-43.html sha256 58a11357359eeadf... unchanged, equals C.1"
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
                "reason": "Only NoteCast pages edit a parent episode; this is ShareHub.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "DES/article-credit mirroring applies only to NoteCast/core-episode pairs; ShareHub.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Promptologist-only prev/next wiring; inapplicable to ShareHub.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Glossary back-links (glossary.json sha 18214ce1... identical to queue analysis): abutment 5/5, peri-implantitis 5/5, dental-implant 5/5 live caps full -> Hard Rule 9, no edit; platform-switch (3/5, borderline B2) not linked by founder (queue 11, mechanical default skip). 0 glossary pages edited"
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
                "reason": "ShareHub page, not a glossary term publish; step 4.7-b only runs for glossary publishes.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Fresh semantic analysis on queue 11 (candidate list: glossary sha unchanged, brain +share-43/+notecast-44 irrelevant). Applied 4 first-occurrence anchors: \u0627\u0628\u0627\u062a\u0645\u0646\u062a->/glossary/abutment.html, \u0627\u062a\u0635\u0627\u0644->/episodes/episode-80.html (founder approval #9 \u00ab\u0627\u0644\u0641\u00bb), \u067e\u0631\u06cc\u200c\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u0627\u06cc\u062a\u06cc\u0633->/glossary/peri-implantitis.html, platform switching->/glossary/platform-switch.html; all targets exist. Page sha before 88cd1ea5672d3274 after 76281cdb08428d98; only diffs are the 4 anchors"
                ],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Fresh semantic comparison vs brain (586 entries): 3 added after the 2 site capsules (cap 5/5): sharehub/share-35 (founder decision #16, basal/one-piece monoblock), episodes/episode-80 (implant connections), episodes/episode-59 (marginal bone loss factors). Borderline not added (ep-81, ep-122-1, ep-123-6, share-1: mechanical default). Page sha before 76281cdb08428d98 after 66595ffdccd18a82; only the 3 capsules added"
                ],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Completed against external action C.4.10.1:drive-move (early Drive filing in queue prep, re-verified via Drive metadata: Connection folder, 404063 B). No find/rename/move repeated"
                ],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Catalog entry P2951 appended (key set identical to P2950 template; LF/indent-2 round-trip), metadata from PubMed PMID 42126189 (DOI 10.1111/cid.70157, CIDRR 2026;28(3):e70157), Drive ids from verified metadata, linked_episodes sharehub/share-44, 12 tags (10 existing library tags + topic:connection + title tag), tag_index +1 each, total_papers 2160->2161 (no round-hundred crossing). build_cabinet_papers.py ran and --check OK; reachable from site tag \u00ab\u0634\u0644 \u0634\u062f\u0646 \u067e\u06cc\u0686\u00bb (map screw-loosening) at byTag position 8; other hashtags rows exist but P2951 not in their top 12 (no edit: one is enough). No bridge edits."
                ],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "started"
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
          "ref": "queue/06-sharehub-one-piece-two-piece/01-\u0645\u062a\u0646.md",
          "sha256": "fb0f40a4560b97a7ffa6877e9120c734d9a9f576039e57134cc13f5a5c43dbdb"
        },
        {
          "ref": "queue/06-sharehub-one-piece-two-piece/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md",
          "sha256": "4d626f9a5441d48ab14a5acdf9bec71425fd1e2a787e406ae29e20fcd45f15b3"
        },
        {
          "ref": "queue/06-sharehub-one-piece-two-piece/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md",
          "sha256": "4e0114c045067b6ec9657aabb510138b16ee74caaeffa945339c26969422f817"
        },
        {
          "ref": "queue/06-sharehub-one-piece-two-piece/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md",
          "sha256": "1861bc1aa94625eca8ede7d243dda4935e77778b348728f1f3a3791e28482ac4"
        },
        {
          "ref": "queue/06-sharehub-one-piece-two-piece/05-DES-Fidelity/des.json",
          "sha256": "ba0a013a4b13d59b703be4a39f447ce328b4af65a42b3cc97f132b3dc2aa1acb"
        },
        {
          "ref": "queue/06-sharehub-one-piece-two-piece/05-DES-Fidelity/fidelity.json",
          "sha256": "d1c8faafaa4cff8d767570214433b94283dcb3fe75e6fb12759cc15ca209dd11"
        },
        {
          "ref": "queue/06-sharehub-one-piece-two-piece/08-\u0633\u0624\u0627\u0644\u200c\u0647\u0627\u06cc-\u0622\u0632\u0645\u0648\u0646.json",
          "sha256": "2d95d6fb706fc49e59f4d21033ec2398de7fbdc02a424c5961f278898c17bc47"
        },
        {
          "ref": "queue/06-sharehub-one-piece-two-piece/09-\u06a9\u0644\u06cc\u062f\u0648\u0627\u0698\u0647\u200c\u0647\u0627.md",
          "sha256": "6a0e732a919ab89fb02704dfe3c48e72e54093bc96d6327f1f93619933d950e5"
        },
        {
          "ref": "queue/06-sharehub-one-piece-two-piece/10-\u0641\u0644\u0634\u200c\u06a9\u0627\u0631\u062a-FAQ.json",
          "sha256": "055b8ade0b791e119ac4c90bc7282e5b8e017c1c46e652458cd0aae2af579899"
        },
        {
          "ref": "queue/06-sharehub-one-piece-two-piece/11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md",
          "sha256": "8664bb6a7f8ef4bbe3bdf6da218f2ab60989f3d0aace5d110cc5917a424467ca"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": []
    },
    "external_actions": [
      {
        "evidence": [
          "queue/06-sharehub-one-piece-two-piece/04-\u0645\u0646\u0628\u0639/\u0645\u0646\u0627\u0628\u0639.md early Drive receipt 1405/08/07: PDF renamed to the verified title and moved from cabinet root to subfolder \u00abConnection\u00bb (founder choice)",
          "re-verified 2026-11-02 with Google Drive get_file_metadata: parentId 1kqRKGLWckLTKbWT7YFUfCl9rbVG0k-rZ, size 404063, title as recorded"
        ],
        "id": "C.4.10.1:drive-move",
        "status": "completed",
        "target": "drive:16pQDY82TT-Lt5UZl9ASSeMf50or2DZk5"
      }
    ],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Read completely this session: CLAUDE.md, publish-queue.md (incl. 1405/08/11 standing orders), global router + all 3 pages of selected sections, agent-parity.md, README.md, publish-checkpoints.md, publish-handoff-tool.md, modules 01 and 02"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text present (queue 01-\u0645\u062a\u0646.md) + paper attached (queue 04-\u0645\u0646\u0628\u0639, Pirc M, DOI 10.1111/cid.70157) => normal publish plus step 4.10 all three parts"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain read (586 entries, 43 sharehub, last sharehub share-43); live PILLARS read: implantology/peri-implant-health present"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/06-sharehub-one-piece-two-piece/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q1: sharehub (founder 1405/08/07)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Live main: max sharehub/share-43, no gaps => sharehub/share-44 (Q2 never from queue)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/06-sharehub-one-piece-two-piece/01-\u0645\u062a\u0646.md (sha256 fb0f40a4..., SHA256SUMS verified 16/16 OK)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/06-sharehub-one-piece-two-piece/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q3.5: one pass done at prep, founder-approved; not re-run (publish-queue table)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/06-sharehub-one-piece-two-piece/03-\u062a\u0635\u0627\u0648\u06cc\u0631/\u062a\u0635\u0627\u0648\u06cc\u0631.md: 1 founder image, WebP 7012 B; author \u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646; no audio/video"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/06-sharehub-one-piece-two-piece/04-\u0645\u0646\u0628\u0639/\u0645\u0646\u0627\u0628\u0639.md: paper attached Pirc M, DOI 10.1111/cid.70157, drive_id 16pQDY82TT-Lt5UZl9ASSeMf50or2DZk5 => branch 4.10 ACTIVE"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/06-sharehub-one-piece-two-piece/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q4.8: basket 2 RESEARCH FULL_TEXT; frozen DES/Fidelity via queue_install_des.py (standing order 1405/08/11)"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/06-sharehub-one-piece-two-piece/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q4.9: ordinary article, not a Challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "queue/06-sharehub-one-piece-two-piece/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md Q5: Pulse line = title linked to /sharehub/share-44.html"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "LiteCast branch inactive: locked category sharehub (queue 07 Q1); reported"
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
        "reason": "Not LiteCast; module 03 limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; module 03 limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; module 03 limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; module 03 limits this substep to the LiteCast branch.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template lock: previous same-category page sharehub/share-43.html sha256 58a11357359eeadf0675a11feaf995bfd1c27d328cc64020c3811cec21fd76d9 (untouched)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "REPLAY (same evidence as first pass): sharehub/share-44.html built mechanically from share-43 template + queue files; image share44-fig1.webp; queue_install_des --check-text differs only in founder-ruled stale u3/u4 paragraph"
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
        "reason": "Sharehub, not LiteCast; module 03 limits this substep to LiteCast pages.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Sharehub, not LiteCast; module 03 limits this substep to LiteCast pages.",
        "status": "skipped"
      },
      {
        "evidence": [
          "REPLAY: pillar implantology / peri-implant-health, queue 07 founder-confirmed, matches live PILLARS"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "REPLAY: both capsules /glossary/ and /pillar/implantology/ present once"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "REPLAY: sharehub/index.html row added for share-44"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "REPLAY: date audit OK, datePublished/dateModified 2026-11-02"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "REPLAY: template share-43 sha256 58a11357... unchanged"
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
        "reason": "Only NoteCast pages edit a parent episode; ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "DES/article-credit mirroring applies only to NoteCast/core-episode pairs; ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist-only; inapplicable to ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [
          "REPLAY: 0 glossary back-links, caps full (abutment 5, peri-implantitis 5, dental-implant 5); platform-switch borderline not chosen by founder"
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
        "reason": "ShareHub page, not a glossary term publish.",
        "status": "skipped"
      },
      {
        "evidence": [
          "REPLAY: 4 first-occurrence anchors (abutment, episode-80 via \u0627\u062a\u0635\u0627\u0644, peri-implantitis, platform-switch), all targets exist"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "REPLAY: 3 capsules after the 2 site capsules: share-35 (founder), episode-80, episode-59; cap 5/5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "dentcast_cabinet_full_catalog.json",
      "plus/cabinet-bridge.json",
      "plus/cabinet-papers.json",
      "sharehub/en/share-44.html",
      "sharehub/index.html",
      "sharehub/share-44.html",
      "sharehub/share44-fig1.webp",
      "tools/queue_install_des.py"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: sharehub/share-44.html, dentcast_cabinet_full_catalog.json, plus/cabinet-papers.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
