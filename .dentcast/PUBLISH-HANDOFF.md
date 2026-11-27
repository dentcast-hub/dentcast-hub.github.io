# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "episodes/episode-164"
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
    "category": "dentcast",
    "content_id": "episodes/episode-164",
    "context": {
      "approvals": [
        {
          "decision": "Food Impaction in Dentistry: Revisited :part2",
          "evidence": [
            "agent proposal under standing acceptance (Hard Rule 14)"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u0627\u06cc\u0646 \u0642\u0633\u0645\u062a \u0627\u062f\u0627\u0645\u0647 \u0645\u0633\u062a\u0642\u06cc\u0645 \u0627\u067e\u06cc\u0632\u0648\u062f \u06f1\u06f6\u06f3 \u0647\u0633\u062a \u0648 \u0647\u0645\u0648\u0646 \u0645\u0642\u0627\u0644\u0647 \u0645\u0631\u0648\u0631\u06cc \u06f2\u06f0\u06f2\u06f3 \u062f\u0631\u0628\u0627\u0631\u0647 \u0641\u0648\u062f \u0627\u06cc\u0645\u067e\u06a9\u0634\u0646 \u0631\u0648 \u0627\u062f\u0627\u0645\u0647 \u0645\u06cc\u200c\u062f\u06cc\u0645.\n\n\u062a\u0648\u06cc \u0642\u0633\u0645\u062a \u0642\u0628\u0644 \u06af\u0641\u062a\u06cc\u0645 \u06a9\u0647 \u0641\u0648\u062f \u0627\u06cc\u0645\u067e\u06a9\u0634\u0646 \u0647\u0645\u06cc\u0634\u0647 \u0628\u0647 \u0645\u0639\u0646\u06cc \u0628\u0627\u0632 \u0628\u0648\u062f\u0646 \u06a9\u0627\u0646\u062a\u06a9\u062a \u0646\u06cc\u0633\u062a. \u062d\u0627\u0644\u0627 \u0645\u06cc\u200c\u0631\u06cc\u0645 \u0633\u0631\u0627\u063a \u0628\u0642\u06cc\u0647 \u0639\u0644\u062a\u200c\u0647\u0627\u06cc \u06af\u06cc\u0631 \u063a\u0630\u0627\u06cc\u06cc \u06a9\u0647 \u0645\u0642\u0627\u0644\u0647 \u06a9\u0646\u0627\u0631 \u0628\u0627\u0632 \u0634\u062f\u0646 \u06a9\u0627\u0646\u062a\u06a9\u062a \u0645\u0637\u0631\u062d \u0645\u06cc\u200c\u06a9\u0646\u0647: \u0646\u0627\u0647\u0645\u0627\u0647\u0646\u06af\u06cc \u0627\u06a9\u0644\u0648\u0632\u0627\u0644\u06cc\u060c \u0646\u0642\u0635 \u062f\u0631 \u0634\u06a9\u0644 \u062f\u0646\u062f\u0627\u0646 \u06cc\u0627 \u062a\u0631\u0645\u06cc\u0645\u060c \u0645\u0648\u0642\u0639\u06cc\u062a \u063a\u06cc\u0631\u0637\u0628\u06cc\u0639\u06cc \u062f\u0646\u062f\u0627\u0646 \u0648 \u0627\u0632 \u062f\u0633\u062a \u0631\u0641\u062a\u0646 \u067e\u0627\u067e\u06cc\u0644\u0627\u06cc \u0628\u06cc\u0646\u200c\u062f\u0646\u062f\u0627\u0646\u06cc.\n\n\u0627\u06cc\u0646 \u0628\u062d\u062b \u062f\u0631 \u0627\u067e\u06cc\u0632\u0648\u062f \u06f1\u06f6\u06f5 \u0647\u0645 \u0627\u062f\u0627\u0645\u0647 \u067e\u06cc\u062f\u0627 \u0645\u06cc\u200c\u06a9\u0646\u0647.",
          "evidence": [
            "agent proposal under standing acceptance (Hard Rule 14)"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "agent-authored lead kept",
          "evidence": [
            "agent proposal under standing acceptance (Hard Rule 14)"
          ],
          "scope": "authored-intro",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "attached_paper": "no",
          "challenge": "no",
          "kind": "intake_facts_v1"
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
          "decision": "founder approved all three drafted exam questions verbatim (\u00ab\u0647\u0631 \u0633\u0647 \u0633\u0648\u0627\u0644 \u062a\u0627\u06cc\u06cc\u062f\u0646\u062f\u00bb)",
          "evidence": [
            "chat M2 answer 2026-11-27"
          ],
          "kind": "m2_exam_questions_v1",
          "status": "confirmed",
          "step": "B.5"
        },
        {
          "evidence": [
            "first paragraph of episodes/episode-164.html"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "agent_authored",
          "source_ref": "lead paragraph written by the agent (module 03)"
        },
        {
          "english": {
            "evidence": [
              "episodes/en/episode-164.html on disk, toggles wired"
            ],
            "path": "episodes/en/episode-164.html",
            "status": "ready"
          },
          "evidence": [
            "built by `close` from the ledger evidence of the steps through C.5.6-b"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13: DES reused from episodes/episode-163 (same paper doi 10.3290/j.ohpd.b4172837, v3.7 FULL_TEXT, founder instruction), sources[] byte-identical, scored_at 2026-11-27, no fidelity key (audio episode); des_record_guard check ok"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.14 skipped: ordinary post, not a Challenge (Question 4.9)"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "C.2.4: pillar treatment-planning / subtopic comprehensive-diagnosis (same subject as ep163, food impaction etiology diagnosis)"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7: related_cap --glossary-room: no term on food impaction/contact/papilla/occlusion has a free slot or exists; 0 back-links",
                "C.4.8: caption: \u00ab\u0627\u067e\u06cc\u0632\u0648\u062f \u06f1\u06f6\u06f3\u00bb linked to /episodes/episode-163.html (sibling part the body refers back to, ep162 inline markup); no glossary term qualifies; borderline: none",
                "C.4.9: \u0645\u062d\u062a\u0648\u0627\u06cc \u0645\u0631\u062a\u0628\u0637: pillar capsule + ep163 (sibling first) + insight-73, insight-69, meta-12 = 5/5 cap; skipped episode-159 (implant contact loss, part-1 topic) at cap"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0: tags #\u062f\u0646\u062a\u06a9\u0633\u062a #\u06af\u06cc\u0631_\u063a\u0630\u0627\u06cc\u06cc #\u062a\u0634\u062e\u06cc\u0635_\u0627\u0641\u062a\u0631\u0627\u0642\u06cc #\u0627\u06a9\u0644\u0648\u0698\u0646 #\u06a9\u0627\u0646\u062a\u0648\u0631_\u062a\u0631\u0645\u06cc\u0645 #\u067e\u0627\u067e\u06cc\u0644\u0627 #\u06a9\u0627\u0646\u062a\u06a9\u062a_\u067e\u0631\u0648\u06af\u0632\u06cc\u0645\u0627\u0644 all reused canonical, no mint; --reach REACHABLE (#\u067e\u0627\u067e\u06cc\u0644\u0627 4/4); --sync, --check OK; build_cabinet_papers --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5: brain entry appended at end, key set equals ep163 dentcast entry; dentcast.json entry 164 appended"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6: pathways: fixed-pros and treatment-planning after episodes/episode-163 (series sibling, STRONG); others not placed (third pathway cap / spurious series match); 4.12-\u0628: 3 approved questions written r-cd88dc0b r-135d1bdb r-4049cffb, validate_exam_questions 0 errors",
                "C.5.6-b: bundle-crown-prep (fixed-pros): \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2: part 2 of a series whose part 1 is not in the bundle); treatment-planning: no bundle"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "first Pulse line of index.html links /episodes/episode-164.html"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "episodes/en/episode-164.html on disk"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "pending_questions empty; founder answers recorded as decisions"
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
          "readpack dentcast/no/no/research/isolated/one"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase0: no text from founder (caption agent-authored per founder request), no paper file attached; paper of ep163 reused"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed: latest dentcast entry ep163 key set type,episode,title,caption,hashtags,keywords,audio_url,page_url,pillar; PILLARS read"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type dentcast (core episode)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "next number 164 (max 163 + 1), founder named 164"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no founder text; founder asked agent to write caption from ep163 (continuation, other causes of food impaction, continues in 165)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no founder prose to de-AI; caption agent-authored"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "audio founder URL https://episodes.s3.ir-central1.arvanstorage.ir/dentcast164%20.mp3?versionId= ; duration 26:05 founder-supplied (host not reachable from sandbox, proxy 403)"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper file attached; founder: use the ep163 paper (doi 10.3290/j.ohpd.b4172837)"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 2 RESEARCH: refs block with DOI 10.3290/j.ohpd.b4172837; founder: reuse ep163 DES"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (episode), not a Challenge"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: agent draft in ep163 pattern \u00ab\u0627\u067e\u06cc\u0632\u0648\u062f \u06f1\u06f6\u06f4 \u062f\u0646\u062a\u200c\u06a9\u0633\u062a \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab\u2026\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f.\u00bb; M2: 3 questions approved verbatim; no M1 facts"
        ],
        "id": "B.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "not LiteCast: LiteCast branch not applicable"
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
          "template episodes/episode-163.html; git diff --quiet held during clone (163 edited only later at C.4.6 nav slot)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "episodes/episode-164.html cloned from ep163, caption/title/meta/JSON-LD/audio/duration PT26M5S/date/keywords/chips/related/nav swapped; domain .org kept; presentation_lint clean"
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
          "pillar treatment-planning / subtopic comprehensive-diagnosis (same subject as ep163, food impaction etiology diagnosis)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "episode branch: \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc -> /pillar/treatment-planning/ in \u0645\u062d\u062a\u0648\u0627\u06cc \u0645\u0631\u062a\u0628\u0637"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "episodes.html is generated by tools/build_episodes.py (runner C.8) from dentcast.json entry 164 appended"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dates 2026-11-27 everywhere (JSON-LD, meta row Fri, 27 Nov 2026), duration 26:05 founder-supplied"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- episodes/episode-163.html held at build; later edit only at 4.6 nav"
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
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no attached paper (Question 4.7)",
        "status": "skipped"
      },
      {
        "evidence": [
          "DES reused from episodes/episode-163 (same paper doi 10.3290/j.ohpd.b4172837, v3.7 FULL_TEXT, founder instruction), sources[] byte-identical, scored_at 2026-11-27, no fidelity key (audio episode); des_record_guard check ok"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "related_cap --glossary-room: no term on food impaction/contact/papilla/occlusion has a free slot or exists; 0 back-links"
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
        "reason": "glossary-publish-only back-link step",
        "status": "skipped"
      },
      {
        "evidence": [
          "caption: \u00ab\u0627\u067e\u06cc\u0632\u0648\u062f \u06f1\u06f6\u06f3\u00bb linked to /episodes/episode-163.html (sibling part the body refers back to, ep162 inline markup); no glossary term qualifies; borderline: none"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u062d\u062a\u0648\u0627\u06cc \u0645\u0631\u062a\u0628\u0637: pillar capsule + ep163 (sibling first) + insight-73, insight-69, meta-12 = 5/5 cap; skipped episode-159 (implant contact loss, part-1 topic) at cap"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4 DefinedTerms in plus/faq-corpus.json episodes/episode-164 #flashcards-c1..c4 (3 faq, 1 authored); FAQ q4 list-shaped compressed to authored card c4"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage 4 questions, 3 binary with opening \u0628\u0644\u0647 verdict, 1 open (list); no deixis"
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
          "tags #\u062f\u0646\u062a\u06a9\u0633\u062a #\u06af\u06cc\u0631_\u063a\u0630\u0627\u06cc\u06cc #\u062a\u0634\u062e\u06cc\u0635_\u0627\u0641\u062a\u0631\u0627\u0642\u06cc #\u0627\u06a9\u0644\u0648\u0698\u0646 #\u06a9\u0627\u0646\u062a\u0648\u0631_\u062a\u0631\u0645\u06cc\u0645 #\u067e\u0627\u067e\u06cc\u0644\u0627 #\u06a9\u0627\u0646\u062a\u06a9\u062a_\u067e\u0631\u0648\u06af\u0632\u06cc\u0645\u0627\u0644 all reused canonical, no mint; --reach REACHABLE (#\u067e\u0627\u067e\u06cc\u0644\u0627 4/4); --sync, --check OK; build_cabinet_papers --check OK"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry appended at end, key set equals ep163 dentcast entry; dentcast.json entry 164 appended"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar treatment-planning/comprehensive-diagnosis live in PILLARS; capsule matches"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pathways: fixed-pros and treatment-planning after episodes/episode-163 (series sibling, STRONG); others not placed (third pathway cap / spurious series match); 4.12-\u0628: 3 approved questions written r-cd88dc0b r-135d1bdb r-4049cffb, validate_exam_questions 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle-crown-prep (fixed-pros): \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f2: part 2 of a series whose part 1 is not in the bundle); treatment-planning: no bundle"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "C.6: Pulse line, English mirror and the ten-scope lock (built by close)"
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
      "dentcast.json",
      "episodes/en/episode-164.html",
      "episodes/episode-163.html",
      "episodes/episode-164.html",
      "index.html",
      "plus/cabinet-papers.json",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-brain.json, dentcast-hashtag-reference.json, dentcast.json, episodes/en/episode-164.html, episodes/episode-163.html, episodes/episode-164.html, index.html, plus/cabinet-papers.json, plus/des-scores.json, plus/exam-questions.json, plus/faq-corpus.json, plus/pathways.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
