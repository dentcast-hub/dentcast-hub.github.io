# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-51"
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
    "content_id": "sharehub/share-51",
    "context": {
      "approvals": [
        {
          "decision": "\u0648\u0642\u062a\u06cc \u0632\u06cc\u0631 \u067e\u0648\u0633\u06cc\u062f\u06af\u06cc \u06cc\u0627 \u062a\u0631\u0645\u06cc\u0645 \u0642\u062f\u06cc\u0645\u06cc \u062a\u0631\u06a9 \u0645\u06cc\u200c\u0628\u06cc\u0646\u06cc\u0645\u060c \u062a\u0627 \u06a9\u062c\u0627 \u0628\u0627\u06cc\u062f \u067e\u06cc\u0634 \u0628\u0631\u0648\u06cc\u0645\u061f",
          "evidence": [
            "founder data: H1 of the founder's artifact document, copied verbatim (Hard Rule 16)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u062e\u0637 \u062a\u0631\u06a9\u06cc \u06a9\u0647 \u0632\u06cc\u0631 \u067e\u0648\u0633\u06cc\u062f\u06af\u06cc \u06cc\u0627 \u062a\u0631\u0645\u06cc\u0645 \u0642\u062f\u06cc\u0645\u06cc \u062f\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f \u0631\u0627 \u062a\u0627 \u06a9\u062c\u0627 \u0628\u0627\u06cc\u062f \u062a\u0631\u0627\u0634\u06cc\u062f\u060c \u0648 \u0628\u0639\u062f \u0627\u0632 \u0622\u0646 \u0648\u0636\u0639\u06cc\u062a \u067e\u0627\u0644\u067e \u0648 \u067e\u0648\u0634\u0634 \u06a9\u0627\u0633\u067e\u200c\u0647\u0627 \u0686\u0647 \u0646\u0642\u0634\u06cc \u062f\u0631 \u062a\u0635\u0645\u06cc\u0645 \u062f\u0631\u0645\u0627\u0646 \u062f\u0627\u0631\u0646\u062f\u061f",
          "evidence": [
            "agent-composed caption under standing acceptance (Hard Rule 14; publish-checkpoints \u00abStanding acceptance\u00bb), listed in the Push-2 report"
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
          "kind": "source_resolution",
          "note": "Part 1 ladder: cabinet hit S11 (Ferracane); PubMed MCP abstracts S1,S3,S5,S6,S7,S8,S10; PMC full text S2 (Kim 2016, Q&A piece, PubMed has no abstract) -> FULL_TEXT; S4 Shrestha and S9 Inside Dentistry unreachable (hosts blocked) -> M1. Ref 7 first author per PubMed = Abulhamael AM (founder list: Tandon R, second author). SOURCE system prompt .dentcast/des-v3.7-knowledge.md sha256 709be964\u2026; claude -p --tools \"\" --model opus, empty dir, one block per source."
        },
        {
          "kind": "m1_answers",
          "note": "M1 answered by founder: S4 Shrestha 2024 \u2014 founder attached the full-text PDF (founder's own copy; converted with tools/pdf_source_text.py, FULL_TEXT, conclusion pinned to section V sentence); not treated as a step-4.10 attached paper (supplied as source text for an existing reference). S9 Inside Dentistry 2017 \u2014 founder sent a paraphrase (not verbatim, unusable as source_text) and a new link https://ohi-s.com/articles-videos/the-protocols-of-biomimetic-restorative-dentistry-2002-to-2017/ to use as the reference; host unreachable from this session (network change proposal declined) -> S9 INSUFFICIENT_TEXT; reference link switched to the founder's URL."
        },
        {
          "kind": "part3b_round1",
          "note": "Founder answered M3b round 1: \u00ab\u0647\u0645\u0647 \u0627\u0635\u0644\u0627\u062d \u0628\u0634\u0646\u00bb -> all 7 proposals applied verbatim to the body (u8,u10,u16,u40,u44,u48,u54). Founder also: reference 9 replaced by DentCast's own biomimetic lesson /dentai/dentai-15.html (\u00ab\u062a\u0634\u0631\u06cc\u062d \u062a\u0631\u06a9 \u062f\u0646\u062f\u0627\u0646 \u0648 \u0646\u0642\u0627\u0637 \u067e\u0627\u06cc\u0627\u0646\u06cc \u062d\u0630\u0641 \u062a\u0631\u06a9 (CrRE)\u00bb), \u00abDES \u0647\u0645 \u0646\u0645\u06cc\u062e\u0648\u0627\u062f\u00bb -> S9 slot stays INSUFFICIENT_TEXT/null, no scoring."
        },
        {
          "kind": "part3b_round2",
          "note": "Founder: \u00ab\u0647\u0645\u0647 \u0627\u0635\u0644\u0627\u062d \u0628\u0634\u0646\u00bb -> u48 \u00ab\u2026\u0628\u0627\u06cc\u062f \u0631\u0648\u06a9\u0634 \u06a9\u0627\u0645\u0644 \u0628\u0627\u0634\u062f.\u00bb and u54 \u00ab\u2026\u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627\u06cc \u062a\u0631\u06a9\u200c\u062f\u0627\u0631\u0650 \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647\u200c\u0634\u062f\u0647\u200c\u0627\u06cc\u2026\u00bb applied verbatim. The 5mm/3mm wording question had no concrete proposal; sentence kept (matches the Alleman 2017 protocol wording)."
        },
        {
          "evidence": [
            "sharehub/share-51.html first <p> in .sh-dialogue = founder paragraph 1 (text of record)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder artifact text, first paragraph \u00ab\u0641\u0631\u0636 \u06a9\u0646\u06cc\u062f \u062f\u0631 \u062d\u0627\u0644 \u0628\u0631\u062f\u0627\u0634\u062a\u0646 \u06cc\u06a9 \u062a\u0631\u0645\u06cc\u0645 \u0642\u062f\u06cc\u0645\u06cc\u2026\u00bb opens the body"
        },
        {
          "kind": "pathways",
          "note": "pathway_place: STRONG biomimetic(205), fixed-pros(134), operative-cariology(95); placed biomimetic --after dentai/dentai-15 and operative-cariology --after dentai/dentai-11 (tool anchor); fixed-pros NOT placed (third full pathway is never the agent's; reported). ASK: ceramics, treatment-planning, esthetic, post-and-core, bundle-biomimetic \u2014 not placed. Coverage 1.52 per item (baseline 1.38). 5.6-b: bundle-biomimetic, bundle-bonding -> \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2: \u0639\u0646\u0648\u0627\u0646 \u06cc\u06a9 \u0645\u0648\u0642\u0639\u06cc\u062a \u00ab\u0648\u0642\u062a\u06cc\u2026\u00bb \u0627\u0633\u062a\u060c \u0646\u0647 \u06cc\u06a9 \u0645\u0641\u0647\u0648\u0645 \u06a9\u0627\u0645\u0644)."
        },
        {
          "kind": "founder_m2_and_third_pathway",
          "note": "Founder: \u00ab\u0645\u0633\u06cc\u0631 \u0633\u0648\u0645 \u062a\u0627\u06cc\u06cc\u062f \u0633\u0648\u0627\u0644 \u0647\u0627 \u0647\u0645 \u062a\u0627\u06cc\u06cc\u062f\u00bb -> fixed-pros placed --after chairside/chairside-49 --confirmed (founder yes for that placement); 3 exam MCQs approved as shown (r-3d1ae453, r-d59b18da, r-7e968da9) written to plus/exam-questions.json; validate_exam_questions: 0 errors (12 pre-existing warnings, none on this page). 5.6-b: bundle-crown-prep -> \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2)."
        },
        {
          "english": {
            "evidence": [
              "file on disk; structure parity p28/h2 10/tr7/li11/figure1"
            ],
            "path": "sharehub/en/share-51.html",
            "status": "ready"
          },
          "evidence": [
            "local verify_publish: 310 passed; 9 FAIL all runner-owned (C.8 builders, C.7 stamp)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13: DES 11 sources + Fidelity all 100 HIGH, --accept ACCEPTED; Part 3b two rounds answered \u00ab\u0647\u0645\u0647 \u0627\u0635\u0644\u0627\u062d \u0628\u0634\u0646\u00bb"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "B.4.9 ordinary article; C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "C.2.4/C.5.5 operative/cracked-tooth"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 0 (cap), C.4.8 5 inline, C.4.9 3 capsules (5/5)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 7 canonical tags, no mint, --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5 brain entry sharehub 51 at array end; faq-corpus FAQPage 10 + DefinedTermSet 8"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6 biomimetic, operative-cariology, fixed-pros (founder-confirmed); 3 exam MCQs approved M2; bundles \u0631\u062f \u0634\u062f"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html pulse top line = title link /sharehub/share-51.html; share-48 line removed; 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "sharehub/en/share-51.html authored from locked text; toggles inverse; noindex, follow; meta-1 untouched"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title confirmed (founder data), caption confirmed (standing acceptance); pending_questions empty"
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
          "note": "founder text (Claude Docs artifact), transcribed verbatim",
          "ref": "artifact:founder-doc/cracks-under-caries",
          "sha256": "ef87d38880311eb5f18e9d46fd213422411ec5b0375b34cd8921f4df7201d100"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "kind": "des_source_runs",
          "note": "SOURCE calls: claude -p --tools '' --model opus (reported claude-opus-5-5), empty dir, system prompt .dentcast/des-v3.7-knowledge.md sha256 709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9. Results: S1 Abbott 17/E THERAPY prov; S2 Kim COMMENTARY 12/E FULL_TEXT; S3 Chen 8/E ETIOLOGY prov; S5 Hovander 36/D MATERIAL prov; S6 Zhang 52/C THERAPY prov; S7 Abulhamael survey -> INSUFFICIENT_TEXT (spec: design matches no anchor row, no routing rule); S8 Alleman&Magne 8/E THERAPY prov; S10 Reis 8/E THERAPY prov; S11 Ferracane 36/D THERAPY prov. Part 3 (quotes/arith/band/schema) + des_record_guard check + verify_publish --des-text: ok for all. Part 3(6): S6 interpretation sentence 3 (\u00ab\u2026\u0627\u0632 \u0645\u0637\u0627\u0644\u0639\u0627\u062a \u063a\u06cc\u0631\u062a\u0635\u0627\u062f\u0641\u06cc \u0628\u0647 \u062f\u0633\u062a \u0622\u0645\u062f\u0647 \u0627\u0633\u062a.\u00bb) deleted (not stated in abstract). Part 2d audit (audit-system.md, opus): S1,S3,S5,S6,S8,S10 agree (exit 0). S11 run1 classification=low vs audit some_concerns (exit 1) -> rerun2 low, audit2 some_concerns -> rerun3 + adjudicating audit (fresh context) both some_concerns; rerun3 36/D stored (audit-apply exit 0); run1/run2 invalid, kept in run report. S4 Shrestha, S9 Inside Dentistry await M1."
        },
        {
          "kind": "des_complete",
          "note": "S4 Shrestha 4/E THERAPY FULL_TEXT (case series 30 x 0.30 = 9 - 5 penalties); S9 INSUFFICIENT_TEXT (empty source_text). Part 2d combined audit over all 8 RESEARCH records (src0,2,3,4,5,7,9,10): audit-apply exit 0. Record written provisionally to plus/des-scores.json (sources only) with dentcast_text_io.json_append for the Fidelity tool."
        },
        {
          "kind": "fidelity_run1",
          "note": "Orphan sweep (opus, fresh ctx; 3rd attempt valid \u2014 1st returned no JSON, 2nd answered 33/56) accepted by --sweep; plan in .dentcast/des-fidelity-plans/sharehub/share-51.json; found nowhere: u2,u3,u4,u5,u6,u12,u17,u19,u23,u24,u25,u26,u30,u31,u39,u41,u42,u45,u57,u58,u59,u60,u65,u66. Sweeper (opus, spec as system prompt) + judge (opus, judge-system.md, separate ctx) per source, --vote: src0 100 HIGH, src1 83 MEDIUM, src2 75 HIGH, src3 83 MEDIUM, src4 100 HIGH, src5 83 MEDIUM, src7/9/10 100 HIGH; S7,S9 null (SOURCE error). Flagged ALTERED: u8,u10,u16,u40,u44,u48,u54; doubtful (judge != sweeper): u8, u54. --accept exit 0 (154 passed). Provisional fidelity stored for the save point."
        },
        {
          "kind": "part3b_recheck1",
          "note": "--build --only u8,u10,u16,u40,u44,u48,u54 -> sweeper (opus) + judge (opus, judge_build from the tool restricted to rechecked sources 1,2,3,5; --judge requires every plan source on an --only dir) -> --vote run2 --base run1: u8,u10,u16,u40 MATCHES; u44 AUTHOR_VIEW; u48 ALTERED (full crown widened to any cusp coverage), u54 ALTERED (cracked condition missing) \u2014 judge agreed on all. Grade before->after: src1 83->100, src2 75->100, src3 83->100, src5 83->83."
        },
        {
          "kind": "fidelity_final",
          "note": "--only u48,u54 sweeper+judge (agree, MATCHES both); --vote run3 --base run2. Final: all 9 judged sources 100 HIGH; S7,S9 null. Grade before->after Part 3b: src1 83->100, src2 75->100, src3 83->100, src5 83->100. --accept on plus/des-scores.json record: ACCEPTED (154 passed, 0 failed). Part 4 stored final fidelity via json_replace_value."
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "rules:read-complete(README,global-core,agent-parity,publish-checkpoints,01,02); capability-preflight: ls-remote ok, push to ccr branch, GitHub MCP for Actions/PR/merge"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "phase0: text=yes (founder artifact doc), paper file=no -> normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "phaseA: brain parsed (611 entries); latest sharehub = id 50 (/sharehub/share-50.html), key set type,id,title,caption,author,source,hashtags,keywords,url,pillar; live PILLARS read from tools/build_pillar.py"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "B.1: type=sharehub (literature review \"\u0645\u0631\u0648\u0631 \u0645\u0646\u0627\u0628\u0639\" with 11 cited abstracts; same shape as share-47..50)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "B.2: next number = share-51 (max sharehub id 50 + 1, no gap)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "B.3: text received from founder artifact (bound by digest ef87d388\u2026)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5: no AI-style tells in phrasing; 3 typography-only fixes applied (standing acceptance): \u00ab\u0646\u0642\u0637\u0647 \u060c\u00bb\u2192\u00ab\u0646\u0642\u0637\u0647\u060c\u00bb (stray space before comma); \u00ab\u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646\u0647\u0627\u06cc\u00bb\u2192\u00ab\u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646\u200c\u0647\u0627\u06cc\u00bb and \u00ab\u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646\u0647\u0627\u06cc\u06cc\u00bb\u2192\u00ab\u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646\u200c\u0647\u0627\u06cc\u06cc\u00bb (missing ZWNJ). Text of record sha256 in handoff inputs."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "B.4: one schematic diagram embedded in founder doc (caption \u00ab\u062d\u062f \u0628\u0631\u062f\u0627\u0634\u062a \u062a\u0631\u06a9 \u062f\u0631 \u0631\u0648\u06cc\u06a9\u0631\u062f \u0628\u06cc\u0648\u0645\u06cc\u0645\u062a\u06cc\u06a9 \u00b7 \u0628\u0631\u0634 \u0634\u0645\u0627\u062a\u06cc\u06a9\u060c \u0646\u0647 \u0622\u0646\u0627\u062a\u0648\u0645\u06cc\u06a9\u00bb) -> sharehub/share51-fig1.webp (share48-figN precedent); no audio/video"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "B.4.7: no paper file attached -> step 4.10 branch skipped (documented)"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "B.4.8: basket 2 RESEARCH \u2014 page carries a \u00ab\u0645\u0646\u0627\u0628\u0639\u00bb list of 11 retrievable sources (PubMed links, consensus paper pages resolvable to DOI/PMID). Founder: all sources are abstracts (text_basis ABSTRACT_ONLY); ref 9 is an Inside Dentistry educational article. One DES record per source."
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "B.4.9: ordinary article (not a challenge)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "B.5: Pulse line drafted by agent in sharehub precedent (title alone as link text, index.html share-49/50 lines), no spoiler"
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
        "reason": "not LiteCast (category sharehub): LiteCast branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "C.1: template = sharehub/share-50.html (latest sharehub page); git diff --quiet clean"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.2: sharehub/share-51.html cloned from share-50 (head, GA4 once, two preconnects with crossorigin at top, .org identity, no enamad); body = text of record (sha256 9e4e7113\u2026), h2 sections, table, figure share51-fig1.webp (founder diagram rendered from the doc embed, founder caption verbatim), refs as <ol class=\"sh-refs\"> with display names (founder request: short link text so the page does not break), DOIs resolved via PubMed MCP + web search (ref7 first author per PubMed = Abulhamael AM; founder list said Tandon R); single-paper .author credit block dropped (multi-ref precedent share-46/48); no chip row on sharehub pages; lead = founder own first paragraph; caption agent-composed (standing acceptance)"
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
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "C.2.4: pillar.primary=operative, subtopic=cracked-tooth (live PILLARS; unmistakable single fit: cracked-tooth management) \u2014 standing acceptance"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.2.5: dc-related-section with \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 (/glossary/) + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc (/pillar/operative/), 2/5 of budget"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.2.6: sharehub/index.html hand-maintained; row added newest-first in sibling label style \u00ab<title> (\u0645\u0637\u0644\u0628\u06cc \u0627\u0632 \u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646)\u00bb"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.3: datePublished=dateModified=2026-11-13 (today); no other date surfaces on page; before/after both OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4: git diff --quiet -- sharehub/share-50.html succeeded (template untouched)"
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
        "reason": "not NoteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "not a NoteCast/episode pair",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "sharehub is not a numbered series with ep-nav",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [
          "C.4.13: DES 11 sources in plus/des-scores.json (S1 17/E, S2 COMMENTARY 12/E, S3 8/E, S4 4/E FULL_TEXT, S5 36/D, S6 52/C, S7 INSUFFICIENT_TEXT survey, S8 8/E, S9 INSUFFICIENT_TEXT (founder: no DES, ref -> dentai-15), S10 8/E, S11 36/D after audit adjudication); Fidelity 9 calls via orphan sweep + sweeper/judge, Part 3b 2 rounds (founder: fix all) -> all 100 HIGH; --accept ACCEPTED 154/0; save point pushed 0bc3cab6"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4.7: candidates cuspal-coverage, biomimetic-dentistry (strong) \u2014 both at cap 5/5 (related_cap) -> 0 applied; onlay, dentinal-tubules borderline -> skipped (conservative)"
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
          "C.4.8: 5 inline links on first technical occurrence: \u062a\u0648\u0628\u0648\u0644\u200c\u0647\u0627\u06cc \u0639\u0627\u062c\u06cc->/glossary/dentinal-tubules.html; \u0628\u06cc\u0648\u0645\u06cc\u0645\u062a\u06cc\u06a9->/glossary/biomimetic-dentistry.html; \u067e\u0631\u06cc\u0641\u0631\u0627\u0644 \u0633\u06cc\u0644 \u0632\u0648\u0646->/dentai/dentai-11.html; \u067e\u0648\u0634\u0634 \u06a9\u0627\u0633\u067e\u200c\u0647\u0627->/glossary/cuspal-coverage.html; \u0622\u0646\u0644\u0647->/glossary/onlay.html. Borderline skipped: generic \u00ab\u062a\u0631\u06a9\u00bb->dentai-14, \u0631\u0648\u06a9\u0634 \u0645\u0648\u0642\u062a. Anchors only; Fidelity --accept ACCEPTED after"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4.9: 2 capsules + 3 free -> dentai-14 \u00ab\u0627\u0646\u0648\u0627\u0639 \u062a\u0631\u06a9 \u062f\u0646\u062f\u0627\u0646 \u0648 \u062a\u0634\u062e\u06cc\u0635 \u0622\u0646\u00bb, dentai-15 \u00ab\u0646\u0642\u0627\u0637 \u067e\u0627\u06cc\u0627\u0646\u06cc \u062d\u0630\u0641 \u062a\u0631\u06a9 (CrRE)\u00bb, dentai-25 \u00ab\u0628\u0642\u0627\u06cc \u062a\u0631\u0645\u06cc\u0645\u200c\u0647\u0627\u06cc Partial Coverage\u00bb; 5/5. Borderline skipped: dentai-11 (inline already), episodes 65-67, dentai-13, dentai-1, insight-4"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4.11: 8 authored DefinedTerms #flashcards-c1..c8 in plus/faq-corpus.json byContent[sharehub/share-51] (PSZ, central stop limits, why remove crack, bur cost, RCT determinant, chewing pain, cusp coverage function, poor-prognosis signs); no page JSON-LD; not near-copies of FAQ answers"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4.12: FAQPage 10 binary standalone questions (no deixis), each answer opens \u0628\u0644\u0647/\u062e\u06cc\u0631; a cusp-coverage-without-crown pair was dropped as conflicting with the locked u48 sentence. 4.12-\u0628: evaluated at 5.6"
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
        "reason": "ordinary article, not a \u0686\u0627\u0644\u0634 (Question 4.9)",
        "status": "skipped"
      },
      {
        "evidence": [
          "C.5.0: questions \u2014 \u00ab\u062a\u0631\u06a9 \u0632\u06cc\u0631 \u0622\u0645\u0627\u0644\u06af\u0627\u0645 \u062f\u06cc\u062f\u0645 \u062a\u0627 \u06a9\u062c\u0627 \u0628\u062a\u0631\u0627\u0634\u0645\u061f\u00bb, \u00abcrack \u06a9\u0641 \u062d\u0641\u0631\u0647 \u0631\u0648 \u06a9\u0627\u0645\u0644 \u0628\u0631\u062f\u0627\u0631\u0645 \u06cc\u0627 \u0633\u06cc\u0644 \u06a9\u0646\u0645\u061f\u00bb, \u00ab\u062f\u0646\u062f\u0648\u0646 \u062a\u0631\u06a9\u200c\u062f\u0627\u0631 \u0628\u0627 \u067e\u0627\u0644\u067e\u06cc\u062a \u0628\u0631\u06af\u0634\u062a\u200c\u067e\u0630\u06cc\u0631 \u0631\u0648\u062a \u06a9\u0627\u0646\u0627\u0644 \u0645\u06cc\u200c\u062e\u0648\u0627\u062f\u061f\u00bb, \u00ab\u062f\u0646\u062f\u0648\u0646 \u062a\u0631\u06a9\u200c\u062f\u0627\u0631 \u0631\u0648 \u0631\u0648\u06a9\u0634 \u06a9\u0646\u0645 \u06cc\u0627 \u0622\u0646\u0644\u0647\u061f\u00bb. Reused canonical (no mint): #\u0645\u0631\u0648\u0631_\u0645\u0646\u0627\u0628\u0639 (section tag), #\u062a\u0631\u06a9_\u0639\u0627\u062c\u06cc(3\u21924) \u00ab\u062a\u0631\u06a9 \u0639\u0627\u062c\u06cc \u062f\u0631 \u0646\u0648\u0627\u0631 \u06f2 \u0645\u06cc\u0644\u06cc\u200c\u0645\u062a\u0631\u06cc \u0645\u062c\u0627\u0648\u0631 DEJ\u2026 \u0628\u0647\u200c\u0637\u0648\u0631 \u06a9\u0627\u0645\u0644 \u0628\u0631\u062f\u0627\u0634\u062a\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f\u00bb, #\u067e\u0648\u0634\u0634_\u06a9\u0627\u0633\u067e(3\u21924) \u00ab\u062f\u0631 \u0627\u06cc\u0646 \u0634\u0631\u0627\u06cc\u0637 \u0628\u0627\u06cc\u062f \u0628\u0647 \u0641\u06a9\u0631 \u067e\u0648\u0634\u0634 \u06a9\u0627\u0633\u067e\u200c\u0647\u0627 \u0628\u0627\u0634\u06cc\u0645\u00bb, #\u062d\u0641\u0638_\u067e\u0627\u0644\u067e(2\u21923) \u00ab\u062d\u062f\u0648\u062f \u06f8\u06f0 \u062f\u0631\u0635\u062f \u0627\u06cc\u0646 \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627 \u0628\u0647 \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647 \u0646\u06cc\u0627\u0632 \u067e\u06cc\u062f\u0627 \u0646\u06a9\u0631\u062f\u0646\u062f\u00bb, #\u062f\u0631\u0645\u0627\u0646_\u0631\u06cc\u0634\u0647 \u00ab\u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647 \u0627\u0632 \u0627\u0628\u062a\u062f\u0627 \u062f\u0631 \u0645\u0648\u0627\u0631\u062f\u06cc \u0627\u0646\u062c\u0627\u0645 \u0634\u062f \u06a9\u0647\u2026\u00bb, #\u0627\u0646\u062f\u06cc\u06a9\u0627\u0633\u06cc\u0648\u0646_\u0631\u0648\u06a9\u0634 (decision) \u00ab\u2026\u0628\u0627\u06cc\u062f \u0631\u0648\u06a9\u0634 \u06a9\u0627\u0645\u0644 \u0628\u0627\u0634\u062f\u00bb, #\u0628\u06cc\u0648\u0645\u06cc\u0645\u062a\u06cc\u06a9 (umbrella) \u00ab\u062f\u0631 \u0631\u0648\u06cc\u06a9\u0631\u062f \u0628\u06cc\u0648\u0645\u06cc\u0645\u062a\u06cc\u06a9\u060c \u0628\u0631\u0627\u06cc \u0628\u0631\u062f\u0627\u0634\u062a \u062a\u0631\u06a9\u2026\u00bb. --sync ok, --check OK, cabinet --check OK; reachability: page within first 4 pages of chips \u062a\u0631\u06a9 \u0639\u0627\u062c\u06cc/\u067e\u0648\u0634\u0634 \u06a9\u0627\u0633\u067e/\u062d\u0641\u0638 \u067e\u0627\u0644\u067e (\u22644 pages each); content-index/assistant-tags reverted (runner outputs)"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.5: brain entry appended at end of array (id 51), key set identical to sharehub 50; hashtags = 5.0 list; keywords = 17 (page JSON-LD); pillar operative/cracked-tooth"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.5.5: pillar recorded = 2.4 decision (operative/cracked-tooth); capsule /pillar/operative/ matches; no new subtopic"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.5.6: plus/pathways.json \u2014 biomimetic (after dentai-15), operative-cariology (after dentai-11), fixed-pros (after chairside-49, --confirmed by founder). 4.12-\u0628: 3 MCQs approved in M2 and written (r-3d1ae453, r-d59b18da, r-7e968da9); validator 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.5.6-b: candidates bundle-biomimetic, bundle-bonding, bundle-crown-prep -> all \u00ab\u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2: \u0639\u0646\u0648\u0627\u0646 \u00ab\u0648\u0642\u062a\u06cc\u2026\u00bb \u06cc\u06a9 \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u0633\u062a)\u00bb; no bundle edit, no home-bundles.js change"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.6: Pulse line inserted at top (title as link text), oldest share-48 line removed, 7 lines; English mirror sharehub/en/share-51.html + fa toggle; second_cut_editorial_lock_v1 recorded (10 scopes); first_cut_lead_provenance_v1 author_original"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/des-fidelity-plans/sharehub/share-51.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-51.html",
      "sharehub/index.html",
      "sharehub/share-51.html",
      "sharehub/share51-fig1.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: sharehub/share-51.html, sharehub/en/share-51.html, index.html, dentcast-brain.json, dentcast-hashtag-reference.json, plus/des-scores.json, plus/faq-corpus.json, plus/pathways.json, plus/exam-questions.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
