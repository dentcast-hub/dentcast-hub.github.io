# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "dentcast-plus/video-15"
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
    "content_id": "dentcast-plus/video-15",
    "context": {
      "approvals": [
        {
          "decision": "\u0631\u0627\u0628\u0631\u062f\u0645 \u0639\u0645\u0631 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0631\u0627 \u0628\u06cc\u0634\u062a\u0631 \u0645\u06cc\u200c\u06a9\u0646\u062f\u061f",
          "evidence": [
            "founder data: first line of the founder's caption (chat 2026-11-18), per video-14 precedent; copied codepoint for codepoint"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0631\u0627\u0628\u0631\u062f\u0645 \u0639\u0645\u0631 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0631\u0627 \u0628\u06cc\u0634\u062a\u0631 \u0645\u06cc\u200c\u06a9\u0646\u062f\u061f\n\n\u0645\u0631\u0648\u0631 \u06a9\u0627\u06a9\u0631\u06cc\u0646 \u06f2\u06f0\u06f2\u06f1 \u0628\u0631\u0627\u06cc \u0644\u0645\u06cc\u0646\u06cc\u062a \u062d\u062a\u06cc \u06cc\u06a9 \u06a9\u0627\u0631\u0622\u0632\u0645\u0627\u06cc\u06cc \u0648\u0627\u062c\u062f \u0634\u0631\u0627\u06cc\u0637 \u067e\u06cc\u062f\u0627 \u0646\u06a9\u0631\u062f. \u0648\u0644\u06cc \u062f\u0631 \u0645\u0637\u0627\u0644\u0639\u0627\u062a \u0628\u0644\u0646\u062f\u0645\u062f\u062a\u060c \u0634\u06a9\u0633\u062a\u200c\u0647\u0627 \u0631\u0648\u06cc \u062f\u0646\u062a\u06cc\u0646 \u0628\u0648\u062f: \u0645\u0627\u0631\u0698\u06cc\u0646 \u0631\u0648\u06cc \u062f\u0646\u062a\u06cc\u0646 \u0631\u06cc\u0633\u06a9 \u0634\u06a9\u0633\u062a \u0631\u0627 \u062d\u062f\u0648\u062f \u06f1\u06f0 \u0628\u0631\u0627\u0628\u0631 \u06a9\u0631\u062f \u0648 \u062a\u0631\u0627\u0634 \u06a9\u0627\u0645\u0644\u0627\u064b \u062f\u0631 \u0627\u0646\u0627\u0645\u0644 \u0628\u0647 \u0628\u0642\u0627\u06cc \u06f9\u06f9\u066a \u0631\u0633\u06cc\u062f.\n\n\u0633\u0631\u0646\u0648\u0634\u062a \u0644\u0645\u06cc\u0646\u06cc\u062a \u0631\u0627 \u0633\u0637\u062d \u0632\u06cc\u0631 \u0628\u0627\u0646\u062f \u062a\u0639\u06cc\u06cc\u0646 \u0645\u06cc\u200c\u06a9\u0646\u062f\u060c \u0646\u0647 \u0631\u0648\u0634 \u0627\u06cc\u0632\u0648\u0644\u0627\u0633\u06cc\u0648\u0646.",
          "evidence": [
            "founder data: caption text supplied in chat 2026-11-18 (digest e4b10fb2\u2026)"
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
            "dentcast-plus/video-15.html .text-box"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder caption: the page body is the founder's caption verbatim, opening with its own first paragraph; no agent lead (body has no list)"
        },
        {
          "english": {
            "evidence": [
              "file on disk; noindex, follow; 0 hreflang; GA x1; toggle ../video-15.html"
            ],
            "path": "dentcast-plus/en/video-15.html",
            "status": "ready"
          },
          "evidence": [
            "agent Push-2 report"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13 skipped: founder \u00ab\u0628\u062f\u0648\u0646 DES\u00bb; .dentcast/des-exemptions.json entry dentcast-plus/video-15"
              ],
              "scope": "scientific",
              "status": "not_applicable"
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
                "C.2.4 esthetic/veneers-laminates"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 0 (cap), C.4.8 2 glossary anchors, C.4.9 3 capsules"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 7 canonical tags, no mint, --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5 brain entry video 15 at array end"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6 esthetic + biomimetic; 2 exam rows status review per founder M2"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "Q5: no existing Pulse line announces dentcast_plus -> documented skip"
              ],
              "scope": "pulse",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "dentcast-plus/en/video-15.html authored from video-14 en precedent; toggles inverse"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title/caption founder data confirmed; M2 answered; Q4.8 \u00ab\u0628\u062f\u0648\u0646 DES\u00bb"
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
          "note": "founder caption text (title = its first line)",
          "ref": "founder-chat:caption",
          "sha256": "e4b10fb245db9ac2f1658cab0fb6b37e20b80a685bf974f5f1b539a6586bf3d5"
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
          "read: README.md, global/README + 7 selected sections, agent-parity.md, publish-checkpoints.md, modules 01/02 complete"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase0: text yes (founder caption), paper file no -> normal publish, no paper branch; capability precheck: ls-remote ok, push to ccr branch, GitHub MCP for Actions/PR"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed (622 entries); category dentcast_plus latest=video 14 (idx 558) keys type,video,title,caption,hashtags,keywords,page_url,pillar; PILLARS read live"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type dentcast_plus (founder: video; brain type of /dentcast-plus/ pages)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "max video=14 -> video 15, content_id dentcast-plus/video-15"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder caption received (bound by digest e4b10fb2\u2026); title = its first line verbatim, per video-14 precedent"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "scanned: no AI tells; text is founder caption (title+caption never touched, Hard Rule 16) -> unchanged"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "video: ArvanVOD Dw7M98mn6J (player config, m3u8, mpd, thumbnail) + YouTube shorts ySLpWmNWgR0 supplied by founder"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached -> 4.10 branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 3 (cites Cochrane 2021 + long-term studies without identifier); founder chose \u00ab\u0628\u062f\u0648\u0646 DES\u00bb via question; candidates offered: 10.1002/14651858.CD009858.pub3, 10.11607/prd.1488"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (video caption, not a question post)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: no existing Pulse line announces dentcast_plus -> documented skip (conservative default, Q5)"
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
          "template = dentcast-plus/video-14.html (previous same-category page), must stay byte-unchanged"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "clone of video-14: title/meta/OG/Twitter/JSON-LD/breadcrumb/h1/body from founder caption, Arvan Dw7M98mn6J + YouTube ySLpWmNWgR0; GA x1, preconnect x2, no trustseal; domain .org kept; no chip row in template; body opens with <p>, no list"
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
          "pillar esthetic / subtopic veneers-laminates (subject: laminate veneer survival vs isolation/substrate); competitor bonding (substrate) rejected: the clinical decision is about veneers"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dc-related-section with \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + /pillar/esthetic/ capsules (2/5)"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-plus/index.html hand-maintained: video-15 card added first, sibling markup (CRLF preserved)"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "date audit: uploadDate 2026-10-17T10:02:05+00:00->2026-11-18 (date-only, Arvan host unreachable so no invented time); datePublished/dateModified 2026-10-17->2026-11-18 OK; no visible body date in template"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- dentcast-plus/video-14.html: clean"
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
        "evidence": [],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": "skipped \u2014 \u06a9\u0627\u0631\u0628\u0631 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0631\u062f \u0628\u062f\u0648\u0646 DES \u0645\u0646\u062a\u0634\u0631 \u0634\u0648\u062f (Q4.8 basket 3); page-bound des-exemptions entry written at C.6",
        "status": "skipped"
      },
      {
        "evidence": [
          "4.7: candidates rubber-dam, isolation (strong) -> both at cap 5/5 (related_cap.py), 0 added; bonding-protocol/bond-strength borderline (page is about substrate, not protocol) -> skipped"
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
          "4.8 applied: \u00ab\u0631\u0627\u0628\u0631\u062f\u0645\u00bb -> /glossary/rubber-dam.html (first occurrence, technical sense); \u00ab\u0627\u06cc\u0632\u0648\u0644\u0627\u0633\u06cc\u0648\u0646\u00bb -> /glossary/isolation.html; skipped borderline: \u00ab\u0628\u0627\u0646\u062f\u00bb (bonding-protocol: substrate, not protocol), \u00ab\u0645\u0627\u0631\u0698\u06cc\u0646\u00bb (subgingival-margin: different concept)"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.9: 2 capsules + 3 free -> added share-22 (rubber dam for veneer cementation), dentai-30 (veneer bond to enamel/dentin/composite), share-8 (veneer preparation principles); skipped borderline: share-27, meta-21, insight-36; now 5/5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.11 (dentcast_plus optional, run since the caption carries clinical content): 3 authored DefinedTerms #flashcards-c1..c3 in plus/faq-corpus.json; FAQ pairs not compressed verbatim; none comparison-shaped skipped"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.12: FAQPage #faq with 4 standalone yes/no questions, each answer opens with \u0628\u0644\u0647/\u062e\u06cc\u0631 (2 \u0628\u0644\u0647, 2 \u062e\u06cc\u0631); no deixis; 4.12-\u0628 evaluated at 5.6"
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
          "questions: \u00ab\u0631\u0627\u0628\u0631\u062f\u0645 \u0648\u0627\u0633\u0647 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0644\u0627\u0632\u0645\u0647\u061f\u00bb, \u00ab\u0686\u0631\u0627 \u0644\u0645\u06cc\u0646\u06cc\u062a \u0631\u0648\u06cc \u062f\u0646\u062a\u06cc\u0646 \u0634\u06a9\u0633\u062a \u0645\u06cc\u200c\u062e\u0648\u0631\u0647\u061f\u00bb, \u00ab\u0628\u0642\u0627\u06cc \u0644\u0645\u06cc\u0646\u06cc\u062a \u0628\u0627 \u062a\u0631\u0627\u0634 \u062a\u0648 \u0627\u0646\u0627\u0645\u0644 \u0686\u0642\u062f\u0631\u0647\u061f\u00bb; reused all (no mint): #\u0648\u06cc\u062f\u06cc\u0648(brand) #\u0631\u0627\u0628\u0631\u062f\u0645 #\u0644\u0645\u06cc\u0646\u06cc\u062a_\u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc(umbrella) #\u0628\u0642\u0627\u06cc_\u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646(decision) #\u0628\u0627\u0646\u062f_\u0628\u0647_\u062f\u0646\u062a\u06cc\u0646(specific,2) #\u062d\u0641\u0638_\u0645\u06cc\u0646\u0627(specific,5) #\u0627\u06cc\u0632\u0648\u0644\u0627\u0633\u06cc\u0648\u0646; resolving sentences from caption; --sync ok, --check OK, build_cabinet_papers --check OK; reachability: \u0631\u0627\u0628\u0631\u062f\u0645 chip rank 4/4, \u0628\u0627\u0646\u062f \u0628\u0647 \u062f\u0646\u062a\u06cc\u0646 2/2, \u0628\u0642\u0627\u06cc \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 3/3"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry video 15 appended as last array element via json_append; key set/order identical to video 14 (type,video,title,caption,hashtags,keywords,page_url,pillar)"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar esthetic/veneers-laminates = C.2.4 decision; capsule /pillar/esthetic/ matches; no new subtopic"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathway_place STRONG: esthetic(130), biomimetic(119), fixed-pros(108), ceramics(91); placed esthetic + biomimetic after sharehub/share-22; fixed-pros & ceramics not placed (third-pathway cap, agent never places a third) \u2014 reported; ASK candidates post-and-core, treatment-planning not placed; coverage 1.52/item (baseline 1.38). 4.12-\u0628: 2 MCQ drafted, --draft-check 0 errors; M2: founder \u00ab\u0633\u0648\u0627\u0644 \u0646\u0645\u06cc\u200c\u062e\u0648\u0627\u062f\u00bb, then chose \u00ab\u062f\u0631 \u0645\u0633\u06cc\u0631 \u0628\u0645\u0627\u0646\u062f\u060c \u0633\u0624\u0627\u0644 review\u00bb -> 2 rows written with status review + review_note (never drawn); validate_exam_questions 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "candidates bundle-laminate, bundle-bonding, bundle-biomimetic: all \u00ab\u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1)\u00bb \u2014 folder dentcast-plus/ is never a bundle type"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: documented skip (no dentcast_plus precedent line); des-exemptions page-bound entry (page_sha256 ff37bc52\u2026); en mirror + toggles on disk; ten-scope lock recorded"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/des-exemptions.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast-plus/en/video-14.html",
      "dentcast-plus/en/video-15.html",
      "dentcast-plus/index.html",
      "dentcast-plus/video-14.html",
      "dentcast-plus/video-15.html",
      "index.html",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-plus/video-15.html, dentcast-plus/en/video-15.html, dentcast-plus/index.html, dentcast-brain.json, dentcast-hashtag-reference.json, plus/faq-corpus.json, plus/pathways.json, plus/exam-questions.json, .dentcast/des-exemptions.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
