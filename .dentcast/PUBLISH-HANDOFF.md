# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "dentcast-plus/video-16"
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
    "category": "dentcast_plus",
    "content_id": "dentcast-plus/video-16",
    "context": {
      "approvals": [
        {
          "decision": "\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645 \u0628\u0648\u062f\u060c \u0648\u0644\u06cc \u0634\u06a9\u0633\u062a\u061b \u062f\u0631\u0633\u062a \u0627\u0632 \u0648\u0633\u0637\u0650 \u06a9\u0627\u0646\u0627\u0644\u0650 \u067e\u06cc\u0686\u0650 \u0622\u062e\u0631\u06cc\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a.",
          "evidence": [
            "founder data: first line of the founder's caption (chat 2026-11-21), per video-14/15 precedent; copied codepoint for codepoint"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645 \u0628\u0648\u062f\u060c \u0648\u0644\u06cc \u0634\u06a9\u0633\u062a\u061b \u062f\u0631\u0633\u062a \u0627\u0632 \u0648\u0633\u0637\u0650 \u06a9\u0627\u0646\u0627\u0644\u0650 \u067e\u06cc\u0686\u0650 \u0622\u062e\u0631\u06cc\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a.\n\u0628\u06cc\u0634\u062a\u0631\u06cc\u0646 \u062e\u0645\u0634 \u0647\u0645\u0648\u0646\u200c\u062c\u0627\u0633\u062a \u0648 \u06a9\u0627\u0646\u0627\u0644\u0650 \u067e\u06cc\u0686 \u0647\u0645 \u0641\u0644\u0632 \u0631\u0648 \u06a9\u0645 \u06a9\u0631\u062f\u0647.\n\u0645\u06cc\u0644\u06cc\u0648\u0646\u200c\u0647\u0627 \u0628\u0627\u0631 \u062c\u0648\u06cc\u062f\u0646\u060c \u06cc\u0647 \u062a\u0631\u06a9\u0650 \u0631\u06cc\u0632\u060c \u0648 \u062a\u0645\u0627\u0645.\n\n\u0628\u0631\u0627\u06cc \u0628\u0631\u0631\u0633\u06cc \u0648 \u062a\u062d\u0644\u06cc\u0644 \u06a9\u0627\u0645\u0644 \u0648\u06cc\u062f\u06cc\u0648 \u0631\u0648 \u0628\u0628\u06cc\u0646\u06cc\u062f\n\n\ud83d\udcf7 \u062a\u0635\u0627\u0648\u06cc\u0631 \u06a9\u06cc\u0633 \u0627\u0632 \u0648\u06cc\u062f\u06cc\u0648\u06cc \u06cc\u06a9\u06cc \u0627\u0632 \u0647\u0645\u06a9\u0627\u0631\u0627\u0646",
          "evidence": [
            "founder data: caption text supplied verbatim in chat 2026-11-21 after reviewing the agent's transcription"
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
          "answer": "\u0627\u06cc\u0646 \u0648\u06cc\u062f\u06cc\u0648 \u0633\u0648\u0627\u0644 \u0646\u062f\u0627\u0631\u0647\u061b \u0645\u062a\u0646 \u06a9\u0627\u0645\u0644\u0634 \u062f\u0631 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u0627\u0644 (insight-114) \u0628\u0627 \u0633\u0624\u0627\u0644\u0627\u062a \u06a9\u0627\u0641\u06cc \u0647\u0633\u062a",
          "effect": "2 drafted rows written with status review + review_note (video-15 precedent); not drawn by the API",
          "evidence": [
            "founder chat 2026-11-21, M2 answer"
          ],
          "kind": "founder_answer",
          "message": "M2",
          "step": "C.5.6"
        },
        {
          "evidence": [
            "dentcast-plus/video-16.html .text-box"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder caption: the page body is the founder's caption verbatim, opening with its own first paragraph; no agent lead (body has no list)"
        },
        {
          "english": {
            "evidence": [
              "file on disk; noindex, follow; 0 hreflang; GA x1; toggle ../video-16.html"
            ],
            "path": "dentcast-plus/en/video-16.html",
            "status": "ready"
          },
          "evidence": [
            "agent Push-2 report"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13 DES COMMENTARY 3.7 score 9 band E stored in plus/des-scores.json; no FIDELITY owed (basket 1)"
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
                "C.2.4 implantology/restoration-design"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 0 applied, C.4.8 0 applied, C.4.9 3 capsules (5/5 at cap)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 5 canonical tags, no mint, --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5 brain entry video 16 at array end; faq-corpus FAQ 3 + cards 2"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6 implant-prosthetic + failure-troubleshooting after insight-114; 2 exam rows status review per founder M2"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html Pulse new top line -> /dentcast-plus/video-16.html, bottom (share-55) removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "dentcast-plus/en/video-16.html authored from en/video-15 precedent; toggles inverse; noindex, 0 hreflang"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title/caption founder data confirmed; M2 answered; no M1/M3b"
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
          "note": "founder caption text supplied in chat 2026-11-21 (title = its first line)",
          "ref": "founder-chat:caption",
          "sha256": "28c1ffcd707a6b6e5e247993386299e81cc684bdddad5eadbe497d42f73618db"
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
          "read README.md, global/README.md + selector (8 sections, 5 pages), agent-parity.md, publish-checkpoints.md, modules 01/02 complete; capability: ls-remote ok, push to ccr branch, GitHub MCP for Actions/PR/merge"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text yes (founder caption), paper file no -> normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed: 15 dentcast_plus entries, last video-15 keyset [type,video,title,caption,hashtags,keywords,page_url,pillar]; PILLARS read live"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type dentcast_plus (founder: video, \u00ab\u0648\u06cc\u062f\u06cc\u0648\u0647\u0627\u00bb section; precedent video-15)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number video 16 (max 15 + 1, no gap)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text = founder caption (chat 2026-11-21), sha bound in context.inputs"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5: founder caption is short and natural; no AI tells; text unchanged (title/caption never touched, HR16)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: ArvanVOD r7zm1zpJnk (config/HLS/thumbnail from founder screenshot), YouTube 1_ibkPAlt8M (founder link); no image/audio/transcript in video precedent"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.7: no paper file attached -> step 4.10 skipped"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.8 basket 1 COMMENTARY: founder's own case reasoning, no DOI/PubMed/references -> C.4.13 COMMENTARY track on page text"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.9: \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (video post, not a question)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q5 Pulse: agent draft in video-15 precedent pattern \u00ab\u06cc\u06a9 \u0648\u06cc\u062f\u06cc\u0648 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb (title-only, no spoiler); written at C.6"
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
        "reason": "LiteCast branch inactive: category dentcast_plus",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [
          "template dentcast-plus/video-15.html (latest same-category page) enrolled in target_paths"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-plus/video-16.html cloned from video-15 (structure only): founder caption as body <p>s (5 paragraphs, author_original lead), title/meta/OG/Twitter/JSON-LD/breadcrumb swapped, ArvanVOD r7zm1zpJnk + YouTube 1_ibkPAlt8M, dates 2026-11-21, .org domain kept, GA x1, 2 preconnect, no seal; no chip row in template"
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
        "reason": "LiteCast-only (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar implantology / subtopic restoration-design (strong: titanium bar of full-arch implant prosthesis fracturing at screw channel = framework/restoration design; matches clinical-114 it summarizes; competing prosthetic-components (screws) rejected: subject is the bar framework, not the screw)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "typed brain entry branch: 2 capsules \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/implantology/ in existing dc-related-section"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-plus/index.html hand-maintained static grid: video-card for video-16 added first (newest-first), sibling markup, thumbnail r7zm1zpJnk, title verbatim"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "date audit: uploadDate/datePublished/dateModified 2026-11-21 (before 2026-11-18 cloned) \u2014 all OK; no visible body date in template"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- dentcast-plus/video-15.html: clean"
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
        "reason": "NoteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast/episode pair only (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "no ep-nav block on dentcast-plus pages (not a numbered series)",
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
          "DES COMMENTARY: source_text = page body (founder caption, FULL_TEXT); SOURCE call claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964\u2026) --tools '' --model opus, fresh empty dir, model reported claude-opus-5-5; des 3.7 score 9 band E (5 + item1 4); Part 3 checks: quote verbatim OK, arithmetic OK, band E OK, schema OK; verify_publish --des-text ok; Part 3(6): interpretation_fa sentence 1 narrowed by agent (model said '\u0634\u06a9\u0633\u062a\u06af\u06cc \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u06cc' + '\u06a9\u0627\u0646\u062a\u06cc\u0644\u06cc\u0648\u0631\u062f\u0627\u0631' \u2014 not in text) -> '\u0634\u06a9\u0633\u062a\u0650 \u06cc\u06a9 \u0642\u0637\u0639\u0647\u0654 \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u06cc\u2026'; no FIDELITY owed (basket 1 COMMENTARY self-record, des_fidelity_units: 0 units); stored plus/des-scores.json dentcast-plus/video-16 (scored_at 2026-11-21, no fidelity key); no M3b"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.7 fresh semantic review of 110 glossary terms: 0 applied. Borderline skipped: screw-retained (text never names retention type; screw channel only implied), flexural-strength (\u00ab\u062e\u0645\u0634\u00bb here is bending at a site, not the material property); dental-implant/abutment too general / not the subject"
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
        "reason": "scoped cross-link runs only on a glossary publish (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [
          "4.8 analyzed body (5 founder paragraphs) vs glossary + brain: 0 applied. Borderline skipped: \u00ab\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u00bb -> share-46 (material word, not the titanium-bar concept by itself), \u00ab\u062e\u0645\u0634\u00bb -> flexural-strength (sense differs), \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb -> dental-implant (generic), \u00ab\u06a9\u0627\u0646\u0627\u0644\u0650 \u067e\u06cc\u0686\u00bb -> screw-retained (not the same concept)"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.9: 2 nav capsules + 3 free; added strongest first: insight-114 (the same case's full analysis), share-46 (titanium bar in full-arch), chairside-23 (abutment fracture from biomechanical overload); related_cap 5/5 at_cap. Considered & left out (no slot / weaker): episode-161 cantilever, insight-22 broken abutment screw, share-11 bruxism full-arch"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.11 (DentCast+ optional; founder caption carries the clinical concept, so run): plus/faq-corpus.json byContent dentcast-plus/video-16 definedTermSets #flashcards-c1..c2, both authored from body (no near-copy of FAQ answers); none in page JSON-LD"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.12: FAQPage #faq 3 questions in faq-corpus, all standalone (no deixis), all yes/no with verdict first (\u0628\u0644\u0647/\u062e\u06cc\u0631/\u0628\u0644\u0647) -> 3 binary for quiz bank; 4.12-\u0628 evaluated at 5.6"
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
        "reason": "ordinary post, not a \u0686\u0627\u0644\u0634 (Q4.9)",
        "status": "skipped"
      },
      {
        "evidence": [
          "5.0 questions: \u00ab\u0686\u0631\u0627 \u0628\u0627\u0631 \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645\u06cc \u0641\u0648\u0644 \u0622\u0631\u0686 \u0627\u0632 \u06a9\u0627\u0646\u0627\u0644 \u067e\u06cc\u0686 \u0634\u06a9\u0633\u062a\u061f\u00bb, \u00abtitanium bar fracture full arch\u00bb, \u00ab\u0634\u06a9\u0633\u062a\u0646 \u0641\u0631\u06cc\u0645\u200c\u0648\u0631\u06a9 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0639\u0644\u062a\u0634 \u0686\u06cc\u0647\u061f\u00bb, \u00ab\u0639\u0648\u0627\u0631\u0636 \u0645\u06a9\u0627\u0646\u06cc\u06a9\u06cc \u067e\u0631\u0648\u062a\u0632 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb. Tags (all reused canonical, no mint): #\u0648\u06cc\u062f\u06cc\u0648 (series), #\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645_\u0628\u0627\u0631 (3->4, resolving \u00ab\u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645 \u0628\u0648\u062f\u060c \u0648\u0644\u06cc \u0634\u06a9\u0633\u062a\u061b \u062f\u0631\u0633\u062a \u0627\u0632 \u0648\u0633\u0637\u0650 \u06a9\u0627\u0646\u0627\u0644\u0650 \u067e\u06cc\u0686\u0650 \u0622\u062e\u0631\u06cc\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a.\u00bb), #\u0639\u0648\u0627\u0631\u0636_\u0645\u06a9\u0627\u0646\u06cc\u06a9\u06cc (decision/cause; \u00ab\u0645\u06cc\u0644\u06cc\u0648\u0646\u200c\u0647\u0627 \u0628\u0627\u0631 \u062c\u0648\u06cc\u062f\u0646\u060c \u06cc\u0647 \u062a\u0631\u06a9\u0650 \u0631\u06cc\u0632\u060c \u0648 \u062a\u0645\u0627\u0645.\u00bb), #\u0637\u0631\u0627\u062d\u06cc_\u0641\u0631\u06cc\u0645_\u0648\u0631\u06a9 (decision; \u00ab\u0628\u06cc\u0634\u062a\u0631\u06cc\u0646 \u062e\u0645\u0634 \u0647\u0645\u0648\u0646\u200c\u062c\u0627\u0633\u062a \u0648 \u06a9\u0627\u0646\u0627\u0644\u0650 \u067e\u06cc\u0686 \u0647\u0645 \u0641\u0644\u0632 \u0631\u0648 \u06a9\u0645 \u06a9\u0631\u062f\u0647.\u00bb), #\u0627\u06cc\u0645\u067e\u0644\u0646\u062a_\u0641\u0648\u0644_\u0622\u0631\u0686 (umbrella, in addition). Not tagged: #\u06a9\u0627\u0646\u062a\u06cc_\u0644\u06cc\u0648\u0631/#\u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u0645/#\u0627\u06a9\u0644\u0648\u0698\u0646_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a (not resolved by page text); \u062e\u0633\u062a\u06af\u06cc \u0641\u0644\u0632 -> keywords (no mint). --sync done, build_plus_index run+reverted, --check OK, build_cabinet_papers --check OK; reachability: page in chips \u062a\u06cc\u062a\u0627\u0646\u06cc\u0648\u0645 \u0628\u0627\u0631 (4 pages), \u0637\u0631\u0627\u062d\u06cc \u0641\u0631\u06cc\u0645 \u0648\u0631\u06a9 (4), \u0639\u0648\u0627\u0631\u0636 \u0645\u06a9\u0627\u0646\u06cc\u06a9\u06cc (5) -> within first 4 pages of a chip: pass. No chip row in template."
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry appended at array end: type dentcast_plus, video 16, title/caption founder verbatim, 5 canonical hashtags, 9 keywords, page_url, pillar implantology/[]/restoration-design; key set/order == video-15"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar recorded == step 2.4 (implantology/restoration-design, existing subtopic); capsule /pillar/implantology/ matches"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "5.6: placed (semantic unmistakable homes, tool flagged ASK as aid) in implant-prosthetic after insight/insight-114 (idx 60) and failure-troubleshooting after insight/insight-114 (idx 6); not placed (borderline): implant-surgical, occlusion, ceramics, fixed-pros, treatment-planning, esthetic; coverage 1.52/item (baseline 1.38, was 1.52 before rounding). 4.12-\u0628: M2 sent; founder: no exam questions for this video (full text in insight-114) -> 2 rows r-\u2026 written with status review + review_note; validate_exam_questions 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle candidates continuing implant-prosthetic / failure-troubleshooting: every one \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1 \u2014 dentcast-plus/ folder never enters a bundle); no bundle edit"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: \u00ab\u06cc\u06a9 \u0648\u06cc\u062f\u06cc\u0648 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb new top line, share-55 bottom line removed, 7 lines; en mirror dentcast-plus/en/video-16.html + inverse toggles; ten-scope lock recorded; local verify_publish preview: 88 ok, 9 FAIL all runner-owned (C.8 builders: sitemap, pillar, plus-index, flashcards, quiz; C.7 stamp)"
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
      "dentcast-plus/en/video-15.html",
      "dentcast-plus/en/video-16.html",
      "dentcast-plus/index.html",
      "dentcast-plus/video-15.html",
      "dentcast-plus/video-16.html",
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-plus/video-16.html, dentcast-plus/en/video-16.html, index.html, dentcast-brain.json, dentcast-hashtag-reference.json, plus/faq-corpus.json, plus/pathways.json, plus/exam-questions.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
