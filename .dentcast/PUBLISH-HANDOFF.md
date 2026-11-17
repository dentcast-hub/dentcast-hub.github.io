# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-112"
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
    "content_id": "insight/insight-112",
    "context": {
      "approvals": [
        {
          "decision": "\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0633\u06a9\u0646 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644",
          "evidence": [
            "founder doc heading (Claude Docs rev96) in the series title form the founder chose in chat for parts 1-2 (no space before colon)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u062f\u0631 \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u060c \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc \u0631\u0648\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0633\u062a\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f \u0648 \u0646\u0631\u0645\u200c\u0627\u0641\u0632\u0627\u0631 \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0627 \u0627\u0632 \u0634\u06a9\u0644 \u0622\u0646 \u062d\u0633\u0627\u0628 \u0645\u06cc\u200c\u06a9\u0646\u062f\u061b \u0646\u0634\u0633\u062a\u0646 \u06a9\u0627\u0645\u0644\u060c \u0644\u0627\u06cc\u0628\u0631\u0631\u06cc \u062f\u0631\u0633\u062a\u060c \u0633\u0627\u0644\u0645 \u0628\u0648\u062f\u0646 \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc \u0648 \u062b\u0628\u062a \u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644 \u062f\u0642\u062a \u06a9\u0627\u0631 \u0631\u0627 \u062a\u0639\u06cc\u06cc\u0646 \u0645\u06cc\u200c\u06a9\u0646\u0646\u062f.",
          "evidence": [
            "agent-composed caption, standing acceptance (Hard Rule 14), listed in Push-2 report"
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
          "decision": "founder approved all three in chat (AskUserQuestion, \u00ab\u062a\u0623\u06cc\u06cc\u062f\u00bb \u00d73): r-212d67c0, r-d2b85aab, r-655f41fe",
          "evidence": [
            "founder chat answer 2026-11-17"
          ],
          "kind": "m2_exam_questions",
          "step": "C.5.6"
        },
        {
          "evidence": [
            "insight/insight-112.html first <p> in .glass-box = founder paragraph 1"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder text (Claude Docs rev96) first paragraph \u00ab\u062f\u0631 \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u060c \u0628\u0647 \u062c\u0627\u06cc \u06a9\u0648\u067e\u06cc\u0646\u06af\u2026\u00bb opens the body before any figure or heading"
        },
        {
          "english": {
            "evidence": [
              "file on disk, toggle ../insight-112.html; fa toggle en/insight-112.html; metanotes/en/meta-1.html unchanged"
            ],
            "path": "insight/en/insight-112.html",
            "status": "ready"
          },
          "evidence": [
            "all founder messages closed: M1 none, M3b none, M2 answered"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "plus/des-scores.json[insight/insight-112] COMMENTARY 15/E, Part 3 green; no Fidelity owed; no M3b"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Question 4.9 \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc; C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "pillar implantology / prosthetic-components, capsule /pillar/implantology/, landing row insight/index.html"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "4.7: 0 (scan-body, intraoral-scanner, ti-base, emergence-profile at/over cap); 4.8: 4 glossary + episode-144-2 inline; 4.9: insight-111, episode-133, insight-26 (5/5)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "8 canonical tags reused, no mint; --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "dentcast-brain.json clinical-112 at tail; plus/faq-corpus.json byContent[insight/insight-112] 10 FAQ + 7 cards"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "implant-prosthetic after insight-111, digital after share-15; 3 exam rows approved in M2; bundle-implant-parts rejected gate 1"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html: new first line for insight-112, oldest (insight-107) removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "insight/en/insight-112.html authored from locked text; toggles inverse; noindex, follow; no hreflang"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title confirmed (founder series form), caption confirmed (standing acceptance), M2 approved x3"
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
          "note": "founder text (Claude Docs rev 96)",
          "ref": "claude-docs:4L1tTZmUebVP9TH3puddLR#rev96",
          "sha256": "65e17e254093ecabd97547390e914468727aaf653af581a801592dbd366508d8"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "kind": "des_commentary_v3.7",
          "result": "insight/insight-112 COMMENTARY 15/E FULL_TEXT provisional=false; checklist 4/0/3/3 (item4 = insight/index.html section declaration, note present); Part3 (1) quotes verbatim (items1,3 page body; item4 insight/index.html) (2) 5+10=15 (3) band E (4) key set equals precedent clinical insight-111; (6) verify_publish --des-text ok, interpretation_fa checked, no change; (7) des_record_guard check ok; fidelity [null] (basket 1; 0 units). Run: claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9) --tools \"\" --model opus, empty dir; modelUsage claude-opus-5-5. No Part 2d audit (COMMENTARY). No DOI/abstract/quartile guessed.",
          "step": "C.4.13"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read complete earlier in this same session (README, global/README + 5 sections, agent-parity, publish-checkpoints, publish-handoff-tool, modules 01/02, clinical readpack); no workflow/tool change a5089c5d..origin/main 5598ea27 (git diff empty)"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (Claude Docs rev96), paper file no -> normal publish"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed: 620 entries; latest clinical = clinical-111 keys [type,id,title,caption,hashtags,keywords,page_url,pillar]; PILLARS at origin/main 5598ea27"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type clinical (founder: \u00ab\u0642\u0633\u0645\u062a \u0628\u0639\u062f\u06cc\u0634\u00bb of insight-111 series)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "max clinical = 111 -> insight-112, no gap"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text: Claude Docs rev96 (digest bound); title = doc heading \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a : \u0627\u0633\u06a9\u0646 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u00bb in the founder's series form (no space before colon): \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0633\u06a9\u0646 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u00bb"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: no AI tells. Typography-only fixes: \u00ab\u0645\u06cc \u0628\u0646\u062f\u06cc\u0645\u00bb -> \u00ab\u0645\u06cc\u200c\u0628\u0646\u062f\u06cc\u0645\u00bb; \u00ab\u062b\u0628\u062a \u0645\u06cc \u0634\u0648\u062f\u00bb -> \u00ab\u062b\u0628\u062a \u0645\u06cc\u200c\u0634\u0648\u062f\u00bb; \u00ab\u0645\u0646\u0628\u0639 \u062f\u0648\u0645 \u062e\u0637\u0627\u060c\u0627\u0646\u062a\u062e\u0627\u0628\u00bb -> \u00ab\u0645\u0646\u0628\u0639 \u062f\u0648\u0645 \u062e\u0637\u0627\u060c \u0627\u0646\u062a\u062e\u0627\u0628\u00bb (missing space)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: 4 founder images in doc order from artifact assets (83056d3e\u2026, 8654c233\u2026, 05b9afdc\u2026 png, 76153f8c\u2026) -> insight112-1..4.webp; founder captions/alts; no audio/video"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached -> step 4.10 documented skip"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 1 COMMENTARY: no DOI/PubMed/references block; founder-authored teaching explanation"
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
          "Pulse: clinical precedent pattern \u00ab\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb"
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
        "reason": "not LiteCast: locked category clinical (Hard Rule 10 branch inactive)",
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
          "template = insight/insight-111.html (enrolled; byte-unchanged, checked at C.4)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/insight-112.html cloned from insight-111; body = founder text (h2->h3, B.3.5 fixes), 4 figures /insight/insight112-k.webp (WebP q82) with founder captions/alts; page-local table CSS of 111 dropped (no table; style block now equals insight-110); domain .org; GA4 x1; 2 preconnect; no trustseal; opening <p> = founder's own first paragraph (author_original); capsules reset to \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + /pillar/implantology/"
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
          "pillar implantology / prosthetic-components (series part 4: implant position transfer via scan body; same subtopic as parts 1-3). Competing digital/intraoral-scanning considered: the page is about implant impression transfer (scan body, library, emergence, full-arch verification), the series lives in implantology; closest match kept, recorded"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/implantology/; 2 of 5"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/index.html: <li><a href=\"insight-112.html\">\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0633\u06a9\u0646 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644</a></li> above insight-111"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: all JSON-LD/trustline dates = 2026-11-17; all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- insight/insight-111.html: clean"
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
        "reason": "not NoteCast or core episode",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "insight is not a numbered series; previous insight page has no ep-nav block",
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
          "plus/des-scores.json[insight/insight-112]: COMMENTARY 15/E, Part 3 green, no Fidelity owed (basket 1), no M3b"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "fresh review of 110 glossary terms: strong = scan-body, intraoral-scanner, ti-base, emergence-profile -> all at/over cap (5/5, 6/5, 5/5, 7/5) -> 0 back-links; borderline: milling, dental-implant (generic), screw-retained"
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
          "inline (first body occurrence, technical sense): \u00ab\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u00bb -> /glossary/scan-body.html; \u00ab\u0627\u0633\u06a9\u0646\u0631 \u062f\u0627\u062e\u0644 \u062f\u0647\u0627\u0646\u06cc\u00bb -> /glossary/intraoral-scanner.html; \u00abTi-Base\u00bb (defined in text) -> /glossary/ti-base.html; \u00ab\u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644\u00bb (first body occurrence; heading excluded) -> /glossary/emergence-profile.html; \u00ab\u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc\u00bb -> /episodes/episode-144-2.html (photogrammetry in full-arch scanning). Borderline skipped: \u00abstitching\u00bb -> episode-128-1 (scanner accuracy, broader), \u00ab\u0627\u0632 \u06cc\u06a9 \u0628\u0631\u0646\u062f \u0628\u0627\u0634\u0646\u062f\u00bb -> insight-31 (kept for consideration in 4.9), \u00ab\u062c\u06cc\u06af \u0648\u0631\u06cc\u0641\u06cc\u06a9\u06cc\u0634\u0646\u00bb (no page). git diff only <a> insertions"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "cap: 2 nav -> 3 free; added: insight-111 \u00ab\u0627\u0648\u067e\u0646 \u062a\u0631\u06cc \u062f\u0631 \u0628\u0631\u0627\u0628\u0631 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc\u00bb (previous series part), episode-133 \u00ab\u0627\u0641\u0632\u0627\u06cc\u0634 \u062f\u0642\u062a \u0627\u0633\u06a9\u0646 \u0628\u0627 \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u00bb (scan bodies), insight-26 \u00ab\u0627\u0646\u062a\u0642\u0627\u0644 \u0635\u062d\u06cc\u062d \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u00bb (library/info transfer). Skipped for cap: insight-31 (scan body + Ti-Base brand), insight-110/109 (earlier parts, reachable via 111), share-2 (implant IOS accuracy), episode-130 emergence profile. related_cap 5/5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent[insight/insight-112].definedTermSets: 7 authored DefinedTerms #flashcards-c1..c7 (\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u060c \u0641\u0627\u06cc\u0644 \u0644\u0627\u06cc\u0628\u0631\u0631\u06cc\u060c \u0622\u0646\u0627\u0644\u0648\u06af \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u060c \u0686\u0647\u0627\u0631 \u0645\u0646\u0628\u0639 \u062e\u0637\u0627\u060c Stitching\u060c \u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc\u060c \u062c\u06cc\u06af \u0648\u0631\u06cc\u0641\u06cc\u06a9\u06cc\u0634\u0646); none equals a FAQ answer; not in page JSON-LD"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "byContent[insight/insight-112].faqPages: 10 standalone questions, no deixis; 4 binary (\u0622\u06cc\u0627\u2026) all \u00ab\u062e\u06cc\u0631\u061b\u00bb; 6 why/what questions excluded from scored bank by shape. 4.12-\u0628: evaluated at 5.6"
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
        "reason": "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc at Question 4.9; not a \u0686\u0627\u0644\u0634",
        "status": "skipped"
      },
      {
        "evidence": [
          "Questions: (1) \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc \u0686\u0637\u0648\u0631 \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0648 \u0645\u0646\u062a\u0642\u0644 \u0645\u06cc\u200c\u06a9\u0646\u0647\u061f (2) \u0686\u0631\u0627 \u0627\u0633\u06a9\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062e\u0637\u0627 \u062f\u0627\u0631\u0647 / \u0644\u0627\u06cc\u0628\u0631\u0631\u06cc \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc \u0627\u0634\u062a\u0628\u0627\u0647\u061f (3) \u0641\u0648\u0644 \u0622\u0631\u0686 \u0631\u0648 \u0645\u06cc\u200c\u0634\u0647 \u0628\u0627 \u0627\u0633\u06a9\u0646\u0631 \u062f\u0627\u062e\u0644 \u062f\u0647\u0627\u0646\u06cc \u0642\u0627\u0644\u0628 \u06af\u0631\u0641\u062a\u061f (4) \u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u0686\u06cc\u0647\u061f (5) \u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644 \u0631\u0648 \u062a\u0648 \u0627\u0633\u06a9\u0646 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644 \u0686\u0637\u0648\u0631 \u062b\u0628\u062a \u06a9\u0646\u0645\u061f All reused, no mint: #\u0646\u06a9\u062a\u0647_\u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc (series) \u00b7 #\u0627\u0633\u06a9\u0646_\u0628\u0627\u062f\u06cc \u00ab\u067e\u0633 \u062f\u0642\u062a \u06a9\u0627\u0631 \u0628\u0647 \u062f\u0648 \u0686\u06cc\u0632 \u0628\u0633\u062a\u06af\u06cc \u062f\u0627\u0631\u062f: \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc \u06a9\u0627\u0645\u0644 \u0633\u0631 \u062c\u0627\u06cc\u0634 \u0646\u0634\u0633\u062a\u0647 \u0628\u0627\u0634\u062f \u0648 \u0646\u0631\u0645\u200c\u0627\u0641\u0632\u0627\u0631 \u0622\u0646 \u0631\u0627 \u062f\u0631\u0633\u062a \u0634\u0646\u0627\u0633\u0627\u06cc\u06cc \u06a9\u0646\u062f.\u00bb \u00b7 #\u062e\u0637\u0627\u06cc_\u0627\u0633\u062a\u06cc\u0686\u06cc\u0646\u06af \u00ab\u062e\u0637\u0627\u06cc \u06a9\u0648\u0686\u06a9 \u0647\u0631 \u0645\u0631\u062d\u0644\u0647 \u0631\u0648\u06cc \u0647\u0645 \u062c\u0645\u0639 \u0645\u06cc\u200c\u0634\u0648\u062f \u0648 \u0641\u0627\u0635\u0644\u0647\u200c\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627\u06cc \u062f\u0648 \u0637\u0631\u0641 \u0642\u0648\u0633 \u0645\u0645\u06a9\u0646 \u0627\u0633\u062a \u0622\u0646\u200c\u0642\u062f\u0631 \u062c\u0627\u0628\u0647\u200c\u062c\u0627 \u0634\u0648\u062f \u06a9\u0647 \u062f\u0631 \u06cc\u06a9 \u0641\u0631\u06cc\u0645\u200c\u0648\u0631\u06a9 \u06cc\u06a9\u200c\u062a\u06a9\u0647 \u067e\u0633\u06cc\u0648 \u0641\u06cc\u062a \u0627\u0632 \u0628\u06cc\u0646 \u0628\u0631\u0648\u062f.\u00bb \u00b7 #\u0627\u0633\u06a9\u0646_\u0641\u0648\u0644_\u0622\u0631\u0686 \u00ab\u0628\u0631\u0627\u06cc \u0647\u0645\u06cc\u0646 \u062f\u0631 \u0641\u0648\u0644 \u0622\u0631\u0686 \u0645\u0639\u0645\u0648\u0644\u0627\u064b \u06cc\u06a9\u06cc \u0627\u0632 \u0627\u06cc\u0646 \u062f\u0648 \u0631\u0627\u0647 \u0647\u0645 \u06a9\u0646\u0627\u0631 \u0627\u0633\u06a9\u0646 \u0628\u0647 \u06a9\u0627\u0631 \u0645\u06cc\u200c\u0631\u0648\u062f.\u00bb \u00b7 #\u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u00ab\u062f\u0631 \u0627\u06cc\u0646 \u062d\u0627\u0644\u062a \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627 \u0627\u0632 \u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc \u0645\u06cc\u200c\u0622\u06cc\u062f \u0648 \u0634\u06a9\u0644 \u0628\u0627\u0641\u062a \u0627\u0632 \u0627\u0633\u06a9\u0646 \u062f\u0627\u062e\u0644 \u062f\u0647\u0627\u0646\u06cc.\u00bb \u00b7 #\u067e\u0631\u0648\u0641\u0627\u06cc\u0644_\u0627\u0645\u0631\u062c\u0646\u0633 \u00ab\u0631\u0648\u06a9\u0634 \u0645\u0648\u0642\u062a \u06cc\u06a9 \u0628\u0627\u0631 \u062f\u0631 \u062f\u0647\u0627\u0646 \u0627\u0633\u06a9\u0646 \u0645\u06cc\u200c\u0634\u0648\u062f \u0648 \u06cc\u06a9 \u0628\u0627\u0631 \u0628\u06cc\u0631\u0648\u0646 \u0627\u0632 \u062f\u0647\u0627\u0646 \u0631\u0648\u06cc \u0622\u0646\u0627\u0644\u0648\u06af\u060c \u0628\u0627 \u0647\u0645\u0647\u200c\u06cc \u0633\u0637\u0648\u062d\u0634\u060c \u062a\u0627 \u0634\u06a9\u0644 \u0632\u06cc\u0631\u0644\u062b\u0647\u200c\u0627\u06cc \u0622\u0646 \u06a9\u0647 \u0647\u0645\u0627\u0646 \u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644 \u0627\u0633\u062a \u0628\u0647 \u0641\u0627\u06cc\u0644 \u0645\u0646\u062a\u0642\u0644 \u0634\u0648\u062f.\u00bb \u00b7 #\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc_\u062f\u06cc\u062c\u06cc\u062a\u0627\u0644, #\u067e\u0631\u0648\u062a\u0632_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a umbrellas. Composition: series + decision (#\u062e\u0637\u0627\u06cc_\u0627\u0633\u062a\u06cc\u0686\u06cc\u0646\u06af, #\u0627\u0633\u06a9\u0646_\u0628\u0627\u062f\u06cc) + specific \u226410 (#\u0627\u0633\u06a9\u0646_\u0628\u0627\u062f\u06cc 8, #\u062e\u0637\u0627\u06cc_\u0627\u0633\u062a\u06cc\u0686\u06cc\u0646\u06af 4, #\u0627\u0633\u06a9\u0646_\u0641\u0648\u0644_\u0622\u0631\u0686 2, #\u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc 2) + umbrellas. Dropped as mention: #\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645_\u0628\u06cc\u0633 (one sentence), #\u062f\u0642\u062a_\u0627\u0633\u06a9\u0646, #\u062e\u0637\u0627\u06cc_\u0627\u0633\u06a9\u0646 (overlap). Keywords revised so none repeats a hashtag. --sync, --check OK, cabinet --check OK. Reachability: Q4 -> \u00ab\u0641\u0648\u062a\u0648\u06af\u0631\u0627\u0645\u062a\u0631\u06cc\u00bb (2) PASS; Q3 \u00ab\u0627\u0633\u06a9\u0646 \u0641\u0648\u0644 \u0622\u0631\u0686\u00bb (2) PASS; Q1 \u00ab\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u00bb (8, rank 8) uncertain. content-index/assistant-tags reverted"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-brain.json: clinical-112 appended last (621), keys identical to clinical-111; 7 keywords from text, none repeats a hashtag, same list as page JSON-LD keywords; json valid"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar implantology/prosthetic-components = C.2.4; capsule matches; no new subtopic"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathway_place: implant-prosthetic STRONG (164) -> placed after insight/insight-111 (series part 4 follows part 3; tool anchor insight-33 not used to keep series order), digital STRONG (86) -> placed after sharehub/share-15 (tool anchor; implant digital scanning is a core digital-workflow topic). fixed-pros STRONG (100) not placed: would be a third full pathway (agent never places a third) and parts 1-3 are not there. Others ASK. Coverage 1.52 per item. 4.12-\u0628: 3 MCQ rows in plus/exam-questions.json byContent[insight/insight-112], draft-check 0/0, each approved in M2; validate --content 0 errors; drawn by implant-prosthetic and digital"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "candidate bundle-implant-parts (continues implant-prosthetic): \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1 \u2014 folder insight/). digital has no bundle"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse first line added/oldest insight-107 removed (7 lines); insight/en/insight-112.html authored (chrome from en/insight-110 = meta-1 standard, glass-box body translated structure-faithfully: 11 p, 4 h3, 4 figures; GA4 x1, canonical self .org, noindex follow, zero hreflang, en locale, no gloss duplicates, no specialist links); toggles inverse; meta-1 unchanged; ten-scope lock recorded; pending_questions empty"
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
      "insight/en/insight-112.html",
      "insight/index.html",
      "insight/insight-111.html",
      "insight/insight-112.html",
      "insight/insight112-1.webp",
      "insight/insight112-2.webp",
      "insight/insight112-3.webp",
      "insight/insight112-4.webp",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, index.html, insight/insight-112.html, insight/en/insight-112.html, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
