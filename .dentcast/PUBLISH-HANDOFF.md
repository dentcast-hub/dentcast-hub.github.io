# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-122"
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
    "content_id": "insight/insight-122",
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
          "decision": "\u0647\u0631 \u062f\u0648 \u062a\u0623\u06cc\u06cc\u062f",
          "evidence": [
            "founder reply in chat, M2"
          ],
          "kind": "exam_questions_m2_v1",
          "status": "confirmed"
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
          "readpack /tmp/dc-pub/pack.txt (1815 lines) read once, top to bottom"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes, paper no -> normal publish; image attached (radiograph)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed (649 entries, 121 type=clinical, key set type,id,title,caption,hashtags,keywords,page_url,pillar); template insight/insight-121.html; PILLARS read live from tools/build_pillar.py"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q1: type locked = clinical (insight page, brain type clinical)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q2: next number 122 (max clinical id clinical-121 + 1)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3: full text supplied by founder in the request; copied verbatim"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5 de-AI scan: no genuine AI tell found (no clich\u00e9 opener, no hedge stacking, no mechanical parallelism); no rewrite, text stays byte-identical"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4: image attached (periapical radiograph); converted to insight/insight122-1.webp (1568x988, 243208 bytes, WEBP q75); caption to be composed by agent"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.7: no paper file attached -> documented skip, no Drive/catalog/DOI actions"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.8: basket 1 COMMENTARY - page carries no retrievable identifier (no DOI/PubMed/\u0645\u0646\u0627\u0628\u0639 block) and is the author's own clinical reasoning; source_text = the page's own body text"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.9: founder stated \u00ab\u0686\u0627\u0644\u0634 \u0646\u06cc\u0633\u062a\u00bb -> ordinary article"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "M2 answered by founder: \u00ab\u0647\u0631 \u062f\u0648 \u062a\u0623\u06cc\u06cc\u062f\u00bb - both exam questions approved verbatim (stem, four options, key, reason); written at C.5.6"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.0: locked category clinical is not LiteCast; general steps run"
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
        "reason": "LiteCast-only step 0.1 (module 03); category clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step 0.2; category clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step 0.3; category clinical",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step 0.4; category clinical",
        "status": "skipped"
      },
      {
        "evidence": [
          "template = insight/insight-121.html (previous clinical page); git diff --quiet -- insight/insight-121.html passed"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "page built by clone+patch from insight/insight-121.html: title/caption/URLs/dates/JSON-LD adapted, body = founder text verbatim (16 blocks, byte diff clean), figure insight122-1.webp added, lang-btn -> dc-lang-toggle:off, og/twitter image, keywords; presentation_lint clean"
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
          "pillar.primary=implantology, pillar.subtopic=restoration-design (caries of the natural tooth next to an implant crown, contact/embrasure form after delivery); competing candidates recorded: fixed-pros/failures, operative/caries-management, implantology/peri-implant-health; semantic closest match per Hard Rule 6"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb capsules added on the clone: /glossary/ (\u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647) + /pillar/implantology/ (\u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc); budget 2/5"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/index.html is hand-maintained: new <li> row added at the top of the list (insight-122.html + title); diff = 1 added line"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "all date surfaces set to 2026-11-28 (datePublished=dateModified, visible trustline times, MedicalWebPage lastReviewed)"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- insight/insight-121.html passed; only insight/insight-122.html + insight/index.html + insight/insight122-1.webp changed"
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
          "DES COMMENTARY basket 1: block built by des_commentary_block.py (insight/); one isolated subagent SOURCE call on the spec .dentcast/des-v3.7-knowledge.md (sha256 709be964...), model UNVERIFIED; answer repaired by des_repair.py (0 repairs, 0 UNVERIFIED quotes); Part3: quotes verbatim, score 5+4+0+3+3=15, band E, schema OK, verify_publish --des-text ok (interpretation_fa sentence 3 deleted as unsupported), no Fidelity owed on a basket-1 page (fidelity [null] as the section's siblings); stored plus/des-scores.json[insight/insight-122]"
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
      "insight/index.html",
      "insight/insight-122.html",
      "insight/insight122-1.webp",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, index.html, insight/index.html, insight/insight-122.html, insight/insight122-1.webp, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
