# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-117"
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
    "content_id": "insight/insight-117",
    "context": {
      "approvals": [
        {
          "decision": "\u0647\u06af\u0632 \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0631\u06af\u06cc\u0631 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f\u061b \u062e\u0637\u0627\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u0633\u06cc\u0633\u062a\u0645 \u062f\u0631 \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631",
          "evidence": [
            "standing acceptance: agent-proposed SEO title; founder asked \u00ab\u0639\u0646\u0648\u0627\u0646\u0634\u0645 \u06cc\u0647 \u0639\u0646\u0648\u0627\u0646 \u0633\u0626\u0648 \u067e\u0633\u0646\u062f \u0628\u0632\u0627\u0631\u00bb"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0633\u0627\u062e\u062a \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 \u062f\u0631 \u062f\u0647\u0627\u0646 \u067e\u0627\u06cc\u06cc\u0646\u200c\u062a\u0631 \u0627\u0632 \u06a9\u0633\u062a \u0645\u06cc\u200c\u0646\u0634\u0633\u062a \u0648 \u0647\u06af\u0632\u0634 \u062f\u0631\u06af\u06cc\u0631 \u0646\u0645\u06cc\u200c\u0634\u062f. \u0639\u0644\u062a\u060c \u0627\u0646\u062a\u062e\u0627\u0628 \u0642\u0637\u0639\u0647 \u0648 \u0644\u0627\u06cc\u0628\u0631\u0631\u06cc \u06cc\u06a9 \u0633\u06cc\u0633\u062a\u0645 \u062f\u06cc\u06af\u0631 \u0628\u0647\u200c\u062c\u0627\u06cc Ufit \u0628\u0648\u062f\u060c \u0646\u0647 \u0627\u0633\u06a9\u0646.",
          "evidence": [
            "standing acceptance: agent-composed caption (insight convention, <=200 chars)"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "Q1, Q2 approved; Q3 rejected",
          "evidence": [
            "M2 answer in chat"
          ],
          "scope": "exam-questions",
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
          "decision": "founder approved Q1 and Q2 (r-74421c03, r-bff17ee8); rejected Q3 and said two are enough \u2014 Q3 not written",
          "evidence": [
            "chat: \u00ab\u0633\u0648\u0627\u0644 \u06f3 \u062a\u0627\u06cc\u06cc\u062f \u0646\u06cc\u0633\u062a \u0647\u0645\u06cc\u0646 \u062f\u0648\u062a\u0627\u06cc \u0627\u0648\u0644 \u06a9\u0627\u0641\u06cc\u0647\u00bb"
          ],
          "kind": "m2_exam_questions"
        },
        {
          "decision": "chairside/chairside-48 (fa+en): \u00ab\u0633\u06cc\u0633\u062a\u0645 \u06a9\u0631\u0647\u200c\u0627\u06cc\u00bb\u2192\u00ab\u0633\u06cc\u0633\u062a\u0645 Ufit\u00bb, scan body DIO\u2192Mini Biotem (founder), impression coping DIO\u2192Mini Biotem (agent, same-brand reading; flagged to founder); dates unchanged",
          "evidence": [
            "chat: \u00ab\u0633\u06cc\u0633\u062a\u0645\u200c\u0647\u0627\u06cc \u0645\u0637\u0631\u062d \u0634\u062f\u0647 \u062a\u0648\u06cc \u0648\u06cc\u0632\u06cc\u062a \u0642\u0628\u0644\u06cc \u0631\u0648 \u0647\u0645 \u0627\u0635\u0644\u0627\u062d \u06a9\u0646\u00bb",
            "chat: \u00ab\u0633\u06cc\u0633\u062a\u0645 \u0648 \u0627\u0633\u06a9\u0646 \u0628\u0627\u062f\u06cc \u0627\u06cc\u0646\u06cc\u0647 \u06a9\u0647 \u0627\u0644\u0627\u0646 \u0645\u06cc\u200c\u06af\u0645\u00bb"
          ],
          "kind": "founder_requested_edit"
        },
        {
          "evidence": [
            "insight/insight-117.html first <p> = founder text paragraph 1"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder's own first paragraph (link to chairside-48) opens the body; no agent lead"
        },
        {
          "english": {
            "evidence": [
              "en mirror on disk, noindex, inLanguage en, toggle ../insight-117.html"
            ],
            "path": "insight/en/insight-117.html",
            "status": "ready"
          },
          "evidence": [
            "all founder messages closed before Push 2"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13 COMMENTARY DES 15/E stored; fidelity [null] (basket 1)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Q4.9 \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc; C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "implantology/prosthetic-components (C.2.4, C.5.5)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 0 (caps), C.4.8 2 inline, C.4.9 3 capsules"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 8 canonical tags, 0 minted, --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "brain clinical-117 appended last"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "implant-prosthetic, fixed-pros; exam rows r-74421c03, r-bff17ee8"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html: new first line insight-117, oldest (notecast episode-45) removed; 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "insight/en/insight-117.html authored; toggles inverse"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "M2 answered; title/caption standing acceptance; chairside-48 edit founder-requested"
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
      },
      {
        "evidence": [
          "strong candidates scan-body, abutment, implant-supported-crown: each at cap 5/5 (related_cap.py) -> skipped (cap); ti-base, screw-retained, dental-implant: borderline/unrelated -> not linked; 0 back-links added"
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
          "applied: \u00ab\u0627\u0633\u06a9\u0646\u200c\u0628\u0627\u062f\u06cc\u00bb (1st qualifying occurrence, p2) -> /glossary/scan-body.html; \u00ab\u0627\u0628\u0627\u062a\u0645\u0646\u062a\u00bb (1st occurrence outside existing link, p2) -> /glossary/abutment.html; chairside-48 already linked by founder text. Skipped borderline: \u00ab\u0644\u0627\u06cc\u0628\u0631\u0631\u06cc\u00bb -> insight-26/31 (looser), \u00ab\u0631\u0648\u06a9\u0634\u00bb -> implant-supported-crown (generic), \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb -> dental-implant (generic)"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "free slots 3 (2 nav capsules); added strongest first: chairside-48 (the case this continues), insight-26 (wrong library file -> abutment height/fit error), insight-35 (abutment seen short: data vs lab error); skipped at cap: insight-31 (scan body/Ti-base brand compatibility), insight-112 (scan body errors); section 5/5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent[insight/insight-117].definedTermSets: 3 authored DefinedTerms #flashcards-c1..c3 (hex smaller than implant hex; seating abutment inside crown in deep gingiva; reference part for comparison); none a FAQ-answer near-copy; not in page JSON-LD"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage #faq, 4 binary standalone questions (no deixis), answers open with \u0628\u0644\u0647/\u062e\u06cc\u0631: Q1 \u0628\u0644\u0647, Q2 \u062e\u06cc\u0631, Q3 \u062e\u06cc\u0631, Q4 \u062e\u06cc\u0631; 4 binary questions to the scored bank; 4.12-\u0628 evaluated at 5.6"
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
        "reason": "not a \u0686\u0627\u0644\u0634 (Q4.9 \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc)",
        "status": "skipped"
      },
      {
        "evidence": [
          "questions: \u00ab\u0647\u06af\u0632 \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u062f\u0631\u06af\u06cc\u0631 \u0646\u0645\u06cc\u0634\u0647 \u0648\u0644\u06cc \u067e\u06cc\u0686 \u0628\u0633\u062a\u0647 \u0645\u06cc\u0634\u0647\u00bb\u060c \u00ab\u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 \u0631\u0648\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062c\u0627 \u0646\u0645\u06cc\u0631\u0647\u00bb\u060c \u00ab\u0631\u0648\u06a9\u0634 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0631\u0648\u06cc \u06a9\u0633\u062a \u0627\u0648\u06a9\u06cc\u0647 \u0648\u0644\u06cc \u062a\u0648 \u062f\u0647\u0646 \u06a9\u0648\u062a\u0627\u0647\u0647\u00bb\u060c \u00ab\u0642\u0637\u0639\u0627\u062a \u06a9\u0627\u0645\u067e\u062a\u06cc\u0628\u0644 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0627\u0632 \u0633\u06cc\u0633\u062a\u0645 \u062f\u06cc\u06af\u0647\u00bb\u061b all reused canonical, 0 minted: #\u0646\u06a9\u062a\u0647_\u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc (series) #\u062a\u0641\u06a9\u06cc\u06a9_\u0645\u0646\u0634\u0623_\u062e\u0637\u0627 (\u00ab\u06a9\u0648\u062a\u0627\u0647 \u0628\u0648\u062f\u0646 \u0631\u0648\u06a9\u0634 \u062f\u0631 \u062f\u0647\u0627\u0646 \u0647\u0645 \u0627\u0632 \u0647\u0645\u06cc\u0646\u200c\u062c\u0627 \u0628\u0648\u062f\u060c \u0646\u0647 \u0627\u0632 \u0627\u0633\u06a9\u0646.\u00bb) #\u062e\u0637\u0627\u06cc_\u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 (\u00ab\u067e\u0630\u06cc\u0631\u0641\u062a\u0646\u062f \u06a9\u0647 \u0627\u0634\u062a\u0628\u0627\u0647 \u0627\u0632 \u0622\u0646\u200c\u0647\u0627 \u0628\u0648\u062f\u0647 \u0627\u0633\u062a.\u00bb) #\u0644\u0627\u06cc\u0628\u0631\u0631\u06cc_\u062f\u06cc\u062c\u06cc\u062a\u0627\u0644 (\u00ab\u0627\u0632 \u0647\u0645\u0627\u0646 \u0627\u0628\u062a\u062f\u0627 \u0642\u0637\u0639\u0647 \u0648 \u0644\u0627\u06cc\u0628\u0631\u0631\u06cc \u0633\u06cc\u0633\u062a\u0645 \u062f\u06cc\u06af\u0631\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u0634\u062f\u0647 \u0628\u0648\u062f.\u00bb) #\u0633\u0627\u0632\u06af\u0627\u0631\u06cc_\u0628\u0631\u0646\u062f (same) #\u06a9\u0627\u0646\u06a9\u0634\u0646_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a (\u00ab\u06a9\u0627\u0646\u06a9\u0634\u0646 \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 \u0628\u0627 \u06a9\u0627\u0646\u06a9\u0634\u0646 \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0647\u06cc\u0644\u06cc\u0646\u06af ... \u06cc\u06a9\u06cc \u0646\u0628\u0648\u062f.\u00bb) #\u0627\u0628\u0627\u062a\u0645\u0646\u062a (umbrella) #\u062a\u0648\u0646\u0644_\u0648\u06cc\u0698\u0646 (\u00ab\u0646\u0648\u0639\u06cc \u062f\u06cc\u062f \u062a\u0648\u0646\u0644\u06cc \u0628\u0648\u062f.\u00bb); skipped: #\u0636\u062f_\u0686\u0631\u062e\u0634 (definition = crown rotation on abutment, borderline), #\u0627\u0633\u06a9\u0646_\u0628\u0627\u062f\u06cc (ruled out, mention). --sync done; --check OK; build_cabinet_papers --check OK; reachability: page in first 4 of \u062a\u0641\u06a9\u06cc\u06a9 \u0645\u0646\u0634\u0623 \u062e\u0637\u0627, \u0644\u0627\u06cc\u0628\u0631\u0631\u06cc \u062f\u06cc\u062c\u06cc\u062a\u0627\u0644, \u0633\u0627\u0632\u06af\u0627\u0631\u06cc \u0628\u0631\u0646\u062f, \u062a\u0648\u0646\u0644 \u0648\u06cc\u0698\u0646; content-index/assistant-tags reverted"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry clinical-117 appended as last element (634), keys identical to clinical-116; keywords (8, from text, no hashtag repeat): \u0622\u0646\u062a\u06cc\u200c\u0631\u0648\u062a\u06cc\u0634\u0646\u060c \u0647\u06af\u0632 \u0627\u0628\u0627\u062a\u0645\u0646\u062a\u060c \u0631\u0648\u06a9\u0634 \u0628\u0647\u200c\u0639\u0646\u0648\u0627\u0646 \u0631\u0627\u0647\u0646\u0645\u0627\u060c \u0627\u0628\u0627\u062a\u0645\u0646\u062a \u0647\u06cc\u0644\u06cc\u0646\u06af\u060c \u062f\u0633\u062a\u0648\u0631 \u06a9\u0627\u0631\u060c Ufit\u060c DIO UF\u060c Mini Biotem"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar implantology/prosthetic-components = step 2.4 decision; capsule /pillar/implantology/ matches; no new subtopic"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways: implant-prosthetic after chairside/chairside-48 (index 38, STRONG), fixed-pros after chairside/chairside-48 (index 71, STRONG); ASK candidates not placed: bundle-implant-parts, esthetic, occlusion, digital, treatment-planning, bundle-implant-impression; coverage 1.52 per item (baseline 1.38); 4.12-\u0628: 2 MCQ rows in plus/exam-questions.json (r-74421c03, r-bff17ee8) approved in M2, Q3 rejected; validate_exam_questions 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "candidate bundles bundle-implant-parts, bundle-implant-impression (implant-prosthetic), bundle-crown-prep (fixed-pros): each \u00ab\u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1 \u2014 insight/)\u00bb"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse line \u00ab\u06cc\u06a9 \u0646\u06a9\u062a\u0647\u0654 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u06cc \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab\u2026\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb (title only, no spoiler) inserted first, notecast episode-45 line removed, 7 lines; en mirror + toggles; second_cut_editorial_lock_v1 recorded"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
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
    "note": "Index-only refresh after staging delivery paths: insight/insight-117.html, insight/en/insight-117.html, dentcast-brain.json, dentcast-hashtag-reference.json, index.html, plus/faq-corpus.json, plus/pathways.json, plus/exam-questions.json, chairside/chairside-48.html, chairside/en/chairside-48.html"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
