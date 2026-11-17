# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-110"
- Status: in_progress
- Next canonical step: "C.4.7"
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
      "approvals": [],
      "decisions": [
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
    "note": "Index-only refresh after staging delivery paths: insight/insight-110.html, insight/index.html, insight/insight110-1.webp, insight/insight110-2.webp, insight/insight110-3.webp, insight/insight110-4.webp, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
