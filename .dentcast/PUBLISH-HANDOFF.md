# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v2
- Generation: 79
- Updated at (UTC): 2026-10-17T10:03:23+00:00
- Content: "dentcast-plus/video-14"
- Status: in_progress
- Next canonical step: "C.4.5"
- Blocker: null

The structured record preserves decisions, approvals, step evidence and external outcomes.
Its compact snapshot is a verification baseline, not current Git status.

<!-- dentcast-publish-state-v1 -->
```json
{
  "generation": 79,
  "previous_sha256": "ee7b443f97194c02cb18374a76e856088cecf32f34b21eab4571e05a5292d502",
  "publication": {
    "blocker": null,
    "category": "dentcast_plus",
    "content_id": "dentcast-plus/video-14",
    "context": {
      "approvals": [
        {
          "decision": "Use supplied first sentence as title and publish; user explicitly confirmed title and requested completion through connected GitHub",
          "evidence": [
            "User title confirmation and subsequent explicit publication instruction"
          ],
          "scope": "title and publication",
          "status": "confirmed"
        }
      ],
      "decisions": [
        {
          "evidence_basis": "COMMENTARY own clinical narrative",
          "pillar": "fixed-pros/post-and-core",
          "quiz": "No quiz or FAQ: explicit user instruction"
        }
      ],
      "delivery": [],
      "inputs": [
        {
          "caption": "\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u062a\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u0644\u0642 \u0645\u06cc\u200c\u062e\u0648\u0631\u0647 \u0648 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0631\u0647\u060c \u062d\u0627\u0644\u0627 \u0686\u06cc\u200c\u06a9\u0627\u0631 \u06a9\u0646\u06cc\u0645\u061f\n\n\u0648\u0642\u062a\u06cc \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0631\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0631\u0647\u060c \u06cc\u06a9\u06cc \u0627\u0632 \u0627\u0648\u0644\u06cc\u0646 \u0686\u06cc\u0632\u0627\u06cc\u06cc \u06a9\u0647 \u0628\u0647 \u0630\u0647\u0646\u0645 \u0645\u06cc\u200c\u0631\u0633\u0647 \u06cc\u0647 \u0646\u0642\u0637\u0647 \u062a\u06cc\u0632\u0647\u060c \u0686\u0647 \u0631\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u0686\u0647 \u0631\u0648\u06cc \u062e\u0648\u062f \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631\u060c \u06a9\u0647 \u0646\u0645\u06cc\u200c\u0630\u0627\u0631\u0647 \u067e\u0633\u062a \u06a9\u0627\u0645\u0644 \u0628\u0646\u0634\u06cc\u0646\u0647.\n\n\u0645\u062b\u0644\u0627\u064b \u06cc\u0647 \u0642\u0633\u0645\u062a\u06cc \u0627\u0632 \u062f\u0646\u062f\u0648\u0646 \u062a\u06cc\u0632 \u0628\u0648\u062f\u0647 \u0648 \u0645\u0646 \u0628\u0627 \u062f\u0648\u0631\u0627\u0644\u06cc \u0631\u0648\u0634 \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0633\u0627\u062e\u062a\u0645. \u0627\u0648\u0644\u0634 \u06a9\u06cc\u067e \u0628\u0648\u062f\u0647 \u0648 \u062b\u0628\u0627\u062a \u062f\u0627\u0634\u062a\u0647\u060c \u0648\u0644\u06cc \u0628\u0639\u062f \u0627\u0632 \u0631\u06cc\u062e\u062a\u06af\u06cc \u0647\u0645\u0648\u0646 \u0646\u0642\u0637\u0647 \u062a\u06cc\u0632 \u0645\u0627\u0646\u0639 \u0646\u0634\u0633\u062a\u0646 \u06a9\u0627\u0645\u0644 \u0634\u062f\u0647. \u06cc\u0627 \u0646\u0648\u06a9 \u067e\u0633\u062a \u062e\u06cc\u0644\u06cc \u062a\u06cc\u0632 \u0628\u0648\u062f\u0647 \u0648 \u0628\u0639\u062f \u0627\u0632 \u062a\u0628\u062f\u06cc\u0644 \u0634\u062f\u0646 \u0628\u0647 \u0641\u0644\u0632\u060c \u0646\u062f\u0648\u0644\u06cc \u06cc\u0627 \u0636\u0627\u06cc\u0639\u0647\u200c\u0627\u06cc \u0631\u0648\u0634 \u0627\u06cc\u062c\u0627\u062f \u0634\u062f\u0647 \u0648 \u0646\u0645\u06cc\u200c\u0630\u0627\u0631\u0647 \u0628\u0634\u06cc\u0646\u0647.\n\n\u0628\u0631\u0627\u06cc \u0647\u0645\u06cc\u0646 \u062a\u0648\u06cc \u0647\u0645\u0686\u06cc\u0646 \u062d\u0627\u0644\u062a\u06cc \u0627\u0648\u0644 \u0628\u0631\u0645\u06cc\u200c\u06af\u0631\u062f\u0645 \u062c\u0627\u06cc \u062a\u06cc\u0632 \u0631\u0648 \u0628\u0631\u0631\u0633\u06cc \u0645\u06cc\u200c\u06a9\u0646\u0645 \u0648 \u0627\u06af\u0647 \u0644\u0627\u0632\u0645 \u0628\u0648\u062f \u0627\u0635\u0644\u0627\u062d\u0634 \u0645\u06cc\u200c\u06a9\u0646\u0645. \u062e\u06cc\u0644\u06cc \u0648\u0642\u062a\u0627 \u0647\u0645\u06cc\u0646 \u0645\u0634\u06a9\u0644 \u0631\u0648 \u062d\u0644 \u0645\u06cc\u200c\u06a9\u0646\u0647\u060c \u0627\u0645\u0627 \u062a\u0648 \u0627\u06cc\u0646 \u0645\u0648\u0631\u062f \u062d\u0644 \u0646\u0634\u062f.\n\n\u067e\u0633 \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0631\u0648 \u0627\u0632 \u0627\u0648\u0644 \u062a\u06a9\u0631\u0627\u0631 \u06a9\u0631\u062f\u0645. \u0686\u0648\u0646 \u0628\u0627 \u0627\u06cc\u0646 \u0639\u062f\u0645 \u062b\u0628\u0627\u062a \u0646\u0645\u06cc\u200c\u062a\u0648\u0646\u06cc \u0631\u0648\u06a9\u0634 \u0631\u0648 \u0631\u0648\u0634 \u0628\u0630\u0627\u0631\u06cc. \u0648\u0642\u062a\u06cc \u0631\u0648\u06a9\u0634 \u0648\u0627\u0631\u062f \u0633\u06cc\u06a9\u0644 \u062c\u0648\u06cc\u062f\u0646 \u0628\u0634\u0647 \u0648 \u0646\u06cc\u0631\u0648\u0647\u0627\u06cc \u062c\u0648\u06cc\u062f\u0646 \u0628\u0647\u0634 \u0648\u0627\u0631\u062f \u0628\u0634\u0647\u060c \u0627\u06af\u0647 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0634\u062a\u0647 \u0628\u0627\u0634\u06cc\u0645\u060c \u0627\u06cc\u0646 \u0646\u06cc\u0631\u0648\u0647\u0627 \u0628\u0647 \u0627\u06cc\u0646\u062a\u0631\u0641\u06cc\u0633 \u0633\u0645\u0627\u0646 \u0648 \u067e\u0633\u062a \u0645\u0646\u062a\u0642\u0644 \u0645\u06cc\u0634\u0647\u060c \u0646\u06cc\u0631\u0648\u06cc \u0628\u0631\u0634\u06cc \u0627\u06cc\u062c\u0627\u062f \u0645\u06cc\u06a9\u0646\u0647 \u0648 \u062f\u0631 \u0646\u0647\u0627\u06cc\u062a \u0631\u0648\u06a9\u0634 \u0647\u0645\u0631\u0627\u0647 \u0628\u0627 \u0633\u0645\u0627\u0646 \u0627\u0632 \u062f\u0646\u062f\u0648\u0646 \u062f\u0631 \u0645\u06cc\u0627\u062f.",
          "config": "https://dentcast.arvanvod.ir/vkxeWA47OD/M9a0Oxm7ve/origin_config.json",
          "title": "\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u062a\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u0644\u0642 \u0645\u06cc\u200c\u062e\u0648\u0631\u0647 \u0648 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0631\u0647\u060c \u062d\u0627\u0644\u0627 \u0686\u06cc\u200c\u06a9\u0627\u0631 \u06a9\u0646\u06cc\u0645\u061f",
          "youtube": "https://youtube.com/shorts/uRwMJoWCEdw"
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
          "reports/video-14-publication.md#rules",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "rules",
        "module": "01-hard-rules.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#0",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "0",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#A",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "A",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#B.1",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "B.1",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#B.2",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "B.2",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#B.3",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "B.3",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#B.3.5",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "B.3.5",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#B.4",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
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
        "reason": "No accompanying paper file; image is video-host metadata.",
        "status": "skipped"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#B.4.8",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "B.4.8",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#B.4.9",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "B.4.9",
        "module": "02-routing-intake.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#B.5",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
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
        "reason": "Not LiteCast; category is dentcast_plus.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.1",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; category is dentcast_plus.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.2",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; category is dentcast_plus.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.3",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; category is dentcast_plus.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.4",
        "module": "03-litecast-and-page.md",
        "reason": "Not LiteCast; category is dentcast_plus.",
        "status": "skipped"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.1",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "C.1",
        "module": "03-litecast-and-page.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.2",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
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
        "reason": "LiteCast-only internal linking; specialist steps apply instead.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.0.6",
        "module": "03-litecast-and-page.md",
        "reason": "LiteCast-only internal linking; specialist steps apply instead.",
        "status": "skipped"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.2.4",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "C.2.4",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.2.5",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "C.2.5",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.2.6",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "C.2.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.3",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "C.3",
        "module": "04-taxonomy-and-navigation.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.4",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
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
      "dentcast-plus/video-14.html",
      "dentcast-plus/en/video-14.html",
      "dentcast-brain.json",
      "dentcast-plus/index.html",
      "reports/video-14-publication.md"
    ]
  },
  "reconciliation": {
    "note": "Reviewed actual scoped work, current handoff, and previous remote delivery",
    "observed_changes": []
  },
  "schema": "publish-handoff-v2",
  "snapshot": {
    "branch": "codex/publish-video-14",
    "files": {
      "dentcast-brain.json": {
        "executable": false,
        "kind": "file",
        "sha256": "f147d57eca7683fa20a628989e83d990aed00206322c53391713998aaafa5360"
      },
      "dentcast-plus/en/video-14.html": {
        "executable": false,
        "kind": "missing",
        "sha256": null
      },
      "dentcast-plus/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "a7e6d217303dd3c57f73e38e7253f7fb849220daff1a139cc1556b04a1855c37"
      },
      "dentcast-plus/video-14.html": {
        "executable": false,
        "kind": "file",
        "sha256": "6b084c604d05500794857a00d9a529312fa03afa26f097ae6a1e42e2f786578f"
      },
      "reports/video-14-publication.md": {
        "executable": false,
        "kind": "file",
        "sha256": "bd7ca59534d68e818b823e99f37bc17cdd8adff9f49042eb39436e6f5de906dc"
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
  "source_revision": "b6170660c69a9602a47b9d81fc1df944bebaddfe",
  "updated_at": "2026-10-17T10:03:23+00:00"
}
```
<!-- /dentcast-publish-state-v1 -->
