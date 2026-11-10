# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-51"
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
    "category": "chairside",
    "content_id": "chairside/chairside-51",
    "context": {
      "approvals": [
        {
          "decision": "\u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631",
          "evidence": [
            "founder Claude Doc heading \u00ab\u0634\u0631\u062d \u0648\u06cc\u0632\u06cc\u062a: \u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631\u00bb with the doc label \u00ab\u0634\u0631\u062d \u0648\u06cc\u0632\u06cc\u062a:\u00bb removed; founder words copied verbatim"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0628\u06cc\u0645\u0627\u0631 \u0627\u0632 \u0628\u0631\u06cc\u062c\u06cc \u06a9\u0647 \u062a\u0627\u0632\u0647 \u0628\u0631\u0627\u06cc\u0634 \u06af\u0630\u0627\u0634\u062a\u0647 \u0634\u062f\u0647 \u0628\u0648\u062f \u0631\u0627\u0636\u06cc \u0646\u0628\u0648\u062f \u0648 \u0645\u06cc\u200c\u06af\u0641\u062a \u0628\u0627 \u0622\u0646 \u0646\u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u062f \u063a\u0630\u0627 \u0631\u0627 \u0628\u062c\u0648\u062f. \u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 \u0686\u0647 \u0686\u06cc\u0632\u06cc \u0631\u0627 \u0646\u0634\u0627\u0646 \u062f\u0627\u062f \u0648 \u0686\u0631\u0627 \u06af\u06cc\u0631 \u06a9\u0631\u062f\u0646 \u06a9\u0627\u063a\u0630 \u0628\u0631\u0627\u06cc \u0642\u0636\u0627\u0648\u062a \u0627\u06a9\u0644\u0648\u0698\u0646 \u06a9\u0627\u0641\u06cc \u0646\u06cc\u0633\u062a\u061f",
          "evidence": [
            "agent proposal under standing acceptance (Hard Rule 14), listed in the Push-2 report"
          ],
          "scope": "caption",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "kind": "ledger_order_v2"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "decision": "Founder asked that the earlier piece on occlusal adjustment with bite registration or digital scan be linked to this one: resolved to clinical-103 /insight/insight-103.html \u00ab\u0627\u0635\u0644\u0627\u062d \u0627\u06a9\u0644\u0648\u0698\u0646 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646\u200c\u0647\u0627\u06cc \u06a9\u0648\u062a\u0627\u0647 \u0628\u0627 \u06a9\u0645\u06a9 \u0628\u0627\u06cc\u062a \u0631\u062c\u06cc\u0633\u062a\u0631\u06cc\u0634\u0646 \u0648 \u0627\u0633\u06a9\u0646 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u00bb (founder word \u00ab\u0648\u0627\u06cc\u062a\u00bb = bite). Scoped approval to link it.",
          "evidence": [
            "founder chat message 2026-11-10",
            "dentcast-brain.json clinical-103"
          ],
          "kind": "founder_request",
          "scope": "related content"
        },
        {
          "decision": "chairside/chairside-51 placed in full pathways occlusion and fixed-pros, both --after insight/insight-1 (paper thickness \u2192 reading the marks); tool flags ASK but semantic home is unmistakable: occlusion pathway holds insight-1/103/65/100/share-47, fixed-pros holds insight-1/103/65/share-47/chairside-47. Not placed: implant-prosthetic, treatment-planning, biomimetic, post-and-core, esthetic, implant-surgical (borderline). Coverage 1.51 per item (baseline 1.38).",
          "evidence": [
            "tools/pathway_place.py chairside/chairside-51",
            "git diff plus/pathways.json"
          ],
          "kind": "pathway_placement",
          "step": "C.5.6"
        },
        {
          "from_step": "C.2",
          "kind": "dependency_invalidation_v1",
          "reason": "Founder (chat 2026-11-10) asked to add a paragraph on the misconception that an articulating-paper mark means a high spot; agent draft approved verbatim by founder; body text changed after the C.4.13 lock \u2192 approved-page edit, invalidate from C.2",
          "superseded": {
            "approvals": [],
            "delivery": [],
            "inputs": [
              {
                "note": "founder text, transcribed verbatim from the doc's 5 text paragraphs",
                "ref": "artifact:claude-docs/52b29f07 (founder doc \u00ab\u0634\u0631\u062d \u0648\u06cc\u0632\u06cc\u062a: \u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631\u00bb, rev 2)",
                "sha256": "ef36963b97636f107a7475f845f0f79bedb19e2d670d96447fff7065e592065d"
              },
              {
                "note": "founder clinical photo, 930x1040 webp, alt \u00ab\u062a\u0645\u0627\u0633\u200c\u0647\u0627\u06cc \u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 \u0631\u0648\u06cc \u0628\u0631\u06cc\u062c\u00bb",
                "ref": "artifact-asset:52b29f07/de7c08685eda9bbc8329499ae41d4be8.webp",
                "sha256": "e036c1ce7b3ea908bfd1a3022cc0c35c77c95ccf532a7593e8605bd5629a0b8d"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "chairside/chairside-51.html cloned from chairside-50: structure identical, domain dentcast.org kept, GA4 deferred snippet once, two preconnect with crossorigin at head top, no trustseal; body = founder 4 paragraphs byte-copied + figure cs51-1.webp (alt copied from founder doc, figcaption = same words); title \u00ab\u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631\u00bb = founder doc heading without its \u00ab\u0634\u0631\u062d \u0648\u06cc\u0632\u06cc\u062a:\u00bb label; caption agent-composed (178 chars); body opens with founder paragraph (lead origin author_original); chairside template has no chip row"
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
                "reason": "Not LiteCast (LiteCast link step only)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": "Not LiteCast (LiteCast link step only)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "pillar.primary=occlusion (clear single fit: occlusal contacts of a bridge, articulating-paper reading); subtopic=occlusal-analysis-adjustment (analysis of contact distribution/quality; clear fit vs occlusal-scheme-guidance); secondary [] ; standing acceptance"
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "dc-related-section with exactly 2 capsules: /glossary/ and /pillar/occlusion/ (cloned links from chairside-50 removed from the new page, budget now 2/5)"
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "chairside/index.html is hand-maintained: added \u00ab\u0648\u06cc\u0632\u06cc\u062a \u06f5\u06f1 \u2014 \u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631\u00bb row at top, sibling markup"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Dates audit: all 7 date occurrences = 2026-11-10 (datePublished, dateModified, lastReviewed, 2 visible time tags x datetime/text); OK"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "git diff --quiet -- chairside/chairside-50.html \u2192 exit 0 (template unchanged)"
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
                "reason": "Not NoteCast (parent episode step only for NoteCast)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Not NoteCast (NoteCast credit only)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Not Promptologist (prev/next only for Promptologist)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": "No paper attached (Question 4.7)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": "No paper attached (Question 4.7)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": "No paper attached (Question 4.7)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "plus/des-scores.json chairside/chairside-51: COMMENTARY 3.7, 12/E, fidelity [null]; Part 3 checks (1)-(7) green; no M3b; receipt in context.validation"
                ],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "4.7: fresh semantic review of all 109 glossary terms; occlusion-pillar terms considered (centric-relation, canine-guidance, group-function, VDO, TMD, bruxism, occlusal-splint, tooth-wear, dahl, nccl, abfraction, bewe): none is the concept of this page (articulating-paper reading, contact distribution on a bridge); centric-relation borderline (not discussed) \u2192 skipped. 0 qualifying terms, no glossary page edited."
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
                "reason": "Not a glossary publish (scoped cross-link runs only for a new glossary term)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "4.8: candidates = glossary + every brain page. Applied 1 strong: \u00ab\u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 \u06f2\u06f0 \u0645\u06cc\u06a9\u0631\u0648\u0646\u06cc\u00bb (first occurrence, para 2) \u2192 /insight/insight-1.html \u00ab\u0636\u062e\u0627\u0645\u062a \u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 \u0645\u0647\u0645\u200c\u062a\u0631 \u0627\u0632 \u0686\u06cc\u0632\u06cc\u0647 \u06a9\u0647 \u0641\u06a9\u0631 \u0645\u06cc\u200c\u06a9\u0646\u06cc\u00bb (same concept: paper thickness). Skipped borderline: \u00ab\u0627\u06a9\u0644\u0648\u0698\u0646\u00bb generic \u2192 share-47; \u00ab\u062a\u0645\u0627\u0633\u00bb \u2192 insight-104 (used in 4.9). Glossary: 0. Plain <a href> like other inline brain links (insight-80/25/18). git diff shows only the anchor."
                ],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "4.9: section had 2/5 (nav capsules), 3 free. Added strongest first: (1) /insight/insight-103.html \u00ab\u0627\u0635\u0644\u0627\u062d \u0627\u06a9\u0644\u0648\u0698\u0646 \u0628\u0627 \u0628\u0627\u06cc\u062a \u0631\u062c\u06cc\u0633\u062a\u0631\u06cc\u0634\u0646 \u0648 \u0627\u0633\u06a9\u0646 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u00bb \u2014 founder-requested link (scoped approval) and the correction route for an under-occluded unit; (2) /insight/insight-104.html \u00ab\u0631\u0648\u06a9\u0634 \u06a9\u0648\u062a\u0627\u0647 \u06cc\u0627 \u062a\u0645\u0627\u0633 \u0632\u0648\u062f\u0631\u0633\u061f\u00bb \u2014 diagnosing a unit out of contact; (3) /sharehub/share-47.html \u00ab\u062d\u0641\u0638 \u0648 \u062a\u0646\u0638\u06cc\u0645 \u0627\u06a9\u0644\u0648\u0698\u0646 \u062f\u0631 \u062a\u0631\u0645\u06cc\u0645 \u0648 \u0631\u0648\u06a9\u0634\u00bb. Skipped at cap: insight-65, insight-100, insight-8, video-2 fremitus, photocast BULL. related_cap: 5/5."
                ],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "plus/faq-corpus.json byContent[chairside/chairside-51].definedTermSets: 2 authored DefinedTerms #flashcards-c1, -c2 (concept recall, not FAQ near-copies); none in page JSON-LD; built by runner C.8"
                ],
                "id": "C.4.11",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "FAQPage #faq with 2 standalone binary questions (no deixis; case conditions embedded as \u00ab\u06cc\u06a9 \u0628\u0631\u06cc\u062c\u00bb), answers open with \u00ab\u062e\u06cc\u0631.\u00bb / \u00ab\u0628\u0644\u0647.\u00bb; both enter the scored bank. 4.12-\u0628: evaluated at 5.6"
                ],
                "id": "C.4.12",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.4.14",
                "module": "09-challenge.md",
                "reason": "Ordinary post (Question 4.9 \u00ab\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc\u00bb), no challenge markup",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Questions: \u00ab\u0628\u06cc\u0645\u0627\u0631 \u0645\u06cc\u06af\u0647 \u0628\u0627 \u0628\u0631\u06cc\u062c \u062c\u062f\u06cc\u062f \u0646\u0645\u06cc\u200c\u062a\u0648\u0646\u0647 \u063a\u0630\u0627 \u0628\u062c\u0648\u0647\u060c \u0686\u06cc \u0631\u0648 \u0686\u06a9 \u06a9\u0646\u0645\u061f\u00bb / \u00ab\u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 \u06af\u06cc\u0631 \u0645\u06cc\u200c\u06a9\u0646\u0647 \u06cc\u0639\u0646\u06cc \u0627\u06a9\u0644\u0648\u0698\u0646 \u062f\u0631\u0633\u062a\u0647\u061f\u00bb / \u00ab\u062a\u0645\u0627\u0633\u200c\u0647\u0627\u06cc \u0627\u06a9\u0644\u0648\u0632\u0627\u0644\u06cc \u0628\u0631\u06cc\u062c \u0631\u0648 \u0686\u0637\u0648\u0631 \u0627\u0631\u0632\u06cc\u0627\u0628\u06cc \u06a9\u0646\u0645\u061f\u00bb / \u00abarticulating paper marks \u0686\u06cc \u0631\u0648 \u0646\u0634\u0648\u0646 \u0645\u06cc\u062f\u0647\u061f\u00bb. Final canonical list (all reused via --simulate, no mint): #\u0648\u06cc\u0632\u06cc\u062a (brand), #\u06a9\u06cc\u0633_\u0628\u0627\u0644\u06cc\u0646\u06cc (structure), #\u06a9\u0627\u063a\u0630_\u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 (2 pages; decision+specific; resolving: \u00ab\u0627\u0645\u0627 \u06af\u06cc\u0631 \u06a9\u0631\u062f\u0646 \u06a9\u0627\u063a\u0630 \u0641\u0642\u0637 \u0646\u0634\u0648\u0646 \u0645\u06cc\u062f\u0647 \u06a9\u0647 \u06cc\u0647 \u062c\u0627\u06cc\u06cc \u062a\u0645\u0627\u0633 \u0648\u062c\u0648\u062f \u062f\u0627\u0631\u0647.\u00bb), #\u0628\u0631\u06cc\u062c (8; \u00ab\u06cc\u0639\u0646\u06cc \u0628\u06cc\u0645\u0627\u0631 \u0639\u0645\u0644\u0627\u064b \u0628\u0627 \u06cc\u06a9 \u0646\u0642\u0637\u0647 \u062f\u0627\u0631\u0647 \u063a\u0630\u0627 \u0645\u06cc\u200c\u062e\u0648\u0631\u0647 \u0648 \u0637\u0628\u06cc\u0639\u06cc\u0647 \u06a9\u0647 \u062d\u0633 \u06a9\u0646\u0647 \u0628\u0631\u06cc\u062c \"\u06a9\u0627\u0631 \u0646\u0645\u06cc\u200c\u06a9\u0646\u0647\".\u00bb), #\u0627\u06a9\u0644\u0648\u0698\u0646 (umbrella 49, with specifics; \u00ab\u0627\u06a9\u0644\u0648\u0698\u0646 \u06cc\u0639\u0646\u06cc \u06a9\u06cc\u0641\u06cc\u062a \u0648 \u062a\u0648\u0632\u06cc\u0639 \u062a\u0645\u0627\u0633\u200c\u0647\u0627\u060c \u0646\u0647 \u0641\u0642\u0637 \u0648\u062c\u0648\u062f \u06cc\u06a9 \u062a\u0645\u0627\u0633.\u00bb). Dropped: #\u062a\u0646\u0638\u06cc\u0645_\u0627\u06a9\u0644\u0648\u0698\u0646 (use_when = grinding method; page gives none), #\u0627\u06cc\u0646\u0641\u0631\u0627\u0627\u06a9\u0644\u0648\u0698\u0646 (page does not diagnose it, borderline), #\u0634\u06a9\u0627\u06cc\u062a_\u0627\u0635\u0644\u06cc (mention), #\u0642\u062f\u0631\u062a_\u062c\u0648\u06cc\u062f\u0646 (objective test, not this). Composition gate pass. Chairside page has no chip row. --sync/--check/reachability run after the brain write (C.5)."
                ],
                "id": "C.5.0",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Brain entry chairside-51 appended as last array element (604 entries) via json_append; key set/order identical to chairside-50 incl. pillar{primary,secondary,subtopic}; hashtags = C.5.0 list. Then hashtag_ref --sync (counts updated in dentcast-hashtag-reference.json), build_plus_index.mjs, hashtag_ref --check OK, build_cabinet_papers --check OK; reachability: Q2 (\u00ab\u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 \u06af\u06cc\u0631 \u0645\u06cc\u200c\u06a9\u0646\u0647 \u06cc\u0639\u0646\u06cc \u0627\u06a9\u0644\u0648\u0698\u0646 \u062f\u0631\u0633\u062a\u0647\u061f\u00bb) \u2192 chip \u00ab\u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646\u00bb (3 pages) \u2192 page at rank 3 of 4: PASS; Q1/Q3 via \u00ab\u0628\u0631\u06cc\u062c\u00bb (9 pages) page rank 9, not surfaced (umbrella-ish, recorded); Q4 same as Q2. content-index/assistant-tags reverted (runner C.8 output)."
                ],
                "id": "C.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Recorded pillar occlusion / occlusal-analysis-adjustment = step 2.4 value; capsule href /pillar/occlusion/ matches; no new subtopic"
                ],
                "id": "C.5.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.5.6",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "started"
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
            "validation": [
              {
                "checks": {
                  "arithmetic": "ok",
                  "audit_2d": "not owed (COMMENTARY)",
                  "band": "E ok",
                  "fidelity": "[null] \u2014 COMMENTARY self-record, no call owed",
                  "persian_text": "verify_publish --des-text ok; 3 interpretation sentences checked against text, kept",
                  "quotes": "item1 verbatim in source_text; item4 verbatim from chairside/index.html with note naming it",
                  "rating_rule": "des_record_guard check ok (no RESEARCH domains)",
                  "schema": "COMMENTARY nulls ok"
                },
                "content_id": "chairside/chairside-51",
                "kind": "des_receipt",
                "m3b": "none \u2014 no Fidelity units",
                "step": "C.4.13",
                "stored": "plus/des-scores.json key chairside/chairside-51 via dentcast_text_io.json_append",
                "summary": "COMMENTARY, source_text = page own body (title + 4 founder paragraphs + figure caption), FULL_TEXT; no DOI/lookup (basket 1). SOURCE call: claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9) --tools '' --model opus --no-session-persistence, fresh empty dir; model reported claude-opus-5-5; CLI 2.1.322. Result des_version 3.7, des_score 12 = 5+4+0+0+3, band E, provisional false."
              }
            ]
          }
        },
        {
          "decision": "Founder approved verbatim the agent-drafted paragraph on the misconception that an articulating-paper mark means a high spot (text sha256 b802556fe0a8524a95fba8926c92ab884f1f747074376239997a5c1fa5e0c95b); inserted before the last paragraph; invalidated from C.2",
          "evidence": [
            "founder chat 2026-11-10 \u00ab\u067e\u06cc\u0634\u200c\u0646\u0648\u06cc\u0633\u062a \u062e\u0648\u0628\u0647\u00bb"
          ],
          "kind": "founder_approval",
          "scope": "added body paragraph"
        },
        {
          "decision": "Founder confirmed the neighbouring natural teeth had contact in that closure (basis for the paragraph's conditional); not added to the page text beyond the approved paragraph.",
          "evidence": [
            "founder chat 2026-11-10"
          ],
          "kind": "founder_answer",
          "scope": "case fact"
        },
        {
          "decision": "Both exam questions approved verbatim by founder (\u00ab\u0647\u0631 \u062f\u0648 \u0633\u0624\u0627\u0644 \u062a\u0623\u06cc\u06cc\u062f\u00bb): r-f73f66ea (key \u062c, index 2), r-d6534e3a (key \u0628, index 1)",
          "evidence": [
            "founder chat 2026-11-10",
            "plus/exam-questions.json byContent[chairside/chairside-51]"
          ],
          "kind": "founder_answer",
          "scope": "M2 exam questions"
        },
        {
          "evidence": [
            "chairside/chairside-51.html first <p> = founder paragraph 1",
            "context.inputs founder text digest ef36963b\u2026"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder Claude Doc paragraph 1 \u00ab\u0628\u06cc\u0645\u0627\u0631\u06cc \u0628\u0631\u0627\u06cc \u0648\u06cc\u0632\u06cc\u062a \u0627\u0648\u0645\u062f\u0647 \u0628\u0648\u062f\u2026\u00bb opens the body; no agent lead added"
        },
        {
          "english": {
            "evidence": [
              "en page: lang en ltr, self-canonical .org, noindex follow, 0 hreflang, GA once, inLanguage en, og:locale en_US, toggle ../chairside-51.html; fa toggle en/chairside-51.html; metanotes/en/meta-1.html unchanged"
            ],
            "path": "chairside/en/chairside-51.html",
            "status": "ready"
          },
          "evidence": [
            "all decisions closed before Push 2"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "plus/des-scores.json chairside/chairside-51 COMMENTARY 15/E (receipt run 2)",
                "founder-approved added paragraph"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Question 4.9 ordinary post; C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "pillar occlusion/occlusal-analysis-adjustment (C.2.4, C.5.5)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 0 glossary; C.4.8 insight-1 inline; C.4.9 insight-103/104, share-47 (5/5)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 six canonical tags, no mint; hashtag_ref --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "dentcast-brain.json last entry chairside-51"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "plus/pathways.json occlusion + fixed-pros; plus/exam-questions.json 2 approved MCQs"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html Pulse top line \u00ab\u06cc\u06a9 \u0648\u06cc\u0632\u06cc\u062a \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab\u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f.\u00bb, oldest removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "chairside/en/chairside-51.html authored from locked text incl. the added paragraph; toggles inverse"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "M2 both approved; added paragraph approved; title/caption approvals recorded; no M1/M3b"
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
          "note": "founder text, transcribed verbatim from the doc's 5 text paragraphs",
          "ref": "artifact:claude-docs/52b29f07 (founder doc \u00ab\u0634\u0631\u062d \u0648\u06cc\u0632\u06cc\u062a: \u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631\u00bb, rev 2)",
          "sha256": "ef36963b97636f107a7475f845f0f79bedb19e2d670d96447fff7065e592065d"
        },
        {
          "note": "founder clinical photo, 930x1040 webp, alt \u00ab\u062a\u0645\u0627\u0633\u200c\u0647\u0627\u06cc \u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 \u0631\u0648\u06cc \u0628\u0631\u06cc\u062c\u00bb",
          "ref": "artifact-asset:52b29f07/de7c08685eda9bbc8329499ae41d4be8.webp",
          "sha256": "e036c1ce7b3ea908bfd1a3022cc0c35c77c95ccf532a7593e8605bd5629a0b8d"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "checks": {
            "arithmetic": "ok",
            "audit_2d": "not owed",
            "band": "E ok",
            "fidelity": "[null] COMMENTARY",
            "persian_text": "verify_publish --des-text ok; interpretation_fa sentence 2: Latin \u00abocclusion\u00bb/\u00abarticulating paper\u00bb \u2192 \u00ab\u0627\u06a9\u0644\u0648\u0698\u0646\u00bb/\u00ab\u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646\u00bb (Part 3(6) agent wording fix, score/quotes unchanged)",
            "quotes": "items 1,3,4 verbatim in source_text",
            "rating_rule": "ok",
            "schema": "ok"
          },
          "content_id": "chairside/chairside-51",
          "kind": "des_receipt",
          "m3b": "none",
          "run": 2,
          "step": "C.4.13",
          "stored": "plus/des-scores.json chairside/chairside-51 sources replaced via json_replace_value; fidelity [null]",
          "summary": "Re-run after invalidation (new body paragraph). COMMENTARY, source_text = title + 5 body paragraphs + figure caption, FULL_TEXT. claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9) --tools '' --model opus --no-session-persistence in a fresh empty dir; model reported claude-opus-5-5. des_version 3.7, des_score 15 = 5+4+0+3+3, band E (run 1 was 12: item 3 now earned by the new conditional sentence)."
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Read complete: CLAUDE.md, workflows/README.md, global/README.md + dentcast_global_rules core pages 1-3 and pathway-standings/certificate/exam sections, agent-parity.md, publish-checkpoints.md, publish-handoff-tool.md, modules 01 and 02. Capability: ls-remote OK, push to ccr-* branch, GitHub MCP for Actions/PR."
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (founder Claude Doc, 5 paragraphs + 1 image), paper file no \u2192 normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain parsed once: 603 entries; chairside latest = chairside-50 (keys type,id,title,caption,hashtags,keywords,page_url,pillar{primary,secondary,subtopic}); array tail = chairside-50; live PILLARS read (occlusion: occlusal-analysis-adjustment \u2026)"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Type: founder said \u00ab\u0686\u06cc\u0631 \u0633\u0627\u06cc\u062f\u00bb \u2192 brain type chairside (folder chairside/)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Next number: max chairside-50 + 1 = chairside-51; no gap"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Text supplied in founder Claude Doc (input digest ef36963b\u2026)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "De-AI pass: \u00ab\u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a\u00bb \u2014 colloquial first-person clinical narration, varied rhythm, no clich\u00e9s or filler; text kept byte-identical (colloquial register has chairside precedent: chairside-16/29/35/39/45)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Media: one image supplied in the doc (artifact asset de7c0868\u2026, 930x1040 webp, 32 KB) \u2192 chairside/cs51-1.webp per chairside csNN-k naming; no audio/video field in chairside entries"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No paper file attached \u2192 step 4.10 branch skipped"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Basket 1 COMMENTARY: founder own case narration and reasoning, no DOI/PubMed/references block; source_text = page text"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ordinary post (\u00ab\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc\u00bb): a case narration, not a question post"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent drafts in chairside precedent pattern \u00ab\u06cc\u06a9 \u0648\u06cc\u0632\u06cc\u062a \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f.\u00bb (index.html, chairside-48..50), title-only, no spoiler"
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
        "reason": "Not LiteCast (locked category chairside); module 03 step 0 applies only to LiteCast",
        "status": "skipped"
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
          "Template = chairside/chairside-50.html (previous same-category page), kept byte-unchanged (checked at C.4 with git diff --quiet)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Page rebuilt state: chairside/chairside-51.html = clone of chairside-50 + founder 4 paragraphs + founder-approved 5th paragraph (inserted before the last paragraph, verbatim from approved draft) + figure; GA once, preconnect x2, no trustseal; title/caption unchanged; lead origin author_original"
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
        "reason": "Not LiteCast (LiteCast link step only)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast (LiteCast link step only)",
        "status": "skipped"
      },
      {
        "evidence": [
          "Unchanged decision: occlusion / occlusal-analysis-adjustment (new paragraph reinforces it)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section nav capsules /glossary/ + /pillar/occlusion/ present"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "chairside/index.html row \u00ab\u0648\u06cc\u0632\u06cc\u062a \u06f5\u06f1 \u2014 \u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633 \u0645\u0624\u062b\u0631\u00bb (delivered at save point, unchanged)"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Dates re-audited: all 2026-11-10"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- chairside/chairside-50.html exit 0"
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
        "reason": "Not NoteCast (parent episode step only for NoteCast)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not NoteCast (NoteCast credit only)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not Promptologist (prev/next only for Promptologist)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [
          "plus/des-scores.json chairside/chairside-51: COMMENTARY 3.7, 15/E, fidelity [null]; Part 3 green; receipt run 2 in context.validation; no M3b"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.7 re-reviewed incl. new paragraph (grinding a marked spot): no glossary term is this concept (centric-relation borderline, skipped); 0 links"
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
        "reason": "Not a glossary publish (scoped cross-link runs only for a new glossary term)",
        "status": "skipped"
      },
      {
        "evidence": [
          "4.8: \u00ab\u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 \u06f2\u06f0 \u0645\u06cc\u06a9\u0631\u0648\u0646\u06cc\u00bb \u2192 /insight/insight-1.html (kept). New paragraph: \u00ab\u062a\u0631\u0627\u0634\u0634 \u062f\u0627\u062f\u00bb \u2192 insight-8/insight-104 borderline (general verb), skipped. Total 1 inline link."
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.9: 5/5 \u2014 nav x2 + insight-103 (founder-requested), insight-104, share-47; at cap"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "flashcards c1, c2 + new c3 \u00ab\u0645\u0644\u0627\u06a9 \u0642\u0636\u0627\u0648\u062a \u062f\u0631\u0628\u0627\u0631\u0647\u200c\u06cc \u0628\u0644\u0646\u062f \u0628\u0648\u062f\u0646 \u06cc\u06a9 \u0646\u0642\u0637\u0647\u200c\u06cc \u0639\u0644\u0627\u0645\u062a\u200c\u062e\u0648\u0631\u062f\u0647\u00bb (authored, not a FAQ near-copy) in plus/faq-corpus.json"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQ 3 standalone binary questions (new q3 \u00ab\u0622\u06cc\u0627 \u0639\u0644\u0627\u0645\u062a \u06a9\u0627\u063a\u0630 \u2026 \u0628\u0644\u0646\u062f \u0627\u0633\u062a \u0648 \u0628\u0627\u06cc\u062f \u062a\u0631\u0627\u0634 \u062f\u0627\u062f\u0647 \u0634\u0648\u062f\u061f\u00bb \u2192 \u00ab\u062e\u06cc\u0631.\u00bb); 4.12-\u0628 evaluated at 5.6"
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.14",
        "module": "09-challenge.md",
        "reason": "Ordinary post (Question 4.9 \u00ab\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc\u00bb), no challenge markup",
        "status": "skipped"
      },
      {
        "evidence": [
          "Final canonical list (no mint): #\u0648\u06cc\u0632\u06cc\u062a, #\u06a9\u06cc\u0633_\u0628\u0627\u0644\u06cc\u0646\u06cc, #\u06a9\u0627\u063a\u0630_\u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 (\u00ab\u0627\u0645\u0627 \u06af\u06cc\u0631 \u06a9\u0631\u062f\u0646 \u06a9\u0627\u063a\u0630 \u0641\u0642\u0637 \u0646\u0634\u0648\u0646 \u0645\u06cc\u062f\u0647 \u06a9\u0647 \u06cc\u0647 \u062c\u0627\u06cc\u06cc \u062a\u0645\u0627\u0633 \u0648\u062c\u0648\u062f \u062f\u0627\u0631\u0647.\u00bb), #\u062a\u0646\u0638\u06cc\u0645_\u0627\u06a9\u0644\u0648\u0698\u0646 (added after new paragraph \u2014 use_when \u00abrule of adjusting\u00bb: \u00ab\u0627\u06af\u0647 \u0628\u0642\u06cc\u0647 \u0647\u0645 \u062a\u0645\u0627\u0633 \u062f\u0627\u0631\u0646 \u0648 \u0641\u0642\u0637 \u06cc\u0647 \u0648\u0627\u062d\u062f \u0627\u0632 \u0628\u0631\u06cc\u062c \u0628\u062f\u0648\u0646 \u062a\u0645\u0627\u0633\u0647\u060c \u0645\u0634\u06a9\u0644 \u0627\u0632 \u06a9\u0648\u062a\u0627\u0647 \u0628\u0648\u062f\u0646 \u0627\u0648\u0646 \u0648\u0627\u062d\u062f\u0647\u060c \u0646\u0647 \u0628\u0644\u0646\u062f \u0628\u0648\u062f\u0646 \u062c\u0627\u06cc\u06cc \u06a9\u0647 \u0639\u0644\u0627\u0645\u062a \u0627\u0641\u062a\u0627\u062f\u0647.\u00bb), #\u0628\u0631\u06cc\u062c (\u00ab\u2026\u0637\u0628\u06cc\u0639\u06cc\u0647 \u06a9\u0647 \u062d\u0633 \u06a9\u0646\u0647 \u0628\u0631\u06cc\u062c \"\u06a9\u0627\u0631 \u0646\u0645\u06cc\u200c\u06a9\u0646\u0647\".\u00bb), #\u0627\u06a9\u0644\u0648\u0698\u0646 (\u00ab\u0627\u06a9\u0644\u0648\u0698\u0646 \u06cc\u0639\u0646\u06cc \u06a9\u06cc\u0641\u06cc\u062a \u0648 \u062a\u0648\u0632\u06cc\u0639 \u062a\u0645\u0627\u0633\u200c\u0647\u0627\u060c \u0646\u0647 \u0641\u0642\u0637 \u0648\u062c\u0648\u062f \u06cc\u06a9 \u062a\u0645\u0627\u0633.\u00bb). Gate: decision tag #\u062a\u0646\u0638\u06cc\u0645_\u0627\u06a9\u0644\u0648\u0698\u0646, specific #\u06a9\u0627\u063a\u0630_\u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 (3) + #\u0628\u0631\u06cc\u062c (9), umbrella with specifics. Dropped #\u0627\u06cc\u0646\u0641\u0631\u0627\u0627\u06a9\u0644\u0648\u0698\u0646/#\u0634\u06a9\u0627\u06cc\u062a_\u0627\u0635\u0644\u06cc/#\u0642\u062f\u0631\u062a_\u062c\u0648\u06cc\u062f\u0646 (mentions/borderline)."
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain chairside-51 is last element; key parity with chairside-50; hashtags = C.5.0 list (json_replace_value). hashtag_ref --sync; build_plus_index; --check OK; cabinet --check OK. Reachability: Q2/Q4 \u2192 chip \u00ab\u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646\u00bb (3 pages) rank 3: PASS; \u00ab\u062a\u0646\u0638\u06cc\u0645 \u0627\u06a9\u0644\u0648\u0698\u0646\u00bb 15 pages, rank >4 (umbrella). content-index/assistant-tags reverted for runner."
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar occlusion/occlusal-analysis-adjustment = 2.4; capsule matches"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pathways: occlusion + fixed-pros, both after insight/insight-1 (plus/pathways.json); others borderline not placed; coverage 1.51/item. 4.12-\u0628: 2 MCQs approved verbatim by founder in M2 (r-f73f66ea key index 2, r-d6534e3a key index 1), appended to plus/exam-questions.json; validate_exam_questions.py 0 errors (9 pre-existing warnings, none ours); drawn by occlusion and fixed-pros."
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Bundles continuing occlusion/fixed-pros: rejected at GATE 1 (chairside/ folder is never a bundle type). No bundle edit."
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse line inserted at top of index.html dc-pulse-list, oldest (insight-106) removed, 7 lines; English mirror + toggles on disk; second_cut_editorial_lock_v1 recorded with 10 scopes; lead provenance + title/caption approvals recorded"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "chairside/chairside-51.html",
      "chairside/cs51-1.webp",
      "chairside/en/chairside-51.html",
      "chairside/index.html",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plus/assistant-tags.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: chairside/chairside-51.html, chairside/en/chairside-51.html, dentcast-brain.json, dentcast-hashtag-reference.json, index.html, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
