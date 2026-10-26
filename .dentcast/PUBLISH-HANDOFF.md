# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-42"
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
    "content_id": "sharehub/share-42",
    "context": {
      "approvals": [
        {
          "decision": "All 16 readability/de-AI rewrites applied",
          "evidence": [
            "founder reply: \u00ab\u0647\u0645\u0647 \u0627\u0639\u0645\u0627\u0644 \u0628\u0634\u0647\u00bb",
            "re-confirmed after caption invalidation: founder \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb",
            "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)",
            "restored after Part 3b round-3 invalidation"
          ],
          "scope": "style-pass-B.3.5",
          "status": "confirmed"
        },
        {
          "decision": "\u06a9\u0644\u06cc\u06a9 \u0641\u06a9 \u0648 \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u0631\u06cc\u067e\u0648\u0632\u06cc\u0634\u0646 \u0642\u062f\u0627\u0645\u06cc\u061b \u0627\u0632 \u062a\u0634\u062e\u06cc\u0635 \u062a\u0627 \u067e\u0627\u06cc\u0627\u0646 \u062f\u0631\u0645\u0627\u0646",
          "evidence": [
            "founder-supplied title in publication message",
            "re-confirmed after caption invalidation: founder \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb",
            "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)",
            "restored after Part 3b round-3 invalidation"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u06cc\u06a9\u06cc \u0627\u0632 \u06cc\u0627\u0641\u062a\u0647\u200c\u0647\u0627\u06cc \u0628\u0627\u0644\u06cc\u0646\u06cc \u062f\u0631 \u0628\u06cc\u0645\u0627\u0631\u0627\u0646 \u062f\u0627\u0631\u0627\u06cc \u06a9\u0644\u06cc\u06a9\u060c \u062d\u0630\u0641 \u0635\u062f\u0627 \u0628\u0627 \u062c\u0644\u0648\u0622\u0648\u0631\u062f\u0646 \u0641\u06a9 \u0627\u0633\u062a. \u0627\u0645\u0627 \u067e\u06cc\u0634 \u0627\u0632 \u0633\u0627\u062e\u062a \u0627\u0633\u067e\u0644\u06cc\u0646\u062a\u060c \u0628\u0627\u06cc\u062f \u0645\u0634\u062e\u0635 \u0634\u0648\u062f \u0628\u06cc\u0645\u0627\u0631 \u0639\u0644\u0627\u0648\u0647 \u0628\u0631 \u0635\u062f\u0627\u060c \u062f\u0631\u062f \u0645\u0641\u0635\u0644 \u06cc\u0627 \u0627\u062e\u062a\u0644\u0627\u0644 \u0639\u0645\u0644\u06a9\u0631\u062f \u0647\u0645 \u062f\u0627\u0631\u062f \u06cc\u0627 \u062e\u06cc\u0631.",
          "evidence": [
            "founder reply: \u00ab\u06a9\u067e\u0634\u0646 \u0627\u0644\u0641\u00bb",
            "re-confirmed after caption invalidation: founder \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb",
            "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)",
            "restored after Part 3b round-3 invalidation"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "Publish Okeson 2020 Figs 15.28/15.29 as webp; figcaption = short book source line only (no explanatory text)",
          "evidence": [
            "founder: \u00ab\u0641\u0642\u0637 \u2026 \u06cc\u0647 \u0686\u06cc\u0632 \u06a9\u0648\u062a\u0627\u0647 \u0628\u0646\u0648\u06cc\u0633 \u06a9\u0647 \u0645\u0646\u0628\u0639\u0634 \u0686\u06cc\u0647 \u0627\u0632 \u062e\u0648\u062f \u06a9\u062a\u0627\u0628 \u2026 \u062a\u0648\u0636\u06cc\u062d\u0634 \u0646\u0645\u06cc\u200c\u062e\u0648\u0627\u062f\u00bb",
            "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)",
            "restored after Part 3b round-3 invalidation"
          ],
          "scope": "figures-okeson",
          "status": "confirmed"
        },
        {
          "decision": "#Share_Hub #Curated_Content #TMD #\u062f\u0627\u062e\u0644_\u06a9\u067e\u0633\u0648\u0644\u06cc #\u0627\u0633\u067e\u0644\u06cc\u0646\u062a + mint #\u0627\u0633\u067e\u0644\u06cc\u0646\u062a_\u0631\u06cc\u067e\u0648\u0632\u06cc\u0634\u0646 #\u062c\u0627\u0628\u062c\u0627\u06cc\u06cc_\u062f\u06cc\u0633\u06a9",
          "evidence": [
            "founder: \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb",
            "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)",
            "restored after Part 3b round-3 invalidation"
          ],
          "scope": "hashtags",
          "status": "confirmed"
        },
        {
          "decision": "Option 1 founder-directed unit assignment (book = all body units drawn from the 11 pages)",
          "evidence": [
            "founder: \u00ab\u067e\u06cc\u0634\u0646\u0647\u0627\u062f \u062e\u0648\u062f\u062a \u0628\u0647 \u0646\u0638\u0631\u0645 \u0628\u0647\u062a\u0631\u0647\u00bb",
            "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)",
            "restored after Part 3b round-3 invalidation"
          ],
          "scope": "fidelity-assignment",
          "status": "confirmed"
        },
        {
          "decision": "u63 \u00ab\u06a9\u0645 \u0634\u0648\u062f\u00bb\u2192\u00ab\u062d\u0630\u0641 \u0634\u0648\u062f\u00bb (\u0627\u0635\u0644\u0627\u062d \u06a9\u0646); u47 reason rewritten to Okeson p.399 rationale (\u0627\u0635\u0644\u0627\u062d \u06a9\u0646); re-check the 25 NOT_ASSESSABLE book units and also judge them against Okeson 1988 abstract and Conti full text",
          "evidence": [
            "founder: \u00ab\u0647\u0631 \u062f\u0648 \u0631\u0648 \u0627\u0635\u0644\u0627\u062d \u06a9\u0646 \u0648 \u0627\u0648\u0646 \u062c\u0645\u0644\u0647 \u0647\u0627\u06cc\u06cc \u06a9\u0647 \u06af\u0641\u062a\u06cc\u0645 \u062a\u0648 \u06a9\u062a\u0627\u0628 \u0628\u0648\u062f\u0646 \u0627\u0645\u0627 \u0646\u0628\u0648\u062f\u0646 \u062a\u0633\u062a \u0645\u062c\u062f\u062f \u0628\u0634\u0646 \u0627\u06af\u0631 \u0646\u0628\u0648\u062f\u0646 \u062a\u0648 \u062f\u0648 \u0645\u0646\u0628\u0639 \u062f\u06cc\u06af\u0647 \u0633\u0631\u0686 \u0628\u0634\u0646\u00bb",
            "restored after Part 3b round-3 invalidation"
          ],
          "scope": "fidelity-3b",
          "status": "confirmed"
        },
        {
          "decision": "u47 restored to founder original \u00ab\u0642\u0648\u0633 \u0628\u0627\u0644\u0627 \u0645\u0639\u0645\u0648\u0644\u0627\u064b \u062a\u0631\u062c\u06cc\u062d \u062f\u0627\u0631\u062f\u060c \u0632\u06cc\u0631\u0627 \u0633\u0627\u062e\u062a \u0631\u0645\u067e \u0647\u062f\u0627\u06cc\u062a\u200c\u06a9\u0646\u0646\u062f\u0647 \u0628\u0631\u0627\u06cc \u06a9\u0646\u062a\u0631\u0644 \u0645\u0648\u0642\u0639\u06cc\u062a \u0641\u06a9 \u0631\u0648\u06cc \u0622\u0646 \u0622\u0633\u0627\u0646\u200c\u062a\u0631 \u0627\u0633\u062a.\u00bb (Okeson p.394); u89 replaced by founder text \u00ab\u062f\u0631 \u0627\u06cc\u0646 \u0634\u0631\u0627\u06cc\u0637\u060c \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u0631\u06cc\u067e\u0648\u0632\u06cc\u0634\u0646 \u0628\u0647 \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u0627\u0633\u062a\u0628\u06cc\u0644\u0627\u06cc\u0632\u06cc\u0634\u0646 \u062a\u0628\u062f\u06cc\u0644 \u0645\u06cc\u200c\u0634\u0648\u062f \u062a\u0627 \u0627\u0645\u06a9\u0627\u0646 \u0628\u0627\u0632\u06af\u0634\u062a \u06a9\u0646\u062f\u06cc\u0644\u200c\u0647\u0627 \u0628\u0647 \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u0633\u06a9\u0644\u062a\u06cc\u200c\u0639\u0636\u0644\u0627\u0646\u06cc \u067e\u0627\u06cc\u062f\u0627\u0631 \u0641\u0631\u0627\u0647\u0645 \u0634\u0648\u062f.\u00bb; Okeson source excerpt extended with founder pages 360 and 394",
          "evidence": [
            "founder: \u00ab\u062c\u0645\u0644\u0647\u0654 \u0627\u0635\u0644\u06cc \u062e\u0648\u062f\u0645 \u0628\u0631\u06af\u0631\u062f\u0647\u060c \u06af\u0632\u06cc\u0646\u0647 \u06f1\u00bb",
            "founder message supplying pp.329/360/394 and the u89 rewrite"
          ],
          "scope": "fidelity-3b-r3",
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
            "founder-text-of-record sha256 8c10736d77868a04b262889a5a7a9f1f13b87863521db9bfaf34d5ebdf5a9591"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "Founder message text: first paragraph \u00ab\u062f\u06cc\u0633\u06a9 \u0645\u0641\u0635\u0644 \u06af\u06cc\u062c\u06af\u0627\u0647\u06cc\u200c\u0641\u06a9\u06cc \u0645\u06cc\u0627\u0646 \u06a9\u0646\u062f\u06cc\u0644\u2026\u00bb used verbatim as lead; no agent-composed lead"
        },
        {
          "from_step": "C.2",
          "kind": "dependency_invalidation_v1",
          "reason": "Founder asked to shorten both figcaptions to the book source line only (no explanatory text); approved page prose changed -> invalidate C.2 onward",
          "superseded": {
            "approvals": [
              {
                "decision": "All 16 readability/de-AI rewrites applied",
                "evidence": [
                  "founder reply: \u00ab\u0647\u0645\u0647 \u0627\u0639\u0645\u0627\u0644 \u0628\u0634\u0647\u00bb"
                ],
                "scope": "style-pass-B.3.5",
                "status": "confirmed"
              },
              {
                "decision": "\u06a9\u0644\u06cc\u06a9 \u0641\u06a9 \u0648 \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u0631\u06cc\u067e\u0648\u0632\u06cc\u0634\u0646 \u0642\u062f\u0627\u0645\u06cc\u061b \u0627\u0632 \u062a\u0634\u062e\u06cc\u0635 \u062a\u0627 \u067e\u0627\u06cc\u0627\u0646 \u062f\u0631\u0645\u0627\u0646",
                "evidence": [
                  "founder-supplied title in publication message"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "\u06cc\u06a9\u06cc \u0627\u0632 \u06cc\u0627\u0641\u062a\u0647\u200c\u0647\u0627\u06cc \u0628\u0627\u0644\u06cc\u0646\u06cc \u062f\u0631 \u0628\u06cc\u0645\u0627\u0631\u0627\u0646 \u062f\u0627\u0631\u0627\u06cc \u06a9\u0644\u06cc\u06a9\u060c \u062d\u0630\u0641 \u0635\u062f\u0627 \u0628\u0627 \u062c\u0644\u0648\u0622\u0648\u0631\u062f\u0646 \u0641\u06a9 \u0627\u0633\u062a. \u0627\u0645\u0627 \u067e\u06cc\u0634 \u0627\u0632 \u0633\u0627\u062e\u062a \u0627\u0633\u067e\u0644\u06cc\u0646\u062a\u060c \u0628\u0627\u06cc\u062f \u0645\u0634\u062e\u0635 \u0634\u0648\u062f \u0628\u06cc\u0645\u0627\u0631 \u0639\u0644\u0627\u0648\u0647 \u0628\u0631 \u0635\u062f\u0627\u060c \u062f\u0631\u062f \u0645\u0641\u0635\u0644 \u06cc\u0627 \u0627\u062e\u062a\u0644\u0627\u0644 \u0639\u0645\u0644\u06a9\u0631\u062f \u0647\u0645 \u062f\u0627\u0631\u062f \u06cc\u0627 \u062e\u06cc\u0631.",
                "evidence": [
                  "founder reply: \u00ab\u06a9\u067e\u0634\u0646 \u0627\u0644\u0641\u00bb"
                ],
                "scope": "caption",
                "status": "confirmed"
              },
              {
                "decision": "Publish Okeson 2020 Figs 15.28/15.29 with reference credit as webp at relevant positions",
                "evidence": [
                  "founder reply: \u00ab\u062f\u0631 \u0645\u0648\u0631\u062f \u0639\u06a9\u0633 \u0631\u0641\u0631\u0646\u0633 \u0628\u062f\u0647 \u2026 \u0628\u0647 \u0634\u06a9\u0644 \u0648\u0628 \u067e\u06cc\u00bb"
                ],
                "scope": "figures-okeson",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [
              {
                "note": "private copyrighted source, kept local; used for Fidelity EXCERPT",
                "ref": "okeson-2020-excerpts: 11 founder-selected pages (pp. 325,327,329,330,331,332,396,397,398,399,400)"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "sharehub/share-42.html cloned from share-41 (structure preserved, .org domain, GA4 once, 2 preconnect crossorigin, no enamad); body = text of record; 2 figures webp; refs list; lead author_original; page sha d6621aa3"
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
                "reason": "LiteCast branch inactive: sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast branch inactive: sharehub",
                "status": "skipped"
              },
              {
                "evidence": [
                  "pillar.primary=occlusion (structured), subtopic=tmd-orofacial-pain; single clear fit (HR14 auto-applied, announced to founder)"
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "dc-related-section with 2 capsules: /glossary/ + /pillar/occlusion/ (typed-brain branch)"
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "sharehub/index.html hand-maintained: added <li> share-42 at top with \u00ab(\u0645\u0637\u0644\u0628\u06cc \u0627\u0632 \u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646)\u00bb, 1-line diff, CRLF preserved"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Audit: datePublished=dateModified=2026-10-26; title on 9 surfaces, caption on 4 meta surfaces, canonical/og:url/JSON-LD all share-42; no stale share-41 refs; all OK"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Template share-41 sha256 a865d04b\u2026 unchanged (matches C.1)"
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
                "reason": "NoteCast only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "episode/NoteCast pair only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Promptologist only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Fresh semantic review of glossary.json (109 terms): genuine candidates tmd, occlusal-splint, centric-relation \u2014 all three \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb sections at/over 5-link cap (5/6/5) -> 0 added, nothing touched"
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
                "reason": "Not a glossary publish (scoped cross-link runs only for glossary terms)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Fresh body analysis vs glossary+episodes: auto-applied (unmistakable, first occurrence) \u00ab\u0627\u0633\u067e\u0644\u06cc\u0646\u062a\u00bb (para 4) -> /glossary/occlusal-splint.html; \u00abCR\u00bb (section 6) -> /glossary/centric-relation.html. Rejected: tmd (body names the joint, not the disorder); episode links handled in 4.9. Only anchor insertions; prose digest unchanged"
                ],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "started"
              },
              {
                "evidence": [],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "pending"
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
        },
        {
          "decision": "Founder chose option 1: run des_fidelity_units.py split/build/vote unchanged but with an explicit unit plan, because the tool's Latin-only markers map no body sentence to the Okeson 2020 book (Persian \u00ab\u0627\u0648\u06a9\u06cc\u0633\u0648\u0646\u00bb unrecognised; \u00abOkeson\u00bb shared with the 1988 paper). Plan: src0 book EXCERPT 70 body units; src1 Okeson 1988 abstract u80,u81,u92,u101,u102,u103; src2 Conti u104,u105; excluded headings, toggle label u2, figure source lines u24-u29,u56-u61.",
          "evidence": [
            "founder: \u00ab\u067e\u06cc\u0634\u0646\u0647\u0627\u062f \u062e\u0648\u062f\u062a \u0628\u0647 \u0646\u0638\u0631\u0645 \u0628\u0647\u062a\u0631\u0647 \u0686\u0648\u0646 \u0648\u0627\u0642\u0639\u0627\u064b \u06a9\u062a\u0627\u0628 \u0645\u0646\u0628\u0639 \u0627\u0635\u0644\u06cc\u0647\u00bb"
          ],
          "kind": "fidelity_unit_assignment_founder_directed"
        },
        {
          "from_step": "C.2",
          "kind": "dependency_invalidation_v1",
          "reason": "Part 3b founder-accepted fidelity fixes changed approved page prose after delivery 1: u63 \u00ab\u06a9\u0645 \u0634\u0648\u062f\u00bb\u2192\u00ab\u062d\u0630\u0641 \u0634\u0648\u062f\u00bb; u47 rationale per Okeson p.399. Re-verify C.2 onward; Drive external action remains completed",
          "superseded": {
            "approvals": [
              {
                "decision": "All 16 readability/de-AI rewrites applied",
                "evidence": [
                  "founder reply: \u00ab\u0647\u0645\u0647 \u0627\u0639\u0645\u0627\u0644 \u0628\u0634\u0647\u00bb",
                  "re-confirmed after caption invalidation: founder \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb"
                ],
                "scope": "style-pass-B.3.5",
                "status": "confirmed"
              },
              {
                "decision": "\u06a9\u0644\u06cc\u06a9 \u0641\u06a9 \u0648 \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u0631\u06cc\u067e\u0648\u0632\u06cc\u0634\u0646 \u0642\u062f\u0627\u0645\u06cc\u061b \u0627\u0632 \u062a\u0634\u062e\u06cc\u0635 \u062a\u0627 \u067e\u0627\u06cc\u0627\u0646 \u062f\u0631\u0645\u0627\u0646",
                "evidence": [
                  "founder-supplied title in publication message",
                  "re-confirmed after caption invalidation: founder \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "\u06cc\u06a9\u06cc \u0627\u0632 \u06cc\u0627\u0641\u062a\u0647\u200c\u0647\u0627\u06cc \u0628\u0627\u0644\u06cc\u0646\u06cc \u062f\u0631 \u0628\u06cc\u0645\u0627\u0631\u0627\u0646 \u062f\u0627\u0631\u0627\u06cc \u06a9\u0644\u06cc\u06a9\u060c \u062d\u0630\u0641 \u0635\u062f\u0627 \u0628\u0627 \u062c\u0644\u0648\u0622\u0648\u0631\u062f\u0646 \u0641\u06a9 \u0627\u0633\u062a. \u0627\u0645\u0627 \u067e\u06cc\u0634 \u0627\u0632 \u0633\u0627\u062e\u062a \u0627\u0633\u067e\u0644\u06cc\u0646\u062a\u060c \u0628\u0627\u06cc\u062f \u0645\u0634\u062e\u0635 \u0634\u0648\u062f \u0628\u06cc\u0645\u0627\u0631 \u0639\u0644\u0627\u0648\u0647 \u0628\u0631 \u0635\u062f\u0627\u060c \u062f\u0631\u062f \u0645\u0641\u0635\u0644 \u06cc\u0627 \u0627\u062e\u062a\u0644\u0627\u0644 \u0639\u0645\u0644\u06a9\u0631\u062f \u0647\u0645 \u062f\u0627\u0631\u062f \u06cc\u0627 \u062e\u06cc\u0631.",
                "evidence": [
                  "founder reply: \u00ab\u06a9\u067e\u0634\u0646 \u0627\u0644\u0641\u00bb",
                  "re-confirmed after caption invalidation: founder \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb"
                ],
                "scope": "caption",
                "status": "confirmed"
              },
              {
                "decision": "Publish Okeson 2020 Figs 15.28/15.29 as webp; figcaption = short book source line only (no explanatory text)",
                "evidence": [
                  "founder: \u00ab\u0641\u0642\u0637 \u2026 \u06cc\u0647 \u0686\u06cc\u0632 \u06a9\u0648\u062a\u0627\u0647 \u0628\u0646\u0648\u06cc\u0633 \u06a9\u0647 \u0645\u0646\u0628\u0639\u0634 \u0686\u06cc\u0647 \u0627\u0632 \u062e\u0648\u062f \u06a9\u062a\u0627\u0628 \u2026 \u062a\u0648\u0636\u06cc\u062d\u0634 \u0646\u0645\u06cc\u200c\u062e\u0648\u0627\u062f\u00bb"
                ],
                "scope": "figures-okeson",
                "status": "confirmed"
              },
              {
                "decision": "#Share_Hub #Curated_Content #TMD #\u062f\u0627\u062e\u0644_\u06a9\u067e\u0633\u0648\u0644\u06cc #\u0627\u0633\u067e\u0644\u06cc\u0646\u062a + mint #\u0627\u0633\u067e\u0644\u06cc\u0646\u062a_\u0631\u06cc\u067e\u0648\u0632\u06cc\u0634\u0646 #\u062c\u0627\u0628\u062c\u0627\u06cc\u06cc_\u062f\u06cc\u0633\u06a9",
                "evidence": [
                  "founder: \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb"
                ],
                "scope": "hashtags",
                "status": "confirmed"
              },
              {
                "decision": "Option 1 founder-directed unit assignment (book = all body units drawn from the 11 pages)",
                "evidence": [
                  "founder: \u00ab\u067e\u06cc\u0634\u0646\u0647\u0627\u062f \u062e\u0648\u062f\u062a \u0628\u0647 \u0646\u0638\u0631\u0645 \u0628\u0647\u062a\u0631\u0647\u00bb"
                ],
                "scope": "fidelity-assignment",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [
              {
                "note": "private copyrighted source, kept local; used for Fidelity EXCERPT",
                "ref": "okeson-2020-excerpts: 11 founder-selected pages (pp. 325,327,329,330,331,332,396,397,398,399,400)"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "Re-verified: share-42 clone structure, .org, GA4 once, preconnect x2, no enamad; figcaptions now short book source line (founder); page sha d41e7650"
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
                "reason": "LiteCast branch inactive: sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast branch inactive: sharehub",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Re-verified pillar occlusion / tmd-orofacial-pain (unchanged decision)"
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Re-verified dc-related-section: /glossary/ + /pillar/occlusion/"
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Re-verified sharehub/index.html single added <li> for share-42"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Re-audit: dates 2026-10-26 x2, title/caption surfaces unchanged, all OK"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Template share-41 sha a865d04b\u2026 unchanged"
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
                "reason": "NoteCast only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "episode/NoteCast pair only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Promptologist only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Re-verified: tmd/occlusal-splint/centric-relation glossary sections at cap -> 0 added"
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
                  "Re-verified inline anchors: \u0627\u0633\u067e\u0644\u06cc\u0646\u062a -> /glossary/occlusal-splint.html; CR -> /glossary/centric-relation.html (first occurrence)"
                ],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Fresh semantic comparison vs whole brain: added 3 capsules (5/5 cap): episode-86 TMD intracapsular, episode-144 Dawson-Okeson pt3 joint pathologies, episode-145 pt4 splint therapy; budget 2 used + 3 = 5"
                ],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "See external_action C.4.10.1:drive-rename-move (completed): founder-uploaded root file renamed to real title and moved to Occlusion; drive_id 1N7v7QVCdWHCJVdIHtpxjyArw2Bkgn63s"
                ],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Catalog P2947 appended (key set == P2946 template), topic Occlusion, 12 kebab tags incl topic:occlusion + title tag, Drive view/download/id, DOI/journal/year from PDF+DOI, total_papers 2261->2262 (no round-hundred crossing; \u06f2\u06f2\u06f0\u06f0 claim unchanged); JSON valid"
                ],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "DOI 10.1590/S1678-77572005000400006 + first author Conti PCR from PDF header; page \u00ab\u2206 \u0645\u0646\u0627\u0628\u0639\u00bb list (share-22 style, several sources) links Conti PCR et al. -> doi.org; Okeson 1988 DOI 10.1016/0022-3913(88)90224-7 verified via PubMed PMID 3199322; no isBasedOn in sharehub template"
                ],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "plus/faq-corpus.json byContent[sharehub/share-42].definedTermSets: 6 authored DefinedTerms #flashcards-c1..c6; none copies a FAQ answer"
                ],
                "id": "C.4.11",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "FAQPage 9 questions, all standalone (no deixis), all binary with explicit \u0628\u0644\u0647/\u062e\u06cc\u0631 verdict opening; 4.12-\u0628: evaluated at 5.6"
                ],
                "id": "C.4.12",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "started"
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
        },
        {
          "from_step": "C.2",
          "kind": "dependency_invalidation_v1",
          "reason": "Part 3b round 3: founder restored original u47 (supported verbatim by Okeson p.394) and supplied u89 text; Okeson excerpt extended with pp.360,394; FAQ7/flashcard c5 swept",
          "superseded": {
            "approvals": [
              {
                "decision": "All 16 readability/de-AI rewrites applied",
                "evidence": [
                  "founder reply: \u00ab\u0647\u0645\u0647 \u0627\u0639\u0645\u0627\u0644 \u0628\u0634\u0647\u00bb",
                  "re-confirmed after caption invalidation: founder \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb",
                  "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)"
                ],
                "scope": "style-pass-B.3.5",
                "status": "confirmed"
              },
              {
                "decision": "\u06a9\u0644\u06cc\u06a9 \u0641\u06a9 \u0648 \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u0631\u06cc\u067e\u0648\u0632\u06cc\u0634\u0646 \u0642\u062f\u0627\u0645\u06cc\u061b \u0627\u0632 \u062a\u0634\u062e\u06cc\u0635 \u062a\u0627 \u067e\u0627\u06cc\u0627\u0646 \u062f\u0631\u0645\u0627\u0646",
                "evidence": [
                  "founder-supplied title in publication message",
                  "re-confirmed after caption invalidation: founder \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb",
                  "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "\u06cc\u06a9\u06cc \u0627\u0632 \u06cc\u0627\u0641\u062a\u0647\u200c\u0647\u0627\u06cc \u0628\u0627\u0644\u06cc\u0646\u06cc \u062f\u0631 \u0628\u06cc\u0645\u0627\u0631\u0627\u0646 \u062f\u0627\u0631\u0627\u06cc \u06a9\u0644\u06cc\u06a9\u060c \u062d\u0630\u0641 \u0635\u062f\u0627 \u0628\u0627 \u062c\u0644\u0648\u0622\u0648\u0631\u062f\u0646 \u0641\u06a9 \u0627\u0633\u062a. \u0627\u0645\u0627 \u067e\u06cc\u0634 \u0627\u0632 \u0633\u0627\u062e\u062a \u0627\u0633\u067e\u0644\u06cc\u0646\u062a\u060c \u0628\u0627\u06cc\u062f \u0645\u0634\u062e\u0635 \u0634\u0648\u062f \u0628\u06cc\u0645\u0627\u0631 \u0639\u0644\u0627\u0648\u0647 \u0628\u0631 \u0635\u062f\u0627\u060c \u062f\u0631\u062f \u0645\u0641\u0635\u0644 \u06cc\u0627 \u0627\u062e\u062a\u0644\u0627\u0644 \u0639\u0645\u0644\u06a9\u0631\u062f \u0647\u0645 \u062f\u0627\u0631\u062f \u06cc\u0627 \u062e\u06cc\u0631.",
                "evidence": [
                  "founder reply: \u00ab\u06a9\u067e\u0634\u0646 \u0627\u0644\u0641\u00bb",
                  "re-confirmed after caption invalidation: founder \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb",
                  "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)"
                ],
                "scope": "caption",
                "status": "confirmed"
              },
              {
                "decision": "Publish Okeson 2020 Figs 15.28/15.29 as webp; figcaption = short book source line only (no explanatory text)",
                "evidence": [
                  "founder: \u00ab\u0641\u0642\u0637 \u2026 \u06cc\u0647 \u0686\u06cc\u0632 \u06a9\u0648\u062a\u0627\u0647 \u0628\u0646\u0648\u06cc\u0633 \u06a9\u0647 \u0645\u0646\u0628\u0639\u0634 \u0686\u06cc\u0647 \u0627\u0632 \u062e\u0648\u062f \u06a9\u062a\u0627\u0628 \u2026 \u062a\u0648\u0636\u06cc\u062d\u0634 \u0646\u0645\u06cc\u200c\u062e\u0648\u0627\u062f\u00bb",
                  "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)"
                ],
                "scope": "figures-okeson",
                "status": "confirmed"
              },
              {
                "decision": "#Share_Hub #Curated_Content #TMD #\u062f\u0627\u062e\u0644_\u06a9\u067e\u0633\u0648\u0644\u06cc #\u0627\u0633\u067e\u0644\u06cc\u0646\u062a + mint #\u0627\u0633\u067e\u0644\u06cc\u0646\u062a_\u0631\u06cc\u067e\u0648\u0632\u06cc\u0634\u0646 #\u062c\u0627\u0628\u062c\u0627\u06cc\u06cc_\u062f\u06cc\u0633\u06a9",
                "evidence": [
                  "founder: \u00ab\u0628\u0642\u06cc\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb",
                  "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)"
                ],
                "scope": "hashtags",
                "status": "confirmed"
              },
              {
                "decision": "Option 1 founder-directed unit assignment (book = all body units drawn from the 11 pages)",
                "evidence": [
                  "founder: \u00ab\u067e\u06cc\u0634\u0646\u0647\u0627\u062f \u062e\u0648\u062f\u062a \u0628\u0647 \u0646\u0638\u0631\u0645 \u0628\u0647\u062a\u0631\u0647\u00bb",
                  "restored after Part 3b invalidation (decision unchanged; edits limited to u47/u63 per founder)"
                ],
                "scope": "fidelity-assignment",
                "status": "confirmed"
              },
              {
                "decision": "u63 \u00ab\u06a9\u0645 \u0634\u0648\u062f\u00bb\u2192\u00ab\u062d\u0630\u0641 \u0634\u0648\u062f\u00bb (\u0627\u0635\u0644\u0627\u062d \u06a9\u0646); u47 reason rewritten to Okeson p.399 rationale (\u0627\u0635\u0644\u0627\u062d \u06a9\u0646); re-check the 25 NOT_ASSESSABLE book units and also judge them against Okeson 1988 abstract and Conti full text",
                "evidence": [
                  "founder: \u00ab\u0647\u0631 \u062f\u0648 \u0631\u0648 \u0627\u0635\u0644\u0627\u062d \u06a9\u0646 \u0648 \u0627\u0648\u0646 \u062c\u0645\u0644\u0647 \u0647\u0627\u06cc\u06cc \u06a9\u0647 \u06af\u0641\u062a\u06cc\u0645 \u062a\u0648 \u06a9\u062a\u0627\u0628 \u0628\u0648\u062f\u0646 \u0627\u0645\u0627 \u0646\u0628\u0648\u062f\u0646 \u062a\u0633\u062a \u0645\u062c\u062f\u062f \u0628\u0634\u0646 \u0627\u06af\u0631 \u0646\u0628\u0648\u062f\u0646 \u062a\u0648 \u062f\u0648 \u0645\u0646\u0628\u0639 \u062f\u06cc\u06af\u0647 \u0633\u0631\u0686 \u0628\u0634\u0646\u00bb"
                ],
                "scope": "fidelity-3b",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [
              {
                "note": "private copyrighted source, kept local; used for Fidelity EXCERPT",
                "ref": "okeson-2020-excerpts: 11 founder-selected pages (pp. 325,327,329,330,331,332,396,397,398,399,400)"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "Re-verified share-42 structure; prose changed only in u47 (maxillary rationale per Okeson p.399) and u63 (eliminate); sha 59074fd739db"
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
                "reason": "LiteCast branch inactive: sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast branch inactive: sharehub",
                "status": "skipped"
              },
              {
                "evidence": [
                  "pillar occlusion / tmd-orofacial-pain unchanged"
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "dc-related-section capsules unchanged"
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "sharehub/index.html <li> unchanged"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Dates 2026-10-26; title/caption surfaces unchanged"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Template share-41 sha a865d04b\u2026 unchanged"
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
                "reason": "NoteCast only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "episode/NoteCast pair only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Promptologist only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Glossary candidates still at cap -> 0 added"
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
                  "Inline anchors unchanged (\u0627\u0633\u067e\u0644\u06cc\u0646\u062a, CR)"
                ],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631 5/5 unchanged (episode-86/144/145)"
                ],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Receipt C.4.10.1:drive-rename-move (completed) unchanged: drive_id 1N7v7QVCdWHCJVdIHtpxjyArw2Bkgn63s in Occlusion"
                ],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Catalog P2947 re-validated (JSON valid, template key set, total_papers 2262)"
                ],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Refs list Conti PCR -> doi.org/10.1590/S1678-77572005000400006 unchanged"
                ],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "faq-corpus share-42: 6 authored flashcards; none rests on u47/u63"
                ],
                "id": "C.4.11",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "FAQ 9 binary standalone; none rests on u47/u63; 4.12-\u0628 evaluated at 5.6"
                ],
                "id": "C.4.12",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "started"
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
          "note": "private copyrighted source, kept local; used for Fidelity EXCERPT",
          "ref": "okeson-2020-excerpts: 11 founder-selected pages (pp. 325,327,329,330,331,332,396,397,398,399,400)"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": []
    },
    "external_actions": [
      {
        "evidence": [
          "drive:1N7v7QVCdWHCJVdIHtpxjyArw2Bkgn63s renamed to real title (Partial time use of anterior repositioning splints in the management of TMJ pain and dysfunction: a one-year controlled study.pdf), moved root -> Occlusion (1pcawf1jOJ14ZyVobSzJkbigBJbeT08U3); same file, 59873 bytes = attached PDF"
        ],
        "id": "C.4.10.1:drive-rename-move",
        "status": "completed",
        "target": "drive:1N7v7QVCdWHCJVdIHtpxjyArw2Bkgn63s"
      }
    ],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Complete reads: CLAUDE.md, global/README + dentcast_global_rules --read pages 1-3, agent-parity.md, workflows/README.md, modules/01, modules/02, publish-checkpoints.md, publish-handoff-tool.md"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text present (user message) + paper files attached (Conti 2005 full-text PDF, Okeson 2020 textbook excerpts PDF) + PubMed link 3199322 -> normal publish plus step 4.10"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain read: 579 entries; sharehub latest share-41 (/sharehub/share-41.html, keys type,id,title,caption,author,source,hashtags,keywords,url,pillar); live PILLARS read (occlusion subtopics incl. tmd-orofacial-pain)"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "User message names category: Sharehub -> sharehub (locked)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub ids 1..41 contiguous, no gap -> share-42 auto-stated (HR14)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Full text received in user message (title + body, 7 numbered sections + intro/outcome)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI + readability review: 16 numbered proposals shown; founder approved all (\"\u0647\u0645\u0647 \u0627\u0639\u0645\u0627\u0644 \u0628\u0634\u0647\"); text of record = original + 16 edits (scratch sha 8c10736d)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Media: sharehub precedent uses inline webp figures (share-40). Founder supplied Okeson Fig 15.28/15.29; decision: publish with reference, crop better source from PDF if available, webp. No audio/video for sharehub."
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Paper attached: Conti 2005 full-text PDF (DOI 10.1590/S1678-77572005000400006); founder placed PDF in Drive and asked rename+move+catalog -> step 4.10 ACTIVE. Okeson textbook excerpts are reference input for Fidelity only."
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Basket 2 RESEARCH: Okeson 2020 textbook (NOT_APPRAISABLE book, Fidelity on 11 founder-selected pages), Conti 2005 FULL_TEXT, Okeson 1988 (PMID 3199322, DOI 10.1016/0022-3913(88)90224-7) ABSTRACT_ONLY via PubMed"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ordinary post, not Challenge: body is an article, not a question; founder explicitly requested DES/Fidelity runs, which a Challenge never has"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse drafted per sharehub convention (title as link text, no spoiler): \u06a9\u0644\u06cc\u06a9 \u0641\u06a9 \u0648 \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u0631\u06cc\u067e\u0648\u0632\u06cc\u0634\u0646 \u0642\u062f\u0627\u0645\u06cc\u061b \u0627\u0632 \u062a\u0634\u062e\u06cc\u0635 \u062a\u0627 \u067e\u0627\u06cc\u0627\u0646 \u062f\u0631\u0645\u0627\u0646 -> /sharehub/share-42.html"
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
        "reason": "LiteCast branch inactive: locked category sharehub",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: sharehub",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: sharehub",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: sharehub",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: sharehub",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template sharehub/share-41.html sha256 a865d04b7dbd16d1321e09d976afd4d6ac13b1e760dc0ac006ab7cc57f6f9997"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Re-verified share-42 structure; prose changes vs delivered: u47 founder original restored, u89 founder text; sha d842271aef54"
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
        "reason": "LiteCast branch inactive: sharehub",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: sharehub",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar occlusion / tmd-orofacial-pain unchanged"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section capsules unchanged"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/index.html <li> unchanged"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Dates 2026-10-26; title/caption surfaces unchanged"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Template share-41 sha a865d04b\u2026 unchanged"
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
        "reason": "NoteCast only; category sharehub",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "episode/NoteCast pair only; category sharehub",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist only; category sharehub",
        "status": "skipped"
      },
      {
        "evidence": [
          "Glossary candidates still at cap -> 0 added"
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
          "Inline anchors unchanged (\u0627\u0633\u067e\u0644\u06cc\u0646\u062a, CR)"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631 5/5 unchanged"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/hashtag-batches/A104-share-42.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast_cabinet_full_catalog.json",
      "plus/des-scores.json",
      "plus/faq-corpus.json",
      "sharehub/en/share-42.html",
      "sharehub/index.html",
      "sharehub/share-42.html",
      "sharehub/share42-fig1.webp",
      "sharehub/share42-fig2.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: sharehub/share-42.html"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
