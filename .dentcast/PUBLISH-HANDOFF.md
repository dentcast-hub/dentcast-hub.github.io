# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "plak-sefr/plak1-13"
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
    "content_id": "plak-sefr/plak1-13",
    "context": {
      "approvals": [
        {
          "decision": "\u067e\u0644\u0627\u06a9 \u0635\u0641\u0631 \u2014 \u062f\u0641\u062a\u0631 \u0648 \u0645\u0646\u0634\u06cc \u0633\u0627\u06cc\u062a: DNS \u0648 CDN",
          "evidence": [
            "standing acceptance (Hard Rule 14): agent-composed, listed in the Push-2 report; founder gave no title/caption"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0642\u0633\u0645\u062a \u06f1\u06f3: \u062f\u0627\u0645\u0646\u0647\u200c\u0627\u06cc \u06a9\u0647 \u062e\u0631\u06cc\u062f\u0647\u200c\u0627\u06cc \u0647\u0646\u0648\u0632 \u0628\u0647 \u0633\u0627\u06cc\u062a\u062a \u0648\u0635\u0644 \u0646\u06cc\u0633\u062a. \u062f\u0631 \u0627\u06cc\u0646 \u0642\u0633\u0645\u062a \u0628\u0627 \u0645\u062b\u0627\u0644 \u062f\u0641\u062a\u0631 \u0648 \u0645\u0646\u0634\u06cc \u0645\u0637\u0628 \u0645\u06cc\u200c\u0641\u0647\u0645\u06cc DNS \u0648 CDN \u0686\u0647 \u06a9\u0627\u0631\u06cc \u0645\u06cc\u200c\u06a9\u0646\u0646\u062f\u060c \u0648 \u062f\u0641\u062a\u0631 \u062f\u0627\u0645\u0646\u0647 \u0631\u0627 \u062f\u0631 \u062f\u0648 \u0642\u062f\u0645 \u0627\u0632 \u0627\u06cc\u0631\u0646\u06cc\u06a9 \u0628\u0647 \u0622\u0631\u0648\u0627\u0646\u200c\u06a9\u0644\u0627\u062f \u0645\u06cc\u200c\u0633\u067e\u0627\u0631\u06cc. \u0628\u0627 \u0633\u0647 \u0646\u0634\u0627\u0646\u0647 \u0628\u0631\u0627\u06cc \u0627\u06cc\u0646\u06a9\u0647 \u0628\u0641\u0647\u0645\u06cc \u062f\u0631\u0633\u062a \u0627\u0646\u062c\u0627\u0645 \u062f\u0627\u062f\u0647\u200c\u0627\u06cc.",
          "evidence": [
            "standing acceptance (Hard Rule 14): agent-composed, listed in the Push-2 report; founder gave no title/caption"
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
            "page plak-sefr/plak1-13.html first <p> is the doc's first paragraph byte-for-byte; recorded after C.4.13 before C.4.9"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder doc claude-docs:7467207d.../tab474a16c3-14b7 rev220: the founder's own opening paragraph opens the body"
        },
        {
          "english": {
            "evidence": [
              "plak-sefr/en/plak1-13.html on disk, noindex follow, no hreflang, lang/inLanguage/og:locale en, GA once"
            ],
            "path": "plak-sefr/en/plak1-13.html",
            "status": "ready"
          },
          "evidence": [
            "second-cut lock recorded after all authoring and founder-message scopes closed (M1, M3b, M2 had no content)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13 DES COMMENTARY basket 1, score 12 band E, Part 3 checks green; no Fidelity (basket 1)"
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
                "C.4.7 0 candidates, C.4.8 0 applied, C.4.9 three sibling capsules (cap 5)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 canonical reuse only: #\u067e\u0644\u0627\u06a9_\u0635\u0641\u0631 #\u0633\u0627\u06cc\u062a_\u0645\u0637\u0628 #\u062f\u0627\u0645\u0646\u0647_\u0633\u0627\u06cc\u062a #GitHub; --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5 brain entry plak1-13 at array end, key parity with plak1-12; faq-corpus entry"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6 ai-dentistry after plak1-12; 4.12-\u0628 skipped (no approved exam question); no bundle candidate"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.6 Pulse line inserted at top of index.html, oldest line removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "authored mirror plak-sefr/en/plak1-13.html, toggles inverse, previous en part wired"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title and caption approvals recorded under standing acceptance; lead author_original"
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
      },
      {
        "evidence": [
          "6 DefinedTerms written to plus/faq-corpus.json under plak-sefr/plak1-13 (#flashcards-c1..c6), source faq, sourceFaqIndex 0,1,2,3,4,6; skipped as procedural: FAQ 5 (two-step procedure) and 7 (how to check); descriptions rewritten as standalone concepts, not near-copies; build_flashcards_index.mjs runs in the runner (C.8)"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "8 FAQ questions authored from the locked body, standalone (no article deixis); 3 binary questions open with verdict \u062e\u06cc\u0631\u061b (idx 1,3,6); 5 definitional/procedural kept as reference; build_quiz_index.mjs in runner"
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
          "Q1 questions: \u00ab\u062f\u0627\u0645\u0646\u0647\u200c\u0627\u06cc \u06a9\u0647 \u062e\u0631\u06cc\u062f\u0645 \u0631\u0648 \u0686\u0637\u0648\u0631 \u0628\u0647 \u0633\u0627\u06cc\u062a\u0645 \u0648\u0635\u0644 \u06a9\u0646\u0645\u061f\u00bb, \u00abDNS \u0648 CDN \u0686\u06cc\u0647\u061f\u00bb, \u00abName Server \u0622\u0631\u0648\u0627\u0646 \u0631\u0648 \u062a\u0648\u06cc \u0627\u06cc\u0631\u0646\u06cc\u06a9 \u06a9\u062c\u0627 \u0628\u0632\u0646\u0645\u061f\u00bb. Reused canonical tags only, no mint, no batch: #\u067e\u0644\u0627\u06a9_\u0635\u0641\u0631 (series), #\u0633\u0627\u06cc\u062a_\u0645\u0637\u0628, #\u062f\u0627\u0645\u0646\u0647_\u0633\u0627\u06cc\u062a (decision+specific, 2 pages), #GitHub. Resolving sentences: #\u0633\u0627\u06cc\u062a_\u0645\u0637\u0628 \u00ab\u0633\u0627\u06cc\u062a \u0634\u0645\u0627 \u0627\u0644\u0627\u0646 \u0631\u0648\u0634\u0646 \u0627\u0633\u062a\u060c \u0648\u0644\u06cc \u0628\u0627 \u06cc\u06a9 \u0622\u062f\u0631\u0633 \u0645\u0648\u0642\u062a \u0628\u0627\u0632 \u0645\u06cc\u200c\u0634\u0648\u062f\u2026\u00bb; #\u062f\u0627\u0645\u0646\u0647_\u0633\u0627\u06cc\u062a \u00ab\u0627\u0633\u0645\u06cc \u0647\u0645 \u06a9\u0647 \u0628\u0631\u0627\u06cc \u0633\u0627\u06cc\u062a \u062e\u0631\u06cc\u062f\u0647\u200c\u0627\u06cc\u062f\u060c \u0645\u062b\u0644\u0627\u064b drsamadi.ir\u060c \u0647\u0646\u0648\u0632 \u0628\u0647 \u062c\u0627\u06cc\u06cc \u0648\u0635\u0644 \u0646\u06cc\u0633\u062a.\u00bb; #GitHub \u00ab\u062e\u0648\u062f \u0633\u0627\u06cc\u062a \u062c\u0627\u0628\u0647\u200c\u062c\u0627 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f \u0648 \u062f\u0631 \u06af\u06cc\u062a\u200c\u0647\u0627\u0628 \u0645\u06cc\u200c\u0645\u0627\u0646\u062f. \u0628\u0631\u0627\u06cc \u0647\u0645\u06cc\u0646 \u0627\u06af\u0631 \u0627\u06cc\u0646\u062a\u0631\u0646\u062a \u062e\u0627\u0631\u062c \u0642\u0637\u0639 \u0634\u0648\u062f\u060c \u0645\u0646\u0634\u06cc \u0647\u0645 \u062f\u0633\u062a\u0634 \u0628\u0647 \u0628\u0627\u06cc\u06af\u0627\u0646\u06cc \u0646\u0645\u06cc\u200c\u0631\u0633\u062f.\u00bb Four tags, below 5-8 density target: conservative, no mint (no existing page resolves DNS/CDN). hashtag_ref --sync, build_plus_index (reverted), --check OK, build_cabinet_papers --check OK; reachability: page in tags with 2, 9, 12, 13 pages, passes via #\u062f\u0627\u0645\u0646\u0647_\u0633\u0627\u06cc\u062a"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry appended at end of array with identical key set/order as plak1-12 (type,id,title,caption,hashtags,keywords,page_url,pillar); hashtags = canonical list of 5.0; pillar practice-infrastructure/site-ownership"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "recorded pillar practice-infrastructure / subtopic site-ownership = step 2.4 value; page capsule href /pillar/practice-infrastructure/ matches; no new subtopic"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathway_place: STRONG ai-dentistry after plak-sefr/plak1-12 (series sibling anchor) -> inserted at index 36, milestone false, pathway now 37 steps; ASK candidates not placed (conservative default, reported): fixed-pros, treatment-planning, implant-prosthetic, esthetic, failure-troubleshooting, post-and-core, biomimetic (0 related steps each); coverage: plak1-13 in 1 full pathway. 4.12-\u0628: skipped, no exam question written, M2 not sent (a question is written only after the founder approves its full text; a missing question costs nothing, pathways open on their own at twenty article questions); reported for the founder"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle check: candidate bundles continuing ai-dentistry evaluated; GATE 1 type: folder plak-sefr is not episodes/notecast/sharehub/dentai -> \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1); no bundle edited, home-bundles.js untouched"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse line \u00ab\u067e\u0644\u0627\u06a9 \u0635\u0641\u0631\u060c \u0642\u0633\u0645\u062a \u06f1\u06f3: \u00ab\u062f\u0641\u062a\u0631 \u0648 \u0645\u0646\u0634\u06cc \u0633\u0627\u06cc\u062a: DNS \u0648 CDN\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb inserted at top of index.html, oldest line (sharehub/share-45) removed, 7 lines; authored English mirror plak-sefr/en/plak1-13.html + fa toggle (inverse), en/plak1-12 next slot wired; ten-scope editorial lock recorded; title/caption approvals recorded"
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
    "note": "Index-only refresh after staging delivery paths: plak-sefr/plak1-13.html, plak-sefr/en/plak1-13.html, plak-sefr/en/plak1-12.html, plak-sefr/index.html, index.html, dentcast-brain.json, dentcast-hashtag-reference.json, plus/faq-corpus.json, plus/pathways.json, plak-sefr/plak1-12.html"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
