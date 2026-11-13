# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "episodes/episode-163"
- Status: in_progress
- Next canonical step: "C.5.6"
- Blocker: null

The structured record preserves semantic decisions, approvals, scientific results, step outcomes and external actions.
Git facts are reconstructed from Git and are not duplicated in this handoff.

<!-- dentcast-publish-state-v1 -->
```json
{
  "publication": {
    "blocker": null,
    "category": "dentcast",
    "content_id": "episodes/episode-163",
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
          "bundles": "bundle-crown-prep: \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2: \u0639\u0646\u0648\u0627\u0646 \u06cc\u06a9 \u0639\u0627\u0631\u0636\u0647/\u0645\u0634\u06a9\u0644 \u0627\u0633\u062a \u0646\u0647 \u0645\u0641\u0647\u0648\u0645 \u067e\u0627\u06cc\u0647\u200c\u0627\u06cc \u06a9\u0631\u0627\u0648\u0646 \u067e\u0631\u067e)",
          "content_id": "episodes/episode-163",
          "kind": "pathway_placement",
          "not_placed": "implant-prosthetic, esthetic, digital, occlusion, operative-cariology: tool STRONG only from the all-episodes series heuristic, conceptually borderline/third pathway",
          "placed": [
            {
              "after": "metanotes/meta-12",
              "pathway": "fixed-pros"
            },
            {
              "after": "insight/insight-45",
              "pathway": "treatment-planning"
            }
          ]
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "note": "attached paper, Drive id 1EoeXNztOTpln8lrVMSTjwyv1QunJI1rR",
          "ref": "drive:cabinet-root/ohpd-21-229.pdf (text extract)",
          "sha256": "1b9bf735631fd581117940f71df2d0e617c614332cdf11bea5f5561eb49f7447"
        }
      ],
      "pending_questions": [
        {
          "answered": false,
          "message": "M2",
          "question": "\u0633\u0624\u0627\u0644\u200c\u0647\u0627\u06cc \u0622\u0632\u0645\u0648\u0646 \u0645\u0633\u06cc\u0631 \u0628\u0631\u0627\u06cc episodes/episode-163 (\u0628\u0646\u06cc\u0627\u0646\u200c\u06af\u0630\u0627\u0631 \u06af\u0641\u062a\u0647 \u062e\u0648\u062f\u0634 \u0645\u06cc\u200c\u062f\u0647\u062f)",
          "step": "C.5.6"
        }
      ],
      "unrelated_changes": [],
      "validation": [
        {
          "audit": "Part 2d audit-apply exit 0, 6/6 domains agree, model claude-opus-5-5, record sha256 2044c3536d7dbb801d7d0957a0cc4663f8906c6389492009fcd656cae95d1df0",
          "command": "claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md --tools \"\" --model opus --no-session-persistence (empty dir)",
          "doi": "10.3290/j.ohpd.b4172837",
          "fidelity": "not owed: core audio episode (module 08 Part 2b); no fidelity key",
          "kind": "des_v3_7_episode_163",
          "lookup": "des_record_guard lookup: found 0 (new record)",
          "model_reported": "claude-opus-5-5",
          "part3": "quotes verbatim 4/4; arithmetic 22==22; band D ok; des_record_guard check ok; verify_publish --des-text ok; interpretation_fa 4 sentences checked against paper, all supported, no edit",
          "reproducibility": "not owed: ETIOLOGY already has 27 records",
          "result": "RESEARCH ETIOLOGY FULL_TEXT des_score 22 band D provisional false (S_design 100 x AMSTAR-2 0.3 = 30 - 8 COI penalty)",
          "source_text": "Drive PDF via tools/pdf_source_text.py (pdfplumber), FULL_TEXT 74037 chars",
          "system_prompt_sha256": "709be964f19c1d5c12fada54fe3827d112d729150368dcddc3108d343a94e2e9"
        }
      ]
    },
    "external_actions": [
      {
        "evidence": [
          "drive:1EoeXNztOTpln8lrVMSTjwyv1QunJI1rR title=Food Impaction in Dentistry: Revisited.pdf parentId=1lAs7fUNO8K_t_ylW9FNBKJ_zAbwgfflr (update_file response 2026-11-13T09:49:20Z, fileSize 427297)"
        ],
        "id": "C.4.10.1:drive-rename-move",
        "status": "completed",
        "target": "drive:1EoeXNztOTpln8lrVMSTjwyv1QunJI1rR -> title \u00abFood Impaction in Dentistry: Revisited.pdf\u00bb, parent Treatment plan (1lAs7fUNO8K_t_ylW9FNBKJ_zAbwgfflr)"
      }
    ],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "rules-loaded: README.md, global/README.md + dentcast_global_rules --read pages 1-3, agent-parity.md, publish-checkpoints.md, modules/01, modules/02 (full); audio-hub section for episode paths"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase0: text=yes (founder caption for episode page) + paper=yes (Drive ohpd-21-229.pdf) => normal publish + step 4.10 parts 1-3. Capability precheck: git ls-remote OK; push to non-main branch expected OK; Actions/PR/merge via GitHub MCP; Drive via Google Drive MCP; audio host blocked by egress proxy (duration from founder)"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 610 entries; latest same-category entry type=dentcast episode 162 (index 488) keys type,episode,title,caption,hashtags,keywords,audio_url,page_url,pillar; PILLARS read live in C.2.4"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type locked: dentcast (audio episode, founder: \u0627\u067e\u06cc\u0632\u0648\u062f \u062c\u062f\u06cc\u062f \u0635\u0648\u062a\u06cc)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number 163 (max dentcast episode 162); founder audio file dentcast163"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text = founder caption (chat message 2026-11-13); title per founder answer = paper title \u00abFood Impaction in Dentistry: Revisited\u00bb (founder: English title = paper title, Persian may be the same)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: text of record is the founder caption, which Hard Rule 16 forbids editing; no rewrites applied. \u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "audio_url founder-supplied https://episodes.s3.ir-central1.arvanstorage.ir/dentcast163%20.mp3?versionId= (host confirmed by founder in chat); duration 25:11 founder-supplied; probe blocked by egress proxy; no image field for episodes"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "paper attached: Drive file ohpd-21-229.pdf in cabinet root folder (id 1EoeXNztOTpln8lrVMSTjwyv1QunJI1rR) -> step 4.10 active"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES basket 2: RESEARCH, paper attached, DOI 10.3290/j.ohpd.b4172837 printed in PDF; founder: use this paper for DES"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (not a challenge)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: no founder sentence; agent drafts in episode pattern at C.6 (standing acceptance)"
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
        "reason": "not LiteCast: category dentcast (Hard Rule 10 branch inactive)",
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
          "template = episodes/episode-162.html (latest dentcast episode page, en mirror episodes/en/episode-162.html); must stay byte-unchanged (C.4)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "episodes/episode-163.html cloned from episode-162.html (CRLF kept): title/h1/og/twitter/JSON-LD name = paper title; caption = founder text verbatim (ep-caption paragraphs joined <br><br>, meta/og/twitter/JSON-LD description = paragraphs joined by a space); audio src/download/contentUrl = founder URL; duration 25:11 / PT25M11S; dates 2026-11-13; canonical/hreflang .org path swap only; GA4 + 2 preconnect survived clone; dc-notify marker removed (Phase E adds it); no enamad; chips = existing canonical tags via hashtag_ref --simulate (no mint); \u0645\u0646\u0627\u0628\u0639 = attached paper with DOI; lead: founder caption opens the body (author_original)"
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
          "live PILLARS read; pillar.primary=treatment-planning, subtopic=comprehensive-diagnosis: the review central claim is to identify the cause of food impaction (contact loss, occlusal disharmony, morphology, position, papilla loss) before choosing among restorative/occlusal/ortho/perio treatment = diagnosis-driven planning. Competing: fixed-pros/crowns-onlays (episode-121-1 contact management) - rejected because restorations are only one of five aetiology/treatment branches (standing acceptance)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Episode branch: \u0645\u062d\u062a\u0648\u0627\u06cc \u0645\u0631\u062a\u0628\u0637 ep-section holds <a href=\"/pillar/treatment-planning/\" class=\"ep-related-link\">\u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc</a> (sibling register of episode-162); budget 1/5 used"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "episodes landing /episodes.html is generated by tools/build_episodes.py from dentcast.json + brain (runner C.8); dentcast.json entry appended at C.5"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates: JSON-LD datePublished=dateModified=2026-11-13; visible meta Fri, 13 Nov 2026 10:00:00 GMT (dentcast.json published format); no other date fields - all OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- episodes/episode-162.html: clean (template unchanged)"
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
        "reason": "NoteCast only; category dentcast",
        "status": "skipped"
      },
      {
        "evidence": [
          "core episode publish: no notecast/episode-163 page and no DES record for either side; step 4.13 runs once on episodes/episode-163, nothing to mirror"
        ],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "episode series ep-nav: new page previous slot -> /episodes/episode-162.html (cloned register \u00ab\u2190 \u0627\u067e\u06cc\u0632\u0648\u062f 162\u00bb), next stays placeholder; episodes/episode-162.html next slot span -> <a href=\"/episodes/episode-163.html\" class=\"ep-nav-btn\">\u0642\u0633\u0645\u062a \u0628\u0639\u062f\u06cc &#8594;</a> (same as 161->162); git diff shows only that slot. en mirrors left as precedent (en/161, en/162 keep Next placeholder)"
        ],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder file ohpd-21-229.pdf found in cabinet root (only new PDF, first page = Food Impaction in Dentistry: Revisited, OHPD 2023); renamed to real title and moved (no copy) into existing subfolder \u00abTreatment plan\u00bb (closest semantic match: aetiology-driven choice among restorative/occlusal/ortho/perio treatment; competing Periodontitis/crown contour recorded); drive_id 1EoeXNztOTpln8lrVMSTjwyv1QunJI1rR; receipt C.4.10.1:drive-rename-move"
        ],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "catalog P2957 appended (key set == P2956 template): topic/topic_path \u00abTreatment plan\u00bb, type narrative review, doi 10.3290/j.ohpd.b4172837, journal Oral Health & Preventive Dentistry, 2023, abstract + authors from PubMed PMID 37345582, drive_id 1EoeXNztOTpln8lrVMSTjwyv1QunJI1rR + view/download links, linked_episodes [episodes/episode-163], tags food-impaction(new),proximal-contact,interproximal-contact-loss,interdental-papilla,occlusal-adjustment,periodontitis,tooth-migration,crown-contour,treatment-planning,narrative-review,topic:treatment-plan,food-impaction-dentistry-revisited; tag_index +1 per tag, total_papers 2166->2167 (queue_apply convention); count 2167 < 2200 so \u00ab\u0628\u06cc\u0634 \u0627\u0632 \u06f2\u06f1\u06f0\u06f0 \u0645\u0642\u0627\u0644\u0647\u00bb unchanged; reachability bridge deferred to step 5.0"
        ],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DOI 10.3290/j.ohpd.b4172837 and first author Van Mai Truong from the PDF, cross-checked with PubMed 37345582 (title/journal/year match). Credit follows the episode type latest precedent (episode-161/162): \u00ab\u0645\u0646\u0627\u0628\u0639\u00bb ep-refs list with the full citation (Truong VM, Kim S, Yi YJ, Park YS ... 2023;21:229-242) and a doi.org anchor, plus the library note; no duplicate .author block added"
        ],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/des-scores.json episodes/episode-163 = {scored_at 2026-11-13, sources:[RESEARCH 22/D ETIOLOGY FULL_TEXT]}; no fidelity (core audio episode); Part 3 1-7 green; Part 2d audit agree; no M3b (no fidelity units)"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "fresh semantic review of all 109 glossary terms: 0 applied. Borderline, skipped: treatment-plan (episode applies diagnosis-before-treatment to one problem, not about treatment planning as a concept), emergence-profile (restoration morphology only named in passing). No term covers food impaction, proximal contact, papilla or plunger cusp"
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
        "reason": "4.7-\u0628: skipped \u2014 not a glossary publish",
        "status": "skipped"
      },
      {
        "evidence": [
          "analyzed ep-caption body (4 sentences) against glossary + all brain pages: 0 qualifying candidates applied. Borderline skipped: \u00ab\u0628\u0627\u0632 \u0634\u062f\u0646 \u06a9\u0627\u0646\u062a\u06a9\u062a\u00bb -> episode-159 / insight-69 (both implant or crown-delivery specific, caption is about natural-tooth aetiology in general); \u00ab\u0627\u06a9\u0644\u0648\u0698\u0646\u00bb, \u00ab\u067e\u0627\u067e\u06cc\u0644\u0627\u00bb have no glossary page; no sibling part referenced"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u062d\u062a\u0648\u0627\u06cc \u0645\u0631\u062a\u0628\u0637: 1 nav + 4 added (related_cap 5/5 at_cap): episode-159 (interproximal contact loss -> food impaction mechanism), insight-73 (crown replaced for food-impaction inflammation), insight-69 (open proximal contact at crown delivery), meta-12 (contact management between 6 and 7). Skipped for cap/duplication: episode-121-1 (implant contacts, overlaps 159), insight-29, episode-37 (laminate contact opening, unrelated indication)"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent[episodes/episode-163].definedTermSets: 3 DefinedTerms #flashcards-c1..c3, all source faq (sourceFaqIndex 0,1,2), descriptions rewritten as standalone concept statements (not near-copies); build_flashcards_index.mjs dry run picks the page (outputs reverted, runner builds)"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage #faq 3 questions, no deixis, grounded in the caption body; 2 binary (q0, q2, both \u00ab\u062e\u06cc\u0631\u061b\u00bb verdict-first) enter the scored bank per build_quiz_index.mjs dry run; q1 (list of causes) open, flashcard/reference only. 4.12-\u0628: evaluated at 5.6"
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
        "reason": "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc: not a \u0686\u0627\u0644\u0634 (Question 4.9)",
        "status": "skipped"
      },
      {
        "evidence": [
          "Questions: \u00ab\u0686\u0631\u0627 \u063a\u0630\u0627 \u0628\u06cc\u0646 \u062f\u0646\u062f\u0648\u0646\u0627 \u06af\u06cc\u0631 \u0645\u06cc\u200c\u06a9\u0646\u0647 \u0628\u0627 \u0627\u06cc\u0646\u06a9\u0647 \u06a9\u0627\u0646\u062a\u06a9\u062a \u0628\u0633\u062a\u0647\u200c\u0633\u062a\u061f\u00bb \u00abfood impaction \u0639\u0644\u062a\u0634 \u0686\u06cc\u0647\u061f\u00bb \u00ab\u062f\u0631\u0645\u0627\u0646 \u06af\u06cc\u0631 \u063a\u0630\u0627\u06cc\u06cc \u0628\u06cc\u0646 \u06f6 \u0648 \u06f7 \u0686\u06cc\u0647\u061f\u00bb \u00ab\u06af\u06cc\u0631 \u063a\u0630\u0627\u06cc\u06cc \u0628\u0639\u062f \u0627\u0632 \u0631\u0648\u06a9\u0634: \u06a9\u0627\u0646\u062a\u06a9\u062a \u0628\u0627\u0632 \u06cc\u0627 \u0627\u06a9\u0644\u0648\u0698\u0646\u061f\u00bb. Final canonical list (all reused, 0 minted): #\u062f\u0646\u062a\u06a9\u0633\u062a (series), #\u06af\u06cc\u0631_\u063a\u0630\u0627\u06cc\u06cc (specific 7->8 pages; \u00ab\u06af\u06cc\u0631 \u063a\u0630\u0627\u06cc\u06cc \u0647\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0639\u0646\u06cc \u0628\u0627\u0632 \u0628\u0648\u062f\u0646 \u06a9\u0627\u0646\u062a\u06a9\u062a \u0646\u06cc\u0633\u062a\u00bb), #\u062a\u0634\u062e\u06cc\u0635_\u0627\u0641\u062a\u0631\u0627\u0642\u06cc (decision; \u00ab\u0628\u0631\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u062f\u0631\u0633\u062a\u060c \u0627\u0648\u0644 \u0628\u0627\u06cc\u062f \u0639\u0644\u062a \u0648\u0627\u0642\u0639\u06cc \u0627\u0648\u0646 \u0631\u0648 \u067e\u06cc\u062f\u0627 \u06a9\u0646\u06cc\u0645\u00bb), #\u06a9\u0627\u0646\u062a\u06a9\u062a_\u0628\u0627\u0632 (\u00ab\u0627\u0632 \u0628\u0627\u0632 \u0634\u062f\u0646 \u06a9\u0627\u0646\u062a\u06a9\u062a \u0648 \u062d\u0631\u06a9\u062a \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627\u00bb), #\u06a9\u0627\u0646\u062a\u06a9\u062a_\u067e\u0631\u0648\u06af\u0632\u06cc\u0645\u0627\u0644 (\u00ab\u062d\u062a\u06cc \u0648\u0642\u062a\u06cc \u06a9\u0627\u0646\u062a\u06a9\u062a \u0628\u0633\u062a\u0647 \u0627\u0633\u062a\u00bb), #\u06a9\u0627\u0646\u062a\u0648\u0631_\u062a\u0631\u0645\u06cc\u0645 (\u00ab\u0645\u0648\u0631\u0641\u0648\u0644\u0648\u0698\u06cc \u062a\u0631\u0645\u06cc\u0645\u200c\u0647\u0627\u00bb), #\u067e\u0627\u067e\u06cc\u0644\u0627 (\u00ab\u0648\u0636\u0639\u06cc\u062a \u067e\u0627\u067e\u06cc\u0644\u0627\u00bb), #\u0627\u06a9\u0644\u0648\u0698\u0646 umbrella (\u00ab\u0646\u0642\u0634 \u0627\u06a9\u0644\u0648\u0698\u0646\u00bb). Dropped #\u067e\u0631\u06cc\u0648\u062f\u0646\u062a\u0627\u0644 (mention only). --sync done, build_plus_index run then content-index/assistant-tags reverted (runner builds), --check OK. Reachability: page shares #\u06af\u06cc\u0631_\u063a\u0630\u0627\u06cc\u06cc+#\u06a9\u0627\u0646\u062a\u06a9\u062a_\u0628\u0627\u0632+#\u06a9\u0627\u0646\u062a\u06a9\u062a_\u067e\u0631\u0648\u06af\u0632\u06cc\u0645\u0627\u0644 so rankIds co-membership puts it first in the \u06af\u06cc\u0631 \u063a\u0630\u0627\u06cc\u06cc chip. Paper P2957 bridge: existing rows reach it, byTag rank 0 under \u06af\u06cc\u0631 \u063a\u0630\u0627\u06cc\u06cc, \u06a9\u0627\u0646\u062a\u06a9\u062a \u0628\u0627\u0632, \u06a9\u0627\u0646\u062a\u06a9\u062a \u067e\u0631\u0648\u06af\u0632\u06cc\u0645\u0627\u0644, \u06a9\u0627\u0646\u062a\u0648\u0631 \u062a\u0631\u0645\u06cc\u0645, \u067e\u0627\u067e\u06cc\u0644\u0627; rank 5 under \u062a\u0634\u062e\u06cc\u0635 \u0627\u0641\u062a\u0631\u0627\u0642\u06cc; no (a)/(b)/(c) edit; plus/cabinet-papers.json rebuilt"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry appended as last element, key set/order == episode 162 dentcast entry; caption = founder text verbatim (paragraph breaks kept as \\n\\n); audio_url founder URL; pillar treatment-planning/comprehensive-diagnosis. dentcast.json episode 163 appended (title \u00ab163- Food Impaction in Dentistry: Revisited\u00bb, duration 25:11, published Fri, 13 Nov 2026 10:00:00 GMT, description = caption paragraphs + Acast footer as 162). Page chips = canonical list. Keywords: Food Impaction, Vertical & Horizontal Impaction, Proximal Contact Loss, Plunger Cusp, \u06af\u06cc\u0631 \u063a\u0630\u0627\u06cc\u06cc \u0628\u0627 \u06a9\u0627\u0646\u062a\u06a9\u062a \u0628\u0633\u062a\u0647"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain pillar == step 2.4 decision (treatment-planning / comprehensive-diagnosis, existing subtopic); \u0645\u062d\u062a\u0648\u0627\u06cc \u0645\u0631\u062a\u0628\u0637 pillar link /pillar/treatment-planning/ matches"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "started"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast.json",
      "dentcast_cabinet_full_catalog.json",
      "episodes/en/episode-162.html",
      "episodes/en/episode-163.html",
      "episodes/episode-162.html",
      "episodes/episode-163.html",
      "index.html",
      "plus/cabinet-papers.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: episodes/episode-163.html, episodes/en/episode-163.html, dentcast-brain.json, dentcast.json, dentcast-hashtag-reference.json, index.html, plus/cabinet-papers.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
