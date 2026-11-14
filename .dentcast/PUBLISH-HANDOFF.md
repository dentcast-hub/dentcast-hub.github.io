# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-52"
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
    "content_id": "sharehub/share-52",
    "context": {
      "approvals": [
        {
          "decision": "\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 NPG\u061b \u0622\u06cc\u0627 \u0622\u0644\u06cc\u0627\u0698 NPG \u0633\u0645\u06cc \u0627\u0633\u062a \u0648 \u067e\u0633\u062a\u0634 \u0632\u0648\u062f \u062f\u0631\u0645\u06cc\u200c\u0622\u06cc\u062f\u061f",
          "evidence": [
            "founder data: H1 of the founder's Claude Doc, copied codepoint for codepoint (Hard Rule 16)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0622\u06cc\u0627 \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 NPG \u0633\u0645\u06cc \u0627\u0633\u062a \u06cc\u0627 \u0632\u0648\u062f \u062f\u0631\u0645\u06cc\u200c\u0622\u06cc\u062f\u061f \u0628\u0631\u0631\u0633\u06cc \u0634\u0648\u0627\u0647\u062f \u0639\u0644\u0645\u06cc \u062f\u0631\u0628\u0627\u0631\u0647\u200c\u06cc \u06a9\u0648\u0631\u0648\u0698\u0646\u060c \u06af\u06cc\u0631\u060c \u0645\u0642\u0627\u0648\u0645\u062a \u0628\u0647 \u0634\u06a9\u0633\u062a\u060c \u0645\u062c\u0648\u0632 FDA \u0648 \u0637\u0628\u0642\u0647\u200c\u0628\u0646\u062f\u06cc ADA \u0622\u0644\u06cc\u0627\u0698 NPG.",
          "evidence": [
            "founder data: \u00ab\u0645\u062a\u0627 \u062f\u06cc\u0633\u06a9\u0631\u06cc\u067e\u0634\u0646\u00bb line of the founder's Claude Doc, copied verbatim (Hard Rule 16)"
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
          "note": "Part 1 ladder: cabinet miss for all; PubMed MCP abstracts for refs 1,6,7,8,9,11,12 and ref 10 (PMC7241566 -> PMID 32490402) -> ABSTRACT_ONLY; refs 2,3,4,5,13,14 hosts blocked by session network policy (curl CONNECT 403; WebFetch ENOTFOUND) -> M1. des_record_guard lookup: 0 stored records for every DOI. SOURCE: claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964\u2026) --tools '' --model opus (modelUsage claude-opus-5-5), empty dir, one block per source. S12 run 1 invalid (consensus-only keys on a RESEARCH object) -> rerun 36/D. Part 2d audits (system sha256 948e8bf6\u2026) agree on all 8 (exit 0). Part 3(6): two S1 interpretation_fa judgments trimmed."
        },
        {
          "kind": "m1_answers",
          "note": "M1 answered by founder: ref 13 abstract pasted from the DOAJ page (Borhan Haghighi & Pahlavanpour Fard Jahromy, J Dent Biomater 2014) -> ABSTRACT_ONLY, 25/D (run 1 invalid: consensus-only keys; rerun). Ref 14 PDF attached (Nodehi et al., J Mash Dent Sch 2023;47(1):90-7, DOI 10.22038/jmds.2023.63550.2142): pdf_source_text.py extracted the Persian body in reversed visual order (unusable), so the English abstract on page 1 is the source_text -> ABSTRACT_ONLY, 47/C; not a step-4.10 attached paper (supplied as source text for an existing reference). Refs 2,3,4,5: \u00ab\u0646\u062f\u0627\u0631\u0645 \u2026 \u062f\u0633 \u0647\u0645 \u0646\u0645\u06cc\u062e\u0648\u0627\u0646 \u0641\u06cc\u062f\u06cc\u0644\u06cc\u062a\u06cc \u0647\u0645 \u0646\u0645\u06cc\u062e\u0648\u0627\u0646\u00bb -> slots {des_version 3.7, error INSUFFICIENT_TEXT}, fidelity null via POOLED object (share-51 ref 9 precedent). Network change (create_environment) declined: approval not possible from phone."
        },
        {
          "kind": "fidelity_run",
          "note": "Scope POOLED (prose names no source; citations are numeric). One SOURCE-scope FIDELITY call per source with text (S1,S6-S14), each all 73 units, spec .dentcast/des-v3.7-knowledge.md as system prompt, claude -p --tools '' --model opus (modelUsage claude-opus-5-5), fresh empty dir each; --merge -> pooled 98 HIGH (19 matches, 1 altered u11 HEDGE_REMOVED S7, 34 not_assessable, 1 author_view, 18 not_a_claim). --accept exit 0 (18 checks). POOLED is not judged/voted (module 08 Part 2c), so no doubtful-unit list. Provisional record stored in plus/des-scores.json for the save point."
        },
        {
          "kind": "part3b_round1",
          "note": "M3b: founder answered \u00ab\u0627\u0635\u0644\u0627\u062d \u06a9\u0646\u00bb for u11 -> page sentence \u00ab\u0641\u0642\u0637 \u0646\u0633\u062e\u0647\u200c\u06cc NPG+2 \u0645\u0642\u062f\u0627\u0631 \u06a9\u0645\u06cc \u0637\u0644\u0627 \u062f\u0627\u0631\u0647 [\u06f2].\u00bb became \u00ab\u0646\u0633\u062e\u0647\u200c\u06cc NPG+2 \u0645\u0642\u062f\u0627\u0631 \u06a9\u0645\u06cc \u0637\u0644\u0627 \u062f\u0627\u0631\u0647 [\u06f2].\u00bb (no other surface carried it yet). POOLED has no --base re-check, so the full POOLED step was rerun on the edited page (10 calls, opus, fresh contexts) -> merge 100 HIGH (20/20 assessable match), --accept exit 0. Grade before -> after: 98 HIGH -> 100 HIGH. Stored in plus/des-scores.json (fidelity replaced)."
        },
        {
          "kind": "pathway_placement",
          "note": "pathway_place.py: post-and-core STRONG (125) -> inserted after sharehub/share-20 (index 10, no milestone). biomimetic STRONG by score (45) but semantically borderline (cast metal alloy is not a biomimetic/bonded-restoration concept) -> not placed, reported. ceramics/occlusion/fixed-pros/failure-troubleshooting/implant-surgical ASK -> not placed. Coverage 1.52 per item (baseline 1.38). Bundle check: bundle-post-core (\u00ab\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631: \u0634\u0631\u0648\u0639 \u06a9\u0646\u00bb, 8 steps) -> \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2: title is a question about one alloy, not a whole concept; also gate 5 would fail at 9 steps). English mirror sharehub/en/share-52.html authored from locked text (clone of sharehub/en/share-51.html; 7 h2, 12 body p + refs note, 5 table rows, 14 refs); Pulse line prepended in index.html, oldest (chairside-52) removed, 7 lines."
        },
        {
          "kind": "m2_answers",
          "note": "M2: founder approved both exam questions (\u00ab\u0647\u0631 \u062f\u0648 \u062a\u0623\u06cc\u06cc\u062f\u00bb): r-77fd0534 (510(k) clearance = similarity to marketed products, key index 1) and r-7ff7f20b (NPG lower corrosion resistance than Ni-Cr, key index 2), written to plus/exam-questions.json byContent[sharehub/share-52]; validate_exam_questions.py 0 errors."
        },
        {
          "evidence": [
            "sharehub/share-52.html: body opens with the founder's own prose paragraph before any table/list; no agent-authored lead"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder Claude Doc, first body paragraph \u00ab\u0627\u06cc\u0646 \u0631\u0648\u0632\u0647\u0627 \u062f\u0631 \u0627\u06cc\u0646\u0633\u062a\u0627\u06af\u0631\u0627\u0645 \u067e\u0633\u062a\u200c\u0647\u0627\u06cc \u0632\u06cc\u0627\u062f\u06cc\u2026\u00bb (bound input sha256 f2e9156c\u2026)"
        },
        {
          "english": {
            "evidence": [
              "file on disk; clone of sharehub/en/share-51.html; structure-faithful translation"
            ],
            "path": "sharehub/en/share-52.html",
            "status": "ready"
          },
          "evidence": [
            "all founder messages closed; pending_questions empty"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "plus/des-scores.json[sharehub/share-52]: 10 RESEARCH records + 4 INSUFFICIENT_TEXT slots; Fidelity POOLED 100 HIGH after Part 3b; --accept exit 0; Part 2d audits agree"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Question 4.9: ordinary article; C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "pillar fixed-pros/post-and-core (C.2.4), capsule /pillar/fixed-pros/, brain pillar matches (C.5.5)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 0 back-links (post-and-core glossary at cap), C.4.8 2 inline glossary links, C.4.9 2 capsules (4/5)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "5 canonical reused tags, no mint; hashtag_ref --check OK; reachability pass"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "dentcast-brain.json last element sharehub 52, key parity with 51; plus/faq-corpus.json FAQ 9 + 5 cards"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "post-and-core after sharehub/share-20; bundle \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2); exam questions r-77fd0534, r-7ff7f20b approved (M2)"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html pulse: new first line linking /sharehub/share-52.html with the title only; oldest removed; 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "sharehub/en/share-52.html authored from locked text; toggles inverse; noindex; no hreflang"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title/caption confirmed as founder data; M1, M3b (\u0627\u0635\u0644\u0627\u062d \u06a9\u0646 u11), M2 (\u0647\u0631 \u062f\u0648 \u062a\u0623\u06cc\u06cc\u062f) answered"
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
          "note": "founder text, exported verbatim from the founder's Claude Doc",
          "ref": "claude-docs:npg-post-and-core (founder doc)",
          "sha256": "f2e9156ceed66af25d9198a8da3dc31f84579d3b09ee12f2888d2470a6e239aa"
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
          "read: README.md, global/README.md+core sections (3 pages), agent-parity.md, publish-checkpoints.md, publish-handoff-tool.md, modules/01, modules/02"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (founder Claude Doc), paper file no -> normal publish, no paper branch. Capability preflight: git ls-remote origin OK; push to session branch ccr-e4172164-1fnv07 allowed; Actions monitoring + PR/merge via GitHub MCP"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 612 entries; latest sharehub = id 51 (/sharehub/share-51.html), key set type,id,title,caption,author,source,hashtags,keywords,url,pillar{primary,secondary,subtopic}; live PILLARS read (fixed-pros has post-and-core)"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type = sharehub (founder: \u00ab\u0627\u0632 \u0646\u0648\u0639 \u0634\u06cc\u0631\u0647\u0627\u0628\u00bb)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number = max(51)+1 = 52 -> sharehub/share-52; founder slug npg-post-and-core-evidence is not the sharehub URL pattern (share-N), recorded, not used as filename"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "full text received in founder Claude Doc; bound by sha256 f2e9156c\u2026 (context.inputs); founder title = doc H1, founder caption = \u00ab\u0645\u062a\u0627 \u062f\u06cc\u0633\u06a9\u0631\u06cc\u067e\u0634\u0646\u00bb line"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5 de-AI pass: \u00ab\u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a\u00bb \u2014 colloquial first-person founder register, varied rhythm, no formulaic openers/clich\u00e9s/hedge stacking; zero rewrites"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: latest sharehub brain entry has no image/audio/video field; doc carries no image -> no media to collect"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached -> step 4.10 branch inactive (documented skip)"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES basket 2 (RESEARCH): page carries a \u00ab\u0645\u0646\u0627\u0628\u0639\u00bb block with PubMed ids 29807967, 41210404, 18546197, 11005911, 26046108, 25006386, 28808455 (+DOI 10.22037/iej.v12i3.10586) plus non-DOI sources (FDA 510k K972971/K863782, ADA page, manufacturer catalogue, PMC7241566 article, DOAJ 2014 article, MUMS 2023 PDF); one DES record per cited source"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary article (\u00ab\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc\u00bb), not a \u0686\u0627\u0644\u0634"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent drafts in sharehub precedent (title alone as link text, <li><a href=/sharehub/share-52.html>TITLE</a></li>) \u2014 standing acceptance"
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
          "template = sharehub/share-51.html (previous same-category page), enrolled in target_paths, kept byte-unchanged"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/share-52.html cloned structurally from share-51; body = founder text of record (Q3.5: unchanged) converted mechanically from the exported doc (no retyping); founder title/caption copied verbatim to title/h1/og/twitter/JSON-LD/breadcrumb (8 title, 4 caption surfaces); domain dentcast.org kept; GA4 once; 2 preconnect crossorigin at top of head; no trust seal; body opens with founder prose paragraph before any list/table (author_original lead); no hashtag chip row in sharehub template"
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
          "pillar.primary = fixed-pros, subtopic = post-and-core (one clear fit: the piece is about cast post-and-core alloy choice; operative/ceramics rejected \u2014 not restorative-direct nor ceramic). Standing acceptance."
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with 2 capsules: /glossary/ + /pillar/fixed-pros/ (typed brain entry branch); budget used 2/5"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/index.html is hand-maintained static HTML: added <li><a href=\"share-52.html\">TITLE (\u0645\u0637\u0644\u0628\u06cc \u0627\u0632 \u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646)</a></li> at top, matching siblings"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "date audit: datePublished=dateModified=2026-11-14 (JSON-LD); template has no other visible/meta dates; canonical/og:url/breadcrumb/hreflang -> share-52; title/description/og/twitter match founder strings \u2014 all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- sharehub/share-51.html: exit 0 (template unchanged)"
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
          "DES: 14 slots in plus/des-scores.json[sharehub/share-52]: 10 RESEARCH ABSTRACT_ONLY provisional records (S1 36/D, S6 36/D, S7 47/C, S8 25/D, S9 25/D, S10 47/C, S11 25/D, S12 36/D, S13 25/D, S14 47/C), refs 2-5 INSUFFICIENT_TEXT (founder: no text, no DES/Fidelity). Part 3 (quotes, arithmetic, band, schema), 3(6), 3(7) guard check, Part 2d audits all agree. FIDELITY POOLED 100 HIGH after Part 3b; --accept exit 0. See decisions source_resolution, m1_answers, fidelity_run, part3b_round1."
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "candidates: glossary post-and-core (strong) \u2014 at cap 6/5 (related_cap.py), skipped; fiber-post, dental-cement, dentinal-tubules, ferrule-effect \u2014 borderline/unrelated (page is about cast alloy choice), not linked. 0 back-links written."
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
          "inline links (first occurrence, plain <a> as body uses): \u00ab\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631\u00bb (intro) -> /glossary/post-and-core.html; \u00ab\u0641\u0627\u06cc\u0628\u0631\u00bb in \u00ab\u0631\u06cc\u062e\u062a\u06af\u06cc \u0628\u0627 \u0641\u0627\u06cc\u0628\u0631\u00bb (fiber post) -> /glossary/fiber-post.html. Skipped borderline: \u00ab\u0633\u0645\u0627\u0646\u00bb -> dental-cement (tangential), \u00ab\u0645\u062f\u0648\u0644 \u0627\u0644\u0627\u0633\u062a\u06cc\u0633\u06cc\u062a\u0647\u00bb -> episode-125-3 (used in 4.9 instead). Fidelity --accept still exit 0 (anchors only)."
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "free slots 3 (2 nav capsules). Added strong: /episodes/episode-125-3.html \u00ab\u062a\u0648\u0632\u06cc\u0639 \u0627\u0633\u062a\u0631\u0633: \u067e\u0633\u062a \u0641\u0627\u06cc\u0628\u0631 \u06cc\u0627 \u0641\u0644\u0632\u06cc\u061f\u00bb (modulus/root-protection section); /sharehub/share-20.html \u00ab\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u062f\u0631 \u0628\u0631\u0627\u0628\u0631 \u067e\u0633\u062a \u0631\u06cc\u062e\u062a\u06af\u06cc\u00bb (post-material comparison incl. cast). Borderline skipped: meta-7 fiber post overrated, insight-97 temporary cementation of cast posts, dentpedia anterior posts. Section 4/5."
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent[sharehub/share-52].definedTermSets: 5 authored DefinedTerms #flashcards-c1..c5 (NPG, 510(k), ADA classification, NPG corrosion weakness vs Ni-Cr, ISO 22674), none a near-copy of a FAQ answer; no page JSON-LD touched"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage #faq in plus/faq-corpus.json: 9 standalone yes/no questions (no deixis), each answer opens with \u0628\u0644\u0647/\u062e\u06cc\u0631 -> 9 binary questions for the scored bank; 0 rewritten/dropped. 4.12-\u0628: evaluated at 5.6"
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
          "questions: \u00ab\u067e\u0633\u062a NPG \u0633\u0645\u06cc\u0647\u061f\u00bb \u00ab\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 NPG \u0628\u0647\u062a\u0631\u0647 \u06cc\u0627 \u0646\u06cc\u06a9\u0644 \u06a9\u0631\u0648\u0645\u061f\u00bb \u00ab\u0622\u0644\u06cc\u0627\u0698 \u0645\u0633\u06cc \u0628\u0631\u0627\u06cc \u067e\u0633\u062a \u0631\u06cc\u062e\u062a\u06af\u06cc \u06a9\u0648\u0631\u0648\u0698\u0646 \u062f\u0627\u0631\u0647\u061f\u00bb \u00ab\u067e\u0633\u062a NPG \u0632\u0648\u062f \u062f\u0631\u0645\u06cc\u0627\u062f\u061f\u00bb. Reused canonical (no mint): #\u0645\u0631\u0648\u0631_\u0645\u0646\u0627\u0628\u0639 (series), #\u067e\u0633\u062a_\u0648_\u06a9\u0648\u0631 (umbrella 47), #\u06a9\u0648\u0631_\u0631\u06cc\u062e\u062a\u06af\u06cc (decision: choosing/comparing cast post alloy; \u00ab\u0627\u06af\u0647 \u0627\u0646\u062a\u062e\u0627\u0628 \u062f\u0627\u0631\u06cc\u0645\u060c Ni-Cr \u0631\u0648 \u062a\u0631\u062c\u06cc\u062d \u0628\u062f\u06cc\u0645\u00bb), #\u0632\u06cc\u0633\u062a_\u0633\u0627\u0632\u06af\u0627\u0631\u06cc (3; \u00ab\u0627\u0632 \u06a9\u0648\u0631\u0648\u0698\u0646 \u062f\u0627\u0631\u0647 \u062a\u0627 \u0628\u0631\u0627\u06cc \u0628\u06cc\u0645\u0627\u0631 \u0633\u0645\u06cc\u0647 \u0631\u0627\u0647 \u0632\u06cc\u0627\u062f\u06cc\u0647\u2026\u00bb), #\u0645\u0642\u0627\u0648\u0645\u062a_\u0628\u0647_\u0634\u06a9\u0633\u062a (3; \u00ab\u0646\u062a\u0627\u06cc\u062c \u0645\u0642\u0627\u0648\u0645\u062a \u0628\u0647 \u0634\u06a9\u0633\u062a \u0647\u0645 \u0628\u0627 \u0647\u0645 \u0646\u0645\u06cc\u200c\u062e\u0648\u0646\u0646\u2026\u00bb). Corrosion: no library concept, no second page resolves it -> keywords only. --sync done, --check OK, build_cabinet_papers --check OK; build_plus_index outputs reverted (runner C.8). Reachability: share-52 rank 3/3 under \u00ab\u0632\u06cc\u0633\u062a \u0633\u0627\u0632\u06af\u0627\u0631\u06cc\u00bb and \u00ab\u0645\u0642\u0627\u0648\u0645\u062a \u0628\u0647 \u0634\u06a9\u0633\u062a\u00bb (pass); rank 13 under \u00ab\u06a9\u0648\u0631 \u0631\u06cc\u062e\u062a\u06af\u06cc\u00bb (question 4 not surfaced, recorded)."
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-brain.json: sharehub id 52 appended as the last array element (json_append, byte-preserving), key set/order identical to sharehub 51; hashtags = step 5.0 list; pillar fixed-pros/post-and-core; keywords 16 (same as page JSON-LD)"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar recorded fixed-pros/post-and-core = step 2.4 decision; capsule /pillar/fixed-pros/ matches; no new subtopic"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/pathways.json: sharehub/share-52 in post-and-core after sharehub/share-20 (pathway_place.py --insert); biomimetic/ASK candidates not placed (see decision pathway_placement); coverage 1.52/item. 4.12-\u0628: 2 MCQ approved in M2 and written (r-77fd0534, r-7ff7f20b), validate_exam_questions.py 0 errors; drawn by pathway post-and-core"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "candidate bundle-post-core (continues post-and-core): \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2 \u2014 title is a question about one alloy, not a whole beginner concept; gate 5 would also fail at 9 steps). home-bundles.js untouched."
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: index.html new top line <li><a href=\"/sharehub/share-52.html\">TITLE</a></li>, bottom line (chairside-52) removed, 7 lines; English mirror sharehub/en/share-52.html + fa toggle; second_cut_editorial_lock_v1 recorded (10 scopes)"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/des-fidelity-plans/sharehub/share-52.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-52.html",
      "sharehub/index.html",
      "sharehub/share-51.html",
      "sharehub/share-52.html"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: sharehub/share-52.html, sharehub/en/share-52.html, plus/des-scores.json, plus/faq-corpus.json, plus/pathways.json, plus/exam-questions.json, dentcast-brain.json, dentcast-hashtag-reference.json, index.html"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
