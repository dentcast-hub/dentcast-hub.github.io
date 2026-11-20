# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "plak-sefr/plak1-14"
- Status: in_progress
- Next canonical step: "C.4.13"
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "plak_sefr",
    "content_id": "plak-sefr/plak1-14",
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
          "note": "founder text (transcribed body)",
          "ref": "artifact:claude-docs/1c7c1566-9bb6-4fe4-8d02-640b19857111@rev26",
          "sha256": "d7010b85fdbb60f16faff32c7c18f4a20fb2403576208d8b4053226dd514a9b7"
        },
        {
          "note": "9 founder images",
          "ref": "upload:plak14-images.zip",
          "sha256": "762b57163f8cb550ceddbaece9231114c91f3e79e61229aff60518fbe8c341fa"
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
          "read README, global router + 5 sections (3 pages), agent-parity, publish-checkpoints, modules 01/02 completely at a0fee349"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "routing: text present (founder Claude Docs doc 1c7c1566, episode 14) + 9 founder images (upload zip); no paper attached -> normal publish only. Capability check: git ls-remote origin OK, push to non-main branch ccr-* allowed, Actions monitoring + PR/merge via GitHub MCP"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once (627 entries); plak_sefr latest plak1-13 keys type,id,title,caption,hashtags,keywords,page_url,pillar; PILLARS read live from build_pillar.py"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type locked: plak_sefr (doc title names \u067e\u0644\u0627\u06a9 \u0635\u0641\u0631 \u0642\u0633\u0645\u062a \u06f1\u06f4)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number plak1-14 (plak1-1..13 contiguous; matches founder \u00ab\u0642\u0633\u0645\u062a \u06f1\u06f4\u00bb)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text of record: founder Claude Docs doc 1c7c1566 tab cd5a9884-2196 rev 26 (XML read); bound by digest in context.inputs"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: natural founder prose, no genuine AI tells; 0 rewrites, text unchanged"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "9 founder webp screenshots (upload zip) mapped to doc order by content and saved as plak-sefr/arvan-records-table, arvan-record-types, arvan-dns-menu, arvan-new-record, arvan-dns-records, gh-more-settings, gh-settings-pages, gh-custom-domain, gh-pages-live (.webp, native size, 30-102 KB, as series precedent); no audio/video field for this type"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached -> step 4.10 skipped"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 1 COMMENTARY: authored how-to guide, no DOI/PubMed/references; page own text is source_text"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary article, not a challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: \u00ab\u067e\u0644\u0627\u06a9 \u0635\u0641\u0631\u060c \u0642\u0633\u0645\u062a \u06f1\u06f4: \u00ab\u067e\u0631 \u06a9\u0631\u062f\u0646 \u062f\u0641\u062a\u0631\u060c \u0633\u0627\u06cc\u062a \u0631\u0648\u06cc \u062f\u0627\u0645\u0646\u0647\u200c\u06cc \u062e\u0648\u062f\u062a\u0627\u0646\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb in the series title-only pattern (plak1-13 precedent)"
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
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [
          "template lock: previous same-category page plak-sefr/plak1-13.html; git diff --quiet held before series wiring (TEMPLATE_UNCHANGED)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "page plak-sefr/plak1-14.html cloned from plak1-13 (CRLF kept, .org domain kept, GA once, preconnect x2, no trustseal, dc-notify removed for runner Phase E); body = founder text of record with 9 founder images (captions only where the doc has italic captions: 3), founder table rendered as ep-table with page-local CSS; lead paragraph = founder first paragraph; title from founder H1 \u00ab\u067e\u0631 \u06a9\u0631\u062f\u0646 \u062f\u0641\u062a\u0631\u060c \u0633\u0627\u06cc\u062a \u0631\u0648\u06cc \u062f\u0627\u0645\u0646\u0647\u200c\u06cc \u062e\u0648\u062f\u062a\u0627\u0646\u00bb with series prefix; caption agent-composed; chips #\u067e\u0644\u0627\u06a9_\u0635\u0641\u0631 #\u0633\u0627\u06cc\u062a_\u0645\u0637\u0628 #\u062f\u0627\u0645\u0646\u0647_\u0633\u0627\u06cc\u062a #GitHub existing canonical (--simulate)"
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
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar practice-infrastructure / subtopic site-ownership (DNS records, custom domain, HTTPS = owning the site; same as plak1-11..13; competing llm-tools rejected; no new subtopic)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "typed brain entry branch: both capsules /glossary/ and /pillar/practice-infrastructure/ (semantic capsules at C.4.9)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plak-sefr/index.html hand-maintained: row \u00ab\u0642\u0633\u0645\u062a \u06f1\u06f4 \u2014 \u067e\u0631 \u06a9\u0631\u062f\u0646 \u062f\u0641\u062a\u0631\u060c \u0633\u0627\u06cc\u062a \u0631\u0648\u06cc \u062f\u0627\u0645\u0646\u0647\u200c\u06cc \u062e\u0648\u062f\u062a\u0627\u0646\u00bb added after \u06f1\u06f3 in sibling markup, CRLF kept"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: datePublished=dateModified=2026-11-20 in JSON-LD; no other visible date; OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- plak-sefr/plak1-13.html succeeded (TEMPLATE_UNCHANGED) before wiring"
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
        "reason": "NoteCast only: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast/episode pair only: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [
          "series wiring: new page previous slot -> plak1-13; plak1-13 next slot span -> link to plak1-14 (git diff shows only that slot); en/plak1-13 next slot wired with the English mirror before C.6"
        ],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7): paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7): paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7): paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "started"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plak-sefr/arvan-dns-menu.webp",
      "plak-sefr/arvan-dns-records.webp",
      "plak-sefr/arvan-new-record.webp",
      "plak-sefr/arvan-record-types.webp",
      "plak-sefr/arvan-records-table.webp",
      "plak-sefr/en/plak1-13.html",
      "plak-sefr/en/plak1-14.html",
      "plak-sefr/gh-custom-domain.webp",
      "plak-sefr/gh-more-settings.webp",
      "plak-sefr/gh-pages-live.webp",
      "plak-sefr/gh-settings-pages.webp",
      "plak-sefr/index.html",
      "plak-sefr/plak1-13.html",
      "plak-sefr/plak1-14.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: plak-sefr/plak1-14.html, plak-sefr/plak1-13.html, plak-sefr/index.html, plus/des-scores.json, plak-sefr/arvan-records-table.webp, plak-sefr/arvan-record-types.webp, plak-sefr/arvan-dns-menu.webp, plak-sefr/arvan-new-record.webp, plak-sefr/arvan-dns-records.webp, plak-sefr/gh-more-settings.webp, plak-sefr/gh-settings-pages.webp, plak-sefr/gh-custom-domain.webp, plak-sefr/gh-pages-live.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
