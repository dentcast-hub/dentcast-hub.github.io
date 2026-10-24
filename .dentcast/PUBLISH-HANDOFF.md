# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-41"
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
    "category": "sharehub",
    "content_id": "sharehub/share-41",
    "context": {
      "approvals": [
        {
          "decision": "\u062a\u0631\u0645\u06cc\u0645 \u0634\u06a9\u0633\u062a\u06af\u06cc \u0648 \u067e\u0631\u06cc\u062f\u06af\u06cc \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc\u061b \u0627\u0632 \u0634\u0646\u0627\u062e\u062a \u0646\u0648\u0639 \u0633\u0631\u0627\u0645\u06cc\u06a9 \u062a\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u067e\u0631\u0648\u062a\u06a9\u0644",
          "evidence": [
            "Founder-authored H1 of doc artifact 5Pkm4z7JjsvbLvoERjcTEF (verified by Claude Docs search hit .1-.76)",
            "restored after dependency_invalidation_v1 from C.2: invalidation caused only by link anchors/capsule labels; approved scope unchanged"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0634\u06a9\u0633\u062a\u06af\u06cc \u0648 \u067e\u0631\u06cc\u062f\u06af\u06cc \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc\u060c \u0628\u0627 \u0648\u062c\u0648\u062f \u0645\u0648\u0641\u0642\u06cc\u062a \u0628\u0627\u0644\u0627\u06cc \u0627\u06cc\u0646 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646\u200c\u0647\u0627\u060c \u0647\u0645\u0686\u0646\u0627\u0646 \u062f\u0631 \u06a9\u0644\u06cc\u0646\u06cc\u06a9 \u067e\u06cc\u0634 \u0645\u06cc\u200c\u0622\u06cc\u062f. \u0627\u0645\u0627 \u0647\u0645\u0647 \u0634\u06a9\u0633\u062a\u06af\u06cc\u200c\u0647\u0627 \u0631\u0627 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f \u0628\u0627 \u06cc\u06a9 \u067e\u0631\u0648\u062a\u06a9\u0644 \u062a\u0631\u0645\u06cc\u0645 \u06a9\u0631\u062f.",
          "evidence": [
            "founder AskUserQuestion answers 2026-10-24",
            "option 'first sentence + paragraph-2 first sentence', verbatim from founder text",
            "restored after dependency_invalidation_v1 from C.2: invalidation caused only by link anchors/capsule labels; approved scope unchanged"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "ceramics / failures",
          "evidence": [
            "founder AskUserQuestion answers 2026-10-24",
            "restored after dependency_invalidation_v1 from C.2: invalidation caused only by link anchors/capsule labels; approved scope unchanged"
          ],
          "scope": "pillar",
          "status": "confirmed"
        },
        {
          "decision": "#Share_Hub #Curated_Content #\u0634\u06a9\u0633\u062a_\u0633\u0631\u0627\u0645\u06cc\u06a9 #\u0627\u0686_\u0633\u0631\u0627\u0645\u06cc\u06a9 #\u0633\u0627\u06cc\u0644\u0627\u0646 #\u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 #MDP + mint #\u0631\u06cc\u067e\u0631_\u0633\u0631\u0627\u0645\u06cc\u06a9",
          "evidence": [
            "founder AskUserQuestion answers 2026-10-24",
            "restored after dependency_invalidation_v1 from C.2: invalidation caused only by link anchors/capsule labels; approved scope unchanged"
          ],
          "scope": "hashtags",
          "status": "confirmed"
        },
        {
          "decision": "4.7: link dental-ceramics, rubber-dam, universal-adhesive; 4.8: link \u067e\u0627\u0631\u0627\u0641\u0627\u0646\u06a9\u0634\u0646 -> /glossary/bruxism.html",
          "evidence": [
            "founder AskUserQuestion answer 2026-10-24"
          ],
          "scope": "links-borderline",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "decision": "Founder explicitly requested rename to the paper's own title and move to the matching cabinet subfolder. Chosen subfolder 'Ceramics': paper covers repair of all ceramic classes (glass + oxide); precedent: glass-ceramic contaminant-protocol paper filed there 2026-08-23. No competing subfolder (zirconia / lithium di silicate are material-specific).",
          "evidence": [
            "user message 2026-10-24",
            "Drive listing of cabinet root subfolders"
          ],
          "kind": "drive_filing_v1"
        },
        {
          "decision": "Earlier unassigned run (generation<=6, never committed) could not bind because the founder-requested Drive rename/move was performed first (BIND_ONLY_BEFORE_AUTHORING). Re-initialized with verified intake identity; Drive receipt carried over as completed external action.",
          "evidence": [
            "bind error BIND_ONLY_BEFORE_AUTHORING 2026-10-24"
          ],
          "kind": "run_reinitialized_v1"
        },
        {
          "decision": "sharehub/share-41, ordinary post (not Challenge), no image; text from founder doc artifact",
          "evidence": [
            "founder answers 2026-10-24"
          ],
          "kind": "intake_identity_v1"
        },
        {
          "evidence": [
            "opening paragraph authored by founder; copied verbatim"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "Founder doc artifact 5Pkm4z7JjsvbLvoERjcTEF, first body paragraph (Claude Docs block mb3gj60g4et.77)"
        },
        {
          "decision": "Basket 2 RESEARCH: attached paper, DOI 10.1111/jerd.70055 (scoping review, primary evidence synthesis, not a consensus/guideline wrapper -> scored itself, one source)",
          "evidence": [
            "PDF + PubMed 41474072"
          ],
          "kind": "des_basket_v1"
        },
        {
          "decision": "Scanned founder text: no genuine AI tells; text unchanged",
          "evidence": [
            "B.3.5 review 2026-10-24"
          ],
          "kind": "de_ai_pass_v1"
        },
        {
          "decision": "<li><a href=\"/sharehub/share-41.html\">TITLE</a></li> \u2014 sharehub precedent (share-39/40 bare-title lines), no spoiler",
          "evidence": [
            "index.html pulse list"
          ],
          "kind": "pulse_draft_v1"
        },
        {
          "from_step": "C.2",
          "kind": "dependency_invalidation_v1",
          "reason": "Page text changed by canonical 4.8 anchors / 4.9 capsule labels after C.2; approved strings (title, caption) untouched; pillar/hashtag decisions unaffected; C.2-C.4.6 work bytes unchanged and will be re-verified",
          "superseded": {
            "approvals": [
              {
                "decision": "\u062a\u0631\u0645\u06cc\u0645 \u0634\u06a9\u0633\u062a\u06af\u06cc \u0648 \u067e\u0631\u06cc\u062f\u06af\u06cc \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc\u061b \u0627\u0632 \u0634\u0646\u0627\u062e\u062a \u0646\u0648\u0639 \u0633\u0631\u0627\u0645\u06cc\u06a9 \u062a\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u067e\u0631\u0648\u062a\u06a9\u0644",
                "evidence": [
                  "Founder-authored H1 of doc artifact 5Pkm4z7JjsvbLvoERjcTEF (verified by Claude Docs search hit .1-.76)"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "\u0634\u06a9\u0633\u062a\u06af\u06cc \u0648 \u067e\u0631\u06cc\u062f\u06af\u06cc \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc\u060c \u0628\u0627 \u0648\u062c\u0648\u062f \u0645\u0648\u0641\u0642\u06cc\u062a \u0628\u0627\u0644\u0627\u06cc \u0627\u06cc\u0646 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646\u200c\u0647\u0627\u060c \u0647\u0645\u0686\u0646\u0627\u0646 \u062f\u0631 \u06a9\u0644\u06cc\u0646\u06cc\u06a9 \u067e\u06cc\u0634 \u0645\u06cc\u200c\u0622\u06cc\u062f. \u0627\u0645\u0627 \u0647\u0645\u0647 \u0634\u06a9\u0633\u062a\u06af\u06cc\u200c\u0647\u0627 \u0631\u0627 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f \u0628\u0627 \u06cc\u06a9 \u067e\u0631\u0648\u062a\u06a9\u0644 \u062a\u0631\u0645\u06cc\u0645 \u06a9\u0631\u062f.",
                "evidence": [
                  "founder AskUserQuestion answers 2026-10-24",
                  "option 'first sentence + paragraph-2 first sentence', verbatim from founder text"
                ],
                "scope": "caption",
                "status": "confirmed"
              },
              {
                "decision": "ceramics / failures",
                "evidence": [
                  "founder AskUserQuestion answers 2026-10-24"
                ],
                "scope": "pillar",
                "status": "confirmed"
              },
              {
                "decision": "#Share_Hub #Curated_Content #\u0634\u06a9\u0633\u062a_\u0633\u0631\u0627\u0645\u06cc\u06a9 #\u0627\u0686_\u0633\u0631\u0627\u0645\u06cc\u06a9 #\u0633\u0627\u06cc\u0644\u0627\u0646 #\u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 #MDP + mint #\u0631\u06cc\u067e\u0631_\u0633\u0631\u0627\u0645\u06cc\u06a9",
                "evidence": [
                  "founder AskUserQuestion answers 2026-10-24"
                ],
                "scope": "hashtags",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [
              {
                "note": "Almeida G, Marques JA, Blatz MB, Falacho RI. J Esthet Restor Dent 2026;38(5):1032-1071. PMID 41474072, PMC13069366, CC-BY open access. Verified from PDF title page + PubMed metadata.",
                "ref": "doi:10.1111/jerd.70055"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "sharehub/share-41.html cloned structurally from share-40 (sha256 06b1067c\u2026): founder text verbatim, meta/OG/Twitter/JSON-LD values swapped, path-only swap on dentcast.org, GA4 + 2 preconnect survived, no enamad seal, lead = founder original, source credit deferred to 4.10 Part 3"
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
                "reason": "Not LiteCast (sharehub)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": "Not LiteCast (sharehub)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "pillar ceramics / subtopic failures \u2014 founder confirmed (two subtopics plausible, asked per HR14)"
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Typed-brain branch: dc-related-section with 2 capsules (/glossary/, /pillar/ceramics/)"
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "sharehub/index.html hand-maintained: one <li> for share-41 added at top, CRLF preserved, label '<title> (\u0645\u0637\u0644\u0628\u06cc \u0627\u0632 \u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646)'"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Audit before(clone)->after: JSON-LD datePublished 2026-10-23->2026-10-24 OK; dateModified 2026-10-23->2026-10-24 OK; canonical/og:url/hreflang/BreadcrumbList -> share-41 OK; title/description/og/twitter swapped OK; no og published_time in template; footer \u00a9 2025 is shared sharehub chrome (identical on share-40), not a content date"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Template sharehub/share-40.html sha256 aaf24ba81a23fb6059b951dbb9e3420e31ac5da5a2ec80396dcbe0f0c03190a3 unchanged (matches C.1)"
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
                "reason": "NoteCast only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Episode/NoteCast pair only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Promptologist only; category sharehub",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.7",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "started"
              },
              {
                "evidence": [],
                "id": "C.4.7-b",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "pending"
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
            "validation": []
          }
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "note": "Almeida G, Marques JA, Blatz MB, Falacho RI. J Esthet Restor Dent 2026;38(5):1032-1071. PMID 41474072, PMC13069366, CC-BY open access. Verified from PDF title page + PubMed metadata.",
          "ref": "doi:10.1111/jerd.70055"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": []
    },
    "external_actions": [
      {
        "evidence": [
          "Drive update_file response: id 17mLsnSNNvoxzkUjrjQUHgKKcWsRQbnWi, parentId 13ZqGDD80TJGW4UYcSqdUN6BZ3_Bty9iC (Ceramics), title 'Managing Fractured Ceramic Restorations - Current Evidence and Best Practices - A Scoping Review.pdf', fileSize 624408, modified 2026-10-24T19:25:20Z"
        ],
        "id": "drive-rename-move-1",
        "status": "completed",
        "target": "Google Drive file 17mLsnSNNvoxzkUjrjQUHgKKcWsRQbnWi: rename to paper title, move from cabinet root to subfolder Ceramics (13ZqGDD80TJGW4UYcSqdUN6BZ3_Bty9iC)"
      }
    ],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Complete reads this session: CLAUDE.md, workflows/README.md, global/README.md + core global sections, agent-parity.md, modules/01, 02, 06, publish-checkpoints.md, publish-handoff-tool.md"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text=yes (founder doc artifact 5Pkm4z7JjsvbLvoERjcTEF, sha256 of extracted text a0a2d1d8...), paper file=yes (Almeida 2026 PDF) -> normal publish + step 4.10 all three parts"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain read (573 entries, 14 types); sharehub latest = share-40 (keys: type,id,title,caption,author,source,hashtags,keywords,url,pillar); template sharehub/share-40.html; live PILLARS read after ff-merge of origin/main d783ba5 (only litecast pages changed, no workflow/tool change)"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder chose sharehub (AskUserQuestion answer 2026-10-24)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Next number share-41: sharehub ids 1..40 contiguous, no gap (HR14 stated)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Text received from founder doc artifact 5Pkm4z7JjsvbLvoERjcTEF (Claude Docs node 08fafe81-d601 rev 1); private copy scratchpad sha256 a0a2d1d8"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "De-AI scan of founder text: no genuine AI tells found; text of record unchanged (decision de_ai_pass_v1)"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Media: founder said ordinary post, no image (answer 2026-10-24); share-40 precedent fields have no audio/video"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Paper file attached (Almeida 2026 JERD PDF) -> step 4.10 ACTIVE, all three parts"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Basket 2 RESEARCH, DOI 10.1111/jerd.70055 verified (PDF + PubMed 41474072); one source"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder: ordinary post, not Challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse drafted per sharehub precedent: bare title link to /sharehub/share-41.html (HR14 auto, no spoiler)"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Not LiteCast: locked category sharehub; LiteCast branch inactive"
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
        "reason": "Not LiteCast (sharehub)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast (sharehub)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast (sharehub)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast (sharehub)",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template sharehub/share-40.html sha256 aaf24ba81a23fb6059b951dbb9e3420e31ac5da5a2ec80396dcbe0f0c03190a3"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Re-verified after invalidation: sharehub/share-41.html structural clone of share-40; founder text verbatim; GA4+preconnect present; lead = founder original"
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
        "reason": "Not LiteCast (sharehub)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast (sharehub)",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar ceramics / subtopic failures \u2014 founder confirmed"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Typed-brain: dc-related-section with /glossary/ + /pillar/ceramics/ capsules"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/index.html: one <li> for share-41 at top, CRLF preserved"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Dates 2026-10-24 (datePublished=dateModified), canonical/og/hreflang/breadcrumb -> share-41; all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Template share-40 sha256 aaf24ba8\u2026 unchanged"
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
        "reason": "NoteCast only; category sharehub",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Episode/NoteCast pair only; category sharehub",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist only",
        "status": "skipped"
      },
      {
        "evidence": [
          "Semantic review of 110 glossary terms. Auto-linked (unmistakable): silane, mdp, zls, silica-based-ceramics, zirconia-primer, polycrystalline-ceramics, glass-phase. Asked & confirmed: universal-adhesive, dental-ceramics, rubber-dam. Each page +1 capsule '\u062a\u0631\u0645\u06cc\u0645 \u0634\u06a9\u0633\u062a\u06af\u06cc \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc' at bottom, cap respected (silane/zirconia-primer/rubber-dam ->5). Not linked: sandblasting, glass-ceramics, lithium-disilicate, feldspathic-porcelain, bond-strength, isolation (at 5-cap); zirconia (6, over cap)"
        ],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "skipped-equivalent: not a glossary publish (scoped cross-link runs only for new glossary terms)"
        ],
        "id": "C.4.7-b",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Fresh semantic analysis of body: 15 first-occurrence glossary anchors (glass-phase, feldspathic-porcelain, lithium-disilicate, zirconia, silane, universal-adhesive, phosphoric-acid, glass-ceramics, sandblasting, zls, mdp, rubber-dam, bond-strength, translucency; \u067e\u0627\u0631\u0627\u0641\u0627\u0646\u06a9\u0634\u0646->bruxism founder-confirmed). Episodes considered, none added in-body (covered via 4.9). No links in headings"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Section had 2 capsules -> 3 slots: episodes/episode-136 (ceramic surface treatment), notecast/episode-11 (zirconia surface prep), notecast/episode-10 (silane); total 5/5"
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
      "dentcast_cabinet_full_catalog.json",
      "glossary/dental-ceramics.html",
      "glossary/glass-phase.html",
      "glossary/mdp.html",
      "glossary/polycrystalline-ceramics.html",
      "glossary/rubber-dam.html",
      "glossary/silane.html",
      "glossary/silica-based-ceramics.html",
      "glossary/universal-adhesive.html",
      "glossary/zirconia-primer.html",
      "glossary/zls.html",
      "index.html",
      "plus/des-scores.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-41.html",
      "sharehub/index.html",
      "sharehub/share-41.html"
    ]
  },
  "reconciliation": {
    "note": "Staged delivery-1 scope reviewed (page, landing, 10 glossary appends)"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
