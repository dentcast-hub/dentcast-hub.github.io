# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "litecast/lite-CAST44"
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
    "category": "litecast",
    "content_id": "litecast/lite-CAST44",
    "context": {
      "approvals": [
        {
          "decision": "\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062e\u0627\u0646\u06af\u06cc \u0686\u06cc\u0633\u062a\u061f \u062d\u0642\u06cc\u0642\u062a \u00ab\u067e\u0631\u0648\u062a\u0632 \u062c\u0627\u062f\u0648\u06cc\u06cc\u00bb \u0648 \u062f\u0646\u062f\u0627\u0646 \u0645\u0648\u0642\u062a \u0628\u0627 \u0622\u0628 \u062c\u0648\u0634",
          "evidence": [
            "chat: founder approved this text and its title/meta description, then \u00ab\u0628\u0631\u0648 \u0645\u0646\u062a\u0634\u0631\u0634 \u06a9\u0646 \u062a\u0648 \u0644\u0627\u06cc\u062a\u200c\u06a9\u0633\u062a\u00bb; restored after dependency_invalidation_v1 (tool-defect recovery), text unchanged"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062e\u0627\u0646\u06af\u06cc \u06cc\u0627 \u067e\u0631\u0648\u062a\u0632 \u062c\u0627\u062f\u0648\u06cc\u06cc \u062f\u0646\u062f\u0627\u0646 \u0631\u0627 \u062f\u0631 \u0622\u0628 \u062c\u0648\u0634 \u0646\u0631\u0645 \u0645\u06cc\u200c\u06a9\u0646\u0646\u062f \u0648 \u062c\u0627\u06cc \u062e\u0627\u0644\u06cc \u062f\u0646\u062f\u0627\u0646 \u0645\u06cc\u200c\u06af\u0630\u0627\u0631\u0646\u062f\u061b \u0627\u0645\u0627 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0646\u06cc\u0633\u062a. \u0628\u0628\u06cc\u0646\u06cc\u062f \u0686\u0631\u0627 \u062f\u0648\u0627\u0645 \u0646\u062f\u0627\u0631\u062f \u0648 \u0686\u0647 \u0636\u0631\u0631\u0647\u0627\u06cc\u06cc \u062f\u0627\u0631\u062f.",
          "evidence": [
            "chat: founder approved this text and its title/meta description, then \u00ab\u0628\u0631\u0648 \u0645\u0646\u062a\u0634\u0631\u0634 \u06a9\u0646 \u062a\u0648 \u0644\u0627\u06cc\u062a\u200c\u06a9\u0633\u062a\u00bb; restored after dependency_invalidation_v1 (tool-defect recovery), text unchanged"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "opening paragraphs of the founder-approved text (agent-drafted in chat)",
          "evidence": [
            "chat: founder approved this text and its title/meta description, then \u00ab\u0628\u0631\u0648 \u0645\u0646\u062a\u0634\u0631\u0634 \u06a9\u0646 \u062a\u0648 \u0644\u0627\u06cc\u062a\u200c\u06a9\u0633\u062a\u00bb; restored after dependency_invalidation_v1 (tool-defect recovery), text unchanged"
          ],
          "scope": "authored-intro",
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
            "lead \u00ab\u0627\u06cc\u0646 \u0631\u0648\u0632\u0647\u0627 \u062f\u0631 \u0627\u06cc\u0646\u0633\u062a\u0627\u06af\u0631\u0627\u0645 \u0648 \u0641\u0631\u0648\u0634\u06af\u0627\u0647\u200c\u0647\u0627\u06cc \u0627\u06cc\u0646\u062a\u0631\u0646\u062a\u06cc\u060c \u0645\u062d\u0635\u0648\u0644\u06cc \u0628\u0627 \u0627\u0633\u0645\u200c\u0647\u0627\u06cc\u06cc \u0645\u062b\u0644 ...\u00bb is the first paragraph of the approved text"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "agent_authored",
          "source_ref": "chat: agent-drafted patient text, revised twice on founder feedback, founder asked to publish it"
        },
        {
          "english": {
            "evidence": [
              "LiteCast Hard Rule 10/12: .ir-only, no hreflang, no mirror"
            ],
            "path": null,
            "status": "exempt"
          },
          "evidence": [
            "all judgment work closed before Push 2; no founder messages pending (no M1/M3b/M2)"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "LiteCast: C.4.13 canonical skip (Hard Rule 10)"
              ],
              "scope": "scientific",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "Q4.9 ordinary post; C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "LiteCast: no pillar/subtopic (C.2.4 skipped)"
              ],
              "scope": "taxonomy",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "C.0.5 3 inline LiteCast links; C.0.6 4 related capsules; specialist link steps skipped by isolation"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 canonical list reused, --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5: litecast-44 appended to litecast/lite-glossary.json"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "LiteCast outside plus/pathways.json (C.5.6 skip)"
              ],
              "scope": "pathways",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "LiteCast convention: no Pulse line (B.5 documented skip)"
              ],
              "scope": "pulse",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "LiteCast .ir-only \u2014 no en mirror (Hard Rule 12 exception)"
              ],
              "scope": "english",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "title + caption + authored-intro confirmed from founder approval"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            }
          ]
        },
        {
          "from_step": "rules",
          "kind": "dependency_invalidation_v1",
          "reason": "post-cut2 run 45004839509 refused delivery 3 with POST_CUT2_OUT_OF_SCOPE_CHANGE:tools/reel/example-insight-116.html \u2014 tool defect on main (inject_img_attrs.py rewrote the reel example page added by #1257); fixed on main by PR #1258 (tools/reel removed, video-reel.md tool-free); merging origin/main into the Push-2 commit; workflow rule file changed -> invalidate from rules",
          "superseded": {
            "approvals": [
              {
                "decision": "\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062e\u0627\u0646\u06af\u06cc \u0686\u06cc\u0633\u062a\u061f \u062d\u0642\u06cc\u0642\u062a \u00ab\u067e\u0631\u0648\u062a\u0632 \u062c\u0627\u062f\u0648\u06cc\u06cc\u00bb \u0648 \u062f\u0646\u062f\u0627\u0646 \u0645\u0648\u0642\u062a \u0628\u0627 \u0622\u0628 \u062c\u0648\u0634",
                "evidence": [
                  "chat: founder approved this text and its title/meta description, then \u00ab\u0628\u0631\u0648 \u0645\u0646\u062a\u0634\u0631\u0634 \u06a9\u0646 \u062a\u0648 \u0644\u0627\u06cc\u062a\u200c\u06a9\u0633\u062a\u00bb"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062e\u0627\u0646\u06af\u06cc \u06cc\u0627 \u067e\u0631\u0648\u062a\u0632 \u062c\u0627\u062f\u0648\u06cc\u06cc \u062f\u0646\u062f\u0627\u0646 \u0631\u0627 \u062f\u0631 \u0622\u0628 \u062c\u0648\u0634 \u0646\u0631\u0645 \u0645\u06cc\u200c\u06a9\u0646\u0646\u062f \u0648 \u062c\u0627\u06cc \u062e\u0627\u0644\u06cc \u062f\u0646\u062f\u0627\u0646 \u0645\u06cc\u200c\u06af\u0630\u0627\u0631\u0646\u062f\u061b \u0627\u0645\u0627 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0646\u06cc\u0633\u062a. \u0628\u0628\u06cc\u0646\u06cc\u062f \u0686\u0631\u0627 \u062f\u0648\u0627\u0645 \u0646\u062f\u0627\u0631\u062f \u0648 \u0686\u0647 \u0636\u0631\u0631\u0647\u0627\u06cc\u06cc \u062f\u0627\u0631\u062f.",
                "evidence": [
                  "chat: founder approved this text and its title/meta description, then \u00ab\u0628\u0631\u0648 \u0645\u0646\u062a\u0634\u0631\u0634 \u06a9\u0646 \u062a\u0648 \u0644\u0627\u06cc\u062a\u200c\u06a9\u0633\u062a\u00bb"
                ],
                "scope": "caption",
                "status": "confirmed"
              },
              {
                "decision": "opening paragraphs of the founder-approved text (agent-drafted in chat)",
                "evidence": [
                  "standing acceptance (Hard Rule 14) + founder approval of the full text in chat"
                ],
                "scope": "authored-intro",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [
              {
                "note": "founder-approved LiteCast text (agent-drafted, founder: \u00ab\u0628\u0631\u0648 \u0645\u0646\u062a\u0634\u0631\u0634 \u06a9\u0646 \u062a\u0648 \u0644\u0627\u06cc\u062a\u200c\u06a9\u0633\u062a\u00bb)",
                "ref": "chat:founder-approved-litecast-text",
                "sha256": "79c6ce85a6330236ac975cccaba62113c4bb6953f842a7b1ddc0ddee31c960b0"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "read README, global router + all 5 core sections (dentcast_global_rules --read pages 1-3), agent-parity, publish-checkpoints, modules 01/02 complete"
                ],
                "id": "rules",
                "module": "01-hard-rules.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Phase 0: text to publish = yes (founder-approved LiteCast text in chat); paper file = no -> normal publish, no paper branch"
                ],
                "id": "0",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Discover: LiteCast source of truth litecast/lite-glossary.json parsed (LightGlossary, 43 entries, latest litecast-43 keys type,id,title,caption,hashtags,keywords,page_url); template litecast/lite-CAST43.html; landing litecast/index.html hand-maintained static list; PILLARS not used (LiteCast exception)"
                ],
                "id": "A",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q1 type: LiteCast \u2014 founder: \u00ab\u0628\u0631\u0648 \u0645\u0646\u062a\u0634\u0631\u0634 \u06a9\u0646 \u062a\u0648 \u0644\u0627\u06cc\u062a\u200c\u06a9\u0633\u062a\u00bb"
                ],
                "id": "B.1",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q2 number: max existing litecast-43 -> litecast-44, page litecast/lite-CAST44.html"
                ],
                "id": "B.2",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q3 text: founder-approved text in chat, bound by digest in context.inputs"
                ],
                "id": "B.3",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q3.5 de-AI pass: scanned; no genuine AI tells (no formulaic openers/closers, clich\u00e9s, hedge stacking); \u00ab\u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a\u00bb \u2014 text unchanged"
                ],
                "id": "B.3.5",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q4 media: LiteCast entries carry no media field; founder supplied no image -> image-less page on the lite-CAST41 precedent (og:image = site cover /dentcast-cover.webp at its real 1600x1066, no hero, no primaryImageOfPage); reported to founder"
                ],
                "id": "B.4",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q4.7: no paper file attached -> step 4.10 branch inactive"
                ],
                "id": "B.4.7",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q4.8: not asked \u2014 LiteCast is a canonical skip of module 08 (Hard Rule 10)"
                ],
                "id": "B.4.8",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q4.9: \u00ab\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc\u00bb \u2014 founder asked for a LiteCast article, not a question post"
                ],
                "id": "B.4.9",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q5 Pulse: LiteCast follows its own convention \u2014 no LiteCast line exists in the index.html Pulse precedent and verify_publish does not check Pulse for LiteCast -> documented skip (conservative default, Hard Rule 14), reported in Push-2 report"
                ],
                "id": "B.5",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "LiteCast branch ACTIVE (locked category litecast): steps 0.1-0.6 run; specialist steps 2.4/2.5 capsules/4.7/4.8/4.9/5/5.5 replaced or skipped"
                ],
                "id": "C.0",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "source of truth litecast/lite-glossary.json (LightGlossary); latest entry litecast-43 = schema; new entry litecast-44 appended with identical keys at C.5 (0.1 replaces step 5); no brain entry"
                ],
                "id": "C.0.1",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "isolation confirmed: no specialist capsules, no glossary/brain links; only LiteCast-to-LiteCast links (0.5/0.6)"
                ],
                "id": "C.0.2",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "clone structure of lite-CAST43 incl. its LiteCast inline-link markup (<a href=\"/litecast/lite-CASTN.html\">) and dc-related-capsule section"
                ],
                "id": "C.0.3",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "what runs: C.1/C.4 template lock vs lite-CAST43, C.2 clone, C.3 dates, C.5.0 hashtags vs library, Pulse in LiteCast convention (skip, B.5), 0.5/0.6; C.2.4 skipped"
                ],
                "id": "C.0.4",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "template = litecast/lite-CAST43.html (previous same-category page), enrolled in target_paths; must stay byte-unchanged"
                ],
                "id": "C.1",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "cloned lite-CAST43 structure; replaced title/description/OG/Twitter/canonical/JSON-LD values, body = text of record; domain dentcast.ir kept, no hreflang, GA4 + 2 preconnect present from clone, no trustseal; image-less (og:image site cover 1600x1066, hero + primaryImageOfPage removed per lite-CAST41 precedent); body opens with <p> before first <ul>; no chip row (LiteCast pages carry none)"
                ],
                "id": "C.2",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "applied (strong): \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062f\u0646\u062f\u0627\u0646\u00bb -> lite-CAST12 (\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0686\u06cc\u0633\u062a\u061f; sentence defines an implant); \u00ab\u062f\u0646\u062f\u0627\u0646 \u0645\u0635\u0646\u0648\u0639\u06cc \u0645\u062a\u062d\u0631\u06a9\u00bb -> lite-CAST5 (removable vs fixed choice); \u00ab\u0641\u06cc\u0644\u06cc\u067e\u0631 \u062f\u0646\u062f\u0627\u0646 \u0686\u06cc\u0633\u062a\u061f\u00bb -> lite-CAST43 (same title). skipped (borderline/first-occurrence): \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0641\u0648\u0631\u06cc\u00bb -> lite-CAST15/38 (first occurrence is the ad name in the intro, not the explained concept); \u00ab\u062c\u0627\u06cc \u062e\u0627\u0644\u06cc \u062f\u0646\u062f\u0627\u0646\u00bb -> lite-CAST3 (tangential). Same markup as template; none inside headings or other links"
                ],
                "id": "C.0.5",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "\u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb = 4 LiteCast links (cap 5): lite-CAST43 \u0641\u06cc\u0644\u06cc\u067e\u0631 (cheap temporary stand-in for implant), lite-CAST37 \u062f\u0646\u062f\u0627\u0646 \u0645\u0635\u0646\u0648\u0639\u06cc \u0698\u0644\u0647\u200c\u0627\u06cc (same patient question: cheap removable fake tooth), lite-CAST5 \u0645\u062a\u062d\u0631\u06a9 \u06cc\u0627 \u062b\u0627\u0628\u062a (the real options), lite-CAST12 \u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u0686\u06cc\u0633\u062a\u061f (what a real implant is). skipped borderline: lite-CAST3 (missing tooth consequences), lite-CAST15/38 (clinical immediate implant). Section holds only LiteCast links"
                ],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "LiteCast exception \u2014 step 2.4 skipped entirely (module 04; module 03 step 0.4)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "LiteCast row of the 2.5 table: no specialist capsules; the \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb section is filled by 0.6 (4 LiteCast links)"
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "litecast/index.html is hand-maintained static HTML (no builder marker): added one <li> for lite-CAST44 at the top (newest first), sibling markup copied exactly, only href + label swapped; git diff shows 1 inserted line"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "date audit: before (template) 2026-10-31 everywhere -> after 2026-11-22 (today): JSON-LD datePublished/dateModified/lastReviewed OK, trustline <time> publish + review OK, CSS comment line 194 unaffected; no other date fields (LiteCast template has no og/article date meta)"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "git diff --quiet -- litecast/lite-CAST43.html: clean (template byte-unchanged)"
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
                "reason": "NoteCast only \u2014 locked category is litecast",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "NoteCast/episode pair only \u2014 locked category is litecast",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "numbered series with ep-nav only \u2014 LiteCast pages have no ep-nav block",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": "no paper file attached (Q4.7)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": "no paper file attached (Q4.7)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": "no paper file attached (Q4.7)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": "skipped \u2014 LiteCast (Hard Rule 10; module 08)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.7",
                "module": "05-semantic-linking.md",
                "reason": "LiteCast isolation \u2014 step 4.7 skipped (module 03 step 0.2)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.7-b",
                "module": "05-semantic-linking.md",
                "reason": "LiteCast isolation \u2014 no glossary publish, scoped cross-link not applicable (module 03 step 0.2)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": "LiteCast \u2014 replaced by step 0.5 (module 03 step 0.2)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": "LiteCast \u2014 replaced by step 0.6 (module 03 step 0.2)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.11",
                "module": "07-flashcards-and-quiz.md",
                "reason": "LiteCast \u2014 outside the flashcard ecosystem (module 07)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.12",
                "module": "07-flashcards-and-quiz.md",
                "reason": "LiteCast \u2014 sole category exception of the quiz step (module 07)",
                "status": "skipped"
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
                  "final canonical list, all REUSED, no mint: #\u062c\u0627\u06cc\u06af\u0632\u06cc\u0646\u06cc_\u062f\u0646\u062f\u0627\u0646 (decision tag, 10 pages; resolving: \u00ab\u0628\u0631\u0627\u06cc \u062c\u0627\u06cc \u062e\u0627\u0644\u06cc \u062f\u0646\u062f\u0627\u0646\u060c \u0686\u0646\u062f \u062f\u0631\u0645\u0627\u0646 \u0648\u0627\u0642\u0639\u06cc \u0647\u0633\u062a \u06a9\u0647 \u062f\u0646\u062f\u0627\u0646\u067e\u0632\u0634\u06a9 ... \u0627\u0646\u062a\u062e\u0627\u0628 \u0645\u06cc\u200c\u06a9\u0646\u062f\u00bb), #\u0627\u06cc\u0645\u067e\u0644\u0646\u062a (umbrella; \u00ab\u067e\u0633 \u0627\u0633\u0645 \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u00bb \u0631\u0648\u06cc \u0627\u06cc\u0646 \u0645\u062d\u0635\u0648\u0644 \u062f\u0631\u0633\u062a \u0646\u06cc\u0633\u062a\u00bb), #\u0627\u06cc\u0645\u0646\u06cc_\u0628\u06cc\u0645\u0627\u0631 (specific, 2 pages; \u00ab\u0686\u0648\u0646 \u0645\u062d\u06a9\u0645 \u0646\u06cc\u0633\u062a\u060c \u0645\u0645\u06a9\u0646 \u0627\u0633\u062a ... \u06a9\u0646\u062f\u0647 \u0634\u0648\u062f \u0648 \u0622\u0646 \u0631\u0627 \u0642\u0648\u0631\u062a \u0628\u062f\u0647\u06cc\u062f\u00bb), #\u0622\u06af\u0627\u0647\u06cc_\u062f\u0631\u0645\u0627\u0646\u06cc (LiteCast series tag). dropped as mention-only: #\u0633\u0644\u0627\u0645\u062a_\u062f\u0647\u0627\u0646 (use_when = oral/general-health link), #\u067e\u0631\u0648\u062a\u0632_\u0645\u062a\u062d\u0631\u06a9 (named only as an alternative). Singletons (\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062e\u0627\u0646\u06af\u06cc, \u067e\u0631\u0648\u062a\u0632 \u062c\u0627\u062f\u0648\u06cc\u06cc \u062f\u0646\u062f\u0627\u0646, Temporary Teeth) -> keywords. Patient questions: \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a \u062e\u0627\u0646\u06af\u06cc \u0686\u06cc\u0647\u061f\u00bb, \u00ab\u067e\u0631\u0648\u062a\u0632 \u062c\u0627\u062f\u0648\u06cc\u06cc \u062f\u0646\u062f\u0627\u0646 \u062e\u0648\u0628\u0647\u061f\u00bb, \u00ab\u062f\u0646\u062f\u0627\u0646 \u0645\u0648\u0642\u062a \u0628\u0627 \u0622\u0628 \u062c\u0648\u0634 \u0636\u0631\u0631 \u062f\u0627\u0631\u0647\u061f\u00bb. hashtag_ref --sync ran (reference unchanged), build_plus_index ran then outputs reverted, --check OK. Reachability test N/A: LiteCast is not indexed in plus/content-index (verify_publish 8 plus-index skip)"
                ],
                "id": "C.5.0",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "step 0.1 replaces step 5: litecast-44 appended as last element of LightGlossary with exactly the keys/order of litecast-43 (type,id,title,caption,hashtags,keywords,page_url); json.tool OK; no dentcast-brain.json entry"
                ],
                "id": "C.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.5.5",
                "module": "10-brain-and-pathways.md",
                "reason": "LiteCast \u2014 no pillar field in the LiteCast schema; step 5.5 replaced by 0.1 (module 03 step 0.4)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.5.6",
                "module": "10-brain-and-pathways.md",
                "reason": "LiteCast \u2014 patient-facing, outside plus/pathways.json (module 10 5.6 documented skip); no exam questions (M2)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.5.6-b",
                "module": "10-brain-and-pathways.md",
                "reason": "LiteCast \u2014 bundle gate 1 fails mechanically (folder litecast/ is not episodes/notecast/sharehub/dentai): no candidate",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Pulse: LiteCast convention \u2014 no Pulse line (documented skip, B.5); index.html untouched. Editorial lock second_cut_editorial_lock_v1 recorded (10 scopes), English exempt (LiteCast). No pending founder questions."
                ],
                "id": "C.6",
                "module": "11-build-and-version.md",
                "reason": null,
                "status": "completed"
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
          "note": "founder-approved LiteCast text (agent-drafted, founder: \u00ab\u0628\u0631\u0648 \u0645\u0646\u062a\u0634\u0631\u0634 \u06a9\u0646 \u062a\u0648 \u0644\u0627\u06cc\u062a\u200c\u06a9\u0633\u062a\u00bb)",
          "ref": "chat:founder-approved-litecast-text",
          "sha256": "79c6ce85a6330236ac975cccaba62113c4bb6953f842a7b1ddc0ddee31c960b0"
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
          "re-verified: the only changed rule file is .dentcast/workflows/video-reel.md (reel route, read completely; it does not govern publication); README, global sections, agent-parity, publish-checkpoints, modules 01/02 unchanged in this revision and read earlier this session"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: text yes, paper no -> normal publish"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: litecast/lite-glossary.json parsed, litecast-44 is the tail entry with litecast-43 key set; template lite-CAST43.html"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: type LiteCast (founder: \u00ab\u0628\u0631\u0648 \u0645\u0646\u062a\u0634\u0631\u0634 \u06a9\u0646 \u062a\u0648 \u0644\u0627\u06cc\u062a\u200c\u06a9\u0633\u062a\u00bb)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: litecast-44 / litecast/lite-CAST44.html"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: text of record unchanged (input digest bound)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: no AI tells; text unchanged"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: no image supplied; image-less page on lite-CAST41 precedent"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: no paper"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: LiteCast canonical skip of module 08"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: ordinary post"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: LiteCast Pulse convention = documented skip"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: LiteCast branch active"
        ],
        "id": "C.0",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: litecast-44 in LightGlossary, identical keys/order to litecast-43, no brain entry"
        ],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: no specialist links on the page"
        ],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: structure of lite-CAST43 cloned"
        ],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: LiteCast run/skip set unchanged"
        ],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: template litecast/lite-CAST43.html"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: page unchanged since Push 2 (dentcast.ir canonical, no hreflang, GA4 + preconnect, no trustseal, <p> before first list)"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: 3 inline LiteCast links (lite-CAST12, lite-CAST5, lite-CAST43); skips as recorded before"
        ],
        "id": "C.0.5",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb 4 LiteCast capsules (43, 37, 5, 12)"
        ],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "LiteCast exception \u2014 step 2.4 skipped entirely (module 04; module 03 step 0.4)",
        "status": "skipped"
      },
      {
        "evidence": [
          "re-verified: LiteCast row \u2014 section filled by 0.6"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: litecast/index.html row for lite-CAST44 at top"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: all page dates 2026-11-22 (JSON-LD + trustline); CSS comment keeps template date"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: git diff --quiet -- litecast/lite-CAST43.html clean"
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
        "reason": "NoteCast only \u2014 locked category is litecast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast/episode pair only \u2014 locked category is litecast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "numbered series with ep-nav only \u2014 LiteCast pages have no ep-nav block",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper file attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": "skipped \u2014 LiteCast (Hard Rule 10; module 08)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": "LiteCast isolation \u2014 step 4.7 skipped (module 03 step 0.2)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.7-b",
        "module": "05-semantic-linking.md",
        "reason": "LiteCast isolation \u2014 no glossary publish (module 03 step 0.2)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": "LiteCast \u2014 replaced by step 0.5 (module 03 step 0.2)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": "LiteCast \u2014 replaced by step 0.6 (module 03 step 0.2)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": "LiteCast \u2014 outside the flashcard ecosystem (module 07)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": "LiteCast \u2014 sole category exception of the quiz step (module 07)",
        "status": "skipped"
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
          "re-verified: hashtags #\u062c\u0627\u06cc\u06af\u0632\u06cc\u0646\u06cc_\u062f\u0646\u062f\u0627\u0646 #\u0627\u06cc\u0645\u067e\u0644\u0646\u062a #\u0627\u06cc\u0645\u0646\u06cc_\u0628\u06cc\u0645\u0627\u0631 #\u0622\u06af\u0627\u0647\u06cc_\u062f\u0631\u0645\u0627\u0646\u06cc, all canonical reuse, no mint; hashtag_ref --check OK"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "re-verified: litecast-44 is the last LightGlossary element; json.tool OK"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": "LiteCast \u2014 no pillar field; replaced by 0.1 (module 03 step 0.4)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": "LiteCast \u2014 outside plus/pathways.json (module 10 5.6 documented skip)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": "LiteCast \u2014 bundle gate 1 fails mechanically (folder litecast/)",
        "status": "skipped"
      },
      {
        "evidence": [
          "re-verified: no Pulse line (LiteCast convention); editorial lock with 10 scopes still valid (no content change), English exempt; approvals title/caption/authored-intro confirmed; no pending questions"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/workflows/video-reel.md",
      "dentcast-hashtag-reference.json",
      "litecast/index.html",
      "litecast/lite-CAST43.html",
      "litecast/lite-CAST44.html",
      "litecast/lite-glossary.json",
      "tools/reel/audio_prep.py",
      "tools/reel/example-insight-116.html",
      "tools/reel/render.js"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: litecast/lite-CAST44.html, litecast/lite-glossary.json, litecast/index.html, .dentcast/workflows/video-reel.md"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
