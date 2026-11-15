# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v3
- Content: "glossary/icdas"
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
    "category": "glossary",
    "content_id": "glossary/icdas",
    "context": {
      "approvals": [
        {
          "decision": "\u0633\u06cc\u0633\u062a\u0645 \u0628\u06cc\u0646\u200c\u0627\u0644\u0645\u0644\u0644\u06cc \u062a\u0634\u062e\u06cc\u0635 \u0648 \u0627\u0631\u0632\u06cc\u0627\u0628\u06cc \u067e\u0648\u0633\u06cc\u062f\u06af\u06cc",
          "evidence": [
            "founder data: fa_title in the founder message, copied codepoint-for-codepoint (Hard Rule 16); h1, DefinedTerm.alternateName, glossary.json fa_title and every <title>/og/twitter/breadcrumb surface carry it"
          ],
          "scope": "title",
          "status": "confirmed"
        },
        {
          "decision": "Glossary entries carry no caption field (glossary.json schema); the meta/og/twitter description is an agent-composed search snippet under standing acceptance",
          "evidence": [
            "glossary/glossary.json latest-entry key set has no caption; verify_publish compares a glossary title only"
          ],
          "scope": "caption",
          "status": "not_required"
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
          "kind": "pillar_v1",
          "pillar": {
            "primary": "operative",
            "secondary": [],
            "subtopic": "caries-management"
          },
          "reason": "ICDAS is a caries detection/staging system whose stated purpose is choosing between non-invasive management, monitoring and restoration; operative is the only pillar that holds caries; caries-management is the exact subtopic (cracked-tooth and direct-restorations do not cover detection). Standing acceptance (Hard Rule 14)."
        },
        {
          "evidence": [
            "glossary/icdas.html opens its body with the founder's own first paragraph, byte-identical; no agent lead was added (body is prose, no list)"
          ],
          "kind": "first_cut_lead_provenance_v1",
          "origin": "author_original",
          "source_ref": "founder-message:glossary-entry-icdas (sha256 d90a46a5\u2026), section \u00ab\u062a\u0639\u0631\u06cc\u0641\u00bb, first paragraph"
        },
        {
          "items": [
            "Q3.5: no rewrites (text natural)",
            "meta description / og / twitter / TechArticle headline+description / DefinedTerm description: agent-composed",
            "glossary.json synonyms: fa_title, ICDAS, ICDAS II, International Caries Detection and Assessment System, lowercase forms",
            "pillar operative / caries-management",
            "4.7 applied: glossary/bewe.html back-link; skipped nccl (cap), tooth-wear, treatment-plan, microleakage (borderline/unrelated)",
            "4.7-b: 0 candidates",
            "4.8 applied: \u0633\u06cc\u0644\u0646\u062a\u2192episodes/episode-111-1, \u0631\u0648\u0634\u200c\u0647\u0627\u06cc \u063a\u06cc\u0631\u062a\u0647\u0627\u062c\u0645\u06cc\u2192dentai/dentai-3; skipped \u0631\u0627\u062f\u06cc\u0648\u06af\u0631\u0627\u0641\u06cc\u2192insight-23 (borderline)",
            "4.9 applied: episode-134, episode-135, dentai-3; skipped dentai-24, insight-23, episode-111-1, episode-65/dentai-11",
            "FAQ 7 (5 binary) + flashcards 8",
            "DES interpretation_fa narrowed (Part 3(6))",
            "English mirror glossary/en/icdas.html"
          ],
          "kind": "standing_acceptance_record_v1"
        },
        {
          "english": {
            "evidence": [
              "file on disk, enrolled in target_paths"
            ],
            "path": "glossary/en/icdas.html",
            "status": "ready"
          },
          "evidence": [
            "all founder/scientific/semantic choices closed before Push 2; pending_questions empty"
          ],
          "kind": "second_cut_editorial_lock_v1",
          "scopes": [
            {
              "evidence": [
                "C.4.13: COMMENTARY DES 12/E stored under glossary/icdas in plus/des-scores.json; no FIDELITY owed (self-record, fidelity [null]); no M3b"
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
                "pillar operative/caries-management (C.2.4, C.5.5); capsule /pillar/operative/"
              ],
              "scope": "taxonomy",
              "status": "resolved"
            },
            {
              "evidence": [
                "C.4.7 bewe back-link; C.4.7-b 0 candidates; C.4.8 two inline anchors; C.4.9 three capsules (4/5)"
              ],
              "scope": "links",
              "status": "resolved"
            },
            {
              "evidence": [
                "glossary writes no brain entry; glossary.json schema has no hashtags; C.5.0 skipped"
              ],
              "scope": "hashtags",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "glossary/glossary.json entry appended (C.5); plus/faq-corpus.json glossary/icdas (C.4.11/C.4.12)"
              ],
              "scope": "content_record",
              "status": "resolved"
            },
            {
              "evidence": [
                "glossary term is not a pathway step; 4.12-\u0628 skipped for glossary; C.5.6/C.5.6-b skipped"
              ],
              "scope": "pathways",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "glossary terms are not announced in Pulse (module 02 Q5, module 11 \u00a76)"
              ],
              "scope": "pulse",
              "status": "not_applicable"
            },
            {
              "evidence": [
                "glossary/en/icdas.html authored from locked text; toggles inverse (en/icdas.html \u2194 ../icdas.html); noindex, follow; no hreflang; metanotes/en/meta-1.html unchanged"
              ],
              "scope": "english",
              "status": "resolved"
            },
            {
              "evidence": [
                "title confirmed (founder fa_title); caption not_required (glossary); lead author_original; no M1/M3b/M2 owed"
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
          "note": "founder glossary entry text (English term, fa_title, three sections)",
          "ref": "founder-message:glossary-entry-icdas",
          "sha256": "d90a46a5f33b8a58cb1ff27339c17a7372009637ac430d64e93342b631814d9a"
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
          "Read completely this session at 7517b7f4: CLAUDE.md, workflows/README.md, global/README.md + selector core sections (repo-core, ads, publication-surfaces, des-display, site-invariants) for glossary paths, agent-parity.md, publish-checkpoints.md, publish-handoff-tool.md, modules 01 and 02. Capability check: git ls-remote origin OK; push to non-main branch available; Actions monitoring + PR + merge via GitHub MCP tools"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Text to publish: yes (founder glossary entry, sha256 d90a46a5\u2026); paper file attached: no \u2192 normal publish, no paper branch"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed dentcast-brain.json once (616 entries; glossary lives in glossary/glossary.json, 109 terms); latest glossary entry implant-supported-crown key set [slug,title,fa_title,synonyms,url,pillar]; live PILLARS read from tools/build_pillar.py (operative: caries-management, cracked-tooth, direct-restorations)"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Type locked: glossary (founder message is a glossary entry in the glossary-writer input shape)"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Identifier: slug icdas \u2192 content_id glossary/icdas; no existing glossary/icdas.html, no glossary.json entry with that slug"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Text received in founder message (English term ICDAS, fa_title, three sections); bound by digest sha256 d90a46a54b0d\u2026 (private input, not in target_paths)"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "De-AI pass run once on the as-submitted text: no genuine AI tell found (no formulaic openers/closers, clich\u00e9s, hedge stacking or filler); \u00ab\u0645\u062a\u0646 \u0637\u0628\u06cc\u0639\u06cc \u0628\u0647 \u0646\u0638\u0631 \u0645\u06cc\u200c\u0631\u0633\u0647\u060c \u062a\u063a\u06cc\u06cc\u0631\u06cc \u0644\u0627\u0632\u0645 \u0646\u06cc\u0633\u062a\u00bb; text of record = founder text byte-identical"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Media: latest glossary page (implant-supported-crown.html) uses no image/audio/video fields; nothing to collect"
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.7: no paper file attached \u2192 step 4.10 branch inactive"
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.8: basket 1 COMMENTARY \u2014 the page carries no DOI/PubMed id/references block; the text is the author's own conceptual entry (same basis as glossary/implant-supported-crown, glossary/treatment-plan)"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q4.9: \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc (a glossary term, not a question post)"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Q5 Pulse: glossary terms are not announced in Pulse (module 02 Q5 / module 11 documented skip)"
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
        "reason": "Not LiteCast: locked category glossary (module 03 step 0 applies only to LiteCast)",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only step; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template: glossary/implant-supported-crown.html (latest glossary term page, 2026-09-07), enrolled in target_paths; must stay byte-unchanged"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "glossary/icdas.html cloned from template (CRLF preserved): same tree/CSS/JSON-LD shape; swapped path, <title>/description/OG/Twitter/canonical/hreflang, TechArticle headline+description, DefinedTerm name=ICDAS alternateName=fa_title (founder string, copied), h1=fa_title, subtitle=ICDAS, dates, lang-btn \u2192 en/icdas.html; body = founder text byte-identical (7 <p> in the three fixed sections, verified by substring assertion against the private input); domain dentcast.org kept; preconnect x2 + GA once survived; no enamad seal; no hashtag chip row (template has none); body opens with prose (no list); lead = founder's own first paragraph (author_original)"
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
        "reason": "LiteCast-only in-body linking; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only \u00ab\u06a9\u0627\u0648\u0634 \u0628\u06cc\u0634\u062a\u0631\u00bb linking; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [
          "pillar.primary=operative, subtopic=caries-management (live PILLARS); clear single fit: ICDAS is caries detection/staging feeding the non-invasive vs monitor vs restore decision; competing candidate treatment-planning/comprehensive-diagnosis rejected (diagnosis of caries is the operative pillar's caries-management scope). Standing acceptance, recorded in decisions[pillar_v1]"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Glossary branch: only the \u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc capsule \u2192 /pillar/operative/ (canonical format), dc-related-section/dc-related-capsule markup; count 1 of 5"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Glossary landing /glossary/index.html is generated by tools/build_pillar.py glossary (part of all, runner C.8) from glossary/glossary.json; never hand-edited; registration in glossary.json happens with the entry write"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Date audit: before (template) 2026-09-07 on datePublished/dateModified/lastReviewed + two visible <time>; after: all 7 occurrences 2026-11-15 (datePublished=dateModified=today); canonical/og:url/hreflang/@id all /glossary/icdas.html \u2014 OK"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "git diff --quiet -- glossary/implant-supported-crown.html \u2192 exit 0 (template unchanged)"
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
        "reason": "NoteCast-only (parent episode); category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "NoteCast credit target only; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Promptologist prev/next only; category glossary",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.1",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Q4.7); step 4.10 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Q4.7); step 4.10 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No paper attached (Q4.7); step 4.10 branch inactive",
        "status": "skipped"
      },
      {
        "evidence": [
          "COMMENTARY (basket 1). Part 1: source_text = page body as shipped (fa_title, ICDAS, three sections, founder text byte-identical), FULL_TEXT, no DOI/lookup. Part 2: SOURCE call = claude -p --system-prompt-file .dentcast/des-v3.7-knowledge.md (sha256 709be964f19c1d5c\u2026) --tools \"\" --model opus --no-session-persistence, fresh empty dir; model reported claude-opus-5-5. Result des_version 3.7 COMMENTARY: checklist 4/0/3/0 \u2192 des_score 12, band E, provisional false. Part 3: (1) both non-empty evidence_quotes verbatim in source_text; (2) 5+7=12 OK; (3) band E OK; (4) key set identical to stored COMMENTARY schema; (7) des_record_guard check OK; (6) verify_publish --des-text OK, interpretation_fa narrowed by agent (removed unsupported \u00ab\u062f\u0642\u06cc\u0642 \u0648 \u0628\u0627 \u0645\u0646\u0637\u0642 \u0631\u0648\u0634\u0646\u00bb and \u00ab\u0646\u0647 \u0627\u0632 \u0636\u0639\u0641 \u0645\u062d\u062a\u0648\u0627\u00bb; score/quotes untouched). Part 2b: no FIDELITY owed (page's own COMMENTARY self-record) \u2192 fidelity [null]. Part 2d: not owed (no RESEARCH record). Part 3b: nothing flagged \u2192 no M3b. Part 4: stored under glossary/icdas in plus/des-scores.json via dentcast_text_io.json_append (59 lines appended, nothing else touched)"
        ],
        "id": "C.4.13",
        "module": "08-des-fidelity.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Fresh semantic review of all 109 glossary terms against ICDAS (caries detection/staging). Applied (strong): glossary/bewe.html \u2190 \u00abICDAS \u2014 \u0633\u06cc\u0633\u062a\u0645 \u0628\u06cc\u0646\u200c\u0627\u0644\u0645\u0644\u0644\u06cc \u062a\u0634\u062e\u06cc\u0635 \u0648 \u0627\u0631\u0632\u06cc\u0627\u0628\u06cc \u067e\u0648\u0633\u06cc\u062f\u06af\u06cc\u00bb (BEWE is the wear-side sibling index and its own body draws the caries-vs-wear diagnostic border; section 3/5 \u2192 4/5, appended at bottom, sibling markup). Skipped: nccl (at cap 5/5); tooth-wear (borderline \u2014 mentions caries only as an exclusion in its definition); treatment-plan (borderline \u2014 caries only listed among active disease control); microleakage (unrelated \u2014 secondary caries, not detection); all other terms unrelated (bonding/ceramics/implant/occlusion/fixed-pros mechanics)"
        ],
        "id": "C.4.7",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "cross-link.md scoped: python3 tools/cross_link_candidates.py --slug icdas (run after the term was registered in glossary/glossary.json so its fa_title/synonyms are known) \u2192 0 candidates (340 skipped as episodes/litecast/en/glossary; 0 tagged pages; repo-wide grep finds no body saying ICDAS/ICCMS). Nothing applied, no ASK; no page touched, so Phase D gate/stamper not applicable"
        ],
        "id": "C.4.7-b",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Candidates: all 110 glossary terms + every brain entry with a page. Applied (strong, first occurrence in body, plain <a href> as the template body uses): \u00ab\u0633\u06cc\u0644\u0646\u062a\u00bb (definition, 2nd para) \u2192 /episodes/episode-111-1.html (\u062f\u0646\u062a\u0648\u067e\u062f\u06cc\u0627 \u2014 \u0641\u06cc\u0634\u0648\u0631 \u0633\u06cc\u0644\u0627\u0646\u062a); \u00ab\u0631\u0648\u0634\u200c\u0647\u0627\u06cc \u063a\u06cc\u0631\u062a\u0647\u0627\u062c\u0645\u06cc\u00bb (role section) \u2192 /dentai/dentai-3.html (ICCC consensus on caries-lesion management terminology, defines non-invasive management). Skipped borderline: \u00ab\u0631\u0627\u062f\u06cc\u0648\u06af\u0631\u0627\u0641\u06cc\u00bb \u2192 insight/insight-23 (radiolucency under restorations, not lesion depth); \u00ab\u062f\u0631\u0645\u0627\u0646 \u062a\u0631\u0645\u06cc\u0645\u06cc\u00bb/\u00ab\u067e\u0627\u06cc\u0634\u00bb \u2192 episodes 134/135 (kept for 4.9). No glossary term matches a body concept (no term for enamel/dentin/fluoride/sealant). Gate: tag-stripped text identical to HEAD; diff shows only two anchors"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Section held 1 capsule (\u0641\u0647\u0631\u0633\u062a \u0645\u0648\u0636\u0648\u0639\u06cc), 4 free under Hard Rule 9. Added (strong, strongest first, sibling capsule markup): /episodes/episode-134.html \u00ab\u06af\u0627\u06cc\u062f\u0644\u0627\u06cc\u0646\u200c\u0647\u0627\u06cc \u062f\u0631\u0645\u0627\u0646 \u067e\u0648\u0633\u06cc\u062f\u06af\u06cc (MID) \u2014 \u0642\u0633\u0645\u062a \u0627\u0648\u0644\u00bb, /episodes/episode-135.html \u00ab\u2026 \u2014 \u0642\u0633\u0645\u062a \u062f\u0648\u0645\u00bb (evidence-based minimal-intervention caries management \u2014 the decision ICDAS feeds), /dentai/dentai-3.html \u00ab\u0627\u0635\u0637\u0644\u0627\u062d\u0627\u062a \u0645\u062f\u06cc\u0631\u06cc\u062a \u0636\u0627\u06cc\u0639\u0627\u062a \u067e\u0648\u0633\u06cc\u062f\u06af\u06cc (ICCC)\u00bb. Now 4/5. Skipped borderline: dentai/dentai-24 (BEWE \u2014 a scoring index, but for wear), insight/insight-23 (radiolucency under restorations), episodes/episode-111-1 (sealant, already inline), episode-65/dentai-11 (caries removal endpoints, not detection)"
        ],
        "id": "C.4.9",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "plus/faq-corpus.json byContent[\"glossary/icdas\"].definedTermSets[0] (@id \u2026/glossary/icdas.html#flashcards): 8 DefinedTerms #flashcards-c1\u2026c8, sequential; 3 authored (c1 definition, c2 codes 0\u20136, c8 monitoring use) + 5 from FAQ (c3\u2190faq0, c4\u2190faq1, c5\u2190faq3, c6\u2190faq4, c7\u2190faq5), each rewritten as a standalone concept (no verdict-stripped near-copy). FAQ pairs not carded: faq2 (radiography \u2014 covered by c4), faq6 (decision/procedural shape). Nothing in page JSON-LD; brain untouched"
        ],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "FAQPage \u2026/glossary/icdas.html#faq in plus/faq-corpus.json: 7 questions, all standalone (no deixis), every answer grounded in the body. Binary bank: 5 (q0\u2013q4 open with \u00ab\u0622\u06cc\u0627\u00bb, answers open \u00ab\u062e\u06cc\u0631\u061b\u00bb). Open/reference (excluded from scored bank by design): q5 (ICDAS II two-digit code), q6 (management by code group). 4.12-\u0628: evaluated at 5.6 (glossary \u2192 documented skip)"
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
        "reason": "Not a \u0686\u0627\u0644\u0634 (Q4.9 = \u0645\u0637\u0644\u0628 \u0645\u0639\u0645\u0648\u0644\u06cc); no data-dc-challenge-question markup",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": "Glossary publish writes no dentcast-brain.json entry (step 5.0 runs on every publish that writes a brain entry); the glossary.json schema template (latest entry implant-supported-crown) has no hashtags key and the page template has no chip row, so there is no tag list to standardize (Hard Rule 5 parity)",
        "status": "skipped"
      },
      {
        "evidence": [
          "Glossary registration (module 04 glossary note: register in glossary/glossary.json, not the brain): entry appended as last element of glossary[] via dentcast_text_io.json_append; keys exactly slug,title,fa_title,synonyms,url,pillar in the order of the previous entry (implant-supported-crown); title=ICDAS and fa_title copied from the founder message; synonyms (agent proposal): fa_title, ICDAS, ICDAS II, the English expansion and lowercase forms; url /glossary/icdas.html; pillar operative/[]/caries-management. dentcast-brain.json untouched; JSON valid"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "glossary.json pillar = {primary: operative, secondary: [], subtopic: caries-management} = step 2.4 decision; capsule href /pillar/operative/ matches; no new subtopic"
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
        "reason": "Glossary term: reference type, writes no specialist brain entry and is not a pathway step (verify_publish 5.6 pathway skip); 4.12-\u0628 exam questions: documented skip for glossary terms (module 07), no M2",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": "No full-pathway placement in 5.6 \u2192 \u0628\u0627\u0646\u062f\u0644: \u0628\u062f\u0648\u0646 \u06a9\u0627\u0646\u062f\u06cc\u062f",
        "status": "skipped"
      },
      {
        "evidence": [
          "Pulse: documented skip (glossary terms are not announced, module 11 \u00a76). English mirror glossary/en/icdas.html authored from the locked text (structure-faithful 2/3/2 paragraphs, chrome/type from glossary/en/treatment-plan.html, noindex/follow, no hreflang, en_US/inLanguage en, toggle ../icdas.html \u2194 fa en/icdas.html, no same-word gloss, meta-1 untouched). second_cut_editorial_lock_v1 recorded with all ten scopes; first_cut_lead_provenance_v1 author_original; title confirmed, caption not_required; pending_questions empty; JSON files valid"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      }
    ],
    "target_paths": [
      "glossary/bewe.html",
      "glossary/en/icdas.html",
      "glossary/glossary.json",
      "glossary/icdas.html",
      "glossary/implant-supported-crown.html",
      "plus/des-scores.json",
      "plus/faq-corpus.json"
    ]
  },
  "reconciliation": {
    "note": "Index-only refresh after staging delivery paths: glossary/icdas.html, glossary/en/icdas.html, glossary/glossary.json, glossary/bewe.html, plus/faq-corpus.json, plus/des-scores.json"
  },
  "schema": "publish-handoff-v3"
}
```
<!-- /dentcast-publish-state-v1 -->
