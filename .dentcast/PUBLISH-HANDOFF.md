# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "dentcast-plus/video-17"
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
    "content_id": "dentcast-plus/video-17",
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
          "note": "Instagram caption the founder approved in chat 2026-11-21 and asked to use for this page (agent-drafted, founder-approved; hashtags and site line excluded)",
          "ref": "founder-chat:instagram-caption",
          "sha256": "5263344e434d9c424c8e739e78e36c3a6ba9159d5a01707a9e122fb99155f967"
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
          "read README.md, global/README.md + selector (8 sections, 5 pages), agent-parity.md, publish-checkpoints.md, publish-handoff-tool.md, modules 01/02 complete; capability: ls-remote ok, push to ccr branch, claude -p isolated OK, GitHub MCP for Actions/PR/merge"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text yes (founder-approved caption), paper file no -> normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed: 16 dentcast_plus entries, last video-16 keyset [type,video,title,caption,hashtags,keywords,page_url,pillar]; PILLARS read live (11 pillars)"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type dentcast_plus (founder: video with ArvanVOD + YouTube links; \u00ab\u0648\u06cc\u062f\u06cc\u0648\u0647\u0627\u00bb section; precedent video-16)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number video 17 (max 16 + 1, no gap)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text = Instagram caption founder approved in chat and asked to use for this page (sha bound in context.inputs); site line + hashtags excluded from page text"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5: caption short, conversational, no AI tells (no formulaic openers, no clich\u00e9s, no hedge stacking); text unchanged"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: ArvanVOD 0ER38L3P1Q (iframe/HLS/config/thumbnail/video URLs from founder screenshot; host unreachable from sandbox, URLs copied verbatim), YouTube Shorts o6etIO47y9Q (founder link); no image/audio/transcript in video precedent"
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
          "Q4.8 basket 1 COMMENTARY: page text is DentCast's own clinical reasoning on the clip, no DOI/PubMed/references -> C.4.13 COMMENTARY track on page text"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.9: \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (video post, not a challenge)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q5 Pulse: agent draft in video-16 precedent pattern \u00ab\u06cc\u06a9 \u0648\u06cc\u062f\u06cc\u0648 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb (title-only, no spoiler); written at C.6"
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
          "template dentcast-plus/video-16.html (latest same-category page) enrolled in target_paths"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-plus/video-17.html cloned from video-16 (structure only): caption as body <p>s (7 paragraphs, author_original lead), title/meta/OG/Twitter/JSON-LD/breadcrumb swapped, ArvanVOD 0ER38L3P1Q (iframe name, config, HLS master, thumbnail) + YouTube o6etIO47y9Q, dates 2026-11-21, .org domain kept, GA x1, 2 preconnect, no seal; cloned semantic capsules removed (4.9 refills); no chip row in template"
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
          "pillar occlusion / subtopic occlusal-analysis-adjustment (closest semantic match: the page is about a canted occlusal plane whose origin is below the prosthesis, i.e. occlusal-plane analysis before restoring; competing: treatment-planning/comprehensive-diagnosis (remake-or-not question) and removable-pros (no partial-denture subtopic) \u2014 occlusion chosen because the decisive concept is the occlusal plane, not the denture type)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "typed brain entry branch: 2 capsules \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/occlusion/ in cloned dc-related-section (cloned semantic capsules of video-16 removed); note: body has 6 <p> (C.2 evidence said 7 \u2014 correction)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-plus/index.html hand-maintained static grid: video-card for video-17 added first (newest-first), sibling markup, thumbnail 0ER38L3P1Q, title verbatim"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "date audit: JSON-LD uploadDate/datePublished/dateModified 2026-11-21 (today) \u2014 all OK; no visible body date in template"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- dentcast-plus/video-16.html: clean"
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
          "DES COMMENTARY: source_text = page body (6 paragraphs, FULL_TEXT); SOURCE call claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964\u2026) --tools '' --model opus, fresh empty dir, model reported claude-opus-5-5; des 3.7 score 5 band E (5 + 0; all four checklist items 0); Part 3 checks: quotes (all empty) OK, arithmetic OK, band E OK, schema == video-16 keyset OK; des_record_guard check OK; verify_publish --des-text ok; Part 3(6): interpretation_fa sentence 1 narrowed by agent ('\u0628\u0647 \u0633\u0627\u062e\u062a\u0627\u0631 \u0632\u06cc\u0631 \u067e\u0631\u0648\u062a\u0632' -> '\u0634\u0631\u0648\u0639 \u06a9\u062c\u06cc \u2026 \u0628\u0647 \u0632\u06cc\u0631 \u067e\u0631\u0648\u062a\u0632', text says only \u00ab\u0634\u0631\u0648\u0639\u0634 \u0632\u06cc\u0631 \u067e\u0631\u0648\u062a\u0632\u0647\u00bb); no FIDELITY owed (basket 1 COMMENTARY self-record, des_fidelity_units: 0 units); stored plus/des-scores.json dentcast-plus/video-17 (scored_at 2026-11-21, no fidelity key); no M3b"
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
      "dentcast-plus/en/video-16.html",
      "dentcast-plus/en/video-17.html",
      "dentcast-plus/index.html",
      "dentcast-plus/video-16.html",
      "dentcast-plus/video-17.html",
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-plus/video-17.html, dentcast-plus/index.html, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
