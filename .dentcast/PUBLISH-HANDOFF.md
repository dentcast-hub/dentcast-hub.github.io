# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "notecast/episode-44"
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
    "category": "notecast",
    "content_id": "notecast/episode-44",
    "context": {
      "approvals": [
        {
          "decision": "\u062a\u0631\u0645\u06cc\u0645 \u06a9\u0627\u0645\u067e\u0648\u0632\u06cc\u062a \u0642\u062f\u06cc\u0645\u06cc: \u0633\u0627\u06cc\u0644\u0646 \u0648 \u06a9\u06cc\u0648\u0631 \u0646\u06a9\u0631\u062f\u0646 \u0628\u0627\u0646\u062f\u06cc\u0646\u06af",
          "evidence": [
            "queue 05 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval #3 (1405/08/07, chat) recorded in queue 00-\u0648\u0636\u0639\u06cc\u062a.md; founder standing authorization 1405/08/06"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u062e\u0644\u0627\u0635\u0647\u200c\u0627\u06cc \u0627\u0632 \u062f\u0646\u062a\u200c\u06a9\u0633\u062a \u0628\u0631 \u0627\u0633\u0627\u0633 \u0645\u0637\u0627\u0644\u0639\u0647\u200c\u06cc Eliasson \u0648 Dahl (\u06f2\u06f0\u06f1\u06f7)\u061b \u0627\u062b\u0631 \u0633\u0627\u06cc\u0644\u0646 \u0648 \u06a9\u06cc\u0648\u0631 \u0646\u06a9\u0631\u062f\u0646 \u0628\u0627\u0646\u062f\u06cc\u0646\u06af \u0628\u0631 \u0627\u0633\u062a\u062d\u06a9\u0627\u0645 \u0628\u0627\u0646\u062f \u06a9\u0627\u0645\u067e\u0648\u0632\u06cc\u062a \u062c\u062f\u06cc\u062f \u0628\u0647 \u06a9\u0627\u0645\u067e\u0648\u0632\u06cc\u062a \u0642\u062f\u06cc\u0645\u06cc\u060c \u0648 \u067e\u0631\u0648\u062a\u06a9\u0644 \u067e\u06cc\u0634\u0646\u0647\u0627\u062f\u06cc \u062a\u0631\u0645\u06cc\u0645.",
          "evidence": [
            "queue 05 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; founder approval #5"
          ],
          "scope": "caption",
          "status": "confirmed"
        },
        {
          "decision": "queue 05 01-\u0645\u062a\u0646.md verbatim (sha256 dda5e116...cd577)",
          "evidence": [
            "founder approvals #1 and #4"
          ],
          "scope": "body text",
          "status": "confirmed"
        },
        {
          "decision": "bonding / advanced",
          "evidence": [
            "queue 05 07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md; founder approval #5"
          ],
          "scope": "pillar",
          "status": "confirmed"
        },
        {
          "decision": "link \u0627\u0633\u062a\u062d\u06a9\u0627\u0645 \u0628\u0627\u0646\u062f->/glossary/bond-strength.html, \u0633\u0627\u06cc\u0644\u0646->/glossary/silane.html; B1 \u0628\u0627\u0646\u062f\u06cc\u0646\u06af->bonding-protocol skip; B2 \u0627\u06cc\u0646 \u0627\u067e\u06cc\u0632\u0648\u062f->episode-44 skip",
          "evidence": [
            "queue 05 11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md defaults; founder approval #5 (\u00ab\u0647\u0645\u0647 \u062a\u0627\u06cc\u06cc\u062f\u00bb)"
          ],
          "scope": "in-body links 4.8",
          "status": "confirmed"
        },
        {
          "decision": "same file as episode 44, player only, no probe",
          "evidence": [
            "founder approval #8"
          ],
          "scope": "audio",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "evidence": [
            "sha256sum -c SHA256SUMS all 15 OK before lock",
            "queue commit 444b192fbb lock"
          ],
          "kind": "publish_queue_source",
          "source_ref": "queue/05-notecast-composite-repair-silane"
        },
        {
          "kind": "fixed_three_deliveries_v1"
        },
        {
          "kind": "fixed_three_deliveries_v2"
        },
        {
          "evidence": [
            "page body text equals 01-\u0645\u062a\u0646.md exactly (tag-stripped reconstruction check 2026-11-02)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "queue/05-notecast-composite-repair-silane/01-\u0645\u062a\u0646.md first paragraph (founder text, approval #1); queue 07 \u00a7\u067e\u0627\u0631\u0627\u06af\u0631\u0627\u0641 \u0627\u0641\u062a\u062a\u0627\u062d\u06cc\u0647: no agent-authored lead"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "note": "Founder inputs prepared and frozen in publish queue item 05; standing authorization 1405/08/06",
          "ref": "queue branch: queue/05-notecast-composite-repair-silane (SHA256SUMS verified 2026-11-02, queue commit 444b192fbb)"
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": []
    },
    "external_actions": [
      {
        "evidence": [
          "queue 05 04-\u0645\u0646\u0628\u0639/\u0645\u0646\u0627\u0628\u0639.md: drive_id 1UujF_qsYpTAHA_-4mniRO1NItUR_vBuK, renamed and moved 1405/08/07 during queue preparation (publish-queue.md exception 1; founder approval #2)"
        ],
        "id": "C.4.10.1:drive-move",
        "status": "completed",
        "target": "Google Drive cabinet Paper farzad/biomimetic/Bonding"
      }
    ],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Read complete: CLAUDE.md, publish-queue.md, global/README.md + dentcast_global_rules.py --read pages 1-3, agent-parity.md, workflows/README.md, publish-checkpoints.md, publish-handoff-tool.md, modules/01-hard-rules.md, modules/02-routing-intake.md (origin/main 11ab685)"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0: text yes (queue 05 01-\u0645\u062a\u0646.md) + paper yes (S1 Eliasson 2017, DOI 10.1080/23337931.2017.1301211; Part 1 Drive filing done in queue prep per publish-queue exception 1) -> normal publish + step 4.10"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase A: dentcast-brain.json read programmatically (585 entries, 14 types); latest notecast id 43 /notecast/episode-43.html keys type,id,title,caption,hashtags,keywords,url,pillar; parent episodes/episode-44 entry bonding/advanced; live PILLARS read from tools/build_pillar.py at origin/main 11ab685 (bonding subtopics incl. advanced)"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q1 category notecast from queue 05 07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md (founder request); announced per Hard Rule 14"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q2 live from main: notecast ids 2..43 no gap, notecast/episode-44.html absent, episodes/episode-44.html exists -> 44 (content_id notecast/episode-44), stated per Hard Rule 14"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3 text = queue 05 01-\u0645\u062a\u0646.md verbatim (sha256 dda5e116aadd8fda9a344cea04cc7a802679ce9e30ffe975d540b8f2b30cd577; founder approvals #1,#4)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5 run once in queue preparation: no AI tells, text unchanged (queue 05 07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md \u00a7Q3.5; approval #5); not rerun per publish-queue principle 11"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4 media: no image (notecast pages carry none); audio from sibling episodes/episode-44 audio_url https://episodes.s3.ir-thr-at1.arvanstorage.ir/dentcast44.m4a?versionId= (queue 07; founder approval #8: same file, no probe needed, only player)"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.7 paper attached: S1 (queue 05 04-\u0645\u0646\u0628\u0639/\u0645\u0646\u0627\u0628\u0639.md, drive_id 1UujF_qsYpTAHA_-4mniRO1NItUR_vBuK) -> step 4.10 active; Part 1 completed earlier (external action C.4.10.1:drive-move)"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.8 basket 2 RESEARCH, text_basis FULL_TEXT (S1). Founder-supplied complete DES+Fidelity JSON from queue 05 05-DES-Fidelity/ (des.json, fidelity.json, plan.json, \u0627\u062c\u0631\u0627.md) -> module 08 founder-supplied path with publish-queue exception 2; one shared DES record for the paper (also mirrored to episodes/episode-44, no Fidelity there)"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.9 not a Challenge: ordinary article (queue 05 07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md \u00a7Q4.9)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q5 Pulse from queue 05 07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md (approval #5): \u06cc\u06a9 \u0646\u0648\u062a\u200c\u06a9\u0633\u062a \u062a\u0627\u0632\u0647 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a href=\"/notecast/episode-44.html\">\u062a\u0631\u0645\u06cc\u0645 \u06a9\u0627\u0645\u067e\u0648\u0632\u06cc\u062a \u0642\u062f\u06cc\u0645\u06cc: \u0633\u0627\u06cc\u0644\u0646 \u0648 \u06a9\u06cc\u0648\u0631 \u0646\u06a9\u0631\u062f\u0646 \u0628\u0627\u0646\u062f\u06cc\u0646\u06af</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f; insertion live at C.6"
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
        "reason": "not LiteCast (locked category notecast); module 03 step 0 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast (locked category notecast); module 03 step 0 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast (locked category notecast); module 03 step 0 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast (locked category notecast); module 03 step 0 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast (locked category notecast); module 03 step 0 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template lock: notecast/episode-43.html sha256 404c03c7ec0885b8b6b9a5cc0a26935c0f8e53cd17f828a192234d2ec7dac5c7 (module 03 read via readpack lines 91-178)"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "notecast/episode-44.html cloned structurally from notecast/episode-43.html; body = queue 05 01-\u0645\u062a\u0646.md verbatim (bold lines as h4, list as ul), title/caption copied from 02-\u0639\u0646\u0648\u0627\u0646-\u06a9\u067e\u0634\u0646.md; .org identity kept; GA4 x1, preconnect ir/org x1 each with crossorigin, no trustseal; audio dentcast44.m4a from sibling episode; opening prose paragraph precedes list (author-original, queue 07)"
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
        "reason": "not LiteCast; LiteCast-only internal links step",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "not LiteCast; LiteCast-only kavosh step",
        "status": "skipped"
      },
      {
        "evidence": [
          "Pillar bonding / subtopic advanced: queue 05 07-\u0648\u0631\u0648\u062f\u06cc\u200c\u0647\u0627.md decision approved by founder (approval #5); both slugs present in live PILLARS at origin/main 11ab685 (Hard Rules 7/8); matches parent episodes/episode-44 entry"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "kavosh section on notecast/episode-44.html: \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 (/glossary/) + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc (/pillar/bonding/), dc-related-* classes, single section; audio capsule counted under 4.9"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "notecast/index.html hand-maintained static list (no generator): appended one li '\u0646\u0648\u062a\u200c\u06a9\u0633\u062a \u0686\u0647\u0644\u200c\u0648\u0686\u0647\u0627\u0631\u0645 \u2014 <title>' after episode-43 row (oldest-first order); CRLF kept; diff = 1 line"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Date/meta audit: datePublished/dateModified/lastReviewed/visible time = 2026-11-02 (all OK); canonical/og:url/hreflang/JSON-LD url/@id/breadcrumb = notecast/episode-44 on dentcast.org; title/og/twitter/breadcrumb/headline = approved title; description/og/twitter/JSON-LD description = approved caption"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Template integrity: notecast/episode-43.html sha256 404c03c7...c5c7 unchanged vs C.1"
        ],
        "id": "C.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "episodes/episode-44.html \u00ab\u0645\u062d\u062a\u0648\u0627\u06cc \u0645\u0631\u062a\u0628\u0637\u00bb: added <a href=/notecast/episode-44.html class=ep-related-link>\u062e\u0644\u0627\u0635\u0647\u200c\u06cc \u0646\u0648\u0634\u062a\u0627\u0631\u06cc (\u0646\u0648\u062a\u200c\u06a9\u0633\u062a)</a> per episode-43 markup; sha256 before 5c336b39...a7bc7 after 27f3ad5a...c6c1; only diff that line"
        ],
        "id": "C.4.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Neither side had a DES record or credit (des-scores.json has no episodes/episode-44 or notecast/episode-44; no Eliasson anywhere). Credit mirrored: episodes/episode-44.html gained .author CSS rule + \u00ab\u0646\u0648\u06cc\u0633\u0646\u062f\u0647:\u00bb block (Sigfus Thor Eliasson -> https://doi.org/10.1080/23337931.2017.1301211) right before \u00ab\u0645\u062d\u062a\u0648\u0627\u06cc \u0645\u0631\u062a\u0628\u0637\u00bb per episode-43/12 precedent; same DOI as notecast credit. DES sources[] mirror to episodes/episode-44 (no fidelity) is written together with the single shared record at C.4.13 Part 4."
        ],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist-only prev/next step; category notecast",
        "status": "skipped"
      },
      {
        "evidence": [
          "4.7 analysis (queue 05 11-\u0644\u06cc\u0646\u06a9\u200c\u0647\u0627\u06cc-\u06af\u0644\u0627\u0633\u0631\u06cc.md, glossary.json sha256 18214ce1... unchanged on main 11ab685 -> no new candidates): related silane, bond-strength (bonding-protocol borderline). Live kavosh counts: silane 5, bond-strength 5, bonding-protocol 5 -> all at Hard Rule 9 cap, nothing added; oxygen-inhibition-layer unrelated"
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
        "reason": "glossary-publish-only scoped cross-link step; category notecast",
        "status": "skipped"
      },
      {
        "evidence": [
          "4.8 (queue 05 11 decisions, approval #5; glossary unchanged, no new episodes in brain since prep): linked first occurrences \u0627\u0633\u062a\u062d\u06a9\u0627\u0645 \u0628\u0627\u0646\u062f->/glossary/bond-strength.html (opening para) and \u0633\u0627\u06cc\u0644\u0646->/glossary/silane.html (\u0645\u0637\u0627\u0644\u0639\u0647 \u0686\u0647 \u06a9\u0631\u062f para), class glossary-link; B1/B2 skipped per approved defaults. sha256 before f86e02ce...0649 after abcf9712...6a86"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.9 fresh brain comparison (585 entries incl. 3 added since prep: insight-100, share-43, insight-101 \u2014 unrelated). Section had 3 (\u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647, \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc, \u0646\u0633\u062e\u0647\u200c\u06cc \u0635\u0648\u062a\u06cc -> episode-44); added dentai/dentai-8 '\u06a9\u06cc\u0648\u0631 \u06a9\u0631\u062f\u0646 \u06cc\u0627 \u0646\u06a9\u0631\u062f\u0646 \u0628\u0627\u0646\u062f\u06cc\u0646\u06af \u0642\u0628\u0644 \u0627\u0632 \u06a9\u0627\u0645\u067e\u0648\u0632\u06cc\u062a' (same cure decision) -> 4/5. Considered and discarded as tangential (different substrate): notecast/episode-42, notecast/episode-43, sharehub/share-41, dentai/dentai-30, episodes/episode-10. sha256 before abcf9712...6a86 after f72676ac...44e5"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "dentcast-brain.json",
      "dentcast_cabinet_full_catalog.json",
      "episodes/episode-44.html",
      "index.html",
      "notecast/en/episode-44.html",
      "notecast/episode-44.html",
      "notecast/index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: notecast/episode-44.html, notecast/index.html, episodes/episode-44.html"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
