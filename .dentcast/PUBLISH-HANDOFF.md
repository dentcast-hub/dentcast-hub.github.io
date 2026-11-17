# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-111"
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
    "content_id": "insight/insight-111",
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
    "note": "Index-only refresh after staging delivery paths: insight/insight-111.html, insight/index.html, insight/insight111-1.webp, insight/insight111-2.webp, insight/insight111-3.webp, insight/insight111-4.webp, insight/insight111-5.webp, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
