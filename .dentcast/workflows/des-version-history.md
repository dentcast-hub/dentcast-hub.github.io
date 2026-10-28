# DES spec version history (moved from module 08)

This file holds, verbatim, the version-by-version notes that module 08
(`.dentcast/workflows/modules/08-des-fidelity.md`, Part 2) used to carry. They
were moved here so a publish does not re-read them every time (founder
1405/08/06). The binding rules they imply are restated in module 08 between the
`des-version-history:v1` markers. Read this file when you validate, re-score or
compare a record stamped below the current spec version.

<!-- des-version-history-text:v1 -->
**v3.5 is the current spec, and its change from 3.4 is the FIDELITY pipeline
only** (appendix rules 10, 12–14; founder 1405/08/04). The model instruction, every
verdict rule, F4 and the bands are 3.4's word for word, so no score and no verdict
moves; what changes is which sentences reach a call. `sharehub/share-42` is why:
the prose names its three sources in Persian («اوکیسون», «کونتی»), the tool's
markers were Latin only, two sources share an author, and the founder had to
hand-build the plan — while twenty-five sentences that named no source reached no
call at all. Four rules close that: (1) a page may **declare Persian markers** and,
for sources that share a name, **disambiguators** (the year always is one) in
`.dentcast/des-source-markers.json`; (2) a **recorded plan**
(`.dentcast/des-fidelity-plans/<content_id>.json`) — a founder decision or an
orphan-sweep receipt — replaces the computed assignment, and Phase F reads the same
file; (3) the **orphan sweep** (Part 2c step 5): every body sentence no call judged,
or every call left silent, is read by the stronger reviewer against **every**
source; the reviewer only finds, never judges — a found sentence joins that
source's plan and is judged by the ordinary two checker runs, and a sentence found
nowhere is listed to the founder; (4) a plan that grows, or a source text that
grows (a longer excerpt), re-checks only what it must instead of the whole step.
Records below 3.5 keep their assignment: the tool reads the sidecar and the plan
only when a source record is stamped 3.5 or later.

**v3.3's change from 3.2 is one FIDELITY rule** (F0, F2,
F6, appendix rule 8; founder 1405/07/20): a `SECONDARY_REPORT` source — a consensus
statement or a guideline, read whole — is a **complete text** for the FIDELITY
question. Its silence is `NOT_IN_SOURCE` (never `NOT_ASSESSABLE`), the F2-v grains
apply, and the result is **not provisional**. The basis belongs to the SOURCE
question, where it still caps the multiplier and marks the score provisional;
fidelity only asks whether the page says what the document says and nothing changed
on the way into Persian, and how strong the source is never enters that call.
`sharehub/share-33` is why: written from a national consensus statement, every claim
checked against its full text, and still «مقدماتی» only because the consensus is a
secondary report. Silence has been outside the denominator since v2.8, so no score
moves; records below 3.3 stay valid under their own stamp
(`tools/des_fidelity_units.py --merge` and `tools/verify_publish.py` are
version-gated).

**v3.2's change from 3.1 is one assignment rule** (F6,
founder 1405/07/20): on a page that names SOME of its sources, the units that
name none of them go to the cited source(s) no unit names — `sharehub/share-10`
names its glossary and textbooks in two sentences and writes the other
twenty-nine from a paper it never names, and under v3.1 that paper received
nothing. `tools/des_fidelity_units.py` applies it; markers are read from every
cited source, so a sentence naming a `CITATION_ONLY` book still reaches no call;
several unnamed sources are not pooled yet (the tool says so). No stored record
moves.

**v3.1's change from 3.0 cuts the FIDELITY track loose
from the score** (founder, 1405/07/19). A source recorded `NOT_APPRAISABLE` used
to get no FIDELITY call by rule, although nothing in the track reads a band: «how
strong is the source?» and «did we say what it says?» are two questions. Now
`source_kind` is `book`, `glossary` or `standard` (closed; a guideline stays on
`SECONDARY_REPORT`); a NOT_APPRAISABLE record states what text was in hand through
its own `text_basis` list — `FULL_TEXT`, `EXCERPT` (new) or `CITATION_ONLY` (new;
a reference line alone is admissible for this one content type); the FIDELITY call
runs on the same text under the same basis, with `EXCERPT`'s silence
`NOT_ASSESSABLE` and its result provisional; and a fidelity slot on such a source
holds the F5 object, or the spec's `INSUFFICIENT_TEXT` error object when the text
was not in hand, or `null` only when no call was owed. No SOURCE score moves and
no verdict changes; every 2.8–3.0 record stays valid under its own stamp, and
`sharehub/share-14`'s 1.9 book record gets a fidelity slot only by a re-run.

**v3.0's change from 2.9 is one FIDELITY rule:**
a study-scope formula (*under the conditions of this study*, *within the
limitations of this study* …) is not a hedge, so a claim that leaves it out is
not «قاطع‌تر از منبع» — every finding belongs to its study, the page cites the
study and the DES card grades it (founder, 1405/07/17). Real hedges (*may*,
*suggests*, *appears to* …) still count. No SOURCE score moves; a 2.9 record
stays valid under its own stamp.

