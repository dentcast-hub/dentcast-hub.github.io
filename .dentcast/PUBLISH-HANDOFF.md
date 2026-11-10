# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-47"
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
    "content_id": "sharehub/share-47",
    "context": {
      "approvals": [
        {
          "decision": "\u0627\u06a9\u0644\u0648\u0698\u0646 \u062f\u0631 \u062a\u0631\u0645\u06cc\u0645\u200c\u0647\u0627\u06cc \u0633\u0627\u062f\u0647\u061b \u0642\u0628\u0644 \u0627\u0632 \u062a\u0631\u0627\u0634 \u0686\u0647 \u0686\u06cc\u0632\u06cc \u0631\u0627 \u0628\u0627\u06cc\u062f \u0628\u062f\u0627\u0646\u06cc\u0645\u061f",
          "evidence": [
            "founder data: first line of founder message (Hard Rule 16, copied verbatim)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0645\u0639\u0645\u0648\u0644\u0627\u064b \u0627\u06a9\u0644\u0648\u0698\u0646 \u0631\u0627 \u0628\u0639\u062f \u0627\u0632 \u062a\u0631\u0645\u06cc\u0645 \u0628\u0627 \u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646 \u0686\u06a9 \u0645\u06cc\u200c\u06a9\u0646\u06cc\u0645. \u0627\u0645\u0627 \u0648\u0642\u062a\u06cc \u0648\u0636\u0639\u06cc\u062a \u0642\u0628\u0644 \u0627\u0632 \u062a\u0631\u0627\u0634 \u0631\u0627 \u062b\u0628\u062a \u0646\u06a9\u0631\u062f\u0647\u200c\u0627\u06cc\u0645\u060c \u0646\u062a\u06cc\u062c\u0647 \u0631\u0627 \u0628\u0627 \u0686\u0647 \u0686\u06cc\u0632\u06cc \u0645\u0642\u0627\u06cc\u0633\u0647 \u0645\u06cc\u200c\u06a9\u0646\u06cc\u0645\u061f",
          "evidence": [
            "agent proposal under standing acceptance (Hard Rule 14); listed in Push-2 report"
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
          "decision": "Founder: crop the paper figures as WebP without captions and place them at the relevant spots; Fidelity rerun not required (founder command). 12 embedded figures (Fig 1a,1b,3,5,11,13a,14d,15e,22a,22b,24a,24b) extracted at native size (no upscaling), WebP, no figcaption, inserted after the matching paragraphs on fa page and en mirror. Text units unchanged: des_fidelity_units --accept on the stored voted result exit 0; no model rerun.",
          "evidence": [
            "chat:founder-message-2026-11-10",
            "des_fidelity_units --accept exit 0 after figure insertion"
          ],
          "kind": "founder_instruction",
          "scope": "add paper figures to share-47"
        },
        {
          "decision": "Founder approved all 3 exam questions (\u0647\u0631 \u0633\u0647 \u0633\u0648\u0627\u0644 \u062a\u0627\u06cc\u06cc\u062f); written to plus/exam-questions.json byContent[sharehub/share-47] ids r-cbfd9fab, r-3425385d, r-6611ddee",
          "evidence": [
            "chat:founder-message-2026-11-10 \u00ab\u0647\u0631 \u0633\u0647 \u0633\u0648\u0627\u0644 \u062a\u0627\u06cc\u06cc\u062f\u00bb"
          ],
          "kind": "m2_answer",
          "step": "C.5.6"
        },
        {
          "evidence": [
            "founder text sha256 438af9b2 opens the body; no agent lead added"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "chat:founder-text (first body paragraph \u00ab\u0645\u0627 \u0645\u0639\u0645\u0648\u0644\u0627\u064b \u0628\u0639\u062f \u0627\u0632 \u062a\u0645\u0627\u0645\u200c\u0634\u062f\u0646 \u062a\u0631\u0645\u06cc\u0645 \u06cc\u0627 \u0631\u0648\u06a9\u0634\u060c ...\u00bb)"
        },
        {
          "english": {
            "evidence": [
              "en mirror on disk, 42 blocks = fa, 12 figures, toggle ../share-47.html"
            ],
            "path": "sharehub/en/share-47.html",
            "status": "ready"
          },
          "evidence": [
            "all founder messages closed (M2 answered; no M1, no M3b)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13 DES 4/E + Fidelity 100 HIGH stored, accept exit 0, audit agree; no M3b"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Q4.9 \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc; C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "C.2.4 occlusion/occlusal-analysis-adjustment; C.5.5 verified"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 0 backlinks (borderline), C.4.8 3 inline, C.4.9 3 capsules at cap 5/5"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 7 canonical tags, 1 mint #\u0631\u0648\u06cc\u06a9\u0631\u062f_\u06a9\u0627\u0646\u0641\u0648\u0631\u0645\u062a\u06cc\u0648, --check ok"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5 brain entry appended; faq-corpus FAQ+flashcards; cabinet P2955"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6 fixed-pros + occlusion; 3 exam questions approved M2; C.5.6-b no bundle"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html Pulse: new top line for share-47, bottom plak1-13 line removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "sharehub/en/share-47.html authored from locked text, noindex, toggles inverse"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title founder data; caption standing acceptance; M2 approved; figures per founder instruction"
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
          "note": "founder text as submitted",
          "ref": "chat:founder-text",
          "sha256": "438af9b2524b157cf6c7a362c7790068e3cdab7d300b3b3980e98feae6533ee9"
        },
        {
          "note": "attached paper (Davies, Gray, Smith 2001 BDJ)",
          "ref": "chat-upload:Good_occlusal_practice_in_simple_restorative_dentistry.pdf",
          "sha256": "2092b5108aa8b13ad3dbd3aee3d0a76533cc22d5b5c65166faaa35167b5f50a7"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "audit_2d": {
            "exit": 0,
            "model": "claude-opus-5-5",
            "status": "agree",
            "system_prompt_sha256": "948e8bf615e5687ec69ab5824b4b604a556666e6c80d03e7736a19effaa53e68"
          },
          "content_id": "sharehub/share-47",
          "des": {
            "band": "E",
            "content_type": "RESEARCH",
            "des_score": 4,
            "des_version": "3.7",
            "multiplier": 0.3,
            "penalty": "no COI statement -1",
            "provisional": false,
            "question_type": "THERAPY",
            "s_design": 15
          },
          "fidelity": {
            "accept": "des_fidelity_units --accept exit 0",
            "result": "62/62 assessable MATCHES, 2 NOT_IN_SOURCE (u43,u62), 1 AUTHOR_VIEW (u74), score 100 level HIGH",
            "runs": "2 full checker runs claude-sonnet-5-5 (separate empty-dir processes) + 1 tie-break on u33,u43",
            "vote": "no flagged unit; no reviewer call owed; no orphan sweep (single source)"
          },
          "kind": "des_fidelity_c4_13",
          "lookup": "des_record_guard lookup: 0 records -> newly scored",
          "m3b": "none (no ALTERED/REVERSED)",
          "part3": "quotes/arithmetic/band/schema ok; des_record_guard check ok; verify_publish --des-text ok",
          "part3_6": "interpretation_fa sentences 3-4 narrowed to text-supported claims (agent, before/after in run notes)",
          "source": "10.1038/sj.bdj.4801185",
          "source_call": {
            "cmd": "claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md --tools \"\" --model opus (empty dir)",
            "model": "claude-opus-5-5",
            "spec_sha256": "709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9"
          },
          "source_text_origin": "attached PDF via poppler pdftotext reading-order mode + page furniture/references stripped; tools/pdf_source_text.py rejected because both backends interleaved columns (~240/675 lines) on this BDJ 3-column layout; source_conclusion pinned to guideline 7 (EDEC)",
          "text_basis": "FULL_TEXT (attached PDF per founder instruction)"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "rules-read: README/global(3 pages)/agent-parity/publish-checkpoints/01/02 complete @4dcd8ae1; capability precheck: ls-remote OK, push to ccr-* branch expected OK, Actions monitoring+PR+merge via GitHub MCP, isolated contexts via Agent tool and claude -p present"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase0: text=yes, paper file=yes (PDF attached) -> normal publish + step 4.10 three parts"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "PhaseA: brain parsed (601 entries); latest sharehub id=46 /sharehub/share-46.html keys type,id,title,caption,author,source,hashtags,keywords,url,pillar; live PILLARS read from tools/build_pillar.py"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q1: single-paper reading -> sharehub (repo-conventions: a single- or multi-paper reading is sharehub); locked"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q2: next number share-47 (max 46 +1, no gap)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3: full text supplied in founder message (input chat:founder-text sha 438af9b2)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5: text reads human/natural; no AI-tell rewrites. Two orthographic fixes only (standing acceptance, listed in Push-2 report): '\u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646\u0647\u0627\u06cc' -> '\u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646\u200c\u0647\u0627\u06cc' (ZWNJ) and typo '\u0631\u06cc\u062a\u0648\u0631\u06cc\u0634\u0646\u0647\u0627\u06cc' -> '\u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646\u200c\u0647\u0627\u06cc'. All other sentences byte-identical. Founder title copied verbatim."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4: sharehub media = optional in-page figures (share-41 has none); founder supplied no image -> page without figures; no audio/video fields in sharehub schema"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.7: paper attached (Good_occlusal_practice_in_simple_restorative_dentistry.pdf, sha 2092b510) -> step 4.10 ACTIVE; founder says paper is also in Google Drive cabinet; DOI resolved via PubMed PMID 11697598 -> 10.1038/sj.bdj.4801185"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.8: basket 2 RESEARCH, one determinate source: attached paper DOI 10.1038/sj.bdj.4801185; founder instructs to use the attached PDF for DES and Fidelity (FULL_TEXT)"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.9: \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (plain article reading; not a question post)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q5: no founder Pulse sentence; agent drafts in sharehub's established pattern, title-only link (standing acceptance) at C.6"
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
        "reason": "not LiteCast (locked category sharehub); module 03 step 0 applies only to LiteCast",
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
          "C.1: template = sharehub/share-46.html (previous same-category page), enrolled in target_paths"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.2: sharehub/share-47.html cloned from share-46 (structure, CSS, JSON-LD shape); body = text of record (42 blocks, 6 founder section headings as h3 per share-40 precedent); domain dentcast.org kept; GA4 once; 2 preconnect crossorigin; no trustseal; no figures (none supplied); body opens with founder's own paragraph (no list before it); refs block: Davies \u0648 \u0647\u0645\u06a9\u0627\u0631\u0627\u0646\u060c Br Dent J\u060c \u06f2\u06f0\u06f0\u06f1 -> https://doi.org/10.1038/sj.bdj.4801185 (founder: link display name to DOI); sharehub pages carry no hashtag chip row; caption agent-composed (standing acceptance)"
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
        "reason": "not LiteCast; LiteCast-only in-body linking (module 03 0.5)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast; LiteCast-only related links (module 03 0.6)",
        "status": "skipped"
      },
      {
        "evidence": [
          "C.2.4: pillar.primary=occlusion (one clear fit: occlusal management in routine restorations); subtopic=occlusal-analysis-adjustment (examining/recording contacts before prep, checking after; closest match; competitor occlusal-scheme-guidance rejected - paper is about conforming to existing scheme, not choosing one); standing acceptance"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.2.5: dc-related-section with 2 capsules: /glossary/ + /pillar/occlusion/ (typed brain entry branch); 2/5 used"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.2.6: sharehub/index.html hand-maintained; added <li> share-47 newest-first, sibling label pattern '<title> (\u0645\u0637\u0644\u0628\u06cc \u0627\u0632 \u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646)'"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.3 date audit: datePublished 2026-11-04->2026-11-10 OK, dateModified ->2026-11-10 OK; no visible body date in template; canonical/og:url/hreflang -> share-47 OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4: git diff --quiet -- sharehub/share-46.html -> clean (template untouched)"
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
        "reason": "not NoteCast; parent-episode update is NoteCast-only",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "neither NoteCast nor core episode; episode/NoteCast mirror inapplicable",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "sharehub is not a numbered series; previous page has no ep-nav block",
        "status": "skipped"
      },
      {
        "evidence": [
          "C.4.10.1: founder already filed the PDF in the cabinet: Drive file 14oNKMq1t1ba61b6iZhno762SA1IjRGN0 'Good occlusal practice in simple restorative dentistry.pdf' (real title already), 417188 bytes = attached upload byte size, parent = existing subfolder 'Occlusion' (1pcawf1jOJ14ZyVobSzJkbigBJbeT08U3, child of cabinet 1iDwq4Uj-y7_FO99-QW1Th0hVRN5yfk9f) = semantic best match; no rename/move/upload needed, no Drive write performed; drive:14oNKMq1t1ba61b6iZhno762SA1IjRGN0"
        ],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4.10.2: catalog entry P2955 appended (key set = latest entry incl. authors), topic/topic_path Occlusion, DOI 10.1038/sj.bdj.4801185 (PubMed PMID 11697598, title/journal/year cross-checked with PDF), journal British Dental Journal 2001, drive_id 14oNKMq1t1ba61b6iZhno762SA1IjRGN0, linked_episodes [sharehub/share-47]; tags occlusion, conformative-approach(new), occlusal-analysis, occlusal-adjustment, centric-occlusion, jaw-relation-record, occlusal-interference, provisional-restoration, crown, narrative-review, topic:occlusion, good-occlusal-practice-simple-restorative-dentistry(title tag); tag_index kept exact (+1/new), total_papers 2164->2165 (= len(papers)); other scan counters untouched (do not track array); paper count 2165 < 2200 so \u06f2\u06f1\u06f0\u06f0 copy unchanged; reachability deferred to step 5.0 per item 8"
        ],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4.10.3: first author S. J. Davies (PDF byline + PubMed) linked to https://doi.org/10.1038/sj.bdj.4801185 in .author block under body (single-paper sharehub precedent share-41/43); founder's source line rendered as this DOI credit; .author CSS present; template has no isBasedOn; site author-note kept"
        ],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4.13: DES record + Fidelity stored in plus/des-scores.json[sharehub/share-47] (DES 4/E RESEARCH THERAPY FULL_TEXT; Fidelity 100 HIGH, accept exit 0, audit agree); no M3b; details in context.validation des_fidelity_c4_13"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4.7: fresh semantic review of 109 glossary terms; candidates centric-relation, tmd, canine-guidance, group-function, bruxism, occlusal-splint, tooth-wear: all borderline/tangential (article is about conforming restorations to existing occlusion; CR/TMD only named as limits of the approach) -> conservative default, 0 back-links added"
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
        "reason": "4.7-\u0628: skipped \u2014 not a glossary publish",
        "status": "skipped"
      },
      {
        "evidence": [
          "C.4.8: applied 3 inline links (first occurrence): '\u06a9\u0627\u063a\u0630 \u0622\u0631\u062a\u06cc\u06a9\u0648\u0644\u0627\u0633\u06cc\u0648\u0646' -> /insight/insight-1.html (articulating paper itself); 'CR' -> /glossary/centric-relation.html (technical CR->CO); '\u0627\u062e\u062a\u0644\u0627\u0644\u0627\u062a \u0639\u0636\u0644\u0627\u062a \u0648 \u0645\u0641\u0635\u0644 \u0641\u06a9\u06cc' -> /glossary/tmd.html. Skipped borderline: '\u067e\u0627\u0631\u0627\u0641\u0627\u0646\u06a9\u0634\u0646'->bruxism (not identical concept), '\u062a\u0631\u0645\u06cc\u0645 \u06a9\u0648\u062a\u0627\u0647'->insight-103/104 (looser). Fidelity --accept re-run exit 0 (units unchanged)"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4.9: section had 2/5 (capsules); added 3 strongest: insight-8 \u00ab\u062a\u062f\u0627\u062e\u0644 \u067e\u0627\u06cc\u062f\u0627\u0631 \u0628\u062f\u0648\u0646 \u0639\u0644\u0627\u0645\u062a\u00bb (leave stable occlusion alone), insight-103 \u00ab\u0627\u0635\u0644\u0627\u062d \u0627\u06a9\u0644\u0648\u0698\u0646 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u06a9\u0648\u062a\u0627\u0647\u00bb (short restorations + bite registration + lab), insight-65 \u00ab\u0686\u06a9 \u0627\u06a9\u0644\u0648\u0698\u0646 \u0628\u0639\u062f \u0627\u0632 \u0633\u0645\u0627\u0646 \u0645\u062c\u062f\u062f\u00bb (check after cementation); now 5/5 at cap (related_cap.py). Not added (no slot / weaker): insight-104, insight-100, video-2, share-21, insight-94, episode-131"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4.11: plus/faq-corpus.json byContent[sharehub/share-47].definedTermSets: 5 authored DefinedTerms #flashcards-c1..c5 (\u0631\u0648\u06cc\u06a9\u0631\u062f Conformative, Reorganised Approach, \u062a\u0631\u062a\u06cc\u0628 EDEC, Model Grooming, FGP); none copied from FAQ answers; no page JSON-LD"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.4.12: FAQPage #faq with 5 standalone yes/no questions (no deixis), each answer opens with verdict (4 \u062e\u06cc\u0631, 1 \u0628\u0644\u0647) -> 5 binary quiz questions; 4.12-\u0628 evaluated at 5.6"
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
        "reason": "Question 4.9: \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc, not a \u0686\u0627\u0644\u0634; no challenge markup",
        "status": "skipped"
      },
      {
        "evidence": [
          "C.5.0: questions (5) in batch note; tags #\u0645\u0631\u0648\u0631_\u0645\u0646\u0627\u0628\u0639 (series) #\u0631\u0648\u06cc\u06a9\u0631\u062f_\u06a9\u0627\u0646\u0641\u0648\u0631\u0645\u062a\u06cc\u0648 (MINTED, decision-level, batch .dentcast/hashtag-batches/share-47-conformative.json, aliases conformative approach/conformative/\u06a9\u0627\u0646\u0641\u0631\u0645\u0627\u062a\u06cc\u0648/\u062d\u0641\u0638 \u0627\u06a9\u0644\u0648\u0698\u0646 \u0645\u0648\u062c\u0648\u062f \u0628\u06cc\u0645\u0627\u0631; '\u06a9\u0627\u0646\u0641\u0648\u0631\u0645\u062a\u06cc\u0648' auto-dropped as contained in target) #\u0627\u06a9\u0644\u0648\u0698\u0646 (umbrella) #\u062b\u0628\u062a_\u0631\u0627\u0628\u0637\u0647 #\u0627\u0631\u062a\u0628\u0627\u0637_\u0628\u0627_\u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 #\u0631\u0648\u06a9\u0634_\u0645\u0648\u0642\u062a #\u062a\u0646\u0638\u06cc\u0645_\u0627\u06a9\u0644\u0648\u0698\u0646 (reused); composition gate ok (decision tag + specific \u226410: \u062b\u0628\u062a_\u0631\u0627\u0628\u0637\u0647 4, \u0627\u0631\u062a\u0628\u0627\u0637_\u0628\u0627_\u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 4); resolving sentences recorded; bridge row '\u0631\u0648\u06cc\u06a9\u0631\u062f \u06a9\u0627\u0646\u0641\u0648\u0631\u0645\u062a\u06cc\u0648'->[conformative-approach, occlusion] + tooth_topics; P2955 reachable: byTag \u0631\u0648\u06cc\u06a9\u0631\u062f \u06a9\u0627\u0646\u0641\u0648\u0631\u0645\u062a\u06cc\u0648 #1, \u062b\u0628\u062a \u0631\u0627\u0628\u0637\u0647 #1, \u062a\u0646\u0638\u06cc\u0645 \u0627\u06a9\u0644\u0648\u0698\u0646 #3, \u0631\u0648\u06a9\u0634 \u0645\u0648\u0642\u062a #9; --sync ok, hashtag --check ok, build_cabinet_papers --check ok; reachability: page 4th under \u062b\u0628\u062a \u0631\u0627\u0628\u0637\u0647 and \u0627\u0631\u062a\u0628\u0627\u0637 \u0628\u0627 \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 (Q1,Q4 pass), only page under \u0631\u0648\u06cc\u06a9\u0631\u062f \u06a9\u0627\u0646\u0641\u0648\u0631\u0645\u062a\u06cc\u0648; content-index/assistant-tags reverted (runner C.8); sharehub pages carry no chip row"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.5: brain entry appended at end of array (sharehub id 47, key set/order = share-46 entry), hashtags = 5.0 list, keywords 10 (same as page JSON-LD), pillar occlusion/occlusal-analysis-adjustment"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.5.5: brain pillar = step 2.4 (occlusion / occlusal-analysis-adjustment); capsule /pillar/occlusion/ matches; no new subtopic"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.5.6: pathway_place --insert into fixed-pros (STRONG, after insight/insight-44) and occlusion (semantic unmistakable home, tool ASK, after insight/insight-103); not placed (borderline): biomimetic, esthetic, implant-prosthetic, post-and-core, treatment-planning, ceramics; coverage 1.51 per item (baseline 1.38); 4.12-\u0628: 3 MCQs approved in M2 and written (r-cbfd9fab, r-3425385d, r-6611ddee), validate_exam_questions 0 errors (9 pre-existing warnings unrelated)"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.5.6-\u0628: candidates bundle-occlusion-rehab -> \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f3: rehab/VD/scheme bundle, this simple-restoration conformative piece fills no core gap; also \u06af\u06cc\u062a \u06f5: 8 steps -> 9); bundle-crown-prep -> \u0631\u062f \u0634\u062f (\u0646\u0627\u0645\u0637\u0645\u0626\u0646\u060c \u06af\u06cc\u062a \u06f2/\u06f3: title is a question not a whole-concept name; occlusion recording is not a prep/impression core gap); no bundle edit, home-bundles.js untouched"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.6: Pulse line inserted at top of index.html dc-pulse-list (\u00ab\u06cc\u06a9 \u0645\u0631\u0648\u0631 \u0645\u0646\u0627\u0628\u0639 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab\u2026\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f.\u00bb, title-only link text), bottom plak1-13 line removed; en mirror + toggles; ten-scope editorial lock recorded"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/hashtag-batches/share-47-conformative.json",
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
      "sharehub/en/share-47.html",
      "sharehub/index.html",
      "sharehub/share-46.html",
      "sharehub/share-47.html",
      "sharehub/share47-fig1.webp",
      "sharehub/share47-fig10.webp",
      "sharehub/share47-fig11.webp",
      "sharehub/share47-fig12.webp",
      "sharehub/share47-fig2.webp",
      "sharehub/share47-fig3.webp",
      "sharehub/share47-fig4.webp",
      "sharehub/share47-fig5.webp",
      "sharehub/share47-fig6.webp",
      "sharehub/share47-fig7.webp",
      "sharehub/share47-fig8.webp",
      "sharehub/share47-fig9.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: sharehub/share-47.html, sharehub/en/share-47.html, dentcast-brain.json, dentcast-hashtag-reference.json, index.html, plus/cabinet-bridge.json, plus/cabinet-papers.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, .dentcast/hashtag-batches/share-47-conformative.json, sharehub/share47-fig1.webp, sharehub/share47-fig10.webp, sharehub/share47-fig11.webp, sharehub/share47-fig12.webp, sharehub/share47-fig2.webp, sharehub/share47-fig3.webp, sharehub/share47-fig4.webp, sharehub/share47-fig5.webp, sharehub/share47-fig6.webp, sharehub/share47-fig7.webp, sharehub/share47-fig8.webp, sharehub/share47-fig9.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
