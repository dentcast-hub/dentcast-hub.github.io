# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-120"
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
    "category": "clinical",
    "content_id": "insight/insight-120",
    "context": {
      "approvals": [
        {
          "decision": "founder approved all three pathway exam questions as drafted (\u00ab\u0647\u0645\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb)",
          "evidence": [
            "chat reply \u00ab\u0647\u0645\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb to the three-question M2 message"
          ],
          "scope": "exam-questions (M2)",
          "status": "confirmed"
        },
        {
          "decision": "\u062c\u062f\u0627 \u0634\u062f\u0646 \u0644\u0645\u06cc\u0646\u06cc\u062a \u062f\u0646\u062f\u0627\u0646 \u0644\u062a\u0631\u0627\u0644\u061b \u0622\u06cc\u0627 \u0628\u0631\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647 \u0628\u0627\u06cc\u062f \u0646\u06af\u0631\u0627\u0646 \u0628\u0648\u062f\u061f",
          "evidence": [
            "founder's request, first line \u2014 copied codepoint for codepoint (Hard Rule 16)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0644\u0645\u06cc\u0646\u06cc\u062a \u062c\u062f\u0627\u200c\u0634\u062f\u0647\u0654 \u062f\u0646\u062f\u0627\u0646 \u0644\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627 (#12) \u0628\u0627 \u0633\u0637\u062d \u062a\u0631\u0627\u0634\u200c\u062e\u0648\u0631\u062f\u0647\u0654 \u0628\u06cc\u200c\u067e\u0648\u0634\u0634: \u0645\u0646\u0628\u0639 \u062d\u0633\u0627\u0633\u06cc\u062a \u062e\u0641\u06cc\u0641 \u0628\u06cc\u0645\u0627\u0631 \u0648 \u062f\u0644\u06cc\u0644 \u0628\u0627\u0632\u06af\u0631\u062f\u0627\u0646\u062f\u0646 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u067e\u06cc\u0634 \u0627\u0632 \u0647\u0631 \u062a\u0635\u0645\u06cc\u0645 \u0627\u0646\u062f\u0648.",
          "evidence": [
            "agent proposal under standing acceptance (Hard Rule 14); built in C.2 from the page's own examination sentence"
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
          "kind": "pathway_placement",
          "note": "both flagged STRONG by pathway_place.py against the frozen core; ASK candidates not placed: fixed-pros, biomimetic, post-and-core, treatment-planning, implant-prosthetic",
          "pathways": [
            "esthetic (after insight/insight-92)",
            "ceramics (after insight/insight-107)"
          ]
        },
        {
          "bundle": "bundle-laminate",
          "kind": "bundle_gate",
          "note": "insight/ is never a bundle type (module 10, gate 1)",
          "verdict": "\u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1)"
        },
        {
          "evidence": [
            "insight/insight-120.html body opens with the founder's own first paragraph; no agent lead was added"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder's text, paragraph 1 (recorded at B.3): \u00ab\u0628\u06cc\u0645\u0627\u0631 \u0628\u0627 \u0633\u0627\u0628\u0642\u0647 \u062f\u0631\u0645\u0627\u0646 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc \u062f\u0631 \u0645\u0631\u06a9\u0632 \u062f\u06cc\u06af\u0631\u06cc \u0645\u0631\u0627\u062c\u0639\u0647 \u06a9\u0631\u062f. \u2026\u00bb"
        },
        {
          "english": {
            "evidence": [
              "authored from the locked text; en-version structure, chrome from metanotes/en/meta-1.html; toggle both sides"
            ],
            "path": "insight/en/insight-120.html",
            "status": "ready"
          },
          "evidence": [
            "all ten scopes closed before Push 2"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13 DES record insight/insight-120: COMMENTARY 15/E, Part 3 checks pass; no Fidelity owed"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.14 skipped \u2014 ordinary post, no data-dc-challenge-question markup"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "C.2.4 esthetic/veneers-laminates; C.2.5 /pillar/esthetic/ capsule; C.5.5 verified"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 glossary/esthetic-resin-cements back-link; C.4.8 one inline link; C.4.9 three capsules, section at 5/5"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 five canonical tags, no mint; hashtag_ref --check and cabinet --check pass"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5 brain entry clinical-120 appended at the array tail, key parity verified"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6 esthetic + ceramics; C.5.6-b bundle rejected by gate 1; 4.12-\u0628 three questions approved in M2"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.6 index.html pulse line inserted at top, oldest line removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "Phase D mirror insight/en/insight-120.html + inverse toggles; noindex, zero hreflang"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title from the founder; caption under standing acceptance; M2 \u00ab\u0647\u0645\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            }
          ]
        }
      ],
      "delivery": [],
      "inputs": [],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": []
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read: global/README+3 pages, agent-parity, publish-checkpoints, modules/01, modules/02"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "routing: text=yes, attached paper file=no (only a JPG clinical photo) -> normal publish, no C.4.10 branch; category clinical (insight)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 638 entries, 14 types; clinical=119 entries, latest clinical-119 (insight-119.html) defines schema/keys; next number 120; closed dentai/photocast excluded; live PILLARS read from tools/build_pillar.py"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type=clinical (founder: \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u0627\u0644 \u0627\u06cc\u0646\u0633\u0627\u06cc\u062a; insight/ folder, brain type clinical) \u2014 offered set from brain"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number: max clinical id 119 + 1 = 120 -> clinical-120, /insight/insight-120.html"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "full \u0645\u062a\u0646 received from founder in the request (11 paragraphs + 3 headings + title)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: one rewrite \u2014 \u00ab\u062f\u0631 \u0627\u0635\u0644\u060c \u062f\u063a\u062f\u063a\u0647 \u0627\u0635\u0644\u06cc \u0627\u0648 \u0628\u06cc\u200c\u0627\u0637\u0645\u06cc\u0646\u0627\u0646\u06cc \u0627\u0632 \u067e\u0627\u06cc\u062f\u0627\u0631\u06cc \u0648 \u062a\u062f\u0627\u0648\u0645 \u062f\u0631\u0645\u0627\u0646 \u0644\u0645\u06cc\u0646\u06cc\u062a \u062f\u0631 \u0628\u0644\u0646\u062f\u0645\u062f\u062a \u062f\u0631 \u0635\u0648\u0631\u062a \u062a\u063a\u06cc\u06cc\u0631 \u0648\u0636\u0639\u06cc\u062a \u067e\u0627\u0644\u067e \u06cc\u0627 \u0634\u0631\u0627\u06cc\u0637 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u062f\u0646\u062f\u0627\u0646 \u0628\u0648\u062f.\u00bb -> \u00ab\u062f\u063a\u062f\u063a\u0647\u0654 \u0627\u0635\u0644\u06cc \u0627\u0648 \u0628\u06cc\u200c\u0627\u0637\u0645\u06cc\u0646\u0627\u0646\u06cc \u0627\u0632 \u067e\u0627\u06cc\u062f\u0627\u0631\u06cc \u0644\u0645\u06cc\u0646\u06cc\u062a \u062f\u0631 \u0628\u0644\u0646\u062f\u0645\u062f\u062a \u0628\u0648\u062f\u060c \u0627\u06af\u0631 \u0648\u0636\u0639\u06cc\u062a \u067e\u0627\u0644\u067e \u06cc\u0627 \u0634\u0631\u0627\u06cc\u0637 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u062f\u0646\u062f\u0627\u0646 \u062a\u063a\u06cc\u06cc\u0631 \u06a9\u0646\u062f.\u00bb (filler \u00ab\u062f\u0631 \u0627\u0635\u0644\u00bb + restatement removed; meaning unchanged). Other sentences judged natural, unchanged."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "image: founder JPG 1568x946 converted to WebP /insight/insight120-1.webp (51KB, long edge 1568<=1600); agent caption <=200 chars; posed clinical photo of #12 area"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": "no paper file attached (only a clinical JPG, not a research paper) -> paper branch inactive, documented skip",
        "status": "skipped"
      },
      {
        "evidence": [
          "DES basket 1 COMMENTARY: founder own clinical reasoning/case narration, no retrievable identifier (no DOI/PubMed/references block) in the text -> source_text is the page text, COMMENTARY track at C.4.13"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary post, not a challenge (no question/answer post requested) -> C.4.14 skipped"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse line (agent, no-spoiler, type precedent): \u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab\u062c\u062f\u0627 \u0634\u062f\u0646 \u0644\u0645\u06cc\u0646\u06cc\u062a \u062f\u0646\u062f\u0627\u0646 \u0644\u062a\u0631\u0627\u0644\u061b \u0622\u06cc\u0627 \u0628\u0631\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647 \u0628\u0627\u06cc\u062f \u0646\u06af\u0631\u0627\u0646 \u0628\u0648\u062f\u061f\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f"
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
        "reason": "LiteCast branch inactive \u2014 category is clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast source of truth not used",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast isolation not applicable",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast internal structure not applicable",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast keyed steps not applicable",
        "status": "skipped"
      },
      {
        "evidence": [
          "template lock: insight/insight-119.html is the previous same-category page and the structural template; unchanged (git diff --quiet -- insight/insight-119.html passes)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "page insight/insight-120.html built by structural clone of insight-119.html (same HTML tree/classes/components); domain dentcast.org kept; hreflang fa-IR->dentcast.ir; GA4 deferred once; 2 preconnects with crossorigin; no enamad seal; JSON-LD valid (3 blocks); lead = founder own first paragraph (author_original); presentation layer: 3 numbered h3, 1 callout box under \u00ab\u0646\u06a9\u062a\u0647 \u0628\u0627\u0644\u06cc\u0646\u06cc\u00bb, 1 dc-key frame; presentation_lint clean; image /insight/insight120-1.webp 1568x946 figure+figcaption"
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
        "reason": "LiteCast in-body linking not applicable",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast related links not applicable",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar.primary=esthetic (closest semantic fit: a ceramic laminate veneer on a lateral incisor and its long-term survival; precedent clinical-37 same topic), subtopic=veneers-laminates; competing candidate fixed-pros/failures (debonding as a failure mode) rejected because the page is about the veneer treatment decision and its restoration, not the fixed-pros failure taxonomy"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "two nav capsules placed first: /glossary/ \u00ab\u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647\u00bb + /pillar/esthetic/ \u00ab\u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc\u00bb (budget 5, 2 used, 3 remain for 4.9)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "hand-maintained landing insight/index.html: new <li><a href=\"insight-120.html\"> at top of the existing list, sibling markup exact (file is hand-maintained static HTML; queue_apply.py also edits it, no builder)"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "date audit: visible trustline publish+review, BlogPosting datePublished/dateModified, MedicalWebPage datePublished/dateModified/lastReviewed all 2026-11-24; no stale 2026-11-23 left (7 occurrences of the new date, 0 old)"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- insight/insight-119.html passes: template byte-unchanged"
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
        "reason": "NoteCast only \u2014 category is clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "episode/NoteCast shared source only \u2014 category is clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "insight is not a numbered series with an ep-nav bar",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached \u2014 paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached \u2014 paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached \u2014 paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [
          "DES COMMENTARY: source_text = page text of record via presentation_diff --text-of-record (FULL_TEXT, no DOI); SOURCE call in a separate subagent context (spec .dentcast/des-v3.7-knowledge.md read whole as its instruction, no external fetch); record stored at plus/des-scores.json insight/insight-120: des_score 15 band E, checklist 4+0+3+3, arithmetic and schema verified, all quotes verbatim (item 4 = insight/index.html declaration with the mandatory note naming that file); Fidelity not owed (basket-1 self-record) -> fidelity [null]; no ALTERED/REVERSED unit and no doubtful unit -> no M3b"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "fresh glossary review over all 110 terms: one strong back-link applied \u2014 glossary/esthetic-resin-cements.html (free 3/5) \u00ab\u062c\u062f\u0627 \u0634\u062f\u0646 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0644\u062a\u0631\u0627\u0644 \u0648 \u062a\u0635\u0645\u06cc\u0645 \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647\u00bb; skipped: resin-cements, bonding-protocol, treatment-plan, post-and-core, ferrule-effect (at/over cap 5), all other terms judged unrelated or borderline"
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
        "reason": "not a glossary publish",
        "status": "skipped"
      },
      {
        "evidence": [
          "in-body semantic analysis over glossary terms + every brain entry with a page: one strong inline link applied on first occurrence \u00ab\u0644\u0645\u06cc\u0646\u06cc\u062a \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc\u00bb -> /insight/insight-37.html (same restoration, same lateral-incisor failure theme); borderline skipped and recorded: insight-76 (post after endo, different tooth/restoration), sharehub/share-22 (laminate cementation, not re-bonding), dentai-30 (veneer bonding substrate, discussed only as a condition), insight-20 (endo certainty), glossary/bonding-protocol (generic protocol)"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "related section: budget 5, 2 nav capsules placed, 3 free slots filled strongest-first: episode-122-3 \u00ab\u0648\u0646\u06cc\u0631 \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc \u0631\u0648\u06cc \u062f\u0646\u062f\u0627\u0646 \u0627\u0646\u062f\u0648\u200c\u0634\u062f\u0647\u00bb, insight-76 \u00ab\u0631\u0648\u06a9\u0634 \u062f\u0646\u062f\u0627\u0646 \u0639\u0635\u0628\u200c\u06a9\u0634\u06cc\u200c\u0634\u062f\u0647 \u0628\u062f\u0648\u0646 \u067e\u0633\u062a\u00bb, dentai-30 \u00ab\u0628\u0627\u0646\u062f \u0648\u0646\u06cc\u0631 \u0631\u0648\u06cc \u0627\u0646\u0627\u0645\u0644\u060c \u062f\u0646\u062a\u06cc\u0646 \u06cc\u0627 \u06a9\u0627\u0645\u067e\u0648\u0632\u06cc\u062a \u0642\u062f\u06cc\u0645\u06cc\u00bb; section now 5/5 at cap; borderline (chairside-49 vital tooth with old crown, share-22) skipped"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4 authored DefinedTerms c1-c4 under insight/insight-120 in plus/faq-corpus.json (never in page JSON-LD): prophylactic endo in a laminated tooth, condition for keeping the laminate if endo is needed later, mild sensitivity after debonding, effect of endo on the restoration; no FAQ pair was comparison-shaped here"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage with 4 standalone binary questions (no deixis), each answer opening with \u0628\u0644\u0647/\u062e\u06cc\u0631; question 4 reworded in place to open with \u00ab\u0622\u06cc\u0627\u00bb so build_quiz_index keeps it; no card description duplicates an FAQ answer"
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
        "reason": "ordinary post, not a challenge (no data-dc-challenge-question markup)",
        "status": "skipped"
      },
      {
        "evidence": [
          "tags settled, all reused canonical (no mint): #\u0646\u06a9\u062a\u0647_\u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc (series), #\u0644\u0645\u06cc\u0646\u06cc\u062a_\u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc (35, umbrella in addition), #\u062f\u0631\u0645\u0627\u0646_\u0631\u06cc\u0634\u0647 (9), #\u0633\u0645\u0627\u0646_\u0645\u062c\u062f\u062f (5), #\u067e\u06cc\u0634_\u0622\u06af\u0647\u06cc (4) \u2014 decision tag + specific <=10 satisfied; dropped #debonding (concept = intentionally separating a bonded restoration; this page manages a spontaneous separation) and #\u062d\u0641\u0638_\u062f\u0646\u062f\u0627\u0646 (keep-vs-extract, not this decision). Resolving sentences: \u0644\u0645\u06cc\u0646\u06cc\u062a \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc/\u0633\u0645\u0627\u0646 \u0645\u062c\u062f\u062f -> \u00ab\u0627\u0648\u0644\u0648\u06cc\u062a \u062f\u0631 \u0627\u06cc\u0646 \u0645\u0631\u062d\u0644\u0647\u060c \u067e\u0648\u0634\u0627\u0646\u062f\u0646 \u0645\u062c\u062f\u062f \u0633\u0637\u062d \u062a\u0631\u0627\u0634\u200c\u062e\u0648\u0631\u062f\u0647 \u062f\u0646\u062f\u0627\u0646 \u0648 \u06a9\u0627\u0647\u0634 \u062d\u0633\u0627\u0633\u06cc\u062a \u0627\u0633\u062a\u061b \u0686\u0647 \u0628\u0627 \u0633\u0645\u0627\u0646 \u0645\u062c\u062f\u062f \u0644\u0645\u06cc\u0646\u06cc\u062a \u0642\u0628\u0644\u06cc \u2026\u00bb; \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647 -> \u00ab\u0635\u0631\u0641 \u0627\u062d\u062a\u0645\u0627\u0644 \u0646\u06a9\u0631\u0648\u0632 \u062f\u0631 \u0622\u06cc\u0646\u062f\u0647\u060c \u062f\u0644\u06cc\u0644 \u06a9\u0627\u0641\u06cc \u0628\u0631\u0627\u06cc \u0627\u0646\u062c\u0627\u0645 \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647 \u067e\u06cc\u0634\u06af\u06cc\u0631\u0627\u0646\u0647 \u067e\u06cc\u0634 \u0627\u0632 \u0628\u0627\u0632\u06af\u0631\u062f\u0627\u0646\u062f\u0646 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0646\u06cc\u0633\u062a.\u00bb; \u067e\u06cc\u0634 \u0622\u06af\u0647\u06cc -> \u00ab\u062c\u062f\u0627 \u0634\u062f\u0646 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0628\u0647\u200c\u062a\u0646\u0647\u0627\u06cc\u06cc \u0646\u0634\u0627\u0646\u0647 \u067e\u06cc\u0634\u200c\u0622\u06af\u0647\u06cc \u0646\u0627\u0645\u0637\u0644\u0648\u0628 \u062f\u0646\u062f\u0627\u0646 \u2026 \u0646\u06cc\u0633\u062a\u00bb. Step 6 after the C.5 write: hashtag_ref --sync (5 updated), build_plus_index (outputs reverted), --check OK, build_cabinet_papers --check OK. Reachability questions: 1) \u00ab\u0644\u0645\u06cc\u0646\u06cc\u062a \u0644\u062a\u0631\u0627\u0644 \u0627\u0641\u062a\u0627\u062f\u0647\u060c \u0628\u0627\u06cc\u062f \u0639\u0635\u0628\u200c\u06a9\u0634\u06cc \u06a9\u0646\u0645\u061f\u00bb chips \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647/\u0644\u0645\u06cc\u0646\u06cc\u062a \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc/\u0633\u0645\u0627\u0646 \u0645\u062c\u062f\u062f -> page ranks 9/33/5, not in first 4; 2) \u00ab\u0628\u0631\u0627\u06cc \u067e\u0631\u0648\u06af\u0646\u0648\u0632 \u062f\u0646\u062f\u0627\u0646 \u0644\u0645\u06cc\u0646\u06cc\u062a\u200c\u0634\u062f\u0647 \u0628\u0627\u06cc\u062f \u0646\u06af\u0631\u0627\u0646 \u0628\u0627\u0634\u0645\u061f\u00bb chip \u067e\u06cc\u0634 \u0622\u06af\u0647\u06cc -> page 4th of 4 \u2192 SURFACES (gate passes); 3) \u00ab\u0644\u0645\u06cc\u0646\u06cc\u062a \u0627\u0641\u062a\u0627\u062f\u0647 \u0631\u0627 \u062f\u0648\u0628\u0627\u0631\u0647 \u0628\u0686\u0633\u0628\u0627\u0646\u0645 \u06cc\u0627 \u062c\u062f\u06cc\u062f \u0628\u0633\u0627\u0632\u0645\u061f\u00bb -> \u0633\u0645\u0627\u0646 \u0645\u062c\u062f\u062f rank 5; 4) \u00ab\u062d\u0633\u0627\u0633\u06cc\u062a \u0628\u0639\u062f \u0627\u0632 \u0627\u0641\u062a\u0627\u062f\u0646 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0637\u0628\u06cc\u0639\u06cc\u0647\u061f\u00bb -> no chip carries a specific enough label. Page carries no hashtag chip row (insight pages carry none)."
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry appended at the absolute end (index 638): clinical-120, keys exactly the clinical-119 set/order (type,id,title,caption,hashtags,keywords,page_url,pillar), hashtags = the C.5.0 canonical list, 8 keywords taken from the article text, pillar esthetic/veneers-laminates"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar recorded = C.2.4 decision (esthetic/veneers-laminates) and matches the /pillar/esthetic/ capsule; no new subtopic added to PILLARS"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways: insight/insight-120 placed in esthetic after insight/insight-92 and ceramics after insight/insight-107 (both STRONG against the frozen core); ASK candidates not placed (fixed-pros, biomimetic, post-and-core, treatment-planning, implant-prosthetic); coverage 1.52 per item (baseline 1.38). 4.12-\u0628: three MCQ written to plus/exam-questions.json under the page id (r-d78e2c4e, r-7fc8b678, r-afe61185), each approved by the founder in M2 (\u00ab\u0647\u0645\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb), validate_exam_questions.py reports 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle gate: candidate bundle-laminate (continues the esthetic pathway joined in 5.6) \u2192 \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1): insight/ is never a bundle type; no insertion, no home-bundles.js change"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: new no-spoiler line with the title as link text inserted first, oldest removed, 7 lines. Phase D: English mirror insight/en/insight-120.html authored from the locked text (chrome from metanotes/en/meta-1.html, insight body classes, LTR), noindex+follw? see lock, zero hreflang, inverse toggles; metanotes/en/meta-1.html byte-unchanged. Ten-scope editorial lock recorded. Push 2 next."
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "glossary/esthetic-resin-cements.html",
      "index.html",
      "insight/en/insight-120.html",
      "insight/index.html",
      "insight/insight-120.html",
      "insight/insight120-1.webp",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: insight/insight-120.html, insight/insight120-1.webp, insight/en/insight-120.html, insight/index.html, index.html, dentcast-brain.json, dentcast-hashtag-reference.json, glossary/esthetic-resin-cements.html, plus/faq-corpus.json, plus/des-scores.json, plus/pathways.json, plus/exam-questions.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
