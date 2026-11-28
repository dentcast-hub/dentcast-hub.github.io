# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-122"
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
    "category": "clinical",
    "content_id": "insight/insight-122",
    "context": {
      "approvals": [
        {
          "decision": "\u067e\u0648\u0633\u06cc\u062f\u06af\u06cc \u062f\u0646\u062f\u0627\u0646 \u0645\u062c\u0627\u0648\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u061b \u0645\u0634\u06a9\u0644\u06cc \u06a9\u0647 \u0645\u0645\u06a9\u0646 \u0627\u0633\u062a \u0628\u0639\u062f \u0627\u0632 \u062a\u062d\u0648\u06cc\u0644 \u0631\u0648\u06a9\u0634 \u0634\u0631\u0648\u0639 \u0634\u0648\u062f",
          "evidence": [
            "founder-supplied, copied verbatim (Hard Rule 16)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u06cc\u06a9 \u0645\u0648\u0631\u062f \u067e\u0648\u0633\u06cc\u062f\u06af\u06cc \u062f\u0646\u062f\u0627\u0646 \u067e\u0646\u062c \u062f\u0631 \u0645\u062c\u0627\u0648\u0631\u062a \u0631\u0648\u06a9\u0634 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a: \u06a9\u0627\u0646\u062a\u06a9\u062a \u0628\u0627\u0632\u060c \u062a\u063a\u06cc\u06cc\u0631 \u0641\u0631\u0645 \u0627\u0645\u0628\u0631\u0627\u0698\u0648\u0631 \u067e\u0633 \u0627\u0632 \u062a\u062d\u0648\u06cc\u0644 \u0631\u0648\u06a9\u0634\u060c \u062d\u0631\u06a9\u062a \u0645\u0632\u06cc\u0627\u0644\u06cc \u062f\u0646\u062f\u0627\u0646 \u0648 \u062a\u062d\u0644\u06cc\u0644 \u0631\u06cc\u062c\u060c \u0648 \u0622\u0645\u0648\u0632\u0634 \u0628\u0647\u062f\u0627\u0634\u062a \u0645\u062a\u0646\u0627\u0633\u0628 \u0628\u0627 \u067e\u0631\u0648\u062a\u0632 \u062c\u062f\u06cc\u062f.",
          "evidence": [
            "agent proposal under standing acceptance (Hard Rule 14)"
          ],
          "scope": "caption",
          "status": "confirmed"
        }
      ],
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
        },
        {
          "evidence": [
            "first paragraph of insight/insight-122.html"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "the founder's own first paragraph (intake text)"
        },
        {
          "english": {
            "evidence": [
              "no English page (Hard Rule 12)"
            ],
            "path": null,
            "status": "exempt"
          },
          "evidence": [
            "built by `close` from the ledger evidence of the steps through C.5.6-b"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13: DES COMMENTARY basket 1: block built by des_commentary_block.py (insight/); one isolated subagent SOURCE call on the spec .dentcast/des-v3.7-knowledge.md (sha256 709be964...), model UNVERIFIED; answer repaired by des_repair.py (0 repairs, 0 UNVERIFIED quotes); Part3: quotes verbatim, score 5+4+0+3+3=15, band E, schema OK, verify_publish --des-text ok (interpretation_fa sentence 3 deleted as unsupported), no Fidelity owed on a basket-1 page (fidelity [null] as the section's siblings); stored plus/des-scores.json[insight/insight-122]"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.14 skipped: ordinary post, not a Challenge (Question 4.9)"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "C.2.4: pillar.primary=implantology, pillar.subtopic=restoration-design (caries of the natural tooth next to an implant crown, contact/embrasure form after delivery); competing candidates recorded: fixed-pros/failures, operative/caries-management, implantology/peri-implant-health; semantic closest match per Hard Rule 6"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7: 4.7: reviewed every glossary term with a free slot (related_cap.py --glossary-room, 39 terms: bonding/ceramics/adhesion set); 0 qualifying candidates - none of those concepts (etch/cement/collagen/DES terms) is conceptually connected to caries of a natural tooth adjacent to an implant crown; no back-link written",
                "C.4.8: 4.8: candidates reviewed against every glossary term and every brain entry with a page; strong: first-occurrence inline link \u00ab\u06a9\u0627\u0646\u062a\u06a9\u062a \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0648 \u062f\u0646\u062f\u0627\u0646 \u0637\u0628\u06cc\u0639\u06cc\u00bb -> /episodes/episode-159.html (Interproximal Contact Loss). Borderline skipped and recorded: \u00ab\u06af\u06cc\u0631 \u063a\u0630\u0627\u06cc\u06cc\u00bb -> episode-121-1 (dictionary-style contact management), \u00ab\u062d\u0631\u06a9\u062a \u0645\u0632\u06cc\u0627\u0644\u06cc\u00bb (no target page), \u00ab\u0622\u0645\u0648\u0632\u0634 \u0628\u0647\u062f\u0627\u0634\u062a\u00bb (no target page)",
                "C.4.9: 4.9: section held 2 nav capsules, 3 free slots; added /episodes/episode-159.html, /insight/insight-69.html, /episodes/episode-121-1.html (related_cap reports 5/5 at cap); borderline skipped: insight-29 and meta-12 (contacts between natural crowns 6&7, not implant-adjacent)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0: 5.0: 4 dentist questions (caries next to an implant; opened contact; hygiene after implant crown; recall); concepts resolved against dentcast-hashtag-reference.json with --simulate, all canonical, no mint: #\u0646\u06a9\u062a\u0647_\u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc (series), #\u06a9\u0627\u0646\u062a\u06a9\u062a_\u0628\u0627\u0632 (9 pages, decision), #\u0627\u0645\u0628\u0631\u0627\u0698\u0648\u0631 (6), #\u067e\u0648\u0633\u06cc\u062f\u06af\u06cc (7), #\u06af\u06cc\u0631_\u063a\u0630\u0627\u06cc\u06cc (10), #\u0641\u0627\u0644\u0648\u0622\u067e_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a (3), #Adjacent_Tooth (1, page tag of episode-159); resolving sentence recorded per tag in the report; composition gate ok (series + decision + specific <=10); --reach REACHABLE (visible under #\u0641\u0627\u0644\u0648\u0622\u067e_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a and #Adjacent_Tooth); --sync ('887 concepts, 7 updated') + --check OK; no batch, no bridge row (no mint)"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5: 5: brain entry appended as the last element of the flat array (650 entries, clinical-122) with the exact 8-key set/order of clinical-121 (type,id,title,caption,hashtags,keywords,page_url,pillar); pillar implantology/[]/restoration-design; title copied codepoint-for-codepoint from the founder; caption = agent proposal (standing acceptance)"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6: 5.6: pathway_place.py -> fixed-pros STRONG (105) and failure-troubleshooting STRONG (38), both anchored after insight/insight-7; inserted both (2 full pathways, no third, no --confirmed); ASK candidates not applied and recorded: operative-cariology, treatment-planning, implant-prosthetic, biomimetic, implant-surgical, esthetic; coverage 1.53 per item (curated baseline 1.38); 4.12-\u0628: the two founder-approved questions written to plus/exam-questions.json under insight/insight-122 (ids r-31d1f4da, r-7b6c92ae), validate_exam_questions.py 0 errors",
                "C.5.6-b: 5.6-\u0628: only candidate bundle bundle-crown-prep (continues fixed-pros) -> rejected at GATE 1 (item folder insight/ is never eligible)"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "first Pulse line of index.html links /insight/insight-122.html"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "no English page (Hard Rule 12)"
              ],
              "scope": "english",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "pending_questions empty; founder answers recorded as decisions"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            }
          ]
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
        "evidence": [
          "4.7: reviewed every glossary term with a free slot (related_cap.py --glossary-room, 39 terms: bonding/ceramics/adhesion set); 0 qualifying candidates - none of those concepts (etch/cement/collagen/DES terms) is conceptually connected to caries of a natural tooth adjacent to an implant crown; no back-link written"
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
        "reason": "glossary-publish-only back-link step",
        "status": "skipped"
      },
      {
        "evidence": [
          "4.8: candidates reviewed against every glossary term and every brain entry with a page; strong: first-occurrence inline link \u00ab\u06a9\u0627\u0646\u062a\u06a9\u062a \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0648 \u062f\u0646\u062f\u0627\u0646 \u0637\u0628\u06cc\u0639\u06cc\u00bb -> /episodes/episode-159.html (Interproximal Contact Loss). Borderline skipped and recorded: \u00ab\u06af\u06cc\u0631 \u063a\u0630\u0627\u06cc\u06cc\u00bb -> episode-121-1 (dictionary-style contact management), \u00ab\u062d\u0631\u06a9\u062a \u0645\u0632\u06cc\u0627\u0644\u06cc\u00bb (no target page), \u00ab\u0622\u0645\u0648\u0632\u0634 \u0628\u0647\u062f\u0627\u0634\u062a\u00bb (no target page)"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.9: section held 2 nav capsules, 3 free slots; added /episodes/episode-159.html, /insight/insight-69.html, /episodes/episode-121-1.html (related_cap reports 5/5 at cap); borderline skipped: insight-29 and meta-12 (contacts between natural crowns 6&7, not implant-adjacent)"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.11: 6 authored DefinedTerms (c1..c6) from the body written to plus/faq-corpus.json under insight/insight-122 (no FAQ existed at that point, so all authored, atomicity rule); flashcards-index built by the runner's C.8"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.12: FAQPage node written into plus/faq-corpus.json (6 mainEntity pairs); every question self-contained (no article deixis), every yes/no answer opens with \u0628\u0644\u0647/\u062e\u06cc\u0631 (Q6 records the undetermined order as \u062e\u06cc\u0631 + the equal clinical outcome); quiz-index built by the runner"
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
        "reason": "ordinary post, not a Challenge (Question 4.9)",
        "status": "skipped"
      },
      {
        "evidence": [
          "5.0: 4 dentist questions (caries next to an implant; opened contact; hygiene after implant crown; recall); concepts resolved against dentcast-hashtag-reference.json with --simulate, all canonical, no mint: #\u0646\u06a9\u062a\u0647_\u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc (series), #\u06a9\u0627\u0646\u062a\u06a9\u062a_\u0628\u0627\u0632 (9 pages, decision), #\u0627\u0645\u0628\u0631\u0627\u0698\u0648\u0631 (6), #\u067e\u0648\u0633\u06cc\u062f\u06af\u06cc (7), #\u06af\u06cc\u0631_\u063a\u0630\u0627\u06cc\u06cc (10), #\u0641\u0627\u0644\u0648\u0622\u067e_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a (3), #Adjacent_Tooth (1, page tag of episode-159); resolving sentence recorded per tag in the report; composition gate ok (series + decision + specific <=10); --reach REACHABLE (visible under #\u0641\u0627\u0644\u0648\u0622\u067e_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a and #Adjacent_Tooth); --sync ('887 concepts, 7 updated') + --check OK; no batch, no bridge row (no mint)"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "5: brain entry appended as the last element of the flat array (650 entries, clinical-122) with the exact 8-key set/order of clinical-121 (type,id,title,caption,hashtags,keywords,page_url,pillar); pillar implantology/[]/restoration-design; title copied codepoint-for-codepoint from the founder; caption = agent proposal (standing acceptance)"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "5.5: nothing to decide; pillar primary implantology and subtopic restoration-design are valid in the live PILLARS (implantology -> restoration-design) and the step-2.5 capsule points to /pillar/implantology/"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "5.6: pathway_place.py -> fixed-pros STRONG (105) and failure-troubleshooting STRONG (38), both anchored after insight/insight-7; inserted both (2 full pathways, no third, no --confirmed); ASK candidates not applied and recorded: operative-cariology, treatment-planning, implant-prosthetic, biomimetic, implant-surgical, esthetic; coverage 1.53 per item (curated baseline 1.38); 4.12-\u0628: the two founder-approved questions written to plus/exam-questions.json under insight/insight-122 (ids r-31d1f4da, r-7b6c92ae), validate_exam_questions.py 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "5.6-\u0628: only candidate bundle bundle-crown-prep (continues fixed-pros) -> rejected at GATE 1 (item folder insight/ is never eligible)"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.6: Pulse line and the ten-scope lock (built by close)"
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
