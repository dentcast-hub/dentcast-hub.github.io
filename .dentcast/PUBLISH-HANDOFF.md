# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "chairside/chairside-55"
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
    "content_id": "chairside/chairside-55",
    "context": {
      "approvals": [
        {
          "decision": "\u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0648 \u0636\u0627\u06cc\u0639\u0647 \u0627\u0646\u062a\u0647\u0627\u06cc \u0631\u06cc\u0634\u0647 \u0632\u06cc\u0631 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0645\u062a\u0635\u0644\u061b \u0628\u0631\u0631\u0633\u06cc \u06cc\u06a9 \u06a9\u06cc\u0633 \u0628\u0627\u0644\u06cc\u0646\u06cc \u0648 \u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646 \u0645\u062c\u062f\u062f",
          "evidence": [
            "founder's message, copied codepoint for codepoint"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u062f\u0648 \u0631\u0648\u06a9\u0634 \u0645\u0648\u0644\u0631 \u0641\u06a9 \u067e\u0627\u06cc\u06cc\u0646 \u06a9\u0647 \u0628\u0647 \u0647\u0645 \u0645\u062a\u0635\u0644 \u0634\u062f\u0647\u200c\u0627\u0646\u062f: \u0627\u0648\u0631\u0647\u0646\u06af \u0644\u0628\u0647\u200c\u0647\u0627\u060c \u06af\u06cc\u0631 \u063a\u0630\u0627\u06cc\u06cc \u0648 \u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0628\u06cc\u0646\u200c\u062f\u0646\u062f\u0627\u0646\u06cc\u060c \u062f\u0631 \u06a9\u0646\u0627\u0631 \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647 \u0646\u0627\u0642\u0635 \u0648 \u0636\u0627\u06cc\u0639\u0647 \u0627\u0646\u062a\u0647\u0627\u06cc \u0631\u06cc\u0634\u0647\u061b \u062f\u0644\u06cc\u0644 \u062e\u0627\u0631\u062c \u06a9\u0631\u062f\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627 \u0648 \u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646 \u0645\u062c\u062f\u062f.",
          "evidence": [
            "agent proposal under standing acceptance (Hard Rule 14)"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "approved two drafted MCQs verbatim",
          "evidence": [
            "chat: \u00ab\u062a\u0627\u06cc\u06cc\u062f\u00bb over the two questions shown"
          ],
          "scope": "M2 exam questions",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "decision": "founder confirmed the type is chairside (\u0648\u06cc\u0632\u06cc\u062a), not clinical insight",
          "evidence": [
            "chat message \u00ab\u062a\u0627\u06cc\u06cc\u062f \u0627\u0644\u0628\u062a\u0647 \u0645\u0646 \u06af\u0641\u062a\u0645 \u062a\u0632 \u0646\u0648\u0639 \u0686\u06cc\u0631\u0633\u0627\u06cc\u062f \u0647\u0633\u062a\u00bb"
          ],
          "kind": "founder_category_correction"
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
          "evidence": [
            "C.3 build: body opens with the founder's paragraph before any list"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder's own first paragraph opens the body (\u0634\u0631\u062d \u062d\u0627\u0644 \u0648 \u0631\u0648\u0627\u06cc\u062a \u0628\u06cc\u0645\u0627\u0631)"
        },
        {
          "from_step": "C.6",
          "kind": "dependency_invalidation_v1",
          "reason": "Phase F failed: Pulse line was wrongly skipped; the line is now written and the bottom line dropped",
          "superseded": {
            "approvals": [
              {
                "decision": "\u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0648 \u0636\u0627\u06cc\u0639\u0647 \u0627\u0646\u062a\u0647\u0627\u06cc \u0631\u06cc\u0634\u0647 \u0632\u06cc\u0631 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627\u06cc \u0645\u062a\u0635\u0644\u061b \u0628\u0631\u0631\u0633\u06cc \u06cc\u06a9 \u06a9\u06cc\u0633 \u0628\u0627\u0644\u06cc\u0646\u06cc \u0648 \u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646 \u0645\u062c\u062f\u062f",
                "evidence": [
                  "founder's message, copied codepoint for codepoint"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "\u062f\u0648 \u0631\u0648\u06a9\u0634 \u0645\u0648\u0644\u0631 \u0641\u06a9 \u067e\u0627\u06cc\u06cc\u0646 \u06a9\u0647 \u0628\u0647 \u0647\u0645 \u0645\u062a\u0635\u0644 \u0634\u062f\u0647\u200c\u0627\u0646\u062f: \u0627\u0648\u0631\u0647\u0646\u06af \u0644\u0628\u0647\u200c\u0647\u0627\u060c \u06af\u06cc\u0631 \u063a\u0630\u0627\u06cc\u06cc \u0648 \u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0628\u06cc\u0646\u200c\u062f\u0646\u062f\u0627\u0646\u06cc\u060c \u062f\u0631 \u06a9\u0646\u0627\u0631 \u062f\u0631\u0645\u0627\u0646 \u0631\u06cc\u0634\u0647 \u0646\u0627\u0642\u0635 \u0648 \u0636\u0627\u06cc\u0639\u0647 \u0627\u0646\u062a\u0647\u0627\u06cc \u0631\u06cc\u0634\u0647\u061b \u062f\u0644\u06cc\u0644 \u062e\u0627\u0631\u062c \u06a9\u0631\u062f\u0646 \u0631\u0648\u06a9\u0634\u200c\u0647\u0627 \u0648 \u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646 \u0645\u062c\u062f\u062f.",
                "evidence": [
                  "agent proposal under standing acceptance (Hard Rule 14); no founder caption supplied"
                ],
                "scope": "caption",
                "status": "confirmed"
              },
              {
                "decision": "approved two drafted MCQs verbatim",
                "evidence": [
                  "chat: \u00ab\u062a\u0627\u06cc\u06cc\u062f\u00bb over the two questions shown"
                ],
                "scope": "M2 exam questions",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [],
            "steps": [
              {
                "evidence": [
                  "en mirror chairside/en/chairside-55.html written before the cut (noindex,follow, no hreflang, inverse toggles, translation structure-faithful); Pulse: documented skip \u2014 no chairside line exists in the Pulse list; ten-scope editorial lock and approvals recorded"
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
        },
        {
          "english": {
            "evidence": [
              "cloned en chrome of chairside-54, translated body"
            ],
            "path": "chairside/en/chairside-55.html",
            "status": "ready"
          },
          "evidence": [
            "C.6 lock re-recorded after the Phase F failure"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13 COMMENTARY DES record under chairside/chairside-55; verify_publish --des-text ok"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "ordinary post; C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "pillar fixed-props/failures; 7 canonical hashtags; hashtag_ref --check green"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 no free slot (cap); C.4.8 two inline anchors; C.4.9 at cap 5/5"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "#\u0648\u06cc\u0632\u06cc\u062a #\u0631\u0648\u06a9\u0634_\u0627\u0633\u067e\u0644\u06cc\u0646\u062a #\u0627\u0648\u0631\u0647\u0646\u06af #\u06af\u06cc\u0631_\u063a\u0630\u0627\u06cc\u06cc #\u062a\u062d\u0644\u06cc\u0644_\u0627\u0633\u062a\u062e\u0648\u0627\u0646 #\u0631\u06cc\u062a\u0631\u06cc\u062a\u0645\u0646\u062a #\u067e\u0631\u0648\u06af\u0646\u0648\u0632_\u062f\u0646\u062f\u0627\u0646; no mint"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "chairside-55 appended at the tail of dentcast-brain.json"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "fixed-props and failure-troubleshooting; bundle rejected at gate 1"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html: new first Pulse line linking /chairside/chairside-55.html; previous bottom line dropped; seven lines kept"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "chairside/en/chairside-55.html noindex,follow, no hreflang, inverse toggles"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title, caption and M2 restored after invalidation"
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
          "global README + 5 selected pages, agent-parity, checkpoints, modules 01/02 read for this run"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text present, no paper: normal publish"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed; chairside series ends at chairside-54; PILLARS live"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type=chairside per founder correction (the case is a \u0648\u06cc\u0632\u06cc\u062a)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "number 55; max chairside page 54"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder supplied the text"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "style-only rewrite applied: '\u0628\u0627\u0639\u062b \u0627\u06cc\u062c\u0627\u062f \u0686\u0646\u062f \u0645\u0634\u06a9\u0644 \u0647\u0645\u200c\u0632\u0645\u0627\u0646 \u0634\u062f\u0647 \u0627\u0633\u062a' \u2192 '\u0686\u0646\u062f \u0645\u0634\u06a9\u0644 \u0631\u0627 \u0647\u0645\u200c\u0632\u0645\u0627\u0646 \u0633\u0627\u062e\u062a\u0647 \u0627\u0633\u062a'; rest byte-identical"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder image saved as chairside/cs55-1.webp (WebP 1400x1209, 281 KB, under 1600px/300KB)"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file: paper branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES basket 1 COMMENTARY: own case narrative, no DOI or reference list"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ordinary post, not a challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse per chairside precedent (\u0648\u06cc\u0632\u06cc\u062a \u06f5\u06f5 row/link with the title, no spoiler)"
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
        "reason": "not LiteCast",
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
          "template locked: chairside/chairside-54.html, left byte-unchanged"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "cloned chairside-54 structure; .org domain kept; GA once; two preconnect with crossorigin; body opens with the founder's own first paragraph (author_original); three marked \u2206 headings; presentation_lint clean"
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
          "pillar.primary=fixed-pros, subtopic=failures (failing splinted crowns, overhang, staged retreatment); treatment-planning/comprehensive-diagnosis considered and not chosen"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "capsules: \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/fixed-pros/"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "chairside/index.html is hand-maintained: added \u00ab\u0648\u06cc\u0632\u06cc\u062a \u06f5\u06f5 \u2014 \u2026\u00bb row at the top, CRLF preserved"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "all dates 2026-11-24 across visible and JSON-LD fields"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- chairside/chairside-54.html empty: template untouched"
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
        "reason": "not a NoteCast",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "not a NoteCast/episode pair",
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
        "reason": "no paper attached",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached",
        "status": "skipped"
      },
      {
        "evidence": [
          "COMMENTARY basket: source_text = chairside text-of-record (3012 chars), text_basis FULL_TEXT; SOURCE call in a tool-less API process with .dentcast/des-v3.7-knowledge.md as system prompt (gpt-6.2-astra); des_score 15, band E (4+0+3+3); all quotes verbatim, item 4 quoted from chairside/index.html with its note; verify_publish --des-text ok; stored under chairside/chairside-55 in plus/des-scores.json; Fidelity omitted (basket-1 self-record)"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "glossary candidates (post-and-core, subgingival-margin, ferrule-effect, crown-lengthening) all at cap 6/5 per related_cap: 0 backlinks added"
        ],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "skipped \u2014 not a glossary publish"
        ],
        "id": "C.4.7-b",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "2 strong matches applied: \u00ab\u0627\u0633\u067e\u0644\u06cc\u0646\u062a\u00bb \u2192 insight-55, \u00ab\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631\u00bb \u2192 glossary/post-and-core; borderline candidates skipped"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "section at cap 5/5 (\u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + fixed-pros capsule + insight-14, chairside-53, insight-76); strongest semantic first"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "3 authored DefinedTerms under chairside/chairside-55 (#flashcards-c1..c3): overhang/splint effect, retreatment order, single-unit advantage; none a copied FAQ answer"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "3 binary FAQ pairs, standalone, explicit \u0628\u0644\u0647/\u062e\u06cc\u0631 verdicts grounded in the body"
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
        "reason": "ordinary post, not a challenge",
        "status": "skipped"
      },
      {
        "evidence": [
          "questions: \u00ab\u0627\u0648\u0631\u0647\u0646\u06af \u0631\u0648\u06a9\u0634 \u0628\u0627\u0639\u062b \u062a\u062d\u0644\u06cc\u0644 \u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0645\u06cc\u0634\u0648\u062f\u061f\u00bb, \u00ab\u0631\u0648\u06a9\u0634\u0647\u0627\u06cc \u0628\u0647 \u0647\u0645 \u0686\u0633\u0628\u06cc\u062f\u0647 \u0631\u0627 \u062c\u062f\u0627 \u06a9\u0646\u0645\u061f\u00bb, \u00ab\u0628\u0627 \u0636\u0627\u06cc\u0639\u0647\u0654 \u0627\u0646\u062a\u0647\u0627\u06cc \u0631\u06cc\u0634\u0647 \u0627\u0648\u0644 \u0627\u0646\u062f\u0648 \u06cc\u0627 \u0627\u0648\u0644 \u0631\u0648\u06a9\u0634\u061f\u00bb; all tags reused canonical via --simulate: #\u0648\u06cc\u0632\u06cc\u062a (series), #\u0631\u0648\u06a9\u0634_\u0627\u0633\u067e\u0644\u06cc\u0646\u062a, #\u0627\u0648\u0631\u0647\u0646\u06af, #\u06af\u06cc\u0631_\u063a\u0630\u0627\u06cc\u06cc, #\u062a\u062d\u0644\u06cc\u0644_\u0627\u0633\u062a\u062e\u0648\u0627\u0646, #\u0631\u06cc\u062a\u0631\u06cc\u062a\u0645\u0646\u062a, #\u067e\u0631\u0648\u06af\u0646\u0648\u0632_\u062f\u0646\u062f\u0627\u0646; no mint; composition gate met; --check green; page ranks 4th in \u0627\u0648\u0631\u0647\u0646\u06af and \u0631\u0648\u06a9\u0634 \u0627\u0633\u067e\u0644\u06cc\u0646\u062a chips (reachable)"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "appended chairside-55 at the end of the flat brain array (last was clinical-120); chairside-54 key set; 7 canonical hashtags; 8 keywords; pillar fixed-pros/failures"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain pillar fixed-pros/failures equals the step-2.4 decision; subtopic present; capsule points to /pillar/fixed-pros/"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "placed in 2 full pathways: fixed-pros (after insight-72) and failure-troubleshooting (after insight-7); 4.12-\u0628: 2 MCQs written to plus/exam-questions.json (r-ffc8f179, r-3d30e7fb) after the founder's M2 approval \u00ab\u062a\u0627\u06cc\u06cc\u062f\u00bb; validate_exam_questions 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "one candidate bundle (bundle-crown-prep, continues fixed-props): rejected at GATE 1 \u2014 chairside/ folder is never bundle-eligible; no other candidate"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse line written at the top linking chairside-55 and the previous bottom line dropped; en mirror unchanged; lock and approvals restored"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "chairside/chairside-55.html",
      "chairside/cs55-1.webp",
      "chairside/en/chairside-55.html",
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
    "note": "Index-only refresh after staging delivery paths: index.html"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
