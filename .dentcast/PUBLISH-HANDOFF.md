# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v2
- Generation: 156
- Updated at (UTC): 2026-10-17T10:07:16+00:00
- Content: "dentcast-plus/video-14"
- Status: in_progress
- Next canonical step: "G"
- Blocker: null

The structured record preserves decisions, approvals, step evidence and external outcomes.
Its compact snapshot is a verification baseline, not current Git status.

<!-- dentcast-publish-state-v1 -->
```json
{
  "generation": 156,
  "previous_sha256": "8d08c3db0ba2c3f30d40a74b3cd0b0120cd13f5b636e1c2eefca8b518eecdaf5",
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
      "validation": [
        {
          "content_id": "dentcast-plus/video-14",
          "exit_code": 0,
          "expected_caption": "\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u062a\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u0644\u0642 \u0645\u06cc\u200c\u062e\u0648\u0631\u0647 \u0648 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0631\u0647\u060c \u062d\u0627\u0644\u0627 \u0686\u06cc\u200c\u06a9\u0627\u0631 \u06a9\u0646\u06cc\u0645\u061f\n\n\u0648\u0642\u062a\u06cc \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0631\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0631\u0647\u060c \u06cc\u06a9\u06cc \u0627\u0632 \u0627\u0648\u0644\u06cc\u0646 \u0686\u06cc\u0632\u0627\u06cc\u06cc \u06a9\u0647 \u0628\u0647 \u0630\u0647\u0646\u0645 \u0645\u06cc\u200c\u0631\u0633\u0647 \u06cc\u0647 \u0646\u0642\u0637\u0647 \u062a\u06cc\u0632\u0647\u060c \u0686\u0647 \u0631\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u0686\u0647 \u0631\u0648\u06cc \u062e\u0648\u062f \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631\u060c \u06a9\u0647 \u0646\u0645\u06cc\u200c\u0630\u0627\u0631\u0647 \u067e\u0633\u062a \u06a9\u0627\u0645\u0644 \u0628\u0646\u0634\u06cc\u0646\u0647.\n\n\u0645\u062b\u0644\u0627\u064b \u06cc\u0647 \u0642\u0633\u0645\u062a\u06cc \u0627\u0632 \u062f\u0646\u062f\u0648\u0646 \u062a\u06cc\u0632 \u0628\u0648\u062f\u0647 \u0648 \u0645\u0646 \u0628\u0627 \u062f\u0648\u0631\u0627\u0644\u06cc \u0631\u0648\u0634 \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0633\u0627\u062e\u062a\u0645. \u0627\u0648\u0644\u0634 \u06a9\u06cc\u067e \u0628\u0648\u062f\u0647 \u0648 \u062b\u0628\u0627\u062a \u062f\u0627\u0634\u062a\u0647\u060c \u0648\u0644\u06cc \u0628\u0639\u062f \u0627\u0632 \u0631\u06cc\u062e\u062a\u06af\u06cc \u0647\u0645\u0648\u0646 \u0646\u0642\u0637\u0647 \u062a\u06cc\u0632 \u0645\u0627\u0646\u0639 \u0646\u0634\u0633\u062a\u0646 \u06a9\u0627\u0645\u0644 \u0634\u062f\u0647. \u06cc\u0627 \u0646\u0648\u06a9 \u067e\u0633\u062a \u062e\u06cc\u0644\u06cc \u062a\u06cc\u0632 \u0628\u0648\u062f\u0647 \u0648 \u0628\u0639\u062f \u0627\u0632 \u062a\u0628\u062f\u06cc\u0644 \u0634\u062f\u0646 \u0628\u0647 \u0641\u0644\u0632\u060c \u0646\u062f\u0648\u0644\u06cc \u06cc\u0627 \u0636\u0627\u06cc\u0639\u0647\u200c\u0627\u06cc \u0631\u0648\u0634 \u0627\u06cc\u062c\u0627\u062f \u0634\u062f\u0647 \u0648 \u0646\u0645\u06cc\u200c\u0630\u0627\u0631\u0647 \u0628\u0634\u06cc\u0646\u0647.\n\n\u0628\u0631\u0627\u06cc \u0647\u0645\u06cc\u0646 \u062a\u0648\u06cc \u0647\u0645\u0686\u06cc\u0646 \u062d\u0627\u0644\u062a\u06cc \u0627\u0648\u0644 \u0628\u0631\u0645\u06cc\u200c\u06af\u0631\u062f\u0645 \u062c\u0627\u06cc \u062a\u06cc\u0632 \u0631\u0648 \u0628\u0631\u0631\u0633\u06cc \u0645\u06cc\u200c\u06a9\u0646\u0645 \u0648 \u0627\u06af\u0647 \u0644\u0627\u0632\u0645 \u0628\u0648\u062f \u0627\u0635\u0644\u0627\u062d\u0634 \u0645\u06cc\u200c\u06a9\u0646\u0645. \u062e\u06cc\u0644\u06cc \u0648\u0642\u062a\u0627 \u0647\u0645\u06cc\u0646 \u0645\u0634\u06a9\u0644 \u0631\u0648 \u062d\u0644 \u0645\u06cc\u200c\u06a9\u0646\u0647\u060c \u0627\u0645\u0627 \u062a\u0648 \u0627\u06cc\u0646 \u0645\u0648\u0631\u062f \u062d\u0644 \u0646\u0634\u062f.\n\n\u067e\u0633 \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0631\u0648 \u0627\u0632 \u0627\u0648\u0644 \u062a\u06a9\u0631\u0627\u0631 \u06a9\u0631\u062f\u0645. \u0686\u0648\u0646 \u0628\u0627 \u0627\u06cc\u0646 \u0639\u062f\u0645 \u062b\u0628\u0627\u062a \u0646\u0645\u06cc\u200c\u062a\u0648\u0646\u06cc \u0631\u0648\u06a9\u0634 \u0631\u0648 \u0631\u0648\u0634 \u0628\u0630\u0627\u0631\u06cc. \u0648\u0642\u062a\u06cc \u0631\u0648\u06a9\u0634 \u0648\u0627\u0631\u062f \u0633\u06cc\u06a9\u0644 \u062c\u0648\u06cc\u062f\u0646 \u0628\u0634\u0647 \u0648 \u0646\u06cc\u0631\u0648\u0647\u0627\u06cc \u062c\u0648\u06cc\u062f\u0646 \u0628\u0647\u0634 \u0648\u0627\u0631\u062f \u0628\u0634\u0647\u060c \u0627\u06af\u0647 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0634\u062a\u0647 \u0628\u0627\u0634\u06cc\u0645\u060c \u0627\u06cc\u0646 \u0646\u06cc\u0631\u0648\u0647\u0627 \u0628\u0647 \u0627\u06cc\u0646\u062a\u0631\u0641\u06cc\u0633 \u0633\u0645\u0627\u0646 \u0648 \u067e\u0633\u062a \u0645\u0646\u062a\u0642\u0644 \u0645\u06cc\u0634\u0647\u060c \u0646\u06cc\u0631\u0648\u06cc \u0628\u0631\u0634\u06cc \u0627\u06cc\u062c\u0627\u062f \u0645\u06cc\u06a9\u0646\u0647 \u0648 \u062f\u0631 \u0646\u0647\u0627\u06cc\u062a \u0631\u0648\u06a9\u0634 \u0647\u0645\u0631\u0627\u0647 \u0628\u0627 \u0633\u0645\u0627\u0646 \u0627\u0632 \u062f\u0646\u062f\u0648\u0646 \u062f\u0631 \u0645\u06cc\u0627\u062f.",
          "expected_title": "\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u062a\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u0644\u0642 \u0645\u06cc\u200c\u062e\u0648\u0631\u0647 \u0648 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0631\u0647\u060c \u062d\u0627\u0644\u0627 \u0686\u06cc\u200c\u06a9\u0627\u0631 \u06a9\u0646\u06cc\u0645\u061f",
          "kind": "phase_f",
          "output_sha256": "d5263504768e0654a19b638a1684072f2783f6af861f2f91f6bf0b85d0053419",
          "recorded_at": "2026-10-17T10:06:12+00:00",
          "summary": "61 passed, 0 warned, 0 failed  \u2014 publish is COMPLETE"
        }
      ]
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
        "reason": "Not a NoteCast; no parent episode mutation.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.5-b",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not an episode/NoteCast pair.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.6",
        "module": "04-taxonomy-and-navigation.md",
        "reason": "Not a Promptologist sequence.",
        "status": "skipped"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.4.7",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
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
        "reason": "Not a glossary term publication.",
        "status": "skipped"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.4.8",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
        ],
        "id": "C.4.8",
        "module": "05-semantic-linking.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.4.9",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
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
        "reason": "No attached paper; no Drive/catalog/citation action.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.2",
        "module": "06-paper-ingestion.md",
        "reason": "No attached paper; no Drive/catalog/citation action.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.10.3",
        "module": "06-paper-ingestion.md",
        "reason": "No attached paper; no Drive/catalog/citation action.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.11",
        "module": "07-flashcards-and-quiz.md",
        "reason": "DentCast+ optional educational bank; this publication is video and caption only, no separate flashcards authored.",
        "status": "skipped"
      },
      {
        "evidence": [],
        "id": "C.4.12",
        "module": "07-flashcards-and-quiz.md",
        "reason": "Explicit user instruction: no quiz. No FAQPage or scored questions authored.",
        "status": "skipped"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.4.13",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023332637"
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
        "reason": "Ordinary video, not a challenge.",
        "status": "skipped"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.5.0",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023528344"
        ],
        "id": "C.5.0",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.5",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023528344"
        ],
        "id": "C.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.5.5",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023528344"
        ],
        "id": "C.5.5",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.5.6",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023528344"
        ],
        "id": "C.5.6",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.5.6-b",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023528344"
        ],
        "id": "C.5.6-b",
        "module": "10-brain-and-pathways.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.6",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023528344"
        ],
        "id": "C.6",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.8",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023528344"
        ],
        "id": "C.8",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#C.7",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023528344"
        ],
        "id": "C.7",
        "module": "11-build-and-version.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#D",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023528344"
        ],
        "id": "D",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#E",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023528344"
        ],
        "id": "E",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "phase_f:d5263504768e0654a19b638a1684072f2783f6af861f2f91f6bf0b85d0053419"
        ],
        "id": "F",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
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
      "dentcast-brain.json",
      "dentcast-hashtag-reference.json",
      "dentcast-plus/en/video-14.html",
      "dentcast-plus/index.html",
      "dentcast-plus/video-14.html",
      "glossary/index.html",
      "index.html",
      "pillar/bonding/index.html",
      "pillar/bonding/structure.json",
      "pillar/ceramics/index.html",
      "pillar/ceramics/structure.json",
      "pillar/digital/index.html",
      "pillar/digital/structure.json",
      "pillar/esthetic/index.html",
      "pillar/esthetic/structure.json",
      "pillar/fixed-pros/index.html",
      "pillar/fixed-pros/structure.json",
      "pillar/implantology/index.html",
      "pillar/implantology/structure.json",
      "pillar/index.html",
      "pillar/occlusion/index.html",
      "pillar/occlusion/structure.json",
      "pillar/operative/index.html",
      "pillar/operative/structure.json",
      "pillar/practice-infrastructure/index.html",
      "pillar/practice-infrastructure/structure.json",
      "pillar/removable-pros/index.html",
      "pillar/removable-pros/structure.json",
      "pillar/structure.json",
      "pillar/treatment-planning/index.html",
      "pillar/treatment-planning/structure.json",
      "player.html",
      "plus/content-index.json",
      "plus/pathways.json",
      "reports/video-14-publication.md",
      "service-worker.js",
      "sitemap.xml",
      "up-board/index.json"
    ]
  },
  "reconciliation": {
    "note": "Reviewed actual scoped work, current handoff, and previous remote delivery",
    "observed_changes": [
      "HEAD_CHANGED_REVIEW_REQUIRED"
    ]
  },
  "schema": "publish-handoff-v2",
  "snapshot": {
    "branch": "codex/publish-video-14",
    "files": {
      "dentcast-brain.json": {
        "executable": false,
        "kind": "file",
        "sha256": "b2caa700a0a49c4f8cd126bcbecf197893bfc1b51c1453b908c77ec16ec34968"
      },
      "dentcast-hashtag-reference.json": {
        "executable": false,
        "kind": "file",
        "sha256": "b63d2a7377770ee9ff1351621e48d914666dd299e46e044550de07487b64232b"
      },
      "dentcast-plus/en/video-14.html": {
        "executable": false,
        "kind": "file",
        "sha256": "44b38a61d96b8039b65016d8fd1163a4303efe3c210b2ce8e87d032cbec549fd"
      },
      "dentcast-plus/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "a7e6d217303dd3c57f73e38e7253f7fb849220daff1a139cc1556b04a1855c37"
      },
      "dentcast-plus/video-14.html": {
        "executable": false,
        "kind": "file",
        "sha256": "feb7e89240dd494cca88076dd93cf52290a0a842c3ade94e0f9efb7c964d7165"
      },
      "glossary/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "0aa66214468cda619ee6f40987541ac54a838057f232effde978931ae04a45b7"
      },
      "index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "c28a0b22f91b431291e86199dc4a1526e17f558bc409b5152bfa8a26d727fe80"
      },
      "pillar/bonding/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "59214c2958a870a3995d9889f86b2ad415dbcba7081efbb872567f9c289e2ccf"
      },
      "pillar/bonding/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "cde539ec63730bc36cee70ea0a7c75bdc2a7ed0e1ec43d321999dd1b91c96920"
      },
      "pillar/ceramics/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "3bca21bfb46c1e2d9c6f0a32e02ae8919b88d276c5e064b138e658d14c7ee8d0"
      },
      "pillar/ceramics/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "3f506b458ded633748fa6119dcfdcc753c32f519924d18a90f736f98bb35e431"
      },
      "pillar/digital/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "bafcd329862aa3eaf21624e16902a4cd5d165b2150481eadec74ba9de9d2f5d6"
      },
      "pillar/digital/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "0e336b50f544fbc0972b74e5cfcdde003b5a3d45edc70ce2e7981eac29bb31df"
      },
      "pillar/esthetic/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "2f3f1be3d8f07a485f4701313f22e9639d00110b27bcce430790f840105099db"
      },
      "pillar/esthetic/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "3b73992ac5c01c49be1de14bfa87d1796493a2105183b831d82ff4e22f436993"
      },
      "pillar/fixed-pros/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "03b00478f4aee35abe19612843ac82a16173850e1766e5890e14d08aa0c96fb0"
      },
      "pillar/fixed-pros/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "cfdbb7240303d198b560c603bba158d8873650309d204811ca9c49fd2b67c54f"
      },
      "pillar/implantology/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "685e994334269c90eee7b26a9250f943515aa7e781ddc972f0f84f6bb9ae1b48"
      },
      "pillar/implantology/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "8f9c4c2a1df5132df86a7b3ae56e5915f93eef003dee593d2b89a1483c937808"
      },
      "pillar/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "3a4a08627e10f3e978a5fd139b08d7af9e3e681cc9d9a0594cb6e433fb87285c"
      },
      "pillar/occlusion/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "1b547491757b57414e2f1392c74906bf1c4a5cbfba17618023f05e6f04f5091f"
      },
      "pillar/occlusion/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "4cf031ce655ed3aa21366f6afaef1168eef21e8423e32ca9a8000b9df614cb2f"
      },
      "pillar/operative/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "15bf17d7f64393d4689e8b48cd21a3afe4d67437c1f736394d207611b71ea96b"
      },
      "pillar/operative/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "3b35c45402bf45f64e66c3bfc0c56899f85a28660bf425aee34cdaef5644fe04"
      },
      "pillar/practice-infrastructure/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "6db31092147994223e3dba1c6ddbbac0319a09cba7eb1837621a9c93c0ceb78b"
      },
      "pillar/practice-infrastructure/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "aefdb12f6ab97fafc144482858aa8229e87fd70f5662988eef029fa473714110"
      },
      "pillar/removable-pros/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "405d03f904d63c83d8d5b0506dd3fd4af9b2d8f8dcb6f11b53727e86823b1c46"
      },
      "pillar/removable-pros/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "c1ffdda4412a41a9fb92fd063d27ff0fe51d38f59cca06a15dbbc30f3885bc39"
      },
      "pillar/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "9893bb7de5e796d1664c2606afe8621c1520e8f5787a66dd68fc5dc1e5c7b2dc"
      },
      "pillar/treatment-planning/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "6e391ce0d79e56d3955e1f21c277cc88b1bc3d4f12a0b9d10ec4159bac6997b0"
      },
      "pillar/treatment-planning/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "5e8e472c57d293de1d40445ef803d439df25754eb343cb07391a5e01c100f6b5"
      },
      "player.html": {
        "executable": false,
        "kind": "file",
        "sha256": "4ef122891f973c79d4e964aa2b9ee97d02b79fb14e07713c1bb66fa61ebf0a43"
      },
      "plus/content-index.json": {
        "executable": false,
        "kind": "file",
        "sha256": "01c4bcd44ed8dc378ccfbc0fdcba2ada521bd541d627ec3991a99ade748e0522"
      },
      "plus/pathways.json": {
        "executable": false,
        "kind": "file",
        "sha256": "50a957b893ce9be51998779fdb302d1f27a77c22785b6e5f03da954a0e5f6e14"
      },
      "reports/video-14-publication.md": {
        "executable": false,
        "kind": "file",
        "sha256": "b402c9fbd6f0dbc055030bb1a45758f7d7077a8724c3ab2a4e0b1b1b1c66d718"
      },
      "service-worker.js": {
        "executable": false,
        "kind": "file",
        "sha256": "222f42eb1037068cceb287984a89f77914f979da766d38a4e09d6e2c3c5976a9"
      },
      "sitemap.xml": {
        "executable": false,
        "kind": "file",
        "sha256": "1494d13c7dbde356a4a145b6525ce69a2cb5e3fe7bfcf92c102c8cb175c44c67"
      },
      "up-board/index.json": {
        "executable": false,
        "kind": "file",
        "sha256": "0f4b402bf42cee2b36aa8e47853937ef3edbe170d77c87d339bdbc5e817c3cd2"
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
  "updated_at": "2026-10-17T10:07:16+00:00"
}
```
<!-- /dentcast-publish-state-v1 -->
