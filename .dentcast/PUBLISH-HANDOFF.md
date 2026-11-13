# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-51"
- Status: in_progress
- Next canonical step: "C.4.13"
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
      "approvals": [],
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
      "pending_questions": [
        {
          "answered": false,
          "message": "M3b",
          "question": "u8: \u062a\u0631\u06a9\u06cc \u06a9\u0647 \u0628\u0647 \u0645\u062d\u06cc\u0637 \u062f\u0647\u0627\u0646 \u0631\u0627\u0647 \u062f\u0627\u0631\u062f\u060c \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u062f \u0645\u062d\u0644 \u062a\u062c\u0645\u0639 \u0628\u06cc\u0648\u0641\u06cc\u0644\u0645 \u0628\u0627\u06a9\u062a\u0631\u06cc\u0627\u06cc\u06cc \u0628\u0627\u0634\u062f. (HEDGE_ADDED, src Chen 2023; doubtful: sweeper MATCHES)",
          "step": "C.4.13"
        },
        {
          "answered": false,
          "message": "M3b",
          "question": "u10: \u2026\u062a\u0648\u0635\u06cc\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f \u062e\u0637 \u062a\u0631\u06a9 \u0631\u0627 \u0628\u0627 \u0627\u062d\u062a\u06cc\u0627\u0637 \u0628\u0631\u062f\u0627\u0631\u06cc\u0645\u2026 [2] (condition dropped: reversible pulpitis, Kim 2016)",
          "step": "C.4.13"
        },
        {
          "answered": false,
          "message": "M3b",
          "question": "u16: \u2026\u0646\u062a\u06cc\u062c\u0647\u200c\u0634\u0627\u0646 \u062a\u0641\u0627\u0648\u062a \u0645\u0639\u0646\u06cc\u200c\u062f\u0627\u0631\u06cc \u0628\u0627 \u0628\u0642\u06cc\u0647\u200c\u06cc \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627 \u0646\u062f\u0627\u0634\u062a [4] (comparator changed, Shrestha 2024)",
          "step": "C.4.13"
        },
        {
          "answered": false,
          "message": "M3b",
          "question": "u40: \u06cc\u06a9\u06cc \u0627\u0632 \u062a\u0648\u0635\u06cc\u0647\u200c\u0647\u0627 \u0627\u06cc\u0646 \u0627\u0633\u062a \u06a9\u0647 \u062f\u0646\u062f\u0627\u0646 \u0628\u0627 \u0631\u0648\u06a9\u0634 \u0645\u0648\u0642\u062a \u0645\u062d\u0627\u0641\u0638\u062a \u0634\u0648\u062f\u2026 [2] (condition dropped: persistent biting pain, Kim 2016)",
          "step": "C.4.13"
        },
        {
          "answered": false,
          "message": "M3b",
          "question": "u44: \u2026\u06a9\u0627\u0633\u067e\u200c\u0647\u0627 \u0631\u0627 \u0628\u067e\u0648\u0634\u0627\u0646\u06cc\u0645 \u062a\u0627 \u062f\u0648 \u0637\u0631\u0641 \u062a\u0631\u06a9\u2026 \u0645\u0633\u062a\u0642\u0644 \u0627\u0632 \u06cc\u06a9\u062f\u06cc\u06af\u0631 \u062d\u0631\u06a9\u062a \u0646\u06a9\u0646\u0646\u062f. (condition dropped, Shrestha 2024)",
          "step": "C.4.13"
        },
        {
          "answered": false,
          "message": "M3b",
          "question": "u48: \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u0646\u0647\u0627\u06cc\u06cc \u062f\u0646\u062f\u0627\u0646 \u062a\u0631\u06a9\u200c\u062f\u0627\u0631 \u0628\u0627\u06cc\u062f \u06a9\u0627\u0633\u067e\u200c\u0647\u0627 \u0631\u0627 \u0628\u067e\u0648\u0634\u0627\u0646\u062f. (condition dropped: symptomatic CT / CT-RCT, Zhang 2024)",
          "step": "C.4.13"
        },
        {
          "answered": false,
          "message": "M3b",
          "question": "u54: \u0627\u062d\u062a\u0645\u0627\u0644 \u06a9\u0634\u06cc\u062f\u0646 \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0631\u0648\u06a9\u0634 \u06a9\u0627\u0645\u0644 \u0646\u062f\u0627\u0634\u062a\u0646\u062f\u060c \u062d\u062f\u0648\u062f \u06f1\u06f1 \u0628\u0631\u0627\u0628\u0631 \u0628\u06cc\u0634\u062a\u0631 \u06af\u0632\u0627\u0631\u0634 \u0634\u062f [6]. (condition dropped: root-canal-treated, Zhang 2024; doubtful: sweeper MATCHES)",
          "step": "C.4.13"
        }
      ],
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
        "evidence": [],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "started"
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
    "note": "Index-only refresh after staging delivery paths: sharehub/share-51.html, sharehub/share51-fig1.webp, sharehub/index.html, plus/des-scores.json, .dentcast/des-fidelity-plans/sharehub/share-51.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
