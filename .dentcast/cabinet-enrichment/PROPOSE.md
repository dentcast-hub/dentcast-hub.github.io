# Reading a cabinet paper: what to write down

You read dental research papers (prosthodontics, implantology, periodontology, restorative) for a clinician's library, once, and write down facts about each paper so it never has to be read again. The paper's text is in `paper_<id>.json` (`text`: front page, abstract, methods, results, conclusion, funding — or the whole text minus references when `text_mode` is "whole-minus-refs"; extraction can be imperfect). The library's existing tags are in `vocabulary.txt` (tag<TAB>count), old spellings in `aliases.json`. Read the vocabulary fully before tagging, and grep it for candidate terms.

Write `proposal_<id>.json` for each paper, exactly this shape (use null / [] / "" when the text does not say; never infer):

```json
{
  "id": "P0000",
  "doc_class": "primary_research | systematic_review | narrative_review | guideline_consensus | technique_or_case | manufacturer_or_commercial | educational_or_book | unusable",
  "text_quality": "good | partial | garbled | front_matter_only",
  "ft_tags": [ {"tag": "<exists in vocabulary.txt>", "section": "abstract|methods|results|conclusion|other", "evidence": "<verbatim, <= 20 words>"} ],
  "new_tag_candidates": [ {"tag": "<kebab-case, 1-3 English words>", "why": "<one sentence>", "evidence": "<verbatim>"} ],
  "facts": {
    "doi":          {"value": "10.xxxx/…", "evidence": "<verbatim>"},
    "authors":      {"value": ["First Last", "…"], "evidence": "<verbatim author line>"},
    "year":         {"value": 2021, "evidence": "<verbatim>"},
    "journal":      {"value": "…", "evidence": "<verbatim>"},
    "population":   {"value": "<who/what was studied: patients, teeth, implants, specimens, animals>", "evidence": "<verbatim>"},
    "intervention": {"value": "<what was done or tested>", "evidence": "<verbatim>"},
    "comparison":   {"value": "<the comparator, or null when none>", "evidence": "<verbatim>"},
    "outcomes":     ["<what was measured, short>"],
    "main_result":  {"value": "<the main finding with its numbers, one sentence>", "evidence": "<verbatim, may be longer, <= 40 words>"},
    "sample_size":  {"value": "<e.g. 48 implants in 24 patients>", "evidence": "<verbatim>"},
    "follow_up":    {"value": "<e.g. 5 years>", "evidence": "<verbatim>"},
    "materials_brands": [ {"value": "<specific product/material actually used or studied, e.g. IPS e.max CAD, Bio-Oss>", "evidence": "<verbatim>"} ],
    "funding_coi":  {"value": "<who funded it / declared conflicts, short>", "evidence": "<verbatim>"},
    "limitations":  {"value": "<limitations the authors themselves state, one sentence>", "evidence": "<verbatim>"},
    "key_finding":  "<ONLY when paper_<id>.json has has_key_finding=false: one or two plain sentences on what the paper found>",
    "clinical_bottom_line": "<ONLY when has_key_finding=false: one sentence on what it means for practice>"
  },
  "notes": "<optional one sentence>"
}
```

## Tags: the rules that matter most

1. Tag what the paper is ABOUT: what it studied, compared, measured, used as its material/protocol, or concluded on. A feature that was the same for every patient or specimen still counts when it defines what was studied (all implants early-loaded → `early-loading`; all crowns monolithic zirconia → the zirconia tag). Never tag what is only mentioned in passing: introduction background, discussion of other studies, a single aside.
2. ft_tags are ADDITIONS: never repeat a tag in `current_tags` (after alias mapping). 0 to 8; 0 is a fine answer.
3. Every ft_tag must exist verbatim in vocabulary.txt. Prefer the specific tag over the umbrella one.
4. Never propose: radiographic-analysis, mandible, posterior-region, multicenter-study, or a design tag that repeats `catalog_type` (e.g. randomized-controlled-trial on a paper catalogued as an RCT).
5. new_tag_candidates only for a central concept with no vocabulary tag; at most 2; usually 0.

## Evidence

Every `evidence` is copied verbatim from the text (a script checks it; an evidence that is not found deletes that tag or fact). Short is better. For `doi`, `authors`, `year`, `journal`, quote the front page.

## doc_class

- primary_research: original clinical, in-vitro, animal or FEA study.
- systematic_review: has a systematic search (with or without meta-analysis).
- narrative_review, guideline_consensus, technique_or_case (technique report, case report, case series).
- manufacturer_or_commercial: brochure, product protocol, catalogue, advertorial.
- educational_or_book: textbook chapter, lecture notes, magazine feature, journal issue front matter.
- unusable: only a cover / table of contents, unreadable text, or advertising with no clinical content.

Do not create any other files and do not modify inputs. When done, reply with one line per paper: id, doc_class, number of ft_tags, anything odd.
