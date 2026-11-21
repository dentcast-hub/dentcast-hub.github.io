# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "dentcast-plus/video-17"
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
    "category": "dentcast_plus",
    "content_id": "dentcast-plus/video-17",
    "context": {
      "approvals": [
        {
          "decision": "\u067e\u0644\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646 \u067e\u0631\u0648\u062a\u0632 \u06a9\u062c\u0647\u061b \u067e\u0631\u0648\u062a\u0632 \u0631\u0648 \u062f\u0648\u0628\u0627\u0631\u0647 \u0628\u0633\u0627\u0632\u06cc\u0645\u061f",
          "evidence": [
            "standing acceptance: agent-composed title (hook question of the founder-approved caption), recorded for the Push-2 report"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "\u067e\u0644\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646 \u067e\u0631\u0648\u062a\u0632 \u06a9\u062c\u0647\u061b \u067e\u0631\u0648\u062a\u0632 \u0631\u0648 \u062f\u0648\u0628\u0627\u0631\u0647 \u0628\u0633\u0627\u0632\u06cc\u0645\u061f\n\n\u0628\u06cc\u0645\u0627\u0631 \u0628\u0627 \u0647\u0645\u06cc\u0646 \u067e\u0631\u0648\u062a\u0632 \u0627\u0648\u0645\u062f\u0647.\n\u067e\u0644\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646 \u067e\u0631\u0648\u062a\u0632 \u0628\u0627 \u0635\u0648\u0631\u062a \u0645\u0648\u0627\u0632\u06cc \u0646\u06cc\u0633\u062a\u061b \u06cc\u0647 \u0637\u0631\u0641 \u0628\u0627\u0644\u0627\u062a\u0631\u0647 \u0648 \u0637\u0631\u0641 \u062f\u06cc\u06af\u0647 \u067e\u0627\u06cc\u06cc\u0646\u200c\u062a\u0631.\n\n\u0633\u0624\u0627\u0644 \u0627\u06cc\u0646\u0647 \u06a9\u0647 \u067e\u0631\u0648\u062a\u0632 \u0631\u0648 \u062f\u0648\u0628\u0627\u0631\u0647 \u0628\u0633\u0627\u0632\u06cc\u0645 \u06cc\u0627 \u0646\u0647.\n\n\u0648\u0644\u06cc \u0627\u06cc\u0646 \u06a9\u062c\u06cc \u0627\u0632 \u062e\u0648\u062f \u067e\u0631\u0648\u062a\u0632 \u0634\u0631\u0648\u0639 \u0646\u0634\u062f\u0647. \u0634\u0631\u0648\u0639\u0634 \u0632\u06cc\u0631 \u067e\u0631\u0648\u062a\u0632\u0647.\n\n\ud83c\udfa5 \u0648\u06cc\u062f\u06cc\u0648 \u0627\u0632 @moradent21\u060c \u0628\u0627 \u0627\u062c\u0627\u0632\u0647\u0654 \u0645\u0646\u062a\u0634\u0631\u06a9\u0646\u0646\u062f\u0647",
          "evidence": [
            "founder data: Instagram caption the founder approved in chat 2026-11-21 and asked to use for this page, prefixed with the title line per video-14/15/16 precedent; site line and hashtags excluded"
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
          "from_step": "C.2",
          "kind": "dependency_invalidation_v1",
          "reason": "Founder (chat 2026-11-21): \u00ab\u062a\u0648 \u0633\u0627\u06cc\u062a\u0645 \u0633\u0648\u0627\u0644 \u0647\u0645 \u0627\u0632 \u0645\u062a\u0646 \u062a\u06cc \u062a\u06cc \u0627\u0633 \u062f\u0631 \u0628\u06cc\u0627\u0631\u00bb \u2014 the TTS narration becomes the page body and the exam questions are drawn from it; approved-page body changes, so everything from C.2 reopens (DES, links, FAQ, hashtags, brain, pathways/M2, English, Pulse)",
          "superseded": {
            "approvals": [],
            "delivery": [],
            "inputs": [
              {
                "note": "Instagram caption the founder approved in chat 2026-11-21 and asked to use for this page (agent-drafted, founder-approved; hashtags and site line excluded)",
                "ref": "founder-chat:instagram-caption",
                "sha256": "5263344e434d9c424c8e739e78e36c3a6ba9159d5a01707a9e122fb99155f967"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "dentcast-plus/video-17.html cloned from video-16 (structure only): caption as body <p>s (7 paragraphs, author_original lead), title/meta/OG/Twitter/JSON-LD/breadcrumb swapped, ArvanVOD 0ER38L3P1Q (iframe name, config, HLS master, thumbnail) + YouTube o6etIO47y9Q, dates 2026-11-21, .org domain kept, GA x1, 2 preconnect, no seal; cloned semantic capsules removed (4.9 refills); no chip row in template"
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
                "reason": "LiteCast-only (category dentcast_plus)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast-only (category dentcast_plus)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "pillar occlusion / subtopic occlusal-analysis-adjustment (closest semantic match: the page is about a canted occlusal plane whose origin is below the prosthesis, i.e. occlusal-plane analysis before restoring; competing: treatment-planning/comprehensive-diagnosis (remake-or-not question) and removable-pros (no partial-denture subtopic) \u2014 occlusion chosen because the decisive concept is the occlusal plane, not the denture type)"
                ],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "typed brain entry branch: 2 capsules \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/occlusion/ in cloned dc-related-section (cloned semantic capsules of video-16 removed); note: body has 6 <p> (C.2 evidence said 7 \u2014 correction)"
                ],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "dentcast-plus/index.html hand-maintained static grid: video-card for video-17 added first (newest-first), sibling markup, thumbnail 0ER38L3P1Q, title verbatim"
                ],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "date audit: JSON-LD uploadDate/datePublished/dateModified 2026-11-21 (today) \u2014 all OK; no visible body date in template"
                ],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "git diff --quiet -- dentcast-plus/video-16.html: clean"
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
                "reason": "NoteCast-only step (category dentcast_plus)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "NoteCast/episode pair only (category dentcast_plus)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": "no ep-nav block on dentcast-plus pages (not a numbered series)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.1",
                "module": "06-paper-ingestion.md",
                "reason": "no paper attached (Q4.7)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.2",
                "module": "06-paper-ingestion.md",
                "reason": "no paper attached (Q4.7)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.4.10.3",
                "module": "06-paper-ingestion.md",
                "reason": "no paper attached (Q4.7)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "DES COMMENTARY: source_text = page body (6 paragraphs, FULL_TEXT); SOURCE call claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964\u2026) --tools '' --model opus, fresh empty dir, model reported claude-opus-5-5; des 3.7 score 5 band E (5 + 0; all four checklist items 0); Part 3 checks: quotes (all empty) OK, arithmetic OK, band E OK, schema == video-16 keyset OK; des_record_guard check OK; verify_publish --des-text ok; Part 3(6): interpretation_fa sentence 1 narrowed by agent ('\u0628\u0647 \u0633\u0627\u062e\u062a\u0627\u0631 \u0632\u06cc\u0631 \u067e\u0631\u0648\u062a\u0632' -> '\u0634\u0631\u0648\u0639 \u06a9\u062c\u06cc \u2026 \u0628\u0647 \u0632\u06cc\u0631 \u067e\u0631\u0648\u062a\u0632', text says only \u00ab\u0634\u0631\u0648\u0639\u0634 \u0632\u06cc\u0631 \u067e\u0631\u0648\u062a\u0632\u0647\u00bb); no FIDELITY owed (basket 1 COMMENTARY self-record, des_fidelity_units: 0 units); stored plus/des-scores.json dentcast-plus/video-17 (scored_at 2026-11-21, no fidelity key); no M3b"
                ],
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "4.7 fresh semantic review of 110 glossary terms: 0 applied. No glossary term for occlusal plane/supraeruption exists. Borderline skipped: treatment-plan (the page poses a remake question but does not discuss treatment planning itself), vertical-dimension-of-occlusion / dahl-concept (not the page's concept), overdenture (denture type not named)"
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
                "reason": "scoped cross-link runs only on a glossary publish (category dentcast_plus)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "4.8 analyzed body (6 paragraphs) vs glossary + brain: 0 applied. Borderline skipped: \u00ab\u067e\u0644\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646\u00bb -> insight-78 (that page is about interocclusal space, not the occlusal-plane concept itself), \u00ab\u067e\u0631\u0648\u062a\u0632 \u0631\u0648 \u062f\u0648\u0628\u0627\u0631\u0647 \u0628\u0633\u0627\u0632\u06cc\u0645\u00bb -> treatment-plan (question, not the concept), \u00ab\u0632\u06cc\u0631 \u067e\u0631\u0648\u062a\u0632\u00bb -> any supraeruption page (would name what the body deliberately leaves unnamed; not the same phrase sense)"
                ],
                "id": "C.4.8",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "4.9: 2 nav capsules + 3 free; added strongest first: insight-78 (assess the occlusal plane before deciding), insight-6 (disrupted occlusal plane after loss of posterior stop), chairside-31 (unopposed tooth consumed the restorative space); related_cap 5/5 at_cap. Considered & left out (no slot / weaker): chairside-19 (anterior supraeruption), insight-46 (cusp height vs antagonist), insight-8 (stable interference), episode-160 SDA"
                ],
                "id": "C.4.9",
                "module": "05-semantic-linking.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.4.11",
                "module": "07-flashcards-and-quiz.md",
                "reason": "DentCast+ optional (module 07): the page text is a hook caption that deliberately withholds the clinical explanation (it lives in the recording), so no complete single concept to card; documented skip, no fabricated card (Hard Rule 13)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "4.12: FAQPage #faq 2 questions in plus/faq-corpus.json byContent dentcast-plus/video-17 (not in page JSON-LD), both standalone (no deixis: embed \u00ab\u067e\u0644\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646 \u06cc\u06a9 \u067e\u0631\u0648\u062a\u0632\u00bb), both yes/no with verdict first (\u062e\u06cc\u0631/\u0628\u0644\u0647) -> 2 binary for quiz bank; answers grounded verbatim in body sentences 3 and 5; 4.12-\u0628 evaluated at 5.6"
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
                "reason": "ordinary post, not a \u0686\u0627\u0644\u0634 (Q4.9)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "5.0 questions: \u00ab\u067e\u0644\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646 \u067e\u0631\u0648\u062a\u0632 \u06a9\u062c\u0647\u060c \u067e\u0631\u0648\u062a\u0632 \u0631\u0648 \u062f\u0648\u0628\u0627\u0631\u0647 \u0628\u0633\u0627\u0632\u0645\u061f\u00bb, \u00ab\u067e\u0631\u0648\u062a\u0632 \u067e\u0644\u0646\u0634 \u0628\u0627 \u0635\u0648\u0631\u062a \u0645\u0648\u0627\u0632\u06cc \u0646\u06cc\u0633\u062a \u0639\u0644\u062a\u0634 \u0686\u06cc\u0647\u061f\u00bb, \u00abcanted occlusal plane denture remake\u00bb, \u00ab\u06a9\u062c\u06cc \u067e\u0644\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646 \u067e\u0631\u0648\u062a\u0632 \u0627\u0632 \u06a9\u062c\u0627\u0633\u062a\u061f\u00bb. Tags (all reused canonical, no mint): #\u0648\u06cc\u062f\u06cc\u0648 (series), #\u067e\u0644\u0627\u0646_\u0627\u06a9\u0644\u0648\u0698\u0646 (2->3, specific; \u00ab\u067e\u0644\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646 \u067e\u0631\u0648\u062a\u0632 \u0628\u0627 \u0635\u0648\u0631\u062a \u0645\u0648\u0627\u0632\u06cc \u0646\u06cc\u0633\u062a\u061b \u06cc\u0647 \u0637\u0631\u0641 \u0628\u0627\u0644\u0627\u062a\u0631\u0647 \u0648 \u0637\u0631\u0641 \u062f\u06cc\u06af\u0647 \u067e\u0627\u06cc\u06cc\u0646\u200c\u062a\u0631.\u00bb), #\u0637\u0631\u062d_\u062f\u0631\u0645\u0627\u0646 (decision; \u00ab\u0648\u0644\u06cc \u0627\u06cc\u0646 \u06a9\u062c\u06cc \u0627\u0632 \u062e\u0648\u062f \u067e\u0631\u0648\u062a\u0632 \u0634\u0631\u0648\u0639 \u0646\u0634\u062f\u0647. \u0634\u0631\u0648\u0639\u0634 \u0632\u06cc\u0631 \u067e\u0631\u0648\u062a\u0632\u0647.\u00bb rules the prosthesis out as origin of the remake question), #\u0627\u06a9\u0644\u0648\u0698\u0646 (umbrella, in addition). Not tagged: #\u0633\u0648\u067e\u0631\u0627\u0627\u0631\u0627\u067e\u0634\u0646 (never named in text \u2014 would tag what the page withholds), #\u067e\u0631\u0648\u062a\u0632_\u0645\u062a\u062d\u0631\u06a9 (text never says removable), #\u062a\u06a9\u0631\u0627\u0631_\u06a9\u0627\u0631 (use_when = redo as logical result; page does not take that decision). 4 tags < 5 target: no further concept resolved, no mint warranted (Step 4). --sync done, build_plus_index run+reverted, --check OK, build_cabinet_papers --check OK; reachability: chip \u00ab\u067e\u0644\u0627\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646\u00bb (3 pages: insight-6, insight-78, video-17) -> page within first 4 of a chip: pass. No chip row in template."
                ],
                "id": "C.5.0",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "brain entry appended at array end: type dentcast_plus, video 17, title, caption (= title + founder-approved caption, site line/hashtags excluded), 4 canonical hashtags, 8 keywords, page_url, pillar occlusion/[]/occlusal-analysis-adjustment; key set/order == video-16"
                ],
                "id": "C.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "pillar recorded == step 2.4 (occlusion/occlusal-analysis-adjustment, existing subtopic); capsule /pillar/occlusion/ matches"
                ],
                "id": "C.5.5",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.5.6",
                "module": "10-brain-and-pathways.md",
                "reason": null,
                "status": "started"
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
          "answer": "\u062a\u0648 \u0633\u0627\u06cc\u062a\u0645 \u0633\u0648\u0627\u0644 \u0647\u0645 \u0627\u0632 \u0645\u062a\u0646 \u062a\u06cc \u062a\u06cc \u0627\u0633 \u062f\u0631 \u0628\u06cc\u0627\u0631",
          "effect": "the drafted caption-only question is withdrawn; the TTS narration becomes the page body (invalidation from C.2) and new exam questions are drafted from it for a fresh M2",
          "evidence": [
            "founder chat 2026-11-21"
          ],
          "kind": "founder_answer",
          "message": "M2",
          "step": "C.5.6"
        },
        {
          "from_step": "B.3",
          "kind": "dependency_invalidation_v1",
          "reason": "text of record changes from the caption to the TTS narration (founder request): reopen B.3 onward so the new text input can be bound",
          "superseded": {
            "approvals": [],
            "delivery": [],
            "inputs": [
              {
                "note": "Instagram caption the founder approved in chat 2026-11-21 and asked to use for this page (agent-drafted, founder-approved; hashtags and site line excluded)",
                "ref": "founder-chat:instagram-caption",
                "sha256": "5263344e434d9c424c8e739e78e36c3a6ba9159d5a01707a9e122fb99155f967"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "text = Instagram caption founder approved in chat and asked to use for this page (sha bound in context.inputs); site line + hashtags excluded from page text"
                ],
                "id": "B.3",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q3.5: caption short, conversational, no AI tells (no formulaic openers, no clich\u00e9s, no hedge stacking); text unchanged"
                ],
                "id": "B.3.5",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "media: ArvanVOD 0ER38L3P1Q (iframe/HLS/config/thumbnail/video URLs from founder screenshot; host unreachable from sandbox, URLs copied verbatim), YouTube Shorts o6etIO47y9Q (founder link); no image/audio/transcript in video precedent"
                ],
                "id": "B.4",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q4.7: no paper file attached -> step 4.10 skipped"
                ],
                "id": "B.4.7",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q4.8 basket 1 COMMENTARY: page text is DentCast's own clinical reasoning on the clip, no DOI/PubMed/references -> C.4.13 COMMENTARY track on page text"
                ],
                "id": "B.4.8",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q4.9: \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (video post, not a challenge)"
                ],
                "id": "B.4.9",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "Q5 Pulse: agent draft in video-16 precedent pattern \u00ab\u06cc\u06a9 \u0648\u06cc\u062f\u06cc\u0648 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb (title-only, no spoiler); written at C.6"
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
                "reason": "LiteCast branch inactive: category dentcast_plus",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.1",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast-only step (category dentcast_plus)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.2",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast-only step (category dentcast_plus)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.3",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast-only step (category dentcast_plus)",
                "status": "skipped"
              },
              {
                "evidence": [],
                "id": "C.0.4",
                "module": "03-litecast-and-page.md",
                "reason": "LiteCast-only step (category dentcast_plus)",
                "status": "skipped"
              },
              {
                "evidence": [
                  "template dentcast-plus/video-16.html (latest same-category page) enrolled in target_paths"
                ],
                "id": "C.1",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "C.2",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.0.5",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
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
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "pending"
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
          "from_step": "rules",
          "kind": "dependency_invalidation_v1",
          "reason": "text input changes (caption -> TTS narration, founder request); tool requires all steps pending before a new input binding",
          "superseded": {
            "approvals": [],
            "delivery": [],
            "inputs": [
              {
                "note": "Instagram caption the founder approved in chat 2026-11-21 and asked to use for this page (agent-drafted, founder-approved; hashtags and site line excluded)",
                "ref": "founder-chat:instagram-caption",
                "sha256": "5263344e434d9c424c8e739e78e36c3a6ba9159d5a01707a9e122fb99155f967"
              }
            ],
            "steps": [
              {
                "evidence": [
                  "read README.md, global/README.md + selector (8 sections, 5 pages), agent-parity.md, publish-checkpoints.md, publish-handoff-tool.md, modules 01/02 complete; capability: ls-remote ok, push to ccr branch, claude -p isolated OK, GitHub MCP for Actions/PR/merge"
                ],
                "id": "rules",
                "module": "01-hard-rules.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "text yes (founder-approved caption), paper file no -> normal publish, no paper branch"
                ],
                "id": "0",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "brain parsed: 16 dentcast_plus entries, last video-16 keyset [type,video,title,caption,hashtags,keywords,page_url,pillar]; PILLARS read live (11 pillars)"
                ],
                "id": "A",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "type dentcast_plus (founder: video with ArvanVOD + YouTube links; \u00ab\u0648\u06cc\u062f\u06cc\u0648\u0647\u0627\u00bb section; precedent video-16)"
                ],
                "id": "B.1",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [
                  "next number video 17 (max 16 + 1, no gap)"
                ],
                "id": "B.2",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "completed"
              },
              {
                "evidence": [],
                "id": "B.3",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "B.3.5",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "B.4",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "B.4.7",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "B.4.8",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "B.4.9",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "B.5",
                "module": "02-routing-intake.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.0",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.0.1",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.0.2",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.0.3",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.0.4",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.1",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.2",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.0.5",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.0.6",
                "module": "03-litecast-and-page.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.2.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.2.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.2.6",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.3",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.5",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.5-b",
                "module": "04-taxonomy-and-navigation.md",
                "reason": null,
                "status": "pending"
              },
              {
                "evidence": [],
                "id": "C.4.6",
                "module": "04-taxonomy-and-navigation.md",
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
                "id": "C.4.13",
                "module": "08-des-fidelity.md",
                "reason": null,
                "status": "pending"
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
          "answer": "\u0633\u0648\u0627\u0644 \u0646\u0645\u06cc\u062e\u0648\u0627\u062f \u062f\u0627\u0634\u062a\u0647 \u0628\u0627\u0634\u0647\u060c \u0628\u062f\u0648\u0646 \u0633\u0648\u0627\u0644 \u0645\u0646\u062a\u0634\u0631 \u06a9\u0646\u060c \u0645\u0631\u062c \u06a9\u0646",
          "effect": "2 drafted rows written with status review + review_note (video-16 precedent); not drawn by the API; DES record kept (already computed, basket 1)",
          "evidence": [
            "founder chat 2026-11-21, M2 answer"
          ],
          "kind": "founder_answer",
          "message": "M2",
          "step": "C.5.6"
        },
        {
          "evidence": [
            "dentcast-plus/video-17.html .text-box"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "page body = the TTS narration the founder asked to put on the site (chat 2026-11-21); its first paragraph opens the body; no agent lead added (no list in body)"
        },
        {
          "english": {
            "evidence": [
              "file on disk; noindex, follow; 0 hreflang; GA x1; toggle ../video-17.html"
            ],
            "path": "dentcast-plus/en/video-17.html",
            "status": "ready"
          },
          "evidence": [
            "agent Push-2 report"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13 DES COMMENTARY 3.7 score 9 band E on the narration body, stored in plus/des-scores.json; no FIDELITY owed (basket 1)"
              ],
              "scope": "scientific",
              "status": "resolved"
            },
            {
              "evidence": [
                "Q4.9 \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc; C.4.14 skipped"
              ],
              "scope": "challenge",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "C.2.4 occlusion/occlusal-analysis-adjustment"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 0 applied (treatment-plan at cap), C.4.8 1 applied (\u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646 -> /glossary/treatment-plan.html), C.4.9 3 capsules (5/5 at cap)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.0 5 canonical tags, no mint, --check OK"
              ],
              "scope": "hashtags",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5 brain entry video 17 at array end; faq-corpus FAQ 3 + cards 3"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.5.6 occlusion after insight-6 + treatment-planning after insight-78; 2 exam rows status review per founder M2"
              ],
              "scope": "pathways",
              "status": "resolved"
            },
            {
              "evidence": [
                "index.html Pulse new top line -> /dentcast-plus/video-17.html, bottom (share-56) removed, 7 lines"
              ],
              "scope": "pulse",
              "status": "resolved"
            },
            {
              "evidence": [
                "dentcast-plus/en/video-17.html authored from en/video-16 precedent, narration translated; toggles inverse; noindex, 0 hreflang"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title standing acceptance, caption founder-approved; M2 answered; no M1/M3b"
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
          "note": "Instagram caption the founder approved in chat 2026-11-21 and asked to use for this page (agent-drafted, founder-approved; hashtags and site line excluded)",
          "ref": "founder-chat:instagram-caption",
          "sha256": "5263344e434d9c424c8e739e78e36c3a6ba9159d5a01707a9e122fb99155f967"
        },
        {
          "note": "TTS narration (sections 1\u20138, plain text) the founder asked to put on the page; agent-written, founder-voiced and approved",
          "ref": "founder-chat:tts-script",
          "sha256": "49a7f68509021267058e8bd1f504f23cd6d0aab2e404b93232070942bdd52c35"
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
          "rules sources unchanged and read complete this session (README, global/README + selector 8 sections, agent-parity, publish-checkpoints, handoff-tool, modules 01/02); capability: ls-remote ok, push to ccr branch ok (save point 3f90c2cc), claude -p isolated ok, GitHub MCP"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text yes (TTS narration the founder asked to put on the page + founder-approved caption as description), paper no -> normal publish"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain parsed: dentcast_plus last same-category precedent video-16 keyset [type,video,title,caption,hashtags,keywords,page_url,pillar]; PILLARS live"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "type dentcast_plus (video, precedent video-16)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "video 17 (max 16 + 1)"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "text of record = TTS narration sections 1\u20138 (plain, diacritics removed, closing \u00ab\u062f\u0646\u062a\u200c\u06a9\u0633\u062a\u00bb dropped) per founder \u00ab\u062a\u0648 \u0633\u0627\u06cc\u062a\u0645 \u0633\u0648\u0627\u0644 \u0647\u0645 \u0627\u0632 \u0645\u062a\u0646 \u062a\u06cc \u062a\u06cc \u0627\u0633 \u062f\u0631 \u0628\u06cc\u0627\u0631\u00bb; caption (founder-approved Instagram hook) kept as description; both bound by digest"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q3.5 on the narration: spoken, concrete, no formulaic openers/clich\u00e9s/hedge stacking; text unchanged"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "media: ArvanVOD 0ER38L3P1Q (founder screenshot URLs), YouTube Shorts o6etIO47y9Q (founder link)"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "no paper attached"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "basket 1 COMMENTARY: narration is DentCast's own clinical reasoning on the case, no DOI/PubMed/references"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "\u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: \u00ab\u06cc\u06a9 \u0648\u06cc\u062f\u06cc\u0648 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb (title only, no spoiler)"
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
        "reason": "LiteCast branch inactive: category dentcast_plus",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [
          "template dentcast-plus/video-16.html enrolled; unchanged"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-plus/video-17.html (clone of video-16, structure only): body = 9 <p> (8 narration paragraphs + credit line \u00ab\ud83c\udfa5 \u0648\u06cc\u062f\u06cc\u0648 \u0627\u0632 @moradent21\u060c \u0628\u0627 \u0627\u062c\u0627\u0632\u0647\u0654 \u0645\u0646\u062a\u0634\u0631\u06a9\u0646\u0646\u062f\u0647\u00bb), no list; meta description/OG/Twitter/JSON-LD description = caption (founder-approved hook); title/canonical/breadcrumb swapped; ArvanVOD 0ER38L3P1Q + YouTube o6etIO47y9Q; dates 2026-11-21; .org kept; GA x1; 2 preconnect; no seal; lang-btn -> en/video-17.html; inLanguage fa"
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
        "reason": "LiteCast-only (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar occlusion / subtopic occlusal-analysis-adjustment (re-decided on the new body: the page analyses a canted occlusal plane caused by supraerupted unopposed teeth and resolves it by correcting the plane \u2014 reduction, endo + reduction, extraction \u2014 before the prosthesis = occlusal analysis & adjustment; competing treatment-planning/comprehensive-diagnosis (the remake question) and removable-pros (no partial-denture subtopic) recorded, occlusion kept as the decisive concept)"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "2 nav capsules \u062f\u0627\u0646\u0634\u0646\u0627\u0645\u0647 /glossary/ + \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc /pillar/occlusion/ in dc-related-section"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "dentcast-plus/index.html static grid: video-17 card first (CRLF preserved, 10-line insertion), thumbnail 0ER38L3P1Q, title verbatim"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "JSON-LD uploadDate/datePublished/dateModified 2026-11-21 \u2014 OK; no visible date"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- dentcast-plus/video-16.html: clean"
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
        "reason": "NoteCast-only step (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast/episode pair only (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "no ep-nav block on dentcast-plus pages (not a numbered series)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "no paper attached (Q4.7)",
        "status": "skipped"
      },
      {
        "evidence": [
          "DES rerun on new body (narration 8 paragraphs + credit, FULL_TEXT): SOURCE call claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964\u2026) --tools '' --model opus, fresh empty dir, model reported claude-opus-5-5; COMMENTARY 3.7 score 9 band E (5 + item1 4, quote \u00ab\u062f\u0646\u062f\u0627\u0646\u06cc \u06a9\u0647 \u0622\u0646\u062a\u0627\u06af\u0648\u0646\u06cc\u0633\u062a \u0646\u062f\u0627\u0631\u062f\u060c \u0628\u0647 \u0633\u0645\u062a \u0641\u0636\u0627\u06cc \u062e\u0627\u0644\u06cc \u0631\u0648\u06cc\u0634 \u0627\u062f\u0627\u0645\u0647 \u0645\u06cc\u200c\u062f\u0647\u062f.\u00bb verbatim); arithmetic OK, band OK, schema OK, des_record_guard check OK, verify_publish --des-text ok; Part 3(6): interpretation_fa sentence narrowed by agent (model dropped the text's condition: '\u067e\u0631\u0648\u062a\u0632 \u062c\u062f\u06cc\u062f \u0647\u0645\u0627\u0646 \u06a9\u062c\u06cc \u0631\u0627 \u062a\u06a9\u0631\u0627\u0631 \u0645\u06cc\u200c\u06a9\u0646\u062f' -> '\u067e\u0631\u0648\u062a\u0632\u06cc \u06a9\u0647 \u0628\u062f\u0648\u0646 \u0627\u0635\u0644\u0627\u062d \u0647\u0645\u06cc\u0646 \u067e\u0644\u0646 \u0633\u0627\u062e\u062a\u0647 \u0634\u0648\u062f \u2026'); no FIDELITY owed (basket 1); replaced the earlier caption-based record (score 5) in plus/des-scores.json dentcast-plus/video-17 via json_replace_value; no M3b; save point already delivered at 3f90c2cc (Push 2 carries this record)"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.7 fresh review on new body: strong candidate treatment-plan (body: \u00ab\u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646 \u0627\u0632 \u0627\u0635\u0644\u0627\u062d \u067e\u0644\u0646 \u0634\u0631\u0648\u0639 \u0645\u06cc\u200c\u0634\u0648\u062f\u00bb) \u2014 skipped: glossary/treatment-plan.html at cap 5/5 (related_cap). Others none: no glossary term for occlusal plane/supraeruption; vertical-dimension-of-occlusion, dahl-concept, overdenture not the page's concept"
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
        "reason": "scoped cross-link runs only on a glossary publish (category dentcast_plus)",
        "status": "skipped"
      },
      {
        "evidence": [
          "4.8 on new body: 1 applied \u2014 \u00ab\u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646\u00bb (first occurrence, paragraph 1, technical sense: the case's treatment plan) -> /glossary/treatment-plan.html, plain <a> like sibling body links; anchor added around unchanged words (text lock kept). Borderline skipped: \u00ab\u0633\u0648\u067e\u0631\u0627\u0627\u0631\u0627\u067e\u0634\u0646\u00bb -> chairside-31/chairside-19/insight-46 (case pages, not a page about the concept itself), \u00ab\u067e\u0644\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646\u00bb -> insight-78 (about interocclusal space), \u00ab\u0622\u0646\u062a\u0627\u06af\u0648\u0646\u06cc\u0633\u062a\u00bb/\u00ab\u0627\u0633\u062a\u062e\u0648\u0627\u0646 \u0622\u0644\u0648\u0626\u0648\u0644\u0627\u0631\u00bb (no target page about them)"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.9 re-checked on new body: kept insight-78 (assess the occlusal plane before deciding), insight-6 (disrupted occlusal plane after posterior stop loss), chairside-31 (unopposed tooth consumed the space; reduction justified) \u2014 still the strongest; related_cap 5/5 at_cap. Left out: chairside-19, insight-46, insight-8, episode-160"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.11 (DentCast+ optional; the narration now carries the clinical concepts, so run): plus/faq-corpus.json byContent dentcast-plus/video-17 definedTermSets #flashcards-c1..c3, all authored from body (c1 supraeruption, c2 effect on the prosthesis plane, c3 plane-correction options), no near-copy of FAQ answers; none in page JSON-LD"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "4.12: FAQPage #faq rewritten to 3 questions (replacing the 2 caption-based ones), all standalone (no deixis), all yes/no with verdict first (\u062e\u06cc\u0631/\u062e\u06cc\u0631/\u0628\u0644\u0647) -> 3 binary; answers grounded in body paragraphs 5, 7, 8; 4.12-\u0628 evaluated at 5.6"
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
        "reason": "ordinary post, not a \u0686\u0627\u0644\u0634 (Q4.9)",
        "status": "skipped"
      },
      {
        "evidence": [
          "5.0 questions: \u00ab\u067e\u0644\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646 \u067e\u0631\u0648\u062a\u0632 \u06a9\u062c\u0647\u060c \u062f\u0648\u0628\u0627\u0631\u0647 \u0628\u0633\u0627\u0632\u0645\u061f\u00bb, \u00ab\u062f\u0646\u062f\u0627\u0646 \u0628\u06cc\u200c\u0622\u0646\u062a\u0627\u06af\u0648\u0646\u06cc\u0633\u062a \u0628\u0627\u0644\u0627 \u0627\u0648\u0645\u062f\u0647\u060c \u0642\u0628\u0644 \u0627\u0632 \u067e\u0631\u0648\u062a\u0632 \u0686\u06cc\u200c\u06a9\u0627\u0631 \u06a9\u0646\u0645\u061f\u00bb, \u00absupraeruption occlusal plane before denture\u00bb, \u00ab\u06a9\u062c\u06cc \u067e\u0644\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646 \u0627\u0632 \u06a9\u062c\u0627 \u0645\u06cc\u0627\u062f\u061f\u00bb. Tags (reused canonical, no mint): #\u0648\u06cc\u062f\u06cc\u0648 (series), #\u0633\u0648\u067e\u0631\u0627\u0627\u0631\u0627\u067e\u0634\u0646 (7->8, specific; \u00ab\u062f\u0646\u062f\u0627\u0646\u06cc \u06a9\u0647 \u0622\u0646\u062a\u0627\u06af\u0648\u0646\u06cc\u0633\u062a \u0646\u062f\u0627\u0631\u062f\u060c \u0628\u0647 \u0633\u0645\u062a \u0641\u0636\u0627\u06cc \u062e\u0627\u0644\u06cc \u0631\u0648\u06cc\u0634 \u0627\u062f\u0627\u0645\u0647 \u0645\u06cc\u200c\u062f\u0647\u062f. \u0628\u0647 \u0627\u06cc\u0646 \u0645\u06cc\u200c\u06af\u0648\u06cc\u06cc\u0645 \u0633\u0648\u067e\u0631\u0627\u0627\u0631\u0627\u067e\u0634\u0646.\u00bb), #\u067e\u0644\u0627\u0646_\u0627\u06a9\u0644\u0648\u0698\u0646 (2->3, specific; \u00ab\u062f\u0646\u062f\u0627\u0646\u200c\u0647\u0627\u06cc \u0628\u06cc\u200c\u0622\u0646\u062a\u0627\u06af\u0648\u0646\u06cc\u0633\u062a \u0628\u0627\u0644\u0627 \u0648 \u067e\u0627\u06cc\u06cc\u0646 \u0622\u0645\u062f\u0647\u200c\u0627\u0646\u062f \u0648 \u067e\u0644\u0646 \u0631\u0627 \u06a9\u062c \u06a9\u0631\u062f\u0647\u200c\u0627\u0646\u062f.\u00bb), #\u0637\u0631\u062d_\u062f\u0631\u0645\u0627\u0646 (decision; \u00ab\u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646 \u0627\u0632 \u0627\u0635\u0644\u0627\u062d \u067e\u0644\u0646 \u0634\u0631\u0648\u0639 \u0645\u06cc\u200c\u0634\u0648\u062f: \u2026\u00bb), #\u0627\u06a9\u0644\u0648\u0698\u0646 (umbrella, in addition). Not tagged: #\u067e\u0631\u0648\u062a\u0632_\u0645\u062a\u062d\u0631\u06a9 (text never says removable), #\u062a\u0631\u0627\u0634_\u0622\u0646\u062a\u0627\u06af\u0648\u0646\u06cc\u0633\u062a (use_when = space from the antagonist instead of a visible cusp \u2014 not this decision), #\u06a9\u0634\u06cc\u062f\u0646_\u062f\u0646\u062f\u0627\u0646 (extraction named as one option, keep-vs-extract not decided), #\u062a\u06a9\u0631\u0627\u0631_\u06a9\u0627\u0631 (remake not the conclusion). --sync, build_plus_index run+reverted, --check OK, build_cabinet_papers --check OK; reachability: chip \u00ab\u067e\u0644\u0627\u0646 \u0627\u06a9\u0644\u0648\u0698\u0646\u00bb (3) rank 3 -> pass; \u00ab\u0633\u0648\u067e\u0631\u0627\u0627\u0631\u0627\u067e\u0634\u0646\u00bb (8) rank 8 (not in first 4); \u00ab\u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646\u00bb (56) rank 56"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "brain entry at array end (video 17): title, caption (= title + founder-approved hook), 5 canonical hashtags, 9 keywords updated to the narration, page_url, pillar occlusion/[]/occlusal-analysis-adjustment; key set/order == video-16"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "pillar == C.2.4 (occlusion/occlusal-analysis-adjustment); capsule /pillar/occlusion/ matches"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "5.6: placed (semantic unmistakable homes; tool flagged ASK as aid) in occlusion after insight/insight-6 (index 29) and treatment-planning after insight/insight-78 (index 21); not placed (borderline): fixed-pros, implant-prosthetic, implant-surgical, post-and-core, biomimetic, failure-troubleshooting; json valid. 4.12-\u0628: M2 sent (2 questions from the narration); founder: no exam questions for this video -> 2 rows r-\u2026 written with status review + review_note; validate_exam_questions 0 errors"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "bundle candidates continuing occlusion / treatment-planning: every one \u0631\u062f \u0634\u062f (\u06af\u06cc\u062a \u06f1 \u2014 dentcast-plus/ folder never enters a bundle); no bundle edit"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse: \u00ab\u06cc\u06a9 \u0648\u06cc\u062f\u06cc\u0648 \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab<a>title</a>\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb new top line, share-56 bottom line removed, 7 lines; en mirror dentcast-plus/en/video-17.html + inverse toggles; ten-scope lock recorded; local verify_publish preview: 91 ok, 9 FAIL all runner-owned (C.8 builders: sitemap, pillar, pillar-structure, plus-index, flashcards, quiz; C.7 stamp)"
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
      "dentcast-plus/en/video-16.html",
      "dentcast-plus/en/video-17.html",
      "dentcast-plus/index.html",
      "dentcast-plus/video-16.html",
      "dentcast-plus/video-17.html",
      "index.html",
      "plus/des-scores.json",
      "plus/exam-questions.json",
      "plus/faq-corpus.json",
      "plus/pathways.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: dentcast-plus/video-17.html, dentcast-plus/en/video-17.html, dentcast-plus/index.html, index.html, dentcast-brain.json, dentcast-hashtag-reference.json, plus/des-scores.json, plus/faq-corpus.json, plus/pathways.json, plus/exam-questions.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
