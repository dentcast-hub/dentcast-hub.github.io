# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-52"
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
    "category": "sharehub",
    "content_id": "sharehub/share-52",
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
        },
        {
          "kind": "source_resolution",
          "note": "Part 1 ladder: cabinet miss for all; PubMed MCP abstracts for refs 1,6,7,8,9,11,12 and ref 10 (PMC7241566 -> PMID 32490402) -> ABSTRACT_ONLY; refs 2,3,4,5,13,14 hosts blocked by session network policy (curl CONNECT 403; WebFetch ENOTFOUND) -> M1. des_record_guard lookup: 0 stored records for every DOI. SOURCE: claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964\u2026) --tools '' --model opus (modelUsage claude-opus-5-5), empty dir, one block per source. S12 run 1 invalid (consensus-only keys on a RESEARCH object) -> rerun 36/D. Part 2d audits (system sha256 948e8bf6\u2026) agree on all 8 (exit 0). Part 3(6): two S1 interpretation_fa judgments trimmed."
        },
        {
          "kind": "m1_answers",
          "note": "M1 answered by founder: ref 13 abstract pasted from the DOAJ page (Borhan Haghighi & Pahlavanpour Fard Jahromy, J Dent Biomater 2014) -> ABSTRACT_ONLY, 25/D (run 1 invalid: consensus-only keys; rerun). Ref 14 PDF attached (Nodehi et al., J Mash Dent Sch 2023;47(1):90-7, DOI 10.22038/jmds.2023.63550.2142): pdf_source_text.py extracted the Persian body in reversed visual order (unusable), so the English abstract on page 1 is the source_text -> ABSTRACT_ONLY, 47/C; not a step-4.10 attached paper (supplied as source text for an existing reference). Refs 2,3,4,5: \u00ab\u0646\u062f\u0627\u0631\u0645 \u2026 \u062f\u0633 \u0647\u0645 \u0646\u0645\u06cc\u062e\u0648\u0627\u0646 \u0641\u06cc\u062f\u06cc\u0644\u06cc\u062a\u06cc \u0647\u0645 \u0646\u0645\u06cc\u062e\u0648\u0627\u0646\u00bb -> slots {des_version 3.7, error INSUFFICIENT_TEXT}, fidelity null via POOLED object (share-51 ref 9 precedent). Network change (create_environment) declined: approval not possible from phone."
        },
        {
          "kind": "fidelity_run",
          "note": "Scope POOLED (prose names no source; citations are numeric). One SOURCE-scope FIDELITY call per source with text (S1,S6-S14), each all 73 units, spec .dentcast/des-v3.7-knowledge.md as system prompt, claude -p --tools '' --model opus (modelUsage claude-opus-5-5), fresh empty dir each; --merge -> pooled 98 HIGH (19 matches, 1 altered u11 HEDGE_REMOVED S7, 34 not_assessable, 1 author_view, 18 not_a_claim). --accept exit 0 (18 checks). POOLED is not judged/voted (module 08 Part 2c), so no doubtful-unit list. Provisional record stored in plus/des-scores.json for the save point."
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "note": "founder text, exported verbatim from the founder's Claude Doc",
          "ref": "claude-docs:npg-post-and-core (founder doc)",
          "sha256": "f2e9156ceed66af25d9198a8da3dc31f84579d3b09ee12f2888d2470a6e239aa"
        }
      ],
      "pending_questions": [
        {
          "answered": false,
          "message": "M3b",
          "question": "u11 \u00ab\u0641\u0642\u0637 \u0646\u0633\u062e\u0647\u200c\u06cc NPG+2 \u0645\u0642\u062f\u0627\u0631 \u06a9\u0645\u06cc \u0637\u0644\u0627 \u062f\u0627\u0631\u0647 [\u06f2].\u00bb ALTERED (HEDGE_REMOVED, S7): \u0627\u0635\u0644\u0627\u062d \u06a9\u0646 / \u062e\u0648\u062f\u0645 \u0645\u06cc\u200c\u0646\u0648\u06cc\u0633\u0645 / \u0647\u0645\u06cc\u0646 \u0628\u0645\u0627\u0646\u062f",
          "step": "C.4.13"
        }
      ],
      "unrelated_changes": [],
      "validation": []
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read: README.md, global/README.md+core sections (3 pages), agent-parity.md, publish-checkpoints.md, publish-handoff-tool.md, modules/01, modules/02"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (founder Claude Doc), paper file no -> normal publish, no paper branch. Capability preflight: git ls-remote origin OK; push to session branch ccr-e4172164-1fnv07 allowed; Actions monitoring + PR/merge via GitHub MCP"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 612 entries; latest sharehub = id 51 (/sharehub/share-51.html), key set type,id,title,caption,author,source,hashtags,keywords,url,pillar{primary,secondary,subtopic}; live PILLARS read (fixed-pros has post-and-core)"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type = sharehub (founder: \u00ab\u0627\u0632 \u0646\u0648\u0639 \u0634\u06cc\u0631\u0647\u0627\u0628\u00bb)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number = max(51)+1 = 52 -> sharehub/share-52; founder slug npg-post-and-core-evidence is not the sharehub URL pattern (share-N), recorded, not used as filename"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "full text received in founder Claude Doc; bound by sha256 f2e9156c\u2026 (context.inputs); founder title = doc H1, founder caption = \u00ab\u0645\u062a\u0627 \u062f\u06cc\u0633\u06a9\u0631\u06cc\u067e\u0634\u0646\u00bb line"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5 de-AI pass: \u00ab\u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a\u00bb \u2014 colloquial first-person founder register, varied rhythm, no formulaic openers/clich\u00e9s/hedge stacking; zero rewrites"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: latest sharehub brain entry has no image/audio/video field; doc carries no image -> no media to collect"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached -> step 4.10 branch inactive (documented skip)"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES basket 2 (RESEARCH): page carries a \u00ab\u0645\u0646\u0627\u0628\u0639\u00bb block with PubMed ids 29807967, 41210404, 18546197, 11005911, 26046108, 25006386, 28808455 (+DOI 10.22037/iej.v12i3.10586) plus non-DOI sources (FDA 510k K972971/K863782, ADA page, manufacturer catalogue, PMC7241566 article, DOAJ 2014 article, MUMS 2023 PDF); one DES record per cited source"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary article (\u00ab\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc\u00bb), not a \u0686\u0627\u0644\u0634"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent drafts in sharehub precedent (title alone as link text, <li><a href=/sharehub/share-52.html>TITLE</a></li>) \u2014 standing acceptance"
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
        "reason": "not LiteCast (category sharehub): LiteCast branch inactive",
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
          "template = sharehub/share-51.html (previous same-category page), enrolled in target_paths, kept byte-unchanged"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/share-52.html cloned structurally from share-51; body = founder text of record (Q3.5: unchanged) converted mechanically from the exported doc (no retyping); founder title/caption copied verbatim to title/h1/og/twitter/JSON-LD/breadcrumb (8 title, 4 caption surfaces); domain dentcast.org kept; GA4 once; 2 preconnect crossorigin at top of head; no trust seal; body opens with founder prose paragraph before any list/table (author_original lead); no hashtag chip row in sharehub template"
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
          "pillar.primary = fixed-pros, subtopic = post-and-core (one clear fit: the piece is about cast post-and-core alloy choice; operative/ceramics rejected \u2014 not restorative-direct nor ceramic). Standing acceptance."
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with 2 capsules: /glossary/ + /pillar/fixed-pros/ (typed brain entry branch); budget used 2/5"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/index.html is hand-maintained static HTML: added <li><a href=\"share-52.html\">TITLE (\u0645\u0637\u0644\u0628\u06cc \u0627\u0632 \u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646)</a></li> at top, matching siblings"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "date audit: datePublished=dateModified=2026-11-14 (JSON-LD); template has no other visible/meta dates; canonical/og:url/breadcrumb/hreflang -> share-52; title/description/og/twitter match founder strings \u2014 all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- sharehub/share-51.html: exit 0 (template unchanged)"
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
        "reason": "not a NoteCast/episode pair",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "sharehub is not a numbered series with ep-nav",
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
        "evidence": [],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "started"
      }
    ],
    "target_paths": [
      ".dentcast/des-fidelity-plans/sharehub/share-52.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-52.html",
      "sharehub/index.html",
      "sharehub/share-51.html",
      "sharehub/share-52.html"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: sharehub/share-52.html, sharehub/index.html, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
