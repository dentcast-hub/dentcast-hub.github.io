# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-101"
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
    "category": "clinical",
    "content_id": "insight/insight-101",
    "context": {
      "approvals": [
        {
          "decision": "\u0627\u062e\u062a\u0644\u0627\u0641 \u0633\u0637\u062d \u0644\u062b\u0647 \u062f\u0631 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644: \u06a9\u0648\u062a\u0627\u0647 \u0646\u0634\u0627\u0646 \u062f\u0627\u062f\u0646 \u0631\u0648\u06a9\u0634 \u0628\u0627 \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644",
          "evidence": [
            "Founder approval #1 in queue/03-insight-gingival-level/00-\u0648\u0636\u0639\u06cc\u062a.md; title remains unchanged in final page."
          ],
          "scope": "approved title",
          "status": "confirmed"
        },
        {
          "decision": "\u0644\u062b\u0647\u200c\u06cc \u06cc\u06a9\u06cc \u0627\u0632 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627\u062a\u0631 \u0627\u0633\u062a \u0648 \u062a\u0627\u062c \u0628\u0627\u0644\u06cc\u0646\u06cc \u0622\u0646 \u0628\u0644\u0646\u062f\u062a\u0631 \u062f\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f. \u0631\u0648\u06a9\u0634 \u0631\u0627 \u0686\u0637\u0648\u0631 \u0637\u0631\u0627\u062d\u06cc \u06a9\u0646\u06cc\u0645 \u062a\u0627 \u0627\u062e\u062a\u0644\u0627\u0641 \u0637\u0648\u0644 \u062f\u0648 \u062f\u0646\u062f\u0627\u0646 \u06a9\u0645\u062a\u0631 \u0628\u0647 \u0686\u0634\u0645 \u0628\u06cc\u0627\u06cc\u062f\u061f",
          "evidence": [
            "Founder approval #2 in queue/03-insight-gingival-level/00-\u0648\u0636\u0639\u06cc\u062a.md; caption remains unchanged in final page metadata."
          ],
          "scope": "approved caption",
          "status": "confirmed"
        },
        {
          "decision": "No authored lead remains; use the original queue article as the opening text, per founder instruction.",
          "evidence": [
            "Founder instruction in current conversation to delete the added paragraph and use the original text first paragraph."
          ],
          "scope": "authored Persian opening paragraph and English mirror",
          "status": "not_required"
        },
        {
          "decision": "Keep the approved Episode 13 link at the first technical mention of line angles in the original article.",
          "evidence": [
            "Founder approved adding the Episode 13 link; current instruction restores original article, and link now marks its first technical occurrence."
          ],
          "scope": "inline link to episode 13",
          "status": "confirmed"
        },
        {
          "decision": "No authored introduction remains in the article.",
          "evidence": [
            "Founder instruction in current conversation to delete the added paragraph and use the original text first paragraph."
          ],
          "scope": "authored-intro",
          "status": "not_required"
        }
      ],
      "decisions": [
        {
          "decision": "clinical insight; no paper; COMMENTARY DES 15/100 band E; not a challenge",
          "evidence": [
            "queue/03-insight-gingival-level/00-\u0648\u0636\u0639\u06cc\u062a.md",
            "queue/03-insight-gingival-level/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md"
          ],
          "scope": "routing"
        },
        {
          "decision": "queue item 03 selected by smallest ready NN",
          "evidence": [
            "queue branch ready status"
          ],
          "scope": "oldest ready item"
        },
        {
          "decision": "clinical-101; next live clinical ID after clinical-100",
          "evidence": [
            "dentcast-brain.json clinical-100"
          ],
          "scope": "content identity"
        },
        {
          "decision": "fixed-pros / crowns-onlays per current live PILLARS taxonomy",
          "evidence": [
            "tools/build_pillar.py"
          ],
          "scope": "pillar"
        },
        {
          "decision": "#\u0644\u0627\u06cc\u0646_\u0627\u0646\u06af\u0644; second resolving page insight-72 verified; four aliases and cabinet bridge decision remain to record",
          "evidence": [
            "queue/03-insight-gingival-level/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md",
            "insight/insight-72.html"
          ],
          "scope": "mint tag"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "decision": "insight101-1.webp and insight101-2.webp, following live multi-image naming pattern",
          "evidence": [
            "insight/insight89-1.webp",
            "insight/insight89-2.webp",
            "queue/03-insight-gingival-level/03-\u062a\u0635\u0627\u0648\u06cc\u0631/\u062a\u0635\u0627\u0648\u06cc\u0631.md"
          ],
          "scope": "image asset naming"
        },
        {
          "decision": "fixed-pros / crowns-onlays, based on live PILLARS and founder-approved queue option A",
          "evidence": [
            "tools/build_pillar.py PILLARS[fixed-pros]",
            "queue/03-insight-gingival-level/07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md approval #4"
          ],
          "scope": "pillar/subtopic"
        },
        {
          "evidence": [
            "Founder directed deletion of the added lead and restoration of the original queue article as the opening text; current final body prose exactly matches the frozen source text."
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/03-insight-gingival-level/01-\u0645\u062a\u0646.md; its original first paragraph is the opening paragraph of the final page."
        },
        {
          "decision": "Create the English page after reading en-version.md and module 12 Phase D plus module 11 C.6 instructions, before second delivery.",
          "evidence": [
            "publish-checkpoints.md JIT English rule",
            "queue/03-insight-gingival-level/06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md"
          ],
          "scope": "English mirror timing"
        },
        {
          "from_step": "C.2",
          "kind": "dependency_invalidation_v1",
          "reason": "Founder explicitly requested removal of the agent-authored lead, restoration of the original queue article as the opening text, and reuse of its prior DES. Page prose was restored exactly to queue 01-\u0645\u062a\u0646.md; retain the approved episode link at the first source-text occurrence. Invalidate dependent semantic and later step evidence, then re-establish required approvals and validations against the final page.",
          "superseded": {
            "approvals": [
              {
                "decision": "\u0627\u062e\u062a\u0644\u0627\u0641 \u0633\u0637\u062d \u0644\u062b\u0647 \u062f\u0631 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644: \u06a9\u0648\u062a\u0627\u0647 \u0646\u0634\u0627\u0646 \u062f\u0627\u062f\u0646 \u0631\u0648\u06a9\u0634 \u0628\u0627 \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644",
                "evidence": [
                  "queue/03-insight-gingival-level/00-\u0648\u0636\u0639\u06cc\u062a.md approval #1",
                  "queue/03-insight-gingival-level/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md"
                ],
                "scope": "approved title",
                "status": "confirmed"
              },
              {
                "decision": "\u0644\u062b\u0647\u200c\u06cc \u06cc\u06a9\u06cc \u0627\u0632 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627\u062a\u0631 \u0627\u0633\u062a \u0648 \u062a\u0627\u062c \u0628\u0627\u0644\u06cc\u0646\u06cc \u0622\u0646 \u0628\u0644\u0646\u062f\u062a\u0631 \u062f\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f. \u0631\u0648\u06a9\u0634 \u0631\u0627 \u0686\u0637\u0648\u0631 \u0637\u0631\u0627\u062d\u06cc \u06a9\u0646\u06cc\u0645 \u062a\u0627 \u0627\u062e\u062a\u0644\u0627\u0641 \u0637\u0648\u0644 \u062f\u0648 \u062f\u0646\u062f\u0627\u0646 \u06a9\u0645\u062a\u0631 \u0628\u0647 \u0686\u0634\u0645 \u0628\u06cc\u0627\u06cc\u062f\u061f",
                "evidence": [
                  "queue/03-insight-gingival-level/00-\u0648\u0636\u0639\u06cc\u062a.md approval #2",
                  "queue/03-insight-gingival-level/02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md"
                ],
                "scope": "approved caption",
                "status": "confirmed"
              },
              {
                "decision": "FA: \u0648\u0642\u062a\u06cc \u0644\u062b\u0647\u0654 \u06cc\u06a9\u06cc \u0627\u0632 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627\u062a\u0631 \u0627\u0633\u062a\u060c \u062a\u0627\u062c\u0634 \u0628\u0644\u0646\u062f\u062a\u0631 \u062f\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f. \u0627\u06cc\u0646 \u06a9\u06cc\u0633 \u0646\u0634\u0627\u0646 \u0645\u06cc\u200c\u062f\u0647\u062f \u0686\u0637\u0648\u0631 \u0647\u0645\u0633\u0627\u0646\u200c\u06a9\u0631\u062f\u0646 \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u200c\u0647\u0627 \u0627\u062e\u062a\u0644\u0627\u0641 \u0638\u0627\u0647\u0631\u06cc \u0637\u0648\u0644 \u0631\u0627 \u06a9\u0645\u062a\u0631 \u0645\u06cc\u200c\u06a9\u0646\u062f. EN: When the gingiva around one central incisor sits higher, its crown looks longer. This case shows how matching the line angles can reduce the perceived length difference.",
                "evidence": [
                  "Founder approval in current conversation after exact Persian and English wording was shown"
                ],
                "scope": "authored Persian opening paragraph and English mirror",
                "status": "confirmed"
              },
              {
                "decision": "Add one body link to /episodes/episode-13.html at the first technical occurrence of \u00ab\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u00bb.",
                "evidence": [
                  "Founder chose \u201c\u0627\u0636\u0627\u0641\u0647 \u06a9\u0646\u201d after reviewing the episode target and proposed placement in the conversation."
                ],
                "scope": "inline link to episode 13",
                "status": "confirmed"
              },
              {
                "decision": "Approve the exact short Persian opening paragraph and its English mirror.",
                "evidence": [
                  "Founder selected \u201c\u062a\u0623\u06cc\u06cc\u062f \u0645\u06cc\u200c\u06a9\u0646\u0645\u201d after the exact Persian and English lead text was shown in the conversation."
                ],
                "scope": "authored-intro",
                "status": "confirmed"
              }
            ],
            "delivery": [
              {
                "evidence": [
                  "Remote cut-1 branch head observed at 253acf447126a90e75357b98e503468b32b2e847 after exact tree upload and ref creation.",
                  "PR #1067 opened with exact head/base SHA and branch refs."
                ],
                "scope": "delivery_1"
              }
            ],
            "inputs": [
              {
                "reference": "queue/03-insight-gingival-level/SHA256SUMS",
                "validation": "all files pass sha256sum -c; title/text/media/English/DES/question/keyword assets reviewed"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "Built fa Insight 101 body from frozen queue source, placed two approved images at the original markers, and preserved template structure and domain."
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
                "reason": "Not a LiteCast publication; post-page LiteCast-only semantic linking is inapplicable to this clinical insight.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": "Not a LiteCast publication; post-page LiteCast-only related linking is inapplicable to this clinical insight.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Read live tools/build_pillar.py PILLARS; assigned fixed-pros / crowns-onlays based on crown design subject and founder-approved option A from queue."
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "The existing \u201c\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u201d section contains the two required typed-brain capsules; pillar capsule now points to /pillar/fixed-pros/ and section remains unique with 5 items."
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "The Insight landing page is a hand-maintained static list; inserted exactly one new newest-first link with the approved page title."
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Before/after date audit: cloned fa/en template had 2026-10-30; new fa/en pages now use 2026-11-01 in published/review dates and JSON-LD; canonical paths are insight-101; no divergent dates remain."
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Recomputed insight-100 template SHA-256: 5fed0099a72cc7c3b52cd2c5838bb608dd73273e27a83ddcb14e1fee3465ef47; unchanged and equal to the locked source."
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
                "reason": "Not an episode/series publication; the episode-specific taxonomy/navigation branch is inapplicable to a standalone clinical insight.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Not an episode/series publication; the episode-specific taxonomy/navigation branch is inapplicable to a standalone clinical insight.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "Not an episode/series publication; the episode-specific taxonomy/navigation branch is inapplicable to a standalone clinical insight.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Reviewed all 109 glossary registry entries semantically. Candidate Smile Design is broad and its page already has 5 links; Crown Lengthening is surgical and does not match this visual method; Subgingival Margin is not discussed. No glossary back-links were added; new page SHA-256 before/after is d0404d2deb26b36d6c4d9bd4e8f6a29ea3dd9bc89b7b40caed21e3725c795bc1."
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
                "reason": "Not a glossary-term publication; scoped new-term-to-existing-body cross-linking is inapplicable.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Fresh semantic analysis covered all 109 glossary entries and 212 episode entries. No glossary target was a clear in-body match; episode 13 (Esthetic Width / Umbrella Effect) was borderline and founder-approved. Added one first-occurrence link on \u00ab\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u200c\u0647\u0627\u00bb in the approved lead. Body SHA-256 before/after: d0404d2deb26b36d6c4d9bd4e8f6a29ea3dd9bc89b7b40caed21e3725c795bc1 \u2192 b3a07e53ab26fd77331c1c25697f009b0da8666a3c9e3abea8529c05c74dbeab."
                ],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Read dentcast-brain.json end-to-end (584 entries) and ranked semantic candidates. Strong matches include clinical-61 (optical illusion in a single anterior crown) and clinical-72 (line angles shaping perceived dimensions); clinical-53 is weaker. The page\u2019s \u201c\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u201d section already has 5 links including its two required capsules, leaving 0 slots. Per cap, no new links added, removed, reordered, or restyled; section remains exactly 5. Page SHA-256 after approved inline link: b3a07e53ab26fd77331c1c25697f009b0da8666a3c9e3abea8529c05c74dbeab. First-cut lead provenance and authored-intro approval are recorded."
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
                "reason": "No attached paper; queue intake Q4.7 explicitly records paperless, founder-approved content.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": "No attached paper; queue intake Q4.7 explicitly records paperless, founder-approved content.",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": "No attached paper; queue intake Q4.7 explicitly records paperless, founder-approved content.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Authored 3 standalone DefinedTerm cards from the article body because no FAQ existed yet. All are source=authored, each atomic and unique-ID; no FAQ answer is copied, and no card/FAQ markup was added to page JSON-LD."
                ],
                "id": "C.4.11",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Added 3 standalone FAQ questions to plus/faq-corpus.json; 2 yes/no entries begin with explicit \u00ab\u062e\u06cc\u0631\u00bb and one open procedural entry describes cervical contour. No article deixis, answers grounded in body, JSON valid, 3 flashcards remain semantically distinct from FAQ."
                ],
                "id": "C.4.12",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Queue des.json SHA256 24446c147540dafd01f697983501aea59cc6bc44f7992569f3e48e9e29045f73 verified against SHA256SUMS. Its provenance records scoring 01-\u0645\u062a\u0646.md at SHA256 513cb0de26cff7a5eba349c40cf3ec20980b11276d245ef5db6daa0cb602f0dd. Final page includes founder-approved new lead and approved Episode 13 link; supplied record is not bound to this final body."
                ],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": "Module 08 Part 1 and supplied-results rule require exact final page body; Part 3 says stale/inconsistent supplied result must be blocked and corrected JSON requested, never silently rerun. Request corrected complete canonical COMMENTARY JSON for final body. No fidelity owed for basket 1.",
                "status": "blocked"
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
                "check": "queue file hashes",
                "result": "all pass"
              },
              {
                "check": "live taxonomy and next clinical id",
                "result": "verified on origin/main at current observed SHA"
              }
            ]
          }
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "reference": "queue/03-insight-gingival-level/SHA256SUMS",
          "validation": "all files pass sha256sum -c; title/text/media/English/DES/question/keyword assets reviewed"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": []
    },
    "external_actions": [
      {
        "evidence": [
          "git push returned: could not read Username for https://github.com: No such device or address"
        ],
        "id": "queue-lock-push-attempt-1",
        "status": "failed",
        "target": "origin/queue: mark queue item 03 as in progress with Codex Work lock"
      },
      {
        "evidence": [
          "GitHub API created queue lock commit 10efaf2147fd18d272f9df679fb5fb95e43dd327"
        ],
        "id": "queue-lock-github-api-attempt-1",
        "status": "completed",
        "target": "dentcast-hub/dentcast-hub.github.io branch queue: commit status and lock for item 03"
      },
      {
        "evidence": [
          "The fixed cut delivery is tracked through the dedicated delivery-boundary protocol, not as a separate external_actions receipt; no push attempted under this receipt."
        ],
        "id": "C.4.9:delivery1-push",
        "status": "not_performed",
        "target": "dentcast-hub/dentcast-hub.github.io branch publish/clinical-101-insight-gingival-level: deliver cut 1 tree after C.4.9"
      },
      {
        "evidence": [
          "PR creation is deferred until after cut 1 is delivered and the next canonical step is started; no PR attempt under this receipt."
        ],
        "id": "C.4.9:create-pr",
        "status": "not_performed",
        "target": "dentcast-hub/dentcast-hub.github.io: open publication PR from publish/clinical-101-insight-gingival-level to main after first delivery"
      },
      {
        "evidence": [
          "PR #1067 opened and read back; head publish/clinical-101-insight-gingival-level at 253acf447126a90e75357b98e503468b32b2e847; base main at 07cabf78bae38f800fc44e3109d4ab6aecb8a054; URL https://github.com/dentcast-hub/dentcast-hub.github.io/pull/1067"
        ],
        "id": "C.4.9:open-pr-attempt-2",
        "status": "completed",
        "target": "dentcast-hub/dentcast-hub.github.io: open publication PR from publish/clinical-101-insight-gingival-level to main at cut-1 SHA 253acf447126a90e75357b98e503468b32b2e847"
      }
    ],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Read complete module 01-hard-rules.md; executed global rules loader --all --list and read every listed section 1\u201310."
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Confirmed queue-origin item 03 is the minimum ready NN; prior PUBLISH-HANDOFF absent on main; fresh origin/main base and active branch established; queue package hashes all pass."
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Intake is locked from queue source: clinical insight, no attached paper, COMMENTARY, non-Challenge; approved founder input files are hash verified and reused as directed by publish-queue.md."
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Queue approval #11: clinical insight / brain type clinical."
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Queue intake 07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627: series none."
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Queue 01-\u0645\u062a\u0646.md exact author-written body hash verified."
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Queue approval #8 and 07 intake: one-time Q3.5 review complete, no changes; do not rewrite."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Queue title/caption and two approved WebP images, captions, alt, and positions verified."
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": "No attached paper; founder-approved queue intake explicitly says paperless.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Queue approval #8: COMMENTARY; no external paper, so Fidelity is inapplicable."
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Queue approval #8: explicitly not a Challenge."
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Queue approval #3: exact Pulse sentence verified in 07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md."
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Cloned insight-100 and created the Persian Insight 101 page plus both approved WebP assets; template/domain/structure were verified. The English file target is deliberately deferred until module 12 and en-version rules are read before C.6; the approved English source remains in the immutable queue package."
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
        "reason": "Not a LiteCast publication; this LiteCast-only branch is inapplicable to the clinical insight category.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not a LiteCast publication; this LiteCast-only branch is inapplicable to the clinical insight category.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not a LiteCast publication; this LiteCast-only branch is inapplicable to the clinical insight category.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not a LiteCast publication; this LiteCast-only branch is inapplicable to the clinical insight category.",
        "status": "skipped"
      },
      {
        "evidence": [
          "The exact founder-approved title and caption are present in page metadata/visible page; category insight follows template."
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Persian Insight page updated: removed the added intro and restored original queue text as the first paragraph; both approved images, captions, metadata, and page structure remain present."
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
        "reason": "Not LiteCast; patient-question-specific microsite step does not apply.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; LiteCast-only template gate does not apply.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Rechecked current live pillar taxonomy; fixed-pros / crowns-onlays remains the exact approved placement."
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Revalidated taxonomy identifiers and slug correspondence against the live page and pillar build configuration; no mismatch."
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Page and manual Insight index have the expected one-way index entry and updated ordering; reviewed with the intro removed."
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Re-audited the clinical page metadata and final body structure after restoring the original article opening; no new page-level discrepancy."
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Rechecked page-local required markup, image assets, metadata and IDs; intro removal did not change integrity invariants."
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
        "reason": "This is an Insight page, not an episode.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "This is an Insight page, not an episode.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Episode-only requirement; no episode artwork/player is part of this Insight.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Reconfirmed the 109-term glossary registry review: no new backlink fit for this article; Smile Design is at its five-link cap, and crown-lengthening/subgingival-margin entries do not match the clinical concept."
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
        "reason": "Not a glossary publication; no glossary entry is being created.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Freshly rechecked the 109 glossary and 212 episode entries for the restored article body. No glossary match; the previously approved Episode 13 link now anchors the first source-text occurrence of line angles. Anchor text changes no prose, which still matches the DES source."
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Rechecked all 584 brain entries. Strong related pages clinical-61 and clinical-72; section is at the five-link cap, so no additional related-page link is added. #\u0644\u0627\u06cc\u0646_\u0627\u0646\u06af\u0644 has a second resolving page in insight-72."
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      ".dentcast/hashtag-batches/insight-101-line-angle.json",
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "index.html",
      "insight/en/insight-101.html",
      "insight/index.html",
      "insight/insight-101-1.webp",
      "insight/insight-101-2.webp",
      "insight/insight-101.html",
      "insight/insight101-1.webp",
      "insight/insight101-2.webp",
      "pillar/fixed-pros/index.html",
      "plus/assistant-tags.json",
      "plus/cabinet-bridge.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/flashcards-index.json",
      "plus/pathways.json",
      "plus/quiz-index.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: insight/insight-101.html, plus/faq-corpus.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
