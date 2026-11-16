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

Coverage (final, 2026-11-16): every one of the 2124 catalogue papers has been
read; `todo` returns nothing. `results.jsonl` has 2169 rows (slice 1: 661,
2026-11-15; slice 2: 681 and slice 3: 674, 2026-11-16; 20 image-only scans
after OCR; slice 4: the last 133 plus 15 re-read after OCR, 2026-11-16). The
45 rows whose ids were removed from the catalogue stay so `todo` does not list
them again; the site file skips them. Live rows carry 6655 accepted library
tags and 158 accepted new tags.

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

Founder's decision 2026-11-16: the 38 off-topic documents read so far were
removed from the catalogue and moved to the Drive trash (36 from the Covid-19
folder, P1658 contraceptive-implant leaflet, P1677 industrial MACOR brochure).
Kept on purpose: P0184 and P0268 (soft-tissue graft materials, borderline) and
every «unusable» item whose only problem is unreadable text (OCR later).
Rows stay in results.jsonl so `todo` does not list them again; the site file
skips ids that are no longer in the catalogue.

## Every new paper

A paper that enters the catalogue after the bulk run is enriched on its way in, by the
same instructions and gates: module 06 Part 2 step 9 (direct publication and the
paper-only path) and publish-queue step 2 (the row is frozen in the queue item as
`04-منبع/انریچ.json` and installed by `tools/queue_apply.py` under the new catalogue id).
`python3 tools/cabinet_enrich.py coverage --check` runs in CI and fails while any
catalogue paper has no row.

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

Slice 3 (2026-11-16): 13 study types corrected, 45 empty key_finding /
clinical_bottom_line and a few year / doi / authors / journal filled. Removed
from the catalogue and moved to the Drive trash (founder's standing rule):
P2402 (automotive surface finish), P2675 (nuclear zirconium hydrides), P2690
(zirconia microspheres for photonics), P2612 (a stray last page of another
article). Kept as borderline: P2750 (only carrier of tetragonal-zirconia for
the site's zirconia-phase topic), P1828 (orthopaedic strain theory), P2093 and
P2094 (lithium disilicate glass theses), P2658 (part 1 of a Persian zirconia
series). Text not readable without OCR: P2136, P2562, P2712, P2716, P2771
(garbled extraction) and the Persian zirconia series P2661-P2667.

OCR (2026-11-16): the 20 image-only scans were read after OCR. `prepare`
uses an existing `<work>/<id>.pdf` instead of downloading, so: download the
PDF, run `ocrmypdf --force-ocr -l eng` (add `--rotate-pages` for rotated
pages, as P1690 needed) into `<work>/<id>.pdf`, then `prepare` and the
workflow as usual. Tesseract and ocrmypdf are not installed by default
(`apt-get install tesseract-ocr`, `pip install ocrmypdf`). Two study types
corrected (P0321 case report, P1485 narrative review). P2440 (TISSEEL SmPC,
judged off-topic) kept: the founder's own Tisseel folder. Still garbled text
(not image scans, OCR would help): P0360, P2136, P2562, P2712, P2716, P2771,
P2661-P2667.

Slice 4, the last one (2026-11-16): the 127 unread papers and the 6 PDFs Drive
would not serve. Those six are encrypted PDFs: Drive answers with its
«can't scan this file for viruses» page instead of the file. The form on that
page (`drive.usercontent.google.com/download` with `confirm=t`) returns the PDF;
`pikepdf` (installed with ocrmypdf) saves a decrypted copy as `<work>/<id>.pdf`
and `prepare` reads it as usual. 391 of 492 gated tags accepted across the 148
papers of this slice (one new tag: ceria-stabilized-zirconia). Catalogue:
P2898 -> technique report (IAAD working instructions, no experiment); P2940
stays a systematic review (the judge suggested narrative review, but the text
reports a PRISMA database search); 26 empty key_finding / clinical_bottom_line
filled, plus P2848 journal, P2896 year, P2661 and P2663 author (P2798's
proposed key finding described the extraction, not the document, so it was not
used). No document removed: the off-topic ones (P2889 LLM diagnostic-reasoning
trial, P2925 tirzepatide obesity trial, P2939 gynaecological local-anaesthesia
trial) and the «unusable» P2938 (trigeminal-neuralgia guideline, only its front
matter extracted) all have linked episodes. Kept as borderline: P2829 (Persian
consent form for emergency dental treatment during the pandemic, dental but no
research content), the VITA and Champions manufacturer documents (dental
products the founder filed on purpose).

OCR, second round (2026-11-16): P0360, P1058, P1414, P2136, P2562, P2712,
P2716, P2771 and the Persian series P2661-P2667 were OCR'd and read again; their
rows were replaced and all now read as good or partial text. Persian needs
`tesseract-ocr-fas` and `-l fas+eng`, and one more step: the text layer
ocrmypdf writes for Persian comes out in reversed character order when pdftotext
or pdfplumber read it back, so for Persian take `ocrmypdf --sidecar <file>.txt`
(tesseract's logical-order text) and put that through `cabinet_enrich`'s
`reading_text` / `references_dois` in place of the PDF text.

Still only partly readable (all dental, all kept; OCR would not help the
front-matter-only ones, whose content is in images or missing from the file):
garbled text P0111, P0112, P0202, P0309, P0873, P0948, P1555, P1652, P1698,
P1752, P2829; front matter only P0270, P0420, P0736, P0785, P0869, P0959,
P1064, P1392, P1478, P1533, P2798, P2938.
