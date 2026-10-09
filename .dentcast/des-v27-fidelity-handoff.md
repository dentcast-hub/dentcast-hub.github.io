# DES v2.7 FIDELITY — handoff (1405/07/17)

Spent-when-done brief for the session that continues this work. Nothing here
is a rule; the rules are in `.dentcast/dentcast-evidence-score-v2.7.md`.

## Where it started

The founder asked whether `sharehub/share-23` (blood vs saliva on dentin,
two cited systematic reviews) was wrong, because a v2.6 dry run had marked
three of its blood claims `REVERSED`. Reading both papers in full showed the
claims are supported. The cause was the test, not the page: both SOURCE
records were scored `FULL_TEXT`, but the FIDELITY call had been given the
abstracts. The founder writes from the full text when the cabinet holds it,
and from the abstract when only that exists, so FIDELITY must read the same
text.

## What v2.7 is (all committed, all routers switched)

- **F0 + appendix rule 11 — basis parity.** FIDELITY gets the SOURCE call's
  own `source_text` and `text_basis`. `tools/des_fidelity_units.py --build`
  exits non-zero on a mismatch.
- **F2-iv item 4.** A sentence naming both conditions together («saliva or
  blood») is a general finding, read as silence on a claim that separates
  them.
- **F2-v (new) — a procedure under FULL_TEXT.** Gather sentences on the
  claim's own material/contaminant AND action (a table cell is a sentence; a
  different action or an explicitly different stage is not gathered). Ones
  naming the claim's stage outrank stage-less ones. If any gathered sentence
  states the claim unchanged → `MATCHES`. `REVERSED` only after that search
  finds nothing.
- **F2 smaller rules.** A ranking is stated only by a sentence that ranks.
  «همه‌ی سیستم‌ها» over one tested system, or a finding moved to «بقیه‌ی
  سیستم‌ها», is a scope change. A product's category is outside knowledge.
  When a source both advises and reports an effect, the advice governs. A
  «چون/زیرا» clause is a separate half. A mid-sentence «پس» makes what
  follows it the conclusion. A unit is judged on its own words (a pointing
  word like «همین مرحله» is read through to its heading).
- **`source_conclusion` under FULL_TEXT** is the last sentence of the
  paper's last Conclusion section (`conclusion_of()` in the tool).
- **F6 — POOLED is no longer one model call.** It is one ordinary `SOURCE`
  call per paper (`input-pooled-S<n>.json`, every unit in each,
  `pooled_part` set). Then `tools/des_fidelity_units.py <id> --merge <dir>`
  over `out-S<n>.json` writes the pooled object by a deterministic fold:
  any `MATCHES` → `MATCHES`; else `ALTERED`; else `REVERSED`; else silence;
  `NOT_A_CLAIM`/`AUTHOR_VIEW` only if every call said so. `fact_fa` and
  `interpretation_fa` are composed by the tool.

`plus/des-scores.json` was never written. No FIDELITY record exists anywhere.

## Precision so far (share-23, 70 units)

| Round | Design | Score range | Level | Units identical |
|---|---|---|---|---|
| r1–r3 (12 runs) | one call over both full texts (~92k chars) | 75–90 | split HIGH/MEDIUM | 49/70 |
| r4 (4 runs) | one call per paper + `--merge` | 87–94 | split (one `REVERSED` on u57 in one run) | 58/70 |

Regression (abstract inputs share-7, dentai-21, T2, T3): identical to their
v2.6 records in every round.

What is stable across all 16 runs: no blood/saliva claim the full texts
support was ever `REVERSED` (u29 «برای خون … دوباره اچ کنید» MATCHES 16/16).

r4's remaining splits: u40, u42, u46, u48, u51, u53, u56, u57, u63, u68,
u69 (plus u32 NOT_A_CLAIM vs NOT_IN_SOURCE). Note: r4 run D's S2 call was
reported failed (rate limit) but its `out-S2.json` exists; treat run D as
unconfirmed.

## Findings about the page itself (for the founder, not to edit in passing)

Recurring `ALTERED` (the page is a notch firmer than the paper, not wrong):
u48's mechanism («چون پروتئین‌ها … با آب نمی‌روند», Bourgi: "could be
explained … may not washed away"), u69's chlorhexidine ("certain experts
suggest"), u57/u68 bur removal applied to all/other systems (tested on one
universal adhesive). Genuinely mixed in the sources: u28 (saliva after
etching — Bourgi cites one study requiring re-etch), u33 (adding adhesive on
a contaminated uncured layer — Kucukyilmaz vs Chang).

## To continue

1. The scratch directory did not survive; rebuild the inputs. Full texts are
   in the cabinet on Google Drive: Katebi 2026 `1REVoqJk-mmrt9vg8N2WWUH9sP6bMA9F3`,
   Bourgi 2023 `1tjuskphHcFs-SQPV-eh3KS1iQ9_jsPp7`. Never commit them (the
   publishers' licences). Write `texts.json` (DOI → `{source_text,
   text_basis: "FULL_TEXT"}`), then
   `python3 tools/des_fidelity_units.py sharehub/share-23 --texts texts.json --build <dir>`.
2. Run 4 independent runs × 2 calls (spec minus appendix as the system
   instruction), save as `<dir>/<run>/out-S1.json` / `out-S2.json`,
   `--merge` each run, and compare per-unit verdicts across runs.
3. Close the remaining splits, or decide with the founder that a per-unit
   split rate of ~1 in 6 on long full texts is accepted and the score is
   read to the level only when every run agrees.
4. If any spec text changes after this commit, it stays v2.7 only while no
   record carries 2.7; otherwise bump.
5. Only after precision is accepted: write the FIDELITY record for share-23
   and run `python3 tools/verify_publish.py sharehub/share-23`.
   `verify_publish.py` already handles the pooled object; check it accepts
   `pooled_part` being absent from the merged object.
