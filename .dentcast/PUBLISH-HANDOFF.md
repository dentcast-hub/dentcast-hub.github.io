# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-109"
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
    "content_id": "insight/insight-109",
    "context": {
      "approvals": [
        {
          "decision": "\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0647\u062f\u0641",
          "evidence": [
            "founder chose this exact title in chat (AskUserQuestion answer) 2026-11-16"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u062f\u0631 \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0646\u0628\u0627\u0644 \u06a9\u067e\u06cc \u0633\u0637\u062d \u0646\u06cc\u0633\u062a\u06cc\u0645\u061b \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0627 \u06a9\u0648\u067e\u06cc\u0646\u06af \u0648 \u0622\u0646\u0627\u0644\u0648\u06af \u0627\u0632 \u062f\u0647\u0627\u0646 \u0628\u0647 \u0645\u062f\u0644 \u06af\u0686\u06cc \u0645\u0646\u062a\u0642\u0644 \u0645\u06cc\u200c\u0634\u0648\u062f: \u062c\u0627\u06cc\u06af\u0627\u0647 \u0648 \u0639\u0645\u0642\u060c \u0632\u0627\u0648\u06cc\u0647 \u0648 \u062c\u0647\u062a \u0686\u0631\u062e\u0634\u06cc\u060c \u0628\u0647\u200c\u0639\u0644\u0627\u0648\u0647\u0654 \u0634\u06a9\u0644 \u0644\u062b\u0647.",
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
          "decision": "founder approved all three in chat (AskUserQuestion, \u00ab\u062a\u0623\u06cc\u06cc\u062f\u00bb \u00d73): r-23331122, r-3a73f3fb, r-804f45d2",
          "evidence": [
            "founder chat answer 2026-11-16"
          ],
          "kind": "m2_exam_questions",
          "step": "C.5.6"
        },
        {
          "evidence": [
            "insight/insight-109.html first <p> in .glass-box = founder paragraph 1"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder text (Claude Docs rev104) first paragraph \u00ab\u0648\u0642\u062a\u06cc \u0627\u0632 \u06cc\u06a9 \u062f\u0646\u062f\u0627\u0646 \u062a\u0631\u0627\u0634\u200c\u062e\u0648\u0631\u062f\u0647 \u0642\u0627\u0644\u0628 \u0645\u06cc\u200c\u06af\u06cc\u0631\u06cc\u0645\u2026\u00bb opens the body before any heading or list"
        },
        {
          "english": {
            "evidence": [
              "file on disk, toggle ../insight-109.html; fa toggle en/insight-109.html; metanotes/en/meta-1.html unchanged"
            ],
            "path": "insight/en/insight-109.html",
            "status": "ready"
          },
          "evidence": [
            "all founder messages closed: M1 none, M3b none, M2 answered"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "plus/des-scores.json[insight/insight-109] COMMENTARY 15/E, Part 3 green; no Fidelity owed (basket 1); no M3b"
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
                "4.7: 0 (all strong glossary pages at cap); 4.8: abutment, emergence-profile inline; 4.9: insight-83, chairside-48, episode-80 (5/5)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "7 canonical tags reused, no mint; hashtag_ref --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "dentcast-brain.json clinical-109 at tail; plus/faq-corpus.json 9 FAQ + 6 cards"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "implant-prosthetic after insight-26; 3 exam rows approved in M2; bundle-implant-parts rejected gate 1"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html: new first line \u00ab\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0647\u062f\u0641\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb, oldest removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "insight/en/insight-109.html authored from locked text; toggles inverse; noindex, follow; no hreflang"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title confirmed (founder), caption confirmed (standing acceptance), M2 exam questions approved \u00d73"
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
          "note": "founder text (Claude Docs, rev 104) with founder-chosen title",
          "ref": "claude-docs:QnvQHznqT3oksW21pRWZQC#rev104",
          "sha256": "1b0868b21e0088b7bdbdc9837d52244e6f8afc8c46142c6c267d07b01fe09560"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "kind": "des_commentary_v3.7",
          "result": "insight/insight-109 COMMENTARY 15/E FULL_TEXT provisional=false; checklist 4/0/3/3 (item4 = insight/index.html section declaration, note present); Part3 (1) quotes verbatim (items1,3 in page body; item4 in insight/index.html) (2) 5+10=15 (3) band E (4) key set equals spec/precedent; (6) verify_publish --des-text ok; des_record_guard check ok; fidelity [null] (basket 1 self-record, Part 2b). Run: claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9) --tools \"\" --model opus, empty dir; modelUsage claude-opus-5-5. Run 1 without section metadata scored 12/E (item4=0, model said section unknown); run 2 added metadata line \u00absection: insight/\u00bb and is the stored record. No Part 2d audit (COMMENTARY). No DOI/abstract/quartile guessed.",
          "step": "C.4.13"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read complete: README, global/README + 5 selected sections, agent-parity, publish-checkpoints, modules 01/02 at origin/main 8ad07d57"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (Claude Docs rev104), paper file no -> normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 617 entries; latest clinical = clinical-108 keys [type,id,title,caption,hashtags,keywords,page_url,pillar]; live PILLARS read from tools/build_pillar.py at origin/main"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type clinical (founder: \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u0627\u0644 \u0627\u06cc\u0646\u0633\u0627\u06cc\u062a)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "max clinical = 108 -> insight-109, no gap"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text: Claude Docs rev104 (digest bound in context.inputs); title founder-chosen via question: \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0647\u062f\u0641"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: \u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a (no formulaic openers, clich\u00e9s or filler; founder had already revised wording in the doc)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: 10 founder images from the doc assets (jpeg, sha256 recorded by artifact tool), mapped in doc order to insight109-1..10.webp; founder captions per image; no audio/video"
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
          "basket 1 COMMENTARY: page carries no DOI/PubMed/references block; founder-authored teaching reasoning"
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
          "Pulse: agent drafts in clinical precedent pattern \u00ab\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb (index.html line ~6423)"
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
          "template = insight/insight-108.html (enrolled in target_paths; must stay byte-unchanged, checked at C.4)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/insight-109.html cloned from insight-108 structure; body = founder text (h2->h3 within glass-box), 10 figures /insight/insight109-k.webp with founder captions; domain dentcast.org kept; GA4 x1; 2 preconnect crossorigin; no trustseal; opening <p> is founder own first paragraph (author_original); no chip row in template; capsules reset to \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + /pillar/implantology/"
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
          "pillar implantology (single clear fit: implant impression); subtopic prosthetic-components (impression coping, analog, connection/hex, transfer accuracy, screw loosening from misfit; sibling clinical-26 scan-body transfer sits there); competing candidate restoration-design (emergence profile is one of four items) rejected: subject is transferring implant position through components"
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
          "insight/index.html hand-maintained: <li><a href=\"insight-109.html\">\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0647\u062f\u0641</a></li> added above insight-108 (newest first, unnumbered type)"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: BlogPosting datePublished/dateModified, MedicalWebPage datePublished/dateModified/lastReviewed, trustline time x2 = 2026-11-16 (before: 2026-11-15 from clone); all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- insight/insight-108.html: clean"
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
          "plus/des-scores.json[insight/insight-109]: COMMENTARY 15/E, Part 3 checks green, no Fidelity owed (basket 1), no M3b"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "fresh semantic review of 110 glossary terms: strong = emergence-profile, abutment, dental-implant, osseointegration -> all at/over cap per tools/related_cap.py (7/5, 5/5, 5/5, 5/5) -> 0 back-links added; borderline not linked: scan-body (digital transfer, not discussed), screw-retained, implant-supported-crown, ti-base"
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
          "inline links: \u00ab\u0627\u0628\u0627\u062a\u0645\u0646\u062a\u00bb (first occurrence, defined in text as part between implant and crown) -> /glossary/abutment.html; \u00ab\u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644\u00bb (first) -> /glossary/emergence-profile.html. Borderline skipped: \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb -> dental-implant (generic across whole page), \u00abosseointegration\u00bb in fig. 9 caption (caption, not body), \u0647\u06af\u0632/\u0622\u0646\u062a\u06cc\u200c\u0631\u0648\u062a\u06cc\u0634\u0646 -> episode-80 (kept for 4.9 instead), \u00abPassive fit\u00bb -> meta-20 (that page is about post-and-core misfit, different concept). git diff shows only <a> insertions"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "cap: 2 nav capsules -> 3 free; added strongest: insight-83 \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u062f\u0648 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0632\u0627\u0648\u06cc\u0647\u200c\u062f\u0627\u0631\u00bb (impression of angled implants), chairside-48 \u00ab\u0627\u062e\u062a\u0644\u0627\u0641 \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0631\u0648\u06cc \u06a9\u0633\u062a \u0648 \u062f\u0647\u0627\u0646\u00bb (cast vs mouth position mismatch), episode-80 \u00ab\u0627\u0646\u0648\u0627\u0639 \u06a9\u0627\u0646\u06a9\u0634\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb (connections/anti-rotation). Skipped for cap: insight-26 scan-body transfer, episode-130 emergence profile, insight-80 pick-up (crown pick-up, not implant), episode-133 scan bodies. related_cap 5/5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json[insight/insight-109].definedTermSets: 6 authored DefinedTerms #flashcards-c1..c6 (\u0627\u06cc\u0645\u067e\u0631\u0634\u0646 \u06a9\u0648\u067e\u06cc\u0646\u06af\u060c \u0622\u0646\u0627\u0644\u0648\u06af\u060c \u0632\u0646\u062c\u06cc\u0631\u0647\u200c\u06cc \u0627\u0646\u062a\u0642\u0627\u0644\u060c \u0622\u0646\u062a\u06cc\u200c\u0631\u0648\u062a\u06cc\u0634\u0646/\u0647\u06af\u0632\u060c \u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644\u060c Passive fit); none equals a FAQ answer with or without verdict; FAQ pairs 2-4 and 7 (explain-shaped) covered by authored cards rather than copied; not in page JSON-LD"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage #faq: 9 standalone questions, no article deixis; 5 binary (\u0622\u06cc\u0627\u2026) all open with \u00ab\u062e\u06cc\u0631\u061b\u00bb; 4 open/explain questions excluded from scored bank by shape. 4.12-\u0628: evaluated at 5.6"
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
          "Questions: (1) \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0642\u06cc\u0642\u0627\u064b \u0686\u06cc \u0631\u0648 \u0645\u0646\u062a\u0642\u0644 \u0645\u06cc\u200c\u06a9\u0646\u0647\u061f (2) \u0647\u06af\u0632 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062a\u0648 \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0686\u0647 \u0627\u0647\u0645\u06cc\u062a\u06cc \u062f\u0627\u0631\u0647\u061f (3) \u0686\u0631\u0627 \u067e\u0631\u0648\u062a\u0632 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a passive fit \u0646\u062f\u0627\u0631\u0647\u061f (4) \u0627\u0645\u0631\u062c\u0646\u0633 \u067e\u0631\u0648\u0641\u0627\u06cc\u0644 \u0631\u0648 \u0645\u0648\u0642\u0639 \u0642\u0627\u0644\u0628 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0627\u06cc\u062f \u062b\u0628\u062a \u06a9\u0631\u062f\u061f (5) \u062e\u0637\u0627\u06cc \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0639\u062f\u0627\u064b \u062c\u0628\u0631\u0627\u0646 \u0645\u06cc\u0634\u0647\u061f All reused, no mint: #\u0646\u06a9\u062a\u0647_\u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc (series) \u00b7 #\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc \u00ab\u067e\u0633 \u062f\u0631 \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0646\u0628\u0627\u0644 \u06a9\u067e\u06cc \u06a9\u0631\u062f\u0646 \u0633\u0637\u062d \u0646\u06cc\u0633\u062a\u06cc\u0645\u060c \u0628\u0644\u06a9\u0647 \u0645\u0648\u0642\u0639\u06cc\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0627 \u2026 \u0645\u0646\u062a\u0642\u0644 \u0645\u06cc\u200c\u06a9\u0646\u06cc\u0645.\u00bb \u00b7 #\u062e\u0637\u0627\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc \u00ab\u0627\u06af\u0631 \u0647\u0645\u06cc\u0646\u200c\u062c\u0627 \u062c\u0627\u06cc\u06af\u0627\u0647\u060c \u0632\u0627\u0648\u06cc\u0647 \u06cc\u0627 \u062c\u0647\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0627\u0634\u062a\u0628\u0627\u0647 \u0645\u0646\u062a\u0642\u0644 \u0634\u0648\u062f\u060c \u0645\u0631\u062d\u0644\u0647\u200c\u0647\u0627\u06cc \u0628\u0639\u062f\u06cc \u0622\u0646 \u0631\u0627 \u062c\u0628\u0631\u0627\u0646 \u0646\u0645\u06cc\u200c\u06a9\u0646\u0646\u062f\u00bb \u00b7 #\u0641\u06cc\u062a_\u067e\u0631\u0648\u062a\u0632 \u00ab\u0646\u062a\u06cc\u062c\u0647\u200c\u06cc \u0686\u0646\u06cc\u0646 \u062e\u0637\u0627\u06cc\u06cc \u0627\u06cc\u0646 \u0627\u0633\u062a \u06a9\u0647 \u067e\u0631\u0648\u062a\u0632 passive fit \u0646\u062f\u0627\u0631\u062f\u00bb \u00b7 #\u0647\u06af\u0632_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u00ab\u0627\u06af\u0631 \u062c\u0647\u062a \u0647\u06af\u0632 \u062f\u0631 \u0645\u062f\u0644 \u0628\u0627 \u062f\u0647\u0627\u0646 \u06cc\u06a9\u06cc \u0646\u0628\u0627\u0634\u062f\u060c \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u062f\u0631 \u062f\u0647\u0627\u0646 \u0686\u0646\u062f \u062f\u0631\u062c\u0647 \u0686\u0631\u062e\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0646\u0634\u06cc\u0646\u062f\u00bb \u00b7 #\u067e\u0631\u0648\u0641\u0627\u06cc\u0644_\u0627\u0645\u0631\u062c\u0646\u0633 \u00ab\u0627\u06af\u0631 \u0627\u06cc\u0646 \u0634\u06a9\u0644 \u062b\u0628\u062a \u0646\u0634\u0648\u062f\u060c \u062a\u06a9\u0646\u0633\u06cc\u0646 \u0622\u0646 \u0631\u0627 \u062d\u062f\u0633\u06cc \u0637\u0631\u0627\u062d\u06cc \u0645\u06cc\u200c\u06a9\u0646\u062f\u00bb \u00b7 #\u067e\u0631\u0648\u062a\u0632_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a umbrella in addition. Composition: series + decision (#\u0641\u06cc\u062a_\u067e\u0631\u0648\u062a\u0632,#\u062e\u0637\u0627\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc) + specific \u226410 (#\u0647\u06af\u0632_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a 2, #\u062e\u0637\u0627\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc 3, #\u0641\u06cc\u062a_\u067e\u0631\u0648\u062a\u0632 9) + umbrella. Dropped as mention: #\u0634\u0644_\u0634\u062f\u0646_\u067e\u06cc\u0686, #\u067e\u0648\u0632\u06cc\u0634\u0646_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a, #\u06a9\u0627\u0646\u06a9\u0634\u0646_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a. --sync done, --check OK, build_cabinet_papers --check OK. Reachability: Q2 -> label \u00ab\u0647\u06af\u0632 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb (2 pages) -> page in first 4 of chip: PASS; Q3 \u00ab\u0641\u06cc\u062a \u067e\u0631\u0648\u062a\u0632\u00bb (9 pages, rank depends on API order) recorded uncertain. content-index/assistant-tags reverted (runner C.8). No chip row on insight template."
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-brain.json: clinical-109 appended as last array element, keys identical to clinical-108 [type,id,title,caption,hashtags,keywords,page_url,pillar]; keywords 8 from text, none repeats a hashtag; json valid"
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
          "pathway_place: implant-prosthetic STRONG -> inserted after insight/insight-26 (index 23, 97 steps, no milestone). Not placed (ASK, conservative): fixed-pros 57 (after insight-80), implant-surgical 21, treatment-planning 15, digital 13, occlusion 10, failure-troubleshooting 10. Coverage: 1.52 per item (baseline 1.38; already above before this publish). 4.12-\u0628: 3 MCQ rows in plus/exam-questions.json byContent[insight/insight-109] (r-23331122, r-3a73f3fb, r-804f45d2), draft-check 0 errors, each approved by founder in M2; validate_exam_questions --content: 0 errors; drawn by implant-prosthetic"
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
          "Pulse first line added/oldest removed (7 lines); insight/en/insight-109.html authored (Phase D agent part: chrome from en/insight-108 i.e. meta-1 standard, insight glass-box body translated structure-faithfully, 3 h3 + 10 figures, GA4 x1, canonical self .org, noindex follow, zero hreflang, inLanguage/og:locale en, no same-word gloss duplicates, no specialist links); fa toggle en/insight-109.html present; meta-1 unchanged; ten-scope lock recorded; pending_questions empty"
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
      "insight/en/insight-109.html",
      "insight/index.html",
      "insight/insight-108.html",
      "insight/insight-109.html",
      "insight/insight109-1.webp",
      "insight/insight109-10.webp",
      "insight/insight109-2.webp",
      "insight/insight109-3.webp",
      "insight/insight109-4.webp",
      "insight/insight109-5.webp",
      "insight/insight109-6.webp",
      "insight/insight109-7.webp",
      "insight/insight109-8.webp",
      "insight/insight109-9.webp",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, index.html, insight/insight-109.html, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, insight/en/insight-109.html"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
