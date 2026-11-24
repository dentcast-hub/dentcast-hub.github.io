# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-55"
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
    "category": "chairside",
    "content_id": "chairside/chairside-55",
    "context": {
      "approvals": [
        {
          "decision": "approved two drafted MCQs verbatim",
          "evidence": [
            "chat: \u00ab\u062a\u0627\u06cc\u06cc\u062f\u00bb over the two questions shown"
          ],
          "scope": "M2 exam questions",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "decision": "founder confirmed the type is chairside (\u0648\u06cc\u0632\u06cc\u062a), not clinical insight",
          "evidence": [
            "chat message \u00ab\u062a\u0627\u06cc\u06cc\u062f \u0627\u0644\u0628\u062a\u0647 \u0645\u0646 \u06af\u0641\u062a\u0645 \u062a\u0632 \u0646\u0648\u0639 \u0686\u06cc\u0631\u0633\u0627\u06cc\u062f \u0647\u0633\u062a\u00bb"
          ],
          "kind": "founder_category_correction"
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
          "global README + 5 selected pages, agent-parity, checkpoints, modules 01/02 read for this run"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text present, no paper: normal publish"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed; chairside series ends at chairside-54; PILLARS live"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type=chairside per founder correction (the case is a \u0648\u06cc\u0632\u06cc\u062a)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "number 55; max chairside page 54"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder supplied the text"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "style-only rewrite applied: '\u0628\u0627\u0639\u062b \u0627\u06cc\u062c\u0627\u062f \u0686\u0646\u062f \u0645\u0634\u06a9\u0644 \u0647\u0645\u200c\u0632\u0645\u0627\u0646 \u0634\u062f\u0647 \u0627\u0633\u062a' \u2192 '\u0686\u0646\u062f \u0645\u0634\u06a9\u0644 \u0631\u0627 \u0647\u0645\u200c\u0632\u0645\u0627\u0646 \u0633\u0627\u062e\u062a\u0647 \u0627\u0633\u062a'; rest byte-identical"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder image saved as chairside/cs55-1.webp (WebP 1400x1209, 281 KB, under 1600px/300KB)"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file: paper branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES basket 1 COMMENTARY: own case narrative, no DOI or reference list"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary post, not a challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse per chairside precedent (\u0648\u06cc\u0632\u06cc\u062a \u06f5\u06f5 row/link with the title, no spoiler)"
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
          "template locked: chairside/chairside-54.html, left byte-unchanged"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "cloned chairside-54 structure; .org domain kept; GA once; two preconnect with crossorigin; body opens with the founder's own first paragraph (author_original); three marked \u2206 headings; presentation_lint clean"
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
          "pillar.primary=fixed-pros, subtopic=failures (failing splinted crowns, overhang, staged retreatment); treatment-planning/comprehensive-diagnosis considered and not chosen"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "capsules: \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/fixed-pros/"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "chairside/index.html is hand-maintained: added \u00ab\u0648\u06cc\u0632\u06cc\u062a \u06f5\u06f5 \u2014 \u2026\u00bb row at the top, CRLF preserved"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "all dates 2026-11-24 across visible and JSON-LD fields"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- chairside/chairside-54.html empty: template untouched"
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
        "reason": "not a NoteCast",
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
        "reason": "not a numbered series with ep-nav",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached",
        "status": "skipped"
      },
      {
        "evidence": [
          "COMMENTARY basket: source_text = chairside text-of-record (3012 chars), text_basis FULL_TEXT; SOURCE call in a tool-less API process with .dentcast/des-v3.7-knowledge.md as system prompt (gpt-6.2-astra); des_score 15, band E (4+0+3+3); all quotes verbatim, item 4 quoted from chairside/index.html with its note; verify_publish --des-text ok; stored under chairside/chairside-55 in plus/des-scores.json; Fidelity omitted (basket-1 self-record)"
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
      "chairside/chairside-55.html",
      "chairside/cs55-1.webp",
      "chairside/en/chairside-55.html",
      "chairside/index.html",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: chairside/chairside-55.html, chairside/cs55-1.webp, chairside/index.html, plus/des-scores.json, insight/insight-121.html, insight/insight121-1.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
