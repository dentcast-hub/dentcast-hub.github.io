# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "glossary/icdas"
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
    "category": "glossary",
    "content_id": "glossary/icdas",
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
          "kind": "pillar_v1",
          "pillar": {
            "primary": "operative",
            "secondary": [],
            "subtopic": "caries-management"
          },
          "reason": "ICDAS is a caries detection/staging system whose stated purpose is choosing between non-invasive management, monitoring and restoration; operative is the only pillar that holds caries; caries-management is the exact subtopic (cracked-tooth and direct-restorations do not cover detection). Standing acceptance (Hard Rule 14)."
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "note": "founder glossary entry text (English term, fa_title, three sections)",
          "ref": "founder-message:glossary-entry-icdas",
          "sha256": "d90a46a5f33b8a58cb1ff27339c17a7372009637ac430d64e93342b631814d9a"
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
          "Read completely this session at 7517b7f4: CLAUDE.md, workflows/README.md, global/README.md + selector core sections (repo-core, ads, publication-surfaces, des-display, site-invariants) for glossary paths, agent-parity.md, publish-checkpoints.md, publish-handoff-tool.md, modules 01 and 02. Capability check: git ls-remote origin OK; push to non-main branch available; Actions monitoring + PR + merge via GitHub MCP tools"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Text to publish: yes (founder glossary entry, sha256 d90a46a5\u2026); paper file attached: no \u2192 normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed dentcast-brain.json once (616 entries; glossary lives in glossary/glossary.json, 109 terms); latest glossary entry implant-supported-crown key set [slug,title,fa_title,synonyms,url,pillar]; live PILLARS read from tools/build_pillar.py (operative: caries-management, cracked-tooth, direct-restorations)"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Type locked: glossary (founder message is a glossary entry in the glossary-writer input shape)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Identifier: slug icdas \u2192 content_id glossary/icdas; no existing glossary/icdas.html, no glossary.json entry with that slug"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Text received in founder message (English term ICDAS, fa_title, three sections); bound by digest sha256 d90a46a54b0d\u2026 (private input, not in target_paths)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "De-AI pass run once on the as-submitted text: no genuine AI tell found (no formulaic openers/closers, clich\u00e9s, hedge stacking or filler); \u00ab\u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a\u00bb; text of record = founder text byte-identical"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Media: latest glossary page (implant-supported-crown.html) uses no image/audio/video fields; nothing to collect"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.7: no paper file attached \u2192 step 4.10 branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.8: basket 1 COMMENTARY \u2014 the page carries no DOI/PubMed id/references block; the text is the author's own conceptual entry (same basis as glossary/implant-supported-crown, glossary/treatment-plan)"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.9: \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (a glossary term, not a question post)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q5 Pulse: glossary terms are not announced in Pulse (module 02 Q5 / module 11 documented skip)"
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
        "reason": "Not LiteCast: locked category glossary (module 03 step 0 applies only to LiteCast)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template: glossary/implant-supported-crown.html (latest glossary term page, 2026-09-07), enrolled in target_paths; must stay byte-unchanged"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "glossary/icdas.html cloned from template (CRLF preserved): same tree/CSS/JSON-LD shape; swapped path, <title>/description/OG/Twitter/canonical/hreflang, TechArticle headline+description, DefinedTerm name=ICDAS alternateName=fa_title (founder string, copied), h1=fa_title, subtitle=ICDAS, dates, lang-btn \u2192 en/icdas.html; body = founder text byte-identical (7 <p> in the three fixed sections, verified by substring assertion against the private input); domain dentcast.org kept; preconnect x2 + GA once survived; no enamad seal; no hashtag chip row (template has none); body opens with prose (no list); lead = founder's own first paragraph (author_original)"
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
        "reason": "LiteCast-only in-body linking; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb linking; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar.primary=operative, subtopic=caries-management (live PILLARS); clear single fit: ICDAS is caries detection/staging feeding the non-invasive vs monitor vs restore decision; competing candidate treatment-planning/comprehensive-diagnosis rejected (diagnosis of caries is the operative pillar's caries-management scope). Standing acceptance, recorded in decisions[pillar_v1]"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Glossary branch: only the \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc capsule \u2192 /pillar/operative/ (canonical format), dc-related-section/dc-related-capsule markup; count 1 of 5"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Glossary landing /glossary/index.html is generated by tools/build_pillar.py glossary (part of all, runner C.8) from glossary/glossary.json; never hand-edited; registration in glossary.json happens with the entry write"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Date audit: before (template) 2026-09-07 on datePublished/dateModified/lastReviewed + two visible <time>; after: all 7 occurrences 2026-11-15 (datePublished=dateModified=today); canonical/og:url/hreflang/@id all /glossary/icdas.html \u2014 OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- glossary/implant-supported-crown.html \u2192 exit 0 (template unchanged)"
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
        "reason": "NoteCast-only (parent episode); category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast credit target only; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist prev/next only; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Q4.7); step 4.10 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Q4.7); step 4.10 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Q4.7); step 4.10 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [
          "COMMENTARY (basket 1). Part 1: source_text = page body as shipped (fa_title, ICDAS, three sections, founder text byte-identical), FULL_TEXT, no DOI/lookup. Part 2: SOURCE call = claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964f19c1d5c\u2026) --tools \"\" --model opus --no-session-persistence, fresh empty dir; model reported claude-opus-5-5. Result des_version 3.7 COMMENTARY: checklist 4/0/3/0 \u2192 des_score 12, band E, provisional false. Part 3: (1) both non-empty evidence_quotes verbatim in source_text; (2) 5+7=12 OK; (3) band E OK; (4) key set identical to stored COMMENTARY schema; (7) des_record_guard check OK; (6) verify_publish --des-text OK, interpretation_fa narrowed by agent (removed unsupported \u00ab\u062f\u0642\u06cc\u0642 \u0648 \u0628\u0627 \u0645\u0646\u0637\u0642 \u0631\u0648\u0634\u0646\u00bb and \u00ab\u0646\u0647 \u0627\u0632 \u0636\u0639\u0641 \u0645\u062d\u062a\u0648\u0627\u00bb; score/quotes untouched). Part 2b: no FIDELITY owed (page's own COMMENTARY self-record) \u2192 fidelity [null]. Part 2d: not owed (no RESEARCH record). Part 3b: nothing flagged \u2192 no M3b. Part 4: stored under glossary/icdas in plus/des-scores.json via dentcast_text_io.json_append (59 lines appended, nothing else touched)"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "glossary/en/icdas.html",
      "glossary/glossary.json",
      "glossary/icdas.html",
      "glossary/implant-supported-crown.html",
      "plus/des-scores.json",
      "plus/faq-corpus.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: glossary/icdas.html, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
