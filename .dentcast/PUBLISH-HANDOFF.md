# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "sharehub/share-60"
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
    "content_id": "sharehub/share-60",
    "context": {
      "approvals": [
        {
          "decision": "\u0644\u0645\u06cc\u0646\u062a\u200c\u0647\u0627\u06cc \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc\u061b \u06a9\u062f\u0627\u0645 \u0645\u062a\u0631\u06cc\u0627\u0644 \u0648 \u0686\u0647 \u0627\u0646\u062a\u0638\u0627\u0631\u06cc \u0627\u0632 \u0645\u0627\u0646\u062f\u06af\u0627\u0631\u06cc\u061f",
          "evidence": [
            "founder-supplied title, copied verbatim at intake (Hard Rule 16)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0628\u0642\u0627\u06cc \u0644\u0645\u06cc\u0646\u062a\u200c\u0647\u0627\u06cc \u0641\u0644\u062f\u0633\u067e\u0627\u062a\u06cc\u06a9\u060c \u0644\u0648\u0633\u0627\u06cc\u062a\u060c \u0644\u06cc\u062a\u06cc\u0648\u0645 \u062f\u06cc\u200c\u0633\u06cc\u0644\u06cc\u06a9\u0627\u062a \u0648 \u0632\u06cc\u0631\u06a9\u0648\u0646\u06cc\u0627 \u062f\u0631 \u06cc\u06a9 \u0645\u0631\u0648\u0631 \u0633\u06cc\u0633\u062a\u0645\u0627\u062a\u06cc\u06a9 \u0648 \u0645\u062a\u0627\u0622\u0646\u0627\u0644\u06cc\u0632\u061b \u062a\u0641\u0627\u0648\u062a \u0639\u0648\u0627\u0631\u0636 \u062a\u06a9\u0646\u06cc\u06a9\u0627\u0644 \u0648 \u0628\u06cc\u0648\u0644\u0648\u0698\u06cc\u06a9\u060c \u0646\u0642\u0634 \u0628\u0627\u0646\u062f \u0628\u0647 \u0639\u0627\u062c \u0648 \u0627\u062b\u0631 \u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u0645 \u0628\u0631 \u0634\u06a9\u0633\u062a\u061b \u0628\u0631 \u0627\u0633\u0627\u0633 Klein \u0648 \u0647\u0645\u06a9\u0627\u0631\u0627\u0646 (\u06f2\u06f0\u06f2\u06f5).",
          "evidence": [
            "agent-proposed caption under standing acceptance (Hard Rule 14); equals the page meta description"
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
          "from_step": "rules",
          "kind": "dependency_invalidation_v1",
          "reason": "The founder-requested DES/Fidelity simplification changes .dentcast/workflows/modules/08-des-fidelity.md; it changes no page text, no DES score and no stored record, only the optional audit and re-check loop",
          "superseded": {
            "approvals": [],
            "delivery": [],
            "inputs": [],
            "steps": [
              {
                "evidence": [
                  "read complete: workflows/README.md, modules 01-02, global/README with all selected pages, agent-parity, publish-checkpoints, handoff-tool"
                ],
                "id": "rules",
                "module": "01-hard-rules.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "route: text + attached paper => normal publish plus 4.10 Parts 1-3"
                ],
                "id": "0",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "brain parsed once: 641 entries, sharehub=59, latest share-59 key set; live PILLARS read"
                ],
                "id": "A",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "type sharehub (single-paper reading; dentai/photocast closed)"
                ],
                "id": "B.1",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "next number 60 => sharehub/share-60"
                ],
                "id": "B.2",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "founder text supplied in session; title copied verbatim"
                ],
                "id": "B.3",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "de-AI pass: three style-only rewrites applied and recorded"
                ],
                "id": "B.3.5",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "no media field in the sharehub schema and none supplied"
                ],
                "id": "B.4",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "paper attached: Klein et al., DOI 10.1111/jerd.13351, FULL_TEXT text extracted from the PDF"
                ],
                "id": "B.4.7",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "DES basket 2 (research with a determinate source), FULL_TEXT"
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
                  "Pulse drafted on the sharehub precedent (title as link text)"
                ],
                "id": "B.5",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "LiteCast branch inactive (sharehub)"
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
                  "template locked = sharehub/share-59.html (byte-unchanged)"
                ],
                "id": "C.1",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "page cloned from share-59 (structure only), values swapped, GA/preconnects intact, presentation layer built, lint clean"
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
                  "pillar esthetic / veneers-laminates"
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "two capsules: \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + /pillar/esthetic/"
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "sharehub/index.html top list item added"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "before/after meta table printed, all rows OK"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "git diff --quiet -- sharehub/share-59.html empty"
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
                "evidence": [
                  "Drive filing done by the founder; drive_id 1t4GxA8iJsDsr8XDdBXs0K8KnmJr-ReF_, no write performed"
                ],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "catalog P2967 appended (2132 papers), enrichment row present, coverage green"
                ],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "first-author credit Patrick Klein -> DOI on the page"
                ],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "started"
              },
              {
                "evidence": [],
                "id": "C.4.7",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "pending"
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
            "validation": []
          }
        },
        {
          "evidence": [
            "founder in session: \u00ab\u0627\u0635\u0644\u0627\u062d \u06a9\u0646\u00bb for u9 and u46 (both proposals applied verbatim); re-measured only u9,u46 (sweeper+judge, --vote --base): both MATCHES, 35/35, score 100 HIGH"
          ],
          "kind": "part_3b_answers"
        },
        {
          "evidence": [
            "sharehub/share-60.html first <p> is the founder's own opening paragraph"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder text supplied at intake (first paragraph of the page body)"
        },
        {
          "english": {
            "evidence": [
              "cloned from sharehub/en/share-59.html, body translated, noindex follow, presentation_lint clean"
            ],
            "path": "sharehub/en/share-60.html",
            "status": "ready"
          },
          "evidence": [
            "all agent-side steps through C.6 closed"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "DES 80/A; Fidelity 35/35 MATCHES (100, HIGH), --accept exit 0; M3b answered"
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
                "pillar esthetic / veneers-laminates"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "4.7 at cap; 4.8 seven inline links; 4.9 three capsules, 5/5"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "8 canonical tags, hashtag_ref --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "brain entry at tail, share-59 key set"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "esthetic, ceramics; bundles rejected; 2 exam rows (M2 approved)"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html top line added, bottom line removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "sharehub/en/share-60.html authored, toggles inverse"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "M3b and M2 answered in session; pending_questions empty"
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
      "validation": [
        {
          "kind": "fidelity",
          "result": "sweeper+judge in two isolated tool-less claude -p processes (model claude-fable-5-2, spec sha256 of .dentcast/des-v3.7-knowledge.md as system prompt); judge agreed on all 47 units; --accept exit 0; 33/35 MATCHES, 2 ALTERED (u9,u46 HEDGE_REMOVED), score 97 HIGH; source_conclusion pinned to the paper's last Conclusion sentence; source_text recovered from .dentcast/relay/01-source-des.md",
          "step": "C.4.13"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "read complete: workflows/README.md, modules 01-02, global/README with all selected pages, agent-parity, publish-checkpoints, handoff-tool; module 08 re-read after the founder-requested simplification"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "route: text + attached paper => normal publish plus 4.10 Parts 1-3"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed once: 641 entries, sharehub=59, latest share-59 key set; live PILLARS read"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type sharehub (single-paper reading; dentai/photocast closed)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number 60 => sharehub/share-60"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "founder text supplied in session; title copied verbatim"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "de-AI pass: three style-only rewrites applied and recorded"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no media field in the sharehub schema and none supplied"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "paper attached: Klein et al., DOI 10.1111/jerd.13351, FULL_TEXT"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES basket 2 (research with a determinate source), FULL_TEXT"
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
          "Pulse drafted on the sharehub precedent (title as link text)"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "LiteCast branch inactive (sharehub)"
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
          "template locked = sharehub/share-59.html (byte-unchanged)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "page cloned from share-59 (structure only), values swapped, presentation layer built, presentation_lint clean"
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
          "pillar esthetic / veneers-laminates"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "two capsules: \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + /pillar/esthetic/"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/index.html top list item added"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "before/after meta table printed, all rows OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- sharehub/share-59.html empty"
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
        "evidence": [
          "Drive filing done by the founder; drive_id 1t4GxA8iJsDsr8XDdBXs0K8KnmJr-ReF_, no write performed"
        ],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "catalog P2967 appended (2132 papers), enrichment row present, coverage green"
        ],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "first-author credit Patrick Klein -> DOI on the page"
        ],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "DES 80/A reused from the accepted record; Fidelity sweeper+judge run locally, --accept exit 0, after founder fixes 35/35 MATCHES (100, HIGH); verify_publish --des-text clean"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.7: strong terms feldspathic-porcelain, lithium-disilicate, bruxism, occlusal-splint all at/over cap (related_cap) => 0 links; zirconia, glass-ceramics borderline, skipped"
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
        "reason": "glossary-publish-only step (cross-link scoped to a new glossary slug); this is a sharehub page",
        "status": "skipped"
      },
      {
        "evidence": [
          "4.8: 7 inline links (feldspathic-porcelain, lithium-disilicate, zirconia, bruxism, occlusal-splint glossary; dentai-30 on \u00ab\u0628\u0627\u0646\u062f \u0628\u0647 \u0639\u0627\u062c\u00bb; share-8 on \u00ab\u0622\u0645\u0627\u062f\u0647\u200c\u0633\u0627\u0632\u06cc \u062f\u0646\u062f\u0627\u0646 \u0628\u0631\u0627\u06cc \u0644\u0645\u06cc\u0646\u062a\u00bb); glass-ceramics skipped borderline; units identical before/after"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.9: 3 free slots filled (dentai-30, share-8, insight-121), now 5/5; share-27, notecast-19, notecast-38 not placed (cap)"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.11: 4 authored DefinedTerms c1-c4 in plus/faq-corpus.json"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.12: 6 binary standalone questions with verdict-first answers; 4.12-b evaluated at 5.6"
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
          "5.0: 8 canonical tags, all reused, no mint (#\u0645\u0631\u0648\u0631_\u0645\u0646\u0627\u0628\u0639 #\u0644\u0645\u06cc\u0646\u06cc\u062a_\u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc #\u0627\u0646\u062a\u062e\u0627\u0628_\u0645\u062a\u0631\u06cc\u0627\u0644 #\u0628\u0642\u0627\u06cc_\u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 #\u0644\u06cc\u062a\u06cc\u0648\u0645_\u062f\u06cc_\u0633\u06cc\u0644\u06cc\u06a9\u0627\u062a #\u062d\u0641\u0638_\u0645\u06cc\u0646\u0627 #\u0628\u0631\u0627\u06a9\u0633\u06cc\u0633\u0645 #\u0627\u0633\u067e\u0644\u06cc\u0646\u062a); hashtag_ref --check OK; P2967 reachable (\u0628\u0642\u0627\u06cc \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 9/12, \u0644\u06cc\u062a\u06cc\u0648\u0645 \u062f\u06cc \u0633\u06cc\u0644\u06cc\u06a9\u0627\u062a 4/12, \u0644\u0645\u06cc\u0646\u06cc\u062a \u0633\u0631\u0627\u0645\u06cc\u06a9\u06cc 12/12) with no bridge edit; build_cabinet_papers --check OK; page 4th of 4 under #\u0628\u0642\u0627\u06cc_\u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "5: brain entry appended at the tail with the share-59 key set; title copied from the page h1, caption = the page meta description"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "5.5: pillar esthetic / veneers-laminates recorded as decided at 2.4; capsule /pillar/esthetic/ matches"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "5.6: placed in esthetic (after insight-121) and ceramics (after dentai-30); fixed-pros and biomimetic also STRONG but not placed (two-pathway cap); 4.12-b: M2 two MCQs approved by the founder in session (\u00ab\u062f\u0648\u062a\u0627 \u0633\u0648\u0627\u0644 \u062a\u0627\u06cc\u06cc\u062f\u00bb), rows r-\u2026 written, validate_exam_questions passes"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "5.6-b: bundle-laminate \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f5: 8 steps already); bundle-ceramic-select \u0631\u062f \u0634\u062f (\u0646\u0627\u0645\u0637\u0645\u0626\u0646: \u06af\u06cc\u062a \u06f3\u060c depth on a represented concept); bundle-ceramic-cement \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f3: not a cementation topic)"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.6: Pulse updated (7 lines), English mirror + inverse toggles on disk, ten-scope editorial lock recorded"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/cabinet-enrichment/results.jsonl",
      ".dentcast/relay/HANDOFF-share-60.md",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast_cabinet_enrichment.json",
      "dentcast_cabinet_full_catalog.enriched.json",
      "dentcast_cabinet_full_catalog.json",
      "index.html",
      "plus/assistant-tags.json",
      "plus/cabinet-papers.json",
      "plus/cabinet-search.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json",
      "sharehub/en/share-60.html",
      "sharehub/index.html",
      "sharehub/share-60.html"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: sharehub/share-60.html, sharehub/en/share-60.html, index.html, dentcast-brain.json, dentcast-hashtag-reference.json, plus/des-scores.json, plus/faq-corpus.json, plus/exam-questions.json, plus/pathways.json, plus/cabinet-papers.json, plus/cabinet-search.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
