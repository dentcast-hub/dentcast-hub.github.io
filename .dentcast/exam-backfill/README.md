# Exam-question backfill (founder decision 2026-11-10)

Pathway-exam MCQs for written pathway steps that had none, without founder read-through.
Protocol: drafter agents write from the page body only (verbatim `anchor_quote`, `--draft-check` clean);
an independent reviewer (Fable) answers blind from the page without the key; a row is appended to
`plus/exam-questions.json` (source `backfill`) only if the reviewer reaches the same key, finds no
defensible alternative and accepts. Rejected drafts are dropped, never patched.

Usage — copy this folder to a scratch directory OUTSIDE the repo first (scripts create run-*/rev-* next to bin/):
  python3 bin/prep.py <folder> 8      # run-<folder>/{pages,drafts,batches.json,existing-prompts.json}
  (drafter agents, one per batch, read run-<folder>/BRIEF-drafter.md)
  python3 bin/blind.py <folder>       # checks + isolated rev-<folder>/ without keys
  (Fable reviewer reads rev-<folder>/BRIEF-reviewer.md, writes review/*.json)
  python3 bin/apply.py <folder>       # appends accepted rows
Note: prep.py copies BRIEF-drafter.md into run-<folder>/.
Done: digital pathway, photocast, sharehub, metanotes, chairside, dentai, notecast.
Skipped by decision: dentcast-plus (video pages, only a short description as text).
Done also: insight. Remaining: none.
