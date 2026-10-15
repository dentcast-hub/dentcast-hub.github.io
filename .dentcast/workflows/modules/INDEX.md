# Publishing workflow modularization — staging index

**Status: staged extraction only; NOT activated.**

The eight files below are consecutive, verbatim slices of the existing `.dentcast/workflows/README.md`. The original canonical workflow, `CLAUDE.md`, `AGENTS.md`, and Cursor rules remain unchanged on this branch. Publishing behavior has **not** switched to these modules.

## Ordered modules

1. [Hard rules](01-hard-rules.md) — original lines 1–56
2. [Routing and intake](02-routing-intake.md) — original lines 57–356
3. [Page creation and linking](03-page-and-links.md) — original lines 357–957
4. [Paper ingestion](04-paper-ingestion.md) — original lines 958–1143
5. [Flashcards and quiz](05-learning-content.md) — original lines 1144–1335
6. [DES and Fidelity](06-des-fidelity.md) — original lines 1336–1966
7. [Challenge, metadata, pathways and build](07-finalize-build.md) — original lines 1967–2393
8. [English, notification, mechanical gate and report](08-english-notify-verify.md) — original lines 2394–2598

## Invariants and next gate

- The original 2,598-line README was reconstructed from these eight module bodies with exact character-for-character equality in the working branch.
- **Do not** edit or shorten policy while moving it. Retain global hard rules and mandatory gates.
- Before activation, audit cross-module dependencies and exception routing (LiteCast, challenge, DES, Fidelity, English mirror).
- Design a small router that loads global rules plus only the required stage. Update `CLAUDE.md`, `AGENTS.md` and `.cursor/rules/` in sync only when ready to activate.
- Re-run a full text-parity check and behavior checks before switching the canonical entrypoint.
- Checkpointing comes **after** the module boundaries and their inputs/outputs are approved.
- No merge to `main` without explicit founder approval.

## Why staged?

Extracting content is reversible and testable. Changing agent entrypoints is a separate, higher-risk step. This branch first proves lossless extraction before modifying live publishing instructions.
