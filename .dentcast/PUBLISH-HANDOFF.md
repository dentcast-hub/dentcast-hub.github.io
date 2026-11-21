# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "dentcast-plus/video-16"
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
    "category": "dentcast_plus",
    "content_id": "dentcast-plus/video-16",
    "context": {
      "approvals": [
        {
          "decision": "\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645 \u0628\u0648\u062f\u060c \u0648\u0644\u06cc \u0634\u06a9\u0633\u062a\u061b \u062f\u0631\u0633\u062a \u0627\u0632 \u0648\u0633\u0637\u0650 \u06a9\u0627\u0646\u0627\u0644\u0650 \u067e\u06cc\u0686\u0650 \u0622\u062e\u0631\u06cc\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a.",
          "evidence": [
            "founder data: first line of the founder's caption (chat 2026-11-21), per video-14/15 precedent; copied codepoint for codepoint"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645 \u0628\u0648\u062f\u060c \u0648\u0644\u06cc \u0634\u06a9\u0633\u062a\u061b \u062f\u0631\u0633\u062a \u0627\u0632 \u0648\u0633\u0637\u0650 \u06a9\u0627\u0646\u0627\u0644\u0650 \u067e\u06cc\u0686\u0650 \u0622\u062e\u0631\u06cc\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a.\n\u0628\u06cc\u0634\u062a\u0631\u06cc\u0646 \u062e\u0645\u0634 \u0647\u0645\u0648\u0646\u200c\u062c\u0627\u0633\u062a \u0648 \u06a9\u0627\u0646\u0627\u0644\u0650 \u067e\u06cc\u0686 \u0647\u0645 \u0641\u0644\u0632 \u0631\u0648 \u06a9\u0645 \u06a9\u0631\u062f\u0647.\n\u0645\u06cc\u0644\u06cc\u0648\u0646\u200c\u0647\u0627 \u0628\u0627\u0631 \u062c\u0648\u06cc\u062f\u0646\u060c \u06cc\u0647 \u062a\u0631\u06a9\u0650 \u0631\u06cc\u0632\u060c \u0648 \u062a\u0645\u0627\u0645.\n\n\u0628\u0631\u0627\u06cc \u0628\u0631\u0631\u0633\u06cc \u0648 \u062a\u062d\u0644\u06cc\u0644 \u06a9\u0627\u0645\u0644 \u0648\u06cc\u062f\u06cc\u0648 \u0631\u0648 \u0628\u0628\u06cc\u0646\u06cc\u062f\n\n\ud83d\udcf7 \u062a\u0635\u0627\u0648\u06cc\u0631 \u06a9\u06cc\u0633 \u0627\u0632 \u0648\u06cc\u062f\u06cc\u0648\u06cc \u06cc\u06a9\u06cc \u0627\u0632 \u0647\u0645\u06a9\u0627\u0631\u0627\u0646",
          "evidence": [
            "founder data: caption text supplied verbatim in chat 2026-11-21 after reviewing the agent's transcription"
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
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "note": "founder caption text supplied in chat 2026-11-21 (title = its first line)",
          "ref": "founder-chat:caption",
          "sha256": "28c1ffcd707a6b6e5e247993386299e81cc684bdddad5eadbe497d42f73618db"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": []
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read README.md, global/README.md + selector (8 sections, 5 pages), agent-parity.md, publish-checkpoints.md, modules 01/02 complete; capability: ls-remote ok, push to ccr branch, GitHub MCP for Actions/PR/merge"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text yes (founder caption), paper file no -> normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed: 15 dentcast_plus entries, last video-15 keyset [type,video,title,caption,hashtags,keywords,page_url,pillar]; PILLARS read live"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type dentcast_plus (founder: video, \u00ab\u0648\u06cc\u062f\u06cc\u0648\u0647\u0627\u00bb section; precedent video-15)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number video 16 (max 15 + 1, no gap)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text = founder caption (chat 2026-11-21), sha bound in context.inputs"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5: founder caption is short and natural; no AI tells; text unchanged (title/caption never touched, HR16)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: ArvanVOD r7zm1zpJnk (config/HLS/thumbnail from founder screenshot), YouTube 1_ibkPAlt8M (founder link); no image/audio/transcript in video precedent"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.7: no paper file attached -> step 4.10 skipped"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.8 basket 1 COMMENTARY: founder's own case reasoning, no DOI/PubMed/references -> C.4.13 COMMENTARY track on page text"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.9: \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (video post, not a question)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q5 Pulse: agent draft in video-15 precedent pattern \u00ab\u06cc\u06a9 \u0648\u06cc\u062f\u06cc\u0648 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb (title-only, no spoiler); written at C.6"
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
        "reason": "LiteCast branch inactive: category dentcast_plus",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [
          "template dentcast-plus/video-15.html (latest same-category page) enrolled in target_paths"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-plus/video-16.html cloned from video-15 (structure only): founder caption as body <p>s (5 paragraphs, author_original lead), title/meta/OG/Twitter/JSON-LD/breadcrumb swapped, ArvanVOD r7zm1zpJnk + YouTube 1_ibkPAlt8M, dates 2026-11-21, .org domain kept, GA x1, 2 preconnect, no seal; no chip row in template"
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
        "reason": "LiteCast-only (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar implantology / subtopic restoration-design (strong: titanium bar of full-arch implant prosthesis fracturing at screw channel = framework/restoration design; matches clinical-114 it summarizes; competing prosthetic-components (screws) rejected: subject is the bar framework, not the screw)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "typed brain entry branch: 2 capsules \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/implantology/ in existing dc-related-section"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-plus/index.html hand-maintained static grid: video-card for video-16 added first (newest-first), sibling markup, thumbnail r7zm1zpJnk, title verbatim"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "date audit: uploadDate/datePublished/dateModified 2026-11-21 (before 2026-11-18 cloned) \u2014 all OK; no visible body date in template"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- dentcast-plus/video-15.html: clean"
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
        "reason": "NoteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast/episode pair only (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "no ep-nav block on dentcast-plus pages (not a numbered series)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [
          "DES COMMENTARY: source_text = page body (founder caption, FULL_TEXT); SOURCE call claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964\u2026) --tools '' --model opus, fresh empty dir, model reported claude-opus-5-5; des 3.7 score 9 band E (5 + item1 4); Part 3 checks: quote verbatim OK, arithmetic OK, band E OK, schema OK; verify_publish --des-text ok; Part 3(6): interpretation_fa sentence 1 narrowed by agent (model said '\u0634\u06a9\u0633\u062a\u06af\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u06cc' + '\u06a9\u0627\u0646\u062a\u06cc\u0644\u06cc\u0648\u0631\u062f\u0627\u0631' \u2014 not in text) -> '\u0634\u06a9\u0633\u062a\u0650 \u06cc\u06a9 \u0642\u0637\u0639\u0647\u0654 \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u06cc\u2026'; no FIDELITY owed (basket 1 COMMENTARY self-record, des_fidelity_units: 0 units); stored plus/des-scores.json dentcast-plus/video-16 (scored_at 2026-11-21, no fidelity key); no M3b"
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
      "dentcast-plus/en/video-15.html",
      "dentcast-plus/en/video-16.html",
      "dentcast-plus/index.html",
      "dentcast-plus/video-15.html",
      "dentcast-plus/video-16.html",
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-plus/video-16.html, dentcast-plus/index.html, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
