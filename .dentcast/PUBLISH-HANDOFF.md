# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "litecast/lite-CAST42"
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
    "category": "litecast",
    "content_id": "litecast/lite-CAST42",
    "context": {
      "approvals": [
        {
          "decision": "\u062f\u0631\u0631\u0641\u062a\u06af\u06cc \u0641\u06a9\u060c \u0642\u0641\u0644 \u0634\u062f\u0646 \u0641\u06a9 \u0648 \u0635\u062f\u0627\u06cc \u062a\u0642 \u062a\u0642 \u0641\u06a9 \u0686\u0647 \u0641\u0631\u0642\u06cc \u062f\u0627\u0631\u0646\u062f\u061f",
          "evidence": [
            "founder message \u00ab\u0647\u0645\u0647 \u0686\u06cc\u0632 \u062a\u0627\u06cc\u06cc\u062f \u062a\u0627 \u0627\u0646\u062a\u0647\u0627\u0634 \u0628\u0631\u0648\u00bb answering the eight numbered intake questions"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0641\u06a9 \u0634\u0645\u0627 \u0635\u062f\u0627 \u0645\u06cc\u200c\u062f\u0647\u062f\u060c \u0642\u0641\u0644 \u0645\u06cc\u200c\u0634\u0648\u062f \u06cc\u0627 \u0628\u0633\u062a\u0647 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f\u061f \u0627\u06cc\u0646\u200c\u0647\u0627 \u0633\u0647 \u0645\u0634\u06a9\u0644 \u062c\u062f\u0627 \u0647\u0633\u062a\u0646\u062f. \u0628\u0628\u06cc\u0646\u06cc\u062f \u0647\u0631 \u06a9\u062f\u0627\u0645 \u0686\u0647 \u0639\u0644\u0627\u0645\u062a\u06cc \u062f\u0627\u0631\u062f \u0648 \u0686\u0631\u0627 \u062c\u0627 \u0627\u0646\u062f\u0627\u062e\u062a\u0646 \u0641\u06a9 \u0628\u0627 \u0636\u0631\u0628\u0647 \u06a9\u0627\u0631 \u062f\u0631\u0633\u062a\u06cc \u0646\u06cc\u0633\u062a.",
          "evidence": [
            "founder message \u00ab\u0647\u0645\u0647 \u0686\u06cc\u0632 \u062a\u0627\u06cc\u06cc\u062f \u062a\u0627 \u0627\u0646\u062a\u0647\u0627\u0634 \u0628\u0631\u0648\u00bb answering the eight numbered intake questions"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "Question 3.5: no genuine AI tells found; original \u0645\u062a\u0646 used unchanged",
          "evidence": [
            "agent read of full artifact text; announced to founder in intake message"
          ],
          "scope": "de-ai-pass",
          "status": "not_required"
        },
        {
          "decision": "#\u0645\u0641\u0635\u0644_\u0641\u06a9\u06cc #\u062f\u0631\u062f_\u0641\u06a9\u06cc #\u0633\u0644\u0627\u0645\u062a_\u062f\u0647\u0627\u0646 #\u0622\u06af\u0627\u0647\u06cc_\u062f\u0631\u0645\u0627\u0646\u06cc reused; #\u062f\u0631\u0631\u0641\u062a\u06af\u06cc_\u0641\u06a9 minted",
          "evidence": [
            "founder message \u00ab\u0647\u0645\u0647 \u0686\u06cc\u0632 \u062a\u0627\u06cc\u06cc\u062f \u062a\u0627 \u0627\u0646\u062a\u0647\u0627\u0634 \u0628\u0631\u0648\u00bb answering the eight numbered intake questions"
          ],
          "scope": "hashtags",
          "status": "confirmed"
        },
        {
          "decision": "fa+en list as proposed in intake item 4",
          "evidence": [
            "founder message \u00ab\u0647\u0645\u0647 \u0686\u06cc\u0632 \u062a\u0627\u06cc\u06cc\u062f \u062a\u0627 \u0627\u0646\u062a\u0647\u0627\u0634 \u0628\u0631\u0648\u00bb answering the eight numbered intake questions"
          ],
          "scope": "keywords",
          "status": "confirmed"
        },
        {
          "decision": "insert drafted line \u00ab\u0644\u0627\u06cc\u062a\u200c\u06a9\u0633\u062a: \u00ab<title>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb at top of Pulse, drop bottom line",
          "evidence": [
            "founder message \u00ab\u0647\u0645\u0647 \u0686\u06cc\u0632 \u062a\u0627\u06cc\u06cc\u062f \u062a\u0627 \u0627\u0646\u062a\u0647\u0627\u0634 \u0628\u0631\u0648\u00bb answering the eight numbered intake questions"
          ],
          "scope": "pulse",
          "status": "confirmed"
        },
        {
          "decision": "both borderline candidates approved: litecast-11 and litecast-32; no in-body candidates",
          "evidence": [
            "founder message \u00ab\u0647\u0645\u0647 \u0686\u06cc\u0632 \u062a\u0627\u06cc\u06cc\u062f \u062a\u0627 \u0627\u0646\u062a\u0647\u0627\u0634 \u0628\u0631\u0648\u00bb answering the eight numbered intake questions"
          ],
          "scope": "related-links-0.6",
          "status": "confirmed"
        },
        {
          "decision": "filename litecast42-jaw-dislocation.webp; alt/figcaption verbatim; add image:image entries to .ir sitemap via gen_sitemap.py",
          "evidence": [
            "founder message \u00ab\u0647\u0645\u0647 \u0686\u06cc\u0632 \u062a\u0627\u06cc\u06cc\u062f \u062a\u0627 \u0627\u0646\u062a\u0647\u0627\u0634 \u0628\u0631\u0648\u00bb answering the eight numbered intake questions"
          ],
          "scope": "image-and-sitemap",
          "status": "confirmed"
        },
        {
          "decision": "table kept with scoped CSS; FAQ details -> h3+p; alert -> h2+list",
          "evidence": [
            "founder message \u00ab\u0647\u0645\u0647 \u0686\u06cc\u0632 \u062a\u0627\u06cc\u06cc\u062f \u062a\u0627 \u0627\u0646\u062a\u0647\u0627\u0634 \u0628\u0631\u0648\u00bb answering the eight numbered intake questions"
          ],
          "scope": "body-markup",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "evidence": [
            "body opens with the author's own <p> (Instagram jaw-cracking videos); no agent-authored lead needed"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "claude-artifact:33pRCRfXkr9pF2pUYX4ebs#first-paragraph"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "evidence": [
            "founder message \u00ab\u0647\u0645\u0647 \u0686\u06cc\u0632 \u062a\u0627\u06cc\u06cc\u062f \u062a\u0627 \u0627\u0646\u062a\u0647\u0627\u0634 \u0628\u0631\u0648\u00bb answering the eight numbered intake questions"
          ],
          "items": [
            "Q1-title",
            "Q2-caption",
            "Q3-hashtags",
            "Q4-keywords",
            "Q5-pulse",
            "Q6-related",
            "Q7-image",
            "Q8-body-markup"
          ],
          "kind": "intake_resolution_v1"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "kind": "author_text_and_image",
          "note": "founder-authored LiteCast text + illustration supplied via Claude artifact; private copy kept out of Git",
          "ref": "claude-artifact:33pRCRfXkr9pF2pUYX4ebs",
          "sha256_article_html": "2398eb7aa6f1d805884c48df3e8ce8b6b630bc3159f4fae1aaa59c669afa5da5",
          "sha256_image_webp": "5d0d0a2f58c0c7d5fc2c19a5ce8de63c020462a6f214e0b1980a139c02db3178"
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
          "Sources read in full this session: global/README.md, agent-parity.md, workflows/README.md, publish-checkpoints.md, publish-handoff-tool.md, modules 01+02, dentcast_global_rules.py --read (all core sections), routing-details.md; pinned readpack (category=litecast, paper=no, challenge=no, --after-intake) selected_bytes=148503 covering modules 03,04,05,07,08,10,11,12 verbatim; 06 and 09 omitted as route-inapplicable"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0 routing: text to publish = YES (founder-authored LiteCast article in Claude artifact 33pRCRfXkr9pF2pUYX4ebs); attached paper file = NO; route = normal publish Phases A-D, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Discover: litecast/lite-glossary.json read end-to-end (LightGlossary, 41 entries, last = litecast-41, shape type/id/title/caption/hashtags/keywords/page_url, no pillar field); structural template = litecast/lite-CAST41.html; LiteCast is outside dentcast-brain.json (19 legacy rows only) and outside PILLARS per module 03 step 0; branch already contains origin/main 5fdecc0"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Type locked = litecast, stated by the founder in the request (\u00ab\u0627\u0632 \u0646\u0648\u0639 \u0644\u0627\u06cc\u062a \u06a9\u0633\u062a\u00bb)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Sequence litecast-1..41 has no gap; next number litecast-42 auto-applied (Hard Rule 14) and announced; page litecast/lite-CAST42.html, content_id litecast/lite-CAST42"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Full text received from the artifact (article.html extracted, sha256 2398eb7aa6f1d805884c48df3e8ce8b6b630bc3159f4fae1aaa59c669afa5da5); private copy kept in scratchpad, not in Git"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "De-AI pass performed on the full \u0645\u062a\u0646 by reading: natural register, varied rhythm, no stock AI clich\u00e9s or filler; result announced to founder as \u00ab\u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a\u00bb; text of record = original unchanged"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Media: one illustration supplied in the artifact (WebP 900x1497, sha256 5d0d0a2f58c0c7d5fc2c19a5ce8de63c020462a6f214e0b1980a139c02db3178) with founder alt and figcaption text; no audio/video field in the LiteCast schema"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No research paper file attached; step 4.10 branch is a documented skip"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": "LiteCast is outside the DES ecosystem (Hard Rule 10, module 08); no DES basket is classified and C.4.13 will be recorded skipped \u2014 LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [
          "Ordinary post (\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc): founder presented it as a new LiteCast \u0645\u0637\u0644\u0628 with illustration and FAQ body, not an \u0622\u0632\u0645\u0648\u0646; auto-applied per Hard Rule 14 and announced for override"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse line approved by founder (LiteCast not customary; founder chose to insert): \u00ab\u0644\u0627\u06cc\u062a\u200c\u06a9\u0633\u062a: \u00ab\u062f\u0631\u0631\u0641\u062a\u06af\u06cc \u0641\u06a9\u060c \u0642\u0641\u0644 \u0634\u062f\u0646 \u0641\u06a9 \u0648 \u0635\u062f\u0627\u06cc \u062a\u0642 \u062a\u0642 \u0641\u06a9 \u0686\u0647 \u0641\u0631\u0642\u06cc \u062f\u0627\u0631\u0646\u062f\u061f\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb, title text hyperlinked to /litecast/lite-CAST42.html"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Locked category is LiteCast: Phase C step 0 branch ACTIVE; its rules override general steps 2.4/2.5/4.7/4.8/4.9 for this run"
        ],
        "id": "C.0",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Source of truth = litecast/lite-glossary.json (LightGlossary array, 41 entries; live shape type,id,title,caption,hashtags,keywords,page_url; no pillar). New entry litecast-42 will be appended there; nothing written to dentcast-brain.json"
        ],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Isolation: specialist capsules (2.5), glossary back-links (4.7), specialist in-body links (4.8) and brain-entry related links (4.9) will not be applied; \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb will carry LiteCast-internal links only (0.6)"
        ],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Internal structure derived from existing pages: lite-CAST41 uses plain <a href=\"/litecast/lite-CASTn.html\"> inline links in body and dc-related-section/dc-related-capsules/dc-related-capsule with /litecast/ hrefs in \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb; same mechanism will be reused, none invented"
        ],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Runs in LiteCast form: C.1/C.4 template hash vs lite-CAST41, C.2 clone, C.3 date audit, C.2.6 litecast/index.html listing, C.6 Pulse (founder approved insertion), C.0.5/C.0.6 internal links, C.7/C.8 builders via post-cut2 workflow; 2.4/5/5.5 replaced by lite-glossary.json write"
        ],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Template lock: litecast/lite-CAST41.html sha256 0619f3dce333b6bf94e87e09c26d7f97769b28f1ddd225be7a4783fb87569433 (26872 bytes); must be unchanged at C.4"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Built litecast/lite-CAST42.html (sha256 3b0c9813e0acab2863c114d60407bcab9d54185ffa0e12e1948544509aa3670e) as a byte-faithful clone of lite-CAST41 with CRLF preserved: founder text/FAQ/table/figure, title+description swapped, canonical/og:url on dentcast.ir, GA4 + both preconnects kept once, no hreflang, no trust seal, no dc-notify, image og/twitter/ImageObject/primaryImageOfPage per lite-CAST40, about=TMJ disorders; body opens with author paragraph before first list"
        ],
        "id": "C.2",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Step 0.5 in-body analysis: lite-glossary.json read end-to-end (41 entries); body of litecast-42 compared semantically against every entry; 0 qualifying in-body candidates (only passing mentions of wisdom-tooth extraction and referral to a dentist, neither is the concept of litecast-32/11); no link inserted; page hash unchanged by this step (3b0c9813e0acab2863c114d60407bcab9d54185ffa0e12e1948544509aa3670e)"
        ],
        "id": "C.0.5",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Step 0.6: \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb holds LiteCast-internal links only, 2 of cap 5, markup identical to template dc-related-section/capsules/capsule: /litecast/lite-CAST11.html \u00ab\u0645\u0639\u06cc\u0627\u0631 \u062f\u0631\u0633\u062a \u0627\u0646\u062a\u062e\u0627\u0628 \u062f\u06a9\u062a\u0631 \u0648 \u06a9\u0644\u06cc\u0646\u06cc\u06a9\u00bb and /litecast/lite-CAST32.html \u00ab\u06a9\u0634\u06cc\u062f\u0646 \u062f\u0646\u062f\u0627\u0646 \u0622\u0628\u0633\u0647\u200c\u062f\u0627\u0631\u00bb, both founder-approved borderline candidates; no specialist capsule, glossary or brain link; cloned template capsules (21,28,23) replaced; hash before = clone stage, after = 3b0c9813e0acab2863c114d60407bcab9d54185ffa0e12e1948544509aa3670e"
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
        "reason": "LiteCast lives outside the specialist pillar taxonomy (module 03 step 0.4); no pillar/subtopic assigned",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "LiteCast skips the specialist \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647/\u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc capsules (module 03 step 0.2); its \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb was filled by 0.6",
        "status": "skipped"
      },
      {
        "evidence": [
          "litecast/index.html is hand-maintained static HTML (no generator): one <li> added at the top, byte-identical markup to the lite-CAST41 row (CRLF kept), label = brain title; diff is exactly 1 inserted line; link to lite-CAST42.html appears once"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Date/meta audit table printed: 16 rows all OK (datePublished=dateModified=lastReviewed=2026-10-25, two visible time tags, title/og/twitter title and 3 descriptions identical to approved strings, canonical/og:url on dentcast.ir, no leftover lite-CAST41 or old title/caption, JSON-LD name/headline/breadcrumb swapped, hreflang absent); no STALE/DIVERGENT/MISSING rows"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Integrity: sha256 of template litecast/lite-CAST41.html recomputed = 0619f3dce333b6bf94e87e09c26d7f97769b28f1ddd225be7a4783fb87569433, identical to the C.1 hash; template untouched"
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
        "reason": "parent-episode link applies to NoteCast only; this is LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "episode/NoteCast shared evidence base applies to the episode-NoteCast pair only; this is LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "prev/next wiring applies to Promptologist only; this is LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": "LiteCast isolation (module 03 step 0.2): no glossary back-link from LiteCast; analysis reported as intentionally not run for specialist glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.7-b",
        "module": "05-semantic-linking.md",
        "reason": "glossary-term publishes only; this is LiteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": "LiteCast isolation (module 03 step 0.2): no inline links to specialist content; the LiteCast-internal in-body equivalent is step 0.5, executed with 0 candidates",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": "LiteCast isolation (module 03 step 0.2): no links out to brain entries; LiteCast-internal related links done in step 0.6",
        "status": "skipped"
      }
    ],
    "target_paths": [
      "litecast/index.html",
      "litecast/lite-CAST42.html",
      "litecast/lite-glossary.json",
      "litecast/litecast42-jaw-dislocation.webp"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: litecast/lite-CAST42.html, litecast/index.html, litecast/litecast42-jaw-dislocation.webp"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
