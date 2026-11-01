# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "insight/insight-101"
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
    "content_id": "insight/insight-101",
    "context": {
      "approvals": [
        {
          "decision": "\u0627\u062e\u062a\u0644\u0627\u0641 \u0633\u0637\u062d \u0644\u062b\u0647 \u062f\u0631 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644: \u06a9\u0648\u062a\u0627\u0647 \u0646\u0634\u0627\u0646 \u062f\u0627\u062f\u0646 \u0631\u0648\u06a9\u0634 \u0628\u0627 \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644",
          "evidence": [
            "Founder approval #1 in queue/03 00-\u0648\u0636\u0639\u06cc\u062a.md; frozen 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md sha256 f8e98861\u2026; same string in page, brain clinical-101 and Pulse."
          ],
          "scope": "approved title",
          "status": "confirmed"
        },
        {
          "decision": "\u0644\u062b\u0647\u200c\u06cc \u06cc\u06a9\u06cc \u0627\u0632 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627\u062a\u0631 \u0627\u0633\u062a \u0648 \u062a\u0627\u062c \u0628\u0627\u0644\u06cc\u0646\u06cc \u0622\u0646 \u0628\u0644\u0646\u062f\u062a\u0631 \u062f\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f. \u0631\u0648\u06a9\u0634 \u0631\u0627 \u0686\u0637\u0648\u0631 \u0637\u0631\u0627\u062d\u06cc \u06a9\u0646\u06cc\u0645 \u062a\u0627 \u0627\u062e\u062a\u0644\u0627\u0641 \u0637\u0648\u0644 \u062f\u0648 \u062f\u0646\u062f\u0627\u0646 \u06a9\u0645\u062a\u0631 \u0628\u0647 \u0686\u0634\u0645 \u0628\u06cc\u0627\u06cc\u062f\u061f",
          "evidence": [
            "Founder approval #2 in queue/03 00-\u0648\u0636\u0639\u06cc\u062a.md; frozen 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; same string in page description and brain clinical-101."
          ],
          "scope": "approved caption",
          "status": "confirmed"
        },
        {
          "decision": "No authored lead remains; the original queue article paragraph is the opening text, per founder instruction 1405/08/10.",
          "evidence": [
            "No authored lead: the first paragraph is the original 01-\u0645\u062a\u0646.md paragraph (founder order 1405/08/10); English mirror is the founder-approved queue 06 text (approval #9)."
          ],
          "scope": "authored Persian opening paragraph and English mirror",
          "status": "not_required"
        },
        {
          "decision": "Keep the Episode 13 link at the first technical mention of \u00ab\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u00bb in the original first paragraph.",
          "evidence": [
            "Founder answered \u00ab\u0628\u0645\u0627\u0646\u062f\u00bb in this session on 1405/08/10 for the Episode 13 anchor on the first \u00ab\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u00bb."
          ],
          "scope": "inline link to episode 13",
          "status": "confirmed"
        },
        {
          "decision": "No authored introduction remains in the article.",
          "evidence": [
            "No agent-authored introduction exists; founder order 1405/08/10: first paragraph is the text own paragraph."
          ],
          "scope": "authored-intro",
          "status": "not_required"
        },
        {
          "decision": "\u0627\u062e\u062a\u0644\u0627\u0641 \u0633\u0637\u062d \u0644\u062b\u0647 \u062f\u0631 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644: \u06a9\u0648\u062a\u0627\u0647 \u0646\u0634\u0627\u0646 \u062f\u0627\u062f\u0646 \u0631\u0648\u06a9\u0634 \u0628\u0627 \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644",
          "evidence": [
            "Founder approval #1 in queue/03 00-\u0648\u0636\u0639\u06cc\u062a.md; exact string from frozen 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0644\u062b\u0647\u200c\u06cc \u06cc\u06a9\u06cc \u0627\u0632 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627\u062a\u0631 \u0627\u0633\u062a \u0648 \u062a\u0627\u062c \u0628\u0627\u0644\u06cc\u0646\u06cc \u0622\u0646 \u0628\u0644\u0646\u062f\u062a\u0631 \u062f\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f. \u0631\u0648\u06a9\u0634 \u0631\u0627 \u0686\u0637\u0648\u0631 \u0637\u0631\u0627\u062d\u06cc \u06a9\u0646\u06cc\u0645 \u062a\u0627 \u0627\u062e\u062a\u0644\u0627\u0641 \u0637\u0648\u0644 \u062f\u0648 \u062f\u0646\u062f\u0627\u0646 \u06a9\u0645\u062a\u0631 \u0628\u0647 \u0686\u0634\u0645 \u0628\u06cc\u0627\u06cc\u062f\u061f",
          "evidence": [
            "Founder approval #2 in queue/03 00-\u0648\u0636\u0639\u06cc\u062a.md; exact string from frozen 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md"
          ],
          "scope": "caption",
          "status": "confirmed"
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
        },
        {
          "from_step": "C.2",
          "kind": "dependency_invalidation_v1",
          "reason": "Clone-residue fixes on insight-101.html (JSON-LD keywords, healthCondition, related capsules episode-60/insight-85/insight-86 replaced by insight-61/72, absolute image paths); prose byte-identical to queue 01-\u0645\u062a\u0646.md. Tool requires invalidation from C.2; all work after C.2 already done in files and will be re-recorded step by step.",
          "superseded": {
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
            "delivery": [],
            "inputs": [
              {
                "reference": "queue/03-insight-gingival-level/SHA256SUMS",
                "validation": "all files pass sha256sum -c; title/text/media/English/DES/question/keyword assets reviewed"
              }
            ],
            "steps": [
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
              },
              {
                "evidence": [],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": "No attached paper: queue 03 intake Q4.7 records paperless content (04-\u0645\u0646\u0628\u0639/\u0645\u0646\u0627\u0628\u0639.md: \u067e\u06cc\u067e\u0631 \u0646\u062f\u0627\u0631\u062f\u061b founder approval #8). Module 06 documented skip (Q4.7: no paper file => step 4.10 skipped).",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": "No attached paper (same Q4.7 documented skip; no catalog work).",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": "No attached paper (same Q4.7 documented skip; no page credit owed).",
                "status": "skipped"
              },
              {
                "evidence": [
                  "plus/faq-corpus.json insight/insight-101: DefinedTermSet with 3 DefinedTerm (#flashcards-c1..c3), all source=authored (no sourceFaqIndex), unique @ids, valid JSON. Cards c2 and c3 re-authored as standalone definitions after review (near-copy of FAQ answers removed); none equals a FAQ Q or A verbatim; page JSON-LD carries no FAQ/flashcards markup. No FAQ entry skipped as comparison-shaped; builder node tools/build_flashcards_index.mjs runs in C.8 workflow."
                ],
                "id": "C.4.11",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "plus/faq-corpus.json insight/insight-101 FAQPage: 3 standalone questions, no article deixis (checked against forbidden list), Q1/Q2 yes/no-shaped with answers opening \u00ab\u062e\u06cc\u0631\u061b\u00bb, Q3 open procedural (excluded from scored bank by design); answers grounded in the body sentences only; edit confined to the FAQPage node; node tools/build_quiz_index.mjs runs in C.8. 4.12-b exam questions evaluated at C.5.6."
                ],
                "id": "C.4.12",
                "module": "07-flashcards-and-quiz.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Founder-supplied queue DES reused WITHOUT rerun (founder order 1405/08/10: use previous DES; first paragraph is the original text so DES is valid). queue/03 05-DES-Fidelity/des.json sha256 24446c147540dafd01f697983501aea59cc6bc44f7992569f3e48e9e29045f73 (=SHA256SUMS), scored text 01-\u0645\u062a\u0646.md sha256 513cb0de26cff7a5eba349c40cf3ec20980b11276d245ef5db6daa0cb602f0dd (=SHA256SUMS); all 5 final-page paragraphs byte-equal to it, only change is the Episode 13 anchor on first \u00ab\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u00bb. Part 3 passed: items 1 and 3 quotes verbatim in 01-\u0645\u062a\u0646.md, item 4 quote verbatim in insight/index.html with note; 5+4+0+3+3=15, band E, schema keyset identical to insight-100, question_type/s_design/q_method/penalties null; Part 3(6) replaced-word check ok, 3 interpretation_fa sentences each supported by the text (no edit, before=after). Fidelity: none owed (COMMENTARY basket, no external source) => slot [null] as insight-99/100. Part 3b not applicable. Part 4: record appended to plus/des-scores.json under insight/insight-101, scored_at 2026-10-28 (original scoring date), des.json bytes preserved verbatim."
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
                "reason": "Not a Challenge: queue 03 intake Q4.9 answer is no (approval #8) and the page carries no data-dc-challenge-question markup.",
                "status": "skipped"
              },
              {
                "evidence": [
                  "Batch .dentcast/hashtag-batches/insight-101-line-angle.json applied with tools/hashtag_ref.py --apply (rc 0). Final list for the new entry (applied in C.5): #\u0627\u06cc\u0646\u0633\u0627\u06cc\u062a, #\u0644\u0627\u06cc\u0646_\u0627\u0646\u06af\u0644, #\u0627\u062f\u0631\u0627\u06a9_\u0628\u0635\u0631\u06cc, #\u062a\u0642\u0627\u0631\u0646_\u0642\u062f\u0627\u0645\u06cc, #\u0637\u0631\u0627\u062d\u06cc_\u0631\u0648\u06a9\u0634, #\u0632\u06cc\u0628\u0627\u06cc\u06cc_\u0642\u062f\u0627\u0645\u06cc, #\u0627\u0631\u062a\u0628\u0627\u0637_\u0628\u0627_\u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 \u2014 six reused canonical (founder-approved queue 07 list, resolving sentence per tag quoted in queue/03 07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md) + one minted #\u0644\u0627\u06cc\u0646_\u0627\u0646\u06af\u0644 by explicit founder order (queue approval #5, 1405/08/06). Mint gates: (a) --simulate \u00ab\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u00bb reaches only #\u0641\u06cc\u0646\u06cc\u0634_\u0644\u0627\u06cc\u0646 on shared word \u00ab\u0644\u0627\u06cc\u0646\u00bb (different concept), \u00abline angle\u00bb nothing; (b) second resolving page insight/insight-72 retagged in the same batch (brain clinical-72 gains #\u0644\u0627\u06cc\u0646_\u0627\u0646\u06af\u0644; sentence \u00ab\u06a9\u0645 \u06a9\u0631\u062f\u0646 \u0639\u0631\u0636 \u0627\u062f\u0631\u0627\u06a9\u200c\u0634\u062f\u0647 \u0628\u0627 \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644 \u0648 \u0634\u06cc\u0627\u0631\u0647\u0627\u06cc \u0639\u0645\u0648\u062f\u06cc\u00bb). Alias slots: English line angle/line angles; Persian-script \u0644\u0627\u06cc\u0646\u200c\u0627\u0646\u06af\u0644 / \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u200c\u0647\u0627; misspelling \u0644\u0627\u06cc\u0646 \u0622\u0646\u06af\u0644; colloquial none. Composition gate: series #\u0627\u06cc\u0646\u0633\u0627\u06cc\u062a; decision/specific tags #\u0637\u0631\u0627\u062d\u06cc_\u0631\u0648\u06a9\u0634(3) #\u0627\u062f\u0631\u0627\u06a9_\u0628\u0635\u0631\u06cc(3) #\u062a\u0642\u0627\u0631\u0646_\u0642\u062f\u0627\u0645\u06cc(1) #\u0644\u0627\u06cc\u0646_\u0627\u0646\u06af\u0644(2 after mint) all \u226410 pages; umbrella #\u0632\u06cc\u0628\u0627\u06cc\u06cc_\u0642\u062f\u0627\u0645\u06cc(10\u219211) only in addition. Bridge decision: plus/cabinet-bridge.json map \u00ab\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u00bb->[tooth-morphology] (paper Achieving natural-looking morphology and surface textures in anterior ceramic fixed rehabilitations: transition angles/ridges -> visual width) + tooth_topics; build_cabinet_papers.py ran (warns site tag not in content-index until build_plus_index runs after the brain write). Tool refused brain write on mixed EOL; done via temporary CRLF normalization of the 25-line LF block and exact byte restore (git diff of dentcast-brain.json = only the insight-72 tag line). Step-6 sync/index/check and the question-first reachability test run after the C.5 brain write."
                ],
                "id": "C.5.0",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "dentcast-brain.json: entry clinical-101 appended as the LAST element (585 entries), same keys/order as clinical-100 (type,id,title,caption,hashtags,keywords,page_url,pillar), valid JSON, byte-scoped CRLF append (git diff = clinical-72 tag line + new entry only). title/caption copied codepoint-for-codepoint from queue 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; hashtags = 7 canonical (#\u0627\u06cc\u0646\u0633\u0627\u06cc\u062a #\u0644\u0627\u06cc\u0646_\u0627\u0646\u06af\u0644 #\u0627\u062f\u0631\u0627\u06a9_\u0628\u0635\u0631\u06cc #\u062a\u0642\u0627\u0631\u0646_\u0642\u062f\u0627\u0645\u06cc #\u0637\u0631\u0627\u062d\u06cc_\u0631\u0648\u06a9\u0634 #\u0632\u06cc\u0628\u0627\u06cc\u06cc_\u0642\u062f\u0627\u0645\u06cc #\u0627\u0631\u062a\u0628\u0627\u0637_\u0628\u0627_\u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631); keywords = the 6 founder-approved strings from queue 09 in the same order; pillar fixed-pros/crowns-onlays. After the write: hashtag_ref.py --sync, node tools/build_plus_index.mjs, hashtag_ref.py --check (OK, all enforced types canonical), build_cabinet_papers.py + --check (OK). Reachability (question-first, reasoned from plus/assistant-tags.json + plus/content-index.json; live API not called): labels in assistant list: \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644(2 pages), \u0637\u0631\u0627\u062d\u06cc \u0631\u0648\u06a9\u0634(4), \u0627\u062f\u0631\u0627\u06a9 \u0628\u0635\u0631\u06cc(4), \u062a\u0642\u0627\u0631\u0646 \u0642\u062f\u0627\u0645\u06cc(2), \u0627\u0631\u062a\u0628\u0627\u0637 \u0628\u0627 \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631(2), \u0632\u06cc\u0628\u0627\u06cc\u06cc \u0642\u062f\u0627\u0645\u06cc(11, umbrella); Q1 picks \u0637\u0631\u0627\u062d\u06cc \u0631\u0648\u06a9\u0634+\u0627\u062f\u0631\u0627\u06a9 \u0628\u0635\u0631\u06cc+\u062a\u0642\u0627\u0631\u0646 \u0642\u062f\u0627\u0645\u06cc+\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644; Q2 \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644+\u062a\u0642\u0627\u0631\u0646 \u0642\u062f\u0627\u0645\u06cc+\u0637\u0631\u0627\u062d\u06cc \u0631\u0648\u06a9\u0634; Q3 \u0627\u0631\u062a\u0628\u0627\u0637 \u0628\u0627 \u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631+\u0637\u0631\u0627\u062d\u06cc \u0631\u0648\u06a9\u0634 (\u067e\u062a\u0631\u0646 \u0631\u0632\u06cc\u0646 is not a tag of this page); Q4 \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644+\u0637\u0631\u0627\u062d\u06cc \u0631\u0648\u06a9\u0634; Q5 \u0627\u062f\u0631\u0627\u06a9 \u0628\u0635\u0631\u06cc+\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644 \u2014 each specific tag lists at most 4 pages and contains insight/insight-101, so the page is inside the first 4 pages of its chip for all five questions."
                ],
                "id": "C.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Verified without re-deciding: brain clinical-101 pillar = {primary:fixed-pros, secondary:[], subtopic:crowns-onlays} equals the step-2.4 decision (founder-approved queue option A, approval #4); fixed-pros is in live PILLARS and crowns-onlays is one of its subtopics (post-and-core, preparation, impression, crowns-onlays, cementation, failures); pillar object has the same 3 keys as clinical-100; page capsule links /pillar/fixed-pros/ (single pillar href). tools/build_pillar.py read from the branch, which equals origin/main 07cabf7 plus only publication files."
                ],
                "id": "C.5.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "tools/pathway_place.py insight/insight-101: two STRONG candidates placed directly (frozen-core cluster): esthetic after insight/insight-61 (index 27, milestone=false, 69 steps) and fixed-pros after insight/insight-61 (index 126, milestone=false, 136 steps); the ASK candidates (implant-prosthetic 33, treatment-planning 28, ceramics 21, biomimetic 17, post-and-core 16, removable-pros 14) were not placed (a third pathway would be a founder question; none is needed). plus/pathways.json valid JSON, diff +8 lines; coverage: full pathways 818 memberships over 541 items = 1.51 per item (was a creep already above the 1.38 baseline; this publish adds 2 memberships). 4.12-b: two founder-approved MCQs (queue approval #7 \u00ab\u0633\u0648\u0627\u0644\u0627 \u0641\u0642\u0637 \u06f2 \u0648 \u06f3\u00bb) copied verbatim from queue 08-\u0633\u0624\u0627\u0644\u200c\u0647\u0627\u06cc-\u0622\u0632\u0645\u0648\u0646.json into plus/exam-questions.json byContent[insight/insight-101] with ids r-90e65279 (key 0) and r-cd881acf (key 1) = r-+sha1(content_id|publish-n)[:8], source=publish, appended not replacing; tools/validate_exam_questions.py: 0 errors (3 pre-existing warnings on other pages); the page lands in 2 full pathways (esthetic, fixed-pros) so the pool is drawn there."
                ],
                "id": "C.5.6",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Bundle gate chain. Candidates = bundles whose continues_pathway is a full pathway the item just joined (esthetic, fixed-pros): bundle-laminate (continues esthetic, 8 steps) and bundle-crown-prep (continues fixed-pros, 6 steps). Verdict for both: \u00ab\u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1)\u00bb \u2014 GATE 1 (type, mechanical): the item folder is insight/, which is NO always, no judgment may override. No bundle edit, so no home-bundles.js step-count sweep or asset_version bump is owed."
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
            "validation": []
          }
        },
        {
          "english": {
            "evidence": [
              "mirror reviewed against queue 06 text before Push 2"
            ],
            "path": "insight/en/insight-101.html",
            "status": "ready"
          },
          "evidence": [
            "editorial close review by Claude Code in this run, 1405/08/10"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "COMMENTARY DES 15/100 band E reused verbatim from queue 03 05-DES-Fidelity/des.json (sha24446c14) on explicit founder order 1405/08/10; stored in plus/des-scores.json; Part 3 checks passed; no Fidelity owed"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue 03 intake Q4.9: not a Challenge; no data-dc-challenge-question markup"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "pillar fixed-pros/crowns-onlays verified against live PILLARS (C.5.5); founder approval #4"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7/C.4.8: no glossary match, approved Episode 13 inline link; C.4.9 redone in this run: clone-residue capsules (episode-60, insight-85, insight-86, implant-cement topic) replaced by insight-61 and insight-72 (strong matches); borderline insight-25 not added"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "batch insight-101-line-angle.json applied; hashtag_ref --check OK; 7 canonical tags in clinical-101"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "brain clinical-101 appended last with clinical-100 key set; title/caption/keywords from frozen queue files"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "placed in esthetic and fixed-pros after insight-61; bundles rejected at gate 1 (insight/); 2 exam questions added"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html Pulse: new top line with title link, bottom line removed, 7 lines remain"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "insight/en/insight-101.html built from founder-approved queue 06-\u0627\u0646\u06af\u0644\u06cc\u0633\u06cc.md (approval #9), toggles inverse, noindex, no hreflang"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "queue 03 approvals #1-#11 hash-verified frozen files; founder explicit orders 1405/08/10 recorded in queue 00-\u0648\u0636\u0639\u06cc\u062a.md commit 06fd34b"
              ],
              "scope": "author_approvals",
              "status": "resolved"
            }
          ]
        },
        {
          "from_step": "C.6",
          "kind": "dependency_invalidation_v1",
          "reason": "Post-cut2 run 41314521373 failed at finalize with INCOMPLETE_FINAL_DELIVERY_RECEIPT: the inherited external action queue-lock-push-attempt-1 (failed git push, no credentials in the Codex environment) has no external_action_reconciliation_v1 receipt. Publication content is unchanged; adding the receipt requires invalidating from C.6 and re-delivering once.",
          "superseded": {
            "approvals": [
              {
                "decision": "\u0627\u062e\u062a\u0644\u0627\u0641 \u0633\u0637\u062d \u0644\u062b\u0647 \u062f\u0631 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644: \u06a9\u0648\u062a\u0627\u0647 \u0646\u0634\u0627\u0646 \u062f\u0627\u062f\u0646 \u0631\u0648\u06a9\u0634 \u0628\u0627 \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644",
                "evidence": [
                  "Founder approval #1 in queue/03 00-\u0648\u0636\u0639\u06cc\u062a.md; frozen 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md sha256 f8e98861\u2026; same string in page, brain clinical-101 and Pulse."
                ],
                "scope": "approved title",
                "status": "confirmed"
              },
              {
                "decision": "\u0644\u062b\u0647\u200c\u06cc \u06cc\u06a9\u06cc \u0627\u0632 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627\u062a\u0631 \u0627\u0633\u062a \u0648 \u062a\u0627\u062c \u0628\u0627\u0644\u06cc\u0646\u06cc \u0622\u0646 \u0628\u0644\u0646\u062f\u062a\u0631 \u062f\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f. \u0631\u0648\u06a9\u0634 \u0631\u0627 \u0686\u0637\u0648\u0631 \u0637\u0631\u0627\u062d\u06cc \u06a9\u0646\u06cc\u0645 \u062a\u0627 \u0627\u062e\u062a\u0644\u0627\u0641 \u0637\u0648\u0644 \u062f\u0648 \u062f\u0646\u062f\u0627\u0646 \u06a9\u0645\u062a\u0631 \u0628\u0647 \u0686\u0634\u0645 \u0628\u06cc\u0627\u06cc\u062f\u061f",
                "evidence": [
                  "Founder approval #2 in queue/03 00-\u0648\u0636\u0639\u06cc\u062a.md; frozen 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; same string in page description and brain clinical-101."
                ],
                "scope": "approved caption",
                "status": "confirmed"
              },
              {
                "decision": "No authored lead remains; the original queue article paragraph is the opening text, per founder instruction 1405/08/10.",
                "evidence": [
                  "No authored lead: the first paragraph is the original 01-\u0645\u062a\u0646.md paragraph (founder order 1405/08/10); English mirror is the founder-approved queue 06 text (approval #9)."
                ],
                "scope": "authored Persian opening paragraph and English mirror",
                "status": "not_required"
              },
              {
                "decision": "Keep the Episode 13 link at the first technical mention of \u00ab\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u00bb in the original first paragraph.",
                "evidence": [
                  "Founder answered \u00ab\u0628\u0645\u0627\u0646\u062f\u00bb in this session on 1405/08/10 for the Episode 13 anchor on the first \u00ab\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u00bb."
                ],
                "scope": "inline link to episode 13",
                "status": "confirmed"
              },
              {
                "decision": "No authored introduction remains in the article.",
                "evidence": [
                  "No agent-authored introduction exists; founder order 1405/08/10: first paragraph is the text own paragraph."
                ],
                "scope": "authored-intro",
                "status": "not_required"
              },
              {
                "decision": "\u0627\u062e\u062a\u0644\u0627\u0641 \u0633\u0637\u062d \u0644\u062b\u0647 \u062f\u0631 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644: \u06a9\u0648\u062a\u0627\u0647 \u0646\u0634\u0627\u0646 \u062f\u0627\u062f\u0646 \u0631\u0648\u06a9\u0634 \u0628\u0627 \u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644",
                "evidence": [
                  "Founder approval #1 in queue/03 00-\u0648\u0636\u0639\u06cc\u062a.md; exact string from frozen 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md"
                ],
                "scope": "title",
                "status": "confirmed"
              },
              {
                "decision": "\u0644\u062b\u0647\u200c\u06cc \u06cc\u06a9\u06cc \u0627\u0632 \u062f\u0648 \u0633\u0627\u0646\u062a\u0631\u0627\u0644 \u0628\u0627\u0644\u0627\u062a\u0631 \u0627\u0633\u062a \u0648 \u062a\u0627\u062c \u0628\u0627\u0644\u06cc\u0646\u06cc \u0622\u0646 \u0628\u0644\u0646\u062f\u062a\u0631 \u062f\u06cc\u062f\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f. \u0631\u0648\u06a9\u0634 \u0631\u0627 \u0686\u0637\u0648\u0631 \u0637\u0631\u0627\u062d\u06cc \u06a9\u0646\u06cc\u0645 \u062a\u0627 \u0627\u062e\u062a\u0644\u0627\u0641 \u0637\u0648\u0644 \u062f\u0648 \u062f\u0646\u062f\u0627\u0646 \u06a9\u0645\u062a\u0631 \u0628\u0647 \u0686\u0634\u0645 \u0628\u06cc\u0627\u06cc\u062f\u061f",
                "evidence": [
                  "Founder approval #2 in queue/03 00-\u0648\u0636\u0639\u06cc\u062a.md; exact string from frozen 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md"
                ],
                "scope": "caption",
                "status": "confirmed"
              }
            ],
            "delivery": [],
            "inputs": [
              {
                "reference": "queue/03-insight-gingival-level/SHA256SUMS",
                "validation": "all files pass sha256sum -c; title/text/media/English/DES/question/keyword assets reviewed"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "Pulse: index.html dc-pulse-list gets the founder-approved line (queue 07 Q5, title as link) at the top, bottom-most line removed, exactly 7 lines, previous first six preserved. English mirror insight/en/insight-101.html authored from founder-approved queue 06 text (approval #9), inverse toggles, noindex, no hreflang, no gloss duplicates. second_cut_editorial_lock_v1 recorded (10 scopes). C.8/C.7/D-technical/E/F/G run in the post-cut2-mechanical workflow after Push 2."
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
          "evidence": [
            "queue branch read-back: item 03 00-\u0648\u0636\u0639\u06cc\u062a.md has status \u00ab\u062f\u0631 \u062d\u0627\u0644 \u0627\u0646\u062a\u0634\u0627\u0631\u00bb and lock Claude Code (commit 06fd34b on origin/queue, parent 10efaf2 Codex API lock)"
          ],
          "failed_id": "queue-lock-push-attempt-1",
          "kind": "external_action_reconciliation_v1",
          "reason": "The Codex git push failed (no credentials in that environment) but the intended outcome \u2014 queue item 03 locked as in publication \u2014 was achieved by the Codex GitHub-API commit 10efaf2 and then transferred to Claude Code by founder order (commit 06fd34b); verified by reading origin/queue.",
          "successful_id": "queue-lock-claude-verified",
          "target": "origin/queue: mark queue item 03 as in progress with Codex Work lock",
          "verification_ref": "queue branch read-back: item 03 00-\u0648\u0636\u0639\u06cc\u062a.md has status \u00ab\u062f\u0631 \u062d\u0627\u0644 \u0627\u0646\u062a\u0634\u0627\u0631\u00bb and lock Claude Code (commit 06fd34b on origin/queue, parent 10efaf2 Codex API lock)"
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
      },
      {
        "evidence": [
          "queue branch read-back: item 03 00-\u0648\u0636\u0639\u06cc\u062a.md has status \u00ab\u062f\u0631 \u062d\u0627\u0644 \u0627\u0646\u062a\u0634\u0627\u0631\u00bb and lock Claude Code (commit 06fd34b on origin/queue, parent 10efaf2 Codex API lock)"
        ],
        "id": "queue-lock-claude-verified",
        "status": "completed",
        "target": "origin/queue: mark queue item 03 as in progress with Codex Work lock"
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
          "Page insight/insight-101.html built from clone of insight-100; body prose = 5 paragraphs byte-equal to frozen queue 01-\u0645\u062a\u0646.md (sha 513cb0de) with 2 approved images (/insight/insight101-1.webp,-2.webp, alt+figcaption from queue 03) and the approved Episode 13 anchor; clone residue removed (JSON-LD keywords, healthCondition, wrong related capsules); no authored lead."
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
        "reason": "Not LiteCast; LiteCast-only step.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; LiteCast-only step.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Pillar fixed-pros / subtopic crowns-onlays: founder-approved queue option A (approval #4), re-verified against live PILLARS (fixed-pros has crowns-onlays)."
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Single dc-related-section with \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc (/pillar/fixed-pros/) capsules, no duplicate."
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "insight/index.html (hand-maintained list) already holds exactly one new newest-first link to insight-101 with the approved title."
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Dates: published/reviewed/datePublished/dateModified = 2026-11-01 in fa page and JSON-LD; no 2026-10-30 residue; canonical/og/twitter urls insight-101."
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Template insight-100 is untouched (not modified in git diff vs origin/main)."
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
        "reason": "Insight page, not an episode.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Insight page, not an episode.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Episode-only artwork/player step.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Fresh semantic review of all 109 glossary terms against the article (line-angle crown design for a gingival-level difference): only Smile Design (\u0637\u0631\u0627\u062d\u06cc \u0644\u0628\u062e\u0646\u062f) is conceptually adjacent, judged too broad/tangential and its \u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631 section is at the 5-link cap; Emergence Profile unrelated. 0 back-links added; no glossary page touched."
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
        "reason": "Not a glossary-term publication; scoped cross-linking inapplicable.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Fresh analysis of body vs 109 glossary terms and all episodes: no glossary match; one unmistakable-in-context link, founder-approved (1405/08/10): first \u00ab\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u00bb (paragraph 1) -> /episodes/episode-13.html (Esthetic Width / Umbrella Effect). No other candidates. Prose unchanged; anchor is the only diff vs frozen text."
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Fresh brain read (585 entries). The \u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631 section inherited three unrelated capsules from the insight-100 clone (episode-60, insight-85, insight-86 \u2014 implant-crown cement/occlusion), which cannot count as 4.9; replaced as clone residue by the two strong matches: insight-61 (\u0641\u0631\u06cc\u0628 \u062e\u0637\u0627\u06cc \u062f\u06cc\u062f \u0631\u0648\u06cc \u06a9\u0633\u062a \u062f\u0631 \u0631\u0648\u06a9\u0634 \u0633\u0627\u0646\u062a\u0631\u0627\u0644: optical illusion in a single anterior central crown) and insight-72 (\u0645\u062f\u06cc\u0631\u06cc\u062a \u0638\u0627\u0647\u0631 \u0628\u0631\u06cc\u062c \u062f\u0631 \u062a\u062d\u0644\u06cc\u0644 \u0634\u062f\u06cc\u062f \u0627\u0633\u062a\u062e\u0648\u0627\u0646: line angles to reduce perceived width). Section now 4 links (\u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647, \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc, 61, 72). Borderline, not added and left for founder: insight-25 (\u0631\u0648\u06a9\u0634 \u0628\u0632\u0631\u06af\u200c\u062a\u0631 \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u062f) and insight-53. First-cut lead provenance: author_original recorded, no authored intro."
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
        "reason": "No attached paper: queue 03 intake Q4.7 records paperless content (founder approval #8); module 06 documented skip.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No attached paper (same Q4.7 skip).",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No attached paper (same Q4.7 skip).",
        "status": "skipped"
      },
      {
        "evidence": [
          "plus/faq-corpus.json insight/insight-101: DefinedTermSet with 3 DefinedTerm (#flashcards-c1..c3), source=authored, unique @ids, valid JSON; c2/c3 are standalone definitions (no FAQ near-copy); none equals a FAQ Q or A verbatim; page JSON-LD has no FAQ/flashcards markup; node tools/build_flashcards_index.mjs runs in the post-Push-2 workflow."
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage in plus/faq-corpus.json: 3 standalone questions, no article deixis, Q1/Q2 yes/no with answers opening \u00ab\u062e\u06cc\u0631\u061b\u00bb, Q3 open procedural; grounded in body; quiz builder runs post-Push-2. 4.12-b evaluated at C.5.6."
        ],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Founder-supplied queue DES reused WITHOUT rerun (founder order 1405/08/10). des.json sha256 24446c14\u2026 (=SHA256SUMS) scored 01-\u0645\u062a\u0646.md sha256 513cb0de\u2026; final page prose byte-equal (only Episode 13 anchor added). Part 3 passed (quotes verbatim in text / insight/index.html with note; 5+4+0+3+3=15; band E; schema keyset = insight-100; Part 3(6) ok, no edit). No Fidelity owed (COMMENTARY). Record stored in plus/des-scores.json under insight/insight-101, scored_at 2026-10-28, fidelity [null]."
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
        "reason": "Not a Challenge (queue intake Q4.9 no; no challenge markup).",
        "status": "skipped"
      },
      {
        "evidence": [
          "Batch .dentcast/hashtag-batches/insight-101-line-angle.json applied (hashtag_ref --apply rc 0). Final list: #\u0627\u06cc\u0646\u0633\u0627\u06cc\u062a #\u0644\u0627\u06cc\u0646_\u0627\u0646\u06af\u0644 #\u0627\u062f\u0631\u0627\u06a9_\u0628\u0635\u0631\u06cc #\u062a\u0642\u0627\u0631\u0646_\u0642\u062f\u0627\u0645\u06cc #\u0637\u0631\u0627\u062d\u06cc_\u0631\u0648\u06a9\u0634 #\u0632\u06cc\u0628\u0627\u06cc\u06cc_\u0642\u062f\u0627\u0645\u06cc #\u0627\u0631\u062a\u0628\u0627\u0637_\u0628\u0627_\u0644\u0627\u0628\u0631\u0627\u062a\u0648\u0627\u0631 = six reused canonical (founder-approved queue 07) + #\u0644\u0627\u06cc\u0646_\u0627\u0646\u06af\u0644 minted by explicit founder order (queue approval #5). Mint gates: no existing concept (simulate reaches only #\u0641\u06cc\u0646\u06cc\u0634_\u0644\u0627\u06cc\u0646 on shared word); second resolving page insight-72 retagged in batch. Alias slots filled (English, Persian-script, misspelling; colloquial none). Composition gate met (series; decision/specific tags \u226410 pages). Bridge: plus/cabinet-bridge.json \u00ab\u0644\u0627\u06cc\u0646 \u0627\u0646\u06af\u0644\u00bb->[tooth-morphology] + tooth_topics. Tool refused brain write on mixed EOL; done via temporary CRLF normalization of the LF block and exact byte restore (git diff of brain = insight-72 tag line + new entry only)."
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-brain.json: clinical-101 appended LAST (585 entries), same keys/order as clinical-100, valid JSON, byte-scoped CRLF append. title/caption copied from queue 02; 7 canonical hashtags; keywords = 6 founder-approved strings from queue 09; pillar fixed-pros/crowns-onlays. hashtag_ref --sync, build_plus_index.mjs, hashtag_ref --check OK, build_cabinet_papers --check OK. Reachability (reasoned from assistant-tags/content-index, live API not called): each specific tag lists \u22644 pages incl. this page for all 5 questions."
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Verified, not re-decided: brain pillar fixed-pros/crowns-onlays equals step-2.4 decision (queue approval #4); valid in live PILLARS; page capsule links /pillar/fixed-pros/; pillar object keys equal clinical-100."
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathway_place.py: STRONG placements esthetic (after insight-61, 69 steps) and fixed-pros (after insight-61, 136 steps); ASK candidates not placed. pathways.json valid, +8 lines; coverage 1.51 per item (baseline 1.38, already above). 4.12-b: two founder-approved MCQs (queue approval #7) appended to plus/exam-questions.json byContent[insight/insight-101], ids r-90e65279 and r-cd881acf, validate_exam_questions 0 errors."
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Bundle candidates bundle-laminate (esthetic) and bundle-crown-prep (fixed-pros): both \u00ab\u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1)\u00bb \u2014 insight/ folder is NO always. No bundle edit, no mirror sweep owed."
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Content unchanged since Push 2 (338d85f): Pulse line at top with 7 lines, English mirror with inverse toggles, ten-scope editorial lock and exact title/caption approvals present. Only handoff changed: restored approvals from audit and added external_action_reconciliation_v1 for the inherited failed queue-lock push (queue-lock-push-attempt-1 -> queue-lock-claude-verified, read-back of origin/queue)."
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
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
      "plus/cabinet-papers.json",
      "plus/content-index.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/flashcards-index.json",
      "plus/pathways.json",
      "plus/quiz-index.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: insight/insight-101.html"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
