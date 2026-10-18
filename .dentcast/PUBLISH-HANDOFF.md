Warning: truncated output (original token count: 5062)
Total output lines: 556

# Publication handoff

Semantic progress and evidence; current Git facts are read from Git.
- Schema: publish-handoff-v2
- Generation: 29
- Updated at (UTC): 2026-10-18T09:31:46+00:00
- Content: "sharehub/share-35"
- Status: in_progress
- Next canonical step: "C.0.1"
- Blocker: null

The structured record preserves decisions, approvals, step evidence and external outcomes.
Its compact snapshot is a verification baseline, not current Git status.

<!-- dentcast-publish-state-v1 -->
```json
{
  "generation": 29,
  "previous_sha256": "5f9765521791db4528a5dd41304086000b7cb09cca53c65d7e8d1db88953c957",
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
            "user instruction in current re…4062 tokens truncated…d",
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
  "updated_at": "2026-10-18T09:31:46+00:00"
}
```
<!-- /dentcast-publish-state-v1 -->
