# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v2
- Generation: 162
- Updated at (UTC): 2026-10-17T10:07:22+00:00
- Content: "dentcast-plus/video-14"
- Status: in_progress
- Next canonical step: null
- Blocker: null

The structured record preserves decisions, approvals, step evidence and external outcomes.
Its compact snapshot is a verification baseline, not current Git status.

<!-- dentcast-publish-state-v1 -->
```json
{
  "generation": 162,
  "previous_sha256": "e6e37cdcb3d0c646c04da40c5e89da07599a040e6ae1c121ed0d2bda2bfca68d",
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
      "delivery": [
        {
          "evidence": [
            "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023657827",
            "phase_f:28d41c3c3b5749d4deb4b61f9d5e65cb9e6d540f3b753e1b5ec19ded9a565cca",
            "https://github.com/dentcast-hub/dentcast-hub.github.io/tree/codex/publish-video-14"
          ],
          "scope": "Verified publication files and full checkpoint history delivered on authorized working branch for main release"
        }
      ],
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
        },
        {
          "evidence": [
            "reports/video-14-publication.md"
          ],
          "kind": "release_review",
          "result": "Reviewed scoped content, preserved source file line endings, reran version stamper after all hashed-source writes"
        },
        {
          "content_id": "dentcast-plus/video-14",
          "exit_code": 0,
          "expected_caption": "\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u062a\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u0644\u0642 \u0645\u06cc\u200c\u062e\u0648\u0631\u0647 \u0648 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0631\u0647\u060c \u062d\u0627\u0644\u0627 \u0686\u06cc\u200c\u06a9\u0627\u0631 \u06a9\u0646\u06cc\u0645\u061f\n\n\u0648\u0642\u062a\u06cc \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0631\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0631\u0647\u060c \u06cc\u06a9\u06cc \u0627\u0632 \u0627\u0648\u0644\u06cc\u0646 \u0686\u06cc\u0632\u0627\u06cc\u06cc \u06a9\u0647 \u0628\u0647 \u0630\u0647\u0646\u0645 \u0645\u06cc\u200c\u0631\u0633\u0647 \u06cc\u0647 \u0646\u0642\u0637\u0647 \u062a\u06cc\u0632\u0647\u060c \u0686\u0647 \u0631\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u0686\u0647 \u0631\u0648\u06cc \u062e\u0648\u062f \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631\u060c \u06a9\u0647 \u0646\u0645\u06cc\u200c\u0630\u0627\u0631\u0647 \u067e\u0633\u062a \u06a9\u0627\u0645\u0644 \u0628\u0646\u0634\u06cc\u0646\u0647.\n\n\u0645\u062b\u0644\u0627\u064b \u06cc\u0647 \u0642\u0633\u0645\u062a\u06cc \u0627\u0632 \u062f\u0646\u062f\u0648\u0646 \u062a\u06cc\u0632 \u0628\u0648\u062f\u0647 \u0648 \u0645\u0646 \u0628\u0627 \u062f\u0648\u0631\u0627\u0644\u06cc \u0631\u0648\u0634 \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0633\u0627\u062e\u062a\u0645. \u0627\u0648\u0644\u0634 \u06a9\u06cc\u067e \u0628\u0648\u062f\u0647 \u0648 \u062b\u0628\u0627\u062a \u062f\u0627\u0634\u062a\u0647\u060c \u0648\u0644\u06cc \u0628\u0639\u062f \u0627\u0632 \u0631\u06cc\u062e\u062a\u06af\u06cc \u0647\u0645\u0648\u0646 \u0646\u0642\u0637\u0647 \u062a\u06cc\u0632 \u0645\u0627\u0646\u0639 \u0646\u0634\u0633\u062a\u0646 \u06a9\u0627\u0645\u0644 \u0634\u062f\u0647. \u06cc\u0627 \u0646\u0648\u06a9 \u067e\u0633\u062a \u062e\u06cc\u0644\u06cc \u062a\u06cc\u0632 \u0628\u0648\u062f\u0647 \u0648 \u0628\u0639\u062f \u0627\u0632 \u062a\u0628\u062f\u06cc\u0644 \u0634\u062f\u0646 \u0628\u0647 \u0641\u0644\u0632\u060c \u0646\u062f\u0648\u0644\u06cc \u06cc\u0627 \u0636\u0627\u06cc\u0639\u0647\u200c\u0627\u06cc \u0631\u0648\u0634 \u0627\u06cc\u062c\u0627\u062f \u0634\u062f\u0647 \u0648 \u0646\u0645\u06cc\u200c\u0630\u0627\u0631\u0647 \u0628\u0634\u06cc\u0646\u0647.\n\n\u0628\u0631\u0627\u06cc \u0647\u0645\u06cc\u0646 \u062a\u0648\u06cc \u0647\u0645\u0686\u06cc\u0646 \u062d\u0627\u0644\u062a\u06cc \u0627\u0648\u0644 \u0628\u0631\u0645\u06cc\u200c\u06af\u0631\u062f\u0645 \u062c\u0627\u06cc \u062a\u06cc\u0632 \u0631\u0648 \u0628\u0631\u0631\u0633\u06cc \u0645\u06cc\u200c\u06a9\u0646\u0645 \u0648 \u0627\u06af\u0647 \u0644\u0627\u0632\u0645 \u0628\u0648\u062f \u0627\u0635\u0644\u0627\u062d\u0634 \u0645\u06cc\u200c\u06a9\u0646\u0645. \u062e\u06cc\u0644\u06cc \u0648\u0642\u062a\u0627 \u0647\u0645\u06cc\u0646 \u0645\u0634\u06a9\u0644 \u0631\u0648 \u062d\u0644 \u0645\u06cc\u200c\u06a9\u0646\u0647\u060c \u0627\u0645\u0627 \u062a\u0648 \u0627\u06cc\u0646 \u0645\u0648\u0631\u062f \u062d\u0644 \u0646\u0634\u062f.\n\n\u067e\u0633 \u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u0631\u0648 \u0627\u0632 \u0627\u0648\u0644 \u062a\u06a9\u0631\u0627\u0631 \u06a9\u0631\u062f\u0645. \u0686\u0648\u0646 \u0628\u0627 \u0627\u06cc\u0646 \u0639\u062f\u0645 \u062b\u0628\u0627\u062a \u0646\u0645\u06cc\u200c\u062a\u0648\u0646\u06cc \u0631\u0648\u06a9\u0634 \u0631\u0648 \u0631\u0648\u0634 \u0628\u0630\u0627\u0631\u06cc. \u0648\u0642\u062a\u06cc \u0631\u0648\u06a9\u0634 \u0648\u0627\u0631\u062f \u0633\u06cc\u06a9\u0644 \u062c\u0648\u06cc\u062f\u0646 \u0628\u0634\u0647 \u0648 \u0646\u06cc\u0631\u0648\u0647\u0627\u06cc \u062c\u0648\u06cc\u062f\u0646 \u0628\u0647\u0634 \u0648\u0627\u0631\u062f \u0628\u0634\u0647\u060c \u0627\u06af\u0647 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0634\u062a\u0647 \u0628\u0627\u0634\u06cc\u0645\u060c \u0627\u06cc\u0646 \u0646\u06cc\u0631\u0648\u0647\u0627 \u0628\u0647 \u0627\u06cc\u0646\u062a\u0631\u0641\u06cc\u0633 \u0633\u0645\u0627\u0646 \u0648 \u067e\u0633\u062a \u0645\u0646\u062a\u0642\u0644 \u0645\u06cc\u0634\u0647\u060c \u0646\u06cc\u0631\u0648\u06cc \u0628\u0631\u0634\u06cc \u0627\u06cc\u062c\u0627\u062f \u0645\u06cc\u06a9\u0646\u0647 \u0648 \u062f\u0631 \u0646\u0647\u0627\u06cc\u062a \u0631\u0648\u06a9\u0634 \u0647\u0645\u0631\u0627\u0647 \u0628\u0627 \u0633\u0645\u0627\u0646 \u0627\u0632 \u062f\u0646\u062f\u0648\u0646 \u062f\u0631 \u0645\u06cc\u0627\u062f.",
          "expected_title": "\u067e\u0633\u062a \u0648 \u06a9\u0648\u0631 \u062a\u0648\u06cc \u062f\u0646\u062f\u0648\u0646 \u0644\u0642 \u0645\u06cc\u200c\u062e\u0648\u0631\u0647 \u0648 \u062b\u0628\u0627\u062a \u0646\u062f\u0627\u0631\u0647\u060c \u062d\u0627\u0644\u0627 \u0686\u06cc\u200c\u06a9\u0627\u0631 \u06a9\u0646\u06cc\u0645\u061f",
          "kind": "phase_f",
          "output_sha256": "28d41c3c3b5749d4deb4b61f9d5e65cb9e6d540f3b753e1b5ec19ded9a565cca",
          "recorded_at": "2026-10-17T10:07:21+00:00",
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
          "phase_f:28d41c3c3b5749d4deb4b61f9d5e65cb9e6d540f3b753e1b5ec19ded9a565cca"
        ],
        "id": "F",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
      },
      {
        "evidence": [
          "reports/video-14-publication.md#G",
          "https://github.com/dentcast-hub/dentcast-hub.github.io/actions/runs/39023657827"
        ],
        "id": "G",
        "module": "12-english-notify-verify.md",
        "reason": null,
        "status": "completed"
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
      "plus/des-scores.json",
      "plus/pathways.json",
      "reports/video-14-publication.md",
      "service-worker.js",
      "sitemap.xml",
      "up-board/index.json"
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
        "sha256": "3f371896099ac972b9cdef7c9032b0dddf16e39a117b1dc61e56a00f19922c03"
      },
      "dentcast-hashtag-reference.json": {
        "executable": false,
        "kind": "file",
        "sha256": "8de021cc55cd8327c95c7e971834c48cc84eb22637b094588c58fe440a3cf2ed"
      },
      "dentcast-plus/en/video-14.html": {
        "executable": false,
        "kind": "file",
        "sha256": "44b38a61d96b8039b65016d8fd1163a4303efe3c210b2ce8e87d032cbec549fd"
      },
      "dentcast-plus/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "6fd54a46144b3874d7430c2bb2e1bc426f5bba90db70a5794794640df18114e4"
      },
      "dentcast-plus/video-14.html": {
        "executable": false,
        "kind": "file",
        "sha256": "feb7e89240dd494cca88076dd93cf52290a0a842c3ade94e0f9efb7c964d7165"
      },
      "glossary/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "1ae6cdc7abf4ff168cbe4f367c15e26dd99b811258489ed9b95bf520c8e2bdd4"
      },
      "index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "c1929199f24091358efb99d5d696687d0f6d2fd8b10098db8c3254ecaf01aeb1"
      },
      "pillar/bonding/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "2829b65356cc0e3f113cd99754f8b620f4787635f85240b2e7cc67d81ee4a549"
      },
      "pillar/bonding/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "b5c541fb04542fe7b17be66bc803acbc88e4f5dcfd85dcd9217f56d631df2692"
      },
      "pillar/ceramics/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "ae991cd2a2b518ff723f55839c5b961e8e2212d0e03f690b0303c1ff7cac7f67"
      },
      "pillar/ceramics/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "532d96ee108f0306610e70e7e9c40f93114bab6f6a4c8f6fd7cc1f154eeb3d4a"
      },
      "pillar/digital/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "d70b991b1844c900b5ecadb2fa04e0f94c554f36eb445ce0d4c16d75c528f9d9"
      },
      "pillar/digital/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "c66d50f7e0e12e1e9151bde463c2750d910f49c29419b0635d23125bbeeed275"
      },
      "pillar/esthetic/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "c446dc7a076b2d11df4b661d08b89e4c29e55504d6abac975a0ec3b2137fda65"
      },
      "pillar/esthetic/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "9d7cfef6958d88182d715581e59e7bed857c5f78a9b11975a71c0f2ce1fa869d"
      },
      "pillar/fixed-pros/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "4734350c200c9f365626ea1403bc2d447cb1e5ffa22607d4e99c02a4eba749f9"
      },
      "pillar/fixed-pros/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "acacf97dc11be94ad2a76f738cade5b74e9305a39a77297856fc1fbf96dcd645"
      },
      "pillar/implantology/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "f1717a701fb35a24a46361729cff26b848a6d87222852612ca9efb636704a128"
      },
      "pillar/implantology/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "0075bf22606549b104d5c09022da59731868d1b7e212ffdd0872af34c6681373"
      },
      "pillar/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "c90177d73da4e1e03b2fa83d76048c551821d60e3a310007e273a3882c2703ca"
      },
      "pillar/occlusion/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "388798b8d18813739de2b321c756f0c4e27e489f900c3f646f424686b20660da"
      },
      "pillar/occlusion/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "eaad88f414db9975bb3d5c91defd2cd877c2d6450d9eb25ced33757d7349a953"
      },
      "pillar/operative/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "7a9d31fadb0d0e22fbad5a2cd9eed48f5134253792d988e936178c90828da4db"
      },
      "pillar/operative/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "a755fe75dbdc211420869f1b4bdba6eef8a30b3de229d6b3a52b67a01390a23e"
      },
      "pillar/practice-infrastructure/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "fb3f16384a63260829df8dbc8c65a7b2ccfdf24cc07b7ab02b9f16ae62eefb77"
      },
      "pillar/practice-infrastructure/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "e40411f9f2bb86b5e527c51733af0f79735258c8b6bc5041516d8cb3ff0b19bd"
      },
      "pillar/removable-pros/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "fea0347fd20f22b75e05e3011e7c32a97f5b4486096f5c574e6b709ba56191c3"
      },
      "pillar/removable-pros/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "b1e1c450e42626726de9f8a86806c505c4042ec04adb78f9314b91a3bbf6f84b"
      },
      "pillar/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "aa29c42c9442ddfd0cc9569a2b3ac989a145162a62f55396bda12e8167076e84"
      },
      "pillar/treatment-planning/index.html": {
        "executable": false,
        "kind": "file",
        "sha256": "913c611b9fc3d714be292ef2f03dbd45c3bdf8c521f2a39d5517564ba694b68f"
      },
      "pillar/treatment-planning/structure.json": {
        "executable": false,
        "kind": "file",
        "sha256": "73da37f6abe34f25b065d944b51fe3dbdd2ea3b8ca1bcf94825b2d4d0f0651b6"
      },
      "player.html": {
        "executable": false,
        "kind": "file",
        "sha256": "737c0d2c18308d5b318fc4b4fda95a80884c8e4bdc2d1128c9b61289b2ca8f33"
      },
      "plus/content-index.json": {
        "executable": false,
        "kind": "file",
        "sha256": "01c4bcd44ed8dc378ccfbc0fdcba2ada521bd541d627ec3991a99ade748e0522"
      },
      "plus/des-scores.json": {
        "executable": false,
        "kind": "file",
        "sha256": "76b55139aec49d1229b721f29e2b688741761420cb78445ee6afe9f572d9069a"
      },
      "plus/pathways.json": {
        "executable": false,
        "kind": "file",
        "sha256": "de25efbd7176fca7d9e3e37a259510412ca6096e0faac93a6bedc6ce1008c530"
      },
      "reports/video-14-publication.md": {
        "executable": false,
        "kind": "file",
        "sha256": "d807f0fbaff705eeab2b3906dbcce23ced24f76f3daa3c369a64a15657113c21"
      },
      "service-worker.js": {
        "executable": false,
        "kind": "file",
        "sha256": "4a87871834045fab10d9eb52ab9a038d05a7330e9194e582983e4fe56566f924"
      },
      "sitemap.xml": {
        "executable": false,
        "kind": "file",
        "sha256": "1494d13c7dbde356a4a145b6525ce69a2cb5e3fe7bfcf92c102c8cb175c44c67"
      },
      "up-board/index.json": {
        "executable": false,
        "kind": "file",
        "sha256": "5c662eaf0817c39ad64bef7feb7b8d109bea673704bc6cc6a4a8c49d4fc56e4f"
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
  "updated_at": "2026-10-17T10:07:22+00:00"
}
```
<!-- /dentcast-publish-state-v1 -->
