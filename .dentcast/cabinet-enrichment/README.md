# Cabinet enrichment — staging results

What a model read in each cabinet PDF (tools/cabinet_enrich.py), one line per
paper in `results.jsonl`. **Staging only: nothing here is in
`dentcast_cabinet_full_catalog.json` yet.** The founder reviews it first
(removal candidates, catalogue-type corrections, a sample of tags), then a PR
writes the accepted parts into the catalogue as separate fields.

Pipeline (founder's decisions, 2026-11-15): Sonnet reads front page, abstract,
methods, results, conclusion and funding; mechanical gates (vocabulary, no
duplicates, low-value list, verbatim evidence for every tag and fact,
bibliographic values present in the text); one Opus reviewer accepts or
rejects every tag (calibrated on 50 papers against a second reviewer: 95%
agreement). The paper's text and the verbatim quotes are not kept here.

Fields: `ft_tags` (accepted library tags), `new_tags` (accepted tags the
library does not have yet), `doc_class`, `off_topic`, `catalog_type_ok` /
`suggested_type`, `text_quality`, `facts` (doi, authors, year, journal,
population, intervention, comparison, outcomes, main_result, sample_size,
follow_up, materials_brands, funding_coi, limitations; key_finding and
clinical_bottom_line only where the catalogue had none), `cites_in_cabinet`
(catalogue ids this paper cites, from its reference list, mechanically).

Coverage: 1342 papers in `results.jsonl` (slice 1: 661, 2026-11-15; slice 2:
681, 2026-11-16). 808 catalogue papers not read yet, plus 19 that could not be
read (16 image-only scans needing OCR, 3 PDFs Drive would not serve: P0034,
P0478, P0679); `todo` lists them again at the front of every slice.

## Live since 2026-11-15

Founder's decision: the results are on the site. `dentcast_cabinet_enrichment.json`
(built by `tools/cabinet_enrich.py site` / `publish`; robots-blocked and
`X-Robots-Tag: noindex` like the catalogue) is read by the cabinet page:
added tags (dotted chips, search field `E`, weight 4), study facts (field `M`,
weight 2, «Study facts» on the card) and «Cites N papers in this library».
Applied to the catalogue itself: 3 unusable documents removed (P0150 e-book
cover, P0670 brochure, P1995 table of contents), 12 study types corrected,
and empty key_finding / clinical_bottom_line / doi / authors / year / journal
filled from what the paper itself says. The Covid-19 folders and two other
off-topic papers stay (no decision yet). Seven image-only scans need OCR.

Slice 2 (2026-11-16): no document removed (P1533, judged «front matter only»,
has clinical chapters as images; the off-topic ones are in the Covid-19 folder
or the founder's own MICA folder), 17 study types corrected, 63 empty
key_finding / clinical_bottom_line and a few year / doi / authors / journal
filled. P0309's file does not match its catalogue authors/journal (nothing
filled there). Text not readable without OCR: P0360 (font codes), P1414
(image scan behind a ResearchGate cover).

## Running the next slice (any session)

All instructions live here: `PROPOSE.md` (Sonnet), `JUDGE.md` (Opus),
`workflow-propose-judge.js` (Workflow script; args `{work, batches}`).

    W=<scratch dir outside the repo>
    python3 tools/cabinet_enrich.py vocab   --work $W
    python3 tools/cabinet_enrich.py todo    --limit 700          # next ids
    python3 tools/cabinet_enrich.py prepare --ids <ids> --work $W   # Drive download; shard into parallel processes
    # Workflow: batches of 10 «ok» ids (text_status) -> propose (sonnet) + check + judge (opus) -> $W/J/
    python3 tools/cabinet_enrich.py merge   --work $W --judges J --out $W/merged.jsonl
    python3 tools/cabinet_enrich.py publish --work $W --merged $W/merged.jsonl   # results.jsonl + site file
