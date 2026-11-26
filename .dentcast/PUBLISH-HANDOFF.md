# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-61"
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
    "content_id": "sharehub/share-61",
    "context": {
      "approvals": [
        {
          "decision": "\u062b\u0628\u062a \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0631 \u0641\u0648\u0644\u200c\u0622\u0631\u0686 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u061b \u06a9\u062f\u0627\u0645 \u0631\u0648\u0634 \u062f\u0642\u06cc\u0642\u200c\u062a\u0631 \u0627\u0633\u062a\u061f",
          "evidence": [
            "founder-supplied, copied verbatim (Hard Rule 16)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc \u0639\u0645\u0648\u062f\u06cc\u060c \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u0648 Scan aid\u060c \u06af\u06cc\u062c \u0627\u0641\u0642\u06cc \u0648 \u0641\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u062f\u0627\u062e\u0644 \u0648 \u062e\u0627\u0631\u062c \u062f\u0647\u0627\u0646\u06cc \u062f\u0631 \u062b\u0628\u062a \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0641\u0648\u0644\u200c\u0622\u0631\u0686 \u0686\u0647 \u062f\u0642\u062a\u06cc \u062f\u0627\u0631\u0646\u062f \u0648 \u0639\u062f\u062f \u062f\u0642\u062a \u0631\u0627 \u0686\u0637\u0648\u0631 \u0628\u0627\u06cc\u062f \u062e\u0648\u0627\u0646\u062f\u061b \u0628\u0631 \u0627\u0633\u0627\u0633 \u067e\u0633\u062a \u0622\u0645\u0648\u0632\u0634\u06cc Dr. Jonathan Ng.",
          "evidence": [
            "agent proposal under standing acceptance (Hard Rule 14)"
          ],
          "scope": "caption",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "attached_paper": "no",
          "challenge": "no",
          "kind": "intake_facts_v1"
        },
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
          "decision": "3 MCQs approved verbatim by founder (\u00ab\u0633\u0648\u0627\u0644\u0647\u0627 \u062a\u0627\u06cc\u06cc\u062f\u00bb); check not duplicate in target pathway",
          "evidence": [
            "founder chat reply"
          ],
          "kind": "exam_questions_m2",
          "status": "confirmed"
        },
        {
          "decision": "S1 SOURCE call stored: RESEARCH DIAGNOSTIC narrative-review row, des_score 4, band E, FULL_TEXT, model claude-opus-5-5, system prompt sha256 709be964\u2026; interpretation_fa sentence 5 narrowed (Part 3(6)); fidelity slot pending sweeper run",
          "evidence": [
            "plus/des-scores.json sharehub/share-61"
          ],
          "kind": "des_source_record",
          "status": "recorded"
        },
        {
          "evidence": [
            "first paragraph of sharehub/share-61.html"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "the founder's own first paragraph (intake text)"
        },
        {
          "english": {
            "evidence": [
              "sharehub/en/share-61.html on disk, toggles wired"
            ],
            "path": "sharehub/en/share-61.html",
            "status": "ready"
          },
          "evidence": [
            "built by `close` from the ledger evidence of the steps through C.5.6-b"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13: basket 2, one DOI-less source S1 (founder-supplied English slide transcript, FULL_TEXT). SOURCE: isolated claude -p, model claude-opus-5-5, system prompt .dentcast/des-v3.7-knowledge.md sha256 709be964\u2026; RESEARCH DIAGNOSTIC narrative-review row, des_score 4 band E provisional false; des_repair usable, 0 repairs, 0 UNVERIFIED; record_guard ok; Part 3(6) one interpretation_fa sentence narrowed. FIDELITY: one sweeper run (same model, isolated), 225 units, 149 MATCHES / 0 ALTERED / 0 REVERSED / 8 NOT_IN_SOURCE / 68 NOT_A_CLAIM, score 100 HIGH; --vote, --accept exit 0; no judge; single source \u2192 no orphan sweep. Stored plus/des-scores.json sharehub/share-61"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.14 skipped: ordinary post, not a Challenge (Question 4.9)"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "C.2.4: pillar digital / subtopic intraoral-scanning (clear fit: digital acquisition of full-arch implant positions; same home as share-56); competing implantology/prosthetic-components weaker (topic is scanning accuracy, not components)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7: related_cap --glossary-room: of related terms only milling has a free slot; scan-body and intraoral-scanner (strong) at cap \u2192 not linked; milling borderline (page only names milling quality as a factor) \u2192 skipped, conservative; 0 back-links written",
                "C.4.8: fresh semantic pass over body vs glossary + brain: applied 3 (first occurrence, technical sense): \u00ab\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u00bb\u2192/glossary/scan-body.html, \u00ab\u0627\u0633\u06a9\u0646\u0631 \u062f\u0627\u062e\u0644 \u062f\u0647\u0627\u0646\u06cc\u00bb\u2192/glossary/intraoral-scanner.html, \u00ab\u0645\u06cc\u0644\u06cc\u0646\u06af\u00bb\u2192/glossary/milling.html; skipped borderline: \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb\u2192dental-implant (generic), photogrammetry/precision phrases \u2192 episodes (covered by 4.9, conservative); git diff = anchors only, fidelity --accept still exit 0",
                "C.4.9: free slots 3 (2 nav capsules): added share-56 (full-arch implant scan trust), episode-144-2 (photogrammetry in full-arch scan), episode-128-1 (scanner trueness & precision); skipped at cap: episode-133 (scan bodies), share-2, insight-112, share-54; related_cap 5/5"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0: questions: \u00ab\u0627\u0633\u06a9\u0646 \u0641\u0648\u0644 \u0622\u0631\u0686 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0627 \u0641\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u062f\u0642\u06cc\u0642\u200c\u062a\u0631\u0647 \u06cc\u0627 \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u061f\u00bb \u00ab\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u200c\u0647\u0627 \u0631\u0648 \u0628\u0631\u0627\u06cc \u0627\u0633\u06a9\u0646 \u0641\u0648\u0644 \u0622\u0631\u0686 \u0628\u0647 \u0647\u0645 \u0648\u0635\u0644 \u06a9\u0646\u0645\u061f\u00bb \u00abtrueness \u0648 precision \u0627\u0633\u06a9\u0646\u0631 \u06cc\u0639\u0646\u06cc \u0686\u06cc\u061f\u00bb \u00ab\u0641\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u062f\u0627\u062e\u0644 \u062f\u0647\u0627\u0646\u06cc \u0686\u0642\u062f\u0631 \u062f\u0642\u06cc\u0642\u0647\u061f\u00bb \u00ab\u0686\u0631\u0627 \u062e\u0637\u0627\u06cc \u0627\u0633\u06a9\u0646 \u0641\u0648\u0644 \u0622\u0631\u0686 \u062a\u0647 \u0642\u0648\u0633 \u0628\u06cc\u0634\u062a\u0631\u0647\u061f\u00bb. All reused, 0 minted: #Curated_Content (series), #\u0627\u0633\u06a9\u0646_\u0641\u0648\u0644_\u0622\u0631\u0686 (3, decision), #\u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc (2, specific), #\u0627\u0633\u06a9\u0646_\u0628\u0627\u062f\u06cc (8), #\u062e\u0637\u0627\u06cc_\u0627\u0633\u062a\u06cc\u0686\u06cc\u0646\u06af (5), #\u062f\u0642\u062a_\u0627\u0633\u06a9\u0646 (18), #\u0627\u06cc\u0645\u067e\u0644\u0646\u062a_\u0641\u0648\u0644_\u0622\u0631\u0686 (16). Resolving sentences: \u00ab\u0641\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u062f\u0627\u062e\u0644 \u062f\u0647\u0627\u0646\u06cc \u0627\u0632 \u0646\u0638\u0631 \u062f\u0642\u062a \u0628\u0647 \u0633\u06cc\u0633\u062a\u0645\u200c\u0647\u0627\u06cc \u062e\u0627\u0631\u062c \u062f\u0647\u0627\u0646\u06cc \u0646\u0632\u062f\u06cc\u06a9 \u0634\u062f\u0647 \u0627\u0633\u062a\u2026\u00bb; \u00ab\u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u0628\u0648\u062f\u0646 \u06cc\u06a9 \u0633\u06cc\u0633\u062a\u0645 \u062a\u0636\u0645\u06cc\u0646 \u0646\u0645\u06cc\u200c\u06a9\u0646\u062f\u2026\u00bb; \u00ab\u062e\u0637\u0627 \u062f\u0631 \u0637\u0648\u0644 \u0645\u0633\u06cc\u0631 \u0627\u0633\u06a9\u0646 \u0631\u0648\u06cc \u0647\u0645 \u062c\u0645\u0639 \u0645\u06cc\u200c\u0634\u0648\u062f\u2026\u00bb; \u00ab\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc \u0639\u0645\u0648\u062f\u06cc \u0645\u0639\u0645\u0648\u0644\u06cc \u0647\u0645 \u0627\u0633\u06a9\u0646 \u0633\u062e\u062a\u200c\u062a\u0631\u06cc \u062f\u0627\u0631\u062f\u2026\u00bb; \u00abPrecision \u06cc\u0639\u0646\u06cc \u062a\u06a9\u0631\u0627\u0631\u067e\u0630\u06cc\u0631\u06cc \u0648 Trueness \u06cc\u0639\u0646\u06cc \u062f\u0631\u0633\u062a \u0628\u0648\u062f\u0646\u2026\u00bb. --reach REACHABLE (#\u0627\u0633\u06a9\u0646_\u0641\u0648\u0644_\u0622\u0631\u0686 4/4, #\u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc 3/3); --sync, --check OK; build_cabinet_papers --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5: brain entry sharehub 61 appended at array end, key set = share-60 (type,id,title,caption,author,source,hashtags,keywords,url,pillar); author Dr. Jonathan Ng / source instagram (share-1..6 precedent); 35 lines"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6: pathway_place: STRONG implant-prosthetic (150), fixed-pros (110), digital (83). Placed: implant-prosthetic after sharehub/share-56; digital after insight/insight-112 (no milestone). fixed-pros = third full pathway \u2192 not placed (founder-only). ASK candidates not placed. 4.12-\u0628: founder approved 3 MCQs; founder asked to check duplicates in the target pathway: Q3 (error accumulates toward end of arch) duplicates sharehub/share-56 r-question \u00ab\u2026\u062a\u062c\u0645\u0639 \u062e\u0637\u0627\u0647\u0627\u06cc \u06a9\u0648\u0686\u06a9 \u0627\u062a\u0635\u0627\u0644 \u062a\u0635\u0627\u0648\u06cc\u0631 \u062f\u0631 \u0637\u0648\u0644 \u0642\u0648\u0633\u00bb (also dentai-21, insight-51) \u2192 not written; Q1 (Precision) and Q2 (Linear trueness mean) distinct \u2192 written r-ids publish-1/2; validate_exam_questions --content: 0 errors",
                "C.5.6-b: candidates: bundle-implant-parts \u2192 \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f3: \u0622\u06cc\u062a\u0645 \u062f\u0631\u0628\u0627\u0631\u0647\u0654 \u0642\u0637\u0639\u0627\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0646\u06cc\u0633\u062a\u060c \u0632\u06cc\u0631\u0645\u0648\u0636\u0648\u0639\u06cc \u0627\u0632 \u0627\u06cc\u0646 \u0628\u0627\u0646\u062f\u0644 \u0631\u0627 \u067e\u0631 \u0646\u0645\u06cc\u200c\u06a9\u0646\u062f); bundle-implant-impression \u2192 \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f3: \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0627 insight-112 \u067e\u0648\u0634\u0634 \u062f\u0627\u062f\u0647\u061b \u0627\u06cc\u0646 \u0645\u0637\u0644\u0628 \u0639\u0645\u0642/\u0628\u0647\u200c\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06cc \u0627\u0633\u062a)"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "first Pulse line of index.html links /sharehub/share-61.html"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "sharehub/en/share-61.html on disk"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "pending_questions empty; founder answers recorded as decisions"
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
          "readpack sharehub/attached-paper=unknown/challenge=no/des=research/isolated/sources-one, pack.txt read top to bottom"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text: founder Claude Docs artifact (rev 50); no paper file; English slide transcript = fidelity source only; route: normal publish"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 60 sharehub entries, latest share-60 key set [type,id,title,caption,author,source,hashtags,keywords,url,pillar]; template sharehub/share-60.html; live PILLARS read from main"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type=sharehub (founder: \u00ab\u0646\u0648\u0639 \u0634\u06cc\u0631\u0647\u0627\u0628\u00bb)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number share-61 (max 60 +1)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text: founder Claude Docs doc \u00ab\u062b\u0628\u062a \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0631 \u0641\u0648\u0644\u200c\u0622\u0631\u0686 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u061b \u06a9\u062f\u0627\u0645 \u0631\u0648\u0634 \u062f\u0642\u06cc\u0642\u200c\u062a\u0631 \u0627\u0633\u062a\u061f\u00bb rev 50"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5: \u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a (no rewrites applied)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: 15 webp images from founder zip (01..18, 14-chart not in text \u2192 unused); no audio/video"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached; 4.10 branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 2 (research, determinate source): one DOI-less source S1 = Dr. Jonathan Ng teaching-notebook slides (English transcript supplied by founder); founder: \u00ab\u0641\u0642\u0637 \u0627\u0632 \u0645\u062a\u0646 \u0628\u0631\u0627\u06cc \u0633\u0646\u062c\u0634 \u0641\u06cc\u062f\u06cc\u0644\u06cc\u062a\u06cc \u0627\u0633\u062a\u0641\u0627\u062f\u0647 \u06a9\u0646\u00bb \u2192 SOURCE call on that text, FIDELITY on same text"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent draft (standing acceptance) in sharehub precedent pattern; M2: 3 questions approved (\u00ab\u0633\u0648\u0627\u0644\u0647\u0627 \u062a\u0627\u06cc\u06cc\u062f\u00bb), M1 images supplied (zip)"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "LiteCast branch inactive (category sharehub)"
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
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [
          "template sharehub/share-60.html (latest sharehub page), in target_paths"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/share-61.html cloned from share-60 (scripted, count asserts); body = founder doc text, 112 paragraphs + 2 tables verified against doc per-paragraph sha256 (0 mismatch); 15 figures share61-fig1..15.webp; domain .org kept; GA4/preconnect from clone; no e-namad; opening <p> before first list; presentation: 14 section numbers (data-dc-presentation), 2 unlabelled dc-box-tip frames around author-labelled \u00ab\u0646\u06a9\u062a\u0647 \u0639\u0645\u0644\u06cc\u00bb paragraphs; presentation_lint clean"
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
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar digital / subtopic intraoral-scanning (clear fit: digital acquisition of full-arch implant positions; same home as share-56); competing implantology/prosthetic-components weaker (topic is scanning accuracy, not components)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with 2 capsules: /glossary/ + /pillar/digital/"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/index.html hand-maintained: row added at top \u00ab\u2026 (\u0645\u0637\u0644\u0628\u06cc \u0627\u0632 Dr. Jonathan Ng)\u00bb"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: JSON-LD datePublished=dateModified=2026-11-26; no other date field/visible date in template"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- sharehub/share-60.html: clean"
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
        "reason": "NoteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast-only credit step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [
          "basket 2, one DOI-less source S1 (founder-supplied English slide transcript, FULL_TEXT). SOURCE: isolated claude -p, model claude-opus-5-5, system prompt .dentcast/des-v3.7-knowledge.md sha256 709be964\u2026; RESEARCH DIAGNOSTIC narrative-review row, des_score 4 band E provisional false; des_repair usable, 0 repairs, 0 UNVERIFIED; record_guard ok; Part 3(6) one interpretation_fa sentence narrowed. FIDELITY: one sweeper run (same model, isolated), 225 units, 149 MATCHES / 0 ALTERED / 0 REVERSED / 8 NOT_IN_SOURCE / 68 NOT_A_CLAIM, score 100 HIGH; --vote, --accept exit 0; no judge; single source \u2192 no orphan sweep. Stored plus/des-scores.json sharehub/share-61"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "related_cap --glossary-room: of related terms only milling has a free slot; scan-body and intraoral-scanner (strong) at cap \u2192 not linked; milling borderline (page only names milling quality as a factor) \u2192 skipped, conservative; 0 back-links written"
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
        "reason": "glossary-publish-only back-link step",
        "status": "skipped"
      },
      {
        "evidence": [
          "fresh semantic pass over body vs glossary + brain: applied 3 (first occurrence, technical sense): \u00ab\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u00bb\u2192/glossary/scan-body.html, \u00ab\u0627\u0633\u06a9\u0646\u0631 \u062f\u0627\u062e\u0644 \u062f\u0647\u0627\u0646\u06cc\u00bb\u2192/glossary/intraoral-scanner.html, \u00ab\u0645\u06cc\u0644\u06cc\u0646\u06af\u00bb\u2192/glossary/milling.html; skipped borderline: \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb\u2192dental-implant (generic), photogrammetry/precision phrases \u2192 episodes (covered by 4.9, conservative); git diff = anchors only, fidelity --accept still exit 0"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "free slots 3 (2 nav capsules): added share-56 (full-arch implant scan trust), episode-144-2 (photogrammetry in full-arch scan), episode-128-1 (scanner trueness & precision); skipped at cap: episode-133 (scan bodies), share-2, insight-112, share-54; related_cap 5/5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent sharehub/share-61 definedTermSets: 6 authored DefinedTerm #flashcards-c1..c6, none copied from FAQ answers"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage 6 standalone yes/no questions (no deixis), answers open with \u0628\u0644\u0647/\u062e\u06cc\u0631: 6 binary for quiz bank; 4.12-\u0628: written at 5.6"
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
        "reason": "ordinary post, not a Challenge (Question 4.9)",
        "status": "skipped"
      },
      {
        "evidence": [
          "questions: \u00ab\u0627\u0633\u06a9\u0646 \u0641\u0648\u0644 \u0622\u0631\u0686 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0627 \u0641\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u062f\u0642\u06cc\u0642\u200c\u062a\u0631\u0647 \u06cc\u0627 \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u061f\u00bb \u00ab\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u200c\u0647\u0627 \u0631\u0648 \u0628\u0631\u0627\u06cc \u0627\u0633\u06a9\u0646 \u0641\u0648\u0644 \u0622\u0631\u0686 \u0628\u0647 \u0647\u0645 \u0648\u0635\u0644 \u06a9\u0646\u0645\u061f\u00bb \u00abtrueness \u0648 precision \u0627\u0633\u06a9\u0646\u0631 \u06cc\u0639\u0646\u06cc \u0686\u06cc\u061f\u00bb \u00ab\u0641\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u062f\u0627\u062e\u0644 \u062f\u0647\u0627\u0646\u06cc \u0686\u0642\u062f\u0631 \u062f\u0642\u06cc\u0642\u0647\u061f\u00bb \u00ab\u0686\u0631\u0627 \u062e\u0637\u0627\u06cc \u0627\u0633\u06a9\u0646 \u0641\u0648\u0644 \u0622\u0631\u0686 \u062a\u0647 \u0642\u0648\u0633 \u0628\u06cc\u0634\u062a\u0631\u0647\u061f\u00bb. All reused, 0 minted: #Curated_Content (series), #\u0627\u0633\u06a9\u0646_\u0641\u0648\u0644_\u0622\u0631\u0686 (3, decision), #\u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc (2, specific), #\u0627\u0633\u06a9\u0646_\u0628\u0627\u062f\u06cc (8), #\u062e\u0637\u0627\u06cc_\u0627\u0633\u062a\u06cc\u0686\u06cc\u0646\u06af (5), #\u062f\u0642\u062a_\u0627\u0633\u06a9\u0646 (18), #\u0627\u06cc\u0645\u067e\u0644\u0646\u062a_\u0641\u0648\u0644_\u0622\u0631\u0686 (16). Resolving sentences: \u00ab\u0641\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u062f\u0627\u062e\u0644 \u062f\u0647\u0627\u0646\u06cc \u0627\u0632 \u0646\u0638\u0631 \u062f\u0642\u062a \u0628\u0647 \u0633\u06cc\u0633\u062a\u0645\u200c\u0647\u0627\u06cc \u062e\u0627\u0631\u062c \u062f\u0647\u0627\u0646\u06cc \u0646\u0632\u062f\u06cc\u06a9 \u0634\u062f\u0647 \u0627\u0633\u062a\u2026\u00bb; \u00ab\u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u0628\u0648\u062f\u0646 \u06cc\u06a9 \u0633\u06cc\u0633\u062a\u0645 \u062a\u0636\u0645\u06cc\u0646 \u0646\u0645\u06cc\u200c\u06a9\u0646\u062f\u2026\u00bb; \u00ab\u062e\u0637\u0627 \u062f\u0631 \u0637\u0648\u0644 \u0645\u0633\u06cc\u0631 \u0627\u0633\u06a9\u0646 \u0631\u0648\u06cc \u0647\u0645 \u062c\u0645\u0639 \u0645\u06cc\u200c\u0634\u0648\u062f\u2026\u00bb; \u00ab\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc \u0639\u0645\u0648\u062f\u06cc \u0645\u0639\u0645\u0648\u0644\u06cc \u0647\u0645 \u0627\u0633\u06a9\u0646 \u0633\u062e\u062a\u200c\u062a\u0631\u06cc \u062f\u0627\u0631\u062f\u2026\u00bb; \u00abPrecision \u06cc\u0639\u0646\u06cc \u062a\u06a9\u0631\u0627\u0631\u067e\u0630\u06cc\u0631\u06cc \u0648 Trueness \u06cc\u0639\u0646\u06cc \u062f\u0631\u0633\u062a \u0628\u0648\u062f\u0646\u2026\u00bb. --reach REACHABLE (#\u0627\u0633\u06a9\u0646_\u0641\u0648\u0644_\u0622\u0631\u0686 4/4, #\u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc 3/3); --sync, --check OK; build_cabinet_papers --check OK"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry sharehub 61 appended at array end, key set = share-60 (type,id,title,caption,author,source,hashtags,keywords,url,pillar); author Dr. Jonathan Ng / source instagram (share-1..6 precedent); 35 lines"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar digital/intraoral-scanning = step 2.4; capsule /pillar/digital/"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathway_place: STRONG implant-prosthetic (150), fixed-pros (110), digital (83). Placed: implant-prosthetic after sharehub/share-56; digital after insight/insight-112 (no milestone). fixed-pros = third full pathway \u2192 not placed (founder-only). ASK candidates not placed. 4.12-\u0628: founder approved 3 MCQs; founder asked to check duplicates in the target pathway: Q3 (error accumulates toward end of arch) duplicates sharehub/share-56 r-question \u00ab\u2026\u062a\u062c\u0645\u0639 \u062e\u0637\u0627\u0647\u0627\u06cc \u06a9\u0648\u0686\u06a9 \u0627\u062a\u0635\u0627\u0644 \u062a\u0635\u0627\u0648\u06cc\u0631 \u062f\u0631 \u0637\u0648\u0644 \u0642\u0648\u0633\u00bb (also dentai-21, insight-51) \u2192 not written; Q1 (Precision) and Q2 (Linear trueness mean) distinct \u2192 written r-ids publish-1/2; validate_exam_questions --content: 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "candidates: bundle-implant-parts \u2192 \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f3: \u0622\u06cc\u062a\u0645 \u062f\u0631\u0628\u0627\u0631\u0647\u0654 \u0642\u0637\u0639\u0627\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0646\u06cc\u0633\u062a\u060c \u0632\u06cc\u0631\u0645\u0648\u0636\u0648\u0639\u06cc \u0627\u0632 \u0627\u06cc\u0646 \u0628\u0627\u0646\u062f\u0644 \u0631\u0627 \u067e\u0631 \u0646\u0645\u06cc\u200c\u06a9\u0646\u062f); bundle-implant-impression \u2192 \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f3: \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0627 insight-112 \u067e\u0648\u0634\u0634 \u062f\u0627\u062f\u0647\u061b \u0627\u06cc\u0646 \u0645\u0637\u0644\u0628 \u0639\u0645\u0642/\u0628\u0647\u200c\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06cc \u0627\u0633\u062a)"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.6: Pulse line, English mirror and the ten-scope lock (built by close)"
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
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-61.html",
      "sharehub/index.html",
      "sharehub/share-60.html",
      "sharehub/share-61.html",
      "sharehub/share61-fig1.webp",
      "sharehub/share61-fig10.webp",
      "sharehub/share61-fig11.webp",
      "sharehub/share61-fig12.webp",
      "sharehub/share61-fig13.webp",
      "sharehub/share61-fig14.webp",
      "sharehub/share61-fig15.webp",
      "sharehub/share61-fig2.webp",
      "sharehub/share61-fig3.webp",
      "sharehub/share61-fig4.webp",
      "sharehub/share61-fig5.webp",
      "sharehub/share61-fig6.webp",
      "sharehub/share61-fig7.webp",
      "sharehub/share61-fig8.webp",
      "sharehub/share61-fig9.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, index.html, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, sharehub/en/share-61.html, sharehub/index.html, sharehub/share-60.html, sharehub/share-61.html, sharehub/share61-fig1.webp, sharehub/share61-fig10.webp, sharehub/share61-fig11.webp, sharehub/share61-fig12.webp, sharehub/share61-fig13.webp, sharehub/share61-fig14.webp, sharehub/share61-fig15.webp, sharehub/share61-fig2.webp, sharehub/share61-fig3.webp, sharehub/share61-fig4.webp, sharehub/share61-fig5.webp, sharehub/share61-fig6.webp, sharehub/share61-fig7.webp, sharehub/share61-fig8.webp, sharehub/share61-fig9.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
