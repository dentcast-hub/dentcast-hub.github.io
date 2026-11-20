# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "plak-sefr/plak1-14"
- Status: in_progress
- Next canonical step: "C.8"
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "plak_sefr",
    "content_id": "plak-sefr/plak1-14",
    "context": {
      "approvals": [
        {
          "decision": "\u067e\u0644\u0627\u06a9 \u0635\u0641\u0631 \u2014 \u067e\u0631 \u06a9\u0631\u062f\u0646 \u062f\u0641\u062a\u0631\u060c \u0633\u0627\u06cc\u062a \u0631\u0648\u06cc \u062f\u0627\u0645\u0646\u0647\u200c\u06cc \u062e\u0648\u062f\u062a\u0627\u0646",
          "evidence": [
            "founder H1 in doc \u00ab\u0642\u0633\u0645\u062a \u06f1\u06f4: \u067e\u0631 \u06a9\u0631\u062f\u0646 \u062f\u0641\u062a\u0631\u060c \u0633\u0627\u06cc\u062a \u0631\u0648\u06cc \u062f\u0627\u0645\u0646\u0647\u200c\u06cc \u062e\u0648\u062f\u062a\u0627\u0646\u00bb (part label moved to badge) with series prefix per plak_sefr brain convention; listed in the Push-2 report"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0642\u0633\u0645\u062a \u06f1\u06f4: \u062f\u0641\u062a\u0631 \u062f\u0627\u0645\u0646\u0647 \u062d\u0627\u0644\u0627 \u062f\u0633\u062a \u0622\u0631\u0648\u0627\u0646 \u0627\u0633\u062a \u0648\u0644\u06cc \u0647\u0646\u0648\u0632 \u062e\u0627\u0644\u06cc \u0627\u0633\u062a. \u062f\u0631 \u0627\u06cc\u0646 \u0642\u0633\u0645\u062a \u067e\u0646\u062c \u062e\u0637 \u062a\u0627\u0632\u0647 \u062f\u0631 \u062f\u0641\u062a\u0631 \u0645\u06cc\u200c\u0646\u0648\u06cc\u0633\u06cc\u060c \u0628\u0647 \u06af\u06cc\u062a\u200c\u0647\u0627\u0628 \u0645\u06cc\u200c\u06af\u0648\u06cc\u06cc \u0627\u06cc\u0646 \u0627\u0633\u0645 \u0645\u0627\u0644 \u0633\u0627\u06cc\u062a \u062a\u0648\u0633\u062a \u0648 \u0642\u0641\u0644 \u0633\u0627\u06cc\u062a \u0631\u0627 \u0631\u0648\u0634\u0646 \u0645\u06cc\u200c\u06a9\u0646\u06cc. \u0628\u0627 \u0633\u0647 \u0646\u0634\u0627\u0646\u0647 \u0628\u0631\u0627\u06cc \u0627\u06cc\u0646\u06a9\u0647 \u0628\u0641\u0647\u0645\u06cc \u062f\u0631\u0633\u062a \u0627\u0646\u062c\u0627\u0645 \u062f\u0627\u062f\u0647\u200c\u0627\u06cc.",
          "evidence": [
            "standing acceptance (Hard Rule 14): agent-composed, listed in the Push-2 report; founder gave no caption"
          ],
          "scope": "caption",
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
            "page plak-sefr/plak1-14.html first <p> is the doc's first paragraph (inline link at C.4.8 added around unchanged words); recorded after C.4.13, before C.6"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder doc claude-docs:1c7c1566-9bb6-4fe4-8d02-640b19857111/tab cd5a9884-2196 rev26: the founder's own opening paragraph opens the body"
        },
        {
          "evidence": [
            "founder answered \u00ab\u0647\u0645\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb in chat to all three drafted questions; written verbatim as r-1f0688f3, r-1b95a172, r-445ca4a0"
          ],
          "kind": "m2_exam_questions_answer"
        },
        {
          "english": {
            "evidence": [
              "plak-sefr/en/plak1-14.html on disk, noindex follow, no hreflang, lang/inLanguage/og:locale en, GA once"
            ],
            "path": "plak-sefr/en/plak1-14.html",
            "status": "ready"
          },
          "evidence": [
            "second-cut lock recorded after all authoring and founder-message scopes closed (M1, M3b had no content; M2 answered)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13 DES COMMENTARY basket 1, 12/E, Part 3 checks green; no Fidelity (basket 1); no M3b"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Question 4.9: ordinary article, C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "C.2.4 practice-infrastructure/site-ownership; no new subtopic"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 0 candidates; C.4.8 1 inline link to plak1-13; C.4.9 plak1-13, plak1-11, plak1-9 (cap 5)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 canonical reuse: #\u067e\u0644\u0627\u06a9_\u0635\u0641\u0631 #\u0633\u0627\u06cc\u062a_\u0645\u0637\u0628 #\u062f\u0627\u0645\u0646\u0647_\u0633\u0627\u06cc\u062a #GitHub; --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5 brain entry plak1-14 at array end, key parity with plak1-13; faq-corpus entry"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6 ai-dentistry after plak1-13; 3 M2-approved exam questions; bundle gate 1 rejected"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.6 Pulse line inserted at top of index.html, oldest (insight-112) removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "authored mirror plak-sefr/en/plak1-14.html, toggles inverse, en/plak1-13 next slot wired"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title and caption approvals recorded; lead author_original; M2 answered"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            }
          ]
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "note": "founder text (transcribed body)",
          "ref": "artifact:claude-docs/1c7c1566-9bb6-4fe4-8d02-640b19857111@rev26",
          "sha256": "d7010b85fdbb60f16faff32c7c18f4a20fb2403576208d8b4053226dd514a9b7"
        },
        {
          "note": "9 founder images",
          "ref": "upload:plak14-images.zip",
          "sha256": "762b57163f8cb550ceddbaece9231114c91f3e79e61229aff60518fbe8c341fa"
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
          "read README, global router + 5 sections (3 pages), agent-parity, publish-checkpoints, modules 01/02 completely at a0fee349"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "routing: text present (founder Claude Docs doc 1c7c1566, episode 14) + 9 founder images (upload zip); no paper attached -> normal publish only. Capability check: git ls-remote origin OK, push to non-main branch ccr-* allowed, Actions monitoring + PR/merge via GitHub MCP"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once (627 entries); plak_sefr latest plak1-13 keys type,id,title,caption,hashtags,keywords,page_url,pillar; PILLARS read live from build_pillar.py"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type locked: plak_sefr (doc title names \u067e\u0644\u0627\u06a9 \u0635\u0641\u0631 \u0642\u0633\u0645\u062a \u06f1\u06f4)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number plak1-14 (plak1-1..13 contiguous; matches founder \u00ab\u0642\u0633\u0645\u062a \u06f1\u06f4\u00bb)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text of record: founder Claude Docs doc 1c7c1566 tab cd5a9884-2196 rev 26 (XML read); bound by digest in context.inputs"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: natural founder prose, no genuine AI tells; 0 rewrites, text unchanged"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "9 founder webp screenshots (upload zip) mapped to doc order by content and saved as plak-sefr/arvan-records-table, arvan-record-types, arvan-dns-menu, arvan-new-record, arvan-dns-records, gh-more-settings, gh-settings-pages, gh-custom-domain, gh-pages-live (.webp, native size, 30-102 KB, as series precedent); no audio/video field for this type"
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
          "basket 1 COMMENTARY: authored how-to guide, no DOI/PubMed/references; page own text is source_text"
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
          "Pulse: \u00ab\u067e\u0644\u0627\u06a9 \u0635\u0641\u0631\u060c \u0642\u0633\u0645\u062a \u06f1\u06f4: \u00ab\u067e\u0631 \u06a9\u0631\u062f\u0646 \u062f\u0641\u062a\u0631\u060c \u0633\u0627\u06cc\u062a \u0631\u0648\u06cc \u062f\u0627\u0645\u0646\u0647\u200c\u06cc \u062e\u0648\u062f\u062a\u0627\u0646\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb in the series title-only pattern (plak1-13 precedent)"
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
          "template lock: previous same-category page plak-sefr/plak1-13.html; git diff --quiet held before series wiring (TEMPLATE_UNCHANGED)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "page plak-sefr/plak1-14.html cloned from plak1-13 (CRLF kept, .org domain kept, GA once, preconnect x2, no trustseal, dc-notify removed for runner Phase E); body = founder text of record with 9 founder images (captions only where the doc has italic captions: 3), founder table rendered as ep-table with page-local CSS; lead paragraph = founder first paragraph; title from founder H1 \u00ab\u067e\u0631 \u06a9\u0631\u062f\u0646 \u062f\u0641\u062a\u0631\u060c \u0633\u0627\u06cc\u062a \u0631\u0648\u06cc \u062f\u0627\u0645\u0646\u0647\u200c\u06cc \u062e\u0648\u062f\u062a\u0627\u0646\u00bb with series prefix; caption agent-composed; chips #\u067e\u0644\u0627\u06a9_\u0635\u0641\u0631 #\u0633\u0627\u06cc\u062a_\u0645\u0637\u0628 #\u062f\u0627\u0645\u0646\u0647_\u0633\u0627\u06cc\u062a #GitHub existing canonical (--simulate)"
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
          "pillar practice-infrastructure / subtopic site-ownership (DNS records, custom domain, HTTPS = owning the site; same as plak1-11..13; competing llm-tools rejected; no new subtopic)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "typed brain entry branch: both capsules /glossary/ and /pillar/practice-infrastructure/ (semantic capsules at C.4.9)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plak-sefr/index.html hand-maintained: row \u00ab\u0642\u0633\u0645\u062a \u06f1\u06f4 \u2014 \u067e\u0631 \u06a9\u0631\u062f\u0646 \u062f\u0641\u062a\u0631\u060c \u0633\u0627\u06cc\u062a \u0631\u0648\u06cc \u062f\u0627\u0645\u0646\u0647\u200c\u06cc \u062e\u0648\u062f\u062a\u0627\u0646\u00bb added after \u06f1\u06f3 in sibling markup, CRLF kept"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: datePublished=dateModified=2026-11-20 in JSON-LD; no other visible date; OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- plak-sefr/plak1-13.html succeeded (TEMPLATE_UNCHANGED) before wiring"
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
          "series wiring: new page previous slot -> plak1-13; plak1-13 next slot span -> link to plak1-14 (git diff shows only that slot); en/plak1-13 next slot wired with the English mirror before C.6"
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
          "DES basket 1 COMMENTARY: isolated claude -p (system prompt .dentcast/des-v3.7-knowledge.md sha256 709be964\u2026e2e9, --tools \"\", empty cwd, --model opus; run reports claude-opus-5-5), source_text = page own body text FULL_TEXT; Part 3: quotes verbatim, 5+4+0+3+0=12, band E, schema; des_record_guard check ok; verify_publish --des-text ok, interpretation_fa sentences checked against text, none changed; record plus/des-scores.json plak-sefr/plak1-14 (12/E); no fidelity (basket 1), no M3b; no DOI/abstract/quartile guessed; save point pushed"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "analyzed: glossary/glossary.json 110 dental terms; none concerns DNS, records, custom domain, HTTPS or GitHub; 0 qualifying, 0 borderline; no term page edited"
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
          "body vs glossary + all brain entries: 1 inline link applied: \u00ab\u062f\u0641\u0639\u0647\u200c\u06cc \u0642\u0628\u0644\u00bb (first occurrence, lead paragraph, explicit back-reference to the Name Server step of part 13) -> /plak-sefr/plak1-13.html, plain <a> as in plak1-5 \u00ab\u0642\u0633\u0645\u062a \u0642\u0628\u0644\u00bb. Borderline skipped: \u00ab\u0627\u06cc\u0646 \u0647\u0645\u0627\u0646 \u0635\u0641\u062d\u0647\u200c\u0627\u06cc \u0627\u0633\u062a \u06a9\u0647 \u0633\u0627\u06cc\u062a \u0631\u0627 \u0628\u0627 \u0622\u0646 \u0631\u0648\u0634\u0646 \u06a9\u0631\u062f\u06cc\u062f\u00bb -> plak1-11 (no anchorable phrase naming the part); GitHub/domain generic mentions -> plak1-11/plak1-9 (generic use)"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "related_cap 2/5 -> 5/5 (cap): + plak1-13 (previous part, DNS ledger this part fills), plak1-11 (GitHub Pages settings revisited here), plak1-9 (the domain being connected); strongest first; borderline skipped at cap: plak1-12 (first page), plak1-3"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "7 DefinedTerms in plus/faq-corpus.json under plak-sefr/plak1-14 (#flashcards-c1..c7), all source faq: idx 1 (\u0631\u06a9\u0648\u0631\u062f DNS), 2 split into A and CNAME, 3 (@), 7 split into HTTPS and Enforce HTTPS, 0 (www \u0648 \u0628\u062f\u0648\u0646 www); skipped as procedural/decision: FAQ 4 (four A records), 5 (cloud switch), 6 (Custom domain entry), 8 (yellow check); descriptions rewritten as standalone concepts; build_flashcards_index.mjs in runner C.8"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "9 FAQ questions authored from the locked body, standalone (no article deixis); 4 binary questions open with \u062e\u06cc\u0631\u061b (idx 0,5,6,8; local build_quiz_index preview confirmed 4 graded, file reverted); 5 definitional/procedural kept as reference; 4.12-\u0628 evaluated at C.5.6"
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.14",
        "module": "09-challenge.md",
        "reason": "ordinary article, not a Challenge (Question 4.9): no data-dc-challenge-question markup",
        "status": "skipped"
      },
      {
        "evidence": [
          "Q1 questions: \u00ab\u062f\u0627\u0645\u0646\u0647 \u0631\u0648 \u0686\u0637\u0648\u0631 \u0628\u0647 \u0633\u0627\u06cc\u062a \u06af\u06cc\u062a\u200c\u0647\u0627\u0628 \u0648\u0635\u0644 \u06a9\u0646\u0645\u061f\u00bb, \u00ab\u0631\u06a9\u0648\u0631\u062f A \u0648 CNAME \u0631\u0648 \u062a\u0648\u06cc \u0622\u0631\u0648\u0627\u0646 \u0686\u06cc \u0628\u0632\u0646\u0645\u061f\u00bb, \u00ab\u0642\u0641\u0644 HTTPS \u0633\u0627\u06cc\u062a\u0645 \u0686\u0631\u0627 \u0641\u0639\u0627\u0644 \u0646\u0645\u06cc\u0634\u0647\u061f\u00bb. Reused canonical tags only, no mint, no batch: #\u067e\u0644\u0627\u06a9_\u0635\u0641\u0631 (series), #\u0633\u0627\u06cc\u062a_\u0645\u0637\u0628, #\u062f\u0627\u0645\u0646\u0647_\u0633\u0627\u06cc\u062a (decision+specific, now 3 pages), #GitHub. Resolving sentences: #\u062f\u0627\u0645\u0646\u0647_\u0633\u0627\u06cc\u062a \u00ab\u062f\u0631 \u0627\u06cc\u0646 \u0642\u0633\u0645\u062a \u0633\u0647 \u06a9\u0627\u0631 \u0645\u06cc\u200c\u06a9\u0646\u06cc\u0645: \u062f\u0631 \u062f\u0641\u062a\u0631 \u0645\u06cc\u200c\u0646\u0648\u06cc\u0633\u06cc\u0645 \u0633\u0627\u06cc\u062a \u06a9\u062c\u0627\u0633\u062a\u060c \u0628\u0647 \u06af\u06cc\u062a\u200c\u0647\u0627\u0628 \u062e\u0628\u0631 \u0645\u06cc\u200c\u062f\u0647\u06cc\u0645 \u06a9\u0647 \u0627\u06cc\u0646 \u0627\u0633\u0645 \u0645\u0627\u0644 \u0633\u0627\u06cc\u062a \u0634\u0645\u0627\u0633\u062a\u060c \u0648 \u0642\u0641\u0644 \u0633\u0627\u06cc\u062a \u0631\u0627 \u0631\u0648\u0634\u0646 \u0645\u06cc\u200c\u06a9\u0646\u06cc\u0645.\u00bb; #\u0633\u0627\u06cc\u062a_\u0645\u0637\u0628 \u00ab\u0627\u0632 \u0627\u0645\u0631\u0648\u0632 \u0622\u062f\u0631\u0633\u06cc \u06a9\u0647 \u0628\u0647 \u0628\u06cc\u0645\u0627\u0631 \u0645\u06cc\u200c\u062f\u0647\u06cc\u062f drsamadi.ir \u0627\u0633\u062a.\u00bb; #GitHub \u00ab\u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a \u0634\u06a9\u0644 \u0628\u0627 www \u0631\u0627 \u062c\u062f\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f\u061b \u06af\u06cc\u062a\u200c\u0647\u0627\u0628 \u062e\u0648\u062f\u0634 \u0645\u06cc\u200c\u0641\u0647\u0645\u062f \u06a9\u0647 www.drsamadi.ir \u0647\u0645 \u0645\u0627\u0644 \u0647\u0645\u06cc\u0646 \u0633\u0627\u06cc\u062a \u0627\u0633\u062a.\u00bb DNS/HTTPS/\u0622\u0631\u0648\u0627\u0646 have no concept (--simulate) and no second page resolves them: no mint (conservative). hashtag_ref --sync, build_plus_index (reverted), --check OK, build_cabinet_papers --check OK; reachability via #\u062f\u0627\u0645\u0646\u0647_\u0633\u0627\u06cc\u062a (3 pages: plak1-9, 13, 14)"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry appended at end of array with identical key set/order as plak1-13 (type,id,title,caption,hashtags,keywords,page_url,pillar); hashtags = 5.0 list; 7 keywords; pillar practice-infrastructure/site-ownership; json.tool OK"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "recorded pillar practice-infrastructure / subtopic site-ownership = step 2.4; capsule href /pillar/practice-infrastructure/ matches; no new subtopic"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathway_place: STRONG ai-dentistry (series sibling) inserted after plak-sefr/plak1-13 at index 37, milestone false, 38 steps; ASK not placed (conservative, reported): fixed-pros 27, implant-prosthetic, biomimetic, post-and-core, esthetic, ceramics, occlusion (0-2 related steps); coverage: plak1-14 in 1 full pathway, 1.52 per item. 4.12-\u0628: 3 MCQs drafted, validate --draft-check 0 errors/0 warnings, sent in M2, founder approved all (\u00ab\u0647\u0645\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb), written to plus/exam-questions.json as r-1f0688f3, r-1b95a172, r-445ca4a0 (keys 2,1,3); validate_exam_questions.py 0 errors (warnings pre-existing on other rows); drawn by ai-dentistry"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle check: candidates = bundles continuing ai-dentistry; GATE 1 type: folder plak-sefr is not episodes/notecast/sharehub/dentai -> \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1); no bundle edited, home-bundles.js untouched"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse line \u00ab\u067e\u0644\u0627\u06a9 \u0635\u0641\u0631\u060c \u0642\u0633\u0645\u062a \u06f1\u06f4: \u00ab\u067e\u0631 \u06a9\u0631\u062f\u0646 \u062f\u0641\u062a\u0631\u060c \u0633\u0627\u06cc\u062a \u0631\u0648\u06cc \u062f\u0627\u0645\u0646\u0647\u200c\u06cc \u062e\u0648\u062f\u062a\u0627\u0646\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb inserted at top of index.html (title linked), oldest line insight-112 removed, 7 lines; authored English mirror plak-sefr/en/plak1-14.html + fa toggle (inverse), en/plak1-13 next slot wired; metanotes/en/meta-1.html unchanged; no same-word gloss duplicates; ten-scope editorial lock recorded; title/caption approvals recorded"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plak-sefr/arvan-dns-menu.webp",
      "plak-sefr/arvan-dns-records.webp",
      "plak-sefr/arvan-new-record.webp",
      "plak-sefr/arvan-record-types.webp",
      "plak-sefr/arvan-records-table.webp",
      "plak-sefr/en/plak1-13.html",
      "plak-sefr/en/plak1-14.html",
      "plak-sefr/gh-custom-domain.webp",
      "plak-sefr/gh-more-settings.webp",
      "plak-sefr/gh-pages-live.webp",
      "plak-sefr/gh-settings-pages.webp",
      "plak-sefr/index.html",
      "plak-sefr/plak1-13.html",
      "plak-sefr/plak1-14.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, index.html, plak-sefr/en/plak1-13.html, plak-sefr/plak1-14.html, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, plak-sefr/en/plak1-14.html"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
