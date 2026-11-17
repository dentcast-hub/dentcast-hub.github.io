# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-113"
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
    "content_id": "insight/insight-113",
    "context": {
      "approvals": [
        {
          "decision": "\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0646\u06a9\u0627\u062a \u06a9\u0644\u06cc\u062f\u06cc",
          "evidence": [
            "founder doc heading (Claude Docs rev272), already in the series form the founder chose for parts 1-2"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u067e\u06cc\u0634 \u0627\u0632 \u0641\u0631\u0633\u062a\u0627\u062f\u0646 \u0642\u0627\u0644\u0628 \u06cc\u0627 \u0627\u0633\u06a9\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0647 \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 \u0686\u0646\u062f \u0686\u06cc\u0632 \u0686\u06a9 \u0645\u06cc\u200c\u0634\u0648\u062f: \u0646\u0634\u0633\u062a\u0646 \u06a9\u0627\u0645\u0644 \u06a9\u0648\u067e\u06cc\u0646\u06af \u06cc\u0627 \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u060c \u062b\u0628\u062a \u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644\u060c \u0633\u0644\u0627\u0645\u062a \u0642\u0627\u0644\u0628\u060c \u0648\u0635\u0644 \u06a9\u0631\u062f\u0646 \u062f\u0631\u0633\u062a \u0622\u0646\u0627\u0644\u0648\u06af \u0648 \u062f\u0631 \u0641\u0648\u0644 \u0622\u0631\u0686 \u062f\u0642\u062a \u0645\u062f\u0644 \u0628\u0627 \u062c\u06cc\u06af \u0648\u0631\u06cc\u0641\u06cc\u06a9\u06cc\u0634\u0646.",
          "evidence": [
            "agent-composed caption, standing acceptance (Hard Rule 14), listed in Push-2 report"
          ],
          "scope": "caption",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "decision": "founder chose \u00ab\u0628\u0627\u0632\u0646\u0648\u06cc\u0633\u06cc \u0631\u0633\u0645\u06cc\u00bb in chat for the colloquial parenthetical note in the radiography section (option text with \u00ab\u0627\u06cc\u0646 \u0631\u0648\u0634 \u062f\u0631 \u0628\u06cc\u0634\u062a\u0631 \u0645\u0648\u0627\u0631\u062f \u0628\u062f\u0648\u0646 \u0631\u0627\u062f\u06cc\u0648\u06af\u0631\u0627\u0641\u06cc \u0647\u0645 \u0627\u0637\u0645\u06cc\u0646\u0627\u0646 \u0645\u06cc\u200c\u062f\u0647\u062f\u00bb)",
          "evidence": [
            "founder chat answer 2026-11-17 (AskUserQuestion)"
          ],
          "kind": "founder_text_note_rewrite",
          "step": "B.3.5"
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
          "decision": "founder approved all three in chat (AskUserQuestion, \u00ab\u062a\u0623\u06cc\u06cc\u062f\u00bb \u00d73): r-8690e29f, r-5480d8b7, r-99d46cc7",
          "evidence": [
            "founder chat answer 2026-11-17"
          ],
          "kind": "m2_exam_questions",
          "step": "C.5.6"
        },
        {
          "evidence": [
            "insight/insight-113.html first <p> in .glass-box = founder paragraph 1"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder text (Claude Docs rev272) first paragraph \u00ab\u0627\u06af\u0631 \u0642\u0627\u0644\u0628 \u06cc\u0627 \u0627\u0633\u06a9\u0646 \u062e\u0637\u0627\u06cc\u06cc \u062f\u0627\u0634\u062a\u0647 \u0628\u0627\u0634\u062f\u2026\u00bb opens the body before any heading or list"
        },
        {
          "english": {
            "evidence": [
              "file on disk, toggle ../insight-113.html; fa toggle en/insight-113.html; metanotes/en/meta-1.html unchanged"
            ],
            "path": "insight/en/insight-113.html",
            "status": "ready"
          },
          "evidence": [
            "all founder messages closed: M1 none, M3b none, M2 answered"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "plus/des-scores.json[insight/insight-113] COMMENTARY 15/E, Part 3 green; no Fidelity owed; no M3b"
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
                "4.7: 0; 4.8: scan-body, flowable-resin, emergence-profile, insight-111 inline; 4.9: insight-112, insight-111, insight-109 (5/5)"
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
                "dentcast-brain.json clinical-113 at tail; plus/faq-corpus.json byContent[insight/insight-113] 11 FAQ + 6 cards"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "implant-prosthetic after insight-112; 3 exam rows approved in M2; bundle-implant-parts rejected gate 1"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html: new first line for insight-113, oldest (share-53) removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "insight/en/insight-113.html authored from locked text; toggles inverse; noindex, follow; no hreflang"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title confirmed (founder heading), caption confirmed (standing acceptance), note rewrite chosen by founder, M2 approved x3"
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
          "note": "founder text (Claude Docs rev 272) with the founder-approved formal rewrite of the parenthetical note",
          "ref": "claude-docs:2ugQ3hwyzV3UZPNptcN5su#rev272",
          "sha256": "76d2716c5edd325a4ba94e07bf8e88f84c251c5153412e11e6c26e45a7ecfe2c"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "kind": "des_commentary_v3.7",
          "result": "insight/insight-113 COMMENTARY 15/E FULL_TEXT provisional=false; checklist 4/0/3/3 (item4 = insight/index.html declaration, note present); Part3 (1) quotes verbatim (2) 5+10=15 (3) band E (4) key set equals clinical insight-112; (6) --des-text ok; interpretation_fa narrowed by agent: \u00ab\u0628\u0631\u0627\u06cc \u0647\u0631 \u0686\u06a9\u00bb -> \u00ab\u0628\u0631\u0627\u06cc \u0628\u06cc\u0634\u062a\u0631 \u0686\u06a9\u200c\u0647\u0627\u00bb; last sentence corrected (customized coping records the emergence profile, it does not reveal transfer error; the jig reveals model error before the framework); score/quotes unchanged; (7) guard ok; fidelity [null] (basket 1; 0 units). Run: claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964\u2026) --tools \"\" --model opus; modelUsage claude-opus-5-5. No DOI/abstract/quartile guessed.",
          "step": "C.4.13"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read complete earlier in this same session (README, global/README + 5 sections, agent-parity, publish-checkpoints, publish-handoff-tool, modules 01/02, clinical readpack); no workflow/tool change a5089c5d..origin/main e296f6d6 (git diff empty)"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (Claude Docs rev272), paper file no -> normal publish"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed: 621 entries; latest clinical = clinical-112 keys [type,id,title,caption,hashtags,keywords,page_url,pillar]; PILLARS at origin/main e296f6d6"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type clinical (founder: \u00ab\u06af\u0630\u0627\u0634\u062a\u0645 \u0648 \u0622\u062e\u0631\u06cc\u0647\u00bb, part 5 of the insight-109..112 series)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "max clinical = 112 -> insight-113, no gap"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text: Claude Docs rev272 (digest bound); title = doc heading \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0646\u06a9\u0627\u062a \u06a9\u0644\u06cc\u062f\u06cc\u00bb (already in series form)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: no AI tells. Founder decision (chat): colloquial parenthetical note in the radiography section rewritten in article register, parentheses removed, last clause as offered \u00ab\u0627\u06cc\u0646 \u0631\u0648\u0634 \u062f\u0631 \u0628\u06cc\u0634\u062a\u0631 \u0645\u0648\u0627\u0631\u062f \u0628\u062f\u0648\u0646 \u0631\u0627\u062f\u06cc\u0648\u06af\u0631\u0627\u0641\u06cc \u0647\u0645 \u0627\u0637\u0645\u06cc\u0646\u0627\u0646 \u0645\u06cc\u200c\u062f\u0647\u062f\u00bb. Typography-only fix: caption 6 \u00ab\u06cc\u06a9\u06cc\u06cc\u06a9\u06cc\u00bb -> \u00ab\u06cc\u06a9\u06cc\u200c\u06cc\u06a9\u06cc\u00bb"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: 7 founder images mapped by content to doc order (fig1 807180e8 radiograph; fig2 7d5760c2 png a-d; fig3 03476cf4 customized coping; fig4 adfb34b3 stone model with gingiva; fig5 dc3bcc96 closed-tray steps; fig6 c1537c05 jig fabrication; fig7 f905e849 jig on model) -> insight113-1..7.webp; founder captions/alts"
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
          "basket 1 COMMENTARY: no DOI/PubMed/references block; founder-authored teaching checklist"
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
          "template = insight/insight-112.html (enrolled; byte-unchanged, checked at C.4)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/insight-113.html cloned from insight-112; body = founder text (h2->h3, numbered steps as <ol> of 5 <li>, founder-approved note rewrite, caption fix), 7 figures /insight/insight113-k.webp (WebP q82) with founder captions/alts; domain .org; GA4 x1; 2 preconnect; no trustseal; opening <p> = founder's own first paragraph (author_original), before the first list; capsules reset to \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + /pillar/implantology/"
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
          "pillar implantology / prosthetic-components (series part 5: checks before sending implant impression/scan; same subtopic as parts 1-4)"
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
          "insight/index.html: <li><a href=\"insight-113.html\">\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0646\u06a9\u0627\u062a \u06a9\u0644\u06cc\u062f\u06cc</a></li> above insight-112"
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
          "git diff --quiet -- insight/insight-112.html: clean"
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
          "plus/des-scores.json[insight/insight-113]: COMMENTARY 15/E, Part 3 green, no Fidelity owed (basket 1), no M3b"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "fresh review of 110 glossary terms: strong = scan-body, emergence-profile (at/over cap 5/5, 7/5) -> 0; flowable-resin has room (1/5) but is borderline (one material option in one step), not linked; dental-implant generic"
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
          "inline (first body occurrence, headings excluded): \u00ab\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u00bb -> /glossary/scan-body.html; \u00ab\u06a9\u0627\u0645\u067e\u0648\u0632\u06cc\u062a \u0641\u0644\u0648\u00bb (step 5 of the list) -> /glossary/flowable-resin.html; \u00ab\u06a9\u0648\u067e\u06cc\u0646\u06af \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc\u00bb (its retentive features, explained in part 3) -> /insight/insight-111.html; \u00ab\u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644\u00bb -> /glossary/emergence-profile.html. Borderline skipped: \u00ab\u062c\u06cc\u06af \u0648\u0631\u06cc\u0641\u06cc\u06a9\u06cc\u0634\u0646\u00bb -> insight-112 (only mentioned there; detailed here), \u00ab\u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc\u00bb -> insight-111 (already linked once), \u00ab\u0631\u0627\u062f\u06cc\u0648\u06af\u0631\u0627\u0641\u06cc\u00bb (no matching page). git diff only <a> insertions"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "cap: 2 nav -> 3 free; added: insight-112 \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0633\u06a9\u0646 \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644\u00bb (previous part), insight-111 \u00ab\u0627\u0648\u067e\u0646 \u062a\u0631\u06cc \u062f\u0631 \u0628\u0631\u0627\u0628\u0631 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc\u00bb, insight-109 \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0647\u062f\u0641\u00bb (series start). Skipped for cap: insight-110, insight-80 pick-up, chairside-48, insight-83. related_cap 5/5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent[insight/insight-113].definedTermSets: 6 authored DefinedTerms #flashcards-c1..c6 (\u0631\u0627\u062f\u06cc\u0648\u06af\u0631\u0627\u0641\u06cc \u0646\u0634\u0633\u062a\u0646\u060c \u06a9\u0648\u067e\u06cc\u0646\u06af \u06a9\u0627\u0633\u062a\u0648\u0645\u0627\u06cc\u0632\u060c \u062d\u0633 \u0642\u0641\u0644 \u0634\u062f\u0646\u060c \u0646\u06af\u0647 \u062f\u0627\u0634\u062a\u0646 \u0622\u0646\u0627\u0644\u0648\u06af\u060c \u062c\u06cc\u06af \u0648\u0631\u06cc\u0641\u06cc\u06a9\u06cc\u0634\u0646\u060c \u0622\u0632\u0645\u0648\u0646 \u06cc\u06a9\u200c\u067e\u06cc\u0686); none equals a FAQ answer; not in page JSON-LD"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "byContent[insight/insight-113].faqPages: 11 standalone questions, no deixis; 4 binary (\u0622\u06cc\u0627\u2026): 3 \u00ab\u062e\u06cc\u0631\u061b\u00bb, 1 \u00ab\u0628\u0644\u0647\u061b\u00bb; 7 how/why questions excluded from scored bank by shape. 4.12-\u0628: evaluated at 5.6"
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
          "Questions: (1) \u0642\u0628\u0644 \u0627\u0632 \u0641\u0631\u0633\u062a\u0627\u062f\u0646 \u0642\u0627\u0644\u0628 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0647 \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 \u0686\u06cc \u0631\u0648 \u0686\u06a9 \u06a9\u0646\u0645\u061f (2) \u0686\u0637\u0648\u0631 \u0628\u0641\u0647\u0645\u0645 \u06a9\u0648\u067e\u06cc\u0646\u06af \u06a9\u0627\u0645\u0644 \u0646\u0634\u0633\u062a\u0647\u061f \u0631\u0627\u062f\u06cc\u0648\u06af\u0631\u0627\u0641\u06cc \u0644\u0627\u0632\u0645\u0647\u061f (3) \u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644 \u0631\u0648 \u062a\u0648 \u0642\u0627\u0644\u0628 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0686\u0637\u0648\u0631 \u062b\u0628\u062a \u06a9\u0646\u0645\u061f \u06a9\u0648\u067e\u06cc\u0646\u06af \u06a9\u0627\u0633\u062a\u0648\u0645\u0627\u06cc\u0632 (4) \u062c\u06cc\u06af \u0648\u0631\u06cc\u0641\u06cc\u06a9\u06cc\u0634\u0646 \u0641\u0648\u0644 \u0622\u0631\u0686 \u0686\u0637\u0648\u0631 \u0627\u0645\u062a\u062d\u0627\u0646 \u0645\u06cc\u0634\u0647\u061f (5) \u0686\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062a\u06cc \u0628\u0631\u0627\u06cc \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 \u0628\u0646\u0648\u06cc\u0633\u0645\u061f All reused, no mint: #\u0646\u06a9\u062a\u0647_\u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc (series) \u00b7 #\u062e\u0637\u0627\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc \u00ab\u0627\u06af\u0631 \u0642\u0627\u0644\u0628 \u06cc\u0627 \u0627\u0633\u06a9\u0646 \u062e\u0637\u0627\u06cc\u06cc \u062f\u0627\u0634\u062a\u0647 \u0628\u0627\u0634\u062f\u060c \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 \u0645\u0639\u0645\u0648\u0644\u0627\u064b \u0645\u062a\u0648\u062c\u0647 \u0622\u0646 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f \u0648 \u0647\u0645\u0627\u0646 \u062e\u0637\u0627 \u0645\u0633\u062a\u0642\u06cc\u0645 \u0628\u0647 \u067e\u0631\u0648\u062a\u0632 \u0645\u0646\u062a\u0642\u0644 \u0645\u06cc\u200c\u0634\u0648\u062f.\u00bb \u00b7 #\u0646\u0634\u0633\u062a_\u0646\u0627\u0642\u0635 \u00ab\u0627\u06af\u0631 \u06a9\u0648\u067e\u06cc\u0646\u06af \u062f\u0631 \u062c\u0627\u06cc\u0634 \u0644\u0642 \u0627\u0633\u062a \u06cc\u0627 \u062a\u0627 \u0627\u0646\u062a\u0647\u0627 \u062c\u0627 \u0646\u0645\u06cc\u200c\u0627\u0641\u062a\u062f\u060c \u0628\u0647 \u0627\u06cc\u0646 \u0642\u0627\u0644\u0628 \u0627\u0639\u062a\u0645\u0627\u062f \u0646\u0645\u06cc\u200c\u06a9\u0646\u06cc\u0645.\u00bb \u00b7 #\u067e\u0631\u0648\u0641\u0627\u06cc\u0644_\u0627\u0645\u0631\u062c\u0646\u0633 \u00ab\u0631\u0627\u0647 \u062d\u0644 \u0627\u06cc\u0646 \u0627\u0633\u062a \u06a9\u0647 \u06a9\u0648\u067e\u06cc\u0646\u06af \u0631\u0627 \u0647\u0645\u200c\u0634\u06a9\u0644 \u0628\u062e\u0634 \u0632\u06cc\u0631\u0644\u062b\u0647\u200c\u0627\u06cc \u0631\u0648\u06a9\u0634 \u0645\u0648\u0642\u062a \u06a9\u0646\u06cc\u0645\u060c \u06cc\u0639\u0646\u06cc \u06a9\u0648\u067e\u06cc\u0646\u06af \u0631\u0627 \u06a9\u0627\u0633\u062a\u0648\u0645\u0627\u06cc\u0632 \u06a9\u0646\u06cc\u0645\u00bb \u00b7 #\u0641\u06cc\u062a_\u067e\u0631\u0648\u062a\u0632 \u00ab\u062f\u0631 \u06a9\u0627\u0631\u0647\u0627\u06cc \u0641\u0648\u0644 \u0622\u0631\u0686 \u0647\u0645\u0647\u200c\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627 \u0628\u0627 \u06cc\u06a9 \u0641\u0631\u06cc\u0645\u200c\u0648\u0631\u06a9 \u06cc\u06a9\u200c\u062a\u06a9\u0647 \u0628\u0647 \u0647\u0645 \u0648\u0635\u0644 \u0645\u06cc\u200c\u0634\u0648\u0646\u062f \u0648 \u062e\u0637\u0627\u06cc \u06a9\u0648\u0686\u06a9 \u0645\u062f\u0644\u060c \u067e\u0633\u06cc\u0648 \u0641\u06cc\u062a \u0631\u0627 \u0627\u0632 \u0628\u06cc\u0646 \u0645\u06cc\u200c\u0628\u0631\u062f.\u00bb \u00b7 #\u0627\u0631\u062a\u0628\u0627\u0637_\u0628\u0627_\u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 \u00ab\u0646\u0648\u0639 \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u060c \u0633\u06cc\u0633\u062a\u0645 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0648 \u0642\u0637\u0631 \u067e\u0644\u062a\u0641\u0631\u0645 \u0631\u0627 \u0647\u0645 \u062f\u0642\u06cc\u0642 \u0628\u0631\u0627\u06cc \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 \u0645\u06cc\u200c\u0646\u0648\u06cc\u0633\u06cc\u0645.\u00bb \u00b7 #\u0627\u06cc\u0645\u067e\u0644\u0646\u062a_\u0641\u0648\u0644_\u0622\u0631\u0686 \u00ab\u0628\u0631\u0627\u06cc \u0647\u0645\u06cc\u0646 \u067e\u06cc\u0634 \u0627\u0632 \u0633\u0627\u062e\u062a \u0641\u0631\u06cc\u0645\u200c\u0648\u0631\u06a9 \u0646\u0647\u0627\u06cc\u06cc\u060c \u062f\u0642\u062a \u0645\u062f\u0644 \u0631\u0627 \u0628\u0627 \u062c\u06cc\u06af \u0648\u0631\u06cc\u0641\u06cc\u06a9\u06cc\u0634\u0646 \u0686\u06a9 \u0645\u06cc\u200c\u06a9\u0646\u06cc\u0645.\u00bb \u00b7 #\u067e\u0631\u0648\u062a\u0632_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a umbrella. Composition: series + decision (#\u062e\u0637\u0627\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc, #\u0646\u0634\u0633\u062a_\u0646\u0627\u0642\u0635) + specific \u226410 + umbrellas. Not minted: verification jig and customized coping (no library concept; #\u0631\u0627\u0633\u062a\u06cc_\u0622\u0632\u0645\u0627\u06cc\u06cc is the AI-domain \u00abfact checking\u00bb concept, not this). --sync, --check OK, cabinet --check OK. Reachability: Q2 \u00ab\u0646\u0634\u0633\u062a \u0646\u0627\u0642\u0635\u00bb (6) and Q5 \u00ab\u0627\u0631\u062a\u0628\u0627\u0637 \u0628\u0627 \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631\u00bb (6) pages rank 6 -> uncertain; Q1 \u00ab\u062e\u0637\u0627\u06cc \u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc\u00bb (6) uncertain; recorded. content-index/assistant-tags reverted"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-brain.json: clinical-113 appended last (622), keys identical to clinical-112; 7 keywords from text, none repeats a hashtag, same as page JSON-LD keywords; json valid"
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
          "pathway_place: implant-prosthetic STRONG (122) -> placed after insight/insight-112 (series part 5 closes the run 109-113; tool anchor insight-109 not used to keep order). Not placed: fixed-pros (74, ASK), digital (27, ASK; part 4 already there), implant-surgical (ASK). Coverage 1.52 per item. 4.12-\u0628: 3 MCQ rows in plus/exam-questions.json byContent[insight/insight-113], draft-check 0/0, each approved in M2; validate --content 0 errors; drawn by implant-prosthetic"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "candidate bundle-implant-parts (continues implant-prosthetic): \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1 \u2014 folder insight/)"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse first line added/oldest share-53 removed (7 lines); insight/en/insight-113.html authored (chrome from en/insight-112, body translated structure-faithfully: 13 p, 7 h3, 7 figures, 5 li; GA4 x1, canonical self .org, noindex follow, zero hreflang, en locale, no gloss duplicates, no specialist links); toggles inverse; meta-1 unchanged; ten-scope lock recorded; pending_questions empty"
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
      "insight/en/insight-113.html",
      "insight/index.html",
      "insight/insight-112.html",
      "insight/insight-113.html",
      "insight/insight113-1.webp",
      "insight/insight113-2.webp",
      "insight/insight113-3.webp",
      "insight/insight113-4.webp",
      "insight/insight113-5.webp",
      "insight/insight113-6.webp",
      "insight/insight113-7.webp",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, index.html, insight/insight-113.html, insight/en/insight-113.html, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
