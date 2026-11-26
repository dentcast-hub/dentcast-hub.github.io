# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "metanotes/meta-24"
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
    "category": "meta",
    "content_id": "metanotes/meta-24",
    "context": {
      "approvals": [],
      "decisions": [
        {
          "attached_paper": "no",
          "challenge": "no",
          "kind": "intake_facts_v1"
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
          "answer": "\u0628\u062f\u0648\u0646 \u0633\u0624\u0627\u0644",
          "kind": "exam_questions_m2",
          "source": "founder chat 2026-11-26: \u00ab\u0633\u0648\u0627\u0644 \u0647\u0645 \u0646\u062f\u0627\u0631\u0647 \u0646\u0645\u06cc\u200c\u062e\u0648\u0627\u062f \u0628\u0631\u0627\u06cc \u0633\u0648\u0627\u0644 \u0635\u0628\u0631 \u06a9\u0646\u06cc\u00bb"
        }
      ],
      "delivery": [],
      "inputs": [],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": []
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "readpack meta/no/no/commentary/isolated read once (pack.json manifest, 16 sources)"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (founder artifact doc K6Prgs5EKrSfpG5eC8SCdQ), paper no -> normal publish"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed: type meta latest meta-23 keys type,id,title,caption,hashtags,keywords,page_url,pillar; PILLARS live read; template metanotes/meta-23.html"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type meta (founder: \u00ab\u0627\u06cc\u062f\u0647 \u06cc\u0627 \u0645\u062a\u0627\u0646\u0648\u062a\u00bb; series \u0627\u06cc\u062f\u0647\u0654 \u06f2\u06f4)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "number meta-24 (max meta-23 +1; founder doc says \u0627\u06cc\u062f\u0647\u0654 \u06f2\u06f4)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text: founder Claude Docs artifact K6Prgs5EKrSfpG5eC8SCdQ rev 1 (private input, not in git)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5 de-AI pass: \u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a (0 rewrites)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: meta template uses cover image only (dentcast-cover.webp), no audio/video; nothing to collect"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.7: no paper attached; step 4.10 branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.8 basket 1 COMMENTARY: founder own reflection, no DOI/PubMed id/references block; psychology concepts named without identifiers"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.9: \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (not a challenge)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q5 Pulse: no existing Pulse line announces a meta page -> documented skip (Question 5 precedent rule). Q6 M2: founder said no questions (\u0628\u062f\u0648\u0646 \u0633\u0624\u0627\u0644), recorded as decision"
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
        "reason": "not LiteCast",
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
          "template metanotes/meta-23.html (git diff --quiet clean)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "metanotes/meta-24.html cloned from meta-23 via asserted patch; body = founder text verbatim with founder headings as h4 (author numbered \u06f1-\u06f5, no numbers added); 2 dc-key frames; author first paragraph opens body; presentation_lint clean; domain .org kept; GA/preconnect from clone"
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
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar practice-infrastructure / subtopic llm-tools (closest semantic match; page is about personal work systems incl. AI notebook, AI tidying dictation and AI-run publish queue; competing: no clinical pillar fits; llm-tools = \u0627\u0628\u0632\u0627\u0631\u0647\u0627 \u0648 \u0641\u0636\u0627\u06cc \u06a9\u0627\u0631). Standing acceptance"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631 capsules: /glossary/ + /pillar/practice-infrastructure/"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "metanotes/index.html hand-maintained: <li> row \u00ab\u0627\u06cc\u062f\u0647\u0654 \u0628\u06cc\u0633\u062a\u200c\u0648\u0686\u0647\u0627\u0631\u0645: \u2026\u00bb appended after meta-23 + JSON-LD ListItem position 24; numberOfItems 22->24 (stale counter corrected to real item count)"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: datePublished/dateModified/lastReviewed + visible trustline = 2026-11-26 (no 2026-11-09 left)"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- metanotes/meta-23.html: clean"
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
        "reason": "NoteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast-only credit step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [
          "DES COMMENTARY: block des_commentary_block.py (FULL_TEXT, section metanotes/); isolated run cd mktemp -d && claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964\u2026e2e9) --tools \"\" --model opus, model reported claude-opus-5-5; des_repair usable, 0 repairs, 0 unverified; verify_publish --des-text ok; score 19 band E (item 4 from metanotes/index.html declaration, note present); fidelity [null] basket 1; stored plus/des-scores.json (+59 lines)"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "metanotes/index.html",
      "metanotes/meta-24.html",
      "plus/des-scores.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: metanotes/index.html, metanotes/meta-24.html, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
