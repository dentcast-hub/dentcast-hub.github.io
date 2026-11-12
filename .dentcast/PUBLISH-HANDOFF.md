# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-53"
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
    "content_id": "chairside/chairside-53",
    "context": {
      "approvals": [
        {
          "decision": "\u0686\u0631\u0627 \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0642\u0628\u0644\u0627\u064b \u0628\u0647 \u0647\u0645 \u0686\u0633\u0628\u06cc\u062f\u0647 \u0628\u0648\u062f\u0646\u062f\u060c \u0641\u0627\u0635\u0644\u0647 \u0627\u06cc\u062c\u0627\u062f \u0645\u06cc\u200c\u0634\u0648\u062f\u061f",
          "evidence": [
            "Founder attached final article.md; exact title copied"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0628\u06cc\u0645\u0627\u0631 \u0645\u06cc\u200c\u06af\u0641\u062a \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0642\u062f\u06cc\u0645\u06cc\u200c\u0627\u0634 \u0642\u0628\u0644\u0627\u064b \u0641\u0627\u0635\u0644\u0647\u200c\u0627\u06cc \u0646\u0628\u0648\u062f\u0647 \u0627\u0633\u062a. \u0627\u06cc\u0646 \u0648\u06cc\u0632\u06cc\u062a \u0627\u0632 \u0645\u0634\u0627\u0647\u062f\u0647\u0654 \u0641\u0627\u0635\u0644\u0647\u0654 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0648 \u067e\u0631\u0633\u0634\u06cc \u062f\u0631\u0628\u0627\u0631\u0647\u0654 \u062a\u063a\u06cc\u06cc\u0631 \u062a\u062f\u0631\u06cc\u062c\u06cc \u0622\u0646 \u0634\u0631\u0648\u0639 \u0634\u062f.",
          "evidence": [
            "Standing acceptance, Hard Rule 14; no-spoiler narrative caption"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "Public use of supplied clinical WebP permitted",
          "evidence": [
            "Founder confirmed image permission in current conversation"
          ],
          "scope": "patient-image",
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
        },
        {
          "evidence": [
            "Live PILLARS from main; article concerns differential assessment before selecting a prosthetic intervention; occlusion and crown failure are contributing possibilities, not the central diagnosis"
          ],
          "kind": "pillar_assignment",
          "primary": "treatment-planning",
          "subtopic": "comprehensive-diagnosis"
        }
      ],
      "delivery": [],
      "inputs": [],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "M3b": "No differing, doubtful or orphan Fidelity units",
          "audit": "COMMENTARY, not owed",
          "checks": [
            "Exact schema",
            "Verbatim article quotes and section declaration with note",
            "5+4+0+3+3=15/E",
            "FULL_TEXT; provisional false; null research fields",
            "verify_publish.py --des-text and des_record_guard.py check exit 0",
            "Persian interpretation supported by final text and preserved"
          ],
          "fidelity": "null for self-COMMENTARY, no call owed",
          "model": "Not rerun; producer UNVERIFIED",
          "source": "Founder canonical DES JSON v3.7",
          "step": "C.4.13"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "AGENTS.md; live modules 01/02, checkpoint protocol, agent parity and complete selected global core sections read; GitHub connector read/write, branch/PR/merge and Actions monitoring available; API-source validation workspace without git clone"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Attached approved article text and clinical WebP, no research paper: normal Chairside publication, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed brain once; latest chairside-52 exact key order, chairside URL and template; live PILLARS read from main builder. Next ID chairside/chairside-53"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder packet explicitly identifies Chairside; locked type chairside"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain category max 52, next chairside-53 announced to founder"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "article.md final text and exact title supplied; founder requests verbatim text, no references"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Single style review: personal patient encounter and reasoning read naturally; no edits. Explicit founder instruction preserves approved article verbatim"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Attached WebP and exact Persian alt supplied. Founder explicitly confirmed public image permission in this conversation"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No research paper attached; ZIP contains authored commentary, image, DES and handoff only"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Basket 1 COMMENTARY, own final body as FULL_TEXT, no cited paper. Canonical DES supplied for this exact article; validate under original 3.7 without model rerun; self-Fidelity null"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ordinary narrative article, not Challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse proposal: exact article title linked to /chairside/chairside-53.html, following existing Chairside announcements, no added conclusion"
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
        "reason": "Not LiteCast: chairside locked at B.1",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: no LightGlossary write",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: specialist track",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: same-category Chairside template",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: ordinary publication",
        "status": "skipped"
      },
      {
        "evidence": [
          "chairside/chairside-52.html is latest same-category structural template, enrolled and preserved"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Same-category page structure copied; exact approved body/title and image alt preserved; WebP 1536x784 measured; .org canonical; GA4 once and both crossorigin preconnects; no seal, DES markup or obsolete media"
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
        "reason": "Not LiteCast; specialist inline links at C.4.8",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; related links at C.4.9",
        "status": "skipped"
      },
      {
        "evidence": [
          "treatment-planning / comprehensive-diagnosis selected once, semantic diagnostic focus; recorded standing acceptance"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "One dc-related-section, glossary and canonical /pillar/treatment-planning/ capsules, 2 of 5 slots"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Chairside landing is generated by tools/build_content_landings.py during runner C.8; brain append drives it, no manual landing edit"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Date audit: template 2026-11-11 -> new 2026-11-12 for datePublished/dateModified/lastReviewed and both visible times. New canonical, OG, Twitter and JSON-LD identity/meta verified"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- chairside/chairside-52.html exit 0; template unchanged"
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
        "reason": "Not NoteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not NoteCast or core episode; no shared sibling record",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Chairside is not an ordered multi-part series with ep-nav",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached: no Drive filing",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached: no catalog entry",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached: authored commentary with no source credit",
        "status": "skipped"
      },
      {
        "evidence": [
          "Supplied canonical JSON preserved and stored for chairside/chairside-53: FULL_TEXT v3.7, 15/E, fidelity [null]; Part 3 passed; no rerun, no source lookup or quartile guess; no Part 3b gate owed"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "chairside/chairside-52.html",
      "chairside/chairside-53.html",
      "chairside/cs53-1.webp",
      "dentcast-brain.json",
      "plus/des-scores.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: chairside/chairside-53.html, chairside/cs53-1.webp, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
