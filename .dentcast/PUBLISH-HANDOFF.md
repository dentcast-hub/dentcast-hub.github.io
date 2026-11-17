# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-111"
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
    "content_id": "insight/insight-111",
    "context": {
      "approvals": [
        {
          "decision": "\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc \u062f\u0631 \u0628\u0631\u0627\u0628\u0631 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc",
          "evidence": [
            "founder doc heading (Claude Docs rev96) in the series title form the founder chose in chat for parts 1-2 (no space before colon)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u062f\u0631 \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc \u06a9\u0648\u067e\u06cc\u0646\u06af \u0647\u0645\u0631\u0627\u0647 \u0642\u0627\u0644\u0628 \u0628\u06cc\u0631\u0648\u0646 \u0645\u06cc\u200c\u0622\u06cc\u062f \u0648 \u062f\u0631 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc \u062f\u0631 \u062f\u0647\u0627\u0646 \u0645\u06cc\u200c\u0645\u0627\u0646\u062f \u0648 \u0628\u0647 \u0642\u0627\u0644\u0628 \u0628\u0631\u06af\u0631\u062f\u0627\u0646\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f\u061b \u0647\u0645\u06cc\u0646 \u062a\u0641\u0627\u0648\u062a \u0645\u0646\u0628\u0639 \u062e\u0637\u0627\u060c \u0627\u0645\u06a9\u0627\u0646 \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u0648 \u0627\u0646\u062f\u06cc\u06a9\u0627\u0633\u06cc\u0648\u0646 \u0647\u0631 \u0631\u0648\u0634 \u0631\u0627 \u062a\u0639\u06cc\u06cc\u0646 \u0645\u06cc\u200c\u06a9\u0646\u062f.",
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
          "decision": "founder approved all three in chat (AskUserQuestion, \u00ab\u062a\u0623\u06cc\u06cc\u062f\u00bb \u00d73): r-f03640d7, r-169a41a4, r-9e58478f",
          "evidence": [
            "founder chat answer 2026-11-17"
          ],
          "kind": "m2_exam_questions",
          "step": "C.5.6"
        },
        {
          "evidence": [
            "insight/insight-111.html first <p> in .glass-box = founder paragraph 1"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder text (Claude Docs rev96) first paragraph \u00ab\u0641\u0631\u0642 \u0627\u0635\u0644\u06cc \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc \u0648 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc\u2026\u00bb opens the body before any figure or heading"
        },
        {
          "english": {
            "evidence": [
              "file on disk, toggle ../insight-111.html; fa toggle en/insight-111.html; metanotes/en/meta-1.html unchanged"
            ],
            "path": "insight/en/insight-111.html",
            "status": "ready"
          },
          "evidence": [
            "all founder messages closed: M1 none, M3b none, M2 answered"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "plus/des-scores.json[insight/insight-111] COMMENTARY 15/E, Part 3 green; no Fidelity owed (basket 1); no M3b"
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
                "4.7: 0; 4.8: insight-83, scan-body inline; 4.9: insight-110, insight-109, insight-83 (5/5)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "7 canonical tags reused, no mint; --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "dentcast-brain.json clinical-111 at tail; plus/faq-corpus.json byContent[insight/insight-111] 11 FAQ + 6 cards"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "implant-prosthetic after insight-110; 3 exam rows approved in M2; bundle-implant-parts rejected gate 1"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html: new first line for insight-111, oldest (share-52) removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "insight/en/insight-111.html authored from locked text; toggles inverse; noindex, follow; no hreflang"
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
          "ref": "claude-docs:QCcDaRqM7fUJe8AnqDA3YK#rev96",
          "sha256": "76e1036f8fc6e18d83f14b28dd57577e9011b95331ad211e4aab250bc6481395"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "kind": "des_commentary_v3.7",
          "result": "insight/insight-111 COMMENTARY 15/E FULL_TEXT provisional=false; checklist 4/0/3/3 (item4 = insight/index.html section declaration, note present); Part3 (1) quotes verbatim (items1,3 in page body incl. table text; item4 in insight/index.html) (2) 5+10=15 (3) band E (4) key set equals precedent clinical insight-110; (6) verify_publish --des-text ok, interpretation_fa sentences checked, no change needed; (7) des_record_guard check ok; fidelity [null] (basket 1 self-record; des_fidelity_units: 0 units). Run: claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9) --tools \"\" --model opus, empty dir; modelUsage claude-opus-5-5; metadata section: insight/. No Part 2d audit (COMMENTARY). No DOI/abstract/quartile guessed.",
          "step": "C.4.13"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read complete earlier in this same session (README, global/README + 5 sections, agent-parity, publish-checkpoints, publish-handoff-tool, modules 01/02, readpack for clinical); no workflow/tool change between a5089c5d and origin/main 6846d5e1 (git diff empty)"
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
          "brain parsed: 619 entries; latest clinical = clinical-110 keys [type,id,title,caption,hashtags,keywords,page_url,pillar]; PILLARS read at origin/main 6846d5e1"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type clinical (founder: \u00ab\u0642\u0633\u0645\u062a \u0628\u0639\u062f\u06cc\u0634\u00bb of insight-110 series)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "max clinical = 110 -> insight-111, no gap"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text: Claude Docs rev96 (digest bound); title from the doc heading \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a : \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc \u062f\u0631 \u0628\u0631\u0627\u0628\u0631 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc\u00bb normalized to the founder's series form chosen for parts 1-2 (no space before colon): \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc \u062f\u0631 \u0628\u0631\u0627\u0628\u0631 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc\u00bb"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: no AI tells. Typography-only fix: caption 2 \u00ab\u0645\u0627\u062f\u0647\u200c\u06cc \u0642\u0627\u0644\u0628 \u06af\u06cc\u0631\u06cc\u00bb -> \u00ab\u0645\u0627\u062f\u0647\u200c\u06cc \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc\u00bb. Founder spelling \u00ab\u0627\u0648\u067e\u0646\u00bb kept everywhere"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: 5 founder images in doc order from artifact assets (jpeg; 1c72602c\u2026, 2626d130\u2026, f2004f24\u2026, 179f5b73\u2026, 68a6b9f2\u2026) -> insight111-1..5.webp; founder captions/alts; no audio/video"
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
          "template = insight/insight-110.html (enrolled; byte-unchanged, checked at C.4)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/insight-111.html cloned from insight-110; body = founder text (h2->h3, B.3.5 fix), 5 figures /insight/insight111-k.webp (WebP q82, \u22641600px, \u2264300KB) with founder captions/alts; comparison table as <table> with thead/tbody, page-local .glass-box table CSS copied verbatim from sharehub/share-51 (insight template has none); domain dentcast.org kept; GA4 x1; 2 preconnect; no trustseal; opening <p> = founder's own first paragraph (author_original); capsules reset to \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + /pillar/implantology/"
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
          "pillar implantology (clear: implant impression technique); subtopic prosthetic-components (same series as clinical-109/110; impression copings, pick-up vs reposition transfer); restoration-design rejected"
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
          "insight/index.html: <li><a href=\"insight-111.html\">\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc \u062f\u0631 \u0628\u0631\u0627\u0628\u0631 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc</a></li> above insight-110"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: all JSON-LD/trustline dates = 2026-11-17 (same day as clone source); all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- insight/insight-110.html: clean"
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
          "plus/des-scores.json[insight/insight-111]: COMMENTARY 15/E, Part 3 green, no Fidelity owed (basket 1), no M3b"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "fresh semantic review of 110 glossary terms: no term is resolved by this page (open vs closed tray technique has no glossary entry); scan-body (named only as next part's topic) borderline and at cap 5/5; abutment, dental-implant not discussed -> 0 back-links"
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
          "inline links: \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0628\u0627 \u0647\u0645 \u0632\u0627\u0648\u06cc\u0647 \u062f\u0627\u0631\u0646\u062f\u00bb -> /insight/insight-83.html (impression of two angled implants: exactly this case); \u00ab\u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc\u00bb (first occurrence, technical) -> /glossary/scan-body.html. Borderline skipped: \u00ab\u067e\u06cc\u06a9\u200c\u0622\u067e\u00bb -> insight-80 (pick-up of crowns/prostheses, different object), \u00ab\u067e\u06cc\u0686 \u06af\u0627\u06cc\u062f\u00bb -> insight-110 (not referred back explicitly), \u00abpassive fit\u00bb (no matching page), \u00ab\u0627\u0633\u067e\u0644\u06cc\u0646\u062a\u00bb -> share-28/45 (splinting crowns, different concept). git diff shows only <a> insertions"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "cap: 2 nav -> 3 free; added: insight-110 \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0627\u0628\u0632\u0627\u0631\u00bb and insight-109 \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u0647\u062f\u0641\u00bb (series parts, siblings first), insight-83 \u00ab\u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u062f\u0648 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0632\u0627\u0648\u06cc\u0647\u200c\u062f\u0627\u0631\u00bb. Skipped for cap/borderline: insight-80 pick-up, episode-108 multi-unit, chairside-48 cast vs mouth, episode-133 scan bodies. related_cap 5/5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent[insight/insight-111].definedTermSets: 6 authored DefinedTerms #flashcards-c1..c6 (\u067e\u06cc\u06a9\u200c\u0622\u067e\u060c \u0631\u06cc\u200c\u067e\u0648\u0632\u06cc\u0634\u0646\u060c \u062a\u0631\u06cc \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc\u060c \u0627\u0633\u067e\u0644\u06cc\u0646\u062a \u06a9\u0648\u067e\u06cc\u0646\u06af\u200c\u0647\u0627\u060c \u0627\u0646\u062f\u06cc\u06a9\u0627\u0633\u06cc\u0648\u0646 \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc\u060c \u0627\u0646\u062f\u06cc\u06a9\u0627\u0633\u06cc\u0648\u0646 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc); none equals a FAQ answer; comparison/decision FAQ pairs (1,4,5,9,10) not turned into cards; not in page JSON-LD"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "byContent[insight/insight-111].faqPages: 11 standalone questions, no deixis; 5 binary (\u0622\u06cc\u0627\u2026): 4 \u00ab\u062e\u06cc\u0631\u061b\u00bb, 1 \u00ab\u0628\u0644\u0647\u061b\u00bb; 6 why/what questions excluded from scored bank by shape. 4.12-\u0628: evaluated at 5.6"
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
          "Questions: (1) \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc \u06cc\u0627 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc \u0628\u0631\u0627\u06cc \u0642\u0627\u0644\u0628 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u061f (2) \u0628\u0631\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627\u06cc \u0632\u0627\u0648\u06cc\u0647\u200c\u062f\u0627\u0631 \u06a9\u062f\u0648\u0645 \u0631\u0648\u0634 \u0642\u0627\u0644\u0628\u061f (3) open tray splint \u06a9\u0648\u067e\u06cc\u0646\u06af \u0644\u0627\u0632\u0645\u0647\u061f (4) \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc \u0628\u0631\u0627\u06cc \u062a\u06a9 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u06a9\u0627\u0641\u06cc\u0647\u061f (5) \u0686\u0631\u0627 \u0641\u06cc\u062a \u067e\u0631\u0648\u062a\u0632 \u0686\u0646\u062f\u0648\u0627\u062d\u062f\u06cc \u0628\u0627 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc \u062e\u0631\u0627\u0628 \u0645\u06cc\u200c\u0634\u0647\u061f All reused, no mint: #\u0646\u06a9\u062a\u0647_\u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc (series) \u00b7 #\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc_\u0627\u0648\u067e\u0646_\u062a\u0631\u06cc \u00ab\u0628\u0631\u0627\u06cc \u0647\u0645\u06cc\u0646 \u062f\u0631 \u06a9\u0627\u0631\u0647\u0627\u06cc \u0686\u0646\u062f \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u06cc\u060c \u06a9\u0647 \u062e\u0637\u0627\u06cc \u0647\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0648\u06cc passive fit \u06a9\u0644 \u067e\u0631\u0648\u062a\u0632 \u0627\u062b\u0631 \u0645\u06cc\u200c\u06af\u0630\u0627\u0631\u062f\u060c \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u0645\u0639\u0645\u0648\u0644 \u0627\u0633\u062a.\u00bb \u00b7 #\u0627\u06cc\u0645\u067e\u0644\u0646\u062a_\u0632\u0627\u0648\u06cc\u0647_\u062f\u0627\u0631 \u00ab\u0628\u0631\u0627\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0628\u0627 \u0647\u0645 \u0632\u0627\u0648\u06cc\u0647 \u062f\u0627\u0631\u0646\u062f \u0647\u0645 \u0642\u0627\u0644\u0628\u200c\u06af\u06cc\u0631\u06cc \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u0627\u0631\u062c\u062d \u0627\u0633\u062a.\u00bb \u00b7 #\u062e\u0637\u0627\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc \u00ab\u062f\u0631 \u0686\u0646\u062f \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0647\u0631 \u0628\u0631\u06af\u0631\u062f\u0627\u0646\u062f\u0646 \u062e\u0637\u0627\u06cc \u062e\u0648\u062f\u0634 \u0631\u0627 \u062f\u0627\u0631\u062f \u0648 \u0627\u06cc\u0646 \u062e\u0637\u0627\u0647\u0627 \u0631\u0648\u06cc \u0647\u0645 \u062c\u0645\u0639 \u0645\u06cc\u200c\u0634\u0648\u0646\u062f.\u00bb \u00b7 #\u0641\u06cc\u062a_\u067e\u0631\u0648\u062a\u0632 \u00ab\u062f\u0631 \u062a\u06a9 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u060c \u067e\u0631\u0648\u062a\u0632 \u0628\u0647 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u06cc\u06af\u0631\u06cc \u0648\u0635\u0644 \u0646\u06cc\u0633\u062a \u0648 \u0645\u0633\u0626\u0644\u0647\u200c\u06cc passive fit \u0628\u06cc\u0646 \u0686\u0646\u062f \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0645\u0637\u0631\u062d \u0646\u0645\u06cc\u200c\u0634\u0648\u062f\u060c \u0628\u0631\u0627\u06cc \u0647\u0645\u06cc\u0646 \u06a9\u0644\u0648\u0632 \u062a\u0631\u06cc \u0645\u0639\u0645\u0648\u0644\u0627\u064b \u06a9\u0627\u0641\u06cc \u0627\u0633\u062a.\u00bb \u00b7 #\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc, #\u067e\u0631\u0648\u062a\u0632_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a umbrellas. Composition: series + decision (#\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc_\u0627\u0648\u067e\u0646_\u062a\u0631\u06cc, #\u062e\u0637\u0627\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc) + specific \u226410 (#\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc_\u0627\u0648\u067e\u0646_\u062a\u0631\u06cc 2, #\u0627\u06cc\u0645\u067e\u0644\u0646\u062a_\u0632\u0627\u0648\u06cc\u0647_\u062f\u0627\u0631 5, #\u062e\u0637\u0627\u06cc_\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc 5, #\u0641\u06cc\u062a_\u067e\u0631\u0648\u062a\u0632 10) + umbrellas. Closed-tray concept absent; not minted (open-tray concept and its alias \u00ab\u0627\u0648\u067e\u0646 \u062a\u0631\u06cc\u00bb already surface the open-vs-closed question; conservative). Dropped as mention: #\u0627\u0633\u067e\u0644\u06cc\u0646\u062a_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a (crown splinting, different), #\u0642\u0627\u0644\u0628_\u067e\u06cc\u06a9_\u0622\u067e (restoration pick-up), #\u0627\u0633\u06a9\u0646_\u0628\u0627\u062f\u06cc (next part), #\u0627\u06cc\u0645\u067e\u0644\u0646\u062a_\u0641\u0648\u0644_\u0622\u0631\u0686. --sync, --check OK, cabinet --check OK. Reachability: Q1/Q2 -> \u00ab\u0642\u0627\u0644\u0628\u06af\u06cc\u0631\u06cc \u0627\u0648\u067e\u0646 \u062a\u0631\u06cc\u00bb (2 pages) PASS; Q2 \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0632\u0627\u0648\u06cc\u0647 \u062f\u0627\u0631\u00bb (5, rank 5) uncertain. content-index/assistant-tags reverted (runner C.8)"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-brain.json: clinical-111 appended last (620), keys identical to clinical-110; 8 keywords from text, none repeats a hashtag, same list as page JSON-LD keywords; json valid"
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
          "pathway_place: implant-prosthetic (score 90, ASK only because no \u00ab\u0642\u0633\u0645\u062a N\u00bb in title; anchor = own series part 2) -> placed after insight/insight-110 (index 25, 99 steps, no milestone): series part 3, same subject. Not placed (conservative): fixed-pros (65, anchor insight-83; part 1-2 not there, would split series), implant-surgical, post-and-core, digital, occlusion, biomimetic (ASK). Coverage 1.52 per item. 4.12-\u0628: 3 MCQ rows plus/exam-questions.json byContent[insight/insight-111] (r-f03640d7, r-169a41a4, r-9e58478f), draft-check 0/0, each approved in M2; validate --content 0 errors; drawn by implant-prosthetic"
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
          "Pulse first line added/oldest share-52 removed (7 lines); insight/en/insight-111.html authored (chrome from en/insight-110 = meta-1 standard, glass-box body translated structure-faithfully: 11 p, 3 h3, 5 figures, 7-row table; GA4 x1, canonical self .org, noindex follow, zero hreflang, en locale, no gloss duplicates, no specialist links); toggles inverse; meta-1 unchanged; ten-scope lock recorded; pending_questions empty"
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
      "insight/en/insight-111.html",
      "insight/index.html",
      "insight/insight-110.html",
      "insight/insight-111.html",
      "insight/insight111-1.webp",
      "insight/insight111-2.webp",
      "insight/insight111-3.webp",
      "insight/insight111-4.webp",
      "insight/insight111-5.webp",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, index.html, insight/insight-111.html, insight/en/insight-111.html, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
