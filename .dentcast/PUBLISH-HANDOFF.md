# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-113"
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
    "content_id": "insight/insight-113",
    "context": {
      "approvals": [],
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
    "note": "Index-only refresh after staging delivery paths: insight/insight-113.html, insight/index.html, insight/insight113-1.webp, insight/insight113-2.webp, insight/insight113-3.webp, insight/insight113-4.webp, insight/insight113-5.webp, insight/insight113-6.webp, insight/insight113-7.webp, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
