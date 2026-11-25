# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-57"
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
    "content_id": "chairside/chairside-57",
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
          "content_id": "chairside/chairside-57",
          "decision": "founder rejected both drafted MCQs: publish with no exam question for this page",
          "drafted": 2,
          "evidence": [
            "M2 message in chat at intake (question tool, founder reply: \u0628\u062f\u0648\u0646 \u0633\u0624\u0627\u0644 \u0645\u0646\u062a\u0634\u0631 \u0634\u0648\u062f)"
          ],
          "kind": "m2_exam_questions_v1"
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
          "pack.txt read once (16 sources, 197863 selected bytes): chairside/no-paper/not-challenge/commentary"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text to publish=yes, paper file attached=no -> normal publish only, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain loaded once: 643 entries, 56 chairside, latest chairside-56 schema; PILLARS read live"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain type=chairside; 56 existing chairside entries; page dir/URL pattern from chairside-56"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number = max existing (chairside-56) + 1 = chairside-57; no gap"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "full text supplied by the founder in the request; the opening title line used verbatim as the page title"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: first-person clinical narration reads natural, no phrasing rewrite; typography only (ZWNJ): \u062f\u0646\u062f\u0627\u0646\u0647\u0627\u06cc\u2192\u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627\u06cc, \u0646\u0645\u06cc\u0634\u0648\u062f\u2192\u0646\u0645\u06cc\u200c\u0634\u0648\u062f and similar; no word, fact or number changed"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "image attached: /tmp/.../fed2085f....jpg (1080x763) converted to chairside/cs57-1.webp (WebP, 57 KB, long edge 1080); placed after the radiograph paragraph in a figure"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached (founder said attached file is a radiograph photo) -> documented skip, no Drive/catalog/DOI actions"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES basket 1 COMMENTARY: the page is the founder own case narration and names no retrievable paper/DOI; source_text = the page own body"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "not a \u0686\u0627\u0644\u0634: plain clinical case article, no question/answer post"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "M2 sent at intake with 2 validated MCQ drafts (validate_exam_questions --draft-check: 0 errors 0 warnings); founder answer: \u0628\u062f\u0648\u0646 \u0633\u0624\u0627\u0644 \u2014 no row written at 5.6, Phase F reports a warning only"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "LiteCast branch not applicable: locked category is chairside (module 03 step 0)"
        ],
        "id": "C.0",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [
          "template = chairside/chairside-56.html (previous same-category page); git diff --quiet -- chairside/chairside-56.html passes at C.4"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "page cloned from chairside-56 and patched (asserted counts): identifiers 8, title/og/twitter 3, description 4, image cs57-1.webp, body replaced between text-box and disclaimer; presentation_lint clean; Chinese SEO: canonical .org, hreflang 3 lines"
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
          "pillar.primary=treatment-planning (clear semantic fit: the piece is about diagnostic process and treatment planning), subtopic=comprehensive-diagnosis (structured pillar; matches chairside-49/50/53/54 on the same theme); secondary=[]; read live from tools/build_pillar.py"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631 capsules on the new page: \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/treatment-planning/ (canonical trailing-slash root), dc-related-section markup from the clone; 2 of the 5-link budget used"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "chairside/index.html is hand-maintained: one new row added at the top of \u0641\u0647\u0631\u0633\u062a \u0648\u06cc\u0632\u06cc\u062a\u200c\u0647\u0627, sibling markup, \u00ab\u0648\u06cc\u0632\u06cc\u062a \u06f5\u06f7 \u2014 <title>\u00bb; git diff --numstat 1 added line 0 removed"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "all 7 date surfaces = 2026-11-25 (datePublished/dateModified/lastReviewed, visible time x2, etc.); no stale field"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- chairside/chairside-56.html passes: the template is byte-unchanged"
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
          "DES 3.7 COMMENTARY via relay (founder-carried fresh chat, model reported by founder: Gemini; UNVERIFIED id otherwise): score 15, band E, question_type null, provisional false; des_repair: 0 repairs, 0 unverified quotes; Part 3 checks 1-5 pass; Part 3(6) verify_publish --des-text ok, both interpretation sentences supported by the text; Fidelity omitted (basket-1 page); record stored in plus/des-scores.json (53 lines, json_append)"
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
      "chairside/chairside-57.html",
      "chairside/cs57-1.webp",
      "chairside/index.html",
      "plus/des-scores.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: chairside/chairside-57.html, chairside/cs57-1.webp, chairside/index.html, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
