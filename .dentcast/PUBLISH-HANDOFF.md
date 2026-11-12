# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-53"
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
    "category": "chairside",
    "content_id": "chairside/chairside-53",
    "context": {
      "approvals": [
        {
          "decision": "\u0686\u0631\u0627 \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0642\u0628\u0644\u0627\u064b \u0628\u0647 \u0647\u0645 \u0686\u0633\u0628\u06cc\u062f\u0647 \u0628\u0648\u062f\u0646\u062f\u060c \u0641\u0627\u0635\u0644\u0647 \u0627\u06cc\u062c\u0627\u062f \u0645\u06cc\u200c\u0634\u0648\u062f\u061f",
          "evidence": [
            "Founder supplied exact article title"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0628\u06cc\u0645\u0627\u0631 \u0645\u06cc\u200c\u06af\u0641\u062a \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0642\u062f\u06cc\u0645\u06cc\u200c\u0627\u0634 \u0642\u0628\u0644\u0627\u064b \u0641\u0627\u0635\u0644\u0647\u200c\u0627\u06cc \u0646\u0628\u0648\u062f\u0647 \u0627\u0633\u062a. \u0627\u06cc\u0646 \u0648\u06cc\u0632\u06cc\u062a \u0627\u0632 \u0645\u0634\u0627\u0647\u062f\u0647\u0654 \u0641\u0627\u0635\u0644\u0647\u0654 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0648 \u067e\u0631\u0633\u0634\u06cc \u062f\u0631\u0628\u0627\u0631\u0647\u0654 \u062a\u063a\u06cc\u06cc\u0631 \u062a\u062f\u0631\u06cc\u062c\u06cc \u0622\u0646 \u0634\u0631\u0648\u0639 \u0634\u062f.",
          "evidence": [
            "Standing acceptance Hard Rule 14, same supported caption"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "Public use of supplied clinical image permitted",
          "evidence": [
            "Founder explicitly confirmed public image permission in current conversation"
          ],
          "scope": "patient-image",
          "status": "confirmed"
        },
        {
          "decision": "{\"id\": \"r-a01be85f\", \"kind\": \"mcq\", \"prompt_fa\": \"\u067e\u06cc\u0634 \u0627\u0632 \u0628\u0633\u062a\u0646 \u0641\u0627\u0635\u0644\u0647\u200c\u0627\u06cc \u06a9\u0647 \u0628\u0647\u200c\u062a\u062f\u0631\u06cc\u062c \u0628\u06cc\u0646 \u062f\u0648 \u0645\u062c\u0645\u0648\u0639\u0647 \u0631\u0648\u06a9\u0634 \u0642\u062f\u0627\u0645\u06cc \u0627\u0633\u067e\u0644\u06cc\u0646\u062a\u200c\u0634\u062f\u0647 \u0627\u06cc\u062c\u0627\u062f \u0634\u062f\u0647\u060c \u06a9\u062f\u0627\u0645 \u0631\u0648\u06cc\u06a9\u0631\u062f \u0645\u0646\u0627\u0633\u0628\u200c\u062a\u0631 \u0627\u0633\u062a\u061f\", \"options\": [\"\u0628\u0631\u0631\u0633\u06cc \u067e\u0631\u06cc\u0648\u062f\u0646\u062a\u0627\u0644\u060c \u0633\u0627\u067e\u0648\u0631\u062a \u0627\u0633\u062a\u062e\u0648\u0627\u0646\u06cc\u060c \u0627\u06a9\u0644\u0648\u0698\u0646\", \"\u062a\u0639\u0648\u06cc\u0636 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0642\u062f\u0627\u0645\u06cc\u060c \u0628\u062f\u0648\u0646 \u0627\u0631\u0632\u06cc\u0627\u0628\u06cc \u0628\u0627\u0641\u062a\u200c\u0647\u0627\u06cc \u0646\u06af\u0647\u062f\u0627\u0631\u0646\u062f\u0647\u0654 \u062f\u0646\u062f\u0627\u0646\", \"\u0628\u0633\u062a\u0646 \u0641\u0627\u0635\u0644\u0647 \u0628\u0627 \u06a9\u0627\u0645\u067e\u0648\u0632\u06cc\u062a\u060c \u0628\u062f\u0648\u0646 \u0627\u0631\u0632\u06cc\u0627\u0628\u06cc \u0645\u0648\u0642\u0639\u06cc\u062a \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627\u06cc \u067e\u0627\u06cc\u0647\", \"\u0628\u0627\u0632\u0633\u0627\u0632\u06cc \u062a\u0645\u0627\u0633\u200c\u0647\u0627\u06cc \u0642\u062f\u0627\u0645\u06cc\u060c \u0628\u062f\u0648\u0646 \u0627\u0631\u0632\u06cc\u0627\u0628\u06cc \u0633\u0627\u067e\u0648\u0631\u062a \u0627\u0633\u062a\u062e\u0648\u0627\u0646\u06cc \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627\"], \"correct\": 0, \"source\": \"publish\"}",
          "evidence": [
            "Founder approved the question and key, specifically removing \u0648 \u06cc\u06a9\u067e\u0627\u0631\u0686\u06af\u06cc \u0631\u0648\u06a9\u0634\u200c\u0647\u0627 from option A in current conversation; other options unchanged"
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
          "evidence": [
            "Live PILLARS from main; article concerns differential assessment before selecting a prosthetic intervention; occlusion and crown failure are contributing possibilities, not the central diagnosis"
          ],
          "kind": "pillar_assignment",
          "primary": "treatment-planning",
          "subtopic": "comprehensive-diagnosis"
        },
        {
          "applied": [
            {
              "phrase": "\u0627\u0633\u062a\u0627\u067e\u200c\u0647\u0627\u06cc \u062e\u0644\u0641\u06cc",
              "reason": "Natural-tooth posterior stops and occlusal changes discussed in that article",
              "target": "/insight/insight-12.html"
            },
            {
              "phrase": "\u062a\u0645\u0627\u0633\u200c\u0647\u0627\u06cc \u0627\u06a9\u0644\u0648\u0698\u0646\u06cc",
              "reason": "Occlusal contact assessment in restorative dentistry",
              "target": "/sharehub/share-47.html"
            }
          ],
          "kind": "inline_link_review",
          "skipped": [
            {
              "reason": "Implant splinting evidence is not natural-tooth migration",
              "target": "/sharehub/share-28.html"
            },
            {
              "reason": "Appliance differs from splinted crowns",
              "target": "/glossary/occlusal-splint.html"
            },
            {
              "reason": "Broad term lacks an exact treatment-plan phrase in this body",
              "target": "/glossary/treatment-plan.html"
            }
          ]
        },
        {
          "from_step": "C.2",
          "kind": "dependency_invalidation_v1",
          "reason": "Related capsule labels changed page fingerprint; image permission approval scope is conservatively treated as prose by helper. Revalidate dependent page steps; no founder body/title or image bytes changed.",
          "superseded": {
            "approvals": [
              {
                "decision": "\u0686\u0631\u0627 \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0642\u0628\u0644\u0627\u064b \u0628\u0647 \u0647\u0645 \u0686\u0633\u0628\u06cc\u062f\u0647 \u0628\u0648\u062f\u0646\u062f\u060c \u0641\u0627\u0635\u0644\u0647 \u0627\u06cc\u062c\u0627\u062f \u0645\u06cc\u200c\u0634\u0648\u062f\u061f",
                "evidence": [
                  "Founder attached final article.md; exact title copied"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "\u0628\u06cc\u0645\u0627\u0631 \u0645\u06cc\u200c\u06af\u0641\u062a \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0642\u062f\u06cc\u0645\u06cc\u200c\u0627\u0634 \u0642\u0628\u0644\u0627\u064b \u0641\u0627\u0635\u0644\u0647\u200c\u0627\u06cc \u0646\u0628\u0648\u062f\u0647 \u0627\u0633\u062a. \u0627\u06cc\u0646 \u0648\u06cc\u0632\u06cc\u062a \u0627\u0632 \u0645\u0634\u0627\u0647\u062f\u0647\u0654 \u0641\u0627\u0635\u0644\u0647\u0654 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0648 \u067e\u0631\u0633\u0634\u06cc \u062f\u0631\u0628\u0627\u0631\u0647\u0654 \u062a\u063a\u06cc\u06cc\u0631 \u062a\u062f\u0631\u06cc\u062c\u06cc \u0622\u0646 \u0634\u0631\u0648\u0639 \u0634\u062f.",
                "evidence": [
                  "Standing acceptance, Hard Rule 14; no-spoiler narrative caption"
                ],
                "scope": "caption",
                "status": "confirmed"
              },
              {
                "decision": "Public use of supplied clinical WebP permitted",
                "evidence": [
                  "Founder confirmed image permission in current conversation"
                ],
                "scope": "patient-image",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [],
            "steps": [
              {
                "evidence": [
                  "Same-category page structure copied; exact approved body/title and image alt preserved; WebP 1536x784 measured; .org canonical; GA4 once and both crossorigin preconnects; no seal, DES markup or obsolete media"
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
                "reason": "Not LiteCast; specialist inline links at C.4.8",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": "Not LiteCast; related links at C.4.9",
                "status": "skipped"
              },
              {
                "evidence": [
                  "treatment-planning / comprehensive-diagnosis selected once, semantic diagnostic focus; recorded standing acceptance"
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "One dc-related-section, glossary and canonical /pillar/treatment-planning/ capsules, 2 of 5 slots"
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Chairside landing is generated by tools/build_content_landings.py during runner C.8; brain append drives it, no manual landing edit"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Date audit: template 2026-11-11 -> new 2026-11-12 for datePublished/dateModified/lastReviewed and both visible times. New canonical, OG, Twitter and JSON-LD identity/meta verified"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "git diff --quiet -- chairside/chairside-52.html exit 0; template unchanged"
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
                "reason": "Not NoteCast",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Not NoteCast or core episode; no shared sibling record",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Chairside is not an ordered multi-part series with ep-nav",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": "No paper attached: no Drive filing",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": "No paper attached: no catalog entry",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": "No paper attached: authored commentary with no source credit",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Supplied canonical JSON preserved and stored for chairside/chairside-53: FULL_TEXT v3.7, 15/E, fidelity [null]; Part 3 passed; no rerun, no source lookup or quartile guess; no Part 3b gate owed"
                ],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Fresh semantic glossary review: no dedicated tooth migration, periodontal support, natural-tooth splinting or diastema term in current glossary. Broad treatment-plan, VDO and implant-specific terms are tangential; 0 qualifying glossary backlinks"
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
                "reason": "Not a glossary publication; no new term to cross-link",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Two first-occurrence anchors inserted in locked text only; no text edits, heading links, nesting or self-links; glossary-only near-matches conservatively skipped"
                ],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "started"
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
            "validation": [
              {
                "M3b": "No differing, doubtful or orphan Fidelity units",
                "audit": "COMMENTARY, not owed",
                "checks": [
                  "Exact schema",
                  "Verbatim article quotes and section declaration with note",
                  "5+4+0+3+3=15/E",
                  "FULL_TEXT; provisional false; null research fields",
                  "verify_publish.py --des-text and des_record_guard.py check exit 0",
                  "Persian interpretation supported by final text and preserved"
                ],
                "fidelity": "null for self-COMMENTARY, no call owed",
                "model": "Not rerun; producer UNVERIFIED",
                "source": "Founder canonical DES JSON v3.7",
                "step": "C.4.13"
              }
            ]
          }
        },
        {
          "composition": "Series + decision-level replacement/management + specific replacement tag count 5 before publication; no umbrella-only list",
          "kind": "hashtag_selection",
          "questions": [
            "\u0686\u0631\u0627 \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0642\u062f\u0627\u0645\u06cc \u0642\u062f\u06cc\u0645\u06cc \u06a9\u0645\u200c\u06a9\u0645 \u0641\u0627\u0635\u0644\u0647 \u0645\u06cc\u200c\u0627\u0641\u062a\u0647\u061f",
            "\u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0627\u0633\u067e\u0644\u06cc\u0646\u062a\u200c\u0634\u062f\u0647 \u0647\u0645 \u0645\u0645\u06a9\u0646\u0647 \u0628\u0627 \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627 \u062c\u0627\u0628\u0647\u200c\u062c\u0627 \u0628\u0634\u0646\u061f",
            "\u0642\u0628\u0644 \u0627\u0632 \u062a\u0639\u0648\u06cc\u0636 \u0631\u0648\u06a9\u0634 \u0628\u0631\u0627\u06cc \u0628\u0633\u062a\u0646 \u062f\u06cc\u0627\u0633\u062a\u0645 \u0686\u06cc \u0631\u0648 \u0628\u0631\u0631\u0633\u06cc \u06a9\u0646\u0645\u061f"
          ],
          "resolving_quotes": {
            "\u0627\u06a9\u0644\u0648\u0698\u0646": "\u0627\u0632 \u062f\u0633\u062a \u0631\u0641\u062a\u0646 \u0627\u0633\u062a\u0627\u067e\u200c\u0647\u0627\u06cc \u062e\u0644\u0641\u06cc \u06cc\u0627 \u062a\u063a\u06cc\u06cc\u0631 \u062a\u0645\u0627\u0633\u200c\u0647\u0627\u06cc \u0627\u06a9\u0644\u0648\u0698\u0646\u06cc \u0647\u0645 \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u062f \u062f\u0631 \u0628\u0639\u0636\u06cc \u0628\u06cc\u0645\u0627\u0631\u0627\u0646 \u0628\u0627\u0639\u062b \u062a\u063a\u06cc\u06cc\u0631 \u062a\u0648\u0632\u06cc\u0639 \u0646\u06cc\u0631\u0648\u0647\u0627 \u0634\u0648\u062f.",
            "\u062a\u0639\u0648\u06cc\u0636_\u0631\u0648\u06a9\u0634": "\u0627\u0648\u0644 \u0628\u0627\u06cc\u062f \u0628\u0641\u0647\u0645\u06cc\u0645 \u0686\u0647 \u0686\u06cc\u0632\u06cc \u0628\u0627\u0639\u062b \u0634\u062f\u0647 \u0645\u0648\u0642\u0639\u06cc\u062a \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627 \u062a\u063a\u06cc\u06cc\u0631 \u06a9\u0646\u062f.",
            "\u062f\u06cc\u0627\u0633\u062a\u0645": "\u0648\u0642\u062a\u06cc \u0628\u06cc\u0646 \u062f\u0648 \u0631\u0648\u06a9\u0634 \u0642\u062f\u06cc\u0645\u06cc \u0628\u0647\u200c\u062a\u062f\u0631\u06cc\u062c \u0641\u0627\u0635\u0644\u0647 \u0627\u06cc\u062c\u0627\u062f \u0645\u06cc\u200c\u0634\u0648\u062f\u060c \u0646\u0628\u0627\u06cc\u062f \u0635\u0631\u0641\u0627\u064b \u0628\u0647 \u0641\u06a9\u0631 \u0628\u0633\u062a\u0646 \u0641\u0627\u0635\u0644\u0647 \u06cc\u0627 \u062a\u0639\u0648\u06cc\u0636 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627 \u0628\u0627\u0634\u06cc\u0645.",
            "\u0637\u0631\u062d_\u062f\u0631\u0645\u0627\u0646": "\u0642\u0628\u0644 \u0627\u0632 \u0647\u0631 \u062a\u0635\u0645\u06cc\u0645 \u062f\u0631\u0645\u0627\u0646\u06cc \u0628\u0627\u06cc\u062f \u0648\u0636\u0639\u06cc\u062a \u067e\u0631\u06cc\u0648\u062f\u0646\u062a\u0627\u0644\u060c \u0633\u0627\u067e\u0648\u0631\u062a \u0627\u0633\u062a\u062e\u0648\u0627\u0646\u06cc\u060c \u062a\u0645\u0627\u0633\u200c\u0647\u0627\u06cc \u0627\u06a9\u0644\u0648\u0698\u0646\u06cc \u062e\u0644\u0641\u06cc \u0648 \u0642\u062f\u0627\u0645\u06cc \u0648 \u06cc\u06a9\u067e\u0627\u0631\u0686\u06af\u06cc \u062e\u0648\u062f \u0631\u0648\u06a9\u0634\u200c\u0647\u0627 \u0628\u0631\u0631\u0633\u06cc \u0634\u0648\u062f."
          },
          "reused": "All canonical, --simulate verified; no minted concepts",
          "tags": [
            "#\u0648\u06cc\u0632\u06cc\u062a",
            "#\u062f\u06cc\u0627\u0633\u062a\u0645",
            "#\u062a\u0639\u0648\u06cc\u0636_\u0631\u0648\u06a9\u0634",
            "#\u0637\u0631\u062d_\u062f\u0631\u0645\u0627\u0646",
            "#\u0627\u06a9\u0644\u0648\u0698\u0646"
          ]
        },
        {
          "candidates": [
            {
              "id": "treatment-planning",
              "reason": "Tool ASK, frozen-core overlap 6/2, below STRONG; conservative default for short case-specific reflection",
              "verdict": "not placed"
            },
            {
              "id": "fixed-pros",
              "reason": "Tool ASK; no technical crown design or restorative procedure taught",
              "verdict": "not placed"
            },
            {
              "id": "failure-troubleshooting",
              "reason": "Tool ASK; mechanism remains hypothetical, no diagnosed failure",
              "verdict": "not placed"
            },
            {
              "id": "occlusion",
              "reason": "Tool ASK; occlusal contribution considered, no occlusal treatment protocol",
              "verdict": "not placed"
            },
            {
              "id": "implant-prosthetic",
              "reason": "Natural-tooth case, implant overlap tangential",
              "verdict": "not placed"
            },
            {
              "id": "biomimetic",
              "reason": "No adhesive restorative technique",
              "verdict": "not placed"
            },
            {
              "id": "esthetic",
              "reason": "Diastema etiology, not esthetic correction protocol",
              "verdict": "not placed"
            },
            {
              "id": "implant-surgical",
              "reason": "No implant surgery",
              "verdict": "not placed"
            }
          ],
          "exam": "4.12-\u0628 skipped: no full-pathway membership, canonical module 07 exception",
          "kind": "pathway_review"
        },
        {
          "evidence": [
            "Original patient encounter lead copied verbatim; no new introduction"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "Founder article.md first paragraph"
        },
        {
          "english": {
            "evidence": [
              "Universal English chrome and same-category LTR style; eight paragraphs and initial clinical image translated; real toggle, noindex, no hreflang"
            ],
            "path": "chairside/en/chairside-53.html",
            "status": "ready"
          },
          "evidence": [
            "Remote Phase F issues repaired: hand-maintained Chairside landing linked; explicit occlusion membership and approved exam question added. Founder title/body/DES/image unchanged. No pending questions."
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "Revalidated actual canonical ledger evidence for scientific; occlusion membership and founder-approved revised exam included"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Revalidated actual canonical ledger evidence for challenge; occlusion membership and founder-approved revised exam included"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "Revalidated actual canonical ledger evidence for taxonomy; occlusion membership and founder-approved revised exam included"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "Revalidated actual canonical ledger evidence for links; occlusion membership and founder-approved revised exam included"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "Revalidated actual canonical ledger evidence for hashtags; occlusion membership and founder-approved revised exam included"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "Revalidated actual canonical ledger evidence for content_record; occlusion membership and founder-approved revised exam included"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "Revalidated actual canonical ledger evidence for pathways; occlusion membership and founder-approved revised exam included"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "Revalidated actual canonical ledger evidence for pulse; occlusion membership and founder-approved revised exam included"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "Revalidated actual canonical ledger evidence for english; occlusion membership and founder-approved revised exam included"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "Revalidated actual canonical ledger evidence for author_approvals; occlusion membership and founder-approved revised exam included"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            }
          ]
        },
        {
          "from_step": "C.2.6",
          "kind": "dependency_invalidation_v1",
          "reason": "Remote Phase F: 98 passed, 2 failed: hand-maintained Chairside landing missing new link, and no pathway membership. Founder now explicitly requests occlusion pathway; exam draft is awaiting explicit approval. Revalidate publication dependencies and preserve unchanged text/DES.",
          "superseded": {
            "approvals": [
              {
                "decision": "\u0686\u0631\u0627 \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc\u06cc \u06a9\u0647 \u0642\u0628\u0644\u0627\u064b \u0628\u0647 \u0647\u0645 \u0686\u0633\u0628\u06cc\u062f\u0647 \u0628\u0648\u062f\u0646\u062f\u060c \u0641\u0627\u0635\u0644\u0647 \u0627\u06cc\u062c\u0627\u062f \u0645\u06cc\u200c\u0634\u0648\u062f\u061f",
                "evidence": [
                  "Founder attached exact title"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "\u0628\u06cc\u0645\u0627\u0631 \u0645\u06cc\u200c\u06af\u0641\u062a \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0642\u062f\u06cc\u0645\u06cc\u200c\u0627\u0634 \u0642\u0628\u0644\u0627\u064b \u0641\u0627\u0635\u0644\u0647\u200c\u0627\u06cc \u0646\u0628\u0648\u062f\u0647 \u0627\u0633\u062a. \u0627\u06cc\u0646 \u0648\u06cc\u0632\u06cc\u062a \u0627\u0632 \u0645\u0634\u0627\u0647\u062f\u0647\u0654 \u0641\u0627\u0635\u0644\u0647\u0654 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0648 \u067e\u0631\u0633\u0634\u06cc \u062f\u0631\u0628\u0627\u0631\u0647\u0654 \u062a\u063a\u06cc\u06cc\u0631 \u062a\u062f\u0631\u06cc\u062c\u06cc \u0622\u0646 \u0634\u0631\u0648\u0639 \u0634\u062f.",
                "evidence": [
                  "Standing acceptance Hard Rule 14; caption supported by text"
                ],
                "scope": "caption",
                "status": "confirmed"
              },
              {
                "decision": "Public use of supplied clinical image permitted",
                "evidence": [
                  "Founder explicitly confirmed image permission in current conversation"
                ],
                "scope": "patient-image",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [],
            "steps": [
              {
                "evidence": [
                  "Landing regeneration belongs to runner tools/build_content_landings.py"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Verified all new publication/review dates 2026-11-12, unchanged title/caption metadata, 1536x784 OG dimensions"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Template git diff --quiet remains clean"
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
                "reason": "Category chairside: not LiteCast, NoteCast, ordered ep-nav series, glossary or attached-paper branch; canonical category exception",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Category chairside: not LiteCast, NoteCast, ordered ep-nav series, glossary or attached-paper branch; canonical category exception",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Category chairside: not LiteCast, NoteCast, ordered ep-nav series, glossary or attached-paper branch; canonical category exception",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": "Category chairside: not LiteCast, NoteCast, ordered ep-nav series, glossary or attached-paper branch; canonical category exception",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": "Category chairside: not LiteCast, NoteCast, ordered ep-nav series, glossary or attached-paper branch; canonical category exception",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": "Category chairside: not LiteCast, NoteCast, ordered ep-nav series, glossary or attached-paper branch; canonical category exception",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Final body unchanged after anchors; supplied canonical DES remains valid: exact quotes, schema, FULL_TEXT, 15/E, [null] self-Fidelity. des-text and guard checks passed; no model calls owed"
                ],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Reviewed glossary meaning/scope: no direct term for migration, periodontal support or splinted natural teeth; broad and implant terms skipped, zero qualifying backlinks"
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
                "reason": "Category chairside: not LiteCast, NoteCast, ordered ep-nav series, glossary or attached-paper branch; canonical category exception",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Verified first-occurrence posterior-stops anchor to insight-12 and occlusal-contact anchor to share-47; anchors only, body text identical"
                ],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Verified 5-link cap: glossary + treatment-planning + chairside-41 + chairside-43 + insight-12; all relevant and strongest-first"
                ],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Two authored atomic concept cards in corpus, stable flashcards-c1/c2: force equilibrium and splinted-group movement; no FAQ dump or page JSON-LD"
                ],
                "id": "C.4.11",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Two standalone binary FAQ questions, each starts with \u0622\u06cc\u0627 and answer with \u062e\u06cc\u0631; no article deixis or copied card description. 4.12-\u0628 evaluated at C.5.6"
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
                "reason": "Ordinary clinical narrative, not Challenge; no challenge markup",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Canonical concepts resolved; 5 tags, existing decision and specific tag, no mint/bridge change; sync/check and assistant reachability follow brain write per module 10"
                ],
                "id": "C.5.0",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Appended new entry at absolute array tail using dentcast_text_io.json_append; exact same keys/nesting/order as chairside-52, no DES or pathway fields; tags/keywords/pillar recorded"
                ],
                "id": "C.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Entry pillar exactly matches C.2.4 and canonical related capsule; no new pillar/subtopic"
                ],
                "id": "C.5.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "pathway_place.py evaluated full live catalog and frozen core: every candidate ASK; conservative no placement, no full-pathway member. 4.12-\u0628 skipped: no full pathway, no M2 owed"
                ],
                "id": "C.5.6",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "No bundles continue a joined pathway; zero candidates. Chairside would in all cases fail gate 1"
                ],
                "id": "C.5.6-b",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Pulse: new exact title first, 7 lines, old first six preserved. English mirror ready with universal chrome, all source prose translated, original image and both toggles; dates/SEO verified. Ten-scope lock and author-original lead recorded; founder image consent confirmed"
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
            "validation": [
              {
                "builder": "build_plus_index.mjs executed for verification then both generated outputs restored; sparse workspace folder counts ignored, runner builds from full source",
                "canonical_tags": "hashtag_ref.py --check exit 0; --sync updated five counts with no concepts minted",
                "reachability": [
                  {
                    "labels": [
                      "\u062f\u06cc\u0627\u0633\u062a\u0645",
                      "\u062a\u0639\u0648\u06cc\u0636 \u0631\u0648\u06a9\u0634"
                    ],
                    "question": "\u0686\u0631\u0627 \u0628\u06cc\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0642\u062f\u0627\u0645\u06cc \u0642\u062f\u06cc\u0645\u06cc \u06a9\u0645\u200c\u06a9\u0645 \u0641\u0627\u0635\u0644\u0647 \u0645\u06cc\u200c\u0627\u0641\u062a\u0647\u061f",
                    "result": "New page is exact progressive-gap match, first semantic result of diastema chip; all existing candidate titles inspected"
                  },
                  {
                    "labels": [
                      "\u062f\u06cc\u0627\u0633\u062a\u0645",
                      "\u062a\u0639\u0648\u06cc\u0636 \u0631\u0648\u06a9\u0634"
                    ],
                    "question": "\u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0627\u0633\u067e\u0644\u06cc\u0646\u062a\u200c\u0634\u062f\u0647 \u0647\u0645 \u0645\u0645\u06a9\u0646\u0647 \u0628\u0627 \u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627 \u062c\u0627\u0628\u0647\u200c\u062c\u0627 \u0628\u0634\u0646\u061f",
                    "result": "New page directly addresses natural-tooth group migration; first semantic result; implant-splinting tags rejected"
                  },
                  {
                    "labels": [
                      "\u062a\u0639\u0648\u06cc\u0636 \u0631\u0648\u06a9\u0634",
                      "\u062f\u06cc\u0627\u0633\u062a\u0645",
                      "\u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646"
                    ],
                    "question": "\u0642\u0628\u0644 \u0627\u0632 \u062a\u0639\u0648\u06cc\u0636 \u0631\u0648\u06a9\u0634 \u0628\u0631\u0627\u06cc \u0628\u0633\u062a\u0646 \u062f\u06cc\u0627\u0633\u062a\u0645 \u0686\u06cc \u0631\u0648 \u0628\u0631\u0631\u0633\u06cc \u06a9\u0646\u0645\u061f",
                    "result": "Exact management context, new page and chairside-41 strongest results, within first four"
                  }
                ],
                "step": "C.5.0"
              },
              {
                "reason": "No bridge or catalog changed; unchanged 8MB catalog exceeded connector response, sandbox proxy unavailable. Missing-data check is not green; runner has full checkout.",
                "scope": "cabinet bridge",
                "status": "pending_remote_check"
              }
            ]
          }
        },
        {
          "decision": "Add this article to occlusion pathway",
          "evidence": [
            "Founder explicitly requested occlusion membership during active publication; exact scope accepted, prior conservative exclusion superseded"
          ],
          "kind": "founder_pathway_decision",
          "pathway": "occlusion"
        },
        {
          "content_id": "chairside/chairside-53",
          "correct": 0,
          "evidence": [
            "Explicit founder approval with this sole option edit; do not rewrite approved distractors to equalize lengths"
          ],
          "kind": "exam_question_founder_correction",
          "removed_from_option_a": " \u0648 \u06cc\u06a9\u067e\u0627\u0631\u0686\u06af\u06cc \u0631\u0648\u06a9\u0634\u200c\u0647\u0627"
        }
      ],
      "delivery": [],
      "inputs": [],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "coverage": "One occlusion placement, after sharehub/share-36, milestone false. 854 full memberships / 564 items = 1.51, curated baseline 1.38.",
          "editorial_warning": "Founder-requested deletion shortened approved option A: 40\u201361 characters, above draft 1.25 ratio. Explicit founder wording takes precedence; no other options changed. Runtime bank validator accepts with warning.",
          "exam": "validate_exam_questions.py --content chairside/chairside-53: 1 live, 0 review, 0 errors; append-only insertion",
          "step": "C.5.6"
        },
        {
          "evidence": [
            "First runner Phase F: 98 passed, 0 warnings, 2 failures. New landing row fixes 2.6; new occlusion step fixes 5.6; approved bank question satisfies 4.12-\u0628. All other passed surfaces unchanged."
          ],
          "scope": "reconciliation"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "AGENTS.md; live modules 01/02, checkpoint protocol, agent parity and complete selected global core sections read; GitHub connector read/write, branch/PR/merge and Actions monitoring available; API-source validation workspace without git clone"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Attached approved article text and clinical WebP, no research paper: normal Chairside publication, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed brain once; latest chairside-52 exact key order, chairside URL and template; live PILLARS read from main builder. Next ID chairside/chairside-53"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder packet explicitly identifies Chairside; locked type chairside"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Brain category max 52, next chairside-53 announced to founder"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "article.md final text and exact title supplied; founder requests verbatim text, no references"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Single style review: personal patient encounter and reasoning read naturally; no edits. Explicit founder instruction preserves approved article verbatim"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Attached WebP and exact Persian alt supplied. Founder explicitly confirmed public image permission in this conversation"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No research paper attached; ZIP contains authored commentary, image, DES and handoff only"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Basket 1 COMMENTARY, own final body as FULL_TEXT, no cited paper. Canonical DES supplied for this exact article; validate under original 3.7 without model rerun; self-Fidelity null"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Ordinary narrative article, not Challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse proposal: exact article title linked to /chairside/chairside-53.html, following existing Chairside announcements, no added conclusion"
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
        "reason": "Not LiteCast: chairside locked at B.1",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: no LightGlossary write",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: specialist track",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: same-category Chairside template",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast: ordinary publication",
        "status": "skipped"
      },
      {
        "evidence": [
          "chairside/chairside-52.html is latest same-category structural template, enrolled and preserved"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified new structural clone, exact article body/title and 1536x784 supplied WebP; metadata and head invariants preserved"
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
        "reason": "Category chairside: not LiteCast, NoteCast, ordered ep-nav series, glossary or attached-paper branch; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Category chairside: not LiteCast, NoteCast, ordered ep-nav series, glossary or attached-paper branch; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [
          "Revalidated recorded treatment-planning / comprehensive-diagnosis; same live taxonomy"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified one related section and correct canonical two navigation capsules"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Corrected discovery: Chairside landing is hand-maintained, not generated by runner. Appended new top row using exact sibling markup and exact founder title; original landing bytes otherwise preserved"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "All dates and new metadata unchanged and valid, 2026-11-12"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Template chairside-52 byte-unchanged, diff quiet"
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
        "reason": "Chairside ordinary article: not NoteCast, ordered ep-nav series, glossary, attached-paper branch or Challenge; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Chairside ordinary article: not NoteCast, ordered ep-nav series, glossary, attached-paper branch or Challenge; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Chairside ordinary article: not NoteCast, ordered ep-nav series, glossary, attached-paper branch or Challenge; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "Chairside ordinary article: not NoteCast, ordered ep-nav series, glossary, attached-paper branch or Challenge; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "Chairside ordinary article: not NoteCast, ordered ep-nav series, glossary, attached-paper branch or Challenge; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "Chairside ordinary article: not NoteCast, ordered ep-nav series, glossary, attached-paper branch or Challenge; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [
          "Revalidated unchanged supplied DES and final text: Phase F confirmed arithmetic 15, E, null fields, section-declaration note, verbatim quotes and self-Fidelity exception; no rescoring"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Fresh glossary review remains zero direct concepts; no false links to implant splinting or broad terms"
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
        "reason": "Chairside ordinary article: not NoteCast, ordered ep-nav series, glossary, attached-paper branch or Challenge; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [
          "Same two anchors only; source prose unchanged, first occurrence and target semantics verified"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Existing five capsules verified, no additions/removals; cap satisfied"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Same two authored concept cards; remote Phase F passed stable IDs and no FAQ copies"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Same two standalone binary FAQ questions; remote Phase F passed all wording/verdict gates"
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
        "reason": "Chairside ordinary article: not NoteCast, ordered ep-nav series, glossary, attached-paper branch or Challenge; canonical category exception",
        "status": "skipped"
      },
      {
        "evidence": [
          "Same five canonical tags, no minted concepts; sync/check and semantic reachability verified before first Push2; no dependency changed"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Exact same brain tail entry/key order and original founder title/caption; remote Phase F passed"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Original treatment-planning/comprehensive-diagnosis pillar unchanged; pathname/pillar capsule correct"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder-requested occlusion membership added with official pathway_place.py after sharehub/share-36. One four-option exam question r-a01be85f approved with specific removal of crown-integrity phrase; key A unchanged, canonical bank validation 0 errors, length warning disclosed in evidence. No third pathway"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle-occlusion-rehab rejected at gate 1: Chairside folder excluded; no bundle or shared asset changes"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse unchanged with correct seven rows; English and both toggles unchanged and previously passed; amended ten-scope lock includes occlusion and approved revised exam, no open founder message. Reconciliation ready for runner"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "chairside/chairside-52.html",
      "chairside/chairside-53.html",
      "chairside/cs53-1.webp",
      "chairside/en/chairside-53.html",
      "chairside/index.html",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: chairside/index.html, plus/pathways.json, plus/exam-questions.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
