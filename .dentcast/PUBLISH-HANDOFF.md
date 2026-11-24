# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-120"
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
    "content_id": "insight/insight-120",
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
          "read: global/README+3 pages, agent-parity, publish-checkpoints, modules/01, modules/02"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "routing: text=yes, attached paper file=no (only a JPG clinical photo) -> normal publish, no C.4.10 branch; category clinical (insight)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 638 entries, 14 types; clinical=119 entries, latest clinical-119 (insight-119.html) defines schema/keys; next number 120; closed dentai/photocast excluded; live PILLARS read from tools/build_pillar.py"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type=clinical (founder: \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u0627\u0644 \u0627\u06cc\u0646\u0633\u0627\u06cc\u062a; insight/ folder, brain type clinical) \u2014 offered set from brain"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number: max clinical id 119 + 1 = 120 -> clinical-120, /insight/insight-120.html"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "full \u0645\u062a\u0646 received from founder in the request (11 paragraphs + 3 headings + title)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: one rewrite \u2014 \u00ab\u062f\u0631 \u0627\u0635\u0644\u060c \u062f\u063a\u062f\u063a\u0647 \u0627\u0635\u0644\u06cc \u0627\u0648 \u0628\u06cc\u200c\u0627\u0637\u0645\u06cc\u0646\u0627\u0646\u06cc \u0627\u0632 \u067e\u0627\u06cc\u062f\u0627\u0631\u06cc \u0648 \u062a\u062f\u0627\u0648\u0645 \u062f\u0631\u0645\u0627\u0646 \u0644\u0645\u06cc\u0646\u06cc\u062a \u062f\u0631 \u0628\u0644\u0646\u062f\u0645\u062f\u062a \u062f\u0631 \u0635\u0648\u0631\u062a \u062a\u063a\u06cc\u06cc\u0631 \u0648\u0636\u0639\u06cc\u062a \u067e\u0627\u0644\u067e \u06cc\u0627 \u0634\u0631\u0627\u06cc\u0637 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u062f\u0646\u062f\u0627\u0646 \u0628\u0648\u062f.\u00bb -> \u00ab\u062f\u063a\u062f\u063a\u0647\u0654 \u0627\u0635\u0644\u06cc \u0627\u0648 \u0628\u06cc\u200c\u0627\u0637\u0645\u06cc\u0646\u0627\u0646\u06cc \u0627\u0632 \u067e\u0627\u06cc\u062f\u0627\u0631\u06cc \u0644\u0645\u06cc\u0646\u06cc\u062a \u062f\u0631 \u0628\u0644\u0646\u062f\u0645\u062f\u062a \u0628\u0648\u062f\u060c \u0627\u06af\u0631 \u0648\u0636\u0639\u06cc\u062a \u067e\u0627\u0644\u067e \u06cc\u0627 \u0634\u0631\u0627\u06cc\u0637 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u062f\u0646\u062f\u0627\u0646 \u062a\u063a\u06cc\u06cc\u0631 \u06a9\u0646\u062f.\u00bb (filler \u00ab\u062f\u0631 \u0627\u0635\u0644\u00bb + restatement removed; meaning unchanged). Other sentences judged natural, unchanged."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "image: founder JPG 1568x946 converted to WebP /insight/insight120-1.webp (51KB, long edge 1568<=1600); agent caption <=200 chars; posed clinical photo of #12 area"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": "no paper file attached (only a clinical JPG, not a research paper) -> paper branch inactive, documented skip",
        "status": "skipped"
      },
      {
        "evidence": [
          "DES basket 1 COMMENTARY: founder own clinical reasoning/case narration, no retrievable identifier (no DOI/PubMed/references block) in the text -> source_text is the page text, COMMENTARY track at C.4.13"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary post, not a challenge (no question/answer post requested) -> C.4.14 skipped"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse line (agent, no-spoiler, type precedent): \u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab\u062c\u062f\u0627 \u0634\u062f\u0646 \u0644\u0645\u06cc\u0646\u06cc\u062a \u062f\u0646\u062f\u0627\u0646 \u0644\u062a\u0631\u0627\u0644\u061b \u0622\u06cc\u0627 \u0628\u0631\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647 \u0628\u0627\u06cc\u062f \u0646\u06af\u0631\u0627\u0646 \u0628\u0648\u062f\u061f\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f"
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
        "reason": "LiteCast branch inactive \u2014 category is clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast source of truth not used",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast isolation not applicable",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast internal structure not applicable",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast keyed steps not applicable",
        "status": "skipped"
      },
      {
        "evidence": [
          "template lock: insight/insight-119.html is the previous same-category page and the structural template; unchanged (git diff --quiet -- insight/insight-119.html passes)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "page insight/insight-120.html built by structural clone of insight-119.html (same HTML tree/classes/components); domain dentcast.org kept; hreflang fa-IR->dentcast.ir; GA4 deferred once; 2 preconnects with crossorigin; no enamad seal; JSON-LD valid (3 blocks); lead = founder own first paragraph (author_original); presentation layer: 3 numbered h3, 1 callout box under \u00ab\u0646\u06a9\u062a\u0647 \u0628\u0627\u0644\u06cc\u0646\u06cc\u00bb, 1 dc-key frame; presentation_lint clean; image /insight/insight120-1.webp 1568x946 figure+figcaption"
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
        "reason": "LiteCast in-body linking not applicable",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast related links not applicable",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar.primary=esthetic (closest semantic fit: a ceramic laminate veneer on a lateral incisor and its long-term survival; precedent clinical-37 same topic), subtopic=veneers-laminates; competing candidate fixed-pros/failures (debonding as a failure mode) rejected because the page is about the veneer treatment decision and its restoration, not the fixed-pros failure taxonomy"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "two nav capsules placed first: /glossary/ \u00ab\u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647\u00bb + /pillar/esthetic/ \u00ab\u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc\u00bb (budget 5, 2 used, 3 remain for 4.9)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "hand-maintained landing insight/index.html: new <li><a href=\"insight-120.html\"> at top of the existing list, sibling markup exact (file is hand-maintained static HTML; queue_apply.py also edits it, no builder)"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "date audit: visible trustline publish+review, BlogPosting datePublished/dateModified, MedicalWebPage datePublished/dateModified/lastReviewed all 2026-11-24; no stale 2026-11-23 left (7 occurrences of the new date, 0 old)"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- insight/insight-119.html passes: template byte-unchanged"
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
        "reason": "NoteCast only \u2014 category is clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "episode/NoteCast shared source only \u2014 category is clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "insight is not a numbered series with an ep-nav bar",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached \u2014 paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached \u2014 paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached \u2014 paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [
          "DES COMMENTARY: source_text = page text of record via presentation_diff --text-of-record (FULL_TEXT, no DOI); SOURCE call in a separate subagent context (spec .dentcast/des-v3.7-knowledge.md read whole as its instruction, no external fetch); record stored at plus/des-scores.json insight/insight-120: des_score 15 band E, checklist 4+0+3+3, arithmetic and schema verified, all quotes verbatim (item 4 = insight/index.html declaration with the mandatory note naming that file); Fidelity not owed (basket-1 self-record) -> fidelity [null]; no ALTERED/REVERSED unit and no doubtful unit -> no M3b"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "started"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "insight/en/insight-120.html",
      "insight/index.html",
      "insight/insight-120.html",
      "insight/insight120-1.webp",
      "plus/des-scores.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: insight/insight-120.html, insight/insight120-1.webp, insight/index.html, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
