# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-117"
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
    "content_id": "insight/insight-117",
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
          "note": "founder-approved body text (chat)",
          "ref": "chat:founder-approved-text-insight-117",
          "sha256": "92c3d31757bfef76829f9582fc48939d6747d28a5ac8ab55808faad13cd07cdf"
        },
        {
          "note": "founder photo, source of insight117-1.webp",
          "ref": "chat:founder-photo-96441.jpg",
          "sha256": "137f8a98218d5bde1585d128ecbc31b498400732592eeb971693b0099389d0d3"
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
          "read README.md, global/README.md + selector sections (repo-core, ads, pathway-standings, pathway-certificate, publication-surfaces, des-display, site-invariants), agent-parity.md, publish-checkpoints.md, publish-handoff-tool.md, modules 01 and 02 completely"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: founder text present (chat, digest-bound), no paper file attached -> normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase A: brain parsed (633 entries); latest clinical = clinical-116 keys [type,id,title,caption,hashtags,keywords,page_url,pillar]; live PILLARS read"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q1 type: founder chose Insight (clinical); content_id insight/insight-117"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q2 number: max clinical 116 -> 117"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3 text: founder approved full text in chat (digest 92c3d317\u2026)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5 de-AI pass: text reviewed; no genuine AI tell (first-person clinical narration, varied rhythm, concrete facts) -> \u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a; text unchanged"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4 media: clinical entries carry images on page; founder photo supplied -> insight117-1.webp (1280x1111, 58 KB, WebP, within 1600px/300KB)"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.7: no paper file attached -> step 4.10 branch inactive (documented skip)"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.8 basket 1 COMMENTARY: founder's own case narration, no DOI/PubMed id/references block -> content text is source_text, COMMENTARY track at C.4.13"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.9: ordinary post (\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc), not \u0686\u0627\u0644\u0634"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q5 Pulse: founder gave no Pulse sentence -> agent drafts no-spoiler line in insight pattern at C.6 (standing acceptance)"
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
        "reason": "not LiteCast: module 03 step 0 applies only to LiteCast",
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
          "template = insight/insight-116.html (previous clinical page); unchanged per git diff --quiet"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/insight-117.html cloned from insight-116: body = founder text, meta/OG/Twitter/JSON-LD/canonical swapped, figure insight117-1.webp with figcaption (insight figcaption pattern), dc-notify removed for Phase E, GA once, 2 preconnect, no enamad; body opens with founder prose paragraph (no list)"
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
          "pillar implantology / subtopic prosthetic-components (standing acceptance): abutment-connection/hex compatibility of a lab component with the implant system; same as chairside-48. Competing: digital/digital-workflow (library choice) \u2014 rejected, core subject is the prosthetic component connection"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/implantology/ (2 of 5)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/index.html hand-maintained list: new <li> insight-117 added above insight-116 (newest first, same markup, unnumbered type)"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "date audit: datePublished/dateModified (BlogPosting + MedicalWebPage), lastReviewed, trustline published/reviewed all 2026-11-22 = today; 9 occurrences, none stale"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- insight/insight-116.html succeeded (template unchanged)"
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
        "reason": "NoteCast only",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast/episode pair only",
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
        "reason": "no paper attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [
          "COMMENTARY SOURCE call: claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964\u2026e2e9) --tools \"\" --model opus, empty dir; model reported claude-opus-5-5; des_score 15 band E (5+4+0+3+3); item 4 from insight/index.html declaration with note; Part 3 (1)-(4),(6),(7) ok via verify_publish --des-text + des_record_guard check; fidelity [null] (basket 1, no Fidelity call owed); stored in plus/des-scores.json; no M3b"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "chairside/chairside-48.html",
      "chairside/en/chairside-48.html",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "insight/en/insight-117.html",
      "insight/index.html",
      "insight/insight-117.html",
      "insight/insight117-1.webp",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: insight/insight-117.html, insight/insight117-1.webp, insight/index.html, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
