# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-99"
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
    "category": "clinical",
    "content_id": "insight/insight-99",
    "context": {
      "approvals": [
        {
          "decision": "\u062a\u0631\u0627\u0634 \u06a9\u0645\u062a\u0631 \u0647\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0639\u0646\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u0628\u0647\u062a\u0631 \u0646\u06cc\u0633\u062a!",
          "evidence": [
            "Author supplied exact title in current request; unchanged by landing correction."
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "Continue same publication through Push2; no merge authorized.",
          "evidence": [
            "Author explicitly requested \u0628\u0631\u0648 \u062a\u0627 \u067e\u0648\u0634 \u06f2 after verified Push1."
          ],
          "scope": "publication-scope",
          "status": "confirmed"
        },
        {
          "decision": "Proceed with proposed canonical metadata; include restoration/r\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 search synonyms. Author explicitly instructed uninterrupted execution and routine decisions for this publication.",
          "evidence": [
            "Author corrected Persian \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 search coverage, then explicitly directed continuation without repeated routine approval stops."
          ],
          "scope": "hashtags-keywords",
          "status": "confirmed"
        },
        {
          "decision": "{\"prompt_fa\": \"\u06a9\u062f\u0627\u0645 \u0631\u0648\u06cc\u06a9\u0631\u062f \u0628\u0627 \u062a\u0631\u0627\u0634 \u0645\u062d\u0627\u0641\u0638\u0647\u200c\u06a9\u0627\u0631\u0627\u0646\u0647\u0654 \u0627\u0635\u0648\u0644\u06cc \u0633\u0627\u0632\u06af\u0627\u0631 \u0627\u0633\u062a\u061f\", \"options\": [\"\u062a\u0631\u0627\u0634 \u0628\u0627 \u06cc\u06a9 \u0645\u0642\u062f\u0627\u0631 \u062b\u0627\u0628\u062a \u0628\u0631\u0627\u06cc \u0647\u0645\u0647\u0654 \u0645\u0648\u0627\u062f\", \"\u062a\u0631\u0627\u0634 \u06a9\u0645\u062a\u0631 \u0627\u0632 \u0646\u06cc\u0627\u0632 \u0628\u0631\u0627\u06cc \u062d\u0641\u0638 \u0646\u0633\u062c \u062f\u0646\u062f\u0627\u0646\", \"\u062a\u0631\u0627\u0634 \u0645\u062a\u0646\u0627\u0633\u0628 \u0628\u0627 \u0627\u0644\u0632\u0627\u0645\u0627\u062a \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u0645\u0646\u062a\u062e\u0628\", \"\u062a\u0631\u0627\u0634 \u0628\u06cc\u0634\u062a\u0631 \u0627\u0632 \u0646\u06cc\u0627\u0632 \u0628\u0631\u0627\u06cc \u0627\u0637\u0645\u06cc\u0646\u0627\u0646 \u0627\u0632 \u062f\u0648\u0627\u0645\"], \"correct\": 2}",
          "evidence": [
            "Author explicitly approved this exact question and key C in current chat: \u0627\u06cc\u0646 \u0633\u0648\u0627\u0644 \u062a\u0627\u06cc\u06cc\u062f."
          ],
          "scope": "exam-questions",
          "status": "confirmed"
        },
        {
          "decision": "No independent caption string supplied; unchanged author opening paragraph is reused as description.",
          "evidence": [
            "Original author-submitted full Clinical Insight, no separate caption request."
          ],
          "scope": "caption",
          "status": "not_required"
        }
      ],
      "decisions": [
        {
          "evidence": [
            "First paragraph copied verbatim from author; no agent-authored lead"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "author-submitted first body paragraph"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "from_step": "C.2.6",
          "kind": "dependency_invalidation_v1",
          "reason": "Corrected landing ownership after searching actual tools: insight/index.html is hand-maintained, not builder-owned. Reexecute landing and downstream checks; standard-library body/meta checks passed after optional bs4 unavailable.",
          "superseded": {
            "approvals": [
              {
                "decision": "\u062a\u0631\u0627\u0634 \u06a9\u0645\u062a\u0631 \u0647\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0639\u0646\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u0628\u0647\u062a\u0631 \u0646\u06cc\u0633\u062a!",
                "evidence": [
                  "Author supplied title in publication request"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "Prepare and deliver through Push 1 only; no Push 2, Actions dispatch or merge",
                "evidence": [
                  "Author prior explicit scope retrieved for this same publication"
                ],
                "scope": "publication-scope",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [
              {
                "ref": "author-submitted Clinical Insight text and two attached JPEG diagrams"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "Insight landing is builder-owned: tools/build_section_indexes.py; will regenerate after brain entry at C.8, outside requested Push1 scope."
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Audited title, description, canonical, OG, Twitter, JSON-LD and visible dates; predecessor date 2026-10-22 replaced by 2026-10-28, no stale predecessor identity."
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Template insight-98 SHA256 unchanged from C.1."
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
                "reason": "Clinical Insight, not NoteCast; no parent episode.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Clinical Insight, not episode/NoteCast pair; no mirrored evidence credit.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Clinical Insight, not Promptologist; no series prev/next.",
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
        },
        {
          "from_step": "C.2",
          "kind": "dependency_invalidation_v1",
          "reason": "Final mandatory English-toggle label changes decoded page text outside the unchanged author prose. Conservatively invalidate and reverify C.2 onward, preserving actual prepared bytes and original author approvals in audit; no clinical content or title changed.",
          "superseded": {
            "approvals": [
              {
                "decision": "\u062a\u0631\u0627\u0634 \u06a9\u0645\u062a\u0631 \u0647\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0639\u0646\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u0628\u0647\u062a\u0631 \u0646\u06cc\u0633\u062a!",
                "evidence": [
                  "Author supplied exact title in current request; unchanged by landing correction."
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "Continue same publication through Push2; no merge authorized.",
                "evidence": [
                  "Author explicitly requested \u0628\u0631\u0648 \u062a\u0627 \u067e\u0648\u0634 \u06f2 after verified Push1."
                ],
                "scope": "publication-scope",
                "status": "confirmed"
              },
              {
                "decision": "Proceed with proposed canonical metadata; include restoration/r\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 search synonyms. Author explicitly instructed uninterrupted execution and routine decisions for this publication.",
                "evidence": [
                  "Author corrected Persian \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 search coverage, then explicitly directed continuation without repeated routine approval stops."
                ],
                "scope": "hashtags-keywords",
                "status": "confirmed"
              },
              {
                "decision": "{\"prompt_fa\": \"\u06a9\u062f\u0627\u0645 \u0631\u0648\u06cc\u06a9\u0631\u062f \u0628\u0627 \u062a\u0631\u0627\u0634 \u0645\u062d\u0627\u0641\u0638\u0647\u200c\u06a9\u0627\u0631\u0627\u0646\u0647\u0654 \u0627\u0635\u0648\u0644\u06cc \u0633\u0627\u0632\u06af\u0627\u0631 \u0627\u0633\u062a\u061f\", \"options\": [\"\u062a\u0631\u0627\u0634 \u0628\u0627 \u06cc\u06a9 \u0645\u0642\u062f\u0627\u0631 \u062b\u0627\u0628\u062a \u0628\u0631\u0627\u06cc \u0647\u0645\u0647\u0654 \u0645\u0648\u0627\u062f\", \"\u062a\u0631\u0627\u0634 \u06a9\u0645\u062a\u0631 \u0627\u0632 \u0646\u06cc\u0627\u0632 \u0628\u0631\u0627\u06cc \u062d\u0641\u0638 \u0646\u0633\u062c \u062f\u0646\u062f\u0627\u0646\", \"\u062a\u0631\u0627\u0634 \u0645\u062a\u0646\u0627\u0633\u0628 \u0628\u0627 \u0627\u0644\u0632\u0627\u0645\u0627\u062a \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 \u0645\u0646\u062a\u062e\u0628\", \"\u062a\u0631\u0627\u0634 \u0628\u06cc\u0634\u062a\u0631 \u0627\u0632 \u0646\u06cc\u0627\u0632 \u0628\u0631\u0627\u06cc \u0627\u0637\u0645\u06cc\u0646\u0627\u0646 \u0627\u0632 \u062f\u0648\u0627\u0645\"], \"correct\": 2}",
                "evidence": [
                  "Author explicitly approved this exact question and key C in current chat: \u0627\u06cc\u0646 \u0633\u0648\u0627\u0644 \u062a\u0627\u06cc\u06cc\u062f."
                ],
                "scope": "exam-questions",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [
              {
                "ref": "author-submitted Clinical Insight text and two attached JPEG diagrams"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "Cloned clinical-98 chrome/schema, swapped supplied title/subtitle/body verbatim, dates 2026-10-28, .org identity preserved, WebP after body paragraphs 4 and 6; no phantom English link. Exact body and JSON-LD checks pass."
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
                "reason": "Not LiteCast; specialist in-body links at C.4.8.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": "Not LiteCast; specialist related links at C.4.9.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Clear semantic choice: fixed-pros / preparation; general preparation requirements, not specific ceramic materials or occlusal therapy."
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Added exactly one related section with glossary and /pillar/fixed-pros/ nav capsules, 2 of 5 slots."
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Added one link to static insight/index.html, newest first; exact author title; CRLF and other bytes preserved. Corrected earlier builder attribution."
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Standard-library audit passed for title, author-derived description, OG, Twitter, canonical, all JSON-LD dates and visible dates. Old 98 identity/date removed; new 99 and 2026-10-28 consistent."
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Original insight-98 SHA256 equals C.1 lock."
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
                "reason": "Clinical Insight, not NoteCast.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Clinical Insight, not episode/NoteCast pair.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Clinical Insight, not Promptologist.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Semantic glossary review: retention/resistance substantively discussed, both pages already at five-link cap; no edits allowed. No Structural Durability glossary term; other terms too tangential."
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
                "reason": "Not glossary publication; no new term for scoped backfill.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Fresh semantic pass: first body occurrence of tooth preparation\u2192episode113; first technical \u06af\u06cc\u0631\u2192retention and \u0645\u0642\u0627\u0648\u0645\u062a\u2192resistance. Only anchor wrappers changed; stripped text identical, targets exist; before/after hashes verified."
                ],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Fresh semantic related-content pass selected Goodacre episode113/114 and overlay-preparation episode55; verified targets exist, only three capsules appended, total five links; actual hashes and verbatim body verified."
                ],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": "No paper attached; no Drive filing.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": "No paper attached; no cabinet ingestion.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": "No paper attached; no DOI credit.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Wrote three atomic authored DefinedTerms in FAQ corpus: structural durability, conservative preparation, inadequate-reduction overcontour; unique stable IDs, definitions grounded only in supplied body."
                ],
                "id": "C.4.11",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Wrote four self-contained binary FAQ questions with explicit verdict-first answers, grounded in original article; flashcard answers distinct. Pathway exam gate evaluated at C.5.6."
                ],
                "id": "C.4.12",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "DES3.5 COMMENTARY from exact own body: reasoning4, evidence relationship0, bounded scope3, landing declaration3, base5 =15/E. Quotes/arithmetic/band/schema validated; self-commentary Fidelity null. Scoped byte insertion preserved mixed newline source."
                ],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.4.14",
                "module": "09-challenge.md",
                "reason": "Ordinary explanatory article, not Challenge.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Reused canonical #\u0627\u06cc\u0646\u0633\u0627\u06cc\u062a #\u062a\u0631\u0627\u0634_\u062f\u0646\u062f\u0627\u0646 #\u062f\u0648\u0627\u0645_\u062a\u0631\u0645\u06cc\u0645; applied author-requested \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 synonyms to existing \u062f\u0648\u0627\u0645_\u062a\u0631\u0645\u06cc\u0645 concept via --say, sync compiled aliases, query \u062f\u0648\u0627\u0645 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 resolves rank1. Keywords retain Persian \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 and Structural Durability."
                ],
                "id": "C.5.0",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Appended clinical-99 at absolute brain tail with same keys/order as clinical-98; original title and author first-paragraph caption, canonical three tags, supplied/approved restoration keywords, fixed-pros/preparation unchanged. --sync and --check pass."
                ],
                "id": "C.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Verified fixed-pros/preparation exactly equals locked C.2.4 decision and capsule destination. Hashtag sync/check passed; plus-index and assistant-tags changes reviewed as canonical generated outputs."
                ],
                "id": "C.5.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Placed in fixed-pros after dentcast-plus/video-1 and biomimetic after chairside/chairside-35, milestone false. Added one founder-approved exam MCQ r-fbae8c4d key C; exact chat approval recorded. Validator:0 errors, 3 unrelated pre-existing warnings. No third pathway, no series split."
                ],
                "id": "C.5.6",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Reviewed bundle-bonding, bundle-biomimetic, bundle-crown-prep; each rejected at mechanical gate1 because insight folder is ineligible; no bundle or shared asset changed."
                ],
                "id": "C.5.6-b",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.6",
                "module": "11-build-and-version.md",
                "reason": null,
                "status": "started"
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
                "evidence": [
                  "Verified fixed-pros after dentcast-plus/video-1 and biomimetic after chairside/chairside-35; no third placement or split series. Exam proposal prepared from author body, 4 comparable-length options, one correct; not written without founder approval."
                ],
                "scope": "C.5.6 placements"
              }
            ]
          }
        },
        {
          "english": {
            "evidence": [
              "Final FA/EN pair reviewed on current bytes; both exact reciprocal targets exist and no clinical content added."
            ],
            "path": "insight/en/insight-99.html",
            "status": "ready"
          },
          "evidence": [
            "Full ten-scope editorial close review on current prepared artifacts; all scientific, semantic, metadata and author decisions resolved before Push2."
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "plus/des-scores.json: own-text COMMENTARY15/E, exact quotes and arithmetic/band/schema validated; no Fidelity owed."
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Author submitted complete explanatory prose; no challenge markup or private answer."
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "Locked fixed-pros/preparation verified unchanged against live main taxonomy."
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "Exact body anchors to Goodacre113, retention,resistance; five related capsules including2 nav and113/114/55; glossary inbound targets atcap5."
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "Three canonical tags reused; author correction \u062f\u0648\u0627\u0645 \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 aliases compiled to \u062f\u0648\u0627\u0645_\u062a\u0631\u0645\u06cc\u0645; sync/check and rank1 simulation passed."
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "clinical-99 physically last in brain, same schema as98, exact author title and first-paragraph description; no en brain entry."
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "fixed-pros after video-1 and biomimetic after chairside35; approved exam r-fbae8c4d keyC, validator0errors; three bundles rejected gate1."
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html: exactly7 items, title-only new item first and priorfirst6 retained."
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "insight/en/insight-99.html: ten translated paragraphs, two figures, reciprocal toggles, Englishchrome, noindex, zero hreflang, valid schema, original chrome unchanged."
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "Exact supplied title and prose retained; explicit Push2 instruction, restoration-synonym correction and exact exam-question/keyC approval recorded; no pending question."
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
          "ref": "author-submitted Clinical Insight text and two attached JPEG diagrams"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "evidence": [
            "FA and EN JSON-LD parse, GA4 once perpage, two images perpage decode, no phantom toggles; Pulse7 lines, newtitle first; approved bank validator0errors."
          ],
          "scope": "final editorial checks before Push2"
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Read active routers, global core all six pages, parity, checkpoint protocol, full modules 01\u201305; authorized scope ends at C.4.9."
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Normal page route: supplied full text and two JPEG images; no paper attached."
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed entire flat brain; latest clinical-98, contiguous clinical 1\u201398; inspected live main PILLARS, fixed-pros preparation best fit."
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Author explicitly requested Clinical Insight; mapped to clinical and insight/."
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified contiguous 1\u201398 and absent insight-99; announced next identifier."
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Full author-supplied title, subtitle, ten body paragraphs retained verbatim in local input."
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Reviewed phrasing; clinical contrasts substantive, no genuine style change needed. Original retained."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Two attached 1536x804 diagrams converted WebP quality92, verified decode; place under insufficient-thickness paragraph and anatomical-reduction paragraph."
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "No research paper attached; paper branch inapplicable."
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Author clinical commentary, no retrievable research citation; COMMENTARY track owed after Push1."
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Author requested publication of a complete explanatory Clinical Insight, not a question-body assessment; ordinary post, no challenge."
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse proposal uses title-only precedent: \u062a\u0631\u0627\u0634 \u06a9\u0645\u062a\u0631 \u0647\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0639\u0646\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u0628\u0647\u062a\u0631 \u0646\u06cc\u0633\u062a! links to /insight/insight-99.html; deferred until authorized later cut."
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
        "reason": "Clinical Insight category; LiteCast isolated track inactive.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; brain typed clinical source.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; specialist linking applies.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; clone clinical predecessor.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; general publication track.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Locked latest same-category template insight/insight-98.html; SHA256 stored for unchanged-template check."
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Current page verified: exact ten original paragraphs, two decoded WebP diagrams, same-type chrome/schema, .org canonical, GA4/preconnect, final English toggle with real target. No clinical prose changed."
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
        "reason": "Not LiteCast; specialist inline links apply.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; specialist related section applies.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Verified original fixed-pros/preparation choice unchanged, matches live taxonomy."
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "One related section; two canonical nav capsules retained; later enrichment also reviewed."
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Static Insight landing links new article once with exact supplied title; only row insertion, CRLF retained."
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Rechecked metadata/OG/Twitter/JSON-LD/visible dates, identity99 and date2026-10-28; no predecessor residue."
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Original template SHA256 remains unchanged from C.1."
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
        "reason": "Clinical Insight, not NoteCast.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Clinical Insight, not episode/NoteCast pair.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Clinical Insight, not ordered Promptologist series.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Fresh reviewed glossary meanings: retention/resistance are exact discussed concepts; both existing glossary related sections at cap5, untouched. No Structural Durability glossary term exists."
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
        "reason": "No new glossary term published.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Reviewed first-occurrence technical anchors for preparation, retention, resistance; body decoded text exactly original, existing real targets."
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Reverified whole-brain semantic choice: Goodacre113/114 and overlay-preparation55; all targets real, two nav plus three related capsules, cap5."
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "No attached paper, no Drive filing.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No attached paper, no cabinet ingestion.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No attached paper, no DOI credit.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Verified3 authored atomic cards in corpus, unique IDs and no FAQ copies; actual artifact preserved, no need regenerate unchanged definitions."
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified4 standalone binary questions, verdict-first answers, grounded in original article; pathway MCQ independently approved and checked at C.5.6."
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Existing own-body COMMENTARY evaluation revalidated on unchanged exact source:15/E, reasoning4+evidence0+scope3+declaration3+base5. Exact quotation/arithmetic/band/schema pass; no Fidelity owed for self-commentary. No research claims or DOI invented."
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.14",
        "module": "09-challenge.md",
        "reason": "Ordinary explanatory post, no Challenge.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Canonical three tags reused; author-requested \u0631\u0633\u062a\u0648\u0631\u06cc\u0634\u0646 synonym compiled into same durability concept, search resolves rank1; no duplicate concept. Prior sync/check successful, artifacts preserved."
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified clinical-99 physical tail, exact same key order/shape as98, original title and author-derived description, Persian restoration keywords and canonical tags."
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Confirmed original fixed-pros/preparation unchanged and page pillar capsule consistent."
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified two full pathways at exact selected anchors, no third/series split; founder-approved MCQ r-fbae8c4d matches chat proposal and keyC exactly. Bank validator0 errors; three legacy warnings outside this article."
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle-bonding, bundle-biomimetic and bundle-crown-prep reviewed and excluded at mechanical gate1 (Insight type); no bundle or shared asset edit."
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified actual title-only Pulse update:7 items, new firstline, previousfirst6 kept. Full ten-scope editorial lock recorded; English authored/reviewed with reciprocal toggles and noindex; all founder approvals and exam keyC resolved. No judgment work left for mechanical runner."
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
      "glossary/glossary.json",
      "index.html",
      "insight/en/insight-99.html",
      "insight/index.html",
      "insight/insight-98.html",
      "insight/insight-99.html",
      "insight/insight99-1.webp",
      "insight/insight99-2.webp",
      "plus/assistant-tags.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, plus/assistant-tags.json, plus/content-index.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
