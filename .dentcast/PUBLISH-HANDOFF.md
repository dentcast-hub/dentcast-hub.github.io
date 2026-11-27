# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-62"
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
    "category": "sharehub",
    "content_id": "sharehub/share-62",
    "context": {
      "approvals": [
        {
          "decision": "\u06cc\u06a9\u06cc \u062f\u0648 \u062f\u0646\u062f\u0627\u0646 \u0628\u0627\u0642\u06cc\u200c\u0645\u0627\u0646\u062f\u0647 \u062f\u0631 \u0641\u06a9 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u06cc\u061b \u062d\u0641\u0638 \u06a9\u0646\u06cc\u0645 \u06cc\u0627 \u0628\u06a9\u0634\u06cc\u0645\u061f",
          "evidence": [
            "founder-supplied, copied verbatim (Hard Rule 16)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u062d\u0641\u0638 \u06cc\u06a9\u06cc \u062f\u0648 \u062f\u0646\u062f\u0627\u0646 \u0637\u0628\u06cc\u0639\u06cc \u062f\u0631 \u0641\u06a9\u06cc \u06a9\u0647 \u0628\u0627 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0627\u0632\u0633\u0627\u0632\u06cc \u0645\u06cc\u200c\u0634\u0648\u062f\u061b \u0646\u0642\u0634 \u062d\u0633 \u067e\u0631\u0648\u067e\u0631\u06cc\u0648\u0633\u067e\u062a\u06cc\u0648 \u0644\u06cc\u06af\u0627\u0645\u0627\u0646 \u067e\u0631\u06cc\u0648\u062f\u0646\u062a\u0627\u0644\u060c \u0627\u0633\u0626\u0648\u067e\u0631\u0633\u067e\u0634\u0646 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u060c \u0648 \u0647\u0632\u06cc\u0646\u0647\u200c\u0647\u0627\u06cc\u06cc \u0645\u062b\u0644 \u0628\u0627\u0632 \u0634\u062f\u0646 \u06a9\u0627\u0646\u062a\u06a9\u062a \u0648 \u0627\u062e\u062a\u0644\u0627\u0641 \u0627\u0631\u062a\u0641\u0627\u0639 \u0627\u06a9\u0644\u0648\u0632\u0627\u0644 \u062f\u0631 \u062a\u0635\u0645\u06cc\u0645\u200c\u06af\u06cc\u0631\u06cc.",
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
          "decision": "founder approved all 3 drafted questions verbatim (\u00ab\u0633\u0648\u0627\u0644\u0627 \u062a\u0627\u06cc\u06cc\u062f\u00bb)",
          "evidence": [
            "chat answer 2026-11-27"
          ],
          "kind": "m2_exam_questions"
        },
        {
          "decision": "C.4.13 in progress: 10 DES SOURCE records stored in plus/des-scores.json (fidelity slots null); 10 POOLED fidelity sweeper calls running",
          "evidence": [
            "des-src0..9 repaired+guard ok+des-text ok"
          ],
          "kind": "progress_checkpoint"
        },
        {
          "evidence": [
            "first paragraph of sharehub/share-62.html"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "the founder's own first paragraph (intake text)"
        },
        {
          "english": {
            "evidence": [
              "sharehub/en/share-62.html on disk, toggles wired"
            ],
            "path": "sharehub/en/share-62.html",
            "status": "ready"
          },
          "evidence": [
            "built by `close` from the ledger evidence of the steps through C.5.6-b"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13: DES: 10 SOURCE calls, claude -p opus (modelUsage claude-opus-5-5), system prompt .dentcast/des-v3.7-knowledge.md sha256 709be964\u202694e2e9, ABSTRACT_ONLY from PubMed MCP (verbatim); scores 8E,25D,25D,55C,55C,25D,25D,55C,55C,28D; des_repair+guard+des-text ok (one interpretation_fa sentence in src6 corrected by agent). Fidelity POOLED: 10 sweeper calls opus + --merge; 24/24 MATCHES, score 100 HIGH, provisional; accepted+installed via packet"
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
                "C.2.4: pillar implantology (clear fit: implant treatment planning around remaining teeth); subtopic surgical-planning \u00ab\u062c\u0631\u0627\u062d\u06cc\u060c \u062c\u0627\u06cc\u06af\u0630\u0627\u0631\u06cc \u0648 \u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646\u00bb (closest: treatment-planning decision; competitor fundamentals rejected)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7: 4.7: related_cap --glossary-room listed 48 terms with room; none semantically related (osseointegration, dental-implant, implant-loading are at cap/no room); 0 back-links",
                "C.4.8: 4.8: applied 1 \u2014 \u00ab\u0627\u0633\u0626\u0648\u0627\u06cc\u0646\u062a\u06af\u0631\u06cc\u0634\u0646\u00bb -> /glossary/osseointegration.html (technical sense, first occurrence). Skipped borderline: \u00ab\u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0641\u0627\u0646\u06a9\u0634\u0646\u0627\u0644\u00bb -> implant-loading (loading protocol \u2260 functional loading); \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb -> dental-implant (generic); no brain page matches a body phrase strongly",
                "C.4.9: 4.9: 3 free slots filled: share-50 (keeping roots/proprioception), insight-24 (natural tooth beside implant), meta-17 (missing PDL in full implant rehab). Skipped: episode-163 food impaction (borderline), share-43, episode-151..153 (keep vs extract general, cap reached). related_cap 5/5"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0: 5.0 questions: \u00ab\u06cc\u06a9\u06cc \u062f\u0648 \u062f\u0646\u062f\u0627\u0646 \u0628\u0627\u0642\u06cc\u200c\u0645\u0648\u0646\u062f\u0647 \u062a\u0648 \u0641\u06a9 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u06cc \u0631\u0648 \u0646\u06af\u0647 \u062f\u0627\u0631\u0645 \u06cc\u0627 \u0628\u06a9\u0634\u0645\u061f\u00bb\u060c \u00abproprioception \u062f\u0646\u062f\u0627\u0646 \u0637\u0628\u06cc\u0639\u06cc \u062f\u0631 \u0628\u0631\u0627\u0628\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb\u060c \u00abosseoperception \u0686\u06cc\u0647\u061f\u00bb\u060c \u00ab\u0686\u0631\u0627 \u06a9\u0627\u0646\u062a\u06a9\u062a \u06a9\u0646\u0627\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0627\u0632 \u0645\u06cc\u0634\u0647\u061f\u00bb. Reused 8 canonical tags, minted 0 (osseoperception kept in keywords: no second resolving page). Resolving sentences: \u062d\u0641\u0638_\u062f\u0646\u062f\u0627\u0646/\u067e\u0631\u0648\u06af\u0646\u0648\u0632_\u062f\u0646\u062f\u0627\u0646/\u067e\u0644\u0646\u06cc\u0646\u06af_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a -> final paragraph + 3-factor list; \u067e\u0631\u0648\u067e\u0631\u06cc\u0648\u0633\u067e\u0634\u0646 -> \u00ab\u062d\u0633 \u067e\u0631\u0648\u067e\u0631\u06cc\u0648\u0633\u067e\u062a\u06cc\u0648 \u06cc\u06a9 \u0627\u0645\u062a\u06cc\u0627\u0632 \u0648\u0627\u0642\u0639\u06cc \u0627\u0633\u062a\u2026\u00bb; PDL -> \u00ab\u0646\u0642\u0634 \u0627\u0635\u0644\u06cc \u0627\u06cc\u0646 \u06af\u06cc\u0631\u0646\u062f\u0647\u200c\u0647\u0627 \u2026 \u062a\u0646\u0638\u06cc\u0645 \u062f\u0642\u06cc\u0642 \u0646\u06cc\u0631\u0648\u00bb; \u06a9\u0627\u0646\u062a\u06a9\u062a_\u0628\u0627\u0632 -> \u00ab\u06f4\u06f1 \u062f\u0631\u0635\u062f \u2026 \u0645\u0632\u06cc\u0627\u0644\u00bb; \u0627\u06cc\u0646\u0641\u0631\u0627\u0627\u06a9\u0644\u0648\u0698\u0646 -> \u00ab\u0627\u062e\u062a\u0644\u0627\u0641 \u0627\u0631\u062a\u0641\u0627\u0639\u00bb. --reach REACHABLE (#\u067e\u0631\u0648\u067e\u0631\u06cc\u0648\u0633\u067e\u0634\u0646 4/4, #\u0627\u06cc\u0646\u0641\u0631\u0627\u0627\u06a9\u0644\u0648\u0698\u0646 2/2); --sync, --check OK; build_cabinet_papers --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5: brain entry sharehub id 62 appended at array end; key set/order equal to share-61; pillar implantology/surgical-planning; diff 36 lines"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6: 5.6: placed (STRONG) in treatment-planning after episodes/episode-150-2 and implant-prosthetic after insight/insight-26; not placed (ASK/borderline): fixed-pros, failure-troubleshooting, implant-surgical, removable-pros, esthetic, ceramics. coverage 1.53/item (baseline 1.38). 4.12-\u0628: 3 founder-approved MCQs written (r-b346d3b0, r-67f31405, r-75ebb0a6); validate_exam_questions 0 errors",
                "C.5.6-b: bundles: bundle-implant-parts \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2: \u0639\u0646\u0648\u0627\u0646 \u06cc\u06a9 \u0645\u0648\u0642\u0639\u06cc\u062a \u062e\u0627\u0635 \u0627\u0633\u062a\u060c \u0646\u0647 \u0645\u0641\u0647\u0648\u0645 \u067e\u0627\u06cc\u0647)\u061b bundle-implant-impression \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2\u060c \u0647\u0645\u0627\u0646 \u062f\u0644\u06cc\u0644)"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "first Pulse line of index.html links /sharehub/share-62.html"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "sharehub/en/share-62.html on disk"
              ],
              "scope": "english",
              "status": "resolved"
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
          "readpack sharehub/no-paper/no-challenge/research/isolated; pack.txt 2297 lines read fully"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (Claude Docs doc by founder), paper file no -> normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed: sharehub latest id 61, key set type,id,title,caption,author,source,hashtags,keywords,url,pillar; template sharehub/share-61.html; PILLARS read live"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type sharehub (founder chose ShareHub)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number share-62 (max 61 +1, no gap)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text from founder Claude Docs doc (rev 9), extracted byte-exact from docx export"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: \u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a; no rewrites"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: one image in the doc (JPEG 2576x1438) with alt text; no audio/video"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached; step 4.10 skipped"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 2 RESEARCH: \u0645\u0646\u0627\u0628\u0639 block with 10 PubMed ids (9 DOIs); one DES record per source"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc, not a Challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent line in sharehub precedent (title-only link); M2 sent at intake, founder approved 3/3 questions verbatim; written at C.5.6"
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
        "reason": "LiteCast branch only; category sharehub",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step",
        "status": "skipped"
      },
      {
        "evidence": [
          "template sharehub/share-61.html (previous sharehub page); git diff --quiet clean"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "cloned share-61 -> share-62; meta/JSON-LD/dates/keywords/body swapped; body = founder text verbatim from docx export; figure share62-fig1.webp (doc image, alt from doc) after intro; presentation: 5 section numbers on author h2, 2 dc-key frames, 1 dc-box-bottom \u00ab\u0646\u062a\u06cc\u062c\u0647\u00bb on final paragraph; presentation_lint clean; author_original lead"
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
          "pillar implantology (clear fit: implant treatment planning around remaining teeth); subtopic surgical-planning \u00ab\u062c\u0631\u0627\u062d\u06cc\u060c \u062c\u0627\u06cc\u06af\u0630\u0627\u0631\u06cc \u0648 \u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646\u00bb (closest: treatment-planning decision; competitor fundamentals rejected)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with 2 capsules: /glossary/ and /pillar/implantology/"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/index.html hand-maintained: one row added on top, sibling label style (\u0645\u0637\u0644\u0628\u06cc \u0627\u0632 \u062f\u06a9\u062a\u0631 \u0641\u0648\u0627\u062f \u0634\u0647\u0627\u0628\u06cc\u0627\u0646); diff 1 line"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "datePublished/dateModified 2026-11-27; no visible body date in template"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- sharehub/share-61.html: clean"
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
          "DES: 10 SOURCE calls, claude -p opus (modelUsage claude-opus-5-5), system prompt .dentcast/des-v3.7-knowledge.md sha256 709be964\u202694e2e9, ABSTRACT_ONLY from PubMed MCP (verbatim); scores 8E,25D,25D,55C,55C,25D,25D,55C,55C,28D; des_repair+guard+des-text ok (one interpretation_fa sentence in src6 corrected by agent). Fidelity POOLED: 10 sweeper calls opus + --merge; 24/24 MATCHES, score 100 HIGH, provisional; accepted+installed via packet"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.7: related_cap --glossary-room listed 48 terms with room; none semantically related (osseointegration, dental-implant, implant-loading are at cap/no room); 0 back-links"
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
          "4.8: applied 1 \u2014 \u00ab\u0627\u0633\u0626\u0648\u0627\u06cc\u0646\u062a\u06af\u0631\u06cc\u0634\u0646\u00bb -> /glossary/osseointegration.html (technical sense, first occurrence). Skipped borderline: \u00ab\u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0641\u0627\u0646\u06a9\u0634\u0646\u0627\u0644\u00bb -> implant-loading (loading protocol \u2260 functional loading); \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb -> dental-implant (generic); no brain page matches a body phrase strongly"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.9: 3 free slots filled: share-50 (keeping roots/proprioception), insight-24 (natural tooth beside implant), meta-17 (missing PDL in full implant rehab). Skipped: episode-163 food impaction (borderline), share-43, episode-151..153 (keep vs extract general, cap reached). related_cap 5/5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.11: 5 DefinedTerms authored (#flashcards-c1..c5), source authored, in plus/faq-corpus.json; no near-copy of FAQ answers"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.12: FAQPage 6 questions, all yes/no with verdict-first answers (\u062e\u06cc\u0631/\u0628\u0644\u0647), no deixis; 6 binary for quiz bank. 4.12-\u0628: written at 5.6"
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
          "5.0 questions: \u00ab\u06cc\u06a9\u06cc \u062f\u0648 \u062f\u0646\u062f\u0627\u0646 \u0628\u0627\u0642\u06cc\u200c\u0645\u0648\u0646\u062f\u0647 \u062a\u0648 \u0641\u06a9 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u06cc \u0631\u0648 \u0646\u06af\u0647 \u062f\u0627\u0631\u0645 \u06cc\u0627 \u0628\u06a9\u0634\u0645\u061f\u00bb\u060c \u00abproprioception \u062f\u0646\u062f\u0627\u0646 \u0637\u0628\u06cc\u0639\u06cc \u062f\u0631 \u0628\u0631\u0627\u0628\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb\u060c \u00abosseoperception \u0686\u06cc\u0647\u061f\u00bb\u060c \u00ab\u0686\u0631\u0627 \u06a9\u0627\u0646\u062a\u06a9\u062a \u06a9\u0646\u0627\u0631 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0628\u0627\u0632 \u0645\u06cc\u0634\u0647\u061f\u00bb. Reused 8 canonical tags, minted 0 (osseoperception kept in keywords: no second resolving page). Resolving sentences: \u062d\u0641\u0638_\u062f\u0646\u062f\u0627\u0646/\u067e\u0631\u0648\u06af\u0646\u0648\u0632_\u062f\u0646\u062f\u0627\u0646/\u067e\u0644\u0646\u06cc\u0646\u06af_\u0627\u06cc\u0645\u067e\u0644\u0646\u062a -> final paragraph + 3-factor list; \u067e\u0631\u0648\u067e\u0631\u06cc\u0648\u0633\u067e\u0634\u0646 -> \u00ab\u062d\u0633 \u067e\u0631\u0648\u067e\u0631\u06cc\u0648\u0633\u067e\u062a\u06cc\u0648 \u06cc\u06a9 \u0627\u0645\u062a\u06cc\u0627\u0632 \u0648\u0627\u0642\u0639\u06cc \u0627\u0633\u062a\u2026\u00bb; PDL -> \u00ab\u0646\u0642\u0634 \u0627\u0635\u0644\u06cc \u0627\u06cc\u0646 \u06af\u06cc\u0631\u0646\u062f\u0647\u200c\u0647\u0627 \u2026 \u062a\u0646\u0638\u06cc\u0645 \u062f\u0642\u06cc\u0642 \u0646\u06cc\u0631\u0648\u00bb; \u06a9\u0627\u0646\u062a\u06a9\u062a_\u0628\u0627\u0632 -> \u00ab\u06f4\u06f1 \u062f\u0631\u0635\u062f \u2026 \u0645\u0632\u06cc\u0627\u0644\u00bb; \u0627\u06cc\u0646\u0641\u0631\u0627\u0627\u06a9\u0644\u0648\u0698\u0646 -> \u00ab\u0627\u062e\u062a\u0644\u0627\u0641 \u0627\u0631\u062a\u0641\u0627\u0639\u00bb. --reach REACHABLE (#\u067e\u0631\u0648\u067e\u0631\u06cc\u0648\u0633\u067e\u0634\u0646 4/4, #\u0627\u06cc\u0646\u0641\u0631\u0627\u0627\u06a9\u0644\u0648\u0698\u0646 2/2); --sync, --check OK; build_cabinet_papers --check OK"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry sharehub id 62 appended at array end; key set/order equal to share-61; pillar implantology/surgical-planning; diff 36 lines"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar implantology in PILLARS, subtopic surgical-planning exists; capsule /pillar/implantology/ matches"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "5.6: placed (STRONG) in treatment-planning after episodes/episode-150-2 and implant-prosthetic after insight/insight-26; not placed (ASK/borderline): fixed-pros, failure-troubleshooting, implant-surgical, removable-pros, esthetic, ceramics. coverage 1.53/item (baseline 1.38). 4.12-\u0628: 3 founder-approved MCQs written (r-b346d3b0, r-67f31405, r-75ebb0a6); validate_exam_questions 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundles: bundle-implant-parts \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2: \u0639\u0646\u0648\u0627\u0646 \u06cc\u06a9 \u0645\u0648\u0642\u0639\u06cc\u062a \u062e\u0627\u0635 \u0627\u0633\u062a\u060c \u0646\u0647 \u0645\u0641\u0647\u0648\u0645 \u067e\u0627\u06cc\u0647)\u061b bundle-implant-impression \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2\u060c \u0647\u0645\u0627\u0646 \u062f\u0644\u06cc\u0644)"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.6: Pulse line, English mirror and the ten-scope lock (built by close)"
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
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-62.html",
      "sharehub/index.html",
      "sharehub/share-62.html",
      "sharehub/share62-fig1.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, index.html, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json, sharehub/en/share-62.html, sharehub/index.html, sharehub/share-62.html, sharehub/share62-fig1.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
