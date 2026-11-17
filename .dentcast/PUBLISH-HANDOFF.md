# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-110"
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
    "content_id": "insight/insight-110",
    "context": {
      "approvals": [
        {
          "decision": "\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0628\u0632\u0627\u0631",
          "evidence": [
            "founder chose this exact title in chat (AskUserQuestion answer) 2026-11-17"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0627\u0628\u0632\u0627\u0631\u0647\u0627\u06cc \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u06a9\u0648\u067e\u06cc\u0646\u06af \u0627\u067e\u0646 \u062a\u0631\u06cc \u0648 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc\u060c \u067e\u06cc\u0686 \u06a9\u0648\u067e\u06cc\u0646\u06af\u060c \u0622\u0646\u0627\u0644\u0648\u06af \u0647\u0645\u200c\u0633\u06cc\u0633\u062a\u0645\u060c \u062a\u0631\u06cc \u0633\u0641\u062a \u0648 \u0645\u0627\u062f\u0647\u200c\u06cc \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0633\u062e\u062a\u060c \u0648 \u0641\u0631\u0642 \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u062f\u0631 \u0633\u0637\u062d \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0627 \u0633\u0637\u062d \u0627\u0628\u0627\u062a\u0645\u0646\u062a.",
          "evidence": [
            "agent-composed caption, standing acceptance (Hard Rule 14), listed in Push-2 report"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "\u062f\u0631 \u0642\u0633\u0645\u062a \u0642\u0628\u0644 \u062f\u06cc\u062f\u06cc\u0645 \u06a9\u0647 \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u06a9\u067e\u06cc \u0633\u0637\u062d \u0646\u06cc\u0633\u062a \u0648 \u06a9\u0627\u0631\u0634 \u0645\u0646\u062a\u0642\u0644 \u06a9\u0631\u062f\u0646 \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0627\u0632 \u062f\u0647\u0627\u0646 \u0628\u0647 \u0645\u062f\u0644 \u06af\u0686\u06cc \u0627\u0633\u062a. \u0627\u06cc\u0646 \u0642\u0633\u0645\u062a \u0633\u0631\u0627\u063a \u0642\u0637\u0639\u0647\u200c\u0647\u0627 \u0648 \u0645\u0648\u0627\u062f\u06cc \u0645\u06cc\u200c\u0631\u0648\u062f \u06a9\u0647 \u0627\u06cc\u0646 \u0627\u0646\u062a\u0642\u0627\u0644 \u0628\u0627 \u0622\u0646\u200c\u0647\u0627 \u0627\u0646\u062c\u0627\u0645 \u0645\u06cc\u200c\u0634\u0648\u062f\u060c \u0648 \u0627\u06cc\u0646\u06a9\u0647 \u0647\u0631 \u06a9\u062f\u0627\u0645 \u0686\u0647 \u0648\u06cc\u0698\u06af\u06cc\u200c\u0627\u06cc \u0628\u0627\u06cc\u062f \u062f\u0627\u0634\u062a\u0647 \u0628\u0627\u0634\u062f \u062a\u0627 \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0631 \u0631\u0627\u0647 \u062c\u0627\u0628\u0647\u200c\u062c\u0627 \u0646\u0634\u0648\u062f.",
          "evidence": [
            "standing acceptance record (Hard Rule 14, module 03 lead), quoted in Push-2 report"
          ],
          "scope": "authored-intro",
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
          "decision": "founder approved all three in chat (AskUserQuestion, \u00ab\u062a\u0623\u06cc\u06cc\u062f\u00bb \u00d73): r-2da302cb, r-c65c5a6f, r-3bb0b8f6",
          "evidence": [
            "founder chat answer 2026-11-17"
          ],
          "kind": "m2_exam_questions",
          "step": "C.5.6"
        },
        {
          "evidence": [
            "insight/insight-110.html first <p> in .glass-box = agent lead; approval scope authored-intro confirmed by standing acceptance"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "agent_authored",
          "source_ref": "agent lead paragraph opening insight/insight-110.html .glass-box before figure 1 (founder text opens with a figure and a heading); scored by DES COMMENTARY at C.4.13"
        },
        {
          "english": {
            "evidence": [
              "file on disk, toggle ../insight-110.html; fa toggle en/insight-110.html; metanotes/en/meta-1.html unchanged"
            ],
            "path": "insight/en/insight-110.html",
            "status": "ready"
          },
          "evidence": [
            "all founder messages closed: M1 none, M3b none, M2 answered"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "plus/des-scores.json[insight/insight-110] COMMENTARY 15/E, Part 3 green; no Fidelity owed (basket 1); no M3b"
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
                "pillar implantology / prosthetic-components (C.2.4), capsule /pillar/implantology/, landing row insight/index.html"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "4.7: 0 (strong glossary pages abutment, scan-body at cap); 4.8: insight-109 (\u0642\u0633\u0645\u062a \u0642\u0628\u0644), scan-body, abutment inline; 4.9: insight-109, insight-83, episode-108 (5/5)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "6 canonical tags reused, no mint; hashtag_ref --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "dentcast-brain.json clinical-110 at tail; plus/faq-corpus.json byContent[insight/insight-110] 12 FAQ + 7 cards"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "implant-prosthetic after insight-109; 3 exam rows approved in M2; bundle-implant-parts rejected gate 1"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html: new first line \u00ab\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0628\u0632\u0627\u0631\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb, oldest (share-51) removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "insight/en/insight-110.html authored from locked text; toggles inverse; noindex, follow; no hreflang"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title confirmed (founder), caption + authored-intro confirmed (standing acceptance), M2 exam questions approved x3"
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
          "note": "founder text (Claude Docs rev 97), title founder-chosen in chat",
          "ref": "claude-docs:QgYJ55esu6ZvV1FJVFxpYC#rev97",
          "sha256": "91233d2f50fffdd3075e4476d55c03295b5b923b1e6dd7186fdd2c970e990a3b"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "kind": "des_commentary_v3.7",
          "result": "insight/insight-110 COMMENTARY 15/E FULL_TEXT provisional=false; checklist 4/0/3/3 (item4 = insight/index.html section declaration, note present); Part3 (1) quotes verbatim (items1,3 in page body; item4 in insight/index.html) (2) 5+10=15 (3) band E (4) key set equals spec/precedent clinical insight-109; (6) verify_publish --des-text ok; interpretation_fa sentences 1-2 narrowed by agent (\"\u0628\u0631\u0627\u06cc \u0647\u0631 \u062a\u0648\u0635\u06cc\u0647\" -> \"\u0628\u0631\u0627\u06cc \u062a\u0648\u0635\u06cc\u0647\u200c\u0647\u0627\u06cc\u0634\"; \"\u0645\u062d\u062f\u0648\u062f\u0647\u200c\u06cc \u06a9\u0627\u0631\u0628\u0631\u062f \u062a\u0648\u0635\u06cc\u0647\u200c\u0647\u0627 \u0645\u0634\u062e\u0635 \u0634\u062f\u0647 \u0627\u0633\u062a\" -> \"\u0645\u062d\u062f\u0648\u062f\u0647\u200c\u06cc \u0628\u0639\u0636\u06cc \u062a\u0648\u0635\u06cc\u0647\u200c\u0647\u0627 \u0647\u0645 \u0645\u0634\u062e\u0635 \u0634\u062f\u0647\u060c \u0645\u062b\u0644 \u062a\u0631\u06cc \u0627\u062e\u062a\u0635\u0627\u0635\u06cc ...\"); score/quotes unchanged; (7) des_record_guard check ok; fidelity [null] (basket 1 self-record, Part 2b; des_fidelity_units: 0 units). Run: claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9) --tools \"\" --model opus, empty dir; modelUsage claude-opus-5-5; metadata line section: insight/. No Part 2d audit (COMMENTARY). No DOI/abstract/quartile guessed.",
          "step": "C.4.13"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read complete: README, global/README + 5 selected sections (3 pages), agent-parity, publish-checkpoints, publish-handoff-tool, modules 01/02 at origin/main a5089c5d"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (Claude Docs rev97), paper file no -> normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 618 entries; latest clinical = clinical-109 keys [type,id,title,caption,hashtags,keywords,page_url,pillar]; live PILLARS read from tools/build_pillar.py at origin/main a5089c5d"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type clinical (founder: \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u0627\u0644 \u0627\u06cc\u0646 \u0633\u0627\u06cc\u062a = insight/ Clinical Insight; series part 2 of insight-109)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "max clinical = 109 -> insight-110, no gap"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text: Claude Docs rev97 (digest bound in context.inputs); title founder-chosen via question: \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0628\u0632\u0627\u0631"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: no AI tells (no formulaic openers, clich\u00e9s, filler; founder already revised wording in the doc). Typography-only fixes applied (standing acceptance, reported): \u00ab\u0642\u0627\u0644\u0628 \u06af\u06cc\u0631\u06cc \u062f\u0631 \u0633\u0637\u062d\u00bb h2 -> \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u062f\u0631 \u0633\u0637\u062d\u00bb; \u00ab\u0642\u0633\u0645\u062a \u0647\u0627\u06cc \u0628\u0639\u062f\u06cc\u00bb -> \u00ab\u0642\u0633\u0645\u062a\u200c\u0647\u0627\u06cc \u0628\u0639\u062f\u06cc\u00bb; \u00ab\u0628\u0633\u062a\u0647 \u0645\u06cc\u0634\u0648\u062f\u00bb -> \u00ab\u0628\u0633\u062a\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f\u00bb; run-on \u00ab\u06a9\u0645\u062a\u0631 \u0627\u0633\u062a\u0641\u0627\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f\u060c  \u0633\u0641\u062a\u06cc\u200c\u067e\u0644\u06cc \u0627\u062a\u0631\u060c \u0628\u06cc\u0631\u0648\u0646 \u0622\u0648\u0631\u062f\u0646\u00bb -> \u00ab\u06a9\u0645\u062a\u0631 \u0627\u0633\u062a\u0641\u0627\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f\u061b \u0633\u0641\u062a\u06cc \u067e\u0644\u06cc\u200c\u0627\u062a\u0631 \u0628\u06cc\u0631\u0648\u0646 \u0622\u0648\u0631\u062f\u0646\u00bb (misplaced ZWNJ, double space and stray comma; no word added)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: 4 founder images in doc order from artifact assets (jpeg; sha256 71251aa7\u2026, 090b7b6b\u2026, 6969111e\u2026, 69e34f60\u2026) -> insight110-1..4.webp; founder captions per image; fifth asset b05f2d67\u2026 (green tray a/b) is not placed in the doc and is not used; no audio/video"
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
          "basket 1 COMMENTARY: page carries no DOI/PubMed/references block; founder-authored teaching explanation of impression components"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc: ordinary explanatory post, not a question post"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent drafts in clinical precedent pattern \u00ab\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb (same as insight-109)"
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
          "template = insight/insight-109.html (enrolled in target_paths; must stay byte-unchanged, checked at C.4)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/insight-110.html cloned from insight-109 structure; body = agent lead + founder text (h2->h3 within glass-box, Q3.5 typography fixes), 4 figures /insight/insight110-k.webp (WebP q82, \u22641600px, \u2264300KB) with founder captions/alts; domain dentcast.org kept; GA4 x1; 2 preconnect crossorigin; no trustseal; opening <p> is agent lead (agent_authored, provenance recorded after C.4.13); no chip row in template; capsules reset to \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + /pillar/implantology/"
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
          "pillar implantology (single clear fit: implant impression components); subtopic prosthetic-components (impression copings, guide pin, analog, multi-unit abutment-level transfer; same as part 1 clinical-109); competing restoration-design rejected (no restoration design content)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/implantology/ (typed brain entry branch); 2 of 5 links used"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/index.html hand-maintained: <li><a href=\"insight-110.html\">\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0628\u0632\u0627\u0631</a></li> added above insight-109 (newest first, unnumbered type)"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: BlogPosting datePublished/dateModified, MedicalWebPage datePublished/dateModified/lastReviewed, trustline time x2 = 2026-11-17 (before: 2026-11-16 from clone); all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- insight/insight-109.html: clean"
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
          "plus/des-scores.json[insight/insight-110]: COMMENTARY 15/E, Part 3 checks green, no Fidelity owed (basket 1), no M3b"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "fresh semantic review of 110 glossary terms: strong = abutment (abutment-level impression, multi-unit), scan-body (digital alternative named in text) -> both at cap per tools/related_cap.py (5/5, 5/5) -> 0 back-links added; borderline not linked: dental-implant (generic), intraoral-scanner (one passing mention; also over cap 6/5), screw-retained, ti-base, emergence-profile (not discussed in this part)"
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
          "inline links: \u00ab\u0642\u0633\u0645\u062a \u0642\u0628\u0644\u00bb in lead (body refers back to part 1) -> /insight/insight-109.html; \u00ab\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u00bb (first, defined as the digital transfer part) -> /glossary/scan-body.html; \u00ab\u0627\u0628\u0627\u062a\u0645\u0646\u062a\u00bb (first body occurrence, abutment-level section) -> /glossary/abutment.html. Borderline skipped: \u00ab\u0645\u0648\u0644\u062a\u06cc \u06cc\u0648\u0646\u06cc\u062a \u0627\u0628\u0627\u062a\u0645\u0646\u062a\u00bb -> episode-108 (kept for 4.9), \u00ab\u0627\u0633\u06a9\u0646\u0631 \u062f\u0627\u062e\u0644 \u062f\u0647\u0627\u0646\u06cc\u00bb -> intraoral-scanner (passing mention), \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb -> dental-implant (generic), \u00abPVS/\u067e\u0644\u06cc\u200c\u0627\u062a\u0631/\u0622\u0644\u0698\u06cc\u0646\u0627\u062a\u00bb (no impression-material glossary page; insight-75 / notecast-21 are tooth-impression technique, tangential), \u00ab\u0627\u067e\u0646 \u062a\u0631\u06cc/\u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc\u00bb -> insight-83 (kept for 4.9). git diff shows only <a> insertions"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "cap: 2 nav capsules -> 3 free; added strongest: insight-109 \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0647\u062f\u0641\u00bb (series part 1, sibling first), insight-83 \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u062f\u0648 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0632\u0627\u0648\u06cc\u0647\u200c\u062f\u0627\u0631\u00bb (choosing coping/technique for an implant impression), episode-108 \u00ab\u0645\u0648\u0644\u062a\u06cc\u200c\u06cc\u0648\u0646\u06cc\u062a \u0627\u0628\u0627\u062a\u0645\u0646\u062a\u200c\u0647\u0627\u00bb (abutment-level impression section). Skipped for cap/borderline: episode-133 scan bodies (part defers digital), insight-80 pick-up (crown pick-up), chairside-48 cast vs mouth, insight-75 impression tear (tooth impression), notecast-20/21 two-step impression (tooth). related_cap 5/5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent[insight/insight-110].definedTermSets: 7 authored DefinedTerms #flashcards-c1..c7 (\u06a9\u0648\u067e\u06cc\u0646\u06af \u0627\u067e\u0646 \u062a\u0631\u06cc\u060c \u06a9\u0648\u067e\u06cc\u0646\u06af \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc\u060c \u0634\u0631\u0637 \u0627\u0646\u062a\u062e\u0627\u0628 \u0622\u0646\u0627\u0644\u0648\u06af\u060c \u0648\u06cc\u0698\u06af\u06cc \u062a\u0631\u06cc\u060c \u062f\u0648 \u06a9\u0627\u0631 \u0645\u0627\u062f\u0647\u200c\u06cc \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc\u060c \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u062f\u0631 \u0633\u0637\u062d \u0627\u0628\u0627\u062a\u0645\u0646\u062a\u060c \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc); none equals a FAQ answer with or without verdict; FAQ explain-shaped pairs 2,4,7,8,10,12 covered by authored atomic cards; not in page JSON-LD"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "byContent[insight/insight-110].faqPages #faq: 12 standalone questions, no article deixis; 6 binary (\u0622\u06cc\u0627\u2026): 5 open \u00ab\u062e\u06cc\u0631\u061b\u00bb, 1 \u00ab\u0628\u0644\u0647\u061b\u00bb; 6 why/what questions excluded from scored bank by shape. 4.12-\u0628: evaluated at 5.6"
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
        "reason": "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc at Question 4.9; not a \u0686\u0627\u0644\u0634, no data-dc-challenge-question markup",
        "status": "skipped"
      },
      {
        "evidence": [
          "Questions: (1) \u06a9\u0648\u067e\u06cc\u0646\u06af \u0627\u067e\u0646 \u062a\u0631\u06cc \u0628\u0627 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc \u0686\u0647 \u0641\u0631\u0642\u06cc \u062f\u0627\u0631\u0647\u061f (2) \u0628\u0631\u0627\u06cc \u0642\u0627\u0644\u0628 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a PVS \u0628\u0647\u062a\u0631\u0647 \u06cc\u0627 \u067e\u0644\u06cc \u0627\u062a\u0631\u061f (3) \u0622\u0644\u0698\u06cc\u0646\u0627\u062a \u0628\u0631\u0627\u06cc \u0642\u0627\u0644\u0628 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062e\u0648\u0628\u0647\u061f (4) \u062a\u0631\u06cc \u067e\u0644\u0627\u0633\u062a\u06cc\u06a9\u06cc \u0628\u0631\u0627\u06cc \u0642\u0627\u0644\u0628 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u06a9\u0627\u0641\u06cc\u0647\u061f (5) \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u062f\u0631 \u0633\u0637\u062d \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0628\u0627 \u0645\u0648\u0644\u062a\u06cc \u06cc\u0648\u0646\u06cc\u062a \u06cc\u0639\u0646\u06cc \u0686\u06cc\u061f All reused, no mint: #\u0646\u06a9\u062a\u0647_\u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc (series) \u00b7 #\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc \u00ab\u062f\u0631 \u0642\u0627\u0644\u0628 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0645\u0627\u062f\u0647 \u06cc\u06a9 \u06a9\u0627\u0631 \u062f\u06cc\u06af\u0631 \u0647\u0645 \u062f\u0627\u0631\u062f: \u0628\u0627\u06cc\u062f \u06a9\u0648\u067e\u06cc\u0646\u06af \u0631\u0627 \u0645\u062d\u06a9\u0645 \u0633\u0631 \u062c\u0627\u06cc\u0634 \u0646\u06af\u0647 \u062f\u0627\u0631\u062f.\u00bb \u00b7 #\u062a\u0631\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc \u00ab\u062a\u0631\u06cc \u0628\u0627\u06cc\u062f \u0622\u0646\u200c\u0642\u062f\u0631 \u0633\u0641\u062a \u0628\u0627\u0634\u062f \u06a9\u0647 \u0645\u0648\u0642\u0639 \u0628\u06cc\u0631\u0648\u0646 \u0622\u0648\u0631\u062f\u0646 \u0642\u0627\u0644\u0628 \u062e\u0645 \u0646\u0634\u0648\u062f.\u00bb \u00b7 #\u062e\u0637\u0627\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc \u00ab\u062a\u0631\u06cc \u067e\u0644\u0627\u0633\u062a\u06cc\u06a9\u06cc \u0646\u0631\u0645 \u0645\u0645\u06a9\u0646 \u0627\u0633\u062a \u062e\u0645 \u0634\u0648\u062f \u0648 \u0628\u0639\u062f \u0628\u0647 \u0634\u06a9\u0644 \u0627\u0648\u0644\u0634 \u0628\u0631\u06af\u0631\u062f\u062f\u060c \u0648 \u0647\u0645\u06cc\u0646 \u06a9\u0627\u0641\u06cc \u0627\u0633\u062a \u062a\u0627 \u0645\u0648\u0642\u0639\u06cc\u062a \u06a9\u0648\u067e\u06cc\u0646\u06af\u200c\u0647\u0627 \u062f\u0627\u062e\u0644 \u0642\u0627\u0644\u0628 \u062c\u0627\u0628\u0647\u200c\u062c\u0627 \u0634\u0648\u062f.\u00bb \u00b7 #\u0645\u0648\u0644\u062a\u06cc_\u06cc\u0648\u0646\u06cc\u062a_\u0627\u0628\u0627\u062a\u0645\u0646\u062a \u00ab\u062f\u0631 \u0627\u06cc\u0646 \u062d\u0627\u0644\u062a \u0686\u06cc\u0632\u06cc \u06a9\u0647 \u0628\u0647 \u0645\u062f\u0644 \u0645\u0646\u062a\u0642\u0644 \u0645\u06cc\u200c\u0634\u0648\u062f \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0627\u0633\u062a\u060c \u0646\u0647 \u062e\u0648\u062f \u0627\u06cc\u0645\u067e\u0644\u0646\u062a.\u00bb \u00b7 #\u067e\u0631\u0648\u062a\u0632_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a umbrella in addition. Composition: series + decision (#\u062a\u0631\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc, #\u062e\u0637\u0627\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc) + specific \u226410 (#\u062a\u0631\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc 4, #\u0645\u0648\u0644\u062a\u06cc_\u06cc\u0648\u0646\u06cc\u062a_\u0627\u0628\u0627\u062a\u0645\u0646\u062a 3, #\u062e\u0637\u0627\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc 4) + umbrella. Dropped as mention: #\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc_\u0627\u0648\u067e\u0646_\u062a\u0631\u06cc (mechanics deferred to part 3), #\u0627\u0633\u06a9\u0646_\u0628\u0627\u062f\u06cc (deferred), #\u0627\u0628\u0627\u062a\u0645\u0646\u062a. Impression-material concept absent from library; not minted (no second resolving page in this batch) -> PVS/\u067e\u0644\u06cc\u200c\u0627\u062a\u0631 in keywords. --sync done, --check OK, build_cabinet_papers --check OK. Reachability: Q4 -> \u00ab\u062a\u0631\u06cc \u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc\u00bb (4 pages, this page 4th) PASS; Q5 -> \u00ab\u0645\u0648\u0644\u062a\u06cc \u06cc\u0648\u0646\u06cc\u062a \u0627\u0628\u0627\u062a\u0645\u0646\u062a\u00bb (3 pages) PASS; Q2/Q3 no material label -> umbrella \u00ab\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc\u00bb (13) rank uncertain, recorded. content-index/assistant-tags reverted (runner C.8). No chip row on insight template."
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-brain.json: clinical-110 appended as last array element (619), keys identical to clinical-109 [type,id,title,caption,hashtags,keywords,page_url,pillar]; keywords 8 from text, none repeats a hashtag; page JSON-LD keywords set to the same list; json valid"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar implantology/prosthetic-components = C.2.4 decision; capsule /pillar/implantology/ matches; no new subtopic"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathway_place: implant-prosthetic (score 148, tool ASK only because the title series has no \u00ab\u0642\u0633\u0645\u062a N\u00bb; suggested anchor = own series part 1) -> placed after insight/insight-109 (index 24, 98 steps, no milestone), semantic strong: series part 2, same subject. Not placed (conservative, recorded): fixed-pros (tool STRONG 77, cluster = tooth impression episodes 20/21; implant-specific components and part 1 is not in fixed-pros, so placing part 2 alone would split the series), implant-surgical, treatment-planning, digital, occlusion (ASK). Coverage 1.52 per item (baseline 1.38; unchanged trend). 4.12-\u0628: 3 MCQ rows in plus/exam-questions.json byContent[insight/insight-110] (r-2da302cb, r-c65c5a6f, r-3bb0b8f6), draft-check 0 errors/0 warnings, each approved by founder in M2; validate_exam_questions --content: 0 errors; drawn by implant-prosthetic"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "candidate bundle-implant-parts (continues implant-prosthetic): \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1 \u2014 folder insight/ is never a bundle type). No bundle edit, no home-bundles.js change"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse first line added/oldest share-51 removed (7 lines); insight/en/insight-110.html authored (chrome from en/insight-109 = meta-1 standard, insight glass-box body translated structure-faithfully: 13 p, 7 h3, 4 figures; GA4 x1, canonical self .org, noindex follow, zero hreflang, inLanguage/og:locale en, no same-word gloss duplicates, no specialist links); fa toggle en/insight-110.html present; meta-1 unchanged; ten-scope lock recorded; pending_questions empty"
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
      "insight/en/insight-110.html",
      "insight/index.html",
      "insight/insight-109.html",
      "insight/insight-110.html",
      "insight/insight110-1.webp",
      "insight/insight110-2.webp",
      "insight/insight110-3.webp",
      "insight/insight110-4.webp",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, index.html, insight/insight-110.html, insight/en/insight-110.html, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
