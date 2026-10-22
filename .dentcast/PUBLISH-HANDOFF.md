# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-98"
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
    "category": "clinical",
    "content_id": "insight/insight-98",
    "context": {
      "approvals": [
        {
          "decision": "approved as drafted on branch",
          "evidence": [
            "PR 953 founder-approved Persian text",
            "insight/insight-98.html"
          ],
          "scope": "full Persian body text",
          "status": "confirmed"
        },
        {
          "decision": "confirmed by founder",
          "evidence": [
            "chat 2026-10-22: \u0647\u0645\u0647 \u062a\u0627\u06cc\u06cc\u062f"
          ],
          "scope": "opening paragraph",
          "status": "confirmed"
        },
        {
          "decision": "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc",
          "evidence": [
            "chat 2026-10-22"
          ],
          "scope": "ordinary vs challenge",
          "status": "confirmed"
        },
        {
          "decision": "\u06cc\u06a9 \u0627\u06cc\u0646\u0633\u0627\u06cc\u062a \u0628\u0627\u0644\u06cc\u0646\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab\u06cc\u06a9 \u062a\u0631\u0641\u0646\u062f \u0633\u0627\u062f\u0647 \u0628\u0631\u0627\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u0631\u0646\u06af \u0631\u0627\u062d\u062a\u200c\u062a\u0631\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f",
          "evidence": [
            "chat 2026-10-22"
          ],
          "scope": "pulse sentence",
          "status": "confirmed"
        },
        {
          "decision": "esthetic / shade-and-whitening",
          "evidence": [
            "chat 2026-10-22",
            "PR 953",
            "live PILLARS"
          ],
          "scope": "pillar/subtopic",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "evidence": "PR 953 + live PILLARS",
          "id": "taxonomy_live_decision",
          "value": "esthetic/shade-and-whitening"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "evidence": [
            "git merge origin/main into publish/insight-98-shade-grayscale"
          ],
          "id": "workflow_reconcile_after_main_merge",
          "value": "invalidated ledger then re-apply intake; tools/verify_publish.py changed on main"
        },
        {
          "evidence": [
            "insight/index.html"
          ],
          "id": "c26_landing_correction",
          "value": "Added insight-98 link to insight/index.html (hand-maintained landing)"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "kind": "draft_page",
          "note": "Founder-approved Persian draft on branch",
          "ref": "insight/insight-98.html"
        },
        {
          "kind": "image",
          "note": "Committed WebP already on branch",
          "ref": "insight/insight98-shade-value-grayscale.webp"
        },
        {
          "kind": "prior_pr",
          "note": "Incomplete draft; no official handoff yet",
          "ref": "https://github.com/dentcast-hub/dentcast-hub.github.io/pull/953"
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
          "Modules/global/agent-parity/checkpoints loaded for clinical-98"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text yes, no paper; normal publish"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "clinical category; clinical-97 template; live PILLARS esthetic"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Type clinical locked"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "clinical-98 / insight-98"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder-approved Persian on insight/insight-98.html"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no AI-tell edits"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "WebP image present"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper; 4.10 skip"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "COMMENTARY DES basket"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse approved by founder"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Not LiteCast; clinical Insight uses specialist track"
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
        "reason": "Not LiteCast; clinical Insight uses specialist track",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; clinical Insight uses specialist track",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; clinical Insight uses specialist track",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; clinical Insight uses specialist track",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template lock insight/insight-97.html SHA-256 bf35846784b97e3b6de25d447752c4d6c1a2c63799c9304564c3aa5f591fe282"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Page insight/insight-98.html built from clinical template; founder text+WebP; fixed MedicalWebPage healthCondition to Dental Shade Selection; GA/preconnect/lang-btn present; opening prose before figure"
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
        "reason": "Not LiteCast; clinical Insight uses specialist track",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; clinical Insight uses specialist track",
        "status": "skipped"
      },
      {
        "evidence": [
          "Pillar esthetic + subtopic shade-and-whitening; founder confirmed; live in PILLARS"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631 capsules: glossary + /pillar/esthetic/ already on page; budget 2/5 used by nav"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No parent-episode backlink required for clinical Insight"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Dates 2026-10-22 on trustline/JSON-LD; meta/canonical/OG present"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Integrity: page refs WebP path; width/height 560x420; GA+preconnect once"
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
        "reason": "Not NoteCast \u2014 clinical Insight",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not NoteCast \u2014 clinical Insight",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not Promptologist \u2014 clinical Insight",
        "status": "skipped"
      },
      {
        "evidence": [
          "Analyzed glossary.json: no unmistakable related term for Value grayscale tip; bleaching same subtopic but different concept and already at 5-link cap \u2014 0 back-links added"
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
        "reason": "skipped \u2014 not a glossary publish",
        "status": "skipped"
      },
      {
        "evidence": [
          "Analyzed body vs glossary+episodes: no qualifying in-body glossary/episode anchors (Value/Grayscale have no glossary entries; avoid weak bleaching/translucency matches) \u2014 0 inline links"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Semantic \u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631: insight-91 (Value), insight-92 (shade match), episode-68 (final color factors) + nav capsules; section at Hard Rule 9 cap of 5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.4.14",
        "module": "09-challenge.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.8",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "C.7",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "D",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "E",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "F",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "pending"
      },
      {
        "evidence": [],
        "id": "G",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "pending"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "insight/en/insight-98.html",
      "insight/index.html",
      "insight/insight-98.html",
      "insight/insight98-shade-value-grayscale.webp"
    ]
  },
  "reconciliation": {
    "note": "Delivery 1 staging: insight-98.html healthCondition + insight/index.html landing + unfinished handoff at C.4.9"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
