# Shared active global rules

Before content work, read this router and the complete `agent-parity.md` once.
Then run `python3 tools/dentcast_global_rules.py --read` to load all core
sections. These include repository/content restrictions, publishing data,
cache rules, ads integration, publication surfaces, DES display and every
site-wide invariant. Full canonical publication modules remain mandatory.
If a client caps tool output (the full read is tens of thousands of characters),
read the same selection in parts instead: `--list` shows the chosen sections,
their sizes and the page count; add `--page 1`, `--page 2`, … to `--read` until
the last page says so (pages split only at line boundaries; `--page-chars`
changes the size), or read named sections with repeated `--section <id>`.
Every page or section of the selection must be read; paging never omits text.

Before editing any file, run the selector with **every planned path**:
`python3 tools/dentcast_global_rules.py --path <path> --path <other-path>`.
Read every newly required section using the same arguments plus `--read`.
Repeat when scope expands, before touching the added files. Use repeated
`--loaded <section-id>` only for sections already read completely in this same
session and unchanged source revision. This avoids rereading core rules.
A new session or changed source invalidates that loaded list.

The map covers all lines of the three canonical sources, without summaries:
- `.dentcast/workflows/global/repo-conventions.md`
- `.dentcast/workflows/global/plus-premium.md`
- `.dentcast/workflows/global/site-invariants.md`

Pathway data changes additionally load the complete pathway/certificate/exam
operations section; episode/audio paths load the audio-hub rules. Unknown
paths (including API/admin, unfamiliar shared code, new categories and
unmapped specialty tasks) load **all sections**. For non-file operations,
external actions, uncertain scope or an explicit subsystem task, use `--all`.
If the selector is unavailable or its source hash/coverage check fails, read
all three canonical files completely; do not proceed with a guessed subset.
Source references from a module must still be followed: load the named full
section even if an edit-path trigger has not fired yet. Selection never grants
a category exemption or changes a required publication action.

`LOAD-MAP.json` is a byte-preserving load index, not a second rule authority.
The source files remain authoritative and unchanged. If their text changes,
update ranges and hashes and run `test_dentcast_global_rules.py`; every line
must remain covered exactly once. Existing references to the full canonical
files remain valid; use `--all --read` whenever their full context is required.

Execution authority: applicable canonical workflow and its active modules > these global rules > agent-parity > client routing summaries. For new publication the twelve modules in `../modules/INDEX.md` are the complete instruction sequence; README routes them, not a monolithic fallback. User instructions take priority. A genuine contradiction in active instructions must be surfaced rather than resolved by loading backups.

Source migration is documented in MIGRATION.json for audit only. Legacy snapshots are backup artifacts, never required reading or runtime authority. Existing references to AGENTS §6/7/8 or CLAUDE Repo conventions/Site-wide invariants resolve to these active files. Preserve scientific prompts and source-dependent DES/Fidelity exactly.