**v2.9's change from 2.8 is four FIDELITY verdict
rules, plus the way the FIDELITY call is run (Part 2c).** No SOURCE score
moves. A ranking («قوی‌ترین», «مطمئن‌ترین», «بیشتر از») is one claim wherever
it appears; a relation between sources («تنها مطالعه‌ای که…», «هم X و هم
بقیه…», «تعارض ندارند») is silence in a one-source call; one governing
sentence decides the verdict, the `change_kind` and the quote, and a faithful
sentence must carry the claim's modifiers too; and an absolute word the source
does not use («فقط», «همیشه», «هرگز», «همه‌ی»…) is `HEDGE_REMOVED`, never
silence (founder, 1405/07/17). `sharehub/share-18` is why: two v2.8 runs over
the same five full texts agreed on 57 of 61 units, and three Sonnet rounds
under the v2.9 drafts took one source from 16/19 to 18/19 identical units with
the flagged sentences identical from round 2 on. A 2.8 record is re-run, never
re-labelled.

**v2.8's change from 2.7 is the FIDELITY arithmetic
only: F4 scores the claims the source ADDRESSES** (`MATCHES` + `ALTERED` +
`REVERSED`). A sentence the source is silent about (`NOT_IN_SOURCE`) is counted
and shown, never scored — under a full text it is almost always the author's own
background knowledge or clinical reasoning, and scoring it zero took
`sharehub/share-23` from 98 to 91 for explaining. No verdict changes and no
SOURCE score moves; a 2.7 record is re-scored by recomputing F4 from its stored
verdicts and re-stamped 2.8 (no model call). The card's headline is the
firmer/wider/reversed claims themselves, not the percentage (appendix rule 5).

**v2.7's change from 2.6 is that the FIDELITY call
reads the SAME text the SOURCE call scored, on the same basis** — a page written
from a full text is judged against the full text, never its abstract; the tool
refuses a mismatch (spec F0, appendix rule 11). Under `FULL_TEXT` the most
specific sentence governs (F2-v), and a sentence naming two conditions together
(«saliva or blood») is a general finding, not a statement about either (F2-iv
item 4). `sharehub/share-23` is why: judged against its abstracts, three of its
stage-by-stage blood claims read as `REVERSED`; the full texts support them. No
SOURCE score moves.

**v2.6's change from 2.5 is the FIDELITY track made
to work on DentCast's own prose and on pages that cite several sources** — F1/F2
rules for an author who explains rather than reports, F2-iii (instructions),
F2-iv (claims that tell conditions apart), F6 (several sources, `POOLED` when
none is named), and `tools/des_fidelity_units.py`, which is the caller's split
and assignment as code. No SOURCE score moves.

**v2.5's change from 2.4 was a SECOND call: the
FIDELITY track.** No SOURCE score moves — Steps 0-5 and the COMMENTARY track
are untouched except for a `mode` field whose absence means `SOURCE`. The new
call takes the page's own text and the source it cites and answers one
question: does each claim the page attributes to the source appear in the
source, unchanged in direction, hedge and scope? It is run **after** the SOURCE
call for that source, per source, and is described in **Part 2b** below. Its
release precision test is recorded in the spec's own Versioning entry (41
independent runs, three inputs, every verdict and score identical from the
second round on).

**v2.2's change from 2.1 is `text_basis:
SECONDARY_REPORT` (Step 0 + Step 1).** A document that reports work published
elsewhere — a consensus statement, a guideline, a conference synthesis — rates
silence about a method as `NR` rather than `high`, and caps the multiplier at
0.75, exactly as `ABSTRACT_ONLY` does: an abstract condenses by length, a
secondary report condenses by role, and in neither is a missing method evidence
that the study skipped it. It is the **fallback**, not the default — Question
4.8's chain rule scores the primary studies wherever they are retrievable, and
this basis is for the wrapper you could not get past. Only records scored
`FULL_TEXT` against a secondary report move under this bump; the four
consensus/guideline sources already on record were all `ABSTRACT_ONLY` and are
arithmetically unchanged.

**v2.1's change from 2.0 is that the AMSTAR-2
excluded-studies domain has THREE outcomes instead of two (Step 3b-iii).** A
review that published no per-study list of excluded full-text studies is now
`some_concerns` rather than `high` **when it reported both** a screening account
with counts (a PRISMA flow diagram, or records screened → full texts assessed →
included) **and** explicit inclusion/exclusion criteria; a review that documented
neither, or only one of the two, is still `high`, and that `high` still counts
toward AMSTAR-2 *critically low*. The reason is that the old rule failed **9 of
the 9** full-text reviews on record — a domain nothing can pass carries no
information, and it was rating a PROSPERO-registered five-database review with a
PRISMA flow identically to a narrative review with no Methods section at all.
Under `ABSTRACT_ONLY` nothing changes: silence there stays `NR`. Two scores moved
when this landed, both systematic reviews cited by `sharehub/share-9`, from 55/C
to 80/A; everything else on record is arithmetically identical.

**v2.0 remains in force for everything else, and its change from 1.x is that a transparency
penalty is a SHARE of the design anchor, not a flat deduction (Step 4a).** The
table's numbers are now `base_points`, and what gets subtracted is
`max(1, round_half_up(base_points × S_design ÷ 100))`. Every penalty object
therefore carries **both** `base_points` (the row's table weight, always 8/5/5/3)
and `points` (what was actually subtracted); Phase F recomputes the scaling from
the pair and fails a mismatch, so writing the old flat value is caught rather
than shipped. The reason is that `S_design` ceilings differ by almost seven times:
a flat −8 was 8% of an SR's achievable range and 53% of a narrative review's, and
below a certain anchor it exceeded the whole range, so weak-design papers piled
up on a floored 0 and stopped being distinguishable. **Version-gated:** records
stamped `1.x` keep validating against the flat table they were written under —
only `2.0` and later are checked for scaling. Across the 47 RESEARCH sources on
record only 5 carried a penalty at all and **no band moved**, so a page's
reader-facing band is unaffected either way.
<!-- /des-version-history-text:v1 -->
