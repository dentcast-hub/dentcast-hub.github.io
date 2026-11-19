# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "notecast/episode-45"
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
    "category": "notecast",
    "content_id": "notecast/episode-45",
    "context": {
      "approvals": [
        {
          "decision": "\u0645\u0642\u0627\u06cc\u0633\u0647 \u0644\u0648\u062f\u06cc\u0646\u06af \u0641\u0648\u0631\u06cc (Immediate) \u0648 \u0632\u0648\u062f\u0647\u0646\u06af\u0627\u0645 (Early) \u062f\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627\u06cc \u062a\u06a9\u200c\u0648\u0627\u062d\u062f\u06cc",
          "evidence": [
            "founder text heading line 2, copied (Hard Rule 16)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u062e\u0644\u0627\u0635\u0647\u200c\u0627\u06cc \u0627\u0632 \u062f\u0646\u062a\u200c\u06a9\u0633\u062a \u0628\u0631 \u0627\u0633\u0627\u0633 \u0645\u0631\u0648\u0631 \u0646\u0638\u0627\u0645\u200c\u0645\u0646\u062f Pigozzo \u0648 \u0647\u0645\u06a9\u0627\u0631\u0627\u0646 (\u06f2\u06f0\u06f1\u06f8)\u061b \u0645\u0642\u0627\u06cc\u0633\u0647\u0654 \u0628\u0642\u0627 \u0648 \u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0645\u0627\u0631\u062c\u06cc\u0646\u0627\u0644 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627\u06cc \u062a\u06a9\u200c\u0648\u0627\u062d\u062f\u06cc \u062f\u0631 \u062f\u0648 \u067e\u0631\u0648\u062a\u06a9\u0644 Immediate \u0648 Early Loading.",
          "evidence": [
            "agent-composed caption, standing acceptance (Hard Rule 14)"
          ],
          "scope": "caption",
          "status": "confirmed"
        }
      ],
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
        },
        {
          "decision": "u16 \u00ab\u0627\u0635\u0644\u0627\u062d \u06a9\u0646\u00bb (added \u00ab\u062f\u0631 \u0635\u0648\u0631\u062a \u06af\u0634\u062a\u0627\u0648\u0631 \u062c\u0627\u06cc\u200c\u06af\u0630\u0627\u0631\u06cc \u0628\u0627\u0644\u0627\u060c\u00bb); u20 \u00ab\u0627\u0635\u0644\u0627\u062d \u06a9\u0646\u00bb (\u00ab\u0627\u062d\u062a\u0645\u0627\u0644 \u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0628\u06cc\u0634\u062a\u0631 \u062f\u0631 \u06f3\u06f0 \u0631\u0648\u0632 \u0627\u0648\u0644 \u0648\u062c\u0648\u062f \u062f\u0627\u0631\u062f\u00bb -> \u00ab\u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u062f\u0631 \u06f3\u06f0 \u0631\u0648\u0632 \u0627\u0648\u0644 \u0628\u0627 \u0634\u062f\u062a \u0628\u06cc\u0634\u062a\u0631\u06cc \u0631\u062e \u0645\u06cc\u200c\u062f\u0647\u062f\u00bb); re-check of u16,u20 only (--vote --base): both MATCHES, judge agreed; fidelity 92 HIGH -> 100 HIGH (12/12)",
          "evidence": [
            "AskUserQuestion M3b answers in session",
            "des_fidelity_units --accept exit 0 on fid2/voted-src0.json"
          ],
          "kind": "m3b_answers"
        },
        {
          "evidence": [
            "notecast/episode-45.html first <p> = founder text line 3"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder text first paragraph \u00ab\u062f\u0631 \u0627\u06cc\u0646 \u0642\u0633\u0645\u062a \u0628\u0647 \u0628\u0631\u0631\u0633\u06cc \u06cc\u06a9 \u0645\u0642\u0627\u0644\u0647 \u0645\u0631\u0648\u0631 \u0646\u0638\u0627\u0645\u200c\u0645\u0646\u062f \u2026\u00bb opens the body before the first ul"
        },
        {
          "decision": "M2: both exam questions \u00ab\u062a\u0623\u06cc\u06cc\u062f\u00bb (r-ids appended under notecast/episode-45)",
          "evidence": [
            "AskUserQuestion M2 answers in session"
          ],
          "kind": "m2_exam_answers"
        },
        {
          "decision": "founder: paper and DES belong to both episode-45 and notecast-45, linked both ways like older pairs; episode gets DES only; merge at end. Catalog P2965 linked_episodes now [notecast/episode-45, episodes/episode-45] (notecast-44/P2950 precedent)",
          "evidence": [
            "founder message in session"
          ],
          "kind": "founder_request_pair"
        },
        {
          "english": {
            "evidence": [
              "en page on disk, noindex, toggle ../episode-45.html"
            ],
            "path": "notecast/en/episode-45.html",
            "status": "ready"
          },
          "evidence": [
            "session ledger C.0-C.5.6-b"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13 DES 44/C + Fidelity 100 (M3b applied); founder accuracy fixes at B.3"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Q4.9 ordinary article; C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "C.2.4 implantology/surgical-planning"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 0 (cap), C.4.8 2 glossary anchors, C.4.9 2 capsules, episode<->notecast links both ways"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 six canonical tags, --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5 brain entry id 45; catalog P2965 linked to both pages"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6 implant-surgical after episodes/episode-45; M2 2 questions approved; C.5.6-b bundle rejected gate 4"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.6 pulse line inserted at top, oldest (insight-111) removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "notecast/en/episode-45.html authored from locked text; toggles inverse"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "M3b u16/u20 \u0627\u0635\u0644\u0627\u062d \u06a9\u0646; M2 both \u062a\u0623\u06cc\u06cc\u062f; title founder, caption standing acceptance"
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
          "note": "attached paper",
          "ref": "upload:paper.pdf (Pigozzo 2018 JPD)",
          "sha256": "3c35530cba45c065ebf18fde2046adb257a6b9ef2671115585f37f00c1542d92"
        }
      ],
      "pending_questions": [],
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
        "evidence": [
          "DES: lookup 0 prior; SOURCE run claude -p opus (claude-opus-5-5), spec sha256 709be964\u2026; RESEARCH THERAPY AMSTAR-2 44 C FULL_TEXT non-provisional; Part 3 (1)-(4),(6),(7) green; Part 2d audit exit 0. Fidelity: sweeper+judge separate opus contexts, single source no orphan sweep; M3b u16/u20 \u00ab\u0627\u0635\u0644\u0627\u062d \u06a9\u0646\u00bb applied, re-check only those units; final 100 HIGH 12/12, u9 NOT_IN_SOURCE (conventional-loading definition, author background), u21 AUTHOR_VIEW; --accept exit 0; stored notecast/episode-45 {scored_at,sources,fidelity}; mirror episodes/episode-45 {scored_at,sources} (no fidelity, audio episode); save point pushed 3b6e276e"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "fresh semantic review of 110 glossary terms: strong implant-loading, osseointegration; borderline implant-supported-crown, dental-implant, zero-bone-loss (not linked); all strong candidates at cap 5/5 (related_cap.py: implant-loading, osseointegration, implant-supported-crown each 5/5, and implant-loading/osseointegration already link /episodes/episode-45.html) -> 0 back-links added"
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
        "reason": "4.7-\u0628: skipped \u2014 not a glossary publish (category notecast)",
        "status": "skipped"
      },
      {
        "evidence": [
          "inline glossary-link anchors on first qualifying occurrence: \u00ab\u0632\u0645\u0627\u0646 \u062a\u062d\u0648\u06cc\u0644 \u067e\u0631\u0648\u062a\u0632\u00bb (u8, loading-timing concept) -> /glossary/implant-loading.html; \u00abOsseointegration\u00bb (u9, technical) -> /glossary/osseointegration.html; borderline skipped: \u00ab\u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0645\u0627\u0631\u062c\u06cc\u0646\u0627\u0644\u00bb -> notecast/episode-26 (reader goes there via 4.9 instead), \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb generic; text unchanged (--accept still exit 0)"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "section had 3/5 (2 nav + episode-45 audio capsule); 2 free slots: added notecast/episode-26 \u00ab\u0632\u0645\u0627\u0646 \u0644\u0648\u062f \u0648 \u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0645\u0627\u0631\u062c\u06cc\u0646\u0627\u0644\u00bb (loading timing vs MBL, strongest) and insight/insight-82 \u00ab\u0644\u0648\u062f \u0641\u0648\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062c\u0627\u06cc\u06af\u0632\u06cc\u0646\u00bb (immediate-loading decision); borderline skipped: episodes/episode-130-1 early failure, episodes/episode-59 MBL factors, sharehub/share-9; now 5/5 at cap"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent['notecast/episode-45'].definedTermSets: 5 DefinedTerm #flashcards-c1..c5 (c1 faq#2, c2 faq#3, c4 faq#4, c5 faq#5, c3 authored); skipped faq#0/#1 as comparison-shaped (Immediate vs Early outcome comparisons); descriptions rewritten as standalone concepts, not FAQ answers; nothing in page JSON-LD; builder runs in runner C.8"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage #faq with 6 standalone questions (no deixis); binary: #0 \u00ab\u062e\u06cc\u0631\u061b\u00bb, #1 \u00ab\u062e\u06cc\u0631\u061b\u00bb, #4 \u00ab\u062e\u06cc\u0631\u061b\u00bb -> 3 scored; #2,#3 definitions and #5 factors are open (excluded from bank, kept for cards); 4.12-\u0628: evaluated at 5.6"
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
        "reason": "not a Challenge (Q4.9 ordinary article)",
        "status": "skipped"
      },
      {
        "evidence": [
          "questions: \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062a\u06a9 \u0631\u0648 \u0627\u06cc\u0645\u06cc\u062f\u06cc\u062a \u0644\u0648\u062f \u06a9\u0646\u0645 \u06cc\u0627 \u0627\u0631\u0644\u06cc\u061f\u00bb, \u00abimmediate loading \u0628\u0642\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0648 \u06a9\u0645 \u0645\u06cc\u200c\u06a9\u0646\u0647\u061f\u00bb, \u00ab\u0628\u0631\u0627\u06cc \u0644\u0648\u062f \u0641\u0648\u0631\u06cc \u0686\u0647 \u062a\u0648\u0631\u06a9\u06cc \u0644\u0627\u0632\u0645\u0647\u061f\u00bb, \u00ab\u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0645\u0627\u0631\u062c\u06cc\u0646\u0627\u0644 \u0628\u0639\u062f \u0627\u0632 \u0644\u0648\u062f \u0641\u0648\u0631\u06cc \u0628\u06cc\u0634\u062a\u0631\u0647\u061f\u00bb; all reused, 0 minted: #\u062e\u0644\u0627\u0635\u0647_\u0627\u067e\u06cc\u0632\u0648\u062f (series), #\u0632\u0645\u0627\u0646_\u0644\u0648\u062f_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a (decision; u23), #\u062b\u0628\u0627\u062a_\u0627\u0648\u0644\u06cc\u0647 (specific 5\u21926; u18/u23), #\u062a\u062d\u0644\u06cc\u0644_\u0627\u0633\u062a\u062e\u0648\u0627\u0646_\u06a9\u0631\u0633\u062a\u0627\u0644 (u17), #\u0628\u0642\u0627\u06cc_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a (specific 3\u21924; u16), #\u0627\u06cc\u0645\u067e\u0644\u0646\u062a (umbrella); --sync + --check OK; paper P2965 reachable via existing bridge rows \u00ab\u0632\u0645\u0627\u0646 \u0644\u0648\u062f \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb and \u00ab\u062b\u0628\u0627\u062a \u0627\u0648\u0644\u06cc\u0647\u00bb (byTag rank 0), build_cabinet_papers --check OK, no bridge edit; reachability: page in first 4 of chip \u00ab\u0628\u0642\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb; content-index/assistant-tags reverted for runner"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry appended at array end: type notecast, id 45, keys = notecast-44 key set/order, url /notecast/episode-45.html, pillar implantology/[]/surgical-planning, canonical hashtags from 5.0, 10 English keywords (notecast precedent)"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar recorded = step 2.4 decision (implantology/surgical-planning); capsule /pillar/implantology/ matches; no new subtopic"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathway_place: placed notecast/episode-45 in implant-surgical after episodes/episode-45 (twin unit, notecast-44/biomimetic precedent; episode-45 is in implant-surgical only); tool's STRONG flags for implant-prosthetic/fixed-pros/biomimetic/treatment-planning/esthetic/ceramics came from a spurious 'own series' (episode numbering) anchor episode-162/163/149 \u2014 not placed, conservative (implant-prosthetic borderline: loading timing is also prosthetic, recorded for founder); coverage 1.52/item (baseline 1.38, unchanged by design); 4.12-\u0628: 2 MCQ approved in M2, written to plus/exam-questions.json, validate_exam_questions OK"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "candidate bundle-implant-surgery (continues implant-surgical): \u00ab\u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1 \u067e\u0627\u0633\u060c \u06af\u06cc\u062a \u06f4: twin episodes/episode-45 already in bundle)\u00bb; no other candidates"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: \u00ab\u062e\u0644\u0627\u0635\u0647\u0654 \u0627\u067e\u06cc\u0632\u0648\u062f \u06f4\u06f5 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<title>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb at top, removed bottom line (insight-111), 7 lines kept; English mirror notecast/en/episode-45.html (clone of notecast/en/episode-44 chrome/type, LTR translated, same 5 sections/li counts, noindex, no hreflang, inLanguage en, toggle ../episode-45.html; fa toggle en/episode-45.html already present from clone; meta-1 unchanged; no gloss duplicates); ten-scope lock recorded"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
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
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, dentcast_cabinet_full_catalog.json, index.html, notecast/episode-45.html, plus/cabinet-papers.json, plus/cabinet-search.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, notecast/en/episode-45.html"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
