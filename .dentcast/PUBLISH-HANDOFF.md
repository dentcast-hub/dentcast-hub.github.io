# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "dentai/promptologist/prompt-append2-5"
- Status: in_progress
- Next canonical step: "C.4.10.1"
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "promptologist",
    "content_id": "dentai/promptologist/prompt-append2-5",
    "context": {
      "approvals": [
        {
          "decision": "Founder approved the full agent-converted (written-register) text including the opening paragraph",
          "evidence": [
            "founder-chat:2026-10-25:approval-of-converted-text"
          ],
          "scope": "authored-intro",
          "status": "confirmed"
        },
        {
          "decision": "\u067e\u06cc\u0648\u0633\u062a \u06f2 \u0640 \u0642\u0633\u0645\u062a \u06f5: \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06cc \u0641\u0627\u06cc\u0644\u200c\u0647\u0627 \u0631\u0627 \u062a\u063a\u06cc\u06cc\u0631 \u062f\u0627\u062f\u0647 \u0627\u0633\u062a\u061b \u0627\u0632 \u06a9\u062c\u0627 \u0628\u0641\u0647\u0645\u06cc\u0645 \u0647\u0645\u0647\u200c\u0686\u06cc\u0632 \u062f\u0631\u0633\u062a \u0627\u0633\u062a\u061f",
          "evidence": [
            "founder-chat:2026-10-25:approval-of-converted-title"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06cc \u0641\u0627\u06cc\u0644 \u0631\u0627 \u062a\u063a\u06cc\u06cc\u0631 \u062f\u0627\u062f\u0647 \u0627\u0633\u062a\u061b \u0628\u0627 Pull Request \u0645\u06cc\u200c\u0628\u06cc\u0646\u06cc\u0645 \u062f\u0642\u06cc\u0642\u0627\u064b \u0686\u0647 \u0686\u06cc\u0632\u06cc \u0639\u0648\u0636 \u0634\u062f\u0647 \u0648 \u0628\u0639\u062f \u062a\u0635\u0645\u06cc\u0645 \u0645\u06cc\u200c\u06af\u06cc\u0631\u06cc\u0645 \u0622\u0646 \u0631\u0627 \u0645\u0631\u062c \u06a9\u0646\u06cc\u0645 \u06cc\u0627 \u0646\u0647.",
          "evidence": [
            "founder-chat:2026-10-25:caption-approved-then-converted-approved"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "Option B: convert to written Persian like parts 1-4; quoted prompts stay conversational; typo \u067e\u06cc\u0648\u0633\u062a\u0647->\u067e\u06cc\u0648\u0633\u062a fixed",
          "evidence": [
            "founder-chat:2026-10-25:\u00ab\u06f1 \u0628\u060c \u06f2 \u0627\u0635\u0644\u0627\u062d \u06a9\u0646\u00bb"
          ],
          "scope": "register-conversion",
          "status": "confirmed"
        },
        {
          "decision": "three figure captions as proposed",
          "evidence": [
            "founder-chat:2026-10-25:\u00ab\u0628\u0642\u06cc\u0647 \u0647\u0645\u0647 \u062a\u0623\u06cc\u06cc\u062f\u00bb"
          ],
          "scope": "image-captions",
          "status": "confirmed"
        },
        {
          "decision": "#\u067e\u0631\u0627\u0645\u067e\u062a\u0648\u0644\u0648\u0698\u06cc\u0633\u062a #\u0647\u0648\u0634_\u0645\u0635\u0646\u0648\u0639\u06cc #GitHub #ChatGPT; keywords Pull Request, PR, Files changed, Merge, Conflict, Branch, \u0628\u0631\u0631\u0633\u06cc \u062a\u063a\u06cc\u06cc\u0631\u0627\u062a \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06cc, GitHub",
          "evidence": [
            "founder-chat:2026-10-25:\u00ab\u0628\u0642\u06cc\u0647 \u0647\u0645\u0647 \u062a\u0623\u06cc\u06cc\u062f\u00bb"
          ],
          "scope": "hashtags-keywords",
          "status": "confirmed"
        },
        {
          "decision": "ordinary article, not challenge",
          "evidence": [
            "founder-chat:2026-10-25:\u00ab\u0628\u0642\u06cc\u0647 \u0647\u0645\u0647 \u062a\u0623\u06cc\u06cc\u062f\u00bb"
          ],
          "scope": "challenge",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "category": "promptologist",
          "challenge": false,
          "des_basis": "COMMENTARY",
          "kind": "routing_basis_v1",
          "paper_file": false,
          "pillar": "practice-infrastructure",
          "subtopic": "llm-tools"
        },
        {
          "evidence": [
            "founder-chat:2026-10-25:\u00ab\u062a\u0623\u06cc\u06cc\u062f\u060c \u0627\u062f\u0627\u0645\u0647 \u0628\u062f\u0647 \u0647\u0645\u0647 \u0686\u06cc \u062a\u0627\u06cc\u06cc\u062f\u0647\u00bb after reviewing full converted text file"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "agent_authored",
          "source_ref": "founder-submitted-text:2026-10-25:\u067e\u06cc\u0648\u0633\u062a-\u06f2-\u0642\u0633\u0645\u062a-\u06f5 converted to written register by agent at founder's request (option B)"
        },
        {
          "builder_ref": "manual-index:dentai/promptologist/index.html:ai-item rows",
          "evidence": [
            "review:all-first-cut-modified-paths; prompt-append2-4 diff is single ep-nav slot"
          ],
          "kind": "first_cut_scope_audit_v1",
          "landing_mode": "included",
          "landing_path": "dentai/promptologist/index.html",
          "observed_changed_paths": [
            "dentai/promptologist/prompt-append2-5.html",
            "dentai/promptologist/prompt-append2-4.html",
            "dentai/promptologist/index.html",
            "dentai/promptologist/prompt-append2-5-01-pull-request.webp",
            "dentai/promptologist/prompt-append2-5-02-files-changed.webp",
            "dentai/promptologist/prompt-append2-5-03-merge-status.webp"
          ],
          "related_changed_paths": [
            "dentai/promptologist/prompt-append2-4.html"
          ]
        },
        {
          "kind": "pulse_draft_v1",
          "page_url": "/dentai/promptologist/prompt-append2-5.html",
          "text": "\u067e\u06cc\u0648\u0633\u062a \u06f2 \u0640 \u0642\u0633\u0645\u062a \u06f5: \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06cc \u0641\u0627\u06cc\u0644\u200c\u0647\u0627 \u0631\u0627 \u062a\u063a\u06cc\u06cc\u0631 \u062f\u0627\u062f\u0647 \u0627\u0633\u062a\u061b \u0627\u0632 \u06a9\u062c\u0627 \u0628\u0641\u0647\u0645\u06cc\u0645 \u0647\u0645\u0647\u200c\u0686\u06cc\u0632 \u062f\u0631\u0633\u062a \u0627\u0633\u062a\u061f"
        }
      ],
      "delivery": [],
      "inputs": [
        "author-chat-message:2026-10-25:Promptologist-append2-5-full-Persian-text",
        "author-chat-message:2026-10-25:four-GitHub-mobile-screenshots-of-PR-893"
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        "Reviewed uncommitted page/landing/nav/images; 5-link cap satisfied; CRLF preserved; content checks only, not DES/Fidelity"
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read:global-router+selected-sections(repo-core,up-board,ads,clinic,pathway-operations,premium-shell,audio-hub,google-auth,publication-surfaces,badges-ai,des-display,plus-features,site-invariants)+agent-parity+README+modules01/02+publish-checkpoints"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "route:text=yes,paper_file=no -> normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain:574 entries parsed; latest promptologist entry prompt-append2-4 defines schema (type,id,title,caption,hashtags,keywords,page_url,pillar); template dentai/promptologist/prompt-append2-4.html; live PILLARS read"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder-message:2026-10-25:\u00ab\u0642\u0633\u0645\u062a \u0628\u0639\u062f\u06cc \u0641\u0631\u0627\u0645\u062a\u0648\u0644\u0648\u0698\u06cc\u0633\u062a\u00bb -> category promptologist"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "auto:series prompt-append2-1..4 contiguous; next id prompt-append2-5 matches founder title \u00ab\u0642\u0633\u0645\u062a \u06f5\u00bb"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "author-chat-message:2026-10-25:full Persian text received"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI scan: no genuine AI tells; founder chose register option B (convert to written Persian like parts 1-4) and approved converted full text+title on 2026-10-25; typo \u067e\u06cc\u0648\u0633\u062a\u0647->\u067e\u06cc\u0648\u0633\u062a fix approved"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: 3 images cropped from founder-supplied GitHub mobile screenshots of PR #893; founder approved captions"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 1 COMMENTARY: author tutorial text, no DOI/references"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder confirmed ordinary article (not challenge) 2026-10-25"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pulse draft: title-only link to /dentai/promptologist/prompt-append2-5.html; founder approved"
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
        "reason": "LiteCast branch inactive: locked category promptologist",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category promptologist",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category promptologist",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category promptologist",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category promptologist",
        "status": "skipped"
      },
      {
        "evidence": [
          "template dentai/promptologist/prompt-append2-4.html sha256 356404bcf8c6666e6899772be743fc0766c8f31c0f98e4e98111afd1d3d9c93d"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "page dentai/promptologist/prompt-append2-5.html sha256 597f5bf90605320a0176b333dce45adfcd5df4df2106621fe76551dab4f18c08; structural clone of append2-4 (CRLF kept); GA4 once, 2 preconnect; founder-approved formal body+title+caption; 3 webp figures; lead paragraph is founder-approved text"
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
        "reason": "LiteCast-only link step; category promptologist",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only kavosh step; category promptologist",
        "status": "skipped"
      },
      {
        "evidence": [
          "live PILLARS read; practice-infrastructure (structured) / llm-tools: single clear fit for AI-tool workflow tutorial, same as parts 1-4; stated to founder 2026-10-25, no objection"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "typed-brain branch: dc-related-section with \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/practice-infrastructure/ (2 links)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "hand-maintained dentai/promptologist/index.html: added row \u00ab\u0642\u0633\u0645\u062a \u06f5 \u2014 <title>\u00bb after part 4 with approved caption as ai-desc; sha256 e49a17c3->42884108; 5-line insertion only"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "audit: datePublished=dateModified=2026-10-25 (only dates on page); title/og/twitter/headline/breadcrumb/h1 all new title; description/og/twitter/JSON-LD description = approved caption; canonical/og:url/hreflang -> append2-5 on .org; all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "template sha256 recomputed 356404bcf8c6666e6899772be743fc0766c8f31c0f98e4e98111afd1d3d9c93d == C.1"
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
        "reason": "NoteCast-only parent-episode step; category promptologist",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "episode/NoteCast sibling DES-credit mirror; not applicable to promptologist (no sibling, no paper)",
        "status": "skipped"
      },
      {
        "evidence": [
          "new page prev slot -> prompt-append2-4.html, next slot empty placeholder; prompt-append2-4.html next slot span->a to prompt-append2-5.html only diff, sha256 356404bcf8c6666e6899772be743fc0766c8f31c0f98e4e98111afd1d3d9c93d -> b34ba5020ae383d78e610a678a7c0968c90fe518b1175104b5ab82209ddb5baf"
        ],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "semantic review of all 109 glossary terms: all clinical-material/technique concepts; none conceptually related to GitHub PR/diff/merge/conflict workflow (resin-cements appears only inside screenshot image of PR #893, not a discussed concept) -> analyzed, 0 qualifying terms; no glossary page edited"
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
        "reason": "not a glossary publication",
        "status": "skipped"
      },
      {
        "evidence": [
          "fresh semantic analysis of body vs 109 glossary terms + brain episodes: body discusses PR/Files changed/Merge/Conflict and a post-op-bleeding instruction file only as an example; no glossary term or episode is the concept discussed at any spot -> analyzed body, 0 qualifying candidates; page sha256 unchanged 597f5bf90605320a0176b333dce45adfcd5df4df2106621fe76551dab4f18c08"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "whole-brain semantic ranking: prompt-append2-4 (Commit/Push/Revert, cited as previous part), prompt-append2-3 (Branch/Merge, cited \u00ab\u062f\u0631 \u0642\u0633\u0645\u062a \u0633\u0648\u0645\u00bb), prompt-append2-2 (my-prompts repo used in example) auto-applied; prompt7-2 (responsibility for AI text) considered, not added (cap). 2 capsules + 3 = 5/5; no self-link; sha256 597f5bf90605320a0176b333dce45adfcd5df4df2106621fe76551dab4f18c08 -> 088a742f4630155f243826312658f54fc6f009e80c4733ce3ebbae7ad7e0146c"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "dentai/promptologist/index.html",
      "dentai/promptologist/prompt-append2-4.html",
      "dentai/promptologist/prompt-append2-5-01-pull-request.webp",
      "dentai/promptologist/prompt-append2-5-02-files-changed.webp",
      "dentai/promptologist/prompt-append2-5-03-merge-status.webp",
      "dentai/promptologist/prompt-append2-5.html"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentai/promptologist/prompt-append2-5.html, dentai/promptologist/prompt-append2-4.html, dentai/promptologist/index.html, dentai/promptologist/prompt-append2-5-01-pull-request.webp, dentai/promptologist/prompt-append2-5-02-files-changed.webp, dentai/promptologist/prompt-append2-5-03-merge-status.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
