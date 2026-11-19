# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "notecast/episode-45"
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
    "category": "notecast",
    "content_id": "notecast/episode-45",
    "context": {
      "approvals": [],
      "decisions": [
        {
          "decision": "Founder chose \u00abFidelity \u0627\u062c\u0631\u0627 \u0634\u0648\u062f\u00bb after initially saying Fidelity not needed; DES uses the founder's text.",
          "evidence": [
            "AskUserQuestion answer in session"
          ],
          "kind": "fidelity_run_decision"
        },
        {
          "kind": "ledger_order_v2"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "note": "attached paper",
          "ref": "upload:paper.pdf (Pigozzo 2018 JPD)",
          "sha256": "3c35530cba45c065ebf18fde2046adb257a6b9ef2671115585f37f00c1542d92"
        }
      ],
      "pending_questions": [
        {
          "answered": false,
          "message": "M3b",
          "question": "u16 (POPULATION_OR_CONDITION_CHANGED) and u20 (HEDGE_ADDED): \u00ab\u0627\u0635\u0644\u0627\u062d \u06a9\u0646\u00bb / \u00ab\u062e\u0648\u062f\u0645 \u0645\u06cc\u200c\u0646\u0648\u06cc\u0633\u0645\u00bb / \u00ab\u0647\u0645\u06cc\u0646 \u0628\u0645\u0627\u0646\u062f\u00bb",
          "step": "C.4.13"
        }
      ],
      "unrelated_changes": [],
      "validation": [
        {
          "doi": "10.1016/j.prosdent.2017.12.006",
          "evidence": [
            "claude -p --model opus (modelUsage claude-opus-5-5), system prompt .dentcast/des-v3.7-knowledge.md sha256 709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9",
            "Part 3 quotes verbatim, arithmetic 55-8-3=44, band C, schema ok; des_record_guard check ok; verify_publish --des-text ok; lookup found 0 prior records",
            "Part 2d audit-apply exit 0 (6/6 domains agree), audit-system sha256 948e8bf615e5687ec69ab5824b4b604a556666e6c80d03e7736a19effaa53e68, model claude-opus-5-5"
          ],
          "kind": "des_source",
          "result": "RESEARCH THERAPY AMSTAR-2 des_score 44 band C FULL_TEXT provisional false"
        },
        {
          "evidence": [
            "sweeper and judge: claude -p --model opus, separate contexts, modelUsage claude-opus-5-5"
          ],
          "kind": "fidelity",
          "result": "92 HIGH; 10 MATCHES, 2 ALTERED (u16, u20), 1 NOT_IN_SOURCE (u9), 1 AUTHOR_VIEW (u21); judge agreed on all units (no doubtful units); --accept exit 0"
        }
      ]
    },
    "external_actions": [
      {
        "evidence": [
          "drive:1P63CgPgXdN-k2Mqb2E1xvJ0CQ-zwyphq renamed \u00abImmediate versus early loading of single dental implants: A systematic review and meta-analysis.pdf\u00bb, parent 1wS9V79f1QwFUOku04dK9auD9RHcFxyDi (Loading time), 927383 bytes"
        ],
        "id": "C.4.10.1:drive-rename-move",
        "status": "completed",
        "target": "drive:1P63CgPgXdN-k2Mqb2E1xvJ0CQ-zwyphq -> folder 1wS9V79f1QwFUOku04dK9auD9RHcFxyDi (Loading time)"
      }
    ],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read README, global router+5 core sections+audio-hub, agent-parity, publish-checkpoints, modules 01/02 at origin/main 080e7e63"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (founder NoteCast 45 text in chat) + paper file yes (Pigozzo 2018 JPD PDF, sha256 3c35530c...) -> normal publish + step 4.10 all three parts"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed: 626 entries; latest notecast id 44 (/notecast/episode-44.html); key set type,id,title,caption,hashtags,keywords,url,pillar; live PILLARS read; episode-45 brain entry pillar implantology/surgical-planning"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type notecast (founder: \u00ab\u0645\u0646\u062a\u0634\u0631 \u0645\u06cc\u200c\u06a9\u0646\u06cc\u0645 \u0628\u0647 \u0639\u0646\u0648\u0627\u0646 \u0646\u0648\u062a\u06a9\u0633\u062a \u06f4\u06f5\u00bb)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "number 45 (founder-given; max existing notecast 44 + 1, no gap)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text received in founder message (sha256 6eab5a4d original); founder asked accuracy check vs paper; 3 accuracy fixes applied (48h->72h x2 per Methods 'up to 72 hours'; cohort prospective->prospective and retrospective per inclusion criteria) -> text of record sha256 3758ad17"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: founder text reads as his own structured summary; no genuine AI tell requiring rewrite -> \u00ab\u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a\u00bb; text unchanged"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "notecast media: latest notecast entry has no image/audio field; parent audio lives at /episodes/episode-45 (dentcast45.m4a), not asked"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "paper attached: Pigozzo et al 2018 J Prosthet Dent 120:25-34, doi 10.1016/j.prosdent.2017.12.006 (from PDF metadata); step 4.10 active; Drive file found in cabinet root id 1P63CgPgXdN-k2Mqb2E1xvJ0CQ-zwyphq (same 927383 bytes)"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 2 RESEARCH: attached paper with DOI; one source"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary article (\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc), not a challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent-drafted, no-spoiler, title-only: \u00ab\u062e\u0644\u0627\u0635\u0647\u0654 \u0627\u067e\u06cc\u0632\u0648\u062f \u06f4\u06f5 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>\u0645\u0642\u0627\u06cc\u0633\u0647 \u0644\u0648\u062f\u06cc\u0646\u06af \u0641\u0648\u0631\u06cc (Immediate) \u0648 \u0632\u0648\u062f\u0647\u0646\u06af\u0627\u0645 (Early) \u062f\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627\u06cc \u062a\u06a9\u200c\u0648\u0627\u062d\u062f\u06cc</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb (standing acceptance)"
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
        "reason": "not LiteCast (locked category notecast); module 03 step 0 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast (locked category notecast); module 03 step 0 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast (locked category notecast); module 03 step 0 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast (locked category notecast); module 03 step 0 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast (locked category notecast); module 03 step 0 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [
          "template notecast/episode-44.html (previous same-category page), must stay byte-unchanged"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "cloned notecast/episode-44.html structure (CRLF kept); body = text of record (lead = founder's own first paragraph, prose before first ul); title founder's exact heading; caption agent-composed (standing acceptance); domain dentcast.org kept; GA4 once (2 matches = config+src); 2 preconnect w/ crossorigin; no trustseal; dc-notify removed (Phase E marker); no chip row in template; author credit set to doi 10.1016/j.prosdent.2017.12.006 / M\u00f4nica Nogueira Pigozzo"
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
        "reason": "not LiteCast; LiteCast-only internal links step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast; LiteCast-only kavosh step",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar implantology / subtopic surgical-planning: loading-timing protocol (immediate vs early) and insertion torque/primary stability are treatment-protocol decisions at surgery; same as parent episode-45 (episode+notecast one unit); competing: restoration-design (prosthesis delivery) - closer match is surgical-planning"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + /pillar/implantology/ capsules (from clone, pillar swapped)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "notecast/index.html hand-maintained: appended row \u00ab\u062e\u0644\u0627\u0635\u0647\u0654 \u0627\u067e\u06cc\u0632\u0648\u062f \u0686\u0647\u0644\u200c\u0648\u067e\u0646\u062c\u0645 \u2014 <title>\u00bb after episode-44 row, sibling markup"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: datePublished/dateModified/lastReviewed 2026-11-19; visible trustline times 2026-11-19; all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- notecast/episode-44.html succeeded"
        ],
        "id": "C.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "episodes/episode-45.html related block existed without notecast link; added ep-related-link \u00ab\u062e\u0644\u0627\u0635\u0647\u0654 \u0646\u0648\u0634\u062a\u0627\u0631\u06cc \u0627\u06cc\u0646 \u0627\u067e\u06cc\u0632\u0648\u062f\u00bb exactly as episodes/episode-44.html; diff shows only that insertion (+ .author block of 4.5-b)"
        ],
        "id": "C.4.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "neither side has DES record: 4.13 runs once on notecast/episode-45 and sources[] mirrored to episodes/episode-45 right after (episode-44 precedent: scored_at+sources, no fidelity key); credit .author \u00ab\u0646\u0648\u06cc\u0633\u0646\u062f\u0647:\u00bb M\u00f4nica Nogueira Pigozzo -> doi.org/10.1016/j.prosdent.2017.12.006 added on episode before \u00ab\u0645\u062d\u062a\u0648\u0627\u06cc \u0645\u0631\u062a\u0628\u0637\u00bb + .author CSS rule (as episode-44)"
        ],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist-only prev/next step; category notecast",
        "status": "skipped"
      },
      {
        "evidence": [
          "founder-uploaded file found in cabinet root (id 1P63CgPgXdN-k2Mqb2E1xvJ0CQ-zwyphq, 927383 bytes = attached PDF), renamed to verified real title (PubMed 29703670) and moved (no copy) to existing subfolder \u00abLoading time\u00bb (closest semantic match: paper compares loading-timing protocols; competing \u00abimmediate loading\u00bb holds immediate-only papers); receipt C.4.10.1:drive-rename-move; drive_view https://drive.google.com/file/d/1P63CgPgXdN-k2Mqb2E1xvJ0CQ-zwyphq/view"
        ],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "catalog entry P2965 appended (key set = P2964 template incl. authors), topic/topic_path \u00abLoading time\u00bb, tags [immediate-loading, early-loading, loading-protocol, single-implant, single-crown, implant-survival, marginal-bone-loss, insertion-torque, partially-edentulous, systematic-review, meta-analysis, topic:loading-time, immediate-versus-early-loading-single-dental-implants-systematic-review], tag_index +1 each (new title tag 1), total_papers 2129->2130; doi 10.1016/j.prosdent.2017.12.006 (PubMed 29703670); drive_id 1P63CgPgXdN-k2Mqb2E1xvJ0CQ-zwyphq; 2130 papers <2200 so \u00ab\u0628\u06cc\u0634 \u0627\u0632 \u06f2\u06f1\u06f0\u06f0\u00bb unchanged; step 9 full-text enrichment: proposer Sonnet (Agent, own context) + judge Opus (Agent, own context): ft_tags cumulative-survival-rate accepted, randomized-controlled-trial rejected, doc_class systematic_review, catalog_type_ok; key_finding/clinical_bottom_line filled from run; coverage --check green; step 8 bridge reachability deferred to 5.0 per module"
        ],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DOI 10.1016/j.prosdent.2017.12.006 + first author M\u00f4nica Nogueira Pigozzo from PDF metadata, cross-checked PubMed 29703670 (title/journal/year match); NoteCast credit follows its own type precedent (notecast-44 \u00ab\u0645\u0646\u0628\u0639 \u0639\u0644\u0645\u06cc:\u00bb .author block) linking doi.org; no isBasedOn CreativeWork in notecast template (isBasedOn is the episode URL, kept); episode-45 mirror credit added at 4.5-b"
        ],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
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
      ".dentcast/cabinet-enrichment/results.jsonl",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast_cabinet_enrichment.json",
      "dentcast_cabinet_full_catalog.json",
      "episodes/episode-45.html",
      "glossary/glossary.json",
      "index.html",
      "notecast/en/episode-45.html",
      "notecast/episode-45.html",
      "notecast/index.html",
      "plus/cabinet-bridge.json",
      "plus/cabinet-papers.json",
      "plus/cabinet-search.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: notecast/episode-45.html, notecast/index.html, episodes/episode-45.html, dentcast_cabinet_full_catalog.json, .dentcast/cabinet-enrichment/results.jsonl, dentcast_cabinet_enrichment.json, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
