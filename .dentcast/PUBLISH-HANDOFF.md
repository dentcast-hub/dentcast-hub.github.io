# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "plak-sefr/plak1-13"
- Status: in_progress
- Next canonical step: "C.4.11"
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "plak_sefr",
    "content_id": "plak-sefr/plak1-13",
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
          "evidence": [
            "page plak-sefr/plak1-13.html first <p> is the doc's first paragraph byte-for-byte; recorded after C.4.13 before C.4.9"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder doc claude-docs:7467207d.../tab474a16c3-14b7 rev220: the founder's own opening paragraph opens the body"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "note": "founder text of record for episode 13 (page prose as shipped), private doc, not in repo",
          "ref": "claude-docs:7467207d-4e68-4989-84c5-bd41f37d528d/tab474a16c3-14b7@rev220",
          "sha256": "0835ad859ae1633d34994d672e319211482320c7ee98146e930cfb036b35aab9"
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
          "read: CLAUDE.md router, workflows/README, global rules pages 1-5, agent-parity, publish-checkpoints, modules 01+02"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "routing: text present (founder Docs artifact, episode 13), no paper attached -> normal publish only"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once (594 entries); plak_sefr latest plak1-12 with keys type,id,title,caption,hashtags,keywords,page_url,pillar; PILLARS read live from build_pillar.py"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type locked: plak_sefr (Plak Sefr series, request names it)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number: plak1-13 (series plak1-1..plak1-12 contiguous, no gap)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text received: founder doc Claude Docs 7467207d..., tab 474a16c3-14b7, text of record taken from doc XML (rev 220)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: text reads as natural founder prose, no genuine AI tells; 0 rewrites, text unchanged"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: 5 webp screenshots from the doc (Arvan menu, CDN section, name servers, nic.ir panel, domain list) saved as plak-sefr/arvan-*.webp, irnic-arvan-name-servers.webp; no audio/video/image-field for this type"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached -> step 4.10 skipped"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 1 COMMENTARY: authored how-to guide, no DOI/PubMed/references block; content own text is source_text"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary article, not a challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: \u00ab\u067e\u0644\u0627\u06a9 \u0635\u0641\u0631\u060c \u0642\u0633\u0645\u062a \u06f1\u06f3: \u00ab\u062f\u0641\u062a\u0631 \u0648 \u0645\u0646\u0634\u06cc \u0633\u0627\u06cc\u062a: DNS \u0648 CDN\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb in the precedent title-only pattern"
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
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [
          "template lock: previous same-category page plak-sefr/plak1-12.html (kept byte-unchanged except nav link per series precedent)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "page plak-sefr/plak1-13.html cloned from plak1-12 (CRLF kept, domain .org kept, GA once, preconnect x2 kept, no trustseal); body = founder text of record with 5 founder images and captions; lead paragraph author_original; title/caption/keywords composed by agent under standing acceptance; chips #\u067e\u0644\u0627\u06a9_\u0635\u0641\u0631 #\u0633\u0627\u06cc\u062a_\u0645\u0637\u0628 #\u062f\u0627\u0645\u0646\u0647_\u0633\u0627\u06cc\u062a all existing canonical"
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
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast branch inactive: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar practice-infrastructure / subtopic site-ownership (domain, DNS, CDN = owning the site; same as plak1-11/12 precedent; competing candidate llm-tools rejected, no new subtopic)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "typed brain entry branch: both capsules on the page: /glossary/ and /pillar/practice-infrastructure/ (semantic capsules added at C.4.9)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plak-sefr/index.html hand-maintained: row \u00ab\u0642\u0633\u0645\u062a \u06f1\u06f3 \u2014 \u062f\u0641\u062a\u0631 \u0648 \u0645\u0646\u0634\u06cc \u0633\u0627\u06cc\u062a: DNS \u0648 CDN\u00bb added after \u06f1\u06f2 in sibling markup, CRLF kept"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: datePublished=dateModified=2026-11-07 in JSON-LD; no other visible date; all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- plak-sefr/plak1-12.html plak-sefr/en/plak1-12.html succeeded (TEMPLATE_UNCHANGED) before wiring"
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
        "reason": "NoteCast only: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast/episode pair only: category is plak_sefr",
        "status": "skipped"
      },
      {
        "evidence": [
          "series wiring: new page previous slot -> plak1-12; plak1-12 next slot span -> link to plak1-13 (git diff shows only that slot); en/plak1-12 next slot wired with the English mirror at C.6"
        ],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7): paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7): paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Question 4.7): paper branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [
          "DES basket 1 COMMENTARY run: isolated claude -p call (spec .dentcast/des-v3.5-knowledge.md as system prompt, tools disabled, empty cwd, model claude-sonnet-5-5), source_text = page own body text FULL_TEXT; Part 3 checks green: quotes verbatim, 5+4+0+3+0=12, band E, schema; verify_publish --des-text ok; record in plus/des-scores.json plak-sefr/plak1-13 (score 12, band E); no fidelity (basket 1), no M3b; no DOI/abstract/quartile guessed"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "analyzed: glossary/glossary.json has 109 dental terms; none concerns DNS, CDN, domain, hosting or GitHub; 0 qualifying candidates, 0 borderline; no term page edited"
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
        "reason": "not a glossary publish",
        "status": "skipped"
      },
      {
        "evidence": [
          "analyzed body vs glossary terms and all brain entries: 0 inline links applied. Borderline skipped: GitHub mention -> plak1-11 (generic, no back-reference to that part); domain -> plak1-9 (generic use, no back-reference); sibling parts belong to C.4.9"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "new page \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb now 5 links (cap): 2 nav capsules + sibling parts plak1-9 (domain), plak1-11 (GitHub), plak1-12 (previous part); strong, strongest first; borderline skipped: plak1-3/plak1-7 and prompt-append2-3 (budget at cap)"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plak-sefr/arvan-cdn-section.webp",
      "plak-sefr/arvan-domain-list.webp",
      "plak-sefr/arvan-name-servers.webp",
      "plak-sefr/arvan-panel-menu.webp",
      "plak-sefr/en/plak1-12.html",
      "plak-sefr/en/plak1-13.html",
      "plak-sefr/index.html",
      "plak-sefr/irnic-arvan-name-servers.webp",
      "plak-sefr/plak1-12.html",
      "plak-sefr/plak1-13.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: plak-sefr/plak1-13.html, plak-sefr/plak1-12.html, plak-sefr/index.html, plak-sefr/arvan-panel-menu.webp, plak-sefr/arvan-cdn-section.webp, plak-sefr/arvan-name-servers.webp, plak-sefr/irnic-arvan-name-servers.webp, plak-sefr/arvan-domain-list.webp, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
