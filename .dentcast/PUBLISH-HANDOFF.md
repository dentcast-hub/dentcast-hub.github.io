# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v2
- Generation: 50
- Updated at (UTC): 2026-10-18T10:33:57+00:00
- Content: "sharehub/share-35"
- Status: in_progress
- Next canonical step: "C.2.5"
- Blocker: null

The structured record preserves decisions, approvals, step evidence and external outcomes.
Its compact snapshot is a verification baseline, not current Git status.

<!-- dentcast-publish-state-v1 -->
```json
{
  "generation": 50,
  "previous_sha256": "5ea12c31c1946f5d3dd1f31a74c3394d9c3b556c099985e86303862933b9ac42",
  "publication": {
    "blocker": null,
    "category": "sharehub",
    "content_id": "sharehub/share-35",
    "context": {
      "approvals": [
        {
          "decision": "Authorized by user",
          "evidence": [
            "user instruction in current request"
          ],
          "scope": "commit/push on content/sharehub-35-basal-implants and create PR",
          "status": "confirmed"
        },
        {
          "decision": "Not authorized; requires a separate explicit instruction",
          "evidence": [
            "user instruction in current request"
          ],
          "scope": "merge to main",
          "status": "not_required"
        }
      ],
      "decisions": [
        {
          "decision": "Use the full Joshi et al. 2026 Cureus paper only as the primary scored source. The two intraoral-welding sources are supplemental explanation sources, not independent DES records.",
          "evidence": [
            "user instruction in current request",
            "manual handoff at git:d172683918276b4e263801a4d8668b64a67529e2:.dentcast/PUBLISH-HANDOFF.md"
          ],
          "scope": "DES/Fidelity source"
        },
        {
          "decision": "Commit, push and create a PR on content/sharehub-35-basal-implants; do not merge to main without separate explicit instruction.",
          "evidence": [
            "user instruction in current request"
          ],
          "scope": "branch and merge boundary"
        }
      ],
      "delivery": [
        {
          "evidence": [
            "https://github.com/dentcast-hub/dentcast-hub.github.io/commit/a3420d11978751b86e1b61e8cfa3d3741df48616",
            "GitHub compare 9d75d462af97c59a411e2403b1ad0875e5...a3420d11978751b86e1b61e8cfa3d3741df48616 lists exactly the page, two assets, and handoff",
            "inspect --check-remote observes local and remote HEAD a3420d11978751b86e1b61e8cfa3d3741df48616"
          ],
          "scope": "C.2 page and two verified image assets delivered to authorized branch"
        }
      ],
      "inputs": [
        {
          "kind": "manual_handoff",
          "note": "Original manual recovery handoff retained verbatim in Git history; it is not a canonical checkpoint.",
          "ref": "git:d172683918276b4e263801a4d8668b64a67529e2:.dentcast/PUBLISH-HANDOFF.md",
          "sha256": "2e58d42d9a38c06d1c0492498305a28c297dc9d757a52b63123f9fe666c03e81"
        },
        {
          "kind": "user_text",
          "note": "Complete article text supplied verbatim in the current user turn; preserve codepoints exactly when creating the page.",
          "ref": "current user message in this conversation; exact body now available",
          "sha256": null
        },
        {
          "kind": "source_pdf",
          "note": "Drive metadata noted in manual handoff; binary download and local hash verification pending.",
          "ref": "https://drive.google.com/file/d/1tJaXUhMIS5oqJjwPXUB4XcEz97UOAsRu/view",
          "sha256": null
        },
        {
          "kind": "figure",
          "note": "Conventional implant WebP; binary retrieval and hash verification pending.",
          "ref": "https://drive.google.com/file/d/1mQ69mcm5lxskCWWuq7jBjQOTwP9flIvJ/view",
          "sha256": null
        },
        {
          "kind": "figure",
          "note": "Basal implant WebP; binary retrieval and hash verification pending.",
          "ref": "https://drive.google.com/file/d/17f0zqo55EZ4SRPypRiPQN6LndAR8hxQlJ/view",
          "sha256": null
        }
      ],
      "pending_questions": [],
      "unrelated_changes": [],
      "validation": [
        {
          "evidence": [
            "git status --short --branch",
            "git rev-parse HEAD",
            "git ls-remote origin refs/heads/content/sharehub-35-basal-implants"
          ],
          "kind": "git_resume_reconciliation",
          "result": "HEAD is d172683918276b4e263801a4d8668b64a67529e2; working tree was clean; branch upstream is origin/content/sharehub-35-basal-implants; fresh ls-remote reported the same HEAD."
        },
        {
          "evidence": [
            "python tools/dentcast_publish_handoff.py inspect",
            "manual handoff Git blob d172683918276b4e263801a4d8668b64a67529e2:.dentcast/PUBLISH-HANDOFF.md"
          ],
          "kind": "manual_handoff_inspection",
          "result": "Official inspect returned HANDOFF_FORMAT_INVALID because existing file is manual, not v2. No canonical steps are verified complete."
        },
        {
          "evidence": [
            "/tmp/share35-assets/joshi.pdf",
            "/tmp/share35-assets/share-35-conventional-implant.webp",
            "/tmp/share35-assets/share-35-basal-implant.webp",
            "B.4.7 full-text inspection"
          ],
          "kind": "source_asset_reconciliation",
          "result": "The historical input notes above record initial Drive references and their then-pending binary retrieval. Subsequent completed work is evidenced by B.4/B.4.7: PDF 2,827,728 bytes, 11 pages, SHA-256 a0dc0699ef573f82db6439c9a3a7b5a784806f3cd5a1222e1c6f759f477842f3; conventional WebP 56,246 bytes, 1600\u00d71194, SHA-256 61151c3a934480226bc444467723264d54ad793a2e28ef989b268d116dc71014; basal WebP 194,290 bytes, 1600\u00d7677, SHA-256 cc28b266c41e5fb0feae0c6a5df934ce024f256971f5bfd7f1e9d3c127318c27. Full PDF text confirmed Joshi et al. title and authors."
        },
        {
          "evidence": [
            "git status --short",
            "git diff --cached --stat",
            "SHA-256 and source-block comparison"
          ],
          "kind": "C.2_staged_work_review",
          "result": "Staged C.2 scope contains exactly sharehub/share-35.html plus the two verified WebP assets. Full article text is represented in 87 source blocks in original order; media checksums match the Drive downloads."
        },
        {
          "evidence": [
            "github_compare_commits",
            "github_fetch_file page and handoff",
            "git fetch/reset and inspect --check-remote"
          ],
          "kind": "C.2_remote_delivery",
          "result": "C.2 commit a3420d11978751b86e1b61e8cfa3d3741df48616 is on the authorized remote branch. Page and handoff contents read back exactly; local and remote HEAD match; both image blobs are committed and match the verified Drive SHA-256 values."
        }
      ]
    },
    "external_actions": [],
    "status": "in_progress",
    "steps": [
      {
        "evidence": [
          "Read active publication router, hard rules, routing intake, AGENTS.md, complete agent-parity contract, and all three active global rule files; branch HEAD and remote restored and confirmed."
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Phase 0 route: user supplied the complete Persian article body and an identifiable full-text PDF plus two figures; ordinary ShareHub publication and attached-paper step 4.10 Part 1\u20133 both apply. Paper-only route does not apply."
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Parsed full dentcast-brain.json (559 entries, 14 values of type including legacy untyped episodes); 34 ShareHub entries are contiguous 1\u201334. Latest ShareHub 34 shape/fields and sharehub/share-34.html template checked (hash 4d5b1825e3c3e5b6f865ba87564800fe52606c46addd13cc284383b2fb0ec3c7); target sharehub/share-35.html is absent. Read PILLARS from detached origin/main worktree; taxonomy not merged into feature branch. Source full-text title/authors confirmed from downloaded PDF."
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Question 1 resolved from explicit user instruction and working branch name: ordinary ShareHub research commentary; no clarification required."
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "ShareHub IDs are contiguous 1\u201334 with maximum 34; next ID is 35 and target URL is /sharehub/share-35.html."
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Complete Persian article text, title, scientific caveats, and source list were provided verbatim in the current user message; exact text is the content of record. The requested title/author metadata will use the full Joshi article, not a title or author inferred from an abstract."
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Style-only scan of the complete submitted article found no concrete AI clich\u00e9/filler requiring a proposal; no fact or wording was changed. Exact-preservation instruction controls."
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Image intake completed: both user-supplied Drive binaries downloaded, sizes and WebP format verified; SHA-256 checks recorded. PDF metadata and full text already verified from binary."
        ],
        "id": "B.4",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "A real Drive PDF was supplied and downloaded (2,827,728 bytes, 11 pages, SHA-256 a0dc0699ef573f82db6439c9a3a7b5a784806f3cd5a1222e1c6f759f477842f3); its full text confirms the article title and four authors Megha Joshi, Mayur Kaushik, Mohd Nazar Rana, Soumya Kaushik. This activates Phase C 4.10 Parts 1\u20133."
        ],
        "id": "B.4.7",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "RESEARCH basket armed from the identifiable primary source: Joshi et al., DOI 10.7759/cureus.113703, scored from the locally held full text (FULL_TEXT). User decision: the two intraoral-welding references are supplemental explanatory sources, not independent DES studies/records. Joshi narrative review is not a consensus/guideline wrapper requiring a primary-study chain."
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "The supplied body is a clinical evidence review article, not a challenge prompt; ordinary publish path applies."
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "Pulse pattern in index.html from ShareHub 34 reviewed. Draft: title-only link with no spoiler, no inferred date: \u00ab\u06cc\u06a9 \u0645\u0637\u0644\u0628 \u062a\u0627\u0632\u0647 \u062f\u0631 Share Hub \u0628\u0627 \u0639\u0646\u0648\u0627\u0646\u0650 \u00ab\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u200c\u0647\u0627\u06cc \u0645\u0639\u0645\u0648\u0644\u06cc \u0648 \u0628\u0627\u0632\u0627\u0644\u061b \u062f\u0648 \u0631\u0648\u06cc\u06a9\u0631\u062f \u0645\u062a\u0641\u0627\u0648\u062a \u062f\u0631 \u062f\u0631\u0645\u0627\u0646 \u0628\u06cc\u200c\u062f\u0646\u062f\u0627\u0646\u06cc\u00bb \u0645\u0646\u062a\u0634\u0631 \u0634\u062f\u00bb.,"
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
        "reason": "Category is sharehub, not litecast; LiteCast-only workflow branch is not applicable.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "C.0.1 is LiteCast-only; ShareHub continues to use dentcast-brain.json as its source of truth.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast schema and lite-glossary.json are out of scope for the ShareHub category.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only page cloning and internal-link structure do not apply to ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only pillar and brain overrides do not apply; ShareHub uses its ordinary taxonomy and brain workflow.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Template locked: sharehub/share-34.html; SHA-256 4d5b1825e3c3e5b6f865ba87564800fe52606c46addd13cc284383b2fb0ec3c7. Working tree clean before cloning."
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "sharehub/share-35.html; SHA-256 2e2164a89fe9aa34a3ce8fa00b86dde380be0599368be53c95cae05623528b40; all 87 source text blocks verified codepoint-for-codepoint in original order; assets SHA-256 61151c3a934480226bc444467723264d54ad793a2e28ef989b268d116dc71014 and cc28b266c41e5fb0feae0c6a5df934ce024f256971f5bfd7f1e9d3c127318c27"
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
        "reason": "LiteCast-only in-body semantic linking; publication category is ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only related capsules; publication category is ShareHub.",
        "status": "skipped"
      },
      {
        "evidence": [
          "Live origin/main taxonomy: pillar implantology (\u0627\u06cc\u0645\u067e\u0644\u0646\u062a\u0648\u0644\u0648\u0698\u06cc), subtopic surgical-planning (\u062c\u0631\u0627\u062d\u06cc\u060c \u062c\u0627\u06cc\u06af\u0630\u0627\u0631\u06cc \u0648 \u0637\u0631\u062d \u062f\u0631\u0645\u0627\u0646); semantic match to cortical anchorage, loading, surgical approach, and clinical indications."
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
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
    "target_paths": [
      "sharehub/share-35.html"
    ]
  },
  "reconciliation": {
    "note": "Applied the single clear taxonomy match from live main; no new taxonomy values were proposed.",
    "observed_changes": []
  },
  "schema": "publish-handoff-v2",
  "snapshot": {
    "branch": "content/sharehub-35-basal-implants",
    "files": {
      "sharehub/share-35.html": {
        "executable": false,
        "kind": "file",
        "sha256": "2e2164a89fe9aa34a3ce8fa00b86dde380be0599368be53c95cae05623528b40"
      }
    },
    "repository": "github.com/dentcast-hub/dentcast-hub.github.io",
    "workflow": {
      ".dentcast/workflows/README.md": "b95374a9179bb82fe993f96e8696d06e1399293cb9081cbc58645ac3c5254c32",
      ".dentcast/workflows/agent-parity.md": "e547f273f2d72441666352fe831418e3c8b52320840e5af2828fef550b22bfc1",
      ".dentcast/workflows/global/README.md": "0d10946f9e6abf2a9f6d997035db453f8f7253b1ef21a876e97158d104998866",
      ".dentcast/workflows/global/plus-premium.md": "3905b8017be9601666541145aa732469a664c2c3b0e229dfb40e063123668987",
      ".dentcast/workflows/global/repo-conventions.md": "07ad6321a9539898c555b795249699b4a67786c06ebf0d8242864dbc845e92a3",
      ".dentcast/workflows/global/site-invariants.md": "806db16666dc3d42468f143ec279ba704718d3997ca96ce8316f2d17abbc6398",
      ".dentcast/workflows/modules/01-hard-rules.md": "92a4a297a1163dbe6d1b91c03512f4ce1d34a341bfbd2d284939999183f11775",
      ".dentcast/workflows/modules/02-routing-intake.md": "d49e7a8e4b17ee67d5ed76e9a439ec76e8e80e57dee9ab2757af2fd8af1c79f9",
      ".dentcast/workflows/modules/03-litecast-and-page.md": "58ffb9d846189df26f19d905f3350bcbedb0caf35bb06d6b0ac275cad4df7a9d",
      ".dentcast/workflows/modules/04-taxonomy-and-navigation.md": "30f3d513b85fd3601b4b0abfb0545164b7845a3b6cbe1c572f0b51634e4ca48c",
      ".dentcast/workflows/modules/05-semantic-linking.md": "584b98498373904fea376f08666b152d089ed444c04aec977c309693d1b3ea72",
      ".dentcast/workflows/modules/06-paper-ingestion.md": "0750fad903784190a1f2cc448d733c923de225d3c954197bd8b2ee4c1469d93b",
      ".dentcast/workflows/modules/07-flashcards-and-quiz.md": "df19796c39fd7bbcb3baf54d7579a648dc563d911b4532325e399708e1bf5669",
      ".dentcast/workflows/modules/08-des-fidelity.md": "d68e53bc517eef74c34412c2f974195549b968c18da05b6280c68c53f815d48e",
      ".dentcast/workflows/modules/09-challenge.md": "a8879369f30774f999e0c20b5538517f8822b3de2250d8be7a8d516093bb7e57",
      ".dentcast/workflows/modules/10-brain-and-pathways.md": "136123ea53078073e14a4de2adafe5e7c1cfe14e48db9bf1e488115d7807f7a5",
      ".dentcast/workflows/modules/11-build-and-version.md": "b1c38c6f861f4b531bfd32a054133a65800d0f13df035c94ee251b5359c09150",
      ".dentcast/workflows/modules/12-english-notify-verify.md": "de9972aaa32350207d514cb85ad317b5ecf78cbe4259c682e016b45b9c99d5bf",
      ".dentcast/workflows/publish-checkpoints.md": "146f065121e5b6813ba3f40ddfdaff11b51c5da94d8e40e90645397b7fa603ad",
      ".dentcast/workflows/publish-handoff.md": "ca9f415761f503c1806bec7cd5a0273ae2546c85ecb7d38eca368c537520ff96",
      ".dentcast/workflows/routing-details.md": "3e698a41fe79f82133b433b508c948ac7fbab95b03cebbb8c2ceb450e1eab552",
      "tools/dentcast_publish_handoff.py": "18c4964abd72f9d6c8abb78b8accbea327da1ba0ff20cd5ccf3705c378ea3a2f",
      "tools/dentcast_publish_lifecycle.py": "a5a96d8a598ed24523cddf70deec7002e9336db54975f38038b9fd9ddc0bfc78",
      "tools/verify_publish.py": "6d9d0663afaa54fe12f297f3e405ab072821164edc700589c766314217b05f48"
    }
  },
  "source_revision": "d172683918276b4e263801a4d8668b64a67529e2",
  "updated_at": "2026-10-18T10:33:57+00:00"
}
```
<!-- /dentcast-publish-state-v1 -->
